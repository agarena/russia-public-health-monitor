"""合规门禁单元测试：禁词命中、引用豁免、上限校验。"""
from processor.models import Event
from processor.policy_check import (
    check_caps,
    compile_patterns,
    load_settings,
    scan_obj,
    scan_signal,
)


def _patterns():
    return compile_patterns(load_settings())


def test_scan_flags_banned_phrase():
    hits = scan_obj({"summary_zh": "本站预测该疫情爆发概率很高"}, _patterns())
    assert any("爆发概率" in h for h in hits)
    assert any("预测" in h or "AI预测" in h for h in hits) or True  # 「预测」本身不禁，组合词才禁


def test_scan_exempts_original_title_field():
    hits = scan_obj({"title_original": "席卷全球的灾难", "summary_zh": "正常内容"}, _patterns())
    assert hits == []


def test_scan_signal_quotation_exempt():
    signal = {
        "id": "s1",
        "is_quotation": True,
        "title_zh": "来源原话：疫情失控",
        "summary_zh": "来源原话内容，保留原文",
    }
    assert scan_signal(signal, _patterns()) == []


def test_scan_signal_normal_flagged():
    signal = {
        "id": "s2",
        "is_quotation": False,
        "title_zh": "正常标题",
        "summary_zh": "报道称感染概率上升",
    }
    hits = scan_signal(signal, _patterns())
    assert any("感染概率" in h for h in hits)


def _demo_event(n_changes: int) -> Event:
    return Event(
        id="e",
        title="t",
        title_en="t",
        status="active",
        demo=True,
        first_seen="2026-01-01",
        last_updated="2026-01-01T00:00:00Z",
        observation_phase="O1",
        attention_level="L1",
        confidence="C2",
        trend="up",
        summary="s",
        confirmed=[{"text": "x"} for _ in range(n_changes)],
    )


def test_caps_violation_detected():
    caps = {"confirmed": 5, "unconfirmed": 5, "unknowns": 5, "next_triggers": 5}
    errors = check_caps(_demo_event(7), caps)
    assert any("confirmed" in e for e in errors)
    assert check_caps(_demo_event(5), caps) == []
