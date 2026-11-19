import { useState, useEffect, useRef } from 'react';
import { createSocketConnection } from '../api/socket';
import api from '../api/axios';

/**
 * 📲 Grandé Muthuram Multiplex — Paytm Instant Free UPI Payment Modal
 *
 * 1. Shows Dynamic UPI QR code with exact amount & token
 * 2. Mobile one-tap intent buttons (Paytm, GPay, PhonePe)
 * 3. Listens for Paytm Webhook events via WebSockets (redirects in milliseconds!)
 * 4. Fallback polling every 1.2s to ensure 100% reliability
 */
export default function PaytmUpiModal({ paytmData, onSuccess, onClose }) {
  const [verifying, setVerifying] = useState(false);
  const [statusText, setStatusText] = useState('Waiting for payment confirmation...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const socketRef = useRef(null);
  const pollTimerRef = useRef(null);

  const orderId = paytmData?.orderId;
  const token = paytmData?.token || 'GMM';
  const amount = paytmData?.amount || 0;
  const qrImage = paytmData?.qrCodeImage;
  const upiIntent = paytmData?.upiIntentUri;
  const vpa = paytmData?.merchantVpa || '7092466027@paytm';

  const triggerPaymentDone = () => {
    setIsSuccess(true);
    setStatusText('✅ Payment Credited to Bank! Redirecting...');
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    setTimeout(() => {
      onSuccess(orderId);
    }, 800);
  };

  useEffect(() => {
    if (!orderId) return;

    // 1. Listen for real-time WebSocket payment events (under 200ms)
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.on(`payment-completed-${orderId}`, () => {
      console.log('⚡ [Socket] Instant Paytm payment verified for order:', orderId);
      triggerPaymentDone();
    });

    socket.on(`payment-completed-${token}`, () => {
      console.log('⚡ [Socket] Instant Paytm payment verified for token:', token);
      triggerPaymentDone();
    });

    // 2. Fallback polling every 1200ms
    pollTimerRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/payment/status/${orderId}`);
        if (data.paid || data.paymentStatus === 'paid' || data.status === 'confirmed') {
          triggerPaymentDone();
        }
      } catch (err) {
        // Silently retry
      }
    }, 1200);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [orderId, token]);

  // Test simulation helper
  const handleSimulateCredit = async () => {
    setSimulating(true);
    try {
      await api.post(`/api/payment/paytm-simulate/${orderId}`);
      triggerPaymentDone();
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'linear-gradient(175deg, #181d2a 0%, #0d1017 100%)',
          border: '1.5px solid rgba(0, 186, 242, 0.55)', // Paytm Blue accent
          borderRadius: '24px',
          padding: '1.75rem 1.5rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 186, 242, 0.25)',
          color: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'fadeInUp 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📲</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.1em', color: '#00baf2', textTransform: 'uppercase' }}>
            PAYTM 0% FEE INSTANT UPI
          </span>
          <span style={{ fontSize: '0.62rem', background: 'rgba(0, 186, 242, 0.18)', border: '1px solid rgba(0, 186, 242, 0.6)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em' }}>
            SANDBOX TEST
          </span>
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>
          ₹{amount}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
          Order Token: <strong style={{ color: '#fae4a8' }}>#{token}</strong>
        </div>

        {/* Dynamic QR Code Box */}
        <div
          style={{
            margin: '1.15rem 0 0.85rem',
            background: '#ffffff',
            padding: '0.75rem',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {qrImage ? (
            <img
              src={qrImage}
              alt="Paytm Dynamic UPI QR"
              style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              Generating QR...
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#0f172a', fontWeight: 800, marginTop: '0.45rem', letterSpacing: '0.04em' }}>
            SCAN WITH PAYTM / GPAY / PHONEPE
          </div>
        </div>

        {/* Merchant VPA info */}
        <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.9rem', fontFamily: 'monospace' }}>
          UPI ID: <strong style={{ color: '#38bdf8' }}>{vpa}</strong>
        </div>

        {/* Mobile Deep Link Intent Button (One-tap payment on phone) */}
        {upiIntent && (
          <a
            href={upiIntent}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #00baf2, #0082c8)',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 15px rgba(0, 186, 242, 0.4)',
              marginBottom: '0.75rem',
            }}
          >
            <span>📱</span>
            <span>Tap to Pay on Paytm / GPay / PhonePe</span>
          </a>
        )}

        {/* Real-time Status Indicator */}
        <div
          style={{
            width: '100%',
            background: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: isSuccess ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '0.55rem 0.85rem',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: isSuccess ? '#86efac' : '#fde047',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            animation: isSuccess ? 'none' : 'pulse 1.8s infinite',
          }}
        >
          <span>{isSuccess ? '✓' : '⏳'}</span>
          <span>{statusText}</span>
        </div>

        {/* Simulation / Testing button */}
        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem', width: '100%' }}>
          <button
            type="button"
            onClick={handleSimulateCredit}
            disabled={simulating || isSuccess}
            style={{
              flex: 1,
              padding: '0.55rem',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '8px',
              color: '#fef08a',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {simulating ? 'Processing...' : '⚡ Test Instant Credit (0s)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 0.85rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
