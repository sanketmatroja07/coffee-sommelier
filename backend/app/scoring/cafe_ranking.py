"""Rank cafes by how well their menu matches user preference."""
from app.scoring.engine import ScoringEngine, ProductRecord, UserVector, ProductRecord as ProdRec


def rank_cafes_by_preference(
    nearby: list,
    menu_by_cafe: dict,
    uv: UserVector,
    origin_filter: str | None = None,
) -> list:
    """Sort cafes by best menu match. Filter out cafes with no matching coffees if filters applied."""
    engine = ScoringEngine()
    scored_cafes = []

    for cafe, dist in nearby:
        cid = str(cafe.id)
        menu = menu_by_cafe.get(cid, [])
        if not menu:
            scored_cafes.append((cafe, dist, 0.0))
            continue

        # Convert to ProductRecords
        records = []
        for cof, cc in menu:
            d = {
                "id": str(cof.id),
                "merchant_id": "",
                "sku": "",
                "name": cof.name,
                "roast_level": cof.roast_level,
                "acidity": cof.acidity,
                "body": cof.body,
                "sweetness": cof.sweetness,
                "flavor_tags": cof.flavor_tags or [],
                "process": cof.process,
                "origin": cof.origin,
                "price": cc.price,
                "caffeine_level": "full",
                "brew_methods_supported": cof.brew_methods or [],
                "active": cc.available,
            }
            records.append(ProdRec.from_dict(d))

        # Origin filter
        if origin_filter:
            records = [r for r in records if r.origin and origin_filter.lower() in r.origin.lower()]
            if not records:
                continue

        # Score best menu item
        scores = engine.score_all(records, uv)
        best = max((s.score for s in scores), default=0.0)
        scored_cafes.append((cafe, dist, best))

    # Sort by score descending, then by distance ascending
    scored_cafes.sort(key=lambda x: (-x[2], x[1]))
    return [(c, d) for c, d, _ in scored_cafes]
