import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react';

function Logo({ size = 'large' }) {
  const isLarge = size === 'large';
  return (
    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'flex-start', lineHeight:1 }}>
      <div style={{
        fontFamily:'Georgia, "Times New Roman", serif',
        fontSize: isLarge ? 38 : 28,
        fontWeight:800,
        letterSpacing:'-0.02em',
        color:'#fff',
      }}>
        ado<span style={{ color:'#FCD116' }}>boost</span>
      </div>
      <div style={{
        fontSize: isLarge ? 10 : 9,
        fontWeight:600,
        color:'rgba(255,255,255,0.55)',
        letterSpacing: isLarge ? '3px' : '2.5px',
        marginTop: isLarge ? 6 : 4,
      }}>
        BY ADOBO SOLUTIONS
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <Icon size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused ? '#0D47A1' : '#94a3b8', transition:'color 0.15s' }} />
        <input
          style={{
            width:'100%',
            background:'#fff',
            border: focused ? '1.5px solid #0D47A1' : '1.5px solid #e2e8f0',
            borderRadius:10,
            color:'#0f172a',
            padding:'13px 14px 13px 40px',
            fontSize:14,
            outline:'none',
            transition:'border-color 0.15s, box-shadow 0.15s',
            boxShadow: focused ? '0 0 0 4px rgba(13,71,161,0.08)' : 'none',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
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

  const features = [
    'Multi-step email sequences',
    'Trained Filipino VAs from $3/hr',
    'Real-time inbox & reply tracking',
    'Built-in email warmup network',
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f8fafc', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Left Panel — Marketing */}
      <div style={{
        flex:1,
        background:'radial-gradient(circle at 20% 20%, #1565C0 0%, #0D47A1 50%, #082A6B 100%)',
        display:'flex',
        flexDirection:'column',
        justifyContent:'space-between',
        padding:'56px 64px',
        color:'#fff',
        position:'relative',
        overflow:'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{
          position:'absolute',
          top:'-10%', right:'-10%',
          width:400, height:400,
          background:'radial-gradient(circle, rgba(252,209,22,0.18) 0%, transparent 70%)',
          borderRadius:'50%',
          pointerEvents:'none',
        }} />

        {/* Top: Logo */}
        <div style={{ position:'relative', zIndex:1 }}>
          <Logo size="large" />
        </div>

        {/* Middle: Pitch */}
        <div style={{ maxWidth:480, position:'relative', zIndex:1 }}>
          <div style={{
            display:'inline-block',
            background:'rgba(252,209,22,0.15)',
            border:'1px solid rgba(252,209,22,0.3)',
            color:'#FCD116',
            fontSize:12,
            fontWeight:700,
            padding:'6px 12px',
            borderRadius:99,
            marginBottom:24,
            letterSpacing:'0.04em',
          }}>
            COLD EMAIL + VAS THAT DO THE WORK
          </div>

          <h1 style={{
            fontSize:46,
            fontWeight:800,
            lineHeight:1.1,
            margin:'0 0 20px',
            letterSpacing:'-0.02em',
          }}>
            Stop sending cold<br />emails alone.
          </h1>
          <p style={{
            fontSize:17,
            color:'rgba(255,255,255,0.75)',
            lineHeight:1.6,
            margin:'0 0 32px',
            maxWidth:430,
          }}>
            AdoBoost gives you the outreach software. Our trained Filipino VAs run it for you — building campaigns, monitoring replies, and booking meetings.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {features.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:24, height:24,
                  background:'rgba(252,209,22,0.18)',
                  border:'1px solid rgba(252,209,22,0.35)',
                  borderRadius:7,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>
                  <Check size={13} color="#FCD116" strokeWidth={3} />
                </div>
                <span style={{ fontSize:14.5, color:'rgba(255,255,255,0.9)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Social proof */}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{
            fontSize:12,
            color:'rgba(255,255,255,0.55)',
            fontWeight:600,
            letterSpacing:'0.06em',
          }}>
            BUILT FOR SOLO FOUNDERS AND SMALL TEAMS
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{
        width:520,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'40px 56px',
        background:'#fff',
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ marginBottom:36 }}>
            <h2 style={{
              fontSize:28,
              fontWeight:800,
              color:'#0f172a',
              margin:'0 0 8px',
              letterSpacing:'-0.02em',
            }}>
              {mode==='login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ color:'#64748b', fontSize:14.5, margin:0 }}>
              {mode==='login'
                ? 'Sign in to your AdoBoost account'
                : 'Start your 14-day free trial — no card required'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {mode==='register' && (
              <Field icon={User} label="Full Name" type="text" placeholder="John Doe" value={form.name} onChange={e=>f('name',e.target.value)} required />
            )}
            <Field icon={Mail} label="Email Address" type="email" placeholder="you@company.com" value={form.email} onChange={e=>f('email',e.target.value)} required />
            <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e=>f('password',e.target.value)} required />

            {mode==='login' && (
              <div style={{ textAlign:'right', marginTop:-4 }}>
                <Link to="/forgot-password" style={{ fontSize:13, color:'#0D47A1', fontWeight:600, textDecoration:'none' }}>
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:8,
                background: loading
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
                color:'#fff',
                border:'none',
                borderRadius:10,
                padding:'14px',
                fontSize:15,
                fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop:6,
                transition:'transform 0.1s, box-shadow 0.15s',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(13,71,161,0.25)',
                letterSpacing:'0.01em',
              }}
              onMouseDown={e => !loading && (e.currentTarget.style.transform = 'scale(0.99)')}
              onMouseUp={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {loading ? 'Please wait...' : (mode==='login' ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ position:'relative', textAlign:'center', margin:'28px 0 20px' }}>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'#e2e8f0' }} />
            <span style={{ position:'relative', background:'#fff', padding:'0 14px', fontSize:12, color:'#94a3b8', fontWeight:600, letterSpacing:'0.06em' }}>
              {mode==='login' ? 'NEW TO ADOBOOST?' : 'ALREADY HAVE AN ACCOUNT?'}
            </span>
          </div>

          <Link
            to={mode==='login' ? '/register' : '/login'}
            style={{
              display:'block',
              textAlign:'center',
              padding:'12px',
              border:'1.5px solid #e2e8f0',
              borderRadius:10,
              color:'#0f172a',
              fontSize:14,
              fontWeight:700,
              textDecoration:'none',
              transition:'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D47A1'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
          >
            {mode==='login' ? 'Create a free account' : 'Sign in instead'}
          </Link>

          {mode==='register' && (
            <p style={{ textAlign:'center', marginTop:18, fontSize:12, color:'#94a3b8', lineHeight:1.5 }}>
              By creating an account you agree to our<br />
              <a href="#" style={{ color:'#64748b', textDecoration:'underline' }}>Terms</a> · <a href="#" style={{ color:'#64748b', textDecoration:'underline' }}>Privacy Policy</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
