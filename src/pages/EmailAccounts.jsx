import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner, Modal, Input, Alert } from '../components/UI';
import {
  Mail, Plus, Trash2, CheckCircle, XCircle, Loader2,
  Edit2, Inbox, PenLine, ChevronDown, X, Zap, Clock,
  ShieldCheck, TrendingUp, RefreshCw, Wifi, WifiOff,
  Settings, Send, Flame, ChevronRight, AlertTriangle,
} from 'lucide-react';

// ── Sending Presets ──────────────────────────────
const PRESETS = {
  safe: {
    label: 'Safe', emoji: '🛡️',
    color: '#16a34a', bg: '#f0fff4', border: '#86efac',
    daily_limit: 15, emails_per_hour: 3, delay_min: 120, delay_max: 300,
    send_window_start: 9, send_window_end: 17,
    desc: 'Best for new/cold domains. Slow ramp-up, maximum deliverability.',
  },
  moderate: {
    label: 'Moderate', emoji: '⚡',
    color: '#2563eb', bg: '#eff6ff', border: '#93c5fd',
    daily_limit: 40, emails_per_hour: 6, delay_min: 60, delay_max: 180,
    send_window_start: 8, send_window_end: 18,
    desc: 'Balanced for warmed-up domains. Good deliverability + volume.',
  },
  aggressive: {
    label: 'Aggressive', emoji: '🚀',
    color: '#dc2626', bg: '#fff5f5', border: '#fca5a5',
    daily_limit: 100, emails_per_hour: 15, delay_min: 25, delay_max: 75,
    send_window_start: 7, send_window_end: 20,
    desc: 'High volume. Only for fully warmed-up & established domains.',
  },
  auto_warmer: {
    label: 'Auto Warmer', emoji: '🔥',
    color: '#d97706', bg: '#fffbeb', border: '#fcd34d',
    daily_limit: 10, emails_per_hour: 2, delay_min: 180, delay_max: 420,
    send_window_start: 9, send_window_end: 17,
    desc: 'Warmup-focused. Ultra-conservative. Enables warmup automatically.',
  },
};

// ── SMTP provider presets ────────────────────────
const SMTP_PRESETS = {
  hostinger: { host:'smtp.hostinger.com', port:465, secure:true, imap_host:'imap.hostinger.com', imap_port:993, imap_secure:true, hint:'Use your full Hostinger email as username and your Hostinger email password.' },
  gmail:     { host:'smtp.gmail.com', port:587, secure:false, imap_host:'imap.gmail.com', imap_port:993, imap_secure:true, hint:'MUST use an App Password — go to myaccount.google.com → Security → 2-Step Verification → App passwords. Also enable IMAP in Gmail Settings.' },
  outlook:   { host:'smtp.office365.com', port:587, secure:false, imap_host:'outlook.office365.com', imap_port:993, imap_secure:true, hint:'Use your full Microsoft email. If using 2FA, create an App Password in Microsoft account security settings.' },
  yahoo:     { host:'smtp.mail.yahoo.com', port:465, secure:true, imap_host:'imap.mail.yahoo.com', imap_port:993, imap_secure:true, hint:'Go to Yahoo Account Security → Generate App Password. Use that here instead of your regular Yahoo password.' },
  smtp:      { host:'', port:587, secure:false, imap_host:'', imap_port:993, imap_secure:true, hint:'Enter your mail server details. Contact your hosting provider for the correct SMTP/IMAP settings.' },
};

