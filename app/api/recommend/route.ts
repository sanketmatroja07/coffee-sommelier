import { NextRequest, NextResponse } from "next/server";
import catalogData from "@/data/catalog.json";
import { rankAndRecommend } from "@/lib/recommender";
import { track } from "@/lib/analytics";
import { z } from "zod";

const prefsSchema = z.object({
  brewMethod: z.enum(["espresso", "pour_over", "french_press", "drip", "aeropress"]),
  wantsLowAcid: z.boolean(),
  wantsLowBitterness: z.boolean(),
  budgetUsd: z.number().min(0).max(500),
  milk: z.boolean(),
  chocolate: z.number().min(0).max(1),
  nutty: z.number().min(0).max(1),
  caramel: z.number().min(0).max(1),
  fruity: z.number().min(0).max(1),
  floral: z.number().min(0).max(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = prefsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid preferences", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prefs = parsed.data;
    const catalog = catalogData as import("@/lib/types").CoffeeItem[];

    const recommendations = rankAndRecommend(catalog, prefs);

    track("completed_flow", { brewMethod: prefs.brewMethod });

    return NextResponse.json({
      recommendations: recommendations.map((r) => ({
        coffee: r.coffee,
        score: r.score,
        reasons: r.reasons,
        brewGuide: r.brewGuide,
      })),
    });
  } catch (err) {
    console.error("Recommend error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
