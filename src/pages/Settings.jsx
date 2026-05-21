import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Card, Btn, Input, Select, PageHeader, Alert, Badge } from '../components/UI';
import { User, CreditCard, Zap, Settings2, Key, Copy, Check, Lock, Star, Crown, Rocket, Shield } from 'lucide-react';

const PLANS = [
  {
    id: 'trial', name: 'Trial', price: 0,
    color: '#64748b', gradA: '#475569', gradB: '#64748b', glow: 'rgba(100,116,139,0.15)',
    icon: Zap,
    features: ['2 campaigns', '200 contacts', '50 emails/day'],
  },
  {
    id: 'starter', name: 'Starter', price: 29,
    color: '#16a34a', gradA: '#16a34a', gradB: '#22c55e', glow: 'rgba(22,163,74,0.15)',
    icon: Rocket,
    features: ['10 campaigns', '2,000 contacts', '500 emails/day', '3 email accounts'],
  },
  {
    id: 'professional', name: 'Professional', price: 79, popular: true,
    color: '#2563eb', gradA: '#2563eb', gradB: '#7c3aed', glow: 'rgba(37,99,235,0.18)',
    icon: Star,
    features: ['50 campaigns', '10,000 contacts', '2,000 emails/day', '6 accounts', 'API access'],
  },
  {
    id: 'unlimited', name: 'Unlimited', price: 199,
    color: '#7c3aed', gradA: '#7c3aed', gradB: '#a855f7', glow: 'rgba(124,58,237,0.18)',
    icon: Crown,
    features: ['Unlimited everything', 'White-label', 'API access'],
  },
];

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
  const { user, loading } = useScopedUser();
  if (loading) return null;

  const currentPlan = PLANS.find(p => p.id === user?.plan?.toLowerCase()) || PLANS[0];
  const PlanIcon = currentPlan.icon;

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
        {/* Glow orbs */}
        <div style={{ position:'absolute', top:-40, right:60, width:160, height:160, background:`radial-gradient(circle,${currentPlan.glow} 0%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, right:240, width:120, height:120, background:'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg,${currentPlan.gradA},${currentPlan.gradB})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${currentPlan.glow}`,
              flexShrink: 0,
            }}>
              <PlanIcon size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 3, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Current Plan
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, textTransform: 'capitalize' }}>
                {user?.plan}
              </div>
              {user?.plan === 'trial' && (
                <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                  ⚠ Trial account — upgrade to unlock all features
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Account</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {user?.role === 'admin' ? 'Account Owner' : 'Managed by admin'}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade section */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Choose Your Plan
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {PLANS.map(p => {
            const isCurrent = user?.plan?.toLowerCase() === p.id;
            const Icon = p.icon;
            return (
              <div key={p.id} style={{
                border: isCurrent ? `2px solid ${p.color}` : '1px solid var(--border)',
                borderRadius: 14,
                background: isCurrent ? '#fff' : 'var(--bg3)',
                padding: '20px 18px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.18s, box-shadow 0.18s',
                boxShadow: isCurrent ? `0 4px 20px ${p.glow}, var(--shadow)` : 'var(--shadow)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${p.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isCurrent ? `0 4px 20px ${p.glow}, var(--shadow)` : 'var(--shadow)'; }}
              >
                {/* Top accent strip */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg,${p.gradA},${p.gradB})`,
                  borderRadius: '14px 14px 0 0',
                }} />

                {/* Popular badge */}
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: `linear-gradient(135deg,${p.gradA},${p.gradB})`,
                    color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px',
                    borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    Popular
                  </div>
                )}

                {/* Plan icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, marginBottom: 14,
                  background: `linear-gradient(135deg,${p.gradA},${p.gradB})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 3px 10px ${p.glow}`,
                }}>
                  <Icon size={17} color="#fff" />
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--text)', letterSpacing: '-0.02em' }}>{p.name}</div>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: p.color, letterSpacing: '-0.04em' }}>${p.price}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>/mo</span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: `linear-gradient(135deg,${p.gradA},${p.gradB})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={8} color="#fff" strokeWidth={3} />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div style={{ fontSize: 12, color: p.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Check size={13} /> Current Plan
                  </div>
                ) : (
                  <button style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${p.color}`,
                    background: 'transparent', color: p.color, fontSize: 12.5, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${p.gradA},${p.gradB})`; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = `1.5px solid transparent`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = p.color; e.currentTarget.style.border = `1.5px solid ${p.color}`; }}
                  >
                    Upgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {user?.role === 'admin'
        ? <Alert type="info">To change your subscription plan, contact <strong>AdoBoost support</strong> and we'll upgrade your account.</Alert>
        : <Alert type="info">To upgrade your plan, contact your administrator or reach out to support.</Alert>
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
              {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Manila', 'Asia/Tokyo', 'Australia/Sydney'].map(t => <option key={t} value={t}>{t}</option>)}
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

export function UserPreferences() {
  const { user, loading } = useScopedUser();
  const [form, setForm] = useState({ notify_replies: true, can_spam_footer: true, notify_email: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) setForm({ notify_replies: user.notify_replies !== 0, can_spam_footer: user.can_spam_footer !== 0, notify_email: user.notify_email || user.email || '' });
  }, [user]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/auth/settings', form); toast.success('Preferences saved'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
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

  const canAccess = userData?.role === 'admin' || ['professional', 'unlimited'].includes(userData?.plan?.toLowerCase());
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
