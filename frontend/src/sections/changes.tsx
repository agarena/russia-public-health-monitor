// 最近关键变化：不是新闻列表，最多 6 条；每条 时间 + 一句话 + 状态 + 来源（可点开原始来源）。
import { event, signalById } from "@/data";
import { formatDate } from "@/lib/format";
import { HOMEPAGE_CAPS } from "@/lib/constants";
import Section from "@/sections/Section";
import { ExternalLink, SignalStatusChip } from "@/components/Badges";

export default function ChangesSection() {
  const changes = event.key_changes.slice(0, HOMEPAGE_CAPS.key_changes);
  return (
    <Section
      id="changes"
      no="02"
      title="最近关键变化"
      subtitle="按重要性排序；完整过程见时间线"
    >
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
    </Section>
  );
}
