"""企业动态服务层 - 真实数据优先"""
import logging
from sqlalchemy.orm import Session

from models.enterprise import EnterpriseEvent
from collector.enterprise_scraper import (
    collect_all_enterprise,
    store_enterprise_to_db,
    scrape_stock_prices,
)
from collector.mock_data import generate_mock_enterprise_events

logger = logging.getLogger(__name__)


def get_enterprise_events(
    db: Session,
    enterprise_name: str = None,
    event_type: str = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """获取企业动态列表"""
    query = db.query(EnterpriseEvent)

    # 先尝试采集真实数据
    existing_count = query.count()
    if existing_count < 5:
        logger.info("企业数据不足，尝试采集真实数据...")
        try:
            real_events = collect_all_enterprise()
            if real_events:
                store_enterprise_to_db(db, real_events)
        except Exception as e:
            logger.error(f"企业采集失败: {e}")

    # 再次查询
    existing_count = query.count()
    if existing_count == 0:
        logger.info("无企业数据，使用模拟数据")
        mock = generate_mock_enterprise_events(20)
        for item in mock:
            db.add(EnterpriseEvent(**item))
        db.commit()

    if enterprise_name:
        query = query.filter(EnterpriseEvent.enterprise_name == enterprise_name)
    if event_type:
        query = query.filter(EnterpriseEvent.event_type == event_type)

    total = query.count()
    results = (
        query.order_by(EnterpriseEvent.event_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": r.id, "enterprise_name": r.enterprise_name,
            "stock_code": r.stock_code, "event_type": r.event_type,
            "title": r.title, "content": r.content,
            "source_url": r.source_url,
            "event_date": str(r.event_date) if r.event_date else None,
            "data_json": r.data_json,
        }
        for r in results
    ]

    return {
        "items": items, "total": total, "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_enterprise_stats(db: Session, enterprise_name: str) -> dict:
    events = get_enterprise_events(db, enterprise_name=enterprise_name, page=1, page_size=100)
    items = events["items"]
    event_types = {}
    for item in items:
        t = item["event_type"]
        event_types[t] = event_types.get(t, 0) + 1
    return {
        "enterprise_name": enterprise_name,
        "total_events": events["total"],
        "event_types": event_types,
        "latest_events": items[:5],
    }


def get_latest_enterprise_updates(db: Session, limit: int = 5) -> list[dict]:
    return get_enterprise_events(db, page=1, page_size=limit)["items"]


def get_stock_prices_real_time() -> list[dict]:
    """获取6家猪企实时股价（不存库，直接返回）"""
    try:
        return scrape_stock_prices()
    except Exception as e:
        logger.error(f"获取实时股价失败: {e}")
        return []
