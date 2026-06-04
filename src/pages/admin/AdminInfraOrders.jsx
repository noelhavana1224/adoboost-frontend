import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/UI';
import { Server, RefreshCw } from 'lucide-react';

const STATUSES = ['pending', 'in_progress', 'delivered', 'cancelled'];
const SCOLOR = {
  pending:     { color: '#d97706', bg: '#fffbeb' },
  in_progress: { color: '#2563eb', bg: '#eff6ff' },
  delivered:   { color: '#16a34a', bg: '#f0fdf4' },
  cancelled:   { color: '#64748b', bg: '#f8fafc' },
};
const money = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminInfraOrders() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/infra-orders'); setRows(data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (id, patch) => {
    try { await api.put(`/admin/infra-orders/${id}`, patch); setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r)); toast.success('Updated'); }
    catch { toast.error('Failed'); }
  };

  const shown = filter === 'all' ? rows : rows.filter(r => r.status === filter);
  const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: rows.filter(r => r.status === s).length }), {});
  const mrr = rows.filter(r => r.status === 'delivered').reduce((s, r) => s + (r.monthly_cost || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={20} color="#2563eb" /> Infrastructure Orders
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Done-for-you mailbox + domain orders. Active monthly: <b style={{ color: '#16a34a' }}>{money(mrr)}/mo</b></p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>All {rows.length}</button>
        {STATUSES.map(s => <button key={s} onClick={() => setFilter(s)} style={chip(filter === s)}>{s.replace('_', ' ')} {counts[s] || 0}</button>)}
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>No orders here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map(r => {
            const sc = SCOLOR[r.status] || SCOLOR.pending;
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{r.user_name || 'Unknown'}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>&lt;{r.user_email}&gt;</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 9, background: '#f1f5f9', color: '#475569', textTransform: 'capitalize' }}>{r.provider}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, fontSize: 13, marginBottom: 10 }}>
                  <Stat k="Mailboxes" v={r.mailboxes} />
                  <Stat k="Domains" v={r.own_domain ? `${r.domains} (owns)` : r.domains} />
                  <Stat k="Volume/day" v={(r.target_volume || 0).toLocaleString()} />
                  <Stat k="First month" v={money(r.first_month_cost)} c="#7c3aed" />
                  <Stat k="Monthly" v={money(r.monthly_cost)} c="#16a34a" />
                </div>
                {r.notes && <div style={{ fontSize: 12, color: '#475569', background: '#f8fafc', borderRadius: 7, padding: '7px 10px', marginBottom: 10 }}>📝 {r.notes}</div>}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <select value={r.status} onChange={e => update(r.id, { status: e.target.value })}
                    style={{ border: `1px solid ${sc.color}`, background: sc.bg, color: sc.color, borderRadius: 8, padding: '6px 10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <input placeholder="Note to client" defaultValue={r.admin_notes || ''}
                    onBlur={e => { if (e.target.value !== (r.admin_notes || '')) update(r.id, { admin_notes: e.target.value }); }}
                    style={{ flex: 1, minWidth: 200, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, c }) {
  return <div><div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{k}</div><div style={{ fontSize: 15, fontWeight: 800, color: c || '#0f172a' }}>{v}</div></div>;
}
function chip(active) {
  return { padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' };
}
