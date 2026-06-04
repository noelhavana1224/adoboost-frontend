import React, { Suspense } from 'react';

// ── Error boundary — catches render errors instead of blank white screen ──
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error('[ErrorBoundary]', err, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding:40, fontFamily:'sans-serif', textAlign:'center' }}>
        <h2 style={{ color:'#dc2626' }}>Something went wrong</h2>
        <pre style={{ background:'#f1f5f9', padding:16, borderRadius:8, textAlign:'left', fontSize:12, overflowX:'auto', maxWidth:700, margin:'0 auto' }}>
          {this.state.error?.message}{'\n'}{this.state.error?.stack?.split('\n').slice(0,5).join('\n')}
        </pre>
        <button onClick={() => window.location.reload()} style={{ marginTop:16, padding:'10px 20px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>
          Reload Page
        </button>
      </div>
    );
    return this.props.children;
  }
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SupportProvider } from './context/SupportContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import EmailAccounts from './pages/EmailAccounts';
import Contacts from './pages/Contacts';
import Messages from './pages/Messages';
import Exclusions from './pages/Exclusions';
import Templates from './pages/Templates';
import Support from './pages/Support';
import { Billing, UserSettings, UserPreferences, ApiKey } from './pages/Settings';
import SendingSpeed from './pages/SendingSpeed';
import Reports from './pages/Reports';
import TeamMembers from './pages/TeamMembers';
import AdminTeam from './pages/admin/AdminTeam';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Warmup from './pages/Warmup';
import SendingCalendar from './pages/Calendar';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminTickets from './pages/admin/AdminTickets';
import Pipeline from './pages/Pipeline';
import VAUpsell from './pages/VAUpsell';
import SupportEntry from './pages/SupportEntry';
import ImpersonateEntry from './pages/ImpersonateEntry';
import LinkedIn from './pages/LinkedIn';
import WarmerInbox from './pages/WarmerInbox';
import Deliverability from './pages/Deliverability';
import Leads from './pages/Leads';
const BookingCalendarPage = React.lazy(() => import('./pages/BookingCalendar'));
const PublicBooking        = React.lazy(() => import('./pages/PublicBooking'));

function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

// Protected but without the Layout chrome (for standalone screens like onboarding)
function RawProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function CalendarPlaceholder() {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Sending Calendar</h2>
      <p style={{ color:'var(--text3)' }}>View your campaign schedule. Coming soon!</p>
    </div>
  );
}

function ReportsPlaceholder() {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Campaign Reports</h2>
      <p style={{ color:'var(--text3)' }}>Detailed campaign reporting. Coming soon!</p>
    </div>
  );
}

function SubAccountsPlaceholder() {
  return (
    <div>
      <div style={{ marginBottom:24 }}><h1 style={{ fontSize:20, fontWeight:700 }}>Sub Account Management</h1><p style={{ color:'var(--text3)', fontSize:13 }}>Add sub-accounts that can create campaigns and manage your data.</p></div>
      <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:12, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
        <h3 style={{ fontWeight:600, marginBottom:8 }}>No sub-accounts yet</h3>
        <p style={{ color:'var(--text3)', fontSize:13 }}>Sub-account feature available on Professional and Unlimited plans.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <SupportProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration:4000, style:{ fontSize:13, borderRadius:10 } }} />
        <Routes>
          <Route path="/login"           element={<Auth mode="login" />} />
          <Route path="/register"        element={<Auth mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="/welcome-va"      element={<ProtectedRoute><VAUpsell /></ProtectedRoute>} />
          <Route path="/support/entry"     element={<SupportEntry />} />
          <Route path="/impersonate-entry" element={<ImpersonateEntry />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main App */}
          <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/campaigns"           element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns/new"       element={<ProtectedRoute><Campaigns showCreate /></ProtectedRoute>} />
          <Route path="/campaigns/calendar"  element={<ProtectedRoute><SendingCalendar /></ProtectedRoute>} />
          <Route path="/campaigns/reports"   element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/email-accounts"      element={<ProtectedRoute><EmailAccounts /></ProtectedRoute>} />
          <Route path="/contacts"            element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/messages/inbox"        element={<ProtectedRoute><Messages type="inbox" /></ProtectedRoute>} />
          <Route path="/messages/auto-replies" element={<ProtectedRoute><Messages type="auto-replies" /></ProtectedRoute>} />
          <Route path="/messages/archive"      element={<ProtectedRoute><Messages type="archive" /></ProtectedRoute>} />
          <Route path="/messages/warmer-inbox" element={<ProtectedRoute><WarmerInbox /></ProtectedRoute>} />
          <Route path="/leads"                 element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/pipeline"            element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/booking-calendar"   element={<ProtectedRoute><Suspense fallback={null}><BookingCalendarPage /></Suspense></ProtectedRoute>} />
          <Route path="/linkedin"            element={<ProtectedRoute><LinkedIn /></ProtectedRoute>} />
          <Route path="/exclusions"          element={<ProtectedRoute><Exclusions type="exclusions" /></ProtectedRoute>} />
          <Route path="/exclusions/unsubscribes" element={<ProtectedRoute><Exclusions type="unsubscribes" /></ProtectedRoute>} />
          <Route path="/templates"           element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/settings/billing"    element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/settings/sending-speed" element={<ProtectedRoute><SendingSpeed /></ProtectedRoute>} />
          <Route path="/settings/warmup"        element={<ProtectedRoute><Warmup /></ProtectedRoute>} />
          <Route path="/settings/deliverability" element={<ProtectedRoute><Deliverability /></ProtectedRoute>} />
          <Route path="/settings/user"       element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
          <Route path="/settings/preferences" element={<ProtectedRoute><UserPreferences /></ProtectedRoute>} />
          <Route path="/settings/team-members" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
          <Route path="/settings/api-key"    element={<ProtectedRoute><ApiKey /></ProtectedRoute>} />
          <Route path="/support/ticket"      element={<ProtectedRoute><Support /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"           element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"     element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/plans"     element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />
          <Route path="/admin/tickets"   element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />
          <Route path="/admin/team"      element={<ProtectedRoute adminOnly><AdminTeam /></ProtectedRoute>} />

          {/* Public booking page — no auth required */}
          <Route path="/book/:slug" element={
            <Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:80}}><div style={{width:32,height:32,border:'3px solid #1d4ed8',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
              <PublicBooking />
            </Suspense>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </SupportProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
