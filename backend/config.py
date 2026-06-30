"""应用配置"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 数据库配置 - 开发阶段使用 SQLite
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/pig_dashboard.db")

# 数据采集配置
CACHE_TTL_SECONDS = 300  # 缓存5分钟
PRICE_COLLECT_INTERVAL_MINUTES = 30  # 价格数据采集间隔
NEWS_COLLECT_INTERVAL_MINUTES = 60   # 新闻采集间隔
ENTERPRISE_COLLECT_INTERVAL_HOURS = 6  # 企业动态采集间隔

# 爬虫配置
SCRAPER_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
SCRAPER_TIMEOUT = 30
SCRAPER_DELAY = 3  # 请求间隔（秒）

# 支持的品种
CATEGORIES = ["外三元", "内三元", "土杂猪", "玉米", "豆粕"]

# 省份列表
PROVINCES = [
    "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
    "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南",
    "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州",
    "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"
]

# 头部企业
ENTERPRISES = [
    {"name": "牧原股份", "stock_code": "002714"},
    {"name": "温氏股份", "stock_code": "300498"},
    {"name": "新希望", "stock_code": "000876"},
    {"name": "正邦科技", "stock_code": "002157"},
    {"name": "天邦食品", "stock_code": "002124"},
    {"name": "傲农生物", "stock_code": "603363"},
]
