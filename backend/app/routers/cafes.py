"""Cafe detail API."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Cafe, Coffee, CafeCoffee, CafeAddOn

router = APIRouter(prefix="/api/v1", tags=["cafes"])


@router.get("/cafes/{cafe_id}")
async def get_cafe(cafe_id: str, db: AsyncSession = Depends(get_db)):
    """Cafe detail with full menu."""
    cafe = (await db.execute(select(Cafe).where(Cafe.id == cafe_id))).scalar_one_or_none()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")

    menu_rows = (
        await db.execute(
            select(CafeCoffee, Coffee)
            .join(Coffee, CafeCoffee.coffee_id == Coffee.id)
            .where(CafeCoffee.cafe_id == cafe_id, CafeCoffee.available == True)
        )
    ).all()

    menu = []
    for cc, cof in menu_rows:
        menu.append({
            "id": str(cc.id),
            "coffee_id": str(cof.id),
            "name": cof.name,
            "origin": cof.origin,
            "roast_level": cof.roast_level,
            "flavor_tags": cof.flavor_tags or [],
            "brew_methods": cof.brew_methods or [],
            "description": getattr(cof, "description", None),
            "caffeine_level": getattr(cof, "caffeine_level", "full"),
            "price": cc.price,
            "size_options": cc.size_options or [],
        })

    addons = (await db.execute(select(CafeAddOn).where(CafeAddOn.cafe_id == cafe_id, CafeAddOn.available == True))).scalars().all()
    addons_list = [{"id": str(a.id), "name": a.name, "addon_type": a.addon_type, "price": a.price} for a in addons]

    return {
        "id": str(cafe.id),
        "name": cafe.name,
        "address": cafe.address,
        "lat": cafe.lat,
        "lng": cafe.lng,
        "phone": cafe.phone,
        "website": cafe.website,
        "hours": cafe.hours,
        "image_url": cafe.image_url,
        "rating": cafe.rating,
        "menu": menu,
        "addons": addons_list,
    }
