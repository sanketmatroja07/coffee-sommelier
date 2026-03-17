import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { track } from "../lib/analytics";
import { LocationSearch } from "../components/LocationSearch";
import "./Landing.css";
import "../components/LocationSearch.css";

interface LandingProps {
  apiBase: string;
}

const TASTE_CHIPS = [
  { label: "Espresso", to: "/discover?brew_method=espresso" },
  { label: "Pour Over", to: "/discover?brew_method=pour_over" },
  { label: "Light Roast", to: "/discover?roast=1" },
  { label: "Dark Roast", to: "/discover?roast=5" },
  { label: "Fruity", to: "/discover?flavor_tags=fruity,berry,citrus" },
];

const STEPS = [
  { num: "01", title: "Discover", desc: "Find cafes near you that match your taste" },
  { num: "02", title: "Order ahead", desc: "Pick your coffee, choose pickup time" },
  { num: "03", title: "Enjoy", desc: "Skip the line, pay at counter" },
];

export function Landing({ apiBase }: LandingProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    track("landing_view");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/discover");
    }
  };

  return (
    <div className="landing">
      {/* Hero - full bleed, gradient overlay */}
      <section className="landing__hero">
        <div
          className="landing__hero-bg"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920)`,
          }}
        />
        <div className="landing__hero-overlay" />
        <div className="landing__hero-content">
          <p className="landing__hero-badge">Order ahead. Skip the line.</p>
          <h1 className="landing__hero-title">
            Your perfect cup
            <br />
            <span className="landing__hero-title-accent">is one tap away</span>
          </h1>
          <p className="landing__hero-desc">
            Discover cafes. Order ahead. Skip the line.
          </p>
          <form onSubmit={handleSearch} className="landing__search">
            <LocationSearch
              apiBase={apiBase}
              value={query}
              onChange={setQuery}
              onSelect={(lat, lng, display) => {
                setQuery(display);
                navigate(`/discover?lat=${lat}&lng=${lng}&q=${encodeURIComponent(display)}`);
              }}
              placeholder="Enter city or address..."
              inputClassName="landing__search-input"
              autoFocus={false}
            />
            <button type="submit" className="landing__search-btn">Find cafes</button>
          </form>
          <div className="landing__hero-ctas">
            <Link to="/quiz" className="landing__cta landing__cta--primary">
              Take taste quiz
            </Link>
            <Link to="/discover?mode=nearby" className="landing__cta landing__cta--ghost">
              Use my location
            </Link>
            <Link to="/discover" className="landing__cta landing__cta--ghost">
              Browse all
            </Link>
          </div>
        </div>
      </section>

      {/* Taste chips - bento style */}
      <section className="landing__section landing__taste">
        <h2 className="landing__section-title">Browse by taste</h2>
        <div className="landing__chips">
          {TASTE_CHIPS.map((c) => (
            <Link key={c.label} to={c.to} className="landing__chip">
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works - 3 columns */}
      <section className="landing__section landing__steps">
        <h2 className="landing__section-title">How it works</h2>
        <div className="landing__steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="landing__step">
              <span className="landing__step-num">{s.num}</span>
              <h3 className="landing__step-title">{s.title}</h3>
              <p className="landing__step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="landing__trust">
        <div className="landing__trust-items">
          <span className="landing__trust-item">No app download</span>
          <span className="landing__trust-item">Pay at pickup</span>
          <span className="landing__trust-item">Free to browse</span>
        </div>
      </section>

      {/* CTA strip - streamlined */}
      <section className="landing__cta-strip">
        <h2 className="landing__cta-strip-title">Find cafes near you</h2>
        <Link to="/discover?mode=nearby" className="landing__cta-strip-btn">Get started</Link>
      </section>
    </div>
  );
}
