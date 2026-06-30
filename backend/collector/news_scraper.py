"""真实新闻爬虫 - 只采集最近1个月内的新闻

数据来源优先级: 中国养猪网 > 农业农村部畜牧兽医局 > 搜猪网文章页
所有爬虫内置 try/except + 请求间隔，单源失败不影响整体。
采集后自动过滤超过30天的旧新闻。
"""
import logging
import re
import time
from datetime import datetime, date, timedelta
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}
REQUEST_DELAY = 2
MAX_AGE_DAYS = 30  # 只保留最近30天的新闻
CUTOFF_DATE = datetime.now() - timedelta(days=MAX_AGE_DAYS)


def _classify_category(title: str) -> str:
    """根据标题自动分类"""
    if any(kw in title for kw in ["政策", "调控", "通知", "方案", "措施", "规定", "补贴", "收储"]):
        return "政策"
    if any(kw in title for kw in ["预测", "展望", "后市", "走势", "拐点", "或将", "预计"]):
        return "价格预测"
    if any(kw in title for kw in ["企业", "牧原", "温氏", "新希望", "正邦", "公司", "出栏"]):
        return "行业动态"
    return "市场分析"


def _parse_date_from_text(text: str, default: datetime = None) -> datetime:
    """从文本中解析日期，支持多种格式。
    优先从 URL 路径中解析 /YYYYMMDD/ 格式（中国养猪网等使用此格式），
    如果解析出的日期是未来日期，自动回退到前一年。
    """
    if default is None:
        default = datetime.now()

    # 优先匹配 URL 路径中的 /YYYYMMDD/ 格式（最精确）
    m = re.search(r'/(\d{4})(\d{2})(\d{2})/', text)
    if m:
        try:
            result = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            if result <= datetime.now():
                return result
        except ValueError:
            pass

    patterns = [
        (r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", "ymd"),   # 2026-06-30
        (r"(\d{4})年(\d{1,2})月(\d{1,2})日", "ymd"),        # 2026年6月30日
        (r"(\d{1,2})月(\d{1,2})日", "md"),                  # 06月30日
    ]

    for pat, fmt in patterns:
        m = re.search(pat, text)
        if m:
            groups = m.groups()
            try:
                if fmt == "ymd":
                    result = datetime(int(groups[0]), int(groups[1]), int(groups[2]))
                else:  # md
                    result = datetime(datetime.now().year, int(groups[0]), int(groups[1]))
                    # 如果是未来日期，回退到去年
                    if result > datetime.now():
                        result = datetime(datetime.now().year - 1, int(groups[0]), int(groups[1]))

                if result <= datetime.now():
                    return result
            except ValueError:
                pass

    return default


def _is_recent(pub_date: datetime) -> bool:
    """检查日期是否在最近30天内"""
    return pub_date >= CUTOFF_DATE


def _clean_title(text: str) -> str:
    """清洗标题：去除多余空白和广告特征"""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'^[·•●]', '', text)
    # 去除电话号码
    text = re.sub(r'\d{10,12}', '', text)
    # 去除价格标识
    text = re.sub(r'[¥￥]\d+\.?\d*', '', text)
    return text[:200]


# ═══════════════════════════════════════════════════════════
# 数据源 1: 中国养猪网 - 新闻中心 (最高质量)
# ═══════════════════════════════════════════════════════════

