import { useState, useEffect } from "react";

interface AnalyticsProps {
  merchantId: string;
  auth: { user: string; pass: string };
}

export function Analytics({ merchantId, auth }: AnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/admin/analytics?merchant_id=${merchantId}`, {
      headers: { Authorization: `Basic ${btoa(`${auth.user}:${auth.pass}`)}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [merchantId, auth]);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data</p>;

  return (
    <div>
      <h2>Analytics</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginTop: "20px" }}>
        <div style={{ padding: "20px", background: "#fff", borderRadius: "12px", border: "1px solid #e8ddd5" }}>
          <div style={{ fontSize: "0.75rem", color: "#8b7355", marginBottom: "4px" }}>Intake starts</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{data.intake_start_count ?? 0}</div>
        </div>
        <div style={{ padding: "20px", background: "#fff", borderRadius: "12px", border: "1px solid #e8ddd5" }}>
          <div style={{ fontSize: "0.75rem", color: "#8b7355", marginBottom: "4px" }}>Completions</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{data.intake_complete_count ?? 0}</div>
        </div>
        <div style={{ padding: "20px", background: "#fff", borderRadius: "12px", border: "1px solid #e8ddd5" }}>
          <div style={{ fontSize: "0.75rem", color: "#8b7355", marginBottom: "4px" }}>Completion rate</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{((data.completion_rate ?? 0) * 100).toFixed(0)}%</div>
        </div>
        <div style={{ padding: "20px", background: "#fff", borderRadius: "12px", border: "1px solid #e8ddd5" }}>
          <div style={{ fontSize: "0.75rem", color: "#8b7355", marginBottom: "4px" }}>Add to cart</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{data.add_to_cart_count ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
