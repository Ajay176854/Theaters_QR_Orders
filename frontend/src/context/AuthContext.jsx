import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = localStorage.getItem('auth_token');
    let savedUser = localStorage.getItem('auth_user');

    if (!token || !savedUser) {
      // Default to counter staff session for seamless kitchen console access
      const defaultStaff = {
        id: 'demo-staff-id',
        name: 'Counter Staff',
        role: 'staff',
        theaterId: 'demo-theater',
      };
      token = 'mock_staff_token';
      savedUser = JSON.stringify(defaultStaff);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', savedUser);
      setUser(defaultStaff);
    } else {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const userData = data.user;
    const token = data.token;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

