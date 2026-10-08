"""事件关联（第一层）：关键词粗筛。

只判断「是否可能与本事件相关」；最终是否进入时间线由人工审核（M4 起为
规则建议 + 维护者确认）决定。
"""
from collector.config import load_settings

# 关键词不区分大小写；命中任意一个即标记 event_relevant=True
DEFAULT_KEYWORDS_RU = [
    "чума", "чумн", "пневмон", "карантин", "иркутск", "шелехов",
    "противочумн", "роспотребнадзор", "об Epidem", "эпидем",
]
DEFAULT_KEYWORDS_EN = [
    "plague", "pneumonia", "irkutsk", "shelekhov", "quarantine",
    "rospotrebnadzor", "siberia", "anti-plague",
]


def _keywords() -> tuple[list[str], list[str]]:
    cfg = load_settings().get("event_keywords", {})
    return (
        [k.lower() for k in cfg.get("ru", DEFAULT_KEYWORDS_RU)],
        [k.lower() for k in cfg.get("en", DEFAULT_KEYWORDS_EN)],
    )


def is_relevant(title: str, summary: str = "") -> bool:
    ru_kw, en_kw = _keywords()
    haystack = f"{title} {summary}".lower()
    return any(k in haystack for k in (*ru_kw, *en_kw))
