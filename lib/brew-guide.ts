import type { BrewGuide } from "./types";

const BASE_GUIDES: Record<string, Omit<BrewGuide, "tips">> = {
  espresso: {
    grind: "Fine",
    time: "25–32 seconds",
    ratio: "1:2",
    temp: "92–94°C",
  },
  pour_over: {
    grind: "Medium",
    time: "2:45–3:15",
    ratio: "1:16",
    temp: "93–96°C",
  },
  french_press: {
    grind: "Coarse",
    time: "~4:00",
    ratio: "1:15",
    temp: "~94°C",
  },
  drip: {
    grind: "Medium",
    time: "Auto",
    ratio: "1:17",
    temp: "~93°C",
  },
  aeropress: {
    grind: "Medium",
    time: "~1:45",
    ratio: "1:12",
    temp: "90–94°C",
  },
};

export function getBrewGuide(
  brewMethod: string,
  wantsLowAcid: boolean,
  wantsLowBitterness: boolean
): BrewGuide {
  const base = BASE_GUIDES[brewMethod] ?? BASE_GUIDES.pour_over;
  const tips: string[] = [];

  if (wantsLowAcid) {
    tips.push("Lower temp slightly (88–91°C) to reduce perceived acidity");
    tips.push("Slightly coarser grind can soften bright notes");
  }

  if (wantsLowBitterness) {
    tips.push("Use coarser grind to reduce extraction of bitter compounds");
    tips.push("Lower water temp (88–92°C) helps avoid over-extraction");
    tips.push("Shorten brew time if the result tastes harsh");
  }

  if (!wantsLowAcid && !wantsLowBitterness) {
    tips.push("Use a scale for consistent ratio");
    tips.push("Pre-wet the filter and bloom 30s for pour-over");
  }

  return {
    ...base,
    tips: tips.length > 0 ? tips : ["Use freshly ground beans", "Preheat your vessel"],
  };
}
