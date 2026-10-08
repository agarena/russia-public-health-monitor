"""AI 结构化：把新的原始条目变成「待审核的信号提案」。

关键约束：
- AI 输出只是建议，写入 review_queue.json，绝不直接进入 signals.jsonl；
- AI 建议的状态永远不允许是 confirmed；
- AI 未配置时仍生成提案（原文进队列，标注待翻译），人工维护照常可行。
"""
import json
from pathlib import Path

from collector.config import load_sources
from collector.util import now_iso
from processor import dedup
from processor.ai import AIClient
from processor.prompts import JSON_RULES, SYSTEM_PROMPT, TRANSLATE_CLASSIFY_INSTRUCTION

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / "data" / "state"
QUEUE_PATH = STATE_DIR / "review_queue.json"
RAW_DIR = STATE_DIR / "raw"

# 只看最近 N 天的原始条目，避免老数据反复进队列
LOOKBACK_DAYS = 3


def load_queue() -> dict:
    if QUEUE_PATH.exists():
        return json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
    return {"updated_at": now_iso(), "proposals": []}


def save_queue(queue: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    QUEUE_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2), encoding="utf-8")


def load_recent_raw(days: float = LOOKBACK_DAYS) -> list[dict]:
    import re

    items: list[dict] = []
    pattern = re.compile(r"^\d{4}-\d{2}-\d{2}\.jsonl$")
    files = sorted(p for p in RAW_DIR.glob("*.jsonl") if pattern.match(p.name))
    for path in files[-3:]:  # 最近 3 个文件足够覆盖 lookback
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            if dedup.days_ago(item.get("collected_at")) is not None and (
                dedup.days_ago(item.get("collected_at")) > days
            ):
                continue
            items.append(item)
    return items


def filter_by_age(items: list[dict]) -> list[dict]:
    """按发布时间过滤：超过 max_item_age_days 的旧资料不进提案队列。

    无发布时间的条目保留（交人工判断）。
    """
    from collector.config import load_settings

    max_age = load_settings().get("structuring", {}).get("max_item_age_days", 45)
    out = []
    for item in items:
        age = dedup.days_ago(item.get("published_at"))
        if age is None or age <= max_age:
            out.append(item)
    return out


def load_existing_signals() -> list[dict]:
    path = STATE_DIR / "signals.jsonl"
    if not path.exists():
        return []
    merged: dict[str, dict] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            sig = json.loads(line)
            merged[sig["id"]] = sig
    return list(merged.values())


def propose(client: AIClient | None, relevant_only: bool = True) -> dict:
    """生成提案队列。返回统计信息。"""
    sources = {s.id: s for s in load_sources()}
    raw_items = load_recent_raw()
    if relevant_only:
        raw_items = [i for i in raw_items if i.get("event_relevant")]
    raw_items = filter_by_age(raw_items)

    existing = load_existing_signals()
    queue = load_queue()
    known_keys = {
        p.get("url_canonical") for p in queue["proposals"] if p.get("decision") is None
    }

    # 三层去重（第一层 URL / 第二层标题；第三层语义在有 AI 时对疑似项判定）
    url_dups = dedup.find_url_duplicates(raw_items, existing)
    title_dups = dedup.find_title_duplicates(raw_items, existing)

    # 批次内去重：同批新条目互为转载时，标记后到的引用先到的提案
    batch_titles: list[tuple[str, str]] = []  # (proposal_id, title)

    ai_used = 0
    added = 0
    for item in raw_items:
        canon = item.get("url_canonical") or item.get("url")
        if canon in known_keys:
            continue
        known_keys.add(canon)
        dup_signal = url_dups.get(item["item_id"]) or title_dups.get(item["item_id"])
        derived_from = [dup_signal] if dup_signal else []
        duplicate_of_proposal = None
        if not derived_from:
            for pid, title in batch_titles:
                if dedup.title_similarity(item.get("title", ""), title) >= dedup.TITLE_THRESHOLD:
                    duplicate_of_proposal = pid
                    break
        if not derived_from and client is not None and client.available():
            # 第三层：与最近的 20 条信号做语义比对（控制成本）
            for sig in existing[:20]:
                verdict = dedup.ai_same_information(
                    client, item.get("title", ""), sig.get("title_original", "")
                )
                if verdict is True:
                    derived_from.append(sig["id"])
                    ai_used += 1
                    break

        # AI 结构化（可用时）
        title_zh, summary_zh, status_sug, conf_sug, importance, reason = (
            item["title"], "", "unconfirmed", "C1", 0.5, "未配置 AI，人工审核时翻译与定级"
        )
        if client is not None and client.available() and not duplicate_of_proposal:
            try:
                payload = {
                    "title": item.get("title", ""),
                    "summary": item.get("summary", "")[:600],
                    "source_tier": sources.get(item["source_id"], None).tier
                    if sources.get(item["source_id"])
                    else "?",
                    "source_name": item.get("publisher") or item["source_id"],
                    "published": item.get("published_at"),
                }
                user_msg = (
                    TRANSLATE_CLASSIFY_INSTRUCTION
                    + "\n\nItem:\n"
                    + json.dumps(payload, ensure_ascii=False)
                )
                result = client.chat_json(SYSTEM_PROMPT + JSON_RULES, user_msg)
                title_zh = result.get("title_zh") or item["title"]
                summary_zh = result.get("summary_zh") or ""
                status_sug = result.get("suggested_status") or "unconfirmed"
                if status_sug == "confirmed":  # 防御：AI 永远不能建议 confirmed
                    status_sug = "reported"
                conf_sug = result.get("suggested_confidence") or "C1"
                importance = float(result.get("importance") or 0.5)
                reason = result.get("reason_zh") or ""
                ai_used += 1
            except Exception as e:  # noqa: BLE001 —— AI 失败降级为人工
                reason = f"AI 调用失败（{type(e).__name__}），转人工处理"

        src = sources.get(item["source_id"])
        proposal = {
            "id": f"p-{item['item_id'][:10]}",
            "raw_item": item,
            "source_tier": src.tier if src else "D",
            "source_type": src.type if src else "social",
            "official": bool(src.official) if src else False,
            "title_zh": title_zh,
            "summary_zh": summary_zh,
            "suggested_status": status_sug,
            "suggested_confidence": conf_sug,
            "importance": importance,
            "reason_zh": reason,
            "derived_from": derived_from,
            "proposed_at": now_iso(),
            "decision": None,
        }
        if duplicate_of_proposal:
            proposal["duplicate_of_proposal"] = duplicate_of_proposal
            proposal["reason_zh"] = (reason + "；" if reason else "") + "批次内疑似转载，合并审核"
        queue["proposals"].append(proposal)
        batch_titles.append((proposal["id"], item.get("title", "")))
        added += 1

    queue["updated_at"] = now_iso()
    save_queue(queue)
    return {"candidates": len(raw_items), "added": added, "ai_calls": ai_used}


def run() -> int:
    client = AIClient.from_env()
    stats = propose(client)
    mode = "AI 已启用" if client.available() else "AI 未配置（提案保留原文，人工翻译定级）"
    print(
        f"结构化完成（{mode}）：候选 {stats['candidates']}，"
        f"新增提案 {stats['added']}，AI 调用 {stats['ai_calls']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
