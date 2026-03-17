#!/usr/bin/env python3
"""Seed database with merchants and products."""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import async_session, engine
from app.models import Base, Merchant, Product, ScoringWeight, Cafe, Coffee, CafeCoffee, CafeAddOn


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seed_dir = os.path.join(base, "data", "seed")
    if not os.path.exists(seed_dir):
        seed_dir = os.path.join(base, "..", "data", "seed")

    with open(os.path.join(seed_dir, "merchants.json")) as f:
        merchants = json.load(f)

    with open(os.path.join(seed_dir, "products.json")) as f:
        products = json.load(f)

    async with async_session() as db:
        for m in merchants:
            existing = (await db.execute(select(Merchant).where(Merchant.id == m["id"]))).scalar_one_or_none()
            if not existing:
                db.add(Merchant(id=m["id"], name=m["name"], domain=m.get("domain")))
        await db.commit()

        for p in products:
            existing = (await db.execute(select(Product).where(Product.merchant_id == p["merchant_id"], Product.sku == p["sku"]))).scalar_one_or_none()
            if not existing:
                tags = p.get("flavor_tags") or []
                brew = p.get("brew_methods_supported") or []
                db.add(
                    Product(
                        merchant_id=p["merchant_id"],
                        sku=p["sku"],
                        name=p["name"],
                        roast_level=p["roast_level"],
                        acidity=p["acidity"],
                        body=p["body"],
                        sweetness=p["sweetness"],
                        flavor_tags=tags,
                        process=p.get("process"),
                        origin=p.get("origin"),
                        price=float(p["price"]),
                        caffeine_level=p.get("caffeine_level", "full"),
                        brew_methods_supported=brew,
                    )
                )
        await db.commit()

        for m in merchants:
            mid = m["id"]
            w = (await db.execute(select(ScoringWeight).where(ScoringWeight.merchant_id == mid))).scalar_one_or_none()
            if not w:
                db.add(ScoringWeight(merchant_id=mid))
        await db.commit()

        # Coffee Finder seed data
        cafes_path = os.path.join(seed_dir, "cafes.json")
        coffees_path = os.path.join(seed_dir, "coffees.json")
        cafe_coffees_path = os.path.join(seed_dir, "cafe_coffees.json")

        if os.path.exists(cafes_path):
            with open(cafes_path) as f:
                cafes = json.load(f)
            for c in cafes:
                existing = (await db.execute(select(Cafe).where(Cafe.id == c["id"]))).scalar_one_or_none()
                if not existing:
                    db.add(Cafe(
                        id=c["id"],
                        name=c["name"],
                        address=c.get("address"),
                        lat=float(c["lat"]),
                        lng=float(c["lng"]),
                        phone=c.get("phone"),
                        website=c.get("website"),
                        hours=c.get("hours"),
                        image_url=c.get("image_url"),
                        rating=float(c.get("rating", 0)),
                    ))
            await db.commit()

        if os.path.exists(coffees_path):
            with open(coffees_path) as f:
                coffees = json.load(f)
            for c in coffees:
                existing = (await db.execute(select(Coffee).where(Coffee.id == c["id"]))).scalar_one_or_none()
                if not existing:
                    db.add(Coffee(
                        id=c["id"],
                        name=c["name"],
                        roast_level=c["roast_level"],
                        acidity=c["acidity"],
                        body=c["body"],
                        sweetness=c["sweetness"],
                        flavor_tags=c.get("flavor_tags") or [],
                        origin=c.get("origin"),
                        process=c.get("process"),
                        brew_methods=c.get("brew_methods") or [],
                        description=c.get("description"),
                        caffeine_level=c.get("caffeine_level", "full"),
                    ))
            await db.commit()

        if os.path.exists(cafe_coffees_path):
            with open(cafe_coffees_path) as f:
                cafe_coffees = json.load(f)
            for cc in cafe_coffees:
                existing = (await db.execute(
                    select(CafeCoffee).where(
                        CafeCoffee.cafe_id == cc["cafe_id"],
                        CafeCoffee.coffee_id == cc["coffee_id"],
                    )
                )).scalar_one_or_none()
                if not existing:
                    db.add(CafeCoffee(
                        cafe_id=cc["cafe_id"],
                        coffee_id=cc["coffee_id"],
                        price=float(cc["price"]),
                        size_options=cc.get("size_options") or [],
                        available=cc.get("available", True),
                    ))
            await db.commit()

        addons_path = os.path.join(seed_dir, "addons.json")
        if os.path.exists(addons_path):
            with open(addons_path) as f:
                addons = json.load(f)
            for a in addons:
                existing = (
                    await db.execute(
                        select(CafeAddOn).where(
                            CafeAddOn.cafe_id == a["cafe_id"],
                            CafeAddOn.name == a["name"],
                        )
                    )
                ).scalars().first()
                if not existing:
                    db.add(CafeAddOn(
                        cafe_id=a["cafe_id"],
                        name=a["name"],
                        addon_type=a["addon_type"],
                        price=float(a.get("price", 0)),
                        available=True,
                    ))
            await db.commit()

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
