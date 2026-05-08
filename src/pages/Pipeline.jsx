import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner } from '../components/UI';
import { RefreshCw, Mail, Clock, Phone, Building2, Trophy } from 'lucide-react';

// ── Column definitions ──────────────────────────
const COLUMNS = [
  { id: 'new',             label: 'New',            emoji: '🆕', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', light: '#f1f5f9' },
  { id: 'contacted',       label: 'Contacted',      emoji: '📧', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', light: '#e0f2fe' },
  { id: 'positive',        label: 'Positive',       emoji: '🟢', color: '#16a34a', bg: '#f0fff4', border: '#86efac', light: '#dcfce7' },
  { id: 'follow_up',       label: 'Follow Up',      emoji: '🔵', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', light: '#dbeafe' },
  { id: 'meeting_booked',  label: 'Meeting Booked', emoji: '🟣', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', light: '#ede9fe' },
  { id: 'not_now',         label: 'Not Now',        emoji: '🟡', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', light: '#fef3c7' },
  { id: 'not_interested',  label: 'Not Interested', emoji: '🔴', color: '#dc2626', bg: '#fff5f5', border: '#fca5a5', light: '#fee2e2' },
  { id: 'closed_won',      label: 'Closed / Won',   emoji: '🏆', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', light: '#ccfbf1' },
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

// ── Kanban Card ─────────────────────────────────
function KanbanCard({ lead, col, onDragStart, onQuickReply }) {
  const initials = (lead.contact_name || lead.contact_email || '?').charAt(0).toUpperCase();

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead)}
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px solid var(--border)',
        padding: '12px 14px',
        cursor: 'grab',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s, transform 0.15s',
        userSelect: 'none',
        borderLeft: `3px solid ${col.color}`,
        animation: 'cardIn 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}
    >
      {/* ── Contact info ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:avatarColor(lead.contact_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {lead.contact_name || lead.contact_email}
          </div>
          {lead.contact_name && (
            <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {lead.contact_email}
            </div>
          )}
        </div>
      </div>

      {/* ── Company + Phone ── */}
      {(lead.company || lead.phone) && (
        <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
          {lead.company && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
              <Building2 size={10} style={{ flexShrink:0, color:'var(--text3)' }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.company}</span>
            </div>
          )}
          {lead.phone && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
              <Phone size={10} style={{ flexShrink:0, color:'var(--text3)' }}/>
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Campaign badge ── */}
      {lead.campaign_name && (
        <div style={{ fontSize:11, color:'var(--text3)', background:'var(--bg3)', borderRadius:6, padding:'2px 7px', display:'inline-block', marginBottom:6, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          📢 {lead.campaign_name}
        </div>
      )}

      {/* ── Last message preview ── */}
      {lead.last_message && (
        <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5, marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {lead.last_message_is_sent && <span style={{ color:'#3b82f6', fontWeight:600 }}>You: </span>}
          {extractPreview(lead.last_message)}
        </div>
      )}

      {/* ── Footer: time + reply count + reply btn ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text3)', flexShrink:0 }}>
          <Clock size={10}/>
          {timeAgo(lead.last_reply_at || lead.last_sent_at)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {lead.reply_count > 0 && (
            <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:col.light, color:col.color, fontWeight:700 }}>
              {lead.reply_count} msg{lead.reply_count!==1?'s':''}
            </span>
          )}
          {lead.last_message_id && (
            <button
              onClick={e => { e.stopPropagation(); onQuickReply(lead); }}
              style={{ background:'var(--primary)', border:'none', borderRadius:7, padding:'4px 9px', cursor:'pointer', fontSize:11, color:'#fff', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', fontWeight:600 }}
            >
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
      {/* Header */}
      <div style={{ padding:'10px 14px', borderRadius:'10px 10px 0 0', background:col.bg, border:`1px solid ${col.border}`, borderBottom:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:15 }}>{col.emoji}</span>
          <span style={{ fontWeight:700, fontSize:13, color:col.color }}>{col.label}</span>
        </div>
        <span style={{ fontWeight:700, fontSize:12, minWidth:22, textAlign:'center', padding:'1px 8px', borderRadius:20, background:col.light, color:col.color }}>
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={e => onDrop(e, col.id)}
        style={{
          flex:1, minHeight:140, padding:8,
          background: isOver ? col.light : '#f8fafc',
          border:`1px solid ${isOver ? col.color : col.border}`,
          borderTop:'none', borderRadius:'0 0 10px 10px',
          display:'flex', flexDirection:'column', gap:8,
          transition:'background 0.15s, border-color 0.15s',
          overflowY:'auto',
          maxHeight:'calc(100vh - 280px)',
          boxShadow: isOver ? `inset 0 0 0 2px ${col.color}33` : 'none',
        }}
      >
        {leads.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 10px', color:'var(--text3)', fontSize:12, opacity:0.5, pointerEvents:'none' }}>
            {isOver ? `Drop here →` : 'No leads yet'}
          </div>
        ) : (
          leads.map(lead => (
            <KanbanCard key={lead.id} lead={lead} col={col} onDragStart={onDragStart} onQuickReply={onQuickReply} />
          ))
        )}
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

  useEffect(() => {
    api.get('/email-accounts').then(r => {
      setAccounts(r.data);
      if (r.data.length) setAccountId(r.data[0].id);
    });
  }, []);

  const handleSend = async () => {
    if (!body.trim()) return toast.error('Write your reply first');
    if (!accountId) return toast.error('Select an account');
    setSending(true);
    try {
      await api.post(`/messages/${lead.last_message_id}/reply`, { body, email_account_id: accountId });
      toast.success('Reply sent! ✅');
      onSent();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'relative', background:'#fff', borderRadius:16, padding:24, width:520, maxWidth:'95vw', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', zIndex:1, animation:'cardIn 0.2s ease' }}>
        {/* Contact header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:avatarColor(lead.contact_email), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16 }}>
            {(lead.contact_name||lead.contact_email||'?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>{lead.contact_name || lead.contact_email}</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              {lead.contact_name && `${lead.contact_email}`}
              {lead.company && ` · ${lead.company}`}
              {lead.phone && ` · ${lead.phone}`}
            </div>
          </div>
        </div>

        {/* From selector */}
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:4 }}>From</label>
          <select value={accountId} onChange={e=>setAccountId(e.target.value)} style={{ width:'100%', border:'1px solid var(--border2)', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', color:'var(--text)' }}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
          </select>
        </div>

        {/* Textarea */}
        <textarea
          value={body}
          onChange={e=>setBody(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) handleSend(); }}
          placeholder={`Hi ${lead.contact_name||'there'},\n\n`}
          rows={6} autoFocus
          style={{ width:'100%', border:'1.5px solid var(--border2)', borderRadius:10, padding:'10px 12px', fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box', marginBottom:12, transition:'border-color 0.15s' }}
          onFocus={e=>e.target.style.borderColor='var(--primary)'}
          onBlur={e=>e.target.style.borderColor='var(--border2)'}
        />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:'var(--text3)' }}>Ctrl+Enter to send</span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px', background:'none', border:'1px solid var(--border2)', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={handleSend} disabled={sending||!body.trim()} style={{ padding:'8px 20px', background:sending||!body.trim()?'#94a3b8':'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:sending||!body.trim()?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
              {sending ? 'Sending...' : <><Mail size={13}/> Send Reply</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Pipeline Component ─────────────────────
export default function Pipeline() {
  const [leads, setLeads]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [dragItem, setDragItem]     = useState(null);
  const [overCol, setOverCol]       = useState(null);
  const [quickReply, setQuickReply] = useState(null);
  const [stats, setStats]           = useState({});

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, campRes] = await Promise.all([
        api.get('/messages/inbox', { params: { limit:200 } }),
        api.get('/campaigns'),
      ]);

      const messages = msgRes.data.messages || [];
      const campMap  = Object.fromEntries((campRes.data||[]).map(c=>[c.id,c]));

      // Build lead map keyed by contact email
      const leadMap = {};

      for (const m of messages) {
        const email = m.from_email;
        if (!email) continue;
        const isSent = m.status === 'sent';

        if (!leadMap[email]) {
          leadMap[email] = {
            id: email,
            contact_email: email,
            contact_name: null,
            company: null,
            phone: null,
            campaign_name: null,
            campaign_id: m.campaign_id || null,
            tag: null,
            last_reply_at: null,
            last_sent_at: null,
            last_message: null,
            last_message_id: null,
            last_message_is_sent: false,
            reply_count: 0,
          };
        }

        const lead = leadMap[email];

        // Enrich from received messages
        if (!isSent) {
          if (m.from_name && !lead.contact_name) lead.contact_name = m.from_name;
          if (m.tag) lead.tag = m.tag;
          lead.reply_count++;

          if (!lead.last_reply_at || new Date(m.received_at) > new Date(lead.last_reply_at)) {
            lead.last_reply_at = m.received_at;
            lead.last_message = m.body;
            lead.last_message_id = m.id;
            lead.last_message_is_sent = false;
          }
        } else {
          if (!lead.last_sent_at || new Date(m.received_at) > new Date(lead.last_sent_at)) {
            lead.last_sent_at = m.received_at;
            if (!lead.last_reply_at) {
              lead.last_message = m.body;
              lead.last_message_id = m.id;
              lead.last_message_is_sent = true;
            }
          }
        }

        // Campaign name
        if (!lead.campaign_name && m.campaign_id) {
          lead.campaign_name = m.campaign_name || campMap[m.campaign_id]?.name || null;
        }
      }

      // Enrich with contact details from contacts API
      try {
        const contactEmails = Object.keys(leadMap);
        if (contactEmails.length) {
          const contactRes = await api.get('/contacts', { params:{ limit:200 } });
          const contacts = contactRes.data.contacts || [];
          for (const c of contacts) {
            const email = c.email?.toLowerCase();
            if (leadMap[email]) {
              if (c.company && !leadMap[email].company) leadMap[email].company = c.company;
              if (c.phone && !leadMap[email].phone) leadMap[email].phone = c.phone;
              if (c.first_name && !leadMap[email].contact_name) {
                leadMap[email].contact_name = [c.first_name, c.last_name].filter(Boolean).join(' ');
              }
            }
          }
        }
      } catch {}

      // Group into columns
      const grouped = {};
      COLUMNS.forEach(c => { grouped[c.id] = []; });

      for (const lead of Object.values(leadMap)) {
        let colId;
        if (lead.tag && grouped[lead.tag] !== undefined) {
          colId = lead.tag;
        } else if (lead.reply_count > 0) {
          colId = 'contacted';
        } else {
          colId = 'new';
        }
        grouped[colId].push(lead);
      }

      // Sort each column newest first
      for (const col of Object.keys(grouped)) {
        grouped[col].sort((a,b) =>
          new Date(b.last_reply_at||b.last_sent_at||0) - new Date(a.last_reply_at||a.last_sent_at||0)
        );
      }

      setLeads(grouped);
      setStats({
        total:   Object.values(leadMap).length,
        replied: Object.values(leadMap).filter(l=>l.reply_count>0).length,
        positive: (grouped['positive']||[]).length,
        meeting:  (grouped['meeting_booked']||[]).length,
        won:      (grouped['closed_won']||[]).length,
      });
    } catch {
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  // ── Drag & Drop ──
  const handleDragStart = (e, lead) => {
    setDragItem(lead);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverCol(colId);
  };
  const handleDragLeave = () => setOverCol(null);

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    if (!dragItem) return;
    const sourceColId = dragItem.tag && grouped?.[dragItem.tag] ? dragItem.tag : dragItem.reply_count > 0 ? 'contacted' : 'new';
    if (sourceColId === targetColId) { setDragItem(null); setOverCol(null); return; }

    const newTag = ['new','contacted'].includes(targetColId) ? null : targetColId;

    // Optimistic UI update
    setLeads(prev => {
      const next = {};
      for (const k of Object.keys(prev)) next[k] = [...prev[k]];
      // Remove from all columns first
      for (const k of Object.keys(next)) next[k] = next[k].filter(l=>l.id!==dragItem.id);
      // Add to target
      const updated = { ...dragItem, tag: newTag };
      if (!next[targetColId]) next[targetColId] = [];
      next[targetColId] = [updated, ...next[targetColId]];
      return next;
    });

    // Persist to backend
    if (dragItem.last_message_id) {
      try {
        await api.post(`/messages/${dragItem.last_message_id}/tag`, { tag: newTag });
        const col = COL_MAP[targetColId];
        toast.success(`Moved to ${col.label} ${col.emoji}`);
      } catch {
        toast.error('Failed to update — refreshing');
        loadPipeline();
      }
    }

    setDragItem(null);
    setOverCol(null);
  };

  return (
    <div>
      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <PageHeader
        title="Pipeline"
        subtitle="Drag leads across stages to track your outreach progress"
        action={
          <button onClick={loadPipeline} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <RefreshCw size={14}/> Refresh
          </button>
        }
      />

      {/* ── Stats bar ── */}
      {!loading && (
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { label:'Total Leads',     value:stats.total,    color:'#64748b', bg:'#f8fafc', icon:'👥' },
            { label:'Replied',         value:stats.replied,  color:'#0284c7', bg:'#f0f9ff', icon:'💬' },
            { label:'Positive',        value:stats.positive, color:'#16a34a', bg:'#f0fff4', icon:'🟢' },
            { label:'Meeting Booked',  value:stats.meeting,  color:'#7c3aed', bg:'#f5f3ff', icon:'🟣' },
            { label:'Closed / Won',    value:stats.won,      color:'#0f766e', bg:'#f0fdfa', icon:'🏆' },
          ].map(s => (
            <div key={s.label} style={{ padding:'10px 16px', borderRadius:10, background:s.bg, border:`1px solid ${s.color}30`, minWidth:100 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value||0}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Board ── */}
      {loading ? <Spinner /> : (
        <div style={{ overflowX:'auto', paddingBottom:20 }}>
          <div style={{ display:'flex', gap:10, minWidth:'max-content', alignItems:'flex-start' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                leads={leads[col.id]||[]}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={e=>handleDragOver(e,col.id)}
                onDragLeave={handleDragLeave}
                onQuickReply={setQuickReply}
                isOver={overCol===col.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Reply Modal ── */}
      {quickReply && (
        <QuickReplyModal
          lead={quickReply}
          onClose={()=>setQuickReply(null)}
          onSent={()=>{ setQuickReply(null); loadPipeline(); }}
        />
      )}
    </div>
  );
}
