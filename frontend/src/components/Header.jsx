import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Header.css';

export default function Header({ theaterName, seat, screen }) {
  const { totalItems } = useCart();

  const storedName = sessionStorage.getItem('theaterName');
  const cleanStoredName = storedName && !storedName.toLowerCase().includes('pvp') ? storedName : 'GRANDÉ MUTHURAM MULTIPLEX';
  if (storedName && storedName.toLowerCase().includes('pvp')) {
    sessionStorage.setItem('theaterName', 'GRANDÉ MUTHURAM MULTIPLEX');
  }
  const displayTheater = theaterName || cleanStoredName;
  const displaySeat = seat || sessionStorage.getItem('seat') || '';
  const displayScreen = screen || sessionStorage.getItem('screen') || '';

  const seatLabel = displaySeat && displayScreen
    ? `Screen ${displayScreen} · Seat ${displaySeat}`
    : displaySeat
      ? `Seat ${displaySeat}`
      : 'Multiplex';

  return (
    <header className="header">
      <div className="header__left">
        <Link to="/" className="header__brand-link">
          <div className="header__logo-badge" style={{ padding: 0, overflow: 'hidden' }}>
            <img
              src="/grande-muthuram-logo.jpg"
              alt="Grandé Muthuram Multiplex"
              className="header__logo-img"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          <div className="header__info">
            <h1 className="header__theater">{displayTheater}</h1>
            <span className="header__seat">{seatLabel}</span>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          to="/login"
          className="header__staff-link"
          title="Staff Portal Sign In"
        >
          Staff
        </Link>

        <Link to="/cart" className="header__cart" aria-label="View Cart">
          <svg
            className="header__cart-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {totalItems > 0 && (
            <span className="header__badge" key={totalItems}>
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
