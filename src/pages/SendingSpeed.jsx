import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Spinner, Btn } from '../components/UI';
import { Zap, Clock, Mail, Shield, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

// ── 2026 Best Practice Recommendations ──────────
const PRESETS = [
  {
    id: 'safe',
    label: '🛡️ Safe & Recommended',
    badge: 'RECOMMENDED',
    badgeColor: '#16a34a',
    badgeBg: '#f0fff4',
    description: 'Best for new domains or accounts under 3 months old. Mimics natural human sending patterns. Lowest spam risk.',
    emails_per_hour: 10,
    daily_limit: 50,
    delay_min: 45,
    delay_max: 120,
    pros: ['Lowest spam risk', 'Great for new domains', 'Passes all spam filters', 'Builds sender reputation'],
    cons: ['Slower outreach volume'],
  },
  {
    id: 'moderate',
    label: '⚡ Moderate',
    badge: 'POPULAR',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    description: 'Ideal for warmed-up accounts 3-6 months old. Good balance of speed and deliverability.',
    emails_per_hour: 20,
    daily_limit: 150,
    delay_min: 30,
    delay_max: 90,
    pros: ['Good send volume', 'Safe for warmed accounts', 'High deliverability'],
    cons: ['Not ideal for new domains'],
  },
  {
    id: 'aggressive',
    label: '🚀 Aggressive',
    badge: 'USE WITH CAUTION',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    description: 'For established domains with 6+ months of sending history. Monitor spam rates closely.',
    emails_per_hour: 40,
    daily_limit: 300,
    delay_min: 20,
    delay_max: 60,
    pros: ['High volume outreach', 'Fast campaign completion'],
    cons: ['Higher spam risk', 'Needs warmed domain', 'Monitor closely'],
  },
  {
    id: 'custom',
    label: '⚙️ Custom',
    badge: 'ADVANCED',
    badgeColor: '#7c3aed',
    badgeBg: '#f5f3ff',
    description: 'Set your own values. Not recommended unless you know what you\'re doing.',
    emails_per_hour: null,
    daily_limit: null,
    delay_min: null,
    delay_max: null,
    pros: ['Full control'],
    cons: ['No guardrails', 'Risk of domain blocking'],
  },
];

// Warning thresholds
const WARN_DAILY   = 500;
const MAX_DAILY    = 1500;
const WARN_PER_HR  = 50;
const MAX_PER_HR   = 100;

function RiskBar({ value, max, warn }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= warn ? (value >= max * 0.85 ? '#dc2626' : '#d97706') : '#16a34a';
  return (
    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s, background 0.3s' }} />
    </div>
  );
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Info size={13} style={{ color: 'var(--text3)', cursor: 'pointer', marginLeft: 4 }}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && (
        <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', fontSize: 11, padding: '6px 10px', borderRadius: 8, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', maxWidth: 220, whiteSpace: 'normal', lineHeight: 1.5 }}>
          {text}
        </div>
      )}
    </span>
  );
}

