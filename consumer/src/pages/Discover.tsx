import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  const toast = useToast();
  const { preferences } = usePreferences();

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
    const roast = roastParam || (preferences.roast ? String(preferences.roast) : "");
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
      {coords && !error && !loading && cafes.length === 0 ? (
        <div className="discover__empty">
          <div className="discover__empty-icon" aria-hidden="true">☕</div>
          <p>No cafes in this area yet</p>
          <p className="discover__empty-hint">Try widening your search radius, a different location, or clear some filters.</p>
        </div>
      ) : null}
      {coords && !error && !loading && cafes.length > 0 && (
        <div className={viewMode === "split" ? "discover__split-container" : ""}>
          {(viewMode === "map" || viewMode === "split") && (
            <div className={`discover__map ${viewMode === "split" ? "discover__map--split" : ""}`}>
              <CafeMap cafes={cafes} center={[coords.lat, coords.lng]} />
            </div>
          )}
          {(viewMode === "list" || viewMode === "split") && (
            <div className={`discover__list ${viewMode === "split" ? "discover__list--split" : ""}`}>
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
