import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    path: '/admin',
    label: 'Overview',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/admin/menu',
    label: 'Menu Catalog',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    path: '/admin/qr',
    label: 'Seat QR Codes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="6" height="6" />
        <rect x="15" y="3" width="6" height="6" />
        <rect x="3" y="15" width="6" height="6" />
        <path d="M15 15h3v3h-3z" />
        <path d="M21 15v6h-6" />
      </svg>
    ),
  },
  {
    path: '/admin/setup',
    label: 'Auditorium Setup',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    path: '/admin/printer',
    label: 'Kitchen Printer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
  },
  {
    path: '/admin/reports',
    label: 'Financial Reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: isOpen ? 250 : 72,
        background: '#0d111d',
        borderRight: '1px solid var(--border)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        transition: 'width 0.25s ease',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Collapse Header */}
      <div
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1.5px solid #d4af37',
                boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)',
                flexShrink: 0,
              }}
            >
              <img src="/grande-muthuram-logo.jpg" alt="GMM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                GRANDÉ MUTHURAM
              </span>
              <span style={{ fontSize: '0.65rem', color: '#ffd84d', letterSpacing: '0.04em' }}>
                MULTIPLEX ADMIN
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: '0.25rem',
          }}
          aria-label="Toggle sidebar"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.75rem 0.85rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
              transition: 'all 0.15s ease',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              boxShadow: isActive ? '0 2px 10px rgba(225, 29, 72, 0.4)' : 'none',
            })}
            title={!isOpen ? item.label : undefined}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </span>
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div
        style={{
          padding: '1rem 0.75rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
              {user?.name || 'Administrator'}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {user?.email || 'admin@grandemuthuram.com'}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            gap: '0.6rem',
            padding: '0.6rem 0.75rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
          }}
          title="Sign Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
