import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';
import '../styles/CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState(sessionStorage.getItem('customerName') || 'Ajai');
  const [customerPhone, setCustomerPhone] = useState(sessionStorage.getItem('customerPhone') || '7092466027');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const theaterId = sessionStorage.getItem('theaterId') || 'demo-theater';
  const seat = sessionStorage.getItem('seat') || 'A1';
  const screen = sessionStorage.getItem('screen') || '1';

  const handleBackToMenu = () => {
    navigate(`/${theaterId}/menu`);
  };

  const handleCheckout = () => {
    const trimmed = customerName.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError('Please enter your full name — Customer name is mandatory for in-seat delivery.');
      document.getElementById('cartCustomerName')?.focus();
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number for order notifications.');
      document.getElementById('cartCustomerPhone')?.focus();
      return;
    }
    sessionStorage.setItem('customerName', trimmed);
    sessionStorage.setItem('customerPhone', cleanPhone);
    navigate('/payment');
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from your order?')) {
      clearCart();
    }
  };

  return (
    <div className="cart-page">
      <Header />

      <div className="cart-page__content">
        <div className="cart-page__header-row">
          <h2 className="cart-page__title">Your Concession Order</h2>
          {items.length > 0 && (
            <button className="cart-page__clear-btn" onClick={handleClearCart}>
              Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="cart-page__empty">
            <div className="cart-page__empty-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3>Your order is empty</h3>
            <p>Add popcorn, refreshments, or combos to enjoy during the show.</p>
            <button className="cart-page__browse-btn" onClick={handleBackToMenu}>
              Explore Menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-page__items">
              {items.map((item) => (
                <CartItem key={item._id} item={item} />
              ))}
            </div>

            {/* Order summary */}
            <div className="cart-page__summary">
              <h3 className="cart-page__summary-title">Order Breakdown</h3>

              <div className="cart-page__summary-row">
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="cart-page__summary-row">
                <span>Seat Delivery Fee</span>
                <span className="cart-page__free">COMPLIMENTARY</span>
              </div>
              <div className="cart-page__summary-row">
                <span>Taxes &amp; GST</span>
                <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.82rem' }}>INCLUDED IN PRICE</span>
              </div>
              <div className="cart-page__summary-divider" />
              <div className="cart-page__summary-row total">
                <span>Total Payable</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            {/* Seat info */}
            <div className="cart-page__delivery-info">
              <div className="cart-page__delivery-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="cart-page__delivery-label">Delivering Direct To Seat</p>
                <p className="cart-page__delivery-seat">
                  AUDITORIUM SCREEN {screen} · SEAT {seat}
                </p>
              </div>
            </div>

            {/* Mandatory Customer Identification (Name & Mobile) */}
            <div
              style={{
                background: 'linear-gradient(165deg, rgba(23, 27, 38, 0.96) 0%, rgba(14, 16, 24, 0.98) 100%)',
                border: (nameError || phoneError) ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                marginBottom: '1.35rem',
                boxShadow: (nameError || phoneError) ? '0 0 18px rgba(239, 68, 68, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.7)',
                animation: 'fadeInUp 0.48s ease both',
              }}
            >
              {/* Customer Name */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label htmlFor="cartCustomerName" style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fae4a8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Customer Name <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 900,
                      color: '#fb7185',
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.28)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Mandatory
                  </span>
                </div>
                <input
                  id="cartCustomerName"
                  type="text"
                  placeholder="Enter your full name (e.g. Rahul Sharma)"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    sessionStorage.setItem('customerName', e.target.value);
                    if (nameError) setNameError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: '#0b0d14',
                    border: nameError ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-xs)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f3cf7a';
                    e.target.style.boxShadow = '0 0 14px rgba(243, 207, 122, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = nameError ? '#ef4444' : 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {nameError && (
                  <div style={{ color: '#fca5a5', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.45rem' }}>
                    ⚠️ {nameError}
                  </div>
                )}
                <p style={{ fontSize: '0.74rem', color: '#8492a6', marginTop: '0.45rem', marginBottom: '1.15rem', lineHeight: 1.35 }}>
                  Required: Concession delivery staff will verify your name at Screen {screen} · Seat {seat}.
                </p>
              </div>

              {/* Mobile Number for SMS & WhatsApp Updates */}
              <div style={{ paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label htmlFor="cartCustomerPhone" style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fae4a8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Mobile Number <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 900,
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    SMS &amp; WhatsApp
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#fae4a8',
                      pointerEvents: 'none',
                    }}
                  >
                    +91
                  </span>
                  <input
                    id="cartCustomerPhone"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setCustomerPhone(v);
                      sessionStorage.setItem('customerPhone', v);
                      if (phoneError) setPhoneError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 3.4rem',
                      background: '#0b0d14',
                      border: phoneError ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-xs)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#f3cf7a';
                      e.target.style.boxShadow = '0 0 14px rgba(243, 207, 122, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = phoneError ? '#ef4444' : 'rgba(255, 255, 255, 0.12)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {phoneError && (
                  <div style={{ color: '#fca5a5', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.45rem' }}>
                    ⚠️ {phoneError}
                  </div>
                )}
                <p style={{ fontSize: '0.74rem', color: '#8492a6', marginTop: '0.45rem', margin: 0, lineHeight: 1.35 }}>
                  You will receive instant SMS &amp; WhatsApp order notifications as your snacks are prepared.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="cart-page__actions">
              <button className="cart-page__add-more-btn" onClick={handleBackToMenu}>
                + Add Additional Items
              </button>
              <button
                className="cart-page__checkout-btn"
                onClick={handleCheckout}
                disabled={!customerName.trim() || customerPhone.replace(/\D/g, '').length < 10}
                style={{
                  opacity: (!customerName.trim() || customerPhone.replace(/\D/g, '').length < 10) ? 0.6 : 1,
                  cursor: (!customerName.trim() || customerPhone.replace(/\D/g, '').length < 10) ? 'not-allowed' : 'pointer',
                }}
              >
                <span>Proceed to Payment</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              {(!customerName.trim() || customerPhone.replace(/\D/g, '').length < 10) && (
                <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#f87171', fontWeight: 800 }}>
                  ⚠️ Enter your Customer Name &amp; 10-digit Mobile Number above to proceed to payment
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
