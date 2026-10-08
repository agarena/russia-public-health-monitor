// 统一的徽章/圆点组件：颜色一律与文字并存（规格书 §92）。
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  COLLECTION_STATUS_LABELS,
  IMPORTANCE_LABELS,
  TREND_META,
  confidenceMeta,
  levelMeta,
  phaseMeta,
  signalStatusMeta,
  tierMeta,
} from "@/lib/constants";
import type {
  AttentionLevel,
  CollectionStatus,
  EvidenceConfidence,
  Importance,
  ObservationPhase,
  SignalStatus,
  SourceTier,
  Trend,
} from "@/types";

const base = "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium";

export function SignalStatusChip({ status }: { status: SignalStatus }) {
  const meta = signalStatusMeta(status);
  return <span className={`${base} ${meta.badge}`}>{meta.label}</span>;
}

export function TierBadge({ tier }: { tier: SourceTier }) {
  const meta = tierMeta(tier);
  return (
    <span className={`${base} ${meta.badge}`} title={meta.description}>
      {meta.code}级
    </span>
  );
}

export function LevelChip({ level }: { level: AttentionLevel }) {
  const meta = levelMeta(level);
  return (
    <span className={`${base} ${meta.badge}`}>
      {meta.emoji} {meta.code}｜{meta.label}
    </span>
  );
}

export function PhaseChip({ phase }: { phase: ObservationPhase }) {
  const meta = phaseMeta(phase);
  return (
    <span className={`${base} border-slate-200 bg-slate-50 text-slate-800`}>
      {meta.code}｜{meta.label}
    </span>
  );
}

export function ConfidenceChip({ confidence }: { confidence: EvidenceConfidence }) {
  const meta = confidenceMeta(confidence);
  return (
    <span
      className={`${base} border-slate-200 bg-white text-slate-700`}
      title={meta.description}
    >
      {meta.code}｜{meta.label}
    </span>
  );
}

export function TrendChip({ trend }: { trend: Trend }) {
  const meta = TREND_META[trend];
  return (
    <span className={`${base} border-slate-200 bg-slate-50 text-slate-700`}>
      趋势 {meta.symbol} {meta.label}
    </span>
  );
}

export function ImportanceChip({ importance }: { importance: Importance }) {
  return (
    <span className={`${base} border-slate-200 bg-slate-50 text-slate-600`}>
      重要性 {IMPORTANCE_LABELS[importance]}
    </span>
  );
}

export function CollectionDot({ status }: { status: CollectionStatus }) {
  const meta = COLLECTION_STATUS_LABELS[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

/** 外部链接（原始来源） */
export function ExternalLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
    >
      {children ?? "原文 ↗"}
    </a>
  );
}

/** 来源徽章：链接到 /sources 页对应锚点 */
export function SourceChip({ id, name }: { id: string; name: string }) {
  return (
    <Link
      to={`/sources#${id}`}
      className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
      title={`查看来源：${name}`}
    >
      {name}
    </Link>
  );
}
