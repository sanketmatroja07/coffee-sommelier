import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./AuthModal.css";

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: "login" | "register";
  isPartnerSignup?: boolean;
}

export function AuthModal({ onClose, defaultTab = "login", isPartnerSignup = false }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (tab === "register" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(email, password, name || undefined, isPartnerSignup);
        toast.success("Account created!");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">×</button>
        <h2>{tab === "login" ? "Log in" : "Create account"}</h2>
        <div className="auth-modal__tabs">
          <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>Log in</button>
          <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>Sign up</button>
        </div>
        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-modal__input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-modal__input"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="auth-modal__input"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />
          {tab === "register" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="auth-modal__input"
              autoComplete="new-password"
            />
          )}
          <button type="submit" className="auth-modal__submit" disabled={loading}>
            {loading ? "..." : tab === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
