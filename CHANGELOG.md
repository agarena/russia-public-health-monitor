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
