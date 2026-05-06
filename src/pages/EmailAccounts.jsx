import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Alert, Table, TR, TD } from '../components/UI';
import { Mail, Plus, Trash2, CheckCircle, XCircle, Loader2, Edit2, Inbox, RefreshCw } from 'lucide-react';

const PRESETS = {
  hostinger: {
    host:'smtp.hostinger.com', port:465, secure:true,
    imap_host:'imap.hostinger.com', imap_port:993, imap_secure:true,
    hint:'Use your full Hostinger email address as username and your Hostinger email password.',
    userPlaceholder:'you@yourdomain.com', namePlaceholder:'e.g. Company Main Email'
  },
  gmail: {
    host:'smtp.gmail.com', port:587, secure:false,
    imap_host:'imap.gmail.com', imap_port:993, imap_secure:true,
    hint:'You MUST use an App Password — go to myaccount.google.com → Security → 2-Step Verification → App passwords. Also enable IMAP in Gmail Settings.',
    userPlaceholder:'yourname@gmail.com', namePlaceholder:'e.g. My Gmail Account'
  },
  outlook: {
    host:'smtp.office365.com', port:587, secure:false,
    imap_host:'outlook.office365.com', imap_port:993, imap_secure:true,
    hint:'Use your full Microsoft email and password. If using 2FA, create an App Password in Microsoft account security settings.',
    userPlaceholder:'yourname@outlook.com', namePlaceholder:'e.g. My Outlook Account'
  },
  yahoo: {
    host:'smtp.mail.yahoo.com', port:465, secure:true,
    imap_host:'imap.mail.yahoo.com', imap_port:993, imap_secure:true,
    hint:'Go to Yahoo Account Security → Generate App Password. Use that here instead of your regular Yahoo password.',
    userPlaceholder:'yourname@yahoo.com', namePlaceholder:'e.g. My Yahoo Account'
  },
  smtp: {
    host:'', port:587, secure:false,
    imap_host:'', imap_port:993, imap_secure:true,
    hint:'Enter your mail server details. Contact your hosting provider for the correct SMTP/IMAP settings.',
    userPlaceholder:'you@yourdomain.com', namePlaceholder:'e.g. My Email Account'
  },
};

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [testStatus, setTestStatus] = useState({});
  const [syncing, setSyncing] = useState({});

  const load = useCallback(() => {
    api.get('/email-accounts').then(r => setAccounts(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTest = async (id) => {
    setTestStatus(s => ({ ...s, [id]: 'loading' }));
    try {
      await api.post(`/email-accounts/${id}/test`);
      setTestStatus(s => ({ ...s, [id]: 'ok' }));
      toast.success('SMTP Connection successful! ✅');
    } catch (err) {
      setTestStatus(s => ({ ...s, [id]: 'error' }));
      toast.error(err.response?.data?.error || 'SMTP Connection failed');
    }
    setTimeout(() => setTestStatus(s => ({ ...s, [id]: null })), 5000);
  };

  const handleSync = async (id) => {
    setSyncing(s => ({ ...s, [id]: true }));
    try {
      const { data } = await api.post(`/email-accounts/${id}/sync-inbox`);
      toast.success(`Inbox synced! ${data.synced} new message${data.synced !== 1 ? 's' : ''} found.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'IMAP Sync failed — check IMAP settings');
    }
    setSyncing(s => ({ ...s, [id]: false }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this email account?')) return;
    try { await api.delete(`/email-accounts/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Email Accounts" subtitle="Connect SMTP and IMAP accounts to send campaigns and receive replies"
        action={<Btn onClick={() => { setEditAccount(null); setShowModal(true); }}><Plus size={14} /> Add Account</Btn>}
      />
      <Alert type="info" title="Gmail Users">
        Use an <strong>App Password</strong> — go to myaccount.google.com → Security → 2-Step Verification → App passwords.
        Also enable IMAP in Gmail Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP.
      </Alert>
      <div style={{ marginTop:20 }}>
        {accounts.length === 0 ? (
          <Empty icon={Mail} title="No email accounts" description="Connect an SMTP/IMAP account to send campaigns and receive replies."
            action={<Btn onClick={() => setShowModal(true)}><Plus size={14} /> Add Account</Btn>} />
        ) : (
          <Card style={{ padding:0, overflow:'hidden' }}>
            <Table headers={['', 'Name', 'Email', 'SMTP', 'IMAP Inbox', 'Status', 'Limit', 'Sent', 'Actions']}>
              {accounts.map(a => (
                <TR key={a.id}>
                  <TD style={{ width:40 }}>
                    <div style={{ width:36, height:36, background:'var(--primary-dim)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Mail size={16} color="var(--primary)" />
                    </div>
                  </TD>
                  <TD style={{ fontWeight:500 }}>{a.name}</TD>
                  <TD style={{ fontSize:12, color:'var(--text2)' }}>{a.from_email}</TD>
                  <TD style={{ fontSize:12 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      <span style={{ color:'var(--text2)' }}>{a.host}:{a.port}</span>
                      <Badge color={a.secure ? 'green' : 'default'} style={{ fontSize:10 }}>SSL {a.secure ? 'ON' : 'OFF'}</Badge>
                    </div>
                  </TD>
                  <TD style={{ fontSize:12 }}>
                    {a.imap_host ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        <span style={{ color:'var(--text2)' }}>{a.imap_host}:{a.imap_port}</span>
                        <Badge color="green" style={{ fontSize:10 }}>✅ Configured</Badge>
                      </div>
                    ) : (
                      <Badge color="default">Not set</Badge>
                    )}
                  </TD>
                  <TD><Badge color={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</Badge></TD>
                  <TD>{a.daily_limit}</TD>
                  <TD>{a.sent_today}</TD>
                  <TD>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      {testStatus[a.id] === 'loading' && <Loader2 size={14} style={{ animation:'spin 1s linear infinite', color:'var(--primary)' }} />}
                      {testStatus[a.id] === 'ok' && <CheckCircle size={14} color="var(--green)" />}
                      {testStatus[a.id] === 'error' && <XCircle size={14} color="var(--red)" />}
                      <Btn size="sm" variant="secondary" onClick={() => handleTest(a.id)} title="Test SMTP (sending)">
                        📤 SMTP
                      </Btn>
                      {a.imap_host && (
                        <Btn size="sm" variant="secondary" onClick={() => handleSync(a.id)} disabled={syncing[a.id]} title="Sync IMAP inbox">
                          {syncing[a.id] ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> : <><Inbox size={12} /> Sync</>}
                        </Btn>
                      )}
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
  const [form, setForm] = useState({
    name:'', host:'smtp.hostinger.com', port:465, secure:true,
    imap_host:'imap.hostinger.com', imap_port:993, imap_secure:true,
    username:'', password:'', from_name:'', from_email:'', daily_limit:50
  });
  const [saving, setSaving] = useState(false);
  const [smtpTest, setSmtpTest] = useState(null); // null | loading | ok | error
  const [imapTest, setImapTest] = useState(null); // null | loading | ok | error
  const [smtpError, setSmtpError] = useState('');
  const [imapError, setImapError] = useState('');
  const [showImap, setShowImap] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setSmtpTest(null); setImapTest(null); setSmtpError(''); setImapError('');
    if (account) {
      setForm({
        name:account.name||'', host:account.host||'', port:account.port||587,
        secure:account.secure===1,
        imap_host:account.imap_host||'', imap_port:account.imap_port||993,
        imap_secure:account.imap_secure===1||account.imap_secure===true,
        username:account.username||'', password:'', from_name:account.from_name||'',
        from_email:account.from_email||'', daily_limit:account.daily_limit||50
      });
      setShowImap(!!account.imap_host);
      if (account.host?.includes('hostinger')) setType('hostinger');
      else if (account.host?.includes('gmail')) setType('gmail');
      else if (account.host?.includes('office365')) setType('outlook');
      else if (account.host?.includes('yahoo')) setType('yahoo');
      else setType('smtp');
    } else {
      setType('hostinger');
      setShowImap(false);
      setForm({
        name:'', host:'smtp.hostinger.com', port:465, secure:true,
        imap_host:'imap.hostinger.com', imap_port:993, imap_secure:true,
        username:'', password:'', from_name:'', from_email:'', daily_limit:50
      });
    }
  }, [open, account]);

  const handleTypeChange = (t) => {
    setType(t);
    const p = PRESETS[t];
    setForm(prev => ({
      ...prev, host:p.host, port:p.port, secure:p.secure,
      imap_host:p.imap_host, imap_port:p.imap_port, imap_secure:p.imap_secure,
      ...(account ? {} : { username:'', password:'', from_name:'', from_email:'' })
    }));
    setSmtpTest(null); setImapTest(null); setSmtpError(''); setImapError('');
  };

  const handleTestSmtp = async () => {
    if (!form.host || !form.username || !form.password) return toast.error('Enter SMTP host, username and password first');
    setSmtpTest('loading'); setSmtpError('');
    try {
      const { data } = await api.post('/smtp-test/full-test', { host:form.host, username:form.username, password:form.password });
      const working = data.tests.find(t => t.smtpOk);
      const tcpOnly = data.tests.find(t => t.tcpOk);
      if (working) {
        setSmtpTest('ok');
        toast.success('✅ SMTP Connected! Sending will work.', { duration:5000 });
      } else if (tcpOnly) {
        setSmtpTest('error');
        setSmtpError('Port connects but login failed — check username/password');
      } else {
        setSmtpTest('error');
        setSmtpError('All SMTP ports blocked — check your host settings');
      }
    } catch (err) {
      setSmtpTest('error');
      setSmtpError(err.response?.data?.error || 'SMTP test failed');
    }
  };

  const handleTestImap = async () => {
    if (!form.imap_host || !form.username || !form.password) return toast.error('Enter IMAP host, username and password first');
    setImapTest('loading'); setImapError('');
    try {
      await api.post('/email-accounts/test-imap', {
        imap_host: form.imap_host,
        imap_port: form.imap_port,
        imap_secure: form.imap_secure,
        username: form.username,
        password: form.password,
      });
      setImapTest('ok');
      toast.success('✅ IMAP Connected! Inbox sync will work.', { duration:5000 });
    } catch (err) {
      setImapTest('error');
      setImapError(err.response?.data?.error || 'IMAP connection failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) return toast.error('Username required');
    if (!account && !form.password) return toast.error('Password required');
    if (!form.from_email) return toast.error('From email required');
    setSaving(true);
    try {
      const payload = { ...form, type };
      if (!showImap) { payload.imap_host = ''; payload.imap_port = 993; payload.imap_secure = true; }
      if (account) {
        if (!payload.password) delete payload.password;
        await api.put(`/email-accounts/${account.id}`, payload);
      } else {
        await api.post('/email-accounts', payload);
      }
      toast.success(account ? 'Account updated!' : 'Account connected!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={account ? `Edit — ${account.name}` : 'Connect Email Account'} width={640}>
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

        {/* Credentials */}
        <Input label="Username / Email Address" type="email" placeholder={PRESETS[type]?.userPlaceholder||'you@domain.com'} value={form.username} onChange={e => f('username', e.target.value)} required />
        <Input label={account ? 'Password (leave blank to keep current)' : 'Password'} type="password" placeholder="••••••••" value={form.password} onChange={e => f('password', e.target.value)} required={!account} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="From Name" placeholder="John Smith" value={form.from_name} onChange={e => f('from_name', e.target.value)} />
          <Input label="From Email" type="email" placeholder={PRESETS[type]?.userPlaceholder||'you@domain.com'} value={form.from_email} onChange={e => f('from_email', e.target.value)} required />
        </div>

        <Input label="Daily Send Limit" type="number" min={1} max={2000} value={form.daily_limit} onChange={e => f('daily_limit', +e.target.value)} />

        {/* SMTP Section */}
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:'14px', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>📤 SMTP Settings (Sending)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px', gap:10, marginBottom:10 }}>
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
          {/* SMTP Test Button */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Btn type="button" variant="secondary" size="sm" onClick={handleTestSmtp} disabled={smtpTest==='loading'}>
              {smtpTest==='loading' ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : '🔌'} Test SMTP
            </Btn>
            {smtpTest==='ok' && <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>✅ SMTP Connected!</span>}
            {smtpTest==='error' && <span style={{ fontSize:13, color:'var(--red)' }}>❌ {smtpError}</span>}
            {smtpTest==='loading' && <span style={{ fontSize:12, color:'var(--text3)' }}>Testing SMTP...</span>}
            {!smtpTest && <span style={{ fontSize:12, color:'var(--text3)' }}>Test sending connection</span>}
          </div>
        </div>

        {/* IMAP Section */}
        <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
          <button type="button" onClick={() => setShowImap(p => !p)} style={{
            width:'100%', padding:'12px 14px',
            background: showImap ? '#eff6ff' : 'var(--bg3)',
            border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
            fontSize:13, fontWeight:600, color: showImap ? '#3b82f6' : 'var(--text2)', fontFamily:'inherit',
          }}>
            <span>📥 IMAP Settings (Receiving Replies) — {showImap ? '✅ Enabled' : 'Click to enable'}</span>
            <span style={{ fontSize:11, fontWeight:400, color:'var(--text3)' }}>
              {showImap ? 'Replies sync every 5 min' : 'Optional — enable to read replies in AdoBoost'}
            </span>
          </button>

          {showImap && (
            <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:10, borderTop:'1px solid var(--border)', background:'#fafeff' }}>
              <div style={{ fontSize:12, color:'#1d4ed8', padding:'8px 12px', background:'#eff6ff', borderRadius:6, borderLeft:'3px solid #3b82f6', lineHeight:1.6 }}>
                📬 AdoBoost will check your inbox every 5 minutes and pull replies into Messages. Read and reply directly — no need to open your email!
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px', gap:10 }}>
                <Input label="IMAP Host" value={form.imap_host} onChange={e => f('imap_host', e.target.value)} placeholder="imap.yourdomain.com" />
                <Input label="IMAP Port" type="number" value={form.imap_port} onChange={e => f('imap_port', +e.target.value)} />
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>SSL</label>
                  <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}>
                    <input type="checkbox" checked={form.imap_secure} onChange={e => f('imap_secure', e.target.checked)} style={{ width:16, height:16, accentColor:'var(--primary)' }} />
                    <span style={{ fontSize:13 }}>{form.imap_secure ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', background:'var(--bg3)', padding:'8px 12px', borderRadius:6 }}>
                💡 Uses the same username and password as SMTP above.
              </div>
              {/* IMAP Test Button */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Btn type="button" variant="secondary" size="sm" onClick={handleTestImap} disabled={imapTest==='loading'}>
                  {imapTest==='loading' ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : '📬'} Test IMAP
                </Btn>
                {imapTest==='ok' && <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>✅ IMAP Connected! Inbox sync ready.</span>}
                {imapTest==='error' && <span style={{ fontSize:13, color:'var(--red)' }}>❌ {imapError}</span>}
                {imapTest==='loading' && <span style={{ fontSize:12, color:'var(--text3)' }}>Testing IMAP connection...</span>}
                {!imapTest && <span style={{ fontSize:12, color:'var(--text3)' }}>Test inbox connection</span>}
              </div>
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
