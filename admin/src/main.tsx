import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Products } from "./pages/Products";
import { Weights } from "./pages/Weights";
import { Analytics } from "./pages/Analytics";
import { Cafes } from "./pages/Cafes";
import { Orders } from "./pages/Orders";
import { Layout } from "./Layout";

const MERCHANT_ID = "default";

function App() {
  const [auth, setAuth] = React.useState<{ user: string; pass: string } | null>(() => {
    const s = sessionStorage.getItem("admin_auth");
    return s ? JSON.parse(s) : null;
  });

  const handleLogin = (user: string, pass: string) => {
    setAuth({ user, pass });
    sessionStorage.setItem("admin_auth", JSON.stringify({ user, pass }));
  };

  const handleLogout = () => {
    setAuth(null);
    sessionStorage.removeItem("admin_auth");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={!auth ? <Login onLogin={handleLogin} /> : <Navigate to="/admin/products" replace />} />
        <Route path="/admin" element={auth ? <Layout onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />}>
          <Route index element={<Navigate to="/admin/products" />} />
          <Route path="products" element={<Products merchantId={MERCHANT_ID} auth={auth!} />} />
          <Route path="weights" element={<Weights merchantId={MERCHANT_ID} auth={auth!} />} />
          <Route path="analytics" element={<Analytics merchantId={MERCHANT_ID} auth={auth!} />} />
          <Route path="cafes" element={<Cafes auth={auth!} />} />
          <Route path="orders" element={<Orders auth={auth!} />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
