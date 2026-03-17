import { useState } from "react";

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/admin/weights?merchant_id=default", {
        headers: { Authorization: `Basic ${btoa(`${user}:${pass}`)}` },
      });
      if (res.status === 401) {
        setError("Invalid credentials");
        return;
      }
      onLogin(user, pass);
    } catch {
      setError("Connection failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
        background: "#faf8f5",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "32px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          width: "320px",
        }}
      >
        <h1 style={{ marginBottom: "24px", color: "#2c1810" }}>Admin Login</h1>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem" }}>Username</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e0d5c7",
              borderRadius: "8px",
            }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem" }}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e0d5c7",
              borderRadius: "8px",
            }}
          />
        </div>
        {error && <p style={{ color: "#b54", marginBottom: "12px", fontSize: "0.875rem" }}>{error}</p>}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "#8b6914",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
