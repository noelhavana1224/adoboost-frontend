import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Send, Mail, Users, MessageSquare,
  Ban, FileText, Settings, HelpCircle, LogOut,
  ChevronDown, ChevronRight, Bell, Star, UserCog,
  CreditCard, Menu, X, Calendar, BarChart2, ShieldCheck, KanbanSquare
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
  { label: 'Overview', to: '/admin', icon: ShieldCheck },
  { label: 'Users', to: '/admin/users', icon: UserCog },
  { label: 'Plans', to: '/admin/plans', icon: CreditCard },
  { label: 'Support Tickets', to: '/admin/tickets', icon: HelpCircle },
  { label: 'Admin Team',      to: '/admin/team',    icon: ShieldCheck },
];

// AdoBoost Logo SVG — Concept C style
function AdoBoostLogo({ collapsed }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {/* Circle icon with flag colors + paper plane */}
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
        {/* Base circle */}
        <circle cx="19" cy="19" r="17" fill="#0038A8" />
        {/* Red arc top right */}
        <path d="M19 2 A17 17 0 0 1 36 19" fill="none" stroke="#CE1126" strokeWidth="4" strokeLinecap="round"/>
        {/* Gold stars */}
        <text x="27" y="11" fontSize="6" fill="#FCD116" textAnchor="middle">★★</text>
        {/* Paper plane white */}
        <path d="M8 21 L22 14 L18 24 Z" fill="white"/>
        <path d="M18 24 L14 20 L22 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="14" y1="20" x2="12" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>

      {!collapsed && (
        <div>
          <div style={{ fontFamily:'Georgia, serif', fontWeight:800, fontSize:18, letterSpacing:'-0.5px', lineHeight:1 }}>
            <span style={{ color:'#fff' }}>ado</span><span style={{ color:'#FCD116' }}>boost</span>
          </div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,0.5)', letterSpacing:'3px', marginTop:2, textTransform:'uppercase' }}>by Adobo Solutions</div>
        </div>
      )}
    </div>
  );
}

// Plan badge with colors per plan
function PlanBadge({ plan, role }) {
  if (role === 'admin') return (
    <span style={{ fontSize:9, fontWeight:700, background:'#FCD116', color:'#1a1a2e', padding:'2px 7px', borderRadius:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>
      Admin
    </span>
  );
  const styles = {
    trial:      { bg:'rgba(255,255,255,0.2)',  text:'rgba(255,255,255,0.8)', label:'Trial' },
    starter:    { bg:'#38a169',                text:'#fff',                  label:'Starter' },
    professional:{ bg:'#0038A8',              text:'#fff',                  label:'Pro' },
    unlimited:  { bg:'#FCD116',               text:'#1a1a2e',               label:'Unlimited' },
  };
  const s = styles[plan?.toLowerCase()] || styles.trial;
  return (
    <span style={{ fontSize:9, fontWeight:700, background:s.bg, color:s.text, padding:'2px 7px', borderRadius:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>
      {s.label}
    </span>
  );
}

function NavItem({ item, collapsed }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button onClick={() => setOpen(o => !o)} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          width:'100%', padding: collapsed ? '10px 0' : '10px 14px',
          background:'none', border:'none', color:'rgba(255,255,255,0.85)',
          cursor:'pointer', borderRadius:7, fontSize:13.5, fontFamily:'inherit',
          fontWeight:500, transition:'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
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
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
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
      color: isActive ? '#fff' : 'rgba(255,255,255,0.85)',
      background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
      borderRadius:7, fontSize:13.5, textDecoration:'none',
      fontWeight: isActive ? 600 : 500, transition:'all 0.15s',
      borderLeft: isActive ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
    })}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.background=''; }}>
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
        background:'#0D47A1',
        display:'flex', flexDirection:'column',
        transition:'width 0.2s ease', flexShrink:0,
        boxShadow:'2px 0 8px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '14px 0' : '14px 16px',
          borderBottom:'1px solid rgba(255,255,255,0.12)',
          display:'flex', alignItems:'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight:64,
        }}>
          <AdoBoostLogo collapsed={collapsed} />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
            {!collapsed && (
              <PlanBadge plan={user?.plan} role={user?.role} />
            )}
            <button onClick={() => setCollapsed(c => !c)} style={{
              background:'none', border:'none', color:'rgba(255,255,255,0.5)',
              cursor:'pointer', padding:4, borderRadius:4, flexShrink:0,
            }}>
              <Menu size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto', overflowX:'hidden' }}>
          {/* Create Campaign Button */}
          {!collapsed && (
            <Link to="/campaigns/new" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              background:'rgba(255,255,255,0.15)', color:'#fff',
              border:'1px solid rgba(255,255,255,0.25)',
              borderRadius:8, padding:'9px', fontSize:12, fontWeight:700,
              marginBottom:14, textDecoration:'none', transition:'background 0.15s',
            }}>
              <Send size={13} /> Create New Campaign
            </Link>
          )}

          {NAV.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div style={{ margin:'14px 0 8px', borderTop:'1px solid rgba(255,255,255,0.15)', paddingTop:12 }}>
                {!collapsed && (
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,215,0,0.6)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 6px 6px' }}>
                    Admin Panel
                  </div>
                )}
              </div>
              {ADMIN_NAV.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to==='/admin'} style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:10,
                  padding: collapsed ? '10px 0' : '9px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#FCD116' : 'rgba(255,215,0,0.7)',
                  background: isActive ? 'rgba(255,215,0,0.12)' : 'transparent',
                  borderRadius:7, fontSize:13, textDecoration:'none',
                  fontWeight: isActive ? 600 : 500, marginBottom:1, transition:'all 0.15s',
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
            <div style={{ padding:'6px 10px', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{user?.name}</div>
                {isAdmin && <Star size={12} color="#FCD116" fill="#FCD116" />}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            display:'flex', alignItems:'center', gap:8,
            padding: collapsed ? '9px 0' : '9px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width:'100%', background:'none', border:'none',
            borderRadius:7, color:'rgba(255,255,255,0.55)',
            cursor:'pointer', fontSize:13, fontFamily:'inherit',
            transition:'color 0.15s',
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
          height:56, background:'#fff', borderBottom:'1px solid #e2e8f0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize:13, color:'#718096' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'#718096', position:'relative', padding:4 }}>
              <Bell size={18} />
              <span style={{ position:'absolute', top:0, right:0, width:8, height:8, background:'#e53e3e', borderRadius:'50%', border:'2px solid #fff' }} />
            </button>
            <HelpCircle size={18} color="#718096" style={{ cursor:'pointer' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:34, height:34, background:'#0D47A1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#1a202c' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'#718096' }}>{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', background:'#f0f4f8', padding:24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
