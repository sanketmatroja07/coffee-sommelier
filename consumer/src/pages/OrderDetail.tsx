import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./OrderDetail.css";

interface OrderDetailData {
  id: string;
  cafe_name: string;
  cafe_address: string | null;
  status: string;
  total: number;
  created_at: string | null;
  pickup_at: string | null;
  items: { coffee_name: string; quantity: number; size: string | null; price_at_order: number }[];
}

interface OrderDetailProps {
  apiBase: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  preparing: "Being prepared",
  ready: "Ready for pickup",
  picked_up: "Picked up",
};

export function OrderDetail({ apiBase }: OrderDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchOrder = (isInitial = false) =>
      fetch(`${apiBase}/api/v1/orders/${id}`)
        .then((r) => {
          if (!r.ok) throw new Error("Order not found");
          return r.json();
        })
        .then((data) => { if (mounted) setOrder(data); })
        .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : "Failed to load"); })
        .finally(() => { if (isInitial && mounted) setLoading(false); });

    fetchOrder(true);
    const interval = setInterval(() => fetchOrder(false), 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [apiBase, id]);

  if (loading) {
    return (
      <div className="order-detail">
        <div className="skeleton skeleton--text" style={{ width: "50%", marginBottom: "1rem" }} />
        <div className="skeleton skeleton--card" style={{ height: 200 }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail order-detail--error">
        <h1>Order not found</h1>
        <p>{error || "This order may have expired."}</p>
        <div className="order-detail__error-actions">
          <Link to="/discover">Discover cafes</Link>
          <Link to="/">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail">
      <header className="order-detail__header">
        <Link to="/orders" className="order-detail__back">← Your orders</Link>
        <h1>Order #{order.id.slice(0, 8)}</h1>
        <span className={`order-detail__status order-detail__status--${order.status}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </header>

      <section className="order-detail__receipt">
        <h2>{order.cafe_name}</h2>
        {order.cafe_address && <p className="order-detail__address">{order.cafe_address}</p>}
        {order.pickup_at && (
          <p className="order-detail__pickup">Pickup: {new Date(order.pickup_at).toLocaleString()}</p>
        )}
        <ul className="order-detail__items">
          {order.items.map((item, i) => (
            <li key={i}>
              <span>{item.quantity}× {item.coffee_name} {item.size && `(${item.size})`}</span>
              <span>${(item.quantity * item.price_at_order).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="order-detail__total">Total: ${order.total.toFixed(2)}</div>
      </section>

      <section className="order-detail__actions">
        <Link to="/discover" className="order-detail__cta">Order again</Link>
        <Link to="/" className="order-detail__cta order-detail__cta--secondary">Home</Link>
      </section>
    </div>
  );
}
