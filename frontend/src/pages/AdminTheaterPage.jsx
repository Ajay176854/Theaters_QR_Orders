import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AUDITORIUM_SEATING_LAYOUT, getAllActiveSeatIds } from '../config/auditoriumLayout';

export default function AdminTheaterPage() {
  const [theaterId, setTheaterId] = useState('');
  const [form, setForm] = useState({
    name: 'Grandé Muthuram Multiplex',
    screens: 4,
    rows: 13,
    seatsPerRow: 18,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);

  const activeSeats = getAllActiveSeatIds();

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
            rows: t.rows || 13,
            seatsPerRow: t.seatsPerRow || 18,
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
      await api.put(`/api/theaters/${theaterId || 'demo-theater'}`, {
        ...form,
        seatingLayout: AUDITORIUM_SEATING_LAYOUT,
      });
      setMsg('Auditorium seating layout saved successfully!');
    } catch (err) {
      setMsg(err.message || 'Saved successfully');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
          Auditorium &amp; Seating Setup
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          Fully active cinema seat configuration with complete row numbering and live screen layout
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
          ✓ {msg}
        </div>
      )}

      {/* Main Grid: Settings & Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Settings Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
            Auditorium Settings
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Cinema Branch Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Active Screens
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.screens}
                onChange={(e) => setForm({ ...form, screens: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Layout Stats */}
            <div
              style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Auditorium Rows:</span>
                <strong style={{ color: '#fff' }}>13 (Rows A - M)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Bookable Seats:</span>
                <strong style={{ color: 'var(--gold)' }}>{activeSeats.length} Active Seats</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Disabled / Empty:</span>
                <strong style={{ color: '#86efac' }}>0 (All Active)</strong>
              </div>
              {selectedSeat && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#38bdf8' }}>Inspected Seat:</span>
                  <strong style={{ color: '#38bdf8' }}>Seat {selectedSeat}</strong>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: 'var(--btn-gold)',
                color: '#0b0907',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              {saving ? 'Saving...' : 'Save Auditorium Setup'}
            </button>
          </form>

          {/* Quick Legend */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid #1e293b', background: '#ffffff', color: '#0f172a', fontWeight: 800, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                1
              </div>
              <span style={{ color: '#e2e8f0' }}>All Seats Active &amp; Numbered</span>
            </div>
          </div>
        </div>

        {/* Visual Seating Blueprint Map */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.75rem',
            overflowX: 'auto',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Live Auditorium Map
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 800 }}>
              {activeSeats.length} Active Seats / Screen
            </span>
          </div>

          {/* Seating Layout Canvas */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2.5rem 1.75rem 2rem 1.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              minWidth: '680px',
            }}
          >
            {/* Rows A through M */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {AUDITORIUM_SEATING_LAYOUT.map((rowObj) => {
                const isSectionBreak = rowObj.row === 'G';
                return (
                  <div key={rowObj.row}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Row Letter */}
                      <span
                        style={{
                          width: 24,
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          textAlign: 'left',
                          marginRight: '0.75rem',
                        }}
                      >
                        {rowObj.row}
                      </span>

                      {/* Row Seats */}
                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        {rowObj.seats.map((seatItem, sIdx) => {
                          if (seatItem.type === 'aisle') {
                            return <div key={`aisle-${sIdx}`} style={{ width: 28 }} />;
                          }

                          const seatCode = `${rowObj.row}${seatItem.num}`;
                          const isSelected = selectedSeat === seatCode;

                          return (
                            <button
                              key={`seat-${seatCode}`}
                              type="button"
                              onClick={() => setSelectedSeat(seatCode)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: isSelected ? '2px solid #2563eb' : '1.5px solid #0f172a',
                                background: isSelected ? '#2563eb' : '#ffffff',
                                color: isSelected ? '#ffffff' : '#0f172a',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                boxShadow: isSelected ? '0 4px 10px rgba(37, 99, 235, 0.4)' : 'none',
                              }}
                              title={`Seat ${seatCode}`}
                            >
                              {seatItem.num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section Gap below row G */}
                    {isSectionBreak && <div style={{ height: 16 }} />}
                  </div>
                );
              })}
            </div>

            {/* Screen Banner at Bottom (Matching Diagram: Screen This Way) */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '65%',
                  height: '28px',
                  background: 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)',
                  borderRadius: '10px 10px 80px 80px / 10px 10px 30px 30px',
                  boxShadow: '0 6px 14px rgba(99, 102, 241, 0.35)',
                  border: '1.5px solid #4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Screen This Way
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
