"""Dashboard 聚合 API"""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from services.price_service import (
    get_price_statistics,
    get_map_data,
    get_trend_data,
    get_feed_prices,
)
from services.news_service import get_latest_news
from services.enterprise_service import get_latest_enterprise_updates

router = APIRouter(prefix="/api/v1/dashboard", tags=["综合看板"])


@router.get("/overview")
def dashboard_overview(db: Session = Depends(get_db)):
    """获取首页概览数据 - 真实实时数据"""
    # 价格统计
    price_stats = get_price_statistics(db, category="外三元")

    # 计算全国平均涨跌（从省份数据聚合）
    all_prices = get_price_statistics(db, category="外三元")
    # 直接用省份数据获取 change
    from services.price_service import get_current_prices
    province_data = get_current_prices(db, category="外三元")
    avg_change = round(sum(p.get("change", 0) for p in province_data) / max(len(province_data), 1), 2) if province_data else 0
    feed_prices = get_feed_prices(db)

    # 地图和趋势
    map_data = get_map_data(db, category="外三元")
    trend_data = get_trend_data(db, category="外三元", days=30)

    # 新闻和企业
    latest_news = get_latest_news(db, limit=5)
    enterprise_updates = get_latest_enterprise_updates(db, limit=5)

    corn = feed_prices.get("玉米", {})
    soybean = feed_prices.get("大豆", {})

    summary_cards = {
        "avg_price": {
            "value": price_stats.get("avg_price", 0),
            "unit": "元/公斤",
            "category": "外三元",
            "change": avg_change,
        },
        "highest_province": {
            "name": price_stats.get("max_province", ""),
            "price": price_stats.get("max_price", 0),
        },
        "lowest_province": {
            "name": price_stats.get("min_province", ""),
            "price": price_stats.get("min_price", 0),
        },
        "corn_price": {
            "value": corn.get("value", 0),
            "unit": corn.get("unit", "元/公斤"),
            "update_date": corn.get("update_date", ""),
        },
        "soybean_price": {
            "value": soybean.get("value", 0),
            "unit": soybean.get("unit", "元/公斤"),
            "update_date": soybean.get("update_date", ""),
        },
        "update_time": datetime.now().isoformat(),
    }

    return {
        "code": 0,
        "message": "success",
        "data": {
            "summary_cards": summary_cards,
            "map_data": map_data,
            "trend_data": trend_data,
            "latest_news": latest_news,
            "enterprise_updates": enterprise_updates,
        },
    }
