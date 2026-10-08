// 通用卡片与列表小组件。
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { signalById, sourceName } from "@/data";
import { SourceChip } from "@/components/Badges";

export function SectionCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 md:p-5 ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0 pt-0.5">{right}</div>}
        </div>
      )}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

/** 带 signal_ids 引用的文本条目：渲染可追溯的来源徽章 */
export function RefItemRow({ text, signalIds }: { text: string; signalIds?: string[] }) {
  const ids = (signalIds ?? []).filter((id) => signalById.has(id));
  return (
    <li className="flex flex-col gap-1 py-1.5">
      <span className="text-sm leading-relaxed text-slate-800">{text}</span>
      {ids.length > 0 && (
        <span className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-slate-400">来源：</span>
          {ids.map((id) => (
            <SourceChip key={id} id={signalById.get(id)!.source_id} name={sourceName(signalById.get(id)!.source_id)} />
          ))}
        </span>
      )}
    </li>
  );
}

/** 页面顶部说明条 */
export function PageIntro({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-slate-600">{children}</p>;
}

/** 「查看全部 →」链接 */
export function MoreLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-xs font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900">
      {children} →
    </Link>
  );
}
