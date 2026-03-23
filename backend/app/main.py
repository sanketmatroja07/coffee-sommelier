from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, File, UploadFile, Body
from pydantic import BaseModel as PydanticBase
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db, engine, Base
from app.models import Merchant, Product, UserProfile, Interaction, Feedback, RecommendationsLog, ScoringWeight, Cafe, Order, OrderItem, ConsumerEvent
from app.schemas import (
    WeightsUpdate,
    RecommendRequest,
    RecommendResponse,
    RecommendationItem,
    BrewGuideOut,
    AnalyticsRequest,
    FeedbackRequest,
)
from app.scoring.engine import ScoringEngine, ProductRecord, UserVector, ScoreResult
from app.scoring.explanation import build_reasons
from app.scoring.brew_guide import get_brew_guide
from app.routers import auth, cafes, discover, geocode, me, orders, partner, recommendations

security = HTTPBasic()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Coffee Sommelier API",
    description="B2B Shopify-embeddable recommendation engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(discover.router)
app.include_router(cafes.router)
app.include_router(orders.router)
app.include_router(auth.router)
app.include_router(geocode.router)
app.include_router(partner.router)
app.include_router(me.router)
app.include_router(recommendations.router)


class ConsumerEventInput(PydanticBase):
    event_type: str
    payload: dict | None = None


@app.post("/api/v1/consumer-events")
async def consumer_events(body: ConsumerEventInput):
    from app.database import async_session
    async with async_session() as db:
        db.add(ConsumerEvent(event_type=body.event_type, payload=body.payload))
        await db.commit()
    return {"ok": True}


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _verify_basic(credentials: HTTPBasicCredentials = Depends(security)) -> bool:
    if credentials.username != settings.admin_user or credentials.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return True


def _product_to_dict(p) -> dict:
    return {
        "id": str(p.id),
        "merchant_id": str(p.merchant_id),
        "sku": p.sku,
        "name": p.name,
        "roast_level": p.roast_level,
        "acidity": p.acidity,
        "body": p.body,
        "sweetness": p.sweetness,
        "flavor_tags": p.flavor_tags or [],
        "process": p.process,
        "origin": p.origin,
        "price": p.price,
        "caffeine_level": p.caffeine_level,
        "brew_methods_supported": p.brew_methods_supported or [],
    }


def _product_to_record(p) -> ProductRecord:
    return ProductRecord.from_dict(_product_to_dict(p))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/v1/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest, db: AsyncSession = Depends(get_db)):
    uv = UserVector.from_dict(req.structured_vector.model_dump())

    merchant = (await db.execute(select(Merchant).where(Merchant.id == req.merchant_id))).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    products = (
        await db.execute(
            select(Product).where(
                Product.merchant_id == req.merchant_id,
                Product.active == True,
            )
        )
    ).scalars().all()

    weights = (
        await db.execute(
            select(ScoringWeight).where(ScoringWeight.merchant_id == req.merchant_id)
        )
    ).scalar_one_or_none()

    w = weights or ScoringWeight(merchant_id=req.merchant_id)
    engine = ScoringEngine(
        roast_weight=w.roast,
        acidity_weight=w.acidity,
        body_weight=w.body,
        sweetness_weight=w.sweetness,
        flavor_weight=w.flavor,
    )

    records = [_product_to_record(p) for p in products]
    records_by_id = {r.id: r for r in records}
    scored = engine.score_all(records, uv)
    diversified = engine.diversify_mmr(scored, records_by_id)

    top3 = diversified[:3]

    low_acid = uv.acidity_preference <= 2
    low_bitterness = False

    profile, _ = await _get_or_create_profile(db, req.merchant_id, req.session_id, req.structured_vector.model_dump())

    items: list[RecommendationItem] = []
    for r in top3:
        p = next(x for x in products if str(x.id) == r.product_id)
        pr = records_by_id.get(r.product_id) or _product_to_record(p)
        reasons = build_reasons(r, pr, uv)
        brew = get_brew_guide(uv.brew_method, low_acid, low_bitterness)

        items.append(
            RecommendationItem(
                product_id=str(p.id),
                score=round(r.score, 2),
                reasons=reasons,
                brew_guide=BrewGuideOut(**brew),
                product=_product_to_dict(p),
            )
        )
    if profile:
        log = RecommendationsLog(
            user_profile_id=profile.id,
            input_vector=req.structured_vector.model_dump(),
            output_product_ids=[i.product_id for i in items],
            scores={i.product_id: i.score for i in items},
        )
        db.add(log)

    return RecommendResponse(user_profile_id=str(profile.id) if profile else None, recommendations=items)


