import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Linkedin, Plus, Trash2, CheckCircle, XCircle, Play, Pause, AlertTriangle, Info } from 'lucide-react';

// ── Shared UI helpers ────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid var(--border)',
      padding: '18px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, type = 'button', variant = 'primary', size = 'md', loading, disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 8, cursor: loading || disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontWeight: 600, transition: 'opacity 0.15s',
    opacity: loading || disabled ? 0.6 : 1,
  };
  const sizes = { sm: { padding: '5px 12px', fontSize: 12 }, md: { padding: '8px 16px', fontSize: 13 } };
  const variants = {
    primary:   { background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' },
    secondary: { background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)' },
    danger:    { background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' },
    success:   { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    ghost:     { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {loading ? '...' : children}
    </button>
  );
}

function Badge({ children, color }) {
  const colors = {
    green:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    yellow: { bg: '#fefce8', text: '#ca8a04', border: '#fde047' },
    red:    { bg: '#fff1f2', text: '#dc2626', border: '#fecaca' },
    blue:   { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    default:{ bg: 'var(--bg3)', text: 'var(--text2)', border: 'var(--border2)' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function LinkedIn() {
  const [tab, setTab] = useState('accounts');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          LinkedIn Outreach
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>
          Automate connection requests using your LinkedIn session cookies
        </p>
      </div>

      {/* Warning */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        background: '#fefce8', border: '1px solid #fde047', borderRadius: 10,
        padding: '12px 16px', marginBottom: 24,
      }}>
        <AlertTriangle size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: '#854d0e', lineHeight: 1.7 }}>
          <strong>Use responsibly.</strong> LinkedIn automation violates their Terms of Service.
          Keep limits low (10–20/day), use delays, and accept the risk of account restrictions.
          We add 45–120 second random delays between requests to mimic human behaviour.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {['accounts', 'campaigns'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t ? 700 : 500, fontFamily: 'inherit',
            color: tab === t ? '#2563eb' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'accounts' ? <AccountsTab /> : <CampaignsTab />}
    </div>
  );
}

// ── Accounts Tab ──────────────────────────────────────────────────────────

function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState({});

  const load = useCallback(() => {
    api.get('/linkedin/accounts').then(r => setAccounts(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleTest = async (id) => {
    setTesting(t => ({ ...t, [id]: 'loading' }));
    try {
      const { data } = await api.post(`/linkedin/accounts/${id}/test`);
      setTesting(t => ({ ...t, [id]: 'success' }));
      toast.success(`Connected as ${data.name || 'LinkedIn user'}`);
      load();
    } catch (err) {
      setTesting(t => ({ ...t, [id]: 'error' }));
      toast.error(err.response?.data?.error || 'Test failed — cookies may be expired');
      load();
    }
    setTimeout(() => setTesting(t => ({ ...t, [id]: undefined })), 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this LinkedIn account?')) return;
    try { await api.delete(`/linkedin/accounts/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <Card style={{ background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.8 }}>
            <strong>How to get your LinkedIn cookies:</strong><br />
            Install the{' '}
            <a
              href="https://chromewebstore.google.com/detail/copy-cookies/jcbpglbplpblnagieibnemmkiamekcdg"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}
            >
              Copy Cookies Chrome Extension
            </a>
            , then log into LinkedIn, click the extension, and copy the <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 3 }}>li_at</code> and <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 3 }}>JSESSIONID</code> cookie values from the list.
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Add LinkedIn Account</Btn>
      </div>

      {accounts.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Linkedin size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No LinkedIn accounts yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Add your LinkedIn cookies to start sending connection requests</div>
          <Btn onClick={() => setShowAdd(true)}><Plus size={14} /> Add Account</Btn>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map(a => {
            const ts = testing[a.id];
            const statusColor = { pending: 'yellow', active: 'green', error: 'red' };
            return (
              <Card key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Linkedin size={20} color="#2563eb" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.name}
                    <Badge color={statusColor[a.status] || 'default'}>{a.status}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    Limit: {a.daily_limit}/day &nbsp;·&nbsp; Sent today: {a.sent_today}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {ts === 'success' && <CheckCircle size={16} color="#16a34a" />}
                  {ts === 'error' && <XCircle size={16} color="#dc2626" />}
                  <Btn size="sm" variant="secondary" loading={ts === 'loading'} onClick={() => handleTest(a.id)}>
                    Test Connection
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDelete(a.id)}><Trash2 size={13} /></Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </>
  );
}

function AddAccountModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', li_at: '', jsessionid: '', daily_limit: 15 });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/linkedin/accounts', form);
      toast.success('LinkedIn account added');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving account'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add LinkedIn Account</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Account Label">
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. My LinkedIn" required style={inputStyle} />
          </Field>
          <Field label="li_at Cookie">
            <textarea value={form.li_at} onChange={e => f('li_at', e.target.value.trim())}
              placeholder="Paste li_at cookie value..." required
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
          </Field>
          <Field label="JSESSIONID Cookie">
            <input value={form.jsessionid} onChange={e => f('jsessionid', e.target.value.trim())}
              placeholder='ajax:1234567890123456789' required
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} />
          </Field>
          <Field label="Daily Limit" hint="Keep low (10–20/day) to reduce ban risk">
            <input type="number" min={1} max={50} value={form.daily_limit} onChange={e => f('daily_limit', +e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" loading={loading}>Add Account</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Campaigns Tab ─────────────────────────────────────────────────────────

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);

  const load = useCallback(() => {
    api.get('/linkedin/campaigns').then(r => setCampaigns(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (id) => {
    try {
      const { data } = await api.post(`/linkedin/campaigns/${id}/launch`);
      toast.success(`Launched! ${data.scheduled} connection requests scheduled.`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Launch failed'); }
  };

  const handleToggle = async (id, status) => {
    const action = status === 'active' ? 'pause' : 'resume';
    try {
      await api.post(`/linkedin/campaigns/${id}/${action}`);
      toast.success(action === 'pause' ? 'Paused' : 'Resumed');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this LinkedIn campaign and all its data?')) return;
    try { await api.delete(`/linkedin/campaigns/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const statusColor = { draft: 'default', active: 'green', paused: 'yellow', completed: 'blue' };

  if (loading) return <Spinner />;

  return (
    <>
      <Card style={{ background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.7 }}>
            <strong>Contacts need LinkedIn URLs.</strong> Go to <strong>Contacts</strong>, edit each contact, and fill in their
            LinkedIn profile URL (e.g. <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 3 }}>https://linkedin.com/in/johndoe</code>).
            Only contacts with a LinkedIn URL will be enrolled.
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> New Campaign</Btn>
      </div>

      {campaigns.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Linkedin size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No LinkedIn campaigns yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Create a campaign to start sending connection requests</div>
          <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> New Campaign</Btn>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.map(c => (
            <Card key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</span>
                  <Badge color={statusColor[c.status]}>{c.status}</Badge>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span>✅ {c.sent_count || 0} sent</span>
                  <span>⏳ {c.pending_count || 0} pending</span>
                  {c.failed_count > 0 && <span style={{ color: '#dc2626' }}>❌ {c.failed_count} failed</span>}
                  {c.skipped_count > 0 && <span>⏭ {c.skipped_count} skipped</span>}
                  {c.account_name && <span>👤 {c.account_name}</span>}
                  {c.list_name && <span>📋 {c.list_name}</span>}
                  <span>{c.daily_limit}/day limit</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {c.status === 'draft' && (
                  <>
                    <Btn size="sm" variant="ghost" onClick={() => setEditCampaign(c)}>Edit</Btn>
                    <Btn size="sm" variant="success" onClick={() => handleLaunch(c.id)}><Play size={13} /> Launch</Btn>
                  </>
                )}
                {c.status === 'active' && (
                  <Btn size="sm" variant="secondary" onClick={() => handleToggle(c.id, 'active')}><Pause size={13} /> Pause</Btn>
                )}
                {c.status === 'paused' && (
                  <Btn size="sm" variant="success" onClick={() => handleToggle(c.id, 'paused')}><Play size={13} /> Resume</Btn>
                )}
                <Btn size="sm" variant="danger" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(showCreate || !!editCampaign) && (
        <CampaignModal
          campaign={editCampaign}
          onClose={() => { setShowCreate(false); setEditCampaign(null); }}
          onSaved={() => { setShowCreate(false); setEditCampaign(null); load(); }}
        />
      )}
    </>
  );
}

function CampaignModal({ campaign, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', linkedin_account_id: '', list_id: '', connection_note: '', daily_limit: 15 });
  const [accounts, setAccounts] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/linkedin/accounts').then(r => setAccounts(r.data));
    api.get('/contacts/lists').then(r => setLists(r.data));
    if (campaign) {
      setForm({
        name: campaign.name,
        linkedin_account_id: campaign.linkedin_account_id || '',
        list_id: campaign.list_id || '',
        connection_note: campaign.connection_note || '',
        daily_limit: campaign.daily_limit || 15,
      });
    }
  }, [campaign]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Campaign name is required');
    setLoading(true);
    try {
      if (campaign) {
        await api.put(`/linkedin/campaigns/${campaign.id}`, form);
        toast.success('Campaign updated');
      } else {
        await api.post('/linkedin/campaigns', form);
        toast.success('Campaign created');
      }
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const charCount = (form.connection_note || '').length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{campaign ? 'Edit Campaign' : 'New LinkedIn Campaign'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Campaign Name">
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. SaaS Founders Q2 Outreach" required style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="LinkedIn Account">
              <select value={form.linkedin_account_id} onChange={e => f('linkedin_account_id', e.target.value)} style={inputStyle}>
                <option value="">Select account...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Contact List">
              <select value={form.list_id} onChange={e => f('list_id', e.target.value)} style={inputStyle}>
                <option value="">Select list...</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.contact_count})</option>)}
              </select>
            </Field>
          </div>
          <Field label="Daily Limit">
            <input type="number" min={1} max={50} value={form.daily_limit} onChange={e => f('daily_limit', +e.target.value)} style={inputStyle} />
          </Field>
          <Field label={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Connection Note <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></span><span style={{ fontSize: 11, color: charCount > 280 ? '#dc2626' : 'var(--text3)', fontWeight: 500 }}>{charCount}/300</span></div>}>
            <textarea value={form.connection_note} onChange={e => f('connection_note', e.target.value)}
              maxLength={300}
              placeholder="Hi {{first_name}}, I'd love to connect and share ideas about {{company}}..."
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Variables: <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>{'{{first_name}}'}</code>{' '}
              <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>{'{{last_name}}'}</code>{' '}
              <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>{'{{company}}'}</code>
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" loading={loading}>{campaign ? 'Save Changes' : 'Create Campaign'}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Shared form helpers ───────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '9px 12px', boxSizing: 'border-box',
  background: 'var(--bg3)', border: '1px solid var(--border2)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s',
};

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{hint}</div>}
    </div>
  );
}
