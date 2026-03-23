import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import "./Recommendations.css";

interface RecommendationEntry {
  id: string;
  created_at: string;
  location_label?: string | null;
  radius_km: number;
  recommended_cafes: Array<{
    id: string;
    name: string;
    distance_km: number;
    match_score: number;
    recommended_coffee: { name: string; price: number };
  }>;
}

export function Recommendations({ apiBase }: { apiBase: string }) {
  const { user, getAuthHeader } = useAuth();
  const [items, setItems] = useState<RecommendationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch(`${apiBase}/api/v1/me/recommendations`, {
      headers: {
        ...(getAuthHeader() ?? {}),
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => setItems(data.recommendations || []))
      .catch(() => setError("Couldn't load your recommendation history."))
      .finally(() => setLoading(false));
  }, [apiBase, user, getAuthHeader]);

  if (!user) {
    return (
      <div className="recommendations recommendations--guest">
        <h1>Your coffee matches</h1>
        <p>Log in to save and revisit the cafes our recommender found for you.</p>
        <button className="recommendations__login" onClick={() => setShowAuth(true)}>
          Log in
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
      </div>
    );
  }

  return (
    <div className="recommendations">
      <Link to="/" className="recommendations__back">← Back</Link>
      <header className="recommendations__header">
        <div>
          <h1>Your coffee matches</h1>
          <p>Every saved recommendation run is here so you can revisit nearby cafes and drinks.</p>
        </div>
        <Link to="/quiz" className="recommendations__cta">Update taste profile</Link>
      </header>
      {loading ? (
        <div className="recommendations__loading">Loading your saved matches…</div>
      ) : error ? (
        <div className="recommendations__error">{error}</div>
      ) : items.length === 0 ? (
        <div className="recommendations__empty">
          No saved matches yet. Take the <Link to="/quiz">taste quiz</Link> and search an area to start building your history.
        </div>
      ) : (
        <div className="recommendations__list">
          {items.map((item) => (
            <article key={item.id} className="recommendations__card">
              <div className="recommendations__card-top">
                <div>
                  <p className="recommendations__date">{new Date(item.created_at).toLocaleString()}</p>
                  <h2>{item.location_label || "Saved search"}</h2>
                </div>
                <span>{item.radius_km} km radius</span>
              </div>
              <div className="recommendations__matches">
                {item.recommended_cafes.slice(0, 3).map((cafe) => (
                  <Link key={cafe.id} to={`/cafes/${cafe.id}`} className="recommendations__match">
                    <strong>{cafe.name}</strong>
                    <span>
                      Match {Math.round(cafe.match_score * 100)}% · {cafe.distance_km.toFixed(1)} km
                    </span>
                    <span>
                      {cafe.recommended_coffee.name}
                      {cafe.recommended_coffee.price ? ` from $${cafe.recommended_coffee.price.toFixed(2)}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
