import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/UI';
import { ListChecks, RefreshCw } from 'lucide-react';

const STATUSES = ['pending', 'in_progress', 'delivered', 'cancelled'];
const SCOLOR = {
  pending:     { color: '#d97706', bg: '#fffbeb' },
  in_progress: { color: '#2563eb', bg: '#eff6ff' },
  delivered:   { color: '#16a34a', bg: '#f0fdf4' },
  cancelled:   { color: '#64748b', bg: '#f8fafc' },
};

export default function AdminListRequests() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/list-requests'); setRows(data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (id, patch) => {
    try {
      await api.put(`/admin/list-requests/${id}`, patch);
      setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const shown = filter === 'all' ? rows : rows.filter(r => r.status === filter);
  const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: rows.filter(r => r.status === s).length }), {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListChecks size={20} color="#2563eb" /> Lead-List Requests
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Done-for-you list requests from clients — fulfill and mark delivered.</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>All {rows.length}</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={chip(filter === s)}>
            {s.replace('_', ' ')} {counts[s] || 0}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>No requests here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map(r => {
            const sc = SCOLOR[r.status] || SCOLOR.pending;
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{r.user_name || 'Unknown'}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>&lt;{r.user_email}&gt;</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, fontSize: 12.5, color: '#334155' }}>
                      <div><b style={{ color: '#94a3b8', fontWeight: 600 }}>Target:</b> {r.target_count?.toLocaleString()} leads</div>
                      <div><b style={{ color: '#94a3b8', fontWeight: 600 }}>Industries:</b> {r.industries || '—'}</div>
                      <div><b style={{ color: '#94a3b8', fontWeight: 600 }}>Titles:</b> {r.job_titles || '—'}</div>
                      <div><b style={{ color: '#94a3b8', fontWeight: 600 }}>Locations:</b> {r.locations || '—'}</div>
                      <div><b style={{ color: '#94a3b8', fontWeight: 600 }}>Size:</b> {r.company_size || '—'}</div>
                      <div><b style={{ color: '#94a3b8', fontWeight: 600 }}>Keywords:</b> {r.keywords || '—'}</div>
                    </div>
                    {r.notes && <div style={{ marginTop: 8, fontSize: 12, color: '#475569', background: '#f8fafc', borderRadius: 7, padding: '7px 10px' }}>📝 {r.notes}</div>}
                  </div>
                </div>

                {/* Admin controls */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <select value={r.status} onChange={e => update(r.id, { status: e.target.value })}
                    style={{ border: `1px solid ${sc.color}`, background: sc.bg, color: sc.color, borderRadius: 8, padding: '6px 10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <input type="number" placeholder="# delivered" defaultValue={r.delivered_count || ''}
                    onBlur={e => { const v = parseInt(e.target.value) || 0; if (v !== (r.delivered_count || 0)) update(r.id, { delivered_count: v }); }}
                    style={{ width: 110, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit' }} />
                  <input placeholder="Note to client (shown on their request)" defaultValue={r.admin_notes || ''}
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

function chip(active) {
  return { padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' };
}
