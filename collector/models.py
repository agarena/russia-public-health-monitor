"""采集层数据模型。"""
from typing import Literal

from pydantic import BaseModel, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RawItem(StrictModel):
    """一条原始采集条目（尚未进入信号库）。"""

    item_id: str  # sha1(url_canonical)
    source_id: str  # 注册表来源 id（中转监控所属）
    publisher: str | None = None  # 实际出版方（中转条目来自 feed <source> 标签）
    url: str
    url_canonical: str
    title: str
    summary: str = ""
    published_at: str | None = None
    collected_at: str
    language: str
    relay: bool = False  # true = 经 Google News 等中转
    event_relevant: bool = False


class SourceHealthState(StrictModel):
    status: Literal["healthy", "degraded", "stale", "failed"] = "stale"
    last_success: str | None = None
    last_collected_at: str | None = None
    last_error: str | None = None
    items_last_run: int = 0
