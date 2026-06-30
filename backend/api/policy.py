"""政策动态 API 路由"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from services.news_service import (
    get_policy_list,
    get_policy_detail,
    get_policy_provinces,
)

router = APIRouter(prefix="/api/v1/policies", tags=["政策动态"])


@router.get("")
def policy_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量"),
    province: str = Query(None, description="省份筛选"),
    policy_type: str = Query(None, description="政策类型: 补贴/调运/环保/产能调控/金融支持"),
    db: Session = Depends(get_db),
):
    """获取政策动态列表"""
    data = get_policy_list(db, page=page, page_size=page_size,
                           province=province, policy_type=policy_type)
    return {"code": 0, "message": "success", "data": data}


@router.get("/provinces")
def policy_provinces(db: Session = Depends(get_db)):
    """获取有政策数据的省份列表"""
    data = get_policy_provinces(db)
    return {"code": 0, "message": "success", "data": data}


@router.get("/{policy_id}")
def policy_detail(policy_id: int, db: Session = Depends(get_db)):
    """获取政策详情"""
    data = get_policy_detail(db, policy_id)
    if not data:
        return {"code": 404, "message": "政策不存在", "data": None}
    return {"code": 0, "message": "success", "data": data}
