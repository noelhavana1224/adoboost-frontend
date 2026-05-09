import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner } from '../components/UI';
import { RefreshCw, Mail, Clock, Phone, Building2, Bold, Italic, Underline, List } from 'lucide-react';

const COLUMNS = [
  { id: 'new',            label: 'New',            emoji: '🆕', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', light: '#f1f5f9' },
  { id: 'contacted',      label: 'Contacted',      emoji: '📧', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', light: '#e0f2fe' },
  { id: 'positive',       label: 'Positive',       emoji: '🟢', color: '#16a34a', bg: '#f0fff4', border: '#86efac', light: '#dcfce7' },
  { id: 'follow_up',      label: 'Follow Up',      emoji: '🔵', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', light: '#dbeafe' },
  { id: 'meeting_booked', label: 'Meeting Booked', emoji: '🟣', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', light: '#ede9fe' },
  { id: 'not_now',        label: 'Not Now',        emoji: '🟡', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', light: '#fef3c7' },
  { id: 'not_interested', label: 'Not Interested', emoji: '🔴', color: '#dc2626', bg: '#fff5f5', border: '#fca5a5', light: '#fee2e2' },
  { id: 'closed_won',     label: 'Closed / Won',   emoji: '🏆', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', light: '#ccfbf1' },
];
const COL_MAP = Object.fromEntries(COLUMNS.map(c => [c.id, c]));

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString();
}
function avatarColor(str) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6','#f97316'];
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) h = (str||'').charCodeAt(i) + ((h<<5)-h);
  return colors[Math.abs(h) % colors.length];
}
function extractPreview(body) {
  if (!body) return '';
  const markers = [/^On .+wrote:$/m, /^-----/m, /^>{1}/m, /^_{3}/m];
  let text = body;
  for (const mk of markers) {
    const i = text.search(mk);
    if (i > 10) { text = text.substring(0, i).trim(); break; }
  }
  return text.trim().substring(0, 90);
}
function extractNew(body) {
  if (!body) return '';
  const markers = [/^On .+wrote:$/m, /^-----Original Message-----/m, /^>{1,}/m, /^_{3,}/m];
  let text = body;
  for (const mk of markers) {
    const i = text.search(mk);
    if (i > 20) { text = text.substring(0, i).trim(); break; }
  }
  return text.trim();
}

// ── Rich Text Editor ────────────────────────────
function RichEditor({ onChange, placeholder, minHeight = 150 }) {
  const editorRef = useRef(null);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  };

  const toolBtn = (label, cmd, val = null) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 7px', borderRadius:4, color:'var(--text2)', fontSize:12, fontFamily:'inherit', fontWeight:600 }}
      onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
      onMouseLeave={e => e.currentTarget.style.background='none'}>
      {label}
    </button>
  );

  return (
    <div style={{ border:'1.5px solid var(--border2)', borderRadius:10, overflow:'hidden', background:'#fff' }}
      onFocusCapture={e => e.currentTarget.style.borderColor='var(--primary)'}
      onBlurCapture={e => e.currentTarget.style.borderColor='var(--border2)'}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:2, padding:'5px 8px', borderBottom:'1px solid var(--border)', background:'#f8fafc', flexWrap:'wrap' }}>
        {toolBtn('B', 'bold')}
        {toolBtn('I', 'italic')}
        {toolBtn('U', 'underline')}
        <div style={{ width:1, height:16, background:'var(--border)', margin:'0 3px' }}/>
        {toolBtn('• List', 'insertUnorderedList')}
        <div style={{ width:1, height:16, background:'var(--border)', margin:'0 3px' }}/>
        <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('foreColor',e.target.value)}
          style={{ border:'none', background:'none', fontSize:11, cursor:'pointer', color:'var(--text2)', outline:'none', fontFamily:'inherit' }}>
          <option value="">🎨 Color</option>
          <option value="#000000">Black</option>
          <option value="#dc2626">Red</option>
          <option value="#2563eb">Blue</option>
          <option value="#16a34a">Green</option>
          <option value="#d97706">Orange</option>
        </select>
        <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontSize',e.target.value)}
          style={{ border:'none', background:'none', fontSize:11, cursor:'pointer', color:'var(--text2)', outline:'none', fontFamily:'inherit' }}>
          <option value="">📏 Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Larger</option>
        </select>
      </div>
      {/* Content area */}
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        data-placeholder={placeholder}
        style={{ minHeight, padding:'10px 14px', fontSize:13, lineHeight:1.7, color:'var(--text)', outline:'none', wordBreak:'break-word' }}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#94a3b8;pointer-events:none}`}</style>
    </div>
  );
}

