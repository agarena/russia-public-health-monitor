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

- 显示效果审查修复：手机端当前级气泡被右缘裁切（Meter 增加滚动容器并自动把当前级
  滚到可视区中央，卡片不再被 480px 最小宽度撑破）；方法论折叠标题去掉 L/O/C 代码
  改为中文；进入弹窗改为每个浏览器会话（sessionStorage）首次进入弹一次，
  刷新/断线重连不再重复打扰；「最近关键变化」去掉与状态徽章重复的状态词元信息；
  来源区 A 级长串媒体名改为徽章流；「信息链与来源独立性」删除四张卡片重复的
  同一枚徽章（并入区块说明）；导航滚动高亮阈值修正（原滞后一个区块）；时间线/
  来源冲突的「原始来源 ↗」统一为「原文 ↗」；历史参照相似度徽章降为行内文字；
  中国相关区块「已观察：暂无」显式呈现（修复空列导致的列错位）。
- 布局与信息架构审查修复：章节编号改为眉标式（编号在标题上方），全站左缘统一到
  页面基准线（此前标题悬在正文右侧 29px，10 个区块重复造成错位感）；07 观察阶段
  区块瘦身——删除与首屏重复的阶段彩带与和方法论重复的全阶段折叠，改为当前阶段
  解读 + 指向方法论/下一步的链接；时间线默认展示最近 5 条、更早节点折叠展开
  （页面高度 8257→7414px）；首屏状态牌三条彩带各加指向对应证据区块的钻取链接
  （升降依据→03 / 推进条件→06 / 证据明细→04、来源质量→09）。
- 边距视觉复检修复（用户指出的「仍有问题」）：根因是 anime.js 的 rAF 逐帧动画在
  节流/冻结帧的渲染环境永远停在第一帧（旋钮停在起点、刻度停在半透明），setTimeout
  兜底同样不可靠。Meter 动效整体重写为纯 CSS 时间基动画（transition + keyframes，
  同款缓动曲线），按真实时间求值、任何帧都正确落位；移除 animejs 依赖（gzip -12KB）。
  同批修复：彩带容器滚动条可见（no-scrollbar + 桌面 overflow-visible）；
  H1 去除 768px 限宽改单行大标题、摘要放宽 4xl；一句话判断文字对齐 32px 基准线
  （竖线移入页边沟）；meta 行分隔点间距统一；窄屏居中改瞬时定位 + ResizeObserver。
- 修复 generate 序列化未开 by_alias 导致来源引用关系 `from` 字段输出为 `from_`、
  前端「来源独立性链」自 M2 起静默不渲染的问题。

### Changed

- 状态展示重做为「等级彩带滑块」（Meter 全站组件，三方案并行设计后选定柔和现代方案）：
  低饱和胶囊渐变彩带 + 白钮彩环滑块 + 常显当前等级名气泡 + 底部刻度行；展示层不再出现
  L/O/C 代码；首屏三个维度合并为一张统一状态牌（解决区块割裂）。评级更新时滑块以
  outQuint 平滑滑到新等级。动画 1.2s 时钟兜底落位（rAF 冻结环境不失效），
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
