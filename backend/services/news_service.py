"""新闻 + 政策数据服务层 - 真实数据优先，模拟数据 fallback"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from models.news import NewsArticle, PolicyEvent
from collector.mock_data import generate_mock_news
from collector.news_scraper import collect_all_news, store_news_to_db
from collector.policy_scraper import collect_all_policies, store_policies_to_db

logger = logging.getLogger(__name__)

# 内存缓存（简单方案）
_cache: dict = {}
_cache_time: dict = {}
CACHE_TTL = 300  # 5分钟


def _cache_get(key: str):
    if key in _cache and key in _cache_time:
        if (datetime.now() - _cache_time[key]).seconds < CACHE_TTL:
            return _cache[key]
    return None


def _cache_set(key: str, value):
    _cache[key] = value
    _cache_time[key] = datetime.now()


# ── 新闻 ──

def get_news_list(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    category: str = None,
) -> dict:
    """获取新闻列表 - 真实数据优先"""
    query = db.query(NewsArticle)

    # 先尝试爬取真实新闻
    existing_count = query.count()
    if existing_count < 10:
        logger.info("新闻数据不足，尝试采集真实新闻...")
        try:
            real_news = collect_all_news()
            if real_news:
                store_news_to_db(db, real_news)
        except Exception as e:
            logger.error(f"新闻采集失败: {e}")

    # 再次查询
    existing_count = query.count()
    if existing_count == 0:
        logger.info("无任何新闻数据，使用模拟数据")
        mock_news = generate_mock_news(50)
        for item in mock_news:
            existing = db.query(NewsArticle).filter(
                NewsArticle.source_url == item["source_url"]
            ).first()
            if not existing:
                db.add(NewsArticle(**item))
        db.commit()

    if category:
        query = query.filter(NewsArticle.category == category)

    total = query.count()
    results = (
        query.order_by(NewsArticle.publish_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": r.id,
            "title": r.title,
            "summary": r.summary,
            "source_name": r.source_name,
            "source_url": r.source_url,
            "category": r.category,
            "publish_date": r.publish_date.isoformat() if r.publish_date else None,
        }
        for r in results
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_news_detail(db: Session, news_id: int) -> dict | None:
    news = db.query(NewsArticle).filter(NewsArticle.id == news_id).first()
    if not news:
        return None
    return {
        "id": news.id, "title": news.title, "summary": news.summary,
        "content": news.content, "source_name": news.source_name,
        "source_url": news.source_url, "category": news.category,
        "publish_date": news.publish_date.isoformat() if news.publish_date else None,
    }


def get_news_categories(db: Session) -> list[str]:
    results = db.query(NewsArticle.category).distinct().all()
    cats = [r[0] for r in results if r[0]]
    if not cats:
        cats = ["政策", "市场分析", "价格预测", "行业动态"]
    return cats


def get_latest_news(db: Session, limit: int = 5) -> list[dict]:
    return get_news_list(db, page=1, page_size=limit)["items"]


# ── 政策 ──

def get_policy_list(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    province: str = None,
    policy_type: str = None,
) -> dict:
    """获取政策动态列表 - 真实数据优先"""
    query = db.query(PolicyEvent)

    existing_count = query.count()
    if existing_count < 5:
        logger.info("政策数据不足，尝试采集真实政策...")
        try:
            real_policies = collect_all_policies()
            if real_policies:
                store_policies_to_db(db, real_policies)
        except Exception as e:
            logger.error(f"政策采集失败: {e}")

    if province:
        query = query.filter(PolicyEvent.province == province)
    if policy_type:
        query = query.filter(PolicyEvent.policy_type == policy_type)

    total = query.count()
    results = (
        query.order_by(PolicyEvent.publish_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": r.id, "province": r.province, "title": r.title,
            "content": r.content, "source_name": r.source_name,
            "source_url": r.source_url, "policy_type": r.policy_type,
            "publish_date": r.publish_date.isoformat() if r.publish_date else None,
        }
        for r in results
    ]

    return {
        "items": items, "total": total, "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_policy_detail(db: Session, policy_id: int) -> dict | None:
    p = db.query(PolicyEvent).filter(PolicyEvent.id == policy_id).first()
    if not p:
        return None
    return {
        "id": p.id, "province": p.province, "title": p.title,
        "content": p.content, "source_name": p.source_name,
        "source_url": p.source_url, "policy_type": p.policy_type,
        "publish_date": p.publish_date.isoformat() if p.publish_date else None,
    }


def get_policy_provinces(db: Session) -> list[str]:
    results = db.query(PolicyEvent.province).distinct().all()
    return [r[0] for r in results if r[0]]
