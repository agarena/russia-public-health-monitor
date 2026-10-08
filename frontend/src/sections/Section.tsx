// 章节容器：editorial 编号标题 + 细分隔线 + 大留白。
import type { ReactNode } from "react";

export default function Section({
  id,
  no,
  title,
  subtitle,
  children,
  className = "",
}: {
  id: string;
  no: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-slate-200 py-10 md:py-14 ${className}`}>
      <div className="mb-6 flex items-baseline gap-4 md:mb-8">
        <span className="text-xs font-medium tabular-nums text-slate-300">{no}</span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-[22px]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
