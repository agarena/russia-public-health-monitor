"""Google News RSS 中转适配器。

用途：为无公开 RSS 的媒体（Reuters/AP/CNN 等）与官方机构提供合规的关键词监控。
条目标记 relay=true，并保留实际出版方（feed 的 <source> 标签）；
中转属性在来源页与信号详情中如实展示。
"""
from urllib.parse import quote_plus

import feedparser

from collector.adapters.rss import _parse_published, _strip_html
from collector.config import SourceConfig
from collector.models import RawItem
from collector.util import canonical_url, now_iso, sha1

BASE = "https://news.google.com/rss/search?q={query}&hl={hl}&gl=US&ceid=US:{locale}"


def feed_url_for(query: str, hl: str) -> str:
    # ceid 取语言部分：hl=en-US -> ceid=US:en
    lang = hl.split("-")[0]
    return BASE.format(query=quote_plus(query), hl=hl, locale=lang)


def fetch(source: SourceConfig, client) -> list[RawItem]:
    assert source.collect and source.collect.query
    url = feed_url_for(source.collect.query, source.collect.hl)
    resp = client.get(url)
    resp.raise_for_status()
    feed = feedparser.parse(resp.content)

    items: list[RawItem] = []
    for entry in feed.entries:
        link = entry.get("link", "").strip()
        title = _strip_html(entry.get("title", ""))
        if not link or not title:
            continue
        publisher = None
        if entry.get("source") and isinstance(entry["source"], dict):
            publisher = entry["source"].get("title")
        canon = canonical_url(link)
        items.append(
            RawItem(
                item_id=sha1(canon),
                source_id=source.id,
                publisher=publisher or source.name,
                url=link,
                url_canonical=canon,
                title=title,
                summary=_strip_html(entry.get("summary", ""))[:1000],
                published_at=_parse_published(entry),
                collected_at=now_iso(),
                language=source.language,
                relay=True,
            )
        )
    return items
