// 观察阶段：横向进度线 O0—O8 + 当前阶段解释。仅表示公开信息观察状态，非官方疫情阶段。
import { event } from "@/data";
import { OBSERVATION_PHASES, phaseMeta } from "@/lib/constants";
import Section from "@/sections/Section";

export default function PhaseTrack() {
  const current = event.observation_phase;
  const currentIdx = OBSERVATION_PHASES.findIndex((p) => p.code === current);
  const meta = phaseMeta(current);

  return (
    <Section
      id="phase"
      no="07"
      title="公开信息观察阶段"
      subtitle="阶段推进只认证据：社交热搜、转载量、情绪化标题不会触发升级"
    >
      <div className="overflow-x-auto pb-2">
        <ol className="grid min-w-[680px] grid-cols-9">
          {OBSERVATION_PHASES.map((p, i) => {
            const isCurrent = p.code === current;
            const isPast = i < currentIdx;
            return (
              <li key={p.code} className="flex flex-col items-center">
                <div className="flex h-6 w-full items-center">
                  <span className={`h-px flex-1 ${i === 0 ? "opacity-0" : isPast || isCurrent ? "bg-slate-400" : "bg-slate-200"}`} />
                  <span
                    className={`mx-auto rounded-full ring-4 ring-white ${
                      isCurrent
                        ? "h-3.5 w-3.5 bg-slate-900"
                        : isPast
                          ? "h-2.5 w-2.5 bg-slate-400"
                          : "h-2.5 w-2.5 border border-slate-300 bg-white"
                    }`}
                    aria-hidden
                  />
                  <span className={`h-px flex-1 ${i === OBSERVATION_PHASES.length - 1 ? "opacity-0" : isPast ? "bg-slate-400" : "bg-slate-200"}`} />
                </div>
                <span className={`mt-1 text-xs tabular-nums ${isCurrent ? "font-bold text-slate-900" : "text-slate-400"}`}>
                  {p.code}
                </span>
                {isCurrent && <span className="mt-0.5 text-[10px] text-slate-500">当前</span>}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 border-l-2 border-slate-800 pl-5">
        <p className="text-sm font-semibold text-slate-900">
          {meta.code}｜{meta.label}
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{meta.description}</p>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        该阶段仅表示本站对公开信息的观察状态，不代表官方疫情阶段认定，也不代表疾病发生概率。
      </p>
    </Section>
  );
}
