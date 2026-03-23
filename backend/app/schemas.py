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


class ConsumerPreferenceVector(StructuredVector):
    origin: Optional[str] = None


class UserPreferenceResponse(BaseModel):
    preferences: ConsumerPreferenceVector | None = None


class UserPreferenceUpdate(BaseModel):
    preferences: ConsumerPreferenceVector


class RecommendationCoffeeItem(BaseModel):
    id: str
    name: str
    origin: Optional[str] = None
    roast_level: int
    price: float
    size_options: list[str] = Field(default_factory=list)
    flavor_tags: list[str] = Field(default_factory=list)
    description: Optional[str] = None


class NearbyCafeRecommendation(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    distance_km: float
    rating: float | None = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    serves: list[str] = Field(default_factory=list)
    menu_count: int = 0
    match_score: float
    reasons: list[str] = Field(default_factory=list)
    recommended_coffee: RecommendationCoffeeItem


class ExternalCoffeePlace(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    distance_km: float
    rating: float | None = None
    user_rating_count: int | None = None
    open_now: bool | None = None
    maps_url: Optional[str] = None
    directions_url: Optional[str] = None
    website: Optional[str] = None
    order_url: Optional[str] = None
    brand: Optional[str] = None
    is_chain: bool = False
    source: str = "google_places"


class NearbyPlacesResponse(BaseModel):
    places: list[ExternalCoffeePlace] = Field(default_factory=list)
    maps_provider: str


class NearbyRecommendationRequest(BaseModel):
    lat: float
    lng: float
    location_label: Optional[str] = None
    radius_km: float = Field(default=15.0, ge=1.0, le=50.0)
    preferences: ConsumerPreferenceVector
    save_preferences: bool = True


class NearbyRecommendationResponse(BaseModel):
    preferences: ConsumerPreferenceVector
    recommended_cafes: list[NearbyCafeRecommendation] = Field(default_factory=list)
    nearby_places: list[ExternalCoffeePlace] = Field(default_factory=list)
    maps_provider: str
    saved_to_history: bool = False


class RecommendationHistoryEntry(BaseModel):
    id: str
    created_at: str
    location_label: Optional[str] = None
    lat: float
    lng: float
    radius_km: float
    preferences: ConsumerPreferenceVector
    recommended_cafes: list[NearbyCafeRecommendation] = Field(default_factory=list)
    nearby_places: list[ExternalCoffeePlace] = Field(default_factory=list)


class RecommendationHistoryResponse(BaseModel):
    recommendations: list[RecommendationHistoryEntry] = Field(default_factory=list)
