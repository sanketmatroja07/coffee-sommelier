import type { CoffeeItem, UserPrefs } from "./types";
import { getBrewGuide } from "./brew-guide";

const FLAVOR_KEYS = ["chocolate", "nutty", "caramel", "fruity", "floral"] as const;

/**
 * Deterministic scorer: dot product of flavor weights × coffee flavor vector,
 * with penalties for acidity/bitterness and budget.
 */
export function scoreCoffee(
  coffee: CoffeeItem,
  prefs: UserPrefs,
  brewMethod: string
): number {
  let score = 0;

  // Flavor dot product
  for (const key of FLAVOR_KEYS) {
    const prefWeight = prefs[key] ?? 0.5;
    const coffeeVal = coffee[key] ?? 0;
    score += prefWeight * coffeeVal * 2; // scale up flavor match
  }

  // Brew method match bonus
  if (coffee.bestFor.includes(brewMethod as never)) {
    score += 0.5;
  }

  // Acidity penalty if user wants low acid
  if (prefs.wantsLowAcid && coffee.acidity > 0.5) {
    score -= coffee.acidity * 1.5;
  }

  // Bitterness penalty if user wants low bitterness
  if (prefs.wantsLowBitterness && coffee.bitterness > 0.5) {
    score -= coffee.bitterness * 1.5;
  }

  // Budget penalty
  if (prefs.budgetUsd > 0 && coffee.priceUsd > prefs.budgetUsd) {
    const over = (coffee.priceUsd - prefs.budgetUsd) / prefs.budgetUsd;
    score -= over * 2;
  }

  return Math.max(0, score);
}

/**
 * Generate grounded "why this matches you" bullets from catalog fields + prefs.
 */
export function getReasons(coffee: CoffeeItem, prefs: UserPrefs): string[] {
  const reasons: string[] = [];

  if (coffee.bestFor.includes(prefs.brewMethod)) {
    reasons.push(`Optimized for ${prefs.brewMethod.replace("_", " ")}`);
  }

  if (prefs.wantsLowAcid && coffee.acidity < 0.35) {
    reasons.push("Low acidity — gentle on sensitive stomachs");
  }
  if (prefs.wantsLowBitterness && coffee.bitterness < 0.4) {
    reasons.push("Lower bitterness — smooth finish");
  }

  const flavorScores: { key: string; label: string; val: number }[] = [
    { key: "chocolate", label: "Chocolate", val: coffee.chocolate },
    { key: "nutty", label: "Nutty", val: coffee.nutty },
    { key: "caramel", label: "Caramel", val: coffee.caramel },
    { key: "fruity", label: "Fruity", val: coffee.fruity },
    { key: "floral", label: "Floral", val: coffee.floral },
  ];

  const topFlavors = flavorScores
    .filter((f) => (prefs[f.key as keyof UserPrefs] as number) > 0.4)
    .sort((a, b) => b.val - a.val)
    .slice(0, 2);

  for (const f of topFlavors) {
    if (f.val > 0.4) {
      reasons.push(`Strong ${f.label.toLowerCase()} notes (${Math.round(f.val * 100)}%)`);
    }
  }

  if (reasons.length === 0) {
    reasons.push(`${coffee.roastLevel} roast from ${coffee.origin}`);
    reasons.push(`${coffee.process} process — balanced profile`);
  }

  return reasons;
}

export interface ScoredResult {
  coffee: CoffeeItem;
  score: number;
  reasons: string[];
  brewGuide: ReturnType<typeof getBrewGuide>;
}

/**
 * Rank catalog and return top 3 with reasons and brew guide.
 */
export function rankAndRecommend(
  catalog: CoffeeItem[],
  prefs: UserPrefs
): ScoredResult[] {
  const scored = catalog.map((coffee) => ({
    coffee,
    score: scoreCoffee(coffee, prefs, prefs.brewMethod),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ coffee, score }) => ({
    coffee,
    score,
    reasons: getReasons(coffee, prefs),
    brewGuide: getBrewGuide(prefs.brewMethod, prefs.wantsLowAcid, prefs.wantsLowBitterness),
  }));
}
