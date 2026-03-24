import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { API_BASE } from "../lib/apiBase";

const PREF_KEY = "coffee_finder_preferences";

export interface UserPreferences {
  roast_preference: number; // 1-5
  acidity_preference: number;
  body_preference: number;
  sweetness_preference: number;
  brew_method: string;
  flavor_tags: string[];
  origin: string | null;
  caffeine: string;
  price_max: number | null;
  milk: boolean;
}

const DEFAULT: UserPreferences = {
  roast_preference: 3,
  acidity_preference: 3,
  body_preference: 3,
  sweetness_preference: 3,
  brew_method: "pour_over",
  flavor_tags: [],
  origin: null,
  caffeine: "full",
  price_max: null,
  milk: false,
};

interface PreferenceContextValue {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  savePreferences: (p?: Partial<UserPreferences>) => Promise<UserPreferences>;
  hasCompletedQuiz: boolean;
  completeQuiz: () => void;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const { user, getAuthHeader } = useAuth();
  const [preferences, setPrefsState] = useState<UserPreferences>(() => {
    try {
      const s = localStorage.getItem(PREF_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        return { ...DEFAULT, ...parsed };
      }
    } catch {}
    return DEFAULT;
  });
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(() => {
    try {
      return localStorage.getItem(PREF_KEY + "_quiz") === "true";
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  const setPreferences = useCallback((p: Partial<UserPreferences>) => {
    setPrefsState((prev) => ({ ...prev, ...p }));
  }, []);

  const savePreferences = useCallback(
    async (p?: Partial<UserPreferences>) => {
      const next = { ...preferences, ...(p ?? {}) };
      setPrefsState(next);
      if (user) {
        const headers = getAuthHeader();
        const res = await fetch(`${API_BASE}/api/v1/me/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(headers ?? {}),
          },
          body: JSON.stringify({ preferences: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Couldn't save your taste profile");
        }
      }
      return next;
    },
    [preferences, user, getAuthHeader]
  );

  const completeQuiz = useCallback(() => {
    setHasCompletedQuiz(true);
    try {
      localStorage.setItem(PREF_KEY + "_quiz", "true");
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    const headers = getAuthHeader();
    if (!headers) return;
    fetch(`${API_BASE}/api/v1/me/preferences`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.preferences) {
          setPrefsState((prev) => ({ ...prev, ...data.preferences }));
          setHasCompletedQuiz(true);
        }
      })
      .catch(() => {});
  }, [user, getAuthHeader]);

  return (
    <PreferenceContext.Provider
      value={{ preferences, setPreferences, savePreferences, hasCompletedQuiz, completeQuiz }}
    >
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferenceProvider");
  return ctx;
}
