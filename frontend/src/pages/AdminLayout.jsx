import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((prev) => !prev)} />
      <main
        style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1400px',
          width: '100%',
          overflowX: 'auto',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

