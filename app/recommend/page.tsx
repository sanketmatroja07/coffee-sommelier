"use client";

import { useState, useEffect } from "react";
import type { BrewMethod } from "@/lib/types";

interface Recommendation {
  coffee: {
    id: string;
    name: string;
    roaster: string;
    origin: string;
    roastLevel: string;
    priceUsd: number;
  };
  reasons: string[];
  brewGuide: {
    grind: string;
    time: string;
    ratio: string;
    temp: string;
    tips: string[];
  };
}

const BREW_METHODS: { value: BrewMethod; label: string }[] = [
  { value: "espresso", label: "Espresso" },
  { value: "pour_over", label: "Pour over" },
  { value: "french_press", label: "French press" },
  { value: "drip", label: "Drip" },
  { value: "aeropress", label: "AeroPress" },
];

const FLAVORS = [
  { key: "chocolate", label: "Chocolate" },
  { key: "nutty", label: "Nutty" },
  { key: "caramel", label: "Caramel" },
  { key: "fruity", label: "Fruity" },
  { key: "floral", label: "Floral" },
] as const;

export default function RecommendPage() {
  const [brewMethod, setBrewMethod] = useState<BrewMethod>("pour_over");
  const [wantsLowAcid, setWantsLowAcid] = useState(false);
  const [wantsLowBitterness, setWantsLowBitterness] = useState(false);
  const [budgetUsd, setBudgetUsd] = useState(25);
  const [flavors, setFlavors] = useState({
    chocolate: 0.5,
    nutty: 0.5,
    caramel: 0.5,
    fruity: 0.5,
    floral: 0.5,
  });

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"loved" | "ok" | "disliked" | null>(null);
  const [sourBitter, setSourBitter] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "started_flow" }),
    }).catch(() => {});
  }, []);

  const updateFlavor = (key: (typeof FLAVORS)[number]["key"], value: number) => {
    setFlavors((p) => ({ ...p, [key]: value }));
  };

  const handleGetRecommendations = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brewMethod,
          wantsLowAcid,
          wantsLowBitterness,
          budgetUsd,
          milk: false,
          ...flavors,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get recommendations");
      setRecommendations(data.recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoffee = (id: string) => {
    setSelectedCoffeeId(id);
    setFeedbackRating(null);
    setSourBitter(0);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedCoffeeId || !feedbackRating) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendedCoffeeId: selectedCoffeeId,
          rating: feedbackRating,
          sourBitter,
        }),
      });
      setFeedbackSubmitted(true);
    } catch {
      setError("Failed to submit feedback");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-coffee-200">
        <h2 className="mb-6 text-xl font-semibold text-coffee-800">
          Your preferences
        </h2>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-coffee-700">
              Brew method
            </label>
            <select
              value={brewMethod}
              onChange={(e) => setBrewMethod(e.target.value as BrewMethod)}
              className="w-full rounded-lg border border-coffee-300 bg-white px-3 py-2 text-coffee-800 focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500"
            >
              {BREW_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={wantsLowAcid}
                onChange={(e) => setWantsLowAcid(e.target.checked)}
                className="rounded border-coffee-300"
              />
              <span className="text-sm text-coffee-700">Prefer low acidity</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={wantsLowBitterness}
                onChange={(e) => setWantsLowBitterness(e.target.checked)}
                className="rounded border-coffee-300"
              />
              <span className="text-sm text-coffee-700">
                Prefer low bitterness
              </span>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-coffee-700">
              Budget (max $/bag)
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={budgetUsd}
              onChange={(e) => setBudgetUsd(Number(e.target.value) || 25)}
              className="w-24 rounded-lg border border-coffee-300 px-3 py-2 text-coffee-800"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-coffee-700">
              Flavor preferences (slide to adjust)
            </label>
            <div className="space-y-3">
              {FLAVORS.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-coffee-600">{f.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={flavors[f.key]}
                    onChange={(e) =>
                      updateFlavor(f.key, parseFloat(e.target.value))
                    }
                    className="flex-1 accent-coffee-600"
                  />
                  <span className="w-8 text-sm text-coffee-500">
                    {Math.round(flavors[f.key] * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="mt-6 rounded-lg bg-coffee-600 px-6 py-3 font-medium text-white transition hover:bg-coffee-700 disabled:opacity-50"
        >
          {loading ? "Finding your coffees…" : "Generate top 3"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="mt-10 space-y-6">
          <h2 className="text-xl font-semibold text-coffee-800">
            Your top 3 picks
          </h2>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {recommendations.map((r) => (
              <div
                key={r.coffee.id}
                className={`rounded-xl border-2 bg-white p-5 shadow-md transition ${
                  selectedCoffeeId === r.coffee.id
                    ? "border-coffee-500 ring-2 ring-coffee-200"
                    : "border-coffee-200 hover:border-coffee-300"
                }`}
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-coffee-800">
                    {r.coffee.name}
                  </h3>
                  <p className="text-sm text-coffee-600">
                    {r.coffee.roaster} · {r.coffee.origin} · {r.coffee.roastLevel}
                  </p>
                  <p className="mt-1 font-medium text-coffee-700">
                    ${r.coffee.priceUsd}
                  </p>
                </div>

                <ul className="mb-4 list-inside list-disc text-sm text-coffee-600">
                  {r.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>

                <div className="mb-4 rounded-lg bg-coffee-50 p-3 text-sm">
                  <p className="font-medium text-coffee-700">Brew guide</p>
                  <p>
                    Grind: {r.brewGuide.grind} · Time: {r.brewGuide.time} ·
                    Ratio: {r.brewGuide.ratio} · Temp: {r.brewGuide.temp}
                  </p>
                  {r.brewGuide.tips.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-coffee-600">
                      {r.brewGuide.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleSelectCoffee(r.coffee.id);
                    fetch("/api/analytics", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        event: "clicked_recommendation",
                        payload: { coffeeId: r.coffee.id },
                      }),
                    }).catch(() => {});
                  }}
                  className="w-full rounded-lg border border-coffee-400 bg-white px-4 py-2 text-sm font-medium text-coffee-700 transition hover:bg-coffee-50"
                >
                  Select this coffee
                </button>
              </div>
            ))}
          </div>

          {selectedCoffeeId && (
            <div className="mt-8 rounded-xl border border-coffee-200 bg-white p-6 shadow-md">
              <h3 className="mb-4 font-semibold text-coffee-800">
                How was it? (Feedback helps us improve)
              </h3>

              {feedbackSubmitted ? (
                <p className="text-coffee-600">Thank you for your feedback!</p>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-coffee-600">
                      Overall experience
                    </p>
                    <div className="flex gap-2">
                      {(["loved", "ok", "disliked"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setFeedbackRating(r)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                            feedbackRating === r
                              ? "bg-coffee-600 text-white"
                              : "bg-coffee-100 text-coffee-700 hover:bg-coffee-200"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 text-sm text-coffee-600">
                      Too sour ↔ Too bitter
                    </p>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      value={sourBitter}
                      onChange={(e) =>
                        setSourBitter(parseInt(e.target.value, 10))
                      }
                      className="w-full accent-coffee-600"
                    />
                    <div className="mt-1 flex justify-between text-xs text-coffee-500">
                      <span>Too sour</span>
                      <span>Too bitter</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackRating}
                    className="rounded-lg bg-coffee-600 px-4 py-2 font-medium text-white hover:bg-coffee-700 disabled:opacity-50"
                  >
                    Submit feedback
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
