import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('staff@theaterbites.in');
  const [password, setPassword] = useState('staff123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/counter');
      }
    } catch (err) {
      setError(err.message || 'Invalid user credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="login-portal">
      <div className="login-portal__card">
        <div className="login-portal__header">
          <div className="login-portal__badge" style={{ padding: 0, overflow: 'hidden', width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #d4af37', margin: '0 auto 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/grande-muthuram-logo.jpg" alt="GMM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1>GRANDÉ MUTHURAM MULTIPLEX</h1>
          <p>Staff Concession &amp; Management Portal · Tirunelveli</p>
        </div>

        {error && (
          <div className="login-portal__error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-portal__form">
          <div className="login-portal__field">
            <label>Employee ID / Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@grandemuthuram.com"
              required
            />
          </div>

          <div className="login-portal__field">
            <label>Access Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="login-portal__submit"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="login-portal__demo-box">
          <p className="login-portal__demo-title">Fast Role Switch</p>
          <div className="login-portal__demo-buttons">
            <button
              type="button"
              className="login-portal__demo-btn"
              onClick={() => handleDemoFill('staff@theaterbites.in', 'staff123')}
            >
              Concession Counter Staff
            </button>
            <button
              type="button"
              className="login-portal__demo-btn"
              onClick={() => handleDemoFill('admin@theaterbites.in', 'admin123')}
            >
              Theater General Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
