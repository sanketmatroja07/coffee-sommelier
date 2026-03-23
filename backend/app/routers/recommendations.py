from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Cafe, CafeCoffee, Coffee, User, UserPreference, UserRecommendationHistory
from app.routers.auth import get_current_user
from app.schemas import NearbyPlacesResponse, NearbyRecommendationRequest, NearbyRecommendationResponse
from app.scoring.engine import UserVector
from app.services.places import distance_km, search_google_coffee_places
from app.services.recommendations import rank_cafe_matches

router = APIRouter(prefix="/api/v1", tags=["recommendations"])


@router.post("/recommendations/nearby", response_model=NearbyRecommendationResponse)
async def recommend_nearby_cafes(
    body: NearbyRecommendationRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    cafes = (await db.execute(select(Cafe))).scalars().all()
    nearby_cafes: list[tuple[Cafe, float]] = []
    for cafe in cafes:
        km = distance_km(cafe.lat, cafe.lng, body.lat, body.lng)
        if km <= body.radius_km:
            nearby_cafes.append((cafe, km))

    cafe_ids = [cafe.id for cafe, _ in nearby_cafes]
    cafe_menu_rows: list[tuple[Cafe, float, Coffee, CafeCoffee]] = []
    if cafe_ids:
        menu_rows = (
            await db.execute(
                select(CafeCoffee, Coffee)
                .join(Coffee, CafeCoffee.coffee_id == Coffee.id)
                .where(CafeCoffee.cafe_id.in_(cafe_ids), CafeCoffee.available == True)
            )
        ).all()
        distance_by_cafe = {str(cafe.id): km for cafe, km in nearby_cafes}
        cafe_by_id = {str(cafe.id): cafe for cafe, _ in nearby_cafes}
        for cafe_coffee, coffee in menu_rows:
            cafe = cafe_by_id.get(str(cafe_coffee.cafe_id))
            if not cafe:
                continue
            cafe_menu_rows.append((cafe, distance_by_cafe[str(cafe.id)], coffee, cafe_coffee))

    user_vector = UserVector.from_dict(body.preferences.model_dump())
    recommended_cafes = rank_cafe_matches(cafe_menu_rows, user_vector)
    nearby_places = await search_google_coffee_places(body.lat, body.lng, body.radius_km)

    saved_to_history = False
    if user:
        if body.save_preferences:
            pref = (
                await db.execute(select(UserPreference).where(UserPreference.user_id == user.id))
            ).scalar_one_or_none()
            if not pref:
                pref = UserPreference(user_id=str(user.id), preference_vector=body.preferences.model_dump())
                db.add(pref)
            else:
                pref.preference_vector = body.preferences.model_dump()

        history = UserRecommendationHistory(
            user_id=str(user.id),
            location_label=body.location_label,
            lat=body.lat,
            lng=body.lng,
            radius_km=body.radius_km,
            preference_vector=body.preferences.model_dump(),
            recommendations=recommended_cafes,
            external_places=nearby_places,
        )
        db.add(history)
        saved_to_history = True

    return NearbyRecommendationResponse(
        preferences=body.preferences,
        recommended_cafes=recommended_cafes,
        nearby_places=nearby_places,
        maps_provider="google_places" if nearby_places else "local_catalog",
        saved_to_history=saved_to_history,
    )


@router.get("/places/nearby", response_model=NearbyPlacesResponse)
async def get_live_places(
    lat: float,
    lng: float,
    radius_km: float = 15.0,
):
    places = await search_google_coffee_places(lat, lng, radius_km, limit=24)
    return NearbyPlacesResponse(
        places=places,
        maps_provider="google_places" if places else "unavailable",
    )
