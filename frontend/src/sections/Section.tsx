// 章节容器：眉标式编号（编号在标题上方，标题与正文同一左缘）+ 细分隔线 + 大留白。
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
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-medium tabular-nums text-slate-300">{no}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-[22px]">{title}</h2>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
