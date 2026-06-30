"""定时任务调度器 - 定时采集真实数据

所有任务内置 try/except，单个任务失败不影响其他任务。
"""
import logging
import threading
import time
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal
from collector.akshare_collector import (
    collect_province_prices,
    collect_price_history,
    collect_corn_price,
    collect_soybean_price,
    collect_feed_price,
    collect_hog_cost,
    collect_price_index,
)

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="Asia/Shanghai")

# 频率保护 - 防止对搜猪网/AKShare 请求过于频繁被封
_last_fetch_at = {}
_min_interval_seconds = 60  # 同类数据至少间隔60秒
_lock = threading.Lock()


def _should_fetch(key: str) -> bool:
    """检查是否应该发起请求（基于上次请求时间）"""
    with _lock:
        last = _last_fetch_at.get(key)
        if last and (time.time() - last) < _min_interval_seconds:
            logger.debug(f"跳过 {key} 采集，距离上次仅 {time.time() - last:.0f}秒")
            return False
        _last_fetch_at[key] = time.time()
        return True


def _store_province_prices():
    """存储省份价格到数据库（有则更新）"""
    if not _should_fetch("province_prices"):
        return
    from models.pig_price import PigPrice
    db = SessionLocal()
    try:
        data = collect_province_prices()
        if data:
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
                    existing.source = item.get("source", existing.source)
                else:
                    db.add(PigPrice(**item))
            db.commit()
            logger.info(f"定时任务: 省份价格已更新 ({len(data)} 条)")
    except Exception as e:
        logger.error(f"定时任务-省份价格失败: {e}")
        db.rollback()
    finally:
        db.close()


def _store_price_histories():
    """存储各品种历史走势（有则更新）"""
    if not _should_fetch("price_histories"):
        return
    from models.pig_price import PriceHistory
    db = SessionLocal()
    try:
        for category in ["外三元", "内三元", "土杂猪"]:
            data = collect_price_history(category, 365)
            if data:
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
                logger.info(f"定时任务: {category} 历史走势已更新 ({len(data)} 条)")
    except Exception as e:
        logger.error(f"定时任务-历史走势失败: {e}")
        db.rollback()
    finally:
        db.close()


def _store_feed_prices():
    """存储饲料价格（有则更新）"""
    if not _should_fetch("feed_prices"):
        return
    from models.pig_price import PriceHistory
    db = SessionLocal()
    try:
        for name, collector in [
            ("玉米", collect_corn_price),
            ("大豆", collect_soybean_price),
            ("饲料", collect_feed_price),
        ]:
            data = collector()
            if data:
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
                logger.info(f"定时任务: {name} 价格已更新 ({len(data)} 条)")
    except Exception as e:
        logger.error(f"定时任务-饲料价格失败: {e}")
        db.rollback()
    finally:
        db.close()


def _store_full_data():
    """全量数据采集（每天早上执行）"""
    logger.info("=== 开始全量数据采集 ===")
    _store_province_prices()
    _store_price_histories()
    _store_feed_prices()

    # 养殖成本
    db = SessionLocal()
    try:
        from models.pig_price import PriceHistory
        cost_data = collect_hog_cost()
        if cost_data:
            for item in cost_data:
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
            logger.info(f"定时任务: 养殖成本已更新 ({len(cost_data)} 条)")
    except Exception as e:
        logger.error(f"定时任务-养殖成本失败: {e}")
        db.rollback()
    finally:
        db.close()

    # 新闻采集
    _collect_news()

    # 政策采集
    _collect_policies()

    logger.info("=== 全量数据采集完成 ===")


def _collect_news():
    """采集新闻"""
    if not _should_fetch("news"):
        return
    from collector.news_scraper import collect_all_news, store_news_to_db
    db = SessionLocal()
    try:
        news = collect_all_news()
        if news:
            store_news_to_db(db, news)
    except Exception as e:
        logger.error(f"定时任务-新闻采集失败: {e}")
    finally:
        db.close()


def _collect_policies():
    """采集政策"""
    if not _should_fetch("policies"):
        return
    from collector.policy_scraper import collect_all_policies, store_policies_to_db
    db = SessionLocal()
    try:
        policies = collect_all_policies()
        if policies:
            store_policies_to_db(db, policies)
    except Exception as e:
        logger.error(f"定时任务-政策采集失败: {e}")
    finally:
        db.close()


def _collect_enterprises():
    """采集企业动态"""
    from collector.enterprise_scraper import collect_all_enterprise, store_enterprise_to_db
    db = SessionLocal()
    try:
        events = collect_all_enterprise()
        if events:
            store_enterprise_to_db(db, events)
    except Exception as e:
        logger.error(f"定时任务-企业采集失败: {e}")
    finally:
        db.close()


def init_scheduler():
    """初始化定时任务"""
    # 省份价格 - 每2分钟采集（前端展示用每分钟刷新，缓存保护后端不会真正请求源）
    scheduler.add_job(
        _store_province_prices,
        "interval",
        minutes=2,
        id="province_prices",
        replace_existing=True,
    )

    # 历史走势 - 每10分钟采集
    scheduler.add_job(
        _store_price_histories,
        "interval",
        minutes=10,
        id="price_histories",
        replace_existing=True,
    )

    # 饲料价格 - 每10分钟
    scheduler.add_job(
        _store_feed_prices,
        "interval",
        minutes=10,
        id="feed_prices",
        replace_existing=True,
    )

    # 每天上午9点全量采集（确保数据完整）
    scheduler.add_job(
        _store_full_data,
        "cron",
        hour=9,
        minute=0,
        id="full_collect",
        replace_existing=True,
    )

    # 新闻 - 每30分钟采集
    scheduler.add_job(
        _collect_news,
        "interval",
        minutes=30,
        id="news_collect",
        replace_existing=True,
    )
    # 政策 - 每1小时采集
    scheduler.add_job(
        _collect_policies,
        "interval",
        hours=1,
        id="policy_collect",
        replace_existing=True,
    )
    # 企业动态 - 每30分钟
    scheduler.add_job(
        _collect_enterprises,
        "interval",
        minutes=30,
        id="enterprise_collect",
        replace_existing=True,
    )

    # 启动时立即采集一次
    scheduler.add_job(
        _store_full_data,
        "date",
        id="init_collect",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("定时任务调度器已启动")

    # 立即触发初始化采集
    _store_province_prices()
    _store_price_histories()
    _store_feed_prices()


def shutdown_scheduler():
    """关闭调度器"""
    scheduler.shutdown(wait=False)
    logger.info("定时任务调度器已关闭")
