#!/usr/bin/env node
/**
 * russia-monitor 维护技能包装脚本：六动作一键调用。
 *
 * 用法：
 *   node russia-monitor.mjs <action> [args...]
 *
 * 动作：
 *   collect   采集全部（或 --only id... / --limit N 透传给采集器）
 *   propose   结构化：新条目 -> 审核队列
 *   review    审核队列（默认 list；可透传 show/approve/reject 及其参数）
 *   update    再生成公开数据 + 合规门禁
 *   publish   门禁复检 + 前端构建（推送由维护者确认后执行）
 *   audit     信息链路审计（默认 --event；可透传 --signal ID）
 *   status    健康检查
 *
 * 仓库定位：优先环境变量 RUSSIA_MONITOR_REPO；否则按脚本自身位置推导
 * （仓库内 skills/russia-monitor/scripts/ 的上上级即仓库根）。
 * Python 调用：优先 uv run --project <repo>；uv 不可用时回退 python（需已 pip install -e .）。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ACTIONS = {
  collect: { mod: "collector.cli", args: ["collect"] },
  propose: { mod: "processor.structuring", args: [] },
  review: { mod: "processor.review", args: ["list"] },
  update: null, // 特殊：generate + policy_check 两步
  publish: null, // 特殊：policy_check + 前端构建
  audit: { mod: "processor.audit", args: ["--event"] },
  status: { mod: "processor.status", args: [] },
};

function findRepo() {
  const fromEnv = process.env.RUSSIA_MONITOR_REPO;
  if (fromEnv && existsSync(path.join(fromEnv, "pyproject.toml"))) return path.resolve(fromEnv);
  // 仓库内位置：skills/russia-monitor/scripts/ -> 上三级
  const guessed = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  if (existsSync(path.join(guessed, "pyproject.toml"))) return guessed;
  console.error(
    "未找到仓库根。请在仓库内运行，或设置环境变量 RUSSIA_MONITOR_REPO 指向仓库路径。"
  );
  process.exit(1);
}

function runPy(repo, mod, args) {
  const passThrough = ["uv", ["run", "--project", repo, "python", "-m", mod, ...args]];
  const fallback = ["python", ["-m", mod, ...args]];
  for (const [cmd, baseArgs] of [passThrough, fallback]) {
    const r = spawnSync(cmd, baseArgs, { stdio: "inherit", cwd: repo, shell: process.platform === "win32" });
    if (r.error?.code === "ENOENT") continue; // 命令不存在，试下一个
    process.exit(r.status ?? 1);
  }
  console.error("uv 与 python 均不可用，请先安装其一。");
  process.exit(1);
}

function runShell(repo, cmd, opts = {}) {
  const r = spawnSync(cmd, { stdio: "inherit", cwd: repo, shell: process.platform === "win32", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const [action, ...rest] = process.argv.slice(2);
if (!action || !ACTIONS[action]) {
  console.log("用法：node russia-monitor.mjs <collect|propose|review|update|publish|audit|status> [args...]");
  process.exit(action ? 1 : 0);
}

const repo = findRepo();

if (action === "collect" || action === "propose" || action === "audit" || action === "status") {
  const spec = ACTIONS[action];
  runPy(repo, spec.mod, rest.length > 0 ? rest : spec.args);
} else if (action === "review") {
  runPy(repo, "processor.review", rest);
} else if (action === "update") {
  runPy(repo, "processor.generate", []);
  runPy(repo, "processor.policy_check", []);
} else if (action === "publish") {
  runPy(repo, "processor.policy_check", []);
  console.log("\n[1/2] 门禁通过。开始前端构建…");
  runShell(repo, "npm run build", { cwd: path.join(repo, "frontend") });
  console.log(
    "\n[2/2] 构建完成。确认无误后手动推送（推送触发部署）：\n" +
      `  cd ${repo} && git add data && git commit -m "data: <说明>" && git push`
  );
}
