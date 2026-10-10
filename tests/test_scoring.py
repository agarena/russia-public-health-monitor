"""评分引擎与评级 CLI 测试。"""
import json

import processor.ratings as ratings
import processor.scoring as scoring
from processor.scoring import build_suggestion, suggest_phase


def _sig(sid, status="confirmed", conf="C3", title="", summary=""):
    return {
        "id": sid,
        "status": status,
        "confidence": conf,
        "title_zh": title,
        "title_original": "",
        "summary_zh": summary,
        "origin_source_id": f"src-{sid}",
        "published_at": "2026-10-07T00:00:00Z",
    }


def test_phase_o1_for_unknown_pneumonia():
    signals = [_sig("s1", title="官方通报不明原因重症肺炎死亡")]
    phase, evidence = suggest_phase(signals)
    assert phase == "O1" and evidence == ["s1"]


def test_phase_not_advanced_by_denial_context():
    # 报道提及"第二例"但语境是要求核实 / 官方否认 —— 不能推进 O2
    signals = [
        _sig("s1", title="官方通报不明原因肺炎"),
        _sig("s2", title="WHO 要求俄方核实「第二例」媒体报道"),
    ]
    phase, _ = suggest_phase(signals)
    assert phase == "O1"


def test_phase_o3_on_confirmed_pathogen_evidence():
    signals = [
        _sig("s1", title="官方通报不明原因肺炎"),
        _sig("s2", title="实验室确认病原体为鼠疫耶尔森菌，测序完成"),
    ]
    phase, _ = suggest_phase(signals)
    assert phase == "O3"


def test_attention_score_components():
    signals = [
        _sig("s1", title="官方通报不明原因肺炎死亡"),
        _sig("s2", title="当地实施隔离与医学观察"),
    ]
    result = scoring.compute_attention_score(signals)
    assert result["components"]["severity"] == 10.0
    assert result["components"]["official_measure_change"] == 10.0
    assert result["components"]["transmission_evidence"] == 0.0
    assert 0 < result["score"] < 75


def test_build_suggestion_shape():
    s = build_suggestion([_sig("s1", title="不明原因肺炎")])
    for key in (
        "suggested_observation_phase",
        "suggested_attention_level",
        "suggested_confidence",
        "suggested_trend",
        "attention_score",
    ):
        assert key in s


def test_ratings_apply_records_change(tmp_path, monkeypatch):
    event_path = tmp_path / "event.json"
    event_path.parent.mkdir(parents=True, exist_ok=True)
    event_path.write_text(
        json.dumps({
            "id": "e", "title": "t", "title_en": "t", "status": "active", "demo": False,
            "first_seen": "2026-10-01", "last_updated": "2026-10-01T00:00:00Z",
            "observation_phase": "O1", "attention_level": "L1", "confidence": "C2",
            "trend": "up", "summary": "s",
            "confirmed": [], "unconfirmed": [],
            "unknowns": [], "next_triggers": [],
        }),
        encoding="utf-8",
    )
    changes_path = tmp_path / "rating_changes.json"
    monkeypatch.setattr(ratings, "MANUAL_EVENT", event_path)
    monkeypatch.setattr(ratings, "RATING_CHANGES", changes_path)

    class Args:
        level = "L2"
        observation_phase = None
        confidence = None
        trend = None
        reason = "多个升级信号：死亡、隔离、WHO 介入"
        sources = "s1,s2"

    assert ratings.cmd_apply(Args()) == 0
    event = json.loads(event_path.read_text(encoding="utf-8"))
    assert event["attention_level"] == "L2"
    changes = json.loads(changes_path.read_text(encoding="utf-8"))
    assert changes[0]["dimension"] == "attention_level"
    assert changes[0]["from"] == "L1" and changes[0]["to"] == "L2"
    assert changes[0]["source_ids"] == ["s1", "s2"]
    assert changes[0]["reason"]
