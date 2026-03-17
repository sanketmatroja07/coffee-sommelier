import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const FAV_KEY = "coffee_finder_favorites";

export interface FavoriteCafe {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  image_url?: string | null;
}

interface FavoritesContextValue {
  favoriteCafes: FavoriteCafe[];
  favoriteCafeIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string, cafe?: Partial<FavoriteCafe>) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteCafes, setFavorites] = useState<FavoriteCafe[]>(() => {
    try {
      const s = localStorage.getItem(FAV_KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favoriteCafes));
    } catch {}
  }, [favoriteCafes]);

  const favoriteCafeIds = favoriteCafes.map((c) => c.id);
  const isFavorite = useCallback(
    (id: string) => favoriteCafes.some((c) => c.id === id),
    [favoriteCafes]
  );

  const toggleFavorite = useCallback((id: string, cafe?: Partial<FavoriteCafe>) => {
    setFavorites((prev) => {
      const exists = prev.find((c) => c.id === id);
      if (exists) return prev.filter((c) => c.id !== id);
      return [...prev, { id, name: cafe?.name || "Cafe", ...cafe }];
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ favoriteCafes, favoriteCafeIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
