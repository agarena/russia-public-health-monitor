// 全项目共享的数据类型定义（与规格书 §59–§65 及 processor/models.py 保持一致）。

export type ObservationPhase =
  | "O0" | "O1" | "O2" | "O3" | "O4" | "O5" | "O6" | "O7" | "O8";
export type AttentionLevel = "L0" | "L1" | "L2" | "L3";
export type EvidenceConfidence = "C0" | "C1" | "C2" | "C3" | "C4";
export type Trend = "up" | "stable" | "down" | "insufficient";
export type EventLifecycle = "active" | "stabilizing" | "closed";
export type SignalStatus =
  | "confirmed" | "reported" | "unconfirmed" | "contradicted" | "retracted" | "unknown";
export type SourceTier = "S" | "A" | "B" | "C" | "D";
export type SourceType =
  | "official" | "international_media" | "local_media" | "expert" | "social";
export type CollectionStatus = "healthy" | "degraded" | "stale" | "failed";
export type Importance = "high" | "medium" | "low";
export type LanguageCode = "ru" | "en" | "zh" | "other";

/** 首页引用型条目：文本 + 可追溯的 signal 编号 */
export interface RefItem {
  text: string;
  signal_ids?: string[];
  note?: string;
}

export interface KeyChange extends RefItem {
  /** 变化发生日期（YYYY-MM-DD） */
  at: string;
}

export interface UnknownItem {
  id: string;
  question: string;
  importance: Importance;
  status: "unresolved" | "resolved";
  why_it_matters: string;
}

export interface NextTrigger {
  id: string;
  condition: string;
  current_phase: ObservationPhase;
  potential_next_phase: ObservationPhase;
  evidence_required: "high" | "medium" | "low";
}

/** 中国相关公开信息观察（O8 的展示区块；只陈述公开信息变化，不做风险判断） */
export interface ChinaWatch {
  status: "no_change" | "notable";
  summary_zh: string;
  observed: string[];
  not_observed: string[];
  next_watch: string[];
}

export interface EventData {
  id: string;
  title: string;
  title_en: string;
  status: EventLifecycle;
  /** true 表示当前为演示数据，站点会显示醒目横幅并 noindex */
  demo: boolean;
  first_seen: string;
  last_updated: string;
  observation_phase: ObservationPhase;
  attention_level: AttentionLevel;
  confidence: EvidenceConfidence;
  trend: Trend;
  summary: string;
  key_changes: KeyChange[];
  confirmed: RefItem[];
  unconfirmed: RefItem[];
  unknowns: UnknownItem[];
  next_triggers: NextTrigger[];
  china_watch?: ChinaWatch;
}

export interface Signal {
  id: string;
  event_id: string;
  published_at: string;
  collected_at: string;
  language: LanguageCode;
  source_id: string;
  source_tier: SourceTier;
  title_original: string;
  title_zh: string;
  summary_zh: string;
  status: SignalStatus;
  confidence: EvidenceConfidence;
  independent_source_count: number;
  origin_source_id?: string | null;
  derived_from?: string[];
  url: string;
  importance: number;
  /** true 表示内容为来源原话引用（合规扫描豁免） */
  is_quotation?: boolean;
  demo?: boolean;
}

export interface SignalsFile {
  updated_at: string;
  signals: Signal[];
}

export interface SourceRecord {
  id: string;
  name: string;
  name_zh?: string;
  type: SourceType;
  tier: SourceTier;
  language: LanguageCode;
  country_or_region: string;
  official: boolean;
  url: string;
  description_zh?: string;
  collection_status: CollectionStatus;
  last_collected_at?: string | null;
}

export interface SourceRelation {
  from: string;
  to: string;
  type: "cites" | "aggregates";
  note_zh?: string;
}

export interface SourcesFile {
  updated_at: string;
  sources: SourceRecord[];
  relations: SourceRelation[];
}

export interface TimelineEntry {
  id: string;
  /** YYYY-MM-DD 或 YYYY-MM（按 date_precision） */
  date: string;
  date_precision: "day" | "month";
  title: string;
  description: string;
  status: SignalStatus;
  source_ids: string[];
  /** 纠错信息：保留原状态，追加更正说明，不删除历史 */
  correction?: {
    previous_status: SignalStatus;
    note: string;
    at: string;
  };
}

export interface TimelineFile {
  updated_at: string;
  entries: TimelineEntry[];
}

export interface CaseRecord {
  id: string;
  event_id: string;
  age_group?: "child" | "teen" | "adult" | "elderly" | null;
  location?: string | null;
  occupation?: string | null;
  onset_date?: string | null;
  exposure?: string | null;
  status: SignalStatus;
  source_ids: string[];
}

export interface CasesFile {
  updated_at: string;
  cases: CaseRecord[];
}

export interface TransmissionLink {
  source_case: string;
  target_case: string;
  relationship_type: string;
  status: "confirmed" | "possible" | "unknown";
  confidence: EvidenceConfidence;
  source_ids: string[];
}

export interface TransmissionFile {
  updated_at: string;
  links: TransmissionLink[];
}

export interface SourceHealthEntry {
  id: string;
  name: string;
  status: CollectionStatus;
}

export interface StatusFile {
  generated_at: string;
  last_successful_collection: string;
  sources_healthy: number;
  sources_total: number;
  source_health: SourceHealthEntry[];
  demo: boolean;
}

export interface RatingChange {
  timestamp: string;
  dimension: "observation_phase" | "attention_level" | "confidence" | "trend";
  from: string;
  to: string;
  reason: string;
  source_ids: string[];
}

export interface RatingChangesFile {
  updated_at: string;
  changes: RatingChange[];
}

export interface HistoryTimelinePoint {
  date: string;
  text: string;
}

export interface HistoryCase {
  id: string;
  name: string;
  name_zh: string;
  period: string;
  region: string;
  summary_zh: string;
  similarity: "low" | "medium" | "high";
  similarity_reason_zh: string;
  similar: string[];
  different: string[];
  early_timeline: HistoryTimelinePoint[];
  valuable_early_signals: string[];
  later_disproven: string[];
  sources: { name: string; url: string }[];
}
