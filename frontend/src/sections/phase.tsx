// 观察阶段：只做「当前阶段解读」——彩带在首屏状态牌，这里不重复；
// 全级定义在方法论页（避免同内容两处维护），推进条件在「下一步值得观察」。
import { event } from "@/data";
import { phaseMeta } from "@/lib/constants";
import Section from "@/sections/Section";

export default function PhaseTrack() {
  const meta = phaseMeta(event.observation_phase);

  return (
    <Section
      id="phase"
      no="06"
      title="公开信息观察阶段"
      subtitle="阶段推进只认证据：社交热搜、转载量、情绪化标题不会触发升级"
    >
      <div className="border-l-2 border-stone-800 pl-5">
        <p className="text-sm font-semibold text-slate-900">当前：{meta.label}</p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{meta.description}</p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        完整的九级阶段定义见
        <a href="#methodology" className="mx-0.5 underline underline-offset-2 hover:text-slate-700">
          方法论
        </a>
        ；什么信息会推进阶段见
        <a href="#next" className="mx-0.5 underline underline-offset-2 hover:text-slate-700">
          下一步值得观察
        </a>
        。该阶段仅表示本站对公开信息的观察状态，不代表官方疫情阶段认定，也不代表疾病发生概率。
      </p>
    </Section>
  );
}
