// 第一屏：当前状态。不滚动即可知道 关注等级 / 观察阶段 / 证据完整度 / 一句话判断 / 更新时间。
import { event, statusData } from "@/data";
import { confidenceMeta, levelMeta, phaseMeta } from "@/lib/constants";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";

function HeroChip({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-[9rem]">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-0.5 text-base font-semibold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-400">{hint}</div>
    </div>
  );
}

export default function StatusHero() {
  const phase = phaseMeta(event.observation_phase);
  const level = levelMeta(event.attention_level);
  const confidence = confidenceMeta(event.confidence);
  const abnormal = statusData.sources_total - statusData.sources_healthy;

  return (
    <header id="overview" className="scroll-mt-20 pb-10 pt-10 md:pb-14 md:pt-16">
      <p className="text-xs tracking-wide text-slate-400">
        单一事件公开信息简报 · 首次公开报道 {formatDate(event.first_seen)} · 持续更新
      </p>
      <h1 className="mt-3 max-w-3xl text-[26px] font-bold leading-snug tracking-tight text-slate-900 md:text-4xl md:leading-tight">
        {event.title}
      </h1>

      <div className="mt-8 flex flex-wrap items-start gap-x-10 gap-y-5 border-y border-slate-200 py-5">
        <HeroChip
          label="当前关注等级"
          value={`${level.emoji} ${level.code}｜${level.label}`}
          hint="信息值得关注程度，非疾病概率"
        />
        <HeroChip
          label="公开信息观察阶段"
          value={`${phase.code}｜${phase.label}`}
          hint="非官方疫情阶段认定"
        />
        <HeroChip
          label="证据完整度"
          value={`${confidence.code}｜${confidence.label}`}
          hint="公开证据支持程度"
        />
      </div>

      <div className="mt-8 border-l-2 border-slate-800 pl-5">
        <p className="text-[11px] text-slate-400">一句话判断</p>
        <p className="mt-1.5 max-w-3xl text-lg leading-relaxed text-slate-800">{event.summary}</p>
      </div>

      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
        <span>最后更新 {formatDateTime(event.last_updated)}（{formatRelative(event.last_updated)}）</span>
        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">
          数据源 {statusData.sources_healthy}/{statusData.sources_total} 正常
          {abnormal > 0 && <span className="text-amber-700">（{abnormal} 个降级）</span>}
        </span>
        {event.demo && (
          <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-700">演示数据</span>
        )}
      </p>
    </header>
  );
}
