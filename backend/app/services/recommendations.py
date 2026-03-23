from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.models import Cafe, CafeCoffee, Coffee
from app.scoring.engine import ProductRecord, ScoringEngine, UserVector
from app.scoring.explanation import build_reasons


def coffee_to_product_record(coffee: Coffee, cafe_coffee: CafeCoffee) -> ProductRecord:
    return ProductRecord(
        id=str(coffee.id),
        merchant_id="consumer",
        sku=str(cafe_coffee.id),
        name=coffee.name,
        roast_level=coffee.roast_level,
        acidity=coffee.acidity,
        body=coffee.body,
        sweetness=coffee.sweetness,
        flavor_tags=coffee.flavor_tags or [],
        process=coffee.process,
        origin=coffee.origin,
        price=float(cafe_coffee.price),
        caffeine_level=getattr(coffee, "caffeine_level", "full"),
        brew_methods_supported=coffee.brew_methods or [],
        active=bool(cafe_coffee.available),
    )


def rank_cafe_matches(
    cafe_rows: list[tuple[Cafe, float, Coffee, CafeCoffee]],
    user_vector: UserVector,
    limit: int = 6,
) -> list[dict[str, Any]]:
    engine = ScoringEngine()
    matches_by_cafe: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for cafe, distance_km, coffee, cafe_coffee in cafe_rows:
        product = coffee_to_product_record(coffee, cafe_coffee)
        score = engine.score_one(product, user_vector)
        if score is None:
            continue
        matches_by_cafe[str(cafe.id)].append(
            {
                "cafe": cafe,
                "distance_km": distance_km,
                "coffee": coffee,
                "cafe_coffee": cafe_coffee,
                "score": score,
                "reasons": build_reasons(score, product, user_vector),
            }
        )

    ranked: list[dict[str, Any]] = []
    for cafe_id, options in matches_by_cafe.items():
        options.sort(key=lambda item: item["score"].score, reverse=True)
        best = options[0]
        cafe = best["cafe"]
        menu_items = {item["coffee"].name for item in options}
        ranked.append(
            {
                "id": cafe_id,
                "name": cafe.name,
                "address": cafe.address,
                "lat": float(cafe.lat),
                "lng": float(cafe.lng),
                "distance_km": round(best["distance_km"], 2),
                "rating": cafe.rating,
                "image_url": cafe.image_url,
                "phone": cafe.phone,
                "website": cafe.website,
                "serves": sorted(menu_items)[:4],
                "menu_count": len(options),
                "match_score": round(best["score"].score, 2),
                "reasons": best["reasons"],
                "recommended_coffee": {
                    "id": str(best["coffee"].id),
                    "name": best["coffee"].name,
                    "origin": best["coffee"].origin,
                    "roast_level": best["coffee"].roast_level,
                    "price": float(best["cafe_coffee"].price),
                    "size_options": best["cafe_coffee"].size_options or [],
                    "flavor_tags": best["coffee"].flavor_tags or [],
                    "description": best["coffee"].description,
                },
            }
        )

    ranked.sort(key=lambda item: (-item["match_score"], item["distance_km"], -(item["rating"] or 0)))
    return ranked[:limit]
