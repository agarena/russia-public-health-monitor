// 构建后处理：
//   1. 生成 dist/404.html —— GitHub Pages SPA 路由支持（配合 index.html 内的恢复脚本）
//   2. 生成 robots.txt    —— SITE_INDEXABLE=true 时允许收录并指向 sitemap，否则全站禁止收录
//   3. 生成 sitemap.xml   —— 7 个路由
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const base = process.env.VITE_BASE ?? "/russia-public-health-monitor/";
const siteUrl = (process.env.SITE_URL ?? "https://example.github.io").replace(/\/+$/, "");
const indexable = (process.env.SITE_INDEXABLE ?? "false").toLowerCase() === "true";

const notFoundHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>俄罗斯公共卫生事件公开信息观察站</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;url=${base}" />
  </head>
  <body></body>
</html>
`;
writeFileSync(path.join(dist, "404.html"), notFoundHtml);

const robots = indexable
  ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}${base}sitemap.xml\n`
  : `User-agent: *\nDisallow: /\n`;
writeFileSync(path.join(dist, "robots.txt"), robots);

const routes = [""];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes.map((r) => `  <url><loc>${siteUrl}${base}${r}</loc></url>`).join("\n") +
  `\n</urlset>\n`;
writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

console.log(`[post-build] 404.html + robots.txt (indexable=${indexable}) + sitemap.xml written to dist/`);
