import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import '../styles/OrderPage.css';

export default function OrderPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const theaterId = params.theaterId || searchParams.get('theaterId') || 'demo-theater';
  const screen = searchParams.get('screen') || '1';
  const seat = searchParams.get('seat') || 'A1';

  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Target host for mobile scan — auto-detects current Wi-Fi LAN IP so phones connect directly
  const [lanHost, setLanHost] = useState(
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `http://10.190.5.47:${window.location.port || 5173}`
      : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://10.190.5.47:5173'
  );

  const qrTargetUrl = `${lanHost}/${theaterId}?screen=${screen}&seat=${seat}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(qrTargetUrl)}`;

  useEffect(() => {
    // Dynamically fetch active Wi-Fi LAN IP from backend
    api.get('/api/qr/network-info')
      .then(({ data }) => {
        if (data?.frontendUrl && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          setLanHost(data.frontendUrl);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    sessionStorage.setItem('theaterId', theaterId);
    sessionStorage.setItem('screen', screen);
    sessionStorage.setItem('seat', seat);

    async function fetchTheater() {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/theaters/${theaterId}`);
        const theaterData = data.theater || data;
        setTheater(theaterData);
        sessionStorage.setItem('theaterName', theaterData.name || 'GRANDÉ MUTHURAM MULTIPLEX');
      } catch (err) {
        const defaultTheater = { name: 'GRANDÉ MUTHURAM MULTIPLEX', _id: theaterId };
        setTheater(defaultTheater);
        sessionStorage.setItem('theaterName', defaultTheater.name);
      } finally {
        setLoading(false);
      }
    }

    fetchTheater();
  }, [theaterId, screen, seat]);

  const handleBrowseMenu = () => {
    navigate(`/${theaterId}/menu`);
  };

  if (loading) return <Loader text="Connecting to your seat..." />;

  if (error) {
    return (
      <div className="order-page">
        <div className="order-page__error">
          <div className="order-page__logo-badge" style={{ padding: 0, overflow: 'hidden', width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #d4af37', margin: '0 auto 1rem' }}>
            <img src="/grande-muthuram-logo.jpg" alt="GMM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2>Unable to Connect</h2>
          <p>{error}</p>
          <button className="order-page__cta" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="order-page__hero">
        <div className="order-page__glow" />

        <div className="order-page__brand-header">
          <div className="order-page__logo-badge" style={{ padding: 0, overflow: 'hidden', width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #d4af37' }}>
            <img src="/grande-muthuram-logo.jpg" alt="GMM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span className="order-page__cinemas-tag">LUXURY MULTIPLEX</span>
        </div>

        <h1 className="order-page__title">
          {theater?.name || 'GRANDÉ MUTHURAM MULTIPLEX'}
        </h1>

        <p className="order-page__location">
          PALAYAMKOTTAI · TIRUNELVELI
        </p>

        <p className="order-page__subtitle">
          Direct Seat Delivery · Fresh Concessions · Zero Interruption
        </p>

        <div className="order-page__seat-card">
          <div className="order-page__seat-row">
            <div className="order-page__seat-item">
              <span className="order-page__seat-label">Auditorium</span>
              <span className="order-page__seat-value">SCREEN {screen}</span>
            </div>
            <div className="order-page__seat-divider" />
            <div className="order-page__seat-item">
              <span className="order-page__seat-label">Assigned Seat</span>
              <span className="order-page__seat-value">{seat}</span>
            </div>
          </div>
        </div>

        {/* Seat QR Code for Mobile Scanning */}
        <div className="order-page__qr-card">
          <div className="order-page__qr-header">
            <span className="order-page__qr-tag">📱 Scan From Mobile to Order</span>
          </div>

          <div className="order-page__qr-frame">
            <img
              src={qrImageUrl}
              alt={`Screen ${screen} Seat ${seat} QR Code`}
              className="order-page__qr-img"
            />
          </div>

          <p className="order-page__qr-hint">
            Scan this QR code with your phone camera to order directly to <strong>Screen {screen} · Seat {seat}</strong>
          </p>
          <div style={{ textAlign: 'center', marginTop: '0.45rem', fontSize: '0.74rem', color: '#94a3b8' }}>
            <span>Direct Mobile Link: </span>
            <a href={qrTargetUrl} target="_blank" rel="noreferrer" style={{ color: '#ffd84d', fontWeight: 700, textDecoration: 'underline' }}>
              {qrTargetUrl}
            </a>
          </div>
        </div>

        <button className="order-page__cta" onClick={handleBrowseMenu}>
          <span>View Concession Menu</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <p className="order-page__footer-note">
          Orders will be delivered directly to Screen {screen}, Seat {seat} during the show.
        </p>

        <Link to="/login" className="order-page__portal-link">
          Staff &amp; Concession Counter Portal →
        </Link>
      </div>
    </div>
  );
}
