import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(c => {
  // Support session token takes priority if present
  const supportToken = localStorage.getItem('ab_support_token');
  if (supportToken) {
    c.headers.Authorization = `Bearer ${supportToken}`;
    return c;
  }
  const t = localStorage.getItem('ab_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  r => r,
  e => {
    const status = e.response?.status;
    const data = e.response?.data;

    // Read-only support session — show toast, don't redirect
    if (status === 403 && data?.supportReadOnly) {
      toast.error('Read-only support session — exit to make changes.', { id: 'support-readonly' });
      return Promise.reject(e);
    }

    // Support token expired or invalid — exit support tab
    if (status === 401 && localStorage.getItem('ab_support_token')) {
      localStorage.removeItem('ab_support_token');
      localStorage.removeItem('ab_support');
      toast.error('Support session expired');
      setTimeout(() => { window.location.href = 'https://app.adobosolutions.com/admin/users'; }, 800);
      return Promise.reject(e);
    }

    // Normal user token failed — log out
    // BUT don't redirect if this IS the login/register call (wrong password → show toast, not redirect)
    if (status === 401) {
      const url = e.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('ab_token');
        localStorage.removeItem('ab_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(e);
  }
);

export default api;
