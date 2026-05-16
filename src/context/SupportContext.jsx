import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const SupportContext = createContext({
  isSupport: false,
  target: null,
  expiresAt: null,
  exit: () => {},
});

export function SupportProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem('ab_support');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

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
    window.close(); // close the support tab
    // Fallback: if window.close() is blocked (e.g. tab wasn't opened by script),
    // redirect to the login page so the support context is unmistakably exited.
    setTimeout(() => { window.location.href = 'https://app.adobosolutions.com/admin/users'; }, 200);
  }, []);

  // Auto-expire countdown
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
    }}>
      {children}
    </SupportContext.Provider>
  );
}

export const useSupport = () => useContext(SupportContext);
