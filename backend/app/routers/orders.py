"""Orders API - create and list orders."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Order, OrderItem, Cafe, CafeCoffee, Coffee, CafeAddOn
from app.routers.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1", tags=["orders"])


class OrderItemAddOnInput(BaseModel):
    addon_id: str
    name: str
    price: float


class OrderItemInput(BaseModel):
    cafe_coffee_id: str
    quantity: int = Field(ge=1)
    size: str | None
    addons: list[OrderItemAddOnInput] = []
    special_instructions: str | None = None
    price_at_order: float


class CreateOrderInput(BaseModel):
    cafe_id: str
    pickup_at: str | None = None
    items: list[OrderItemInput] = Field(min_length=1)
    total: float | None = None


@router.post("/orders")
async def create_order(
    body: CreateOrderInput,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Create order (guest or logged-in)."""
    cafe = (await db.execute(select(Cafe).where(Cafe.id == body.cafe_id))).scalar_one_or_none()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")

    pickup_dt = None
    if body.pickup_at:
        try:
            parsed = datetime.fromisoformat(body.pickup_at.replace("Z", "+00:00"))
            if parsed.tzinfo is not None:
                pickup_dt = parsed.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                pickup_dt = parsed
        except (ValueError, TypeError):
            pass
    computed_total = 0.0
    prepared_items: list[dict] = []

    for it in body.items:
        cc = (
            await db.execute(
                select(CafeCoffee).where(
                    CafeCoffee.id == it.cafe_coffee_id,
                    CafeCoffee.cafe_id == body.cafe_id,
                    CafeCoffee.available == True,
                )
            )
        ).scalar_one_or_none()
        if not cc:
            raise HTTPException(status_code=400, detail="One or more menu items are unavailable")

        if it.size and cc.size_options and it.size not in (cc.size_options or []):
            raise HTTPException(status_code=400, detail=f"{it.size} is not available for one of the items")

        add_on_total = 0.0
        addons_json = []
        for addon in it.addons:
            cafe_addon = (
                await db.execute(
                    select(CafeAddOn).where(
                        CafeAddOn.id == addon.addon_id,
                        CafeAddOn.cafe_id == body.cafe_id,
                        CafeAddOn.available == True,
                    )
                )
            ).scalar_one_or_none()
            if not cafe_addon:
                raise HTTPException(status_code=400, detail="One or more add-ons are unavailable")

            addons_json.append(
                {"addon_id": addon.addon_id, "name": cafe_addon.name, "price": cafe_addon.price}
            )
            add_on_total += cafe_addon.price

        unit_price = round(cc.price + add_on_total, 2)
        computed_total += round(unit_price * it.quantity, 2)
        prepared_items.append(
            {
                "cafe_coffee_id": it.cafe_coffee_id,
                "quantity": it.quantity,
                "size": it.size,
                "addons": addons_json,
                "special_instructions": (
                    it.special_instructions.strip()[:300] if it.special_instructions else None
                ),
                "price_at_order": unit_price,
            }
        )

    computed_total = round(computed_total, 2)
    if body.total is not None and abs(body.total - computed_total) > 0.01:
        raise HTTPException(status_code=400, detail="Cart total changed. Please review your order and try again.")

    order = Order(
        user_id=str(user.id) if user else None,
        cafe_id=body.cafe_id,
        status="pending",
        pickup_at=pickup_dt,
        total=computed_total,
    )
    db.add(order)
    await db.flush()

    for it in prepared_items:
        oi = OrderItem(
            order_id=order.id,
            cafe_coffee_id=it["cafe_coffee_id"],
            quantity=it["quantity"],
            size=it["size"],
            addons=it["addons"],
            special_instructions=it["special_instructions"],
            price_at_order=it["price_at_order"],
        )
        db.add(oi)

    await db.flush()
    return {"order_id": str(order.id), "status": "pending", "total": computed_total}


@router.get("/orders")
async def list_orders(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """List orders for current user (empty if guest)."""
    if not user:
        return {"orders": []}
    orders = (
        await db.execute(
            select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
        )
    ).scalars().all()
    result = []
    for o in orders:
        cafe = (await db.execute(select(Cafe).where(Cafe.id == o.cafe_id))).scalar_one_or_none()
        items = (await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))).scalars().all()
        result.append({
            "id": str(o.id),
            "cafe_id": str(o.cafe_id),
            "cafe_name": cafe.name if cafe else "Unknown",
            "status": o.status,
            "total": o.total,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "pickup_at": o.pickup_at.isoformat() if o.pickup_at else None,
        })
    return {"orders": result}


@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Get order detail by ID. Guests can view any order (for confirmation)."""
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user and order.user_id and str(order.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your order")
    cafe = (await db.execute(select(Cafe).where(Cafe.id == order.cafe_id))).scalar_one_or_none()
    items = (await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))).scalars().all()
    item_details = []
    for oi in items:
        cc = (await db.execute(select(CafeCoffee).where(CafeCoffee.id == oi.cafe_coffee_id))).scalar_one_or_none()
        coffee = None
        if cc:
            coffee = (await db.execute(select(Coffee).where(Coffee.id == cc.coffee_id))).scalar_one_or_none()
        item_details.append({
            "coffee_name": coffee.name if coffee else "Coffee",
            "quantity": oi.quantity,
            "size": oi.size,
            "addons": oi.addons or [],
            "special_instructions": oi.special_instructions,
            "price_at_order": oi.price_at_order,
        })
    return {
        "id": str(order.id),
        "cafe_id": str(order.cafe_id),
        "cafe_name": cafe.name if cafe else "Unknown",
        "cafe_address": cafe.address if cafe else None,
        "status": order.status,
        "total": order.total,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "pickup_at": order.pickup_at.isoformat() if order.pickup_at else None,
        "items": item_details,
    }
