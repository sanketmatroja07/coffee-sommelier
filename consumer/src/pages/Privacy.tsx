import { Link } from "react-router-dom";

export function Privacy() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <Link to="/" className="legal-page__back">← Back</Link>
        <h1>Privacy Policy</h1>
      </header>
      <div className="legal-page__content">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          Coffee Finder respects your privacy. We collect only what's needed to help you discover cafes and place orders:
          location data (for finding nearby cafes), email and account info (when you sign up), and order history.
        </p>
        <p>
          We do not sell your data. For questions, contact us at{" "}
          <a href="mailto:hello@coffeefinder.app">hello@coffeefinder.app</a>.
        </p>
      </div>
    </div>
  );
}