// ── Kanban Card ─────────────────────────────────
function KanbanCard({ lead, col, onDragStart, onQuickReply }) {
  const initials = (lead.contact_name || lead.contact_email || '?').charAt(0).toUpperCase();
  return (
    <div draggable onDragStart={e => onDragStart(e, lead)}
      style={{ background:'#fff', borderRadius:10, border:'1px solid var(--border)', padding:'12px 14px', cursor:'grab', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'box-shadow 0.15s, transform 0.15s', userSelect:'none', borderLeft:`3px solid ${col.color}` }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:avatarColor(lead.contact_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>{initials}</div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.contact_name || lead.contact_email}</div>
          {lead.contact_name && <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.contact_email}</div>}
        </div>
      </div>
      {(lead.company || lead.phone) && (
        <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
          {lead.company && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}><Building2 size={10} style={{ color:'var(--text3)' }}/>{lead.company}</div>}
          {lead.phone && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}><Phone size={10} style={{ color:'var(--text3)' }}/>{lead.phone}</div>}
        </div>
      )}
      {lead.campaign_name && <div style={{ fontSize:11, color:'var(--text3)', background:'var(--bg3)', borderRadius:6, padding:'2px 7px', display:'inline-block', marginBottom:6, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📢 {lead.campaign_name}</div>}
      {lead.last_message && (
        <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5, marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {lead.last_message_is_sent && <span style={{ color:'#3b82f6', fontWeight:600 }}>You: </span>}
          {extractPreview(lead.last_message)}
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text3)' }}><Clock size={10}/>{timeAgo(lead.last_reply_at || lead.last_sent_at)}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {lead.reply_count > 0 && <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:col.light, color:col.color, fontWeight:700 }}>{lead.reply_count} msg{lead.reply_count!==1?'s':''}</span>}
          {lead.last_message_id && (
            <button onClick={e=>{ e.stopPropagation(); onQuickReply(lead); }} style={{ background:'var(--primary)', border:'none', borderRadius:7, padding:'4px 9px', cursor:'pointer', fontSize:11, color:'#fff', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', fontWeight:600 }}>
              <Mail size={10}/> Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Kanban Column ───────────────────────────────
function KanbanColumn({ col, leads, onDragStart, onDrop, onDragOver, onDragLeave, onQuickReply, isOver }) {
  return (
    <div style={{ minWidth:250, maxWidth:260, flex:'0 0 250px', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'10px 14px', borderRadius:'10px 10px 0 0', background:col.bg, border:`1px solid ${col.border}`, borderBottom:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:15 }}>{col.emoji}</span>
          <span style={{ fontWeight:700, fontSize:13, color:col.color }}>{col.label}</span>
        </div>
        <span style={{ fontWeight:700, fontSize:12, padding:'1px 8px', borderRadius:20, background:col.light, color:col.color }}>{leads.length}</span>
      </div>
      <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={e=>onDrop(e,col.id)}
        style={{ flex:1, minHeight:140, padding:8, background:isOver?col.light:'#f8fafc', border:`1px solid ${isOver?col.color:col.border}`, borderTop:'none', borderRadius:'0 0 10px 10px', display:'flex', flexDirection:'column', gap:8, transition:'background 0.15s, border-color 0.15s', overflowY:'auto', maxHeight:'calc(100vh - 280px)', boxShadow:isOver?`inset 0 0 0 2px ${col.color}33`:'none' }}>
        {leads.length === 0
          ? <div style={{ textAlign:'center', padding:'24px 10px', color:'var(--text3)', fontSize:12, opacity:0.5 }}>{isOver?'⬇️ Drop here':'No leads yet'}</div>
          : leads.map(lead => <KanbanCard key={lead.id} lead={lead} col={col} onDragStart={onDragStart} onQuickReply={onQuickReply}/>)
        }
      </div>
    </div>
  );
}

// ── Quick Reply Modal ───────────────────────────
function QuickReplyModal({ lead, onClose, onSent }) {
  const [body, setBody]           = useState('');
  const [sending, setSending]     = useState(false);
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState('');
  const [history, setHistory]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const historyBottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Load accounts
        const { data: accs } = await api.get('/email-accounts');
        setAccounts(accs);

        // FIX 3: Find correct From account — look at sent messages to this contact
        // The account that sent TO this contact is the correct From
        const { data: msgData } = await api.get('/messages/inbox', { params:{ limit:200 } });
        const allMsgs = msgData.messages || [];

        // Find sent messages related to this contact's email
        const sentToContact = allMsgs.filter(m =>
          m.status === 'sent' && m.campaign_id === lead.campaign_id
        );

        let matched = null;
        if (sentToContact.length > 0) {
          // from_email on sent messages is the account that sent it
          const sentFromEmail = sentToContact[0]?.from_email;
          if (sentFromEmail) {
            matched = accs.find(a => a.from_email?.toLowerCase() === sentFromEmail?.toLowerCase());
          }
        }

        // Fallback: try campaign lookup
        if (!matched && lead.campaign_id) {
          try {
            const { data: camp } = await api.get(`/campaigns/${lead.campaign_id}`);
            if (camp?.email_account_id) {
              matched = accs.find(a => a.id === camp.email_account_id);
            }
          } catch {}
        }

        setAccountId(matched?.id || accs[0]?.id || '');

        // FIX 4: Load conversation history — only messages FROM the prospect or sent TO them
        const history = allMsgs.filter(m => {
          const fromEmail = m.from_email?.toLowerCase();
          const contactEmail = lead.contact_email?.toLowerCase();
          // Include: messages received from this contact, OR sent messages in their campaign
          return fromEmail === contactEmail || (m.status === 'sent' && m.campaign_id === lead.campaign_id);
        }).sort((a,b) => new Date(a.received_at) - new Date(b.received_at));

        setHistory(history);
      } catch(e) {
        console.error('Modal load error:', e);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [lead.contact_email, lead.campaign_id]);

  // Scroll to bottom of history when loaded
  useEffect(() => {
    if (!loadingHistory) {
      setTimeout(() => historyBottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
    }
  }, [loadingHistory]);

  const handleSend = async () => {
    const plainText = (body || '').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').trim();
    if (!plainText) return toast.error('Write your reply first');
    if (!accountId) return toast.error('Select an account');
    setSending(true);
    try {
      await api.post(`/messages/${lead.last_message_id}/reply`, { body: plainText, email_account_id: accountId });
      toast.success('Reply sent! ✅');
      onSent();
    } catch(e) { toast.error(e.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(3px)' }}/>

      {/* FIX 4: Full height modal with proper scroll zones */}
      <div style={{ position:'relative', background:'#fff', borderRadius:16, width:620, maxWidth:'96vw', height:'85vh', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', zIndex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── Header (fixed) ── */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'#fafafa', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:avatarColor(lead.contact_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>
              {(lead.contact_name||lead.contact_email||'?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{lead.contact_name || lead.contact_email}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                {lead.contact_email}{lead.company&&` · ${lead.company}`}{lead.phone&&` · ${lead.phone}`}
              </div>
            </div>
          </div>
        </div>

        {/* ── Conversation history (scrollable) ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
          {loadingHistory ? (
            <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:20 }}>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:20, background:'var(--bg3)', borderRadius:8 }}>No previous messages</div>
          ) : (
            <>
              <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textAlign:'center', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Conversation History</div>
              {history.map(m => {
                const isSent = m.status === 'sent';
                const preview = extractNew(m.body) || m.body || '';
                return (
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems:isSent?'flex-end':'flex-start' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:3 }}>
                      {isSent ? 'You' : (m.from_name||m.from_email)} · {new Date(m.received_at).toLocaleString()}
                    </div>
                    <div style={{ maxWidth:'82%', padding:'9px 13px', borderRadius:isSent?'16px 4px 16px 16px':'4px 16px 16px 16px', background:isSent?'#3b82f6':'#f1f5f9', color:isSent?'#fff':'var(--text)', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                      {preview}
                    </div>
                  </div>
                );
              })}
              <div ref={historyBottomRef}/>
            </>
          )}
        </div>

        {/* ── Reply compose (fixed at bottom) ── */}
        <div style={{ borderTop:'2px solid var(--border)', background:'#fafafa', flexShrink:0 }}>

          {/* From selector */}
          <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600, whiteSpace:'nowrap' }}>From:</span>
            <select value={accountId} onChange={e=>setAccountId(e.target.value)}
              style={{ flex:1, border:'1px solid var(--border2)', borderRadius:8, padding:'6px 10px', fontSize:12, outline:'none', color:'var(--primary)', fontWeight:600, background:'#fff' }}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
            </select>
          </div>

          {/* Rich text editor */}
          <div style={{ padding:'10px 20px' }}>
            <RichEditor onChange={setBody} placeholder={`Write your reply to ${lead.contact_name||'them'}...`} minHeight={120} />
          </div>

          {/* Send button */}
          <div style={{ padding:'0 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Ctrl+Enter to send</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onClose} style={{ padding:'7px 14px', background:'none', border:'1px solid var(--border2)', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleSend} disabled={sending} style={{ padding:'7px 18px', background:sending?'#94a3b8':'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:sending?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                {sending?'Sending...':<><Mail size={13}/> Send Reply</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Pipeline ───────────────────────────────
export default function Pipeline() {
  const [leads, setLeads]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [dragItem, setDragItem]     = useState(null);
  const [overCol, setOverCol]       = useState(null);
  const [quickReply, setQuickReply] = useState(null);
  const [stats, setStats]           = useState({});
  // FIX 1: Store our own email accounts to exclude them from leads
  const [myEmails, setMyEmails]     = useState([]);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, campRes, accRes] = await Promise.all([
        api.get('/messages/inbox', { params:{ limit:200 } }),
        api.get('/campaigns').catch(()=>({ data:[] })),
        api.get('/email-accounts'),
      ]);

      const messages = msgRes.data.messages || [];
      const camps = Array.isArray(campRes.data) ? campRes.data : (campRes.data?.campaigns||[]);
      const campMap = Object.fromEntries(camps.map(c=>[c.id,c]));
      const accounts = accRes.data || [];

      // FIX 1: Build set of OUR email addresses to exclude from leads
      const ourEmails = new Set([
        ...accounts.map(a => a.from_email?.toLowerCase()).filter(Boolean),
        ...accounts.map(a => a.username?.toLowerCase()).filter(Boolean),
      ]);
      setMyEmails(ourEmails);

      const leadMap = {};
      for (const m of messages) {
        const email = m.from_email?.toLowerCase();
        if (!email) continue;
        const isSent = m.status === 'sent';

        // FIX 1: Skip messages FROM our own accounts — they are not leads!
        if (!isSent && ourEmails.has(email)) continue;

        // For sent messages, we still want to track them but not as a lead key
        if (isSent) {
          // Find the lead this was sent to — we can't directly know but use campaign_id
          // Just skip sent messages when building lead keys, they get attached below
          continue;
        }

        if (!leadMap[email]) {
          leadMap[email] = {
            id: email,
            contact_email: email,
            contact_name: m.from_name || null,
            company: null,
            phone: null,
            campaign_name: m.campaign_name || campMap[m.campaign_id]?.name || null,
            campaign_id: m.campaign_id || null,
            tag: m.tag || null,
            last_reply_at: null,
            last_sent_at: null,
            last_message: null,
            last_message_id: null,
            last_message_is_sent: false,
            reply_count: 0,
          };
        }

        const lead = leadMap[email];
        if (m.from_name && !lead.contact_name) lead.contact_name = m.from_name;
        // FIX 1: Use the LATEST tag — most recently tagged message wins
        if (m.tag) lead.tag = m.tag;
        lead.reply_count++;
        if (!lead.last_reply_at || new Date(m.received_at) > new Date(lead.last_reply_at)) {
          lead.last_reply_at = m.received_at;
          lead.last_message = m.body;
          lead.last_message_id = m.id;
          lead.last_message_is_sent = false;
        }
        if (!lead.campaign_name && m.campaign_id) lead.campaign_name = m.campaign_name || campMap[m.campaign_id]?.name || null;
      }

      // Now attach sent messages to leads
      for (const m of messages) {
        if (m.status !== 'sent') continue;
        // Try to find which lead this sent message belongs to via campaign
        for (const lead of Object.values(leadMap)) {
          if (lead.campaign_id === m.campaign_id) {
            if (!lead.last_sent_at || new Date(m.received_at) > new Date(lead.last_sent_at)) {
              lead.last_sent_at = m.received_at;
              // Only use sent message as preview if no received message
              if (!lead.last_reply_at) {
                lead.last_message = m.body;
                lead.last_message_id = m.id;
                lead.last_message_is_sent = true;
              }
            }
          }
        }
      }

      // Enrich with contacts DB
      try {
        const contactRes = await api.get('/contacts', { params:{ limit:500 } });
        const contacts = Array.isArray(contactRes.data) ? contactRes.data : (contactRes.data?.contacts||[]);
        for (const c of contacts) {
          const email = c.email?.toLowerCase();
          if (leadMap[email]) {
            if (c.company) leadMap[email].company = c.company;
            if (c.phone) leadMap[email].phone = c.phone;
            if (!leadMap[email].contact_name && (c.first_name||c.last_name)) {
              leadMap[email].contact_name = [c.first_name,c.last_name].filter(Boolean).join(' ');
            }
          }
        }
      } catch {}

      // Group into columns
      const grouped = {};
      COLUMNS.forEach(c => { grouped[c.id] = []; });
      for (const lead of Object.values(leadMap)) {
        const colId = lead.tag && grouped[lead.tag] !== undefined ? lead.tag : lead.reply_count > 0 ? 'contacted' : 'new';
        grouped[colId].push(lead);
      }
      for (const col of Object.keys(grouped)) {
        grouped[col].sort((a,b) => new Date(b.last_reply_at||b.last_sent_at||0) - new Date(a.last_reply_at||a.last_sent_at||0));
      }

      setLeads(grouped);
      setStats({ total:Object.values(leadMap).length, replied:Object.values(leadMap).filter(l=>l.reply_count>0).length, positive:(grouped['positive']||[]).length, meeting:(grouped['meeting_booked']||[]).length, won:(grouped['closed_won']||[]).length });
    } catch(e) {
      console.error('Pipeline error:', e);
      toast.error('Failed to load pipeline: ' + (e.response?.data?.error||e.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  const handleDragStart = (e, lead) => { setDragItem(lead); e.dataTransfer.effectAllowed='move'; };
  const handleDragOver  = (e, colId) => { e.preventDefault(); e.dataTransfer.dropEffect='move'; setOverCol(colId); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    if (!dragItem) return;
    const sourceColId = dragItem.tag && COLUMNS.find(c=>c.id===dragItem.tag) ? dragItem.tag : dragItem.reply_count>0 ? 'contacted' : 'new';
    if (sourceColId === targetColId) { setDragItem(null); setOverCol(null); return; }
    const newTag = ['new','contacted'].includes(targetColId) ? null : targetColId;

    // Optimistic update
    setLeads(prev => {
      const next = {};
      for (const k of Object.keys(prev)) next[k] = [...prev[k]];
      for (const k of Object.keys(next)) next[k] = next[k].filter(l=>l.id!==dragItem.id);
      if (!next[targetColId]) next[targetColId] = [];
      next[targetColId] = [{ ...dragItem, tag:newTag }, ...next[targetColId]];
      return next;
    });

    if (!dragItem.last_message_id) {
      toast('Cannot tag leads with no replies yet');
      setTimeout(loadPipeline, 500);
      setDragItem(null); setOverCol(null); return;
    }

    try {
      await api.post(`/messages/${dragItem.last_message_id}/tag`, { tag: newTag });
      toast.success(`Moved to ${COL_MAP[targetColId]?.label} ${COL_MAP[targetColId]?.emoji}`);
    } catch {
      toast.error('Failed to save');
      loadPipeline();
    }
    setDragItem(null); setOverCol(null);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Drag leads across stages to track your outreach progress"
        action={<button onClick={loadPipeline} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}><RefreshCw size={14}/> Refresh</button>}
      />

      {!loading && (
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { label:'Total Leads',    value:stats.total,    color:'#64748b', bg:'#f8fafc', icon:'👥' },
            { label:'Replied',        value:stats.replied,  color:'#0284c7', bg:'#f0f9ff', icon:'💬' },
            { label:'Positive',       value:stats.positive, color:'#16a34a', bg:'#f0fff4', icon:'🟢' },
            { label:'Meeting Booked', value:stats.meeting,  color:'#7c3aed', bg:'#f5f3ff', icon:'🟣' },
            { label:'Closed / Won',   value:stats.won,      color:'#0f766e', bg:'#f0fdfa', icon:'🏆' },
          ].map(s=>(
            <div key={s.label} style={{ padding:'10px 16px', borderRadius:10, background:s.bg, border:`1px solid ${s.color}30`, minWidth:110 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value||0}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ overflowX:'auto', paddingBottom:20 }}>
          <div style={{ display:'flex', gap:10, minWidth:'max-content', alignItems:'flex-start' }}>
            {COLUMNS.map(col=>(
              <KanbanColumn key={col.id} col={col} leads={leads[col.id]||[]}
                onDragStart={handleDragStart} onDrop={handleDrop}
                onDragOver={e=>handleDragOver(e,col.id)} onDragLeave={handleDragLeave}
                onQuickReply={setQuickReply} isOver={overCol===col.id}
              />
            ))}
          </div>
        </div>
      )}

      {quickReply && (
        <QuickReplyModal lead={quickReply} onClose={()=>setQuickReply(null)}
          onSent={()=>{ setQuickReply(null); loadPipeline(); }}
        />
      )}
    </div>
  );
}
