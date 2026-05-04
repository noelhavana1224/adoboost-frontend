import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Spinner, Modal, Input } from '../../components/UI';
import { CreditCard, Edit2 } from 'lucide-react';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  useEffect(() => { api.get('/admin/plans').then(r=>setPlans(r.data)).finally(()=>setLoading(false)); }, []);
  const load = () => api.get('/admin/plans').then(r=>setPlans(r.data));
  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Plan Management" subtitle="Configure pricing and feature limits for each plan" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {plans.map(p => (
          <Card key={p.id} style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <h3 style={{ fontSize:18, fontWeight:700 }}>{p.name}</h3>
                <div style={{ fontSize:24, fontWeight:800, color:'var(--primary)', marginTop:4 }}>${p.price_monthly}<span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>/mo</span></div>
              </div>
              <Btn size="sm" variant="secondary" onClick={()=>setEditing(p)}><Edit2 size={12}/> Edit</Btn>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12 }}>
              {[['Contacts', (p.max_contacts>=999999?'Unlimited':p.max_contacts?.toLocaleString())],['Campaigns', p.max_campaigns>=999?'Unlimited':p.max_campaigns],['Emails/Day', p.max_emails_per_day?.toLocaleString()],['Email Accounts', p.max_email_accounts>=999?'Unlimited':p.max_email_accounts]].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text2)' }}>{k}</span>
                  <span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <EditPlanModal plan={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load();}} />
    </div>
  );
}

function EditPlanModal({ plan, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (plan) setForm({ name:plan.name, price_monthly:plan.price_monthly, max_contacts:plan.max_contacts, max_campaigns:plan.max_campaigns, max_emails_per_day:plan.max_emails_per_day, max_email_accounts:plan.max_email_accounts }); }, [plan]);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.put(`/admin/plans/${plan.id}`, { ...form, features:[] }); toast.success('Plan updated'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={!!plan} onClose={onClose} title={`Edit Plan — ${plan?.name}`}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="Plan Name" value={form.name||''} onChange={e=>f('name',e.target.value)} />
          <Input label="Price / Month ($)" type="number" value={form.price_monthly||0} onChange={e=>f('price_monthly',+e.target.value)} />
          <Input label="Max Contacts" type="number" value={form.max_contacts||0} onChange={e=>f('max_contacts',+e.target.value)} />
          <Input label="Max Campaigns" type="number" value={form.max_campaigns||0} onChange={e=>f('max_campaigns',+e.target.value)} />
          <Input label="Max Emails/Day" type="number" value={form.max_emails_per_day||0} onChange={e=>f('max_emails_per_day',+e.target.value)} />
          <Input label="Max Email Accounts" type="number" value={form.max_email_accounts||0} onChange={e=>f('max_email_accounts',+e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Save Changes</Btn>
        </div>
      </form>
    </Modal>
  );
}
