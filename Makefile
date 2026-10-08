# 统一命令入口。
# Windows 本机若无 make，可使用各目标注释里的等价命令；CI 与 Linux/macOS 自托管环境直接使用 make。

.PHONY: setup dev sync-data build typecheck test test-web test-py lint collect propose review process pipeline policy-check preview

PY = uv run --project .

setup:            ## 安装前后端依赖
	uv sync                      # + cd frontend && npm install
	cd frontend && npm install

sync-data:        ## 将 data/public-data（不存在则 data/mock）同步进前端
	cd frontend && node scripts/sync-data.mjs

dev:              ## 本地开发服务器（含数据同步）
	cd frontend && npm run dev

build:            ## 构建静态站点到 frontend/dist
	cd frontend && npm run build

typecheck:        ## TypeScript 类型检查
	cd frontend && npm run typecheck

test: test-py test-web

test-py:          ## pytest
	$(PY) pytest

test-web:         ## vitest
	cd frontend && npm test

lint:             ## ruff + tsc
	$(PY) ruff check .
	cd frontend && npm run typecheck

collect:          ## 运行采集器（全量到期来源）
	$(PY) python -m collector.cli collect

propose:          ## AI/规则结构化：原始条目 -> 审核队列（AI 可选）
	$(PY) python -m processor.structuring

review:           ## 查看待审核提案（approve/reject 见 processor.review -h）
	$(PY) python -m processor.review list

process:          ## 运行处理流水线，再生成 data/public-data
	$(PY) python -m processor.generate

pipeline: collect process build

policy-check:     ## 合规门禁：禁词扫描 + 上限校验 + schema 校验
	$(PY) python -m processor.policy_check

preview:          ## 预览已构建的站点
	cd frontend && npm run preview
