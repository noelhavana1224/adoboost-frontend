import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Table, TR, TD } from '../components/UI';
import { Send, Plus, Play, Pause, Trash2, Edit2, Eye, X, Copy, Bold, Italic, Underline, List, ChevronDown } from 'lucide-react';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const pct = (n,d) => d>0?((n/d)*100).toFixed(1)+'%':'—';

// ── Personalization variables ────────────────────
const VARS = [
  { label: 'First Name',  value: '{{first_name}}' },
  { label: 'Last Name',   value: '{{last_name}}' },
  { label: 'Full Name',   value: '{{full_name}}' },
  { label: 'Company',     value: '{{company}}' },
  { label: 'Email',       value: '{{email}}' },
  { label: 'Title/Role',  value: '{{title}}' },
  { label: 'Website',     value: '{{website}}' },
];

// ── Personalization Dropdown ─────────────────────
function VarsDropdown({ onInsert, label = 'Insert Variable' }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen(p => !p)} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6,
        fontSize: 12, color: '#2563eb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>
        {'{ }'} {label} <ChevronDown size={11}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }}/>
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 100,
            background: '#fff', border: '1px solid var(--border2)', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden',
          }}>
            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
              Personalization Variables
            </div>
            {VARS.map(v => (
              <button key={v.value} type="button" onClick={() => { onInsert(v.value); setOpen(false); }} style={{
                width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ color: 'var(--text)' }}>{v.label}</span>
                <code style={{ fontSize: 10, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, color: '#2563eb' }}>{v.value}</code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Subject Line Input with Variable Dropdown ────
function SubjectInput({ value, onChange }) {
  const inputRef = useRef(null);

  const insertVar = (variable) => {
    const el = inputRef.current;
    if (!el) { onChange(value + variable); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = value.substring(0, start) + variable + value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Subject Line *</label>
        <VarsDropdown onInsert={insertVar} label="Add Variable" />
      </div>
      <input
        ref={inputRef}
        placeholder="Quick question about {{company}}"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
      />
    </div>
  );
}

// ── Rich Text Editor for Email Body ─────────────
function RichBodyEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize content once
  useEffect(() => {
    if (editorRef.current && !initialized) {
      // Convert plain text to HTML if needed
      const html = value ? value.replace(/\n/g, '<br>') : '';
      editorRef.current.innerHTML = html;
      setInitialized(true);
    }
  }, [initialized]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  };

  const insertVar = (variable) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, variable);
    onChange(editorRef.current?.innerHTML || '');
  };

  const toolBtn = (icon, cmd, title, val = null) => (
    <button type="button" title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, color: 'var(--text2)', display: 'flex', alignItems: 'center' }}
      onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      {icon}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Email Body</label>
        <VarsDropdown onInsert={insertVar} label="Add Variable" />
      </div>
      <div style={{ border: '1.5px solid var(--border2)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '5px 8px', borderBottom: '1px solid var(--border)', background: '#f8fafc', flexWrap: 'wrap' }}>
          {toolBtn(<Bold size={13}/>, 'bold', 'Bold')}
          {toolBtn(<Italic size={13}/>, 'italic', 'Italic')}
          {toolBtn(<Underline size={13}/>, 'underline', 'Underline')}
          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 3px' }}/>
          {toolBtn(<List size={13}/>, 'insertUnorderedList', 'Bullet List')}
          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 3px' }}/>
          {/* Font color */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => exec('foreColor', e.target.value)}
            style={{ border: 'none', background: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text2)', outline: 'none', fontFamily: 'inherit' }}>
            <option value="">🎨 Color</option>
            <option value="#000000">Black</option>
            <option value="#dc2626">Red</option>
            <option value="#2563eb">Blue</option>
            <option value="#16a34a">Green</option>
            <option value="#d97706">Orange</option>
            <option value="#7c3aed">Purple</option>
          </select>
          {/* Background color */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => exec('hiliteColor', e.target.value)}
            style={{ border: 'none', background: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text2)', outline: 'none', fontFamily: 'inherit' }}>
            <option value="">🖍 Highlight</option>
            <option value="#fef08a">Yellow</option>
            <option value="#bbf7d0">Green</option>
            <option value="#bfdbfe">Blue</option>
            <option value="#fecaca">Red</option>
            <option value="transparent">None</option>
          </select>
          {/* Font size */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => exec('fontSize', e.target.value)}
            style={{ border: 'none', background: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--text2)', outline: 'none', fontFamily: 'inherit' }}>
            <option value="">📏 Size</option>
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">Larger</option>
          </select>
        </div>
        {/* Editable area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(editorRef.current?.innerHTML || '')}
          data-placeholder={placeholder || 'Hi {{first_name}},\n\nI noticed {{company}} is...'}
          style={{ minHeight: 150, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, color: 'var(--text)', outline: 'none', wordBreak: 'break-word' }}
        />
      </div>
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#94a3b8;pointer-events:none;white-space:pre}`}</style>
    </div>
  );
}

// ── Main Campaigns Component ─────────────────────
export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editCampaign, setEditCampaign]   = useState(null);
  const [viewCampaign, setViewCampaign]   = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [cloneCampaign, setCloneCampaign] = useState(null);

  const load = useCallback(() => {
    api.get('/campaigns').then(r => setCampaigns(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (id) => {
    try {
      const { data } = await api.post(`/campaigns/${id}/launch`);
      toast.success(`Campaign launched! ${data.scheduled} emails scheduled.`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Launch failed'); }
  };

  const handlePause = async (id, status) => {
    try {
      await api.post(`/campaigns/${id}/${status === 'active' ? 'pause' : 'resume'}`);
      toast.success(status === 'active' ? 'Campaign paused' : 'Campaign resumed');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign and all its data?')) return;
    try { await api.delete(`/campaigns/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  // ── Clone campaign ──
  const handleClone = async (campaign) => {
    try {
      // Fetch full campaign with sequences
      const { data: full } = await api.get(`/campaigns/${campaign.id}`);
      // Create new campaign with "(Copy)" suffix
      const newCamp = {
        name: `${full.name} (Copy)`,
        email_account_id: full.email_account_id || '',
        list_id: full.list_id || '',
        daily_limit: full.daily_limit || 50,
        track_opens: !!full.track_opens,
        track_clicks: !!full.track_clicks,
        sequences: (full.sequences || []).map(s => ({
          subject:     s.subject,
          body:        s.body,
          delay_days:  s.delay_days || 0,
          delay_hours: s.delay_hours || 0,
        })),
      };
      await api.post('/campaigns', newCamp);
      toast.success(`✅ Campaign cloned as "${newCamp.name}"`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Clone failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Manage your cold email campaigns"
        action={<Btn onClick={() => setShowCreate(true)}><Plus size={14}/> Create New Campaign</Btn>} />

      {campaigns.length === 0 ? (
        <Empty icon={Send} title="No campaigns yet" description="Create your first campaign to start sending cold emails."
          action={<Btn onClick={() => setShowCreate(true)}><Plus size={14}/> Create Campaign</Btn>} />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={['Campaign', 'Status', 'Sent', 'Opened', 'Clicked', 'Replied', 'Bounced', 'List', 'Actions']}>
            {campaigns.map(c => (
              <TR key={c.id}>
                <TD>
                  <div style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  {c.account_email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.account_email}</div>}
                </TD>
                <TD><Badge color={STATUS_COLOR[c.status] || 'default'}>{c.status}</Badge></TD>
                <TD>{(c.sent_count || 0).toLocaleString()}</TD>
                <TD style={{ color: 'var(--cyan)' }}>{pct(c.opened_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--green)' }}>{pct(c.clicked_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--purple)' }}>{pct(c.replied_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--red)' }}>{pct(c.bounced_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--text2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.list_name || '—'}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn size="sm" variant="ghost" onClick={() => setViewCampaign(c)} title="View"><Eye size={12}/></Btn>
                    {(c.status === 'draft' || c.status === 'paused') && (
                      <Btn size="sm" variant="ghost" onClick={() => setEditCampaign(c)} title="Edit"><Edit2 size={12}/></Btn>
                    )}
                    {/* Clone button — always available */}
                    <Btn size="sm" variant="ghost" onClick={() => handleClone(c)} title="Clone Campaign">
                      <Copy size={12}/>
                    </Btn>
                    {c.status === 'draft' && (
                      <Btn size="sm" variant="success" onClick={() => handleLaunch(c.id)} title="Launch"><Play size={12}/></Btn>
                    )}
                    {c.status === 'active' && (
                      <Btn size="sm" variant="secondary" onClick={() => handlePause(c.id, 'active')} title="Pause"><Pause size={12}/></Btn>
                    )}
                    {c.status === 'paused' && (
                      <Btn size="sm" variant="success" onClick={() => handlePause(c.id, 'paused')} title="Resume"><Play size={12}/></Btn>
                    )}
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={12}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      <ViewCampaignModal campaign={viewCampaign} onClose={() => setViewCampaign(null)} />

      <CampaignModal
        open={showCreate || !!editCampaign}
        campaign={editCampaign}
        onClose={() => { setShowCreate(false); setEditCampaign(null); }}
        onSaved={() => { setShowCreate(false); setEditCampaign(null); load(); }}
      />
    </div>
  );
}

// ── View Campaign Modal (unchanged) ─────────────
function ViewCampaignModal({ campaign, onClose }) {
  const [data, setData]   = useState(null);
  const [sends, setSends] = useState([]);
  const [tab, setTab]     = useState('overview');

  useEffect(() => {
    if (!campaign) return;
    api.get(`/campaigns/${campaign.id}`).then(r => setData(r.data));
    api.get(`/campaigns/${campaign.id}/sends`).then(r => setSends(r.data));
  }, [campaign]);

  if (!campaign) return null;

  const pctV = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '0%';
  const sent = campaign.sent_count || 0;

  return (
    <Modal open={!!campaign} onClose={onClose} title={`Campaign: ${campaign.name}`} width={720}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['overview', 'sends'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border2)'}`, background: tab === t ? 'var(--primary-dim)' : '#fff', color: tab === t ? 'var(--primary)' : 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
            {[['Sent', sent, 'var(--primary)'], ['Opened', pctV(campaign.opened_count, sent), 'var(--cyan)'], ['Clicked', pctV(campaign.clicked_count, sent), 'var(--green)'], ['Replied', pctV(campaign.replied_count, sent), 'var(--purple)'], ['Bounced', pctV(campaign.bounced_count, sent), 'var(--red)']].map(([l, v, c]) => (
              <div key={l} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {data?.sequences?.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Email Sequences</div>
              {data.sequences.map((s, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, background: 'var(--bg3)' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: i === 0 ? 'var(--primary)' : 'var(--orange)' }}>
                    {i === 0 ? '📧 Initial Email' : `🔄 Follow-up ${i}`}
                    {i > 0 && <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>({s.delay_days}d {s.delay_hours}h delay)</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{s.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 80, overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: s.body }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sends' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 8 }}>
            <Btn size="sm" variant="secondary" onClick={async () => {
              try {
                await api.post(`/campaigns/${campaign.id}/retry-failed`);
                toast.success('Failed sends queued for retry!');
                api.get(`/campaigns/${campaign.id}/sends`).then(r => setSends(r.data));
              } catch { toast.error('Retry failed'); }
            }}>🔄 Retry Failed</Btn>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {sends.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No sends yet</div> : (
              <Table headers={['Email', 'Step', 'Status', 'Error', 'Scheduled', 'Sent', 'Opened']}>
                {sends.map(s => (
                  <TR key={s.id}>
                    <TD style={{ fontSize: 12 }}>{s.email}</TD>
                    <TD style={{ fontSize: 12 }}>#{s.step_number}</TD>
                    <TD><Badge color={s.status === 'sent' ? 'green' : s.status === 'failed' ? 'red' : s.status === 'pending' ? 'yellow' : 'default'} style={{ fontSize: 10 }}>{s.status}</Badge></TD>
                    <TD style={{ fontSize: 11, color: 'var(--red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.error_message}>{s.error_message || '—'}</TD>
                    <TD style={{ fontSize: 11, color: 'var(--text3)' }}>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}</TD>
                    <TD style={{ fontSize: 11, color: 'var(--text3)' }}>{s.sent_at ? new Date(s.sent_at).toLocaleString() : '—'}</TD>
                    <TD style={{ fontSize: 12 }}>{s.opened_at ? '✅' : '—'}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Create/Edit Campaign Modal ───────────────────
function CampaignModal({ open, campaign, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email_account_id: '', list_id: '', daily_limit: 50, track_opens: true, track_clicks: true });
  const [sequences, setSequences] = useState([{ subject: '', body: '', delay_days: 0, delay_hours: 0 }]);
  const [accounts, setAccounts]   = useState([]);
  const [lists, setLists]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const isActive = campaign?.status === 'active';

  useEffect(() => {
    if (!open) return;
    api.get('/email-accounts').then(r => setAccounts(r.data));
    api.get('/contacts/lists').then(r => setLists(r.data));
    if (campaign) {
      setForm({ name: campaign.name, email_account_id: campaign.email_account_id || '', list_id: campaign.list_id || '', daily_limit: campaign.daily_limit, track_opens: !!campaign.track_opens, track_clicks: !!campaign.track_clicks });
      api.get(`/campaigns/${campaign.id}`).then(r => { if (r.data.sequences?.length) setSequences(r.data.sequences); });
    } else {
      setForm({ name: '', email_account_id: '', list_id: '', daily_limit: 50, track_opens: true, track_clicks: true });
      setSequences([{ subject: '', body: '', delay_days: 0, delay_hours: 0 }]);
    }
  }, [open, campaign]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateSeq = (i, key, val) => setSequences(s => s.map((sq, idx) => idx === i ? { ...sq, [key]: val } : sq));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isActive && sequences.some(s => !s.subject)) return toast.error('All steps need a subject');
    setLoading(true);
    try {
      // Convert HTML body to include for sending
      const seqsToSave = sequences.map(s => ({
        ...s,
        // Strip HTML for plain text fallback, keep HTML for body
        body: s.body,
      }));
      campaign
        ? await api.put(`/campaigns/${campaign.id}`, { ...form, sequences: isActive ? undefined : seqsToSave })
        : await api.post('/campaigns', { ...form, sequences: seqsToSave });
      toast.success(campaign ? 'Campaign updated' : 'Campaign created');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={campaign ? `Edit Campaign — ${campaign?.name}` : 'Create New Campaign'} width={720}>
      {isActive && (
        <div style={{ background: '#fffff0', border: '1px solid #faf089', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#975a16' }}>
          ⚠️ This campaign is <strong>active</strong>. You can update the name and daily limit but sequences cannot be changed while running.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Campaign Name *" value={form.name} onChange={e => f('name', e.target.value)} required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Email Account" value={form.email_account_id} onChange={e => f('email_account_id', e.target.value)} disabled={isActive}>
            <option value="">Select account...</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.from_email})</option>)}
          </Select>
          <Select label="Contact List" value={form.list_id} onChange={e => f('list_id', e.target.value)} disabled={isActive}>
            <option value="">Select list...</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.total_contacts || 0})</option>)}
          </Select>
        </div>

        <Input label="Daily Limit" type="number" min={1} max={1000} value={form.daily_limit} onChange={e => f('daily_limit', +e.target.value)} />

        {!isActive && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Email Sequences ({sequences.length} step{sequences.length !== 1 ? 's' : ''})
              </label>
              <Btn type="button" size="sm" variant="secondary"
                onClick={() => setSequences(s => [...s, { subject: '', body: '', delay_days: s.length > 0 ? 3 : 0, delay_hours: 0 }])}>
                <Plus size={12}/> Add Follow-up
              </Btn>
            </div>

            {sequences.map((seq, i) => (
              <div key={i} style={{ border: '1px solid var(--border2)', borderRadius: 10, padding: 16, marginBottom: 12, background: 'var(--bg3)' }}>
                {/* Step header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--primary)' : 'var(--orange)' }}>
                    {i === 0 ? '📧 Initial Email' : `🔄 Follow-up ${i}`}
                  </span>
                  {i > 0 && (
                    <button type="button" onClick={() => setSequences(s => s.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                      <X size={14}/>
                    </button>
                  )}
                </div>

                {/* Delay for follow-ups */}
                {i > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <Input label="Delay (days)" type="number" min={0} value={seq.delay_days}
                      onChange={e => updateSeq(i, 'delay_days', +e.target.value)} />
                    <Input label="Delay (hours)" type="number" min={0} max={23} value={seq.delay_hours}
                      onChange={e => updateSeq(i, 'delay_hours', +e.target.value)} />
                  </div>
                )}

                {/* Subject with variable dropdown */}
                <div style={{ marginBottom: 12 }}>
                  <SubjectInput
                    value={seq.subject}
                    onChange={val => updateSeq(i, 'subject', val)}
                  />
                </div>

                {/* Rich text body editor with variable dropdown */}
                <RichBodyEditor
                  value={seq.body}
                  onChange={val => updateSeq(i, 'body', val)}
                  placeholder={`Hi {{first_name}},\n\nI noticed {{company}} is...`}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{campaign ? 'Save Changes' : 'Create Campaign'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
