export const APP_STORAGE_KEYS = [
  "coffee_finder_token",
  "coffee_finder_cart",
  "coffee_finder_favorites",
  "coffee_finder_preferences",
  "coffee_finder_preferences_quiz",
  "coffee_finder_guest_orders",
  "coffee-finder-recent-locations",
] as const;

export function clearAppStorage() {
  try {
    APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {}
}
