"""信息链路审计：任何结论 → signal → source → 原始 URL 的完整回溯。

用法：
  python -m processor.audit --signal r-sig-010
  python -m processor.audit --event
"""
import argparse
import json
import sys
from pathlib import Path

from collector.config import load_sources
from processor.scoring import build_suggestion
from processor.structuring import load_existing_signals

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / "data" / "state"
MANUAL_DIR = STATE_DIR / "manual"


def _read_json(path: Path):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def audit_signal(signal_id: str) -> int:
    signals = {s["id"]: s for s in load_existing_signals()}
    if signal_id not in signals:
        print(f"未找到信号：{signal_id}")
        return 1
    sig = signals[signal_id]
    sources = {s.id: s for s in load_sources()}

    print(f"═ 信号 {sig['id']}")
    print(f"  标题(zh)：{sig.get('title_zh')}")
    print(f"  标题(原)：{sig.get('title_original')}")
    print(f"  摘要(zh)：{sig.get('summary_zh')}")
    print(f"  状态：{sig.get('status')}｜证据完整度：{sig.get('confidence')}｜"
          f"独立来源 ×{sig.get('independent_source_count')}")
    print(f"  发布：{sig.get('published_at')}｜采集：{sig.get('collected_at')}")
    print(f"  原始 URL：{sig.get('url')}")

    src = sources.get(sig.get("source_id", ""))
    if src:
        print(f"═ 来源 {src.id}")
        print(f"  {src.name_zh or src.name}（{src.tier}级 · {src.type} · "
              f"{'官方' if src.official else '非官方'} · {src.language}）")
        print(f"  {src.url}")

    # 转载链回溯
    chain = []
    current = sig
    seen = {sig["id"]}
    while current.get("derived_from"):
        parent_id = current["derived_from"][0]
        if parent_id in seen:
            break
        seen.add(parent_id)
        parent = signals.get(parent_id)
        if not parent:
            break
        chain.append(parent)
        current = parent
    if chain:
        print("═ 转载链（信息源头在前）")
        for p in reversed(chain):
            src_p = sources.get(p.get("source_id", ""))
            name = src_p.name if src_p else p.get("source_id")
            print(f"  {p['id']} ← {name}：{p.get('title_zh', '')[:50]}")
        origin = sources.get(chain[-1].get("origin_source_id", "") or "", None)
        print(f"  信息源头：{origin.name if origin else chain[-1].get('origin_source_id')}")

    # 被引用处
    timeline = _read_json(MANUAL_DIR / "timeline.json") or {"entries": []}
    tl_refs = [e["id"] for e in timeline.get("entries", []) if signal_id in e.get("source_ids", [])]
    event = _read_json(MANUAL_DIR / "event.json") or {}
    ev_refs = []
    for block in ("key_changes", "confirmed", "unconfirmed"):
        for i, item in enumerate(event.get(block, [])):
            if signal_id in (item.get("signal_ids") or []):
                ev_refs.append(f"{block}[{i}]")
    cases = _read_json(MANUAL_DIR / "cases.json") or {"cases": []}
    case_refs = [
        c["id"] for c in cases.get("cases", []) if signal_id in (c.get("source_ids") or [])
    ]
    print("═ 被引用于")
    print(f"  时间线：{', '.join(tl_refs) or '—'}")
    print(f"  首页区块：{', '.join(ev_refs) or '—'}")
    print(f"  病例：{', '.join(case_refs) or '—'}")

    changes = _read_json(STATE_DIR / "rating_changes.json") or []
    rc_refs = [c for c in changes if signal_id in (c.get("source_ids") or [])]
    if rc_refs:
        print("═ 评级依据")
        for c in rc_refs:
            print(f"  {c['timestamp']} {c['dimension']}: {c['from']} → {c['to']}（{c['reason']}）")
    return 0


def audit_event() -> int:
    event = _read_json(MANUAL_DIR / "event.json") or {}
    print("═ 当前状态（人工确认值）")
    print(f"  观察阶段：{event.get('observation_phase')}")
    print(f"  关注等级：{event.get('attention_level')}")
    print(f"  证据完整度：{event.get('confidence')}")
    print(f"  趋势：{event.get('trend')}")
    print(f"  最后更新：{event.get('last_updated')}")
    suggestion = build_suggestion(load_existing_signals())
    print("\n═ 规则引擎建议值（仅供参考，需人工确认后生效）")
    print(f"  观察阶段：{suggestion['suggested_observation_phase']}"
          f"（依据：{', '.join(suggestion['phase_evidence_signal_ids']) or '—'}）")
    print(f"  关注等级：{suggestion['suggested_attention_level']}（{suggestion['level_reason']}）")
    print(f"  证据完整度：{suggestion['suggested_confidence']}")
    print(f"  趋势：{suggestion['suggested_trend']}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="audit")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--signal")
    group.add_argument("--event", action="store_true")
    args = parser.parse_args(argv)
    if args.signal:
        return audit_signal(args.signal)
    return audit_event()


if __name__ == "__main__":
    sys.exit(main())
