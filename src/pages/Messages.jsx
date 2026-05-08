import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, Empty, Pagination, Btn, Modal } from '../components/UI';
import { MessageSquare, Search, RefreshCw, Inbox, CheckCircle, Loader2, X, Reply, Tag, ChevronDown, Send, User } from 'lucide-react';

// ── Constants ───────────────────────────────────
const TAGS = [
  { key: 'positive',       label: '🟢 Positive',       color: '#16a34a', bg: '#f0fff4', border: '#86efac' },
  { key: 'not_interested', label: '🔴 Not Interested',  color: '#dc2626', bg: '#fff5f5', border: '#fca5a5' },
  { key: 'follow_up',     label: '🔵 Follow Up',       color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'meeting_booked',label: '🟣 Meeting Booked',  color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { key: 'not_now',       label: '🟡 Not Now',          color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
];
const TAG_MAP = Object.fromEntries(TAGS.map(t => [t.key, t]));

const AUTO_REPLY_KEYWORDS = [
  'out of office','auto-reply','automatic reply','autoreply','i am away','i am out',
  'on vacation','on leave','on holiday','will be back','returning on','away from the office',
  'do not reply','noreply','no-reply','unmonitored','this is an automated',
  'automated response','automatic response',
];
function isAutoReplyMsg(m) {
  const text = `${m.subject||''} ${m.from_email||''}`.toLowerCase();
  return AUTO_REPLY_KEYWORDS.some(kw => text.includes(kw));
}
function timeAgo(d) {
  if (!d) return 'Never';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(d).toLocaleDateString();
}
function extractNew(body) {
  if (!body) return '';
  const markers = [/^On .+wrote:$/m, /^-----Original Message-----/m, /^>{1,}/m, /^_{3,}/m];
  let text = body;
  for (const m of markers) {
    const i = text.search(m);
    if (i > 20) { text = text.substring(0, i).trim(); break; }
  }
  return text.trim();
}
function avatar(name, email) {
  const str = name || email || '?';
  return str.charAt(0).toUpperCase();
}
function avatarColor(email) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let hash = 0;
  for (let i = 0; i < (email||'').length; i++) hash = (email||'').charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Sync Modal ──────────────────────────────────
function SyncModal({ open, onClose, onSynced }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState({});
  const [result, setResult]     = useState({});
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setStatus({}); setResult({});
    api.get('/email-accounts').then(r => setAccounts(r.data.filter(a => a.imap_host))).finally(() => setLoading(false));
  }, [open]);

  const syncOne = async (acc) => {
    setStatus(s => ({ ...s, [acc.id]: 'syncing' }));
    try {
      const { data } = await api.post(`/email-accounts/${acc.id}/sync-inbox`);
      const n = data.synced || 0;
      setStatus(s => ({ ...s, [acc.id]: 'done' }));
      setResult(s => ({ ...s, [acc.id]: n }));
      onSynced(); return n;
    } catch { setStatus(s => ({ ...s, [acc.id]: 'error' })); return 0; }
  };
  const syncAll = async () => {
    setSyncingAll(true);
    for (const a of accounts) await syncOne(a);
    setSyncingAll(false);
  };
  const anyDone = Object.values(status).some(s => s === 'done');

  return (
    <Modal open={open} onClose={onClose} title="🔄 Sync Inboxes" width={500}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ fontSize:13, color:'var(--text2)', background:'var(--bg3)', borderRadius:8, padding:'10px 14px', borderLeft:'3px solid var(--primary)', lineHeight:1.6 }}>
          📬 Auto-syncs every <strong>5 minutes</strong>. Sync now to check immediately.
        </div>
        {loading ? <Spinner /> : accounts.length === 0 ? (
          <div style={{ textAlign:'center', padding:20, color:'var(--text3)', fontSize:13 }}>
            <Inbox size={28} style={{ opacity:.3, display:'block', margin:'0 auto 8px' }} />
            <div>No IMAP accounts set up. Go to <strong>Email Accounts</strong> to configure.</div>
          </div>
        ) : <>
          <Btn onClick={syncAll} disabled={syncingAll} style={{ width:'100%', justifyContent:'center' }}>
            <RefreshCw size={14} style={{ animation:syncingAll?'spin 1s linear infinite':'none' }} />
            {syncingAll ? 'Syncing All...' : '⚡ Sync All Inboxes'}
          </Btn>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:11, color:'var(--text3)' }}>or individually</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>
          {accounts.map(acc => {
            const s = status[acc.id];
            return (
              <div key={acc.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, border:`1px solid ${s==='done'?'#86efac':s==='error'?'#fca5a5':'var(--border2)'}`, background:s==='done'?'#f0fff4':s==='error'?'#fff5f5':'#fff' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{acc.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{acc.from_email} · Last: {timeAgo(acc.last_synced_at)}</div>
                  {s==='done' && <div style={{ fontSize:11, color:'#16a34a', fontWeight:600, marginTop:2 }}>✅ {result[acc.id]} new message{result[acc.id]!==1?'s':''}</div>}
                  {s==='error' && <div style={{ fontSize:11, color:'#dc2626', fontWeight:600, marginTop:2 }}>❌ Failed</div>}
                </div>
                <button onClick={() => syncOne(acc)} disabled={s==='syncing'||syncingAll} style={{ padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', background:s==='done'?'#dcfce7':s==='error'?'#fee2e2':'var(--primary)', color:s==='done'?'#16a34a':s==='error'?'#dc2626':'#fff', display:'flex', alignItems:'center', gap:5 }}>
                  {s==='syncing'?<><Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> Syncing...</>:s==='done'?<><CheckCircle size={11}/> Synced</>:s==='error'?'Retry':<><RefreshCw size={11}/> Sync</>}
                </button>
              </div>
            );
          })}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="secondary" onClick={onClose}>{anyDone?'Done':'Cancel'}</Btn>
          </div>
        </>}
      </div>
    </Modal>
  );
}

// ── Conversation Panel (Gmail-style slide-in) ───
function ConversationPanel({ message, onClose, onUpdate }) {
  const [replyBody, setReplyBody]   = useState('');
  const [sending, setSending]       = useState(false);
  const [accounts, setAccounts]     = useState([]);
  const [accountId, setAccountId]   = useState('');
  const [tagging, setTagging]       = useState(false);
  const [showReply, setShowReply]   = useState(false);
  const [showTagDrop, setShowTagDrop] = useState(false);
  const bottomRef = useRef(null);
  const tag = TAG_MAP[message.tag];
  const isSent = message.status === 'sent';
  const newMsg = extractNew(message.body);

  useEffect(() => {
    api.get('/email-accounts').then(r => { setAccounts(r.data); if (r.data.length) setAccountId(r.data[0].id); });
    // Mark as read when opened
    if (message.status === 'unread') {
      api.post(`/messages/${message.id}/read`, { status:'read' }).then(() => onUpdate({ ...message, status:'read' })).catch(()=>{});
    }
  }, [message.id]);

  useEffect(() => {
    if (showReply) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
  }, [showReply]);

  const handleTag = async (tagKey) => {
    setTagging(true); setShowTagDrop(false);
    try {
      await api.post(`/messages/${message.id}/tag`, { tag: tagKey });
      onUpdate({ ...message, tag: tagKey });
      toast.success('Tag updated!');
    } catch { toast.error('Failed'); }
    finally { setTagging(false); }
  };

  const handleReply = async () => {
    if (!replyBody.trim()) return toast.error('Write something first');
    if (!accountId) return toast.error('Select an account');
    setSending(true);
    try {
      await api.post(`/messages/${message.id}/reply`, { body: replyBody, email_account_id: accountId });
      toast.success('Reply sent! ✅');
      setReplyBody(''); setShowReply(false);
      onUpdate({ ...message, replied: 1, status: 'read' });
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div style={{
      position:'fixed', top:0, right:0, bottom:0,
      width: 'min(680px, 95vw)',
      background:'#fff',
      boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',
      zIndex:1000,
      display:'flex', flexDirection:'column',
      animation:'slideIn 0.25s ease',
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reply-textarea:focus { outline: none; border-color: var(--primary) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:12, flexShrink:0, background:'#fafafa' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, borderRadius:6, display:'flex', alignItems:'center', marginTop:2, flexShrink:0 }}>
          <X size={18} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:16, color:'var(--text)', marginBottom:4, lineHeight:1.3 }}>{message.subject || '(no subject)'}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {message.campaign_name && <span style={{ fontSize:12, color:'var(--text3)', background:'var(--bg3)', padding:'2px 8px', borderRadius:10 }}>📢 {message.campaign_name}</span>}
            {message.replied===1 && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'#f0fff4', color:'#16a34a', border:'1px solid #86efac', fontWeight:600 }}>✅ Replied</span>}
            {isAutoReplyMsg(message) && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>⚙️ Auto-Reply</span>}
          </div>
        </div>

        {/* Tag selector */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={() => setShowTagDrop(p=>!p)} disabled={tagging} style={{
            display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
            border:`1px solid ${tag ? tag.border : 'var(--border2)'}`,
            background: tag ? tag.bg : '#fff',
            color: tag ? tag.color : 'var(--text3)',
            cursor:'pointer', fontFamily:'inherit',
          }}>
            <Tag size={12} /> {tagging ? 'Saving...' : tag ? tag.label : 'Add Tag'} <ChevronDown size={11} />
          </button>
          {showTagDrop && (
            <>
              <div onClick={() => setShowTagDrop(false)} style={{ position:'fixed', inset:0, zIndex:10 }} />
              <div style={{ position:'absolute', right:0, top:'110%', background:'#fff', border:'1px solid var(--border2)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:11, minWidth:200, overflow:'hidden' }}>
                {tag && (
                  <button onClick={() => handleTag(null)} style={{ width:'100%', padding:'9px 14px', border:'none', background:'none', textAlign:'left', cursor:'pointer', fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--border)' }}>
                    <X size={11}/> Remove tag
                  </button>
                )}
                {TAGS.map(t => (
                  <button key={t.key} onClick={() => handleTag(t.key)} style={{ width:'100%', padding:'10px 14px', border:'none', background:message.tag===t.key?t.bg:'transparent', textAlign:'left', cursor:'pointer', fontSize:13, color:t.color, fontWeight:message.tag===t.key?700:500, display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Message thread area ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

        {/* Message bubble */}
        <div style={{ marginBottom:20 }}>
          {/* Sender row */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background: isSent ? '#3b82f6' : avatarColor(message.from_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>
              {isSent ? '↗' : avatar(message.from_name, message.from_email)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, fontSize:14, color: isSent ? '#3b82f6' : 'var(--text)' }}>
                  {isSent ? 'You (sent reply)' : (message.from_name || message.from_email)}
                </span>
                {!isSent && <span style={{ fontSize:12, color:'var(--text3)' }}>&lt;{message.from_email}&gt;</span>}
              </div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{new Date(message.received_at).toLocaleString()}</div>
            </div>
          </div>

          {/* Message body bubble */}
          <div style={{
            marginLeft:48,
            background: isSent ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${isSent ? '#bfdbfe' : 'var(--border)'}`,
            borderRadius: isSent ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
            padding:'14px 18px',
            fontSize:14, lineHeight:1.7, color:'var(--text)',
            whiteSpace:'pre-wrap', wordBreak:'break-word',
          }}>
            {newMsg || message.body || '(no content)'}
          </div>

          {/* Show full thread link if quoted */}
          {message.body && newMsg && newMsg.length < message.body.trim().length - 20 && (
            <div style={{ marginLeft:48, marginTop:8 }}>
              <details>
                <summary style={{ fontSize:12, color:'var(--text3)', cursor:'pointer', userSelect:'none' }}>Show full thread</summary>
                <div style={{ marginTop:8, padding:'10px 14px', background:'#f8f9fa', borderRadius:8, fontSize:12, color:'var(--text3)', whiteSpace:'pre-wrap', lineHeight:1.6, borderLeft:'3px solid var(--border2)' }}>
                  {message.body}
                </div>
              </details>
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* ── Bottom action bar ── */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'12px 20px', background:'#fafafa', flexShrink:0 }}>
        {!showReply ? (
          <div style={{ display:'flex', gap:8 }}>
            {!isSent && !isAutoReplyMsg(message) && (
              <button onClick={() => setShowReply(true)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 18px',
                background:'var(--primary)', color:'#fff', border:'none', borderRadius:8,
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>
                <Reply size={14}/> Reply
              </button>
            )}
            <button onClick={onClose} style={{ padding:'8px 16px', background:'none', border:'1px solid var(--border2)', borderRadius:8, fontSize:13, color:'var(--text2)', cursor:'pointer', fontFamily:'inherit' }}>
              Close
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Send from selector */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600, whiteSpace:'nowrap' }}>From:</span>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{ flex:1, background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'6px 10px', fontSize:12, outline:'none', color:'var(--text)' }}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
              </select>
            </div>

            {/* Reply textarea */}
            <textarea
              className="reply-textarea"
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder={`Hi ${message.from_name || 'there'},\n\n`}
              rows={5}
              style={{ width:'100%', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--text)', resize:'vertical', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box', background:'#fff', transition:'border-color 0.15s' }}
            />

            {/* Reply action buttons */}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowReply(false); setReplyBody(''); }} style={{ padding:'7px 14px', background:'none', border:'1px solid var(--border2)', borderRadius:8, fontSize:13, color:'var(--text2)', cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleReply} disabled={sending || !replyBody.trim()} style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 18px',
                background: sending||!replyBody.trim() ? '#94a3b8' : 'var(--primary)',
                color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                cursor: sending||!replyBody.trim() ? 'not-allowed' : 'pointer', fontFamily:'inherit',
              }}>
                {sending ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Sending...</> : <><Send size={13}/> Send Reply</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Messages Component ─────────────────────
export default function Messages({ type = 'inbox' }) {
  const [messages, setMessages]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [unread, setUnread]           = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [filterTag, setFilterTag]     = useState('');
  const [selected, setSelected]       = useState(null); // open conversation
  const [showSyncModal, setShowSyncModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type==='inbox' ? '/messages/inbox' : '/messages/auto-replies';
      const { data } = await api.get(endpoint, { params:{ search:search||undefined, page, limit:20, tag:filterTag||undefined }});
      setMessages(data.messages||[]);
      setTotal(data.total||0);
      setUnread(data.unread||0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [type, search, page, filterTag]);

  useEffect(() => { load(); }, [load]);

  // Update a single message in state (from panel actions)
  const handleUpdate = (updated) => {
    setMessages(prev => prev.map(m => m.id===updated.id ? updated : m));
    if (selected?.id === updated.id) setSelected(updated);
    if (updated.status==='read' && selected?.status==='unread') setUnread(u => Math.max(0, u-1));
  };

  const activeTab = type==='inbox' ? '/messages/inbox' : '/messages/auto-replies';

  return (
    <div style={{ position:'relative' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <PageHeader
        title="Messages"
        subtitle={type==='inbox' ? `Inbox${unread>0?` · ${unread} unread`:''}` : 'Auto-replies'}
        action={type==='inbox' && <Btn onClick={() => setShowSyncModal(true)}><RefreshCw size={14}/> Sync Inbox</Btn>}
      />

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:16 }}>
        {[{ label:`📥 Inbox${unread>0?` (${unread})`:'' }`, path:'/messages/inbox' },
          { label:'⚙️ Auto-replies', path:'/messages/auto-replies' }
        ].map(t => (
          <a key={t.path} href={t.path} style={{ padding:'10px 18px', borderBottom:`2px solid ${activeTab===t.path?'var(--primary)':'transparent'}`, marginBottom:-2, color:activeTab===t.path?'var(--primary)':'var(--text2)', fontWeight:activeTab===t.path?600:400, fontSize:14, textDecoration:'none' }}>{t.label}</a>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
          <input placeholder="Search messages..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width:'100%', background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'8px 12px 8px 32px', fontSize:14, outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>Filter:</span>
          <button onClick={() => setFilterTag('')} style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${!filterTag?'var(--primary)':'var(--border2)'}`, background:!filterTag?'var(--primary-dim)':'#fff', color:!filterTag?'var(--primary)':'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:!filterTag?600:400 }}>All</button>
          {TAGS.map(tag => (
            <button key={tag.key} onClick={() => setFilterTag(filterTag===tag.key?'':tag.key)} style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${filterTag===tag.key?tag.color:'var(--border2)'}`, background:filterTag===tag.key?tag.bg:'#fff', color:filterTag===tag.key?tag.color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:filterTag===tag.key?600:400 }}>{tag.label}</button>
          ))}
        </div>
      </div>

      {/* Sync hint */}
      {type==='inbox' && (
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12, display:'flex', alignItems:'center', gap:5 }}>
          <RefreshCw size={11}/> Auto-syncs every 5 min ·{' '}
          <button onClick={() => setShowSyncModal(true)} style={{ background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:12, padding:0, fontFamily:'inherit' }}>Sync now</button>
        </div>
      )}

      {/* Message list */}
      {loading ? <Spinner /> : messages.length===0 ? (
        <Empty icon={MessageSquare}
          title={filterTag?`No ${TAG_MAP[filterTag]?.label} messages`:type==='inbox'?'No messages yet':'No auto-replies yet'}
          description={type==='inbox'?'Replies from your campaigns will appear here.':'Auto-replies will appear here.'}
          action={type==='inbox'&&!filterTag&&<Btn onClick={()=>setShowSyncModal(true)} variant="secondary"><RefreshCw size={14}/> Sync Inbox</Btn>}
        />
      ) : (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          {messages.map((m, i) => {
            const tag = TAG_MAP[m.tag];
            const isUnread = m.status==='unread';
            const isSent = m.status==='sent';
            const isSelected = selected?.id===m.id;
            const preview = extractNew(m.body);

            return (
              <div key={m.id}
                onClick={() => setSelected(m)}
                style={{
                  display:'grid',
                  gridTemplateColumns:'44px 1fr auto',
                  gap:12,
                  padding:'12px 16px',
                  borderBottom: i<messages.length-1 ? '1px solid var(--border)' : 'none',
                  background: isSelected ? '#eff6ff'
                    : isUnread ? '#f8faff'
                    : isSent ? '#f0f9ff'
                    : '#fff',
                  borderLeft: isSelected ? '3px solid var(--primary)'
                    : isUnread ? '3px solid var(--primary)'
                    : isSent ? '3px solid #93c5fd'
                    : '3px solid transparent',
                  cursor:'pointer',
                  transition:'background 0.12s',
                }}
                onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background='#f8faff'; }}
                onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background=isUnread?'#f8faff':isSent?'#f0f9ff':'#fff'; }}
              >
                {/* Avatar */}
                <div style={{ display:'flex', alignItems:'center', paddingTop:2 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:isSent?'#3b82f6':avatarColor(m.from_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                    {isSent ? '↗' : avatar(m.from_name, m.from_email)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    {isUnread && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--primary)', flexShrink:0, display:'inline-block' }} />}
                    <span style={{ fontWeight:isUnread?700:500, fontSize:14, color:isSent?'#3b82f6':'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {isSent ? 'You (sent reply)' : (m.from_name || m.from_email)}
                    </span>
                    {tag && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:10, background:tag.bg, color:tag.color, border:`1px solid ${tag.border}`, fontWeight:600, flexShrink:0 }}>{tag.label}</span>}
                    {m.replied===1 && !isSent && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:10, background:'#f0fff4', color:'#16a34a', border:'1px solid #86efac', flexShrink:0 }}>✅</span>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:isUnread?600:400, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
                    {m.subject || '(no subject)'}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {preview ? preview.substring(0, 120) : ''}
                  </div>
                </div>

                {/* Time */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0, paddingTop:2 }}>
                  <span style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>{timeAgo(m.received_at)}</span>
                  {isAutoReplyMsg(m) && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>auto</span>}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafafa' }}>
            <span style={{ fontSize:12, color:'var(--text3)' }}>{total} message{total!==1?'s':''}{unread>0&&` · ${unread} unread`}</span>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </div>
      )}

      {/* Backdrop + Conversation Panel */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:999, backdropFilter:'blur(2px)' }} />
          <ConversationPanel
            message={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        </>
      )}

      <SyncModal open={showSyncModal} onClose={() => setShowSyncModal(false)} onSynced={load} />
    </div>
  );
}
