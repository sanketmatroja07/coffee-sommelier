import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import "./NavBar.css";
export function NavBar({ transparent }: { transparent?: boolean }) {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  return (
    <>
    <nav className={`navbar ${transparent ? "navbar--transparent" : ""}`}>
      <Link to="/" className="navbar__brand">Coffee Finder</Link>
      <div className="navbar__right">
        {user ? (
          <div className="navbar__user">
            <Link to="/favorites" className="navbar__link">Favorites</Link>
            <Link to="/recommendations" className="navbar__link">Matches</Link>
            <Link to="/orders" className="navbar__link">Orders</Link>
            <span className="navbar__email">{user.email}</span>
            <button onClick={logout} className="navbar__logout">Log out</button>
          </div>
        ) : (
          <div className="navbar__auth">
            <button onClick={() => { setAuthTab("login"); setShowAuth(true); }} className="navbar__login">Log in</button>
            <button onClick={() => { setAuthTab("register"); setShowAuth(true); }} className="navbar__signup">Sign up</button>
          </div>
        )}
        {itemCount > 0 && (
          <Link to="/cart" className="navbar__cart">
            Cart ({itemCount})
          </Link>
        )}
      </div>
    </nav>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab={authTab} />}
    </>
  );
}
