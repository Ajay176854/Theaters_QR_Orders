import { useCart } from '../context/CartContext';
import '../styles/CartItem.css';

export default function CartItem({ item }) {
  const { updateQty, removeItem } = useCart();

  const handleIncrement = () => updateQty(item._id, item.quantity + 1);
  const handleDecrement = () => updateQty(item._id, item.quantity - 1);
  const handleRemove = () => removeItem(item._id);

  return (
    <div className="cart-item">
      <div className="cart-item__left">
        <span className={`cart-item__veg-badge ${item.isVeg !== false ? 'veg' : 'nonveg'}`}>
          <span className="cart-item__dot"></span>
        </span>
        <div className="cart-item__info">
          <h4 className="cart-item__name">{item.name}</h4>
          <p className="cart-item__unit-price">₹{item.price} each</p>
        </div>
      </div>

      <div className="cart-item__right">
        <div className="cart-item__qty-control">
          <button
            className="cart-item__qty-btn"
            onClick={handleDecrement}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="cart-item__qty-value">{item.quantity}</span>
          <button
            className="cart-item__qty-btn"
            onClick={handleIncrement}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <p className="cart-item__total">₹{item.price * item.quantity}</p>
        <button
          className="cart-item__remove"
          onClick={handleRemove}
          aria-label={`Remove ${item.name}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
