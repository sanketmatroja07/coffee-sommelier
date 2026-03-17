import { Link } from "react-router-dom";

export function Terms() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <Link to="/" className="legal-page__back">← Back</Link>
        <h1>Terms of Service</h1>
      </header>
      <div className="legal-page__content">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          By using Coffee Finder, you agree to use the service for ordering coffee from participating cafes.
          You pay at pickup—we facilitate discovery and ordering. Cafe availability and menus may change.
        </p>
        <p>
          For questions, contact us at{" "}
          <a href="mailto:hello@coffeefinder.app">hello@coffeefinder.app</a>.
        </p>
      </div>
    </div>
  );
}
