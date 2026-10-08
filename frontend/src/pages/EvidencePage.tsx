// 证据页：已确认 / 公开报道 / 尚未确认 / 来源冲突 四栏 + Unknown 独立一栏（规格书 §83）；
// 已撤回信息单独保留；并整理公开病例信息与传播关系（规格书 §41、§42）。
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cases, signalById, signals, sourceById, sourceName, transmissionLinks } from "@/data";
import { LANGUAGE_LABELS, confidenceMeta } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { usePageMeta } from "@/lib/usePageMeta";
import { PageIntro, SectionCard } from "@/components/Cards";
import {
  ConfidenceChip,
  ExternalLink,
  SignalStatusChip,
  SourceChip,
  TierBadge,
} from "@/components/Badges";
import type { Signal, SignalStatus } from "@/types";

const AGE_GROUP_LABELS: Record<string, string> = {
  child: "儿童",
  teen: "青少年",
  adult: "成人",
  elderly: "老年",
};

function SignalCard({ signal }: { signal: Signal }) {
  const source = sourceById.get(signal.source_id);
  const isDerived =
    (signal.derived_from?.length ?? 0) > 0 ||
    (signal.origin_source_id != null && signal.origin_source_id !== signal.source_id);
  return (
    <article
      id={`signal-${signal.id}`}
      className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-3"
    >
      <h3 className="text-sm font-medium leading-snug text-slate-900">{signal.title_zh}</h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <TierBadge tier={signal.source_tier} />
        {source && <SourceChip id={source.id} name={source.name_zh ?? source.name} />}
        <span>{formatDate(signal.published_at)}</span>
        <span>{LANGUAGE_LABELS[signal.language] ?? signal.language}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{signal.summary_zh}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <ConfidenceChip confidence={signal.confidence} />
        <span>独立来源 ×{signal.independent_source_count}</span>
      </div>
      {isDerived && (
        <p className="mt-1.5 rounded bg-slate-50 px-2 py-1 text-[11px] leading-relaxed text-slate-500">
          转载/引用关系：信息源头为
          {signal.origin_source_id ? `「${sourceName(signal.origin_source_id)}」` : "其他来源"}
          ；本条不重复计入独立来源。
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <details className="text-[11px] text-slate-400">
          <summary className="cursor-pointer select-none">原文标题</summary>
          <span lang={signal.language}>{signal.title_original}</span>
        </details>
        <ExternalLink href={signal.url} />
      </div>
    </article>
  );
}

function CaseSources({ sourceIds }: { sourceIds: string[] }) {
  const resolved = sourceIds
    .map((sid) => signalById.get(sid))
    .filter((s): s is Signal => s != null)
    .map((s) => ({ id: s.source_id, name: sourceName(s.source_id) }));
  if (resolved.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <span className="text-[11px] text-slate-400">来源：</span>
      {resolved.map((r) => (
        <SourceChip key={r.id + r.name} id={r.id} name={r.name} />
      ))}
    </div>
  );
}

function StatusColumn({
  status,
  title,
  hint,
  signalsPool,
}: {
  status: SignalStatus;
  title: string;
  hint: string;
  signalsPool: Signal[];
}) {
  const list = signalsPool
    .filter((s) => s.status === status)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mb-2 mt-0.5 text-[11px] text-slate-400">{hint}</p>
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="rounded border border-dashed border-slate-200 p-3 text-xs text-slate-400">暂无条目</p>
        ) : (
          list.map((s) => <SignalCard key={s.id} signal={s} />)
        )}
      </div>
    </div>
  );
}

