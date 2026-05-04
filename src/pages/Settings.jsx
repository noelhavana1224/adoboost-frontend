import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Card, Btn, Input, Select, PageHeader, Alert, Badge } from '../components/UI';
import { User, CreditCard, Zap, Settings2, Key, Copy, Check } from 'lucide-react';

const PLANS = [
  { id:'plan_trial', name:'Trial', price:0, features:['2 campaigns','200 contacts','50 emails/day'] },
  { id:'plan_starter', name:'Starter', price:29, features:['10 campaigns','2,000 contacts','500 emails/day','3 email accounts'] },
  { id:'plan_pro', name:'Professional', price:79, features:['50 campaigns','10,000 contacts','2,000 emails/day','6 accounts','API access'] },
  { id:'plan_unlimited', name:'Unlimited', price:199, features:['Unlimited everything','White-label','API access'] },
];

export function Billing() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Billing Information" />
      <Card style={{ padding:24, maxWidth:700 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <Check size={20} color="var(--green)" />
              <span style={{ fontSize:13, color:'var(--text2)' }}>Current Plan</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:'var(--primary)', marginBottom:4, textTransform:'capitalize' }}>{user?.plan}</div>
            {user?.plan === 'trial' && <div style={{ fontSize:13, color:'var(--yellow)' }}>⚠️ Trial account — upgrade to unlock all features</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Payment Method</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Managed by admin</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:24 }}>
          {PLANS.map(p => (
            <div key={p.id} style={{ border:`2px solid ${user?.plan===p.name.toLowerCase()?'var(--primary)':'var(--border)'}`, borderRadius:10, padding:16, background:user?.plan===p.name.toLowerCase()?'var(--primary-dim)':'var(--bg3)' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{p.name}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--primary)', marginBottom:8 }}>${p.price}<span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>/mo</span></div>
              {p.features.map(f=><div key={f} style={{ fontSize:11, color:'var(--text2)', marginBottom:3 }}>✓ {f}</div>)}
              {user?.plan!==p.name.toLowerCase() && <Btn size="sm" variant="outline" style={{ marginTop:10, width:'100%', justifyContent:'center' }}>Upgrade</Btn>}
              {user?.plan===p.name.toLowerCase() && <div style={{ fontSize:11, color:'var(--primary)', fontWeight:600, marginTop:10 }}>Current Plan</div>}
            </div>
          ))}
        </div>
        <Alert type="info">To upgrade your plan, contact your administrator or reach out to support.</Alert>
      </Card>
    </div>
  );
}

export function SendingSpeed() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState('');
  useEffect(() => { api.get('/email-accounts').then(r=>setAccounts(r.data)); }, []);
  return (
    <div>
      <PageHeader title="Edit Sending Speed" />
      <Card style={{ padding:24, maxWidth:500 }}>
        <Select label="Select Email Account" value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Select Email...</option>
          {accounts.map(a=><option key={a.id} value={a.id}>SMTP: {a.username} - {a.type}</option>)}
        </Select>
        {selected && (
          <div style={{ marginTop:16 }}>
            <Alert type="info">Adjust the daily send limit for this account in Email Accounts settings.</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}

export function UserSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name:'', company:'', country:'', city:'', timezone:'UTC', password:'' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) setForm({ name:user.name||'', company:user.company||'', country:user.country||'', city:user.city||'', timezone:user.timezone||'UTC', password:'' }); }, [user]);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.put('/auth/settings', form); toast.success('Settings updated'); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="User Settings" />
      <Card style={{ padding:24, maxWidth:700 }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="First Name" value={form.name.split(' ')[0]||''} onChange={e=>f('name',`${e.target.value} ${form.name.split(' ').slice(1).join(' ')}`.trim())} />
            <Input label="Last Name" value={form.name.split(' ').slice(1).join(' ')||''} onChange={e=>f('name',`${form.name.split(' ')[0]} ${e.target.value}`.trim())} />
            <Input label="Email Address" value={user?.email||''} disabled style={{ opacity:0.6 }} />
            <Input label="Company Name" value={form.company} onChange={e=>f('company',e.target.value)} />
            <Input label="Country" value={form.country} onChange={e=>f('country',e.target.value)} />
            <Input label="City" value={form.city} onChange={e=>f('city',e.target.value)} />
            <Select label="Timezone" value={form.timezone} onChange={e=>f('timezone',e.target.value)}>
              {['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Manila','Asia/Tokyo','Australia/Sydney'].map(t=><option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Change Password" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={e=>f('password',e.target.value)} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
            <Btn type="submit" loading={loading}>Update Settings</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function UserPreferences() {
  const { user } = useAuth();
  const [form, setForm] = useState({ notify_replies:true, can_spam_footer:true, notify_email:'' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) setForm({ notify_replies:user.notify_replies!==0, can_spam_footer:user.can_spam_footer!==0, notify_email:user.notify_email||user.email||'' }); }, [user]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.put('/auth/settings', form); toast.success('Preferences saved'); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="User Preferences" />
      <Card style={{ padding:24, maxWidth:600 }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {[
            { key:'can_spam_footer', label:'CAN-SPAM Footer', desc:'Include unsubscribe footer in all emails (recommended for compliance)' },
            { key:'notify_replies', label:'Reply Notification', desc:'Receive email notifications when contacts reply to your campaigns' },
          ].map(p => (
            <label key={p.key} style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}>
              <input type="checkbox" checked={form[p.key]} onChange={e=>setForm(f=>({...f,[p.key]:e.target.checked}))} style={{ marginTop:3, width:16, height:16, accentColor:'var(--primary)' }} />
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{p.label}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>{p.desc}</div>
              </div>
            </label>
          ))}
          {form.notify_replies && <Input label="Notification Email" type="email" value={form.notify_email} onChange={e=>setForm(f=>({...f,notify_email:e.target.value}))} />}
          <Btn type="submit" loading={loading} style={{ alignSelf:'flex-start' }}>Update Settings</Btn>
        </form>
      </Card>
    </div>
  );
}

export function ApiKey() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { api.get('/auth/me').then(r=>setUserData(r.data)); }, []);
  const copy = () => { navigator.clipboard.writeText(userData?.api_key||''); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div>
      <PageHeader title="API Key" />
      <Card style={{ padding:24, maxWidth:600 }}>
        <p style={{ fontSize:14, color:'var(--text2)', marginBottom:16, lineHeight:1.6 }}>
          Use this key to access the AdoBoost API endpoints. Keep it secure — do not share publicly.
        </p>
        <div style={{ display:'flex', gap:8 }}>
          <input readOnly value={userData?.api_key||'Loading...'} style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'monospace' }} />
          <Btn variant="secondary" onClick={copy}>{copied?<><Check size={13}/> Copied</>:<><Copy size={13}/> Copy</>}</Btn>
        </div>
        <p style={{ fontSize:12, color:'var(--text3)', marginTop:10 }}>
          Include in requests as: <code style={{ background:'var(--bg3)', padding:'1px 5px', borderRadius:3 }}>Authorization: Bearer YOUR_API_KEY</code>
        </p>
      </Card>
    </div>
  );
}
