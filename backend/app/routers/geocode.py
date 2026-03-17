"""Geocoding - Photon (autocomplete) + Nominatim (fallback). Both OSM-based, no API key."""
from fastapi import APIRouter, Query
import httpx

router = APIRouter(prefix="/api/v1", tags=["geocode"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
PHOTON_URL = "https://photon.komoot.io/api/"


@router.get("/geocode")
async def geocode(q: str = Query(..., min_length=2)):
    """Convert address/city to lat, lng."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            NOMINATIM_URL,
            params={"q": q, "format": "json", "limit": 1},
            headers={"User-Agent": "CoffeeFinder/1.0"},
        )
    data = r.json()
    if not data:
        return {"lat": None, "lng": None}
    first = data[0]
    return {"lat": float(first["lat"]), "lng": float(first["lon"]), "display_name": first.get("display_name", "")}


@router.get("/geocode/autocomplete")
async def geocode_autocomplete(q: str = Query(..., min_length=2), limit: int = Query(5, ge=1, le=10)):
    """Search-as-you-type location suggestions (Photon - OSM)."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            PHOTON_URL,
            params={"q": q, "limit": limit, "lang": "en"},
            headers={"User-Agent": "CoffeeFinder/1.0"},
        )
    data = r.json()
    features = data.get("features", [])
    results = []
    for f in features:
        props = f.get("properties", {})
        coords = f.get("geometry", {}).get("coordinates", [0, 0])
        lng, lat = float(coords[0]), float(coords[1])
        name = props.get("name", "")
        city = props.get("city", props.get("county", ""))
        state = props.get("state", "")
        country = props.get("country", "")
        parts = [p for p in [name, city, state, country] if p]
        display = ", ".join(parts) if parts else name
        results.append({"lat": lat, "lng": lng, "display_name": display})
    return {"suggestions": results}
