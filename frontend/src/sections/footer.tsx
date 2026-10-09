// 页脚：站内锚点 + 开源信息。（更新时间与数据源健康全站仅首屏顶部一处展示）
import { NAV_ITEMS } from "@/sections/nav";

export default function SiteFooter() {
  // 数据 JSON 的实际发布路径随部署 base 变化（GitHub Pages 项目页带子路径，根域名部署为 /）
  const dataPath = `${import.meta.env.BASE_URL}public-data/`;
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-8 text-xs leading-relaxed text-slate-500 md:px-8">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-slate-700">
              {item.label}
            </a>
          ))}
        </div>
        <p>
          开源项目 · MIT License · 本站不收集用户数据、无登录、无注册 · 公开数据以 JSON 形式发布在站点{" "}
          <a href={dataPath} className="underline underline-offset-2 hover:text-slate-700">
            <code className="rounded bg-slate-100 px-1">{dataPath}</code>
          </a>{" "}
          路径
        </p>
      </div>
    </footer>
  );
}
