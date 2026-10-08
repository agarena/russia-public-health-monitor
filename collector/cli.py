"""采集入口：python -m collector.cli collect [--only ID ...] [--dry-run] [--limit N]

- 单源失败只记录健康状态，不影响其他来源；
- URL 去重（已采集过的条目跳过）；
- 事件关联关键词粗筛（event_relevant）；
- 退出码恒为 0（采集失败不是流水线错误；数据陈旧提示由展示层负责）。
"""
import argparse
import sys
import time

from collector.adapters import google_news, rss
from collector.client import make_client
from collector.config import load_settings, load_sources
from collector.matching import is_relevant
from collector.store import (
    append_raw,
    load_health,
    load_seen,
    save_health,
    save_seen,
    update_health,
)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="collector")
    sub = parser.add_subparsers(dest="command", required=True)
    collect = sub.add_parser("collect", help="采集全部（或指定）到期来源")
    collect.add_argument("--only", nargs="*", default=None, help="只采集这些来源 id")
    collect.add_argument("--dry-run", action="store_true", help="只打印，不落盘")
    collect.add_argument("--limit", type=int, default=None, help="每个来源最多处理 N 条")
    return parser


def run_collect(only: list[str] | None, dry_run: bool, limit: int | None) -> int:
    settings = load_settings()
    max_items = limit or settings.get("collection", {}).get("max_items_per_source", 50)
    interval = settings.get("collection", {}).get("per_source_interval_seconds", 5)
    timeout = settings.get("collection", {}).get("timeout_seconds", 30)

    sources = [s for s in load_sources() if s.enabled and s.collect]
    if only:
        sources = [s for s in sources if s.id in only]

    seen = {} if dry_run else load_seen()
    health = {} if dry_run else load_health()
    client = make_client(timeout=timeout)

    total_new = 0
    total_relevant = 0
    for source in sources:
        try:
            if source.collect.method == "google_news_rss":
                items = google_news.fetch(source, client)
            else:
                items = rss.fetch(source, client)
        except Exception as e:  # noqa: BLE001 —— 单源失败必须隔离
            if not dry_run:
                err = f"{type(e).__name__}: {e}"
                update_health(health, source.id, ok=False, items=0, error=err)
            print(f"  [{source.id}] 采集失败：{type(e).__name__}: {e}")
            continue

        new_items = []
        for item in items[:max_items]:
            item.event_relevant = is_relevant(item.title, item.summary)
            if item.url_canonical in seen:
                continue
            seen[item.url_canonical] = item.collected_at
            new_items.append(item)

        relevant_count = sum(1 for i in new_items if i.event_relevant)
        total_new += len(new_items)
        total_relevant += relevant_count
        if not dry_run:
            update_health(health, source.id, ok=True, items=len(new_items))
            append_raw(new_items)
        print(
            f"  [{source.id}] 获取 {len(items)} 条，新增 {len(new_items)} 条"
            f"（疑似相关 {relevant_count}）"
        )
        time.sleep(min(interval, 3) if interval else 0)

    if not dry_run:
        save_seen(seen)
        save_health(health)

    print(f"完成：{len(sources)} 个来源，新增 {total_new} 条，疑似相关 {total_relevant} 条")
    return 0


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    if args.command == "collect":
        return run_collect(args.only, args.dry_run, args.limit)
    return 1


if __name__ == "__main__":
    sys.exit(main())
