import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setMessage('No verification token provided.'); return; }
    api.post('/auth/verify-email', { token })
      .then(r => { setState('success'); setMessage(r.data?.message || 'Email verified!'); })
      .catch(err => { setState('error'); setMessage(err.response?.data?.error || 'This verification link is invalid or has expired.'); });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D47A1 0%,#1565C0 50%,#0D47A1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#0D47A1' }}>ado</span><span style={{ color: '#FCD116' }}>boost</span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '3px', marginTop: 4, textTransform: 'uppercase' }}>by Adobo Solutions</div>
        </div>

        {state === 'verifying' && (
          <div style={{ padding: 20, color: '#718096' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
            Verifying your email…
          </div>
        )}

        {state === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a202c', marginBottom: 10 }}>Email Verified!</h2>
            <p style={{ color: '#4a5568', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{message} You can now connect inboxes and launch campaigns.</p>
            <button onClick={() => navigate('/dashboard')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '11px 26px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Go to Dashboard →
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a202c', marginBottom: 10 }}>Verification Failed</h2>
            <p style={{ color: '#4a5568', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
            <p style={{ color: '#718096', fontSize: 13, marginBottom: 16 }}>Log in and use the “Resend verification” button to get a fresh link.</p>
            <Link to="/login" style={{ display: 'inline-block', background: '#0D47A1', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
