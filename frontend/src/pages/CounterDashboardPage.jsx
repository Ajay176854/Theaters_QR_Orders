import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSocketConnection } from '../api/socket';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CounterStatsBar from '../components/CounterStatsBar';
import CounterOrderCard from '../components/CounterOrderCard';
import SoundAlert from '../components/SoundAlert';
import Loader from '../components/Loader';
import AdminPhoneCallModal from '../components/AdminPhoneCallModal';
import '../styles/CounterDashboardPage.css';

const ACTIVE_STATUSES = 'confirmed,preparing,ready';

export default function CounterDashboardPage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'confirmed' | 'preparing' | 'ready' | 'history'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, revenue: 0 });
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [escalationAlert, setEscalationAlert] = useState(null);
  const [activeCallData, setActiveCallData] = useState(null);
  const [waConnected, setWaConnected] = useState(false);

  const socketRef = useRef(null);
  const soundRef = useRef(null);

  const theaterId = user?.theaterId || 'demo-theater';

  // Count active unready orders in the kitchen prep queue
  const pendingPrepCount = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'preparing'
  ).length;

  // Ring the alert alarm continuously while active unready orders exist
  // and automatically silence the moment staff clicks "MARK AS READY"
  useEffect(() => {
    if (soundRef.current) {
      if (pendingPrepCount > 0) {
        soundRef.current.startContinuousAlarm();
      } else {
        soundRef.current.stopContinuousAlarm();
      }
    }
  }, [pendingPrepCount]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/orders?status=${ACTIVE_STATUSES}`);
      const list = data.orders || data;
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch live orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/api/orders?status=delivered&limit=30');
      const list = data.orders || data;
      setHistoryOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/reports/summary');
      if (data && data.today) {
        setStats({
          totalOrders: data.today.orderCount || 0,
          pending: (data.statusBreakdown?.confirmed || 0) + (data.statusBreakdown?.preparing || 0),
          revenue: data.today.revenue || 0,
        });
      }
    } catch {
      // Ignore summary report errors safely
    }
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const pendingCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length;
      const rev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setStats((prev) => ({
        totalOrders: Math.max(prev.totalOrders, orders.length),
        pending: pendingCount,
        revenue: Math.max(prev.revenue, rev),
      }));
    }
  }, [orders]);

  useEffect(() => {
    fetchOrders();
    fetchHistory();
    fetchStats();
    api.get('/api/whatsapp/status')
      .then(({ data }) => setWaConnected(Boolean(data?.isConnected)))
      .catch(() => {});
  }, [fetchOrders, fetchHistory, fetchStats]);

  useEffect(() => {
    if (filter === 'history') {
      fetchHistory();
    }
  }, [filter, fetchHistory]);

  useEffect(() => {
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-theater', theaterId);
    });

    socket.on('new-order', (order) => {
      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
      const id = order._id || order.id;
      setNewOrderIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 8000);

      if (soundRef.current) {
        soundRef.current.play();
      }
      fetchStats();
    });

    socket.on('order-status-update', (data) => {
      const targetId = data.orderId || data._id;
      if (data.status === 'delivered' || data.status === 'cancelled') {
        // Remove ONLY the delivered order from active list
        setOrders((prev) =>
          prev.filter((o) => o._id !== targetId && o.orderId !== targetId && o.shortId !== targetId)
        );
      } else {
        // Update ONLY the specific order status
        setOrders((prev) =>
          prev.map((o) =>
            o._id === targetId || o.orderId === targetId || o.shortId === targetId
              ? { ...o, status: data.status }
              : o
          )
        );
      }

      if (data.status === 'delivered') {
        fetchHistory();
      }
      fetchStats();
    });

    socket.on('admin-order-escalation', (data) => {
      setEscalationAlert(data);
      if (soundRef.current) {
        if (soundRef.current.playAlarm) {
          soundRef.current.playAlarm();
        } else {
          soundRef.current.play();
        }
      }

      // Mark order as escalated in state
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId || o.orderId === data.shortId || o.shortId === data.shortId
            ? { ...o, isEscalated: true }
            : o
        )
      );
    });

    socket.on('incoming-admin-call', (callData) => {
      // Store call details without forcing a screen-blocking popup
      setEscalationAlert((prev) => prev || callData);
    });

    const pollInterval = setInterval(() => {
      fetchOrders();
      fetchHistory();
      fetchStats();
    }, 20000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [theaterId, fetchOrders, fetchHistory, fetchStats]);

  const handleStatusChange = async (orderId, newStatus) => {
    // If marking as ready or delivered, check if alarm should silence immediately
    if (newStatus === 'ready' || newStatus === 'delivered') {
      const remainingUnready = orders.filter(
        (o) =>
          (o.status === 'confirmed' || o.status === 'preparing') &&
          o._id !== orderId &&
          o.orderId !== orderId &&
          o.shortId !== orderId
      ).length;

      if (remainingUnready === 0) {
        soundRef.current?.stopContinuousAlarm();
        setEscalationAlert(null);
      }
    }

    // Optimistically update: remove only this order if delivered, otherwise update its status
    if (newStatus === 'delivered' || newStatus === 'cancelled') {
      setOrders((prev) =>
        prev.filter((o) => o._id !== orderId && o.orderId !== orderId && o.shortId !== orderId)
      );
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.orderId === orderId || o.shortId === orderId
            ? { ...o, status: newStatus }
            : o
        )
      );
    }

    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      if (newStatus === 'delivered') {
        fetchHistory();
      }
      fetchStats();
    } catch (err) {
      console.warn('PATCH status update failed, trying PUT fallback:', err);
      try {
        await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
        if (newStatus === 'delivered') {
          fetchHistory();
        }
        fetchStats();
      } catch (fallbackErr) {
        // Rollback state if backend failed completely
        fetchOrders();
        alert(fallbackErr.message || err.message || 'Failed to update order status');
      }
    }
  };

  const handleManualEscalate = async (orderId) => {
    try {
      const { data } = await api.post(`/api/orders/${orderId}/escalate`);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.orderId === orderId || o.shortId === orderId
            ? { ...o, isEscalated: true }
            : o
        )
      );
      if (data?.details) {
        setEscalationAlert(data.details);
      }
      return data;
    } catch (err) {
      console.error('Manual escalation failed:', err);
      alert('Escalation failed: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredOrders =
    filter === 'all'
      ? orders
      : filter === 'kitchen'
      ? orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing')
      : filter === 'history'
      ? historyOrders
      : orders.filter((o) => o.status === filter);

  const statusCounts = {
    all: orders.length,
    kitchen: orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    history: historyOrders.length,
  };

  return (
    <div className="counter-portal">
      {/* Top Navbar */}
      <header className="counter-portal__nav">
        <div className="counter-portal__brand">
          <div className="counter-portal__badge" style={{ padding: 0, overflow: 'hidden', width: '42px', height: '42px', borderRadius: '50%', border: '1.5px solid #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/grande-muthuram-logo.jpg" alt="GMM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h2>GRANDÉ MUTHURAM MULTIPLEX</h2>
            <p>Concession Kitchen Console · Tirunelveli</p>
          </div>
        </div>

        <div className="counter-portal__nav-actions">
          <a
            href="http://localhost:5000/api/whatsapp/qr"
            target="_blank"
            rel="noreferrer"
            title={waConnected ? "WhatsApp Bot is Connected & Active (100% Free Alerts)" : "Click to Scan WhatsApp QR code"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              background: waConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: waConnected ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
              color: waConnected ? '#86efac' : '#fde047',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.76rem',
              fontWeight: 800,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span>{waConnected ? '🟢 WhatsApp Active' : '📲 Link WhatsApp (Free)'}</span>
          </a>

          <SoundAlert ref={soundRef} activeCount={pendingPrepCount} />

          {isAdmin && (
            <Link to="/admin" className="counter-portal__btn-admin">
              Admin Panel
            </Link>
          )}

          <div className="counter-portal__user-tag">
            <span>{user?.name || 'Staff User'}</span>
            <small>({user?.role || 'staff'})</small>
          </div>

          <button onClick={handleLogout} className="counter-portal__btn-logout">
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="counter-portal__main">
        {/* Real-time stats */}
        <CounterStatsBar stats={stats} />

        {/* Toolbar & Filter Tabs */}
        <div className="counter-portal__toolbar">
          <div className="counter-portal__filters">
            {[
              { key: 'all', label: 'All Active' },
              { key: 'kitchen', label: 'Kitchen Prep Queue' },
              { key: 'ready', label: 'Ready for Seat Delivery' },
              { key: 'history', label: 'Delivered / Completed' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`counter-portal__filter-btn ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                <span>{label}</span>
                <span className="badge">{statusCounts[key] !== undefined ? statusCounts[key] : 0}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              fetchOrders();
              fetchHistory();
              fetchStats();
            }}
            className="counter-portal__refresh-btn"
          >
            Refresh Queue
          </button>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <Loader text="Loading live queue..." />
        ) : filteredOrders.length === 0 ? (
          <div className="counter-portal__empty">
            <div className="counter-portal__empty-badge">GRANDÉ MUTHURAM CONCESSIONS</div>
            <h3>
              {filter === 'history'
                ? 'No Delivered Orders Recorded'
                : 'All Active Orders Clear! 🎉'}
            </h3>
            <p>
              {filter === 'history'
                ? 'Orders marked as delivered will be listed here.'
                : filter === 'all'
                ? 'No active orders currently awaiting preparation or seat delivery.'
                : `No orders currently matching filter "${filter}".`}
            </p>
            {filter !== 'history' && historyOrders.length > 0 && (
              <button
                onClick={() => setFilter('history')}
                style={{
                  marginTop: '1rem',
                  padding: '0.65rem 1.35rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--gold)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                <span>View {historyOrders.length} Completed / Delivered Orders</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="counter-portal__grid">
            {filteredOrders.map((order) => (
              <CounterOrderCard
                key={order._id}
                order={order}
                isNew={newOrderIds.has(order._id)}
                onStatusChange={handleStatusChange}
                onEscalate={handleManualEscalate}
              />
            ))}
          </div>
        )}
      </main>

      {/* 📱 Interactive Admin IVR Voice Call Simulator */}
      {activeCallData && (
        <AdminPhoneCallModal
          callData={activeCallData}
          onClose={() => setActiveCallData(null)}
        />
      )}
    </div>
  );
}
