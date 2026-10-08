// Meter —— 等级彩带滑块（全站统一状态组件）：低饱和胶囊彩带 + 白钮彩环滑块 +
// 悬浮名称气泡（始终可见、clamp 防溢出）+ 底部等宽刻度行；仿精密仪器量表的安静质感。
// 动效为纯 CSS 时间基动画（transition + keyframes）：不依赖 rAF/定时器，
// 在任何渲染环境（包括节流/冻结帧的内嵌预览）都会按真实时间正确落位；
// prefers-reduced-motion 下自动禁用。
import { useEffect, useRef } from "react";

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

  // 窄屏兜底：彩带溢出容器时，自动把当前级滚到可视区中央。
  // 监听容器尺寸变化（旋转屏幕/缩放窗口也会重新居中）。
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc || typeof ResizeObserver === "undefined") return; // jsdom 等环境无此 API
    const center = () => {
      if (sc.scrollWidth <= sc.clientWidth) return;
      const target = Math.max(0, (sc.scrollWidth * pct) / 100 - sc.clientWidth / 2);
      // 瞬时定位：smooth 滚动依赖 rAF，在冻结帧环境滚不动
      sc.scrollLeft = target;
    };
    center();
    const ro = new ResizeObserver(center);
    ro.observe(sc);
    return () => ro.disconnect();
  }, [pct]);

  const minWidth = Math.max(480, safeN * 64);
  const gradient = `linear-gradient(90deg, ${options
    .map((_, i) => `${ribbonColor(i)} ${((i + 0.5) / safeN) * 100}%`)
    .join(", ")})`;

  return (
    <div ref={scrollerRef} className="no-scrollbar overflow-x-auto md:overflow-x-visible">
      <div
        role="img"
        aria-label={`当前等级：${label}`}
        className="relative select-none pb-0.5 pt-[30px]"
        style={{ minWidth }}
      >
        {/* 彩带区（气泡与圆钮绝对定位于此） */}
        <div className="relative h-5 w-full">
          {/* 胶囊彩带：色标位于各级中心百分比，内高光 + 极浅外投影 */}
          <div
            className="meter-anim absolute inset-0 rounded-full"
            style={{
              background: gradient,
              animation: "meter-ribbon-in .5s ease-out both",
              boxShadow:
                "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1.5px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.05), 0 3px 8px rgba(15,23,42,0.05)",
            }}
          />
          {/* 名称气泡：始终可见；clamp 保证不溢出容器；left 随 currentKey 平滑过渡 */}
          <div
            className="meter-anim absolute z-30"
            style={{
              left: clampLeft(pct),
              animation: "meter-bubble-in .38s ease-out .2s both",
              transition: "left .68s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="relative inline-flex -translate-x-1/2 flex-col items-center">
              <div
                className="flex items-center gap-1 whitespace-nowrap rounded-[6px] px-2 py-[4px] text-[10.5px] font-semibold leading-none text-white"
                style={{
                  backgroundColor: "#0f172a",
                  boxShadow: "0 3px 8px -2px rgba(15,23,42,0.45)",
                }}
              >
                {emoji && <span aria-hidden>{emoji}</span>}
                {label}
              </div>
              <span
                aria-hidden
                className="h-2 w-2 -translate-y-1 rotate-45 rounded-[2px] bg-slate-900"
              />
            </div>
          </div>
          {/* 白钮 + 彩色光环：像精密音量旋钮；left 随 currentKey 平滑过渡 */}
          <div
            className="absolute top-1/2 z-20"
            style={{
              left: `${pct}%`,
              transform: "translate(-50%, -50%)",
              transition: "left .68s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div
              className="meter-anim flex items-center justify-center rounded-full bg-white"
              style={{
                width: KNOB_SIZE,
                height: KNOB_SIZE,
                border: `2px solid ${accent}`,
                animation: "meter-knob-in .56s cubic-bezier(0.34, 1.56, 0.64, 1) .08s both",
                boxShadow: `0 0 0 4px ${accent}4D, inset 0 0 0 1px rgba(15,23,42,0.05), 0 2px 4px rgba(15,23,42,0.10), 0 4px 9px -2px rgba(15,23,42,0.14)`,
                transition:
                  "border-color 0.45s ease, box-shadow 0.45s ease",
              }}
            >
              <span
                aria-hidden
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: accent,
                  transition: "background-color 0.45s ease",
                }}
              />
            </div>
          </div>
        </div>
        {/* 刻度行：每级占 flex-1 等宽单元，文字中心即 (i+0.5)/n，天然互不重叠 */}
        <div className="mt-[10px] flex w-full items-start">
          {options.map((o, i) => {
            const isCur = i === idx;
            return (
              <div
                key={o.key}
                data-tick
                title={o.label}
                aria-current={isCur ? "true" : undefined}
                className="meter-anim flex-1 text-center"
                style={{ animation: `meter-tick-in .36s ease-out ${i * 24}ms both` }}
              >
                <span
                  className={`mx-auto block w-px ${isCur ? "h-[7px] bg-slate-500" : "h-1 bg-slate-300"}`}
                  aria-hidden
                />
                <span
                  className={`mt-1 block whitespace-nowrap px-0.5 text-[10.5px] leading-none ${
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
