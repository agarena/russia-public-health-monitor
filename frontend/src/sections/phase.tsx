// 观察阶段：公示牌式列出全部等级 + 当前级完整解释。仅表示公开信息观察状态，非官方疫情阶段。
import { event } from "@/data";
import { OBSERVATION_PHASES, phaseMeta } from "@/lib/constants";
import Section from "@/sections/Section";
import Meter from "@/sections/Meter";

export default function PhaseTrack() {
  const meta = phaseMeta(event.observation_phase);

  return (
    <Section
      id="phase"
      no="07"
      title="公开信息观察阶段"
      subtitle="阶段推进只认证据：社交热搜、转载量、情绪化标题不会触发升级"
    >
      <div className="overflow-x-auto pb-1">
        <Meter
          options={OBSERVATION_PHASES.map((p) => ({ key: p.code, label: p.short }))}
          currentKey={event.observation_phase}
        />
      </div>

      <div className="mt-6 border-l-2 border-slate-800 pl-5">
        <p className="text-sm font-semibold text-slate-900">当前：{meta.label}</p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{meta.description}</p>
      </div>

      <details className="mt-5 text-xs text-slate-500">
        <summary className="cursor-pointer select-none">查看全部阶段的含义</summary>
        <dl className="mt-3 space-y-2">
          {OBSERVATION_PHASES.map((p) => (
            <div key={p.code} className="border-l-2 border-slate-200 pl-3">
              <dt className="text-xs font-medium text-slate-800">
                {p.short}
                {p.code === event.observation_phase && <span className="ml-1.5 text-slate-400">（当前）</span>}
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-slate-500">{p.description}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p className="mt-4 text-xs text-slate-400">
        该阶段仅表示本站对公开信息的观察状态，不代表官方疫情阶段认定，也不代表疾病发生概率。
      </p>
    </Section>
  );
}
