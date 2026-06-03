import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('ab_user')); } catch { return null; } });

  // Always refresh user data from server on app load to get latest plan/role
  useEffect(() => {
    const token = localStorage.getItem('ab_token');
    if (token && user) {
      api.get('/auth/me').then(r => {
        const fresh = { ...user, plan: r.data.plan, role: r.data.role, name: r.data.name, email_verified: r.data.email_verified ?? 1, mustChangePassword: r.data.mustChangePassword || false };
        localStorage.setItem('ab_user', JSON.stringify(fresh));
        setUser(fresh);
      }).catch(() => {});
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ab_token', data.token);
    const profile = await api.get('/auth/me');
    const user = {
      ...data.user,
      plan: profile.data.plan,
      role: profile.data.role,
      email_verified: data.user?.email_verified ?? profile.data.email_verified ?? 1,
      mustChangePassword: data.mustChangePassword || profile.data.mustChangePassword || false,
    };
    localStorage.setItem('ab_user', JSON.stringify(user));
    setUser(user); return data;
  };
  // Register no longer logs the user in — they must verify their email and set
  // a password first. Returns { pending: true, email } (or a token for the very
  // first admin bootstrap account).
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.token) { // admin bootstrap path → log straight in
      localStorage.setItem('ab_token', data.token);
      const profile = await api.get('/auth/me');
      const u = { ...data.user, plan: profile.data.plan, role: profile.data.role, email_verified: 1 };
      localStorage.setItem('ab_user', JSON.stringify(u));
      setUser(u);
    }
    return data;
  };
  // Used by the verify-email page after the password is set → log the user in
  const setSession = (token, userData) => {
    localStorage.setItem('ab_token', token);
    localStorage.setItem('ab_user', JSON.stringify(userData));
    setUser(userData);
  };
  // Update user state + localStorage (used after password change, plan updates, etc.)
  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('ab_user', JSON.stringify(updated));
      return updated;
    });
  };
  const logout = () => { localStorage.removeItem('ab_token'); localStorage.removeItem('ab_user'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, register, logout, updateUser, setSession }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
