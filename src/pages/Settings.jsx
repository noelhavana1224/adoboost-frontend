import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Card, Btn, Input, Select, PageHeader, Alert, Badge } from '../components/UI';
import { User, CreditCard, Zap, Settings2, Key, Copy, Check, Lock, Star, Crown, Rocket, Shield } from 'lucide-react';

// Visual styles keyed by position (index 0–3) so they survive plan renames
const PLAN_STYLES = [
  { color: '#64748b', gradA: '#475569', gradB: '#64748b', glow: 'rgba(100,116,139,0.15)', icon: Zap },
  { color: '#16a34a', gradA: '#16a34a', gradB: '#22c55e', glow: 'rgba(22,163,74,0.15)',   icon: Rocket },
  { color: '#2563eb', gradA: '#2563eb', gradB: '#7c3aed', glow: 'rgba(37,99,235,0.18)',   icon: Star, popular: true },
  { color: '#7c3aed', gradA: '#7c3aed', gradB: '#a855f7', glow: 'rgba(124,58,237,0.18)', icon: Crown },
];

// Auto-generate feature bullets from DB plan limits
function buildBullets(p) {
  const bullets = [];
  if (p.max_campaigns >= 999)   bullets.push('Unlimited campaigns');
  else                          bullets.push(`${p.max_campaigns} campaign${p.max_campaigns !== 1 ? 's' : ''}`);

  if (p.max_contacts >= 999999) bullets.push('Unlimited contacts');
  else                          bullets.push(`${Number(p.max_contacts).toLocaleString()} contacts`);

  bullets.push(`${Number(p.max_emails_per_day).toLocaleString()} emails/day`);

  if (p.max_email_accounts >= 999) bullets.push('Unlimited email accounts');
  else if (p.max_email_accounts > 1) bullets.push(`${p.max_email_accounts} email accounts`);
  else if (p.max_email_accounts === 1) bullets.push('1 email account');

  if (p.max_ai_credits >= 9999) bullets.push('Unlimited AI credits/mo');
  else if (p.max_ai_credits > 0) bullets.push(`${Number(p.max_ai_credits).toLocaleString()} AI credits/mo`);

  return bullets;
}

function useScopedUser() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/auth/me')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);
  return { user: data, loading };
}

