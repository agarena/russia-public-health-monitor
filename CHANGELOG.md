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
