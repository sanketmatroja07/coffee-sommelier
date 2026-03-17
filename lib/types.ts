// Coffee catalog item
export type RoastLevel = "light" | "medium" | "dark";
export type BrewMethod =
  | "espresso"
  | "pour_over"
  | "french_press"
  | "drip"
  | "aeropress";

export interface CoffeeItem {
  id: string;
  name: string;
  roaster: string;
  origin: string;
  process: string;
  roastLevel: RoastLevel;
  priceUsd: number;
  bestFor: BrewMethod[];
  acidity: number;
  bitterness: number;
  body: number;
  chocolate: number;
  nutty: number;
  caramel: number;
  fruity: number;
  floral: number;
  url?: string;
}

// User preferences
export interface UserPrefs {
  brewMethod: BrewMethod;
  wantsLowAcid: boolean;
  wantsLowBitterness: boolean;
  budgetUsd: number;
  milk: boolean;
  chocolate: number;
  nutty: number;
  caramel: number;
  fruity: number;
  floral: number;
}

// Feedback
export type FeedbackRating = "loved" | "ok" | "disliked";

export interface Feedback {
  id?: string;
  timestamp: string;
  recommendedCoffeeId: string;
  rating: FeedbackRating;
  sourBitter: number; // -2 to +2 (negative=sour, positive=bitter)
  note?: string;
}

export interface RecommendationResult {
  coffee: CoffeeItem;
  score: number;
  reasons: string[];
  brewGuide: BrewGuide;
}

export interface BrewGuide {
  grind: string;
  time: string;
  ratio: string;
  temp: string;
  tips: string[];
}
