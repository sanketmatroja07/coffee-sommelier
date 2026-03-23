from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, UserPreference, UserRecommendationHistory
from app.routers.auth import get_current_user
from app.schemas import (
    ConsumerPreferenceVector,
    RecommendationHistoryEntry,
    RecommendationHistoryResponse,
    UserPreferenceResponse,
    UserPreferenceUpdate,
)

router = APIRouter(prefix="/api/v1/me", tags=["me"])


def require_user(user: User | None) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@router.get("/preferences", response_model=UserPreferenceResponse)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    current_user = require_user(user)
    pref = (
        await db.execute(
            select(UserPreference).where(UserPreference.user_id == current_user.id)
        )
    ).scalar_one_or_none()
    if not pref or not pref.preference_vector:
        return UserPreferenceResponse(preferences=None)
    return UserPreferenceResponse(
        preferences=ConsumerPreferenceVector(**pref.preference_vector)
    )


@router.put("/preferences", response_model=UserPreferenceResponse)
async def update_preferences(
    body: UserPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    current_user = require_user(user)
    pref = (
        await db.execute(
            select(UserPreference).where(UserPreference.user_id == current_user.id)
        )
    ).scalar_one_or_none()
    if not pref:
        pref = UserPreference(user_id=str(current_user.id), preference_vector=body.preferences.model_dump())
        db.add(pref)
    else:
        pref.preference_vector = body.preferences.model_dump()

    return UserPreferenceResponse(preferences=body.preferences)


@router.get("/recommendations", response_model=RecommendationHistoryResponse)
async def list_recommendation_history(
    limit: int = Query(10, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    current_user = require_user(user)
    history = (
        await db.execute(
            select(UserRecommendationHistory)
            .where(UserRecommendationHistory.user_id == current_user.id)
            .order_by(UserRecommendationHistory.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()

    return RecommendationHistoryResponse(
        recommendations=[
            RecommendationHistoryEntry(
                id=str(item.id),
                created_at=item.created_at.isoformat(),
                location_label=item.location_label,
                lat=float(item.lat),
                lng=float(item.lng),
                radius_km=float(item.radius_km),
                preferences=ConsumerPreferenceVector(**item.preference_vector),
                recommended_cafes=item.recommendations or [],
                nearby_places=item.external_places or [],
            )
            for item in history
        ]
    )
