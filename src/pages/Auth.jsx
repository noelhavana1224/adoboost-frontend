import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, Check, Zap, BarChart2, Shield, Users, Eye, EyeOff, Linkedin, CalendarCheck, RefreshCw, Bot } from 'lucide-react';

const CSS = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes floatOrb1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(30px, -40px) scale(1.08); }
  }
  @keyframes floatOrb2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(-20px, 30px) scale(0.95); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .auth-input {
    width: 100%;
    background: #f8faff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    color: #0f172a;
    padding: 14px 14px 14px 44px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }
  .auth-input:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
  }
  .auth-input::placeholder { color: #94a3b8; }
  .submit-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #7c3aed 100%);
    background-size: 200% auto;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 15px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.1s;
    box-shadow: 0 4px 20px rgba(37,99,235,0.4);
    letter-spacing: 0.01em;
    font-family: inherit;
  }
  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 6px 28px rgba(37,99,235,0.55);
    animation: shimmer 1.5s linear infinite;
    background-size: 200% auto;
  }
  .submit-btn:active:not(:disabled) { transform: scale(0.985); }
  .submit-btn:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }
  .alt-link {
    display: block;
    text-align: center;
    padding: 13px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.18s;
    background: #fff;
    font-family: inherit;
  }
  .alt-link:hover {
    border-color: #3b82f6;
    background: #f0f7ff;
    color: #2563eb;
  }
  .feature-row {
    display: flex;
    align-items: center;
    gap: 12px;
    animation: fadeUp 0.6s ease both;
  }
  .feat-new {
    font-size: 9px; font-weight: 800; letter-spacing: 0.06em;
    background: linear-gradient(135deg,#f59e0b,#ef4444);
    color: #fff; padding: 2px 7px; border-radius: 20px;
    text-transform: uppercase; flex-shrink: 0;
  }
  @media (max-width: 768px) {
    .auth-left { display: none !important; }
    .auth-right { width: 100% !important; }
  }
`;

function Field({ icon: Icon, label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={16} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: focused ? '#3b82f6' : '#94a3b8', transition: 'color 0.2s', pointerEvents: 'none',
        }} />
        <input
          className="auth-input"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Bot,          color: '#60a5fa', text: 'AI-powered email sequences & rewriting',    isNew: false },
  { icon: Linkedin,     color: '#0a66c2', text: 'LinkedIn outreach steps inside campaigns',  isNew: true  },
  { icon: Shield,       color: '#4ade80', text: 'Inbox warmup network & rotation built-in',  isNew: false },
  { icon: CalendarCheck,color: '#34d399', text: 'Calendar booking page for prospects',       isNew: true  },
  { icon: BarChart2,    color: '#a78bfa', text: 'Real-time replies, opens & deliverability', isNew: false },
  { icon: RefreshCw,    color: '#fb923c', text: 'Multi-inbox rotation for higher volume',    isNew: false },
];

const STATS = [
  { value: '2,400+', label: 'Active Users' },
  { value: '98%',    label: 'Deliverability' },
  { value: '4.9★',   label: 'User Rating' },
];

export default function Auth({ mode = 'login' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

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
    } catch (err) { toast.error(err.response?.data?.error || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

        {/* ── LEFT PANEL ───────────────────────────── */}
        <div className="auth-left" style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #020817 0%, #0a1628 40%, #0f0c29 70%, #1a0533 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 64px',
          color: '#fff',
        }}>
          {/* Animated grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }} />

          {/* Glowing orbs */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-80px',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
            animation: 'floatOrb1 8s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', right: '-60px',
            width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
            animation: 'floatOrb2 10s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '45%', right: '20%',
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99,102,241,0.5)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 38 38" fill="none">
                    <path d="M8 21 L22 14 L18 24 Z" fill="white"/>
                    <path d="M18 24 L14 20 L22 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                    <line x1="14" y1="20" x2="12" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    ado<span style={{ color: '#FCD116' }}>boost</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '3px', marginTop: 3, textTransform: 'uppercase' }}>
                    by Adobo Solutions
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main copy */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, maxWidth: 500, paddingTop: 32, paddingBottom: 32 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(99,102,241,0.5)',
              background: 'rgba(99,102,241,0.1)',
              borderRadius: 99, padding: '6px 14px',
              marginBottom: 28, width: 'fit-content',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                All-in-One Outreach Platform
              </span>
            </div>

            <h1 style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.05,
              margin: '0 0 22px',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #fff 30%, rgba(147,197,253,0.9) 70%, rgba(196,181,253,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Outreach that<br />books meetings.
            </h1>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 30px', maxWidth: 420 }}>
              Cold email, LinkedIn outreach, inbox warmup, and calendar booking — all connected in one platform built to get you more replies and booked calls.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              {FEATURES.map(({ icon: Icon, color, text, isNew }, i) => (
                <div key={text} className="feature-row" style={{ animationDelay: `${i * 0.07}s`, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `${color}18`,
                    border: `1px solid ${color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 10px ${color}20`,
                  }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{text}</span>
                      {isNew && <span className="feat-new">NEW</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VA mention */}
            <div style={{
              marginTop: 32,
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6,
              backdropFilter: 'blur(8px)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Need a hand?</span>{' '}
              Add a trained VA from <span style={{ color: '#FCD116', fontWeight: 700 }}>$4/hr</span> after signup — optional, no commitment.
            </div>
          </div>

          {/* Stats row */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex', gap: 0,
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
            }}>
              {STATS.map(({ value, label }, i) => (
                <div key={label} style={{
                  flex: 1, padding: '18px 20px', textAlign: 'center',
                  borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────── */}
        <div className="auth-right" style={{
          width: 540,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 56px',
          flexShrink: 0,
        }}>
          <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.5s ease both' }}>

            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.025em' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
                {mode === 'login'
                  ? 'Sign in to your AdoBoost account'
                  : 'Start your 14-day free trial — no card required'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {mode === 'register' && (
                <Field icon={User} label="Full Name" type="text" placeholder="John Doe"
                  value={form.name} onChange={e => f('name', e.target.value)} required />
              )}
              <Field icon={Mail} label="Email Address" type="email" placeholder="you@company.com"
                value={form.email} onChange={e => f('email', e.target.value)} required />
              {/* Password with show/hide toggle — prevents silent autocorrect mangling on mobile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => f('password', e.target.value)}
                    required
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                    padding: 4, display: 'flex', alignItems: 'center',
                  }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: -6 }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: 4 }}>
                {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Divider */}
            <div style={{ position: 'relative', textAlign: 'center', margin: '32px 0 24px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#f1f5f9' }} />
              <span style={{ position: 'relative', background: '#fff', padding: '0 16px', fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' }}>
                {mode === 'login' ? 'NEW TO ADOBOOST?' : 'ALREADY HAVE AN ACCOUNT?'}
              </span>
            </div>

            <Link to={mode === 'login' ? '/register' : '/login'} className="alt-link">
              {mode === 'login' ? 'Create a free account' : 'Sign in instead'}
            </Link>

            {mode === 'register' && (
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <a href="#" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms</a>
                {' '}·{' '}
                <a href="#" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</a>
              </p>
            )}

            {/* Trust badge */}
            <div style={{ marginTop: 36, padding: '14px 18px', background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={14} color="#fff" strokeWidth={3} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Trusted by 2,400+ users</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>No credit card required · Cancel anytime</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
