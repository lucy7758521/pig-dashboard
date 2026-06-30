"""模拟数据生成器 - 仅作为 AKShare 不可用时的 fallback

⚠️ 此模块只在真实数据采集失败时使用。
真实数据采集器: collector/akshare_collector.py
"""
import random
import math
from datetime import date, timedelta, datetime
from config import PROVINCES, CATEGORIES, ENTERPRISES

# ── 价格模拟（2026年真实价格区间参考）──
# 当前真实价格约: 外三元 9.85元/公斤, 玉米 2.37元/公斤, 大豆 3.07元/公斤
BASE_PRICES = {
    "外三元": (8.5, 11.5),
    "内三元": (8.0, 11.0),
    "土杂猪": (7.5, 10.5),
    "玉米": (2.2, 2.6),
    "大豆": (2.8, 3.4),
    "饲料": (2.6, 3.2),
}

PROVINCE_OFFSET = {
    "海南": 1.15, "广东": 1.10, "福建": 1.08, "浙江": 1.07,
    "上海": 1.06, "江苏": 1.04, "广西": 1.03, "湖南": 1.02,
    "江西": 1.01, "湖北": 1.00, "安徽": 0.99, "重庆": 0.98,
    "四川": 0.97, "贵州": 0.96, "云南": 0.95, "河南": 0.94,
    "山东": 0.93, "河北": 0.92, "陕西": 0.91, "山西": 0.90,
    "天津": 0.96, "北京": 0.97, "辽宁": 0.89, "吉林": 0.88,
    "黑龙江": 0.87, "内蒙古": 0.86, "甘肃": 0.85, "宁夏": 0.84,
    "新疆": 0.82, "青海": 0.83, "西藏": 0.90,
}

# ── 新闻模板（2026年真实行业背景）──
NEWS_TEMPLATES = [
    {
        "title": "农业农村部：全国生猪产能调控方案持续推进",
        "summary": "农业农村部近日召开生猪生产形势分析会，强调要持续抓紧抓实各项产能综合调控措施，推动猪价尽快回到合理水平。",
        "category": "政策",
        "source_name": "农业农村部",
    },
    {
        "title": "6月猪价筑底企稳，下半年有望逐步回升",
        "summary": "据卓创资讯监测，当前生猪价格已处于周期底部区域，随着产能持续去化，下半年生猪供需关系有望改善，猪价存在回升预期。",
        "category": "市场分析",
        "source_name": "卓创资讯",
    },
    {
        "title": "全国猪料比价持续低位运行，养殖端亏损压力不减",
        "summary": "本周全国猪料比价为3.55，环比下跌1.66%。按目前价格及成本推算，未来仔猪育肥模式的生猪养殖头均盈利为-468.47元。",
        "category": "市场分析",
        "source_name": "国家发改委",
    },
    {
        "title": "2025年TOP30猪企出栏排行：牧原7798万头稳居第一",
        "summary": "据新猪派调研，2025年TOP30猪企合计出栏2.77亿头。牧原股份以7798万头霸榜，温氏股份4048万头排名第二。",
        "category": "行业动态",
        "source_name": "新猪派",
    },
    {
        "title": "玉米价格震荡下行，饲料成本压力有所缓解",
        "summary": "近期国内玉米市场供应充足，价格震荡下行。饲料原料成本下降有助于缓解养殖端亏损压力。",
        "category": "市场分析",
        "source_name": "中国养猪网",
    },
    {
        "title": "两部门召开生猪调控座谈会：推动猪价尽快回到合理水平",
        "summary": "两部门组织部分生猪主产省份和大型生猪养殖企业召开座谈会，要求大型猪企带头压减产能和产量。",
        "category": "政策",
        "source_name": "新华社",
    },
    {
        "title": "6月第3周生猪定点屠宰企业收购价格环比上涨0.1%",
        "summary": "据农业农村部监测，2025年6月16-22日，生猪定点屠宰企业生猪平均收购价格为15.70元/公斤，环比上涨0.1%，同比下降15.5%。",
        "category": "市场分析",
        "source_name": "农业农村部",
    },
    {
        "title": "机构：猪价短期磨底蓄势，中期上行拐点渐近",
        "summary": "财信证券发布研报称，当前生猪价格运行仍处于第7轮猪周期下行阶段的尾部区域。",
        "category": "价格预测",
        "source_name": "财信证券",
    },
    {
        "title": "猪肉价格持续走低，四季度或企稳回升",
        "summary": "中国养猪网监测数据显示，二季度以来生猪价格长期处于10元/公斤以下，养殖持续亏损。",
        "category": "价格预测",
        "source_name": "央广网",
    },
    {
        "title": "豆粕价格高位回落，养殖成本有望进一步下降",
        "summary": "受国际大豆价格下跌影响，国内豆粕现货价格近期明显回落。",
        "category": "市场分析",
        "source_name": "博亚和讯",
    },
]

