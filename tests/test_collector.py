"""采集层单元测试：URL 规范化、关键词关联、Google News 查询构造、RSS 解析。"""
import feedparser

from collector.adapters import google_news
from collector.config import SourceConfig
from collector.matching import is_relevant
from collector.util import canonical_url


class FakeResponse:
    def __init__(self, content: bytes):
        self.content = content

    def raise_for_status(self):
        pass


class FakeClient:
    def __init__(self, content: bytes):
        self._content = content

    def get(self, url: str):
        return FakeResponse(self._content)


def test_canonical_url_strips_tracking_and_www():
    assert (
        canonical_url("https://www.example.com/a/?utm_source=x&id=1")
        == "https://example.com/a?id=1"
    )
    assert canonical_url("https://example.com/a/") == "https://example.com/a"


def test_matching_relevant_and_irrelevant():
    assert is_relevant("В Иркутске введён карантин из-за пневмонии")
    assert is_relevant("Russia plague institute worker died")
    assert not is_relevant("Fed raises interest rates again")


def test_google_news_feed_url():
    url = google_news.feed_url_for("site:reuters.com Russia plague", "en-US")
    assert url.startswith("https://news.google.com/rss/search?q=")
    assert "hl=en-US" in url and "ceid=US:en" in url


SAMPLE_RSS = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>t</title>
<item>
  <title>Irkutsk plague case reported</title>
  <link>https://www.example.com/article?utm_source=rss</link>
  <pubDate>Wed, 08 Oct 2026 01:00:00 GMT</pubDate>
  <source>Example News</source>
</item>
<item>
  <title>Unrelated story</title>
  <link>https://www.example.com/other</link>
</item>
</channel></rss>"""


def _source(method: str = "google_news_rss") -> SourceConfig:
    return SourceConfig(
        id="src-test",
        name="Test",
        type="international_media",
        tier="A",
        language="en",
        country_or_region="全球",
        official=False,
        url="https://example.com",
        collect={"method": method, "query": "test"},
    )


def test_google_news_adapter_parses_items():
    items = google_news.fetch(_source(), FakeClient(SAMPLE_RSS))
    assert len(items) == 2
    first = items[0]
    assert first.publisher == "Example News"
    assert first.relay is True
    assert first.url_canonical == "https://example.com/article"
    assert first.event_relevant is False  # fetch 不做关联，由 cli 负责


def test_feedparser_fixture_sanity():
    feed = feedparser.parse(SAMPLE_RSS)
    assert feed.entries[0].title == "Irkutsk plague case reported"
