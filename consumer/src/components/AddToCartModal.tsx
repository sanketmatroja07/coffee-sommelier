import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { track } from "../lib/analytics";
import "./AddToCartModal.css";

interface Addon {
  id: string;
  name: string;
  addon_type: string;
  price: number;
}

interface AddToCartModalProps {
  onClose: () => void;
  cafeId: string;
  cafeName: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
    size_options: string[];
  };
  addons?: Addon[];
}

export function AddToCartModal({
  onClose,
  cafeId,
  cafeName,
  menuItem,
  addons = [],
}: AddToCartModalProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const [size, setSize] = useState(menuItem.size_options?.[0] || "12oz");
  const [selectedAddons, setSelectedAddons] = useState<{ addon_id: string; name: string; price: number }[]>([]);
  const [instructions, setInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  const toggleAddon = (a: Addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((x) => x.addon_id === a.id);
      if (exists) return prev.filter((x) => x.addon_id !== a.id);
      return [...prev, { addon_id: a.id, name: a.name, price: a.price }];
    });
  };

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const itemTotal = (menuItem.price + addonsTotal) * quantity;

  const handleAdd = () => {
    addItem({
      cafe_coffee_id: menuItem.id,
      cafe_id: cafeId,
      cafe_name: cafeName,
      coffee_name: menuItem.name,
      price: menuItem.price + addonsTotal,
      size,
      quantity,
      addons: selectedAddons.length ? selectedAddons : undefined,
      special_instructions: instructions.trim() || undefined,
    });
    toast.success(`Added ${menuItem.name} (${size})`);
    track("add_to_cart", { cafe_id: cafeId, coffee_name: menuItem.name });
    onClose();
  };

  return (
    <div className="add-modal-overlay" onClick={onClose}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()}>
        <button className="add-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{menuItem.name}</h2>
        <p className="add-modal__price">${menuItem.price.toFixed(2)} base</p>

        <div className="add-modal__section">
          <label>Size</label>
          <div className="add-modal__sizes">
            {(menuItem.size_options || ["12oz", "16oz"]).map((s) => (
              <button
                key={s}
                className={`add-modal__size-btn ${size === s ? "active" : ""}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {addons.length > 0 && (
          <div className="add-modal__section">
            <label>Add-ons</label>
            <div className="add-modal__addons">
              {addons.map((a) => {
                const selected = selectedAddons.some((x) => x.addon_id === a.id);
                return (
                  <label key={a.id} className="add-modal__addon">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAddon(a)}
                    />
                    <span>{a.name}</span>
                    <span className="add-modal__addon-price">+${a.price.toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="add-modal__section">
          <label htmlFor="instructions">Special instructions</label>
          <input
            id="instructions"
            type="text"
            placeholder="e.g. extra hot, no ice"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="add-modal__input"
          />
        </div>

        <div className="add-modal__section">
          <label>Quantity</label>
          <div className="add-modal__qty">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
        </div>

        <div className="add-modal__footer">
          <span className="add-modal__total">${itemTotal.toFixed(2)}</span>
          <button className="add-modal__add-btn" onClick={handleAdd}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
