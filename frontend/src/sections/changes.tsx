// 关键变化与完整时间线：上块按重要性（最多 6 条），下块按时间倒序给完整过程（纠错保留历史）。
import { event, signalById } from "@/data";
import { formatDate } from "@/lib/format";
import { HOMEPAGE_CAPS } from "@/lib/constants";
import Section from "@/sections/Section";
import { TimelineList } from "@/sections/timeline";
import { ExternalLink, SignalStatusChip } from "@/components/Badges";

export default function ChangesSection() {
  const changes = event.key_changes.slice(0, HOMEPAGE_CAPS.key_changes);
  return (
    <Section
      id="changes"
      no="02"
      title="关键变化与时间线"
      subtitle="上块按重要性排序，下块给完整过程；每个节点标注信息状态与来源。后续发现有误的报道不删除，追加更正说明——可以看到「当时人们知道什么」"
    >
      <h3 className="mb-1 text-sm font-semibold text-slate-700">最近关键变化</h3>
      <ol className="divide-y divide-slate-100">
        {changes.map((c, i) => {
          const signal = (c.signal_ids ?? []).map((id) => signalById.get(id)).find(Boolean);
          return (
            <li key={i} className="flex flex-col gap-1.5 py-3.5 md:flex-row md:items-baseline md:gap-5">
              <time className="w-24 shrink-0 text-xs tabular-nums text-slate-500">{formatDate(c.at)}</time>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-slate-800">{c.text}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {signal && <SignalStatusChip status={signal.status} />}
                  {signal && (
                    <ExternalLink href={signal.url}>
                      <span className="text-[11px]">原文 ↗</span>
                    </ExternalLink>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-slate-500">
        变化条目按重要性而非单纯时间排序；状态含义见<a href="#methodology" className="underline underline-offset-2 hover:text-slate-700">说明</a>。
      </p>
      <h3 className="mt-10 mb-4 text-sm font-semibold text-slate-700">完整事件时间线（按时间倒序）</h3>
      <TimelineList />
    </Section>
  );
}
