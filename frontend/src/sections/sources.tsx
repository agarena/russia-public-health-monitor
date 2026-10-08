// 来源与信息差异：按等级分组（不是新闻排行榜）+ 信息链独立性 + 来源差异（冲突如实展示）。
import { sources, sourceRelations, sourceById, signalsByStatus } from "@/data";
import { SOURCE_TIERS, signalStatusMeta } from "@/lib/constants";
import type { SourceTier } from "@/types";
import Section from "@/sections/Section";
import { ExternalLink, TierBadge } from "@/components/Badges";

export default function SourcesSection() {
  const byTier = new Map<string, typeof sources>();
  for (const s of sources) {
    byTier.set(s.tier, [...(byTier.get(s.tier) ?? []), s]);
  }
  const conflicts = signalsByStatus("contradicted");
  const tierOrder = ["S", "A", "B", "C", "D"];
  const tierDesc = new Map<string, string>(SOURCE_TIERS.map((t) => [t.code, t.description]));

  return (
    <Section
      id="sources"
      no="09"
      title="来源与信息差异"
      subtitle="来源数量不代表事件严重程度；重点是不同来源对同一事件的说法是否一致"
    >
      {/* 分级来源 */}
      <dl className="space-y-5">
        {tierOrder
          .filter((t) => byTier.has(t))
          .map((t) => (
            <div key={t} className="grid gap-2 md:grid-cols-[7rem_1fr] md:gap-6">
              <dt>
                <TierBadge tier={t as SourceTier} />
              </dt>
              <dd>
                <p className="text-sm leading-relaxed text-slate-700">
                  {byTier.get(t)!.map((s) => s.name_zh ?? s.name).join(" · ")}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{tierDesc.get(t)}</p>
              </dd>
            </div>
          ))}
      </dl>

      {/* 信息链与独立性 */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold text-slate-800">信息链与来源独立性</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          转载不重复计入独立来源：一条信息沿「地方媒体 → 国际媒体 → 其他媒体」传播时，只算 1 个原始信息 + 多个转载。
        </p>
        <ul className="mt-4 space-y-4">
          {sourceRelations.map((r, i) => {
            const from = sourceById.get(r.from);
            const to = sourceById.get(r.to);
            if (!from || !to) return null;
            return (
              <li key={i} className="rounded-lg border border-slate-200 p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
                  <span className="font-medium">{from.name_zh ?? from.name}</span>
                  <span className="text-slate-400">← 引用 ─</span>
                  <span className="font-medium">{to.name_zh ?? to.name}</span>
                  <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500">
                    可能属于同一原始消息链
                  </span>
                </div>
                {r.note_zh && <p className="mt-1 text-xs text-slate-500">{r.note_zh}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 来源差异 */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold text-slate-800">! 来源存在差异的说法</h3>
        {conflicts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">当前登记的来源之间暂无明显口径冲突。</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {conflicts.map((s) => (
              <li key={s.id} className="rounded-lg border border-violet-200 bg-violet-50/50 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${signalStatusMeta(s.status).badge}`}>
                    {signalStatusMeta(s.status).label}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{s.title_zh}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{s.summary_zh}</p>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  独立来源 ×{s.independent_source_count} ·{" "}
                  <ExternalLink href={s.url}>
                    <span className="text-[11px]">原始来源 ↗</span>
                  </ExternalLink>
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          不同公开来源目前存在差异时，本站原样展示差异，不替读者选边，也无法独立判断造成差异的原因。
        </p>
      </div>
    </Section>
  );
}
