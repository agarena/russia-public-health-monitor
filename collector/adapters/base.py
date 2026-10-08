"""适配器接口。"""
from typing import Protocol

from collector.config import SourceConfig
from collector.models import RawItem


class Adapter(Protocol):
    def fetch(self, source: SourceConfig, client) -> list[RawItem]:
        """抓取一个来源，返回原始条目。异常由调用方捕获并记录为来源故障。"""
        ...
