import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSupport } from '../context/SupportContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Send, Mail, Users, MessageSquare,
  Ban, FileText, Settings, HelpCircle, LogOut,
  ChevronDown, ChevronRight, Bell, Star, UserCog,
  CreditCard, Menu, X, Calendar, BarChart2, ShieldCheck, KanbanSquare,
  ShieldAlert, Eye, EyeOff, Lock, CheckCircle2,
  Zap, Database, BarChart, TrendingUp, LogIn, Linkedin, CalendarCheck,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Campaigns', icon: Send, children: [
      { label: 'Campaigns', to: '/campaigns' },
      { label: 'Sending Calendar', to: '/campaigns/calendar' },
      { label: 'Reports', to: '/campaigns/reports' },
    ]
  },
  { label: 'Email Accounts', to: '/email-accounts', icon: Mail },
  { label: 'Contacts', to: '/contacts', icon: Users },
  {
    label: 'Messages', icon: MessageSquare, children: [
      { label: 'Inbox', to: '/messages/inbox' },
      { label: 'Warmer Inbox 🔥', to: '/messages/warmer-inbox' },
      { label: 'Auto Response', to: '/messages/auto-replies' },
      { label: 'Archive', to: '/messages/archive' },
    ]
  },
  { label: 'Pipeline', to: '/pipeline', icon: KanbanSquare },
  { label: 'Booking Calendar', to: '/booking-calendar', icon: CalendarCheck },
  { label: 'LinkedIn', to: '/linkedin', icon: Linkedin },
  {
    label: 'Exclusions', icon: Ban, children: [
      { label: 'Exclusions', to: '/exclusions' },
      { label: 'Unsubscribes', to: '/exclusions/unsubscribes' },
    ]
  },
  { label: 'Templates', to: '/templates', icon: FileText },
  {
    label: 'Settings', icon: Settings, children: [
      { label: 'Billing', to: '/settings/billing' },
      { label: 'Sending Speed', to: '/settings/sending-speed' },
      { label: 'Email Warmup 🔥', to: '/settings/warmup' },
      { label: 'Deliverability 🛡️', to: '/settings/deliverability' },
      { label: 'User Settings', to: '/settings/user' },
      { label: 'User Preferences', to: '/settings/preferences' },
      { label: 'API Key', to: '/settings/api-key' },
      { label: 'Team Members 👥', to: '/settings/team-members' },
    ]
  },
  {
    label: 'Support', icon: HelpCircle, children: [
      { label: 'Submit Ticket', to: '/support/ticket' },
    ]
  },
];

const ADMIN_NAV = [
  { label: 'Overview',         to: '/admin',          icon: ShieldCheck },
  { label: 'Users',            to: '/admin/users',    icon: UserCog },
  { label: 'Plans',            to: '/admin/plans',    icon: CreditCard },
  { label: 'Support Tickets',  to: '/admin/tickets',  icon: HelpCircle },
  { label: 'Admin Team',       to: '/admin/team',     icon: ShieldCheck },
];

function AdoBoostLogo({ collapsed }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <svg width="36" height="36" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
        <circle cx="19" cy="19" r="17" fill="#1d4ed8" />
        <path d="M19 2 A17 17 0 0 1 36 19" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
        <text x="27" y="11" fontSize="6" fill="#fbbf24" textAnchor="middle">★★</text>
        <path d="M8 21 L22 14 L18 24 Z" fill="white"/>
        <path d="M18 24 L14 20 L22 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="14" y1="20" x2="12" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {!collapsed && (
        <div>
          <div style={{ fontFamily:'Georgia, serif', fontWeight:800, fontSize:17, letterSpacing:'-0.5px', lineHeight:1 }}>
            <span style={{ color:'#fff' }}>ado</span><span style={{ color:'#fbbf24' }}>boost</span>
          </div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,0.35)', letterSpacing:'2.5px', marginTop:2, textTransform:'uppercase' }}>by Adobo Solutions</div>
        </div>
      )}
    </div>
  );
}

