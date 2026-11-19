import { useState } from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function CounterOrderCard({ order, isNew, onStatusChange, onEscalate }) {
  const [updating, setUpdating] = useState(false);
  const [escalating, setEscalating] = useState(false);

  const rawToken = order.orderId || order.shortId || (order._id && order._id.length === 24 ? order._id.slice(-6).toUpperCase() : order._id) || '';
  const displayId = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;

  const screen = order.screen || order.screenNumber || 1;
  const seat = order.seat || order.seatNumber || 'A1';
  const status = order.status || 'confirmed';
  const items = order.items || [];
  const total = order.total || order.totalAmount || 0;

  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const diffMin = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  const isOverdue = (status === 'confirmed' || status === 'preparing') && (diffMin >= 5 || order.isEscalated);

  const nextStatusMap = {
    confirmed: 'ready',
    preparing: 'ready',
    ready: 'delivered',
  };

  const actionLabels = {
    confirmed: 'Mark as Ready',
    preparing: 'Mark as Ready',
    ready: 'Complete Delivery',
  };

  const displayStatusLabel = {
    confirmed: 'In Kitchen Prep',
    preparing: 'In Kitchen Prep',
    ready: 'Ready for Seat',
    delivered: 'Delivered',
  };

  const statusColors = {
    confirmed: { border: isOverdue ? '#ef4444' : '#f59e0b', bg: isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)', text: isOverdue ? '#fca5a5' : '#fde68a' },
    preparing: { border: isOverdue ? '#ef4444' : '#f59e0b', bg: isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)', text: isOverdue ? '#fca5a5' : '#fde68a' },
    ready: { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', text: '#86efac' },
    delivered: { border: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', text: '#cbd5e1' },
  };

  const currentTheme = statusColors[status] || statusColors.confirmed;

  const handleAdvanceStatus = async (targetStatus) => {
    const next = targetStatus || nextStatusMap[status];
    if (!next) return;
    setUpdating(true);
    try {
      await onStatusChange(order._id, next);
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerEscalation = async () => {
    if (!onEscalate) return;
    setEscalating(true);
    try {
      await onEscalate(order._id || order.orderId);
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div
      className={`counter-card ${isNew ? 'counter-card--new' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${currentTheme.border}`,
        borderRadius: 'var(--radius)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
            {displayId}
          </span>
          <div style={{ fontSize: '0.72rem', color: isOverdue ? '#fca5a5' : 'var(--text-muted)', marginTop: '0.15rem', fontWeight: isOverdue ? 700 : 400 }}>
            {timeAgo(order.createdAt)} {isOverdue ? '⚠️ Overdue' : ''}
          </div>
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-xs)',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          {displayStatusLabel[status] || status}
        </span>
      </div>

      {/* 🚨 Overdue Escalation Badge */}
      {isOverdue && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.45rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fca5a5', fontSize: '0.74rem', fontWeight: 800 }}>
            <span>🚨</span>
            <span>UNPICKED &gt;5 MINS · ADMIN ESCALATED</span>
          </div>
          <a
            href="tel:+917092466027"
            style={{
              color: '#fef08a',
              textDecoration: 'none',
              fontSize: '0.74rem',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'rgba(0,0,0,0.3)',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              border: '1px solid rgba(254, 240, 138, 0.4)',
            }}
          >
            📞 Call Admin
          </a>
        </div>
      )}

      {/* Seat & Screen Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-strong)',
          padding: '0.55rem 0.85rem',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.82rem',
          fontWeight: 800,
          color: 'var(--gold)',
          letterSpacing: '0.04em',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>DELIVERY:</span>
          <span>SCREEN {screen} · SEAT {seat}</span>
        </div>
      </div>

      {/* Guest Name & Phone Details */}
      {(order.customerName || order.name || order.customerPhone || order.phone) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8rem',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              CUSTOMER:
            </span>
            <span style={{ fontWeight: 800, color: '#fff' }}>
              {order.customerName || order.name || 'Name not recorded'}
            </span>
          </div>
          {(order.customerPhone || order.phone) && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              📞 {order.customerPhone || order.phone}
            </span>
          )}
        </div>
      )}

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: '#e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>
                {item.quantity}×
              </span>
              <span>{item.name}</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              ₹{(item.price || 0) * (item.quantity || 1)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer & Action Section */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: 'auto',
        }}
      >
        {/* Row 1: Total & Escalation Test */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paid Total
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
              ₹{total}
            </div>
          </div>

          {status !== 'ready' && status !== 'delivered' && (
            <button
              onClick={handleTriggerEscalation}
              disabled={escalating}
              title="Test the 5-minute admin call-forward escalation alert immediately"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>⚡</span>
              <span>{escalating ? 'Calling...' : 'Test Escalation'}</span>
            </button>
          )}
        </div>

        {/* Row 2: Status Action Buttons (Aligned, Equal Height & Contained) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: status !== 'ready' && status !== 'delivered' ? '1fr 1.6fr' : '1fr',
            gap: '0.55rem',
            width: '100%',
          }}
        >
          {status !== 'ready' && status !== 'delivered' && (
            <button
              onClick={() => handleAdvanceStatus('delivered')}
              disabled={updating}
              title="Skip directly to delivered"
              style={{
                height: '40px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#94a3b8',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-fast)',
              }}
            >
              Quick Deliver
            </button>
          )}

          {nextStatusMap[status] && (
            <button
              onClick={() => handleAdvanceStatus()}
              disabled={updating}
              style={{
                height: '40px',
                background: status === 'ready'
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'var(--btn-gold)',
                color: status === 'ready' ? '#fff' : '#0b0907',
                border: status === 'ready' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 235, 150, 0.5)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.8rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                boxShadow: status === 'ready'
                  ? '0 2px 10px rgba(22, 163, 74, 0.4)'
                  : '0 2px 12px rgba(245, 158, 11, 0.45)',
                transition: 'var(--transition-fast)',
              }}
            >
              {updating ? 'Updating...' : actionLabels[status]}
            </button>
          )}

          {status === 'delivered' && (
            <div
              style={{
                height: '40px',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#86efac',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-xs)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✓ Delivered to Seat
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
