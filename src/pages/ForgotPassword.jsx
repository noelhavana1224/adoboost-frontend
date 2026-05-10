import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch(err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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

        {sent ? (
          // Success state
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#1a202c', marginBottom:10 }}>Check Your Email</h2>
            <p style={{ color:'#4a5568', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              If <strong>{email}</strong> has an account, we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <p style={{ color:'#94a3b8', fontSize:13, marginBottom:20 }}>The link expires in <strong>1 hour</strong>.</p>
            <Link to="/login" style={{ display:'inline-block', color:'#0D47A1', fontSize:14, fontWeight:600, textDecoration:'none' }}>
              ← Back to Login
            </Link>
          </div>
        ) : (
          // Form state
          <>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#1a202c', marginBottom:8, textAlign:'center' }}>Forgot Password?</h2>
            <p style={{ color:'#718096', fontSize:14, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

            {error && (
              <div style={{ background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#4a5568', display:'block', marginBottom:6 }}>Email Address</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'11px 14px', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor='#0D47A1'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'}
                />
              </div>
              <button type="submit" disabled={loading} style={{ background:loading?'#94a3b8':'#0D47A1', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', transition:'background 0.15s' }}>
                {loading ? 'Sending...' : '📧 Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:20 }}>
              <Link to="/login" style={{ color:'#0D47A1', fontSize:14, fontWeight:600, textDecoration:'none' }}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