export function Billing() {
  const { user, loading: userLoading } = useScopedUser();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    api.get('/plans')
      .then(r => setPlans(r.data || []))
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  if (userLoading || plansLoading) return null;

  // Match current user plan to a DB plan by name (case-insensitive)
  const currentDbPlan = plans.find(p => p.name.toLowerCase() === user?.plan?.toLowerCase());
  // Visual style by plan position (survives renames)
  const currentIdx = plans.findIndex(p => p.name.toLowerCase() === user?.plan?.toLowerCase());
  const currentStyle = PLAN_STYLES[currentIdx] || PLAN_STYLES[0];
  const PlanIcon = currentStyle.icon;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="Billing & Subscription" subtitle="Manage your plan and subscription details." />

      {/* Current Plan Banner */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#0c1445 100%)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
      }}>
        <div style={{ position:'absolute', top:-40, right:60, width:160, height:160, background:`radial-gradient(circle,${currentStyle.glow} 0%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, right:240, width:120, height:120, background:'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg,${currentStyle.gradA},${currentStyle.gradB})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${currentStyle.glow}`, flexShrink: 0,
            }}>
              <PlanIcon size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 3, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Current Plan
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                {currentDbPlan?.name || user?.plan}
              </div>
              {currentDbPlan && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3, fontWeight: 500 }}>
                  ${currentDbPlan.price_monthly}/mo
                  {currentDbPlan.max_ai_credits >= 9999
                    ? ' · Unlimited AI credits'
                    : currentDbPlan.max_ai_credits > 0
                      ? ` · ${currentDbPlan.max_ai_credits} AI credits/mo`
                      : ''}
                </div>
              )}
              {user?.plan?.toLowerCase() === 'trial' && (
                <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4, fontWeight: 500 }}>
                  ⚠ Trial account — upgrade to unlock all features
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Account</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {user?.role !== 'team_member' ? 'Account Owner' : 'Managed by admin'}
            </div>
          </div>
        </div>
      </div>

      {/* Plan grid — fully driven by DB */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Choose Your Plan
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {plans.map((p, idx) => {
            const style = PLAN_STYLES[idx] || PLAN_STYLES[PLAN_STYLES.length - 1];
            const Icon  = style.icon;
            const isCurrent = p.name.toLowerCase() === user?.plan?.toLowerCase();
            const bullets = buildBullets(p);
            return (
              <div key={p.id} style={{
                border: isCurrent ? `2px solid ${style.color}` : '1px solid var(--border)',
                borderRadius: 14,
                background: isCurrent ? '#fff' : 'var(--bg3)',
                padding: '20px 18px',
                position: 'relative', overflow: 'hidden',
                transition: 'transform 0.18s, box-shadow 0.18s',
                boxShadow: isCurrent ? `0 4px 20px ${style.glow}, var(--shadow)` : 'var(--shadow)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${style.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isCurrent ? `0 4px 20px ${style.glow}, var(--shadow)` : 'var(--shadow)'; }}
              >
                {/* Top accent strip */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${style.gradA},${style.gradB})`, borderRadius:'14px 14px 0 0' }} />

                {/* Popular badge */}
                {style.popular && (
                  <div style={{
                    position:'absolute', top:12, right:12,
                    background:`linear-gradient(135deg,${style.gradA},${style.gradB})`,
                    color:'#fff', fontSize:9, fontWeight:700, padding:'3px 8px',
                    borderRadius:20, letterSpacing:'0.06em', textTransform:'uppercase',
                  }}>Popular</div>
                )}

                {/* Plan icon */}
                <div style={{
                  width:36, height:36, borderRadius:10, marginBottom:14,
                  background:`linear-gradient(135deg,${style.gradA},${style.gradB})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 3px 10px ${style.glow}`,
                }}>
                  <Icon size={17} color="#fff" />
                </div>

                <div style={{ fontWeight:700, fontSize:15, marginBottom:6, color:'var(--text)', letterSpacing:'-0.02em' }}>{p.name}</div>
                <div style={{ marginBottom:14 }}>
                  <span style={{ fontSize:26, fontWeight:800, color:style.color, letterSpacing:'-0.04em' }}>${p.price_monthly}</span>
                  <span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>/mo</span>
                </div>

                <div style={{ marginBottom:16 }}>
                  {bullets.map(f => (
                    <div key={f} style={{ fontSize:12, color:'var(--text2)', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:14, height:14, borderRadius:'50%', background:`linear-gradient(135deg,${style.gradA},${style.gradB})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Check size={8} color="#fff" strokeWidth={3} />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div style={{ fontSize:12, color:style.color, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                    <Check size={13} /> Current Plan
                  </div>
                ) : (
                  <button style={{
                    width:'100%', padding:'8px 12px', borderRadius:8, border:`1.5px solid ${style.color}`,
                    background:'transparent', color:style.color, fontSize:12.5, fontWeight:700,
                    cursor:'pointer', transition:'all 0.18s', fontFamily:'inherit',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background=`linear-gradient(135deg,${style.gradA},${style.gradB})`; e.currentTarget.style.color='#fff'; e.currentTarget.style.border='1.5px solid transparent'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=style.color; e.currentTarget.style.border=`1.5px solid ${style.color}`; }}
                  >
                    Upgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {user?.role === 'team_member'
        ? <Alert type="info">To upgrade the plan, ask your account owner to contact AdoBoost support.</Alert>
        : <Alert type="info">To change your subscription plan, contact <strong>AdoBoost support</strong> and we'll upgrade your account.</Alert>
      }
    </div>
  );
}

export function SendingSpeed() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState('');
  useEffect(() => { api.get('/email-accounts').then(r => setAccounts(r.data)); }, []);
  return (
    <div>
      <PageHeader title="Edit Sending Speed" />
      <Card style={{ padding: 24, maxWidth: 500 }}>
        <Select label="Select Email Account" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Select Email...</option>
          {accounts.map(a => <option key={a.id} value={a.id}>SMTP: {a.username} - {a.type}</option>)}
        </Select>
        {selected && (
          <div style={{ marginTop: 16 }}>
            <Alert type="info">Adjust the daily send limit for this account in Email Accounts settings.</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}

export function UserSettings() {
  const { user, loading } = useScopedUser();
  const [form, setForm] = useState({ name: '', company: '', country: '', city: '', timezone: 'UTC', password: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) setForm({ name: user.name || '', company: user.company || '', country: user.country || '', city: user.city || '', timezone: user.timezone || 'UTC', password: '' });
  }, [user]);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/auth/settings', form); toast.success('Settings updated'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };
  if (loading) return null;
  return (
    <div>
      <PageHeader title="User Settings" />
      <Card style={{ padding: 24, maxWidth: 700 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="First Name" value={form.name.split(' ')[0] || ''} onChange={e => f('name', `${e.target.value} ${form.name.split(' ').slice(1).join(' ')}`.trim())} />
            <Input label="Last Name" value={form.name.split(' ').slice(1).join(' ') || ''} onChange={e => f('name', `${form.name.split(' ')[0]} ${e.target.value}`.trim())} />
            <Input label="Email Address" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            <Input label="Company Name" value={form.company} onChange={e => f('company', e.target.value)} />
            <Input label="Country" value={form.country} onChange={e => f('country', e.target.value)} />
            <Input label="City" value={form.city} onChange={e => f('city', e.target.value)} />
            <Select label="Timezone" value={form.timezone} onChange={e => f('timezone', e.target.value)}>
              {[
                { v: 'UTC',                      l: 'UTC — Coordinated Universal Time' },
                // ── Americas ──
                { v: 'America/New_York',          l: 'New York (ET, UTC-5/-4)' },
                { v: 'America/Chicago',           l: 'Chicago (CT, UTC-6/-5)' },
                { v: 'America/Denver',            l: 'Denver (MT, UTC-7/-6)' },
                { v: 'America/Phoenix',           l: 'Phoenix (MT, UTC-7, no DST)' },
                { v: 'America/Los_Angeles',       l: 'Los Angeles (PT, UTC-8/-7)' },
                { v: 'America/Anchorage',         l: 'Anchorage (AKT, UTC-9/-8)' },
                { v: 'Pacific/Honolulu',          l: 'Honolulu (HT, UTC-10)' },
                { v: 'America/Toronto',           l: 'Toronto (ET, UTC-5/-4)' },
                { v: 'America/Vancouver',         l: 'Vancouver (PT, UTC-8/-7)' },
                { v: 'America/Mexico_City',       l: 'Mexico City (CT, UTC-6/-5)' },
                { v: 'America/Bogota',            l: 'Bogotá (COT, UTC-5)' },
                { v: 'America/Lima',              l: 'Lima (PET, UTC-5)' },
                { v: 'America/Sao_Paulo',         l: 'São Paulo (BRT, UTC-3)' },
                { v: 'America/Argentina/Buenos_Aires', l: 'Buenos Aires (ART, UTC-3)' },
                // ── Europe ──
                { v: 'Europe/London',             l: 'London (GMT/BST, UTC+0/+1)' },
                { v: 'Europe/Dublin',             l: 'Dublin (IST, UTC+0/+1)' },
                { v: 'Europe/Lisbon',             l: 'Lisbon (WET/WEST, UTC+0/+1)' },
                { v: 'Europe/Paris',              l: 'Paris (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Berlin',             l: 'Berlin (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Amsterdam',          l: 'Amsterdam (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Brussels',           l: 'Brussels (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Madrid',             l: 'Madrid (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Rome',               l: 'Rome (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Stockholm',          l: 'Stockholm (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Warsaw',             l: 'Warsaw (CET/CEST, UTC+1/+2)' },
                { v: 'Europe/Athens',             l: 'Athens (EET/EEST, UTC+2/+3)' },
                { v: 'Europe/Helsinki',           l: 'Helsinki (EET/EEST, UTC+2/+3)' },
                { v: 'Europe/Bucharest',          l: 'Bucharest (EET/EEST, UTC+2/+3)' },
                { v: 'Europe/Kiev',               l: 'Kyiv (EET/EEST, UTC+2/+3)' },
                { v: 'Europe/Moscow',             l: 'Moscow (MSK, UTC+3)' },
                { v: 'Europe/Istanbul',           l: 'Istanbul (TRT, UTC+3)' },
                // ── Africa ──
                { v: 'Africa/Cairo',              l: 'Cairo (EET, UTC+2)' },
                { v: 'Africa/Johannesburg',       l: 'Johannesburg (SAST, UTC+2)' },
                { v: 'Africa/Lagos',              l: 'Lagos (WAT, UTC+1)' },
                { v: 'Africa/Nairobi',            l: 'Nairobi (EAT, UTC+3)' },
                { v: 'Africa/Casablanca',         l: 'Casablanca (WET, UTC+0/+1)' },
                // ── Asia ──
                { v: 'Asia/Dubai',                l: 'Dubai (GST, UTC+4)' },
                { v: 'Asia/Riyadh',               l: 'Riyadh (AST, UTC+3)' },
                { v: 'Asia/Tehran',               l: 'Tehran (IRST, UTC+3:30)' },
                { v: 'Asia/Karachi',              l: 'Karachi (PKT, UTC+5)' },
                { v: 'Asia/Kolkata',              l: 'Kolkata / Mumbai (IST, UTC+5:30)' },
                { v: 'Asia/Colombo',              l: 'Colombo (IST, UTC+5:30)' },
                { v: 'Asia/Dhaka',                l: 'Dhaka (BST, UTC+6)' },
                { v: 'Asia/Rangoon',              l: 'Yangon (MMT, UTC+6:30)' },
                { v: 'Asia/Bangkok',              l: 'Bangkok (ICT, UTC+7)' },
                { v: 'Asia/Jakarta',              l: 'Jakarta (WIB, UTC+7)' },
                { v: 'Asia/Singapore',            l: 'Singapore (SGT, UTC+8)' },
                { v: 'Asia/Manila',               l: 'Manila (PST, UTC+8)' },
                { v: 'Asia/Hong_Kong',            l: 'Hong Kong (HKT, UTC+8)' },
                { v: 'Asia/Shanghai',             l: 'Shanghai / Beijing (CST, UTC+8)' },
                { v: 'Asia/Taipei',               l: 'Taipei (CST, UTC+8)' },
                { v: 'Asia/Tokyo',                l: 'Tokyo (JST, UTC+9)' },
                { v: 'Asia/Seoul',                l: 'Seoul (KST, UTC+9)' },
                // ── Australia / Pacific ──
                { v: 'Australia/Perth',           l: 'Perth (AWST, UTC+8)' },
                { v: 'Australia/Darwin',          l: 'Darwin (ACST, UTC+9:30)' },
                { v: 'Australia/Adelaide',        l: 'Adelaide (ACST/ACDT, UTC+9:30/+10:30)' },
                { v: 'Australia/Brisbane',        l: 'Brisbane (AEST, UTC+10)' },
                { v: 'Australia/Sydney',          l: 'Sydney / Melbourne (AEST/AEDT, UTC+10/+11)' },
                { v: 'Pacific/Auckland',          l: 'Auckland (NZST/NZDT, UTC+12/+13)' },
                { v: 'Pacific/Fiji',              l: 'Fiji (FJT, UTC+12)' },
              ].map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Input label="Change Password" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={e => f('password', e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn type="submit" loading={saving}>Update Settings</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Available variables for the custom unsubscribe field
const UNSUB_VARS = [
  { label: 'Unsubscribe URL', value: '{{unsubscribe_url}}' },
  { label: 'First Name',      value: '{{first_name}}' },
  { label: 'Last Name',       value: '{{last_name}}' },
  { label: 'Email',           value: '{{email}}' },
  { label: 'Company',         value: '{{company}}' },
  { label: 'From Name',       value: '{{from_name}}' },
  { label: 'From Email',      value: '{{from_email}}' },
];

function UnsubVarsDropdown({ onInsert }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen(p => !p)} style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
        background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 5,
        fontSize: 11, color: '#2563eb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>
        {'{ }'} Insert Variable
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 100,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '5px 10px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
              Variables
            </div>
            {UNSUB_VARS.map(v => (
              <button key={v.value} type="button" onClick={() => { onInsert(v.value); setOpen(false); }} style={{
                width: '100%', padding: '7px 12px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ color: '#374151' }}>{v.label}</span>
                <code style={{ fontSize: 10, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, color: '#2563eb' }}>{v.value}</code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function UserPreferences() {
  const { user, loading } = useScopedUser();
  const [form, setForm] = useState({ notify_replies: true, can_spam_footer: true, custom_unsubscribe_text: '', notify_email: '' });
  const [saving, setSaving] = useState(false);
  const unsubRef = React.useRef(null);

  useEffect(() => {
    if (user) setForm({
      notify_replies: user.notify_replies !== 0,
      can_spam_footer: user.can_spam_footer !== 0,
      custom_unsubscribe_text: user.custom_unsubscribe_text || '',
      notify_email: user.notify_email || user.email || '',
    });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/auth/settings', form); toast.success('Preferences saved'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const insertUnsubVar = (variable) => {
    const el = unsubRef.current;
    if (!el) { setForm(p => ({ ...p, custom_unsubscribe_text: p.custom_unsubscribe_text + variable })); return; }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const newVal = form.custom_unsubscribe_text.substring(0, start) + variable + form.custom_unsubscribe_text.substring(end);
    setForm(p => ({ ...p, custom_unsubscribe_text: newVal }));
    setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
  };

  if (loading) return null;
  return (
    <div>
      <PageHeader title="User Preferences" />
      <Card style={{ padding: 24, maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { key: 'can_spam_footer', label: 'CAN-SPAM Footer', desc: 'Include unsubscribe footer in all emails (recommended for compliance)' },
            { key: 'notify_replies', label: 'Reply Notification', desc: 'Receive email notifications when contacts reply to your campaigns' },
          ].map(p => (
            <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form[p.key]} onChange={e => setForm(f => ({ ...f, [p.key]: e.target.checked }))} style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.desc}</div>
              </div>
            </label>
          ))}
          {form.notify_replies && <Input label="Notification Email" type="email" value={form.notify_email} onChange={e => setForm(f => ({ ...f, notify_email: e.target.value }))} />}

          {/* Custom unsubscribe — shown only when CAN-SPAM footer is OFF */}
          {!form.can_spam_footer && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Custom Unsubscribe Footer</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    Shown at the bottom of every email in place of the CAN-SPAM footer. Use <code style={{ background:'#f1f5f9', padding:'1px 4px', borderRadius:3, fontSize:11 }}>{'{{unsubscribe_url}}'}</code> for the unsubscribe link.
                  </div>
                </div>
                <UnsubVarsDropdown onInsert={insertUnsubVar} />
              </div>
              <textarea
                ref={unsubRef}
                rows={3}
                placeholder={`You received this because you opted in. <a href="{{unsubscribe_url}}">Unsubscribe</a>`}
                value={form.custom_unsubscribe_text}
                onChange={e => setForm(f => ({ ...f, custom_unsubscribe_text: e.target.value }))}
                style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
              <div style={{ marginTop: 6, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#0369a1' }}>
                <strong>Available variables:</strong> {`{{unsubscribe_url}}`} · {`{{first_name}}`} · {`{{email}}`} · {`{{company}}`} · {`{{from_name}}`} · {`{{from_email}}`}
                <br/>
                <strong>Example:</strong> {`Hi {{first_name}}, to stop emails sent to {{email}}, <a href="{{unsubscribe_url}}">click here</a>.`}
              </div>
            </div>
          )}

          <Btn type="submit" loading={saving} style={{ alignSelf: 'flex-start' }}>Update Settings</Btn>
        </form>
      </Card>
    </div>
  );
}

export function ApiKey() {
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { api.get('/auth/me').then(r => setUserData(r.data)); }, []);

  const canAccess = ['professional', 'unlimited'].includes(userData?.plan?.toLowerCase());
  const copy = () => {
    navigator.clipboard.writeText(userData?.api_key || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (userData && !canAccess) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <PageHeader title="API Key" subtitle="Programmatic access to AdoBoost." />
        <Card style={{ padding: '48px 32px', maxWidth: 520, textAlign: 'center' }}>
          {/* Lock icon with gradient bg */}
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
            background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow)',
          }}>
            <Lock size={28} color="var(--text3)" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            API Access Not Available
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text3)', lineHeight: 1.65, maxWidth: 340, margin: '0 auto 24px' }}>
            API access is available on the <strong style={{ color: 'var(--text2)' }}>Professional</strong> and <strong style={{ color: 'var(--text2)' }}>Unlimited</strong> plans.
            Upgrade your plan to get programmatic access to your campaigns and contacts.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/settings/billing">
              <Btn>Upgrade Plan →</Btn>
            </Link>
            <Link to="/support/ticket">
              <Btn variant="secondary">Contact Support</Btn>
            </Link>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
            {[{ label: 'Professional', price: '$79/mo', color: '#2563eb' }, { label: 'Unlimited', price: '$199/mo', color: '#7c3aed' }].map(p => (
              <div key={p.label} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid var(--border)`, background: 'var(--bg3)', fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: p.color }}>{p.label}</span>
                <span style={{ color: 'var(--text3)', marginLeft: 6 }}>{p.price}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="API Key" subtitle="Programmatic access to AdoBoost." />
      <Card style={{ padding: 24, maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 9 }}>
          <Check size={15} color="#16a34a" />
          <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>API access enabled on your {userData?.plan} plan</span>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.65 }}>
          Use this key to access the AdoBoost API. Keep it secure — do not share it publicly.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            readOnly
            value={userData?.api_key || 'Loading...'}
            style={{
              flex: 1, background: 'var(--bg3)', border: '1.5px solid var(--border)',
              borderRadius: 9, padding: '10px 14px', fontSize: 13, color: 'var(--text)',
              outline: 'none', fontFamily: 'monospace', letterSpacing: '0.03em',
            }}
          />
          <Btn variant="secondary" onClick={copy}>
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </Btn>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          Include in requests as:{' '}
          <code style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: 5, fontSize: 12 }}>
            Authorization: Bearer YOUR_API_KEY
          </code>
        </p>
      </Card>
    </div>
  );
}
