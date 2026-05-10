import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid]       = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!token) { setVerifying(false); setValid(false); return; }
    api.get(`/auth/verify-reset-token?token=${token}`)
      .then(r => setValid(r.data.valid))
      .catch(() => setValid(false))
      .finally(() => setVerifying(false));
  }, [token]);

  const strength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#dc2626', '#d97706', '#16a34a', '#0D47A1'];
  const s = strength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch(err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0D47A1 0%,#1565C0 50%,#0D47A1 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:420, boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontFamily:'Georgia,serif', fontWeight:800, fontSize:28, letterSpacing:'-0.5px' }}>
            <span style={{ color:'#0D47A1' }}>ado</span><span style={{ color:'#FCD116' }}>boost</span>
          </div>
          <div style={{ fontSize:10, color:'#94a3b8', letterSpacing:'3px', marginTop:4, textTransform:'uppercase' }}>by Adobo Solutions</div>
        </div>

        {verifying ? (
          <div style={{ textAlign:'center', padding:20, color:'#718096' }}>Verifying reset link...</div>
        ) : !valid ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#1a202c', marginBottom:10 }}>Link Expired</h2>
            <p style={{ color:'#4a5568', fontSize:14, lineHeight:1.7, marginBottom:24 }}>This reset link is invalid or has expired. Please request a new one.</p>
            <Link to="/forgot-password" style={{ display:'inline-block', background:'#0D47A1', color:'#fff', padding:'10px 24px', borderRadius:8, textDecoration:'none', fontWeight:700, fontSize:14 }}>
              Request New Link
            </Link>
          </div>
        ) : done ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#1a202c', marginBottom:10 }}>Password Reset!</h2>
            <p style={{ color:'#4a5568', fontSize:14, lineHeight:1.7, marginBottom:8 }}>Your password has been updated successfully.</p>
            <p style={{ color:'#94a3b8', fontSize:13 }}>Redirecting to login in 3 seconds...</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#1a202c', marginBottom:8, textAlign:'center' }}>Set New Password</h2>
            <p style={{ color:'#718096', fontSize:14, textAlign:'center', marginBottom:24 }}>Choose a strong password for your account.</p>

            {error && (
              <div style={{ background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#4a5568', display:'block', marginBottom:6 }}>New Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} required value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'11px 40px 11px 14px', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                    onFocus={e=>e.target.style.borderColor='#0D47A1'}
                    onBlur={e=>e.target.style.borderColor='#e2e8f0'}
                  />
                  <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#718096', fontSize:12 }}>
                    {showPass?'Hide':'Show'}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop:6 }}>
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=s ? strengthColor[s] : '#e2e8f0', transition:'background 0.3s' }}/>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:strengthColor[s], fontWeight:600 }}>{strengthLabel[s]}</div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#4a5568', display:'block', marginBottom:6 }}>Confirm Password</label>
                <input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  style={{ width:'100%', border:`1.5px solid ${confirm&&confirm!==password?'#dc2626':'#e2e8f0'}`, borderRadius:8, padding:'11px 14px', fontSize:14, outline:'none', boxSizing:'border-box' }}
                />
                {confirm && confirm !== password && <div style={{ fontSize:12, color:'#dc2626', marginTop:4 }}>Passwords don't match</div>}
                {confirm && confirm === password && <div style={{ fontSize:12, color:'#16a34a', marginTop:4 }}>✓ Passwords match</div>}
              </div>

              <button type="submit" disabled={loading||password!==confirm||!password} style={{ background:loading||password!==confirm||!password?'#94a3b8':'#0D47A1', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:15, fontWeight:700, cursor:loading||password!==confirm||!password?'not-allowed':'pointer', fontFamily:'inherit' }}>
                {loading ? 'Resetting...' : '🔑 Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
