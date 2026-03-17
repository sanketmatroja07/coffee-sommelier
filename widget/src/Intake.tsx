import { useState, useEffect } from "react";
import type { StructuredVector } from "./types";

const STEPS = [
  { id: "flavor", label: "Flavor direction" },
  { id: "roast", label: "Roast preference" },
  { id: "acidity", label: "Acidity" },
  { id: "body", label: "Body" },
  { id: "brew", label: "Brew method" },
  { id: "milk", label: "Milk or black?" },
  { id: "budget", label: "Budget" },
];

const FLAVOR_TAGS = ["fruity", "floral", "chocolate", "nutty", "caramel", "earthy", "citrus"];
const ROAST_OPTIONS = [
  { value: 1, label: "Light" },
  { value: 2, label: "Light-Medium" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Medium-Dark" },
  { value: 5, label: "Dark" },
];
const SCALE_OPTIONS = [1, 2, 3, 4, 5];
const BREW_METHODS = ["pour_over", "french_press", "drip", "aeropress", "espresso"];
const BUDGET_OPTIONS = [12, 16, 20, 25, 30, null];

interface IntakeProps {
  onComplete: (v: StructuredVector) => void;
  onStart: () => void;
  apiBase: string;
}

export function Intake({ onComplete, onStart }: IntakeProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [roast, setRoast] = useState(3);
  const [acidity, setAcidity] = useState(3);
  const [body, setBody] = useState(3);
  const [sweetness, setSweetness] = useState(3);
  const [brew, setBrew] = useState("pour_over");
  const [milk, setMilk] = useState(false);
  const [budget, setBudget] = useState<number | null>(22);
  const [caffeine, setCaffeine] = useState("full");

  useEffect(() => {
    onStart();
  }, []);

  const toggleFlavor = (t: string) => {
    setFlavorTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      onComplete({
        roast_preference: roast,
        acidity_preference: acidity,
        body_preference: body,
        sweetness_preference: sweetness,
        flavor_tags: flavorTags,
        brew_method: brew,
        caffeine,
        price_max: budget,
        milk,
      });
    }
  };

  const handleBack = () => setStepIdx((i) => Math.max(0, i - 1));

  const step = STEPS[stepIdx];

  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", marginBottom: "8px", color: "#5c4033" }}>
        Find your perfect coffee
      </h1>
      <div
        style={{
          height: "4px",
          background: "#e8ddd5",
          borderRadius: "2px",
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${((stepIdx + 1) / STEPS.length) * 100}%`,
            height: "100%",
            background: "#8b6914",
            transition: "width 0.2s",
          }}
        />
      </div>

      {step.id === "flavor" && (
        <div>
          <p style={{ marginBottom: "12px", color: "#5c4033" }}>Which flavors appeal to you?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {FLAVOR_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleFlavor(t)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "20px",
                  border: flavorTags.includes(t) ? "2px solid #8b6914" : "1px solid #c4a77d",
                  background: flavorTags.includes(t) ? "#f5eed8" : "#fff",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.id === "roast" && (
        <div>
          <p style={{ marginBottom: "12px" }}>Roast preference</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ROAST_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setRoast(o.value)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: roast === o.value ? "2px solid #8b6914" : "1px solid #e0d5c7",
                  background: roast === o.value ? "#f5eed8" : "#fff",
                  cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.id === "acidity" && (
        <div>
          <p style={{ marginBottom: "12px" }}>Acidity (1 = low, 5 = bright)</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SCALE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setAcidity(n)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  border: acidity === n ? "2px solid #8b6914" : "1px solid #e0d5c7",
                  background: acidity === n ? "#f5eed8" : "#fff",
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.id === "body" && (
        <div>
          <p style={{ marginBottom: "12px" }}>Body (1 = light, 5 = full)</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SCALE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setBody(n)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  border: body === n ? "2px solid #8b6914" : "1px solid #e0d5c7",
                  background: body === n ? "#f5eed8" : "#fff",
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.id === "brew" && (
        <div>
          <p style={{ marginBottom: "12px" }}>Brew method</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {BREW_METHODS.map((b) => (
              <button
                key={b}
                onClick={() => setBrew(b)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: brew === b ? "2px solid #8b6914" : "1px solid #e0d5c7",
                  background: brew === b ? "#f5eed8" : "#fff",
                  cursor: "pointer",
                  textTransform: "replace",
                }}
              >
                {b.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.id === "milk" && (
        <div>
          <p style={{ marginBottom: "12px" }}>Milk or black?</p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setMilk(true)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "8px",
                border: milk ? "2px solid #8b6914" : "1px solid #e0d5c7",
                background: milk ? "#f5eed8" : "#fff",
                cursor: "pointer",
              }}
            >
              With milk
            </button>
            <button
              onClick={() => setMilk(false)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "8px",
                border: !milk ? "2px solid #8b6914" : "1px solid #e0d5c7",
                background: !milk ? "#f5eed8" : "#fff",
                cursor: "pointer",
              }}
            >
              Black
            </button>
          </div>
        </div>
      )}

      {step.id === "budget" && (
        <div>
          <p style={{ marginBottom: "12px" }}>Max price per bag (USD)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b ?? 0}
                onClick={() => setBudget(b)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: budget === b ? "2px solid #8b6914" : "1px solid #e0d5c7",
                  background: budget === b ? "#f5eed8" : "#fff",
                  cursor: "pointer",
                }}
              >
                {b == null ? "No limit" : `$${b}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        {stepIdx > 0 && (
          <button
            onClick={handleBack}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #c4a77d",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#8b6914",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {stepIdx < STEPS.length - 1 ? "Next" : "Get recommendations"}
        </button>
      </div>
    </div>
  );
}
