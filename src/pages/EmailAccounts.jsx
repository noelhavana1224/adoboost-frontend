import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner, Modal, Input, Alert } from '../components/UI';
import {
  Mail, Plus, Trash2, CheckCircle, XCircle, Loader2,
  Edit2, Inbox, PenLine, ChevronDown, X, Zap, Clock,
  ShieldCheck, TrendingUp, RefreshCw, Wifi, WifiOff,
  Settings, Send, Flame, ChevronRight, AlertTriangle, Upload, Users,
} from 'lucide-react';

const INDUSTRIES = [
  'Technology / SaaS','Marketing / Advertising','Sales / Business Development',
  'E-commerce / Retail','Finance / Fintech','Real Estate','Healthcare',
  'Legal / Law','Consulting / Professional Services','Recruitment / HR',
  'Education / E-learning','Media / Publishing','Manufacturing / Industrial',
  'Logistics / Supply Chain','Non-Profit / NGO','Other',
];

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
  const [showBulkImport, setShowBulkImport]   = useState(false);
  const [showBulkWarmup, setShowBulkWarmup]   = useState(false);
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
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowBulkWarmup(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'#fff', color:'#d97706', border:'1.5px solid #d97706', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background='#fffbeb'}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            <Flame size={14}/> Bulk Warmup
          </button>
          <button onClick={() => setShowBulkImport(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'#fff', color:'#2563eb', border:'1.5px solid #2563eb', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            <Upload size={14}/> Bulk Import
          </button>
          <button onClick={openNew}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 10px rgba(37,99,235,0.35)' }}>
            <Plus size={14}/> Add Account
          </button>
        </div>
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

      {/* Bulk import */}
      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImported={load}
      />

      {/* Bulk warmup */}
      <BulkWarmupModal
        open={showBulkWarmup}
        accounts={accounts}
        onClose={() => setShowBulkWarmup(false)}
        onSaved={() => { setShowBulkWarmup(false); load(); }}
      />
    </div>
  );
}

