import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { useToast } from "../context/ToastContext";
import "./Partner.css";

interface PartnerProps {
  apiBase: string;
}

interface Cafe {
  id: string;
  name: string;
  address: string | null;
}

export function Partner({ apiBase }: PartnerProps) {
  const { user, getAuthHeader } = useAuth();
  const toast = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [partnerTab, setPartnerTab] = useState(false);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", address: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.is_partner) {
      setLoading(false);
      return;
    }
    const headers = getAuthHeader() ?? {};
    Promise.all([
      fetch(`${apiBase}/api/v1/partner/cafes`, { headers }),
      fetch(`${apiBase}/api/v1/partner/orders`, { headers }),
    ])
      .then(async ([cRes, oRes]) => {
        const cData = cRes.ok ? await cRes.json() : [];
        const oData = oRes.ok ? await oRes.json() : { orders: [] };
        return [
          Array.isArray(cData) ? cData : [],
          Array.isArray(oData?.orders) ? oData.orders : [],
        ];
      })
      .then(([cafesList, ordersList]) => {
        setCafes(cafesList);
        setOrders(ordersList);
      })
      .catch(() => {
        toast.error("Failed to load partner data");
      })
      .finally(() => setLoading(false));
  }, [apiBase, user, getAuthHeader, toast]);

  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/partner/cafes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(getAuthHeader() ?? {}) },
        body: JSON.stringify({ name: form.name, address: form.address || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setCafes((prev) => [...prev, { id: data.id, name: data.name, address: form.address }]);
      setForm({ name: "", address: "" });
      toast.success("Cafe created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="partner">
        <header className="partner__header">
          <Link to="/" className="partner__back">← Back</Link>
          <h1>Partner Portal</h1>
        </header>
        <div className="partner__guest">
          <p>Log in or sign up as a cafe partner to manage your cafes and orders.</p>
          <button onClick={() => { setPartnerTab(true); setShowAuth(true); }} className="partner__btn">
            Sign up as partner
          </button>
          <button onClick={() => { setPartnerTab(false); setShowAuth(true); }} className="partner__btn partner__btn--ghost">
            Log in
          </button>
        </div>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            defaultTab={partnerTab ? "register" : "login"}
            isPartnerSignup={partnerTab}
          />
        )}
      </div>
    );
  }

  if (!user.is_partner) {
    return (
      <div className="partner">
        <header className="partner__header">
          <Link to="/" className="partner__back">← Back</Link>
          <h1>Partner Portal</h1>
        </header>
        <div className="partner__guest">
          <p>Partner access required. Contact hello@coffeefinder.app to become a cafe partner.</p>
          <Link to="/" className="partner__btn">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="partner">
      <header className="partner__header">
        <Link to="/" className="partner__back">← Back</Link>
        <h1>Partner Portal</h1>
      </header>

      <section className="partner__section">
        <h2>Create cafe</h2>
        <form onSubmit={handleCreateCafe} className="partner__form">
          <input
            placeholder="Cafe name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            placeholder="Address (optional)"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <button type="submit" disabled={creating}>{creating ? "Creating…" : "Create cafe"}</button>
        </form>
      </section>

      <section className="partner__section">
        <h2>My cafes</h2>
        {loading ? (
          <p>Loading…</p>
        ) : cafes.length === 0 ? (
          <p className="partner__empty">No cafes yet. Create one above.</p>
        ) : (
          <ul className="partner__cafes">
            {cafes.map((c) => (
              <li key={c.id} className="partner__cafe">
                <span>{c.name}</span>
                {c.address && <span className="partner__cafe-addr">{c.address}</span>}
                <Link to={`/cafes/${c.id}`} className="partner__link">View</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="partner__section">
        <h2>Recent orders</h2>
        {orders.length === 0 ? (
          <p className="partner__empty">No orders yet.</p>
        ) : (
          <ul className="partner__orders">
            {orders.slice(0, 10).map((o) => (
              <li key={o.id} className="partner__order">
                <span>{o.cafe_name}</span>
                <span className={`partner__order-status partner__order-status--${o.status}`}>{o.status}</span>
                <span>${o.total?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
