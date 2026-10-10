"""合规门禁：schema 校验 + 禁词扫描 + 首页上限校验。

扫描范围：data/mock、data/public-data（如存在）、data/history 中的数据文件。
豁免规则：
  - signal.is_quotation = true 的条目（内容为来源原话，保留原文属引用行为）；
  - title_original / name 等归属原文的字段；
  - 前端源码不扫描——免责声明与方法论页面对禁词的否定性陈述是合规内容。

退出码：0 通过，1 存在违规。CI 与发布流程以本模块为门禁。
"""
import json
import re
import sys
from collections.abc import Iterator
from pathlib import Path

from processor.models import (
    CasesFile,
    Event,
    HistoryFile,
    RatingChangesFile,
    SignalsFile,
    SourcesFile,
    StatusFile,
    TimelineFile,
    TransmissionFile,
)

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "settings.yaml"

FILE_MODELS = {
    "event.json": Event,
    "signals.json": SignalsFile,
    "sources.json": SourcesFile,
    "timeline.json": TimelineFile,
    "cases.json": CasesFile,
    "transmission.json": TransmissionFile,
    "status.json": StatusFile,
    "history-cases.json": HistoryFile,
    "rating-changes.json": RatingChangesFile,
}

# 归属原文、不参与禁词扫描的字段名
EXEMPT_FIELDS = {"title_original", "name", "name_en", "url"}


def load_settings() -> dict:
    import yaml

    with open(CONFIG_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def compile_patterns(settings: dict) -> list[re.Pattern[str]]:
    return [re.compile(p) for p in settings.get("banned_patterns", [])]


def iter_scan_strings(obj: object, pointer: str = "") -> Iterator[tuple[str, str]]:
    """递归收集需要扫描的字符串字段（pointer, value）。"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            child = f"{pointer}/{key}"
            if isinstance(value, str):
                if key not in EXEMPT_FIELDS:
                    yield child, value
            else:
                yield from iter_scan_strings(value, child)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            yield from iter_scan_strings(item, f"{pointer}[{i}]")


def scan_obj(obj: object, patterns: list[re.Pattern[str]]) -> list[str]:
    violations = []
    for pointer, value in iter_scan_strings(obj):
        if isinstance(obj, dict) and obj.get("is_quotation"):
            continue
        for pat in patterns:
            if pat.search(value):
                violations.append(f"{pointer} 命中禁词「{pat.pattern}」：{value[:60]}")
    return violations


def scan_signal(signal: dict, patterns: list[re.Pattern[str]]) -> list[str]:
    if signal.get("is_quotation"):
        # 引用条目只扫描结构字段外的归属说明？——引用即来源原话，整体豁免，
        # 但仍保留在数据中并强制显示「来源原话」标识（由前端与 schema 保证）。
        return []
    violations = []
    for field in ("title_zh", "summary_zh"):
        value = signal.get(field) or ""
        for pat in patterns:
            if pat.search(value):
                violations.append(
                    f"signals/{signal.get('id')}/{field} 命中禁词「{pat.pattern}」：{value[:60]}"
                )
    return violations


def validate_file(path: Path) -> tuple[object | None, list[str]]:
    errors: list[str] = []
    model_cls = FILE_MODELS.get(path.name)
    try:
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
    except json.JSONDecodeError as e:
        return None, [f"{path}: JSON 解析失败：{e}"]
    if model_cls is None:
        return raw, []
    try:
        validated = model_cls.model_validate(raw)
        return validated, []
    except Exception as e:  # pydantic ValidationError
        errors.append(f"{path}: schema 校验失败：{e}")
        return None, errors


def check_caps(event: Event, caps: dict) -> list[str]:
    errors = []
    for field, cap in caps.items():
        value = getattr(event, field, None)
        if isinstance(value, list) and len(value) > cap:
            errors.append(f"event.{field} 共 {len(value)} 条，超过上限 {cap}")
    return errors


def check_reference_integrity(data: dict[str, object]) -> list[str]:
    """signal_ids / source_ids 引用完整性。"""
    warnings = []
    signals = data.get("signals.json")
    sources = data.get("sources.json")
    signal_ids = (
        {s.id for s in signals.signals} if isinstance(signals, SignalsFile) else set()
    )
    source_ids = (
        {s.id for s in sources.sources} if isinstance(sources, SourcesFile) else set()
    )
    event = data.get("event.json")
    if isinstance(event, Event):
        for group in ("confirmed", "unconfirmed"):
            for item in getattr(event, group):
                for sid in item.signal_ids:
                    if sid not in signal_ids:
                        warnings.append(f"event.{group} 引用了不存在的 signal：{sid}")
    timeline = data.get("timeline.json")
    if isinstance(timeline, TimelineFile):
        for entry in timeline.entries:
            for sid in entry.source_ids:
                if sid not in signal_ids:
                    warnings.append(f"timeline/{entry.id} 引用了不存在的 signal：{sid}")
    if isinstance(signals, SignalsFile) and isinstance(sources, SourcesFile):
        for sig in signals.signals:
            if sig.source_id not in source_ids:
                warnings.append(f"signals/{sig.id} 引用了不存在的 source：{sig.source_id}")
    return warnings


def data_dirs() -> list[Path]:
    dirs = [ROOT / "data" / "mock", ROOT / "data" / "history"]
    public = ROOT / "data" / "public-data"
    if public.exists():
        dirs.append(public)
    return dirs


def run() -> int:
    settings = load_settings()
    patterns = compile_patterns(settings)
    caps = settings.get("homepage_caps", {})
    problems: list[str] = []
    warnings: list[str] = []
    validated_by_name: dict[str, object] = {}

    for d in data_dirs():
        if not d.exists():
            continue
        for path in sorted(d.glob("*.json")):
            validated, errors = validate_file(path)
            problems.extend(errors)
            if validated is not None:
                validated_by_name[f"{path.parent.name}/{path.name}"] = validated

    # 禁词扫描
    for name, obj in validated_by_name.items():
        if isinstance(obj, SignalsFile):
            for sig in obj.signals:
                problems.extend(
                    f"{name}/{v}" for v in scan_signal(sig.model_dump(by_alias=True), patterns)
                )
        else:
            problems.extend(f"{name}/{v}" for v in scan_obj(obj.model_dump(), patterns))

    # 上限校验（对 event 生效）
    event_obj = None
    for name, obj in validated_by_name.items():
        if name.endswith("event.json") and isinstance(obj, Event):
            if event_obj is not None:
                problems.append("存在多个 event.json（mock 与 public-data 同时有效）")
            problems.extend(f"{name}: {v}" for v in check_caps(obj, caps))
            event_obj = obj

    # 引用完整性
    warnings.extend(check_reference_integrity(validated_by_name))

    for w in warnings:
        print(f"  [warn] {w}")
    if problems:
        print("\n合规门禁未通过：")
        for p in problems:
            print(f"  [error] {p}")
        return 1
    print(
        f"合规门禁通过：{len(validated_by_name)} 个数据文件校验成功，"
        f"{len(patterns)} 条禁词规则，{len(warnings)} 条警告。"
    )
    return 0


if __name__ == "__main__":
    sys.exit(run())
