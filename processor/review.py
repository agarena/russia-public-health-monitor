"""人工审核闸门：信号提案 → signals.jsonl（append-only）。

用法：
  python -m processor.review list                     查看待审核提案
  python -m processor.review show --id P-xxxx         查看单个提案详情
  python -m processor.review approve --id P-xxxx \
      --status reported --confidence C2 [--independent 2] \
      [--note 补充说明]                                通过并写入信号库
  python -m processor.review reject --id P-xxxx --reason ...   拒绝（保留记录）

硬性规则（代码强制，不给选择）：
- 只有 S/A 级来源的提案才允许 approve 为 confirmed；D 级只能 unconfirmed；
- approve 写入 signals.jsonl 是 append-only 追加，永不改写历史行。
"""
import argparse
import json
import sys
from pathlib import Path

from collector.config import load_settings
from collector.util import now_iso
from processor.structuring import QUEUE_PATH, load_queue, save_queue

ROOT = Path(__file__).resolve().parents[1]
SIGNALS_PATH = ROOT / "data" / "state" / "signals.jsonl"


def next_signal_id() -> str:
    existing = set()
    if SIGNALS_PATH.exists():
        for line in SIGNALS_PATH.read_text(encoding="utf-8").splitlines():
            if line.strip():
                existing.add(json.loads(line)["id"])
    n = len(existing) + 1
    while f"r-sig-{n:03d}" in existing:
        n += 1
    return f"r-sig-{n:03d}"


def append_signal(signal: dict) -> None:
    SIGNALS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SIGNALS_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(signal, ensure_ascii=False) + "\n")


def cmd_list() -> int:
    queue = load_queue()
    pending = [p for p in queue["proposals"] if p.get("decision") is None]
    print(f"待审核提案：{len(pending)} 条（队列文件：{QUEUE_PATH.name}）\n")
    for p in pending[:50]:
        raw = p["raw_item"]
        dup = f" ←疑似转载 {','.join(p['derived_from'])}" if p["derived_from"] else ""
        print(
            f"[{p['id']}] {p.get('suggested_status')}/{p.get('suggested_confidence')} "
            f"{p.get('source_tier')}级 {p.get('title_zh', '')[:60]}{dup}"
        )
        print(f"        发布 {raw.get('published_at') or '?'} · {raw.get('url', '')[:90]}")
    if not pending:
        print("（空）")
    return 0


def _find_pending(queue: dict, proposal_id: str) -> dict:
    for p in queue["proposals"]:
        if p["id"] == proposal_id and p.get("decision") is None:
            return p
    raise SystemExit(f"未找到待审核提案：{proposal_id}")


def cmd_show(proposal_id: str) -> int:
    queue = load_queue()
    p = _find_pending(queue, proposal_id)
    print(json.dumps(p, ensure_ascii=False, indent=2))
    return 0


def cmd_approve(proposal_id: str, status: str, confidence: str, independent: int, note: str) -> int:
    queue = load_queue()
    p = _find_pending(queue, proposal_id)
    raw = p["raw_item"]

    # ── 硬性规则（规格书铁律的代码化）──
    if status == "confirmed" and p.get("source_tier") not in ("S", "A"):
        print("拒绝：confirmed 只能授予 S/A 级来源的提案（当前 "
              f"{p.get('source_tier')} 级）。")
        return 1
    if p.get("source_tier") == "D" and status not in ("unconfirmed", "unknown"):
        print("拒绝：D 级（社交平台）来源只能标注 unconfirmed / unknown。")
        return 1
    if p.get("source_tier") in ("B", "C") and status == "confirmed":
        print("拒绝：B/C 级来源不能直接 confirmed，需 S/A 级来源或官方原始资料支持。")
        return 1

    event_id = load_settings().get("event_id", "russia-public-health-2026")
    signal = {
        "id": next_signal_id(),
        "event_id": event_id,
        "published_at": raw.get("published_at") or raw.get("collected_at"),
        "collected_at": raw.get("collected_at"),
        "language": raw.get("language", "other"),
        "source_id": raw.get("source_id"),
        "source_tier": p.get("source_tier", "D"),
        "title_original": raw.get("title", ""),
        "title_zh": p.get("title_zh") or raw.get("title", ""),
        "summary_zh": (p.get("summary_zh") or "") + (f"（审核备注：{note}）" if note else ""),
        "status": status,
        "confidence": confidence,
        "independent_source_count": independent,
        "origin_source_id": raw.get("source_id"),
        "derived_from": p.get("derived_from", []),
        "url": raw.get("url"),
        "importance": p.get("importance", 0.5),
        "is_quotation": False,
        "demo": False,
    }
    append_signal(signal)
    p["decision"] = "approved"
    p["decided_at"] = now_iso()
    p["decided_signal_id"] = signal["id"]
    save_queue(queue)
    print(f"已批准：{signal['id']}（status={status}, confidence={confidence}）")
    return 0


def cmd_reject(proposal_id: str, reason: str) -> int:
    queue = load_queue()
    p = _find_pending(queue, proposal_id)
    p["decision"] = "rejected"
    p["decided_at"] = now_iso()
    p["reject_reason"] = reason
    save_queue(queue)
    print(f"已拒绝：{proposal_id}（{reason}）")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="review")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list")
    show = sub.add_parser("show")
    show.add_argument("--id", required=True)
    app = sub.add_parser("approve")
    app.add_argument("--id", required=True)
    app.add_argument("--status", required=True,
                     choices=["confirmed", "reported", "unconfirmed", "contradicted", "unknown"])
    app.add_argument("--confidence", required=True,
                     choices=["C0", "C1", "C2", "C3", "C4"])
    app.add_argument("--independent", type=int, default=1)
    app.add_argument("--note", default="")
    rej = sub.add_parser("reject")
    rej.add_argument("--id", required=True)
    rej.add_argument("--reason", required=True)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "list":
        return cmd_list()
    if args.command == "show":
        return cmd_show(args.id)
    if args.command == "approve":
        return cmd_approve(args.id, args.status, args.confidence, args.independent, args.note)
    if args.command == "reject":
        return cmd_reject(args.id, args.reason)
    return 1


if __name__ == "__main__":
    sys.exit(main())
