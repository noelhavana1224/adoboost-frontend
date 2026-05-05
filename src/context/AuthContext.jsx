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
        const fresh = { ...user, plan: r.data.plan, role: r.data.role, name: r.data.name };
        localStorage.setItem('ab_user', JSON.stringify(fresh));
        setUser(fresh);
      }).catch(() => {});
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ab_token', data.token);
    const profile = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
    const user = { ...data.user, plan: profile.data.plan, role: profile.data.role };
    localStorage.setItem('ab_user', JSON.stringify(user));
    setUser(user); return data;
  };
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('ab_token', data.token);
    const profile = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
    const user = { ...data.user, plan: profile.data.plan, role: profile.data.role };
    localStorage.setItem('ab_user', JSON.stringify(user));
    setUser(user); return data;
  };
  const logout = () => { localStorage.removeItem('ab_token'); localStorage.removeItem('ab_user'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
