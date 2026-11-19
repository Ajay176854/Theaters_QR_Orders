import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSocketConnection } from '../api/socket';
import api from '../api/axios';
import OrderStatus from '../components/OrderStatus';
import Loader from '../components/Loader';
import '../styles/ConfirmationPage.css';

export default function ConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [smsNotification, setSmsNotification] = useState(null);
  const [latestWaAlert, setLatestWaAlert] = useState(null);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);

  const theaterId = sessionStorage.getItem('theaterId') || 'demo-theater';

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/orders/${orderId}`);
        setOrder(data.order || data);
      } catch (err) {
        setError(err.message || 'Could not load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-order', orderId);
    });

    socket.on('order-status-update', (data) => {
      if (!data || !data.status) return;
      setOrder((prev) => {
        if (!prev) return prev;
        const curId = String(prev._id || '').toLowerCase();
        const curOrderToken = String(prev.orderId || '').toLowerCase();
        const curShort = String(prev.shortId || '').toLowerCase();
        const incomingId = String(data.orderId || '').toLowerCase();
        const incomingShort = String(data.shortId || '').toLowerCase();
        const routeId = String(orderId || '').toLowerCase();

        const isMatch =
          incomingId === routeId ||
          incomingShort === routeId ||
          (curId && incomingId === curId) ||
          (curOrderToken && incomingShort === curOrderToken) ||
          (curOrderToken && incomingId === curOrderToken) ||
          (curId && incomingShort === curId) ||
          (curShort && incomingShort === curShort);

        if (isMatch) {
          return { ...prev, status: data.status };
        }
        return prev;
      });
    });

    socket.on('customer-sms-notification', (data) => {
      setSmsNotification(data);
      setTimeout(() => setSmsNotification(null), 8500);
    });

    socket.on('customer-whatsapp-status', (data) => {
      setLatestWaAlert(data);
      setTimeout(() => setLatestWaAlert(null), 10000);
    });

    // 2.5s rapid polling fallback ensures real-time sync across any network drops
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/orders/${orderId}`);
        const updatedOrder = data.order || data;
        setOrder((prev) => {
          if (!prev || prev.status !== updatedOrder.status) {
            return updatedOrder;
          }
          return prev;
        });
      } catch {
        // Silently ignore polling errors
      }
    }, 2500);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [orderId]);

  const handleNewOrder = () => {
    navigate(`/${theaterId}/menu`);
  };

  if (loading) return <Loader text="Verifying order ticket..." />;

  if (error) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-page__error">
          <div className="confirmation-page__error-badge">GMM</div>
          <h2>Notice</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry Status Check</button>
        </div>
      </div>
    );
  }

  const status = order?.status || 'confirmed';
  const orderItems = order?.items || [];
  const total = order?.total || order?.totalAmount || 0;
  const screen = order?.screen || order?.screenNumber || sessionStorage.getItem('screen') || '1';
  const seat = order?.seat || order?.seatNumber || sessionStorage.getItem('seat') || 'A1';
  const customerName = order?.customerName || sessionStorage.getItem('customerName') || 'Valued Guest';
  const customerPhone = order?.customerPhone || order?.phone || sessionStorage.getItem('customerPhone') || '';
  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const rawToken = order?.orderId || order?.shortId || (orderId && orderId.length === 24 ? orderId.slice(-6).toUpperCase() : orderId) || 'ORDER';
  const displayToken = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;
  const trackingUrl = typeof window !== 'undefined' ? window.location.href : `http://localhost:5173/confirmation/${orderId}`;

  const statusInfo = {
    confirmed: {
      badge: 'ORDER CONFIRMED',
      title: 'Order Confirmed',
      subtitle: 'Transmitted to Concession Kitchen · Preparing for Seat Delivery',
      color: '#f59e0b',
      iconType: 'check',
    },
    preparing: {
      badge: 'IN KITCHEN PREP',
      title: 'Preparing Your Snacks',
      subtitle: `Concession kitchen is preparing your order for Screen ${screen} · Seat ${seat}`,
      color: '#f59e0b',
      iconType: 'prep',
    },
    ready: {
      badge: 'READY FOR SEAT DELIVERY',
      title: 'Order Ready for Seat!',
      subtitle: `Concession crew is bringing your refreshments to Screen ${screen} · Seat ${seat}`,
      color: '#22c55e',
      iconType: 'ready',
    },
    delivered: {
      badge: 'DELIVERED TO SEAT',
      title: 'Order Delivered to Seat!',
      subtitle: `Delivered to Screen ${screen} · Seat ${seat}. Enjoy your movie at Grandé Muthuram Multiplex!`,
      color: '#10b981',
      iconType: 'delivered',
    },
    cancelled: {
      badge: 'ORDER CANCELLED',
      title: 'Order Cancelled',
      subtitle: 'This order was cancelled. Please speak with the concession crew.',
      color: '#ef4444',
      iconType: 'cancelled',
    },
  };

  const currentStatusInfo = statusInfo[status?.toLowerCase()] || statusInfo.confirmed;

  const itemsFormatted = (orderItems.length > 0)
    ? orderItems.map((item) => `• ${item.quantity || 1}x ${item.name || 'Concession Item'} — ₹${(item.price || 0) * (item.quantity || 1)}`).join('\n')
    : '• Concession Refreshments';

  const rawReceipt =
    `🎬 *GRANDÉ MUTHURAM MULTIPLEX — CONCESSION DIGITAL BILL*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Guest:* ${customerName}\n` +
    `🎟️ *Token ID:* ${displayToken}\n` +
    `📍 *Seat:* Screen ${screen} · Seat ${seat}\n` +
    `🕒 *Time:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n` +
    `📋 *ORDER SUMMARY:*\n` +
    `${itemsFormatted}\n\n` +
    `💰 *Total Paid:* ₹${total} (Incl. Taxes)\n` +
    `⚡ *Status:* ${status.toUpperCase()}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *Live Order Tracker:* ${trackingUrl}\n\n` +
    `✨ Delivered directly to your seat during showtime. Enjoy your movie!`;

  const waUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(rawReceipt)}`
    : `https://wa.me/?text=${encodeURIComponent(rawReceipt)}`;

  const handleCopyReceipt = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawReceipt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="confirmation-page">
      {/* Live Simulated WhatsApp Alert Banner */}
      {latestWaAlert && (
        <div style={{
          position: 'fixed',
          top: smsNotification ? '5.5rem' : '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '430px',
          background: 'rgba(15, 23, 20, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #25d366',
          borderRadius: '14px',
          padding: '0.85rem 1rem',
          boxShadow: '0 14px 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(37, 211, 102, 0.3)',
          zIndex: 9999,
          animation: 'fadeInUp 0.35s ease both',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(37, 211, 102, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            flexShrink: 0,
            border: '1px solid rgba(37, 211, 102, 0.5)',
          }}>
            💬
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <strong style={{ fontSize: '0.78rem', color: '#25d366', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                WHATSAPP · STATUS: {latestWaAlert.status?.toUpperCase()}
              </strong>
              <span style={{ fontSize: '0.68rem', color: '#8492a6' }}>{latestWaAlert.timestamp || 'now'}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#f1f5f9', lineHeight: 1.35, margin: '0 0 0.5rem' }}>
              Automatic update dispatched to +91 {latestWaAlert.phone}
            </p>
            <a
              href={latestWaAlert.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#ffffff',
                background: '#25d366',
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              <span>View Update in WhatsApp</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}

      {/* Live Simulated SMS Notification Banner */}
      {smsNotification && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '430px',
          background: 'rgba(23, 27, 38, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(243, 207, 122, 0.5)',
          borderRadius: '14px',
          padding: '0.85rem 1rem',
          boxShadow: '0 14px 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(243, 207, 122, 0.25)',
          zIndex: 9999,
          animation: 'fadeInUp 0.35s ease both',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(243, 207, 122, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            flexShrink: 0,
            border: '1px solid rgba(243, 207, 122, 0.35)',
          }}>
            💬
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <strong style={{ fontSize: '0.78rem', color: '#fae4a8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                MESSAGES · GMM-CINEMA
              </strong>
              <span style={{ fontSize: '0.68rem', color: '#8492a6' }}>{smsNotification.timestamp || 'now'}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#f1f5f9', lineHeight: 1.35, margin: 0 }}>
              {smsNotification.message}
            </p>
          </div>
        </div>
      )}

      <div className="confirmation-page__content">
        {/* Dynamic Status Header */}
        <div className="confirmation-page__success-header">
          <div
            className="confirmation-page__checkmark"
            style={{
              borderColor: currentStatusInfo.color,
              boxShadow: `0 0 26px ${currentStatusInfo.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.4s ease',
            }}
          >
            {currentStatusInfo.iconType === 'ready' ? (
              <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>🍿</span>
            ) : currentStatusInfo.iconType === 'delivered' ? (
              <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>🎉</span>
            ) : currentStatusInfo.iconType === 'prep' ? (
              <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>👨‍🍳</span>
            ) : currentStatusInfo.iconType === 'cancelled' ? (
              <span style={{ fontSize: '1.9rem', color: '#ef4444', lineHeight: 1 }}>✕</span>
            ) : (
              <svg viewBox="0 0 52 52">
                <circle className="confirmation-page__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="confirmation-page__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            )}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            margin: '0.75rem auto 0.4rem',
            padding: '0.3rem 0.95rem',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            background: `${currentStatusInfo.color}15`,
            border: `1.5px solid ${currentStatusInfo.color}60`,
            color: currentStatusInfo.color,
            textTransform: 'uppercase',
            boxShadow: `0 0 16px ${currentStatusInfo.color}25`,
            animation: 'fadeInUp 0.3s ease both',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: currentStatusInfo.color, boxShadow: `0 0 8px ${currentStatusInfo.color}` }} />
            <span>{currentStatusInfo.badge}</span>
          </div>

          <h1 className="confirmation-page__title" style={{ marginTop: '0.35rem' }}>
            {currentStatusInfo.title}
          </h1>
          <p className="confirmation-page__subtitle">
            {currentStatusInfo.subtitle}
          </p>
        </div>

        {/* Order ID card */}
        <div className="confirmation-page__order-id-card">
          <span className="confirmation-page__order-label">Digital Token ID</span>
          <span className="confirmation-page__order-value">
            {displayToken}
          </span>
        </div>

        {/* Status tracker */}
        <div className="confirmation-page__status-section">
          <h3>Live Progress</h3>
          <OrderStatus status={status} />
        </div>

        {/* Items summary */}
        <div className="confirmation-page__items-card">
          <h3>Concession Items</h3>
          <div className="confirmation-page__items-list">
            {orderItems.map((item, idx) => (
              <div key={idx} className="confirmation-page__item-row">
                <span className="confirmation-page__item-name">
                  {item.name || 'Concession Item'} × {item.quantity}
                </span>
                <span className="confirmation-page__item-price">
                  ₹{(item.price || 0) * (item.quantity || 1)}
                </span>
              </div>
            ))}
          </div>
          <div className="confirmation-page__total-divider" />
          <div className="confirmation-page__total-row">
            <span>Total Paid (incl. Taxes)</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="confirmation-page__delivery">
          <div className="confirmation-page__delivery-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <p className="confirmation-page__delivery-label">
              Auditorium Seat Destination
            </p>
            <p className="confirmation-page__delivery-seat">
              Screen {screen} · Seat {seat}
            </p>
            {(order?.customerName || sessionStorage.getItem('customerName')) && (
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Guest: <strong style={{ color: '#fff' }}>{order?.customerName || sessionStorage.getItem('customerName')}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Mobile SMS Updates & WhatsApp Digital Bill */}
        <div
          style={{
            background: 'linear-gradient(165deg, rgba(23, 27, 38, 0.96) 0%, rgba(14, 16, 24, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '3px solid #10b981',
            borderRadius: 'var(--radius)',
            padding: '1.15rem 1.25rem',
            marginBottom: '1.35rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            animation: 'fadeInUp 0.45s ease both',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#fae4a8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>📱</span> Mobile Order Updates
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 900,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.18rem 0.55rem',
                borderRadius: '12px',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              ACTIVE
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0 0 0.85rem', lineHeight: 1.4 }}>
            {cleanPhone ? (
              <>SMS alerts dispatched to <strong style={{ color: '#ffffff' }}>+91 {cleanPhone}</strong> as the kitchen prepares your items.</>
            ) : (
              <>Live SMS updates linked to your order token. You will receive notifications at each stage.</>
            )}
          </p>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                padding: '0.8rem 1rem',
                background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 800,
                textDecoration: 'none',
                borderRadius: 'var(--radius-xs)',
                letterSpacing: '0.03em',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <span>💬</span>
              <span>Open in WhatsApp</span>
            </a>

            <button
              onClick={handleCopyReceipt}
              type="button"
              style={{
                padding: '0.8rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: copied ? '#34d399' : '#e2e8f0',
                fontSize: '0.78rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="confirmation-page__actions">
          <button className="confirmation-page__new-order-btn" onClick={handleNewOrder}>
            Order Additional Concessions
          </button>
        </div>

        <p className="confirmation-page__help-text">
          Grandé Muthuram Multiplex, Tirunelveli · Present this digital token to concession crew if requested.
        </p>
      </div>
    </div>
  );
}
