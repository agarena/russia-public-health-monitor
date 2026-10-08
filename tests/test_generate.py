"""生成层单元测试：信号合并（append-only 覆盖语义）与原子发布。"""
import json

import pytest

import processor.generate as gen


def test_load_signals_jsonl_merges_by_id(tmp_path, monkeypatch):
    path = tmp_path / "signals.jsonl"
    path.write_text(
        json.dumps({"id": "s1", "status": "reported", "title": "t"})
        + "\n"
        + json.dumps({"id": "s2", "status": "reported", "title": "t2"})
        + "\n"
        + json.dumps({"id": "s1", "status": "confirmed", "title": "t"})
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(gen, "STATE_DIR", tmp_path)
    merged = {s["id"]: s for s in gen.load_signals_jsonl()}
    assert merged["s1"]["status"] == "confirmed"  # 后行覆盖前行＝状态流转
    assert len(merged) == 2


def test_publish_atomic_and_keeps_prev(tmp_path, monkeypatch):
    monkeypatch.setattr(gen, "PUBLIC_DIR", tmp_path / "public-data")
    monkeypatch.setattr(gen, "TMP_DIR", tmp_path / "public-data.tmp")
    monkeypatch.setattr(gen, "PREV_DIR", tmp_path / "public-data.prev")

    from processor.models import StatusFile

    outputs = {
        "status.json": StatusFile(
            generated_at="2026-01-01T00:00:00Z",
            last_successful_collection="2026-01-01T00:00:00Z",
            sources_healthy=1,
            sources_total=1,
            source_health=[{"id": "a", "name": "A", "status": "healthy"}],
            demo=False,
        )
    }
    gen.publish(outputs)
    assert (tmp_path / "public-data" / "status.json").exists()

    # 第二次发布：旧版进入 .prev，新版生效
    outputs["status.json"].sources_healthy = 0
    gen.publish(outputs)
    prev = json.loads((tmp_path / "public-data.prev" / "status.json").read_text(encoding="utf-8"))
    cur = json.loads((tmp_path / "public-data" / "status.json").read_text(encoding="utf-8"))
    assert prev["sources_healthy"] == 1
    assert cur["sources_healthy"] == 0


def test_build_outputs_requires_manual_event(tmp_path, monkeypatch):
    """manual/event.json 缺失时构建失败，不影响已有 public-data。"""
    monkeypatch.setattr(gen, "STATE_DIR", tmp_path)
    monkeypatch.setattr(gen, "MANUAL_DIR", tmp_path / "manual")
    with pytest.raises(FileNotFoundError):
        gen.build_outputs()
