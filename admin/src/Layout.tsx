import { Outlet, NavLink } from "react-router-dom";

interface LayoutProps {
  onLogout: () => void;
}

export function Layout({ onLogout }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui" }}>
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #e0d5c7",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
        }}
      >
        <nav style={{ display: "flex", gap: "20px" }}>
          <NavLink
            to="/admin/products"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#8b6914" : "#5c4033",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Products
          </NavLink>
          <NavLink
            to="/admin/weights"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#8b6914" : "#5c4033",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Weights
          </NavLink>
          <NavLink
            to="/admin/analytics"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#8b6914" : "#5c4033",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Analytics
          </NavLink>
          <NavLink
            to="/admin/cafes"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#8b6914" : "#5c4033",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Cafes
          </NavLink>
          <NavLink
            to="/admin/orders"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#8b6914" : "#5c4033",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Orders
          </NavLink>
        </nav>
        <button
          onClick={onLogout}
          style={{
            padding: "6px 12px",
            border: "1px solid #c4a77d",
            borderRadius: "6px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>
      <main style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
