import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Alert, Table, TR, TD } from '../components/UI';
import { Mail, Plus, Trash2, CheckCircle, XCircle, Loader2, Edit2 } from 'lucide-react';

const PRESETS = {
  hostinger: { host:'smtp.hostinger.com', port:465, secure:true, hint:'Use your full Hostinger email address as username and your Hostinger email password. Port 465, SSL ON.', userPlaceholder:'you@yourdomain.com', namePlaceholder:'e.g. Company Main Email' },
  gmail:     { host:'smtp.gmail.com', port:587, secure:false, hint:'You MUST use an App Password — go to myaccount.google.com → Security → 2-Step Verification → App passwords → create one for AdoBoost.', userPlaceholder:'yourname@gmail.com', namePlaceholder:'e.g. My Gmail Account' },
  outlook:   { host:'smtp.office365.com', port:587, secure:false, hint:'Use your full Microsoft email and password. If using 2FA, create an App Password in Microsoft account security settings.', userPlaceholder:'yourname@outlook.com', namePlaceholder:'e.g. My Outlook Account' },
  yahoo:     { host:'smtp.mail.yahoo.com', port:465, secure:true, hint:'Go to Yahoo Account Security → Generate App Password. Use that here instead of your regular Yahoo password.', userPlaceholder:'yourname@yahoo.com', namePlaceholder:'e.g. My Yahoo Account' },
  smtp:      { host:'', port:587, secure:false, hint:'Enter your mail server details. Use your full email address as username. Contact your hosting provider for the correct SMTP settings.', userPlaceholder:'you@yourdomain.com', namePlaceholder:'e.g. My Email Account' },
};

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [testStatus, setTestStatus] = useState({});

  const load = useCallback(() => {
    api.get('/email-accounts').then(r => setAccounts(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTest = async (id) => {
    setTestStatus(s => ({ ...s, [id]: 'loading' }));
    try {
      await api.post(`/email-accounts/${id}/test`);
      setTestStatus(s => ({ ...s, [id]: 'ok' }));
      toast.success('Connection successful! ✅');
    } catch (err) {
      setTestStatus(s => ({ ...s, [id]: 'error' }));
      toast.error(err.response?.data?.error || 'Connection failed');
    }
    setTimeout(() => setTestStatus(s => ({ ...s, [id]: null })), 5000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this email account?')) return;
    try { await api.delete(`/email-accounts/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Email Accounts" subtitle="Connect SMTP accounts to send campaigns"
        action={<Btn onClick={() => { setEditAccount(null); setShowModal(true); }}><Plus size={14} /> Add Account</Btn>}
      />
      <Alert type="info" title="Gmail Users">
        Use an <strong>App Password</strong> — go to myaccount.google.com → Security → 2-Step Verification → App passwords
      </Alert>
      <div style={{ marginTop:20 }}>
        {accounts.length === 0 ? (
          <Empty icon={Mail} title="No email accounts" description="Connect an SMTP account to start sending campaigns."
            action={<Btn onClick={() => setShowModal(true)}><Plus size={14} /> Add Account</Btn>} />
        ) : (
          <Card style={{ padding:0, overflow:'hidden' }}>
            <Table headers={['', 'Name', 'Email', 'Host', 'Port', 'SSL', 'Status', 'Limit', 'Sent', 'Actions']}>
              {accounts.map(a => (
                <TR key={a.id}>
                  <TD style={{ width:40 }}>
                    <div style={{ width:36, height:36, background:'var(--primary-dim)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Mail size={16} color="var(--primary)" />
                    </div>
                  </TD>
                  <TD style={{ fontWeight:500 }}>{a.name}</TD>
                  <TD style={{ fontSize:12, color:'var(--text2)' }}>{a.from_email}</TD>
                  <TD style={{ fontSize:12, color:'var(--text2)' }}>{a.host || '—'}</TD>
                  <TD style={{ fontSize:12 }}>{a.port}</TD>
                  <TD><Badge color={a.secure ? 'green' : 'default'}>{a.secure ? 'ON' : 'OFF'}</Badge></TD>
                  <TD><Badge color={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</Badge></TD>
                  <TD>{a.daily_limit}</TD>
                  <TD>{a.sent_today}</TD>
                  <TD>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      {testStatus[a.id] === 'loading' && <Loader2 size={14} style={{ animation:'spin 1s linear infinite', color:'var(--primary)' }} />}
                      {testStatus[a.id] === 'ok' && <CheckCircle size={14} color="var(--green)" />}
                      {testStatus[a.id] === 'error' && <XCircle size={14} color="var(--red)" />}
                      <Btn size="sm" variant="secondary" onClick={() => handleTest(a.id)}>Test</Btn>
                      <Btn size="sm" variant="secondary" onClick={() => { setEditAccount(a); setShowModal(true); }}><Edit2 size={12} /></Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(a.id)}><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          </Card>
        )}
      </div>
      <AccountModal open={showModal} account={editAccount}
        onClose={() => { setShowModal(false); setEditAccount(null); }}
        onSaved={() => { setShowModal(false); setEditAccount(null); load(); }}
      />
    </div>
  );
}

function AccountModal({ open, account, onClose, onSaved }) {
  const [type, setType] = useState('hostinger');
  const [form, setForm] = useState({ name:'', host:'smtp.hostinger.com', port:465, secure:true, username:'', password:'', from_name:'', from_email:'', daily_limit:50 });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testError, setTestError] = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setTesting(null); setTestError('');
    if (account) {
      setForm({ name:account.name||'', host:account.host||'', port:account.port||587, secure:account.secure===1, username:account.username||'', password:'', from_name:account.from_name||'', from_email:account.from_email||'', daily_limit:account.daily_limit||50 });
      if (account.host?.includes('hostinger')) setType('hostinger');
      else if (account.host?.includes('gmail')) setType('gmail');
      else if (account.host?.includes('office365')) setType('outlook');
      else if (account.host?.includes('yahoo')) setType('yahoo');
      else setType('smtp');
    } else {
      setType('hostinger');
      setForm({ name:'', host:'smtp.hostinger.com', port:465, secure:true, username:'', password:'', from_name:'', from_email:'', daily_limit:50 });
    }
  }, [open, account]);

  const handleTypeChange = (t) => {
    setType(t);
    const p = PRESETS[t];
    setForm(prev => ({ ...prev, host:p.host, port:p.port, secure:p.secure, ...(account ? {} : { username:'', password:'', from_name:'', from_email:'' }) }));
    setTesting(null); setTestError('');
  };

  const handleTest = async () => {
    if (!form.host || !form.username || !form.password) return toast.error('Enter host, username and password first');
    setTesting('loading'); setTestError('');
    try {
      const { data } = await api.post('/smtp-test/full-test', { host:form.host, username:form.username, password:form.password });
      const working = data.tests.find(t => t.smtpOk);
      const tcpOnly = data.tests.find(t => t.tcpOk);
      if (working) {
        setTesting('ok');
        toast.success('Connection successful! ✅', { duration:6000 });
      } else if (tcpOnly) {
        setTesting('error');
        setTestError('auth');
      } else {
        setTesting('error');
        setTestError('blocked');
      }
    } catch (err) {
      setTesting('error');
      setTestError('unknown');
      toast.error(err.response?.data?.error || 'Test failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) return toast.error('Username required');
    if (!account && !form.password) return toast.error('Password required');
    if (!form.from_email) return toast.error('From email required');
    setSaving(true);
    try {
      if (account) {
        const payload = { ...form, type };
        if (!payload.password) delete payload.password;
        await api.put(`/email-accounts/${account.id}`, payload);
      } else {
        await api.post('/email-accounts', { ...form, type });
      }
      toast.success(account ? 'Account updated!' : 'Account connected!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={account ? `Edit — ${account.name}` : 'Connect Email Account'} width={600}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {/* Provider tabs */}
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Provider</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.entries({ hostinger:'Hostinger', gmail:'Gmail', outlook:'Outlook', yahoo:'Yahoo', smtp:'Custom SMTP' }).map(([k,v]) => (
              <button type="button" key={k} onClick={() => handleTypeChange(k)} style={{ padding:'7px 14px', borderRadius:8, border:`2px solid ${type===k?'var(--primary)':'var(--border2)'}`, background:type===k?'var(--primary-dim)':'#fff', color:type===k?'var(--primary)':'var(--text2)', fontWeight:type===k?700:400, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {v}
              </button>
            ))}
          </div>
          {PRESETS[type]?.hint && (
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:8, padding:'8px 12px', background:'var(--bg3)', borderRadius:6, borderLeft:'3px solid var(--primary)', lineHeight:1.6 }}>
              💡 {PRESETS[type].hint}
            </div>
          )}
        </div>

        <Input label="Account Name" placeholder={PRESETS[type]?.namePlaceholder||'My Email Account'} value={form.name} onChange={e => f('name', e.target.value)} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px', gap:10 }}>
          <Input label="SMTP Host" value={form.host} onChange={e => f('host', e.target.value)} required />
          <Input label="Port" type="number" value={form.port} onChange={e => f('port', +e.target.value)} required />
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>SSL</label>
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}>
              <input type="checkbox" checked={form.secure} onChange={e => f('secure', e.target.checked)} style={{ width:16, height:16, accentColor:'var(--primary)' }} />
              <span style={{ fontSize:13 }}>{form.secure ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        </div>

        <Input label="Username / Email Address" type="email" placeholder={PRESETS[type]?.userPlaceholder||'you@domain.com'} value={form.username} onChange={e => f('username', e.target.value)} required />
        <Input label={account ? 'Password (leave blank to keep current)' : 'Password'} type="password" placeholder="••••••••" value={form.password} onChange={e => f('password', e.target.value)} required={!account} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="From Name" placeholder="John Smith" value={form.from_name} onChange={e => f('from_name', e.target.value)} />
          <Input label="From Email" type="email" placeholder={PRESETS[type]?.userPlaceholder||'you@domain.com'} value={form.from_email} onChange={e => f('from_email', e.target.value)} required />
        </div>

        <Input label="Daily Send Limit" type="number" min={1} max={2000} value={form.daily_limit} onChange={e => f('daily_limit', +e.target.value)} />

        {/* Test Connection */}
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Btn type="button" variant="secondary" size="sm" onClick={handleTest} disabled={testing==='loading'}>
              {testing==='loading' ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : '🔌'} Test Connection
            </Btn>
            {testing==='ok' && <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>✅ Connection successful!</span>}
            {testing==='error' && <span style={{ fontSize:13, color:'var(--red)' }}>❌ Connection failed</span>}
            {testing==='loading' && <span style={{ fontSize:12, color:'var(--text3)' }}>Testing connection...</span>}
            {!testing && <span style={{ fontSize:12, color:'var(--text3)' }}>Verify your settings before saving</span>}
          </div>

          {/* Simple error hints — no scary port tables */}
          {testError === 'auth' && (
            <div style={{ fontSize:12, color:'var(--text2)', background:'var(--yellow-dim)', border:'1px solid #faf089', borderRadius:6, padding:'10px 12px', lineHeight:1.7 }}>
              <strong style={{ color:'var(--yellow)' }}>Login failed — please check your credentials.</strong><br/>
              • <strong>Gmail:</strong> Use an App Password (16 chars), not your regular Gmail password<br/>
              • <strong>Hostinger:</strong> Use your full email address as username<br/>
              • <strong>All providers:</strong> Double-check for typos and make sure Caps Lock is off
            </div>
          )}
          {testError === 'blocked' && (
            <div style={{ fontSize:12, color:'var(--text2)', background:'var(--red-dim)', border:'1px solid var(--red-border)', borderRadius:6, padding:'10px 12px', lineHeight:1.7 }}>
              <strong style={{ color:'var(--red)' }}>Connection failed.</strong><br/>
              Please check your SMTP host and credentials, then try again. Contact your email provider if the issue persists.
            </div>
          )}
          {testError === 'unknown' && (
            <div style={{ fontSize:12, color:'var(--text2)', background:'var(--red-dim)', border:'1px solid var(--red-border)', borderRadius:6, padding:'10px 12px', lineHeight:1.7 }}>
              <strong style={{ color:'var(--red)' }}>Something went wrong.</strong><br/>
              Please check your settings and try again.
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={saving}>{account ? 'Save Changes' : 'Connect Account'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
