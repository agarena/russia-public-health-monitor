"""采集工具函数：URL 规范化、哈希、时间。"""
import hashlib
import re
from datetime import UTC, datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# 追踪参数去除（第一层去重的一部分）
TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "gclid", "fbclid", "ref", "source",
}


def canonical_url(url: str) -> str:
    parts = urlsplit(url.strip())
    query = [(k, v) for k, v in parse_qsl(parts.query) if k.lower() not in TRACKING_PARAMS]
    host = parts.netloc.lower()
    # 统一去掉 www. 前缀
    if host.startswith("www."):
        host = host[4:]
    path = re.sub(r"/+$", "", parts.path)
    return urlunsplit((parts.scheme.lower(), host, path, urlencode(query), ""))


def sha1(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def now_iso() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
