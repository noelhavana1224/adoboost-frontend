import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Alert, Table, TR, TD } from '../components/UI';
import { Mail, Plus, Trash2, CheckCircle, XCircle, Loader2, Edit2 } from 'lucide-react';

const PRESETS = {
  hostinger: {
    host: 'smtp.hostinger.com', port: 465, secure: true,
    hint: '📧 Hostinger Email: Use your full email address as username (e.g. you@yourdomain.com) and your Hostinger email password. Port 465 with SSL ON.',
    userPlaceholder: 'you@yourdomain.com',
    namePlaceholder: 'e.g. Company Main Email',
  },
  smtp: {
    host: '', port: 587, secure: false,
    hint: '⚙️ Custom SMTP: Enter your mail server details. Contact your email provider for the correct host, port and SSL settings.',
    userPlaceholder: 'you@yourdomain.com',
    namePlaceholder: 'e.g. My Email Account',
  },
  gmail: {
    host: 'smtp.gmail.com', port: 587, secure: false,
    hint: '📘 Gmail: You MUST use an App Password — NOT your regular Gmail password. Go to myaccount.google.com → Security → 2-Step Verification (enable it) → App passwords → Create one for "AdoBoost". Copy the 16-character password.',
    userPlaceholder: 'yourname@gmail.com',
    namePlaceholder: 'e.g. My Gmail Account',
  },
  outlook: {
    host: 'smtp.office365.com', port: 587, secure: false,
    hint: '🔷 Outlook / Microsoft 365: Use your full Microsoft email address and your regular password. If using 2FA, create an App Password in your Microsoft account security settings.',
    userPlaceholder: 'yourname@outlook.com',
    namePlaceholder: 'e.g. My Outlook Account',
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com', port: 465, secure: true,
    hint: '🟣 Yahoo Mail: You must generate an App Password. Go to Yahoo Account Security → Generate app password. Use that password here instead of your regular Yahoo password.',
    userPlaceholder: 'yourname@yahoo.com',
    namePlaceholder: 'e.g. My Yahoo Account',
  },
};

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [testing, setTesting] = useState({});

  const load = useCallback(() => {
    api.get('/email-accounts').then(r => setAccounts(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTest = async (id) => {
    setTesting(t => ({ ...t, [id]: 'loading' }));
    try {
      await api.post(`/email-accounts/${id}/test`);
      setTesting(t => ({ ...t, [id]: 'ok' }));
      toast.success('Connection successful! ✅');
    } catch (err) {
      setTesting(t => ({ ...t, [id]: 'error' }));
      toast.error(err.response?.data?.error || 'Connection failed — check your settings');
    }
    setTimeout(() => setTesting(t => ({ ...t, [id]: null })), 5000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this email account?')) return;
    try { await api.delete(`/email-accounts/${id}`); toast.success('Account removed'); load(); }
    catch { toast.error('Failed to remove'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Email Accounts"
        subtitle="Connect SMTP accounts to send campaigns"
        action={<Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Add Account</Btn>}
      />

      <Alert type="info" title="Hostinger Users">
        Use host <strong>smtp.hostinger.com</strong>, port <strong>465</strong>, SSL <strong>ON</strong> and your Hostinger email password.
      </Alert>

      <div style={{ marginTop: 20 }}>
        {accounts.length === 0 ? (
          <Empty icon={Mail} title="No email accounts connected"
            description="Connect an SMTP account to start sending campaigns."
            action={<Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Add Account</Btn>} />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table headers={['', 'Name', 'Email', 'Host', 'Port', 'SSL', 'Status', 'Daily Limit', 'Sent Today', 'Actions']}>
              {accounts.map(a => (
                <TR key={a.id}>
                  <TD style={{ width: 36 }}>
                    <div style={{ width: 36, height: 36, background: 'var(--primary-dim)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={16} color="var(--primary)" />
                    </div>
                  </TD>
                  <TD style={{ fontWeight: 500 }}>{a.name}</TD>
                  <TD style={{ color: 'var(--text2)', fontSize: 12 }}>{a.from_email}</TD>
                  <TD style={{ color: 'var(--text2)', fontSize: 12 }}>{a.host || '—'}</TD>
                  <TD style={{ fontSize: 12 }}>{a.port}</TD>
                  <TD><Badge color={a.secure ? 'green' : 'default'}>{a.secure ? 'ON' : 'OFF'}</Badge></TD>
                  <TD><Badge color={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</Badge></TD>
                  <TD>{a.daily_limit}</TD>
                  <TD>{a.sent_today}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {testing[a.id] === 'loading' && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />}
                      {testing[a.id] === 'ok' && <CheckCircle size={14} color="var(--green)" />}
                      {testing[a.id] === 'error' && <XCircle size={14} color="var(--red)" />}
                      <Btn size="sm" variant="secondary" onClick={() => handleTest(a.id)}>Test</Btn>
                      <Btn size="sm" variant="secondary" onClick={() => setEditAccount(a)}><Edit2 size={12} /> Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(a.id)}><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          </Card>
        )}
      </div>

      <AccountModal
        open={showAdd || !!editAccount}
        account={editAccount}
        onClose={() => { setShowAdd(false); setEditAccount(null); }}
        onSaved={() => { setShowAdd(false); setEditAccount(null); load(); }}
      />
    </div>
  );
}

function AccountModal({ open, account, onClose, onSaved }) {
  const [type, setType] = useState('hostinger');
  const [form, setForm] = useState({
    name: '', host: 'smtp.hostinger.com', port: 465, secure: true,
    username: '', password: '', from_name: '', from_email: '', daily_limit: 50
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(null);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (account) {
      // Edit mode — prefill form with existing account data
      setForm({
        name: account.name || '',
        host: account.host || '',
        port: account.port || 465,
        secure: account.secure === 1,
        username: account.username || '',
        password: '',  // never prefill password for security
        from_name: account.from_name || '',
        from_email: account.from_email || '',
        daily_limit: account.daily_limit || 50,
      });
      // Detect type from host
      if (account.host?.includes('hostinger')) setType('hostinger');
      else if (account.host?.includes('gmail')) setType('gmail');
      else if (account.host?.includes('office365')) setType('outlook');
      else if (account.host?.includes('yahoo')) setType('yahoo');
      else setType('smtp');
    } else {
      // Add mode — always start completely empty, just set the SMTP settings from preset
      setType('hostinger');
      setForm({
        name: '',
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        username: '',
        password: '',
        from_name: '',
        from_email: '',
        daily_limit: 50,
      });
    }
    setTesting(null);
  }, [open, account]);

  const handleTypeChange = (t) => {
    setType(t);
    const preset = PRESETS[t];
    // Only update SMTP settings, keep user-entered data if editing
    setForm(p => ({
      ...p,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
      // Clear user fields only when adding new account
      ...(account ? {} : { username: '', password: '', from_name: '', from_email: '' })
    }));
    setTesting(null);
  };

  const handleTest = async () => {
    if (!form.host || !form.username || !form.password) return toast.error('Fill in host, username and password first');
    setTesting('loading');
    try {
      // Create a temp account to test
      const { data } = await api.post('/email-accounts/test-settings', {
        host: form.host, port: form.port, secure: form.secure,
        username: form.username, password: form.password
      });
      setTesting('ok');
      toast.success('Connection successful! ✅ Settings are correct.');
    } catch (err) {
      setTesting('error');
      toast.error(err.response?.data?.error || 'Connection failed — check settings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) return toast.error('Username/email required');
    if (!account && !form.password) return toast.error('Password required');
    if (!form.from_email) return toast.error('From email required');
    setLoading(true);
    try {
      if (account) {
        // Edit — only send password if changed
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/email-accounts/${account.id}`, { ...payload, type });
      } else {
        await api.post('/email-accounts', { ...form, type });
      }
      toast.success(account ? 'Account updated!' : 'Account connected!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving account'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={account ? `Edit — ${account.name}` : 'Connect Email Account'} width={600}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Provider selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries({ hostinger: 'Hostinger', smtp: 'Custom SMTP', gmail: 'Gmail', outlook: 'Outlook', yahoo: 'Yahoo' }).map(([k, v]) => (
              <button type="button" key={k} onClick={() => handleTypeChange(k)} style={{
                padding: '7px 14px', borderRadius: 8,
                border: `2px solid ${type === k ? 'var(--primary)' : 'var(--border2)'}`,
                background: type === k ? 'var(--primary-dim)' : '#fff',
                color: type === k ? 'var(--primary)' : 'var(--text2)',
                fontWeight: type === k ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
              }}>{v}</button>
            ))}
          </div>
          {PRESETS[type]?.hint && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '3px solid var(--primary)' }}>
              💡 {PRESETS[type].hint}
            </div>
          )}
        </div>

        <Input label="Account Name"
          placeholder={PRESETS[type]?.namePlaceholder || 'e.g. My Email Account'}
          value={form.name} onChange={e => f('name', e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: 10 }}>
          <Input label="SMTP Host" value={form.host} onChange={e => f('host', e.target.value)} required />
          <Input label="Port" type="number" value={form.port} onChange={e => f('port', +e.target.value)} required />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>SSL/TLS</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.secure} onChange={e => f('secure', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <span style={{ fontSize: 13 }}>{form.secure ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        </div>

        <Input label="Username / Email Address"
          type="email"
          placeholder={PRESETS[type]?.userPlaceholder || 'you@yourdomain.com'}
          value={form.username} onChange={e => f('username', e.target.value)} required />
        <Input label={account ? "Password (leave blank to keep current)" : "Password"}
          type="password" placeholder="••••••••"
          value={form.password} onChange={e => f('password', e.target.value)}
          required={!account} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="From Name" placeholder="e.g. John Smith" value={form.from_name} onChange={e => f('from_name', e.target.value)} />
          <Input label="From Email" type="email"
            placeholder={PRESETS[type]?.userPlaceholder || 'you@yourdomain.com'}
            value={form.from_email} onChange={e => f('from_email', e.target.value)} required />
        </div>

        <Input label="Daily Send Limit" type="number" min={1} max={1000} value={form.daily_limit}
          onChange={e => f('daily_limit', +e.target.value)} />

        {/* Test connection button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <Btn type="button" variant="secondary" size="sm" onClick={handleTest}>
            {testing === 'loading' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : '🔌'} Test Connection
          </Btn>
          {testing === 'ok' && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✅ Connection successful!</span>}
          {testing === 'error' && <span style={{ fontSize: 13, color: 'var(--red)' }}>❌ Connection failed — check settings above</span>}
          {!testing && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Test before saving to make sure everything works</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{account ? 'Save Changes' : 'Connect Account'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
