import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authApi } from '../api/auth.js';

const TOKEN_KEY = 'fitcoach_token';
const USER_KEY = 'fitcoach_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const savedUser = sessionStorage.getItem(USER_KEY);
    if (token && savedUser) {
      authApi.me()
        .then(({ user: u }) => {
          setUser(u);
          sessionStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(USER_KEY);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { user: u, token } = await authApi.login(username, password);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    return { success: true, user: u };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  const register = async (data) => {
    await authApi.register(data);
    return { success: true };
  };

  const updateUser = (userId, updates) => {
    if (user?.id === userId) {
      const updated = { ...user, ...updates };
      setUser(updated);
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  };

  const refreshUser = async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch (_) {}
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, register, updateUser, refreshUser }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
