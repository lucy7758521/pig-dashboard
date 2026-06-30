"""各省市生猪政策动态爬虫

数据来源: 农业农村部政策 + 百度新闻搜索各省政策
"""
import logging
import re
import time
from datetime import datetime, date
from typing import Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# 生猪主产省份（按出栏量排序）
MAJOR_PROVINCES = [
    "四川", "河南", "湖南", "山东", "湖北", "广东", "广西",
    "云南", "河北", "江苏", "安徽", "江西", "福建", "辽宁",
    "黑龙江", "吉林", "贵州", "浙江", "重庆", "陕西", "甘肃",
    "内蒙古", "山西", "新疆",
]


def _classify_policy_type(title: str) -> str:
    """根据标题自动分类政策类型"""
    if any(kw in title for kw in ["补贴", "补助", "扶持", "奖励"]):
        return "补贴"
    if any(kw in title for kw in ["调运", "检疫", "运输", "流通"]):
        return "调运"
    if any(kw in title for kw in ["环保", "污染", "粪污", "环境"]):
        return "环保"
    if any(kw in title for kw in ["产能", "调控", "稳产", "保供"]):
        return "产能调控"
    if any(kw in title for kw in ["保险", "金融", "贷款"]):
        return "金融支持"
    return "其他"


def scrape_national_policies() -> list[dict]:
    """爬取农业农村部全国性生猪政策"""
    results = []
    try:
        # 农业农村部政策发布
        urls = [
            "http://www.moa.gov.cn/gk/zcfg/",       # 政策法规
            "http://www.moa.gov.cn/xw/zwdt/",        # 新闻动态
        ]

        for base_url in urls:
            try:
                resp = httpx.get(base_url, headers=HEADERS, timeout=15, follow_redirects=True)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")

                for a in soup.select("a[href*='htm']"):
                    href = a.get("href", "")
                    text = a.get_text(strip=True)
                    if not text or len(text) < 10:
                        continue
                    if not any(kw in text for kw in ["猪", "畜牧", "养殖", "饲料", "动物", "防疫"]):
                        continue

                    # 构造完整 URL
                    if href.startswith("./"):
                        from urllib.parse import urljoin
                        url = urljoin(base_url, href)
                    elif href.startswith("/"):
                        url = "http://www.moa.gov.cn" + href
                    else:
                        url = href

                    # 提取日期
                    date_match = re.search(r"(\d{4})[/-](\d{2})[/-](\d{2})", href)
                    if date_match:
                        pub_date = datetime(int(date_match[1]), int(date_match[2]), int(date_match[3]))
                    else:
                        pub_date = datetime.now()

                    results.append({
                        "province": "全国",
                        "title": text[:200],
                        "content": text[:500],
                        "source_name": "农业农村部",
                        "source_url": url,
                        "policy_type": _classify_policy_type(text),
                        "publish_date": pub_date,
                    })

                time.sleep(2)
            except Exception:
                continue

        if results:
            logger.info(f"全国性政策: 采集 {len(results)} 条")
    except Exception as e:
        logger.error(f"全国性政策采集失败: {e}")

    return results


def scrape_province_policies(province: str) -> list[dict]:
    """从百度新闻搜索某省生猪政策

    搜索关键词: "{province}省 生猪 政策"
    """
    results = []
    try:
        search_url = f"https://www.baidu.com/s?wd={province}省+生猪+政策&tn=news&rtt=4"
        resp = httpx.get(
            search_url,
            headers={**HEADERS, "Referer": "https://www.baidu.com/"},
            timeout=15,
        )
        if resp.status_code != 200:
            return results

        soup = BeautifulSoup(resp.text, "html.parser")

        for item in soup.select(".result, .c-container"):
            try:
                title_el = item.select_one("h3 a")
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                href = title_el.get("href", "")

                summary_el = item.select_one(".c-abstract, .c-span-last")
                summary = summary_el.get_text(strip=True) if summary_el else title

                if not any(kw in title + summary for kw in ["猪", "养殖", "畜牧", "饲料"]):
                    continue

                results.append({
                    "province": province,
                    "title": title[:200],
                    "content": summary[:500],
                    "source_name": "百度新闻",
                    "source_url": href,
                    "policy_type": _classify_policy_type(title),
                    "publish_date": datetime.now(),
                })
            except Exception:
                continue

        if results:
            logger.info(f"{province}省政策: {len(results)} 条")
    except Exception as e:
        logger.error(f"{province}省政策采集失败: {e}")

    return results


def collect_all_policies() -> list[dict]:
    """汇总全国+各省政策动态"""
    all_policies = []

    # 1. 全国性政策
    national = scrape_national_policies()
    all_policies.extend(national)

    # 2. 主产省份政策（每省间隔2秒）
    for province in MAJOR_PROVINCES[:10]:  # 只采前10个主产省，避免请求过多
        try:
            time.sleep(2)
            prov_policies = scrape_province_policies(province)
            all_policies.extend(prov_policies)
        except Exception as e:
            logger.error(f"{province}省政策采集失败: {e}")

    # 按时间倒序
    all_policies.sort(key=lambda x: x.get("publish_date", datetime.min), reverse=True)

    # 按 URL 去重
    seen = set()
    deduped = []
    for p in all_policies:
        url = p.get("source_url", "")
        if url and url not in seen:
            seen.add(url)
            deduped.append(p)

    logger.info(f"政策汇总: 原始 {len(all_policies)} 条, 去重后 {len(deduped)} 条")
    return deduped


def store_policies_to_db(db_session, policies: list[dict]):
    """将政策动态存入数据库"""
    from models.news import PolicyEvent

    stored = 0
    for item in policies:
        try:
            existing = db_session.query(PolicyEvent).filter(
                PolicyEvent.source_url == item.get("source_url", "")
            ).first()
            if existing:
                continue
            db_session.add(PolicyEvent(**item))
            stored += 1
        except Exception as e:
            logger.debug(f"存储政策失败: {e}")

    db_session.commit()
    logger.info(f"政策入库: {stored} 条新记录")
    return stored
