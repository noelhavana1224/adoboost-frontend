import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Input, Select, Table, TR, TD, Pagination, Modal } from '../../components/UI';
import { Users, Search, UserX, UserCheck, Trash2, Eye, Key, ShieldAlert } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [changePlan, setChangePlan] = useState(null);
  const [supportLoading, setSupportLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params:{ search:search||undefined, plan:plan||undefined, status:status||undefined, page, limit:20 } });
      setUsers(data.users); setTotal(data.total);
    } finally { setLoading(false); }
  }, [search, plan, status, page]);
  useEffect(() => { load(); }, [load]);

  const handleSuspend = async (id, isSusp) => {
    try {
      await api.post(`/admin/users/${id}/${isSusp?'unsuspend':'suspend'}`, { reason:'Suspended by admin' });
      toast.success(isSusp?'User unsuspended':'User suspended'); load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user and ALL their data?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleSupportView = async (user) => {
    if (!confirm(`Open a 30-minute READ-ONLY support session as ${user.name} <${user.email}>?\n\nThis will be logged. You will not be able to make changes.`)) return;
    setSupportLoading(user.id);
    try {
      const { data } = await api.post('/admin/support/start', { target_user_id: user.id });
      const params = new URLSearchParams({
        token: data.token,
        userId: data.target.id,
        name: data.target.name || '',
        email: data.target.email || '',
        expiresIn: String(data.expires_in),
      });
      window.open(`/support/entry?${params.toString()}`, '_blank');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to start support session');
    } finally {
      setSupportLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${total} total users`} />
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <div style={{ position:'relative', flex:1, maxWidth:320 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
          <input placeholder="Search name or email..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            style={{ width:'100%', background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:14, outline:'none' }} />
        </div>
        <Select value={plan} onChange={e=>{setPlan(e.target.value);setPage(1);}} style={{ width:160 }}>
          <option value="">All Plans</option>
          {['trial','starter','professional','unlimited'].map(p=><option key={p} value={p} style={{ textTransform:'capitalize' }}>{p}</option>)}
        </Select>
        <Select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} style={{ width:140 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>
      {loading ? <Spinner /> : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <Table headers={['User','Plan','Campaigns','Contacts','Emails Sent','Joined','Status','Actions']}>
            {users.map(u => (
              <TR key={u.id}>
                <TD>
                  <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{u.email}</div>
                </TD>
                <TD><Badge color={u.plan==='trial'?'yellow':u.plan==='unlimited'?'purple':'green'} style={{ textTransform:'capitalize' }}>{u.plan}</Badge></TD>
                <TD>{u.campaigns}</TD>
                <TD>{(u.contacts||0).toLocaleString()}</TD>
                <TD>{(u.emails_sent||0).toLocaleString()}</TD>
                <TD style={{ color:'var(--text3)', whiteSpace:'nowrap', fontSize:12 }}>{new Date(u.created_at).toLocaleDateString()}</TD>
                <TD><Badge color={u.is_suspended?'red':'green'}>{u.is_suspended?'Suspended':'Active'}</Badge></TD>
                <TD>
                  <div style={{ display:'flex', gap:4 }}>
                    <Btn size="sm" variant="secondary" onClick={()=>handleSupportView(u)} loading={supportLoading===u.id} title="Open Support View (read-only)">
                      <ShieldAlert size={11}/>
                    </Btn>
                    <Btn size="sm" variant="secondary" onClick={()=>setChangePlan(u)} title="Change Plan"><Key size={11}/></Btn>
                    <Btn size="sm" variant={u.is_suspended?'success':'secondary'} onClick={()=>handleSuspend(u.id,u.is_suspended)} title={u.is_suspended?'Unsuspend':'Suspend'}>
                      {u.is_suspended?<UserCheck size={11}/>:<UserX size={11}/>}
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={()=>handleDelete(u.id)} title="Delete"><Trash2 size={11}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
          <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </Card>
      )}
      <ChangePlanModal user={changePlan} onClose={()=>setChangePlan(null)} onSaved={()=>{setChangePlan(null);load();}} />
    </div>
  );
}

function ChangePlanModal({ user, onClose, onSaved }) {
  const [plan, setPlan] = useState('trial');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) setPlan(user.plan||'trial'); }, [user]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const expires = new Date(); expires.setMonth(expires.getMonth()+1);
      await api.put(`/admin/users/${user.id}/plan`, { plan, expires_at: expires.toISOString(), notes });
      toast.success('Plan updated'); onSaved();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title={`Change Plan — ${user?.name}`}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Select label="Plan" value={plan} onChange={e=>setPlan(e.target.value)}>
          {['trial','starter','professional','unlimited'].map(p=><option key={p} value={p} style={{ textTransform:'capitalize' }}>{p}</option>)}
        </Select>
        <Input label="Notes (optional)" placeholder="e.g. Manual upgrade by admin" value={notes} onChange={e=>setNotes(e.target.value)} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Update Plan</Btn>
        </div>
      </form>
    </Modal>
  );
}
