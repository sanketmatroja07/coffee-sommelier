import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    merchant_id = Column(UUID(as_uuid=False), ForeignKey("merchants.id"), nullable=False)
    sku = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    roast_level = Column(Integer, nullable=False)  # 1-5
    acidity = Column(Integer, nullable=False)  # 1-5
    body = Column(Integer, nullable=False)  # 1-5
    sweetness = Column(Integer, nullable=False)  # 1-5
    flavor_tags = Column(ARRAY(Text), default=list)
    process = Column(String(100), nullable=True)
    origin = Column(String(100), nullable=True)
    elevation = Column(String(50), nullable=True)
    varietal = Column(String(100), nullable=True)
    price = Column(Float, nullable=False)
    caffeine_level = Column(String(20), default="full")  # full, half, decaf
    subscription_eligible = Column(Boolean, default=False)
    brew_methods_supported = Column(ARRAY(Text), default=list)
    active = Column(Boolean, default=True)


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    merchant_id = Column(UUID(as_uuid=False), ForeignKey("merchants.id"), nullable=False)
    session_id = Column(String(255), nullable=False)
    structured_vector = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    merchant_id = Column(UUID(as_uuid=False), ForeignKey("merchants.id"), nullable=True)
    user_profile_id = Column(UUID(as_uuid=False), ForeignKey("user_profiles.id"), nullable=True)
    event_type = Column(String(50), nullable=False)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_profile_id = Column(UUID(as_uuid=False), ForeignKey("user_profiles.id"), nullable=False)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id"), nullable=False)
    rating = Column(String(20), nullable=False)  # Loved, OK, Disliked
    sour_bitter_slider = Column(Integer, default=0)  # -2 to 2
    weak_strong_slider = Column(Integer, default=0)  # -2 to 2
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecommendationsLog(Base):
    __tablename__ = "recommendations_log"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_profile_id = Column(UUID(as_uuid=False), ForeignKey("user_profiles.id"), nullable=False)
    input_vector = Column(JSONB, nullable=False)
    output_product_ids = Column(ARRAY(Text), default=list)
    scores = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScoringWeight(Base):
    __tablename__ = "scoring_weights"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    merchant_id = Column(UUID(as_uuid=False), ForeignKey("merchants.id"), nullable=False)
    roast = Column(Float, default=1.0)
    acidity = Column(Float, default=1.0)
    body = Column(Float, default=1.0)
    sweetness = Column(Float, default=1.0)
    flavor = Column(Float, default=1.0)


# --- Coffee Finder (B2C) Models ---

class Cafe(Base):
    __tablename__ = "cafes"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    hours = Column(JSONB, nullable=True)  # {"mon": "7-18", ...}
    image_url = Column(String(500), nullable=True)
    rating = Column(Float, default=0.0)
    external_place_id = Column(String(255), nullable=True)  # For Google Places
    created_at = Column(DateTime, default=datetime.utcnow)


class Coffee(Base):
    __tablename__ = "coffees"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    roast_level = Column(Integer, nullable=False)  # 1-5
    acidity = Column(Integer, nullable=False)  # 1-5
    body = Column(Integer, nullable=False)  # 1-5
    sweetness = Column(Integer, nullable=False)  # 1-5
    flavor_tags = Column(ARRAY(Text), default=list)
    origin = Column(String(100), nullable=True)
    process = Column(String(100), nullable=True)
    brew_methods = Column(ARRAY(Text), default=list)
    description = Column(Text, nullable=True)
    caffeine_level = Column(String(20), default="full")  # full, half, decaf


class CafeCoffee(Base):
    __tablename__ = "cafe_coffees"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    cafe_id = Column(UUID(as_uuid=False), ForeignKey("cafes.id"), nullable=False)
    coffee_id = Column(UUID(as_uuid=False), ForeignKey("coffees.id"), nullable=False)
    price = Column(Float, nullable=False)
    size_options = Column(ARRAY(Text), default=list)  # ["12oz", "16oz"]
    available = Column(Boolean, default=True)


class CafeAddOn(Base):
    __tablename__ = "cafe_addons"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    cafe_id = Column(UUID(as_uuid=False), ForeignKey("cafes.id"), nullable=False)
    name = Column(String(100), nullable=False)
    addon_type = Column(String(30), nullable=False)  # milk, extra_shot, syrup, ice, other
    price = Column(Float, default=0.0)
    available = Column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    is_partner = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)  # Null for guest
    cafe_id = Column(UUID(as_uuid=False), ForeignKey("cafes.id"), nullable=False)
    status = Column(String(30), default="pending")  # pending, preparing, ready, picked_up
    pickup_at = Column(DateTime, nullable=True)
    total = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False)
    cafe_coffee_id = Column(UUID(as_uuid=False), ForeignKey("cafe_coffees.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    size = Column(String(50), nullable=True)
    addons = Column(JSONB, default=list)  # [{"addon_id": "uuid", "name": "Oat milk", "price": 0.75}]
    special_instructions = Column(Text, nullable=True)
    price_at_order = Column(Float, nullable=False)


class ConsumerEvent(Base):
    __tablename__ = "consumer_events"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    preference_vector = Column(JSONB, nullable=True)


class UserRecommendationHistory(Base):
    __tablename__ = "user_recommendation_history"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    location_label = Column(String(255), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    radius_km = Column(Float, nullable=False, default=15.0)
    preference_vector = Column(JSONB, nullable=False)
    recommendations = Column(JSONB, nullable=False)
    external_places = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
