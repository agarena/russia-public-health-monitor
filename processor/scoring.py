"""状态建议引擎：attention score + O/L/C 建议值。

铁律（规格书 §27、§33）：
- 这里输出的永远是「建议」，生效必须经维护者通过 processor.ratings apply 确认；
- 阶段推进只认证据：社交热搜、大 V、转载量、情绪化标题一律不参与；
- 死亡人数、报道数量、转发数量不会自动提升等级。
"""
import re
from datetime import UTC, datetime

from processor.dedup import days_ago

# 各观察阶段的证据关键词（对 title_original + title_zh + summary_zh 匹配）
PHASE_RULES: list[tuple[str, list[str]]] = [
    (
        "O8",
        ["输入性病例", "中国境内", "入境排查", "imported case", "China case", "Chinese citizen"],
    ),
    (
        "O7",
        ["境外", "跨境", "abroad", "outside Russia", "cross-border", "neighboring country"],
    ),
    (
        "O6",
        ["其他地区", "外地病例", "莫斯科", "another region", "Moscow",
         "St. Petersburg", "other regions"],
    ),
    (
        "O5",
        ["多个传播链", "multiple chains", "独立传播链"],
    ),
    (
        "O4",
        ["人际传播", "人传人", "家庭聚集", "医护人员感染", "human-to-human", "family cluster",
         "transmission between", "медработник.*зараз", "передаётся от человека"],
    ),
    (
        "O3",
        ["病原体确认", "测序", "培养阳性", "PCR 确认", "实验室确认", "pathogen identified",
         "sequenc", "genome", "culture positive", "лаборатория подтвердила", "возбудитель выделен"],
    ),
    (
        "O2",
        ["第二例", "第二宗", "second case", "second employee", "second worker", "второй случ",
         "второй сотрудник", "接触者.*发病", "contact.*developed", "additional case"],
    ),
    (
        "O1",
        ["不明原因肺炎", "不明病因", "pneumonia of unknown", "пневмония неустановленн",
         "重症肺炎", "severe pneumonia", "противочумн", "anti-plague"],
    ),
]

DEATH_PATTERN = re.compile(r"死亡|病逝|去世|died|death|умерла|погиб", re.I)
MEASURE_PATTERN = re.compile(
    r"隔离|检疫|医学观察|旅行提醒|quarantine|travel alert|изоляц|карантин|наблюдение", re.I
)
PLAGUE_SUSPECT_PATTERN = re.compile(r"鼠疫|疑似鼠疫|plague|чума|чумн", re.I)

# 否认 / 待核实 / 传闻语境：O2 及以上的关键词命中若只出现在这类语境中，不构成推进证据
NEGATIVE_CONTEXT = re.compile(
    r"否认|称为不实|不实信息|驳斥|传闻|未经证实|opроверг|не подтвержд|den(ies|ied)|rejected|"
    r"要求核实|核实.{0,8}报道|requested verification|seeking.{0,20}verification|unverified|rumor",
    re.I,
)


def _text_of(signal: dict) -> str:
    return " ".join(
        str(signal.get(k) or "") for k in ("title_original", "title_zh", "summary_zh")
    )


def _evidence_signals(signals: list[dict]) -> list[dict]:
    """参与判断的证据信号：confirmed（任意等级）或 C2+ 的 reported。"""
    out = []
    for s in signals:
        if s.get("status") == "confirmed":
            out.append(s)
        elif s.get("status") == "reported" and s.get("confidence") in ("C2", "C3", "C4"):
            out.append(s)
    return out


def suggest_phase(signals: list[dict]) -> tuple[str, list[str]]:
    """返回 (建议阶段, 依据的 signal id 列表)。取有证据支持的最高阶段。

    O2 及以上：关键词命中必须不在否认/待核实语境中（NEGATIVE_CONTEXT），
    否则该信号不构成阶段推进证据（规格书 §27：阶段变化必须具有证据基础）。
    """
    evidence = _evidence_signals(signals)
    for phase, patterns in PHASE_RULES:
        hits = []
        for s in evidence:
            text = _text_of(s)
            if not any(re.search(p, text, re.I) for p in patterns):
                continue
            if phase not in ("O0", "O1") and NEGATIVE_CONTEXT.search(text):
                continue
            hits.append(s["id"])
        # O8/O7/O6/O5/O4/O3 需要 C3 级证据或 confirmed；O2/O1 允许 C2
        if phase in ("O2", "O1"):
            if hits:
                return phase, hits
        elif hits and all(
            _signal_grade(s) >= 3 for s in evidence if s["id"] in hits
        ):
            return phase, hits
    return "O0", []


