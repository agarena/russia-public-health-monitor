// 全局布局：页头（导航）、页脚（免责声明 + 数据状态）、演示/免责横幅。
import { useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { event, statusData } from "@/data";
import { formatDateTime, formatRelative } from "@/lib/format";
import { SHORT_DISCLAIMER, SITE_NAME, SITE_NAME_EN } from "@/lib/constants";

const NAV_ITEMS = [
  { to: "/", label: "首页" },
  { to: "/timeline", label: "时间线" },
  { to: "/evidence", label: "证据" },
  { to: "/sources", label: "来源" },
  { to: "/history", label: "历史参照" },
  { to: "/methodology", label: "方法论" },
  { to: "/disclaimer", label: "免责声明" },
];

function DemoBanner() {
  if (!event.demo) return null;
  return (
    <div className="bg-sky-600 px-4 py-1.5 text-center text-xs font-medium text-white">
      演示数据模式 —— 本站当前全部内容为演示样例，不代表任何真实事件信息
    </div>
  );
}

function DisclaimerBar() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">
      ⚠️ 公开信息整理工具，不提供疫情预测 · 医疗与健康决定请以所在地官方信息为准 ·{" "}
      <Link to="/disclaimer" className="font-medium underline underline-offset-2">
        完整免责声明
      </Link>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-2.5 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="shrink-0">
          <div className="text-sm font-semibold leading-tight text-slate-900">{SITE_NAME}</div>
          <div className="text-[11px] leading-tight text-slate-400">{SITE_NAME_EN}</div>
        </Link>
        <nav className="overflow-x-auto">
          <ul className="flex gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded px-2 py-1 ${
                      isActive
                        ? "bg-slate-900 font-medium text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const degraded = statusData.source_health.filter((s) => s.status !== "healthy");
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-6 text-xs leading-relaxed text-slate-500">
        <p className="text-slate-600">{SHORT_DISCLAIMER}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            数据更新时间：{formatDateTime(event.last_updated)}（{formatRelative(event.last_updated)}）
          </span>
          <span>
            数据源：{statusData.sources_healthy}/{statusData.sources_total} 正常
            {degraded.length > 0 && (
              <span className="text-amber-700">（{degraded.map((d) => d.name).join("、")}暂时不可用）</span>
            )}
          </span>
          <span>最后成功采集：{formatDateTime(statusData.last_successful_collection)}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/methodology" className="underline underline-offset-2 hover:text-slate-700">
            方法论
          </Link>
          <Link to="/disclaimer" className="underline underline-offset-2 hover:text-slate-700">
            完整免责声明
          </Link>
          <span>开源项目 · MIT License</span>
          <span>本站不收集用户数据、无登录、无注册</span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  // 演示数据模式下对搜索引擎设置 noindex；正式数据自动解除。
  useEffect(() => {
    const name = "robots";
    let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (event.demo) {
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = "noindex, nofollow";
    } else if (tag) {
      tag.content = "index, follow";
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <DisclaimerBar />
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
