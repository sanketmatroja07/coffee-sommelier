import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePreferences } from "../context/PreferenceContext";
import { track } from "../lib/analytics";
import { CafeMap } from "../components/CafeMap";
import { CafeCard } from "../components/CafeCard";
import { LocationSearch } from "../components/LocationSearch";
import "./Discover.css";
import "../components/LocationSearch.css";

interface Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_km: number;
  rating: number;
  image_url: string | null;
  serves: string[];
  menu_count: number;
  match_score?: number;
  reasons?: string[];
  recommended_coffee?: {
    id: string;
    name: string;
    origin: string | null;
    roast_level: number;
    price: number;
    size_options: string[];
    flavor_tags: string[];
    description?: string | null;
  };
}

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_km: number;
  rating: number | null;
  user_rating_count?: number | null;
  open_now?: boolean | null;
  maps_url?: string | null;
  directions_url?: string | null;
  website?: string | null;
  order_url?: string | null;
  brand?: string | null;
  is_chain?: boolean;
}

interface DiscoverProps {
  apiBase: string;
}

type LocationState = "detecting" | "ready" | "prompt_search";

export function Discover({ apiBase }: DiscoverProps) {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "nearby";
  const qParam = searchParams.get("q") ?? "";
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const roastParam = searchParams.get("roast") ?? "";
  const originParam = searchParams.get("origin") ?? "";
  const brewParam = searchParams.get("brew_method") ?? "";
  const flavorParam = searchParams.get("flavor_tags") ?? "";
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("detecting");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list" | "split">("split");
  const [filters, setFilters] = useState({
    roast: roastParam,
    origin: originParam,
    brew_method: brewParam,
    flavor_tags: flavorParam,
  });
  const [radiusKm, setRadiusKm] = useState(15);
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");
  const [addressQuery, setAddressQuery] = useState(qParam);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedCafes, setRecommendedCafes] = useState<Cafe[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapsProvider, setMapsProvider] = useState("local_catalog");
  const toast = useToast();
  const { preferences, hasCompletedQuiz } = usePreferences();
  const { getAuthHeader } = useAuth();
  const hasRecommendationProfile =
    hasCompletedQuiz ||
    Boolean(roastParam || originParam || brewParam || flavorParam);

  const doSearch = async () => {
    if (addressQuery.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiBase}/api/v1/geocode?q=${encodeURIComponent(addressQuery)}`
      );
      const data = await res.json();
      if (data.lat && data.lng) {
        setCoords({ lat: data.lat, lng: data.lng });
        setLocationState("ready");
        toast.success("Location updated");
        track("search_location", { query: addressQuery });
        addRecentSearch(addressQuery, data.lat, data.lng);
      } else {
        toast.error("Location not found");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, displayName: string) => {
    setCoords({ lat, lng });
    setAddressQuery(displayName);
    setLocationState("ready");
    toast.success("Location updated");
    track("search_location", { query: displayName });
    addRecentSearch(displayName, lat, lng);
  };

  const RECENT_KEY = "coffee-finder-recent-locations";
  const addRecentSearch = (display: string, lat: number, lng: number) => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      const arr: Array<{ display: string; lat: number; lng: number }> = stored
        ? JSON.parse(stored)
        : [];
      const updated = [{ display, lat, lng }, ...arr.filter((r) => r.display !== display)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };
  const getRecentSearches = (): Array<{ display: string; lat: number; lng: number }> => {
    try {
      const s = localStorage.getItem(RECENT_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    track("discover_view");
  }, []);
  useEffect(() => {
    const roast = roastParam || (preferences.roast_preference ? String(preferences.roast_preference) : "");
    const origin = originParam || preferences.origin || "";
    const brew = brewParam || preferences.brew_method || "";
    const flavor = flavorParam || (preferences.flavor_tags?.length ? preferences.flavor_tags.join(",") : "");
    setFilters({ roast, origin, brew_method: brew, flavor_tags: flavor });
  }, [roastParam, originParam, brewParam, flavorParam, preferences]);

  // Resolve location: lat/lng from URL, geocode from q param, or geolocation for nearby
  useEffect(() => {
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setCoords({ lat, lng });
        setAddressQuery(qParam || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setLocationState("ready");
        return;
      }
    }
    if (qParam && qParam.trim().length >= 2) {
      setAddressQuery(qParam.trim());
      setLocationState("detecting");
      fetch(`${apiBase}/api/v1/geocode?q=${encodeURIComponent(qParam.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.lat && data.lng) {
            setCoords({ lat: data.lat, lng: data.lng });
            setLocationState("ready");
          } else {
            setLocationState("prompt_search");
          }
        })
        .catch(() => setLocationState("prompt_search"));
      return;
    }
    if (mode === "nearby" && navigator.geolocation) {
      setLocationState("detecting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationState("ready");
        },
        () => setLocationState("prompt_search")
      );
    } else {
      setLocationState("prompt_search");
    }
  }, [apiBase, qParam, mode, latParam, lngParam]);

  const fetchCafes = (showLoading = true) => {
    if (!coords) return;
    if (showLoading) setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius_km: String(radiusKm),
      sort_by: sortBy,
    });
    if (filters.roast) params.set("roast", filters.roast);
    if (filters.origin) params.set("origin", filters.origin);
    if (filters.brew_method) params.set("brew_method", filters.brew_method);
    if (filters.flavor_tags) params.set("flavor_tags", filters.flavor_tags);
    return fetch(`${apiBase}/api/v1/discover?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load cafes");
        return r.json();
      })
      .then((data) => {
        setCafes(data.cafes || []);
      })
      .catch(() => setError("Couldn't load cafes. Check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!coords || locationState !== "ready") {
      setLoading(false);
      setCafes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius_km: String(radiusKm),
      sort_by: sortBy,
    });
    if (filters.roast) params.set("roast", filters.roast);
    if (filters.origin) params.set("origin", filters.origin);
    if (filters.brew_method) params.set("brew_method", filters.brew_method);
    if (filters.flavor_tags) params.set("flavor_tags", filters.flavor_tags);
    fetch(`${apiBase}/api/v1/discover?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setCafes(data.cafes || []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load cafes. Check your connection.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiBase, coords, locationState, filters.roast, filters.origin, filters.brew_method, filters.flavor_tags, radiusKm, sortBy]);

  useEffect(() => {
    if (!coords || locationState !== "ready") {
      setNearbyPlaces([]);
      return;
    }
    fetch(`${apiBase}/api/v1/places/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=${radiusKm}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setNearbyPlaces(data.places || []);
        setMapsProvider(data.maps_provider || "unavailable");
      })
      .catch(() => {
        setNearbyPlaces([]);
      });
  }, [apiBase, coords, locationState, radiusKm]);

  useEffect(() => {
    if (!coords || locationState !== "ready" || !hasRecommendationProfile) {
      setRecommendedCafes([]);
      return;
    }

    const preferencePayload = {
      roast_preference: Number(filters.roast || preferences.roast_preference || 3),
      acidity_preference: preferences.acidity_preference || 3,
      body_preference: preferences.body_preference || 3,
      sweetness_preference: preferences.sweetness_preference || 3,
      flavor_tags: filters.flavor_tags
        ? filters.flavor_tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : preferences.flavor_tags || [],
      brew_method: filters.brew_method || preferences.brew_method || "pour_over",
      caffeine: preferences.caffeine || "full",
      price_max: preferences.price_max,
      milk: preferences.milk || false,
      origin: filters.origin || preferences.origin,
    };

    fetch(`${apiBase}/api/v1/recommendations/nearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() ?? {}),
      },
      body: JSON.stringify({
        lat: coords.lat,
        lng: coords.lng,
        location_label: addressQuery || qParam || undefined,
        radius_km: radiusKm,
        preferences: preferencePayload,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setRecommendedCafes(data.recommended_cafes || []);
      })
      .catch(() => {
        setRecommendedCafes([]);
      });
  }, [
    apiBase,
    coords,
    locationState,
    hasRecommendationProfile,
    filters.roast,
    filters.origin,
    filters.brew_method,
    filters.flavor_tags,
    radiusKm,
    preferences.roast_preference,
    preferences.acidity_preference,
    preferences.body_preference,
    preferences.sweetness_preference,
    preferences.brew_method,
    preferences.flavor_tags,
    preferences.caffeine,
    preferences.price_max,
    preferences.milk,
    preferences.origin,
    getAuthHeader,
    addressQuery,
    qParam,
  ]);

  const mapCafes = [
    ...cafes,
    ...nearbyPlaces.map((place) => ({
      ...place,
      address: place.address || "",
      rating: place.rating ?? 0,
      image_url: null,
      serves: [],
      menu_count: 0,
      detail_url: place.maps_url ?? place.website ?? undefined,
      directions_url: place.directions_url ?? undefined,
      order_url: place.order_url ?? place.website ?? undefined,
    })),
  ];
  const hasVisiblePlaces = cafes.length > 0 || nearbyPlaces.length > 0;

  return (
    <div className="discover">
      <header className="discover__header">
        <Link to="/" className="discover__back">← Back</Link>
        <div className="discover__search">
          <LocationSearch
            apiBase={apiBase}
            value={addressQuery}
            onChange={setAddressQuery}
            onSelect={handleLocationSelect}
            placeholder="Search city or address"
            inputClassName="discover__search-input"
          />
          <button
            onClick={doSearch}
            disabled={searching || addressQuery.length < 2}
            className="discover__search-btn"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>
        <h1 className="discover__title">Discover cafes</h1>
        <div className="discover__view-toggle">
          <button
            className={viewMode === "split" ? "active" : ""}
            onClick={() => setViewMode("split")}
          >
            Split
          </button>
          <button
            className={viewMode === "map" ? "active" : ""}
            onClick={() => setViewMode("map")}
          >
            Map
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </header>

      <div className="discover__filters">
        <div className="discover__filter-group">
          <span className="discover__filter-label">Radius</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            aria-label="Search radius"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={15}>15 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>
        <div className="discover__filter-group">
          <span className="discover__filter-label">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "distance" | "rating")}
            aria-label="Sort by"
          >
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <select
          value={filters.roast}
          onChange={(e) => setFilters((f) => ({ ...f, roast: e.target.value }))}
        >
          <option value="">Any roast</option>
          <option value="1">Light</option>
          <option value="2">Light-Medium</option>
          <option value="3">Medium</option>
          <option value="4">Medium-Dark</option>
          <option value="5">Dark</option>
        </select>
        <select
          value={filters.origin}
          onChange={(e) => setFilters((f) => ({ ...f, origin: e.target.value }))}
        >
          <option value="">Any origin</option>
          <option value="Ethiopia">Ethiopia</option>
          <option value="Colombia">Colombia</option>
          <option value="Brazil">Brazil</option>
          <option value="Kenya">Kenya</option>
          <option value="Indonesia">Indonesia</option>
          <option value="Guatemala">Guatemala</option>
        </select>
        <select
          value={filters.brew_method}
          onChange={(e) => setFilters((f) => ({ ...f, brew_method: e.target.value }))}
        >
          <option value="">Any brew</option>
          <option value="pour_over">Pour over</option>
          <option value="espresso">Espresso</option>
          <option value="french_press">French press</option>
          <option value="drip">Drip</option>
          <option value="aeropress">AeroPress</option>
        </select>
        {(filters.roast || filters.origin || filters.brew_method || filters.flavor_tags) && (
          <button
            type="button"
            className="discover__clear-filters"
            onClick={() => setFilters({ roast: "", origin: "", brew_method: "", flavor_tags: "" })}
          >
            Clear filters
          </button>
        )}
      </div>

      {locationState === "prompt_search" && !coords ? (
        <div className="discover__prompt">
          <p className="discover__prompt-title">Find cafes near you</p>
          <p className="discover__prompt-desc">Enter your city or address above, or use your device location.</p>
          {getRecentSearches().length > 0 && (
            <div className="discover__recent">
              <p className="discover__recent-label">Recent</p>
              {getRecentSearches().map((r) => (
                <button
                  key={r.display}
                  type="button"
                  className="discover__recent-chip"
                  onClick={() => handleLocationSelect(r.lat, r.lng, r.display)}
                >
                  {r.display}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : locationState === "detecting" && !coords ? (
        <div className="discover__prompt">
          <p className="discover__prompt-title">Detecting your location…</p>
          <p className="discover__prompt-desc">Allow location access or enter your city above.</p>
        </div>
      ) : null}
      {error ? (
        <div className="discover__error">
          <p>{error}</p>
          <button onClick={() => fetchCafes()} className="discover__retry">Try again</button>
        </div>
      ) : coords && loading ? (
        <div className="discover__loading">
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
      ) : null}
      {coords && !loading && hasRecommendationProfile && (recommendedCafes.length > 0 || nearbyPlaces.length > 0) && (
        <section className="discover__recommendations">
          <div className="discover__recommendations-head">
            <div>
              <p className="discover__eyebrow">AI-powered match</p>
              <h2>Best cafes for your taste right now</h2>
            </div>
            <p className="discover__recommendations-note">
              {mapsProvider === "google_places"
                ? "Taste-matched cafes from our catalog plus live nearby coffee shops from Google Places."
                : "Taste-matched cafes from the current catalog near your selected location."}
            </p>
          </div>
          {recommendedCafes.length > 0 ? (
            <div className="discover__recommendation-grid">
              {recommendedCafes.map((cafe) => (
                <article key={`rec-${cafe.id}`} className="discover__recommendation-card">
                  <div className="discover__recommendation-top">
                    <div>
                      <p className="discover__recommendation-score">Match {Math.round((cafe.match_score ?? 0) * 100)}%</p>
                      <h3>{cafe.name}</h3>
                    </div>
                    <Link to={`/cafes/${cafe.id}`} className="discover__recommendation-link">
                      View cafe
                    </Link>
                  </div>
                  <p className="discover__recommendation-meta">
                    {cafe.distance_km.toFixed(1)} km away{cafe.rating ? ` · ★ ${cafe.rating}` : ""}
                  </p>
                  <p className="discover__recommendation-drink">
                    Try <strong>{cafe.recommended_coffee?.name}</strong>
                    {cafe.recommended_coffee?.price ? ` from $${cafe.recommended_coffee.price.toFixed(2)}` : ""}
                  </p>
                  {cafe.reasons?.length ? (
                    <ul className="discover__reason-list">
                      {cafe.reasons.map((reason) => (
                        <li key={`${cafe.id}-${reason}`}>{reason}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="discover__recommendation-empty">
              No menu-level matches were found in our catalog here yet, but you can still browse nearby shops below.
            </div>
          )}
          {nearbyPlaces.length > 0 && (
            <div className="discover__live-places">
              <div className="discover__live-places-head">
                <h3>Live nearby coffee shops</h3>
                <p>Useful when you want more options beyond the in-app catalog.</p>
              </div>
              <div className="discover__live-places-list">
                {nearbyPlaces.map((place) => (
                  <a
                    key={place.id}
                    className="discover__live-place"
                    href={place.maps_url ?? place.website ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div>
                      <h4>{place.name}</h4>
                      <p>{place.address}</p>
                    </div>
                    <p>
                      {place.distance_km.toFixed(1)} km
                      {place.rating ? ` · ★ ${place.rating}` : ""}
                      {place.open_now === true ? " · Open now" : place.open_now === false ? " · Closed now" : ""}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      {coords && !error && !loading && !hasVisiblePlaces ? (
        <div className="discover__empty">
          <div className="discover__empty-icon" aria-hidden="true">☕</div>
          <p>No cafes in this area yet</p>
          <p className="discover__empty-hint">Try widening your search radius, a different location, or add a Google Places key for live chain discovery.</p>
        </div>
      ) : null}
      {coords && !error && !loading && hasVisiblePlaces && (
        <div className={viewMode === "split" ? "discover__split-container" : ""}>
          {(viewMode === "map" || viewMode === "split") && (
            <div className={`discover__map ${viewMode === "split" ? "discover__map--split" : ""}`}>
              <CafeMap cafes={mapCafes} center={[coords.lat, coords.lng]} />
            </div>
          )}
          {(viewMode === "list" || viewMode === "split") && (
            <div className={`discover__list ${viewMode === "split" ? "discover__list--split" : ""}`}>
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
              {nearbyPlaces.map((place) => (
                <article key={`place-${place.id}`} className="discover__place-card">
                  <div className="discover__place-card-top">
                    <div>
                      <p className="discover__place-badge">
                        {place.brand ? `${place.brand} chain` : "Live place"}
                      </p>
                      <h3>{place.name}</h3>
                    </div>
                    <span className="discover__place-distance">
                      {place.distance_km.toFixed(1)} km
                    </span>
                  </div>
                  <p className="discover__place-meta">
                    {place.address}
                    {place.rating ? ` · ★ ${place.rating}` : ""}
                    {place.open_now === true ? " · Open now" : place.open_now === false ? " · Closed now" : ""}
                  </p>
                  <div className="discover__place-actions">
                    <a href={place.maps_url ?? place.website ?? "#"} target="_blank" rel="noreferrer">
                      Open map
                    </a>
                    {place.directions_url && (
                      <a href={place.directions_url} target="_blank" rel="noreferrer">
                        Directions
                      </a>
                    )}
                    {(place.order_url ?? place.website) && (
                      <a href={place.order_url ?? place.website ?? "#"} target="_blank" rel="noreferrer">
                        Order online
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
