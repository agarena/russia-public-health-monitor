// 历史模式参照：简短相似/不同对照，放在页面后半部分；仅帮助理解信息结构，不是预测。
import { historyCases } from "@/data";
import Section from "@/sections/Section";
import { ExternalLink } from "@/components/Badges";

const SIMILARITY_LABELS = { low: "低", medium: "中", high: "较高" } as const;

export default function HistorySection() {
  return (
    <Section
      id="history"
      no="09"
      title="历史模式参照"
      subtitle="回答「当前事件有哪些信息结构，在过去某些公共卫生事件早期阶段曾出现过」，同时说明哪些关键特征目前并没有出现"
    >
      <div className="space-y-8">
        {historyCases.map((c) => (
          <article key={c.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {c.name_zh}
                <span className="ml-2 font-normal text-xs text-slate-500">{c.period}</span>
              </h3>
              <span className="text-xs text-slate-500">
                结构相似度：{SIMILARITY_LABELS[c.similarity]}
              </span>
            </div>
            <div className="mt-3 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[11px] text-slate-500">相似的信息结构</p>
                <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-700">
                  {c.similar.map((s, i) => (
                    <li key={i}>✓ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">目前并没有出现的特征</p>
                <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-700">
                  {c.different.map((s, i) => (
                    <li key={i}>× {s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <details className="mt-3 text-xs text-slate-500">
              <summary className="cursor-pointer select-none">相似度理由与早期时间线</summary>
              <p className="mt-2 leading-relaxed">{c.similarity_reason_zh}</p>
              <ol className="mt-2 space-y-1 border-l border-slate-200 pl-4">
                {c.early_timeline.map((p, i) => (
                  <li key={i} className="relative leading-relaxed">
                    <span className="absolute -left-[1.3125rem] top-[0.45rem] h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />
                    <span className="font-medium tabular-nums text-slate-500">{p.date}</span> —— {p.text}
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {c.sources.map((s) => (
                  <ExternalLink key={s.url} href={s.url}>
                    <span className="text-xs">{s.name} ↗</span>
                  </ExternalLink>
                ))}
              </div>
            </details>
          </article>
        ))}
      </div>
      <p className="mt-8 rounded border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
        ⚠ 历史参照仅帮助理解信息结构，不代表未来预测，也不表示当前事件会得到相同结果。相似性只用「低 / 中 / 较高」定性描述。
      </p>
    </Section>
  );
}
