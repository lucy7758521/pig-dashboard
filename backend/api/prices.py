"""价格相关 API 路由"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from services.price_service import (
    get_current_prices,
    get_price_statistics,
    get_price_history,
    get_map_data,
    get_trend_data,
)
from config import CATEGORIES

router = APIRouter(prefix="/api/v1/prices", tags=["价格数据"])


@router.get("/current")
def current_prices(
    category: str = Query(None, description="品种: 外三元/内三元/土杂猪/玉米/豆粕"),
    province: str = Query(None, description="省份名称"),
    db: Session = Depends(get_db),
):
    """获取当日价格排行"""
    data = get_current_prices(db, category=category, province=province)
    return {
        "code": 0,
        "message": "success",
        "data": data,
        "meta": {
            "total": len(data),
            "categories": CATEGORIES,
        },
    }


@router.get("/statistics")
def price_statistics(
    category: str = Query("外三元", description="品种"),
    db: Session = Depends(get_db),
):
    """获取价格统计（均价/最高/最低）"""
    stats = get_price_statistics(db, category=category)
    return {"code": 0, "message": "success", "data": stats}


@router.get("/history")
def price_history(
    category: str = Query("外三元", description="品种"),
    days: int = Query(30, ge=7, le=365, description="天数"),
    db: Session = Depends(get_db),
):
    """获取历史价格走势"""
    data = get_price_history(db, category=category, days=days)
    return {"code": 0, "message": "success", "data": data}


@router.get("/map")
def map_data(
    category: str = Query("外三元", description="品种"),
    db: Session = Depends(get_db),
):
    """获取地图热力图数据"""
    data = get_map_data(db, category=category)
    return {"code": 0, "message": "success", "data": data}


@router.get("/trend")
def trend_data(
    category: str = Query("外三元", description="品种"),
    days: int = Query(30, ge=7, le=365, description="天数"),
    db: Session = Depends(get_db),
):
    """获取趋势图数据"""
    data = get_trend_data(db, category=category, days=days)
    return {"code": 0, "message": "success", "data": data}
