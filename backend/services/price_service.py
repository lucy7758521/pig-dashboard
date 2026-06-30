"""价格数据服务层 - 真实数据优先，模拟数据 fallback

数据源优先级:
  1. 数据库已有数据 (source != 'mock_fallback')
  2. AKShare 实时采集 (akshare_collector)
  3. 模拟数据 fallback (mock_data)
"""
import logging
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from models.pig_price import PigPrice, PriceHistory
from collector.akshare_collector import (
    collect_province_prices,
    collect_price_history,
    collect_corn_price,
    collect_soybean_price,
    collect_feed_price,
)
from collector.mock_data import generate_mock_prices, generate_mock_history
from config import CATEGORIES, CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)

_cache: dict = {}
_cache_time: dict = {}

# 前端友好的来源名称
SOURCE_DISPLAY = {
    "soozhu": "搜猪网",
    "akshare": "AKShare",
    "mock": "模拟数据",
    "mock_fallback": "模拟数据(降级)",
}


def _cache_get(key: str):
    if key in _cache and key in _cache_time:
        if (datetime.now() - _cache_time[key]).seconds < CACHE_TTL_SECONDS:
            return _cache[key]
    return None


def _cache_set(key: str, value):
    _cache[key] = value
    _cache_time[key] = datetime.now()


def _store_province_prices(db: Session, data: list[dict]):
    """将省份价格数据存入数据库（有则更新）"""
    for item in data:
        existing = (
            db.query(PigPrice)
            .filter(
                PigPrice.record_date == item["record_date"],
                PigPrice.category == item["category"],
                PigPrice.province == item["province"],
            )
            .first()
        )
        if existing:
            existing.price_kg = item["price_kg"]
            existing.price_yuan = item["price_yuan"]
            existing.rank = item["rank"]
            existing.change = item.get("change", existing.change or 0)
            existing.source = item.get("source", existing.source)
        else:
            # PigPrice 不接受多余字段，所以过滤
            allowed = {"record_date", "category", "province", "price_yuan",
                       "price_kg", "rank", "change", "source"}
            cleaned = {k: v for k, v in item.items() if k in allowed}
            db.add(PigPrice(**cleaned))
    db.commit()


def _store_price_history(db: Session, data: list[dict]):
    """将历史走势存入数据库"""
    for item in data:
        existing = (
            db.query(PriceHistory)
            .filter(
                PriceHistory.record_date == item["record_date"],
                PriceHistory.category == item["category"],
            )
            .first()
        )
        if existing:
            existing.avg_price = item["avg_price"]
            existing.source = item.get("source", existing.source)
        else:
            db.add(PriceHistory(**item))
    db.commit()


def _row_to_dict(r: PigPrice) -> dict:
    """PigPrice ORM → 返回 dict"""
    return {
        "province": r.province,
        "category": r.category,
        "price_kg": r.price_kg,
        "price_yuan": r.price_yuan,
        "rank": r.rank,
        "record_date": str(r.record_date),
        "source": r.source,
        "source_display": SOURCE_DISPLAY.get(r.source, r.source),
        "change": r.change if r.change is not None else 0,
    }


def _item_to_dict(item: dict) -> dict:
    """采集器数据 → 返回 dict"""
    src = item.get("source", "akshare")
    return {
        "province": item["province"],
        "category": item["category"],
        "price_kg": item["price_kg"],
        "price_yuan": item["price_yuan"],
        "rank": item.get("rank", 0),
        "record_date": str(item.get("record_date", date.today())),
        "source": src,
        "source_display": SOURCE_DISPLAY.get(src, src),
        "change": item.get("change", 0),
    }


def _fetch_or_collect_province_prices(db: Session) -> list[dict]:
    """获取省份价格：DB → AKShare → mock"""
    today = date.today()

    # 1. 检查数据库
    existing = (
        db.query(PigPrice)
        .filter(PigPrice.record_date == today, PigPrice.source != "mock_fallback")
        .all()
    )
    if existing:
        logger.info(f"使用数据库中已有真实数据: {len(existing)} 条")
        return [_row_to_dict(r) for r in existing]

    # 2. AKShare 采集
    real_data = collect_province_prices()
    if real_data:
        _store_province_prices(db, real_data)
        logger.info(f"AKShare 采集成功，已存储 {len(real_data)} 条省份价格")
        return [_item_to_dict(r) for r in real_data]

    # 3. Fallback 模拟数据
    logger.warning("AKShare 采集失败，使用模拟数据")
    mock = generate_mock_prices("外三元", today)
    _store_province_prices(db, mock)
    return [_item_to_dict(r) for r in mock]


def get_current_prices(
    db: Session, category: str = None, province: str = None
) -> list[dict]:
    """获取当日价格排行。内三元/土杂猪无省份数据时，基于外三元推算。"""
    cache_key = f"current_prices_{category}_{province}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    all_prices = _fetch_or_collect_province_prices(db)

    # 内三元/土杂猪：搜猪网只提供全国均价走势，没有省份数据。
    # 用全国均价比例从外三元推算各省价格。
    if category and category != "外三元":
        all_prices = _derive_prices(all_prices, category)

    # 筛选
    if category:
        all_prices = [p for p in all_prices if p["category"] == category]
    if province:
        all_prices = [p for p in all_prices if p["province"] == province]

    _cache_set(cache_key, all_prices)
    return all_prices


