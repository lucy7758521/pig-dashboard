"""供需看板 API"""
import logging
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from collector.akshare_collector import (
    collect_price_history,
    collect_corn_price,
    collect_soybean_price,
    collect_feed_price,
    collect_hog_cost,
    collect_price_index,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/supply-demand", tags=["供需看板"])


def _fetch_hog_supply():
    """采集供给指数"""
    try:
        import akshare as ak
        df = ak.futures_hog_supply()
        if df is not None and not df.empty:
            return [
                {"date": str(row["date"])[:10], "value": float(row["value"])}
                for _, row in df.iterrows()
            ]
    except Exception as e:
        logger.error(f"供给指数采集失败: {e}")
    return []


@router.get("/overview")
def supply_demand_overview():
    """供需看板概览数据"""
    result = {
        "update_time": datetime.now().isoformat(),
    }

    # 1. 供给指数
    supply_data = _fetch_hog_supply()
    if supply_data:
        supply_recent = supply_data[-30:]  # 最近30天
        latest_supply = supply_data[-1]["value"] if supply_data else 0
        prev_supply = supply_data[-8]["value"] if len(supply_data) > 8 else latest_supply
        supply_change = latest_supply - prev_supply if prev_supply else 0
        result["supply_index"] = {
            "value": latest_supply,
            "change": round(supply_change, 2),
            "trend": supply_recent,
            "unit": "指数",
        }

    # 2. 养殖成本
    cost_data = collect_hog_cost()
    if cost_data:
        cost_recent = [
            {"date": str(c["record_date"]), "value": c["avg_price"]}
            for c in cost_data[-90:]
        ]
        result["breeding_cost"] = {
            "value": cost_data[-1]["avg_price"] if cost_data else 0,
            "trend": cost_recent,
            "unit": "元/头",
        }

    # 3. 猪粮比 (生猪价/玉米价)
    hog_history = collect_price_history("外三元", 90)
    corn_history = collect_corn_price()
    if hog_history and corn_history:
        # 按日期匹配计算猪粮比
        corn_map = {str(c["record_date"]): c["avg_price"] for c in corn_history}
        ratio_points = []
        for h in hog_history:
            d = str(h["record_date"])
            if d in corn_map and corn_map[d] > 0:
                ratio = round(h["avg_price"] / corn_map[d], 2)
                ratio_points.append({"date": d, "value": ratio})
        if ratio_points:
            latest_ratio = ratio_points[-1]["value"]
            # 判断状态
            if latest_ratio < 5.0:
                status = "重度亏损"
                status_color = "#ff4466"
            elif latest_ratio < 5.5:
                status = "轻度亏损"
                status_color = "#ffaa00"
            elif latest_ratio < 6.5:
                status = "正常盈利"
                status_color = "#00ff88"
            else:
                status = "高盈利"
                status_color = "#00d4ff"
            result["pig_grain_ratio"] = {
                "value": latest_ratio,
                "status": status,
                "status_color": status_color,
                "trend": ratio_points[-90:],
                "unit": "比值",
            }

    # 4. 价格指数
    index_data = collect_price_index()
    if index_data:
        idx_recent = index_data[-90:]
        result["price_index"] = {
            "value": idx_recent[-1]["index_val"] if idx_recent else 0,
            "presale_avg": idx_recent[-1]["presale_avg"] if idx_recent else 0,
            "deal_avg": idx_recent[-1]["deal_avg"] if idx_recent else 0,
            "deal_weight": idx_recent[-1]["deal_weight"] if idx_recent else 0,
            "trend": [
                {"date": str(i["record_date"]), "value": i["index_val"]}
                for i in idx_recent
            ],
            "unit": "指数",
        }

    # 5. 饲料价格趋势
    feed = collect_feed_price()
    soybean = collect_soybean_price()
    if corn_history and soybean and feed:
        result["feed_trend"] = {
            "corn": [{"date": str(c["record_date"]), "value": c["avg_price"]} for c in corn_history[-90:]],
            "soybean": [{"date": str(s["record_date"]), "value": s["avg_price"]} for s in soybean[-90:]],
            "feed": [{"date": str(f["record_date"]), "value": f["avg_price"]} for f in feed[-90:]],
        }

    return {"code": 0, "message": "success", "data": result}
