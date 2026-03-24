import { API_BASE } from "./apiBase";

function getSessionId(): string {
  const key = "cf_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export type AnalyticsEvent =
  | "landing_view"
  | "discover_view"
  | "cafe_view"
  | "add_to_cart"
  | "checkout_start"
  | "order_placed"
  | "search_location";

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event, props);
  }
  try {
    fetch(`${API_BASE}/api/v1/consumer-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: event,
        payload: { session_id: getSessionId(), ...(props ?? {}) },
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}
