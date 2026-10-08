// 时间线页：垂直时间轴，每个节点含时间/事件/状态/来源；支持纠错标注（规格书 §38、§39、§82）。
import { useState } from "react";
import { timeline } from "@/data";
import { SIGNAL_STATUSES, signalStatusMeta } from "@/lib/constants";
import { usePageMeta } from "@/lib/usePageMeta";
import { PageIntro, SectionCard } from "@/components/Cards";
import { SignalStatusChip, SourceChip } from "@/components/Badges";
import { signalById, sourceName } from "@/data";
import type { SignalStatus } from "@/types";

type Filter = "all" | SignalStatus;

export default function TimelinePage() {
  usePageMeta("事件时间线", "本事件公开信息的完整时间线：每个节点标注信息状态与来源，纠错保留历史。");
  const [filter, setFilter] = useState<Filter>("all");

  const entries = filter === "all" ? timeline : timeline.filter((e) => e.status === filter);

  return (
    <div>
      <PageIntro>
        事件完整时间线，按时间倒序排列。每个节点标注<b>信息状态</b>与<b>来源</b>。
        如后续发现某条报道有误，历史记录不会删除，而是追加更正说明——这样可以看到「当时人们知道什么」。
      </PageIntro>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          全部
        </FilterButton>
        {SIGNAL_STATUSES.map((s) => (
          <FilterButton key={s.code} active={filter === s.code} onClick={() => setFilter(s.code)}>
            <span className={`mr-1 inline-block h-2 w-2 rounded-full ${signalStatusMeta(s.code).dot}`} aria-hidden />
            {s.label}
          </FilterButton>
        ))}
      </div>

      {entries.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-slate-500">该状态下暂无时间线节点。</p>
        </SectionCard>
      ) : (
        <ol className="relative space-y-4 border-l border-slate-200 pl-6">
          {entries.map((entry) => {
            const meta = signalStatusMeta(entry.status);
            return (
              <li key={entry.id} className="relative">
                <span
                  className={`absolute -left-[1.5625rem] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${meta.dot}`}
                  aria-hidden
                />
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-xs tabular-nums text-slate-400">{entry.date}</time>
                    <SignalStatusChip status={entry.status} />
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-slate-900">{entry.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{entry.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[11px] text-slate-400">来源：</span>
                    {entry.source_ids.map((sid) =>
                      signalById.has(sid) ? (
                        <SourceChip
                          key={sid}
                          id={signalById.get(sid)!.source_id}
                          name={sourceName(signalById.get(sid)!.source_id)}
                        />
                      ) : null,
                    )}
                  </div>
                  {entry.correction && (
                    <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                      <div className="font-medium">
                        纠错记录（{entry.correction.at}）：原状态「
                        {signalStatusMeta(entry.correction.previous_status).label}」→ 现状态「
                        {signalStatusMeta(entry.status).label}」
                      </div>
                      <p className="mt-1">{entry.correction.note}</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}
