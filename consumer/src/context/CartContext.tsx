import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CartItemAddon {
  addon_id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cafe_coffee_id: string;
  cafe_id: string;
  cafe_name: string;
  coffee_name: string;
  price: number;
  size: string;
  quantity: number;
  addons?: CartItemAddon[];
  special_instructions?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (cafe_coffee_id: string, size: string, addons?: CartItemAddon[], special_instructions?: string) => void;
  updateQuantity: (cafe_coffee_id: string, size: string, qty: number, addons?: CartItemAddon[], special_instructions?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const qty = item.quantity ?? 1;
      const addons = item.addons || [];
      const spec = item.special_instructions || "";
      const existing = prev.find(
        (i) =>
          i.cafe_coffee_id === item.cafe_coffee_id &&
          i.size === item.size &&
          JSON.stringify(i.addons || []) === JSON.stringify(addons) &&
          (i.special_instructions || "") === spec
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty, addons, special_instructions: spec }];
    });
  }, []);

  const removeItem = useCallback(
    (cafe_coffee_id: string, size: string, addons?: CartItemAddon[], special_instructions?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.cafe_coffee_id === cafe_coffee_id &&
              i.size === size &&
              JSON.stringify(i.addons || []) === JSON.stringify(addons || []) &&
              (i.special_instructions || "") === (special_instructions || "")
            )
        )
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (
      cafe_coffee_id: string,
      size: string,
      qty: number,
      addons?: CartItemAddon[],
      special_instructions?: string
    ) => {
      if (qty <= 0) {
        removeItem(cafe_coffee_id, size, addons, special_instructions);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.cafe_coffee_id === cafe_coffee_id &&
          i.size === size &&
          JSON.stringify(i.addons || []) === JSON.stringify(addons || []) &&
          (i.special_instructions || "") === (special_instructions || "")
            ? { ...i, quantity: qty }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => {
    const addonsTotal = (i.addons || []).reduce((a, ad) => a + ad.price, 0);
    return sum + (i.price + addonsTotal) * i.quantity;
  }, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
