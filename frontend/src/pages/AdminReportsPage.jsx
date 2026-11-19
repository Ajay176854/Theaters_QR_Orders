import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState({
    grandTotal: 0,
    totalOrders: 0,
    dailyBreakdown: [],
  });

  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: revData } = await api.get(`/api/reports/revenue?from=${fromDate}&to=${toDate}`);
      setReport({
        grandTotal: revData?.grandTotal || 0,
        totalOrders: revData?.totalOrders || 0,
        dailyBreakdown: revData?.dailyBreakdown || [],
      });

      const { data: popData } = await api.get('/api/reports/popular-items?limit=8');
      setTopItems(popData?.items || []);
    } catch (err) {
      console.warn('Could not fetch live reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate]);

  const handleExportCSV = () => {
    if (report.dailyBreakdown.length === 0) return;
    const headers = ['Date', 'Revenue (INR)', 'Orders Placed', 'Avg Ticket'];
    const rows = report.dailyBreakdown.map((r) => [r.date, r.revenue, r.orders, r.avgOrderValue]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Cinema-Sales-Report-${fromDate}-to-${toDate}.csv`;
    link.click();
  };

  const avgTicket =
    report.totalOrders > 0
      ? Math.round(report.grandTotal / report.totalOrders)
      : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Concessions Revenue &amp; Financial Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Historical sales breakdown, revenue summaries, and best seller reports
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={report.dailyBreakdown.length === 0}
          style={{
            padding: '0.75rem 1.4rem',
            background: report.dailyBreakdown.length > 0 ? 'var(--btn-gold)' : 'var(--bg-secondary)',
            color: report.dailyBreakdown.length > 0 ? '#0b0907' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: report.dailyBreakdown.length > 0 ? 'pointer' : 'not-allowed',
            boxShadow: report.dailyBreakdown.length > 0 ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none',
          }}
        >
          Export CSV Report
        </button>
      </div>

      {/* Date filter bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700 }}>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700 }}>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: '#fff' }}
          />
        </div>

        <button
          onClick={fetchReports}
          style={{
            padding: '0.55rem 1.15rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            color: 'var(--gold)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 800,
          }}
        >
          {loading ? 'Refreshing...' : 'Apply Filter'}
        </button>
      </div>

      {/* Summary Cards */}
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
            Period Concessions Revenue
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--gold)', marginTop: '0.35rem', textShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }}>
            ₹{report.grandTotal.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Total Orders Delivered
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '0.35rem' }}>
            {report.totalOrders}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Average Ticket Size
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffd84d', marginTop: '0.35rem' }}>
            ₹{avgTicket}
          </div>
        </div>
      </div>

      {/* Best Sellers Table */}
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
          Top Selling Concession Items (Live DB)
        </h3>

        {topItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No item sales recorded yet. Concession sales will populate here dynamically.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Units Sold</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gross Revenue</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Orders Featured In</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#fff' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                      {item.totalQuantity} units
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gold)', fontWeight: 800 }}>
                      ₹{(item.totalRevenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.orderCount} orders
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