export default function EvidencePage() {
  usePageMeta("证据", "按核验状态分栏的全部信息：已确认、公开报道、尚未确认、来源冲突与未知。");
  const [lang, setLang] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");

  const filtered = useMemo(
    () =>
      signals.filter(
        (s) => (lang === "all" || s.language === lang) && (tier === "all" || s.source_tier === tier),
      ),
    [lang, tier],
  );

  return (
    <div className="space-y-4">
      <PageIntro>
        全部信息按<b>核验状态</b>分栏展示。状态定义见
        <Link to="/methodology" className="mx-0.5 underline underline-offset-2">
          方法论
        </Link>
        ：公开报道不等于确认事实，多家媒体转载不等于多个独立来源。
      </PageIntro>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">语言</span>
          {[
            ["all", "全部"],
            ["ru", "俄语"],
            ["en", "英语"],
            ["zh", "中文"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLang(value)}
              className={`rounded-full border px-2.5 py-0.5 ${
                lang === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">来源等级</span>
          {["all", "S", "A", "B", "C", "D"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTier(value)}
              className={`rounded-full border px-2.5 py-0.5 ${
                tier === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              {value === "all" ? "全部" : `${value}级`}
            </button>
          ))}
        </div>
        <span className="text-slate-400">
          {filtered.length}/{signals.length} 条
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatusColumn status="confirmed" title="已确认" hint="可靠来源明确确认" signalsPool={filtered} />
        <StatusColumn status="reported" title="公开报道" hint="有报道，未充分独立确认" signalsPool={filtered} />
        <StatusColumn status="unconfirmed" title="尚未确认" hint="有说法，缺可靠证据" signalsPool={filtered} />
        <StatusColumn status="contradicted" title="来源冲突" hint="不同来源说法不一" signalsPool={filtered} />
        <StatusColumn status="unknown" title="未知" hint="公开资料不足，无法判断" signalsPool={filtered} />
      </div>

      {signals.filter((s) => s.status === "retracted").length > 0 && (
        <SectionCard title="已撤回 / 更正" subtitle="历史记录保留，不删除（规格：让用户看到「当时人们知道什么」）">
          <div className="space-y-2">
            {signals
              .filter((s) => s.status === "retracted")
              .sort((a, b) => b.published_at.localeCompare(a.published_at))
              .map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-80">
                <div className="flex flex-wrap items-center gap-2">
                  <SignalStatusChip status={s.status} />
                  <span className="text-xs text-slate-400">{formatDate(s.published_at)}</span>
                </div>
                <h3 className="mt-1 text-sm text-slate-700 line-through decoration-slate-400">{s.title_zh}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.summary_zh}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="病例信息（公开资料整理）"
        subtitle="只记录公开、必要的信息；不显示姓名、住址、联系方式等隐私字段"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {cases.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{c.id}</span>
                <SignalStatusChip status={c.status} />
              </div>
              <dl className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-400">年龄段</dt>
                  <dd>{c.age_group ? AGE_GROUP_LABELS[c.age_group] ?? "未公开" : "未公开"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-400">地点</dt>
                  <dd>{c.location ?? "未公开"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-400">职业</dt>
                  <dd>{c.occupation ?? "未公开"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-400">发病</dt>
                  <dd>{c.onset_date ?? "未公开"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-400">暴露</dt>
                  <dd>{c.exposure ?? "未公开"}</dd>
                </div>
              </dl>
              <CaseSources sourceIds={c.source_ids} />
            </div>
          ))}
        </div>
      </SectionCard>

      {transmissionLinks.length > 0 && (
        <SectionCard
          title="传播关系（仅公开证据支持）"
          subtitle="只能确认接触关系时，不得写成「感染」关系"
        >
          <ul className="space-y-2">
            {transmissionLinks.map((l, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-800"
              >
                <span className="font-medium">{l.source_case}</span>
                <span className="text-slate-400">→（{l.relationship_type === "possible_contact" ? "可能接触" : l.relationship_type}｜{l.status === "possible" ? "可能" : l.status === "confirmed" ? "已确认" : "未知"}）→</span>
                <span className="font-medium">{l.target_case}</span>
                <span className="text-xs text-slate-400">
                  （{l.confidence}｜{confidenceMeta(l.confidence).label}）
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
