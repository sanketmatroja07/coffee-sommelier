import { useState, useEffect } from "react";

interface OrdersProps {
  auth: { user: string; pass: string };
}

export function Orders({ auth }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/orders", {
      headers: { Authorization: `Basic ${btoa(`${auth.user}:${auth.pass}`)}` },
    })
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [auth]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Orders</h2>
      {orders.length === 0 ? (
        <p style={{ color: "#5c4033", marginTop: "12px" }}>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0d5c7" }}>
              <th style={{ textAlign: "left", padding: "10px" }}>Order ID</th>
              <th style={{ textAlign: "left", padding: "10px" }}>Cafe</th>
              <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "10px" }}>Total</th>
              <th style={{ textAlign: "left", padding: "10px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid #e8ddd5" }}>
                <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "0.85rem" }}>{o.id.slice(0, 8)}...</td>
                <td style={{ padding: "10px" }}>{o.cafe_name}</td>
                <td style={{ padding: "10px" }}>
                  <select
                    value={o.status}
                    onChange={async (e) => {
                      const status = e.target.value;
                      await fetch(`/admin/orders/${o.id}?status=${status}`, { method: "PATCH", headers: { Authorization: `Basic ${btoa(`${auth.user}:${auth.pass}`)}` } });
                      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
                    }}
                    style={{ padding: "4px 8px", borderRadius: "4px" }}
                  >
                    <option value="pending">pending</option>
                    <option value="preparing">preparing</option>
                    <option value="ready">ready</option>
                    <option value="picked_up">picked_up</option>
                  </select>
                </td>
                <td style={{ padding: "10px" }}>${o.total?.toFixed(2)}</td>
                <td style={{ padding: "10px", fontSize: "0.85rem" }}>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
