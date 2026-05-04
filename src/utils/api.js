import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(c => { const t = localStorage.getItem('ab_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401) { localStorage.removeItem('ab_token'); localStorage.removeItem('ab_user'); window.location.href = '/login'; }
  return Promise.reject(e);
});
export default api;
