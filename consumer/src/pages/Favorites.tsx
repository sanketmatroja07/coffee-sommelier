import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { LazyImage } from "../components/LazyImage";
import "./Favorites.css";

export function Favorites() {
  const { favoriteCafes } = useFavorites();

  if (favoriteCafes.length === 0) {
    return (
      <div className="favorites favorites--empty">
        <h1>Your favorites</h1>
        <p>Save cafes you love by tapping the ♡ when browsing.</p>
        <Link to="/discover" className="favorites__cta">Discover cafes</Link>
      </div>
    );
  }

  return (
    <div className="favorites">
      <header className="favorites__header">
        <Link to="/" className="favorites__back">← Back</Link>
        <h1>Your favorites ({favoriteCafes.length})</h1>
      </header>
      <ul className="favorites__list">
        {favoriteCafes.map((cafe) => (
          <li key={cafe.id}>
            <Link to={`/cafes/${cafe.id}`} className="favorites__card">
              <LazyImage src={cafe.image_url} alt={cafe.name} className="favorites__img" />
              <div className="favorites__info">
                <h3>{cafe.name}</h3>
                {cafe.address && <p>{cafe.address}</p>}
                {cafe.rating != null && <p className="favorites__rating">★ {cafe.rating}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
