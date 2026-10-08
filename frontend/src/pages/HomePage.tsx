// 首页仪表盘：10 秒内理解当前事件状态（规格书 §22–§24、§93）。
import { Link } from "react-router-dom";
import { event, historyCases, statusData } from "@/data";
import { HOMEPAGE_CAPS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { usePageMeta } from "@/lib/usePageMeta";
import StatusPanel from "@/components/StatusPanel";
import { MoreLink, RefItemRow, SectionCard } from "@/components/Cards";
import { CollectionDot, ImportanceChip, TrendChip } from "@/components/Badges";

export default function HomePage() {
  usePageMeta(
    "首页",
    "2026 年俄罗斯相关公共卫生事件：当前状态、已确认与未确认信息、关键未知与下一步观察点。",
  );

  const keyChanges = event.key_changes.slice(0, HOMEPAGE_CAPS.key_changes);
  const confirmed = event.confirmed.slice(0, HOMEPAGE_CAPS.confirmed);
  const unconfirmed = event.unconfirmed.slice(0, HOMEPAGE_CAPS.unconfirmed);
  const unknowns = event.unknowns.filter((u) => u.status === "unresolved").slice(0, HOMEPAGE_CAPS.unknowns);
  const triggers = event.next_triggers.slice(0, HOMEPAGE_CAPS.next_triggers);
  const abnormalSources = statusData.source_health.filter((s) => s.status !== "healthy");

  return (
    <div className="space-y-4">
      <StatusPanel />

      <SectionCard title="一句话摘要">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="max-w-3xl text-sm leading-relaxed text-slate-800">{event.summary}</p>
          <TrendChip trend={event.trend} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          趋势指公开信息变化，不是疫情趋势；四个状态维度的定义见
          <Link to="/methodology" className="mx-0.5 underline underline-offset-2 hover:text-slate-600">
            方法论
          </Link>
          。
        </p>
      </SectionCard>

      <SectionCard
        title="近期关键变化"
        subtitle="最新在前；完整列表见时间线"
        right={<MoreLink to="/timeline">完整时间线</MoreLink>}
      >
        <ul className="divide-y divide-slate-100">
          {keyChanges.map((c, i) => (
            <li key={i} className="flex flex-col gap-0.5 py-2 md:flex-row md:items-baseline md:gap-3">
              <span className="w-24 shrink-0 text-xs tabular-nums text-slate-400">{formatDate(c.at)}</span>
              <span className="text-sm leading-relaxed text-slate-800">{c.text}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard
          title="已确认"
          subtitle="高质量公开来源支持的事实"
          right={<MoreLink to="/evidence">证据全览</MoreLink>}
        >
          <ul className="divide-y divide-slate-100">
            {confirmed.map((item, i) => (
              <RefItemRow key={i} text={`✓ ${item.text}`} signalIds={item.signal_ids} />
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="尚未确认" subtitle="仅有报道或传闻，未获可靠来源证实">
          <ul className="divide-y divide-slate-100">
            {unconfirmed.map((item, i) => (
              <RefItemRow key={i} text={`? ${item.text}`} signalIds={item.signal_ids} />
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="当前最重要的未知" subtitle="不知道什么，往往比知道多少新闻更重要">
          <ul className="divide-y divide-slate-100">
            {unknowns.map((u) => (
              <li key={u.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">? {u.question}</span>
                  <ImportanceChip importance={u.importance} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{u.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="下一步值得观察" subtitle="什么信息会改变当前判断">
          <ul className="divide-y divide-slate-100">
            {triggers.map((t, i) => (
              <li key={t.id} className="py-2">
                <div className="text-sm leading-relaxed text-slate-800">
                  <span className="mr-1 text-slate-400">{["①", "②", "③", "④", "⑤"][i] ?? "·"}</span>
                  {t.condition}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  若发生，观察阶段可能从 {t.current_phase} 推进至 {t.potential_next_phase}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="历史模式参考" subtitle="结构性对照，不是预测">
        <p className="text-sm leading-relaxed text-slate-700">
          部分公开信息与历史公共卫生事件早期阶段存在结构性相似（对照等级：
          {historyCases.map((c) => c.name_zh.split("（")[0]).join("、")} 等），但当前仍缺少若干关键传播证据。
          历史相似不能用于推断本次事件的发展结果。
        </p>
        <div className="mt-2">
          <MoreLink to="/history">查看详细对照</MoreLink>
        </div>
      </SectionCard>

      <SectionCard title="数据源健康" subtitle="单源故障不影响其他来源，也不会自动提升风险">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-800">
            {statusData.sources_healthy}/{statusData.sources_total} 正常
          </span>
          {abnormalSources.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium">{s.name}</span>
              <CollectionDot status={s.status} />
            </span>
          ))}
        </div>
        {abnormalSources.length > 0 && (
          <p className="mt-2 text-xs text-amber-800">⚠ 部分数据源暂时不可用，当前数据可能存在延迟。</p>
        )}
        <div className="mt-2">
          <MoreLink to="/sources">全部来源与引用关系</MoreLink>
        </div>
      </SectionCard>
    </div>
  );
}
