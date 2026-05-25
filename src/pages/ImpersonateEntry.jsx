import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * ImpersonateEntry — receives a short-lived impersonation token from the admin panel,
 * backs up the admin token, then logs in as the target user for 15 minutes.
 *
 * URL: /impersonate-entry?token=<jwt>&name=<encoded>&email=<encoded>
 *
 * To exit: restore 'ab_admin_token_backup' from sessionStorage → localStorage.setItem('token',...)
 * and navigate to /admin/users.  This is handled by the ImpersonateBanner in Layout.
 */
export default function ImpersonateEntry() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const name  = decodeURIComponent(params.get('name') || '');
    const email = decodeURIComponent(params.get('email') || '');

    if (!token) {
      toast.error('Invalid impersonation token');
      navigate('/login');
      return;
    }

    // Back up current admin token in sessionStorage (tab-scoped, survives navigation)
    const existing = localStorage.getItem('ab_token');
    if (existing) sessionStorage.setItem('ab_admin_token_backup', existing);

    // Store impersonation metadata so banner can show who we are acting as
    sessionStorage.setItem('ab_impersonating', JSON.stringify({ name, email, expiresAt: Date.now() + 15 * 60 * 1000 }));

    // Set impersonation token as active auth token
    localStorage.setItem('ab_token', token);

    // Hard-reload to /dashboard so AuthContext picks up the new token cleanly
    window.location.replace('/dashboard');
  }, []); // eslint-disable-line

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', color: '#64748b' }}>
      Starting impersonation session…
    </div>
  );
}
