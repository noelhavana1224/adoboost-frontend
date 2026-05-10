import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input } from '../../components/UI';
import { Users, Plus, Trash2, Edit2, Crown, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

const ADMIN_PERMISSIONS = [
  { key: 'admin_users',   label: 'Manage Users',         desc: 'View, edit, suspend users',          icon: '👥' },
  { key: 'admin_plans',   label: 'Manage Plans',         desc: 'Create and edit subscription plans',  icon: '💳' },
  { key: 'admin_tickets', label: 'Manage Support',       desc: 'View and respond to support tickets', icon: '🎫' },
  { key: 'admin_reports', label: 'View Platform Reports', desc: 'See platform-wide analytics',        icon: '📊' },
  { key: 'admin_billing', label: 'View Billing',         desc: 'Access billing and revenue data',     icon: '💰' },
];

function AdminMemberModal({ open, member, currentUser, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', is_super_admin:false, admin_permissions: {} });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (member) {
      let perms = {};
      try { perms = JSON.parse(member.admin_permissions || '{}'); } catch {}
      setForm({ name: member.name||'', email: member.email||'', password:'', is_super_admin: member.is_super_admin===1||member.is_super_admin===true, admin_permissions: perms });
    } else {
      setForm({ name:'', email:'', password:'', is_super_admin:false, admin_permissions: Object.fromEntries(ADMIN_PERMISSIONS.map(p=>[p.key,false])) });
    }
  }, [open, member]);

  const togglePerm = (key, val) => setForm(p => ({ ...p, admin_permissions: { ...p.admin_permissions, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) return toast.error('Email required');
    if (!member && !form.password) return toast.error('Password required');
    setLoading(true);
    try {
      const payload = { ...form, admin_permissions: JSON.stringify(form.admin_permissions), role:'admin' };
      member
        ? await api.put(`/admin/team/${member.id}`, payload)
        : await api.post('/admin/team/invite', payload);
      toast.success(member ? 'Admin updated!' : '✅ Admin invited!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={member ? `Edit Admin — ${member.name}` : 'Add Admin Team Member'} width={560}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="Full Name *" value={form.name} onChange={e=>f('name',e.target.value)} required />
          <Input label="Email *" type="email" value={form.email} onChange={e=>f('email',e.target.value)} required disabled={!!member} />
        </div>
        <Input label={member?'New Password (blank = keep)':'Temporary Password *'} type="password" value={form.password} onChange={e=>f('password',e.target.value)} required={!member} />

        {/* Super Admin toggle */}
        <div style={{ background: form.is_super_admin ? '#fef3c7' : 'var(--bg3)', border:`1px solid ${form.is_super_admin?'#fcd34d':'var(--border)'}`, borderRadius:10, padding:'12px 14px' }}>
          <label style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Crown size={20} color={form.is_super_admin?'#d97706':'var(--text3)'}/>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color: form.is_super_admin?'#92400e':'var(--text)' }}>Super Admin</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>Full access to everything — same level as you</div>
              </div>
            </div>
            <div onClick={() => f('is_super_admin', !form.is_super_admin)}
              style={{ width:42, height:22, borderRadius:11, background:form.is_super_admin?'#d97706':'#cbd5e1', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left:form.is_super_admin?22:3, width:16, height:16, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s' }}/>
            </div>
          </label>
          {form.is_super_admin && (
            <div style={{ marginTop:10, fontSize:12, color:'#92400e', background:'#fef9c3', borderRadius:6, padding:'6px 10px' }}>
              ⚠️ Super Admins have full platform access and cannot be restricted. Only grant this to fully trusted partners.
            </div>
          )}
        </div>

        {/* Admin permissions (only if not super admin) */}
        {!form.is_super_admin && (
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:'var(--text2)' }}>🔐 Admin Panel Access</div>
            <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              {ADMIN_PERMISSIONS.map((p, i) => (
                <label key={p.key} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i < ADMIN_PERMISSIONS.length-1 ? '1px solid var(--border)' : 'none', cursor:'pointer', background:form.admin_permissions[p.key]?'#f0fff4':'#fff' }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{p.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{p.label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{p.desc}</div>
                  </div>
                  <div onClick={() => togglePerm(p.key, !form.admin_permissions[p.key])}
                    style={{ width:38, height:20, borderRadius:10, background:form.admin_permissions[p.key]?'#16a34a':'#cbd5e1', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:2, left:form.admin_permissions[p.key]?20:2, width:16, height:16, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s' }}/>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{member?'Save Changes':'Add Admin'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminTeam() {
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [admRes, meRes] = await Promise.all([
        api.get('/admin/team'),
        api.get('/auth/me'),
      ]);
      setAdmins(admRes.data || []);
      setCurrentUser(meRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (admin) => {
    if (admin.is_super_admin === 1 || admin.is_super_admin === true) {
      return toast.error('Cannot remove a Super Admin');
    }
    if (!confirm(`Remove ${admin.name} from admin team?`)) return;
    try {
      await api.delete(`/admin/team/${admin.id}`);
      toast.success('Admin removed');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const isSuperAdmin = (a) => a.is_super_admin === 1 || a.is_super_admin === true;
  const isMe = (a) => a.id === currentUser?.id;

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Admin Team" subtitle="Manage who has access to the admin panel"
        action={<Btn onClick={() => { setEditAdmin(null); setShowModal(true); }}><Plus size={14}/> Add Admin</Btn>}
      />

      {/* Super admin banner */}
      <div style={{ background:'linear-gradient(135deg,#1e40af,#7c3aed)', borderRadius:12, padding:'16px 20px', marginBottom:20, color:'#fff', display:'flex', alignItems:'center', gap:14 }}>
        <Crown size={28} color="#fcd34d"/>
        <div>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:3 }}>You are the Super Admin 👑</div>
          <div style={{ fontSize:13, opacity:0.85 }}>Your account cannot be deleted or demoted by anyone. You can add trusted partners as Super Admins or restrict access per admin panel section.</div>
        </div>
      </div>

      {admins.length === 0 ? (
        <Empty icon={Users} title="No other admins yet" description="Add trusted partners to help manage the platform."
          action={<Btn onClick={() => setShowModal(true)}><Plus size={14}/> Add First Admin</Btn>} />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg3)', borderBottom:'2px solid var(--border)' }}>
                {['Admin','Email','Level','Access','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id} style={{ borderBottom:'1px solid var(--border)', background:'#fff' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:isSuperAdmin(a)?'#fbbf24':isMe(a)?'var(--primary)':'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                        {isSuperAdmin(a)?<Crown size={16}/>:(a.name||a.email||'?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>
                          {a.name}
                          {isMe(a) && <span style={{ marginLeft:6, fontSize:11, color:'var(--primary)' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>Added {new Date(a.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text2)' }}>{a.email}</td>
                  <td style={{ padding:'12px 16px' }}>
                    {isSuperAdmin(a) ? (
                      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#d97706' }}><Crown size={13}/> Super Admin</span>
                    ) : (
                      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6366f1' }}><Shield size={13}/> Admin</span>
                    )}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    {isSuperAdmin(a) ? (
                      <span style={{ fontSize:12, color:'#d97706', fontWeight:600 }}>All features</span>
                    ) : (
                      <span style={{ fontSize:12, color:'var(--text2)' }}>
                        {(() => { try { return Object.values(JSON.parse(a.admin_permissions||'{}')).filter(Boolean).length; } catch { return 0; } })()} / {ADMIN_PERMISSIONS.length} sections
                      </span>
                    )}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {!isMe(a) && (
                        <>
                          <Btn size="sm" variant="secondary" onClick={() => { setEditAdmin(a); setShowModal(true); }}><Edit2 size={12}/> Edit</Btn>
                          {!isSuperAdmin(a) && (
                            <Btn size="sm" variant="danger" onClick={() => handleDelete(a)}><Trash2 size={12}/></Btn>
                          )}
                        </>
                      )}
                      {isMe(a) && <span style={{ fontSize:12, color:'var(--text3)', padding:'4px 8px' }}>Protected</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AdminMemberModal
        open={showModal || !!editAdmin}
        member={editAdmin}
        currentUser={currentUser}
        onClose={() => { setShowModal(false); setEditAdmin(null); }}
        onSaved={() => { setShowModal(false); setEditAdmin(null); load(); }}
      />
    </div>
  );
}
