import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8000");
const TOKEN_KEY = "coffee_finder_token";

interface User {
  id: string;
  email: string;
  name: string | null;
  is_partner?: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, isPartner?: boolean) => Promise<void>;
  logout: () => void;
  getAuthHeader: () => Record<string, string> | undefined;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (data.user) setUser(data.user);
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token).catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      });
    }
    setLoading(false);
  }, [token, fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser({ ...data.user, is_partner: data.user?.is_partner ?? false });
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string, isPartner?: boolean) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, is_partner: isPartner }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser({ ...data.user, is_partner: data.user?.is_partner ?? false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const getAuthHeader = useCallback(() => {
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, getAuthHeader }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
