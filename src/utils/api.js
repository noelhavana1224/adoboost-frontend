import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,   // 12s per attempt — fail fast instead of hanging forever
});

// ── Service health state (module-level singleton) ─────────────────────────
let _serviceDown = false;
const SERVICE_TOAST_ID = 'service-down';

function markServiceDown() {
  if (_serviceDown) return;
  _serviceDown = true;
  // Fire a DOM event — Layout listens and shows the full-screen overlay
  window.dispatchEvent(new CustomEvent('ab_service_down'));
}

function markServiceUp() {
  if (!_serviceDown) return;
  _serviceDown = false;
  window.dispatchEvent(new CustomEvent('ab_service_up'));
  toast.success('✓ Connection restored', { duration: 3000 });
}

// ── Request interceptor — attach auth token ───────────────────────────────
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

// ── Response interceptor — handle errors + auto-retry ─────────────────────
api.interceptors.response.use(
  r => {
    // Any successful response means the server is back
    markServiceUp();
    return r;
  },
  async e => {
    const status   = e.response?.status;
    const data     = e.response?.data;
    const config   = e.config || {};

    // Determine if this is a "server is down" class of error
    const networkError  = !e.response && e.code !== 'ERR_CANCELED';
    const serverDown    = status === 502 || status === 503 || status === 504 || networkError;

    // ── Auto-retry on server-down errors (up to 3 attempts, 4s apart) ──────
    if (serverDown) {
      config._retryCount = (config._retryCount || 0) + 1;

      if (config._retryCount <= 2) {
        markServiceDown();
        // Short back-off: 2s, 4s — fail fast so pages resolve quickly
        const delay = config._retryCount * 2000;
        await new Promise(res => setTimeout(res, delay));
        return api(config);           // retry the original request
      }

      // All retries exhausted — service is genuinely down
      markServiceDown();
      return Promise.reject(e);
    }

    // ── Read-only support session ─────────────────────────────────────────
    if (status === 403 && data?.supportReadOnly) {
      toast.error('Read-only support session — exit to make changes.', { id: 'support-readonly' });
      return Promise.reject(e);
    }

    // ── Support token expired ─────────────────────────────────────────────
    if (status === 401 && localStorage.getItem('ab_support_token')) {
      localStorage.removeItem('ab_support_token');
      localStorage.removeItem('ab_support');
      toast.error('Support session expired');
      setTimeout(() => { window.location.href = '/admin/users'; }, 800);
      return Promise.reject(e);
    }

    // ── Normal 401 — log out (but not on auth endpoints) ─────────────────
    if (status === 401) {
      const url = config?.url || '';
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
