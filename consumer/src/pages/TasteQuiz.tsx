import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePreferences } from "../context/PreferenceContext";
import "./TasteQuiz.css";

const ROAST_OPTIONS = [
  { value: 1, label: "Light", desc: "Bright, fruity, floral" },
  { value: 2, label: "Light-Medium", desc: "Balanced, subtle fruit" },
  { value: 3, label: "Medium", desc: "Classic, smooth" },
  { value: 4, label: "Medium-Dark", desc: "Rich, chocolatey" },
  { value: 5, label: "Dark", desc: "Bold, smoky, full-bodied" },
];

const BREW_OPTIONS = [
  { value: "pour_over", label: "Pour over" },
  { value: "espresso", label: "Espresso" },
  { value: "french_press", label: "French press" },
  { value: "drip", label: "Drip" },
  { value: "aeropress", label: "AeroPress" },
];

const FLAVOR_TAGS = ["fruity", "nutty", "chocolate", "citrus", "berry", "caramel", "floral", "earthy"];

export function TasteQuiz() {
  const { preferences, setPreferences, completeQuiz } = usePreferences();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [roast, setRoast] = useState(preferences.roast);
  const [brew, setBrew] = useState(preferences.brew_method);
  const [flavors, setFlavors] = useState<string[]>(preferences.flavor_tags);

  const toggleFlavor = (f: string) => {
    setFlavors((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleFinish = () => {
    setPreferences({ roast, brew_method: brew, flavor_tags: flavors });
    completeQuiz();
    navigate("/discover");
  };

  return (
    <div className="taste-quiz">
      <header className="taste-quiz__header">
        <Link to="/" className="taste-quiz__back">← Back</Link>
        <h1>Find your perfect cup</h1>
        <p className="taste-quiz__sub">Answer 3 quick questions</p>
      </header>

      <div className="taste-quiz__progress">
        <div
          className="taste-quiz__progress-bar"
          style={{ width: `${((step + 1) / 3) * 100}%` }}
        />
      </div>

      {step === 0 && (
        <section className="taste-quiz__section">
          <h2>What roast do you prefer?</h2>
          <div className="taste-quiz__options">
            {ROAST_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`taste-quiz__option ${roast === o.value ? "active" : ""}`}
                onClick={() => setRoast(o.value)}
              >
                <span className="taste-quiz__option-label">{o.label}</span>
                <span className="taste-quiz__option-desc">{o.desc}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="taste-quiz__section">
          <h2>How do you usually brew?</h2>
          <div className="taste-quiz__chips">
            {BREW_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`taste-quiz__chip ${brew === o.value ? "active" : ""}`}
                onClick={() => setBrew(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="taste-quiz__section">
          <h2>Which flavors do you enjoy? (pick any)</h2>
          <div className="taste-quiz__chips taste-quiz__chips--multi">
            {FLAVOR_TAGS.map((f) => (
              <button
                key={f}
                className={`taste-quiz__chip ${flavors.includes(f) ? "active" : ""}`}
                onClick={() => toggleFlavor(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="taste-quiz__footer">
        {step < 2 ? (
          <button className="taste-quiz__btn" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button className="taste-quiz__btn taste-quiz__btn--primary" onClick={handleFinish}>
            Find my cafes
          </button>
        )}
      </div>
    </div>
  );
}
