"""企业动态相关 API 路由"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from services.enterprise_service import (
    get_enterprise_events,
    get_enterprise_stats,
)
from config import ENTERPRISES

router = APIRouter(prefix="/api/v1/enterprises", tags=["企业动态"])


@router.get("")
def enterprise_list(
    name: str = Query(None, description="企业名称"),
    event_type: str = Query(None, description="事件类型: 公告/出栏数据/股价动态/新闻"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量"),
    db: Session = Depends(get_db),
):
    """获取企业动态列表"""
    data = get_enterprise_events(
        db, enterprise_name=name, event_type=event_type, page=page, page_size=page_size
    )
    return {
        "code": 0,
        "message": "success",
        "data": data,
        "meta": {"enterprises": [e["name"] for e in ENTERPRISES]},
    }


@router.get("/{enterprise_name}/stats")
def enterprise_stats(enterprise_name: str, db: Session = Depends(get_db)):
    """获取企业统计数据"""
    data = get_enterprise_stats(db, enterprise_name)
    return {"code": 0, "message": "success", "data": data}
