"""采集配置加载：sources.yaml + settings.yaml。"""
from functools import lru_cache
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict

ROOT = Path(__file__).resolve().parents[1]
SOURCES_PATH = ROOT / "config" / "sources.yaml"
SETTINGS_PATH = ROOT / "config" / "settings.yaml"


class CollectConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    method: Literal["google_news_rss", "rss"]
    query: str | None = None
    feed_url: str | None = None
    hl: str = "en-US"


class SourceConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    name: str
    name_zh: str | None = None
    type: Literal["official", "international_media", "local_media", "expert", "social"]
    tier: Literal["S", "A", "B", "C", "D"]
    language: Literal["ru", "en", "zh", "other"]
    country_or_region: str
    official: bool
    url: str
    description_zh: str | None = None
    enabled: bool = True
    collect: CollectConfig | None = None


@lru_cache(maxsize=1)
def load_sources() -> list[SourceConfig]:
    with open(SOURCES_PATH, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return [SourceConfig.model_validate(item) for item in data.get("sources", [])]


@lru_cache(maxsize=1)
def load_settings() -> dict:
    with open(SETTINGS_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}
