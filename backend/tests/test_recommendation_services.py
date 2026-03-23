from types import SimpleNamespace

from app.scoring.engine import UserVector
from app.services.places import normalize_google_place
from app.services.recommendations import rank_cafe_matches


def test_normalize_google_place():
    place = {
        "id": "place-1",
        "displayName": {"text": "Blue Bottle Coffee"},
        "formattedAddress": "1 Market St, San Francisco, CA",
        "location": {"latitude": 37.794, "longitude": -122.395},
        "rating": 4.7,
        "userRatingCount": 1200,
        "googleMapsUri": "https://maps.google.com/?cid=123",
        "websiteUri": "https://example.com",
        "currentOpeningHours": {"openNow": True},
    }

    normalized = normalize_google_place(place, 37.795, -122.394)

    assert normalized is not None
    assert normalized["name"] == "Blue Bottle Coffee"
    assert normalized["open_now"] is True
    assert normalized["distance_km"] >= 0


def test_rank_cafe_matches_picks_best_menu_item_per_cafe():
    cafe_a = SimpleNamespace(
        id="cafe-a",
        name="Cafe A",
        address="A Street",
        lat=37.0,
        lng=-122.0,
        rating=4.8,
        image_url=None,
        phone=None,
        website=None,
    )
    cafe_b = SimpleNamespace(
        id="cafe-b",
        name="Cafe B",
        address="B Street",
        lat=37.01,
        lng=-122.01,
        rating=4.5,
        image_url=None,
        phone=None,
        website=None,
    )
    coffee_best = SimpleNamespace(
        id="coffee-1",
        name="Berry Filter",
        roast_level=2,
        acidity=4,
        body=3,
        sweetness=3,
        flavor_tags=["berry", "citrus"],
        process="Washed",
        origin="Ethiopia",
        brew_methods=["pour_over"],
        description="Bright and juicy",
        caffeine_level="full",
    )
    coffee_other = SimpleNamespace(
        id="coffee-2",
        name="Dark House",
        roast_level=5,
        acidity=1,
        body=5,
        sweetness=2,
        flavor_tags=["chocolate"],
        process="Natural",
        origin="Brazil",
        brew_methods=["espresso"],
        description="Bold",
        caffeine_level="full",
    )
    cafe_coffee_a = SimpleNamespace(id="menu-a", price=5.5, size_options=["12oz"], available=True)
    cafe_coffee_b = SimpleNamespace(id="menu-b", price=4.5, size_options=["12oz"], available=True)
    cafe_coffee_a.cafe_id = cafe_a.id
    cafe_coffee_b.cafe_id = cafe_b.id

    vector = UserVector(
        roast_preference=2,
        acidity_preference=4,
        body_preference=3,
        sweetness_preference=3,
        flavor_tags=["berry"],
        brew_method="pour_over",
        caffeine="full",
        price_max=None,
        milk=False,
    )

    ranked = rank_cafe_matches(
        [
          (cafe_a, 1.2, coffee_best, cafe_coffee_a),
          (cafe_b, 0.8, coffee_other, cafe_coffee_b),
        ],
        vector,
    )

    assert len(ranked) == 1
    assert ranked[0]["id"] == "cafe-a"
    assert ranked[0]["recommended_coffee"]["name"] == "Berry Filter"