def scrape_zhuwang_news() -> list[dict]:
    """爬取中国养猪网新闻

    中国养猪网新闻页面包含每日猪评、市场分析、行业动态等，
    标题和日期都很规范，是最优的新闻来源。
    """
    results = []
    urls = [
        "https://www.zhuwang.com.cn/",                    # 首页
        "https://zhujia.zhuwang.com.cn/",                  # 猪价频道
    ]

    # 广告/导航黑名单
    AD_KEYWORDS = [
        "APP", "下载", "登录", "注册", "首页", "电话", "微信",
        "抖音", "快手", "公众号", "客服", "关于我们", "联系",
        "广告", "推广", "赞助", "合作", "欢迎进入", "您好",
        "【播恩", "【养殖无抗", "脂来安", "战略新品发布",
    ]
    # 导航链接黑名单（精确匹配）
    AD_EXACT = ["您好，欢迎进入中国养猪网!", "中国养猪网"]

    for base_url in urls:
        try:
            resp = httpx.get(base_url, headers=HEADERS, timeout=15, follow_redirects=True)
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.text, "html.parser")

            for a in soup.select("a"):
                href = a.get("href", "")
                text = a.get_text(strip=True)
                if not text or len(text) < 12 or len(text) > 200:
                    continue

                # 必须有生猪相关关键词
                if not any(kw in text for kw in [
                    "猪价", "行情", "生猪", "猪肉", "养殖", "饲料",
                    "玉米", "豆粕", "出栏", "屠宰", "猪", "猪评",
                    "收储", "调控", "畜牧", "仔猪", "母猪", "猪场",
                ]):
                    continue

                # 排除广告
                if any(kw in text for kw in AD_KEYWORDS):
                    continue
                if text in AD_EXACT:
                    continue

                # 构造 URL
                if not href.startswith("http"):
                    if href.startswith("/"):
                        url = urljoin(base_url, href)
                    elif href.startswith("./"):
                        url = urljoin(base_url, href)
                    else:
                        continue
                else:
                    url = href

                # 解析日期 - 优先从 href 中找
                pub_date = _parse_date_from_text(href + text)

                # 只保留最近30天的
                if not _is_recent(pub_date):
                    continue

                clean_title = _clean_title(text)
                results.append({
                    "title": clean_title,
                    "summary": clean_title,
                    "source_name": "中国养猪网",
                    "source_url": url,
                    "category": _classify_category(clean_title),
                    "publish_date": pub_date,
                })

            if results:
                logger.info(f"中国养猪网({base_url}): 采集 {len(results)} 条")

        except Exception as e:
            logger.warning(f"中国养猪网({base_url})爬取失败: {e}")

    return results


# ═══════════════════════════════════════════════════════════
# 数据源 2: 农业农村部畜牧兽医局 (官方数据，精确日期)
# ═══════════════════════════════════════════════════════════

def scrape_moa_jcyj() -> list[dict]:
    """爬取农业农村部畜牧兽医局监测数据

    URL: http://www.xmsyj.moa.gov.cn/jcyj/
    包含生猪屠宰价格、饲料价格等每周官方监测数据，日期精确。
    只保留与生猪/饲料/畜牧直接相关的数据。
    """
    results = []
    # 必须包含的关键词（至少一个）
    PIG_KEYWORDS = ["生猪", "猪", "饲料", "畜牧", "养殖", "畜产品", "屠宰"]
    try:
        resp = httpx.get(
            "http://www.xmsyj.moa.gov.cn/jcyj/",
            headers=HEADERS, timeout=15, follow_redirects=True,
        )
        if resp.status_code != 200:
            return results

        soup = BeautifulSoup(resp.text, "html.parser")

        for a in soup.select("a[href*='htm']"):
            href = a.get("href", "")
            text = a.get_text(strip=True)
            if not text or len(text) < 10:
                continue

            # 必须与生猪/畜牧相关
            if not any(kw in text for kw in PIG_KEYWORDS):
                continue

            # 解析日期
            pub_date = _parse_date_from_text(href + text)
            if not _is_recent(pub_date):
                continue

            # 构造 URL
            if href.startswith("./"):
                url = urljoin("http://www.xmsyj.moa.gov.cn/jcyj/", href)
            elif href.startswith("/"):
                url = urljoin("http://www.xmsyj.moa.gov.cn", href)
            else:
                url = href

            clean_title = _clean_title(text)
            # 从标题提取更简洁的标题
            title_parts = re.split(r'\d{4}-\d{2}-\d{2}', clean_title)
            short_title = title_parts[0].strip() if title_parts else clean_title

            results.append({
                "title": short_title[:200],
                "summary": clean_title[:300],
                "source_name": "农业农村部",
                "source_url": url,
                "category": "市场分析",
                "publish_date": pub_date,
            })

        if results:
            logger.info(f"农业农村部畜牧兽医局: 采集 {len(results)} 条")
    except Exception as e:
        logger.error(f"农业农村部畜牧兽医局爬取失败: {e}")

    return results


# ═══════════════════════════════════════════════════════════
# 数据源 3: 搜猪网 - 仅爬取文章页面，不爬首页
# ═══════════════════════════════════════════════════════════

