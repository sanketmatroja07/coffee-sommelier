import { NextRequest, NextResponse } from "next/server";
import { addFeedback, getRecentFeedback } from "@/lib/feedback";
import { track } from "@/lib/analytics";
import { z } from "zod";

const feedbackSchema = z.object({
  recommendedCoffeeId: z.string().min(1),
  rating: z.enum(["loved", "ok", "disliked"]),
  sourBitter: z.number().min(-2).max(2),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const fb = addFeedback(parsed.data);
    track("feedback_submitted", {
      recommendedCoffeeId: fb.recommendedCoffeeId,
      rating: fb.rating,
      sourBitter: fb.sourBitter,
    });

    return NextResponse.json({ ok: true, id: fb.id });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json(
      { error: "Failed to store feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const feedback = getRecentFeedback();
    return NextResponse.json(feedback);
  } catch (err) {
    console.error("Feedback list error:", err);
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    );
  }
}