// ── Bulk Warmup Modal ─────────────────────────────
function BulkWarmupModal({ open, accounts, onClose, onSaved }) {
  const [selected, setSelected]     = useState([]);
  const [saving, setSaving]         = useState(false);
  const [warmupEnabled, setWarmupEnabled] = useState(true);
  const [company, setCompany]       = useState('');
  const [product, setProduct]       = useState('');
  const [industry, setIndustry]     = useState('');
  const [startCount, setStartCount] = useState(1);
  const [increment, setIncrement]   = useState(2);
  const [maxCount, setMaxCount]     = useState(50);

  const warmupAccounts = accounts; // allow selecting any account
  const allSelected    = selected.length === warmupAccounts.length && warmupAccounts.length > 0;

  const toggleAll = () => {
    setSelected(allSelected ? [] : warmupAccounts.map(a => a.id));
  };
  const toggleOne = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleSave = async () => {
    if (!selected.length) return toast.error('Select at least one inbox');
    setSaving(true);
    let ok = 0, fail = 0;
    for (const id of selected) {
      const acc = accounts.find(a => a.id === id);
      if (!acc) continue;
      try {
        await api.put(`/email-accounts/${id}`, {
          ...acc,
          warmup_enabled:     warmupEnabled ? 1 : 0,
          warmup_company:     company,
          warmup_product:     product,
          warmup_industry:    industry,
          warmup_start_count: startCount,
          warmup_increment:   increment,
          warmup_max_count:   maxCount,
        });
        ok++;
      } catch { fail++; }
    }
    setSaving(false);
    if (ok > 0) toast.success(`✅ Warmup updated for ${ok} inbox${ok > 1 ? 'es' : ''}!`);
    if (fail > 0) toast.error(`${fail} inbox${fail > 1 ? 'es' : ''} failed to update`);
    onSaved();
  };

  if (!open) return null;

  const numSlider = (label, val, set, min, max) => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</label>
        <span style={{ fontSize:12, fontWeight:800, color:'#d97706' }}>{val}</span>
      </div>
      <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)}
        style={{ width:'100%', accentColor:'#d97706' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:300, backdropFilter:'blur(2px)' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width: Math.min(860, window.innerWidth - 32), maxHeight:'90vh',
        background:'#fff', borderRadius:16, boxShadow:'0 24px 80px rgba(0,0,0,0.25)',
        zIndex:301, display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#92400e,#d97706)', padding:'18px 24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Flame size={18} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Bulk Warmup Setup</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>Select inboxes → set persona & settings → apply to all at once</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', cursor:'pointer', borderRadius:7, padding:'6px 8px', display:'flex', alignItems:'center' }}>
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* Body — two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', flex:1, overflow:'hidden', minHeight:0 }}>

          {/* LEFT — inbox selection */}
          <div style={{ borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e8f0', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
                Select Inboxes
                {selected.length > 0 && <span style={{ marginLeft:8, background:'#d97706', color:'#fff', borderRadius:12, padding:'1px 8px', fontSize:11 }}>{selected.length}</span>}
              </div>
              <button onClick={toggleAll}
                style={{ fontSize:11, fontWeight:700, color: allSelected ? '#dc2626' : '#d97706', background:'none', border:`1px solid ${allSelected ? '#fca5a5' : '#fcd34d'}`, borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit' }}>
                {allSelected ? 'Deselect All' : `Select All (${warmupAccounts.length})`}
              </button>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {warmupAccounts.length === 0 ? (
                <div style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No accounts yet</div>
              ) : warmupAccounts.map(acc => {
                const isSel = selected.includes(acc.id);
                return (
                  <div key={acc.id} onClick={() => toggleOne(acc.id)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', cursor:'pointer', borderBottom:'1px solid #f8fafc', background: isSel ? '#fffbeb' : '#fff', transition:'background 0.1s' }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='#fafafa'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='#fff'; }}>
                    {/* Checkbox */}
                    <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${isSel ? '#d97706' : '#cbd5e1'}`, background: isSel ? '#d97706' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                      {isSel && <CheckCircle size={11} color="#fff"/>}
                    </div>
                    {/* Avatar */}
                    <div style={{ width:34, height:34, borderRadius:9, background: avatarColor(acc.from_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
                      {initials(acc.from_name || acc.from_email)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.name}</div>
                      <div style={{ fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.from_email}</div>
                    </div>
                    {acc.warmup_enabled === 1 && (
                      <span style={{ fontSize:10, background:'#fffbeb', color:'#d97706', border:'1px solid #fcd34d', borderRadius:6, padding:'2px 6px', fontWeight:600, flexShrink:0 }}>🔥 ON</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — settings */}
          <div style={{ overflowY:'auto', padding:'20px' }}>
            {/* Enable/disable toggle */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background: warmupEnabled ? '#fffbeb' : '#f8fafc', borderRadius:10, border:`1px solid ${warmupEnabled ? '#fcd34d' : '#e2e8f0'}`, marginBottom:18 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color: warmupEnabled ? '#92400e' : '#475569' }}>🔥 Email Warmup</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Enable for all selected inboxes</div>
              </div>
              <label style={{ position:'relative', display:'inline-block', width:44, height:24, flexShrink:0 }}>
                <input type="checkbox" checked={warmupEnabled} onChange={e => setWarmupEnabled(e.target.checked)} style={{ opacity:0, width:0, height:0 }}/>
                <div style={{ position:'absolute', cursor:'pointer', inset:0, background: warmupEnabled ? '#f59e0b' : '#cbd5e1', borderRadius:12, transition:'background 0.2s' }}>
                  <div style={{ position:'absolute', top:3, left: warmupEnabled ? 23 : 3, width:18, height:18, background:'#fff', borderRadius:'50%', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
                </div>
              </label>
            </div>

            {/* AI Persona */}
            <div style={{ background:'#f5f3ff', borderRadius:10, padding:'14px 16px', border:'1px solid #ddd6fe', marginBottom:18 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#6d28d9', marginBottom:10 }}>🤖 AI Warmup Persona</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>🏢 Company / Sender Name</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Adobo Solutions"
                    style={{ width:'100%', border:'1.5px solid #ddd6fe', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#ddd6fe'}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>🚀 Product / Service</label>
                  <input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Email outreach platform"
                    style={{ width:'100%', border:'1.5px solid #ddd6fe', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#ddd6fe'}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>🏷️ Industry / Niche</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    style={{ width:'100%', border:'1.5px solid #ddd6fe', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color: industry ? '#0f172a' : '#94a3b8', cursor:'pointer' }}>
                    <option value="">— Select industry —</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize:11, color:'#7c3aed', marginTop:10, lineHeight:1.5 }}>
                💡 Leave blank to keep each inbox's existing persona.
              </div>
            </div>

            {/* Ramp settings */}
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:18 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.07em' }}>📈 Warmup Ramp Settings</div>
              {numSlider('Start Count (emails/day on day 1)', startCount, setStartCount, 1, 20)}
              {numSlider('Daily Increment (+X/day each day)', increment, setIncrement, 1, 10)}
              {numSlider('Maximum Daily Target', maxCount, setMaxCount, 5, 100)}
            </div>

            <div style={{ background:'#f0fdf4', borderRadius:8, padding:'10px 12px', border:'1px solid #86efac', fontSize:11, color:'#166534', lineHeight:1.6 }}>
              ✅ <strong>{selected.length} inbox{selected.length !== 1 ? 'es' : ''} selected.</strong> All settings above will be applied to every selected inbox when you click Apply.
              Blank persona fields will overwrite existing values — fill them in to set the AI context.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #e2e8f0', background:'#fafafa', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'8px 18px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !selected.length}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 24px', background: (!selected.length || saving) ? '#94a3b8' : 'linear-gradient(135deg,#d97706,#b45309)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: (!selected.length || saving) ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: selected.length ? '0 2px 10px rgba(217,119,6,0.35)' : 'none' }}>
            {saving ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Applying…</> : <><Flame size={14}/> Apply to {selected.length} Inbox{selected.length !== 1 ? 'es' : ''}</>}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Bulk Import Modal ────────────────────────────
const BULK_COLS = [
  { key:'name',        label:'name',        required:false, example:'My Gmail',            desc:'Friendly display name' },
  { key:'from_name',   label:'from_name',   required:false, example:'John Doe',            desc:'Sender display name' },
  { key:'from_email',  label:'from_email',  required:false, example:'john@gmail.com',      desc:'Sender email (defaults to username)' },
  { key:'username',    label:'username',    required:true,  example:'john@gmail.com',      desc:'SMTP login — usually the full email' },
  { key:'password',    label:'password',    required:true,  example:'app_password_here',   desc:'SMTP / App Password' },
  { key:'host',        label:'host',        required:true,  example:'smtp.gmail.com',      desc:'SMTP server hostname' },
  { key:'port',        label:'port',        required:false, example:'587',                 desc:'587 (TLS) or 465 (SSL)' },
  { key:'secure',      label:'secure',      required:false, example:'false',               desc:'false=TLS/587  true=SSL/465' },
  { key:'imap_host',   label:'imap_host',   required:false, example:'imap.gmail.com',      desc:'IMAP server (for inbox sync)' },
  { key:'imap_port',   label:'imap_port',   required:false, example:'993',                 desc:'Usually 993' },
  { key:'imap_secure', label:'imap_secure', required:false, example:'true',                desc:'Almost always true' },
  { key:'daily_limit', label:'daily_limit', required:false, example:'50',                  desc:'Max emails sent per day' },
];

const BULK_SAMPLE = [
  { name:'Gmail – John',    from_name:'John Doe',     from_email:'john@gmail.com',          username:'john@gmail.com',          password:'xxxx xxxx xxxx xxxx', host:'smtp.gmail.com',           port:587, secure:'false', imap_host:'imap.gmail.com',             imap_port:993, imap_secure:'true',  daily_limit:50  },
  { name:'Outlook – Jane',  from_name:'Jane Smith',   from_email:'jane@outlook.com',         username:'jane@outlook.com',         password:'your_app_password',   host:'smtp-mail.outlook.com',    port:587, secure:'false', imap_host:'outlook.office365.com',      imap_port:993, imap_secure:'true',  daily_limit:50  },
  { name:'Yahoo – Bob',     from_name:'Bob Lee',      from_email:'bob@yahoo.com',            username:'bob@yahoo.com',            password:'yahoo_app_password',  host:'smtp.mail.yahoo.com',      port:465, secure:'true',  imap_host:'imap.mail.yahoo.com',        imap_port:993, imap_secure:'true',  daily_limit:40  },
  { name:'Hostinger – Sue', from_name:'Sue Chen',     from_email:'sue@yourdomain.com',       username:'sue@yourdomain.com',       password:'hosting_password',    host:'smtp.hostinger.com',       port:465, secure:'true',  imap_host:'imap.hostinger.com',         imap_port:993, imap_secure:'true',  daily_limit:100 },
  { name:'Custom SMTP',     from_name:'Support Team', from_email:'support@yourdomain.com',   username:'support@yourdomain.com',   password:'your_password',       host:'mail.yourdomain.com',      port:587, secure:'false', imap_host:'mail.yourdomain.com',        imap_port:993, imap_secure:'true',  daily_limit:100 },
];

function BulkImportModal({ open, onClose, onImported }) {
  const [step, setStep]           = useState('upload');  // upload | preview | result
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef(null);

  useEffect(() => {
    if (!open) { setStep('upload'); setParsedRows([]); setResult(null); setDragOver(false); }
  }, [open]);

  /* ── Download CSV template (no library needed) ── */
  const downloadTemplate = () => {
    const headers = BULK_COLS.map(c => c.key);
    const csvVal  = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s; };
    const lines   = [headers.join(','), ...BULK_SAMPLE.map(r => headers.map(h => csvVal(r[h])).join(','))];
    const blob    = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = Object.assign(document.createElement('a'), { href:url, download:'email_accounts_template.csv' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  /* ── Tiny CSV parser (handles quoted fields) ── */
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const parseLine = (line) => {
      const out = []; let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      out.push(cur.trim()); return out;
    };
    const headers = parseLine(lines[0]);
    return lines.slice(1).map(line => {
      const vals = parseLine(line);
      const obj  = {};
      headers.forEach((h, i) => { obj[h.trim()] = vals[i] ?? ''; });
      return obj;
    }).filter(r => Object.values(r).some(v => v !== ''));
  };

  /* ── Parse file (CSV only — no build dependencies) ── */
  const parseFile = (file) => {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name))
      return toast.error('Please upload a .csv file (Excel users: Save As → CSV)');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        if (!rows.length) return toast.error('File appears to be empty');
        setParsedRows(rows);
        setStep('preview');
      } catch (err) { toast.error('Could not parse file: ' + err.message); }
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    parseFile(e.dataTransfer?.files[0]);
  };
  const onFileInput = (e) => parseFile(e.target.files[0]);

  /* ── Import ── */
  const handleImport = async () => {
    setImporting(true);
    try {
      const { data } = await api.post('/email-accounts/bulk-import', { accounts: parsedRows });
      setResult(data);
      setStep('result');
      if (data.imported > 0) { onImported(); toast.success(`✅ ${data.imported} account${data.imported!==1?'s':''} imported!`); }
    } catch (e) { toast.error(e.response?.data?.error || 'Import failed'); }
    setImporting(false);
  };

  if (!open) return null;

  /* ── Step indicator ── */
  const STEPS = ['Upload', 'Preview', 'Done'];
  const stepIdx = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'relative', background:'#fff', borderRadius:18, width:760, maxWidth:'97vw', maxHeight:'92vh', boxShadow:'0 30px 80px rgba(0,0,0,0.25)', zIndex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid #e2e8f0', background:'linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
              <Upload size={18} color="#2563eb"/> Bulk Import Email Accounts
            </div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>Add up to hundreds of SMTP accounts at once via CSV or Excel</div>
          </div>
          {/* Step pills */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:32 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color: i <= stepIdx ? '#2563eb' : '#94a3b8' }}>
                  <div style={{ width:20, height:20, borderRadius:10, background: i < stepIdx ? '#2563eb' : i === stepIdx ? '#eff6ff' : '#f1f5f9', border: i === stepIdx ? '2px solid #2563eb' : 'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color: i < stepIdx ? '#fff' : i === stepIdx ? '#2563eb' : '#94a3b8' }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  {s}
                </div>
                {i < STEPS.length - 1 && <div style={{ width:16, height:1, background: i < stepIdx ? '#2563eb' : '#e2e8f0' }}/>}
              </React.Fragment>
            ))}
          </div>
          <button onClick={onClose} style={{ position:'absolute', right:18, top:18, background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#94a3b8', lineHeight:1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:22 }}>

          {/* ═══ STEP 1: UPLOAD ═══ */}
          {step === 'upload' && (
            <>
              {/* Column reference table */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#0f172a', marginBottom:10 }}>📋 Spreadsheet Columns</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['Column name','Required','Example value','Description'].map(h => (
                          <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:'2px solid #e2e8f0', color:'#475569', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {BULK_COLS.map((c, i) => (
                        <tr key={c.key} style={{ background: i%2===0 ? '#fff':'#f8fafc' }}>
                          <td style={{ padding:'6px 12px', borderBottom:'1px solid #f1f5f9', fontFamily:'monospace', color:'#2563eb', fontWeight:600, whiteSpace:'nowrap' }}>{c.key}</td>
                          <td style={{ padding:'6px 12px', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>
                            <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background:c.required?'#fee2e2':'#f1f5f9', color:c.required?'#dc2626':'#64748b' }}>
                              {c.required ? '★ Required' : 'Optional'}
                            </span>
                          </td>
                          <td style={{ padding:'6px 12px', borderBottom:'1px solid #f1f5f9', fontFamily:'monospace', color:'#475569', fontSize:11, whiteSpace:'nowrap' }}>{c.example}</td>
                          <td style={{ padding:'6px 12px', borderBottom:'1px solid #f1f5f9', color:'#64748b' }}>{c.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Download template */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#0f172a', marginBottom:8 }}>📥 Start with a template (includes 5 sample rows)</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button onClick={downloadTemplate}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:9, fontSize:12.5, color:'#16a34a', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background='#dcfce7'}
                    onMouseLeave={e => e.currentTarget.style.background='#f0fdf4'}>
                    📄 Download CSV Template
                  </button>
                </div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>Fill in your data, save as <strong>.csv</strong>, then upload below. Column names are case-insensitive.</div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ border:`2.5px dashed ${dragOver?'#2563eb':'#cbd5e1'}`, borderRadius:14, padding:'44px 20px', textAlign:'center', cursor:'pointer', background:dragOver?'#eff6ff':'#f8fafc', transition:'all 0.18s' }}
              >
                <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                <div style={{ fontWeight:800, fontSize:15, color:'#1e293b', marginBottom:6 }}>
                  {dragOver ? 'Drop it!' : 'Drag & drop your file here'}
                </div>
                <div style={{ fontSize:12.5, color:'#94a3b8', marginBottom:16 }}>or click to browse your computer</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 22px', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', borderRadius:9, fontSize:13, fontWeight:700 }}>
                  <Upload size={14}/> Choose File
                </div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:12 }}>Accepts .csv &nbsp;·&nbsp; Excel users: File → Save As → CSV</div>
                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={onFileInput} style={{ display:'none' }}/>
              </div>
            </>
          )}

          {/* ═══ STEP 2: PREVIEW ═══ */}
          {step === 'preview' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>
                    👁 Preview — <span style={{ color:'#2563eb' }}>{parsedRows.length} row{parsedRows.length!==1?'s':''}</span> detected
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                    Showing first 5. All {parsedRows.length} rows will be imported.
                  </div>
                </div>
                <button onClick={() => setStep('upload')}
                  style={{ padding:'7px 14px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#64748b' }}>
                  ← Back
                </button>
              </div>

              <div style={{ overflowX:'auto', border:'1px solid #e2e8f0', borderRadius:10, marginBottom:16 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['#','username','from_email','host','port','imap_host','daily_limit'].map(h => (
                        <th key={h} style={{ padding:'9px 12px', textAlign:'left', borderBottom:'2px solid #e2e8f0', color:'#475569', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((r, i) => {
                      const get = (key) => {
                        const lower = key.toLowerCase().replace(/[\s_-]/g,'');
                        for (const k of Object.keys(r)) {
                          if (k.toLowerCase().replace(/[\s_-]/g,'') === lower) return String(r[k]||'');
                        }
                        return '—';
                      };
                      const missingRequired = !get('username') || !get('password') || (!get('host') && !get('smtphost'));
                      return (
                        <tr key={i} style={{ background: missingRequired ? '#fff5f5' : i%2===0?'#fff':'#f8fafc' }}>
                          <td style={{ padding:'7px 12px', borderBottom:'1px solid #f1f5f9', color:'#94a3b8', fontWeight:600 }}>{i+1}</td>
                          {['username','fromemail','host','port','imaphost','dailylimit'].map(h => (
                            <td key={h} style={{ padding:'7px 12px', borderBottom:'1px solid #f1f5f9', fontFamily:'monospace', color:'#334155', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {get(h) || <span style={{ color:'#cbd5e1' }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 5 && (
                <div style={{ textAlign:'center', fontSize:12, color:'#94a3b8', marginBottom:16 }}>
                  + {parsedRows.length - 5} more row{parsedRows.length-5!==1?'s':''} not shown
                </div>
              )}

              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                ⚡ Duplicate usernames (already in your account) will be skipped automatically.
              </div>
            </>
          )}

          {/* ═══ STEP 3: RESULT ═══ */}
          {step === 'result' && result && (
            <div>
              <div style={{ textAlign:'center', padding:'24px 0 16px' }}>
                <div style={{ fontSize:52, marginBottom:14 }}>{result.imported > 0 ? '🎉' : '⚠️'}</div>
                <div style={{ fontWeight:800, fontSize:22, color:'#0f172a', marginBottom:8 }}>
                  {result.imported} of {result.total} imported
                </div>
                <div style={{ fontSize:13, color:'#64748b' }}>
                  {result.errors.length === 0
                    ? '🎉 All rows imported successfully!'
                    : `${result.errors.length} row${result.errors.length!==1?'s':''} skipped — see details below`}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#dc2626', marginBottom:8 }}>⚠️ Skipped Rows</div>
                  <div style={{ maxHeight:240, overflowY:'auto', border:'1px solid #fecaca', borderRadius:9, background:'#fff5f5' }}>
                    {result.errors.map((e, i) => (
                      <div key={i} style={{ padding:'9px 14px', borderBottom: i<result.errors.length-1?'1px solid #fecaca':undefined, fontSize:12, color:'#991b1b', display:'flex', gap:10 }}>
                        <span style={{ fontWeight:700, whiteSpace:'nowrap' }}>Row {e.row}</span>
                        <span style={{ color:'#64748b' }}>{e.email}</span>
                        <span>— {e.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid #e2e8f0', background:'#fafafa', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:'#94a3b8' }}>
            {step === 'upload' && 'Upload a filled template to get started'}
            {step === 'preview' && `Ready to import ${parsedRows.length} account${parsedRows.length!==1?'s':''}`}
            {step === 'result' && result && `${result.imported} imported · ${result.errors.length} skipped`}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {step === 'upload' && (
              <button onClick={onClose} style={{ padding:'9px 18px', background:'none', border:'1px solid #e2e8f0', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'#64748b' }}>Cancel</button>
            )}
            {step === 'preview' && (
              <>
                <button onClick={() => setStep('upload')} style={{ padding:'9px 18px', background:'none', border:'1px solid #e2e8f0', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'#64748b' }}>← Back</button>
                <button onClick={handleImport} disabled={importing}
                  style={{ padding:'9px 26px', background:importing?'#94a3b8':'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:importing?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
                  {importing
                    ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Importing…</>
                    : <><Upload size={13}/> Import {parsedRows.length} Account{parsedRows.length!==1?'s':''}</>}
                </button>
              </>
            )}
            {step === 'result' && (
              <button onClick={onClose} style={{ padding:'9px 22px', background:'#2563eb', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Done ✓
              </button>
            )}
          </div>
        </div>
      </div>
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
    warmup_product:'', warmup_company:'', warmup_industry:'',
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
        warmup_product:  account.warmup_product  || '',
        warmup_company:  account.warmup_company  || '',
        warmup_industry: account.warmup_industry || '',
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
        warmup_product:'', warmup_company:'', warmup_industry:'',
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
                  {/* Community network notice */}
                  <div style={{ background:'linear-gradient(135deg,#eff6ff,#f5f3ff)', borderRadius:12, padding:'14px 16px', border:'1px solid #c4b5fd' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#5b21b6', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      🌐 You're joining the AdoBoost Warmup Network
                    </div>
                    <div style={{ fontSize:12, color:'#4c1d95', lineHeight:1.75, marginBottom:10 }}>
                      Your inbox will <strong>send and receive warmup emails</strong> with other inboxes in the platform community.
                      This is what makes the warmup work — every inbox helps every other inbox build reputation.
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {[
                        { icon:'📨', text:'Your inbox will receive warmup emails from other users\' inboxes on the platform.' },
                        { icon:'↩️', text:'AdoBoost auto-replies to those emails via IMAP — you don\'t need to do anything.' },
                        { icon:'📈', text:'The bigger the network, the faster and stronger your reputation builds.' },
                        { icon:'🏷️', text:'Tip: create a filter in your email client to label emails with header X-Warmup-Email: true so they stay out of your main inbox.' },
                      ].map((item, i) => (
                        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:11, color:'#5b21b6' }}>
                          <span style={{ flexShrink:0, marginTop:1 }}>{item.icon}</span>
                          <span style={{ lineHeight:1.6 }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

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

                  {/* AI Warmup Persona */}
                  <div style={{ background:'#f5f3ff', borderRadius:10, padding:'14px 16px', border:'1px solid #ddd6fe' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#6d28d9', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                      🤖 AI Warmup Persona
                    </div>
                    <div style={{ fontSize:11, color:'#7c3aed', marginBottom:12, lineHeight:1.6 }}>
                      Tells the AI what to write about so warmup emails look like real business conversations.
                      Without this, emails fall back to generic templates.
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>🏢 Company / Sender Name</label>
                        <input value={form.warmup_company||''} onChange={e => f('warmup_company', e.target.value)}
                          placeholder="e.g. Nexxis Digital"
                          style={{ width:'100%', border:'1.5px solid #ddd6fe', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0f172a', boxSizing:'border-box' }}
                          onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#ddd6fe'}
                        />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>🚀 Product / Service</label>
                        <input value={form.warmup_product||''} onChange={e => f('warmup_product', e.target.value)}
                          placeholder="e.g. SEO audit software"
                          style={{ width:'100%', border:'1.5px solid #ddd6fe', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color:'#0f172a', boxSizing:'border-box' }}
                          onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#ddd6fe'}
                        />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>🏷️ Industry / Niche</label>
                        <select value={form.warmup_industry||''} onChange={e => f('warmup_industry', e.target.value)}
                          style={{ width:'100%', border:'1.5px solid #ddd6fe', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', color: form.warmup_industry ? '#0f172a' : '#94a3b8', cursor:'pointer' }}>
                          <option value="">— Select your industry —</option>
                          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Warmup window — linked to Sending tab */}
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.07em' }}>📅 Warmup Window</div>
                      <button type="button" onClick={() => setTab('sending')}
                        style={{ fontSize:11, color:'#2563eb', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit', textDecoration:'underline' }}>
                        Edit in Sending & Schedule →
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
                      Warmup emails fire within your sending window. Change the window in the <strong>Sending & Schedule</strong> tab — one setting, no confusion.
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <div style={{ flex:1, background:'#fff', borderRadius:8, padding:'8px 12px', border:'1px solid #e2e8f0', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>FROM</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#2563eb' }}>{fmtHour(form.send_window_start)}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', color:'#94a3b8', fontSize:18, fontWeight:300 }}>→</div>
                      <div style={{ flex:1, background:'#fff', borderRadius:8, padding:'8px 12px', border:'1px solid #e2e8f0', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>TO</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#2563eb' }}>{fmtHour(form.send_window_end)}</div>
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
