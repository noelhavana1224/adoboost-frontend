import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Send, Mail, Users, MessageSquare,
  Ban, FileText, Settings, HelpCircle, LogOut,
  ChevronDown, ChevronRight, Bell, Crown, UserCog,
  CreditCard, Menu, X, Zap, Calendar, BarChart3,
  Shield
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
      { label: 'User Settings', to: '/settings/user' },
      { label: 'User Preferences', to: '/settings/preferences' },
      { label: 'API Key', to: '/settings/api-key' },
    ]
  },
  {
    label: 'Support', icon: HelpCircle, children: [
      { label: 'Submit Ticket', to: '/support/ticket' },
    ]
  },
];

const ADMIN_NAV = [
  { label: 'Overview', to: '/admin', icon: Shield },
  { label: 'Users', to: '/admin/users', icon: UserCog },
  { label: 'Plans', to: '/admin/plans', icon: CreditCard },
  { label: 'Support Tickets', to: '/admin/tickets', icon: HelpCircle },
];

function NavItem({ item, collapsed }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button onClick={() => setOpen(o => !o)} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          width:'100%', padding: collapsed ? '10px 0' : '10px 14px',
          background:'none', border:'none', color:'var(--sidebar-text)',
          cursor:'pointer', borderRadius:7, fontSize:13.5, fontFamily:'inherit',
          fontWeight:500, transition:'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='var(--sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}>
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent: collapsed?'center':'flex-start', width:'100%' }}>
            <item.icon size={18} style={{ flexShrink:0 }} />
            {!collapsed && <span>{item.label}</span>}
          </div>
          {!collapsed && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>
        {open && !collapsed && (
          <div style={{ paddingLeft:14, marginTop:2 }}>
            {item.children.map(child => (
              <NavLink key={child.to} to={child.to} style={({ isActive }) => ({
                display:'block', padding:'8px 14px 8px 28px',
                color: isActive ? '#fff' : 'var(--sidebar-text-muted)',
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                borderRadius:6, fontSize:13, textDecoration:'none',
                fontWeight: isActive ? 600 : 400, transition:'all 0.15s',
                borderLeft: isActive ? '3px solid rgba(255,255,255,0.8)' : '3px solid transparent',
                marginBottom:1,
              })}>{child.label}</NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink to={item.to} style={({ isActive }) => ({
      display:'flex', alignItems:'center', gap:10,
      padding: collapsed ? '10px 0' : '10px 14px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      color: isActive ? '#fff' : 'var(--sidebar-text)',
      background: isActive ? 'var(--sidebar-active)' : 'transparent',
      borderRadius:7, fontSize:13.5, textDecoration:'none',
      fontWeight: isActive ? 600 : 500, transition:'all 0.15s',
      borderLeft: isActive ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
      marginLeft: isActive ? 0 : 0,
    })}
      onMouseEnter={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background='var(--sidebar-hover)'; }}
      onMouseLeave={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background=''; }}>
      <item.icon size={18} style={{ flexShrink:0 }} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 240,
        background:'var(--sidebar-bg)',
        display:'flex', flexDirection:'column',
        transition:'width 0.2s ease', flexShrink:0,
        boxShadow:'2px 0 8px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 18px',
          borderBottom:'1px solid rgba(255,255,255,0.12)',
          display:'flex', alignItems:'center', gap:10,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:32, height:32, background:'#fff', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap size={18} color="var(--primary)" fill="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:'#fff', letterSpacing:'-0.3px' }}>AdoBoost</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:-1 }}>{user?.plan || 'Trial'}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width:32, height:32, background:'#fff', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={18} color="var(--primary)" fill="var(--primary)" />
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', padding:4, borderRadius:4 }}>
            <Menu size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto', overflowX:'hidden' }}>
          {/* Create Campaign Button */}
          {!collapsed && (
            <Link to="/campaigns/new" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'#fff', color:'var(--primary)', borderRadius:8, padding:'10px', fontSize:13, fontWeight:700, marginBottom:14, textDecoration:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
              <Send size={14} /> Create New Campaign
            </Link>
          )}

          {NAV.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div style={{ margin:'14px 0 8px', borderTop:'1px solid rgba(255,255,255,0.15)', paddingTop:12 }}>
                {!collapsed && <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 6px 6px' }}>Admin Panel</div>}
              </div>
              {ADMIN_NAV.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to==='/admin'} style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:10,
                  padding: collapsed ? '10px 0' : '9px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#fff' : 'rgba(255,215,0,0.75)',
                  background: isActive ? 'rgba(255,215,0,0.15)' : 'transparent',
                  borderRadius:7, fontSize:13, textDecoration:'none', fontWeight: isActive?600:500,
                  marginBottom:1, transition:'all 0.15s',
                })}>
                  <item.icon size={16} style={{ flexShrink:0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Footer */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.12)', padding:'10px 8px' }}>
          {!collapsed && (
            <div style={{ padding:'8px 10px', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{user?.name}</div>
                {isAdmin && <Crown size={12} color="gold" />}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            display:'flex', alignItems:'center', gap:8,
            padding: collapsed ? '9px 0' : '9px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width:'100%', background:'none', border:'none',
            borderRadius:7, color:'rgba(255,255,255,0.6)',
            cursor:'pointer', fontSize:13, fontFamily:'inherit',
          }}>
            <LogOut size={16} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <header style={{
          height:56, background:'var(--bg2)', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', flexShrink:0, boxShadow:'var(--shadow)',
        }}>
          <div style={{ fontSize:13, color:'var(--text3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', position:'relative', padding:4 }}>
              <Bell size={18} />
              <span style={{ position:'absolute', top:0, right:0, width:8, height:8, background:'var(--red)', borderRadius:'50%', border:'2px solid var(--bg2)' }} />
            </button>
            <HelpCircle size={18} color="var(--text2)" style={{ cursor:'pointer' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <div style={{ width:32, height:32, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{user?.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{user?.email}</div>
                </div>
              )}
            </div>
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
