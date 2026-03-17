import { useState, useEffect } from "react";

interface WeightsProps {
  merchantId: string;
  auth: { user: string; pass: string };
}

const KEYS = ["roast", "acidity", "body", "sweetness", "flavor"] as const;

export function Weights({ merchantId, auth }: WeightsProps) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headers = () => ({ Authorization: `Basic ${btoa(`${auth.user}:${auth.pass}`)}` });

  useEffect(() => {
    fetch(`/admin/weights?merchant_id=${merchantId}`, { headers: headers() })
      .then((r) => r.json())
      .then(setWeights)
      .finally(() => setLoading(false));
  }, [merchantId, auth]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/admin/weights?merchant_id=${merchantId}`, {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({
          roast: weights.roast ?? 1,
          acidity: weights.acidity ?? 1,
          body: weights.body ?? 1,
          sweetness: weights.sweetness ?? 1,
          flavor: weights.flavor ?? 1,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Scoring Weights</h2>
      <p style={{ fontSize: "0.875rem", color: "#5c4033", marginTop: "8px", marginBottom: "20px" }}>
        Adjust relative importance of each attribute (1.0 = default).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
        {KEYS.map((key) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ width: "80px", textTransform: "capitalize" }}>{key}</label>
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.1}
              value={weights[key] ?? 1}
              onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
              style={{ flex: 1 }}
            />
            <span style={{ width: "36px", textAlign: "right" }}>{(weights[key] ?? 1).toFixed(1)}</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: "24px",
          padding: "10px 24px",
          borderRadius: "8px",
          border: "none",
          background: "#8b6914",
          color: "#fff",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
