import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Spinner, Btn } from '../components/UI';
import { Flame, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Play, Pause, RefreshCw, TrendingUp, Mail, Users, Shield } from 'lucide-react';

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

// ── Warmup Account Card ──────────────────────────
function WarmupCard({ account, poolSize, onUpdate }) {
  const [expanded, setExpanded]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [logs, setLogs]           = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [preset, setPreset]       = useState('standard');
  const [form, setForm] = useState({
    warmup_enabled:    account.warmup_enabled === 1,
    warmup_start_count: account.warmup_start_count || 5,
    warmup_increment:  account.warmup_increment   || 5,
    warmup_max_count:  account.warmup_max_count   || 50,
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const health = account.warmup_health || 0;
  const warmupDays = account.warmup_days || 0;
  const todayTarget = Math.min(
    (form.warmup_start_count) + (form.warmup_increment * warmupDays),
    form.warmup_max_count
  );
  const daysToFull = form.warmup_max_count > form.warmup_start_count
    ? Math.ceil((form.warmup_max_count - form.warmup_start_count) / form.warmup_increment)
    : 0;

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
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{account.from_email}</div>
          {/* Progress stats */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>📅 Day <strong>{warmupDays}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              📨 Today: <strong style={{ color: account.sent_today > 0 ? '#2563eb' : undefined }}>
                {account.sent_today}/{todayTarget}
              </strong> sent
            </span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>🎯 Max: <strong>{form.warmup_max_count}/day</strong></span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>⏱ Full warmup in <strong>~{daysToFull} days</strong></span>
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
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>Start: {p.start} · +{p.increment}/day · Max: {p.max}</div>
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
                  { label: 'Maximum (emails/day)', key: 'warmup_max_count', min: 10, max: 200,
                    tip: 'The maximum warmup emails to send per day. 40-50 is ideal.' },
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
              {Array.from({ length: Math.min(10, daysToFull + 1) }, (_, i) => {
                const target = Math.min(form.warmup_start_count + form.warmup_increment * i, form.warmup_max_count);
                const isCurrent = i === warmupDays;
                const isPast = i < warmupDays;
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
              {daysToFull > 10 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '4px 0' }}>
                  ... and {daysToFull - 10} more days to reach {form.warmup_max_count}/day
                </div>
              )}
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
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [networkStats, setNetworkStats] = useState({ total: 0, active: 0, avgHealth: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: accounts }, { data: stats }] = await Promise.all([
        api.get('/email-accounts'),
        api.get('/warmup/stats'),
      ]);
      const statsMap = {};
      (stats || []).forEach(s => { statsMap[s.id] = s; });
      const enriched = (accounts || []).map(a => ({ ...a, sent_today: statsMap[a.id]?.sent_today || 0 }));
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

  const activeAccounts = accounts.filter(a => a.warmup_enabled === 1);

  return (
    <div>
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
