"""去重与来源独立性测试。"""
from processor.dedup import (
    find_title_duplicates,
    normalize_title,
    suggest_independent,
    title_similarity,
)


def test_normalize_title_strips_punctuation():
    got = normalize_title("Погибшая от чумы: в Шелехове! (обновлено)")
    assert got == "погибшая от чумы в шелехове обновлено"


def test_title_similarity_detects_translation_variants():
    # 同一信息的两种语言标题相似度低 —— 标题层抓不到，交给语义层（AI）
    assert title_similarity("Irkutsk plague case reported", "Irkutsk plague case reported") == 100.0
    assert title_similarity("Irkutsk plague case reported", "Fed raises rates") < 55.0


def test_find_title_duplicates_maps_to_signal():
    new = [{"item_id": "n1", "title": "Russia says plague death does not risk epidemic"}]
    existing = [
        {"id": "r-sig-010", "title_original": "Russia says plague death DOES risk epidemic?"}
    ]
    dup = find_title_duplicates(new, existing, threshold=80)
    assert dup.get("n1") == "r-sig-010"


def test_suggest_independent_relay_chain_counts_one():
    signals = {
        "s1": {"id": "s1", "origin_source_id": "src-baikal", "derived_from": []},
        "s2": {"id": "s2", "origin_source_id": "src-baikal", "derived_from": ["s1"]},
        "s3": {"id": "s3", "origin_source_id": "src-meduza", "derived_from": []},
    }
    # 转载链（来自同一源头）只算 1 个独立来源
    assert suggest_independent("src-baikal", ["s2"], signals) == 1
    # 两个不同 origin 的独立报道
    assert suggest_independent("src-meduza", ["s1"], signals) == 2


def test_suggest_independent_minimum_one():
    assert suggest_independent(None, [], {}) == 1
