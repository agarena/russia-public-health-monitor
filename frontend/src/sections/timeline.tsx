// 事件时间线：纵向、状态标签、纠错保留历史（不删除）。默认展示最近 5 条，更早的折叠。
import { useState } from "react";
import { timeline } from "@/data";
import { signalStatusMeta } from "@/lib/constants";
import { signalById, sourceName } from "@/data";
import { ExternalLink, SignalStatusChip } from "@/components/Badges";
import Section from "@/sections/Section";

const VISIBLE_BY_DEFAULT = 5;

export default function TimelineSection() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? timeline : timeline.slice(0, VISIBLE_BY_DEFAULT);

  return (
    <Section
      id="timeline"
      no="08"
      title="事件时间线"
      subtitle="按时间倒序；每个节点标注信息状态与来源。后续发现有误的报道不删除，追加更正说明——可以看到「当时人们知道什么」"
    >
      <ol className="relative space-y-6 border-l border-slate-200 pl-6 md:pl-8">
        {visible.map((entry) => {
          const meta = signalStatusMeta(entry.status);
          const signal = (entry.source_ids ?? []).map((id) => signalById.get(id)).find(Boolean);
          return (
            <li key={entry.id} className="relative">
              <span
                className={`absolute -left-[1.6875rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white md:-left-[2.1875rem] ${meta.dot}`}
                aria-hidden
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <time className="text-xs tabular-nums text-slate-400">{entry.date}</time>
                <SignalStatusChip status={entry.status} />
              </div>
              <h3 className="mt-1.5 text-sm font-semibold leading-snug text-slate-900">{entry.title}</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{entry.description}</p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                来源：{entry.source_ids
                  .map((sid) => signalById.get(sid))
                  .filter(Boolean)
                  .map((s) => sourceName(s!.source_id))
                  .join("、") || "—"}
                {signal && (
                  <>
                    {" · "}
                    <ExternalLink href={signal.url}>
                      <span className="text-[11px]">原文 ↗</span>
                    </ExternalLink>
                  </>
                )}
              </p>
              {entry.correction && (
                <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                  <span className="font-medium">
                    纠错记录（{entry.correction.at}）：原状态「
                    {signalStatusMeta(entry.correction.previous_status).label}」→ 现状态「{meta.label}」
                  </span>
                  <p className="mt-1">{entry.correction.note}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {timeline.length > VISIBLE_BY_DEFAULT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-6 text-xs font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
        >
          {showAll
            ? "收起更早的节点 ↑"
            : `展开更早的 ${timeline.length - VISIBLE_BY_DEFAULT} 个节点 ↓`}
        </button>
      )}
    </Section>
  );
}
