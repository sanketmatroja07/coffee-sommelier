import { NextRequest, NextResponse } from "next/server";
import { track } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics";

const VALID_EVENTS: AnalyticsEvent[] = [
  "started_flow",
  "completed_flow",
  "clicked_recommendation",
  "add_to_cart_from_reco",
  "purchase",
  "feedback_submitted",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, payload } = body;

    if (!event || !VALID_EVENTS.includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    track(event, typeof payload === "object" ? payload : undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
