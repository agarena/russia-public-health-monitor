"""评级确认 CLI：建议 → 维护者确认 → 生效 + 变更记录。

用法：
  python -m processor.ratings suggest
  python -m processor.ratings apply --level L2 --reason "多个升级信号" --sources r-sig-004,r-sig-010
  python -m processor.ratings apply --phase O1 --confidence C3 --trend up --reason "..."
  python -m processor.ratings log

规则：
- apply 必须带 --reason（评级变化必须可解释）；
- 每个维度变化写入 data/state/rating_changes.json（from/to/reason/source_ids/timestamp）；
- 同时更新 data/state/manual/event.json 的对应字段与 last_updated。
"""
import argparse
import json
import sys
from pathlib import Path

from collector.util import now_iso
from processor.scoring import build_suggestion
from processor.structuring import load_existing_signals

ROOT = Path(__file__).resolve().parents[1]
MANUAL_EVENT = ROOT / "data" / "state" / "manual" / "event.json"
RATING_CHANGES = ROOT / "data" / "state" / "rating_changes.json"

DIMENSIONS = ("observation_phase", "attention_level", "confidence", "trend")
# 维度 -> argparse 属性名（--phase/--level/...）
DIMENSION_ATTR = {
    "observation_phase": "phase",
    "attention_level": "level",
    "confidence": "confidence",
    "trend": "trend",
}


def load_changes() -> list[dict]:
    if RATING_CHANGES.exists():
        return json.loads(RATING_CHANGES.read_text(encoding="utf-8"))
    return []


def save_changes(changes: list[dict]) -> None:
    RATING_CHANGES.parent.mkdir(parents=True, exist_ok=True)
    RATING_CHANGES.write_text(
        json.dumps(changes, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def cmd_suggest() -> int:
    signals = load_existing_signals()
    suggestion = build_suggestion(signals)
    print(json.dumps(suggestion, ensure_ascii=False, indent=2))
    print("\n以上为建议值；确认生效：python -m processor.ratings apply ...")
    return 0


def cmd_apply(args) -> int:
    event = json.loads(MANUAL_EVENT.read_text(encoding="utf-8"))
    changes = load_changes()
    applied = []
    for dim in DIMENSIONS:
        value = getattr(args, DIMENSION_ATTR[dim], None)
        if value is None:
            continue
        old = event.get(dim)
        if old == value:
            continue
        event[dim] = value
        changes.append(
            {
                "timestamp": now_iso(),
                "dimension": dim,
                "from": old,
                "to": value,
                "reason": args.reason,
                "source_ids": [s.strip() for s in args.sources.split(",") if s.strip()],
            }
        )
        applied.append(f"{dim}: {old} → {value}")

    if not applied:
        print("没有任何维度发生变化（与当前值相同）")
        return 0

    event["last_updated"] = now_iso()
    MANUAL_EVENT.write_text(json.dumps(event, ensure_ascii=False, indent=2), encoding="utf-8")
    save_changes(changes)
    for line in applied:
        print(f"已生效：{line}")
    print("已写入 rating_changes.json；请运行 python -m processor.generate 更新公开数据。")
    return 0


def cmd_log() -> int:
    changes = load_changes()
    if not changes:
        print("（暂无评级变更记录）")
        return 0
    for c in changes:
        src = ",".join(c.get("source_ids", [])) or "-"
        print(
            f"{c['timestamp']}  {c['dimension']}: {c['from']} → {c['to']}"
            f"\n    理由：{c['reason']}\n    来源：{src}"
        )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ratings")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("suggest")
    sub.add_parser("log")
    apply_p = sub.add_parser("apply")
    apply_p.add_argument("--phase", choices=[f"O{i}" for i in range(9)])
    apply_p.add_argument("--level", choices=[f"L{i}" for i in range(4)])
    apply_p.add_argument("--confidence", choices=[f"C{i}" for i in range(5)])
    apply_p.add_argument("--trend", choices=["up", "stable", "down", "insufficient"])
    apply_p.add_argument("--reason", required=True, help="变更理由（必填）")
    apply_p.add_argument("--sources", default="", help="依据的 signal id，逗号分隔")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "suggest":
        return cmd_suggest()
    if args.command == "apply":
        return cmd_apply(args)
    if args.command == "log":
        return cmd_log()
    return 1


if __name__ == "__main__":
    sys.exit(main())
