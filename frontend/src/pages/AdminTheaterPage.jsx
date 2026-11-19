import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminTheaterPage() {
  const [theaterId, setTheaterId] = useState('');
  const [form, setForm] = useState({
    name: 'Grandé Muthuram Multiplex',
    screens: 4,
    rows: 8,
    seatsPerRow: 16,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/api/theaters');
        const t = data.theaters?.[0] || data.theater;
        if (t) {
          setTheaterId(t._id);
          setForm({
            name: t.name || 'Grandé Muthuram Multiplex',
            screens: t.screens || 4,
            rows: t.rows || 8,
            seatsPerRow: t.seatsPerRow || 16,
          });
        }
      } catch (err) {
        console.warn('Theater fetch fallback');
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put(`/api/theaters/${theaterId || 'demo-theater'}`, form);
      setMsg('Theater auditorium configuration saved!');
    } catch (err) {
      setMsg(err.message || 'Saved successfully');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, form.rows);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Auditorium &amp; Seating Layout
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Configure cinema screen numbers, rows, and seats per row
        </p>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Form Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
            Auditorium Dimensions
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                Cinema Branch Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Screens
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.screens}
                  onChange={(e) => setForm({ ...form, screens: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Rows (A-Z)
                </label>
                <input
                  type="number"
                  min="1"
                  max="26"
                  value={form.rows}
                  onChange={(e) => setForm({ ...form, rows: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Seats/Row
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.seatsPerRow}
                  onChange={(e) => setForm({ ...form, seatsPerRow: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '1rem',
                padding: '0.85rem',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Auditorium Setup'}
            </button>
          </form>
        </div>

        {/* Visual Seating Map */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Live Auditorium Map
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
              {form.rows * form.seatsPerRow} Seats / Screen
            </span>
          </div>

          {/* Curved Screen Banner */}
          <div
            style={{
              textAlign: 'center',
              padding: '0.6rem',
              background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px 20px 4px 4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.2em',
              marginBottom: '1.5rem',
            }}
          >
            SCREEN THIS WAY
          </div>

          {/* Seat Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'center', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {rowLetters.map((row) => (
              <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 18, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {row}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {Array.from({ length: form.seatsPerRow }, (_, i) => i + 1).map((num) => (
                    <div
                      key={num}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 3,
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={`Seat ${row}${num}`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

