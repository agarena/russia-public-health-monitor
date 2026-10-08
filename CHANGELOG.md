# 更新日志 / Changelog

本项目所有显著变更记录于此。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循语义化版本（SemVer）。

## [Unreleased]

### Added

- M0：项目骨架 —— 前端（Vite + React + TypeScript + Tailwind）、Python 采集/处理包、
  CI 工作流（typecheck / test / build / ruff / pytest / 合规门禁）、Makefile、
  构建后处理（GitHub Pages 404 路由、robots、sitemap）、双语 README、MIT 许可。
- M1：前端七个页面全部实现（首页仪表盘、时间线、证据、来源、历史参照、方法论、免责声明），
  演示数据七个 JSON + 三个历史参照案例；四维状态模型、六态信息状态机、
  来源分级与引用关系、纠错保留历史、病例与传播关系展示；
  合规门禁 `processor.policy_check`（pydantic schema 校验 + 禁词扫描 + 首页上限校验 + 引用完整性），
  配置文件 `config/settings.yaml`；前端组件测试 11 项、Python 测试 6 项。

### Fixed

- M1：BrowserRouter 设置 basename（GitHub Pages 子路径下 SPA 路由失效）。

### Added

- M2：真实采集框架 —— `config/sources.yaml` 来源注册表（25 个真实来源：WHO/Rospotrebnadzor/
  州政府 + Reuters/AP/CNN/WSJ 等 + Meduza/TASS 直连 RSS + 本地媒体，含 Google News RSS
  合规中转方案）；采集器（单源失败隔离、URL 去重、事件关键词粗筛、来源健康状态）；
  `processor.generate` 原子发布（last-known-good 保护）；GitHub Actions 定时采集部署流水线；
  自搭建指南 `docs/self-hosting.md`；真实事件种子数据（12 条人工审核信号，事件：
  2026-10 伊尔库茨克鼠疫防治研究所人员不明原因肺炎事件，O1/L2/C3）。
- 合规门禁新增引用完整性校验（signal→source、event/timeline→signal）。
- M3：三层去重（URL 规范化 / 标题相似 rapidfuzz / AI 语义判定）与批次内转载标记；
  来源独立性计数（转载链归并到 origin，不重复计独立来源）；OpenAI 兼容 AI 客户端
  （AI_BASE_URL/AI_API_KEY/AI_MODEL 环境变量，未配置自动降级人工模式）；
  §72 系统提示词固化为代码常量，AI 建议状态强制不得为 confirmed；
  审核队列与 CLI（`processor.review list/show/approve/reject`，append-only 写入，
  S/A 级 + 人工才能 confirmed 的硬规则代码化）；证据页新增语言与来源等级筛选。
- M4：评分引擎（attention score 六组件权重 + O/L/C/趋势建议值；否认/待核实语境不构成
  阶段推进证据；死亡数/报道量/转发量不参与升级）；评级确认 CLI
  （`processor.ratings suggest/apply/log`，apply 必填理由与依据来源）；
  评级变更记录进入 public-data 并在方法论页展示。
- M5：信息链路审计 CLI（`processor.audit --signal/--event`）与健康检查
  （`processor.status`）；维护技能 `skills/russia-monitor`（六动作：collect/review/
  update/publish/audit/status，均含等价命令行）；数据结构文档 `docs/data-schema.md`；
  贡献指南；流水线失败自动开维护 Issue；README 双语定稿。
- 前端重构（按 UI 设计简报）：7 页路由结构改为**单页 editorial 简报**——页面内锚点导航
  （桌面横排 + 手机汉堡菜单 + 滚动高亮）、12 个信息区块按认知顺序排列（重要说明 →
  当前状态 → 关键变化 → 已确认/尚未确认 → 未知/下一步 → 观察阶段进度线 O0–O8 →
  时间线 → 来源与信息差异 → 历史参照 → **中国相关公开信息（新增区块，含
  china_watch 数据结构）** → 方法论与完整免责声明）；第一屏不滚动即呈现四维状态与
  一句话判断；视觉全面 editorial 化（白底、细分隔线、编号章节标题、1200–1280px 栅格、
  克制配色）。
- 维护技能补充 `skills/russia-monitor/scripts/russia-monitor.mjs` 包装脚本（六动作
  一键调用，支持 `uv run` 或裸 `python`，`RUSSIA_MONITOR_REPO` 指定仓库路径）。

### Fixed

- 修复 generate 序列化未开 by_alias 导致来源引用关系 `from` 字段输出为 `from_`、
  前端「来源独立性链」自 M2 起静默不渲染的问题。

### Changed

- 状态公示牌改为能效标签式横版锯齿色带（Meter 组件重写）：列出全部等级、当前级满色高亮
  标注「当前」，展示层不再出现 L/O/C 代码；关注等级用绿→红四级彩色梯级，
  观察阶段（九级）与证据完整度（五级）用灰阶梯进。
- 引入 Anime.js v4（gzip 约 +12KB）：级段错峰入场（fade + 上移，stagger 36ms）、
  与当前级同色的 2px 指示条以 inOutExpo 滑动至当前级下方（评级更新时随级滑动）；
  尊重 prefers-reduced-motion。

- 站点改名：「俄罗斯鼠疫公开信息监测」（Russia Plague Public Information Monitor）。
  名称说明写入弹窗与页底共享的完整说明组件：「俄罗斯鼠疫」为近期热搜关键词简称，
  非事件定性；官方定名后尽快更新。
- 每次进入网站弹出「重要说明」弹窗（可滚动、Esc/遮罩/按钮关闭），内容与页底完整
  免责声明共用同一组件（FullDisclaimer），统一维护。
- 状态展示改为食品健康等级式公示牌（Meter 组件）：列出全部等级、当前级深色高亮带 ✓，
  展示层不再出现 L2/O1/C3 代码。首屏三维度（关注等级四级 / 观察阶段九级短名 /
  证据完整度五级）、第 07 区块观察阶段、下一步观察点文案、评级变更记录表全部中文化
  （数据层保持代码，展示层经 ratingValueLabel/phaseMeta 映射）。
