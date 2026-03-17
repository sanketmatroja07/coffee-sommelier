import { useState } from "react";
import { Link } from "react-router-dom";
import "./Contact.css";

const CONTACT_EMAIL = "hello@coffeefinder.app";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact from ${form.name || "Coffee Finder"}`);
    const body = encodeURIComponent(
      `${form.message}\n\n---\nFrom: ${form.name}\nEmail: ${form.email}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="contact legal-page">
      <header className="legal-page__header">
        <Link to="/" className="legal-page__back">← Back</Link>
        <h1>Contact us</h1>
      </header>
      <div className="contact__content">
        <p>Have a question, feedback, or want to become a partner? We&apos;d love to hear from you.</p>
        <div className="contact__methods">
          <p><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          <p>We typically respond within 1–2 business days.</p>
        </div>
        <form onSubmit={handleSubmit} className="contact__form">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <textarea
            placeholder="Your message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={4}
            required
          />
          <button type="submit">
            {submitted ? "Opening email…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
