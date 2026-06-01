import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/UI';
import { Flame, Mail, MailOpen, RefreshCw, Search, CheckCheck, Inbox, Users, Calendar, Zap } from 'lucide-react';

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

export default function WarmerInbox() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats]       = useState({ total: 0, unread: 0, unique_senders: 0, today: 0 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [selected, setSelected] = useState(null);
  const [backfilling, setBackfilling] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const LIMIT = 25;

  const load = useCallback(async (pg = 1, q = search) => {
    setLoading(true);
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

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, search);
  };

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
      toast.success(`Classified ${data.classified} existing emails as warmup`);
      load(1, '');
    } catch { toast.error('Backfill failed'); }
    setBackfilling(false);
  };

  const handleSelectMsg = async (msg) => {
    setSelected(msg);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color="#d97706"/> Warmer Inbox
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Emails from the AdoBoost warmup network — separated from your prospect replies
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {stats.unread > 0 && (
              <button onClick={handleMarkAllRead} disabled={markingRead}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
                <CheckCheck size={13}/> Mark all read
              </button>
            )}
            <button onClick={() => load(page, search)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit' }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={handleBackfill} disabled={backfilling}
              title="Scan existing emails and move warmup ones here"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, fontSize:12, color:'#92400e', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {backfilling
                ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }}/>
                : <Zap size={13}/>
              } Classify Existing
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Total warmup emails', value: stats.total || 0, icon: <Inbox size={16} color="#6366f1"/>, color: '#6366f1', bg: '#f5f3ff' },
            { label: 'Unread', value: stats.unread || 0, icon: <Mail size={16} color="#dc2626"/>, color: '#dc2626', bg: '#fff5f5' },
            { label: 'Unique warmup partners', value: stats.unique_senders || 0, icon: <Users size={16} color="#16a34a"/>, color: '#16a34a', bg: '#f0fff4' },
            { label: 'Received today', value: stats.today || 0, icon: <Calendar size={16} color="#2563eb"/>, color: '#2563eb', bg: '#eff6ff' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search warmup emails..."
              style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ padding: '9px 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Search
          </button>
        </form>
      </div>

      {/* Info banner */}
      <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#92400e', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Flame size={15} color="#d97706" style={{ flexShrink: 0 }}/>
        <span>
          <strong>These emails are from other AdoBoost users</strong> exchanging warmup emails with your accounts through the community warmup network. They are automatically separated from your real prospect replies.
        </span>
      </div>

      {/* Split view */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: 16, flex: 1, minHeight: 0 }}>

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
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{total} warmup email{total !== 1 ? 's' : ''}</span>
                {stats.unread > 0 && <span style={{ color: '#d97706', fontWeight: 700 }}>{stats.unread} unread</span>}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {messages.map(msg => {
                  const isUnread = msg.status === 'unread';
                  const isSelected = selected?.id === msg.id;
                  const color = avatarColor(msg.from_email);
                  return (
                    <div key={msg.id} onClick={() => handleSelectMsg(msg)}
                      style={{
                        padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                        background: isSelected ? '#fffbeb' : isUnread ? '#fffef0' : '#fff',
                        borderLeft: isSelected ? '3px solid #d97706' : '3px solid transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isUnread ? '#fffef0' : '#fff'; }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {initials(msg.from_name || msg.from_email)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                              {msg.sender_account_name || msg.from_name || msg.from_email}
                            </span>
                            <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{timeAgo(msg.received_at)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                            {msg.from_email}
                          </div>
                          <div style={{ fontSize: 12, color: isUnread ? '#374151' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isUnread ? 600 : 400 }}>
                            {msg.subject || '(no subject)'}
                          </div>
                        </div>
                        {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706', flexShrink: 0, marginTop: 4 }}/>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: 6 }}>
                  <button onClick={() => load(page - 1, search)} disabled={page <= 1}
                    style={{ padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>←</button>
                  <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
                  <button onClick={() => load(page + 1, search)} disabled={page >= totalPages}
                    style={{ padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message detail */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Detail header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: avatarColor(selected.from_email), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {initials(selected.from_name || selected.from_email)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 2 }}>
                  {selected.sender_account_name || selected.from_name || selected.from_email}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selected.from_email}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {new Date(selected.received_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', fontWeight: 600 }}>
                  🔥 Warmup
                </span>
                <button onClick={() => setSelected(null)}
                  style={{ padding: '4px 10px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, cursor: 'pointer', color: '#64748b' }}>
                  ✕
                </button>
              </div>
            </div>
            {/* Subject */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{selected.subject || '(no subject)'}</div>
            </div>
            {/* Body */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto', fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {selected.body || '(empty)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
