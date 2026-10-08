// 将 data/public-data/*.json（优先）或 data/mock/*.json（回退）同步到：
//   frontend/src/generated-data/   —— 构建期内联进前端包
//   frontend/public/public-data/   —— 构建后以原始 JSON 形式对外提供
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const publicData = path.join(root, "data", "public-data");
const mockData = path.join(root, "data", "mock");

function jsonFiles(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
}

const publicFiles = jsonFiles(publicData);
const src = publicFiles.length > 0 ? publicData : mockData;
const label = src === publicData ? "public-data" : "mock";

const destinations = [
  path.join(root, "frontend", "src", "generated-data"),
  path.join(root, "frontend", "public", "public-data"),
];

for (const dest of destinations) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const file of jsonFiles(src)) {
    copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

console.log(`[sync-data] source=${label} (${jsonFiles(src).length} files) -> generated-data + public/public-data`);
