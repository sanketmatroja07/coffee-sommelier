import { useState } from "react";
import type { Recommendation } from "./types";

interface FeedbackModalProps {
  product: Recommendation;
  onClose: () => void;
  apiBase: string;
  sessionId: string;
  userProfileId: string;
}

export function FeedbackModal({
  product,
  onClose,
  apiBase,
  sessionId,
  userProfileId,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<string | null>(null);
  const [sourBitter, setSourBitter] = useState(0);
  const [weakStrong, setWeakStrong] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!rating) return;
    try {
      await fetch(`${apiBase}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile_id: userProfileId,
          product_id: product.product_id,
          rating,
          sour_bitter_slider: sourBitter,
          weak_strong_slider: weakStrong,
          notes: notes || null,
        }),
      });
      setSubmitted(true);
      setTimeout(onClose, 800);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "360px",
          width: "100%",
          margin: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ marginBottom: "12px", color: "#2c1810" }}>How was {product.product.name}?</h3>
        {submitted ? (
          <p style={{ color: "#5c4033" }}>Thanks for your feedback!</p>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ marginBottom: "8px", fontSize: "0.875rem" }}>Overall</p>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Loved", "OK", "Disliked"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: rating === r ? "2px solid #8b6914" : "1px solid #e0d5c7",
                      background: rating === r ? "#f5eed8" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ marginBottom: "8px", fontSize: "0.875rem" }}>
                Sour ← → Bitter
              </p>
              <input
                type="range"
                min={-2}
                max={2}
                value={sourBitter}
                onChange={(e) => setSourBitter(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ marginBottom: "8px", fontSize: "0.875rem" }}>
                Weak ← → Strong
              </p>
              <input
                type="range"
                min={-2}
                max={2}
                value={weakStrong}
                onChange={(e) => setWeakStrong(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e0d5c7",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #c4a77d",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Skip
              </button>
              <button
                onClick={submit}
                disabled={!rating}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: rating ? "#8b6914" : "#ccc",
                  color: "#fff",
                  cursor: rating ? "pointer" : "not-allowed",
                }}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
