"""生猪价格数据模型"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, UniqueConstraint, Index
from database import Base


class PigPrice(Base):
    """当日生猪价格快照（各省份各品种）"""
    __tablename__ = "pig_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_date = Column(Date, nullable=False, comment="数据日期")
    category = Column(String(20), nullable=False, comment="品种: 外三元/内三元/土杂猪/玉米/豆粕")
    province = Column(String(30), nullable=False, comment="省份")
    price_yuan = Column(Float, comment="价格(元/斤)")
    price_kg = Column(Float, comment="价格(元/公斤) 或 (元/吨)")
    rank = Column(Integer, comment="排名")
    change = Column(Float, comment="涨跌幅(%)")
    source = Column(String(50), default="mock", comment="数据来源")
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        UniqueConstraint("record_date", "category", "province", name="uq_pig_price"),
        Index("idx_pig_prices_date", "record_date"),
        Index("idx_pig_prices_category", "category"),
        Index("idx_pig_prices_province", "province"),
    )


class PriceHistory(Base):
    """生猪全国均价历史走势"""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_date = Column(Date, nullable=False, comment="日期")
    category = Column(String(20), nullable=False, comment="品种")
    avg_price = Column(Float, nullable=False, comment="全国均价(元/公斤)")
    source = Column(String(50), default="mock")
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        UniqueConstraint("record_date", "category", name="uq_price_history"),
        Index("idx_price_history_date", "record_date"),
    )
