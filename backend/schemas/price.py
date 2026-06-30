"""价格相关 Pydantic 模型"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class PriceItem(BaseModel):
    province: str
    category: str
    price_kg: float
    price_yuan: float
    rank: int
    record_date: date
    source: str = "mock"

    class Config:
        from_attributes = True


class PriceHistoryPoint(BaseModel):
    record_date: date
    category: str
    avg_price: float

    class Config:
        from_attributes = True


class PriceStatistics(BaseModel):
    category: str
    avg_price: float
    max_price: float
    min_price: float
    max_province: str
    min_province: str
    update_time: datetime


class DashboardOverview(BaseModel):
    summary_cards: dict
    map_data: list[dict]
    trend_data: dict
    latest_news: list[dict]
    enterprise_updates: list[dict]
