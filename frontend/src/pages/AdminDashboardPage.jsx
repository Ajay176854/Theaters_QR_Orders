import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    vsYesterday: 'Live data',
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: sumData } = await api.get('/api/reports/summary');
        if (sumData?.today) {
          setSummary({
            todayRevenue: sumData.today.revenue || 0,
            todayOrders: sumData.today.orderCount || 0,
            avgOrderValue: sumData.today.avgOrderValue || 0,
            pendingOrders: (sumData.statusBreakdown?.confirmed || 0) + (sumData.statusBreakdown?.preparing || 0),
            vsYesterday: sumData.today.vsYesterday || 'Live data',
          });
        }

        if (Array.isArray(sumData?.weeklyTrend)) {
          setWeeklyRevenue(sumData.weeklyTrend);
        } else {
          // Generate real 7 days fallback with 0s
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const emptyWeek = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            emptyWeek.push({ day: days[d.getDay()], rev: 0 });
          }
          setWeeklyRevenue(emptyWeek);
        }
      } catch (err) {
        console.warn('Could not fetch live summary:', err);
      }

      try {
        const { data: ordData } = await api.get('/api/orders?limit=10');
        const list = ordData.orders || ordData;
        if (Array.isArray(list)) setRecentOrders(list.slice(0, 10));
      } catch (err) {
        console.warn('Could not fetch recent orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const highestRevenue = Math.max(...weeklyRevenue.map((d) => d.rev || 0), 0);
  const maxRev = highestRevenue > 0 ? highestRevenue * 1.15 : 1000;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Theater Concessions Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Live sales performance across auditoriums and seat deliveries
        </p>
      </div>

      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Today's Concession Revenue
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--gold)', marginTop: '0.35rem', textShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }}>
            ₹{summary.todayRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: summary.vsYesterday.includes('↓') ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem', fontWeight: 700 }}>
            {summary.vsYesterday}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Orders Placed Today
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '0.35rem' }}>
            {summary.todayOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Across all auditoriums
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Average Ticket Value
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffd84d', marginTop: '0.35rem' }}>
            ₹{summary.avgOrderValue}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Per guest transaction
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Active Kitchen Queue
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: summary.pendingOrders > 0 ? 'var(--gold)' : 'var(--text-muted)', marginTop: '0.35rem' }}>
            {summary.pendingOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Currently in prep
          </div>
        </div>
      </div>

      {/* SVG Sales Trend Chart - 100% Dynamic from MongoDB */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Weekly Concession Sales Trend
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              Real-time daily revenue calculated directly from customer orders
            </p>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--gold)',
              background: 'var(--gold-dim)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ● Live 7-Day Trend
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', height: 210, gap: '1.25rem', padding: '1rem 0 0.5rem' }}>
          {weeklyRevenue.map((d, index) => {
            const rev = d.rev || 0;
            const barHeight = Math.max(Math.round((rev / maxRev) * 160), rev > 0 ? 14 : 4);
            const isToday = d.date === new Date().toISOString().split('T')[0];
            const isPeak = rev === highestRevenue && rev > 0;

            const barGradient = !rev
              ? 'rgba(255, 255, 255, 0.05)'
              : isToday
              ? 'linear-gradient(180deg, #10b981 0%, #f59e0b 100%)'
              : isPeak
              ? 'linear-gradient(180deg, #ffd84d 0%, #d97706 100%)'
              : 'linear-gradient(180deg, #38bdf8 0%, #1e293b 100%)';

            const barShadow = !rev
              ? 'none'
              : isToday
              ? '0 0 16px rgba(16, 185, 129, 0.45)'
              : isPeak
              ? '0 0 16px rgba(245, 158, 11, 0.5)'
              : '0 0 12px rgba(56, 189, 248, 0.3)';

            return (
              <div key={d.date || d.day || index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.74rem', color: isToday ? '#34d399' : isPeak ? '#ffd84d' : rev > 0 ? '#38bdf8' : 'var(--text-muted)', fontWeight: 800 }}>
                  {rev >= 1000 ? `₹${(rev / 1000).toFixed(1)}k` : `₹${rev}`}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 48,
                    height: barHeight,
                    background: barGradient,
                    borderRadius: '7px 7px 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: barShadow,
                    border: isToday ? '1px solid #34d399' : isPeak ? '1px solid #ffd84d' : 'none',
                    animation: `barRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s both`,
                    transformOrigin: 'bottom',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: isToday ? '#34d399' : '#cbd5e1', fontWeight: isToday ? 900 : 700 }}>
                  {d.day}
                  {isToday && <span style={{ display: 'block', fontSize: '0.62rem', color: '#34d399', letterSpacing: '0.05em' }}>TODAY</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders List */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Recent Customer Orders
        </h3>

        {recentOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent orders yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Guest Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Seat Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Items</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#fff' }}>
                      {ord.orderId ? (ord.orderId.startsWith('#') ? ord.orderId : `#${ord.orderId}`) : `#${(ord._id || '').slice(-6).toUpperCase()}`}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#fff' }}>
                      <div style={{ fontWeight: 700 }}>{ord.customerName || ord.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ord.customerPhone || ord.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gold)', fontWeight: 700 }}>
                      Screen {ord.screenNumber || ord.screen || 1} · Seat {ord.seatNumber || ord.seat || 'A1'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0' }}>
                      {ord.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Items'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--gold)' }}>
                      ₹{ord.totalAmount || ord.total}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-xs)',
                          background:
                            ord.status === 'delivered' ? 'rgba(34, 197, 94, 0.18)' : 'var(--gold-dim)',
                          color: ord.status === 'delivered' ? '#86efac' : '#ffd84d',
                          border: `1px solid ${ord.status === 'delivered' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                        }}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