ENTERPRISE_TEMPLATES = [
    {
        "enterprise_name": "牧原股份", "stock_code": "002714",
        "event_type": "出栏数据",
        "title": "牧原股份：2026年1-5月累计出栏生猪超3200万头",
        "content": "牧原股份公告显示，2026年1-5月累计出栏生猪超3200万头。当前完全养殖成本约14.5元/公斤。",
        "data_json": {"monthly_output": 640, "cost_per_kg": 14.5},
    },
    {
        "enterprise_name": "牧原股份", "stock_code": "002714",
        "event_type": "公告",
        "title": "牧原股份：董事及高管拟增持4-5亿元公司股份",
        "content": "牧原股份公告，公司部分董事及高级管理人员计划自2026年6月26日起6个月内增持公司股份4-5亿元。",
        "data_json": {"min_amount": 4, "max_amount": 5, "unit": "亿元"},
    },
    {
        "enterprise_name": "温氏股份", "stock_code": "300498",
        "event_type": "出栏数据",
        "title": "温氏股份：2026年1-5月累计出栏生猪超1500万头",
        "content": "温氏股份公告显示，2026年1-5月累计出栏生猪超1500万头，同比增长约15%。",
        "data_json": {"monthly_output": 300, "yoy_growth": 15.3},
    },
    {
        "enterprise_name": "温氏股份", "stock_code": "300498",
        "event_type": "新闻",
        "title": "温氏股份推进智能化养殖，降低养殖成本成效显著",
        "content": "温氏股份持续推进智慧养殖体系建设，2026年一季度生猪养殖完全成本降至15.8元/公斤。",
        "data_json": {"cost_per_kg": 15.8, "cost_reduction": 1.2},
    },
    {
        "enterprise_name": "新希望", "stock_code": "000876",
        "event_type": "出栏数据",
        "title": "新希望：2026年1-5月累计出栏生猪约580万头",
        "content": "新希望公告显示，2026年1-5月累计出栏生猪约580万头，同比增长约7%。",
        "data_json": {"monthly_output": 116, "yoy_growth": 6.8},
    },
    {
        "enterprise_name": "新希望", "stock_code": "000876",
        "event_type": "公告",
        "title": "新希望：持续优化产业结构，聚焦饲料与养殖双主业",
        "content": "新希望表示将继续聚焦饲料与生猪养殖双主业，2026年饲料销量目标3800万吨。",
        "data_json": {"feed_target": 3800, "unit": "万吨"},
    },
    {
        "enterprise_name": "正邦科技", "stock_code": "002157",
        "event_type": "公告",
        "title": "正邦科技：重整计划执行完毕，生产经营逐步恢复",
        "content": "正邦科技公告称重整计划已执行完毕，2026年计划出栏生猪300万头。",
        "data_json": {"output_target": 300, "capacity_utilization": 60},
    },
]


def generate_mock_prices(category: str, target_date: date = None) -> list[dict]:
    """[Fallback] 生成模拟当日价格排行"""
    if target_date is None:
        target_date = date.today()
    base_min, base_max = BASE_PRICES.get(category, (8, 12))
    results = []

    sorted_provinces = sorted(
        PROVINCES,
        key=lambda p: PROVINCE_OFFSET.get(p, 1.0) * random.uniform(base_min, base_max),
        reverse=True,
    )
    for rank, province in enumerate(sorted_provinces, 1):
        offset = PROVINCE_OFFSET.get(province, 1.0)
        price_kg = round(random.uniform(base_min, base_max) * offset, 2)
        price_yuan = round(price_kg / 2, 2)
        results.append({
            "record_date": target_date, "category": category,
            "province": province, "price_kg": price_kg,
            "price_yuan": price_yuan, "rank": rank, "source": "mock_fallback",
        })
    return results


def generate_mock_history(category: str, days: int = 365) -> list[dict]:
    """[Fallback] 生成模拟历史价格走势"""
    base_min, base_max = BASE_PRICES.get(category, (8, 12))
    base = random.uniform(base_min, base_max)
    results = []
    for i in range(days):
        d = date.today() - timedelta(days=days - i - 1)
        noise = random.gauss(0, 0.3)
        seasonal = 0.2 * math.sin(i * 2 * math.pi / 90)
        price = base + noise + seasonal
        price = max(base_min * 0.8, min(base_max * 1.2, price))
        results.append({
            "record_date": d, "category": category,
            "avg_price": round(price, 2), "source": "mock_fallback",
        })
    return results


def generate_mock_news(count: int = 30) -> list[dict]:
    """[Fallback] 生成模拟新闻"""
    results = []
    for i in range(count):
        template = random.choice(NEWS_TEMPLATES)
        publish_date = datetime.now() - timedelta(
            days=random.randint(0, 14), hours=random.randint(0, 23)
        )
        results.append({
            "title": template["title"], "summary": template["summary"],
            "content": template["summary"] + "\n\n（⚠️ 此为模拟数据，真实数据源暂不可用）",
            "source_name": template["source_name"],
            "source_url": f"mock://news/{i}", "category": template["category"],
            "publish_date": publish_date,
        })
    results.sort(key=lambda x: x["publish_date"], reverse=True)
    return results


def generate_mock_enterprise_events(count: int = 20) -> list[dict]:
    """[Fallback] 生成模拟企业动态"""
    results = []
    for i in range(min(count, len(ENTERPRISE_TEMPLATES))):
        t = ENTERPRISE_TEMPLATES[i]
        event_date = date.today() - timedelta(days=random.randint(0, 30))
        results.append({
            "enterprise_name": t["enterprise_name"],
            "stock_code": t["stock_code"],
            "event_type": t["event_type"],
            "title": t["title"],
            "content": t["content"],
            "source_url": f"mock://enterprise/{i}",
            "event_date": event_date,
            "data_json": t["data_json"],
        })
    results.sort(key=lambda x: x["event_date"], reverse=True)
    return results
