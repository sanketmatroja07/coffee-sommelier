from pydantic import BaseModel, Field
from typing import Optional


class StructuredVector(BaseModel):
    roast_preference: int = Field(ge=1, le=5)
    acidity_preference: int = Field(ge=1, le=5)
    body_preference: int = Field(ge=1, le=5)
    sweetness_preference: int = Field(ge=1, le=5)
    flavor_tags: list[str] = Field(default_factory=list)
    brew_method: str
    caffeine: str = "full"  # full, half, decaf
    price_max: Optional[float] = None
    milk: bool = False


class RecommendRequest(BaseModel):
    merchant_id: str
    session_id: str
    structured_vector: StructuredVector


class BrewGuideOut(BaseModel):
    grind: str
    time: str
    ratio: str
    temp: str
    tips: list[str]


class RecommendationItem(BaseModel):
    product_id: str
    score: float
    reasons: list[str]
    brew_guide: BrewGuideOut
    product: dict


class RecommendResponse(BaseModel):
    user_profile_id: str | None = None
    recommendations: list[RecommendationItem]


class AnalyticsRequest(BaseModel):
    merchant_id: str
    session_id: str
    event_type: str  # intake_start, intake_complete, recommendation_view, product_click, add_to_cart, feedback_submit
    product_id: Optional[str] = None
    payload: dict = Field(default_factory=dict)


class WeightsUpdate(BaseModel):
    roast: float = 1.0
    acidity: float = 1.0
    body: float = 1.0
    sweetness: float = 1.0
    flavor: float = 1.0


class FeedbackRequest(BaseModel):
    user_profile_id: str
    product_id: str
    rating: str  # Loved, OK, Disliked
    sour_bitter_slider: int = Field(ge=-2, le=2)
    weak_strong_slider: int = Field(ge=-2, le=2)
    notes: Optional[str] = None
