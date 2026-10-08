// 第一屏：当前状态。一张统一的「状态牌」承载三个维度（等级彩带滑块），
// 不滚动即可知道 关注等级 / 观察阶段 / 证据完整度 + 一句话判断 + 更新时间。
import { event, statusData } from "@/data";
import {
  ATTENTION_LEVELS,
  EVIDENCE_CONFIDENCE,
  OBSERVATION_PHASES,
  phaseMeta,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import type { ReactNode } from "react";
import Meter from "@/sections/Meter";

// 状态牌钻取链接：每条彩带 → 它的证据所在区块
function JumpLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-slate-400 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-600"
    >
      {children}
    </a>
  );
}

function StatusPlate() {
  const phase = phaseMeta(event.observation_phase);
  const rows: { label: string; caption: ReactNode; meter: ReactNode }[] = [
    {
      label: "关注等级",
      caption: (
        <>
          信息值得关注程度，非疾病概率 · <JumpLink href="#changes">升降依据见 03</JumpLink>
        </>
      ),
      meter: (
        <Meter
          options={ATTENTION_LEVELS.map((l) => ({ key: l.code, label: l.label, emoji: l.emoji }))}
          currentKey={event.attention_level}
          tone="signal"
        />
      ),
    },
    {
      label: "观察阶段",
      caption: (
        <>
          当前：{phase.label} · 仅表示本站对公开信息的观察状态，非官方疫情阶段认定 ·{" "}
          <JumpLink href="#next">推进条件见 06</JumpLink>
        </>
      ),
      meter: (
        <Meter
          options={OBSERVATION_PHASES.map((p) => ({ key: p.code, label: p.short }))}
          currentKey={event.observation_phase}
        />
      ),
    },
    {
      label: "证据完整度",
      caption: (
        <>
          公开证据支持程度 · <JumpLink href="#evidence">证据明细见 04</JumpLink> ·{" "}
          <JumpLink href="#sources">来源质量见 09</JumpLink>
        </>
      ),
      meter: (
        <Meter
          options={EVIDENCE_CONFIDENCE.map((c) => ({ key: c.code, label: c.label }))}
          currentKey={event.confidence}
        />
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="border-b border-slate-100 px-4 py-3.5 last:border-b-0 md:px-6"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
            <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{row.label}</span>
            <div className="min-w-0 flex-1">{row.meter}</div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 md:pl-[calc(5rem+1.25rem)]">
            {row.caption}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function StatusHero() {
  const abnormal = statusData.sources_total - statusData.sources_healthy;

  return (
    <header id="overview" className="scroll-mt-20 pb-10 pt-10 md:pb-14 md:pt-16">
      <p className="text-xs leading-relaxed text-slate-400">
        单一事件公开信息简报 · 首次公开报道 {formatDate(event.first_seen)} · 持续更新 ·
        「俄罗斯鼠疫」为近期热搜关键词的简称，官方定名后本站将更新
      </p>
      <h1 className="mt-3 text-[26px] font-bold leading-snug tracking-tight text-slate-900 md:text-4xl md:leading-tight">
        {event.title}
      </h1>

      <div className="mt-8">
        <StatusPlate />
      </div>

      <div className="relative mt-8">
        <span
          aria-hidden
          className="absolute -left-4 top-0 h-full w-0.5 bg-slate-800 md:-left-6"
        />
        <p className="text-[11px] text-slate-400">一句话判断</p>
        <p className="mt-1.5 max-w-4xl text-lg leading-relaxed text-slate-800">{event.summary}</p>
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
