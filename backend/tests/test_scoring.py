import pytest
from app.scoring.engine import (
    ScoringEngine,
    ProductRecord,
    UserVector,
)


def _product(**kw) -> ProductRecord:
    defaults = {
        "id": "p1",
        "merchant_id": "m1",
        "sku": "SKU-1",
        "name": "Test Coffee",
        "roast_level": 3,
        "acidity": 3,
        "body": 3,
        "sweetness": 3,
        "flavor_tags": ["fruity"],
        "process": "Washed",
        "origin": "Ethiopia",
        "price": 18.0,
        "caffeine_level": "full",
        "brew_methods_supported": ["pour_over", "drip"],
        "active": True,
    }
    defaults.update(kw)
    return ProductRecord(**defaults)


def _vector(**kw) -> UserVector:
    defaults = {
        "roast_preference": 3,
        "acidity_preference": 3,
        "body_preference": 3,
        "sweetness_preference": 3,
        "flavor_tags": ["fruity"],
        "brew_method": "pour_over",
        "caffeine": "full",
        "price_max": None,
        "milk": False,
    }
    defaults.update(kw)
    return UserVector(**defaults)


def test_hard_filter_brew_method():
    engine = ScoringEngine()
    p = _product(brew_methods_supported=["espresso"])
    uv = _vector(brew_method="pour_over")
    r = engine.score_one(p, uv)
    assert r is None


def test_hard_filter_brew_method_passes():
    engine = ScoringEngine()
    p = _product(brew_methods_supported=["pour_over", "drip"])
    uv = _vector(brew_method="pour_over")
    r = engine.score_one(p, uv)
    assert r is not None
    assert "brew_ok" in r.constraint_passed_flags


def test_hard_filter_price():
    engine = ScoringEngine()
    p = _product(price=25.0)
    uv = _vector(price_max=20.0)
    r = engine.score_one(p, uv)
    assert r is None


def test_hard_filter_caffeine_decaf():
    engine = ScoringEngine()
    p = _product(caffeine_level="full")
    uv = _vector(caffeine="decaf")
    r = engine.score_one(p, uv)
    assert r is None


def test_penalty_light_roast_espresso():
    engine = ScoringEngine()
    p = _product(roast_level=1, brew_methods_supported=["espresso"])
    uv = _vector(brew_method="espresso")
    r = engine.score_one(p, uv)
    assert r is not None
    assert r.penalty_applied > 0


def test_scores_returned_sorted():
    engine = ScoringEngine()
    products = [
        _product(id="a", roast_level=1, acidity=5, flavor_tags=["fruity"]),
        _product(id="b", roast_level=3, acidity=3, flavor_tags=["fruity"]),
        _product(id="c", roast_level=5, acidity=1, flavor_tags=["chocolate"]),
    ]
    uv = _vector(roast_preference=3, acidity_preference=3, flavor_tags=["fruity"])
    results = engine.score_all(products, uv)
    assert len(results) == 3
    assert results[0].score >= results[1].score >= results[2].score
    assert results[0].product_id == "b"


def test_mmr_diversification():
    engine = ScoringEngine()
    products = [
        _product(id="a", roast_level=3, flavor_tags=["fruity", "floral"]),
        _product(id="b", roast_level=3, flavor_tags=["fruity", "floral"]),
        _product(id="c", roast_level=5, flavor_tags=["chocolate", "nutty"]),
    ]
    uv = _vector(roast_preference=3, flavor_tags=["fruity"])
    results = engine.score_all(products, uv)
    diversified = engine.diversify_mmr(
        results, {p.id: p for p in products}
    )
    assert len(diversified) <= 3
    ids = [r.product_id for r in diversified]
    assert len(set(ids)) == len(ids)
