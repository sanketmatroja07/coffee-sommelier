/**
 * Simple in-app event store for MVP analytics.
 * In production, replace with Segment, Mixpanel, PostHog, etc.
 */

import fs from "fs";
import path from "path";

export type AnalyticsEvent =
  | "started_flow"
  | "completed_flow"
  | "clicked_recommendation"
  | "add_to_cart_from_reco"
  | "purchase"
  | "feedback_submitted";

const EVENTS_FILE = path.join(process.cwd(), "data", "analytics-events.json");

interface StoredEvent {
  event: AnalyticsEvent;
  timestamp: string;
  payload?: Record<string, unknown>;
}

function readEvents(): StoredEvent[] {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeEvents(events: StoredEvent[]) {
  const dir = path.dirname(EVENTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
}

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  const events = readEvents();
  events.push({
    event,
    timestamp: new Date().toISOString(),
    payload: payload ?? {},
  });
  writeEvents(events);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[analytics] ${event}`, payload ?? "");
  }
}
