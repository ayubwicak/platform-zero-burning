import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const AUTH_KEYS = ['zb_token', 'zb_user'];

function readStoredValue(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearStoredAuth() {
  [localStorage, sessionStorage].forEach((storage) => {
    AUTH_KEYS.forEach((key) => storage.removeItem(key));
  });
}

function readStoredUser() {
  try {
    return JSON.parse(readStoredValue('zb_user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => readStoredValue('zb_token'));

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('zb:logout', handleLogout);
    return () => window.removeEventListener('zb:logout', handleLogout);
  }, []);

  const login = async (email, password, remember = true) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data;
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem('zb_token');
    otherStorage.removeItem('zb_user');
    storage.setItem('zb_token', newToken);
    storage.setItem('zb_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return newUser;
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    const nextUser = { ...user, ...updates };
    const storage = localStorage.getItem('zb_token') ? localStorage : sessionStorage;
    storage.setItem('zb_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === 'admin',
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
}
