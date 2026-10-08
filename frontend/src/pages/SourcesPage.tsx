// 来源页：来源清单（等级/类型/语言/采集状态）+ 引用关系 + 独立性规则说明（规格书 §84、§14）。
import { sources, sourceRelations, sourceById } from "@/data";
import { LANGUAGE_LABELS, SOURCE_TIERS, SOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { usePageMeta } from "@/lib/usePageMeta";
import { PageIntro, SectionCard } from "@/components/Cards";
import { CollectionDot, ExternalLink, TierBadge } from "@/components/Badges";

export default function SourcesPage() {
  usePageMeta("来源", "本站数据来源清单：官方机构、国际媒体、本地媒体、专家账号与社交平台的分级与采集状态。");

  return (
    <div className="space-y-4">
      <PageIntro>
        来源等级是<b>采集优先级</b>，不是事实等级——D 级来源的信号可以进入「未确认」，但永远不会因为来源等级而自动变成「已确认」。
      </PageIntro>

      <SectionCard title="来源分级" subtitle="S → D，可靠程度递减；社交平台只用于发现信息，不用于确认事实">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {SOURCE_TIERS.map((t) => (
            <div key={t.code} className="rounded-lg border border-slate-200 p-3">
              <TierBadge tier={t.code} />
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{t.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="来源清单" subtitle="按等级排序">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-400">
                <th className="py-2 pr-3 font-medium">来源</th>
                <th className="py-2 pr-3 font-medium">类型</th>
                <th className="py-2 pr-3 font-medium">等级</th>
                <th className="py-2 pr-3 font-medium">语言</th>
                <th className="py-2 pr-3 font-medium">官方</th>
                <th className="py-2 pr-3 font-medium">采集状态</th>
                <th className="py-2 pr-3 font-medium">最近采集</th>
                <th className="py-2 font-medium">链接</th>
              </tr>
            </thead>
            <tbody>
              {[...sources]
                .sort((a, b) => a.tier.localeCompare(b.tier))
                .map((s) => (
                  <tr key={s.id} id={s.id} className="scroll-mt-24 border-b border-slate-100">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-slate-900">{s.name_zh ?? s.name}</div>
                      <div className="text-xs text-slate-400">
                        {s.name}
                        {s.name_zh ? ` · ${s.country_or_region}` : ""}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{SOURCE_TYPE_LABELS[s.type]}</td>
                    <td className="py-2 pr-3">
                      <TierBadge tier={s.tier} />
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{LANGUAGE_LABELS[s.language] ?? s.language}</td>
                    <td className="py-2 pr-3 text-slate-600">{s.official ? "是" : "否"}</td>
                    <td className="py-2 pr-3">
                      <CollectionDot status={s.collection_status} />
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {s.last_collected_at ? formatRelative(s.last_collected_at) : "—"}
                    </td>
                    <td className="py-2">
                      <ExternalLink href={s.url}>访问 ↗</ExternalLink>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="来源引用关系"
        subtitle="转载与引用会标注——地方账号 → 地方媒体 → 国际媒体 → 中文媒体的转载链，只能算 1 个原始信息 + 多个转载"
      >
        {sourceRelations.length === 0 ? (
          <p className="text-sm text-slate-500">暂无记录到的引用关系。</p>
        ) : (
          <ul className="space-y-2">
            {sourceRelations.map((r, i) => {
              const from = sourceById.get(r.from);
              const to = sourceById.get(r.to);
              if (!from || !to) return null;
              return (
                <li key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
                    <TierBadge tier={from.tier} />
                    <span className="font-medium">{from.name_zh ?? from.name}</span>
                    <span className="text-slate-400">← 引用 ─</span>
                    <TierBadge tier={to.tier} />
                    <span className="font-medium">{to.name_zh ?? to.name}</span>
                  </div>
                  {r.note_zh && <p className="mt-1 text-xs text-slate-500">{r.note_zh}</p>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 rounded bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          独立性规则：一条信息被 N 家媒体转载，独立来源数仍按原始信息源头计（1），
          除非出现各自独立采访/核实的报道。这是本站「多个独立来源」计数的口径。
        </p>
      </SectionCard>
    </div>
  );
}
