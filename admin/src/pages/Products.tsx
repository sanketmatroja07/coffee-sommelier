import { useState, useEffect } from "react";

interface ProductsProps {
  merchantId: string;
  auth: { user: string; pass: string };
}

export function Products({ merchantId, auth }: ProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/admin/products?merchant_id=${merchantId}`, {
      headers: { Authorization: `Basic ${btoa(`${auth.user}:${auth.pass}`)}` },
    })
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [merchantId, auth]);

  if (loading) return <p>Loading...</p>;
  if (products.length === 0)
    return (
      <div>
        <h2>Products</h2>
        <p style={{ color: "#5c4033", marginTop: "12px" }}>
          No products. Seed the database or upload CSV.
        </p>
      </div>
    );

  return (
    <div>
      <h2>Products</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e0d5c7" }}>
            <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
            <th style={{ textAlign: "left", padding: "10px" }}>SKU</th>
            <th style={{ textAlign: "left", padding: "10px" }}>Roast</th>
            <th style={{ textAlign: "left", padding: "10px" }}>Price</th>
            <th style={{ textAlign: "left", padding: "10px" }}>Origin</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #e8ddd5" }}>
              <td style={{ padding: "10px" }}>{p.name}</td>
              <td style={{ padding: "10px" }}>{p.sku}</td>
              <td style={{ padding: "10px" }}>{p.roast_level}</td>
              <td style={{ padding: "10px" }}>${p.price}</td>
              <td style={{ padding: "10px" }}>{p.origin || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
