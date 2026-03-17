import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

interface CartProps {
  apiBase: string;
}

export function Cart({ apiBase }: CartProps) {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart cart--empty">
        <div className="cart__empty-icon">☕</div>
        <h1>Your cart is empty</h1>
        <p>Add something delicious from a nearby cafe.</p>
        <Link to="/discover" className="cart__cta">Discover cafes</Link>
      </div>
    );
  }

  const cafeId = items[0]?.cafe_id;
  const cafeName = items[0]?.cafe_name;

  return (
    <div className="cart">
      <header className="cart__header">
        <Link to={`/cafes/${cafeId}`} className="cart__back">← Back to {cafeName}</Link>
        <h1>Your order</h1>
      </header>

      <ul className="cart__list">
        {items.map((item) => (
          <li key={`${item.cafe_coffee_id}-${item.size}-${JSON.stringify(item.addons || [])}-${item.special_instructions || ""}`} className="cart__item">
            <div className="cart__item-info">
              <h3>{item.coffee_name}</h3>
              <p>
                {item.size}
                {item.addons?.length ? ` · ${item.addons.map((a) => a.name).join(", ")}` : ""}
                {item.special_instructions ? ` · "${item.special_instructions}"` : ""}
              </p>
              <p className="cart__item-price">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="cart__item-actions">
              <div className="cart__qty">
                <button onClick={() => updateQuantity(item.cafe_coffee_id, item.size, item.quantity - 1, item.addons, item.special_instructions)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.cafe_coffee_id, item.size, item.quantity + 1, item.addons, item.special_instructions)}>+</button>
              </div>
              <button
                className="cart__remove"
                onClick={() => removeItem(item.cafe_coffee_id, item.size, item.addons, item.special_instructions)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart__footer">
        <div className="cart__total">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <p className="cart__note">Pay at pickup</p>
        <Link to="/checkout" className="cart__checkout">Checkout</Link>
      </div>
    </div>
  );
}
