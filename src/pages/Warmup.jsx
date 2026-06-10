import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Spinner, Btn } from '../components/UI';
import { Flame, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Play, Pause, RefreshCw, TrendingUp, Mail, Users, Shield, KeyRound, Eye, EyeOff, Loader2, X } from 'lucide-react';

// ── Warmup recommendations ───────────────────────
const RAMP_PRESETS = [
  {
    id: 'gentle',
    label: '🐢 Gentle (New Domain)',
    desc: 'Best for brand new domains. Very slow ramp, lowest risk.',
    start: 2, increment: 2, max: 30,
    badge: 'SAFEST', badgeColor: '#16a34a', badgeBg: '#f0fff4',
  },
  {
    id: 'standard',
    label: '🚀 Standard (Recommended)',
    desc: 'Ideal for most accounts. Reaches full warmup in ~3 weeks.',
    start: 5, increment: 5, max: 50,
    badge: 'RECOMMENDED', badgeColor: '#2563eb', badgeBg: '#eff6ff',
  },
  {
    id: 'aggressive',
    label: '⚡ Fast (Experienced Domain)',
    desc: 'For domains with some sending history. Faster ramp.',
    start: 10, increment: 10, max: 100,
    badge: 'ADVANCED', badgeColor: '#d97706', badgeBg: '#fffbeb',
  },
];

// ── Health score ring ────────────────────────────
function HealthRing({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Building' : 'Getting Started';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x={45} y={49} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: color, fontSize: 18, fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: '45px 45px' }}>
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 600, color }}>{label}</div>
    </div>
  );
}

// ── Daily progress bar ───────────────────────────
function DayBar({ day, target, sent }) {
  const pct = target > 0 ? Math.min((sent / target) * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text3)', width: 40, textAlign: 'right' }}>Day {day}</span>
      <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#16a34a' : 'var(--primary)', borderRadius: 99, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text3)', width: 60 }}>{sent}/{target}</span>
    </div>
  );
}

