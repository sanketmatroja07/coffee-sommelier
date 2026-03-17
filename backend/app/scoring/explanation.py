"""
Template-based explanation generator. Grounded to catalog fields only.
LLM optional and pluggable - this is the fallback.
"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.scoring.engine import ScoreResult, ProductRecord, UserVector


def build_reasons(
    result: "ScoreResult",
    product: "ProductRecord",
    uv: "UserVector",
) -> list[str]:
    """Generate grounded reasons from catalog fields and scoring metadata."""
    reasons: list[str] = []

    if product.brew_methods_supported and uv.brew_method in product.brew_methods_supported:
        brew_label = uv.brew_method.replace("_", " ")
        reasons.append(f"Optimized for {brew_label}")

    roast_labels = {1: "light", 2: "light-medium", 3: "medium", 4: "medium-dark", 5: "dark"}
    roast = roast_labels.get(product.roast_level, "medium")
    if uv.roast_preference and abs(product.roast_level - uv.roast_preference) <= 1:
        reasons.append(f"{roast.capitalize()} roast matches your preference")

    if uv.acidity_preference <= 2 and product.acidity <= 2:
        reasons.append("Low acidity — gentle on sensitive stomachs")
    if uv.acidity_preference >= 4 and product.acidity >= 4:
        reasons.append("Bright, lively acidity")

    if product.flavor_tags:
        overlap = [t for t in uv.flavor_tags if t in product.flavor_tags]
        if overlap:
            labels = [t.replace("_", " ").title() for t in overlap[:2]]
            reasons.append(f"Strong {', '.join(labels)} notes")

    if product.origin:
        reasons.append(f"Origin: {product.origin}")

    if product.process:
        reasons.append(f"{product.process} process")

    if not reasons:
        reasons.append(f"{roast_labels.get(product.roast_level, 'medium')} roast")
        reasons.append("Balanced profile")

    return reasons[:5]
