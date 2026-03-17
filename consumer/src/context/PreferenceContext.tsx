import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const PREF_KEY = "coffee_finder_preferences";

export interface UserPreferences {
  roast: number; // 1-5
  brew_method: string;
  flavor_tags: string[];
  origin: string | null;
}

const DEFAULT: UserPreferences = {
  roast: 3,
  brew_method: "pour_over",
  flavor_tags: [],
  origin: null,
};

interface PreferenceContextValue {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  hasCompletedQuiz: boolean;
  completeQuiz: () => void;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children }: { children: ReactNode }) {
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

  const completeQuiz = useCallback(() => {
    setHasCompletedQuiz(true);
    try {
      localStorage.setItem(PREF_KEY + "_quiz", "true");
    } catch {}
  }, []);

  return (
    <PreferenceContext.Provider
      value={{ preferences, setPreferences, hasCompletedQuiz, completeQuiz }}
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
