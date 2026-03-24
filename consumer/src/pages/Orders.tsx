import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { getGuestOrders, type GuestOrderSummary } from "../lib/guestOrders";
import "./Orders.css";

interface Order {
  id: string;
  cafe_id: string;
  cafe_name: string;
  status: string;
  total: number;
  created_at: string | null;
}

interface OrdersProps {
  apiBase: string;
}

export function Orders({ apiBase }: OrdersProps) {
  const { user, getAuthHeader } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [guestOrders, setGuestOrders] = useState<GuestOrderSummary[]>([]);

  useEffect(() => {
    if (!user) {
      setGuestOrders(getGuestOrders());
    }
  }, [user]);

  const fetchOrders = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const headers = getAuthHeader();
    fetch(`${apiBase}/api/v1/orders`, { headers: headers ?? {} })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setError(null);
      })
      .catch(() => setError("Couldn't load orders. Check your connection."))
      .finally(() => setLoading(false));
  }, [apiBase, user, getAuthHeader]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [user, fetchOrders]);

  if (!user) {
    return (
      <div className="orders orders--guest">
        <h1>Your orders</h1>
        {guestOrders.length > 0 ? (
          <>
            <p>Your recent guest orders are saved on this device.</p>
            <ul className="orders__list">
              {guestOrders.map((o) => (
                <li key={o.id} className="orders__item">
                  <Link to={`/orders/${o.id}`} className="orders__item-link">
                    <div className="orders__item-header">
                      <span className="orders__cafe">{o.cafe_name}</span>
                      <span className={`orders__status orders__status--${o.status}`}>{o.status}</span>
                    </div>
                    <div className="orders__item-meta">
                      ${o.total.toFixed(2)} · {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p>Log in to sync future orders across devices.</p>
          </>
        ) : (
          <p>Log in to see your full order history.</p>
        )}
        <button onClick={() => setShowAuth(true)} className="orders__login-btn">Log in</button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="orders">
        <Link to="/" className="orders__back">← Back</Link>
        <h1>Your orders</h1>
        <div className="skeleton skeleton--text" style={{ width: "40%", marginBottom: "1rem" }} />
        <div className="skeleton skeleton--card" style={{ height: 80 }} />
      </div>
    );
  }

  return (
    <div className="orders">
      <Link to="/" className="orders__back">← Back</Link>
      <h1>Your orders</h1>
      {error ? (
        <div className="orders__error">
          <p>{error}</p>
          <button onClick={fetchOrders} className="orders__retry">Try again</button>
        </div>
      ) : orders.length === 0 ? (
        <p className="orders__empty">No orders yet. <Link to="/discover">Discover cafes</Link></p>
      ) : (
        <ul className="orders__list">
          {orders.map((o) => (
            <li key={o.id} className="orders__item">
              <Link to={`/orders/${o.id}`} className="orders__item-link">
                <div className="orders__item-header">
                  <span className="orders__cafe">{o.cafe_name}</span>
                  <span className={`orders__status orders__status--${o.status}`}>{o.status}</span>
                </div>
                <div className="orders__item-meta">
                  ${o.total.toFixed(2)} · {o.created_at ? new Date(o.created_at).toLocaleDateString() : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