// ── Update Password Modal ────────────────────────
function UpdatePasswordModal({ account, open, onClose, onSaved }) {
  const [smtpPassword, setSmtpPassword] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [showSmtp, setShowSmtp] = useState(false);
  const [showImap, setShowImap] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'error'
  const [testError, setTestError]   = useState('');

  useEffect(() => {
    if (open) { setSmtpPassword(''); setImapPassword(''); setTestResult(null); setTestError(''); }
  }, [open]);

  const hasImap = !!account?.imap_host;

  const handleTest = async () => {
    if (!smtpPassword) return toast.error('Enter SMTP password first');
    setTesting(true); setTestResult(null); setTestError('');
    try {
      await api.post('/email-accounts/test-settings', {
        host: account.host, port: account.port, secure: account.secure,
        username: account.username, password: smtpPassword,
      });
      setTestResult('ok');
      toast.success('✅ SMTP connection successful!');
    } catch (err) {
      setTestResult('error');
      setTestError(err.response?.data?.error || 'SMTP connection failed');
      toast.error(err.response?.data?.error || 'SMTP connection failed');
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!smtpPassword && !imapPassword) return toast.error('Enter at least one password to update');
    setSaving(true);
    try {
      const body = {};
      if (smtpPassword) body.password = smtpPassword;
      if (imapPassword && hasImap) body.imap_password = imapPassword;
      await api.put(`/email-accounts/${account.id}`, body);
      toast.success('✅ Password updated! Warmup will retry automatically.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save password');
    }
    setSaving(false);
  };

  if (!open || !account) return null;

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, backdropFilter:'blur(3px)' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width: Math.min(460, window.innerWidth - 32), background:'#fff',
        borderRadius:16, boxShadow:'0 24px 80px rgba(0,0,0,0.25)', zIndex:1001,
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#991b1b,#dc2626)', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <KeyRound size={18} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>Update Credentials</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{account.from_email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', cursor:'pointer', borderRadius:7, padding:'5px 7px', display:'flex' }}>
            <X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px' }}>
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#991b1b', marginBottom:18, lineHeight:1.5 }}>
            ⚠️ Warmup stopped because SMTP authentication failed. Update the password below and save — the warmup will retry on the next cycle.
          </div>

          {/* SMTP Password */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>
              📧 SMTP Password <span style={{ color:'#dc2626' }}>*</span>
            </label>
            <div style={{ position:'relative' }}>
              <input
                type={showSmtp ? 'text' : 'password'}
                placeholder="Enter new SMTP / App Password"
                value={smtpPassword}
                onChange={e => { setSmtpPassword(e.target.value); setTestResult(null); }}
                style={{ width:'100%', border:`1.5px solid ${testResult==='ok'?'#16a34a':testResult==='error'?'#dc2626':'#d1d5db'}`, borderRadius:9, padding:'10px 40px 10px 12px', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor=testResult==='ok'?'#16a34a':testResult==='error'?'#dc2626':'#d1d5db'}
              />
              <button onClick={() => setShowSmtp(s => !s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2 }}>
                {showSmtp ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
            {testResult === 'ok' && <div style={{ fontSize:11, color:'#16a34a', marginTop:4 }}>✅ Connection verified</div>}
            {testResult === 'error' && <div style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>❌ {testError}</div>}
            <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>
              {account.host?.includes('gmail') && '💡 Gmail users: use an App Password from myaccount.google.com → Security → App passwords'}
              {account.host?.includes('yahoo') && '💡 Yahoo: generate an App Password in Yahoo Account Security settings'}
              {account.host?.includes('hostinger') && '💡 Hostinger: use your Hostinger email account password'}
            </div>
          </div>

          {/* IMAP Password (only if account has IMAP configured) */}
          {hasImap && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>
                📥 IMAP Password <span style={{ fontSize:11, color:'#9ca3af', fontWeight:400 }}>(for inbox sync & auto-reply)</span>
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showImap ? 'text' : 'password'}
                  placeholder="Same as SMTP password (usually)"
                  value={imapPassword}
                  onChange={e => setImapPassword(e.target.value)}
                  style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:9, padding:'10px 40px 10px 12px', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                  onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#d1d5db'}
                />
                <button onClick={() => setShowImap(s => !s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2 }}>
                  {showImap ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>
                IMAP server: <strong>{account.imap_host}:{account.imap_port}</strong>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={onClose} style={{ padding:'9px 16px', background:'none', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:'#6b7280', cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
            <button onClick={handleTest} disabled={testing || !smtpPassword}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background: !smtpPassword?'#e5e7eb':'#eff6ff', border:`1px solid ${!smtpPassword?'#e5e7eb':'#93c5fd'}`, borderRadius:8, fontSize:13, color:!smtpPassword?'#9ca3af':'#1d4ed8', cursor:!smtpPassword?'not-allowed':'pointer', fontFamily:'inherit', fontWeight:600 }}>
              {testing ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <CheckCircle size={13}/>}
              Test SMTP
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:saving?'#94a3b8':'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(22,163,74,0.35)' }}>
              {saving ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <KeyRound size={13}/>}
              Save Password
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Warmup Account Card ──────────────────────────
function WarmupCard({ account, poolSize, onUpdate }) {
  const [expanded, setExpanded]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [logs, setLogs]           = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [retrying, setRetrying]   = useState(false);

  // Detect which preset matches the account's current saved settings (if any)
  const detectPreset = (start, inc, max) => {
    const match = RAMP_PRESETS.find(p => p.start === start && p.increment === inc && p.max === max);
    return match ? match.id : 'custom';
  };

  const initStart = account.warmup_start_count || 5;
  const initInc   = account.warmup_increment   || 5;
  const initMax   = account.warmup_max_count   || 50;

  const [preset, setPreset] = useState(() => detectPreset(initStart, initInc, initMax));
  const [form, setForm] = useState({
    warmup_enabled:     account.warmup_enabled === 1,
    warmup_start_count: initStart,
    warmup_increment:   initInc,
    warmup_max_count:   initMax,
    warmup_product:     account.warmup_product  || '',
    warmup_company:     account.warmup_company  || '',
    warmup_industry:    account.warmup_industry || '',
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const health = account.warmup_health || 0;
  const warmupDays = account.warmup_days || 0;
  const todayTarget = Math.min(
    (form.warmup_start_count) + (form.warmup_increment * warmupDays),
    form.warmup_max_count
  );
  // How many days to reach the max (ramp period only — warmup continues forever after)
  const daysToMax = form.warmup_max_count > form.warmup_start_count
    ? Math.ceil((form.warmup_max_count - form.warmup_start_count) / form.warmup_increment)
    : 0;
  const reachedMax = warmupDays >= daysToMax;

  const applyPreset = (p) => {
    setPreset(p.id);
    f('warmup_start_count', p.start);
    f('warmup_increment', p.increment);
    f('warmup_max_count', p.max);
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/warmup/logs/${account.id}`);
      setLogs(data || []);
    } catch {} finally { setLoadingLogs(false); }
  };

  const retrySmtp = async () => {
    setRetrying(true);
    try {
      await api.post(`/email-accounts/${account.id}/retry-smtp`);
      toast.success(`✅ ${account.from_email} reconnected! Warmup will resume shortly.`);
      onUpdate(account.id, { failed_today: 0 });
    } catch (e) {
      toast.error(`❌ Still failing: ${e.response?.data?.error || 'Check your SMTP credentials'}`);
    } finally { setRetrying(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/email-accounts/${account.id}`, form);
      toast.success(`✅ Warmup settings saved for ${account.name}`);
      onUpdate(account.id, form);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleWarmup = async () => {
    const newEnabled = !form.warmup_enabled;
    f('warmup_enabled', newEnabled);
    try {
      await api.put(`/email-accounts/${account.id}`, { ...form, warmup_enabled: newEnabled });
      toast.success(newEnabled ? '🔥 Warmup started!' : '⏸ Warmup paused');
      onUpdate(account.id, { warmup_enabled: newEnabled ? 1 : 0 });
    } catch { toast.error('Failed to update'); }
  };

  return (
    <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: expanded ? '1px solid var(--border)' : 'none', background: '#fafafa' }}>
        {/* Health ring */}
        <HealthRing score={health} />

        {/* Account info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{account.name}</span>
            {form.warmup_enabled ? (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0fff4', color: '#16a34a', border: '1px solid #86efac', fontWeight: 600 }}>🔥 Active</span>
            ) : (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 600 }}>⏸ Paused</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {account.from_email}
            {/^.*hostinger/i.test(`${account.host||''} ${account.imap_host||''}`) && (
              <span title="Hostinger inboxes are capped at 100 emails/day. Warmup automatically stays under this so your campaign keeps its budget — keep your campaign daily limit modest (e.g. ≤ 50)."
                style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', cursor: 'help' }}>
                ⚠️ Hostinger · 100/day cap
              </span>
            )}
          </div>
          {/* Progress stats */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>📅 Day <strong>{warmupDays}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              📨 Today: <strong style={{ color: account.sent_today > 0 ? '#16a34a' : account.failed_today > 0 ? '#dc2626' : undefined }}>
                {account.sent_today}/{todayTarget}
              </strong> sent
              {account.failed_today > 0 && (
                <span style={{ marginLeft: 4, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠️ {account.failed_today} failed</span>
              )}
            </span>
            {account.last_warmup_at && (
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>🕐 Last run: <strong>{new Date(account.last_warmup_at).toLocaleDateString()}</strong></span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              🎯 {reachedMax
                ? <><strong style={{ color: '#16a34a' }}>{form.warmup_max_count}/day ♾️</strong> <span style={{ fontSize: 11, color: '#16a34a' }}>ongoing</span></>
                : <>Ramp to <strong>{form.warmup_max_count}/day</strong></>
              }
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={toggleWarmup} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: form.warmup_enabled ? '#fee2e2' : '#f0fff4',
            color: form.warmup_enabled ? '#dc2626' : '#16a34a',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {form.warmup_enabled ? <><Pause size={12}/> Pause</> : <><Play size={12}/> Start</>}
          </button>
          <button onClick={() => { setExpanded(e => !e); if (!expanded) loadLogs(); }} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border2)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text2)' }}>
            {expanded ? <><ChevronUp size={12}/> Collapse</> : <><ChevronDown size={12}/> Configure</>}
          </button>
        </div>
      </div>

      {/* SMTP failure warning — visible without expanding */}
      {form.warmup_enabled && account.failed_today > 0 && account.sent_today === 0 && (
        <div style={{ background: '#fef2f2', borderTop: '1px solid #fecaca', borderBottom: expanded ? '1px solid #fecaca' : 'none', padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔴</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#991b1b', marginBottom: 2 }}>
              SMTP Authentication Failed — Warmup Stopped
            </div>
            <div style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.5, marginBottom: 8 }}>
              All {account.failed_today} warmup email attempt{account.failed_today !== 1 ? 's' : ''} failed for <strong>{account.from_email}</strong>.
              This is usually caused by a wrong password, changed credentials, or blocked port.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={retrySmtp} disabled={retrying}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', background:'#dc2626', color:'#fff', border:'none', borderRadius:7, cursor: retrying ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700, opacity: retrying ? 0.7 : 1, fontFamily:'inherit' }}>
                <RefreshCw size={13} style={retrying ? { animation:'spin 1s linear infinite' } : {}} />
                {retrying ? 'Testing connection…' : '🔄 Retry Connection'}
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', background:'#fff', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                <KeyRound size={12}/> Update Password
              </button>
              <span style={{ fontSize:11, color:'#b91c1c' }}>Uses your saved password — no re-entry needed</span>
            </div>
          </div>
        </div>
      )}

      <UpdatePasswordModal
        account={account}
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSaved={() => { setShowPasswordModal(false); onUpdate(account.id, {}); }}
      />
      {form.warmup_enabled && account.failed_today > 0 && account.sent_today > 0 && (
        <div style={{ background: '#fffbeb', borderTop: '1px solid #fcd34d', borderBottom: expanded ? '1px solid #fcd34d' : 'none', padding: '10px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 2 }}>
              Some Warmup Emails Failed Today
            </div>
            <div style={{ fontSize: 12, color: '#b45309', lineHeight: 1.5 }}>
              {account.sent_today} sent successfully, {account.failed_today} failed. This may be caused by intermittent SMTP issues or daily sending limits.
              If this keeps happening, go to <em>Email Accounts</em> and verify the SMTP credentials.
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div style={{ padding: '20px 18px' }}>

          {/* Pool size warning */}
          {poolSize < 2 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', gap: 8 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }}/>
              <div>
                <strong>Need more accounts in the warmup pool!</strong> Currently {poolSize} account{poolSize!==1?'s':''} enabled.
                Enable warmup on at least 2 accounts for the network to work. The more accounts, the better the warmup!
              </div>
            </div>
          )}

          {/* ── Warmup Persona (AI content context) ── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              🤖 AI Warmup Persona
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>
                — tells the AI what to write about so emails look like real business conversations
              </span>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)', border: '1px solid #c4b5fd', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#5b21b6', marginBottom: 12, lineHeight: 1.5 }}>
                ✨ Instead of generic "just checking in" emails, AdoBoost generates unique story-driven business emails contextual to your product — just like Mailflow, but smarter. Requires OpenAI API key in your server settings.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
                    🏢 Company / Sender Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nexxis Digital"
                    value={form.warmup_company}
                    onChange={e => f('warmup_company', e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
                    🚀 Product / Service
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SEO audit software"
                    value={form.warmup_product}
                    onChange={e => f('warmup_product', e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
                  🏷️ Industry / Niche
                </label>
                <select
                  value={form.warmup_industry}
                  onChange={e => f('warmup_industry', e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="">— Select your industry —</option>
                  {[
                    'SaaS / Software', 'Digital Marketing Agency', 'SEO & Content', 'E-commerce',
                    'Recruiting / Staffing', 'Real Estate', 'Finance & Fintech', 'Consulting',
                    'Web Design & Development', 'Social Media Marketing', 'Video Production',
                    'Accounting & Bookkeeping', 'HR & People Ops', 'Sales & CRM', 'Legal Services',
                    'Healthcare & MedTech', 'Education & E-learning', 'Logistics & Supply Chain',
                    'PR & Communications', 'Other',
                  ].map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              {(!form.warmup_product && !form.warmup_company && !form.warmup_industry) && (
                <div style={{ marginTop: 10, fontSize: 11, color: '#7c3aed', background: '#f5f3ff', borderRadius: 6, padding: '6px 10px' }}>
                  💡 Without a persona, emails fall back to generic templates. Fill in at least one field for AI-powered content.
                </div>
              )}
            </div>
          </div>

          {/* Ramp presets */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="var(--primary)"/> Choose Ramp Speed
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
              {RAMP_PRESETS.map(p => (
                <button key={p.id} onClick={() => applyPreset(p)} style={{
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${preset === p.id ? 'var(--primary)' : 'var(--border2)'}`,
                  background: preset === p.id ? 'var(--primary-dim)' : '#fff', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{p.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: p.badgeBg, color: p.badgeColor }}>{p.badge}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{p.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>Start: {p.start} · +{p.increment}/day · Cap: {p.max} · ♾️ runs forever</div>
                </button>
              ))}
            </div>

            {/* Custom controls */}
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 12, color: 'var(--text2)' }}>⚙️ Custom Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Start (emails/day)', key: 'warmup_start_count', min: 1, max: 20,
                    tip: 'How many warmup emails to send on day 1. Keep low for new domains.' },
                  { label: 'Daily increment', key: 'warmup_increment', min: 1, max: 20,
                    tip: 'How many more emails to add each day. Lower = safer ramp.' },
                  { label: 'Daily cap (emails/day) ♾️', key: 'warmup_max_count', min: 10, max: 200,
                    tip: 'Warmup emails per day once fully ramped. Runs at this level every day until you pause.' },
                ].map(ctrl => (
                  <div key={ctrl.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                      {ctrl.label}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="range" min={ctrl.min} max={ctrl.max} value={form[ctrl.key]}
                        onChange={e => { f(ctrl.key, Number(e.target.value)); setPreset('custom'); }}
                        style={{ flex: 1, accentColor: 'var(--primary)' }} />
                      <input type="number" min={ctrl.min} max={ctrl.max} value={form[ctrl.key]}
                        onChange={e => { f(ctrl.key, Number(e.target.value)); setPreset('custom'); }}
                        style={{ width: 52, border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 6px', fontSize: 12, textAlign: 'center', outline: 'none' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{ctrl.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warmup schedule preview */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📅 Warmup Schedule Preview</div>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px' }}>
              {/* Ramp-up phase */}
              {Array.from({ length: Math.min(10, daysToMax) }, (_, i) => {
                const target    = Math.min(form.warmup_start_count + form.warmup_increment * i, form.warmup_max_count);
                const isCurrent = i === warmupDays && !reachedMax;
                const isPast    = i < warmupDays;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, opacity: isPast ? 0.5 : 1 }}>
                    <span style={{ fontSize: 11, color: isCurrent ? 'var(--primary)' : 'var(--text3)', width: 48, fontWeight: isCurrent ? 700 : 400 }}>
                      {isCurrent ? '→ Day ' : 'Day '}{i + 1}
                    </span>
                    <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${(target / form.warmup_max_count) * 100}%`, height: '100%', background: isPast ? '#86efac' : isCurrent ? 'var(--primary)' : '#cbd5e1', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: isCurrent ? 'var(--primary)' : 'var(--text3)', width: 60, fontWeight: isCurrent ? 700 : 400 }}>
                      {target} emails{isPast ? ' ✅' : ''}
                    </span>
                  </div>
                );
              })}
              {daysToMax > 10 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '4px 0 6px' }}>
                  … {daysToMax - 10} more ramp days to reach {form.warmup_max_count}/day
                </div>
              )}
              {/* Infinite ongoing phase */}
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'linear-gradient(135deg,#f0fff4,#f0f9ff)', border: '1px solid #86efac', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>♾️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                    Day {daysToMax + 1}+ — Runs at {form.warmup_max_count} emails/day forever
                  </div>
                  <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                    Warmup never stops automatically — it continues until you hit <strong>Pause</strong>.
                  </div>
                </div>
                {reachedMax && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                    ✅ At max now
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Recent warmup logs */}
          {logs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Recent Activity</div>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px', maxHeight: 200, overflowY: 'auto' }}>
                {logs.slice(0, 20).map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ fontSize: 14 }}>{log.direction === 'sent' ? '📤' : '↩️'}</span>
                    <span style={{ flex: 1, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.direction === 'sent' ? `Sent to ${log.partner_email}` : `Replied to ${log.partner_email}`}
                    </span>
                    <span style={{ color: log.status === 'sent' ? '#16a34a' : '#dc2626', fontWeight: 600, flexShrink: 0 }}>
                      {log.status === 'sent' ? '✅' : '❌'}
                    </span>
                    <span style={{ color: 'var(--text3)', flexShrink: 0, fontSize: 11 }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleSave} loading={saving}>💾 Save Warmup Settings</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main Warmup Page ─────────────────────────────
export default function Warmup() {
  const [accounts, setAccounts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [networkStats, setNetworkStats] = useState({ total: 0, active: 0, avgHealth: 0 });
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // { done, total, ok, fail }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: accounts }, { data: stats }] = await Promise.all([
        api.get('/email-accounts'),
        api.get('/warmup/stats'),
      ]);
      const statsMap = {};
      (stats || []).forEach(s => { statsMap[s.id] = s; });
      // Merge ALL stat fields (sent_today, failed_today, total_sent, total_replied)
      const enriched = (accounts || []).map(a => ({ ...a, ...(statsMap[a.id] || {}) }));
      setAccounts(enriched);
      const active = enriched.filter(a => a.warmup_enabled === 1);
      const avgHealth = active.length
        ? Math.round(active.reduce((s, a) => s + (a.warmup_health || 0), 0) / active.length)
        : 0;
      setNetworkStats({ total: enriched.length, active: active.length, avgHealth });
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (id, updates) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const activeAccounts  = accounts.filter(a => a.warmup_enabled === 1);
  const failedAccounts  = accounts.filter(a => a.warmup_enabled === 1 && (a.failed_today||0) > 0 && (a.sent_today||0) === 0);

  const bulkRetryAll = async () => {
    if (!failedAccounts.length) return;
    setBulkRetrying(true);
    setBulkProgress({ done: 0, total: failedAccounts.length, ok: 0, fail: 0 });
    try {
      // Returns immediately with a jobId — actual testing runs in background
      const { data } = await api.post('/email-accounts/bulk-retry-smtp', {
        account_ids: failedAccounts.map(a => a.id),
      });

      if (!data.jobId) { toast.error('Unexpected response'); setBulkRetrying(false); return; }

      // Poll for progress every 3 seconds
      const poll = setInterval(async () => {
        try {
          const { data: job } = await api.get(`/email-accounts/bulk-retry-status/${data.jobId}`);
          setBulkProgress({ done: job.done, total: job.total, ok: job.ok, fail: job.fail });

          if (job.status === 'done') {
            clearInterval(poll);
            setBulkRetrying(false);
            setBulkProgress(null);
            if (job.ok > 0) {
              toast.success(`✅ ${job.ok} inbox${job.ok>1?'es':''} reconnected!`);
              // Refresh account list so banners clear
              load();
            }
            if (job.fail > 0) toast.error(`❌ ${job.fail} still failing — update their passwords`);
          }
        } catch { clearInterval(poll); setBulkRetrying(false); setBulkProgress(null); }
      }, 3000);

    } catch (e) {
      toast.error(e.response?.data?.error || 'Bulk retry failed');
      setBulkRetrying(false);
      setBulkProgress(null);
    }
  };

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <PageHeader
        title="Email Warmup"
        subtitle="Build sender reputation with the AdoBoost Community Warmup Network"
        action={<Btn variant="secondary" onClick={load}><RefreshCw size={14}/> Refresh</Btn>}
      />

      {/* ── Network status banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>AdoBoost Community Warmup Network</div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
              Your accounts automatically exchange warmup emails with other AdoBoost users' accounts.
              Real inboxes, real opens, real replies — building your sender reputation organically.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {[
              { label: 'Pool Size', value: `${networkStats.active} accounts`, icon: '🌐' },
              { label: 'Avg Health', value: `${networkStats.avgHealth}%`, icon: '💪' },
              { label: 'Your Accounts', value: `${networkStats.total} total`, icon: '📧' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#0284c7', marginBottom: 10 }}>💡 How the Warmup Network Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { step: '1', icon: '📤', title: 'Auto Send', desc: 'Your account sends warmup emails to other accounts in the pool daily' },
            { step: '2', icon: '📥', title: 'Auto Receive', desc: 'Other accounts send warmup emails back to yours' },
            { step: '3', icon: '↩️', title: 'Auto Reply', desc: 'Received warmup emails get automatic human-like replies' },
            { step: '4', icon: '📈', title: 'Score Builds', desc: 'Your health score grows as you send more and get more replies' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#0369a1' }}>{s.icon} {s.title}</div>
                <div style={{ fontSize: 11, color: '#0369a1', opacity: 0.8, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Warning if not enough accounts ── */}
      {activeAccounts.length < 2 && accounts.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10 }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }}/>
          <div style={{ fontSize: 13, color: '#92400e' }}>
            <strong>Enable warmup on at least 2 accounts</strong> to activate the network.
            Currently {activeAccounts.length} account{activeAccounts.length !== 1 ? 's' : ''} active.
            The more accounts in the pool, the better the warmup quality!
          </div>
        </div>
      )}

      {/* ── Bulk retry banner ── */}
      {(failedAccounts.length > 0 || bulkRetrying) && (
        <div style={{ background: bulkRetrying ? '#f0f9ff' : '#fef2f2', border:`1px solid ${bulkRetrying ? '#bae6fd' : '#fecaca'}`, borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
          {bulkRetrying && bulkProgress ? (
            /* Progress state */
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <RefreshCw size={16} color="#0369a1" style={{ animation:'spin 1s linear infinite', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#0369a1' }}>
                    Reconnecting inboxes in background… {bulkProgress.done}/{bulkProgress.total}
                  </div>
                  <div style={{ fontSize:12, color:'#0284c7', marginTop:2 }}>
                    ✅ {bulkProgress.ok} reconnected · ❌ {bulkProgress.fail} failed · ⏳ {bulkProgress.total - bulkProgress.done} remaining
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height:6, background:'#e0f2fe', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#0284c7', borderRadius:99, width:`${(bulkProgress.done/bulkProgress.total)*100}%`, transition:'width 0.4s' }} />
              </div>
            </div>
          ) : (
            /* Idle state */
            <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:20 }}>🔴</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#991b1b', marginBottom:2 }}>
                  {failedAccounts.length} inbox{failedAccounts.length>1?'es':''} disconnected
                </div>
                <div style={{ fontSize:12, color:'#b91c1c' }}>
                  {failedAccounts.slice(0,5).map(a => a.from_email).join(', ')}{failedAccounts.length>5?` +${failedAccounts.length-5} more`:''}
                </div>
              </div>
              <button onClick={bulkRetryAll} disabled={bulkRetrying}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'#dc2626', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700, flexShrink:0 }}>
                <RefreshCw size={14} />
                🔄 Reconnect All {failedAccounts.length} Inboxes
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Account cards ── */}
      {loading ? <Spinner /> : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <Mail size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }}/>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No email accounts found</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Add email accounts first to start warming up.</div>
        </div>
      ) : (
        accounts.map(account => (
          <WarmupCard
            key={account.id}
            account={account}
            poolSize={activeAccounts.length}
            onUpdate={handleUpdate}
          />
        ))
      )}
    </div>
  );
}
