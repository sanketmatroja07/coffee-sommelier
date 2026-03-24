export interface GuestOrderSummary {
  id: string;
  cafe_name: string;
  total: number;
  status: string;
  created_at: string;
  pickup_at: string | null;
}

const GUEST_ORDERS_KEY = "coffee_finder_guest_orders";

export function getGuestOrders(): GuestOrderSummary[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestOrder(order: GuestOrderSummary) {
  try {
    const existing = getGuestOrders().filter((item) => item.id !== order.id);
    const updated = [order, ...existing].slice(0, 12);
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(updated));
  } catch {}
}
