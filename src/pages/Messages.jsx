import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner, Empty, Pagination, Modal } from '../components/UI';
import {
  MessageSquare, Search, RefreshCw, Inbox as InboxIcon, CheckCircle,
  Loader2, X, Reply, Tag as TagIcon, ChevronDown, Send, ChevronsRight,
  Archive, Briefcase, Mail,
} from 'lucide-react';

// ── Tags ────────────────────────────────────────────────
const TAGS = [
  { key: 'positive',        label: '🟢 Positive',       color: '#16a34a', bg: '#f0fff4', border: '#86efac' },
  { key: 'not_interested',  label: '🔴 Not Interested',  color: '#dc2626', bg: '#fff5f5', border: '#fca5a5' },
  { key: 'follow_up',       label: '🔵 Follow Up',       color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'meeting_booked',  label: '🟣 Meeting Booked',  color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { key: 'not_now',         label: '🟡 Not Now',          color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
];
const TAG_MAP = Object.fromEntries(TAGS.map(t => [t.key, t]));

const AUTO_REPLY_KEYWORDS = [
  'out of office','auto-reply','automatic reply','autoreply','i am away','i am out',
  'on vacation','on leave','on holiday','will be back','returning on','away from the office',
  'do not reply','noreply','no-reply','unmonitored','this is an automated','automated response','automatic response',
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
  for (const mk of markers) {
    const i = text.search(mk);
    if (i > 20) { text = text.substring(0, i).trim(); break; }
  }
  return text.trim();
}
function avatarColor(str) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (let i=0;i<(str||'').length;i++) h=(str||'').charCodeAt(i)+((h<<5)-h);
  return colors[Math.abs(h)%colors.length];
}
function initials(name, email) { return (name||email||'?').charAt(0).toUpperCase(); }

function groupThreads(messages) {
  const threads = {}; const order = [];
  for (const m of messages) {
    const base = (m.subject||'').replace(/^(Re:\s*|Fwd:\s*)+/gi,'').trim().toLowerCase()||m.id;
    if (!threads[base]) { threads[base]=[]; order.push(base); }
    threads[base].push(m);
  }
  return order.map(key => {
    const msgs = threads[key].sort((a,b)=>new Date(a.received_at)-new Date(b.received_at));
    return { key, msgs, latest: msgs[msgs.length-1], count: msgs.length };
  }).sort((a,b)=>new Date(b.latest.received_at)-new Date(a.latest.received_at));
}

// ── Sync Modal ──────────────────────────────────────────
function SyncModal({ open, onClose, onSynced }) {
  const [accounts,setAccounts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState({});
  const [result,setResult]=useState({});
  const [syncingAll,setSyncingAll]=useState(false);
  useEffect(()=>{
    if(!open)return;
    setLoading(true);setStatus({});setResult({});
    api.get('/email-accounts').then(r=>setAccounts(r.data.filter(a=>a.imap_host))).finally(()=>setLoading(false));
  },[open]);
  const syncOne=async(acc)=>{
    setStatus(s=>({...s,[acc.id]:'syncing'}));
    try{
      const{data}=await api.post(`/email-accounts/${acc.id}/sync-inbox`);
      const n=data.synced||0;
      setStatus(s=>({...s,[acc.id]:'done'}));setResult(s=>({...s,[acc.id]:n}));
      onSynced();return n;
    }catch{setStatus(s=>({...s,[acc.id]:'error'}));return 0;}
  };
  const syncAll=async()=>{setSyncingAll(true);for(const a of accounts)await syncOne(a);setSyncingAll(false);};
  const anyDone=Object.values(status).some(s=>s==='done');
  return(
    <Modal open={open} onClose={onClose} title="🔄 Sync Inboxes" width={500}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{fontSize:13,color:'var(--text2)',background:'var(--bg3)',borderRadius:8,padding:'10px 14px',borderLeft:'3px solid var(--primary)',lineHeight:1.6}}>
          📬 Auto-syncs every <strong>5 minutes</strong>. Sync now to check immediately.
        </div>
        {loading?<Spinner/>:accounts.length===0?(
          <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>
            <InboxIcon size={28} style={{opacity:.3,display:'block',margin:'0 auto 8px'}}/>
            No IMAP accounts. Go to <strong>Email Accounts</strong> to configure.
          </div>
        ):<>
          <button onClick={syncAll} disabled={syncingAll} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px 18px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            <RefreshCw size={14} style={{animation:syncingAll?'spin 1s linear infinite':'none'}}/>{syncingAll?'Syncing All...':'⚡ Sync All Inboxes'}
          </button>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
            <span style={{fontSize:11,color:'var(--text3)'}}>or individually</span>
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          {accounts.map(acc=>{
            const s=status[acc.id];
            return(
              <div key={acc.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:10,border:`1px solid ${s==='done'?'#86efac':s==='error'?'#fca5a5':'var(--border2)'}`,background:s==='done'?'#f0fff4':s==='error'?'#fff5f5':'#fff'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{acc.name}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{acc.from_email} · Last: {timeAgo(acc.last_synced_at)}</div>
                  {s==='done'&&<div style={{fontSize:11,color:'#16a34a',fontWeight:600,marginTop:2}}>✅ {result[acc.id]} new</div>}
                  {s==='error'&&<div style={{fontSize:11,color:'#dc2626',fontWeight:600,marginTop:2}}>❌ Failed</div>}
                </div>
                <button onClick={()=>syncOne(acc)} disabled={s==='syncing'||syncingAll} style={{padding:'5px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',fontFamily:'inherit',background:s==='done'?'#dcfce7':s==='error'?'#fee2e2':'var(--primary)',color:s==='done'?'#16a34a':s==='error'?'#dc2626':'#fff',display:'flex',alignItems:'center',gap:5}}>
                  {s==='syncing'?<><Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/> Syncing...</>:s==='done'?<><CheckCircle size={11}/> Synced</>:s==='error'?'Retry':<><RefreshCw size={11}/> Sync</>}
                </button>
              </div>
            );
          })}
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button onClick={onClose} style={{padding:'7px 18px',background:'none',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,color:'var(--text2)',cursor:'pointer',fontFamily:'inherit'}}>{anyDone?'Done':'Cancel'}</button>
          </div>
        </>}
      </div>
    </Modal>
  );
}

// ── Rich Reply Editor ────────────────────────────────────
function RichReplyEditor({ value, onChange, placeholder, editorKey }) {
  const editorRef = React.useRef(null);
  const lastSet   = React.useRef('');
  const [init, setInit] = React.useState(false);

  React.useEffect(() => {
    if (editorRef.current && !init) {
      const html = value ? value.replace(/\n/g, '<br>') : '';
      editorRef.current.innerHTML = html;
      lastSet.current = html;
      setInit(true);
    }
  }, [init]);

  React.useEffect(() => {
    if (!editorRef.current || !init) return;
    const html = value ? value.replace(/\n/g, '<br>') : '';
    if (html !== lastSet.current) {
      editorRef.current.innerHTML = html;
      lastSet.current = html;
    }
  }, [value, init, editorKey]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url.startsWith('http') ? url : 'https://' + url);
  };

  const sep = () => React.createElement('div', { style: { width:1, height:18, background:'#d1d5db', margin:'0 4px', flexShrink:0 } });

  const T = ({ title, onCmd, children }) =>
    React.createElement('button', {
      type: 'button', title,
      onMouseDown: e => { e.preventDefault(); onCmd(); },
      style: { background:'none', border:'none', cursor:'pointer', padding:'4px 7px', borderRadius:5, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'inherit' },
      onMouseEnter: e => e.currentTarget.style.background='#f3f4f6',
      onMouseLeave: e => e.currentTarget.style.background='none',
    }, children);

  return (
    <div style={{ border:'1.5px solid #d1d5db', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
      onFocusCapture={e => e.currentTarget.style.borderColor='#6366f1'}
      onBlurCapture={e  => e.currentTarget.style.borderColor='#d1d5db'}>
      <div style={{ display:'flex', alignItems:'center', gap:2, padding:'5px 8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', flexWrap:'wrap' }}>
        <T title="Undo" onCmd={() => exec('undo')}>↩</T>
        <T title="Redo" onCmd={() => exec('redo')}>↪</T>
        {sep()}
        <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontName',e.target.value)}
          style={{ border:'1px solid #e5e7eb', background:'#fff', fontSize:11, cursor:'pointer', color:'#374151', outline:'none', fontFamily:'inherit', borderRadius:5, padding:'2px 5px' }}>
          <option value="sans-serif">Sans Serif</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="monospace">Monospace</option>
        </select>
        <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontSize',e.target.value)}
          style={{ border:'1px solid #e5e7eb', background:'#fff', fontSize:11, cursor:'pointer', color:'#374151', outline:'none', fontFamily:'inherit', borderRadius:5, padding:'2px 5px', width:46 }}>
          <option value="2">10</option><option value="3">12</option>
          <option value="4">14</option><option value="5">18</option><option value="6">24</option>
        </select>
        {sep()}
        <T title="Bold"          onCmd={() => exec('bold')}><strong>B</strong></T>
        <T title="Italic"        onCmd={() => exec('italic')}><em>I</em></T>
        <T title="Underline"     onCmd={() => exec('underline')}><span style={{textDecoration:'underline'}}>U</span></T>
        <T title="Strikethrough" onCmd={() => exec('strikeThrough')}><span style={{textDecoration:'line-through'}}>S</span></T>
        {sep()}
        <div style={{ position:'relative', display:'inline-flex' }}>
          <button type="button" title="Font Color"
            onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:5, fontSize:13, display:'flex', alignItems:'center' }}>
            <strong>A</strong>
            <input type="color" defaultValue="#000000" onChange={e=>exec('foreColor',e.target.value)}
              style={{ width:0, height:0, opacity:0, position:'absolute', pointerEvents:'none' }}/>
          </button>
        </div>
        <div style={{ position:'relative', display:'inline-flex' }}>
          <button type="button" title="Highlight"
            onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:5, fontSize:13, display:'flex', alignItems:'center' }}>
            <span style={{ background:'#fef08a', padding:'0 3px', borderRadius:2, fontWeight:700 }}>A</span>
            <input type="color" defaultValue="#fef08a" onChange={e=>exec('hiliteColor',e.target.value)}
              style={{ width:0, height:0, opacity:0, position:'absolute', pointerEvents:'none' }}/>
          </button>
        </div>
        {sep()}
        <T title="Align Left"   onCmd={() => exec('justifyLeft')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </T>
        <T title="Align Center" onCmd={() => exec('justifyCenter')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </T>
        <T title="Align Right"  onCmd={() => exec('justifyRight')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </T>
        {sep()}
        <T title="Bullet List"   onCmd={() => exec('insertUnorderedList')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
        </T>
        <T title="Numbered List" onCmd={() => exec('insertOrderedList')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/></svg>
        </T>
        {sep()}
        <T title="Insert Link" onCmd={insertLink}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </T>
        <T title="Clear Formatting" onCmd={() => exec('removeFormat')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3H7l-4 9h4l-2 9 12-12h-4l4-6z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
        </T>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { onChange(editorRef.current?.innerHTML || ''); lastSet.current = editorRef.current?.innerHTML || ''; }}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.currentTarget.closest('form')?.dispatchEvent(new Event('submit')); } }}
        data-placeholder={placeholder}
        style={{ minHeight:120, padding:'10px 14px', fontSize:13, lineHeight:1.7, color:'#111827', outline:'none', wordBreak:'break-word' }}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}[contenteditable] a{color:#4f46e5;text-decoration:underline}[contenteditable] ul,[contenteditable] ol{padding-left:20px}`}</style>
    </div>
  );
}

// ── Thread Panel ─────────────────────────────────────────
function ThreadPanel({ thread, onClose, onUpdate, onDelete, onArchive, isArchived }) {
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [cc, setCc]               = useState('');
  const [bcc, setBcc]             = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [mode, setMode]           = useState('reply');
  const [forwardTo, setForwardTo] = useState('');
  const [sending, setSending]     = useState(false);
  const [tagging, setTagging]     = useState(false);
  const [showTagDrop, setShowTagDrop] = useState(false);
  const bottomRef = useRef(null);

  const leadMsg = thread.msgs.find(m => m.status !== 'sent') || thread.msgs[0];
  const currentTag = TAG_MAP[leadMsg?.tag];
  const canAutoReply = isAutoReplyMsg(leadMsg);

  useEffect(() => {
    const loadAccounts = async () => {
      const { data: accs } = await api.get('/email-accounts');
      setAccounts(accs);
      if (!accs.length) return;
      const sentMsg = thread.msgs.find(m => m.status === 'sent');
      if (sentMsg?.from_email) {
        const match = accs.find(a => a.from_email?.toLowerCase() === sentMsg.from_email?.toLowerCase());
        if (match) { setAccountId(match.id); return; }
      }
      if (leadMsg?.campaign_id) {
        try {
          const { data: camp } = await api.get(`/campaigns/${leadMsg.campaign_id}`);
          if (camp?.email_account_id) {
            const match = accs.find(a => a.id === camp.email_account_id);
            if (match) { setAccountId(match.id); return; }
          }
        } catch {}
      }
      setAccountId(accs[0].id);
    };
    loadAccounts();
    thread.msgs.forEach(m => {
      if (m.status === 'unread') {
        api.post(`/messages/${m.id}/read`, { status: 'read' })
          .then(() => onUpdate(m.id, { status: 'read' })).catch(() => {});
      }
    });
  }, [thread.key]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
  }, [thread.key]);

  useEffect(() => {
    if (mode === 'forward') {
      const orig = leadMsg;
      setReplyBody(
        `\n\n---------- Forwarded message ----------\nFrom: ${orig?.from_name||orig?.from_email}\nDate: ${orig ? new Date(orig.received_at).toLocaleString() : ''}\nSubject: ${orig?.subject||''}\n\n${extractNew(orig?.body)||orig?.body||''}`
      );
    } else if (mode === 'reply') {
      setReplyBody('');
    }
  }, [mode]);

  const handleTag = async (tagKey) => {
    setTagging(true); setShowTagDrop(false);
    try {
      await api.post(`/messages/${leadMsg.id}/tag`, { tag: tagKey });
      onUpdate(leadMsg.id, { tag: tagKey });
      toast.success('Tag updated!');
    } catch { toast.error('Failed'); }
    finally { setTagging(false); }
  };

  const handleSend = async () => {
    const plainText = replyBody.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').trim();
    if (!plainText) return toast.error('Write your message first');
    if (mode === 'forward' && !forwardTo.trim()) return toast.error('Enter a recipient to forward to');
    if (!accountId) return toast.error('Select an account');
    setSending(true);
    try {
      await api.post(`/messages/${leadMsg.id}/reply`, {
        body: replyBody,
        email_account_id: accountId,
        cc: cc || undefined,
        bcc: bcc || undefined,
        forward_to: mode === 'forward' ? forwardTo : undefined,
        is_forward: mode === 'forward',
      });
      toast.success(mode === 'forward' ? 'Forwarded! ✅' : 'Reply sent! ✅');
      setReplyBody(''); setCc(''); setBcc(''); setForwardTo(''); setShowCcBcc(false);
      onUpdate(leadMsg.id, { replied: 1, status: 'read' });
      setTimeout(() => onUpdate(null, null), 500);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); }
  };

  const selectedAccount = accounts.find(a => a.id === accountId);

  return (
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:'min(700px,96vw)',background:'#fff',boxShadow:'-8px 0 40px rgba(0,0,0,0.2)',zIndex:1000,display:'flex',flexDirection:'column',animation:'slideIn 0.22s cubic-bezier(.4,0,.2,1)'}}>
      <style>{`
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .field-input{width:100%;border:none;outline:none;font-size:13px;color:var(--text);font-family:inherit;background:transparent;}
      `}</style>

      {/* ── Dark Navy Header ── */}
      <div style={{padding:'16px 20px',background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',color:'rgba(255,255,255,0.8)',padding:'5px',borderRadius:6,display:'flex',alignItems:'center',flexShrink:0,marginTop:2}}>
            <X size={18}/>
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,color:'#fff',lineHeight:1.3,marginBottom:6,letterSpacing:'-0.02em'}}>
              {(thread.latest.subject||'(no subject)').replace(/^(Re:\s*|Fwd:\s*)+/i,'')}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              {thread.latest.campaign_name&&(
                <span style={{fontSize:11,color:'rgba(255,255,255,0.6)',background:'rgba(255,255,255,0.1)',padding:'2px 8px',borderRadius:10}}>📢 {thread.latest.campaign_name}</span>
              )}
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{thread.count} message{thread.count!==1?'s':''}</span>
              {leadMsg?.replied===1&&(
                <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'rgba(22,163,74,0.2)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.3)',fontWeight:600}}>✅ Replied</span>
              )}
            </div>
          </div>
          {/* Tag button */}
          <div style={{position:'relative',flexShrink:0}}>
            <button onClick={()=>setShowTagDrop(p=>!p)} disabled={tagging} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${currentTag?currentTag.border:'rgba(255,255,255,0.2)'}`,background:currentTag?currentTag.bg:'rgba(255,255,255,0.1)',color:currentTag?currentTag.color:'rgba(255,255,255,0.75)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              <TagIcon size={11}/>{tagging?'Saving...':currentTag?currentTag.label:'Tag'}<ChevronDown size={9}/>
            </button>
            {showTagDrop&&(
              <>
                <div onClick={()=>setShowTagDrop(false)} style={{position:'fixed',inset:0,zIndex:10}}/>
                <div style={{position:'absolute',right:0,top:'110%',background:'#fff',border:'1px solid var(--border2)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.15)',zIndex:11,minWidth:200,overflow:'hidden'}}>
                  {currentTag&&<button onClick={()=>handleTag(null)} style={{width:'100%',padding:'9px 14px',border:'none',background:'none',textAlign:'left',cursor:'pointer',fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--border)'}}><X size={11}/> Remove tag</button>}
                  {TAGS.map(t=>(
                    <button key={t.key} onClick={()=>handleTag(t.key)} style={{width:'100%',padding:'10px 14px',border:'none',background:leadMsg?.tag===t.key?t.bg:'transparent',textAlign:'left',cursor:'pointer',fontSize:13,color:t.color,fontWeight:leadMsg?.tag===t.key?700:500,display:'flex',alignItems:'center',gap:8,fontFamily:'inherit'}}>{t.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Thread messages ── */}
      <div style={{flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:20,background:'#f8fafc'}}>
        {thread.msgs.map(m => {
          const isSent = m.status==='sent';
          const newContent = extractNew(m.body);
          const hasQuoted = m.body && newContent.length < m.body.trim().length-20;
          return(
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:isSent?'flex-end':'flex-start'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexDirection:isSent?'row-reverse':'row'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:isSent?'#3b82f6':avatarColor(m.from_email),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}>
                  {isSent?<Send size={14}/>:initials(m.from_name,m.from_email)}
                </div>
                <div style={{textAlign:isSent?'right':'left'}}>
                  <div style={{fontWeight:600,fontSize:13,color:isSent?'#3b82f6':'#1e293b'}}>{isSent?'You':(m.from_name||m.from_email)}</div>
                  <div style={{fontSize:11,color:'#94a3b8'}}>{new Date(m.received_at).toLocaleString()}</div>
                </div>
              </div>
              <div style={{maxWidth:'85%',background:isSent?'#3b82f6':'#fff',color:isSent?'#fff':'#1e293b',borderRadius:isSent?'18px 4px 18px 18px':'4px 18px 18px 18px',padding:'12px 16px',fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',border:isSent?'none':'1px solid #e2e8f0'}}>
                {newContent||m.body||'(no content)'}
              </div>
              {hasQuoted&&!isSent&&(
                <details style={{maxWidth:'85%',marginTop:4}}>
                  <summary style={{fontSize:11,color:'#94a3b8',cursor:'pointer',userSelect:'none',padding:'4px 0'}}>··· Show quoted thread</summary>
                  <div style={{marginTop:6,padding:'10px 14px',background:'#f1f5f9',borderRadius:8,fontSize:12,color:'#64748b',whiteSpace:'pre-wrap',lineHeight:1.6,borderLeft:'3px solid #e2e8f0'}}>{m.body}</div>
                </details>
              )}
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* ── Compose area ── */}
      <div style={{borderTop:'1px solid var(--border)',background:'#fff',flexShrink:0}}>
        {canAutoReply?(
          <div style={{padding:'16px 20px',fontSize:13,color:'var(--text3)',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <span>⚙️</span> This is an auto-reply — no response needed
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column'}}>
            {/* Mode tabs */}
            <div style={{display:'flex',borderBottom:'1px solid var(--border)',paddingLeft:16}}>
              {[{id:'reply',icon:<Reply size={13}/>,label:'Reply'},{id:'forward',icon:<ChevronsRight size={13}/>,label:'Forward'}].map(tab=>(
                <button key={tab.id} onClick={()=>setMode(tab.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'10px 14px',border:'none',borderBottom:`2px solid ${mode===tab.id?'#2563eb':'transparent'}`,background:'none',cursor:'pointer',fontSize:13,fontWeight:mode===tab.id?600:400,color:mode===tab.id?'#2563eb':'var(--text3)',fontFamily:'inherit',marginBottom:-1}}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
              {/* Address fields */}
              <div style={{background:'#f8fafc',border:'1px solid var(--border2)',borderRadius:10,overflow:'hidden'}}>
                {/* From */}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,width:32,flexShrink:0}}>From</span>
                  <select value={accountId} onChange={e=>setAccountId(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:13,color:'#2563eb',fontWeight:600,fontFamily:'inherit',background:'transparent',cursor:'pointer'}}>
                    {accounts.map(a=><option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
                  </select>
                </div>
                {/* To */}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,width:32,flexShrink:0}}>To</span>
                  {mode==='reply'?(
                    <span style={{fontSize:13,color:'#1e293b',flex:1}}>{leadMsg?.from_name?`${leadMsg.from_name} <${leadMsg.from_email}>`:leadMsg?.from_email}</span>
                  ):(
                    <input className="field-input" placeholder="recipient@email.com" value={forwardTo} onChange={e=>setForwardTo(e.target.value)}/>
                  )}
                  <button onClick={()=>setShowCcBcc(p=>!p)} style={{fontSize:11,color:'#94a3b8',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                    {showCcBcc?'Hide':'CC / BCC'}
                  </button>
                </div>
                {/* CC / BCC */}
                {showCcBcc&&(
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,width:32,flexShrink:0}}>CC</span>
                      <input className="field-input" placeholder="cc@email.com, another@email.com" value={cc} onChange={e=>setCc(e.target.value)}/>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,width:32,flexShrink:0}}>BCC</span>
                      <input className="field-input" placeholder="bcc@email.com" value={bcc} onChange={e=>setBcc(e.target.value)}/>
                    </div>
                  </>
                )}
              </div>

              {/* Rich text editor */}
              <RichReplyEditor
                key={`reply-${mode}`}
                editorKey={mode}
                value={replyBody}
                onChange={setReplyBody}
                placeholder={mode==='forward'?`Forward to someone… (Ctrl+Enter to send)`:`Write your reply to ${leadMsg?.from_name||'them'}… (Ctrl+Enter to send)`}
              />

              {/* Send row */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'#94a3b8'}}>Ctrl+Enter to send{selectedAccount&&<> · <span style={{color:'#2563eb',fontWeight:600}}>{selectedAccount.from_email}</span></>}</span>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{setReplyBody('');setCc('');setBcc('');setForwardTo('');}} style={{padding:'7px 14px',background:'none',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,color:'#64748b',cursor:'pointer',fontFamily:'inherit'}}>Clear</button>
                  <button onClick={handleSend} disabled={sending||!replyBody} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 20px',background:sending||!replyBody?'#94a3b8':'#2563eb',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:sending||!replyBody?'not-allowed':'pointer',fontFamily:'inherit',transition:'background 0.15s'}}>
                    {sending?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Sending...</>:<><Send size={13}/>{mode==='forward'?'Forward':'Send Reply'}</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Archive + Delete */}
        <div style={{padding:'8px 20px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid var(--border)',background:'#fafafa'}}>
          <button onClick={onArchive} style={{background:'none',border:`1px solid ${isArchived?'#93c5fd':'#e2e8f0'}`,borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,color:isArchived?'#3b82f6':'#64748b',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
            {isArchived?'📥 Restore to Inbox':'📁 Archive Thread'}
          </button>
          <button onClick={()=>onDelete&&onDelete(thread)} style={{background:'none',border:'1px solid #fca5a5',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,color:'#dc2626',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
            🗑 Delete Thread
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Messages Component ──────────────────────────────
export default function Messages({ type = 'inbox' }) {
  const navigate = useNavigate();
  const [messages, setMessages]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [unread, setUnread]           = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [filterTag, setFilterTag]     = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterAccount, setFilterAccount]   = useState('');
  const [campaigns, setCampaigns]     = useState([]);
  const [emailAccounts, setEmailAccounts]   = useState([]);
  const [openThread, setOpenThread]   = useState(null);
  const [showSyncModal, setShowSyncModal]   = useState(false);
  const [selectedKeys, setSelectedKeys]     = useState(new Set());
  const [bulkDeleting, setBulkDeleting]     = useState(false);

  // Load filter options once
  useEffect(() => {
    api.get('/campaigns', { params: { limit: 100 } })
      .then(r => setCampaigns(Array.isArray(r.data) ? r.data : (r.data.campaigns || [])))
      .catch(() => {});
    api.get('/email-accounts')
      .then(r => setEmailAccounts(r.data || []))
      .catch(() => {});
  }, []);

  // Reset filters when tab changes
  useEffect(() => {
    setPage(1);
    setSearch('');
    setFilterTag('');
    setFilterCampaign('');
    setFilterAccount('');
    setSelectedKeys(new Set());
    setOpenThread(null);
  }, [type]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ep = type === 'inbox' ? '/messages/inbox'
               : type === 'auto-replies' ? '/messages/auto-replies'
               : '/messages/archived';
      const { data } = await api.get(ep, { params: { search: search || undefined, page, limit: 50 } });
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [type, search, page]);

  useEffect(() => { load(); }, [load]);

  // Archive / restore
  const handleArchiveThread = useCallback(async (thread) => {
    const lead = thread.msgs.find(m => m.status !== 'sent') || thread.msgs[0];
    try {
      await api.post(`/messages/${lead.id}/archive`);
      toast.success('Thread archived 📁');
      setOpenThread(null);
      load();
    } catch { toast.error('Failed to archive'); }
  }, [load]);

  const handleUnarchiveThread = useCallback(async (thread) => {
    const lead = thread.msgs.find(m => m.status !== 'sent') || thread.msgs[0];
    try {
      await api.post(`/messages/${lead.id}/unarchive`);
      toast.success('Restored to inbox ✉️');
      setOpenThread(null);
      load();
    } catch { toast.error('Failed to restore'); }
  }, [load]);

  const handleDelete = useCallback(async (thread) => {
    if (!confirm('Delete this conversation thread? This cannot be undone.')) return;
    try {
      for (const m of (thread.msgs || [thread])) {
        try { await api.delete(`/messages/${m.id}`); } catch {}
      }
      setOpenThread(null);
      toast.success('Thread deleted');
      load();
    } catch { toast.error('Failed to delete thread'); }
  }, [load]);

  const handleUpdate = useCallback((msgId, updates) => {
    if (!msgId && !updates) { load(); return; }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...updates } : m));
    setOpenThread(prev => {
      if (!prev) return prev;
      const updated = prev.msgs.map(m => m.id === msgId ? { ...m, ...updates } : m);
      return { ...prev, msgs: updated, latest: updated[updated.length-1] };
    });
    if (updates?.status === 'read') setUnread(u => Math.max(0, u-1));
  }, [load]);

  const toggleSelect = (e, key) => {
    e.stopPropagation();
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSelectAll = (threads) => {
    if (selectedKeys.size === threads.length) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(threads.map(t => t.key)));
  };

  const handleBulkDelete = async (threads) => {
    const toDelete = threads.filter(t => selectedKeys.has(t.key));
    if (!confirm(`Delete ${toDelete.length} conversation${toDelete.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const thread of toDelete) {
      for (const m of thread.msgs) {
        try { await api.delete(`/messages/${m.id}`); } catch {}
      }
    }
    setSelectedKeys(new Set());
    setBulkDeleting(false);
    toast.success(`${toDelete.length} thread${toDelete.length !== 1 ? 's' : ''} deleted`);
    load();
  };

  const handleTabClick = (tab) => {
    const routes = { inbox: '/messages/inbox', 'auto-replies': '/messages/auto-replies', archive: '/messages/archive' };
    navigate(routes[tab]);
  };

  // Client-side filtering
  const allThreads = groupThreads(messages);

  const campaignFiltered = filterCampaign
    ? allThreads.filter(t => t.msgs.some(m => m.campaign_id === filterCampaign))
    : allThreads;

  const accountCampaignIds = filterAccount
    ? campaigns.filter(c => c.email_account_id === filterAccount).map(c => c.id)
    : [];
  const accountFiltered = filterAccount
    ? campaignFiltered.filter(t => t.msgs.some(m => accountCampaignIds.includes(m.campaign_id)))
    : campaignFiltered;

  const threads = filterTag
    ? accountFiltered.filter(t => t.msgs.some(m => m.tag === filterTag))
    : accountFiltered;

  const tabs = [
    { id: 'inbox',        emoji: '📥', label: 'Inbox',         badge: type === 'inbox' && unread > 0 ? unread : null },
    { id: 'auto-replies', emoji: '⚙️', label: 'Auto Response', badge: null },
    { id: 'archive',      emoji: '📁', label: 'Archive',       badge: null },
  ];

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* ══ Dark Navy Header ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2044 100%)',
        borderRadius: '14px 14px 0 0',
        padding: '20px 24px 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(96,165,250,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(37,99,235,0.2)',
            }}>
              <MessageSquare size={18} color="#60a5fa"/>
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>Messages</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, letterSpacing: '0.02em' }}>
                {type === 'inbox' && unread > 0
                  ? `${unread} unread message${unread !== 1 ? 's' : ''}`
                  : type === 'archive' ? 'Archived conversations'
                  : 'Campaign replies & outreach'}
              </div>
            </div>
            {type === 'inbox' && unread > 0 && (
              <span style={{ background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, boxShadow: '0 0 10px rgba(37,99,235,0.5)' }}>{unread}</span>
            )}
          </div>
          {type === 'inbox' && (
            <button
              onClick={() => setShowSyncModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(96,165,250,0.25)', color: '#93c5fd', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em' }}
            >
              <RefreshCw size={12}/> Sync Inbox
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => {
            const isActive = type === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px 12px',
                  border: 'none', cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#1e293b' : 'rgba(255,255,255,0.55)',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 13, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
              >
                <span style={{ fontSize: 13 }}>{tab.emoji}</span>
                {tab.label}
                {tab.badge && (
                  <span style={{ background: isActive ? '#2563eb' : 'rgba(37,99,235,0.7)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, lineHeight: 1.5 }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Filter Bar ══ */}
      <div style={{
        background: '#fff',
        padding: '14px 20px 12px',
        border: '1px solid var(--border)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        marginBottom: 12,
      }}>
        {/* Row 1: Search + Campaign + Account + sync note */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}/>
            <input
              placeholder="Search messages…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, outline: 'none', background: '#f8fafc', color: 'var(--text)', fontFamily: 'inherit' }}
            />
          </div>

          {/* Campaign filter */}
          {campaigns.length > 0 && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Briefcase size={12} style={{ position: 'absolute', left: 10, color: '#64748b', pointerEvents: 'none' }}/>
              <select
                value={filterCampaign}
                onChange={e => { setFilterCampaign(e.target.value); setPage(1); }}
                style={{ border: `1px solid ${filterCampaign ? '#2563eb' : 'var(--border2)'}`, borderRadius: 8, padding: '7px 28px 7px 28px', fontSize: 13, outline: 'none', background: filterCampaign ? '#eff6ff' : '#f8fafc', color: filterCampaign ? '#2563eb' : '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: filterCampaign ? 600 : 400, appearance: 'none', minWidth: 145 }}
              >
                <option value="">All Campaigns</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={11} style={{ position: 'absolute', right: 10, color: '#64748b', pointerEvents: 'none' }}/>
            </div>
          )}

          {/* Account filter */}
          {emailAccounts.length > 0 && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={12} style={{ position: 'absolute', left: 10, color: '#64748b', pointerEvents: 'none' }}/>
              <select
                value={filterAccount}
                onChange={e => { setFilterAccount(e.target.value); setPage(1); }}
                style={{ border: `1px solid ${filterAccount ? '#2563eb' : 'var(--border2)'}`, borderRadius: 8, padding: '7px 28px 7px 28px', fontSize: 13, outline: 'none', background: filterAccount ? '#eff6ff' : '#f8fafc', color: filterAccount ? '#2563eb' : '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: filterAccount ? 600 : 400, appearance: 'none', minWidth: 145 }}
              >
                <option value="">All Accounts</option>
                {emailAccounts.map(a => <option key={a.id} value={a.id}>{a.from_email}</option>)}
              </select>
              <ChevronDown size={11} style={{ position: 'absolute', right: 10, color: '#64748b', pointerEvents: 'none' }}/>
            </div>
          )}

          {/* Sync info */}
          {type === 'inbox' && (
            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 'auto' }}>
              <RefreshCw size={10}/> Auto-syncs every 5 min ·
              <button onClick={() => setShowSyncModal(true)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 11, padding: 0, fontFamily: 'inherit', fontWeight: 500 }}>Sync now</button>
            </div>
          )}
        </div>

        {/* Row 2: Tag chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginRight: 2, flexShrink: 0 }}>Tags:</span>
          <button onClick={() => setFilterTag('')} style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${!filterTag ? '#2563eb' : 'var(--border2)'}`, background: !filterTag ? '#eff6ff' : 'transparent', color: !filterTag ? '#2563eb' : '#64748b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: !filterTag ? 600 : 400 }}>All</button>
          {TAGS.map(tag => (
            <button key={tag.key} onClick={() => setFilterTag(filterTag === tag.key ? '' : tag.key)} style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${filterTag === tag.key ? tag.color : 'var(--border2)'}`, background: filterTag === tag.key ? tag.bg : 'transparent', color: filterTag === tag.key ? tag.color : '#64748b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: filterTag === tag.key ? 600 : 400 }}>
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ Bulk Action Bar ══ */}
      {threads.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={selectedKeys.size > 0 && selectedKeys.size === threads.length}
            ref={el => { if (el) el.indeterminate = selectedKeys.size > 0 && selectedKeys.size < threads.length; }}
            onChange={() => handleSelectAll(threads)}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563eb' }}
          />
          <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>
            {selectedKeys.size > 0
              ? `${selectedKeys.size} selected`
              : `${threads.length} conversation${threads.length !== 1 ? 's' : ''}${unread > 0 && type === 'inbox' ? ` · ${unread} unread` : ''}`}
          </span>
          {selectedKeys.size > 0 && (
            <>
              <button onClick={() => handleBulkDelete(threads)} disabled={bulkDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {bulkDeleting ? '🗑 Deleting…' : `🗑 Delete ${selectedKeys.size}`}
              </button>
              <button onClick={() => setSelectedKeys(new Set())}
                style={{ padding: '5px 10px', background: 'none', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 12, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* ══ Message List ══ */}
      {loading ? <Spinner/> : threads.length === 0 ? (
        <Empty
          icon={MessageSquare}
          title={
            filterTag ? `No conversations tagged ${TAG_MAP[filterTag]?.label}`
            : type === 'inbox' ? 'No messages yet'
            : type === 'auto-replies' ? 'No auto-replies yet'
            : 'Archive is empty'
          }
          description={
            filterTag ? 'Try a different tag filter.'
            : type === 'inbox' ? 'Replies from your campaigns will appear here.'
            : type === 'auto-replies' ? 'Auto-replies will appear here.'
            : 'Archived conversations will appear here.'
          }
          action={type === 'inbox' && !filterTag && (
            <button onClick={() => setShowSyncModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13}/> Sync Inbox
            </button>
          )}
        />
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {threads.map(({ key, msgs, latest, count }, i) => {
            const tag       = TAG_MAP[msgs.find(m => m.tag)?.tag];
            const hasUnread = msgs.some(m => m.status === 'unread');
            const leadMsg   = msgs.find(m => m.status !== 'sent') || msgs[0];
            const isOpen    = openThread?.key === key;
            const preview   = extractNew(latest.body);
            const latestIsSent = latest.status === 'sent';
            const isSelected   = selectedKeys.has(key);
            const isAuto       = isAutoReplyMsg(latest);

            return (
              <div
                key={key}
                onClick={() => setOpenThread({ key, msgs, latest, count })}
                onMouseEnter={e => { if (!isOpen && !isSelected) e.currentTarget.style.background = '#f8faff'; }}
                onMouseLeave={e => { if (!isOpen && !isSelected) e.currentTarget.style.background = hasUnread ? '#f8faff' : '#fff'; }}
                style={{
                  display: 'grid', gridTemplateColumns: '36px 50px 1fr auto',
                  gap: 12, padding: '14px 20px',
                  borderBottom: i < threads.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isSelected || isOpen ? '#eff6ff' : hasUnread ? '#f8faff' : '#fff',
                  borderLeft: `3px solid ${isOpen || hasUnread ? '#2563eb' : 'transparent'}`,
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => toggleSelect(e, key)}>
                  <input type="checkbox" checked={isSelected} onChange={e => toggleSelect(e, key)} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563eb' }}/>
                </div>

                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: avatarColor(leadMsg?.from_email),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 15,
                    flexShrink: 0, position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    {initials(leadMsg?.from_name, leadMsg?.from_email)}
                    {count > 1 && (
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{count}</div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div style={{ minWidth: 0 }}>
                  {/* Name + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    {hasUnread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }}/>}
                    <span style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                      {leadMsg?.from_name || leadMsg?.from_email}
                    </span>
                    {tag && (
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: tag.bg, color: tag.color, border: `1px solid ${tag.border}`, fontWeight: 600, flexShrink: 0 }}>{tag.label}</span>
                    )}
                    {leadMsg?.replied === 1 && <span style={{ fontSize: 11, flexShrink: 0 }} title="Replied">✅</span>}
                    {latest.campaign_name && (
                      <span style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '1px 7px', borderRadius: 6, flexShrink: 0, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📢 {latest.campaign_name}
                      </span>
                    )}
                  </div>
                  {/* Subject */}
                  <div style={{ fontSize: 13, fontWeight: hasUnread ? 600 : 400, color: hasUnread ? '#1e293b' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {(latest.subject || '(no subject)').replace(/^(Re:\s*)+/i, '')}
                  </div>
                  {/* Preview */}
                  <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {latestIsSent && <span style={{ color: '#3b82f6', fontWeight: 600, marginRight: 4 }}>You:</span>}
                    {preview ? preview.substring(0, 110) : ''}
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0, minWidth: 70 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{timeAgo(latest.received_at)}</span>
                  {isAuto && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>auto</span>
                  )}
                  {/* Quick actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {type !== 'archive' ? (
                      <button
                        onClick={e => { e.stopPropagation(); handleArchiveThread({ key, msgs, latest, count }); }}
                        title="Archive thread"
                        style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        <Archive size={11}/>
                      </button>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); handleUnarchiveThread({ key, msgs, latest, count }); }}
                        title="Restore to inbox"
                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: '#2563eb', fontSize: 11 }}
                      >
                        📥
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete({ key, msgs, latest, count }); }}
                      title="Delete thread"
                      style={{ background: 'transparent', border: '1px solid #fecaca', borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: '#fca5a5', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fca5a5'; }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {threads.length} conversation{threads.length !== 1 ? 's' : ''}
              {filterTag && ` · tagged ${TAG_MAP[filterTag]?.label}`}
              {unread > 0 && type === 'inbox' && ` · ${unread} unread`}
            </span>
            <Pagination page={page} total={total} limit={50} onChange={setPage}/>
          </div>
        </div>
      )}

      {/* ══ Thread Panel Overlay ══ */}
      {openThread && (
        <>
          <div onClick={() => setOpenThread(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999, backdropFilter: 'blur(3px)' }}/>
          <ThreadPanel
            thread={openThread}
            onClose={() => setOpenThread(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onArchive={type !== 'archive'
              ? () => handleArchiveThread(openThread)
              : () => handleUnarchiveThread(openThread)
            }
            isArchived={type === 'archive'}
          />
        </>
      )}

      <SyncModal open={showSyncModal} onClose={() => setShowSyncModal(false)} onSynced={load}/>
    </div>
  );
}
