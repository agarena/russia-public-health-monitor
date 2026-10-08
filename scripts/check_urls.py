"""校验 signals.jsonl 中每条 URL 的可达性（HEAD/GET，跟随重定向）。"""
import json
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "state" / "signals.jsonl"

UA = "russia-public-health-monitor/0.1 (url check)"


def main() -> int:
    rows = []
    with open(PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    bad = 0
    with httpx.Client(headers={"User-Agent": UA}, timeout=20, follow_redirects=True) as client:
        for row in rows:
            url = row["url"]
            try:
                resp = client.get(url)
                status = resp.status_code
                final = str(resp.url)[:80]
            except Exception as e:  # noqa: BLE001
                status = f"ERR {type(e).__name__}"
                final = ""
            ok = isinstance(status, int) and status < 400
            if not ok:
                bad += 1
            print(f"{'OK ' if ok else 'BAD'} {row['id']} {status} {final}")
    print(f"\n{len(rows)} 条，异常 {bad} 条")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
