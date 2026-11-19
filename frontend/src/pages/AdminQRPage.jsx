import { useState, useEffect } from 'react';

export default function AdminQRPage() {
  const [screen, setScreen] = useState(1);
  const [rows, setRows] = useState(3); // A to C
  const [seatsPerRow, setSeatsPerRow] = useState(6);
  const [qrs, setQrs] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Auto-detect whether we are on localhost and provide the Wi-Fi LAN IP for mobile scan
  const detectedHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://10.130.230.48:${window.location.port || 5173}`
      : window.location.origin;

  const [scanHost, setScanHost] = useState(detectedHost);

  const theaterId = 'demo-theater';

  const generateQRsForHost = (hostBase, scNum, rowCount, colCount) => {
    setGenerating(true);
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, rowCount);
    const generated = [];

    for (const r of rowLetters) {
      for (let s = 1; s <= colCount; s++) {
        const seatLabel = `${r}${s}`;
        const orderUrl = `${hostBase}/${theaterId}?screen=${scNum}&seat=${seatLabel}`;
        const dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(orderUrl)}`;
        generated.push({ screen: scNum, seat: seatLabel, orderUrl, dataUrl });
      }
    }

    setQrs(generated);
    setGenerating(false);
  };

  useEffect(() => {
    generateQRsForHost(scanHost, screen, rows, seatsPerRow);
  }, []);

  const handleGenerate = () => {
    generateQRsForHost(scanHost, screen, rows, seatsPerRow);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Seat QR Code Generator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Scan with your mobile phone camera to order directly from that seat
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
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            Print Stickers ({qrs.length})
          </button>
        )}
      </div>

      {/* Mobile Scan Host Banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📱 Mobile Scanning Target URL
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Using your computer's local Wi-Fi IP so phone camera scans open the app instantly.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', maxWidth: '340px' }}>
          <input
            type="text"
            value={scanHost}
            onChange={(e) => setScanHost(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          />
          <button
            onClick={handleGenerate}
            style={{
              padding: '0.55rem 0.95rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-strong)',
              color: 'var(--gold)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Control Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end',
          marginBottom: '2rem',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Auditorium Screen
          </label>
          <select
            value={screen}
            onChange={(e) => setScreen(Number(e.target.value))}
            style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>Screen {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Rows (A to Z)
          </label>
          <input
            type="number"
            min="1"
            max="26"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Seats per Row
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={seatsPerRow}
            onChange={(e) => setSeatsPerRow(Number(e.target.value))}
            style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
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
            {generating ? 'Generating...' : `Generate ${rows * seatsPerRow} Seat QRs`}
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

              <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '8px', boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)' }}>
                <img
                  src={item.dataUrl}
                  alt={`Seat ${item.seat}`}
                  style={{ width: 140, height: 140, display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: '160px' }}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
