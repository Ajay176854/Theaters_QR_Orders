import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import Loader from '../components/Loader';
import { useCart } from '../context/CartContext';
import '../styles/PaymentPage.css';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState(sessionStorage.getItem('customerName') || 'Ajai');
  const [phone, setPhone] = useState(sessionStorage.getItem('customerPhone') || '7092466027');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('ready'); // 'ready' | 'processing' | 'error'

  const theaterId = sessionStorage.getItem('theaterId') || 'demo-theater';
  const [screen, setScreen] = useState(sessionStorage.getItem('screen') || '1');
  const [seat, setSeat] = useState(sessionStorage.getItem('seat') || 'A1');

  // "Please Ensure Your Seat" Modal States
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [editScreen, setEditScreen] = useState(screen);
  const [editSeat, setEditSeat] = useState(seat);
  const [seatModalError, setSeatModalError] = useState('');

  // Test mode flag - true skips Razorpay gateway modal for instant order confirmation while testing
  const SKIP_RAZORPAY = true;

  const gst = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + gst;

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate(`/${theaterId}/menu`);
    }
  }, [items, theaterId, navigate]);

  // Sync session storage if customer updates
  useEffect(() => {
    const storedName = sessionStorage.getItem('customerName');
    const storedPhone = sessionStorage.getItem('customerPhone');
    if (storedName) setCustomerName(storedName);
    if (storedPhone) setPhone(storedPhone);
  }, []);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleOpenSeatModal = () => {
    if (!customerName || !customerName.trim()) {
      navigate('/cart');
      return;
    }
    if (!phone || phone.length < 10) {
      navigate('/cart');
      return;
    }
    setEditScreen(screen);
    setEditSeat(seat);
    setSeatModalError('');
    setShowSeatModal(true);
  };

  const handleConfirmSeatAndProceed = async () => {
    const finalSeat = (editSeat || '').trim().toUpperCase();
    const finalScreen = (editScreen || '').trim() || '1';

    if (!finalSeat || finalSeat.length < 2) {
      setSeatModalError('Please enter a valid Seat Number (e.g. A1, B12).');
      return;
    }

    sessionStorage.setItem('seat', finalSeat);
    sessionStorage.setItem('screen', finalScreen);
    setSeat(finalSeat);
    setScreen(finalScreen);
    setShowSeatModal(false);

    await executePayment(finalScreen, finalSeat);
  };

  const executePayment = async (targetScreen, targetSeat) => {
    setError('');
    setLoading(true);
    setStep('processing');

    try {
      const finalName = customerName.trim() || 'Valued Guest';

      // Step 1: Create order in backend
      const orderPayload = {
        theaterId,
        screenNumber: parseInt(targetScreen, 10) || 1,
        seatNumber: targetSeat || 'A1',
        screen: parseInt(targetScreen, 10) || 1,
        seat: targetSeat || 'A1',
        customerName: finalName,
        name: finalName,
        customerPhone: phone,
        phone,
        items: items.map((item) => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: totalPrice,
        gst,
        total: grandTotal,
      };

      const { data: orderData } = await api.post('/api/orders', orderPayload);
      const orderId = orderData.order?._id || orderData.orderId || orderData._id;

      // If skipping Razorpay (testing mode active), immediately complete the mock payment
      if (SKIP_RAZORPAY) {
        await api.post('/api/payment/verify', {
          razorpay_order_id: `order_mock_${Date.now()}`,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_test_signature',
          orderId,
        });

        clearCart();
        navigate(`/confirmation/${orderId}`);
        return;
      }

      // Step 2: Create Razorpay order (for real gateway mode)
      const { data: paymentData } = await api.post('/api/payment/create-order', {
        amount: grandTotal,
        orderId,
      });

      const razorpayOrderId = paymentData.razorpayOrderId || paymentData.id;

      // Step 3: Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || paymentData.keyId || 'rzp_test_Twmqf5XYueUoDD',
        amount: grandTotal * 100, // paise
        currency: 'INR',
        name: 'Grandé Muthuram Multiplex',
        description: `Screen ${targetScreen} · Seat ${targetSeat} Concessions`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await api.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            clearCart();
            navigate(`/confirmation/${orderId}`);
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed');
            setStep('error');
            setLoading(false);
          }
        },
        prefill: {
          name: finalName,
          contact: phone,
        },
        theme: {
          color: '#f59e0b',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStep('ready');
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError(response.error.description || 'Payment failed');
          setStep('error');
          setLoading(false);
        });
        rzp.open();
      } else {
        // Fallback demo mock verification if offline / mock mode
        await api.post('/api/payment/verify', {
          razorpay_order_id: razorpayOrderId || 'mock_order',
          razorpay_payment_id: 'mock_pay_' + Date.now(),
          razorpay_signature: 'mock_signature',
          orderId,
        });
        clearCart();
        navigate(`/confirmation/${orderId}`);
      }
    } catch (err) {
      setError(err.message || 'Unable to initiate payment');
      setStep('error');
      setLoading(false);
    }
  };

  if (step === 'processing' && !error) {
    return <Loader text={SKIP_RAZORPAY ? "Placing test order & notifying staff..." : "Connecting to secure gateway..."} />;
  }

  return (
    <div className="payment-page">
      <Header />

      <div className="payment-page__content">
        <h2 className="payment-page__title">Secure Checkout</h2>

        <div style={{
          background: 'linear-gradient(135deg, rgba(243, 207, 122, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(243, 207, 122, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          color: '#fae4a8',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          animation: 'fadeInUp 0.3s ease both',
        }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <span>
            <strong style={{ color: '#ffffff' }}>Fast-Track Test Mode Active:</strong> Payment gateway is bypassed for instant testing. Clicking Pay immediately confirms and sends your order to the kitchen!
          </span>
        </div>

        {/* Order overview */}
        <div className="payment-page__overview">
          <div className="payment-page__overview-header">
            <span className="payment-page__tag">GRANDÉ MUTHURAM CONCESSIONS</span>
            <h3>Order Summary</h3>
          </div>

          <div className="payment-page__items-list">
            {items.map((item) => (
              <div key={item._id} className="payment-page__item-row">
                <span className="payment-page__item-name">
                  {item.name} × {item.quantity}
                </span>
                <span className="payment-page__item-price">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="payment-page__totals">
            <div className="payment-page__total-row">
              <span>Subtotal</span>
              <span>₹{totalPrice}</span>
            </div>
            <div className="payment-page__total-row">
              <span>GST (5%)</span>
              <span>₹{gst}</span>
            </div>
            <div className="payment-page__total-divider" />
            <div className="payment-page__total-row grand">
              <span>Total Amount</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Delivery Seat Info with Edit Button */}
        <div
          className="payment-page__delivery"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>AUDITORIUM SCREEN {screen} · SEAT {seat}</span>
          </div>
          <button
            type="button"
            onClick={handleOpenSeatModal}
            style={{
              background: 'rgba(243, 207, 122, 0.15)',
              border: '1px solid rgba(243, 207, 122, 0.45)',
              color: '#ffd84d',
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.15s ease',
            }}
          >
            Change Seat ✏️
          </button>
        </div>

        {/* Verified Patron Summary Card (Collected on previous page) */}
        <div
          style={{
            background: 'linear-gradient(165deg, rgba(23, 27, 38, 0.96) 0%, rgba(14, 16, 24, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius)',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            animation: 'fadeInUp 0.45s ease both',
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fae4a8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Delivering To Patron
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', marginTop: '0.2rem' }}>
              {customerName}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#34d399' }}>●</span>
              <span>+91 {phone} (SMS &amp; WhatsApp Notifications Active)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cart')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Edit in Cart
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="payment-page__error">
            <p>{error}</p>
          </div>
        )}

        {/* Proceed to Payment / Trigger Seat Confirmation Modal */}
        <button
          className="payment-page__pay-btn"
          onClick={handleOpenSeatModal}
          disabled={loading || !customerName.trim() || phone.length < 10}
          style={{
            opacity: (!customerName.trim() || phone.length < 10) ? 0.6 : 1,
            cursor: (!customerName.trim() || phone.length < 10) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span className="payment-page__pay-spinner" />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span>{SKIP_RAZORPAY ? `Confirm & Pay ₹${grandTotal} (Test Mode)` : `Pay ₹${grandTotal} via UPI / Card`}</span>
            </>
          )}
        </button>

        {(!customerName.trim() || phone.length < 10) && (
          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#f87171', marginTop: '0.65rem', fontWeight: 800 }}>
            ⚠️ Missing customer details. Please return to cart to enter your name &amp; phone.
          </div>
        )}

        <p className="payment-page__secure-note">
          {SKIP_RAZORPAY ? 'Testing Mode Active · Instant Order Dispatch' : 'Secured 256-bit Encrypted Checkout · Razorpay Certified'}
        </p>

        {/* ── "PLEASE ENSURE YOUR SEAT" POPUP MODAL ── */}
        {showSeatModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setShowSeatModal(false)}
          >
            <div
              style={{
                background: 'linear-gradient(165deg, #181d2a 0%, #0d1017 100%)',
                border: '1.5px solid rgba(243, 207, 122, 0.55)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(243, 207, 122, 0.25)',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '420px',
                padding: '1.85rem 1.6rem',
                color: '#ffffff',
                position: 'relative',
                animation: 'fadeInUp 0.25s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(243, 207, 122, 0.15)',
                  border: '1.5px solid #d4af37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  margin: '0 auto 0.85rem',
                  boxShadow: '0 0 20px rgba(243, 207, 122, 0.4)',
                }}>
                  💺
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.45rem', letterSpacing: '0.03em' }}>
                  Please Ensure Your Seat
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                  Concession runners deliver snacks directly to your seat during showtime. Please verify or update your exact screen and seat number before paying.
                </p>
              </div>

              {/* Editable Fields Card */}
              <div style={{
                background: '#090b10',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.15rem 1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {/* Screen Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#fae4a8', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                      Auditorium Screen
                    </label>
                    <select
                      value={editScreen}
                      onChange={(e) => setEditScreen(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        background: '#151824',
                        border: '1px solid rgba(243, 207, 122, 0.45)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="1">Screen 1</option>
                      <option value="2">Screen 2</option>
                      <option value="3">Screen 3</option>
                      <option value="4">Screen 4</option>
                    </select>
                  </div>

                  {/* Seat Number Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#fae4a8', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                      Seat Number <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. A1, B12"
                      value={editSeat}
                      onChange={(e) => {
                        setEditSeat(e.target.value.toUpperCase());
                        if (seatModalError) setSeatModalError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        background: '#151824',
                        border: seatModalError ? '1.5px solid #ef4444' : '1px solid rgba(243, 207, 122, 0.45)',
                        borderRadius: '8px',
                        color: '#ffd84d',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        outline: 'none',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                  </div>
                </div>

                {seatModalError && (
                  <div style={{ color: '#fca5a5', fontSize: '0.76rem', fontWeight: 700, marginTop: '0.5rem' }}>
                    ⚠️ {seatModalError}
                  </div>
                )}

                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: 'rgba(243, 207, 122, 0.08)', borderRadius: '8px', border: '1px dashed rgba(243, 207, 122, 0.3)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>👤 {customerName}</span>
                    <span style={{ color: '#fae4a8', fontWeight: 900 }}>Total: ₹{grandTotal}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    📞 Dispatched to: +91 {phone}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSeatModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSeatAndProceed}
                  style={{
                    flex: 2,
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #ffd84d 0%, #d4af37 100%)',
                    border: 'none',
                    color: '#0b0907',
                    fontSize: '0.88rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(212, 175, 55, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span>Confirm Seat &amp; Go On</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