def scrape_soozhu_articles() -> list[dict]:
    """爬取搜猪网文章列表页面（非首页导航）

    搜猪网首页有大量导航/广告链接，改爬具体栏目页面。
    """
    results = []
    article_urls = [
        "https://www.soozhu.com/c/zhujiage/",     # 猪价
        "https://www.soozhu.com/c/yujing/",        # 预警
    ]

    for article_url in article_urls:
        try:
            resp = httpx.get(article_url, headers=HEADERS, timeout=15, follow_redirects=True)
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.text, "html.parser")

            for a in soup.select("a[href*='htm'], a[href*='html']"):
                href = a.get("href", "")
                text = a.get_text(strip=True)
                if not text or len(text) < 12 or len(text) > 200:
                    continue

                # 过滤广告特征
                if any(c in text for c in ["¥", "￥", "$", "元/"]):
                    continue
                if re.search(r'\d{10,}', text):  # 电话号码
                    continue

                # 必须包含生猪相关
                if not any(kw in text for kw in [
                    "猪价", "猪", "行情", "养殖", "饲料", "生猪", "猪肉",
                    "出栏", "屠宰", "预警", "分析", "预测",
                ]):
                    continue

                pub_date = _parse_date_from_text(href + text)
                if not _is_recent(pub_date):
                    continue

                if not href.startswith("http"):
                    if href.startswith("/"):
                        url = urljoin("https://www.soozhu.com", href)
                    else:
                        continue
                else:
                    url = href

                clean_title = _clean_title(text)
                results.append({
                    "title": clean_title,
                    "summary": clean_title,
                    "source_name": "搜猪网",
                    "source_url": url,
                    "category": _classify_category(clean_title),
                    "publish_date": pub_date,
                })

            if results:
                logger.info(f"搜猪网({article_url}): 采集 {len(results)} 条")
        except Exception as e:
            logger.warning(f"搜猪网({article_url})爬取失败: {e}")

    return results


# ═══════════════════════════════════════════════════════════
# 汇总入口
# ═══════════════════════════════════════════════════════════

def collect_all_news() -> list[dict]:
    """汇总所有来源新闻，去重，按时间过滤"""
    all_news = []

    sources = [
        ("中国养猪网", scrape_zhuwang_news),
        ("农业农村部", scrape_moa_jcyj),
        ("搜猪网文章", scrape_soozhu_articles),
    ]

    for name, scraper in sources:
        try:
            news = scraper()
            all_news.extend(news)
            if name != sources[-1][0]:
                time.sleep(REQUEST_DELAY)
        except Exception as e:
            logger.error(f"新闻源 {name} 采集异常: {e}")

    # 过滤超过30天的
    filtered = [n for n in all_news if _is_recent(n.get("publish_date", datetime.now()))]

    # 按 URL 去重
    seen_urls = set()
    deduped = []
    for item in filtered:
        url = item.get("source_url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped.append(item)

    # 按时间倒序
    deduped.sort(key=lambda x: x.get("publish_date", datetime.min), reverse=True)

    logger.info(
        f"新闻汇总: 原始 {len(all_news)} 条 → 过滤后 {len(filtered)} 条 → 去重 {len(deduped)} 条"
    )
    return deduped


def store_news_to_db(db_session, news_list: list[dict]):
    """将新闻存入数据库（去重，只保留最近30天的）"""
    from models.news import NewsArticle

    stored = 0
    skipped_old = 0
    for item in news_list:
        try:
            # 再次检查日期
            pub_date = item.get("publish_date")
            if pub_date and isinstance(pub_date, datetime) and not _is_recent(pub_date):
                skipped_old += 1
                continue

            existing = db_session.query(NewsArticle).filter(
                NewsArticle.source_url == item["source_url"]
            ).first()
            if existing:
                continue

            db_session.add(NewsArticle(**item))
            stored += 1
        except Exception as e:
            logger.debug(f"存储新闻失败: {e}")

    db_session.commit()
    if skipped_old > 0:
        logger.info(f"新闻入库: {stored} 条新记录 (跳过 {skipped_old} 条旧新闻)")
    else:
        logger.info(f"新闻入库: {stored} 条新记录")
    return stored


def clean_old_news(db_session) -> int:
    """清理超过30天的旧新闻"""
    from models.news import NewsArticle

    cutoff = datetime.now() - timedelta(days=MAX_AGE_DAYS)
    deleted = db_session.query(NewsArticle).filter(
        NewsArticle.publish_date < cutoff
    ).delete()
    db_session.commit()
    if deleted:
        logger.info(f"清理旧新闻: {deleted} 条")
    return deleted
