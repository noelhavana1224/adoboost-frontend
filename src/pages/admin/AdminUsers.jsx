import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Input, Select, Table, TR, TD, Pagination, Modal } from '../../components/UI';
import { Users, Search, UserX, UserCheck, Trash2, Eye, Key, ShieldAlert, Download, LogIn, Zap, X } from 'lucide-react';

const planColors = { trial: 'yellow', starter: 'blue', professional: 'green', unlimited: 'purple' };

export default function AdminUsers() {
  const [users, setUsers]               = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [plan, setPlan]                 = useState('');
  const [status, setStatus]             = useState('');
  const [page, setPage]                 = useState(1);
  const [changePlan, setChangePlan]     = useState(null);
  const [detailUser, setDetailUser]     = useState(null);
  const [supportLoading, setSupportLoading] = useState(null);
  const [impLoading, setImpLoading]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: { search: search || undefined, plan: plan || undefined, status: status || undefined, page, limit: 20 }
      });
      setUsers(data.users); setTotal(data.total);
    } finally { setLoading(false); }
  }, [search, plan, status, page]);
  useEffect(() => { load(); }, [load]);

  const handleSuspend = async (id, isSusp) => {
    try {
      await api.post(`/admin/users/${id}/${isSusp ? 'unsuspend' : 'suspend'}`, { reason: 'Suspended by admin' });
      toast.success(isSusp ? 'User unsuspended' : 'User suspended'); load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user and ALL their data?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleSupportView = async (user) => {
    if (!confirm(`Open a 30-minute READ-ONLY support session as ${user.name} <${user.email}>?\n\nThis will be logged.`)) return;
    setSupportLoading(user.id);
    try {
      const { data } = await api.post('/admin/support/start', { target_user_id: user.id });
      const params = new URLSearchParams({
        token: data.token, userId: data.target.id,
        name: data.target.name || '', email: data.target.email || '',
        expiresIn: String(data.expires_in),
      });
      window.open(`/support/entry?${params.toString()}`, '_blank');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to start support session');
    } finally { setSupportLoading(null); }
  };

  const handleImpersonate = async (user) => {
    if (!confirm(`Impersonate ${user.name} (${user.email})?\n\nA 15-minute session will open in a new tab. You will be acting as this user with full access.`)) return;
    setImpLoading(user.id);
    try {
      const { data } = await api.post(`/admin/users/${user.id}/impersonate`);
      const params = new URLSearchParams({ token: data.token, name: encodeURIComponent(data.user.name), email: encodeURIComponent(data.user.email) });
      window.open(`/impersonate-entry?${params.toString()}`, '_blank');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    } finally { setImpLoading(null); }
  };

  const handleExportCSV = async () => {
    try {
      const resp = await api.get('/admin/users/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${total} total users`} />

      {/* Filters + Export */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            placeholder="Search name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 14, outline: 'none' }}
          />
        </div>
        <Select value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All Plans</option>
          {['trial', 'starter', 'professional', 'unlimited'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
        </Select>
        <Select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
        <div style={{ marginLeft: 'auto' }}>
          <Btn variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> Export CSV
          </Btn>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={['User', 'Plan', 'Campaigns', 'Contacts', 'Emails Sent', 'AI Credits', 'Joined', 'Last Login', 'Status', 'Actions']}>
            {users.map(u => (
              <TR key={u.id}>
                <TD>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                </TD>
                <TD>
                  <Badge color={planColors[u.plan] || 'gray'} style={{ textTransform: 'capitalize' }}>{u.plan}</Badge>
                </TD>
                <TD>{u.campaigns}</TD>
                <TD>{(u.contacts || 0).toLocaleString()}</TD>
                <TD>{(u.emails_sent || 0).toLocaleString()}</TD>
                <TD>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <Zap size={11} style={{ color: '#7c3aed' }} />
                    {u.ai_credits || 0}
                  </span>
                </TD>
                <TD style={{ color: 'var(--text3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </TD>
                <TD style={{ color: 'var(--text3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                </TD>
                <TD>
                  <Badge color={u.is_suspended ? 'red' : 'green'}>{u.is_suspended ? 'Suspended' : 'Active'}</Badge>
                </TD>
                <TD>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <Btn size="sm" variant="secondary" onClick={() => setDetailUser(u)} title="View Details">
                      <Eye size={11} />
                    </Btn>
                    <Btn size="sm" variant="secondary" onClick={() => handleSupportView(u)} loading={supportLoading === u.id} title="Support View (read-only)">
                      <ShieldAlert size={11} />
                    </Btn>
                    <Btn size="sm" variant="secondary" onClick={() => handleImpersonate(u)} loading={impLoading === u.id} title="Impersonate (15 min)">
                      <LogIn size={11} />
                    </Btn>
                    <Btn size="sm" variant="secondary" onClick={() => setChangePlan(u)} title="Change Plan">
                      <Key size={11} />
                    </Btn>
                    <Btn size="sm" variant={u.is_suspended ? 'success' : 'secondary'} onClick={() => handleSuspend(u.id, u.is_suspended)} title={u.is_suspended ? 'Unsuspend' : 'Suspend'}>
                      {u.is_suspended ? <UserCheck size={11} /> : <UserX size={11} />}
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(u.id)} title="Delete">
                      <Trash2 size={11} />
                    </Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </Card>
      )}

      <ChangePlanModal user={changePlan} onClose={() => setChangePlan(null)} onSaved={() => { setChangePlan(null); load(); }} />
      <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} onChangePlan={u => { setDetailUser(null); setChangePlan(u); }} />
    </div>
  );
}

/* ── Change Plan Modal ─────────────────────────────────── */
function ChangePlanModal({ user, onClose, onSaved }) {
  const [plan, setPlan]   = useState('trial');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) { setPlan(user.plan || 'trial'); setNotes(''); } }, [user]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const expires = new Date(); expires.setMonth(expires.getMonth() + 1);
      await api.put(`/admin/users/${user.id}/plan`, { plan, expires_at: expires.toISOString(), notes });
      toast.success('Plan updated'); onSaved();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title={`Change Plan — ${user?.name}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Select label="Plan" value={plan} onChange={e => setPlan(e.target.value)}>
          {['trial', 'starter', 'professional', 'unlimited'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
        </Select>
        <Input label="Notes (optional)" placeholder="e.g. Manual upgrade by admin" value={notes} onChange={e => setNotes(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Update Plan</Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ── User Detail Modal ─────────────────────────────────── */
function UserDetailModal({ user, onClose, onChangePlan }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setDetail(null); return; }
    setLoading(true);
    api.get(`/admin/users/${user.id}`)
      .then(r => setDetail(r.data))
      .catch(() => toast.error('Failed to load user details'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const planColors = { trial: '#eab308', starter: '#1565C0', professional: '#22c55e', unlimited: '#7c3aed' };

  return (
    <Modal open={!!user} onClose={onClose} title={`User Details — ${user.name}`} style={{ maxWidth: 560 }}>
      {loading ? <Spinner /> : !detail ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#0288d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20 }}>
              {(detail.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{detail.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{detail.email}</div>
              {detail.company && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{detail.company}{detail.country ? ` · ${detail.country}` : ''}</div>}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ background: planColors[detail.plan] || '#888', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                {detail.plan}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Contacts', value: (detail.stats?.contacts || 0).toLocaleString() },
              { label: 'Campaigns', value: detail.stats?.campaigns || 0 },
              { label: 'Emails Sent', value: (detail.stats?.sent || 0).toLocaleString() },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Joined</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{detail.created_at ? new Date(detail.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Last Login</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{detail.last_login ? new Date(detail.last_login).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Never'}</div>
            </div>
          </div>

          {/* Recent campaigns */}
          {(detail.campaigns || []).length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Campaigns</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {detail.campaigns.slice(0, 5).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--bg3)', borderRadius: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <span style={{ color: 'var(--text3)' }}>{c.status} · {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <Btn variant="secondary" onClick={onClose}>Close</Btn>
            <Btn onClick={() => onChangePlan(user)}>Change Plan</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
