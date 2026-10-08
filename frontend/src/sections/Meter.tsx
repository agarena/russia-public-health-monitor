// 等级色阶条（能效标签式）：横版锯齿箭头梯级，列出全部等级，当前级满色高亮并标注「当前」。
// 文字始终可见（规格 §92）；signal 模式绿→红（关注等级），neutral 模式灰阶梯进（阶段/证据）。
// 动效（Anime.js v4）：级段错峰入场；同色指示条以 inOutExpo 滑动到当前级（数据更新时随级滑动）。
import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";

export interface MeterOption {
  key: string;
  label: string;
  emoji?: string;
}

// signal 模式每级配色：inactive 浅底深字 / active 满色白字
const SIGNAL_TONES: { inactive: string; active: string }[] = [
  { inactive: "bg-emerald-100 text-emerald-900", active: "bg-emerald-600 text-white" },
  { inactive: "bg-amber-100 text-amber-900", active: "bg-amber-500 text-white" },
  { inactive: "bg-orange-100 text-orange-900", active: "bg-orange-500 text-white" },
  { inactive: "bg-red-100 text-red-900", active: "bg-red-600 text-white" },
];

const NEUTRAL_TONE = {
  inactive: "bg-slate-100 text-slate-500",
  active: "bg-slate-900 text-white",
};

export default function Meter({
  options,
  currentKey,
  tone = "neutral",
}: {
  options: MeterOption[];
  currentKey: string;
  /** signal = 绿→红（关注等级）；neutral = 灰阶（观察阶段、证据完整度） */
  tone?: "signal" | "neutral";
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const currentIdx = options.findIndex((o) => o.key === currentKey);
  const label = options[currentIdx]?.label ?? currentKey;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // 入场：级段错峰淡入上移（仅挂载时一次）
  useEffect(() => {
    if (prefersReducedMotion) return;
    const segments = stripRef.current?.querySelectorAll<HTMLElement>("[data-segment]");
    if (!segments?.length) return;
    try {
      animate(segments, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 300,
        delay: stagger(36),
        ease: "outQuad",
      });
    } catch {
      // 动画环境异常时保持静态展示
    }
  }, [prefersReducedMotion]);

  // 指示条：从起点（或旧位置）滑动到当前级下方；数据更新时随级滑动
  useEffect(() => {
    const strip = stripRef.current;
    const bar = barRef.current;
    if (!strip || !bar) return;

    const place = (animated: boolean) => {
      const segments = strip.querySelectorAll<HTMLElement>("[data-segment]");
      const active = segments[currentIdx];
      if (!active) return;
      const stripRect = strip.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      const left = rect.left - stripRect.left + 4;
      const width = Math.max(rect.width - 8, 12);
      bar.style.backgroundColor = getComputedStyle(active).backgroundColor;
      if (animated && !prefersReducedMotion) {
        try {
          animate(bar, { left, width, duration: 600, ease: "inOutExpo" });
          return;
        } catch {
          // 回退到直接定位
        }
      }
      bar.style.left = `${left}px`;
      bar.style.width = `${width}px`;
    };

    if (prefersReducedMotion) {
      place(false);
      return;
    }
    const raf = requestAnimationFrame(() => place(true));
    let onResize: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    timer = setTimeout(() => {
      onResize = () => place(false);
      window.addEventListener("resize", onResize);
    }, 700);
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      if (onResize) window.removeEventListener("resize", onResize);
    };
  }, [currentIdx, prefersReducedMotion]);

  return (
    <div className="overflow-x-auto pb-1">
      <div
        ref={stripRef}
        className="relative inline-flex min-w-full flex-nowrap"
        role="img"
        aria-label={`当前等级：${label}`}
      >
        {options.map((o, i) => {
          const isCurrent = o.key === currentKey;
          const toneCls =
            tone === "signal"
              ? (SIGNAL_TONES[i % SIGNAL_TONES.length] ?? NEUTRAL_TONE)[
                  isCurrent ? "active" : "inactive"
                ]
              : NEUTRAL_TONE[isCurrent ? "active" : "inactive"];
          return (
            <span
              key={o.key}
              data-segment
              aria-current={isCurrent ? "true" : undefined}
              className={`flex h-7 min-w-16 flex-1 items-center justify-center gap-1 whitespace-nowrap px-2 text-xs leading-none ${toneCls} ${
                i > 0 ? "-ml-1.5" : ""
              } chevron-segment ${isCurrent ? "font-semibold" : ""}`}
              style={{ zIndex: options.length - i }}
            >
              {o.emoji && <span aria-hidden>{o.emoji}</span>}
              {o.label}
              {isCurrent && <span className="ml-0.5 text-[10px] opacity-90">当前</span>}
            </span>
          );
        })}
        {/* 指示条：当前级下方 2px，颜色取当前级满色 */}
        <div
          ref={barRef}
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-0.5"
          style={{ left: 0, width: 0 }}
        />
      </div>
    </div>
  );
}
