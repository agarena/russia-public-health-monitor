// Meter —— 等级滑轨（全站统一状态组件）：整条轨道铺满色阶（颜色铺设全条、代表整个
// 量程）+ 白色滑块标记当前级（滑块环色 = 当前级色）+ 底部等宽刻度行（当前级刻度
// 加高为当前级色、文字加粗变深）。
//
// 两套色阶，语义分工（结构完全一致，仅色相家族不同）：
// - signal 暖色谱（绿→黄→橙→红）：关注等级专用，越往后越严重；
// - cool   冷色旅程（浅蓝→深蓝）：观察阶段专用，颜色随阶段「推进」而加深，
//   不暗示严重程度（阶段不代表官方疫情认定，也不代表疾病发生概率）。
// 动效为纯 CSS 时间基动画（transition + keyframes）：不依赖 rAF/定时器，
// 在任何渲染环境（包括节流/冻结帧）都会按真实时间正确落位；
// prefers-reduced-motion 下自动禁用。
import { useEffect, useRef, useState } from "react";

export interface MeterOption {
  key: string;
  label: string;
  emoji?: string;
}

const MARKER_SIZE = 18; // 白色滑块直径 px

/** signal 暖色谱锚点：绿→黄→橙→红（越来越严重） */
const SIGNAL_ANCHORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
/** cool 冷色旅程锚点：浅蓝→深蓝（随阶段推进加深） */
const COOL_ANCHORS = ["#BFDBFE", "#60A5FA", "#3B82F6", "#2563EB", "#1E3A8A"];

export type MeterTone = "signal" | "cool";

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
/** 任意级数：在锚点色之间按位次插值，保证色阶覆盖整条量程 */
function rampColor(anchors: string[], i: number, n: number): string {
  if (n < 2) return anchors[0];
  const t = (i / (n - 1)) * (anchors.length - 1);
  const lo = Math.floor(t);
  const hi = Math.min(lo + 1, anchors.length - 1);
  return mixHex(anchors[lo], anchors[hi], t - lo);
}

export default function Meter({
  options,
  currentKey,
  tone,
}: {
  options: MeterOption[];
  currentKey: string;
  /** signal = 暖色谱（关注等级）；cool = 冷色旅程（观察阶段） */
  tone: MeterTone;
}): JSX.Element {
  const n = options.length;
  const safeN = Math.max(n, 1);
  const rawIdx = options.findIndex((o) => o.key === currentKey);
  const idx = rawIdx >= 0 ? rawIdx : 0;
  const pct = ((idx + 0.5) / safeN) * 100;

  // 色阶：整条量程各级颜色 + 当前级颜色（滑块环 / 刻度线）
  const anchors = tone === "signal" ? SIGNAL_ANCHORS : COOL_ANCHORS;
  const ramp = options.map((_, i) => rampColor(anchors, i, safeN));
  const currentColor = ramp[idx];
  // 全色谱轨道：各级颜色铺设整条（第 i 级颜色落在其刻度中心位置，即滑块所在处的颜色）
  const rampGradient = `linear-gradient(90deg, ${ramp
    .map((c, i) => `${c} ${((i + 0.5) / safeN) * 100}%`)
    .join(", ")})`;

  // 窄屏兜底：滑轨溢出容器时，自动把当前级滚到可视区中央，并在边缘显示渐隐提示「还可滑动」。
  // 监听容器尺寸变化（旋转屏幕/缩放窗口也会重新居中）。
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc || typeof ResizeObserver === "undefined") return; // jsdom 等环境无此 API
    const center = () => {
      const canScroll = sc.scrollWidth > sc.clientWidth + 1;
      setOverflowing(canScroll);
      if (!canScroll) return;
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

  return (
    <div className="relative">
      <div ref={scrollerRef} className="no-scrollbar overflow-x-auto md:overflow-x-visible">
        <div
          role="img"
          aria-label={`当前等级：${options[idx]?.label ?? currentKey}`}
          className="relative select-none"
          style={{ minWidth }}
        >
          {/* 滑轨区（整条轨道铺满色阶，滑块绝对定位于此） */}
          <div className="relative h-3 w-full">
            {/* 全色谱轨道：色阶铺满整条——颜色铺设全条不代表「已到达」，
                当前状态由滑块位置与刻度高亮表达 */}
            <div
              className="meter-anim absolute inset-0 rounded-full"
              style={{
                background: rampGradient,
                animation: "meter-ribbon-in .5s ease-out both",
                boxShadow:
                  "inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1.5px rgba(28,25,23,0.12), inset 0 0 0 1px rgba(28,25,23,0.05), 0 1px 2px rgba(28,25,23,0.10), 0 3px 8px -2px rgba(28,25,23,0.14)",
              }}
            />
            {/* 白色滑块：标记当前级；环色 = 当前级色阶色；left 随 currentKey 平滑过渡 */}
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
                  width: MARKER_SIZE,
                  height: MARKER_SIZE,
                  border: `3px solid ${currentColor}`,
                  animation: "meter-knob-in .56s cubic-bezier(0.34, 1.56, 0.64, 1) .08s both",
                  boxShadow: "0 0 0 1px rgba(28,25,23,0.06), 0 1px 4px rgba(28,25,23,0.35)",
                  transition: "border-color 0.45s ease",
                }}
              >
                <span
                  aria-hidden
                  className="rounded-full"
                  style={{
                    width: 4,
                    height: 4,
                    backgroundColor: currentColor,
                  }}
                />
              </div>
            </div>
          </div>
          {/* 刻度行：每级占 flex-1 等宽单元，文字中心即 (i+0.5)/n，天然互不重叠。
              当前级：刻度线加高为当前级色、文字加粗变深——当前值在此直接可读 */}
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
                    className={`mx-auto block w-[2px] rounded-full ${isCur ? "h-[9px]" : "h-1 bg-stone-300"}`}
                    style={isCur ? { backgroundColor: currentColor } : undefined}
                    aria-hidden
                  />
                  <span
                    className={`mt-1 block whitespace-nowrap px-0.5 text-[10.5px] leading-none ${
                      isCur ? "font-bold text-stone-900" : "text-stone-500"
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
      {/* 窄屏溢出时，左右边缘渐隐提示滑轨可横向滑动查看全部等级 */}
      {overflowing && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 top-0 w-6 bg-gradient-to-r from-white to-transparent md:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 top-0 w-6 bg-gradient-to-l from-white to-transparent md:hidden"
          />
        </>
      )}
    </div>
  );
}
