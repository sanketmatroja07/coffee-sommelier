import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "./CafeMap.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const userIcon = L.divIcon({
  className: "cafe-map__user-marker",
  html: '<div class="cafe-map__user-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_km: number;
  rating: number;
  detail_url?: string;
  directions_url?: string;
  order_url?: string;
  is_chain?: boolean;
  brand?: string | null;
}

interface CafeMapProps {
  cafes: Cafe[];
  center: [number, number];
  showUserMarker?: boolean;
}

function RecenterControl({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    // Split/list view toggles can leave Leaflet with stale dimensions.
    requestAnimationFrame(() => {
      map.invalidateSize();
      map.setView(center, map.getZoom());
    });
  }, [center, map]);
  return null;
}

function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      type="button"
      className="cafe-map__recenter"
      onClick={() => map.setView(center, map.getZoom())}
      aria-label="Re-center map on your location"
    >
      <span aria-hidden>◎</span>
    </button>
  );
}

export function CafeMap({ cafes, center, showUserMarker = true }: CafeMapProps) {
  return (
    <div className="cafe-map__wrapper">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterControl center={center} />
        {showUserMarker && <Marker position={center} icon={userIcon} zIndexOffset={1000} />}
        {cafes.map((cafe) => (
          <Marker key={cafe.id} position={[cafe.lat, cafe.lng]}>
            <Popup>
              {cafe.is_chain && cafe.brand ? (
                <>
                  <strong style={{ color: "#9a5b20", fontSize: "0.8rem" }}>{cafe.brand}</strong>
                  <br />
                </>
              ) : null}
              <a
                href={cafe.detail_url ?? `/cafes/${cafe.id}`}
                style={{ fontWeight: 600 }}
                target={cafe.detail_url?.startsWith("http") ? "_blank" : undefined}
                rel={cafe.detail_url?.startsWith("http") ? "noreferrer" : undefined}
              >
                {cafe.name}
              </a>
              <br />
              {cafe.distance_km.toFixed(1)} km · ★ {cafe.rating}
              {(cafe.directions_url || cafe.order_url) && (
                <>
                  <br />
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {cafe.directions_url && (
                      <a href={cafe.directions_url} target="_blank" rel="noreferrer">
                        Directions
                      </a>
                    )}
                    {cafe.order_url && (
                      <a href={cafe.order_url} target="_blank" rel="noreferrer">
                        Order online
                      </a>
                    )}
                  </div>
                </>
              )}
            </Popup>
          </Marker>
        ))}
        <RecenterButton center={center} />
      </MapContainer>
    </div>
  );
}
