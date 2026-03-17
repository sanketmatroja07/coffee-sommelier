import { useState, useEffect } from "react";

interface CafesProps {
  auth: { user: string; pass: string };
}

export function Cafes({ auth }: CafesProps) {
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/cafes", {
      headers: { Authorization: `Basic ${btoa(`${auth.user}:${auth.pass}`)}` },
    })
      .then((r) => r.json())
      .then(setCafes)
      .finally(() => setLoading(false));
  }, [auth]);

  if (loading) return <p>Loading...</p>;
  if (cafes.length === 0)
    return (
      <div>
        <h2>Cafes</h2>
        <p style={{ color: "#5c4033", marginTop: "12px" }}>No cafes. Run seed script.</p>
      </div>
    );

  return (
    <div>
      <h2>Cafes</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e0d5c7" }}>
            <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
            <th style={{ textAlign: "left", padding: "10px" }}>Address</th>
            <th style={{ textAlign: "left", padding: "10px" }}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {cafes.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #e8ddd5" }}>
              <td style={{ padding: "10px" }}>{c.name}</td>
              <td style={{ padding: "10px" }}>{c.address || "-"}</td>
              <td style={{ padding: "10px" }}>{c.rating ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
