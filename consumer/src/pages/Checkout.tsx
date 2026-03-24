import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { saveGuestOrder } from "../lib/guestOrders";
import { track } from "../lib/analytics";
import "./Checkout.css";

interface CheckoutProps {
  apiBase: string;
}

export function Checkout({ apiBase }: CheckoutProps) {
  const { items, total, clearCart } = useCart();
  const { getAuthHeader } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pickupSlot, setPickupSlot] = useState<{ label: string; iso: string } | null>(null);
  const [placing, setPlacing] = useState(false);

  const generateSlots = (): { label: string; iso: string }[] => {
    const slots: { label: string; iso: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getTime() + i * 30 * 60 * 1000);
      slots.push({
        label: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        iso: d.toISOString(),
      });
    }
    return slots;
  };

  const slots = generateSlots();

  const handlePlaceOrder = async () => {
    track("checkout_start");
    if (items.length === 0 || !pickupSlot) return;
    setPlacing(true);
    const cafeId = items[0].cafe_id;
    const orderItems = items.map((i) => ({
      cafe_coffee_id: i.cafe_coffee_id,
      quantity: i.quantity,
      size: i.size,
      addons: (i.addons || []).map((a) => ({ addon_id: a.addon_id, name: a.name, price: a.price })),
      special_instructions: i.special_instructions || null,
      price_at_order: i.price,
    }));
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      Object.assign(headers, getAuthHeader() ?? {});
      const res = await fetch(`${apiBase}/api/v1/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cafe_id: cafeId,
          pickup_at: pickupSlot.iso,
          items: orderItems,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Order failed");
      const oid = data.order_id || "DEMO-" + Date.now();
      if (!getAuthHeader()) {
        saveGuestOrder({
          id: oid,
          cafe_name: cafeName,
          total: data.total ?? total,
          status: data.status ?? "pending",
          created_at: new Date().toISOString(),
          pickup_at: pickupSlot.iso,
        });
      }
      clearCart();
      toast.success("Order placed! We'll notify you when it's ready.");
      track("order_placed", { order_id: oid });
      navigate(`/orders/${oid}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout checkout--empty">
        <p>Your cart is empty.</p>
        <Link to="/discover">Discover cafes</Link>
      </div>
    );
  }

  const cafeName = items[0]?.cafe_name;
  const cafeAddress = "";

  return (
    <div className="checkout">
      <header className="checkout__header">
        <Link to="/cart" className="checkout__back">← Back to cart</Link>
        <h1>Checkout</h1>
      </header>

      <section className="checkout__summary">
        <h2>{cafeName}</h2>
        <ul>
          {items.map((item) => (
            <li key={`${item.cafe_coffee_id}-${item.size}-${JSON.stringify(item.addons || [])}`}>
              {item.quantity}× {item.coffee_name} ({item.size})
              {item.addons?.length ? ` + ${item.addons.map((a) => a.name).join(", ")}` : ""}
              {item.special_instructions ? ` — "${item.special_instructions}"` : ""}
              {" "}${(item.price * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
        <div className="checkout__total">Total: ${total.toFixed(2)}</div>
      </section>

      <section className="checkout__pickup">
        <h2>Pickup time</h2>
        <select
          value={pickupSlot?.iso ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setPickupSlot(slots.find((s) => s.iso === val) ?? null);
          }}
          className="checkout__select"
        >
          <option value="">Select time</option>
          {slots.map((s) => (
            <option key={s.iso} value={s.iso}>{s.label}</option>
          ))}
        </select>
      </section>

      <p className="checkout__pay-note">Pay at pickup</p>

      <button
        className="checkout__submit"
        onClick={handlePlaceOrder}
        disabled={!pickupSlot || placing}
      >
        {placing ? "Placing…" : "Place order"}
      </button>
    </div>
  );
}
