import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import SendingCalendar from './pages/Calendar';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminTickets from './pages/admin/AdminTickets';
import Pipeline from './pages/Pipeline';

function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
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
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration:4000, style:{ fontSize:13, borderRadius:10 } }} />
        <Routes>
          <Route path="/login"    element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main App */}
          <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/campaigns"           element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns/new"       element={<ProtectedRoute><Campaigns showCreate /></ProtectedRoute>} />
          <Route path="/campaigns/calendar"  element={<ProtectedRoute><SendingCalendar /></ProtectedRoute>} />
          <Route path="/campaigns/reports"   element={<ProtectedRoute><ReportsPlaceholder /></ProtectedRoute>} />
          <Route path="/email-accounts"      element={<ProtectedRoute><EmailAccounts /></ProtectedRoute>} />
          <Route path="/contacts"            element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/messages/inbox"      element={<ProtectedRoute><Messages type="inbox" /></ProtectedRoute>} />
          <Route path="/messages/auto-replies" element={<ProtectedRoute><Messages type="auto-replies" /></ProtectedRoute>} />
          <Route path="/pipeline"            element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/exclusions"          element={<ProtectedRoute><Exclusions type="exclusions" /></ProtectedRoute>} />
          <Route path="/exclusions/unsubscribes" element={<ProtectedRoute><Exclusions type="unsubscribes" /></ProtectedRoute>} />
          <Route path="/templates"           element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/settings/billing"    element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/settings/sending-speed" element={<ProtectedRoute><SendingSpeed /></ProtectedRoute>} />
          <Route path="/settings/user"       element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
          <Route path="/settings/preferences" element={<ProtectedRoute><UserPreferences /></ProtectedRoute>} />
          <Route path="/settings/sub-accounts" element={<ProtectedRoute><SubAccountsPlaceholder /></ProtectedRoute>} />
          <Route path="/settings/api-key"    element={<ProtectedRoute><ApiKey /></ProtectedRoute>} />
          <Route path="/support/ticket"      element={<ProtectedRoute><Support /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"           element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"     element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/plans"     element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />
          <Route path="/admin/tickets"   element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
