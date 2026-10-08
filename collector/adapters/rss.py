"""直连 RSS/Atom 适配器（feedparser 解析字节流）。"""
from datetime import UTC, datetime

import feedparser
from selectolax.lexbor import LexborHTMLParser

from collector.config import SourceConfig
from collector.models import RawItem
from collector.util import canonical_url, now_iso, sha1


def _strip_html(text: str) -> str:
    if not text:
        return ""
    return LexborHTMLParser(text).text(separator=" ", strip=True).strip()


def _parse_published(entry) -> str | None:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        return datetime(*parsed[:6], tzinfo=UTC).isoformat()
    return None


def fetch(source: SourceConfig, client) -> list[RawItem]:
    assert source.collect and source.collect.feed_url
    resp = client.get(source.collect.feed_url)
    resp.raise_for_status()
    feed = feedparser.parse(resp.content)

    items: list[RawItem] = []
    for entry in feed.entries:
        url = entry.get("link", "").strip()
        title = _strip_html(entry.get("title", ""))
        if not url or not title:
            continue
        canon = canonical_url(url)
        items.append(
            RawItem(
                item_id=sha1(canon),
                source_id=source.id,
                publisher=source.name,
                url=url,
                url_canonical=canon,
                title=title,
                summary=_strip_html(entry.get("summary", ""))[:1000],
                published_at=_parse_published(entry),
                collected_at=now_iso(),
                language=source.language,
                relay=False,
            )
        )
    return items
