import { Link } from "react-router-dom";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">Coffee Finder</Link>
          <p>Find your perfect coffee nearby</p>
        </div>
        <nav className="footer__links">
          <Link to="/discover">Discover</Link>
          <Link to="/quiz">Taste quiz</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/favorites">Favorites</Link>
          <Link to="/partner">Partners</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <div className="footer__legal">
          <span>© {new Date().getFullYear()} Coffee Finder</span>
        </div>
      </div>
    </footer>
  );
}
