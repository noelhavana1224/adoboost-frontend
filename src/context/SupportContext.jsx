import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const SupportContext = createContext({
  isSupport: false,
  target: null,
  expiresAt: null,
  exit: () => {},
  refresh: () => {},
});

function readSupportState() {
  try {
    const raw = localStorage.getItem('ab_support');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function SupportProvider({ children }) {
  const [state, setState] = useState(readSupportState);

  // Allow other components (e.g. SupportEntry) to trigger a re-read
  const refresh = useCallback(() => {
    setState(readSupportState());
  }, []);

  // Re-read on localStorage changes from other tabs OR same-tab custom events
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    window.addEventListener('ab_support_changed', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('ab_support_changed', handler);
    };
  }, [refresh]);

  const exit = useCallback(async () => {
    try {
      const token = localStorage.getItem('ab_support_token');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL || 'https://api.adobosolutions.com'}/api/admin/support/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
    } catch { /* silent */ }
    localStorage.removeItem('ab_support_token');
    localStorage.removeItem('ab_support');
    setState(null);
    window.close();
    setTimeout(() => { window.location.href = 'https://app.adobosolutions.com/admin/users'; }, 200);
  }, []);

  useEffect(() => {
    if (!state?.expiresAt) return;
    const check = () => {
      if (Date.now() >= state.expiresAt) {
        toast.error('Support session expired');
        exit();
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [state, exit]);

  return (
    <SupportContext.Provider value={{
      isSupport: !!state,
      target: state?.target || null,
      expiresAt: state?.expiresAt || null,
      exit,
      refresh,
    }}>
      {children}
    </SupportContext.Provider>
  );
}

export const useSupport = () => useContext(SupportContext);
