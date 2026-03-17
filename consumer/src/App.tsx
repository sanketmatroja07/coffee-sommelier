import { Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { PreferenceProvider } from "./context/PreferenceContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";
import { Landing } from "./pages/Landing";
import { Discover } from "./pages/Discover";
import { CafeDetail } from "./pages/CafeDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { TasteQuiz } from "./pages/TasteQuiz";
import { Partner } from "./pages/Partner";
import { Favorites } from "./pages/Favorites";
import { Contact } from "./pages/Contact";
import { NotFound } from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8000");

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <OfflineBanner />
    <NavBar transparent={isLanding} />
    <main style={{ flex: 1 }}>
    <Routes>
      <Route path="/" element={<Landing apiBase={API_BASE} />} />
      <Route path="/discover" element={<Discover apiBase={API_BASE} />} />
      <Route path="/cafes/:id" element={<CafeDetail apiBase={API_BASE} />} />
      <Route path="/cart" element={<Cart apiBase={API_BASE} />} />
      <Route path="/checkout" element={<Checkout apiBase={API_BASE} />} />
      <Route path="/orders" element={<Orders apiBase={API_BASE} />} />
      <Route path="/orders/:id" element={<OrderDetail apiBase={API_BASE} />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/quiz" element={<TasteQuiz />} />
      <Route path="/partner" element={<Partner apiBase={API_BASE} />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </main>
    <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <PreferenceProvider>
            <FavoritesProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </FavoritesProvider>
          </PreferenceProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
