import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select } from '../components/UI';
import { Users, Plus, Trash2, Edit2, Shield, ShieldCheck, Eye, EyeOff, Mail, Crown } from 'lucide-react';

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
    if (!member && !form.password) return toast.error('Password is required for new members');
    setLoading(true);
    try {
      const payload = { ...form, permissions: JSON.stringify(form.permissions) };
      member
        ? await api.put(`/team-members/${member.id}`, payload)
        : await api.post('/team-members/invite', payload);
      toast.success(member ? 'Team member updated!' : '✅ Team member invited!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
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
        <Input label={member ? 'New Password (leave blank to keep)' : 'Temporary Password *'} type="password" value={form.password} onChange={e=>f('password',e.target.value)} required={!member} placeholder="Min 8 characters" />

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

// ── Main TeamMembers Page ────────────────────────
export default function TeamMembers() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const load = useCallback(() => {
    api.get('/team-members').then(r => setMembers(r.data || [])).finally(() => setLoading(false));
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
      <PageHeader title="Team Members" subtitle="Invite team members and control what they can access"
        action={<Btn onClick={() => { setEditMember(null); setShowModal(true); }}><Plus size={14}/> Invite Member</Btn>}
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
                        <div style={{ fontWeight:600, fontSize:13 }}>{m.name || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>Joined {new Date(m.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text2)' }}>{m.email}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>
                      <span style={{ fontWeight:700, color:'var(--primary)' }}>{enabledCount(m.permissions)}</span>
                      <span style={{ color:'var(--text3)' }}> / {PERMISSIONS.flatMap(g=>g.items).length} features</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <Badge color={m.status === 'active' ? 'green' : 'yellow'}>{m.status || 'active'}</Badge>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn size="sm" variant="secondary" onClick={() => { setEditMember(m); setShowModal(true); }}><Edit2 size={12}/> Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(m)}><Trash2 size={12}/></Btn>
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
        onSaved={() => { setShowModal(false); setEditMember(null); load(); }}
      />
    </div>
  );
}
