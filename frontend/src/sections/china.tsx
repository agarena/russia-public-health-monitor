// 中国相关公开信息：只记录公开信息变化（是否出现直接相关信息、输入性病例信息、官方措施变化），
// 不做任何风险预测。
import { event } from "@/data";
import Section from "@/sections/Section";

export default function ChinaSection() {
  const watch = event.china_watch;
  return (
    <Section
      id="china"
      no="10"
      title="中国相关公开信息"
      subtitle="只记录与本事件直接相关的中国境内公开信息变化；该区块不代表任何风险判断"
    >
      {!watch ? (
        <p className="text-sm text-slate-500">当前事件暂无中国相关公开信息观察记录。</p>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden>
              {watch.status === "no_change" ? "🟢" : "🔔"}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {watch.status === "no_change" ? "暂无明显变化" : "出现值得注意的公开信息变化"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{watch.summary_zh}</p>

          <div className="mt-6 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-[11px] text-slate-500">已观察</p>
              <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-700">
                {watch.observed.length === 0 ? (
                  <li className="text-slate-500 before:mr-1.5 before:text-slate-400 before:content-['·']">暂无</li>
                ) : (
                  watch.observed.map((s, i) => (
                    <li key={i} className="before:mr-1.5 before:text-slate-400 before:content-['·']">{s}</li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">尚未观察到</p>
              <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-700">
                {watch.not_observed.map((s, i) => (
                  <li key={i} className="before:mr-1.5 before:text-slate-400 before:content-['·']">{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">下一观察点</p>
              <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-700">
                {watch.next_watch.map((s, i) => (
                  <li key={i} className="before:mr-1.5 before:text-slate-400 before:content-['·']">{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
