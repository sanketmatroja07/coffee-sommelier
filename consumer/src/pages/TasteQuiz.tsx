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

const SCALE_OPTIONS = [
  { value: 1, label: "Low" },
  { value: 2, label: "Low-Medium" },
  { value: 3, label: "Balanced" },
  { value: 4, label: "Medium-High" },
  { value: 5, label: "High" },
];

const FLAVOR_TAGS = ["fruity", "nutty", "chocolate", "citrus", "berry", "caramel", "floral", "earthy"];

export function TasteQuiz() {
  const { preferences, savePreferences, completeQuiz } = usePreferences();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [roast, setRoast] = useState(preferences.roast_preference);
  const [acidity, setAcidity] = useState(preferences.acidity_preference);
  const [body, setBody] = useState(preferences.body_preference);
  const [sweetness, setSweetness] = useState(preferences.sweetness_preference);
  const [brew, setBrew] = useState(preferences.brew_method);
  const [flavors, setFlavors] = useState<string[]>(preferences.flavor_tags);
  const [caffeine, setCaffeine] = useState(preferences.caffeine);
  const [milk, setMilk] = useState(preferences.milk);
  const [budget, setBudget] = useState<string>(preferences.price_max ? String(preferences.price_max) : "");
  const totalSteps = 5;

  const toggleFlavor = (f: string) => {
    setFlavors((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleFinish = async () => {
    await savePreferences({
      roast_preference: roast,
      acidity_preference: acidity,
      body_preference: body,
      sweetness_preference: sweetness,
      brew_method: brew,
      flavor_tags: flavors,
      caffeine,
      milk,
      price_max: budget ? Number(budget) : null,
    });
    completeQuiz();
    navigate("/discover?mode=recommended");
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
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
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
          <h2>How bright or rich should it feel?</h2>
          <div className="taste-quiz__scale-grid">
            <div>
              <p className="taste-quiz__scale-label">Acidity</p>
              <div className="taste-quiz__chips">
                {SCALE_OPTIONS.map((o) => (
                  <button
                    key={`acidity-${o.value}`}
                    className={`taste-quiz__chip ${acidity === o.value ? "active" : ""}`}
                    onClick={() => setAcidity(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="taste-quiz__scale-label">Body</p>
              <div className="taste-quiz__chips">
                {SCALE_OPTIONS.map((o) => (
                  <button
                    key={`body-${o.value}`}
                    className={`taste-quiz__chip ${body === o.value ? "active" : ""}`}
                    onClick={() => setBody(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="taste-quiz__scale-label">Sweetness</p>
              <div className="taste-quiz__chips">
                {SCALE_OPTIONS.map((o) => (
                  <button
                    key={`sweetness-${o.value}`}
                    className={`taste-quiz__chip ${sweetness === o.value ? "active" : ""}`}
                    onClick={() => setSweetness(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
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

      {step === 4 && (
        <section className="taste-quiz__section">
          <h2>Set the final details</h2>
          <div className="taste-quiz__fields">
            <label className="taste-quiz__field">
              <span>Caffeine</span>
              <select value={caffeine} onChange={(e) => setCaffeine(e.target.value)}>
                <option value="full">Full caffeine</option>
                <option value="half">Half caf</option>
                <option value="decaf">Decaf</option>
              </select>
            </label>
            <label className="taste-quiz__field">
              <span>Max price (optional)</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="8"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <label className="taste-quiz__check">
              <input type="checkbox" checked={milk} onChange={(e) => setMilk(e.target.checked)} />
              <span>I often drink my coffee with milk</span>
            </label>
          </div>
        </section>
      )}

      <div className="taste-quiz__footer">
        {step < totalSteps - 1 ? (
          <button className="taste-quiz__btn" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button className="taste-quiz__btn taste-quiz__btn--primary" onClick={() => { void handleFinish(); }}>
            Find my cafes
          </button>
        )}
      </div>
    </div>
  );
}