async def _get_or_create_profile(db: AsyncSession, merchant_id: str, session_id: str, vector: dict):
    existing = (
        await db.execute(
            select(UserProfile).where(
                UserProfile.merchant_id == merchant_id,
                UserProfile.session_id == session_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing, False
    profile = UserProfile(merchant_id=merchant_id, session_id=session_id, structured_vector=vector)
    db.add(profile)
    await db.flush()
    return profile, True


@app.post("/api/v1/analytics")
async def analytics(req: AnalyticsRequest, db: AsyncSession = Depends(get_db)):
    profile = (
        await db.execute(
            select(UserProfile).where(
                UserProfile.merchant_id == req.merchant_id,
                UserProfile.session_id == req.session_id,
            )
        )
    ).scalar_one_or_none()

    interaction = Interaction(
        merchant_id=req.merchant_id,
        user_profile_id=profile.id if profile else None,
        event_type=req.event_type,
        product_id=req.product_id,
    )
    db.add(interaction)
    return {"ok": True}


@app.post("/api/v1/feedback")
async def feedback(req: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    fb = Feedback(
        user_profile_id=req.user_profile_id,
        product_id=req.product_id,
        rating=req.rating,
        sour_bitter_slider=req.sour_bitter_slider,
        weak_strong_slider=req.weak_strong_slider,
        notes=req.notes,
    )
    db.add(fb)
    return {"ok": True}


@app.get("/api/v1/brew-guide/{brew_method}")
async def brew_guide(
    brew_method: str,
    low_acid: bool = Query(False),
    low_bitterness: bool = Query(False),
):
    guide = get_brew_guide(brew_method, low_acid, low_bitterness)
    return BrewGuideOut(**guide)


@app.post("/admin/products/upload")
async def admin_upload_products(
    merchant_id: str = Query(...),
    file: UploadFile = File(...),
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    import csv
    from io import StringIO
    content = (await file.read()).decode("utf-8")
    reader = csv.DictReader(StringIO(content))
    count = 0
    for row in reader:
        tags = (row.get("flavor_tags") or "").split(";") if row.get("flavor_tags") else []
        brew = (row.get("brew_methods_supported") or "").split(";") if row.get("brew_methods_supported") else []
        p = Product(
            merchant_id=merchant_id,
            sku=row.get("sku", ""),
            name=row.get("name", ""),
            roast_level=int(row.get("roast_level", 3)),
            acidity=int(row.get("acidity", 3)),
            body=int(row.get("body", 3)),
            sweetness=int(row.get("sweetness", 3)),
            flavor_tags=tags,
            process=row.get("process"),
            origin=row.get("origin"),
            price=float(row.get("price", 0)),
            caffeine_level=row.get("caffeine_level", "full"),
            brew_methods_supported=brew,
        )
        db.add(p)
        count += 1
    await db.flush()
    return {"uploaded": count}


@app.get("/admin/products")
async def admin_products(
    merchant_id: str = Query(...),
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    products = (
        await db.execute(
            select(Product).where(Product.merchant_id == merchant_id)
        )
    ).scalars().all()
    return [ _product_to_dict(p) for p in products ]


@app.get("/admin/weights")
async def admin_weights(
    merchant_id: str = Query(...),
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    w = (
        await db.execute(
            select(ScoringWeight).where(ScoringWeight.merchant_id == merchant_id)
        )
    ).scalar_one_or_none()
    if not w:
        return {"roast": 1.0, "acidity": 1.0, "body": 1.0, "sweetness": 1.0, "flavor": 1.0}
    return {"roast": w.roast, "acidity": w.acidity, "body": w.body, "sweetness": w.sweetness, "flavor": w.flavor}


@app.patch("/admin/weights")
async def admin_update_weights(
    merchant_id: str = Query(...),
    weights: WeightsUpdate | None = Body(default=None),
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    w_body = weights or WeightsUpdate()
    w = (
        await db.execute(
            select(ScoringWeight).where(ScoringWeight.merchant_id == merchant_id)
        )
    ).scalar_one_or_none()
    if not w:
        w = ScoringWeight(merchant_id=merchant_id)
        db.add(w)
        await db.flush()
    w.roast = w_body.roast
    w.acidity = w_body.acidity
    w.body = w_body.body
    w.sweetness = w_body.sweetness
    w.flavor = w_body.flavor
    return {"ok": True}


@app.get("/admin/analytics")
async def admin_analytics(
    merchant_id: str = Query(...),
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    intake_start = (
        await db.execute(
            select(Interaction).where(
                Interaction.merchant_id == merchant_id,
                Interaction.event_type == "intake_start",
            )
        )
    ).scalars().all()
    intake_complete = (
        await db.execute(
            select(Interaction).where(
                Interaction.merchant_id == merchant_id,
                Interaction.event_type == "intake_complete",
            )
        )
    ).scalars().all()
    add_to_cart = (
        await db.execute(
            select(Interaction).where(
                Interaction.merchant_id == merchant_id,
                Interaction.event_type == "add_to_cart",
            )
        )
    ).scalars().all()

    completion = len(intake_complete) / len(intake_start) if intake_start else 0.0
    return {
        "intake_start_count": len(intake_start),
        "intake_complete_count": len(intake_complete),
        "completion_rate": round(completion, 2),
        "add_to_cart_count": len(add_to_cart),
    }


@app.get("/admin/cafes")
async def admin_cafes(
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    cafes = (await db.execute(select(Cafe))).scalars().all()
    return [{"id": str(c.id), "name": c.name, "address": c.address, "lat": c.lat, "lng": c.lng, "rating": c.rating} for c in cafes]


@app.get("/admin/orders")
async def admin_orders(
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    orders = (await db.execute(select(Order).order_by(Order.created_at.desc()))).scalars().all()
    result = []
    for o in orders:
        items = (await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))).scalars().all()
        cafe = (await db.execute(select(Cafe).where(Cafe.id == o.cafe_id))).scalar_one_or_none()
        result.append({
            "id": str(o.id),
            "cafe_name": cafe.name if cafe else "Unknown",
            "status": o.status,
            "total": o.total,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return result


@app.patch("/admin/orders/{order_id}")
async def admin_update_order_status(
    order_id: str,
    status: str = Query(..., pattern="^(pending|preparing|ready|picked_up)$"),
    _: bool = Depends(_verify_basic),
    db: AsyncSession = Depends(get_db),
):
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    await db.commit()
    return {"ok": True, "status": status}
