"""三层去重（规格书 §57）：URL → 标题 → 语义。

- 第一层 URL：canonical url 完全一致视为重复（采集端已做，这里对信号库再查一次）；
- 第二层 标题：规范化标题相似度 ≥ 阈值视为疑似转载；
- 第三层 语义：AI 判断「是否讲同一件事」（需要 AI 配置；未配置时跳过，宁可多进审核队列）。

重复不是丢弃：新条目标记 derived_from 已有 signal，进入审核队列供人工确认合并。
"""
import re
from datetime import UTC, datetime

from rapidfuzz import fuzz

TITLE_THRESHOLD = 85.0


def normalize_title(title: str) -> str:
    """小写、去标点与多余空白；对俄英中混合标题的保守规范化。"""
    t = title.lower()
    t = re.sub(r"[\s\-–—|:：,，。.!?！？\"'「」『』()（）\[\]]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def title_similarity(a: str, b: str) -> float:
    return fuzz.ratio(normalize_title(a), normalize_title(b))


def find_title_duplicates(
    new_items: list[dict], existing_signals: list[dict], threshold: float = TITLE_THRESHOLD
) -> dict[str, str]:
    """返回 {new item_id: 已有 signal_id}。"""
    dup_map: dict[str, str] = {}
    for item in new_items:
        for sig in existing_signals:
            original = sig.get("title_original") or sig.get("title_zh") or ""
            if not original:
                continue
            if title_similarity(item.get("title", ""), original) >= threshold:
                dup_map[item["item_id"]] = sig["id"]
                break
    return dup_map


def find_url_duplicates(new_items: list[dict], existing_signals: list[dict]) -> dict[str, str]:
    known = {s.get("url_canonical") or s.get("url"): s["id"] for s in existing_signals}
    out: dict[str, str] = {}
    for item in new_items:
        hit = known.get(item.get("url_canonical")) or known.get(item.get("url"))
        if hit:
            out[item["item_id"]] = hit
    return out


SEMANTIC_PROMPT = """You are comparing two public-information items about the same monitored event.

Item A (new): {a_title}
Item B (existing signal): {b_title}

Do they convey the SAME underlying piece of information (one is a republication/translation
of the other), or DIFFERENT information (independent reporting, new facts, new statements)?

Return JSON: {{"same_information": true/false, "reason_zh": "一句话理由"}}
"""


def ai_same_information(client, new_title: str, existing_title: str) -> bool | None:
    """第三层语义去重。AI 未配置或失败时返回 None（视为无法判定，不合并）。"""
    if client is None or not client.available():
        return None
    try:
        result = client.chat_json(
            "", SEMANTIC_PROMPT.format(a_title=new_title, b_title=existing_title)
        )
    except Exception:  # noqa: BLE001 —— 语义去重失败不影响主流程
        return None
    if not isinstance(result, dict) or not isinstance(result.get("same_information"), bool):
        return None
    return result["same_information"]


def merge_duplicate_maps(*maps: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for m in maps:
        for k, v in m.items():
            out.setdefault(k, v)
    return out


def days_ago(iso: str | None, now: datetime | None = None) -> float | None:
    if not iso:
        return None
    try:
        t = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None
    now = now or datetime.now(UTC)
    return (now - t).total_seconds() / 86400


def suggest_independent(
    proposal_origin: str | None,
    derived_from: list[str],
    signals_by_id: dict[str, dict],
) -> int:
    """独立来源计数：沿 derived_from 链回溯到各自 origin，去重计数。

    转载链上的所有信号共享同一 origin → 只算 1 个独立来源；
    各自独立采访/核实的报道 → 不同 origin 分开计数。
    """
    origins: set[str] = set()
    if proposal_origin:
        origins.add(proposal_origin)
    stack = list(derived_from)
    seen: set[str] = set()
    while stack:
        sid = stack.pop()
        if sid in seen:
            continue
        seen.add(sid)
        sig = signals_by_id.get(sid)
        if not sig:
            continue
        origin = sig.get("origin_source_id") or sig.get("source_id")
        if origin:
            origins.add(origin)
        stack.extend(sig.get("derived_from", []))
    return max(len(origins), 1)
