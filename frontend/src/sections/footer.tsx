// 页脚：数据状态 + 站内锚点 + 开源信息。
import { event, statusData } from "@/data";
import { formatDateTime } from "@/lib/format";
import { NAV_ITEMS } from "@/sections/nav";

export default function SiteFooter() {
  const degraded = statusData.source_health.filter((s) => s.status !== "healthy");
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-8 text-xs leading-relaxed text-slate-400 md:px-8">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-slate-600">
              {item.label}
            </a>
          ))}
        </div>
        <p>
          数据更新时间：{formatDateTime(event.last_updated)} · 最近成功采集：
          {formatDateTime(statusData.last_successful_collection)} · 数据源{" "}
          {statusData.sources_healthy}/{statusData.sources_total} 正常
          {degraded.length > 0 && (
            <span className="text-amber-700">（{degraded.map((d) => d.name).join("、")}暂时不可用）</span>
          )}
        </p>
        <p>
          开源项目 · MIT License · 本站不收集用户数据、无登录、无注册 ·
          公开数据以 JSON 形式发布在站点 <code className="rounded bg-slate-100 px-1">/public-data/</code> 路径
        </p>
      </div>
    </footer>
  );
}
