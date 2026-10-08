# 俄罗斯公共卫生事件公开信息观察站

**Russia Public Health Event Information Monitor**

站点现名：**俄罗斯鼠疫公开信息监测**（Russia Plague Public Information Monitor）。
「俄罗斯鼠疫」是近期热搜关键词的简称，仅用于帮助读者快速定位事件；官方对该事件
定性或命名后，站名会尽快更新为官方名称。

一个开源的公开信息观察网站，只围绕**一个事件**：2026 年俄罗斯相关
「不明原因肺炎 / 疑似鼠疫」公共卫生事件。本站是单页 editorial 简报（页面内锚点导航），
目标是让人在数秒内理解事件状态，不是新闻门户，也不是数据大屏。

项目采集并整理俄语、英语、中文的公开信息，来源包括官方机构（WHO、ECDC、
俄罗斯主管部门）、国际专业媒体、俄罗斯本地媒体与公开社交平台。

网站帮助读者快速了解：

- 什么已经**确认**；
- 什么只是**报道**；
- 什么**尚未确认**；
- 不同来源之间**哪里存在矛盾**；
- 目前**不知道**什么；
- 下一步**值得观察**什么。

> **核心理念：更快发现公开信息变化，而不是更早相信未经确认的结论。**

## 本项目不是什么

- 不是医疗诊断、疫情预测或公共卫生决策系统。
- **不输出疾病概率、感染概率，不做任何预测。**
- 「信息关注等级」（L0–L3）、「观察阶段」（O0–O8）、「证据完整度」（C0–C4）
  描述的都是*公开信息的状态*，不代表任何未来事件的发生概率。四个状态维度
  （阶段 / 等级 / 证据 / 新鲜度）始终分开显示，绝不合并。
- 不推断政治动机，不做国家或地区排名，不做群体性判断。来源之间的差异
  原样展示，不替读者选边。

## 受众

本站不做推广。阅读本站需要直接访问 GitHub Pages，这自然筛选了具备基本
独立判断习惯的读者，降低内容被断章取义的风险。

## 工作方式

```
公开来源（RSS / 官方页面 / 公开 API）
        ↓  collector            （Python；合规抓取，单源失败互相隔离）
   原始条目（append-only JSONL）
        ↓  processor            （归一化 → 三层去重 → 事件关联 → AI 结构化 → 评分）
   人工审核闸门                （状态与评级由维护者确认；AI 只给建议）
        ↓  generate             （原子化发布；失败绝不破坏上一版数据）
   data/public-data/*.json      （提交入 git —— 完整审计线索）
        ↓  frontend build       （React + TypeScript + Vite + Tailwind，构建期内联数据）
   GitHub Pages                 （静态托管；同一份 JSON 也通过 /public-data/ 对外提供）
```

关键可审计性质：

- 网站上的任何结论都能回溯到 signal → source → 原始 URL；
- signals 以只追加方式存储（`data/state/signals.jsonl`），纠错只改状态、保留
  历史，读者能看到「当时人们知道什么」；
- 评级变化（阶段 / 等级 / 证据完整度）带理由与来源编号记录在案。

## 目录结构

```
frontend/    React 静态站点（单页 editorial 简报，锚点导航）
collector/   Python 采集器
processor/   归一化、去重、AI 结构化、评分与公开 JSON 生成
data/        public-data（发布的 JSON）、state（只追加存储）、history（历史参照案例）
config/      sources.yaml（来源注册表）、settings.yaml（权重、上限、禁词表）
skills/      AI 代理维护技能（均有等价命令行，不依赖 AI）
docs/        自搭建指南、数据结构说明
```

数据结构说明见 **[docs/data-schema.md](docs/data-schema.md)**；
贡献指南见 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

## 本地开发

环境要求：Node ≥ 20、Python ≥ 3.11（配合 [uv](https://docs.astral.sh/uv/)）。

```bash
uv sync                     # 安装 Python 依赖（创建 .venv）
cd frontend && npm install  # 安装前端依赖
npm run dev                 # 开发服务器 http://localhost:5173
```

常用命令（完整清单见 `Makefile`；每个目标都有无 make 环境的等价命令）：

```bash
uv run pytest                              # Python 测试
uv run python -m processor.policy_check    # 合规门禁（禁词扫描、上限与 schema 校验）
cd frontend && npm run build               # 类型检查 + 生产构建
```

## 自搭建

任何人都可以运行自己的实例：fork 仓库、配置 Secrets、启用 Actions ——
见 **[docs/self-hosting.md](docs/self-hosting.md)**。

## 维护技能

`skills/russia-monitor/` 提供一个 AI 代理维护技能（同时有等价命令行入口），
覆盖日常维护动作：`collect`（采集）、`review`（审核）、`update`（再生成）、
`publish`（发布）、`audit`（信息链路审计）、`status`（健康检查）。
详见该技能的 SKILL.md。

## 许可

代码以 MIT 许可发布。采集的内容归原来源所有；本站仅链接并标注出处，
不主张任何所有权。
