import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';

function Field({ icon: Icon, label, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <Icon size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#a0aec0' }} />
        <input style={{ width:'100%', background:'#f7fafc', border:'1px solid #e2e8f0', borderRadius:8, color:'#1a202c', padding:'10px 12px 10px 36px', fontSize:14, outline:'none' }}
          onFocus={e => { e.target.style.borderColor='#1565C0'; e.target.style.background='#fff'; }}
          onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f7fafc'; }}
          {...props} />
      </div>
    </div>
  );
}

export default function Auth({ mode='login' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else {
        await register(form.name, form.email, form.password);
        toast.success(`Welcome to AdoBoost, ${form.name}! 🎉`);
        navigate('/welcome-va');
      }
    } catch(err) { toast.error(err.response?.data?.error || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f0f4f8' }}>
      {/* Left Panel */}
      <div style={{ flex:1, background:'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48, color:'#fff' }}>
        <div style={{ maxWidth:400 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.2)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={24} color="#fff" fill="#fff" />
            </div>
            <div style={{ fontSize:28, fontWeight:800 }}>AdoBoost</div>
          </div>
          <h2 style={{ fontSize:32, fontWeight:800, lineHeight:1.2, marginBottom:16 }}>
            Cold Email Outreach<br />That Gets Results
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.75)', lineHeight:1.7, marginBottom:36 }}>
            Build personalized email sequences, manage contacts, and track every open, click and reply — all in one place.
          </p>
          {['Multi-step email sequences', 'CSV contact import', 'Real-time analytics', 'SMTP & Gmail support'].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:22, height:22, background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Check size={12} color="#fff" />
              </div>
              <span style={{ fontSize:14, color:'rgba(255,255,255,0.85)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:'#fff' }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#1a202c', marginBottom:6 }}>
              {mode==='login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ color:'#718096', fontSize:14 }}>
              {mode==='login' ? 'Sign in to your AdoBoost account' : 'Start your 14-day free trial today'}
            </p>
          </div>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {mode==='register' && <Field icon={User} label="Full Name" type="text" placeholder="John Doe" value={form.name} onChange={e=>f('name',e.target.value)} required />}
            <Field icon={Mail} label="Email Address" type="email" placeholder="you@company.com" value={form.email} onChange={e=>f('email',e.target.value)} required />
            <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e=>f('password',e.target.value)} required />
            {mode==='login' && (
              <div style={{ textAlign:'right', marginTop:-8 }}>
                <Link to="/forgot-password" style={{ fontSize:13, color:'#1565C0', fontWeight:600, textDecoration:'none' }}>
                  Forgot password?
                </Link>
              </div>
            )}
            <button type="submit" disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:loading?'#90cdf4':'#1565C0', color:'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:4, transition:'background 0.2s' }}>
              {loading ? 'Please wait...' : (mode==='login' ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#718096' }}>
            {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
            <Link to={mode==='login'?'/register':'/login'} style={{ color:'#1565C0', fontWeight:600 }}>
              {mode==='login' ? 'Sign up free' : 'Sign in'}
            </Link>
          </p>
          {mode==='register' && <p style={{ textAlign:'center', marginTop:12, fontSize:11, color:'#a0aec0' }}>No credit card required · 14-day free trial</p>}
        </div>
      </div>
    </div>
  );
}
