import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/UI';
import {
  Flame, Mail, RefreshCw, Search, CheckCheck, Inbox,
  Users, Calendar, Zap, Trash2, X, ChevronDown,
} from 'lucide-react';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function avatarColor(str) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) h = (str||'').charCodeAt(i) + ((h<<5) - h);
  return colors[Math.abs(h) % colors.length];
}

function initials(s) {
  const parts = (s||'').split(/[\s@._]+/).filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (s||'?')[0].toUpperCase();
}

// ── Checkbox component ───────────────────────────
function Checkbox({ checked, indeterminate, onChange, onClick }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick?.(e); onChange?.(!checked); }}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked || indeterminate ? '#d97706' : '#d1d5db'}`,
        background: checked ? '#d97706' : indeterminate ? '#fcd34d' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {indeterminate && !checked && (
        <div style={{ width: 8, height: 2, background: '#92400e', borderRadius: 1 }}/>
      )}
    </div>
  );
}

// ── Confirm delete dialog ────────────────────────
function DeleteConfirmBar({ count, onConfirm, onCancel, deleting, deleteAll, total }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'linear-gradient(135deg,#991b1b,#dc2626)',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderRadius: '10px 10px 0 0',
    }}>
      <Trash2 size={16} color="#fff"/>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>
        {deleteAll
          ? `Delete ALL ${total} warmup emails?`
          : `Delete ${count} selected email${count !== 1 ? 's' : ''}?`
        }
      </span>
      <button onClick={onCancel}
        style={{ padding: '5px 14px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
        Cancel
      </button>
      <button onClick={onConfirm} disabled={deleting}
        style={{ padding: '5px 16px', background: '#fff', border: 'none', borderRadius: 7, color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}>
        {deleting ? 'Deleting…' : 'Yes, Delete'}
      </button>
    </div>
  );
}

export default function WarmerInbox() {
  const [messages, setMessages]   = useState([]);
  const [stats, setStats]         = useState({ total: 0, unread: 0, unique_senders: 0, today: 0 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [selected, setSelected]   = useState(null);       // open message
  const [checked, setChecked]     = useState(new Set());  // checked ids
  const [confirmDelete, setConfirmDelete] = useState(null); // null | 'selected' | 'all'
  const [deleting, setDeleting]   = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const LIMIT = 25;

  const load = useCallback(async (pg = 1, q = search) => {
    setLoading(true);
    setChecked(new Set()); // clear selection on load
    try {
      const params = { page: pg, limit: LIMIT };
      if (q) params.search = q;
      const { data } = await api.get('/messages/warmer-inbox', { params });
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setStats(data.stats || { total: 0, unread: 0, unique_senders: 0, today: 0 });
      setPage(pg);
    } catch { toast.error('Failed to load warmer inbox'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1, ''); }, []);

  // ── Selection helpers ──────────────────────────
  const allChecked   = messages.length > 0 && messages.every(m => checked.has(m.id));
  const someChecked  = messages.some(m => checked.has(m.id)) && !allChecked;
  const checkedCount = checked.size;

  const toggleOne = (id) => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(messages.map(m => m.id)));
  };

  const clearSelection = () => setChecked(new Set());

  // ── Actions ────────────────────────────────────
  const handleSearch = (e) => { e.preventDefault(); load(1, search); };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await api.post('/messages/warmer-inbox/mark-all-read');
      toast.success('All warmup emails marked as read');
      load(page, search);
    } catch { toast.error('Failed'); }
    setMarkingRead(false);
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      const { data } = await api.post('/messages/warmer-inbox/backfill');
      toast.success(`✅ Classified ${data.classified} existing emails as warmup`);
      load(1, '');
    } catch { toast.error('Backfill failed'); }
    setBackfilling(false);
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const isDeleteAll = confirmDelete === 'all';
      const { data } = await api.post('/messages/warmer-inbox/bulk-delete', {
        ...(isDeleteAll ? { delete_all: true } : { ids: [...checked] }),
      });
      toast.success(`🗑️ Deleted ${data.deleted} warmup email${data.deleted !== 1 ? 's' : ''}`);
      setConfirmDelete(null);
      clearSelection();
      if (selected && (isDeleteAll || checked.has(selected.id))) setSelected(null);
      load(1, search);
    } catch { toast.error('Delete failed'); }
    setDeleting(false);
  };

  const handleSelectMsg = async (msg) => {
    setSelected(selected?.id === msg.id ? null : msg);
    if (msg.status === 'unread') {
      try {
        await api.post(`/messages/${msg.id}/read`, { status: 'read' });
        setMessages(ms => ms.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
        setStats(s => ({ ...s, unread: Math.max(0, (s.unread || 0) - 1) }));
      } catch {}
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color="#d97706"/> Warmer Inbox
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
              Emails from the AdoBoost warmup network — separate from your prospect replies
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {stats.unread > 0 && (
              <button onClick={handleMarkAllRead} disabled={markingRead}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
                <CheckCheck size={13}/> Mark all read
              </button>
            )}
            <button onClick={() => load(page, search)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={handleBackfill} disabled={backfilling}
              title="Scan existing inbox and move warmup emails here"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, fontSize:12, color:'#92400e', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {backfilling
                ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }}/>
                : <Zap size={13}/>
              } Classify Existing
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Total warmup emails', value: stats.total || 0, color: '#6366f1', bg: '#f5f3ff' },
            { label: 'Unread',              value: stats.unread || 0, color: '#dc2626', bg: '#fff5f5' },
            { label: 'Unique senders',      value: stats.unique_senders || 0, color: '#16a34a', bg: '#f0fff4' },
            { label: 'Received today',       value: stats.today || 0, color: '#2563eb', bg: '#eff6ff' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search warmup emails…"
              style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}/>
          </div>
          <button type="submit" style={{ padding: '9px 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Search
          </button>
        </form>
      </div>

      {/* Info banner */}
      <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#92400e', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Flame size={14} color="#d97706" style={{ flexShrink: 0 }}/>
        <span><strong>These emails are from other AdoBoost users</strong> exchanging warmup emails through the community warmup network. They are automatically separated from your real prospect replies.</span>
      </div>

      {/* ── Bulk action bar — appears when items are checked ── */}
      {checkedCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
          marginBottom: 10,
        }}>
          <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e', flex: 1 }}>
            {checkedCount} selected
          </span>
          <button onClick={clearSelection}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#fff', border:'1px solid #fcd34d', borderRadius:7, fontSize:12, color:'#92400e', cursor:'pointer', fontFamily:'inherit' }}>
            <X size={12}/> Deselect all
          </button>
          <button onClick={() => setConfirmDelete('selected')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', background:'#dc2626', border:'none', borderRadius:7, fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
            <Trash2 size={12}/> Delete {checkedCount} selected
          </button>
          <button onClick={() => setConfirmDelete('all')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', background:'#7f1d1d', border:'none', borderRadius:7, fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
            <Trash2 size={12}/> Delete All ({total})
          </button>
        </div>
      )}

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <DeleteConfirmBar
          count={checkedCount}
          total={total}
          deleteAll={confirmDelete === 'all'}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      {/* ── Split view ── */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '400px 1fr' : '1fr', gap: 14, flex: 1, minHeight: 0 }}>

        {/* Message list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
          ) : messages.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Flame size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px', color: '#d97706' }}/>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>No warmup emails yet</div>
              <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                Warmup emails from other AdoBoost members will appear here.<br/>
                Click <strong>"Classify Existing"</strong> to scan your current inbox.
              </div>
            </div>
          ) : (
            <>
              {/* List header with select-all */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa' }}>
                <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll}/>
                <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>
                  {checkedCount > 0
                    ? <span style={{ color: '#d97706', fontWeight: 700 }}>{checkedCount} of {messages.length} selected</span>
                    : <>{total} warmup email{total !== 1 ? 's' : ''}{stats.unread > 0 && <span style={{ color:'#d97706', fontWeight:700, marginLeft:8 }}>{stats.unread} unread</span>}</>
                  }
                </span>
                {/* Quick delete selected from header */}
                {checkedCount > 0 && (
                  <button onClick={() => setConfirmDelete('selected')}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, fontSize:11, color:'#dc2626', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    <Trash2 size={11}/> Delete selected
                  </button>
                )}
              </div>

              {/* Messages */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {messages.map(msg => {
                  const isUnread   = msg.status === 'unread';
                  const isSelected = selected?.id === msg.id;
                  const isChecked  = checked.has(msg.id);
                  const color      = avatarColor(msg.from_email);
                  return (
                    <div key={msg.id}
                      style={{
                        padding: '11px 14px', cursor: 'pointer',
                        borderBottom: '1px solid #f8fafc',
                        background: isChecked ? '#fef9c3' : isSelected ? '#fffbeb' : isUnread ? '#fffef7' : '#fff',
                        borderLeft: isChecked ? '3px solid #d97706' : isSelected ? '3px solid #f59e0b' : '3px solid transparent',
                        transition: 'background 0.1s',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}
                      onMouseEnter={e => { if (!isChecked && !isSelected) e.currentTarget.style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (!isChecked && !isSelected) e.currentTarget.style.background = isUnread ? '#fffef7' : '#fff'; }}
                    >
                      {/* Checkbox */}
                      <div style={{ paddingTop: 2 }}>
                        <Checkbox checked={isChecked} onChange={() => toggleOne(msg.id)}/>
                      </div>

                      {/* Avatar + content */}
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleSelectMsg(msg)}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {initials(msg.from_name || msg.from_email)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                              <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                {msg.sender_account_name || msg.from_name || msg.from_email}
                              </span>
                              <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 6 }}>{timeAgo(msg.received_at)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                              {msg.from_email}
                            </div>
                            <div style={{ fontSize: 12, color: isUnread ? '#374151' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isUnread ? 600 : 400 }}>
                              {msg.subject || '(no subject)'}
                            </div>
                          </div>
                          {isUnread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706', flexShrink: 0, marginTop: 5 }}/>}
                        </div>
                      </div>

                      {/* Row-level delete */}
                      <button
                        onClick={e => { e.stopPropagation(); setChecked(new Set([msg.id])); setConfirmDelete('selected'); }}
                        title="Delete this email"
                        style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: 5, flexShrink: 0, opacity: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fff5f5'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                        className="row-delete-btn"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Page {page} of {totalPages}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => load(page - 1, search)} disabled={page <= 1}
                      style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                      ← Prev
                    </button>
                    <button onClick={() => load(page + 1, search)} disabled={page >= totalPages}
                      style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Message detail panel ── */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Detail header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: avatarColor(selected.from_email), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {initials(selected.from_name || selected.from_email)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 1 }}>
                  {selected.sender_account_name || selected.from_name || selected.from_email}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{selected.from_email}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  {new Date(selected.received_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', fontWeight: 600 }}>
                  🔥 Warmup
                </span>
                <button
                  onClick={() => { setChecked(new Set([selected.id])); setConfirmDelete('selected'); }}
                  title="Delete this email"
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:7, fontSize:11, color:'#dc2626', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                  <Trash2 size={11}/> Delete
                </button>
                <button onClick={() => setSelected(null)}
                  style={{ padding: '5px 10px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#64748b' }}>
                  ✕
                </button>
              </div>
            </div>
            {/* Subject */}
            <div style={{ padding: '10px 18px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{selected.subject || '(no subject)'}</div>
            </div>
            {/* Body */}
            <div style={{ padding: '18px', flex: 1, overflowY: 'auto', fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {selected.body || '(empty)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