function avatarColor(str) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) h = (str||'').charCodeAt(i) + ((h<<5) - h);
  return colors[Math.abs(h) % colors.length];
}
function initials(s) { return (s||'?').charAt(0).toUpperCase(); }
function fmtHour(h) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h-12}pm`;
}

// ── Health bar ───────────────────────────────────
function MiniBar({ value, max, color = '#2563eb', label, warn = 70 }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColor = pct >= 95 ? '#ef4444' : pct >= warn ? '#f59e0b' : color;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#64748b', marginBottom:2 }}>
        <span>{label}</span>
        <span style={{ fontWeight:600, color: barColor }}>{value} / {max}</span>
      </div>
      <div style={{ height:4, borderRadius:2, background:'#e2e8f0', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:2, background:barColor, transition:'width 0.3s' }}/>
      </div>
    </div>
  );
}

// ── Account Card ─────────────────────────────────
function AccountCard({ account, onEdit, onDelete, onTest, onSync, onSignature, testStatus, syncing }) {
  const preset = PRESETS[account.sending_preset] || PRESETS.moderate;
  const color  = avatarColor(account.from_email);
  const hasImap = !!account.imap_host;

  return (
    <div
      onClick={() => onEdit(account)}
      style={{
        background:'#fff', borderRadius:14, border:'1px solid #e2e8f0',
        padding:'18px 18px 14px', cursor:'pointer', transition:'all 0.15s',
        boxShadow:'0 2px 6px rgba(0,0,0,0.04)',
        display:'flex', flexDirection:'column', gap:12,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='none'; }}
    >
      {/* Header row */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:42, height:42, borderRadius:11, background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0, boxShadow:'0 2px 6px rgba(0,0,0,0.15)' }}>
          {initials(account.from_name || account.from_email)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{account.name}</div>
          <div style={{ fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{account.from_email}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:8, background:preset.bg, color:preset.color, border:`1px solid ${preset.border}` }}>
            {preset.emoji} {preset.label}
          </span>
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, fontWeight:600, background: account.status === 'active' ? '#f0fff4' : '#fef9c3', color: account.status === 'active' ? '#16a34a' : '#92400e', border: `1px solid ${account.status === 'active' ? '#86efac' : '#fde047'}` }}>
            {account.status === 'active' ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>

      {/* Daily limit progress */}
      <MiniBar value={account.sent_today || 0} max={account.daily_limit || 50} label="Sent today" color="#2563eb"/>

      {/* Info row */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 7px', borderRadius:6, background:'#f1f5f9', color:'#475569' }}>
          <Clock size={9}/>{fmtHour(account.send_window_start ?? 8)}–{fmtHour(account.send_window_end ?? 17)}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 7px', borderRadius:6, background:'#f1f5f9', color:'#475569' }}>
          <Zap size={9}/>{account.daily_limit}/day
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 7px', borderRadius:6, background: hasImap ? '#f0fff4' : '#f1f5f9', color: hasImap ? '#16a34a' : '#94a3b8' }}>
          {hasImap ? <Wifi size={9}/> : <WifiOff size={9}/>}{hasImap ? 'IMAP ✓' : 'No IMAP'}
        </span>
        {account.warmup_enabled === 1 && (
          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 7px', borderRadius:6, background:'#fffbeb', color:'#d97706' }}>
            <Flame size={9}/>{account.warmup_health || 0}% health
          </span>
        )}
      </div>

      {/* Warmup health bar */}
      {account.warmup_enabled === 1 && (
        <MiniBar value={account.warmup_health || 0} max={100} label="Warmup health" color="#f59e0b" warn={60}/>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', borderTop:'1px solid #f1f5f9', paddingTop:10, marginTop:-4 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onTest(account.id)} title="Test SMTP"
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', fontSize:11, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
          onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
          {testStatus === 'loading' ? <Loader2 size={10} style={{ animation:'spin 1s linear infinite' }}/> : testStatus === 'ok' ? <CheckCircle size={10} color="#16a34a"/> : testStatus === 'error' ? <XCircle size={10} color="#dc2626"/> : <CheckCircle size={10}/>}
          SMTP Test
        </button>
        {hasImap && (
          <button onClick={() => onSync(account.id)} disabled={syncing} title="Sync inbox"
            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', fontSize:11, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
            {syncing ? <Loader2 size={10} style={{ animation:'spin 1s linear infinite' }}/> : <Inbox size={10}/>} Sync
          </button>
        )}
        <button onClick={() => onEdit(account)} title="Edit account"
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', fontSize:11, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
          onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
          <Edit2 size={10}/> Edit
        </button>
        <button onClick={() => onSignature(account)} title="Edit signature"
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', fontSize:11, color:'#7c3aed', cursor:'pointer', fontFamily:'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.background='#f5f3ff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fff'; }}>
          <PenLine size={10}/> Signature
        </button>
        <button onClick={() => onDelete(account.id)} title="Remove account"
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff', fontSize:11, color:'#dc2626', cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}
          onMouseEnter={e => e.currentTarget.style.background='#fff5f5'}
          onMouseLeave={e => e.currentTarget.style.background='#fff'}>
          <Trash2 size={10}/> Remove
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────
export default function EmailAccounts() {
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [drawerAccount, setDrawerAccount] = useState(null); // null = closed, {} = new, account = edit
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sigAccount, setSigAccount] = useState(null);
  const [testStatus, setTestStatus] = useState({});
  const [syncing, setSyncing]       = useState({});

  const load = useCallback(() => {
    api.get('/email-accounts').then(r => setAccounts(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setDrawerAccount({}); setDrawerOpen(true); };
  const openEdit = (acc) => { setDrawerAccount(acc); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setDrawerAccount(null), 300); };

  const handleTest = async (id) => {
    setTestStatus(s => ({ ...s, [id]: 'loading' }));
    try {
      await api.post(`/email-accounts/${id}/test`);
      setTestStatus(s => ({ ...s, [id]: 'ok' }));
      toast.success('SMTP connection successful! ✅');
    } catch (err) {
      setTestStatus(s => ({ ...s, [id]: 'error' }));
      toast.error(err.response?.data?.error || 'SMTP connection failed');
    }
    setTimeout(() => setTestStatus(s => ({ ...s, [id]: null })), 5000);
  };

  const handleSync = async (id) => {
    setSyncing(s => ({ ...s, [id]: true }));
    try {
      const { data } = await api.post(`/email-accounts/${id}/sync-inbox`);
      toast.success(`Inbox synced! ${data.synced} new message${data.synced !== 1 ? 's' : ''}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'IMAP sync failed — check IMAP settings');
    }
    setSyncing(s => ({ ...s, [id]: false }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this email account?')) return;
    try { await api.delete(`/email-accounts/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:0, letterSpacing:'-0.02em' }}>Email Accounts</h1>
          <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            {accounts.length > 0 && ` · ${accounts.reduce((s,a) => s + (a.sent_today||0), 0)} emails sent today`}
          </p>
        </div>
        <button onClick={openNew}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 10px rgba(37,99,235,0.35)' }}>
          <Plus size={14}/> Add Account
        </button>
      </div>

      {/* Gmail tip */}
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'11px 16px', marginBottom:20, fontSize:12.5, color:'#1d4ed8', display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:16, lineHeight:1 }}>💡</span>
        <div>
          <strong>Gmail users:</strong> You must use an <strong>App Password</strong> — <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color:'#2563eb' }}>create one here</a>.
          Also enable IMAP: Gmail Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP.
        </div>
      </div>

      {/* Account grid */}
      {accounts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:14, border:'2px dashed #e2e8f0' }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Mail size={26} color="#2563eb"/>
          </div>
          <div style={{ fontWeight:700, fontSize:16, color:'#1e293b', marginBottom:6 }}>No email accounts yet</div>
          <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Connect an SMTP account to start sending campaigns.</div>
          <button onClick={openNew} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', background:'#2563eb', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <Plus size={14}/> Add First Account
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {accounts.map(a => (
            <AccountCard key={a.id} account={a}
              onEdit={openEdit} onDelete={handleDelete}
              onTest={handleTest} onSync={handleSync}
              onSignature={setSigAccount}
              testStatus={testStatus[a.id]} syncing={syncing[a.id]}
            />
          ))}
        </div>
      )}

      {/* Slide-out drawer */}
      <AccountDrawer
        open={drawerOpen}
        account={drawerAccount}
        onClose={closeDrawer}
        onSaved={() => { closeDrawer(); load(); }}
      />

      {/* Signature editor */}
      <SignatureModal
        account={sigAccount}
        onClose={() => setSigAccount(null)}
        onSaved={() => { setSigAccount(null); load(); }}
      />
    </div>
  );
}

// ── Account Drawer (slide-out from right) ────────
function AccountDrawer({ open, account, onClose, onSaved }) {
  const isEdit = !!(account?.id);
  const [tab, setTab] = useState('settings'); // settings | sending | warmup
  const [provider, setProvider] = useState('hostinger');
  const [form, setForm] = useState({
    name:'', host:'smtp.hostinger.com', port:465, secure:true,
    imap_host:'imap.hostinger.com', imap_port:993, imap_secure:true,
    username:'', password:'', from_name:'', from_email:'',
    daily_limit:40, emails_per_hour:6, delay_min:60, delay_max:180,
    send_window_start:8, send_window_end:18, sending_preset:'moderate',
    warmup_enabled:0, warmup_start_count:5, warmup_increment:3, warmup_max_count:40,
    warmup_window_start:9, warmup_window_end:17,
  });
  const [imapPassword, setImapPassword] = useState('');
  const [showImap, setShowImap] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [smtpTest, setSmtpTest] = useState(null);
  const [imapTest, setImapTest] = useState(null);
  const [smtpError, setSmtpError] = useState('');
  const [imapError, setImapError] = useState('');
  const [showSig, setShowSig]   = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setTab('settings');
    setSmtpTest(null); setImapTest(null);
    setSmtpError(''); setImapError('');
    setImapPassword('');
    if (account?.id) {
      const smtpSecure = account.secure === 1 || account.secure === true || account.port === 465;
      const imapPort   = account.imap_port || 993;
      const imapSecure = account.imap_secure === 1 || account.imap_secure === true || imapPort === 993;
      setForm({
        name: account.name||'', host: account.host||'', port: account.port||587,
        secure: smtpSecure,
        imap_host: account.imap_host||'', imap_port: imapPort, imap_secure: imapSecure,
        username: account.username||'', password: '',
        from_name: account.from_name||'', from_email: account.from_email||'',
        daily_limit: account.daily_limit||40,
        emails_per_hour: account.emails_per_hour||6,
        delay_min: account.delay_min||60, delay_max: account.delay_max||180,
        send_window_start: account.send_window_start ?? 8,
        send_window_end:   account.send_window_end   ?? 18,
        sending_preset: account.sending_preset || 'moderate',
        warmup_enabled: account.warmup_enabled || 0,
        warmup_start_count: account.warmup_start_count || 5,
        warmup_increment:   account.warmup_increment   || 3,
        warmup_max_count:   account.warmup_max_count   || 40,
        warmup_window_start: account.warmup_window_start ?? 9,
        warmup_window_end:   account.warmup_window_end   ?? 17,
      });
      setShowImap(!!account.imap_host);
      if (account.host?.includes('hostinger'))   setProvider('hostinger');
      else if (account.host?.includes('gmail'))  setProvider('gmail');
      else if (account.host?.includes('office365')) setProvider('outlook');
      else if (account.host?.includes('yahoo')) setProvider('yahoo');
      else setProvider('smtp');
    } else {
      setProvider('hostinger');
      setShowImap(false);
      setForm({
        name:'', host:'smtp.hostinger.com', port:465, secure:true,
        imap_host:'imap.hostinger.com', imap_port:993, imap_secure:true,
        username:'', password:'', from_name:'', from_email:'',
        daily_limit:40, emails_per_hour:6, delay_min:60, delay_max:180,
        send_window_start:8, send_window_end:18, sending_preset:'moderate',
        warmup_enabled:0, warmup_start_count:5, warmup_increment:3, warmup_max_count:40,
        warmup_window_start:9, warmup_window_end:17,
      });
    }
  }, [open, account]);

  const applyPreset = (key) => {
    const p = PRESETS[key];
    if (!p) return;
    f('sending_preset', key);
    f('daily_limit', p.daily_limit);
    f('emails_per_hour', p.emails_per_hour);
    f('delay_min', p.delay_min);
    f('delay_max', p.delay_max);
    f('send_window_start', p.send_window_start);
    f('send_window_end', p.send_window_end);
    if (key === 'auto_warmer') f('warmup_enabled', 1);
    toast.success(`${p.emoji} ${p.label} preset applied!`);
  };

  const applySmtpProvider = (t) => {
    setProvider(t);
    const p = SMTP_PRESETS[t];
    setForm(prev => ({
      ...prev, host:p.host, port:p.port, secure:p.secure,
      imap_host:p.imap_host, imap_port:p.imap_port, imap_secure:p.imap_secure,
      ...(account?.id ? {} : { username:'', password:'', from_name:'', from_email:'' })
    }));
    setSmtpTest(null); setImapTest(null);
  };

  const handleTestSmtp = async () => {
    if (!form.host || !form.username || !form.password) return toast.error('Enter SMTP host, username and password first');
    setSmtpTest('loading'); setSmtpError('');
    try {
      const { data } = await api.post('/smtp-test/full-test', { host:form.host, username:form.username, password:form.password });
      const working = data.tests?.find(t => t.smtpOk);
      if (working) { setSmtpTest('ok'); toast.success('✅ SMTP Connected!'); }
      else { setSmtpTest('error'); setSmtpError('Login failed — check username/password'); }
    } catch (err) { setSmtpTest('error'); setSmtpError(err.response?.data?.error || 'SMTP test failed'); }
  };

  const handleTestImap = async () => {
    if (!form.imap_host || !form.username || !imapPassword) return toast.error('Fill IMAP host, username and password');
    setImapTest('loading'); setImapError('');
    try {
      await api.post('/email-accounts/test-imap', { imap_host:form.imap_host, imap_port:form.imap_port, imap_secure:form.imap_secure, username:form.username, password:imapPassword });
      setImapTest('ok'); toast.success('✅ IMAP Connected!');
    } catch (err) { setImapTest('error'); setImapError(err.response?.data?.error || 'IMAP connection failed'); }
  };

  const handleSubmit = async () => {
    if (!form.username) return toast.error('Username required');
    if (!account?.id && !form.password) return toast.error('Password required');
    if (!form.from_email) return toast.error('From email required');
    setSaving(true);
    try {
      const payload = { ...form, type: provider };
      if (!showImap) { payload.imap_host = ''; payload.imap_port = 993; payload.imap_secure = true; }
      if (account?.id) {
        if (!payload.password) delete payload.password;
        await api.put(`/email-accounts/${account.id}`, payload);
      } else {
        await api.post('/email-accounts', payload);
      }
      toast.success(account?.id ? 'Account updated! ✅' : 'Account connected! ✅');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const fld = (label, key, type='text', opts={}) => (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>{label}</label>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={e => f(key, type==='number' ? +e.target.value : e.target.value)}
        placeholder={opts.placeholder || ''}
        required={opts.required}
        style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fafafa', color:'#0f172a', boxSizing:'border-box', transition:'border-color 0.15s' }}
        onFocus={e => e.target.style.borderColor='#2563eb'}
        onBlur={e  => e.target.style.borderColor='#e2e8f0'}
        {...opts}
      />
    </div>
  );

  const numRow = (label, key, min, max, step=1) => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</label>
        <span style={{ fontSize:12, fontWeight:700, color:'#2563eb' }}>{form[key]}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={form[key] || 0}
        onChange={e => f(key, +e.target.value)}
        style={{ width:'100%', accentColor:'#2563eb' }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:200, backdropFilter:'blur(2px)' }}/>}

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:520,
        background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',
        zIndex:201, display:'flex', flexDirection:'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        overflowY: 'hidden',
      }}>
        {/* Drawer header */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'16px 20px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'rgba(37,99,235,0.2)', border:'1px solid rgba(96,165,250,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Mail size={16} color="#60a5fa"/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{isEdit ? 'Edit Account' : 'Connect Account'}</div>
                {isEdit && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{account?.from_email}</div>}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', cursor:'pointer', borderRadius:7, padding:'5px 7px', display:'flex', alignItems:'center' }}>
              <X size={15}/>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2 }}>
            {[
              { id:'settings', icon:<Settings size={11}/>, label:'Settings' },
              { id:'sending',  icon:<Zap size={11}/>,      label:'Sending & Schedule' },
              { id:'warmup',   icon:<Flame size={11}/>,    label:'Warmup' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display:'flex', alignItems:'center', gap:4, padding:'6px 12px 8px',
                border:'none', borderRadius:'6px 6px 0 0', cursor:'pointer', fontFamily:'inherit',
                background: tab===t.id ? '#fff' : 'transparent',
                color: tab===t.id ? '#1e293b' : 'rgba(255,255,255,0.55)',
                fontSize:12, fontWeight: tab===t.id ? 700 : 400,
              }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

          {/* ══ SETTINGS TAB ══ */}
          {tab === 'settings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Provider selector */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Email Provider</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Object.entries({ hostinger:'Hostinger', gmail:'Gmail', outlook:'Outlook', yahoo:'Yahoo', smtp:'Custom' }).map(([k,v]) => (
                    <button key={k} type="button" onClick={() => applySmtpProvider(k)} style={{ padding:'6px 12px', borderRadius:7, border:`2px solid ${provider===k?'#2563eb':'#e2e8f0'}`, background:provider===k?'#eff6ff':'#fff', color:provider===k?'#2563eb':'#475569', fontWeight:provider===k?700:400, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s' }}>
                      {v}
                    </button>
                  ))}
                </div>
                {SMTP_PRESETS[provider]?.hint && (
                  <div style={{ fontSize:11.5, color:'#0369a1', marginTop:8, padding:'8px 12px', background:'#eff6ff', borderRadius:7, borderLeft:'3px solid #2563eb', lineHeight:1.6 }}>
                    💡 {SMTP_PRESETS[provider].hint}
                  </div>
                )}
              </div>

              {fld('Account Name', 'name', 'text', { placeholder:'e.g. Sales Outreach Inbox', required:true })}

              {/* SMTP section */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                  <Send size={12}/>📤 SMTP — Outgoing Emails
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px', gap:10, marginBottom:12 }}>
                  {fld('SMTP Host', 'host', 'text', { required:true })}
                  {fld('Port', 'port', 'number')}
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>SSL</label>
                    <label style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, cursor:'pointer' }}>
                      <input type="checkbox" checked={!!form.secure} onChange={e => f('secure', e.target.checked)} style={{ width:15, height:15, accentColor:'#2563eb' }}/>
                      <span style={{ fontSize:12, color:'#475569', fontWeight:600 }}>{form.secure ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>
                </div>
                {fld('Username / Email', 'username', 'email', { required:true })}
                <div style={{ marginTop:10 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>
                    SMTP Password {isEdit && <span style={{ fontWeight:400, textTransform:'none' }}>(leave blank to keep)</span>}
                  </label>
                  <input type="password" placeholder="••••••••" value={form.password} onChange={e => f('password', e.target.value)}
                    required={!isEdit}
                    style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'}
                  />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
                  {fld('From Name', 'from_name', 'text', { placeholder:'John Smith' })}
                  {fld('From Email', 'from_email', 'email', { required:true })}
                </div>
                {/* SMTP test */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
                  <button type="button" onClick={handleTestSmtp} disabled={smtpTest==='loading'}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
                    {smtpTest==='loading' ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : '🔌'} Test SMTP
                  </button>
                  {smtpTest==='ok'    && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✅ Connected!</span>}
                  {smtpTest==='error' && <span style={{ fontSize:11, color:'#dc2626' }}>❌ {smtpError}</span>}
                </div>
              </div>

              {/* IMAP section */}
              <div style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                <button type="button" onClick={() => setShowImap(p => !p)}
                  style={{ width:'100%', padding:'12px 14px', background: showImap ? '#eff6ff' : '#f8fafc', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13, fontWeight:600, color: showImap ? '#2563eb' : '#475569', fontFamily:'inherit' }}>
                  <span>📥 IMAP — Receive Replies {showImap ? '✅' : '(optional)'}</span>
                  <ChevronDown size={13} style={{ transform: showImap ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
                </button>
                {showImap && (
                  <div style={{ padding:'14px', borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:10, background:'#fafeff' }}>
                    <div style={{ fontSize:11.5, color:'#1d4ed8', padding:'8px 12px', background:'#eff6ff', borderRadius:7, borderLeft:'3px solid #3b82f6', lineHeight:1.6 }}>
                      📬 AdoBoost checks your inbox every 5 minutes and pulls replies into Messages.
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px', gap:10 }}>
                      {fld('IMAP Host', 'imap_host', 'text', { placeholder:'imap.yourdomain.com' })}
                      {fld('Port', 'imap_port', 'number')}
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>SSL</label>
                        <label style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, cursor:'pointer' }}>
                          <input type="checkbox" checked={!!form.imap_secure} onChange={e => f('imap_secure', e.target.checked)} style={{ width:15, height:15, accentColor:'#2563eb' }}/>
                          <span style={{ fontSize:12, color:'#475569', fontWeight:600 }}>{form.imap_secure ? 'ON' : 'OFF'}</span>
                        </label>
                      </div>
                    </div>
                    <div style={{ background:'#f1f5f9', borderRadius:7, padding:'8px 12px', fontSize:12, color:'#475569' }}>
                      👤 IMAP username: <strong>{form.username || '(same as SMTP)'}</strong>
                    </div>
                    <div style={{ border:'2px solid #3b82f6', borderRadius:8, padding:'10px 12px', background:'#fff' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#1d4ed8', marginBottom:6 }}>🔑 IMAP Password</div>
                      <input type="password" placeholder="Enter your email password for IMAP" value={imapPassword} onChange={e => setImapPassword(e.target.value)}
                        style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:7, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fafafa', boxSizing:'border-box' }}
                        onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'}
                      />
                      <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:4 }}>Usually same as SMTP password. For Gmail, use the same App Password.</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <button type="button" onClick={handleTestImap} disabled={imapTest==='loading'}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
                        {imapTest==='loading' ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : '📬'} Test IMAP
                      </button>
                      {imapTest==='ok'    && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✅ IMAP Connected!</span>}
                      {imapTest==='error' && <span style={{ fontSize:11, color:'#dc2626' }}>❌ {imapError}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ SENDING & SCHEDULE TAB ══ */}
          {tab === 'sending' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Preset cards */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Sending Preset</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button key={key} type="button" onClick={() => applyPreset(key)}
                      style={{
                        padding:'12px 12px', borderRadius:10, textAlign:'left', cursor:'pointer', fontFamily:'inherit',
                        border:`2px solid ${form.sending_preset===key ? p.color : '#e2e8f0'}`,
                        background: form.sending_preset===key ? p.bg : '#fff',
                        transition:'all 0.15s',
                      }}
                      onMouseEnter={e => { if (form.sending_preset !== key) { e.currentTarget.style.borderColor=p.color; e.currentTarget.style.background=p.bg+'88'; } }}
                      onMouseLeave={e => { if (form.sending_preset !== key) { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fff'; } }}
                    >
                      <div style={{ fontSize:14, marginBottom:3 }}>{p.emoji} <span style={{ fontWeight:700, fontSize:12, color: form.sending_preset===key ? p.color : '#1e293b' }}>{p.label}</span></div>
                      <div style={{ fontSize:10, color:'#64748b', lineHeight:1.5 }}>{p.desc}</div>
                      <div style={{ marginTop:6, fontSize:10, color: form.sending_preset===key ? p.color : '#94a3b8', fontWeight:600 }}>
                        {p.daily_limit}/day · {p.delay_min}–{p.delay_max}s delay
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.07em' }}>Custom Overrides</div>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {numRow('Daily Email Limit', 'daily_limit', 1, 500)}
                  {numRow('Max Emails / Hour', 'emails_per_hour', 1, 60)}
                  {numRow('Min Delay Between Sends (sec)', 'delay_min', 5, 600)}
                  {numRow('Max Delay Between Sends (sec)', 'delay_max', 10, 900)}
                </div>
              </div>

              {/* Sending window */}
              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Sending Window (Working Hours)</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginBottom:12 }}>Emails only send within this time window each day. Spreads sends humanly across these hours.</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Window Start</label>
                    <select value={form.send_window_start} onChange={e => f('send_window_start', +e.target.value)}
                      style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fafafa', cursor:'pointer' }}>
                      {Array.from({length:24},(_,i)=>i).map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Window End</label>
                    <select value={form.send_window_end} onChange={e => f('send_window_end', +e.target.value)}
                      style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fafafa', cursor:'pointer' }}>
                      {Array.from({length:24},(_,i)=>i).map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:8, padding:'8px 12px', background:'#eff6ff', borderRadius:7, fontSize:11, color:'#2563eb', fontWeight:600 }}>
                  📅 Sending window: {fmtHour(form.send_window_start)} – {fmtHour(form.send_window_end)} · {(form.send_window_end - form.send_window_start) || 0} hours
                </div>
              </div>

              {/* How it works */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:6 }}>⚙️ How Human-Like Sending Works</div>
                <div style={{ fontSize:11, color:'#64748b', lineHeight:1.7 }}>
                  When a campaign launches, AdoBoost spreads all sends across your working window with <strong>random timestamps</strong> — never at exact intervals.
                  With <strong>{form.daily_limit}/day</strong> and a <strong>{(form.send_window_end - form.send_window_start) || 8}h window</strong>, that's ~<strong>{Math.round(form.daily_limit / Math.max(1, form.send_window_end - form.send_window_start) * 10) / 10}/hr</strong> on average with unpredictable gaps.
                </div>
              </div>
            </div>
          )}

          {/* ══ WARMUP TAB ══ */}
          {tab === 'warmup' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Enable toggle */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background: form.warmup_enabled ? '#fffbeb' : '#f8fafc', borderRadius:10, border:`1px solid ${form.warmup_enabled ? '#fcd34d' : '#e2e8f0'}` }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color: form.warmup_enabled ? '#92400e' : '#475569' }}>🔥 Email Warmup</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Gradually build domain reputation through automated warm-up exchanges.</div>
                </div>
                <label style={{ position:'relative', display:'inline-block', width:44, height:24, flexShrink:0 }}>
                  <input type="checkbox" checked={form.warmup_enabled === 1} onChange={e => f('warmup_enabled', e.target.checked ? 1 : 0)} style={{ opacity:0, width:0, height:0 }}/>
                  <div style={{ position:'absolute', cursor:'pointer', inset:0, background: form.warmup_enabled ? '#f59e0b' : '#cbd5e1', borderRadius:12, transition:'background 0.2s' }}>
                    <div style={{ position:'absolute', top:3, left: form.warmup_enabled ? 23 : 3, width:18, height:18, background:'#fff', borderRadius:'50%', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
                  </div>
                </label>
              </div>

              {form.warmup_enabled === 1 && (
                <>
                  {/* How warmup works */}
                  <div style={{ background:'#fffbeb', borderRadius:10, padding:'12px 14px', border:'1px solid #fcd34d' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:6 }}>🔥 How Humanized Warmup Works</div>
                    <div style={{ fontSize:11, color:'#78350f', lineHeight:1.7 }}>
                      Warmup emails are sent <strong>once per 30-minute cron pulse</strong> with a <strong>70% random hit rate</strong>.
                      This creates an unpredictable, human-like pattern throughout the day.
                      Each email uses a different subject, varied body length, and a different partner account.
                      Auto-replies land 5–25 seconds after receipt — never instantly.
                    </div>
                  </div>

                  {/* Ramp-up settings */}
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {numRow('Start Count (emails/day on day 1)', 'warmup_start_count', 1, 20)}
                    {numRow('Daily Increment (+X/day each day)', 'warmup_increment', 1, 10)}
                    {numRow('Maximum Daily Target', 'warmup_max_count', 5, 100)}
                  </div>

                  {/* Warmup window */}
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Warmup Window</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>Warmup emails only fire within these hours.</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Start</label>
                        <select value={form.warmup_window_start} onChange={e => f('warmup_window_start', +e.target.value)}
                          style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fafafa', cursor:'pointer' }}>
                          {Array.from({length:24},(_,i)=>i).map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>End</label>
                        <select value={form.warmup_window_end} onChange={e => f('warmup_window_end', +e.target.value)}
                          style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fafafa', cursor:'pointer' }}>
                          {Array.from({length:24},(_,i)=>i).map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Current progress */}
                  {account?.id && (
                    <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.07em' }}>Current Progress</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        {[
                          { label:'Warmup Days', value:account.warmup_days||0, icon:'📅' },
                          { label:'Health Score', value:`${account.warmup_health||0}%`, icon:'💚' },
                          { label:'Today\'s Target', value: Math.min((account.warmup_start_count||5) + ((account.warmup_increment||3)*(account.warmup_days||0)), account.warmup_max_count||40), icon:'🎯' },
                          { label:'Last Warmup', value: account.last_warmup_at ? new Date(account.last_warmup_at).toLocaleDateString() : 'Never', icon:'⏱' },
                        ].map(item => (
                          <div key={item.label} style={{ background:'#fff', borderRadius:8, padding:'10px 12px', border:'1px solid #e2e8f0' }}>
                            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:2 }}>{item.icon} {item.label}</div>
                            <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {form.warmup_enabled === 0 && (
                <div style={{ textAlign:'center', padding:'30px 20px', color:'#94a3b8' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🔥</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:6 }}>Warmup is disabled</div>
                  <div style={{ fontSize:12 }}>Enable it above to start gradually building your domain reputation.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid #e2e8f0', background:'#fafafa', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 22px', background: saving ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:'0 2px 10px rgba(37,99,235,0.3)' }}>
            {saving ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : <>{isEdit ? '💾 Save Changes' : '✅ Connect Account'}</>}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Rich Signature Editor ─────────────────────────
function RichSigEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const lastSet   = useRef('');
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (editorRef.current && !init) { editorRef.current.innerHTML = value||''; lastSet.current=value||''; setInit(true); }
  }, [init]);

  useEffect(() => {
    if (!editorRef.current || !init) return;
    if (value !== lastSet.current) { editorRef.current.innerHTML=value||''; lastSet.current=value||''; }
  }, [value, init]);

  const exec = (cmd, val=null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    const html = editorRef.current?.innerHTML||'';
    lastSet.current=html; onChange(html);
  };

  const sep = () => <div style={{ width:1, height:16, background:'#d1d5db', margin:'0 3px' }}/>;
  const T = ({ title, onCmd, children }) => (
    <button type="button" title={title} onMouseDown={e=>{e.preventDefault();onCmd();}}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 6px', borderRadius:4, color:'#374151', fontSize:12, display:'flex', alignItems:'center' }}
      onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}>
      {children}
    </button>
  );

  return (
    <div style={{ border:'1.5px solid #d1d5db', borderRadius:10, overflow:'hidden', background:'#fff' }}
      onFocusCapture={e=>e.currentTarget.style.borderColor='#6366f1'}
      onBlurCapture={e=>e.currentTarget.style.borderColor='#d1d5db'}>
      <div style={{ display:'flex', alignItems:'center', gap:2, padding:'5px 8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', flexWrap:'wrap' }}>
        <T title="Bold" onCmd={()=>exec('bold')}><strong>B</strong></T>
        <T title="Italic" onCmd={()=>exec('italic')}><em>I</em></T>
        <T title="Underline" onCmd={()=>exec('underline')}><span style={{textDecoration:'underline'}}>U</span></T>
        {sep()}
        <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontSize',e.target.value)}
          style={{ border:'1px solid #e5e7eb',background:'#fff',fontSize:11,cursor:'pointer',color:'#374151',outline:'none',borderRadius:4,padding:'2px 4px' }}>
          <option value="2">10px</option><option value="3">12px</option><option value="4">14px</option><option value="5">18px</option>
        </select>
        {sep()}
        <div style={{ position:'relative',display:'inline-flex' }}>
          <button type="button" title="Font Color" onMouseDown={e=>{e.preventDefault();e.currentTarget.querySelector('input').click();}}
            style={{ background:'none',border:'none',cursor:'pointer',padding:'3px 5px',borderRadius:4,fontSize:12 }}>
            🎨<input type="color" defaultValue="#000000" onChange={e=>exec('foreColor',e.target.value)} style={{ width:0,height:0,opacity:0,position:'absolute',pointerEvents:'none' }}/>
          </button>
        </div>
        {sep()}
        <T title="Insert Link" onCmd={()=>{const u=prompt('Enter URL:');if(u)exec('createLink',u.startsWith('http')?u:'https://'+u);}}>🔗</T>
        <T title="Clear" onCmd={()=>exec('removeFormat')}>✕</T>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={()=>{const h=editorRef.current?.innerHTML||'';lastSet.current=h;onChange(h);}}
        data-placeholder={placeholder}
        style={{ minHeight:100,padding:'10px 14px',fontSize:13,lineHeight:1.8,color:'#111827',outline:'none',wordBreak:'break-word' }}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  );
}

// ── Signature Modal ───────────────────────────────
function SignatureModal({ account, onClose, onSaved }) {
  const [mode, setMode]           = useState('rich');
  const [richSig, setRichSig]     = useState('');
  const [plainSig, setPlainSig]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!account) return;
    try {
      const sig = JSON.parse(account.signature || '{}');
      setRichSig(sig.html||''); setPlainSig(sig.plain||''); setMode(sig.mode||'rich');
    } catch { setRichSig(account.signature||''); setPlainSig(''); }
    setEditorKey(k=>k+1);
  }, [account]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/email-accounts/${account.id}`, { signature: JSON.stringify({ mode, html:richSig, plain:plainSig }) });
      toast.success('✅ Signature saved!'); onSaved();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const DEFAULT_SIGS = [
    { label:'Professional', html:`<div style="font-family:Arial,sans-serif;font-size:13px;color:#333;border-top:2px solid #4f46e5;padding-top:10px;margin-top:10px"><strong style="font-size:14px">{{from_name}}</strong><br><span style="color:#6366f1">{{from_email}}</span></div>` },
    { label:'Minimal',      html:`<div style="font-family:Arial,sans-serif;font-size:12px;color:#666;margin-top:12px;padding-top:8px;border-top:1px solid #eee">— {{from_name}}<br>{{from_email}}</div>` },
    { label:'Bold',         html:`<div style="font-family:Georgia,serif;margin-top:14px;padding-top:10px;border-top:3px solid #000"><strong style="font-size:16px">{{from_name}}</strong><br><a href="mailto:{{from_email}}" style="color:#4f46e5">{{from_email}}</a></div>` },
  ];

  if (!account) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'relative', background:'#fff', borderRadius:16, width:640, maxWidth:'96vw', maxHeight:'90vh', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', zIndex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #e2e8f0', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>✍️ Email Signature</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{account.from_name} &lt;{account.from_email}&gt;</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94a3b8', lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          <div style={{ background:'#eff6ff', border:'1px solid #bae6fd', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#0369a1' }}>
            💡 Use <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>{'{{signature}}'}</code> in your email body. Also supports <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>{'{{from_name}}'}</code> and <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>{'{{from_email}}'}</code>.
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#64748b', alignSelf:'center' }}>Format:</span>
            {[{id:'rich',label:'📝 Rich HTML'},{id:'plain',label:'📄 Plain Text'}].map(m=>(
              <button key={m.id} type="button" onClick={()=>setMode(m.id)} style={{ padding:'6px 14px', borderRadius:8, border:`2px solid ${mode===m.id?'var(--primary)':'#e2e8f0'}`, background:mode===m.id?'#eff6ff':'#fff', color:mode===m.id?'#2563eb':'#475569', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:mode===m.id?700:400 }}>
                {m.label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {DEFAULT_SIGS.map(s=>(
              <button key={s.label} type="button" onClick={()=>{setRichSig(s.html);setEditorKey(k=>k+1);}} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#475569', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>{s.label}</button>
            ))}
            <button type="button" onClick={()=>{setRichSig('');setPlainSig('');setEditorKey(k=>k+1);}} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #fca5a5', background:'#fff', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Clear</button>
          </div>
          {mode==='rich' ? (
            <RichSigEditor key={editorKey} value={richSig} onChange={setRichSig} placeholder="Type your signature… {{from_name}} {{from_email}}"/>
          ) : (
            <textarea value={plainSig} onChange={e=>setPlainSig(e.target.value)} placeholder={'--\n{{from_name}}\n{{from_email}}'} rows={5}
              style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:10, padding:'10px 14px', fontSize:13, fontFamily:'monospace', lineHeight:1.7, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
          )}
          {(richSig||plainSig) && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#64748b', marginBottom:6 }}>👁 Preview:</div>
              <div style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:14, background:'#fafafa', minHeight:60 }}>
                {mode==='rich'
                  ? <div dangerouslySetInnerHTML={{ __html:(richSig||'').replace(/\{\{from_name\}\}/g,account.from_name||'Your Name').replace(/\{\{from_email\}\}/g,account.from_email||'you@example.com')}}/>
                  : <pre style={{ fontFamily:'inherit', fontSize:13, margin:0, whiteSpace:'pre-wrap' }}>{(plainSig||'').replace(/\{\{from_name\}\}/g,account.from_name||'Your Name').replace(/\{\{from_email\}\}/g,account.from_email||'you@example.com')}</pre>
                }
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #e2e8f0', background:'#fafafa', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'8px 20px', background:saving?'#94a3b8':'#2563eb', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {saving?'Saving...':'💾 Save Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
