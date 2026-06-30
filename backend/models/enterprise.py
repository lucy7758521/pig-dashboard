"""企业动态模型"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Index
from sqlalchemy.dialects.sqlite import JSON
from database import Base


class EnterpriseEvent(Base):
    """头部猪企动态"""
    __tablename__ = "enterprise_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    enterprise_name = Column(String(50), nullable=False, comment="企业名称")
    stock_code = Column(String(10), comment="股票代码")
    event_type = Column(String(50), comment="事件类型: 公告/出栏数据/股价动态/新闻")
    title = Column(String(500), nullable=False, comment="标题")
    content = Column(Text, comment="内容")
    source_url = Column(String(1000), comment="来源URL")
    event_date = Column(Date, comment="事件日期")
    data_json = Column(JSON, comment="结构化数据(出栏量/股价等)")
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_enterprise_name", "enterprise_name"),
        Index("idx_enterprise_event_date", "event_date"),
    )
