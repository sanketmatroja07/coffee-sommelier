"""Partner API - cafe owners manage their cafes, menu, add-ons."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Cafe, Coffee, CafeCoffee, CafeAddOn, Order, OrderItem, User

from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/partner", tags=["partner"])


def _require_partner(user: User | None) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not user.is_partner:
        raise HTTPException(status_code=403, detail="Partner access required")
    return user


# --- Schemas ---

class CafeCreate(BaseModel):
    name: str
    address: str | None = None
    lat: float = 37.7749
    lng: float = -122.4194
    phone: str | None = None
    website: str | None = None
    hours: dict | None = None
    image_url: str | None = None


class CafeUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    phone: str | None = None
    website: str | None = None
    hours: dict | None = None
    image_url: str | None = None


class AddCoffeeToCafeInput(BaseModel):
    name: str
    roast_level: int = 3
    acidity: int = 3
    body: int = 3
    sweetness: int = 3
    flavor_tags: list[str] = []
    origin: str | None = None
    process: str | None = None
    brew_methods: list[str] = []
    description: str | None = None
    caffeine_level: str = "full"
    price: float = 5.0
    size_options: list[str] = ["12oz", "16oz"]


class AddOnCreate(BaseModel):
    name: str
    addon_type: str  # milk, extra_shot, syrup, ice, other
    price: float = 0.0


# --- Endpoints ---

@router.get("/cafes")
async def list_my_cafes(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """List cafes owned by the current partner."""
    _require_partner(user)
    cafes = (
        await db.execute(select(Cafe).where(Cafe.owner_user_id == user.id))
    ).scalars().all()
    return [{"id": str(c.id), "name": c.name, "address": c.address} for c in cafes]


@router.post("/cafes")
async def create_cafe(
    body: CafeCreate,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Create a new cafe (partner only)."""
    _require_partner(user)
    cafe = Cafe(
        owner_user_id=user.id,
        name=body.name,
        address=body.address,
        lat=body.lat,
        lng=body.lng,
        phone=body.phone,
        website=body.website,
        hours=body.hours,
        image_url=body.image_url,
    )
    db.add(cafe)
    await db.flush()
    return {"id": str(cafe.id), "name": cafe.name}


@router.patch("/cafes/{cafe_id}")
async def update_cafe(
    cafe_id: str,
    body: CafeUpdate,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Update cafe (owner only)."""
    _require_partner(user)
    cafe = (await db.execute(select(Cafe).where(Cafe.id == cafe_id))).scalar_one_or_none()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    if str(cafe.owner_user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your cafe")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cafe, k, v)
    return {"id": str(cafe.id), "name": cafe.name}


@router.post("/cafes/{cafe_id}/coffees")
async def add_coffee_to_cafe(
    cafe_id: str,
    body: AddCoffeeToCafeInput,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Add a coffee (create if new) and link to cafe with price."""
    _require_partner(user)
    cafe = (await db.execute(select(Cafe).where(Cafe.id == cafe_id))).scalar_one_or_none()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    if str(cafe.owner_user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your cafe")

    coffee = Coffee(
        name=body.name,
        roast_level=body.roast_level,
        acidity=body.acidity,
        body=body.body,
        sweetness=body.sweetness,
        flavor_tags=body.flavor_tags,
        origin=body.origin,
        process=body.process,
        brew_methods=body.brew_methods,
        description=body.description,
        caffeine_level=body.caffeine_level,
    )
    db.add(coffee)
    await db.flush()

    cc = CafeCoffee(
        cafe_id=cafe_id,
        coffee_id=coffee.id,
        price=body.price,
        size_options=body.size_options or ["12oz", "16oz"],
    )
    db.add(cc)
    await db.flush()
    return {"cafe_coffee_id": str(cc.id), "coffee_id": str(coffee.id)}


@router.post("/cafes/{cafe_id}/addons")
async def create_addon(
    cafe_id: str,
    body: AddOnCreate,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Add an add-on (milk, extra shot, syrup, etc.) to cafe."""
    _require_partner(user)
    cafe = (await db.execute(select(Cafe).where(Cafe.id == cafe_id))).scalar_one_or_none()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    if str(cafe.owner_user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your cafe")
    valid_types = ["milk", "extra_shot", "syrup", "ice", "other"]
    if body.addon_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"addon_type must be one of {valid_types}")
    addon = CafeAddOn(
        cafe_id=cafe_id,
        name=body.name,
        addon_type=body.addon_type,
        price=body.price,
    )
    db.add(addon)
    await db.flush()
    return {"id": str(addon.id), "name": addon.name}


@router.get("/cafes/{cafe_id}/addons")
async def list_addons(
    cafe_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """List add-ons for a cafe."""
    _require_partner(user)
    cafe = (await db.execute(select(Cafe).where(Cafe.id == cafe_id))).scalar_one_or_none()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    if str(cafe.owner_user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your cafe")
    addons = (await db.execute(select(CafeAddOn).where(CafeAddOn.cafe_id == cafe_id))).scalars().all()
    return [{"id": str(a.id), "name": a.name, "addon_type": a.addon_type, "price": a.price} for a in addons]


@router.get("/orders")
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """List orders for cafes owned by the partner."""
    _require_partner(user)
    my_cafe_ids = (
        await db.execute(select(Cafe.id).where(Cafe.owner_user_id == user.id))
    ).scalars().all()
    my_cafe_ids = [str(c[0]) for c in my_cafe_ids]
    if not my_cafe_ids:
        return {"orders": []}
    orders = (
        await db.execute(
            select(Order).where(Order.cafe_id.in_(my_cafe_ids)).order_by(Order.created_at.desc())
        )
    ).scalars().all()
    result = []
    for o in orders:
        cafe = (await db.execute(select(Cafe).where(Cafe.id == o.cafe_id))).scalar_one_or_none()
        result.append({
            "id": str(o.id),
            "cafe_name": cafe.name if cafe else "Unknown",
            "status": o.status,
            "total": o.total,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return {"orders": result}
