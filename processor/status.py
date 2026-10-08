"""健康检查：队列、来源、信号分布与数据新鲜度。"""
import json
import sys
from pathlib import Path

from collector.config import load_sources
from processor.structuring import load_existing_signals, load_queue

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / "data" / "state"
PUBLIC_DIR = ROOT / "data" / "public-data"


def run() -> int:
    # 审核队列
    queue = load_queue()
    pending = [p for p in queue.get("proposals", []) if p.get("decision") is None]
    print(f"待审核提案：{len(pending)} 条")

    # 来源健康
    health = json.loads((STATE_DIR / "source_health.json").read_text(encoding="utf-8")) \
        if (STATE_DIR / "source_health.json").exists() else {}
    total = len(load_sources())
    by_status: dict[str, int] = {}
    for v in health.values():
        by_status[v["status"]] = by_status.get(v["status"], 0) + 1
    print(f"来源：{total} 个登记 · " + " · ".join(f"{k} {v}" for k, v in sorted(by_status.items()))
          + (f" · 未运行 {total - len(health)}" if len(health) < total else ""))
    last = max((v.get("last_success") or "" for v in health.values()), default="")
    print(f"最近成功采集：{last or '—'}")

    # 信号分布
    signals = load_existing_signals()
    dist: dict[str, int] = {}
    for s in signals:
        dist[s["status"]] = dist.get(s["status"], 0) + 1
    print(f"信号：{len(signals)} 条 · " + " · ".join(f"{k} {v}" for k, v in sorted(dist.items())))

    # 公开数据新鲜度
    if (PUBLIC_DIR / "status.json").exists():
        pub = json.loads((PUBLIC_DIR / "status.json").read_text(encoding="utf-8"))
        print(f"public-data 生成于：{pub.get('generated_at')}（{pub.get('sources_healthy')}/"
              f"{pub.get('sources_total')} 正常）")
    else:
        print("public-data：尚未生成（python -m processor.generate）")
    return 0


if __name__ == "__main__":
    sys.exit(run())
