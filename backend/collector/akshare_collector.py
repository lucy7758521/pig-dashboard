"""AKShare 真实数据采集器

数据来源优先级: AKShare > 网页爬虫 > 模拟数据 fallback
所有方法均内置 try/except，失败返回 None/空列表，不抛异常。
"""
import logging
from datetime import date, datetime, timedelta
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

# ── 省份名称归一化：搜猪网返回的名称 → 标准名称 ──
PROVINCE_NORMALIZE = {
    "北京": "北京", "北京市": "北京",
    "天津": "天津", "天津市": "天津",
    "河北": "河北", "河北省": "河北",
    "山西": "山西", "山西省": "山西",
    "内蒙古": "内蒙古", "内蒙古自治区": "内蒙古",
    "辽宁": "辽宁", "辽宁省": "辽宁",
    "吉林": "吉林", "吉林省": "吉林",
    "黑龙江": "黑龙江", "黑龙江省": "黑龙江",
    "上海": "上海", "上海市": "上海",
    "江苏": "江苏", "江苏省": "江苏",
    "浙江": "浙江", "浙江省": "浙江",
    "安徽": "安徽", "安徽省": "安徽",
    "福建": "福建", "福建省": "福建",
    "江西": "江西", "江西省": "江西",
    "山东": "山东", "山东省": "山东",
    "河南": "河南", "河南省": "河南",
    "湖北": "湖北", "湖北省": "湖北",
    "湖南": "湖南", "湖南省": "湖南",
    "广东": "广东", "广东省": "广东",
    "广西": "广西", "广西壮族自治区": "广西",
    "海南": "海南", "海南省": "海南",
    "重庆": "重庆", "重庆市": "重庆",
    "四川": "四川", "四川省": "四川",
    "贵州": "贵州", "贵州省": "贵州",
    "云南": "云南", "云南省": "云南",
    "西藏": "西藏", "西藏自治区": "西藏",
    "陕西": "陕西", "陕西省": "陕西",
    "甘肃": "甘肃", "甘肃省": "甘肃",
    "青海": "青海", "青海省": "青海",
    "宁夏": "宁夏", "宁夏回族自治区": "宁夏",
    "新疆": "新疆", "新疆维吾尔自治区": "新疆",
}


def collect_province_prices() -> Optional[list[dict]]:
    """
    从搜猪网采集各省生猪价格（元/斤 → 转元/公斤）
    返回格式: [{"province": "广东", "price_kg": 19.0, "price_yuan": 9.5, "change": "+0.1"}, ...]
    """
    try:
        import akshare as ak
        df: pd.DataFrame = ak.spot_hog_soozhu()
        if df is None or df.empty:
            logger.warning("spot_hog_soozhu() 返回空数据")
            return None

        today = date.today()
        results = []
        for _, row in df.iterrows():
            raw_name = str(row.get("省份", "")).strip()
            province = PROVINCE_NORMALIZE.get(raw_name, raw_name)
            price_jin = float(row.get("价格", 0))  # 元/斤
            change_str = str(row.get("涨跌幅", "0")).strip()
            try:
                change = float(change_str)
            except ValueError:
                change = 0.0

            results.append({
                "record_date": today,
                "category": "外三元",
                "province": province,
                "price_kg": round(price_jin, 2),   # 搜猪网返回的就是元/公斤
                "price_yuan": round(price_jin / 2, 2),
                "rank": 0,  # 后面排序填充
                "source": "soozhu",
                "change": change,
            })

        # 按价格降序排序，填充排名
        results.sort(key=lambda x: x["price_kg"], reverse=True)
        for i, r in enumerate(results, 1):
            r["rank"] = i

        logger.info(f"成功采集省份价格: {len(results)} 条 (来源: soozhu)")
        return results
    except Exception as e:
        logger.error(f"采集省份价格失败: {e}")
        return None