function PlanBadge({ plan, role }) {
  if (role === 'admin') return (
    <span style={{ fontSize:9, fontWeight:700, background:'#fbbf24', color:'#0f172a', padding:'2px 7px', borderRadius:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>
      Admin
    </span>
  );
  const styles = {
    trial:        { bg:'rgba(255,255,255,0.12)', text:'rgba(255,255,255,0.7)', label:'Trial' },
    starter:      { bg:'rgba(34,197,94,0.2)',    text:'#4ade80',               label:'Starter' },
    professional: { bg:'rgba(37,99,235,0.25)',   text:'#93c5fd',               label:'Pro' },
    unlimited:    { bg:'rgba(251,191,36,0.2)',   text:'#fbbf24',               label:'Unlimited' },
  };
  const s = styles[plan?.toLowerCase()] || styles.trial;
  return (
    <span style={{ fontSize:9, fontWeight:700, background:s.bg, color:s.text, padding:'2px 7px', borderRadius:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>
      {s.label}
    </span>
  );
}

function NavItem({ item, collapsed, badge = 0 }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            width:'100%', padding: collapsed ? '9px 0' : '9px 12px',
            background:'none', border:'none', color:'rgba(255,255,255,0.7)',
            cursor:'pointer', borderRadius:8, fontSize:13, fontFamily:'inherit',
            fontWeight:500, transition:'background 0.15s',
          }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, justifyContent: collapsed ? 'center' : 'flex-start', width:'100%', position:'relative' }}>
            <item.icon size={17} style={{ flexShrink:0 }} />
            {!collapsed && <span>{item.label}</span>}
            {badge > 0 && !collapsed && (
              <span style={{ marginLeft:'auto', background:'#ef4444', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, padding:'1px 6px', minWidth:18, textAlign:'center', lineHeight:'16px' }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            {badge > 0 && collapsed && (
              <span style={{ position:'absolute', top:-4, right:-4, background:'#ef4444', color:'#fff', borderRadius:'50%', fontSize:9, fontWeight:700, width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #0f172a' }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          {!collapsed && (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </button>
        {open && !collapsed && (
          <div style={{ paddingLeft:12, marginTop:2 }}>
            {item.children.map(child => (
              <NavLink key={child.to} to={child.to} style={({ isActive }) => ({
                display:'block', padding:'7px 12px 7px 26px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(37,99,235,0.18)' : 'transparent',
                borderRadius:7, fontSize:12.5, textDecoration:'none',
                fontWeight: isActive ? 600 : 400, transition:'all 0.15s',
                borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom:1,
              })}>
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink to={item.to} style={({ isActive }) => ({
      display:'flex', alignItems:'center', gap:9,
      padding: collapsed ? '9px 0' : '9px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
      background: isActive ? 'rgba(37,99,235,0.18)' : 'transparent',
      borderRadius:8, fontSize:13, textDecoration:'none',
      fontWeight: isActive ? 600 : 500, transition:'all 0.15s',
      borderLeft: isActive ? '2.5px solid #2563eb' : '2.5px solid transparent',
    })}
      onMouseEnter={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background = ''; }}>
      <item.icon size={17} style={{ flexShrink:0 }} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function SupportBanner() {
  const { isSupport, target, expiresAt, exit } = useSupport();
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!isSupport) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [isSupport]);

  if (!isSupport) return null;

  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div style={{
      background:'linear-gradient(90deg,#dc2626 0%,#b91c1c 100%)',
      color:'#fff', padding:'10px 20px',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
      borderBottom:'2px solid #991b1b', fontSize:13, fontWeight:600,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <ShieldAlert size={17} />
        <span><strong>Read-only support session</strong> as {target?.name || 'user'} &lt;{target?.email}&gt;</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ background:'rgba(0,0,0,0.2)', padding:'4px 10px', borderRadius:6, fontFamily:'monospace', fontSize:13 }}>
          ⏱ {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <button onClick={exit} style={{
          background:'#fff', color:'#b91c1c', border:'none',
          borderRadius:6, padding:'6px 14px', fontWeight:700, fontSize:12,
          cursor:'pointer', display:'flex', alignItems:'center', gap:5,
        }}>
          Exit support <X size={13} />
        </button>
      </div>
    </div>
  );
}

function ImpersonateBanner() {
  const navigate = useNavigate();
  const [info, setInfo] = React.useState(null);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const raw = sessionStorage.getItem('ab_impersonating');
    if (raw) { try { setInfo(JSON.parse(raw)); } catch {} }
  }, []);

  React.useEffect(() => {
    if (!info) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [info]);

  if (!info) return null;

  const remaining = Math.max(0, Math.floor((info.expiresAt - now) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const handleExit = () => {
    const backup = sessionStorage.getItem('ab_admin_token_backup');
    sessionStorage.removeItem('ab_admin_token_backup');
    sessionStorage.removeItem('ab_impersonating');
    if (backup) {
      localStorage.setItem('ab_token', backup);
      window.location.replace('/admin/users');
    } else {
      localStorage.removeItem('ab_token');
      window.location.replace('/login');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg,#7c3aed 0%,#5b21b6 100%)',
      color: '#fff', padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      borderBottom: '2px solid #4c1d95', fontSize: 13, fontWeight: 600,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LogIn size={17} />
        <span><strong>Impersonating</strong> {info.name || 'user'} &lt;{info.email}&gt; — full access session</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 13 }}>
          ⏱ {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <button onClick={handleExit} style={{
          background: '#fff', color: '#5b21b6', border: 'none',
          borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: 12,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          Exit Impersonation <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Email verification banner — shown until the user verifies their email ──
function VerifyEmailBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Only for real account owners who are unverified (team members inherit owner)
  if (!user || user.role === 'team_member' || user.email_verified === 1 || user.email_verified === undefined) return null;

  const resend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
      toast.success('Verification email sent — check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send email. Try again shortly.');
    } finally { setSending(false); }
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg,#b45309 0%,#d97706 100%)', color: '#fff',
      padding: '9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, borderBottom: '2px solid #92400e', fontSize: 13, fontWeight: 600, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Mail size={16} />
        <span>Please verify your email to launch campaigns. We sent a link to <strong>{user.email}</strong>.</span>
      </div>
      <button onClick={resend} disabled={sending || sent} style={{
        background: '#fff', color: '#b45309', border: 'none', borderRadius: 6,
        padding: '6px 14px', fontWeight: 700, fontSize: 12,
        cursor: sending || sent ? 'default' : 'pointer', opacity: sending || sent ? 0.75 : 1,
      }}>
        {sent ? '✓ Email sent' : sending ? 'Sending…' : 'Resend verification'}
      </button>
    </div>
  );
}

function SidebarUserFooter({ user, isAdmin }) {
  const support = useSupport();
  const displayName = support.isSupport ? support.target?.name : user?.name;
  const displayEmail = support.isSupport ? support.target?.email : user?.email;
  const initial = (displayName?.[0] || 'U').toUpperCase();

  return (
    <div style={{ padding:'6px 10px', marginBottom:4 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{
          width:30, height:30, borderRadius:'50%', flexShrink:0,
          background: support.isSupport
            ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
            : 'linear-gradient(135deg,#2563eb,#7c3aed)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:13,
        }}>
          {initial}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
            {displayName}
            {support.isSupport
              ? <span style={{ fontSize:8, fontWeight:700, background:'#dc2626', color:'#fff', padding:'1px 5px', borderRadius:6, letterSpacing:'0.05em' }}>VIEWING</span>
              : (isAdmin && <Star size={11} color="#fbbf24" fill="#fbbf24" />)}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayEmail}</div>
        </div>
      </div>
    </div>
  );
}

// ── Plan Usage Progress Bar ──────────────────────
function UsageBar({ label, icon, used, limit, color }) {
  const isUnlimited = limit >= 99999;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const barColor = isUnlimited ? '#10b981' : pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color || '#2563eb';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', fontWeight: 500 }}>
          {icon}
          {label}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: isUnlimited ? '#10b981' : barColor }}>
          {isUnlimited ? `${used.toLocaleString()} / ∞` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: isUnlimited ? '12%' : `${pct}%`,
          background: isUnlimited
            ? 'linear-gradient(90deg,#10b981,#34d399)'
            : pct >= 90
              ? 'linear-gradient(90deg,#ef4444,#f87171)'
              : pct >= 70
                ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                : `linear-gradient(90deg,${barColor},${barColor}cc)`,
          transition: 'width 0.4s ease',
        }}/>
      </div>
      {!isUnlimited && pct >= 90 && (
        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 3, fontWeight: 600 }}>
          ⚠️ Almost at limit — consider upgrading
        </div>
      )}
    </div>
  );
}

// ── Header User Dropdown ─────────────────────────
function UserDropdown({ user, onLogout }) {
  const support = useSupport();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const displayName  = support.isSupport ? support.target?.name  : user?.name;
  const displayEmail = support.isSupport ? support.target?.email : user?.email;
  const initial = (displayName?.[0] || 'U').toUpperCase();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch usage when opened
  useEffect(() => {
    if (!open || usage) return;
    setLoading(true);
    api.get('/usage').then(r => setUsage(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  const planStyles = {
    trial:        { bg: 'rgba(100,116,139,0.15)', text: '#64748b',  label: 'Trial' },
    starter:      { bg: 'rgba(34,197,94,0.12)',   text: '#16a34a',  label: 'Starter' },
    professional: { bg: 'rgba(37,99,235,0.12)',   text: '#2563eb',  label: 'Pro' },
    unlimited:    { bg: 'rgba(251,191,36,0.15)',  text: '#d97706',  label: 'Unlimited' },
  };
  const ps = planStyles[usage?.plan?.toLowerCase()] || planStyles.trial;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Chip button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 4px 4px',
          background: open ? 'var(--bg3)' : 'transparent',
          border: `1px solid ${open ? 'var(--border2)' : 'transparent'}`,
          borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: support.isSupport
            ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
            : 'linear-gradient(135deg,#2563eb,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
          boxShadow: support.isSupport ? '0 2px 8px rgba(220,38,38,0.3)' : '0 2px 8px rgba(37,99,235,0.3)',
        }}>
          {initial}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{displayName}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.2 }}>{displayEmail}</div>
        </div>
        <ChevronDown size={13} color="var(--text3)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 300,
          background: '#fff', borderRadius: 14,
          border: '1px solid var(--border2)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.06)',
          zIndex: 100, overflow: 'hidden',
          animation: 'dropIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* User info header */}
          <div style={{ padding: '14px 16px 12px', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: support.isSupport ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</div>
            </div>
            {usage && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: ps.bg, color: ps.text, flexShrink: 0, border: `1px solid ${ps.text}33` }}>
                {ps.label}
              </span>
            )}
          </div>

          {/* Usage bars */}
          <div style={{ padding: '14px 16px 6px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Plan Usage
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                <div style={{ width: 20, height: 20, border: '2px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : usage ? (
              <>
                <UsageBar
                  label="Contacts"
                  icon={<Users size={11}/>}
                  used={usage.usage.contacts}
                  limit={usage.limits.max_contacts}
                  color="#6366f1"
                />
                <UsageBar
                  label="Campaigns"
                  icon={<Send size={11}/>}
                  used={usage.usage.campaigns}
                  limit={usage.limits.max_campaigns}
                  color="#8b5cf6"
                />
                <UsageBar
                  label="Email Accounts"
                  icon={<Mail size={11}/>}
                  used={usage.usage.email_accounts}
                  limit={usage.limits.max_email_accounts}
                  color="#0ea5e9"
                />
                <UsageBar
                  label="Emails Sent Today"
                  icon={<Zap size={11}/>}
                  used={usage.usage.emails_sent_today}
                  limit={usage.limits.max_emails_per_day}
                  color="#10b981"
                />
              </>
            ) : null}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }}/>

          {/* Action links */}
          <div style={{ padding: '8px 8px 6px' }}>
            {[
              { label: 'Settings', icon: <Settings size={13}/>, to: '/settings/user' },
              { label: 'Billing & Plan', icon: <CreditCard size={13}/>, to: '/settings/billing' },
            ].map(item => (
              <button key={item.label} onClick={() => { setOpen(false); navigate(item.to); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ color: '#64748b' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 2px' }}/>
            <button onClick={() => { setOpen(false); onLogout(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#dc2626', fontFamily: 'inherit', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LogOut size={13}/> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Force Password Change Modal ──────────────────
// Shows after team member first login — blocks all navigation until done.
function ForcePasswordChangeModal() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!user?.mustChangePassword) return null;

  const strength = (p) => {
    if (!p) return { score: 0, label: '', color: '#e2e8f0' };
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { score: s, label: 'Weak', color: '#ef4444' };
    if (s <= 3) return { score: s, label: 'Good', color: '#f59e0b' };
    return { score: s, label: 'Strong', color: '#22c55e' };
  };

  const pw = strength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.put('/team-members/change-password', { password: form.password });
      setDone(true);
      setTimeout(() => {
        updateUser({ mustChangePassword: false });
      }, 1800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.82)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%', maxWidth: 440,
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header strip */}
        <div style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0c1445 100%)',
          padding: '28px 28px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', top:-40, right:-30, width:180, height:180, background:'radial-gradient(circle,rgba(37,99,235,0.25) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:100, width:120, height:120, background:'radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(37,99,235,0.4)' }}>
              <Lock size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>Set Your Password</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>You're using a temporary password</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {done ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <CheckCircle2 size={32} color="#22c55e" />
              </div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0f172a', marginBottom:6 }}>Password Set Successfully!</div>
              <div style={{ fontSize:13, color:'#64748b' }}>Taking you to your dashboard…</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ background:'#fefce8', border:'1px solid #fde047', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#854d0e', lineHeight:1.5 }}>
                🔐 Please create a personal password to secure your account. You won't be able to use the app until this is done.
              </div>

              {/* New password */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>New Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={show1 ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'12px 42px 12px 14px', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#f8fafc', color:'#0f172a', transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShow1(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:2, display:'flex' }}>
                    {show1 ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= pw.score ? pw.color : '#e2e8f0', transition:'background 0.2s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize:11, color: pw.color, fontWeight:600 }}>{pw.label}</div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={show2 ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter your password"
                    required
                    autoComplete="new-password"
                    autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    style={{
                      width:'100%', border:`1.5px solid ${form.confirm && form.confirm !== form.password ? '#ef4444' : form.confirm && form.confirm === form.password ? '#22c55e' : '#e2e8f0'}`,
                      borderRadius:10, padding:'12px 42px 12px 14px', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#f8fafc', color:'#0f172a', transition:'border-color 0.15s',
                    }}
                  />
                  <button type="button" onClick={() => setShow2(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:2, display:'flex' }}>
                    {show2 ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <div style={{ fontSize:11, color:'#ef4444', marginTop:4, fontWeight:500 }}>Passwords don't match</div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'13px', borderRadius:11, border:'none',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)',
                color:'#fff', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', letterSpacing:'-0.01em',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.35)',
                transition:'all 0.15s',
              }}>
                {loading ? 'Setting password…' : '🔒 Set My Password & Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Service Down Overlay ──────────────────────────────────────────────────
function ServiceDownOverlay({ onRetry }) {
  const [countdown, setCountdown] = React.useState(30);
  const [spinning, setSpinning]   = React.useState(false);

  // Auto-countdown and retry
  React.useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { onRetry(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onRetry]);

  const handleRetry = () => {
    setSpinning(true);
    setCountdown(30);
    onRetry();
    setTimeout(() => setSpinning(false), 3000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '44px 48px', maxWidth: 480,
        width: '90%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Animated icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 34,
          boxShadow: '0 8px 24px rgba(251,191,36,0.25)',
        }}>⚡</div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.03em' }}>
          Service Temporarily Unavailable
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
          We're experiencing a brief technical issue. <strong style={{ color: '#0f172a' }}>Your data is safe</strong> and we're reconnecting automatically.
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: spinning ? '#1565C0' : '#e2e8f0',
              animation: spinning ? `pulse ${0.8 + i * 0.3}s infinite alternate` : 'none',
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse{from{opacity:0.3;transform:scale(0.8)}to{opacity:1;transform:scale(1.1)}}`}</style>

        {/* Retry button */}
        <button onClick={handleRetry} style={{
          background: 'linear-gradient(135deg,#1565C0,#0288d1)',
          color: '#fff', border: 'none', borderRadius: 10,
          padding: '12px 32px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          marginBottom: 14, boxShadow: '0 4px 16px rgba(21,101,192,0.3)',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {spinning ? 'Connecting…' : '↺ Try Now'}
        </button>

        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Auto-retrying in <strong style={{ color: '#475569' }}>{countdown}s</strong>
        </p>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [serviceDown, setServiceDown] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Listen for service-down / service-up events fired by api.js
  React.useEffect(() => {
    const onDown = () => setServiceDown(true);
    const onUp   = () => setServiceDown(false);
    window.addEventListener('ab_service_down', onDown);
    window.addEventListener('ab_service_up',   onUp);
    return () => {
      window.removeEventListener('ab_service_down', onDown);
      window.removeEventListener('ab_service_up',   onUp);
    };
  }, []);

  // Manual retry — ping /api/health to check if server is back
  const handleRetry = React.useCallback(async () => {
    try {
      const apiBase = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL)
        ? `${import.meta.env.VITE_API_URL}/api`
        : '/api';
      const r = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        setServiceDown(false);
        window.dispatchEvent(new CustomEvent('ab_service_up'));
      }
    } catch { /* still down — overlay stays */ }
  }, []);

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/messages/inbox', { params: { limit: 1 } })
        .then(r => setUnreadCount(r.data?.unread || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 58 : 234,
        background:'#0f172a',
        display:'flex', flexDirection:'column',
        transition:'width 0.22s ease', flexShrink:0,
        boxShadow:'2px 0 12px rgba(0,0,0,0.25)',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '14px 0' : '14px 14px',
          borderBottom:'1px solid rgba(255,255,255,0.07)',
          display:'flex', alignItems:'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight:62,
        }}>
          <AdoBoostLogo collapsed={collapsed} />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
            {!collapsed && <PlanBadge plan={user?.plan} role={user?.role} />}
            <button onClick={() => setCollapsed(c => !c)} style={{
              background:'none', border:'none', color:'rgba(255,255,255,0.35)',
              cursor:'pointer', padding:4, borderRadius:5, flexShrink:0,
              transition:'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <Menu size={15} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 6px', overflowY:'auto', overflowX:'hidden' }}>
          {/* Create Campaign CTA */}
          {!collapsed && (
            <Link to="/campaigns/new" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              background:'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)',
              color:'#fff', borderRadius:8, padding:'8px 12px',
              fontSize:12, fontWeight:700, marginBottom:12,
              textDecoration:'none', transition:'opacity 0.15s',
              boxShadow:'0 2px 10px rgba(37,99,235,0.35)',
              letterSpacing:'-0.01em',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Send size={12} /> Create New Campaign
            </Link>
          )}

          {NAV.map(item => (
            <NavItem key={item.label} item={item} collapsed={collapsed}
              badge={item.label === 'Messages' ? unreadCount : 0}
            />
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div style={{ margin:'14px 0 8px', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:12 }}>
                {!collapsed && (
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(251,191,36,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 6px 6px' }}>
                    Admin Panel
                  </div>
                )}
              </div>
              {ADMIN_NAV.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/admin'} style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:9,
                  padding: collapsed ? '9px 0' : '8px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#fbbf24' : 'rgba(251,191,36,0.6)',
                  background: isActive ? 'rgba(251,191,36,0.1)' : 'transparent',
                  borderRadius:8, fontSize:12.5, textDecoration:'none',
                  fontWeight: isActive ? 600 : 500, marginBottom:1, transition:'all 0.15s',
                  borderLeft: isActive ? '2.5px solid #fbbf24' : '2.5px solid transparent',
                })}>
                  <item.icon size={16} style={{ flexShrink:0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Footer */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'10px 6px' }}>
          {!collapsed && <SidebarUserFooter user={user} isAdmin={isAdmin} />}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            display:'flex', alignItems:'center', gap:8,
            padding: collapsed ? '9px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width:'100%', background:'none', border:'none',
            borderRadius:7, color:'rgba(255,255,255,0.4)',
            cursor:'pointer', fontSize:13, fontFamily:'inherit',
            transition:'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <LogOut size={15} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <SupportBanner />
        <ImpersonateBanner />
        <VerifyEmailBanner />

        {/* Header */}
        <header style={{
          height:56, background:'#fff',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', flexShrink:0,
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize:13, color:'var(--text3)', fontWeight:500 }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <button style={{
              background:'none', border:'none', cursor:'pointer',
              color:'var(--text3)', position:'relative', padding:6,
              borderRadius:8, transition:'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Bell size={17} />
              <span style={{ position:'absolute', top:4, right:4, width:7, height:7, background:'#ef4444', borderRadius:'50%', border:'2px solid #fff' }} />
            </button>
            <button style={{
              background:'none', border:'none', cursor:'pointer',
              color:'var(--text3)', padding:6, borderRadius:8, transition:'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <HelpCircle size={17} />
            </button>
            <div style={{ width:1, height:24, background:'var(--border)' }} />
            <UserDropdown user={user} onLogout={() => { logout(); navigate('/login'); }} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', background:'var(--bg)', padding:24 }}>
          {children}
        </main>
      </div>

      {/* Force password change — blocks all navigation on first team-member login */}
      <ForcePasswordChangeModal />

      {/* Service down overlay — shown whenever backend is unreachable */}
      {serviceDown && <ServiceDownOverlay onRetry={handleRetry} />}
    </div>
  );
}
