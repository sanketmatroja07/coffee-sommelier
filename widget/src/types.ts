export interface StructuredVector {
  roast_preference: number;
  acidity_preference: number;
  body_preference: number;
  sweetness_preference: number;
  flavor_tags: string[];
  brew_method: string;
  caffeine: string;
  price_max: number | null;
  milk: boolean;
}

export interface BrewGuide {
  grind: string;
  time: string;
  ratio: string;
  temp: string;
  tips: string[];
}

export interface Recommendation {
  product_id: string;
  score: number;
  reasons: string[];
  brew_guide: BrewGuide;
  product: {
    id: string;
    name: string;
    sku: string;
    origin?: string;
    process?: string;
    roast_level: number;
    acidity: number;
    body: number;
    price: number;
    flavor_tags: string[];
    brew_methods_supported: string[];
  };
}
