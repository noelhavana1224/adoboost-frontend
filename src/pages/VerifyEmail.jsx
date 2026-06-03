import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const token = searchParams.get('token');

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setChecking(false); setValid(false); return; }
    api.get(`/auth/verify-token?token=${token}`)
      .then(r => { setValid(!!r.data.valid); setEmail(r.data.email || ''); })
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const strength = (p) => {
    let s = 0;
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const sLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const sColor = ['', '#dc2626', '#d97706', '#16a34a', '#0D47A1'];
  const s = strength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/verify-email', { token, password });
      // Auto-login and go to dashboard
      setSession(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify. The link may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D47A1 0%,#1565C0 50%,#0D47A1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#0D47A1' }}>ado</span><span style={{ color: '#FCD116' }}>boost</span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '3px', marginTop: 4, textTransform: 'uppercase' }}>by Adobo Solutions</div>
        </div>

        {checking ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#718096' }}>Verifying your link…</div>
        ) : !valid ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a202c', marginBottom: 10 }}>Link Invalid or Expired</h2>
            <p style={{ color: '#4a5568', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>This verification link is no longer valid. Sign up again or request a fresh link from the sign-in page.</p>
            <Link to="/register" style={{ display: 'inline-block', background: '#0D47A1', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Back to Sign Up
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', marginBottom: 6, textAlign: 'center' }}>Set your password</h2>
            <p style={{ color: '#718096', fontSize: 14, textAlign: 'center', marginBottom: 6 }}>Email verified for</p>
            <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>{email}</p>

            {error && (
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '11px 40px 11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: 12 }}>{showPass ? 'Hide' : 'Show'}</button>
                </div>
                {password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= s ? sColor[s] : '#e2e8f0' }} />)}
                    </div>
                    <div style={{ fontSize: 11, color: sColor[s], fontWeight: 600 }}>{sLabel[s]}</div>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password"
                  style={{ width: '100%', border: `1.5px solid ${confirm && confirm !== password ? '#dc2626' : '#e2e8f0'}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                {confirm && confirm !== password && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Passwords don't match</div>}
                {confirm && confirm === password && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>✓ Passwords match</div>}
              </div>
              <button type="submit" disabled={loading || !password || password !== confirm}
                style={{ background: loading || !password || password !== confirm ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 700, cursor: loading || !password || password !== confirm ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Activating…' : '✅ Activate Account & Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
