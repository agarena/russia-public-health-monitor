// 等级公示牌：食品健康等级式展示——列出全部等级，当前级高亮，颜色与文字并存。
export interface MeterOption {
  key: string;
  label: string;
  emoji?: string;
}

export default function Meter({
  options,
  currentKey,
  sequential = false,
}: {
  options: MeterOption[];
  currentKey: string;
  /** 有序体系（观察阶段/证据完整度）：已过等级浅填充；无序体系（关注等级）统一灰 */
  sequential?: boolean;
}) {
  const currentIdx = options.findIndex((o) => o.key === currentKey);
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="img" aria-label={`当前等级：${options[currentIdx]?.label ?? currentKey}`}>
      {options.map((o, i) => {
        const isCurrent = o.key === currentKey;
        const isPast = sequential && currentIdx >= 0 && i < currentIdx;
        const cls = isCurrent
          ? "border-slate-900 bg-slate-900 font-semibold text-white"
          : isPast
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-400";
        return (
          <span
            key={o.key}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs leading-none ${cls}`}
            aria-current={isCurrent ? "true" : undefined}
          >
            {o.emoji && <span aria-hidden>{o.emoji}</span>}
            {o.label}
            {isCurrent && <span aria-hidden>✓</span>}
          </span>
        );
      })}
    </div>
  );
}
