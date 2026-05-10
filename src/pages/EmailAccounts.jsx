import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Alert, Table, TR, TD } from '../components/UI';
import { Mail, Plus, Trash2, CheckCircle, XCircle, Loader2, Edit2, Inbox, PenLine, ChevronDown } from 'lucide-react';
import { useRef } from 'react';

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
    hint:'You MUST use an App Password — go to myaccount.google.com → Security → 2-Step Verification → App passwords. Also enable IMAP in Gmail Settings → Forwarding and POP/IMAP.',
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
  const [sigAccount, setSigAccount] = useState(null);
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
            <Table headers={['', 'Name', 'Email', 'SMTP', 'IMAP', 'Status', 'Limit', 'Sent', 'Actions']}>
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
                      <span style={{ color:'var(--text2)', fontSize:11 }}>{a.host}:{a.port}</span>
                      <Badge color={(a.secure===1||a.secure===true||a.port===465) ? 'green' : 'default'}>SSL {(a.secure===1||a.secure===true||a.port===465) ? 'ON' : 'OFF'}</Badge>
                    </div>
                  </TD>
                  <TD style={{ fontSize:12 }}>
                    {a.imap_host ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        <span style={{ color:'var(--text2)', fontSize:11 }}>{a.imap_host}:{a.imap_port}</span>
                        <Badge color="green">✅ Ready</Badge>
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
                      <Btn size="sm" variant="secondary" onClick={() => handleTest(a.id)} title="Test SMTP sending">📤 SMTP</Btn>
                      {a.imap_host && (
                        <Btn size="sm" variant="secondary" onClick={() => handleSync(a.id)} disabled={syncing[a.id]} title="Sync IMAP inbox">
                          {syncing[a.id] ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> : <><Inbox size={12} /> Sync</>}
                        </Btn>
                      )}
                      <Btn size="sm" variant="secondary" onClick={() => setSigAccount(a)} title="Edit signature"><PenLine size={12}/> Sig</Btn>
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
      <SignatureModal account={sigAccount}
        onClose={() => setSigAccount(null)}
        onSaved={() => { setSigAccount(null); load(); }}
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
  // Separate IMAP credentials
  const [imapPassword, setImapPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [smtpTest, setSmtpTest] = useState(null);
  const [imapTest, setImapTest] = useState(null);
  const [smtpError, setSmtpError] = useState('');
  const [imapError, setImapError] = useState('');
  const [showImap, setShowImap] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setSmtpTest(null); setImapTest(null);
    setSmtpError(''); setImapError('');
    setImapPassword('');
    if (account) {
      // Normalize SQLite 0/1/null → boolean, with port-based fallback
      const smtpSecure = account.secure===1 || account.secure===true || account.port===465;
      const imapPort   = account.imap_port || 993;
      const imapSecure = account.imap_secure===1 || account.imap_secure===true || imapPort===993;
      setForm({
        name:account.name||'', host:account.host||'', port:account.port||587,
        secure: smtpSecure,
        imap_host:account.imap_host||'', imap_port: imapPort,
        imap_secure: imapSecure,
        username:account.username||'', password:'',
        from_name:account.from_name||'', from_email:account.from_email||'',
        daily_limit:account.daily_limit||50
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
    setSmtpTest(null); setImapTest(null);
    setSmtpError(''); setImapError('');
  };

  const handleImapPortChange = (port) => {
    f('imap_port', +port);
    if (+port === 993) f('imap_secure', true);
    else if (+port === 143) f('imap_secure', false);
  };

  const handleSmtpPortChange = (port) => {
    f('port', +port);
    if (+port === 465) f('secure', true);
    else if (+port === 587 || +port === 25) f('secure', false);
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
    if (!form.imap_host) return toast.error('Enter IMAP host first');
    if (!form.username) return toast.error('Enter username first');
    if (!imapPassword) return toast.error('Enter IMAP password to test connection');
    setImapTest('loading'); setImapError('');
    try {
      await api.post('/email-accounts/test-imap', {
        imap_host: form.imap_host,
        imap_port: form.imap_port,
        imap_secure: form.imap_secure,
        username: form.username,
        password: imapPassword,
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
      if (!showImap) {
        payload.imap_host = '';
        payload.imap_port = 993;
        payload.imap_secure = true;
      }
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

        {/* ── SMTP Section ── */}
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:'14px', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>📤 SMTP — Sending Emails</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px', gap:10, marginBottom:10 }}>
            <Input label="SMTP Host" value={form.host} onChange={e => f('host', e.target.value)} required />
            <Input label="Port" type="number" value={form.port} onChange={e => handleSmtpPortChange(e.target.value)} required />
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>SSL</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}>
                <input type="checkbox" checked={!!form.secure} onChange={e => f('secure', e.target.checked)} style={{ width:16, height:16, accentColor:'var(--primary)' }} />
                <span style={{ fontSize:13 }}>{form.secure ? 'ON' : 'OFF'}</span>
              </label>
            </div>
          </div>
          <Input label="Username / Email" type="email" placeholder={PRESETS[type]?.userPlaceholder||'you@domain.com'} value={form.username} onChange={e => f('username', e.target.value)} required />
          <div style={{ marginTop:10 }}>
            <Input label={account ? 'SMTP Password (leave blank to keep current)' : 'SMTP Password'} type="password" placeholder="••••••••" value={form.password} onChange={e => f('password', e.target.value)} required={!account} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
            <Input label="From Name" placeholder="John Smith" value={form.from_name} onChange={e => f('from_name', e.target.value)} />
            <Input label="From Email" type="email" placeholder={PRESETS[type]?.userPlaceholder||'you@domain.com'} value={form.from_email} onChange={e => f('from_email', e.target.value)} required />
          </div>
          <div style={{ marginTop:10 }}>
            <Input label="Daily Send Limit" type="number" min={1} max={2000} value={form.daily_limit} onChange={e => f('daily_limit', +e.target.value)} />
          </div>
          {/* SMTP Test */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
            <Btn type="button" variant="secondary" size="sm" onClick={handleTestSmtp} disabled={smtpTest==='loading'}>
              {smtpTest==='loading' ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : '🔌'} Test SMTP
            </Btn>
            {smtpTest==='ok' && <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>✅ SMTP Connected!</span>}
            {smtpTest==='error' && <span style={{ fontSize:12, color:'var(--red)' }}>❌ {smtpError}</span>}
            {smtpTest==='loading' && <span style={{ fontSize:12, color:'var(--text3)' }}>Testing SMTP...</span>}
            {!smtpTest && <span style={{ fontSize:12, color:'var(--text3)' }}>Test before saving</span>}
          </div>
        </div>

        {/* ── IMAP Section ── */}
        <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
          <button type="button" onClick={() => setShowImap(p => !p)} style={{
            width:'100%', padding:'12px 14px',
            background: showImap ? '#eff6ff' : 'var(--bg3)',
            border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
            fontSize:13, fontWeight:600, color: showImap ? '#3b82f6' : 'var(--text2)', fontFamily:'inherit',
          }}>
            <span>📥 IMAP — Receiving Replies {showImap ? '✅ Enabled' : '(click to enable)'}</span>
            <span style={{ fontSize:11, fontWeight:400, color:'var(--text3)' }}>
              {showImap ? 'Syncs inbox every 5 min' : 'Optional — read replies inside AdoBoost'}
            </span>
          </button>

          {showImap && (
            <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:12, borderTop:'1px solid var(--border)', background:'#fafeff' }}>
              <div style={{ fontSize:12, color:'#1d4ed8', padding:'8px 12px', background:'#eff6ff', borderRadius:6, borderLeft:'3px solid #3b82f6', lineHeight:1.6 }}>
                📬 AdoBoost checks your inbox every 5 minutes and pulls replies into Messages. Read and reply directly — no need to open your email client!
              </div>

              {/* IMAP Host/Port/SSL */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px', gap:10 }}>
                <Input label="IMAP Host" value={form.imap_host} onChange={e => f('imap_host', e.target.value)} placeholder="imap.yourdomain.com" />
                <Input label="IMAP Port" type="number" value={form.imap_port} onChange={e => handleImapPortChange(e.target.value)} />
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>SSL</label>
                  <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!form.imap_secure} onChange={e => f('imap_secure', e.target.checked)} style={{ width:16, height:16, accentColor:'var(--primary)' }} />
                    <span style={{ fontSize:13 }}>{form.imap_secure ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
              </div>

              {/* IMAP Username (same as SMTP) */}
              <div style={{ background:'var(--bg3)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--text2)' }}>
                👤 IMAP Username: <strong>{form.username || '(same as SMTP above)'}</strong>
              </div>

              {/* IMAP Password — always separate, always visible */}
              <div style={{ background: '#fff', border:'2px solid #3b82f6', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#1d4ed8', marginBottom:8 }}>
                  🔑 IMAP Password
                </div>
                <Input
                  label={account ? 'IMAP Password (enter to test or update)' : 'IMAP Password'}
                  type="password"
                  placeholder="Enter your email password for IMAP access"
                  value={imapPassword}
                  onChange={e => setImapPassword(e.target.value)}
                />
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
                  💡 Usually the same as your SMTP password. For Gmail, use the same App Password.
                </div>
              </div>

              {/* IMAP Test Button */}
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <Btn type="button" variant="secondary" size="sm" onClick={handleTestImap} disabled={imapTest==='loading'}>
                  {imapTest==='loading' ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : '📬'} Test IMAP
                </Btn>
                {imapTest==='ok' && <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>✅ IMAP Connected! Inbox sync ready.</span>}
                {imapTest==='error' && (
                  <div>
                    <div style={{ fontSize:12, color:'var(--red)', fontWeight:600 }}>❌ {imapError}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Check: IMAP host, port 993 with SSL ON, correct password</div>
                  </div>
                )}
                {imapTest==='loading' && <span style={{ fontSize:12, color:'var(--text3)' }}>Testing IMAP connection...</span>}
                {!imapTest && <span style={{ fontSize:12, color:'var(--text3)' }}>Enter password above and test before saving</span>}
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

// ── Rich Signature Editor ─────────────────────────
function RichSigEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const lastSet   = useRef('');
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (editorRef.current && !init) {
      editorRef.current.innerHTML = value || '';
      lastSet.current = value || '';
      setInit(true);
    }
  }, [init]);

  useEffect(() => {
    if (!editorRef.current || !init) return;
    if (value !== lastSet.current) {
      editorRef.current.innerHTML = value || '';
      lastSet.current = value || '';
    }
  }, [value, init]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    const html = editorRef.current?.innerHTML || '';
    lastSet.current = html;
    onChange(html);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url.startsWith('http') ? url : 'https://' + url);
  };

  const sep = () => <div style={{ width:1, height:16, background:'#d1d5db', margin:'0 3px' }}/>;

  const T = ({ title, onCmd, children }) => (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); onCmd(); }}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 6px', borderRadius:4, color:'#374151', fontSize:12, display:'flex', alignItems:'center' }}
      onMouseEnter={e => e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e => e.currentTarget.style.background='none'}>
      {children}
    </button>
  );

  return (
    <div style={{ border:'1.5px solid #d1d5db', borderRadius:10, overflow:'hidden', background:'#fff' }}
      onFocusCapture={e => e.currentTarget.style.borderColor='#6366f1'}
      onBlurCapture={e  => e.currentTarget.style.borderColor='#d1d5db'}>
      <div style={{ display:'flex', alignItems:'center', gap:2, padding:'5px 8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', flexWrap:'wrap' }}>
        <T title="Bold"          onCmd={() => exec('bold')}><strong>B</strong></T>
        <T title="Italic"        onCmd={() => exec('italic')}><em>I</em></T>
        <T title="Underline"     onCmd={() => exec('underline')}><span style={{ textDecoration:'underline' }}>U</span></T>
        {sep()}
        <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontSize',e.target.value)}
          style={{ border:'1px solid #e5e7eb', background:'#fff', fontSize:11, cursor:'pointer', color:'#374151', outline:'none', borderRadius:4, padding:'2px 4px' }}>
          <option value="2">10px</option>
          <option value="3">12px</option>
          <option value="4">14px</option>
          <option value="5">18px</option>
        </select>
        {sep()}
        <div style={{ position:'relative', display:'inline-flex' }}>
          <button type="button" title="Font Color"
            onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 5px', borderRadius:4, fontSize:12 }}>
            🎨
            <input type="color" defaultValue="#000000" onChange={e=>exec('foreColor',e.target.value)}
              style={{ width:0, height:0, opacity:0, position:'absolute', pointerEvents:'none' }}/>
          </button>
        </div>
        {sep()}
        <T title="Align Left"   onCmd={() => exec('justifyLeft')}>≡</T>
        <T title="Align Center" onCmd={() => exec('justifyCenter')}>≡</T>
        <T title="Align Right"  onCmd={() => exec('justifyRight')}>≡</T>
        {sep()}
        <T title="Insert Link"  onCmd={insertLink}>🔗</T>
        <T title="Clear"        onCmd={() => exec('removeFormat')}>✕</T>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => { const h = editorRef.current?.innerHTML||''; lastSet.current=h; onChange(h); }}
        data-placeholder={placeholder}
        style={{ minHeight:100, padding:'10px 14px', fontSize:13, lineHeight:1.8, color:'#111827', outline:'none', wordBreak:'break-word' }}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  );
}

// ── Signature Modal ───────────────────────────────
function SignatureModal({ account, onClose, onSaved }) {
  const [mode, setMode] = useState('rich'); // 'rich' | 'plain'
  const [richSig, setRichSig]   = useState('');
  const [plainSig, setPlainSig] = useState('');
  const [saving, setSaving]     = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!account) return;
    try {
      const sig = JSON.parse(account.signature || '{}');
      setRichSig(sig.html || '');
      setPlainSig(sig.plain || '');
      setMode(sig.mode || 'rich');
    } catch {
      setRichSig(account.signature || '');
      setPlainSig('');
    }
    setEditorKey(k => k + 1);
  }, [account]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sigData = JSON.stringify({ mode, html: richSig, plain: plainSig });
      await api.put(`/email-accounts/${account.id}`, { signature: sigData });
      toast.success('✅ Signature saved!');
      onSaved();
    } catch { toast.error('Failed to save signature'); }
    finally { setSaving(false); }
  };

  const DEFAULT_SIGS = [
    {
      label: 'Professional',
      html: `<div style="font-family:Arial,sans-serif;font-size:13px;color:#333;border-top:2px solid #4f46e5;padding-top:10px;margin-top:10px"><strong style="font-size:14px">{{from_name}}</strong><br><span style="color:#6366f1">{{from_email}}</span><br><span style="color:#666">Sent via AdoBoost</span></div>`,
    },
    {
      label: 'Minimal',
      html: `<div style="font-family:Arial,sans-serif;font-size:12px;color:#666;margin-top:12px;padding-top:8px;border-top:1px solid #eee">— {{from_name}}<br>{{from_email}}</div>`,
    },
    {
      label: 'Bold',
      html: `<div style="font-family:Georgia,serif;margin-top:14px;padding-top:10px;border-top:3px solid #000"><strong style="font-size:16px;color:#111">{{from_name}}</strong><br><a href="mailto:{{from_email}}" style="color:#4f46e5;font-size:13px">{{from_email}}</a></div>`,
    },
  ];

  if (!account) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'relative', background:'#fff', borderRadius:16, width:640, maxWidth:'96vw', maxHeight:'90vh', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', zIndex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>✍️ Email Signature</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{account.from_name} &lt;{account.from_email}&gt;</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text3)', lineHeight:1 }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {/* Variable hint */}
          <div style={{ background:'#eff6ff', border:'1px solid #bae6fd', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#0369a1' }}>
            💡 Use <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>{'{{signature}}'}</code> in your campaign or template body to auto-insert this signature. Also supports <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>{'{{from_name}}'}</code> and <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>{'{{from_email}}'}</code> inside the signature itself.
          </div>

          {/* Mode toggle */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)', alignSelf:'center' }}>Format:</span>
            {[{ id:'rich', label:'📝 Rich HTML' }, { id:'plain', label:'📄 Plain Text' }].map(m => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)} style={{ padding:'6px 14px', borderRadius:8, border:`2px solid ${mode===m.id?'var(--primary)':'var(--border2)'}`, background:mode===m.id?'var(--primary-dim)':'#fff', color:mode===m.id?'var(--primary)':'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:mode===m.id?700:400 }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Quick templates */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Quick Templates:</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {DEFAULT_SIGS.map(s => (
                <button key={s.label} type="button" onClick={() => { setRichSig(s.html); setEditorKey(k=>k+1); }} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border2)', background:'#fff', color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}>
                  {s.label}
                </button>
              ))}
              <button type="button" onClick={() => { setRichSig(''); setPlainSig(''); setEditorKey(k=>k+1); }} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #fca5a5', background:'#fff', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                Clear
              </button>
            </div>
          </div>

          {/* Editor */}
          {mode === 'rich' ? (
            <RichSigEditor key={editorKey} value={richSig} onChange={setRichSig} placeholder="Type your signature here... Use {{from_name}} and {{from_email}} as variables" />
          ) : (
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Plain Text Signature</label>
              <textarea value={plainSig} onChange={e=>setPlainSig(e.target.value)}
                placeholder={'--\n{{from_name}}\n{{from_email}}'}
                rows={5}
                style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:10, padding:'10px 14px', fontSize:13, fontFamily:'monospace', lineHeight:1.7, outline:'none', resize:'vertical', boxSizing:'border-box' }}
              />
            </div>
          )}

          {/* Preview */}
          {(richSig || plainSig) && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>👁 Preview:</div>
              <div style={{ border:'1px solid var(--border)', borderRadius:8, padding:14, background:'#fafafa', minHeight:60 }}>
                {mode === 'rich'
                  ? <div dangerouslySetInnerHTML={{ __html: (richSig||'').replace(/\{\{from_name\}\}/g, account.from_name||'Your Name').replace(/\{\{from_email\}\}/g, account.from_email||'you@example.com') }}/>
                  : <pre style={{ fontFamily:'inherit', fontSize:13, color:'var(--text)', margin:0, whiteSpace:'pre-wrap' }}>{(plainSig||'').replace(/\{\{from_name\}\}/g, account.from_name||'Your Name').replace(/\{\{from_email\}\}/g, account.from_email||'you@example.com')}</pre>
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', background:'#fafafa', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', background:'none', border:'1px solid var(--border2)', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'8px 20px', background:saving?'#94a3b8':'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving...' : '💾 Save Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
