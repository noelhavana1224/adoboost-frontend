import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select } from '../components/UI';
import { Users, Plus, Trash2, Edit2, Shield, ShieldCheck, Eye, EyeOff, Mail, Crown, Check, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Permission definitions ───────────────────────
const PERMISSIONS = [
  { group: '📢 Campaigns',
    items: [
      { key: 'campaigns_view',   label: 'View Campaigns',         safe: true  },
      { key: 'campaigns_create', label: 'Create & Edit Campaigns', safe: true  },
      { key: 'campaigns_delete', label: 'Delete Campaigns',        safe: false },
      { key: 'campaigns_launch', label: 'Launch Campaigns',        safe: false },
    ]
  },
  { group: '👥 Contacts',
    items: [
      { key: 'contacts_view',   label: 'View Contacts',    safe: true  },
      { key: 'contacts_import', label: 'Import Contacts',  safe: true  },
      { key: 'contacts_edit',   label: 'Edit Contacts',    safe: true  },
      { key: 'contacts_delete', label: 'Delete Contacts',  safe: false },
    ]
  },
  { group: '📥 Messages',
    items: [
      { key: 'messages_view',  label: 'View Inbox',     safe: true  },
      { key: 'messages_reply', label: 'Reply to Emails', safe: true  },
    ]
  },
  { group: '📊 Reports',
    items: [
      { key: 'reports_view', label: 'View Reports', safe: true },
    ]
  },
  { group: '📧 Email Accounts',
    items: [
      { key: 'email_accounts_view',   label: 'View Email Accounts',   safe: true  },
      { key: 'email_accounts_manage', label: 'Add/Edit Email Accounts', safe: false },
    ]
  },
  { group: '💳 Billing & Settings',
    items: [
      { key: 'billing_view',   label: 'View Billing',       safe: false },
      { key: 'settings_view',  label: 'View Settings',      safe: true  },
      { key: 'settings_edit',  label: 'Edit Settings',      safe: false },
    ]
  },
  { group: '👤 Team',
    items: [
      { key: 'team_view',   label: 'View Team Members', safe: true  },
      { key: 'team_invite', label: 'Invite Team Members', safe: false },
    ]
  },
];

// Default safe permissions
const DEFAULT_PERMISSIONS = Object.fromEntries(
  PERMISSIONS.flatMap(g => g.items).map(p => [p.key, p.safe])
);

function PermissionToggle({ pkey, label, value, onChange, safe }) {
  return (
    <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
      <div>
        <span style={{ fontSize:13, color:'var(--text)' }}>{label}</span>
        {!safe && <span style={{ fontSize:10, marginLeft:6, padding:'1px 5px', borderRadius:4, background:'#fef3c7', color:'#d97706', fontWeight:600 }}>Sensitive</span>}
      </div>
      <div onClick={() => onChange(pkey, !value)}
        style={{ width:38, height:20, borderRadius:10, background:value?'var(--primary)':'#cbd5e1', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, left:value?20:2, width:16, height:16, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s' }}/>
      </div>
    </label>
  );
}

// ── Invite / Edit Member Modal ───────────────────
function MemberModal({ open, member, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', permissions: DEFAULT_PERMISSIONS });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (member) {
      let perms = DEFAULT_PERMISSIONS;
      try { perms = { ...DEFAULT_PERMISSIONS, ...JSON.parse(member.permissions || '{}') }; } catch {}
      setForm({ name: member.name || '', email: member.email || '', password: '', permissions: perms });
    } else {
      setForm({ name:'', email:'', password:'', permissions: DEFAULT_PERMISSIONS });
    }
  }, [open, member]);

  const togglePerm = (key, val) => setForm(p => ({ ...p, permissions: { ...p.permissions, [key]: val } }));

  const enableAll  = () => setForm(p => ({ ...p, permissions: Object.fromEntries(PERMISSIONS.flatMap(g=>g.items).map(i=>[i.key,true])) }));
  const safeOnly   = () => setForm(p => ({ ...p, permissions: DEFAULT_PERMISSIONS }));
  const disableAll = () => setForm(p => ({ ...p, permissions: Object.fromEntries(PERMISSIONS.flatMap(g=>g.items).map(i=>[i.key,false])) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) return toast.error('Email is required');
    setLoading(true);
    try {
      const payload = { ...form, permissions: JSON.stringify(form.permissions) };
      if (member) {
        await api.put(`/team-members/${member.id}`, payload);
        toast.success('Team member updated!');
        onSaved();
      } else {
        const result = await api.post('/team-members/invite', payload);
        toast.success('✅ Invitation sent!');
        onSaved(result.data?.tempPassword ? result.data : null);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.seats_max) {
        // Seat limit error
        toast.error(`${data.error} — ${data.message}`);
      } else {
        toast.error(data?.error || 'Failed');
      }
    }
    finally { setLoading(false); }
  };

  const enabledCount = Object.values(form.permissions).filter(Boolean).length;
  const totalCount   = Object.values(form.permissions).length;

  return (
    <Modal open={open} onClose={onClose} title={member ? `Edit — ${member.name}` : 'Invite Team Member'} width={620}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="Full Name *" value={form.name} onChange={e=>f('name',e.target.value)} required />
          <Input label="Email *" type="email" value={form.email} onChange={e=>f('email',e.target.value)} required />
        </div>
        {member && (
          <Input label="New Password (leave blank to keep)" type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Min 8 characters" />
        )}
        {!member && (
          <div style={{ background:'#f0fff4', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#166534' }}>
            ✅ An invitation email will be sent with their login credentials automatically.
          </div>
        )}

        {/* Permissions */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>🔐 Permissions</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{enabledCount} of {totalCount} features enabled</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button type="button" onClick={safeOnly} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #86efac', background:'#f0fff4', color:'#16a34a', fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Safe Defaults</button>
              <button type="button" onClick={enableAll} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #93c5fd', background:'#eff6ff', color:'#2563eb', fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Enable All</button>
              <button type="button" onClick={disableAll} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff5f5', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Disable All</button>
            </div>
          </div>

          <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            {PERMISSIONS.map((group, gi) => (
              <div key={gi}>
                <div style={{ padding:'8px 14px', background:'var(--bg3)', fontSize:12, fontWeight:700, color:'var(--text2)', borderBottom:'1px solid var(--border)' }}>{group.group}</div>
                <div style={{ padding:'0 14px' }}>
                  {group.items.map(item => (
                    <PermissionToggle key={item.key} pkey={item.key} label={item.label} safe={item.safe} value={!!form.permissions[item.key]} onChange={togglePerm} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{member ? 'Save Changes' : '📧 Invite Member'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Credentials Modal (shown after invite) ───────
function CredentialsModal({ open, credentials, onClose }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass,  setCopiedPass]  = useState(false);
  const copy = (text, which) => {
    navigator.clipboard.writeText(text);
    if (which === 'email') { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }
    else                   { setCopiedPass(true);  setTimeout(() => setCopiedPass(false),  2000); }
  };
  if (!open || !credentials) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:20, backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, boxShadow:'0 24px 60px rgba(0,0,0,0.2)', animation:'slideUp 0.22s ease' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'22px 24px', borderBottom:'1px solid var(--border)', background:'var(--bg3)', borderRadius:'16px 16px 0 0', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Check size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Invitation Sent!</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Share these credentials with {credentials.name}</div>
          </div>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'16px', marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#15803d', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.04em' }}>Login Credentials</div>
            {[
              { label:'Email', value: credentials.email, which: 'email', copied: copiedEmail },
              { label:'Password', value: credentials.tempPassword, which: 'pass', copied: copiedPass },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:11, color:'#15803d', fontWeight:600, marginBottom:2 }}>{row.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', fontFamily:'monospace', letterSpacing:'0.04em' }}>{row.value}</div>
                </div>
                <button onClick={() => copy(row.value, row.which)} style={{
                  display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
                  background: row.copied ? '#16a34a' : '#fff', color: row.copied ? '#fff' : '#15803d',
                  border:'1px solid #86efac', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer',
                  transition:'all 0.18s',
                }}>
                  {row.copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>
            ))}
          </div>
          <div style={{ background:'#fefce8', border:'1px solid #fde047', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#a16207', marginBottom:16, lineHeight:1.55 }}>
            ⚠ Share the password via a secure channel (WhatsApp, Slack, etc.). An invite email was also sent as backup.
          </div>
          <button onClick={onClose} style={{
            width:'100%', padding:'10px', borderRadius:9, border:'none',
            background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff',
            fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Main TeamMembers Page ────────────────────────
export default function TeamMembers() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const { user } = useAuth();
  const isTeamMember = user?.role === 'team_member';
  const canInvite = isTeamMember ? !!user?.permissions?.team_invite : true;

  const [seats, setSeats] = useState({ used: 0, max: 1, plan: 'trial' });

  const load = useCallback(() => {
    api.get('/team-members').then(r => {
      // Handle both old array format and new {members, seats} format
      if (Array.isArray(r.data)) {
        setMembers(r.data);
      } else {
        setMembers(r.data.members || []);
        setSeats(r.data.seats || { used: 0, max: 1, plan: 'trial' });
      }
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (member) => {
    if (!confirm(`Remove ${member.name} from your team?`)) return;
    try {
      await api.delete(`/team-members/${member.id}`);
      toast.success('Team member removed');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const enabledCount = (perms) => {
    try { return Object.values(JSON.parse(perms||'{}')).filter(Boolean).length; } catch { return 0; }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Team Members"
        subtitle={
          <span>
            Invite team members and control what they can access
            <span style={{ marginLeft:10, fontSize:12, padding:'2px 10px', borderRadius:10, background: seats.used >= seats.max ? '#fee2e2' : '#f0fff4', color: seats.used >= seats.max ? '#dc2626' : '#16a34a', fontWeight:600, border:`1px solid ${seats.used >= seats.max ? '#fca5a5' : '#86efac'}` }}>
              👥 {seats.used}/{seats.max} seats · {seats.plan?.charAt(0).toUpperCase() + seats.plan?.slice(1)} plan
            </span>
          </span>
        }
        action={
          canInvite && (
            seats.used >= seats.max ? (
              <Btn variant="secondary" onClick={() => toast.error(`Seat limit reached! Upgrade from ${seats.plan} to add more members.`)}>
                🔒 Upgrade to Add Members
              </Btn>
            ) : (
              <Btn onClick={() => { setEditMember(null); setShowModal(true); }}><Plus size={14}/> Invite Member</Btn>
            )
          )
        }
      />

      {/* Info banner */}
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', gap:12, alignItems:'flex-start' }}>
        <Shield size={20} color="#0284c7" style={{ flexShrink:0, marginTop:1 }}/>
        <div style={{ fontSize:13, color:'#0369a1', lineHeight:1.6 }}>
          Team members share your account but can only access features <strong>you enable</strong>.
          Sensitive features like billing, deleting, and managing email accounts are <strong>off by default</strong>.
          They log in with their own email and password.
        </div>
      </div>

      {members.length === 0 ? (
        <Empty icon={Users} title="No team members yet" description="Invite your team to collaborate on campaigns and contacts."
          action={<Btn onClick={() => setShowModal(true)}><Plus size={14}/> Invite First Member</Btn>} />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg3)', borderBottom:'2px solid var(--border)' }}>
                {['Member','Email','Permissions','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{ borderBottom:'1px solid var(--border)', background:'#fff' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                        {(m.name||m.email||'?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>
                          {m.name || '—'}
                          {m.is_owner && <span style={{ marginLeft:6, fontSize:10, padding:'1px 6px', borderRadius:6, background:'#fef3c7', color:'#d97706', fontWeight:700 }}>👑 Owner</span>}
                          {user?.id === m.id && !m.is_owner && <span style={{ marginLeft:6, fontSize:10, color:'var(--primary)' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>Joined {new Date(m.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text2)' }}>{m.email}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>
                      {m.is_owner
                        ? <span style={{ fontWeight:700, color:'#d97706' }}>All features</span>
                        : <><span style={{ fontWeight:700, color:'var(--primary)' }}>{enabledCount(m.permissions)}</span><span style={{ color:'var(--text3)' }}> / {PERMISSIONS.flatMap(g=>g.items).length} features</span></>
                      }
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <Badge color={m.status === 'active' ? 'green' : 'yellow'}>{m.status || 'active'}</Badge>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {!m.is_owner && m.id !== user?.id && canInvite && (
                        <>
                          <Btn size="sm" variant="secondary" onClick={() => { setEditMember(m); setShowModal(true); }}><Edit2 size={12}/> Edit</Btn>
                          <Btn size="sm" variant="danger" onClick={() => handleDelete(m)}><Trash2 size={12}/></Btn>
                        </>
                      )}
                      {(m.is_owner || m.id === user?.id) && <span style={{ fontSize:12, color:'var(--text3)', padding:'4px 8px' }}>{m.is_owner ? 'Account Owner' : 'You'}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <MemberModal
        open={showModal || !!editMember}
        member={editMember}
        onClose={() => { setShowModal(false); setEditMember(null); }}
        onSaved={(creds) => {
          setShowModal(false); setEditMember(null); load();
          if (creds?.tempPassword) setCredentials(creds);
        }}
      />

      <CredentialsModal
        open={!!credentials}
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}
