"""数据模型：与 frontend/src/types.ts 一一对应的 pydantic 模型。

所有模型 extra="forbid"，字段拼写错误会在校验时立即暴露。
"""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ObservationPhase = Literal[
    "O0", "O1", "O2", "O3", "O4", "O5", "O6", "O7", "O8"
]
AttentionLevel = Literal["L0", "L1", "L2", "L3"]
EvidenceConfidence = Literal["C0", "C1", "C2", "C3", "C4"]
Trend = Literal["up", "stable", "down", "insufficient"]
EventLifecycle = Literal["active", "stabilizing", "closed"]
SignalStatus = Literal[
    "confirmed", "reported", "unconfirmed", "contradicted", "retracted", "unknown"
]
SourceTier = Literal["S", "A", "B", "C", "D"]
SourceType = Literal[
    "official", "international_media", "local_media", "expert", "social"
]
CollectionStatus = Literal["healthy", "degraded", "stale", "failed"]
Importance = Literal["high", "medium", "low"]
LanguageCode = Literal["ru", "en", "zh", "other"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class KeyChange(StrictModel):
    text: str
    at: str
    signal_ids: list[str] = []


class RefItem(StrictModel):
    text: str
    signal_ids: list[str] = []
    note: str | None = None


class UnknownItem(StrictModel):
    id: str
    question: str
    importance: Importance
    status: Literal["unresolved", "resolved"]
    why_it_matters: str


class NextTrigger(StrictModel):
    id: str
    condition: str
    current_phase: ObservationPhase
    potential_next_phase: ObservationPhase
    evidence_required: Literal["high", "medium", "low"]


class Event(StrictModel):
    id: str
    title: str
    title_en: str
    status: EventLifecycle
    demo: bool
    first_seen: str
    last_updated: str
    observation_phase: ObservationPhase
    attention_level: AttentionLevel
    confidence: EvidenceConfidence
    trend: Trend
    summary: str
    key_changes: list[KeyChange] = []
    confirmed: list[RefItem] = []
    unconfirmed: list[RefItem] = []
    unknowns: list[UnknownItem] = []
    next_triggers: list[NextTrigger] = []


class Signal(StrictModel):
    id: str
    event_id: str
    published_at: str
    collected_at: str
    language: LanguageCode
    source_id: str
    source_tier: SourceTier
    title_original: str
    title_zh: str
    summary_zh: str
    status: SignalStatus
    confidence: EvidenceConfidence
    independent_source_count: int
    origin_source_id: str | None = None
    derived_from: list[str] = []
    url: str
    importance: float
    is_quotation: bool = False
    demo: bool | None = None


class SignalsFile(StrictModel):
    updated_at: str
    signals: list[Signal]


class SourceRecord(StrictModel):
    id: str
    name: str
    name_zh: str | None = None
    type: SourceType
    tier: SourceTier
    language: LanguageCode
    country_or_region: str
    official: bool
    url: str
    description_zh: str | None = None
    collection_status: CollectionStatus
    last_collected_at: str | None = None


class SourceRelation(StrictModel):
    # pydantic 中 "from" 是保留字，用 alias 处理
    from_: str = Field(..., alias="from")
    to: str
    type: Literal["cites", "aggregates"]
    note_zh: str | None = None

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class SourcesFile(StrictModel):
    updated_at: str
    sources: list[SourceRecord]
    relations: list[SourceRelation]


class Correction(StrictModel):
    previous_status: SignalStatus
    note: str
    at: str


class TimelineEntry(StrictModel):
    id: str
    date: str
    date_precision: Literal["day", "month"]
    title: str
    description: str
    status: SignalStatus
    source_ids: list[str]
    correction: Correction | None = None


class TimelineFile(StrictModel):
    updated_at: str
    entries: list[TimelineEntry]


class CaseRecord(StrictModel):
    id: str
    event_id: str
    age_group: Literal["child", "teen", "adult", "elderly"] | None = None
    location: str | None = None
    occupation: str | None = None
    onset_date: str | None = None
    exposure: str | None = None
    status: SignalStatus
    source_ids: list[str]


class CasesFile(StrictModel):
    updated_at: str
    cases: list[CaseRecord]


class TransmissionLink(StrictModel):
    source_case: str
    target_case: str
    relationship_type: str
    status: Literal["confirmed", "possible", "unknown"]
    confidence: EvidenceConfidence
    source_ids: list[str]


class TransmissionFile(StrictModel):
    updated_at: str
    links: list[TransmissionLink]


class SourceHealthEntry(StrictModel):
    id: str
    name: str
    status: CollectionStatus


class StatusFile(StrictModel):
    generated_at: str
    last_successful_collection: str
    sources_healthy: int
    sources_total: int
    source_health: list[SourceHealthEntry]
    demo: bool


class HistoryTimelinePoint(StrictModel):
    date: str
    text: str


class HistoryCase(StrictModel):
    id: str
    name: str
    name_zh: str
    period: str
    region: str
    summary_zh: str
    similarity: Literal["low", "medium", "high"]
    similarity_reason_zh: str
    similar: list[str]
    different: list[str]
    early_timeline: list[HistoryTimelinePoint]
    valuable_early_signals: list[str]
    later_disproven: list[str]
    sources: list[dict[str, str]]


class HistoryFile(StrictModel):
    updated_at: str
    note_zh: str
    cases: list[HistoryCase]


class RatingChange(StrictModel):
    timestamp: str
    dimension: Literal["observation_phase", "attention_level", "confidence", "trend"]
    from_: str = Field(..., alias="from")
    to: str
    reason: str
    source_ids: list[str] = []

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class RatingChangesFile(StrictModel):
    updated_at: str
    changes: list[RatingChange]
