"""状态存储：append-only 原始条目、URL 去重索引、来源健康。"""
import json
from pathlib import Path

from collector.models import RawItem, SourceHealthState
from collector.util import now_iso

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / "data" / "state"
RAW_DIR = STATE_DIR / "raw"
SEEN_PATH = STATE_DIR / "seen_urls.json"
HEALTH_PATH = STATE_DIR / "source_health.json"


def load_seen() -> dict[str, str]:
    if SEEN_PATH.exists():
        return json.loads(SEEN_PATH.read_text(encoding="utf-8"))
    return {}


def save_seen(seen: dict[str, str]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    SEEN_PATH.write_text(
        json.dumps(seen, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8"
    )


def append_raw(items: list[RawItem]) -> None:
    """按天分文件追加（append-only）。"""
    if not items:
        return
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    by_day: dict[str, list[RawItem]] = {}
    for item in items:
        day = item.collected_at[:10]
        by_day.setdefault(day, []).append(item)
    for day, day_items in by_day.items():
        path = RAW_DIR / f"{day}.jsonl"
        with open(path, "a", encoding="utf-8") as f:
            for item in day_items:
                f.write(item.model_dump_json() + "\n")


def load_health() -> dict[str, SourceHealthState]:
    if HEALTH_PATH.exists():
        raw = json.loads(HEALTH_PATH.read_text(encoding="utf-8"))
        return {k: SourceHealthState.model_validate(v) for k, v in raw.items()}
    return {}


def save_health(health: dict[str, SourceHealthState]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {k: v.model_dump() for k, v in sorted(health.items())}
    HEALTH_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def update_health(
    health: dict[str, SourceHealthState],
    source_id: str,
    ok: bool,
    items: int,
    error: str | None = None,
) -> None:
    state = health.setdefault(source_id, SourceHealthState())
    ts = now_iso()
    state.last_collected_at = ts
    state.items_last_run = items
    if ok:
        state.status = "healthy"
        state.last_success = ts
        state.last_error = None
    else:
        # 连续失败标记 failed；单次失败记 degraded，保留原 last_success
        state.status = "failed" if state.status == "failed" else "degraded"
        state.last_error = error
