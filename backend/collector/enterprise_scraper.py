"""企业动态爬虫 - 新浪股票实时行情 + 东方财富企业新闻

数据来源: 新浪财经API (股价) + 东方财富搜索 (新闻)
"""
import logging
import re
import time
from datetime import datetime, date
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# 6家头部猪企
ENTERPRISE_LIST = [
    {"name": "牧原股份", "stock_code": "002714", "market": "sz"},
    {"name": "温氏股份", "stock_code": "300498", "market": "sz"},
    {"name": "新希望",   "stock_code": "000876", "market": "sz"},
    {"name": "正邦科技", "stock_code": "002157", "market": "sz"},
    {"name": "天邦食品", "stock_code": "002124", "market": "sz"},
    {"name": "傲农生物", "stock_code": "603363", "market": "sh"},
]


def scrape_stock_prices() -> list[dict]:
    """从新浪财经API获取6家猪企实时股价

    返回格式: [{"enterprise_name": "牧原股份", "stock_code": "002714",
               "price": 34.99, "open": 35.35, "pre_close": 35.99,
               "high": 35.93, "low": 34.70, "change_pct": -2.78}, ...]
    """
    results = []
    try:
        codes = ",".join(
            f"{e['market']}{e['stock_code']}" for e in ENTERPRISE_LIST
        )
        url = f"https://hq.sinajs.cn/list={codes}"
        resp = httpx.get(
            url,
            headers={**HEADERS, "Referer": "https://finance.sina.com.cn/"},
            timeout=10,
        )
        if resp.status_code != 200:
            logger.warning(f"新浪股票API返回 {resp.status_code}")
            return results

        # 解析返回数据
        lines = resp.text.strip().split("\n")
        for line in lines:
            if "=" not in line:
                continue
            match = re.search(r'hq_str_(\w+)="(.+)"', line)
            if not match:
                continue

            code = match[1]  # sz002714
            data = match[2].split(",")
            if len(data) < 6:
                continue

            # 匹配企业
            enterprise = None
            for e in ENTERPRISE_LIST:
                if e["stock_code"] in code:
                    enterprise = e
                    break
            if not enterprise:
                continue

            try:
                name = data[0]
                open_price = float(data[1])
                pre_close = float(data[2])
                price = float(data[3])
                high = float(data[4])
                low = float(data[5])
                change_pct = round((price - pre_close) / pre_close * 100, 2) if pre_close else 0

                results.append({
                    "enterprise_name": enterprise["name"],
                    "stock_code": enterprise["stock_code"],
                    "price": price,
                    "open": open_price,
                    "pre_close": pre_close,
                    "high": high,
                    "low": low,
                    "change_pct": change_pct,
                    "event_type": "股价动态",
                    "title": f"{name}: 现价{price}元 涨跌幅{change_pct:+.2f}%",
                    "content": f"{name} 开盘{open_price} 昨收{pre_close} 现价{price} 最高{high} 最低{low} 涨跌幅{change_pct:+.2f}%",
                    "source_url": f"https://finance.sina.com.cn/realstock/company/{code}/nc.shtml",
                    "event_date": date.today(),
                    "data_json": {
                        "price": price, "open": open_price, "pre_close": pre_close,
                        "high": high, "low": low, "change_pct": change_pct,
                    },
                })
            except (ValueError, IndexError) as e:
                logger.debug(f"解析股价失败: {e}")
                continue

        logger.info(f"成功采集股价: {len(results)} 家企业")
    except Exception as e:
        logger.error(f"新浪股价采集失败: {e}")

    return results


def scrape_enterprise_news(enterprise_name: str) -> list[dict]:
    """从东方财富搜索企业新闻"""
    results = []
    try:
        url = (
            "https://searchapi.eastmoney.com/bussiness/Web/GetCMSSearchResult"
            f"?type=8196&pageindex=1&pagesize=10&keyword={enterprise_name}&name=zixun"
        )
        resp = httpx.get(
            url,
            headers={**HEADERS, "Referer": "https://so.eastmoney.com/"},
            timeout=10,
        )
        if resp.status_code != 200:
            return results

        data = resp.json()
        items = data.get("Data", [])

        # 匹配企业
        enterprise_match = None
        for e in ENTERPRISE_LIST:
            if e["name"] == enterprise_name:
                enterprise_match = e
                break

        for item in items:
            title = item.get("Title", "")
            if not title:
                continue

            pub_date_str = item.get("Date", "")
            try:
                pub_date = datetime.strptime(pub_date_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                pub_date = datetime.now()

            # 自动分类事件类型
            if any(kw in title for kw in ["出栏", "销售", "生猪"]):
                event_type = "出栏数据"
            elif any(kw in title for kw in ["公告", "董事会", "股东"]):
                event_type = "公告"
            elif any(kw in title for kw in ["涨", "跌", "股"]):
                event_type = "股价动态"
            else:
                event_type = "新闻"

            results.append({
                "enterprise_name": enterprise_name,
                "stock_code": enterprise_match["stock_code"] if enterprise_match else "",
                "event_type": event_type,
                "title": title,
                "content": item.get("Content", title)[:500],
                "source_url": item.get("Url", ""),
                "event_date": pub_date.date() if pub_date else date.today(),
                "data_json": {},
            })

        if results:
            logger.info(f"企业新闻({enterprise_name}): {len(results)} 条")
    except Exception as e:
        logger.error(f"企业新闻({enterprise_name})采集失败: {e}")

    return results


def collect_all_enterprise() -> list[dict]:
    """汇总所有企业动态：股价 + 新闻"""
    all_events = []

    # 1. 股价
    stock_prices = scrape_stock_prices()
    all_events.extend(stock_prices)

    # 2. 企业新闻（间隔2秒）
    for enterprise in ENTERPRISE_LIST:
        try:
            time.sleep(2)
            news = scrape_enterprise_news(enterprise["name"])
            all_events.extend(news)
        except Exception as e:
            logger.error(f"企业{enterprise['name']}新闻采集失败: {e}")

    # 按日期倒序
    all_events.sort(key=lambda x: x.get("event_date", date.min), reverse=True)

    logger.info(f"企业动态汇总: {len(all_events)} 条")
    return all_events


def store_enterprise_to_db(db_session, events: list[dict]):
    """将企业动态存入数据库（去重）"""
    from models.enterprise import EnterpriseEvent

    stored = 0
    for item in events:
        try:
            existing = db_session.query(EnterpriseEvent).filter(
                EnterpriseEvent.source_url == item.get("source_url", ""),
                EnterpriseEvent.enterprise_name == item.get("enterprise_name", ""),
            ).first()
            if existing:
                continue
            db_session.add(EnterpriseEvent(**item))
            stored += 1
        except Exception as e:
            logger.debug(f"存储企业动态失败: {e}")

    db_session.commit()
    logger.info(f"企业动态入库: {stored} 条新记录")
    return stored
