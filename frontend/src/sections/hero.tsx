// 第一屏：当前状态。一张统一的「状态牌」承载两个维度（等级彩带滑块），
// 不滚动即可知道 关注等级 / 观察阶段 + 总结 + 更新时间。
import { event, statusData } from "@/data";
import { ATTENTION_LEVELS, OBSERVATION_PHASES, phaseMeta } from "@/lib/constants";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { cjkProse } from "@/lib/cjk";
import type { ReactNode } from "react";
import Meter from "@/sections/Meter";

// 状态牌钻取链接：每条彩带 → 它的证据所在区块
function JumpLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-stone-500 underline decoration-stone-400 underline-offset-2 transition-colors hover:text-stone-800"
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
          事件对中国读者的影响与相关程度（是否值得留意），非疾病概率 ·{" "}
          <JumpLink href="#changes">升降依据见 02</JumpLink> ·{" "}
          <JumpLink href="#china">中国动态见 09</JumpLink>
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
          <JumpLink href="#next">推进条件见 05</JumpLink>
        </>
      ),
      meter: (
        <Meter
          options={OBSERVATION_PHASES.map((p) => ({ key: p.code, label: p.short }))}
          currentKey={event.observation_phase}
          tone="cool"
        />
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(28,25,23,0.05),0_12px_32px_-16px_rgba(28,25,23,0.12)]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="border-b border-stone-100 px-4 py-4 last:border-b-0 md:px-6"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
            <span className="w-20 shrink-0 text-xs font-medium text-stone-500">{row.label}</span>
            <div className="min-w-0 flex-1">{row.meter}</div>
          </div>
          <p className="mt-2 text-[11px] text-stone-500 md:pl-[calc(5rem+1.25rem)]">
            {row.caption}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function StatusHero() {
  const abnormal = statusData.sources_total - statusData.sources_healthy;
  const relative = formatRelative(event.last_updated);
  // 相对时间与「YYYY-MM-DD」重叠时（如数据时间晚于本机时钟）只显示一个，避免同一日期出现两遍
  const relativeShown = relative === formatDate(event.last_updated) ? "" : `（${relative}）`;

  return (
    <header id="overview" className="scroll-mt-20 pb-10 pt-10 md:pb-14 md:pt-16">
      {/* 全站唯一的更新时间与数据源健康展示 */}
      <p className="text-xs font-medium tabular-nums text-stone-500">01</p>
      <p className="mt-1 text-xs leading-relaxed text-stone-500">
        单一事件公开信息简报 · 最后更新{" "}
        <span className="text-stone-700">
          {formatDateTime(event.last_updated)}
          {relativeShown}
        </span>{" "}
        · 数据源 {statusData.sources_healthy}/{statusData.sources_total} 正常
        {abnormal > 0 && (
          <span className="text-amber-700">
            （{abnormal} 个暂时不可用，当前数据可能存在延迟）
          </span>
        )}
        {" · "}
        {event.demo && <span className="text-sky-700">演示数据 · </span>}
        「俄罗斯鼠疫」为近期热搜关键词的简称，官方定名后本站将更新
      </p>
      <h1 className="mt-3 text-[26px] font-bold leading-snug tracking-tight text-stone-900 md:text-4xl md:leading-tight">
        {event.title}
      </h1>

      <div className="mt-8">
        <StatusPlate />
      </div>

      <div className="mt-8 border-l-2 border-stone-800 pl-4 md:pl-5">
        <p className="text-[11px] text-stone-500">总结</p>
        <p className="mt-1.5 text-balance text-lg leading-relaxed text-stone-800">{cjkProse(event.summary)}</p>
      </div>
    </header>
  );
}
