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
}

interface CafeMapProps {
  cafes: Cafe[];
  center: [number, number];
  showUserMarker?: boolean;
}

function RecenterControl({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
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
              <a href={`/cafes/${cafe.id}`} style={{ fontWeight: 600 }}>
                {cafe.name}
              </a>
              <br />
              {cafe.distance_km.toFixed(1)} km · ★ {cafe.rating}
            </Popup>
          </Marker>
        ))}
        <RecenterButton center={center} />
      </MapContainer>
    </div>
  );
}
