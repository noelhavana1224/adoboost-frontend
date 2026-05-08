import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Spinner, Empty, Pagination, Modal, Btn } from '../components/UI';
import { MessageSquare, Search, Tag, Reply, ChevronDown, ChevronUp, X, RefreshCw, Inbox, CheckCircle, Loader2 } from 'lucide-react';

const TAGS = [
  { key: 'positive',       label: '🟢 Positive',       color: '#22c55e', bg: '#f0fff4', border: '#86efac' },
  { key: 'not_interested', label: '🔴 Not Interested',  color: '#ef4444', bg: '#fff5f5', border: '#fca5a5' },
  { key: 'follow_up',     label: '🔵 Follow Up',       color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'meeting_booked',label: '🟣 Meeting Booked',  color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
  { key: 'not_now',       label: '🟡 Not Now',          color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'auto_reply',    label: '⚙️ Auto-Reply',       color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
];
const TAG_MAP = Object.fromEntries(TAGS.map(t => [t.key, t]));

const AUTO_REPLY_KEYWORDS = [
  'out of office','auto-reply','automatic reply','autoreply','i am away','i am out',
  'on vacation','on leave','on holiday','will be back','returning on','away from the office',
  'do not reply','noreply','no-reply','unmonitored','this is an automated',
  'automated response','automatic response',
];
function isAutoReply(message) {
  const text = `${message.subject || ''} ${message.from_email || ''}`.toLowerCase();
  return AUTO_REPLY_KEYWORDS.some(kw => text.includes(kw));
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Extract only the NEW reply (strip quoted thread) ──
function extractNewMessage(body) {
  if (!body) return '';
  // Split on common quote markers
  const cutMarkers = [
    /^On .+wrote:$/m,
    /^-----Original Message-----/m,
    /^From:.+Sent:/m,
    /^_{3,}/m,
    /^>{1,}/m,
  ];
  let text = body;
  for (const marker of cutMarkers) {
    const match = text.search(marker);
    if (match > 20) { // at least 20 chars of new content before the quote
      text = text.substring(0, match).trim();
      break;
    }
  }
  return text.trim();
}

// ── Sync Modal ──────────────────────────────────
function SyncModal({ open, onClose, onSynced }) {
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState({});
  const [syncResult, setSyncResult] = useState({});
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSyncStatus({});
    setSyncResult({});
    api.get('/email-accounts')
      .then(r => setAccounts(r.data.filter(a => a.imap_host)))
      .finally(() => setLoading(false));
  }, [open]);

  const syncOne = async (acc) => {
    setSyncStatus(s => ({ ...s, [acc.id]: 'syncing' }));
    try {
      const { data } = await api.post(`/email-accounts/${acc.id}/sync-inbox`);
      const count = data.synced || 0;
      setSyncStatus(s => ({ ...s, [acc.id]: 'done' }));
      setSyncResult(s => ({ ...s, [acc.id]: count }));
      onSynced(count);
      return count;
    } catch {
      setSyncStatus(s => ({ ...s, [acc.id]: 'error' }));
      return 0;
    }
  };

  const syncAll = async () => {
    setSyncingAll(true);
    for (const acc of accounts) await syncOne(acc);
    setSyncingAll(false);
  };

  const anyDone = Object.values(syncStatus).some(s => s === 'done');

  return (
    <Modal open={open} onClose={onClose} title="🔄 Sync Inboxes" width={520}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:13, color:'var(--text2)', background:'var(--bg3)', borderRadius:8, padding:'10px 14px', borderLeft:'3px solid var(--primary)', lineHeight:1.6 }}>
          📬 AdoBoost auto-syncs every <strong>5 minutes</strong>. Use this to check immediately or sync a specific inbox.
        </div>
        {loading ? <Spinner /> : accounts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px', color:'var(--text3)', fontSize:13 }}>
            <Inbox size={32} style={{ opacity:0.3, marginBottom:8, display:'block', margin:'0 auto 8px' }} />
            <div style={{ fontWeight:600, marginBottom:4 }}>No IMAP accounts configured</div>
            <div style={{ fontSize:12 }}>Go to <strong>Email Accounts</strong> and enable IMAP to receive replies.</div>
          </div>
        ) : (
          <>
            <Btn onClick={syncAll} disabled={syncingAll} style={{ width:'100%', justifyContent:'center' }}>
              <RefreshCw size={14} style={{ animation: syncingAll ? 'spin 1s linear infinite' : 'none' }} />
              {syncingAll ? 'Syncing All Inboxes...' : '⚡ Sync All Inboxes'}
            </Btn>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'var(--border)' }} />
              <span style={{ fontSize:12, color:'var(--text3)' }}>or sync individually</span>
              <div style={{ flex:1, height:1, background:'var(--border)' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {accounts.map(acc => {
                const status = syncStatus[acc.id];
                const isSyncing = status === 'syncing';
                const isDone    = status === 'done';
                const isError   = status === 'error';
                return (
                  <div key={acc.id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 14px', borderRadius:10,
                    border:`1px solid ${isDone ? '#86efac' : isError ? '#fca5a5' : 'var(--border2)'}`,
                    background: isDone ? '#f0fff4' : isError ? '#fff5f5' : '#fff',
                    transition:'all 0.2s',
                  }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{acc.name}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{acc.from_email} · {acc.imap_host}:{acc.imap_port}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>
                        Last synced: <strong>{timeAgo(acc.last_synced_at)}</strong>
                        {isDone && <span style={{ color:'#16a34a', fontWeight:600, marginLeft:8 }}>✅ {syncResult[acc.id]} new message{syncResult[acc.id] !== 1 ? 's' : ''}</span>}
                        {isError && <span style={{ color:'#dc2626', fontWeight:600, marginLeft:8 }}>❌ Sync failed</span>}
                      </div>
                    </div>
                    <button onClick={() => syncOne(acc)} disabled={isSyncing || syncingAll} style={{
                      flexShrink:0, marginLeft:12, padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600,
                      border:'none', cursor: isSyncing ? 'wait' : 'pointer', fontFamily:'inherit',
                      background: isDone ? '#dcfce7' : isError ? '#fee2e2' : 'var(--primary)',
                      color: isDone ? '#16a34a' : isError ? '#dc2626' : '#fff',
                      display:'flex', alignItems:'center', gap:6, transition:'all 0.15s',
                    }}>
                      {isSyncing ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> Syncing...</>
                       : isDone   ? <><CheckCircle size={12} /> Synced</>
                       : isError  ? <>❌ Retry</>
                       : <><RefreshCw size={12} /> Sync</>}
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="secondary" onClick={onClose}>{anyDone ? 'Done' : 'Cancel'}</Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Main Component ──────────────────────────────
export default function Messages({ type = 'inbox' }) {
  const [messages, setMessages]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [unread, setUnread]           = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [filterTag, setFilterTag]     = useState('');
  const [expandedId, setExpandedId]   = useState(null);
  const [replyModal, setReplyModal]   = useState(null);
  const [tagLoading, setTagLoading]   = useState({});
  const [showSyncModal, setShowSyncModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type === 'inbox' ? '/messages/inbox' : '/messages/auto-replies';
      const { data } = await api.get(endpoint, {
        params: { search: search || undefined, page, limit: 20, tag: filterTag || undefined }
      });
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }, [type, search, page, filterTag]);

  useEffect(() => { load(); }, [load]);

  const handleSynced = () => { load(); };

  const handleTag = async (messageId, tag) => {
    setTagLoading(p => ({ ...p, [messageId]: true }));
    try {
      await api.post(`/messages/${messageId}/tag`, { tag });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, tag } : m));
      toast.success('Tag updated!');
    } catch { toast.error('Failed to update tag'); }
    finally { setTagLoading(p => ({ ...p, [messageId]: false })); }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/read`, { status: 'read' });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'read' } : m));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const activeTab = type === 'inbox' ? '/messages/inbox' : '/messages/auto-replies';

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle={type === 'inbox'
          ? `Track and reply to campaign responses${unread > 0 ? ` · ${unread} unread` : ''}`
          : 'Auto-reply responses filtered automatically'}
        action={type === 'inbox' && (
          <Btn onClick={() => setShowSyncModal(true)}>
            <RefreshCw size={14} /> Sync Inbox
          </Btn>
        )}
      />

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border)', marginBottom:20 }}>
        {[
          { label: `📥 Inbox${unread > 0 ? ` (${unread})` : ''}`, path: '/messages/inbox' },
          { label: '⚙️ Auto-replies', path: '/messages/auto-replies' }
        ].map(t => (
          <a key={t.path} href={t.path} style={{
            padding:'10px 18px',
            borderBottom:`2px solid ${activeTab===t.path ? 'var(--primary)' : 'transparent'}`,
            marginBottom:-2,
            color: activeTab===t.path ? 'var(--primary)' : 'var(--text2)',
            fontWeight: activeTab===t.path ? 600 : 400,
            fontSize:14, textDecoration:'none', transition:'all 0.15s'
          }}>{t.label}</a>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
          <input placeholder="Search messages..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width:'100%', background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:14, outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>Filter:</span>
          <button onClick={() => setFilterTag('')} style={{
            padding:'5px 12px', borderRadius:20,
            border:`1px solid ${!filterTag ? 'var(--primary)' : 'var(--border2)'}`,
            background: !filterTag ? 'var(--primary-dim)' : '#fff',
            color: !filterTag ? 'var(--primary)' : 'var(--text2)',
            fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight: !filterTag ? 600 : 400,
          }}>All</button>
          {TAGS.filter(t => t.key !== 'auto_reply').map(tag => (
            <button key={tag.key} onClick={() => setFilterTag(filterTag === tag.key ? '' : tag.key)} style={{
              padding:'5px 12px', borderRadius:20,
              border:`1px solid ${filterTag===tag.key ? tag.color : 'var(--border2)'}`,
              background: filterTag===tag.key ? tag.bg : '#fff',
              color: filterTag===tag.key ? tag.color : 'var(--text2)',
              fontSize:12, cursor:'pointer', fontFamily:'inherit',
              fontWeight: filterTag===tag.key ? 600 : 400,
            }}>{tag.label}</button>
          ))}
        </div>
      </div>

      {/* Auto-sync hint */}
      {type === 'inbox' && (
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={11} /> Auto-syncs every 5 minutes ·{' '}
          <button onClick={() => setShowSyncModal(true)}
            style={{ background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:12, padding:0, fontFamily:'inherit' }}>
            Sync now
          </button>
        </div>
      )}

      {loading ? <Spinner /> : messages.length === 0 ? (
        <Empty icon={MessageSquare}
          title={filterTag ? `No ${TAG_MAP[filterTag]?.label} messages` : type === 'inbox' ? 'No messages yet' : 'No auto-replies yet'}
          description={filterTag ? 'Try a different filter.' : type === 'inbox' ? 'Replies from your campaigns will appear here.' : 'Auto-replies will appear here.'}
          action={type === 'inbox' && !filterTag && (
            <Btn onClick={() => setShowSyncModal(true)} variant="secondary"><RefreshCw size={14} /> Sync Inbox</Btn>
          )}
        />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          {messages.map((m, i) => {
            const tag = TAG_MAP[m.tag];
            const detectedAutoReply = isAutoReply(m);
            const isExpanded = expandedId === m.id;
            const isUnread = m.status === 'unread';
            const newMessage = extractNewMessage(m.body);
            const hasQuotedThread = m.body && newMessage.length < m.body.trim().length - 10;

            return (
              <div key={m.id} style={{
                borderBottom: i < messages.length-1 ? '1px solid var(--border)' : 'none',
                background: isUnread ? '#f8faff' : m.tag==='positive' ? '#f0fff4' : m.tag==='meeting_booked' ? '#f5f3ff' : 'transparent',
                borderLeft: isUnread ? '3px solid var(--primary)' : '3px solid transparent',
                transition:'background 0.15s',
              }}>
                <div style={{ padding:'12px 16px' }}>

                  {/* ── Row 1: Sender info + badges ── */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4, gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', minWidth:0 }}>
                      {isUnread && <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--primary)', flexShrink:0, display:'inline-block' }} />}
                      <span style={{ fontWeight: isUnread ? 700 : 600, fontSize:14 }}>{m.from_name || m.from_email}</span>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{m.from_email}</span>
                      {detectedAutoReply && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>⚙️ Auto-Reply</span>}
                      {m.replied===1 && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'#f0fff4', color:'#16a34a', border:'1px solid #86efac' }}>✅ Replied</span>}
                      {tag && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:tag.bg, color:tag.color, border:`1px solid ${tag.border}`, fontWeight:600 }}>{tag.label}</span>}
                    </div>
                    {/* Timestamp top right */}
                    <span style={{ fontSize:11, color:'var(--text3)', flexShrink:0 }}>{new Date(m.received_at).toLocaleString()}</span>
                  </div>

                  {/* ── Row 2: Subject ── */}
                  <div style={{ fontSize:13, fontWeight: isUnread ? 600 : 500, marginBottom:4, color:'var(--text)' }}>
                    {m.subject || '(no subject)'}
                  </div>

                  {/* ── Row 3: Campaign meta ── */}
                  {m.campaign_name && (
                    <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>
                      📢 {m.campaign_name}
                    </div>
                  )}

                  {/* ── Row 4: NEW message preview (always visible) ── */}
                  {newMessage && (
                    <div style={{
                      fontSize:13, color:'var(--text2)', lineHeight:1.6,
                      padding:'8px 12px', background:'var(--bg3)', borderRadius:8,
                      borderLeft:'3px solid var(--primary)',
                      marginBottom:8,
                      maxHeight: isExpanded ? 'none' : '60px',
                      overflow: isExpanded ? 'visible' : 'hidden',
                      whiteSpace:'pre-wrap',
                    }}>
                      {newMessage}
                    </div>
                  )}

                  {/* ── Row 5: Quoted thread (only when expanded) ── */}
                  {isExpanded && hasQuotedThread && (
                    <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, padding:'8px 12px', background:'#f8f9fa', borderRadius:8, marginBottom:8, whiteSpace:'pre-wrap', borderLeft:'3px solid var(--border2)' }}>
                      <div style={{ fontWeight:600, marginBottom:4, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>📧 Original thread</div>
                      {m.body}
                    </div>
                  )}

                  {/* ── Row 6: Action bar (always visible) ── */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>

                    {/* Expand/collapse */}
                    <button onClick={() => {
                      setExpandedId(isExpanded ? null : m.id);
                      if (!isExpanded && isUnread) handleMarkRead(m.id);
                    }} style={{
                      background:'none', border:'1px solid var(--border2)', borderRadius:6,
                      padding:'4px 10px', cursor:'pointer', fontSize:12, color:'var(--text2)',
                      display:'flex', alignItems:'center', gap:4,
                    }}>
                      {isExpanded ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> {hasQuotedThread ? 'Show thread' : 'Expand'}</>}
                    </button>

                    {/* Reply */}
                    {type === 'inbox' && !detectedAutoReply && (
                      <button onClick={() => { setReplyModal(m); if (isUnread) handleMarkRead(m.id); }} style={{
                        background:'var(--primary)', border:'none', borderRadius:6,
                        padding:'4px 10px', cursor:'pointer', fontSize:12, color:'#fff',
                        display:'flex', alignItems:'center', gap:4,
                      }}>
                        <Reply size={12} /> Reply
                      </button>
                    )}

                    {/* ── FIX 1: Tag pills — always visible, no dropdown needed ── */}
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginLeft:'auto', alignItems:'center' }}>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>Tag:</span>
                      {TAGS.filter(t => t.key !== 'auto_reply').map(t => (
                        <button key={t.key}
                          onClick={() => handleTag(m.id, m.tag === t.key ? null : t.key)}
                          disabled={tagLoading[m.id]}
                          style={{
                            padding:'3px 9px', borderRadius:20, fontSize:11, cursor:'pointer',
                            fontFamily:'inherit', fontWeight: m.tag===t.key ? 700 : 400,
                            border:`1px solid ${m.tag===t.key ? t.color : 'var(--border2)'}`,
                            background: m.tag===t.key ? t.bg : '#fff',
                            color: m.tag===t.key ? t.color : 'var(--text3)',
                            transition:'all 0.15s',
                            opacity: tagLoading[m.id] ? 0.5 : 1,
                          }}>
                          {t.label}
                        </button>
                      ))}
                      {m.tag && (
                        <button onClick={() => handleTag(m.id, null)} disabled={tagLoading[m.id]}
                          style={{ padding:'3px 6px', borderRadius:20, fontSize:11, cursor:'pointer', border:'1px solid var(--border2)', background:'#fff', color:'var(--text3)', fontFamily:'inherit' }}>
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>
              {total} message{total!==1?'s':''}{unread>0 && ` · ${unread} unread`}{filterTag && ` · ${TAG_MAP[filterTag]?.label}`}
            </span>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </Card>
      )}

      <SyncModal open={showSyncModal} onClose={() => setShowSyncModal(false)} onSynced={handleSynced} />

      {replyModal && (
        <ReplyModal message={replyModal} onClose={() => setReplyModal(null)}
          onSent={() => { setReplyModal(null); load(); toast.success('Reply sent! ✅'); }} />
      )}
    </div>
  );
}

// ── Reply Modal ─────────────────────────────────
function ReplyModal({ message, onClose, onSent }) {
  const [body, setBody]           = useState('');
  const [sending, setSending]     = useState(false);
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState('');

  // Extract just the new part of the message for context
  const newMessage = extractNewMessage(message.body);

  useEffect(() => {
    api.get('/email-accounts').then(r => {
      setAccounts(r.data);
      if (r.data.length > 0) setAccountId(r.data[0].id);
    });
  }, []);

  const handleSend = async () => {
    if (!body.trim()) return toast.error('Please write a reply first');
    if (!accountId) return toast.error('Select an email account');
    setSending(true);
    try {
      await api.post(`/messages/${message.id}/reply`, { body, email_account_id: accountId });
      onSent();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send reply'); }
    finally { setSending(false); }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Reply to ${message.from_name || message.from_email}`} width={620}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Their message — clean, just the new part */}
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:'12px 14px', borderLeft:'3px solid var(--primary)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
            💬 {message.from_name || message.from_email} wrote:
          </div>
          <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, maxHeight:120, overflowY:'auto', whiteSpace:'pre-wrap' }}>
            {newMessage || message.body?.slice(0, 300) || '(no body)'}
          </div>
        </div>

        {/* Send from */}
        <div>
          <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>Send from</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{
            width:'100%', background:'#fff', border:'1px solid var(--border2)', borderRadius:8,
            padding:'9px 12px', fontSize:13, outline:'none', color:'var(--text)',
          }}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
          </select>
        </div>

        {/* Reply body */}
        <div>
          <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>Your reply</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder={`Hi ${message.from_name || 'there'},\n\n`}
            rows={8} style={{
              width:'100%', background:'#fff', border:'1px solid var(--border2)', borderRadius:8,
              padding:'10px 12px', fontSize:13, outline:'none', color:'var(--text)',
              resize:'vertical', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box',
            }} />
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn loading={sending} onClick={handleSend}><Reply size={13} /> Send Reply</Btn>
        </div>
      </div>
    </Modal>
  );
}
