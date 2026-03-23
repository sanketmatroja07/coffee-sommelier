"""
Deterministic scoring engine: hard filters, weighted cosine similarity,
penalty rules, MMR diversification. No LLM. All logic explainable.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


FLAVOR_TAXONOMY = frozenset({
    "fruity", "floral", "nutty", "chocolate", "caramel",
    "citrus", "berry", "stone_fruit", "tropical", "earthy",
    "spicy", "winey", "herbal", "smoky", "sweet"
})


@dataclass
class ProductRecord:
    id: str
    merchant_id: str
    sku: str
    name: str
    roast_level: int
    acidity: int
    body: int
    sweetness: int
    flavor_tags: list[str]
    process: str | None
    origin: str | None
    price: float
    caffeine_level: str
    brew_methods_supported: list[str]
    active: bool = True

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ProductRecord":
        return cls(
            id=str(d["id"]),
            merchant_id=str(d["merchant_id"]),
            sku=d.get("sku", ""),
            name=d.get("name", ""),
            roast_level=int(d.get("roast_level", 3)),
            acidity=int(d.get("acidity", 3)),
            body=int(d.get("body", 3)),
            sweetness=int(d.get("sweetness", 3)),
            flavor_tags=list(d.get("flavor_tags") or []),
            process=d.get("process"),
            origin=d.get("origin"),
            price=float(d.get("price", 0)),
            caffeine_level=str(d.get("caffeine_level", "full")),
            brew_methods_supported=list(d.get("brew_methods_supported") or []),
            active=bool(d.get("active", True)),
        )


@dataclass
class UserVector:
    roast_preference: int
    acidity_preference: int
    body_preference: int
    sweetness_preference: int
    flavor_tags: list[str]
    brew_method: str
    caffeine: str
    price_max: float | None
    milk: bool

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "UserVector":
        return cls(
            roast_preference=int(d.get("roast_preference", 3)),
            acidity_preference=int(d.get("acidity_preference", 3)),
            body_preference=int(d.get("body_preference", 3)),
            sweetness_preference=int(d.get("sweetness_preference", 3)),
            flavor_tags=list(d.get("flavor_tags") or []),
            brew_method=str(d.get("brew_method", "pour_over")),
            caffeine=str(d.get("caffeine", "full")),
            price_max=d.get("price_max"),
            milk=bool(d.get("milk", False)),
        )


@dataclass
class ScoreResult:
    product_id: str
    score: float
    top_contributing_features: list[str]
    constraint_passed_flags: list[str]
    penalty_applied: float
    raw_similarity: float


def _binary_flavor_vector(tags: list[str]) -> list[float]:
    """Convert flavor tags to binary vector over taxonomy."""
    vec = [1.0 if t in tags else 0.0 for t in sorted(FLAVOR_TAXONOMY)]
    return vec


def _cosine_sim(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-9
    nb = math.sqrt(sum(x * x for x in b)) or 1e-9
    return dot / (na * nb) if (na * nb) > 0 else 0.0


def _scale_1_5_to_01(x: int) -> float:
    return (x - 1) / 4.0 if x else 0.5


class ScoringEngine:
    def __init__(
        self,
        roast_weight: float = 1.0,
        acidity_weight: float = 1.0,
        body_weight: float = 1.0,
        sweetness_weight: float = 1.0,
        flavor_weight: float = 1.0,
    ):
        self.roast_weight = roast_weight
        self.acidity_weight = acidity_weight
        self.body_weight = body_weight
        self.sweetness_weight = sweetness_weight
        self.flavor_weight = flavor_weight

    def _hard_filter(self, product: ProductRecord, uv: UserVector) -> tuple[bool, list[str]]:
        """Returns (passes, constraint_flags)."""
        flags: list[str] = []

        if product.brew_methods_supported and uv.brew_method not in product.brew_methods_supported:
            return False, ["brew_method_incompatible"]

        if uv.caffeine == "decaf" and product.caffeine_level != "decaf":
            return False, ["caffeine_incompatible"]
        if uv.caffeine == "half" and product.caffeine_level not in ("half", "decaf"):
            return False, ["caffeine_incompatible"]

        if uv.price_max is not None and product.price > uv.price_max:
            return False, ["price_over_budget"]

        flags.append("brew_ok")
        flags.append("caffeine_ok")
        flags.append("price_ok")

        return True, flags

    def _penalty(self, product: ProductRecord, uv: UserVector) -> float:
        """Apply penalty rules. Returns penalty amount (positive = reduce score)."""
        penalty = 0.0

        if uv.brew_method == "espresso" and product.roast_level <= 2:
            penalty += 0.4
        if uv.acidity_preference <= 2 and product.acidity >= 4:
            penalty += 0.5
        if uv.milk and product.roast_level <= 2 and product.body <= 2:
            penalty += 0.3

        return penalty

    def _weighted_similarity(self, product: ProductRecord, uv: UserVector) -> tuple[float, list[str]]:
        """Compute weighted cosine-like similarity. Returns (score, top_features)."""
        roast_u = _scale_1_5_to_01(uv.roast_preference)
        roast_p = _scale_1_5_to_01(product.roast_level)
        roast_sim = 1.0 - abs(roast_u - roast_p) * 2

        acid_u = _scale_1_5_to_01(uv.acidity_preference)
        acid_p = _scale_1_5_to_01(product.acidity)
        acid_sim = 1.0 - abs(acid_u - acid_p) * 2

        body_u = _scale_1_5_to_01(uv.body_preference)
        body_p = _scale_1_5_to_01(product.body)
        body_sim = 1.0 - abs(body_u - body_p) * 2

        sweet_u = _scale_1_5_to_01(uv.sweetness_preference)
        sweet_p = _scale_1_5_to_01(product.sweetness)
        sweet_sim = 1.0 - abs(sweet_u - sweet_p) * 2

        user_flavor = _binary_flavor_vector(uv.flavor_tags)
        prod_flavor = _binary_flavor_vector(product.flavor_tags)
        flavor_sim = _cosine_sim(user_flavor, prod_flavor)
        if not uv.flavor_tags:
            flavor_sim = 0.5

        raw = (
            self.roast_weight * max(0, roast_sim)
            + self.acidity_weight * max(0, acid_sim)
            + self.body_weight * max(0, body_sim)
            + self.sweetness_weight * max(0, sweet_sim)
            + self.flavor_weight * max(0, flavor_sim)
        )
        total_w = (
            self.roast_weight + self.acidity_weight + self.body_weight
            + self.sweetness_weight + self.flavor_weight
        )
        norm = raw / total_w if total_w > 0 else 0

        top: list[tuple[str, float]] = [
            ("roast", roast_sim),
            ("acidity", acid_sim),
            ("body", body_sim),
            ("sweetness", sweet_sim),
            ("flavor", flavor_sim),
        ]
        top.sort(key=lambda t: t[1], reverse=True)
        top_features = [f"{name}={score:.2f}" for name, score in top[:3]]

        return norm, top_features

    def score_one(
        self, product: ProductRecord, uv: UserVector
    ) -> ScoreResult | None:
        passes, flags = self._hard_filter(product, uv)
        if not passes:
            return None

        sim, top = self._weighted_similarity(product, uv)
        penalty = self._penalty(product, uv)
        final = max(0.0, sim - penalty)

        return ScoreResult(
            product_id=product.id,
            score=final,
            top_contributing_features=top,
            constraint_passed_flags=flags,
            penalty_applied=penalty,
            raw_similarity=sim,
        )

    def score_all(
        self, products: list[ProductRecord], uv: UserVector
    ) -> list[ScoreResult]:
        results: list[ScoreResult] = []
        for p in products:
            r = self.score_one(p, uv)
            if r is not None:
                results.append(r)
        return sorted(results, key=lambda x: x.score, reverse=True)

    def diversify_mmr(
        self, results: list[ScoreResult], products_by_id: dict[str, ProductRecord], lambda_param: float = 0.7
    ) -> list[ScoreResult]:
        """Maximal Marginal Relevance: balance relevance and diversity."""
        if len(results) <= 3:
            return results[:3]

        selected: list[ScoreResult] = []
        remaining = results.copy()

        first = remaining.pop(0)
        selected.append(first)

        while len(selected) < 3 and remaining:
            best_idx = -1
            best_mmr = -1.0

            for i, cand in enumerate(remaining):
                rel = cand.score
                max_sim = 0.0
                for s in selected:
                    sp = products_by_id.get(s.product_id)
                    cp = products_by_id.get(cand.product_id)
                    if sp and cp:
                        flavor_sim = _cosine_sim(
                            _binary_flavor_vector(sp.flavor_tags),
                            _binary_flavor_vector(cp.flavor_tags),
                        )
                        roast_diff = abs(sp.roast_level - cp.roast_level) / 4.0
                        max_sim = max(max_sim, flavor_sim * 0.6 + (1 - roast_diff) * 0.4)
                mmr = lambda_param * rel - (1 - lambda_param) * max_sim
                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = i

            if best_idx >= 0:
                selected.append(remaining.pop(best_idx))
            else:
                break

        return selected
