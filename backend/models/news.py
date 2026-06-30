"""新闻文章模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from database import Base


class NewsArticle(Base):
    """生猪行业新闻"""
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False, comment="标题")
    summary = Column(Text, comment="摘要")
    content = Column(Text, comment="完整内容")
    source_name = Column(String(100), comment="来源名称")
    source_url = Column(String(1000), unique=True, comment="来源URL(去重)")
    publish_date = Column(DateTime, comment="发布日期")
    category = Column(String(50), comment="分类: 政策/市场分析/价格预测/行业动态")
    crawled_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_news_publish_date", "publish_date"),
        Index("idx_news_category", "category"),
    )


class PolicyEvent(Base):
    """各省市生猪政策动态"""
    __tablename__ = "policy_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    province = Column(String(30), nullable=False, comment="省份: 全国/北京/广东...")
    title = Column(String(500), nullable=False, comment="标题")
    content = Column(Text, comment="内容")
    source_name = Column(String(100), comment="来源名称")
    source_url = Column(String(1000), unique=True, comment="来源URL(去重)")
    policy_type = Column(String(50), comment="政策类型: 补贴/调运/环保/产能调控/金融支持/其他")
    publish_date = Column(DateTime, comment="发布日期")
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_policy_province", "province"),
        Index("idx_policy_date", "publish_date"),
        Index("idx_policy_type", "policy_type"),
    )
