from __future__ import annotations

import asyncio
from urllib.parse import quote_plus
from typing import Any

import httpx
from haversine import haversine

from app.config import settings

GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby"
GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_PLACES_FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.websiteUri",
        "places.currentOpeningHours",
        "places.primaryType",
    ]
)
CHAIN_TEXT_QUERIES = [
    "Starbucks",
    "Dunkin",
]
CHAIN_ACTIONS = {
    "starbucks": {
        "brand": "Starbucks",
        "order_url": "https://www.starbucks.com/stores-and-ordering",
    },
    "dunkin": {
        "brand": "Dunkin",
        "order_url": "https://www.dunkindonuts.com/en",
    },
}


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return haversine((lat1, lng1), (lat2, lng2), unit="km")


def _build_google_directions_url(place_id: str, lat: float, lng: float) -> str:
    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&destination={lat},{lng}"
        f"&destination_place_id={quote_plus(place_id)}"
        "&travelmode=driving"
    )


def _enrich_chain_actions(name: str, website: str | None) -> dict[str, Any]:
    lowered = name.lower()
    for key, meta in CHAIN_ACTIONS.items():
        if key in lowered:
            return {
                "brand": meta["brand"],
                "is_chain": True,
                "order_url": meta["order_url"],
            }
    return {
        "brand": None,
        "is_chain": False,
        "order_url": website,
    }


def normalize_google_place(place: dict[str, Any], user_lat: float, user_lng: float) -> dict[str, Any] | None:
    location = place.get("location") or {}
    lat = location.get("latitude")
    lng = location.get("longitude")
    if lat is None or lng is None:
        return None

    display_name = (place.get("displayName") or {}).get("text") or "Coffee shop"
    opening_hours = place.get("currentOpeningHours") or {}
    website = place.get("websiteUri")
    chain_meta = _enrich_chain_actions(display_name, website)
    place_id = place.get("id") or display_name.lower().replace(" ", "-")

    return {
        "id": place_id,
        "name": display_name,
        "address": place.get("formattedAddress"),
        "lat": float(lat),
        "lng": float(lng),
        "distance_km": round(distance_km(float(lat), float(lng), user_lat, user_lng), 2),
        "rating": place.get("rating"),
        "user_rating_count": place.get("userRatingCount"),
        "open_now": opening_hours.get("openNow"),
        "maps_url": place.get("googleMapsUri"),
        "directions_url": _build_google_directions_url(place_id, float(lat), float(lng)),
        "website": website,
        **chain_meta,
        "source": "google_places",
    }


async def _google_places_post(
    client: httpx.AsyncClient,
    url: str,
    payload: dict[str, Any],
    lat: float,
    lng: float,
) -> list[dict[str, Any]]:
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.google_places_api_key,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
    }
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    data = response.json()
    normalized: list[dict[str, Any]] = []
    for place in data.get("places", []):
        item = normalize_google_place(place, lat, lng)
        if item:
            normalized.append(item)
    return normalized


async def search_google_coffee_places(
    lat: float,
    lng: float,
    radius_km: float,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    if not settings.google_places_api_key:
        return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        nearby_payload = {
            "includedTypes": ["coffee_shop", "cafe"],
            "maxResultCount": min(limit or settings.google_places_max_results, 20),
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": min(radius_km * 1000, 50000),
                }
            },
            "rankPreference": "DISTANCE",
            "languageCode": "en",
            "regionCode": settings.google_places_region_code,
        }
        tasks = [
            _google_places_post(client, GOOGLE_PLACES_SEARCH_URL, nearby_payload, lat, lng),
        ]
        for query in CHAIN_TEXT_QUERIES:
            tasks.append(
                _google_places_post(
                    client,
                    GOOGLE_PLACES_TEXT_SEARCH_URL,
                    {
                        "textQuery": query,
                        "maxResultCount": 8,
                        "locationBias": {
                            "circle": {
                                "center": {"latitude": lat, "longitude": lng},
                                "radius": min(radius_km * 1000, 50000),
                            }
                        },
                        "languageCode": "en",
                        "regionCode": settings.google_places_region_code,
                    },
                    lat,
                    lng,
                )
            )
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    merged: dict[str, dict[str, Any]] = {}
    for response in responses:
        if isinstance(response, Exception):
            continue
        for item in response:
            merged[item["id"]] = item

    results = list(merged.values())
    results.sort(key=lambda item: (0 if item.get("is_chain") else 1, item["distance_km"], -(item.get("rating") or 0)))
    return results[: max(limit or settings.google_places_max_results, 20)]