def _signal_grade(s: dict) -> int:
    return int(str(s.get("confidence", "C0"))[1])


def compute_attention_score(signals: list[dict], weights: dict | None = None) -> dict:
    """内部 attention score（0-100），权重来自 settings；前端不显示数字。"""
    from collector.config import load_settings

    w = weights or load_settings().get("attention_score_weights", {})
    evidence = _evidence_signals(signals)
    now = datetime.now(UTC)
    recent_72h = [s for s in evidence if (days_ago(s.get("published_at"), now) or 99) <= 3]

    def has(pattern: re.Pattern, min_grade: int = 2) -> list[dict]:
        return [
            s for s in evidence
            if pattern.search(_text_of(s)) and _signal_grade(s) >= min_grade
        ]

    transmission = has(re.compile(r"人际传播|人传人|human-to-human|передаётся", re.I), 3)
    geographic = has(re.compile(r"其他地区|another region|Moscow|境外|abroad", re.I), 3)
    deaths = has(DEATH_PATTERN, 3)
    pathogen = has(PLAGUE_SUSPECT_PATTERN, 1)  # 病原相关性：鼠疫怀疑本身即相关
    measures = has(MEASURE_PATTERN, 3)

    def flag(present: bool) -> float:
        return 1.0 if present else 0.0

    components = {
        "transmission_evidence": w.get("transmission_evidence", 35) * flag(bool(transmission)),
        "geographic_spread": w.get("geographic_spread", 20) * flag(bool(geographic)),
        "information_velocity": w.get("information_velocity", 15)
        * min(len(recent_72h) / 8, 1.0),
        "severity": w.get("severity", 10) * flag(bool(deaths)),
        "pathogen_relevance": w.get("pathogen_relevance", 10) * flag(bool(pathogen)),
        "official_measure_change": w.get("official_measure_change", 10) * flag(bool(measures)),
    }
    total = round(sum(components.values()))
    return {
        "score": min(total, 100),
        "components": {k: round(v, 1) for k, v in components.items()},
        "recent_evidence_72h": len(recent_72h),
    }


def suggest_level(signals: list[dict]) -> tuple[str, str]:
    score = compute_attention_score(signals)
    s = score["score"]
    if s >= 75:
        return "L3", f"attention score {s}（多个重要传播/扩散/措施信号）"
    if s >= 40:
        return "L2", f"attention score {s}（多个重要升级信号）"
    if s > 0:
        return "L1", f"attention score {s}（存在异常信息，继续观察）"
    return "L0", "无明显变化"


def suggest_confidence(signals: list[dict]) -> str:
    """核心事实（病例存在/官方动作）的证据完整度。"""
    confirmed = [s for s in signals if s.get("status") == "confirmed"]
    independent = {
        s.get("origin_source_id") or s.get("source_id") for s in confirmed
    }
    if len(confirmed) >= 2 and len(independent) >= 2:
        return "C4" if len(independent) >= 3 else "C3"
    if confirmed:
        return "C3"
    reported = [s for s in signals if s.get("status") == "reported"]
    if reported:
        return "C2"
    return "C1"


def suggest_trend(signals: list[dict]) -> str:
    """趋势 = 公开信息变化，不是疫情趋势。"""
    now = datetime.now(UTC)
    recent = [s for s in signals if (days_ago(s.get("published_at"), now) or 99) <= 3]
    previous = [
        s
        for s in signals
        if 3 < (days_ago(s.get("published_at"), now) or 0) <= 6
    ]
    if len(recent) + len(previous) < 5:
        return "insufficient"
    if len(recent) >= max(2 * len(previous), 3):
        return "up"
    if len(recent) * 2 <= len(previous):
        return "down"
    return "stable"


def build_suggestion(signals: list[dict]) -> dict:
    phase, phase_evidence = suggest_phase(signals)
    level, level_reason = suggest_level(signals)
    return {
        "suggested_observation_phase": phase,
        "phase_evidence_signal_ids": phase_evidence,
        "suggested_attention_level": level,
        "level_reason": level_reason,
        "suggested_confidence": suggest_confidence(signals),
        "suggested_trend": suggest_trend(signals),
        "attention_score": compute_attention_score(signals),
    }
