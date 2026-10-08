"""审核闸门流程测试：硬性规则、append-only 写入、拒绝留痕。"""
import json

import pytest

import processor.review as review
import processor.structuring as structuring


@pytest.fixture()
def isolated_state(tmp_path, monkeypatch):
    monkeypatch.setattr(structuring, "QUEUE_PATH", tmp_path / "review_queue.json")
    monkeypatch.setattr(structuring, "RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(structuring, "STATE_DIR", tmp_path)
    monkeypatch.setattr(review, "SIGNALS_PATH", tmp_path / "signals.jsonl")
    return tmp_path


def _make_proposal(pid: str, tier: str, official: bool) -> dict:
    raw = {
        "item_id": "x" * 40,
        "source_id": "src-x",
        "publisher": "X",
        "url": "https://example.com/x",
        "url_canonical": "https://example.com/x",
        "title": "Some event happened",
        "summary": "",
        "published_at": "2026-10-08T00:00:00Z",
        "collected_at": "2026-10-08T01:00:00Z",
        "language": "en",
        "relay": False,
        "event_relevant": True,
    }
    return {
        "id": pid,
        "raw_item": raw,
        "source_tier": tier,
        "official": official,
        "title_zh": "某事件发生",
        "summary_zh": "",
        "suggested_status": "reported",
        "suggested_confidence": "C2",
        "importance": 0.5,
        "reason_zh": "",
        "derived_from": [],
        "proposed_at": "2026-10-08T02:00:00Z",
        "decision": None,
    }


def _seed_queue(proposals: list[dict]):
    structuring.save_queue({"updated_at": "now", "proposals": proposals})


def test_b_tier_cannot_be_confirmed(isolated_state):
    _seed_queue([_make_proposal("p-b1", "B", False)])
    assert review.cmd_approve("p-b1", "confirmed", "C3", 1, "") == 1


def test_d_tier_only_unconfirmed(isolated_state):
    _seed_queue([_make_proposal("p-d1", "D", False)])
    assert review.cmd_approve("p-d1", "reported", "C1", 1, "") == 1
    assert review.cmd_approve("p-d1", "unconfirmed", "C0", 1, "") == 0


def test_s_tier_can_be_confirmed_and_appends(isolated_state):
    _seed_queue([_make_proposal("p-s1", "S", True)])
    assert review.cmd_approve("p-s1", "confirmed", "C3", 1, "") == 0
    lines = (isolated_state / "signals.jsonl").read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    sig = json.loads(lines[0])
    assert sig["status"] == "confirmed" and sig["title_zh"] == "某事件发生"


def test_reject_keeps_audit(isolated_state):
    _seed_queue([_make_proposal("p-r1", "A", False)])
    assert review.cmd_reject("p-r1", "与本事件无关") == 0
    queue = structuring.load_queue()
    p = next(x for x in queue["proposals"] if x["id"] == "p-r1")
    assert p["decision"] == "rejected" and p["reject_reason"] == "与本事件无关"


def test_propose_without_ai_creates_proposals(isolated_state):
    raw_dir = isolated_state / "raw"
    raw_dir.mkdir()
    (raw_dir / "2026-10-08.jsonl").write_text(
        json.dumps({
            "item_id": "a" * 40, "source_id": "src-cnn", "publisher": "CNN",
            "url": "https://example.com/new", "url_canonical": "https://example.com/new",
            "title": "New Irkutsk plague development", "summary": "",
            "published_at": "2026-10-08T00:00:00Z", "collected_at": "2026-10-08T02:00:00Z",
            "language": "en", "relay": True, "event_relevant": True,
        }) + "\n",
        encoding="utf-8",
    )
    stats = structuring.propose(client=None)
    assert stats["added"] == 1
    queue = structuring.load_queue()
    assert queue["proposals"][0]["suggested_status"] in ("unconfirmed", "reported")
