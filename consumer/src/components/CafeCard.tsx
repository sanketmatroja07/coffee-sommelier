import { Link } from "react-router-dom";
import { LazyImage } from "./LazyImage";
import { useFavorites } from "../context/FavoritesContext";
import "./CafeCard.css";

interface Cafe {
  id: string;
  name: string;
  address: string;
  distance_km: number;
  rating: number;
  image_url: string | null;
  serves: string[];
  menu_count: number;
}

interface CafeCardProps {
  cafe: Cafe;
}

export function CafeCard({ cafe }: CafeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(cafe.id);

  return (
    <Link to={`/cafes/${cafe.id}`} className="cafe-card">
      <button
        className={`cafe-card__fav ${fav ? "active" : ""}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(cafe.id, { name: cafe.name, address: cafe.address, rating: cafe.rating, image_url: cafe.image_url }); }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      >
        {fav ? "♥" : "♡"}
      </button>
      <LazyImage src={cafe.image_url} alt={cafe.name} className="cafe-card__image" />
      <div className="cafe-card__body">
        <h3 className="cafe-card__name">{cafe.name}</h3>
        <p className="cafe-card__meta">
          {cafe.distance_km.toFixed(1)} km · <span className="cafe-card__rating">★ {cafe.rating}</span>
        </p>
        {cafe.serves.length > 0 && (
          <p className="cafe-card__serves">
            Serves: {cafe.serves.slice(0, 4).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
