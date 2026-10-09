"""公开数据生成：data/state（signals.jsonl + manual/* + source_health）→ data/public-data。

安全性质：
- 原子发布：先写入 data/public-data.tmp，schema 校验通过后整体替换；
- last-known-good：替换前把旧目录挪到 data/public-data.prev，
  校验失败时不动 data/public-data（上一版数据不受影响）；
- 只读 data/state 与 config，不修改任何人工维护内容。
"""
import json
import shutil
import sys
from pathlib import Path

from collector.config import load_sources
from collector.models import SourceHealthState
from collector.util import now_iso
from processor.models import (
    CasesFile,
    Event,
    RatingChangesFile,
    SignalsFile,
    SourcesFile,
    StatusFile,
    TimelineFile,
    TransmissionFile,
)

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / "data" / "state"
MANUAL_DIR = STATE_DIR / "manual"
PUBLIC_DIR = ROOT / "data" / "public-data"
TMP_DIR = ROOT / "data" / "public-data.tmp"
PREV_DIR = ROOT / "data" / "public-data.prev"


def _read_json(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_signals_jsonl() -> list[dict]:
    """append-only 信号库：同一 id 后行覆盖前行（状态流转以最新为准，历史在 git 与
    raw 中保留）。"""
    path = STATE_DIR / "signals.jsonl"
    if not path.exists():
        return []
    merged: dict[str, dict] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        item = json.loads(line)
        merged[item["id"]] = item
    return list(merged.values())


def build_outputs() -> dict[str, object]:
    ts = now_iso()
    signals_raw = sorted(
        load_signals_jsonl(), key=lambda s: s.get("published_at", ""), reverse=True
    )
    signals = SignalsFile.model_validate({"updated_at": ts, "signals": signals_raw})

    # 来源：注册表 + 采集健康状态
    health_path = STATE_DIR / "source_health.json"
    health_raw = _read_json(health_path) if health_path.exists() else {}
    health = {k: SourceHealthState.model_validate(v) for k, v in health_raw.items()}
    source_entries = []
    for cfg in load_sources():
        h = health.get(cfg.id)
        source_entries.append(
            {
                "id": cfg.id,
                "name": cfg.name,
                "name_zh": cfg.name_zh,
                "type": cfg.type,
                "tier": cfg.tier,
                "language": cfg.language,
                "country_or_region": cfg.country_or_region,
                "official": cfg.official,
                "url": cfg.url,
                "description_zh": cfg.description_zh,
                "collection_status": h.status if h else "stale",
                "last_collected_at": h.last_collected_at if h else None,
            }
        )
    relations_path = MANUAL_DIR / "source_relations.json"
    relations = _read_json(relations_path) if relations_path.exists() else []
    sources_out = SourcesFile.model_validate(
        {"updated_at": ts, "sources": source_entries, "relations": relations}
    )

    event = Event.model_validate(_read_json(MANUAL_DIR / "event.json"))
    timeline = TimelineFile.model_validate(_read_json(MANUAL_DIR / "timeline.json"))
    cases = CasesFile.model_validate(_read_json(MANUAL_DIR / "cases.json"))
    transmission = TransmissionFile.model_validate(_read_json(MANUAL_DIR / "transmission.json"))

    status = StatusFile.model_validate(
        {
            "generated_at": ts,
            "last_successful_collection": max(
                (h.last_success for h in health.values() if h.last_success), default=ts
            ),
            "sources_healthy": sum(1 for h in health.values() if h.status == "healthy"),
            "sources_total": len(source_entries),
            "source_health": [
                {"id": s["id"], "name": s["name_zh"] or s["name"], "status": s["collection_status"]}
                for s in source_entries
            ],
            "demo": False,
        }
    )

    # 评级变更记录（可审计：每次 O/L/C/趋势变化都带理由与来源）
    changes_path = STATE_DIR / "rating_changes.json"
    if changes_path.exists():
        raw_changes = _read_json(changes_path)
        changes_out = RatingChangesFile.model_validate(
            {"updated_at": ts, "changes": raw_changes.get("changes", [])}
        )
    else:
        changes_out = RatingChangesFile.model_validate({"updated_at": ts, "changes": []})

    return {
        "event.json": event,
        "signals.json": signals,
        "sources.json": sources_out,
        "timeline.json": timeline,
        "cases.json": cases,
        "transmission.json": transmission,
        "status.json": status,
        "rating-changes.json": changes_out,
    }


def publish(outputs: dict[str, object]) -> None:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    for name, model in outputs.items():
        # by_alias=True：带别名的字段（如 SourceRelation.from_ → from）按对外字段名输出
        (TMP_DIR / name).write_text(
            model.model_dump_json(indent=2, by_alias=True), encoding="utf-8"
        )
    # 校验（能 build 出来即已通过 pydantic；再跑一遍文件级反序列化确认落盘无损）
    for name in outputs:
        _read_json(TMP_DIR / name)

    if PUBLIC_DIR.exists():
        if PREV_DIR.exists():
            shutil.rmtree(PREV_DIR)
        PUBLIC_DIR.rename(PREV_DIR)
    TMP_DIR.rename(PUBLIC_DIR)


def run() -> int:
    outputs = build_outputs()
    publish(outputs)
    n_signals = len(outputs["signals.json"].signals)  # type: ignore[attr-defined]
    print(
        f"public-data 已生成：{n_signals} 条信号，"
        f"{outputs['status.json'].sources_healthy}/{outputs['status.json'].sources_total} 来源正常"  # type: ignore[attr-defined]
    )
    return 0


if __name__ == "__main__":
    sys.exit(run())