// ── Confirmation Modal ───────────────────────────
function ConfirmModal({ account, settings, onConfirm, onCancel }) {
  const isRisky = settings.daily_limit > WARN_DAILY || settings.emails_per_hour > WARN_PER_HR;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', zIndex: 1 }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: isRisky ? '#fef3c7' : '#f0fff4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            {isRisky ? <AlertTriangle size={28} color="#d97706" /> : <CheckCircle size={28} color="#16a34a" />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
            {isRisky ? 'Are you sure about this?' : 'Confirm Settings'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
            You're about to apply these settings to <strong>{account.name}</strong>
          </div>
        </div>

        {/* Settings summary */}
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          {[
            { label: 'Emails per hour', value: `${settings.emails_per_hour}/hr` },
            { label: 'Daily limit', value: `${settings.daily_limit} emails/day` },
            { label: 'Delay between emails', value: `${settings.delay_min}–${settings.delay_max} seconds (random)` },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)' }}>{s.label}</span>
              <span style={{ fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Risk warning */}
        {isRisky && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            <strong>⚠️ High Volume Warning:</strong> Sending {settings.daily_limit}+ emails/day or {settings.emails_per_hour}+ per hour increases the risk of your domain being flagged as spam. Make sure your domain is properly warmed up before proceeding.
          </div>
        )}

        {settings.daily_limit >= MAX_DAILY && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
            <strong>🔴 Maximum Limit Reached:</strong> Sending 1,500 emails/day is the absolute maximum. We strongly do NOT recommend this unless you have a dedicated IP and fully warmed domain (12+ months). This can permanently damage your domain reputation.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            ← Keep Recommended Settings
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', background: isRisky ? '#d97706' : 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {isRisky ? '⚠️ Yes, Apply Anyway' : '✅ Apply Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Account Speed Card ───────────────────────────
function AccountSpeedCard({ account, onSave }) {
  const [preset, setPreset]       = useState('safe');
  const [expanded, setExpanded]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(false);
  const [showTips, setShowTips]   = useState(false);
  const [form, setForm] = useState({
    emails_per_hour: account.emails_per_hour || 10,
    daily_limit:     account.daily_limit     || 50,
    delay_min:       account.delay_min       || 45,
    delay_max:       account.delay_max       || 120,
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: Number(v) }));

  const applyPreset = (p) => {
    setPreset(p.id);
    if (p.id !== 'custom') {
      setForm({ emails_per_hour: p.emails_per_hour, daily_limit: p.daily_limit, delay_min: p.delay_min, delay_max: p.delay_max });
    }
  };

  const isRisky = form.daily_limit > WARN_DAILY || form.emails_per_hour > WARN_PER_HR;
  const isDanger = form.daily_limit >= MAX_DAILY;

  const handleSave = () => {
    if (form.delay_min >= form.delay_max) return toast.error('Min delay must be less than max delay');
    if (form.delay_min < 10) return toast.error('Minimum delay is 10 seconds');
    if (form.daily_limit > MAX_DAILY) return toast.error(`Daily limit cannot exceed ${MAX_DAILY}`);
    if (form.emails_per_hour > MAX_PER_HR) return toast.error(`Max ${MAX_PER_HR} emails per hour`);
    setConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true); setConfirm(false);
    try {
      await api.put(`/email-accounts/${account.id}`, { ...form, daily_limit: form.daily_limit });
      toast.success(`✅ Speed settings saved for ${account.name}`);
      onSave(account.id, form);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const currentPreset = PRESETS.find(p => p.id === preset);

  return (
    <>
      <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {account.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{account.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{account.from_email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Current speed summary */}
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{form.emails_per_hour}/hr</span> · <span style={{ fontWeight: 600, color: 'var(--text)' }}>{form.daily_limit}/day</span>
              <br/><span>{form.delay_min}–{form.delay_max}s delay</span>
            </div>
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text2)' }}>
              {expanded ? <><ChevronUp size={13}/> Collapse</> : <><ChevronDown size={13}/> Configure</>}
            </button>
          </div>
        </div>

        {expanded && (
          <div style={{ padding: '20px 18px' }}>

            {/* ── Preset selector ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="var(--primary)"/> Choose a Speed Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => applyPreset(p)} style={{
                    padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    border: `2px solid ${preset === p.id ? (p.id === 'aggressive' ? '#d97706' : 'var(--primary)') : 'var(--border2)'}`,
                    background: preset === p.id ? (p.id === 'aggressive' ? '#fffbeb' : 'var(--primary-dim)') : '#fff',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{p.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: p.badgeBg, color: p.badgeColor }}>
                        {p.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{p.description}</div>
                    {p.id !== 'custom' && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 12 }}>
                        <span>📨 {p.emails_per_hour}/hr</span>
                        <span>📅 {p.daily_limit}/day</span>
                        <span>⏱ {p.delay_min}–{p.delay_max}s</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 2026 Best Practices tip ── */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <button onClick={() => setShowTips(t => !t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0284c7' }}>💡 2026 Cold Email Best Practices</span>
                {showTips ? <ChevronUp size={13} color="#0284c7"/> : <ChevronDown size={13} color="#0284c7"/>}
              </button>
              {showTips && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#0369a1', lineHeight: 1.8 }}>
                  <div>📧 <strong>Send max 30–50 emails/day per account</strong> for new domains (&lt;6 months)</div>
                  <div>⏱ <strong>Use 45–120 second delays</strong> — mimics human behavior, avoids spam filters</div>
                  <div>🕐 <strong>Send during business hours</strong> — 9am–5pm recipient's timezone gets best open rates</div>
                  <div>📊 <strong>Keep spam rate below 0.1%</strong> — Google & Yahoo enforce this in 2026</div>
                  <div>🔄 <strong>Rotate between 2–3 email accounts</strong> instead of pushing one account hard</div>
                  <div>🌡️ <strong>Warm up new accounts for 4–6 weeks</strong> before launching cold campaigns</div>
                  <div>🛡️ <strong>Set up SPF, DKIM, DMARC</strong> on your domain before any sending</div>
                </div>
              )}
            </div>

            {/* ── Custom controls ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* Emails per hour */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Mail size={13} style={{ marginRight: 5 }}/> Emails per Hour
                  <InfoTip text="How many emails to send per hour. Lower = safer. Recommended: 10–20/hr for most accounts." />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={1} max={MAX_PER_HR} value={form.emails_per_hour}
                    onChange={e => { f('emails_per_hour', e.target.value); setPreset('custom'); }}
                    style={{ flex: 1, accentColor: form.emails_per_hour > WARN_PER_HR ? '#dc2626' : 'var(--primary)' }} />
                  <input type="number" min={1} max={MAX_PER_HR} value={form.emails_per_hour}
                    onChange={e => { f('emails_per_hour', e.target.value); setPreset('custom'); }}
                    style={{ width: 60, border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                </div>
                <RiskBar value={form.emails_per_hour} max={MAX_PER_HR} warn={WARN_PER_HR} />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {form.emails_per_hour <= 10 ? '✅ Very safe' : form.emails_per_hour <= 20 ? '✅ Safe' : form.emails_per_hour <= 40 ? '⚠️ Moderate risk' : '🔴 High risk'}
                </div>
              </div>

              {/* Daily limit */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Clock size={13} style={{ marginRight: 5 }}/> Daily Limit
                  <InfoTip text={`Max emails to send per day. Hard cap: ${MAX_DAILY}. NOT recommended to use max — risks domain blocking.`} />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={10} max={MAX_DAILY} step={10} value={form.daily_limit}
                    onChange={e => { f('daily_limit', e.target.value); setPreset('custom'); }}
                    style={{ flex: 1, accentColor: form.daily_limit > WARN_DAILY ? '#dc2626' : 'var(--primary)' }} />
                  <input type="number" min={10} max={MAX_DAILY} value={form.daily_limit}
                    onChange={e => { f('daily_limit', e.target.value); setPreset('custom'); }}
                    style={{ width: 70, border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                </div>
                <RiskBar value={form.daily_limit} max={MAX_DAILY} warn={WARN_DAILY} />
                <div style={{ fontSize: 11, color: form.daily_limit >= MAX_DAILY ? '#dc2626' : form.daily_limit >= WARN_DAILY ? '#d97706' : 'var(--text3)', marginTop: 4 }}>
                  {form.daily_limit <= 50 ? '✅ Very safe' : form.daily_limit <= 150 ? '✅ Safe' : form.daily_limit <= 300 ? '⚠️ Use with caution' : form.daily_limit >= MAX_DAILY ? '🔴 NOT recommended — domain risk' : '🔴 High risk'}
                </div>
              </div>
            </div>

            {/* Delay between emails */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Zap size={13} style={{ marginRight: 5 }}/> Random Delay Between Emails
                <InfoTip text="Each email waits a random amount of time between min and max seconds. This mimics human behavior and avoids spam filters." />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Minimum delay (seconds)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="range" min={10} max={300} value={form.delay_min}
                      onChange={e => { f('delay_min', e.target.value); setPreset('custom'); }}
                      style={{ flex: 1, accentColor: 'var(--primary)' }} />
                    <input type="number" min={10} max={300} value={form.delay_min}
                      onChange={e => { f('delay_min', e.target.value); setPreset('custom'); }}
                      style={{ width: 60, border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Maximum delay (seconds)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="range" min={10} max={600} value={form.delay_max}
                      onChange={e => { f('delay_max', e.target.value); setPreset('custom'); }}
                      style={{ flex: 1, accentColor: 'var(--primary)' }} />
                    <input type="number" min={10} max={600} value={form.delay_max}
                      onChange={e => { f('delay_max', e.target.value); setPreset('custom'); }}
                      style={{ width: 60, border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                  </div>
                </div>
              </div>
              {/* Visual delay preview */}
              <div style={{ marginTop: 10, background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text2)' }}>
                🤖 Each email will wait <strong>{form.delay_min}–{form.delay_max} seconds</strong> randomly before the next one sends.
                At {form.emails_per_hour} emails/hour, you're sending roughly one email every <strong>{Math.round(3600/form.emails_per_hour)} seconds</strong>.
                {form.delay_max < Math.round(3600/form.emails_per_hour)
                  ? <span style={{ color:'#16a34a' }}> ✅ Delay is consistent with your hourly rate.</span>
                  : <span style={{ color:'#d97706' }}> ⚠️ Your max delay may slow you below your hourly rate target.</span>
                }
              </div>
            </div>

            {/* Pros/Cons of selected preset */}
            {currentPreset && currentPreset.id !== 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#f0fff4', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 6 }}>✅ Pros</div>
                  {currentPreset.pros.map(p => <div key={p} style={{ fontSize: 12, color: '#166534', marginBottom: 3 }}>• {p}</div>)}
                </div>
                <div style={{ background: '#fff5f5', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>⚠️ Cons</div>
                  {currentPreset.cons.map(c => <div key={c} style={{ fontSize: 12, color: '#991b1b', marginBottom: 3 }}>• {c}</div>)}
                </div>
              </div>
            )}

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {isRisky && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d97706' }}>
                  <AlertTriangle size={13}/> Settings above recommended thresholds
                </div>
              )}
              <Btn onClick={handleSave} loading={saving} variant={isDanger ? 'danger' : 'primary'}>
                {saving ? 'Saving...' : '💾 Save Settings'}
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {confirm && <ConfirmModal account={account} settings={form} onConfirm={confirmSave} onCancel={() => setConfirm(false)} />}
    </>
  );
}

// ── Main SendingSpeed Page ───────────────────────
export default function SendingSpeed() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/email-accounts')
      .then(r => setAccounts(r.data || []))
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (id, newSettings) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...newSettings } : a));
  };

  return (
    <div>
      <PageHeader
        title="Sending Speed"
        subtitle="Control how fast each email account sends — protect your domain reputation"
      />

      {/* Global info banner */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Shield size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0284c7', marginBottom: 4 }}>Domain Protection Mode</div>
          <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.6 }}>
            Settings are applied <strong>per email account</strong> for maximum safety. Each account has its own speed profile.
            Random delays between emails make your sending pattern look human and avoid spam filters.
            The <strong>hard limit is 1,500 emails/day</strong> — but we strongly recommend staying under 300/day per account.
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <Mail size={40} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No email accounts found</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Add an email account first to configure sending speed.</div>
        </div>
      ) : (
        accounts.map(account => (
          <AccountSpeedCard key={account.id} account={account} onSave={handleSave} />
        ))
      )}
    </div>
  );
}
