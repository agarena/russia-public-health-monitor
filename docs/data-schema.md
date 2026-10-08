# 数据结构 / Data Schema

公开数据（`data/public-data/*.json`，同时以原始 JSON 形式发布在站点 `/public-data/` 路径）
与内部状态（`data/state/`）的字段说明。权威定义在两处，二者保持一致：

- 前端 TypeScript：`frontend/src/types.ts`
- Python pydantic（校验用）：`processor/models.py`（全部 `extra="forbid"`，字段拼错即报错）

## 公开数据文件

### event.json —— 事件与首页内容

| 字段 | 类型 | 说明 |
|---|---|---|
| id / title / title_en | str | 事件标识与双语标题 |
| status | `active` `stabilizing` `closed` | 事件生命周期 |
| demo | bool | true 时站点显示演示横幅并 noindex |
| first_seen / last_updated | ISO 时间 | 首次公开报道 / 最后更新 |
| observation_phase | `O0`–`O8` | 观察阶段（公开信息状态，非官方疫情认定） |
| attention_level | `L0`–`L3` | 信息关注等级（非疾病概率） |
| confidence | `C0`–`C4` | 证据完整度 |
| trend | `up` `stable` `down` `insufficient` | 公开信息变化趋势，非疫情趋势 |
| summary | str | 一句话摘要 |
| key_changes | list | 近期关键变化（≤6；含 at 日期与 signal_ids） |
| confirmed / unconfirmed | list | 首页两栏（各≤5；每条带可追溯 signal_ids） |
| unknowns | list | 当前未知（question/importance/why_it_matters） |
| next_triggers | list | 下一步观察点（condition → potential_next_phase） |

### signals.json —— 信号库（核心可审计单元）

每条 signal：`id`、`published_at`、`collected_at`、`language`、`source_id` + `source_tier`
（S/A/B/C/D）、`title_original`（原文标题）、`title_zh` / `summary_zh`（中文翻译与摘要）、
`status`（六态：`confirmed` `reported` `unconfirmed` `contradicted` `retracted` `unknown`）、
`confidence`（C0–C4）、`independent_source_count`（独立来源数，转载不重复计）、
`origin_source_id` + `derived_from`（信息源头与转载链）、`url`（原始链接）、`importance`、
`is_quotation`（内容为来源原话引用时 true，合规扫描豁免）。

### sources.json —— 来源注册与引用关系

`sources[]`：id、双语名称、type（official / international_media / local_media / expert /
social）、tier（S/A/B/C/D）、language、country_or_region、official、url、采集状态与时间。
`relations[]`：`from` 引用 `to`（cites/aggregates）——用于独立性展示。

### timeline.json —— 事件时间线

entries：date（day/month 精度）、title、description、status（六态）、source_ids（指向
signals）、correction（纠错：previous_status + note + at，**不删除历史**）。

### cases.json / transmission.json —— 病例与传播关系

病例只含公开必要字段（编号、大致年龄段、职业类别、城市、发病时间、公开暴露、状态、
来源）；无姓名、住址、联系方式。传播关系每条标注 confirmed / possible / unknown——
只能确认接触时不得写成感染。

### status.json —— 数据新鲜度与来源健康

generated_at、last_successful_collection、sources_healthy / sources_total、
source_health[]（healthy / degraded / stale / failed）。

### rating-changes.json —— 评级变更记录

每次 O/L/C/趋势变化一条：timestamp、dimension、from → to、reason（必填）、
source_ids（依据信号）。

## 内部状态（data/state/）

| 文件 | 说明 |
|---|---|
| `raw/YYYY-MM-DD.jsonl` | 原始采集条目（append-only；含 relay 标记与实际出版方） |
| `signals.jsonl` | 信号库（append-only；同 id 后行覆盖前行 = 状态流转，git 历史保留全过程） |
| `review_queue.json` | 审核队列（提案 → approved/rejected 决策留痕） |
| `seen_urls.json` | URL 去重索引 |
| `source_health.json` | 各来源采集健康 |
| `rating_changes.json` | 评级变更记录（生成时复制到 public-data） |
| `manual/*.json` | 人工维护内容（事件首页、时间线、病例、传播、来源关系） |

## 硬性不变量

1. CONFIRMED 只能来自 S/A 级来源 + 维护者确认（`processor.review` 强制）。
2. 首页上限：关键变化 ≤6，确认/未确认/未知/观察点各 ≤5（`policy_check` 强制）。
3. 禁词表扫描全部数据文件（`config/settings.yaml` `banned_patterns`；引用条目豁免）。
4. 公开数据生成是原子替换；失败不破坏上一版（`public-data.prev` 为回滚点）。
5. AI 输出永远是建议，不直接进入 signals.jsonl。
