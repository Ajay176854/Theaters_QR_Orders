import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AUDITORIUM_SEATING_LAYOUT, getAllActiveSeatIds } from '../config/auditoriumLayout';

export default function AdminQRPage() {
  const [screen, setScreen] = useState(1);
  const [filterRow, setFilterRow] = useState('ALL');
  const [qrs, setQrs] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Detected host for mobile phone QR scanning over local Wi-Fi
  const detectedHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://10.190.5.47:${window.location.port || 5173}`
      : window.location.origin;

  const [scanHost, setScanHost] = useState(detectedHost);
  const theaterId = 'demo-theater';

  const allActiveSeats = getAllActiveSeatIds(); // ['A1', 'A2', ... 'M16']

  const generateQRs = (hostBase, scNum, rowFilter = 'ALL') => {
    setGenerating(true);
    let targetSeats = allActiveSeats;

    if (rowFilter !== 'ALL') {
      targetSeats = targetSeats.filter((seat) => seat.startsWith(rowFilter));
    }

    const generated = targetSeats.map((seatLabel) => {
      const orderUrl = `${hostBase}/${theaterId}?screen=${scNum}&seat=${seatLabel}`;
      // On browser preview, always route relative to the current browser window origin (e.g. http://localhost:5173)
      const menuUrl = `/${theaterId}/menu?screen=${scNum}&seat=${seatLabel}`;
      const dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
        orderUrl
      )}`;
      return { screen: scNum, seat: seatLabel, orderUrl, menuUrl, dataUrl };
    });

    setQrs(generated);
    setGenerating(false);
  };

  useEffect(() => {
    generateQRs(scanHost, screen, filterRow);
    api.get('/api/qr/network-info')
      .then(({ data }) => {
        if (data?.frontendUrl && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          setScanHost(data.frontendUrl);
          generateQRs(data.frontendUrl, screen, filterRow);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = () => {
    generateQRs(scanHost, screen, filterRow);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (item) => {
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = `QR-Screen${item.screen}-Seat${item.seat}.png`;
    link.click();
  };

  const rowsList = AUDITORIUM_SEATING_LAYOUT.map((r) => r.row);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#fff',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Seat QR Code Generator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Accurate QR codes generated directly from the auditorium blueprint layout ({allActiveSeats.length} seats per screen)
          </p>
        </div>

        {qrs.length > 0 && (
          <button
            onClick={handlePrint}
            style={{
              padding: '0.75rem 1.4rem',
              background: 'var(--btn-gold)',
              color: '#0b0907',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print All QRs ({qrs.length})
          </button>
        )}
      </div>

      {/* Configuration Controls Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end',
          marginBottom: '2rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}
          >
            Auditorium Screen
          </label>
          <select
            value={screen}
            onChange={(e) => setScreen(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.65rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: '#fff',
            }}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>
                Screen {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}
          >
            Row Filter
          </label>
          <select
            value={filterRow}
            onChange={(e) => setFilterRow(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: '#fff',
            }}
          >
            <option value="ALL">All Rows (A to M) — {allActiveSeats.length} Seats</option>
            {rowsList.map((r) => (
              <option key={r} value={r}>
                Row {r} only
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}
          >
            Scanning Domain / IP
          </label>
          <input
            type="text"
            value={scanHost}
            onChange={(e) => setScanHost(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--btn-gold)',
              color: '#0b0907',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            {generating ? 'Generating...' : `Generate ${qrs.length || allActiveSeats.length} QR Stickers`}
          </button>
        </div>
      </div>

      {/* Grid of Generated QRs */}
      {qrs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Click "Generate" above to create seat QR stickers for Screen {screen}.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {qrs.map((item) => (
            <div
              key={item.seat}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>
                Screen {item.screen} · Seat <span style={{ color: 'var(--gold)' }}>{item.seat}</span>
              </div>

              <div
                style={{
                  padding: '0.5rem',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
                }}
              >
                <img
                  src={item.dataUrl}
                  alt={`Seat ${item.seat}`}
                  style={{ width: 140, height: 140, display: 'block' }}
                />
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  wordBreak: 'break-all',
                  maxWidth: '160px',
                }}
              >
                {item.seat} · Screen {item.screen}
              </div>

              <button
                onClick={() => handleDownload(item)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'var(--transition-fast)',
                }}
              >
                Download PNG
              </button>

              <a
                href={item.menuUrl || item.orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  color: 'var(--gold)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                  transition: 'var(--transition-fast)',
                }}
              >
                <span>Preview</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
