---
name: russia-monitor
description: 俄罗斯公共卫生事件观察站的日常维护技能。六个动作：collect（采集公开来源）、review（审核信号提案）、update（更新状态评级与人工数据、再生成公开数据）、publish（门禁通过后提交发布）、audit（回溯信息链路）、status（健康检查）。当用户要求「更新观察站 / 采集新闻 / 审核信号 / 改评级 / 发布数据 / 查信息链路 / 查数据源状态」时使用。适用于任何支持 skill 的 AI 代理；每个动作都有等价命令行，无 AI 也能维护。
---

# 俄罗斯公共卫生事件观察站 · 维护技能

本技能驱动一个「采集 → 结构化 → 人工审核 → 生成 → 发布」的静态观察站。
所有命令在仓库根目录运行；Python 命令用 `uv run python -m ...`（或已 `pip install -e .` 时直接 `python -m ...`）。

## 你是谁（角色边界）

你是**公开信息整理助手**，不是医生、流行病学家、政府机构或预测模型。执行本技能时必须遵守以下硬性规则（代码门禁会拦截大部分违规，但判断责任在你）：

1. 只使用提供的公开信息；永不发明事实、病例、检测结果、传播链。
2. 不把指控变成事实；公开报道 ≠ 确认事实。
3. 保留来源归属；不把转载计为独立来源。
4. 涉及「隐瞒」「掩盖」「生物武器」等表述，只能作为**特定来源的原话引用**展示（is_quotation），永不由本站口径输出。
5. 不做国家/地区/群体评价与排名；不推断政治动机。
6. 不输出疾病概率、感染概率、任何形式的预测。
7. 证据不足时标注 unknown；采集失败只提示数据陈旧，绝不制造新的风险信号。
8. CONFIRMED 只能授予 S/A 级来源 + 维护者确认（review CLI 强制）。
9. 修改评级必须给出理由与依据 signal id（ratings CLI 强制）。

## 动作

### 1. collect —— 采集

```bash
uv run python -m collector.cli collect              # 全部来源
uv run python -m collector.cli collect --only src-meduza src-tass-en   # 指定来源
uv run python -m collector.cli collect --limit 15   # 每来源最多条数
```

采集后运行结构化（把新条目变成审核队列里的提案）：

```bash
uv run python -m processor.structuring
```

AI 配置了 `AI_BASE_URL/AI_API_KEY/AI_MODEL` 环境变量时提案自动带中文翻译与分类建议；
未配置时提案保留原文，由你在 review 阶段翻译定级。

### 2. review —— 审核信号提案（人工闸门，最核心的动作）

```bash
uv run python -m processor.review list              # 列出待审核提案
uv run python -m processor.review show --id P-xxxx  # 单条详情
uv run python -m processor.review approve --id P-xxxx \
    --status reported --confidence C2 --independent 2 --note "备注"
uv run python -m processor.review reject --id P-xxxx --reason "与本事件无关"
```

审核准则：

- **先判断相关性**：这条信息是否直接影响对本事件的理解？无关（一般科普、多年前的旧资料、
  其他国家的疫情）→ reject。
- **转载识别**：提案带 `derived_from`（指向已有 signal）或 `duplicate_of_proposal`
  （批次内转载）时，除非有显著增量信息，否则 reject 理由写「转载，已由 XX 覆盖」。
- **定级**：S 级官方声明/通报 → 视内容 confirmed 或 reported；A 级专业媒体 → reported；
  B/C 级 → reported/unconfirmed；D 级社交平台 → 只能 unconfirmed（CLI 强制）。
- **--independent**：沿转载链回溯后真正独立的来源数（CLI 未自动计算时保守给 1）。
- **原文翻译**：title_zh 忠实简洁，不添加原文没有的信息；summary_zh ≤120 字。
  你在 approve 时可以直接编辑 `data/state/review_queue.json` 中该提案的
  title_zh/summary_zh 字段（用编辑工具改 JSON）再执行 approve。

### 3. update —— 更新评级与人工数据，再生成公开数据

评级（阶段/等级/证据/趋势）：

```bash
uv run python -m processor.ratings suggest          # 规则引擎建议值（仅供参考）
uv run python -m processor.audit --event            # 当前值 vs 建议值对照
uv run python -m processor.ratings apply --level L2 \
    --reason "多个升级信号：死亡、约200人隔离观察、WHO介入" \
    --sources r-sig-002,r-sig-004,r-sig-010
uv run python -m processor.ratings log              # 变更历史
```

首页区块（摘要/关键变化/已确认/未确认/未知/观察点）、时间线、病例、传播关系、
来源引用关系是人工维护文件，直接用编辑工具修改（改前先读）：

```
data/state/manual/event.json          首页全部内容（受上限约束：关键变化≤6，其余≤5）
data/state/manual/timeline.json       时间线（纠错不删除，加 correction 字段）
data/state/manual/cases.json          病例（不写姓名/住址/联系方式）
data/state/manual/transmission.json   传播关系（接触≠感染，谨慎标注）
data/state/manual/source_relations.json  来源引用关系
```

修改后重新生成公开数据（原子替换，校验失败不动上一版）：

```bash
uv run python -m processor.generate
```

### 4. publish —— 门禁通过后提交发布

```bash
uv run python -m processor.policy_check   # 合规门禁：禁词/上限/schema/引用完整性
cd frontend && npm run build              # 前端构建（本地验证）
cd ..
git add data && git commit -m "data: <说明>" && git push
```

推送后 GitHub Actions 自动部署。门禁不过 → 修复数据后重来，绝不跳过。
本地预览：`cd frontend && npm run dev` → http://localhost:5173

### 5. audit —— 审计信息链路

```bash
uv run python -m processor.audit --signal r-sig-010   # 某结论的完整证据链
uv run python -m processor.audit --event              # 四维状态 + 建议值对照
```

用户质疑某条信息时：先用 audit --signal 找到链路，检查原始 URL 与来源等级，
再决定是否需要状态流转（直接在 signals.jsonl 追加一行同 id 新状态行——append-only，
旧行不动；并同步更新 timeline 的 correction）。

### 6. status —— 健康检查

```bash
uv run python -m processor.status
```

显示：待审核数、来源健康、信号分布、public-data 新鲜度。发现来源 failed/degraded →
检查网络与 sources.yaml；数据陈旧提示属正常降级，不要因此提升任何风险等级。

## 每日例行（建议节奏）

1. `status` → 2. `collect` + `structuring` → 3. `review`（清空队列）→
4. 若有新确认的重要事实：更新 manual 文件 + `ratings suggest/apply` →
5. `generate` → 6. `policy-check` → 7. 本地预览确认 → 8. `publish`。

## 事件结束（Closed）流程

当公开信息明确事件平息：`ratings apply` 逐项更新；把 event.json 的 status 改为
`stabilizing`（观察期）或 `closed`（结案）；在 manual/event.json 补充最终结论区块，
并把首页各区块改为复盘内容（What We Knew Then / What Was Later Confirmed 分开呈现）。
