# 自搭建指南 / Self-hosting Guide

任何人都可以运行自己的观察站实例：整个站点是「静态前端 + Git 内数据 + 定时采集流水线」，
没有数据库、没有用户系统、没有服务端密钥常驻进程。

## 一、Fork 与启用

1. **Fork 本仓库**。
2. 打开仓库 **Settings → Pages**，Source 选择 **GitHub Actions**（不要选 "Deploy from a branch"）。
3. 打开 **Actions** 标签页，若提示 workflows 被禁用，点击 **Enable**。
   - 定时流水线 `Collect & Deploy` 将每 2 小时运行一次：采集 → 生成数据 → 合规门禁 → 构建并部署。
   - 也可以在 Actions 里手动 **Run workflow** 立即触发一次。
4. 几分钟后访问 `https://<你的用户名>.github.io/<仓库名>/`。

> 首次运行时数据源健康状态需要一至两个周期才会全部变为 healthy，属正常现象。

## 二、可选配置

### 修改采集来源

编辑 `config/sources.yaml`：增删来源、调整关键词查询或 RSS 地址。
每个来源必须包含：id、名称、分级（S/A/B/C/D）、语言、采集方式（`google_news_rss` 或 `rss`）。

### AI 结构化（可选）

AI 只做翻译、摘要、去重辅助与状态分类**建议**，不参与事实判定。
在仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret | 说明 |
|---|---|
| `AI_API_KEY` | OpenAI 兼容接口的密钥 |
| `AI_BASE_URL` | 接口地址（如智谱、OpenAI 等） |
| `AI_MODEL` | 模型名 |

本地开发则复制 `.env.example` 为 `.env` 填写。不配置时流水线照常运行，跳过 AI 步骤。

### 采集频率

编辑 `.github/workflows/collect.yml` 中的 `cron` 表达式（UTC 时区）。

### 允许搜索引擎收录

`collect.yml` 中 `SITE_INDEXABLE` 默认 `false`（robots 禁止收录）。数据经过首轮人工审核后，
将其改为 `true` 并把 `SITE_URL` 设为你的站点地址。

## 三、本地开发与维护（无 make 环境，Windows 适用）

```bash
# 安装
uv sync                          # 或 pip install -e .
cd frontend && npm install

# 采集 / 生成 / 门禁 / 构建
python -m collector.cli collect              # 采集全部来源
python -m collector.cli collect --only src-meduza   # 只采集指定来源
python -m processor.generate                 # 重新生成 data/public-data
python -m processor.policy_check             # 合规门禁（禁词/上限/schema）
cd frontend && npm run dev                   # 本地预览 http://localhost:5173
cd frontend && npm run build                 # 生产构建
```

Linux/macOS 可直接使用 `make dev` / `make collect` / `make pipeline` 等目标。

## 四、数据放在哪里（信息链路）

```
config/sources.yaml             来源注册表（分级、采集方式）
data/state/raw/*.jsonl          原始采集条目（append-only，只追加）
data/state/signals.jsonl        信号库（append-only；同 id 后行覆盖前行＝状态流转）
data/state/manual/              人工维护内容：事件状态、时间线、病例、传播关系、来源引用关系
data/state/source_health.json   各来源采集健康状态
data/public-data/*.json         生成产物（原子替换；git 历史＝完整审计日志）
data/public-data.prev/          上一版数据（last-known-good 回滚点）
```

任何页面结论都可回溯：页面条目 → `signals.jsonl` 中的 signal → `sources.yaml` 中的来源 → 原始 URL。
评级变化记录在 `data/state/rating_changes.json`（含理由与来源编号）。

## 五、维护原则（节选）

- 公开报道不等于确认事实；多家转载不等于多个独立来源。
- 任何信息不能被自动晋升为 CONFIRMED——需要 S/A 级来源 + 维护者确认。
- 阶段/等级变化必须写理由与依据来源，记录进 rating_changes。
- 采集失败只提示数据陈旧，绝不制造新的风险信号。
- 维护者不得因个人立场改变事实等级，评分依据只能来自证据质量。

完整规则见网站「方法论」页与仓库 `skills/russia-monitor/`（维护技能）。
