// Meter —— 等级彩带滑块（全站统一状态组件）：低饱和胶囊彩带 + 白钮彩环滑块 +
// 悬浮名称气泡（始终可见、clamp 防溢出）+ 底部等宽刻度行；仿精密仪器量表的安静质感
//（参考 iOS 健康量表 / Arc 仪表），动效克制并尊重 prefers-reduced-motion。
import { animate, stagger } from "animejs";
import { useEffect, useLayoutEffect, useRef } from "react";

export interface MeterOption {
  key: string;
  label: string;
  emoji?: string;
}

/** signal 锚点色（绿→红），任意级数在锚点间线性插值 */
const SIGNAL_ANCHORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
/** neutral 灰阶（9 档，本站观察阶段即 9 级） */
const NEUTRAL_LADDER = [
  "#f1f5f9",
  "#e2e8f0",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

const KNOB_SIZE = 27; // 圆钮直径 px
const SOFTEN = 0.1; // 彩带色向白混合比例（整体降饱和，柔和）

/* ---------- 颜色小工具 ---------- */
function hexRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}
function toHex(rgb: [number, number, number]): string {
  const c = (x: number) =>
    Math.round(Math.min(255, Math.max(0, x)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(rgb[0])}${c(rgb[1])}${c(rgb[2])}`;
}
function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return toHex([
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  ]);
}
/** signal 任意级数：在 4 个锚点色之间按位次插值（n=4 时恰为原四色） */
function signalColor(i: number, n: number): string {
  if (n < 2) return SIGNAL_ANCHORS[0];
  const t = (i / (n - 1)) * (SIGNAL_ANCHORS.length - 1);
  const lo = Math.floor(t);
  const hi = Math.min(lo + 1, SIGNAL_ANCHORS.length - 1);
  return mixHex(SIGNAL_ANCHORS[lo], SIGNAL_ANCHORS[hi], t - lo);
}
/** neutral 任意级数：n≤9 直接取第 i 档灰，n>9 按比例采样 */
function neutralIndex(i: number, n: number): number {
  if (n <= NEUTRAL_LADDER.length) return Math.min(i, NEUTRAL_LADDER.length - 1);
  return Math.round((i / (n - 1)) * (NEUTRAL_LADDER.length - 1));
}

export default function Meter({
  options,
  currentKey,
  tone = "neutral",
}: {
  options: MeterOption[];
  currentKey: string;
  /** signal = 绿→红（关注等级）；neutral = 灰阶（观察阶段、证据完整度） */
  tone?: "signal" | "neutral";
}): JSX.Element {
  const n = options.length;
  const safeN = Math.max(n, 1);
  const rawIdx = options.findIndex((o) => o.key === currentKey);
  const idx = rawIdx >= 0 ? rawIdx : 0;
  const pct = ((idx + 0.5) / safeN) * 100;
  const current = options[idx];
  const label = current?.label ?? currentKey;
  const emoji = current?.emoji;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  /** 第 i 级彩带色（降饱和后） */
  const ribbonColor = (i: number) =>
    tone === "signal"
      ? mixHex(signalColor(i, safeN), "#ffffff", SOFTEN)
      : mixHex(NEUTRAL_LADDER[neutralIndex(i, safeN)], "#ffffff", SOFTEN);
  /** 旋钮描边/光环/中心点：neutral 浅灰段向深灰收拢，保证白钮上可见 */
  const accent =
    tone === "signal"
      ? signalColor(idx, safeN)
      : mixHex(NEUTRAL_LADDER[neutralIndex(idx, safeN)], "#0f172a", 0.45);

  // 气泡半宽估算（CJK ≈11px、西文 ≈6.5px @11px 字号），用于把气泡 clamp 在容器内不溢出
  let textW = 0;
  for (const ch of label) textW += (ch.codePointAt(0) ?? 0) > 0x2e80 ? 11 : 6.5;
  const halfPx = Math.round((textW + (emoji ? 16 : 0) + 22) / 2 + 8);
  const clampLeft = (p: number) =>
    `clamp(${halfPx}px, ${p}%, calc(100% - ${halfPx}px))`;
  const clampPxOf = (p: number, w: number) =>
    Math.min(Math.max((p / 100) * w, halfPx), Math.max(w - halfPx, halfPx));

  const zoneRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const knobWrapRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleCardRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLDivElement>(null);
  const prevPctRef = useRef(pct);

  // 首次挂载：彩带淡入 + 圆钮轻微弹性滑入 + 气泡浮现 + 刻度错峰（useLayoutEffect 避免首帧闪位）
  useLayoutEffect(() => {
    if (reduced) return;
    const zone = zoneRef.current;
    const ribbon = ribbonRef.current;
    const knobWrap = knobWrapRef.current;
    const knob = knobRef.current;
    const bubble = bubbleRef.current;
    const card = bubbleCardRef.current;
    if (!zone || !knobWrap) return;
    const w = zone.offsetWidth;
    const targetClamp = clampLeft(pct);
    try {
      if (ribbon) ribbon.style.opacity = "0";
      if (knob) knob.style.opacity = "0";
      if (card) card.style.opacity = "0";
      knobWrap.style.left = "6%";
      if (bubble && w > 0) bubble.style.left = `${clampPxOf(6, w)}px`;
      if (ribbon)
        animate(ribbon, {
          opacity: [0, 1],
          scaleY: [0.92, 1],
          duration: 480,
          ease: "outQuad",
        });
      animate(knobWrap, {
        left: ["6%", `${pct}%`],
        duration: 820,
        delay: 90,
        ease: "outBack(1.4)",
      });
      if (knob)
        animate(knob, {
          opacity: [0, 1],
          scale: [0.55, 1],
          duration: 560,
          delay: 130,
          ease: "outBack(1.4)",
        });
      if (bubble && w > 0) {
        animate(bubble, {
          left: [`${clampPxOf(6, w)}px`, `${clampPxOf(pct, w)}px`],
          duration: 700,
          delay: 160,
          ease: "outQuint",
          onComplete: () => {
            bubble.style.left = targetClamp; // 还原为响应式 clamp 定位
          },
        });
      }
      if (card)
        animate(card, {
          opacity: [0, 1],
          translateY: [5, 0],
          duration: 380,
          delay: 300,
          ease: "outQuad",
        });
      const ticks = ticksRef.current;
      if (ticks) {
        const cells = ticks.querySelectorAll<HTMLElement>("[data-tick]");
        if (cells.length)
          animate(cells, {
            opacity: [0, 1],
            translateY: [5, 0],
            duration: 360,
            delay: stagger(22),
            ease: "outQuad",
          });
      }
    } catch {
      // 动画环境异常：直接落到终态，保证可读
      if (ribbon) ribbon.style.opacity = "1";
      if (knob) knob.style.opacity = "1";
      if (card) card.style.opacity = "1";
      knobWrap.style.left = `${pct}%`;
      if (bubble) bubble.style.left = targetClamp;
    }
    // 兜底落位：rAF 冻结的环境里动画会停在中间帧；setTimeout 走时钟，1.2s 强制终态（幂等）
    setTimeout(() => {
      if (ribbon) ribbon.style.opacity = "1";
      if (knob) knob.style.opacity = "1";
      if (card) card.style.opacity = "1";
      knobWrap.style.left = `${pct}%`;
      if (bubble && w > 0) bubble.style.left = targetClamp;
      const cells = ticksRef.current?.querySelectorAll<HTMLElement>("[data-tick]");
      cells?.forEach((c) => {
        c.style.opacity = "1";
        c.style.transform = "none";
      });
    }, 1200);
    // 仅挂载执行一次；pct/clampLeft 均取首帧值
  }, []);

  // currentKey 变化：圆钮 + 气泡以 outQuint 滑向新中心；气泡轻微回缩提示文字更新
  useLayoutEffect(() => {
    const from = prevPctRef.current;
    if (from === pct) return;
    prevPctRef.current = pct;
    if (reduced) return; // 减弱动态：React 渲染即终位
    const zone = zoneRef.current;
    const knobWrap = knobWrapRef.current;
    const bubble = bubbleRef.current;
    const card = bubbleCardRef.current;
    const w = zone?.offsetWidth ?? 0;
    try {
      if (knobWrap)
        animate(knobWrap, {
          left: [`${from}%`, `${pct}%`],
          duration: 680,
          ease: "outQuint",
        });
      if (bubble && w > 0) {
        animate(bubble, {
          left: [`${clampPxOf(from, w)}px`, `${clampPxOf(pct, w)}px`],
          duration: 680,
          ease: "outQuint",
          onComplete: () => {
            bubble.style.left = clampLeft(pct);
          },
        });
      }
      if (card)
        animate(card, { scale: [0.94, 1], duration: 280, ease: "outQuad" });
    } catch {
      if (knobWrap) knobWrap.style.left = `${pct}%`;
      if (bubble) bubble.style.left = clampLeft(pct);
    }
  }, [pct, reduced, halfPx]);

  // 窄屏兜底：彩带溢出容器时，自动把当前级滚到可视区中央（挂载与评级更新时各一次）
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc || sc.scrollWidth <= sc.clientWidth) return;
    const target = Math.max(0, (sc.scrollWidth * pct) / 100 - sc.clientWidth / 2);
    try {
      sc.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
    } catch {
      sc.scrollLeft = target;
    }
  }, [pct, reduced]);

  const minWidth = Math.max(480, safeN * 64);
  const gradient = `linear-gradient(90deg, ${options
    .map((_, i) => `${ribbonColor(i)} ${((i + 0.5) / safeN) * 100}%`)
    .join(", ")})`;

  return (
    <div ref={scrollerRef} className="overflow-x-auto">
      <div
        role="img"
        aria-label={`当前等级：${label}`}
        className="relative select-none pb-0.5 pt-[30px]"
        style={{ minWidth }}
      >
      {/* 彩带区（气泡与圆钮绝对定位于此） */}
      <div ref={zoneRef} className="relative h-5 w-full">
        {/* 胶囊彩带：色标位于各级中心百分比，内高光 + 极浅外投影 */}
        <div
          ref={ribbonRef}
          className="absolute inset-0 rounded-full"
          style={{
            background: gradient,
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1.5px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.05), 0 3px 8px rgba(15,23,42,0.05)",
          }}
        />
        {/* 名称气泡：始终可见；clamp 保证不溢出容器 */}
        <div
          ref={bubbleRef}
          className="absolute z-30"
          style={{
            left: clampLeft(pct),
            bottom: "calc(100% + 7px)",
            transform: "translateX(-50%)",
            filter:
              "drop-shadow(0 1px 1.5px rgba(15,23,42,0.18)) drop-shadow(0 4px 8px rgba(15,23,42,0.07))",
          }}
        >
          <div
            ref={bubbleCardRef}
            className="relative whitespace-nowrap rounded-lg bg-white px-2 py-[3px] text-[11px] font-medium leading-[15px] text-slate-900"
          >
            {emoji && (
              <span aria-hidden className="mr-1">
                {emoji}
              </span>
            )}
            {label}
            <span
              aria-hidden
              className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 rounded-[2px] bg-white"
            />
          </div>
        </div>
        {/* 白钮 + 彩色光环：像精密音量旋钮 */}
        <div
          ref={knobWrapRef}
          className="absolute top-1/2 z-20"
          style={{ left: `${pct}%`, transform: "translate(-50%, -50%)" }}
        >
          <div
            ref={knobRef}
            className="flex items-center justify-center rounded-full bg-white"
            style={{
              width: KNOB_SIZE,
              height: KNOB_SIZE,
              border: `2px solid ${accent}`,
              boxShadow: `0 0 0 4px ${accent}4D, inset 0 0 0 1px rgba(15,23,42,0.05), 0 2px 4px rgba(15,23,42,0.10), 0 4px 9px -2px rgba(15,23,42,0.14)`,
              transition: reduced
                ? undefined
                : "border-color 0.45s ease, box-shadow 0.45s ease",
            }}
          >
            <span
              aria-hidden
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: accent,
                transition: reduced ? undefined : "background-color 0.45s ease",
              }}
            />
          </div>
        </div>
      </div>
      {/* 刻度行：每级占 flex-1 等宽单元，文字中心即 (i+0.5)/n，天然互不重叠 */}
      <div ref={ticksRef} className="mt-[10px] flex w-full items-start">
        {options.map((o, i) => {
          const isCur = i === idx;
          return (
            <div
              key={o.key}
              data-tick
              title={o.label}
              aria-current={isCur ? "true" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-[4px]"
            >
              <span
                aria-hidden
                className={
                  isCur
                    ? "h-[4px] w-[2px] rounded-full bg-slate-800"
                    : "h-[4px] w-px rounded-full bg-slate-300"
                }
              />
              <span
                className={`max-w-full truncate px-0.5 text-[10px] leading-[13px] ${
                  isCur ? "font-semibold text-slate-900" : "text-slate-400"
                }`}
              >
                {o.label}
              </span>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