def collect_price_history(category: str = "外三元", days: int = 365) -> Optional[list[dict]]:
    """
    从 AKShare futures_hog_core 获取历史价格走势
    返回格式: [{"record_date": date, "category": "外三元", "avg_price": 14.71}, ...]
    """
    try:
        import akshare as ak
        df: pd.DataFrame = ak.futures_hog_core(symbol=category)
        if df is None or df.empty:
            logger.warning(f"futures_hog_core({category}) 返回空数据")
            return None

        results = []
        for _, row in df.iterrows():
            try:
                d = row.get("date")
                if isinstance(d, str):
                    d = datetime.strptime(d, "%Y-%m-%d").date()
                elif isinstance(d, pd.Timestamp):
                    d = d.date()
                elif isinstance(d, datetime):
                    d = d.date()
                elif isinstance(d, date):
                    pass
                else:
                    continue

                val = float(row.get("value", 0))
                results.append({
                    "record_date": d,
                    "category": category,
                    "avg_price": round(val, 2),
                    "source": "akshare",
                })
            except (ValueError, TypeError):
                continue

        # 只保留最近 N 天
        cutoff = date.today() - timedelta(days=days + 5)
        results = [r for r in results if r["record_date"] >= cutoff]
        results.sort(key=lambda x: x["record_date"])

        logger.info(f"成功采集 {category} 历史走势: {len(results)} 条 (来源: akshare)")
        return results
    except Exception as e:
        logger.error(f"采集 {category} 历史走势失败: {e}")
        return None


def collect_lean_pork_trend() -> Optional[list[dict]]:
    """
    从搜猪网采集瘦肉型猪价走势（全国均价）
    返回格式: [{"record_date": date, "category": "瘦肉型", "avg_price": 9.89}, ...]
    """
    try:
        import akshare as ak
        df: pd.DataFrame = ak.spot_hog_lean_price_soozhu()
        if df is None or df.empty:
            logger.warning("spot_hog_lean_price_soozhu() 返回空数据")
            return None

        results = []
        for _, row in df.iterrows():
            try:
                d = row.get("日期")
                if isinstance(d, str):
                    d = datetime.strptime(d, "%Y-%m-%d").date()
                elif isinstance(d, pd.Timestamp):
                    d = d.date()
                else:
                    continue

                val = float(row.get("价格", 0))
                results.append({
                    "record_date": d,
                    "category": "瘦肉型",
                    "avg_price": round(val, 2),
                    "source": "soozhu",
                })
            except (ValueError, TypeError):
                continue

        results.sort(key=lambda x: x["record_date"])
        logger.info(f"成功采集瘦肉型猪价走势: {len(results)} 条")
        return results
    except Exception as e:
        logger.error(f"采集瘦肉型走势失败: {e}")
        return None


def collect_corn_price() -> Optional[list[dict]]:
    """从搜猪网采集玉米价格走势"""
    try:
        import akshare as ak
        df: pd.DataFrame = ak.spot_corn_price_soozhu()
        if df is None or df.empty:
            return None

        results = _parse_soozhu_trend(df, "玉米")
        logger.info(f"成功采集玉米价格: {len(results)} 条")
        return results
    except Exception as e:
        logger.error(f"采集玉米价格失败: {e}")
        return None


def collect_soybean_price() -> Optional[list[dict]]:
    """从搜猪网采集大豆价格走势"""
    try:
        import akshare as ak
        df: pd.DataFrame = ak.spot_soybean_price_soozhu()
        if df is None or df.empty:
            return None

        results = _parse_soozhu_trend(df, "大豆")
        logger.info(f"成功采集大豆价格: {len(results)} 条")
        return results
    except Exception as e:
        logger.error(f"采集大豆价格失败: {e}")
        return None


def collect_feed_price() -> Optional[list[dict]]:
    """从搜猪网采集混合饲料价格走势"""
    try:
        import akshare as ak
        df: pd.DataFrame = ak.spot_mixed_feed_soozhu()
        if df is None or df.empty:
            return None

        results = _parse_soozhu_trend(df, "饲料")
        logger.info(f"成功采集饲料价格: {len(results)} 条")
        return results
    except Exception as e:
        logger.error(f"采集饲料价格失败: {e}")
        return None


