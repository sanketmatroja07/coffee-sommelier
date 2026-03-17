import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { track } from "../lib/analytics";
import { LazyImage } from "../components/LazyImage";
import { AddToCartModal } from "../components/AddToCartModal";
import { useFavorites } from "../context/FavoritesContext";
import "./CafeDetail.css";

interface MenuItem {
  id: string;
  coffee_id: string;
  name: string;
  origin: string | null;
  roast_level: number;
  flavor_tags: string[];
  brew_methods: string[];
  price: number;
  size_options: string[];
}

interface CafeAddon {
  id: string;
  name: string;
  addon_type: string;
  price: number;
}

interface CafeDetailProps {
  apiBase: string;
}

export function CafeDetail({ apiBase }: CafeDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [cafe, setCafe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { itemCount } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [addModalItem, setAddModalItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (id) track("cafe_view", { cafe_id: id });
  }, [id]);
  useEffect(() => {
    if (!id) return;
    fetch(`${apiBase}/api/v1/cafes/${id}`)
      .then((r) => r.json())
      .then(setCafe)
      .finally(() => setLoading(false));
  }, [apiBase, id]);

  if (loading || !cafe) {
    return (
      <div className="cafe-detail__loading">
        <div className="skeleton skeleton--text" style={{ width: "40%" }} />
        <div className="skeleton skeleton--card" style={{ height: 200, marginTop: "1rem" }} />
      </div>
    );
  }

  const roastLabels: Record<number, string> = {
    1: "Light",
    2: "Light-Medium",
    3: "Medium",
    4: "Medium-Dark",
    5: "Dark",
  };

  return (
    <div className="cafe-detail">
      <header className="cafe-detail__header">
        <Link to="/discover" className="cafe-detail__back">← Back</Link>
        <LazyImage src={cafe.image_url} alt={cafe.name} className="cafe-detail__hero" />
        <div className="cafe-detail__info">
          <div className="cafe-detail__title-row">
            <h1 className="cafe-detail__name">{cafe.name}</h1>
            <button
              className={`cafe-detail__fav ${isFavorite(cafe.id) ? "active" : ""}`}
              onClick={() => toggleFavorite(cafe.id, { name: cafe.name, address: cafe.address, rating: cafe.rating, image_url: cafe.image_url })}
              aria-label={isFavorite(cafe.id) ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite(cafe.id) ? "♥" : "♡"}
            </button>
          </div>
          <p className="cafe-detail__rating">★ {cafe.rating}</p>
          {cafe.address && (
            <p className="cafe-detail__address">{cafe.address}</p>
          )}
        </div>
      </header>

      <section className="cafe-detail__menu">
        <h2>Menu</h2>
        {cafe.menu?.map((item: MenuItem) => (
          <div key={item.id} className="cafe-detail__menu-item">
            <div className="cafe-detail__menu-info">
              <h3>{item.name}</h3>
              <p className="cafe-detail__menu-meta">
                {item.origin && `${item.origin} · `}
                {roastLabels[item.roast_level] || "Medium"}
              </p>
              {(item.flavor_tags?.length ?? 0) > 0 && (
                <p className="cafe-detail__menu-tags">
                  {item.flavor_tags.join(", ")}
                </p>
              )}
            </div>
            <div className="cafe-detail__menu-actions">
              <span className="cafe-detail__menu-price">${item.price.toFixed(2)}</span>
              <div className="cafe-detail__menu-sizes">
                <button
                  className="cafe-detail__add-btn"
                  onClick={() => setAddModalItem(item)}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {itemCount > 0 && (
        <Link to="/cart" className="cafe-detail__cart-bar">
          View cart ({itemCount}) →
        </Link>
      )}
      {addModalItem && (
        <AddToCartModal
          onClose={() => setAddModalItem(null)}
          cafeId={cafe.id}
          cafeName={cafe.name}
          menuItem={{
            id: addModalItem.id,
            name: addModalItem.name,
            price: addModalItem.price,
            size_options: addModalItem.size_options || ["12oz", "16oz"],
          }}
          addons={cafe.addons as CafeAddon[]}
        />
      )}
    </div>
  );
}
