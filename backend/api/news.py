"""新闻相关 API 路由"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from services.news_service import get_news_list, get_news_detail, get_news_categories

router = APIRouter(prefix="/api/v1/news", tags=["新闻资讯"])


@router.get("")
def news_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量"),
    category: str = Query(None, description="分类筛选"),
    db: Session = Depends(get_db),
):
    """获取新闻列表"""
    data = get_news_list(db, page=page, page_size=page_size, category=category)
    return {"code": 0, "message": "success", "data": data}


@router.get("/categories")
def news_categories(db: Session = Depends(get_db)):
    """获取新闻分类列表"""
    data = get_news_categories(db)
    return {"code": 0, "message": "success", "data": data}


@router.get("/{news_id}")
def news_detail(news_id: int, db: Session = Depends(get_db)):
    """获取新闻详情"""
    data = get_news_detail(db, news_id)
    if not data:
        return {"code": 404, "message": "新闻不存在", "data": None}
    return {"code": 0, "message": "success", "data": data}
