// 已确认 / 尚未确认（编辑部双栏）+ 当前未知 / 下一步观察（双栏）。
import { event, signalById, sourceName } from "@/data";
import { HOMEPAGE_CAPS, phaseMeta } from "@/lib/constants";
import Section from "@/sections/Section";

function SourceDots({ signalIds }: { signalIds?: string[] }) {
  const ids = (signalIds ?? []).filter((id) => signalById.has(id));
  if (ids.length === 0) return null;
  return (
    <p className="mt-1 text-[11px] text-slate-400">
      来源：{ids.map((id) => sourceName(signalById.get(id)!.source_id)).join("、")}
      <a href="#sources" className="ml-1 underline underline-offset-2">
        详情
      </a>
    </p>
  );
}

export function EvidenceSplit() {
  const confirmed = event.confirmed.slice(0, HOMEPAGE_CAPS.confirmed);
  const unconfirmed = event.unconfirmed.slice(0, HOMEPAGE_CAPS.unconfirmed);
  return (
    <Section
      id="evidence"
      no="04"
      title="已确认 / 尚未确认"
      subtitle="把混在一起的信息拆成「事实」与「说法」——这是本站最核心的工作"
    >
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-green-800">✓ 已确认</h3>
          <ul className="space-y-4">
            {confirmed.map((item, i) => (
              <li key={i} className="border-l-2 border-green-600 pl-4">
                <p className="text-sm leading-relaxed text-slate-800">{item.text}</p>
                <SourceDots signalIds={item.signal_ids} />
              </li>
            ))}
          </ul>
        </div>
        <div className="md:border-l md:border-slate-200 md:pl-10">
          <h3 className="mb-3 text-sm font-semibold text-amber-700">? 尚未确认</h3>
          <ul className="space-y-4">
            {unconfirmed.map((item, i) => (
              <li key={i} className="border-l-2 border-amber-400 pl-4">
                <p className="text-sm leading-relaxed text-slate-800">{item.text}</p>
                <SourceDots signalIds={item.signal_ids} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        「已确认」= 可靠公开来源支持；「尚未确认」= 仅有报道或传闻。公开报道不等于确认事实，多家转载不等于多个独立来源。
      </p>
    </Section>
  );
}

export function UnknownsNext() {
  const unknowns = event.unknowns.filter((u) => u.status === "unresolved").slice(0, HOMEPAGE_CAPS.unknowns);
  const triggers = event.next_triggers.slice(0, HOMEPAGE_CAPS.next_triggers);
  return (
    <Section
      id="next"
      no="05 / 06"
      title="当前最重要的未知 · 下一步值得观察"
      subtitle="不知道什么，往往比知道多少新闻更重要；下一步是「值得观察」，不是「预计发生」"
    >
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">? 当前最重要的未知</h3>
          <ol className="space-y-4">
            {unknowns.map((u, i) => (
              <li key={u.id} className="flex gap-3">
                <span className="text-xs font-medium tabular-nums text-slate-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium leading-snug text-slate-800">{u.question}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{u.why_it_matters}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="md:border-l md:border-slate-200 md:pl-10">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">→ 下一步值得观察</h3>
          <ol className="space-y-4">
            {triggers.map((t, i) => (
              <li key={t.id} className="flex gap-3">
                <span className="text-xs font-medium tabular-nums text-slate-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm leading-snug text-slate-800">{t.condition}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    若发生，观察阶段可能从「{phaseMeta(t.current_phase).label}」推进至「
                    {phaseMeta(t.potential_next_phase).label}」
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
