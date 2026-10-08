// 历史参照页：只回答「当前事件有哪些信息结构曾在历史事件早期出现过」，
// 同时说明哪些关键特征并没有出现；相似/不同必须同时展示（规格书 §46–§51）。
import { historyCases, historyNote } from "@/data";
import { usePageMeta } from "@/lib/usePageMeta";
import { PageIntro, SectionCard } from "@/components/Cards";
import { ExternalLink } from "@/components/Badges";

const SIMILARITY_LABELS = { low: "低", medium: "中", high: "较高" } as const;

export default function HistoryPage() {
  usePageMeta("历史参照", "与当前事件有分析意义的历史公共卫生事件早期信息模式对照：相似与不同并存，不是预测。");

  return (
    <div className="space-y-4">
      <PageIntro>{historyNote}</PageIntro>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <p className="font-medium">使用边界</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
          <li>禁止「历史上发生过，所以这次也会发生」式推断；</li>
          <li>禁止「当前相当于某历史事件某一天」「再过几天就会进入下一阶段」式对照；</li>
          <li>相似性只用「低 / 中 / 较高」定性描述并说明理由，不提供百分比相似度；</li>
          <li>这些对照的唯一用途：帮助确定下一步值得观察的信号。</li>
        </ul>
      </div>

      {historyCases.map((c) => (
        <SectionCard key={c.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{c.name_zh}</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {c.name} · {c.period} · {c.region}
              </p>
            </div>
            <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              结构相似度：{SIMILARITY_LABELS[c.similarity]}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">{c.summary_zh}</p>
          <p className="mt-2 rounded bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-500">
            相似度判定理由：{c.similarity_reason_zh}
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-medium text-slate-800">相似的信息结构</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                {c.similar.map((s, i) => (
                  <li key={i}>✓ {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-medium text-slate-800">目前并没有出现的特征</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                {c.different.map((s, i) => (
                  <li key={i}>✗ {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <details className="mt-3 rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer select-none text-sm font-medium text-slate-700">
              早期公开信息时间线
            </summary>
            <ol className="mt-2 space-y-1.5 border-l border-slate-200 pl-4">
              {c.early_timeline.map((p, i) => (
                <li key={i} className="relative text-xs leading-relaxed text-slate-600">
                  <span className="absolute -left-[1.3125rem] top-1.5 h-2 w-2 rounded-full bg-slate-300" aria-hidden />
                  <span className="font-medium tabular-nums text-slate-500">{p.date}</span> —— {p.text}
                </li>
              ))}
            </ol>
          </details>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-medium text-slate-800">事后看有价值的早期信号</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                {c.valuable_early_signals.map((s, i) => (
                  <li key={i}>· {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-medium text-slate-800">后来被证明错误的信息</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                {c.later_disproven.map((s, i) => (
                  <li key={i}>· {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>参考：</span>
            {c.sources.map((s) => (
              <ExternalLink key={s.url} href={s.url}>
                {s.name} ↗
              </ExternalLink>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
