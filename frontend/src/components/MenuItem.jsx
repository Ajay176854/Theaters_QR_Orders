import { useState } from 'react';
import { useCart } from '../context/CartContext';
import '../styles/MenuItem.css';

export default function MenuItem({ item }) {
  const { items, addItem, updateQty } = useCart();
  const [imgError, setImgError] = useState(false);

  const cartItem = items.find((ci) => ci._id === item._id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isVeg = item.isVeg !== false;

  const handleAdd = () => addItem(item);
  const handleIncrement = () => updateQty(item._id, quantity + 1);
  const handleDecrement = () => updateQty(item._id, quantity - 1);

  return (
    <div className="menu-item">
      <div className="menu-item__image">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="menu-item__placeholder">
            <span className="menu-item__placeholder-tag">GMM</span>
          </div>
        )}
        <span className={`menu-item__diet-badge ${isVeg ? 'veg' : 'nonveg'}`} title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}>
          <span className="menu-item__diet-symbol"></span>
        </span>
      </div>

      <div className="menu-item__body">
        <div className="menu-item__details">
          <h3 className="menu-item__name">{item.name}</h3>
          {item.description && (
            <p className="menu-item__desc">{item.description}</p>
          )}
          <p className="menu-item__price">₹{item.price}</p>
        </div>

        <div className="menu-item__actions">
          {quantity === 0 ? (
            <button className="menu-item__add-btn" onClick={handleAdd}>
              ADD
            </button>
          ) : (
            <div className="menu-item__qty-control">
              <button
                className="menu-item__qty-btn"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="menu-item__qty-value">{quantity}</span>
              <button
                className="menu-item__qty-btn"
                onClick={handleIncrement}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
