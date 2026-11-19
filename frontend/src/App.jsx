import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Customer Pages
import OrderPage from './pages/OrderPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';

// Staff & Admin Pages
import LoginPage from './pages/LoginPage';
import CounterDashboardPage from './pages/CounterDashboardPage';
import AdminLayout from './pages/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMenuPage from './pages/AdminMenuPage';
import AdminQRPage from './pages/AdminQRPage';
import AdminTheaterPage from './pages/AdminTheaterPage';
import AdminPrinterPage from './pages/AdminPrinterPage';
import AdminReportsPage from './pages/AdminReportsPage';

function CustomerLayout({ children }) {
  return <div className="app-container">{children}</div>;
}

function StaffRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/counter" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Staff & Admin Portals (Full width desktop layout) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff" element={<Navigate to="/login" replace />} />

      <Route
        path="/counter"
        element={
          <StaffRoute>
            <CounterDashboardPage />
          </StaffRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/counter" replace />} />

      {/* Admin Panel routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
        <Route path="qr" element={<AdminQRPage />} />
        <Route path="setup" element={<AdminTheaterPage />} />
        <Route path="printer" element={<AdminPrinterPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>

      {/* ── Customer Ordering Pages (Mobile-First Layout) ── */}
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/order"
        element={
          <CustomerLayout>
            <OrderPage />
          </CustomerLayout>
        }
      />
      <Route
        path="/:theaterId"
        element={
          <CustomerLayout>
            <OrderPage />
          </CustomerLayout>
        }
      />
      <Route
        path="/:theaterId/menu"
        element={
          <CustomerLayout>
            <MenuPage />
          </CustomerLayout>
        }
      />
      <Route
        path="/menu"
        element={
          <CustomerLayout>
            <MenuPage />
          </CustomerLayout>
        }
      />
      <Route
        path="/cart"
        element={
          <CustomerLayout>
            <CartPage />
          </CustomerLayout>
        }
      />
      <Route
        path="/payment"
        element={
          <CustomerLayout>
            <PaymentPage />
          </CustomerLayout>
        }
      />
      <Route
        path="/confirmation/:orderId"
        element={
          <CustomerLayout>
            <ConfirmationPage />
          </CustomerLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
