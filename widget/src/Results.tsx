import type { Recommendation } from "./types";

interface ResultsProps {
  recommendations: Recommendation[];
  onFeedback: (r: Recommendation) => void;
  onAddToCart: (id: string) => void;
  onProductClick: (id: string) => void;
}

export function Results({
  recommendations,
  onFeedback,
  onAddToCart,
  onProductClick,
}: ResultsProps) {
  if (recommendations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "24px", color: "#5c4033" }}>
        <p>No matching coffees found. Try adjusting your preferences.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "#5c4033" }}>
        Your top picks
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {recommendations.map((rec, i) => (
          <div
            key={rec.product_id}
            style={{
              padding: "16px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e8ddd5",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <h3
                style={{ fontSize: "1rem", color: "#2c1810", cursor: "pointer" }}
                onClick={() => onProductClick(rec.product_id)}
              >
                {rec.product.name}
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "#f5eed8",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  color: "#8b6914",
                }}
              >
                {Math.round(rec.score * 100)}% match
              </span>
            </div>
            {rec.product.origin && (
              <p style={{ fontSize: "0.875rem", color: "#6b5344", marginBottom: "8px" }}>
                {rec.product.origin}
                {rec.product.process && ` • ${rec.product.process}`}
              </p>
            )}
            <ul style={{ marginBottom: "12px", paddingLeft: "20px", fontSize: "0.875rem" }}>
              {rec.reasons.slice(0, 3).map((r, j) => (
                <li key={j} style={{ marginBottom: "4px", color: "#5c4033" }}>
                  {r}
                </li>
              ))}
            </ul>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#8b7355",
                marginBottom: "12px",
                padding: "8px",
                background: "#faf8f5",
                borderRadius: "6px",
              }}
            >
              <strong>Brew:</strong> {rec.brew_guide.grind} grind, {rec.brew_guide.ratio},{" "}
              {rec.brew_guide.temp}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#2c1810" }}>${rec.product.price}</span>
              <button
                onClick={() => onAddToCart(rec.product_id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#8b6914",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Add to cart
              </button>
              <button
                onClick={() => onFeedback(rec)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #c4a77d",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                Feedback
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