def _derive_prices(wai_prices: list[dict], target: str) -> list[dict]:
    """基于外三元省份价格，按全国均价比例推算内三元/土杂猪各省价格"""
    try:
        from collector.akshare_collector import collect_price_history
        wai_history = collect_price_history("外三元", 1)
        target_history = collect_price_history(target, 1)

        if wai_history and target_history:
            wai_avg = wai_history[-1]["avg_price"]
            target_avg = target_history[-1]["avg_price"]
            ratio = target_avg / wai_avg if wai_avg > 0 else 1.0
        else:
            # 默认比例
            ratio = {"内三元": 1.016, "土杂猪": 0.967}.get(target, 1.0)

        derived = []
        for p in wai_prices:
            new_price = round(p["price_kg"] * ratio, 2)
            new_price_yuan = round(new_price / 2, 2)
            derived.append({
                **p,
                "category": target,
                "price_kg": new_price,
                "price_yuan": new_price_yuan,
                "source": "推算(基于外三元)",
                "source_display": "推算",
                "change": round((p.get("change", 0) or 0) * ratio, 2),
            })
        return derived
    except Exception as e:
        logger.warning(f"推算{target}价格失败: {e}")
        # 回退：直接标记
        return [{**p, "category": target, "source_display": "推算"} for p in wai_prices]


def get_price_statistics(db: Session, category: str = "外三元") -> dict:
    """获取价格统计信息"""
    cache_key = f"stats_{category}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    prices = get_current_prices(db, category=category)
    if not prices:
        return {}

    sorted_prices = sorted(prices, key=lambda x: x["price_kg"], reverse=True)
    avg_price = round(sum(p["price_kg"] for p in prices) / len(prices), 2)

    stats = {
        "category": category,
        "avg_price": avg_price,
        "max_price": sorted_prices[0]["price_kg"],
        "min_price": sorted_prices[-1]["price_kg"],
        "max_province": sorted_prices[0]["province"],
        "min_province": sorted_prices[-1]["province"],
        "update_time": datetime.now().isoformat(),
    }
    _cache_set(cache_key, stats)
    return stats


def get_price_history(db: Session, category: str = "外三元", days: int = 30) -> list[dict]:
    """获取历史价格走势"""
    cache_key = f"history_{category}_{days}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    start_date = date.today() - timedelta(days=days)

    # 1. 数据库
    results = (
        db.query(PriceHistory)
        .filter(
            PriceHistory.category == category,
            PriceHistory.record_date >= start_date,
        )
        .order_by(PriceHistory.record_date)
        .all()
    )

    if not results:
        # 2. AKShare 采集
        real_data = collect_price_history(category, days)
        if real_data:
            _store_price_history(db, real_data)
            results = (
                db.query(PriceHistory)
                .filter(
                    PriceHistory.category == category,
                    PriceHistory.record_date >= start_date,
                )
                .order_by(PriceHistory.record_date)
                .all()
            )

    if not results:
        # 3. Fallback
        logger.warning(f"无历史数据，使用模拟数据 (category={category})")
        mock = generate_mock_history(category, days)
        _store_price_history(db, mock)
        results = (
            db.query(PriceHistory)
            .filter(
                PriceHistory.category == category,
                PriceHistory.record_date >= start_date,
            )
            .order_by(PriceHistory.record_date)
            .all()
        )

    data = [
        {
            "record_date": str(r.record_date),
            "category": r.category,
            "avg_price": r.avg_price,
        }
        for r in results
    ]
    _cache_set(cache_key, data)
    return data


def get_map_data(db: Session, category: str = "外三元") -> list[dict]:
    """获取地图热力图数据（含涨跌）"""
    prices = get_current_prices(db, category=category)
    return [
        {
            "name": p["province"],
            "value": p["price_kg"],
            "change": p.get("change", 0),
        }
        for p in prices
    ]


def get_trend_data(db: Session, category: str = "外三元", days: int = 30) -> dict:
    """获取趋势图数据"""
    history = get_price_history(db, category=category, days=days)
    return {
        "category": category,
        "points": [
            {"date": h["record_date"], "price": h["avg_price"]} for h in history
        ],
    }


def get_feed_prices(db: Session) -> dict:
    """获取饲料价格（玉米+大豆+饲料），单位：元/公斤"""
    result = {}
    for name, collector in [
        ("玉米", collect_corn_price),
        ("大豆", collect_soybean_price),
        ("饲料", collect_feed_price),
    ]:
        data = collector()
        if data:
            _store_price_history(db, data)
            latest = data[-1] if data else {}
            result[name] = {
                "value": latest.get("avg_price", 0),
                "unit": "元/公斤",
                "update_date": str(latest.get("record_date", date.today())),
            }
    return result
