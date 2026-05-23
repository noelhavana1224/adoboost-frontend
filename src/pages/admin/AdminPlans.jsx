import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Spinner, Modal, Input } from '../../components/UI';
import { Edit2, Zap } from 'lucide-react';

const PLAN_ACCENT = {
  trial:        { color: '#64748b', bg: '#f1f5f9' },
  starter:      { color: '#1565C0', bg: '#eff6ff' },
  professional: { color: '#16a34a', bg: '#f0fdf4' },
  unlimited:    { color: '#7c3aed', bg: '#faf5ff' },
};

function fmtNum(n, unlimitedAt = 999) {
  if (!n && n !== 0) return '—';
  return n >= unlimitedAt ? 'Unlimited' : Number(n).toLocaleString();
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/admin/plans').then(r => setPlans(r.data));
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Plan Management" subtitle="Configure pricing, feature limits, and AI credit allowances per plan" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 18 }}>
        {plans.map(p => {
          const slug = p.name.toLowerCase();
          const accent = PLAN_ACCENT[slug] || { color: '#64748b', bg: '#f8fafc' };
          return (
            <Card key={p.id} style={{ padding: 0, overflow: 'hidden', border: `1.5px solid ${accent.color}22` }}>
              {/* Plan header */}
              <div style={{ background: accent.bg, padding: '18px 20px 14px', borderBottom: `1px solid ${accent.color}22` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{p.name}</h3>
                    <div style={{ fontSize: 26, fontWeight: 800, color: accent.color, marginTop: 4, lineHeight: 1 }}>
                      ${p.price_monthly}
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>/mo</span>
                    </div>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={() => setEditing(p)} style={{ marginTop: 2 }}>
                    <Edit2 size={12} /> Edit
                  </Btn>
                </div>
              </div>

              {/* Limits */}
              <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  ['Contacts',      fmtNum(p.max_contacts, 999999)],
                  ['Campaigns',     fmtNum(p.max_campaigns, 999)],
                  ['Emails / Day',  fmtNum(p.max_emails_per_day, 99999)],
                  ['Email Accounts',fmtNum(p.max_email_accounts, 999)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}

                {/* AI Credits — highlighted row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0 2px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} style={{ color: accent.color }} /> AI Credits / Month
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: accent.color }}>
                    {p.max_ai_credits >= 9999 ? 'Unlimited' : (p.max_ai_credits || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <EditPlanModal
        plan={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
    </div>
  );
}

function EditPlanModal({ plan, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) setForm({
      name:               plan.name,
      price_monthly:      plan.price_monthly,
      max_contacts:       plan.max_contacts,
      max_campaigns:      plan.max_campaigns,
      max_emails_per_day: plan.max_emails_per_day,
      max_email_accounts: plan.max_email_accounts,
      max_ai_credits:     plan.max_ai_credits ?? 10,
    });
  }, [plan]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.put(`/admin/plans/${plan.id}`, { ...form, features: [] });
      toast.success('Plan updated');
      onSaved();
    } catch { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const slug = plan?.name?.toLowerCase() || 'trial';
  const accent = PLAN_ACCENT[slug] || { color: '#64748b', bg: '#f8fafc' };

  return (
    <Modal open={!!plan} onClose={onClose} title={`Edit Plan — ${plan?.name}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Pricing */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Pricing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Plan Name" value={form.name || ''} onChange={e => f('name', e.target.value)} />
            <Input label="Price / Month ($)" type="number" min={0} value={form.price_monthly ?? 0} onChange={e => f('price_monthly', +e.target.value)} />
          </div>
        </div>

        {/* Limits */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Feature Limits</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Max Contacts" type="number" min={0} value={form.max_contacts ?? 0} onChange={e => f('max_contacts', +e.target.value)} />
            <Input label="Max Campaigns" type="number" min={0} value={form.max_campaigns ?? 0} onChange={e => f('max_campaigns', +e.target.value)} />
            <Input label="Max Emails / Day" type="number" min={0} value={form.max_emails_per_day ?? 0} onChange={e => f('max_emails_per_day', +e.target.value)} />
            <Input label="Max Email Accounts" type="number" min={0} value={form.max_email_accounts ?? 0} onChange={e => f('max_email_accounts', +e.target.value)} />
          </div>
        </div>

        {/* AI Credits */}
        <div style={{ background: `${accent.color}0d`, border: `1px solid ${accent.color}30`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Zap size={14} style={{ color: accent.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: accent.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Credits</span>
          </div>
          <Input
            label="AI Credits / Month"
            type="number"
            min={0}
            value={form.max_ai_credits ?? 0}
            onChange={e => f('max_ai_credits', +e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
            💡 Each AI action costs 1 credit (sequence = 5). Set <strong>9999</strong> to give this plan unlimited AI usage.
            Current defaults: Trial 10 · Starter 100 · Professional 1,000 · Unlimited 9,999
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Save Changes</Btn>
        </div>
      </form>
    </Modal>
  );
}
