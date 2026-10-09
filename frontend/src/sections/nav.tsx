// 顶部：演示横幅（演示模式）+ 简版重要说明 + 轻量锚点导航（sticky，56px，滚动高亮当前区）。
import { useEffect, useState } from "react";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/constants";
import { event } from "@/data";

// 顺序与页面锚点的实际排列一致（滚动高亮逻辑依赖这一点）。
export const NAV_ITEMS = [
  { href: "#overview", label: "总览" },
  { href: "#changes", label: "变化" },
  { href: "#evidence", label: "证据" },
  { href: "#next", label: "下一步" },
  { href: "#phase", label: "阶段" },
  { href: "#timeline", label: "时间线" },
  { href: "#sources", label: "来源" },
  { href: "#history", label: "历史参照" },
  { href: "#china", label: "中国" },
  { href: "#methodology", label: "说明" },
];

export function TopBanners() {
  return (
    <>
      {event.demo && (
        <div className="bg-sky-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          演示数据模式 —— 本站当前全部内容为演示样例，不代表任何真实事件信息
        </div>
      )}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs leading-relaxed text-amber-900">
        ⚠️ 重要说明：本站仅基于公开信息进行采集、整理、翻译、去重与来源标注；不是疫情预测、医学诊断或官方信息发布机构 ·{" "}
        <a href="#methodology" className="font-medium underline underline-offset-2">
          完整说明
        </a>
      </div>
    </>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(NAV_ITEMS[0].href);

  // 滚动高亮当前所在区块（以视口上部 1/3 为判定线）
  useEffect(() => {
    const handler = () => {
      const line = window.innerHeight * 0.35;
      let current = NAV_ITEMS[0].href;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.href.slice(1));
        if (el && el.getBoundingClientRect().top <= line) {
          current = item.href;
        }
      }
      setActive(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-8">
        <a href="#overview" className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight text-slate-900">
            {SITE_NAME}
          </div>
          <div className="hidden truncate text-[11px] leading-tight text-slate-500 sm:block">
            {SITE_NAME_EN}
          </div>
        </a>

        {/* 桌面端锚点导航 */}
        <nav className="hidden shrink-0 items-center gap-1 md:flex" aria-label="页面内导航">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 ${
                active === item.href
                  ? "font-medium text-slate-900 underline decoration-slate-300 underline-offset-4"
                  : "text-slate-600"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 手机端汉堡 */}
        <button
          type="button"
          aria-expanded={open}
          aria-label="打开导航菜单"
          onClick={() => setOpen((v) => !v)}
          className="rounded p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-stone-100 bg-white px-4 py-2 md:hidden" aria-label="页面内导航（手机）">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded px-2 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
