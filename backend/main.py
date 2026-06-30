"""国内生猪综合数据看板 - 后端入口"""
import logging
import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from api.prices import router as prices_router
from api.news import router as news_router
from api.enterprises import router as enterprises_router
from api.dashboard import router as dashboard_router
from api.policy import router as policy_router
from api.supply_demand import router as supply_demand_router
from scheduler.tasks import init_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    logger.info("正在初始化数据库...")
    init_db()
    logger.info("数据库初始化完成")
    logger.info("正在启动数据采集调度器...")
    init_scheduler()
    logger.info("数据采集调度器已启动")
    yield
    logger.info("正在关闭调度器...")
    shutdown_scheduler()
    logger.info("应用关闭")


app = FastAPI(
    title="国内生猪综合数据看板 API",
    description="提供全国生猪价格、行业新闻、企业动态等数据接口",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(prices_router)
app.include_router(news_router)
app.include_router(enterprises_router)
app.include_router(dashboard_router)
app.include_router(policy_router)
app.include_router(supply_demand_router)


@app.get("/api/v1/health")
def health_check():
    """健康检查"""
    return {"code": 0, "message": "ok", "data": {"status": "healthy"}}


@app.get("/api/v1/data-status")
def data_status():
    """数据更新状态"""
    from datetime import datetime
    from models.pig_price import PigPrice
    from database import SessionLocal
    db = SessionLocal()
    try:
        latest = (
            db.query(PigPrice)
            .order_by(PigPrice.record_date.desc())
            .first()
        )
        source = latest.source if latest else "unknown"
        last_date = str(latest.record_date) if latest else None
    finally:
        db.close()

    return {
        "code": 0,
        "message": "success",
        "data": {
            "last_update": datetime.now().isoformat(),
            "last_data_date": last_date,
            "status": "normal",
            "source": source or "unknown",
        },
    }


@app.get("/api/v1/china-map")
def china_map_geojson():
    """返回中国地图 GeoJSON 数据（前端用于渲染省份热力图）"""
    geo_path = os.path.join(os.path.dirname(__file__), "static", "china.json")
    if not os.path.exists(geo_path):
        return {"code": 404, "message": "地图数据未找到", "data": None}
    with open(geo_path, "r", encoding="utf-8") as f:
        geo_data = json.load(f)
    return {"code": 0, "message": "success", "data": geo_data}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