def collect_hog_cost() -> Optional[list[dict]]:
    """从 AKShare 采集生猪养殖成本"""
    try:
        import akshare as ak
        df: pd.DataFrame = ak.futures_hog_cost()
        if df is None or df.empty:
            return None

        results = _parse_akshare_trend(df, "养殖成本")
        logger.info(f"成功采集养殖成本: {len(results)} 条")
        return results
    except Exception as e:
        logger.error(f"采集养殖成本失败: {e}")
        return None


def collect_price_index() -> Optional[list[dict]]:
    """从 AKShare 采集生猪价格指数"""
    try:
        import akshare as ak
        df: pd.DataFrame = ak.index_hog_spot_price()
        if df is None or df.empty:
            return None

        results = []
        for _, row in df.iterrows():
            try:
                d = row.get("日期")
                if isinstance(d, str):
                    d = datetime.strptime(d, "%Y-%m-%d").date()
                elif isinstance(d, pd.Timestamp):
                    d = d.date()
                else:
                    continue

                results.append({
                    "record_date": d,
                    "index_val": float(row.get("指数", 0)),
                    "presale_avg": float(row.get("预售均价", 0)),
                    "deal_avg": float(row.get("成交均价", 0)),
                    "deal_weight": float(row.get("成交均重", 0)),
                    "source": "akshare",
                })
            except (ValueError, TypeError):
                continue

        results.sort(key=lambda x: x["record_date"])
        logger.info(f"成功采集价格指数: {len(results)} 条")
        return results
    except Exception as e:
        logger.error(f"采集价格指数失败: {e}")
        return None


def collect_all_prices() -> dict:
    """一次性采集所有价格数据，返回汇总字典"""
    result = {
        "province_prices": collect_province_prices(),
        "price_history_wai": collect_price_history("外三元"),
        "price_history_nei": collect_price_history("内三元"),
        "price_history_tu": collect_price_history("土杂猪"),
        "lean_pork_trend": collect_lean_pork_trend(),
        "corn_price": collect_corn_price(),
        "soybean_price": collect_soybean_price(),
        "feed_price": collect_feed_price(),
        "hog_cost": collect_hog_cost(),
        "price_index": collect_price_index(),
        "collected_at": datetime.now().isoformat(),
    }
    return result


# ── 内部工具函数 ──

def _parse_soozhu_trend(df: pd.DataFrame, category: str) -> list[dict]:
    """解析搜猪网走势数据（列: ['日期', '价格']）"""
    results = []
    for _, row in df.iterrows():
        try:
            d = row.get("日期")
            # 尝试多种日期格式
            if isinstance(d, str):
                d = datetime.strptime(d, "%Y-%m-%d").date()
            elif isinstance(d, pd.Timestamp):
                d = d.date()
            elif isinstance(d, datetime):
                d = d.date()
            elif isinstance(d, date):
                pass  # 已经是 date
            else:
                continue

            val = float(row.get("价格", 0))
            results.append({
                "record_date": d,
                "category": category,
                "avg_price": round(val, 2),
                "source": "soozhu",
            })
        except (ValueError, TypeError) as e:
            logger.debug(f"解析搜猪网行失败: {e}")
            continue
    results.sort(key=lambda x: x["record_date"])
    return results


def _parse_akshare_trend(df: pd.DataFrame, category: str) -> list[dict]:
    """解析 AKShare 走势数据（列: ['date', 'value']）"""
    results = []
    for _, row in df.iterrows():
        try:
            d = row.get("date")
            if isinstance(d, str):
                d = datetime.strptime(d, "%Y-%m-%d").date()
            elif isinstance(d, pd.Timestamp):
                d = d.date()
            elif isinstance(d, datetime):
                d = d.date()
            elif isinstance(d, date):
                pass
            else:
                continue

            val = float(row.get("value", 0))
            results.append({
                "record_date": d,
                "category": category,
                "avg_price": round(val, 2),
                "source": "akshare",
            })
        except (ValueError, TypeError) as e:
            logger.debug(f"解析AKShare行失败: {e}")
            continue
    results.sort(key=lambda x: x["record_date"])
    return results
