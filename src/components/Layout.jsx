import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSupport } from '../context/SupportContext';
import {
  LayoutDashboard, Send, Mail, Users, MessageSquare,
  Ban, FileText, Settings, HelpCircle, LogOut,
  ChevronDown, ChevronRight, Bell, Star, UserCog,
  CreditCard, Menu, X, Calendar, BarChart2, ShieldCheck, KanbanSquare,
  ShieldAlert
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
      { label: 'Auto-replies', to: '/messages/auto-replies' },
    ]
  },
  { label: 'Pipeline', to: '/pipeline', icon: KanbanSquare },
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

function HeaderUserChip({ user }) {
  const support = useSupport();
  const displayName = support.isSupport ? support.target?.name : user?.name;
  const displayEmail = support.isSupport ? support.target?.email : user?.email;
  const initial = (displayName?.[0] || 'U').toUpperCase();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{
        width:34, height:34, borderRadius:'50%',
        background: support.isSupport
          ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
          : 'linear-gradient(135deg,#2563eb,#7c3aed)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontWeight:700, fontSize:14,
        boxShadow: support.isSupport ? '0 2px 8px rgba(220,38,38,0.3)' : '0 2px 8px rgba(37,99,235,0.3)',
      }}>
        {initial}
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.01em' }}>{displayName}</div>
        <div style={{ fontSize:11, color:'var(--text3)' }}>{displayEmail}</div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = user?.role === 'admin';

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
            <HeaderUserChip user={user} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', background:'var(--bg)', padding:24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
