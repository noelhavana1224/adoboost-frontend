import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Alert, Table, TR, TD } from '../components/UI';
import { Mail, Plus, Trash2, CheckCircle, XCircle, Loader2, Tag } from 'lucide-react';

const PRESETS = {
  smtp:     { host:'', port:587, secure:false, hint:'Enter your SMTP server details' },
  gmail:    { host:'smtp.gmail.com', port:587, secure:false, hint:'Use an App Password from Google Account → Security → App passwords' },
  outlook:  { host:'smtp.office365.com', port:587, secure:false, hint:'Use your Microsoft 365 credentials' },
  yahoo:    { host:'smtp.mail.yahoo.com', port:465, secure:true, hint:'Enable "Allow apps that use less secure sign in"' },
  microsoft:{ host:'smtp.office365.com', port:587, secure:false, hint:'Microsoft / Office 365' },
};

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState({});

  const load = useCallback(() => {
    api.get('/email-accounts').then(r=>setAccounts(r.data)).finally(()=>setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTest = async (id) => {
    setTesting(t=>({...t,[id]:'loading'}));
    try {
      await api.post(`/email-accounts/${id}/test`);
      setTesting(t=>({...t,[id]:'ok'}));
      toast.success('Connection successful!');
    } catch(err) {
      setTesting(t=>({...t,[id]:'error'}));
      toast.error(err.response?.data?.error || 'Connection failed');
    }
    setTimeout(()=>setTesting(t=>({...t,[id]:null})),3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this email account?')) return;
    try { await api.delete(`/email-accounts/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Email Accounts" subtitle={`Connect SMTP, Gmail, or Outlook accounts to send campaigns`}
        action={<Btn onClick={()=>setShowAdd(true)}><Plus size={14}/> Connect Account</Btn>} />

      <Alert type="info" title="Gmail Users">
        Use an <strong>App Password</strong> — not your regular Gmail password. Go to Google Account → Security → 2-Step Verification → App passwords → Create one for "AdoBoost".
      </Alert>

      <div style={{ marginTop:20 }}>
        {accounts.length === 0 ? (
          <Empty icon={Mail} title="No email accounts connected" description="Connect an SMTP, Gmail, or Microsoft account to start sending campaigns."
            action={<Btn onClick={()=>setShowAdd(true)}><Plus size={14}/> Connect Account</Btn>} />
        ) : (
          <Card style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Connected Accounts: {accounts.length}</span>
              <Btn size="sm" onClick={()=>setShowAdd(true)}><Plus size={13}/> Add Account</Btn>
            </div>
            <Table headers={['','Name','Email','Type','Status','Warmup','Daily Limit','Sent Today','Actions']}>
              {accounts.map(a => (
                <TR key={a.id}>
                  <TD style={{ width:36 }}>
                    <div style={{ width:36, height:36, background:'var(--primary-dim)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Mail size={16} color="var(--primary)" />
                    </div>
                  </TD>
                  <TD style={{ fontWeight:500 }}>{a.name}</TD>
                  <TD style={{ color:'var(--text2)' }}>{a.from_email}</TD>
                  <TD><Badge color="blue">{a.type?.toUpperCase()}</Badge></TD>
                  <TD><Badge color={a.status==='active'?'green':'yellow'}>{a.status}</Badge></TD>
                  <TD style={{ color:'var(--text3)' }}>{a.warmup_enabled?<Badge color="cyan">On</Badge>:<Badge>Off</Badge>}</TD>
                  <TD>{a.daily_limit}</TD>
                  <TD>{a.sent_today}</TD>
                  <TD>
                    <div style={{ display:'flex', gap:6 }}>
                      {testing[a.id]==='loading' && <Loader2 size={14} style={{ animation:'spin 1s linear infinite', color:'var(--primary)' }} />}
                      {testing[a.id]==='ok' && <CheckCircle size={14} color="var(--green)" />}
                      {testing[a.id]==='error' && <XCircle size={14} color="var(--red)" />}
                      <Btn size="sm" variant="secondary" onClick={()=>handleTest(a.id)}>Test</Btn>
                      <Btn size="sm" variant="danger" onClick={()=>handleDelete(a.id)}><Trash2 size={12}/></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          </Card>
        )}
      </div>

      <AddAccountModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false);load();}} />
    </div>
  );
}

function AddAccountModal({ open, onClose, onSaved }) {
  const [type, setType] = useState('gmail');
  const [form, setForm] = useState({ name:'', host:'smtp.gmail.com', port:587, secure:false, username:'', password:'', from_name:'', from_email:'', daily_limit:100 });
  const [loading, setLoading] = useState(false);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleTypeChange = (t) => {
    setType(t);
    const { hint, ...cfg } = PRESETS[t];
    setForm(p=>({...p,...cfg}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/email-accounts', { ...form, type });
      toast.success('Account connected!');
      onSaved();
    } catch(err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Connect Email Account" width={580}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Provider</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.entries({ smtp:'SMTP', gmail:'Gmail', outlook:'Outlook', yahoo:'Yahoo', microsoft:'Microsoft' }).map(([k,v]) => (
              <button type="button" key={k} onClick={()=>handleTypeChange(k)} style={{ padding:'8px 16px', borderRadius:8, border:`2px solid ${type===k?'var(--primary)':'var(--border2)'}`, background:type===k?'var(--primary-dim)':'#fff', color:type===k?'var(--primary)':'var(--text2)', fontWeight:type===k?700:400, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {v}
              </button>
            ))}
          </div>
          {PRESETS[type]?.hint && <p style={{ fontSize:12, color:'var(--text3)', marginTop:8, padding:'8px 12px', background:'var(--bg3)', borderRadius:6 }}>💡 {PRESETS[type].hint}</p>}
        </div>
        <Input label="Account Name" placeholder="e.g. My Gmail" value={form.name} onChange={e=>f('name',e.target.value)} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:10 }}>
          <Input label="SMTP Host" value={form.host} onChange={e=>f('host',e.target.value)} required />
          <Input label="Port" type="number" value={form.port} onChange={e=>f('port',+e.target.value)} required />
        </div>
        <Input label="Username / Email" type="email" value={form.username} onChange={e=>f('username',e.target.value)} required />
        <Input label="Password / App Password" type="password" value={form.password} onChange={e=>f('password',e.target.value)} required />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="From Name" placeholder="John Doe" value={form.from_name} onChange={e=>f('from_name',e.target.value)} />
          <Input label="From Email" type="email" placeholder="john@company.com" value={form.from_email} onChange={e=>f('from_email',e.target.value)} required />
        </div>
        <Input label="Daily Send Limit" type="number" min={1} max={1000} value={form.daily_limit} onChange={e=>f('daily_limit',+e.target.value)} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Connect Account</Btn>
        </div>
      </form>
    </Modal>
  );
}
