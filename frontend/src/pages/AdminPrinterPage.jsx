import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminPrinterPage() {
  const [theaterId, setTheaterId] = useState('');
  const [settings, setSettings] = useState({
    printerIp: '192.168.1.100',
    printerPort: 9100,
    autoPrint: true,
  });
  const [jobs, setJobs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPrinterData = async () => {
    try {
      const { data } = await api.get('/api/theaters');
      const t = data.theaters?.[0] || data.theater;
      if (t) {
        setTheaterId(t._id);
        if (t.settings) {
          setSettings({
            printerIp: t.settings.printerIp || '192.168.1.100',
            printerPort: t.settings.printerPort || 9100,
            autoPrint: t.settings.autoPrint !== false,
          });
        }

        const { data: jobData } = await api.get(`/api/print/history/${t._id}`).catch(() => ({ data: { jobs: [] } }));
        setJobs(jobData.jobs || []);
      }
    } catch (err) {
      console.warn('Could not load printer settings');
    }
  };

  useEffect(() => {
    fetchPrinterData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put(`/api/theaters/${theaterId || 'demo-theater'}/printer-settings`, settings);
      setMsg('Printer settings updated!');
    } catch (err) {
      setMsg(err.message || 'Saved settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      await api.post('/api/print/test', { theaterId: theaterId || 'demo-theater' });
      alert('Test print job queued! The local print-agent will print it on the kitchen thermal printer.');
      fetchPrinterData();
    } catch (err) {
      alert(err.message || 'Failed to trigger test print');
    } finally {
      setTesting(false);
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      await api.post(`/api/print/${jobId}/retry`);
      fetchPrinterData();
    } catch (err) {
      alert(err.message || 'Failed to retry job');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Kitchen Thermal Printer Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Configure ESC/POS thermal receipt printers on the theater local area network (LAN)
          </p>
        </div>

        <button
          onClick={handleTestPrint}
          disabled={testing}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          {testing ? 'Queuing Ticket...' : 'Send Test Ticket'}
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid var(--success)',
            color: '#86efac',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          {msg}
        </div>
      )}

      {/* Configuration Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
          Network Connection
        </h3>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                Thermal Printer IP Address
              </label>
              <input
                type="text"
                required
                value={settings.printerIp}
                onChange={(e) => setSettings({ ...settings, printerIp: e.target.value })}
                placeholder="192.168.1.100"
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Static IP assigned to printer on local router
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                RAW Port (ESC/POS)
              </label>
              <input
                type="number"
                required
                value={settings.printerPort}
                onChange={(e) => setSettings({ ...settings, printerPort: Number(e.target.value) })}
                placeholder="9100"
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Default: 9100 for Epson, Posiflex, TVS
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  checked={settings.autoPrint}
                  onChange={(e) => setSettings({ ...settings, autoPrint: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Auto-Print on Order Payment</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-print receipt the second UPI confirms</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Printer Settings'}
          </button>
        </form>
      </div>

      {/* Architecture note */}
      <div
        style={{
          background: 'rgba(225, 29, 72, 0.08)',
          border: '1px solid rgba(225, 29, 72, 0.25)',
          borderRadius: 'var(--radius)',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: '#fecdd3', lineHeight: 1.5 }}>
          <strong>How Kitchen Printing Works:</strong> When customer payment is verified, the backend queues an ESC/POS print job. The lightweight <code>print-agent</code> running on the concession counter terminal receives the order and transmits raw commands to the LAN thermal receipt printer via TCP socket.
        </div>
      </div>

      {/* Print Jobs Queue */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Recent Kitchen Print Jobs
          </h3>
          <button
            onClick={fetchPrinterData}
            style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            ↻ Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
            No print jobs in history yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Job ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Order</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Attempts</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                      {job._id.slice(-6).toUpperCase()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--accent)', fontWeight: 600 }}>
                      {job.isTest ? 'LAN Test Ticket' : `#${job.orderId?.orderId || 'Order'}`}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                      {job.attempts || 1}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '10px',
                          background: job.status === 'printed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                          color: job.status === 'printed' ? '#86efac' : '#fde047',
                        }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {job.status === 'failed' && (
                        <button
                          onClick={() => handleRetryJob(job._id)}
                          style={{ padding: '0.25rem 0.6rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Retry
                        </button>
                      )}
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

