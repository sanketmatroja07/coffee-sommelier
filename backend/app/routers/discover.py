"""Discovery API: search cafes by location and coffee preference."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from haversine import haversine

from app.database import get_db
from app.models import Cafe, Coffee, CafeCoffee
from app.scoring.engine import UserVector
from app.scoring.cafe_ranking import rank_cafes_by_preference

router = APIRouter(prefix="/api/v1", tags=["discover"])


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return haversine((lat1, lng1), (lat2, lng2), unit="km")


@router.get("/discover")
async def discover(
    lat: float = Query(37.7749),
    lng: float = Query(-122.4194),
    radius_km: float = Query(15.0),
    sort_by: str | None = Query("distance", description="distance | rating"),
    roast: int | None = Query(None),
    origin: str | None = Query(None),
    brew_method: str | None = Query(None),
    flavor_tags: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Search cafes by location, radius, sort order, and optional coffee filters."""
    cafes = (await db.execute(select(Cafe))).scalars().all()
    user_lat, user_lng = lat, lng

    # Filter by distance
    nearby = []
    for cafe in cafes:
        dist = _haversine_km(cafe.lat, cafe.lng, user_lat, user_lng)
        if dist <= radius_km:
            nearby.append((cafe, dist))

    # Build preference filters
    pref_filter = {}
    if roast is not None:
        pref_filter["roast_preference"] = roast
    if origin:
        pref_filter["origin_filter"] = origin
    if brew_method:
        pref_filter["brew_method"] = brew_method
    if flavor_tags:
        pref_filter["flavor_tags"] = [t.strip() for t in flavor_tags.split(",")]

    # Load menu for each cafe
    cafe_ids = [c.id for c, _ in nearby]
    cafe_coffees = (
        await db.execute(
            select(CafeCoffee, Coffee).join(Coffee, CafeCoffee.coffee_id == Coffee.id).where(
                CafeCoffee.cafe_id.in_(cafe_ids),
                CafeCoffee.available == True,
            )
        )
    ).all()

    menu_by_cafe: dict[str, list[tuple[Coffee, CafeCoffee]]] = {}
    for cc, cof in cafe_coffees:
        cid = str(cc.cafe_id)
        if cid not in menu_by_cafe:
            menu_by_cafe[cid] = []
        menu_by_cafe[cid].append((cof, cc))

    # Filter/rank by preference if provided
    if pref_filter:
        uv = UserVector(
            roast_preference=pref_filter.get("roast_preference", 3),
            acidity_preference=3,
            body_preference=3,
            sweetness_preference=3,
            flavor_tags=pref_filter.get("flavor_tags", []),
            brew_method=pref_filter.get("brew_method", "pour_over"),
            caffeine="full",
            price_max=None,
            milk=False,
        )
        nearby = rank_cafes_by_preference(nearby, menu_by_cafe, uv, origin_filter=pref_filter.get("origin_filter"))
    else:
        nearby.sort(key=lambda x: x[1])

    # Sort by distance or rating
    if sort_by == "rating":
        nearby.sort(key=lambda x: (-(x[0].rating or 0), x[1]))
    else:
        nearby.sort(key=lambda x: x[1])

    # Build response
    result = []
    for cafe, dist in nearby:
        cid = str(cafe.id)
        menu = menu_by_cafe.get(cid, [])
        coffee_summary = list(set(c.origin or "Blend" for c, _ in menu))[:5]
        result.append({
            "id": str(cafe.id),
            "name": cafe.name,
            "address": cafe.address,
            "lat": cafe.lat,
            "lng": cafe.lng,
            "distance_km": round(dist, 2),
            "rating": cafe.rating,
            "image_url": cafe.image_url,
            "phone": cafe.phone,
            "website": cafe.website,
            "serves": coffee_summary,
            "menu_count": len(menu),
        })

    return {"cafes": result}


@router.get("/coffees")
async def list_coffees(db: AsyncSession = Depends(get_db)):
    """List all coffees (for filter options)."""
    coffees = (await db.execute(select(Coffee))).scalars().all()
    origins = sorted(set(c.origin for c in coffees if c.origin))
    tags = set()
    for c in coffees:
        tags.update(c.flavor_tags or [])
    return {
        "coffees": [
            {"id": str(c.id), "name": c.name, "roast_level": c.roast_level, "origin": c.origin}
            for c in coffees
        ],
        "filter_options": {"origins": origins, "flavor_tags": sorted(tags)},
    }
