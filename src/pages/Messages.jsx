import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, Empty, Pagination, Btn, Modal } from '../components/UI';
import { MessageSquare, Search, RefreshCw, Inbox, CheckCircle, Loader2, X, Reply, Tag, ChevronDown, Send, Forward, ChevronsRight } from 'lucide-react';

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
function initials(name,email) { return (name||email||'?').charAt(0).toUpperCase(); }

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

// ── Sync Modal ──────────────────────────────────
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
            <Inbox size={28} style={{opacity:.3,display:'block',margin:'0 auto 8px'}}/>
            No IMAP accounts. Go to <strong>Email Accounts</strong> to configure.
          </div>
        ):<>
          <Btn onClick={syncAll} disabled={syncingAll} style={{width:'100%',justifyContent:'center'}}>
            <RefreshCw size={14} style={{animation:syncingAll?'spin 1s linear infinite':'none'}}/>{syncingAll?'Syncing All...':'⚡ Sync All Inboxes'}
          </Btn>
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
            <Btn variant="secondary" onClick={onClose}>{anyDone?'Done':'Cancel'}</Btn>
          </div>
        </>}
      </div>
    </Modal>
  );
}

// ── Thread Panel ────────────────────────────────
function ThreadPanel({ thread, onClose, onUpdate, onDelete }) {
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [cc, setCc]               = useState('');
  const [bcc, setBcc]             = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [mode, setMode]           = useState('reply'); // 'reply' | 'forward'
  const [forwardTo, setForwardTo] = useState('');
  const [sending, setSending]     = useState(false);
  const [tagging, setTagging]     = useState(false);
  const [showTagDrop, setShowTagDrop] = useState(false);
  const bottomRef = useRef(null);

  const leadMsg = thread.msgs.find(m => m.status !== 'sent') || thread.msgs[0];
  const currentTag = TAG_MAP[leadMsg?.tag];
  const canAutoReply = isAutoReplyMsg(leadMsg);

  useEffect(() => {
    // Also fetch the campaign's email account so we can auto-select the correct sender
    const loadAccounts = async () => {
      const { data: accs } = await api.get('/email-accounts');
      setAccounts(accs);
      if (!accs.length) return;

      // Strategy 1: Look at our sent replies in thread — match by from_email
      const sentMsg = thread.msgs.find(m => m.status === 'sent');
      if (sentMsg?.from_email) {
        const match = accs.find(a => a.from_email?.toLowerCase() === sentMsg.from_email?.toLowerCase());
        if (match) { setAccountId(match.id); return; }
      }

      // Strategy 2: Fetch the campaign to get email_account_id
      if (leadMsg?.campaign_id) {
        try {
          const { data: camp } = await api.get(`/campaigns/${leadMsg.campaign_id}`);
          if (camp?.email_account_id) {
            const match = accs.find(a => a.id === camp.email_account_id);
            if (match) { setAccountId(match.id); return; }
          }
        } catch {}
      }

      // Strategy 3: first account
      setAccountId(accs[0].id);
    };
    loadAccounts();

    // Mark unread as read
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

  // Set forward body pre-filled
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
    if (!replyBody.trim()) return toast.error('Write your message first');
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
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:'min(700px,96vw)',background:'#fff',boxShadow:'-8px 0 40px rgba(0,0,0,0.18)',zIndex:1000,display:'flex',flexDirection:'column',animation:'slideIn 0.22s cubic-bezier(.4,0,.2,1)'}}>
      <style>{`
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .reply-area:focus{outline:none;border-color:var(--primary)!important;box-shadow:0 0 0 3px rgba(99,102,241,.1)!important}
        .field-input{width:100%;border:none;outline:none;font-size:13px;color:var(--text);font-family:inherit;background:transparent;}
      `}</style>

      {/* ── Header ── */}
      <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'#fafafa',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,borderRadius:6,display:'flex',alignItems:'center',flexShrink:0,marginTop:2}}>
            <X size={18}/>
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:16,color:'var(--text)',lineHeight:1.3,marginBottom:5}}>
              {(thread.latest.subject||'(no subject)').replace(/^(Re:\s*|Fwd:\s*)+/i,'')}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              {thread.latest.campaign_name&&<span style={{fontSize:12,color:'var(--text3)',background:'var(--bg3)',padding:'2px 8px',borderRadius:10}}>📢 {thread.latest.campaign_name}</span>}
              <span style={{fontSize:12,color:'var(--text3)'}}>{thread.count} message{thread.count!==1?'s':''}</span>
              {leadMsg?.replied===1&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'#f0fff4',color:'#16a34a',border:'1px solid #86efac',fontWeight:600}}>✅ Replied</span>}
            </div>
          </div>
          {/* Tag */}
          <div style={{position:'relative',flexShrink:0}}>
            <button onClick={()=>setShowTagDrop(p=>!p)} disabled={tagging} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${currentTag?currentTag.border:'var(--border2)'}`,background:currentTag?currentTag.bg:'#fff',color:currentTag?currentTag.color:'var(--text3)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              <Tag size={12}/>{tagging?'Saving...':currentTag?currentTag.label:'Add Tag'}<ChevronDown size={10}/>
            </button>
            {showTagDrop&&(
              <>
                <div onClick={()=>setShowTagDrop(false)} style={{position:'fixed',inset:0,zIndex:10}}/>
                <div style={{position:'absolute',right:0,top:'110%',background:'#fff',border:'1px solid var(--border2)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:11,minWidth:200,overflow:'hidden'}}>
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
      <div style={{flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:20}}>
        {thread.msgs.map(m => {
          const isSent = m.status==='sent';
          const newContent = extractNew(m.body);
          const hasQuoted = m.body && newContent.length < m.body.trim().length-20;
          return(
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:isSent?'flex-end':'flex-start'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexDirection:isSent?'row-reverse':'row'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:isSent?'#3b82f6':avatarColor(m.from_email),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>
                  {isSent?<Send size={14}/>:initials(m.from_name,m.from_email)}
                </div>
                <div style={{textAlign:isSent?'right':'left'}}>
                  <div style={{fontWeight:600,fontSize:13,color:isSent?'#3b82f6':'var(--text)'}}>{isSent?'You':(m.from_name||m.from_email)}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{new Date(m.received_at).toLocaleString()}</div>
                </div>
              </div>
              <div style={{maxWidth:'85%',background:isSent?'#3b82f6':'#f1f5f9',color:isSent?'#fff':'var(--text)',borderRadius:isSent?'18px 4px 18px 18px':'4px 18px 18px 18px',padding:'12px 16px',fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
                {newContent||m.body||'(no content)'}
              </div>
              {hasQuoted&&!isSent&&(
                <details style={{maxWidth:'85%',marginTop:4}}>
                  <summary style={{fontSize:11,color:'var(--text3)',cursor:'pointer',userSelect:'none',padding:'4px 0'}}>··· Show quoted thread</summary>
                  <div style={{marginTop:6,padding:'10px 14px',background:'#f8f9fa',borderRadius:8,fontSize:12,color:'var(--text3)',whiteSpace:'pre-wrap',lineHeight:1.6,borderLeft:'3px solid var(--border2)'}}>{m.body}</div>
                </details>
              )}
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* ── Compose area ── */}
      <div style={{borderTop:'2px solid var(--border)',background:'#fafafa',flexShrink:0}}>
        {canAutoReply?(
          <div style={{padding:'16px 20px',fontSize:13,color:'var(--text3)',textAlign:'center'}}>⚙️ This is an auto-reply — no response needed</div>
        ):(
          <div style={{display:'flex',flexDirection:'column'}}>

            {/* ── Mode tabs: Reply / Forward ── */}
            <div style={{display:'flex',borderBottom:'1px solid var(--border)',paddingLeft:16}}>
              {[{id:'reply',icon:<Reply size={13}/>,label:'Reply'},{id:'forward',icon:<ChevronsRight size={13}/>,label:'Forward'}].map(tab=>(
                <button key={tab.id} onClick={()=>setMode(tab.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'10px 14px',border:'none',borderBottom:`2px solid ${mode===tab.id?'var(--primary)':'transparent'}`,background:'none',cursor:'pointer',fontSize:13,fontWeight:mode===tab.id?600:400,color:mode===tab.id?'var(--primary)':'var(--text3)',fontFamily:'inherit',marginBottom:-1}}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>

              {/* ── Fields ── */}
              <div style={{background:'#fff',border:'1px solid var(--border2)',borderRadius:10,overflow:'hidden'}}>

                {/* From */}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text3)',fontWeight:600,width:32,flexShrink:0}}>From</span>
                  <select value={accountId} onChange={e=>setAccountId(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:13,color:'var(--primary)',fontWeight:600,fontFamily:'inherit',background:'transparent',cursor:'pointer'}}>
                    {accounts.map(a=><option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
                  </select>
                </div>

                {/* To — Reply shows prospect, Forward shows input */}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text3)',fontWeight:600,width:32,flexShrink:0}}>To</span>
                  {mode==='reply'?(
                    <span style={{fontSize:13,color:'var(--text)',flex:1}}>{leadMsg?.from_name?`${leadMsg.from_name} <${leadMsg.from_email}>`:leadMsg?.from_email}</span>
                  ):(
                    <input className="field-input" placeholder="recipient@email.com" value={forwardTo} onChange={e=>setForwardTo(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:13,fontFamily:'inherit',background:'transparent'}}/>
                  )}
                  <button onClick={()=>setShowCcBcc(p=>!p)} style={{fontSize:11,color:'var(--text3)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                    {showCcBcc?'Hide':'CC / BCC'}
                  </button>
                </div>

                {/* CC */}
                {showCcBcc&&(
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:12,color:'var(--text3)',fontWeight:600,width:32,flexShrink:0}}>CC</span>
                      <input className="field-input" placeholder="cc@email.com, another@email.com" value={cc} onChange={e=>setCc(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:13,fontFamily:'inherit',background:'transparent'}}/>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)'}}>
                      <span style={{fontSize:12,color:'var(--text3)',fontWeight:600,width:32,flexShrink:0}}>BCC</span>
                      <input className="field-input" placeholder="bcc@email.com" value={bcc} onChange={e=>setBcc(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:13,fontFamily:'inherit',background:'transparent'}}/>
                    </div>
                  </>
                )}
              </div>

              {/* Textarea */}
              <textarea
                className="reply-area"
                value={replyBody}
                onChange={e=>setReplyBody(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))handleSend();}}
                placeholder={mode==='forward'?`Forward to someone...\n\n(Ctrl+Enter to send)`:`Write your reply to ${leadMsg?.from_name||'them'}...\n\n(Ctrl+Enter to send)`}
                rows={4}
                style={{width:'100%',border:'1.5px solid var(--border2)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--text)',resize:'vertical',fontFamily:'inherit',lineHeight:1.6,boxSizing:'border-box',background:'#fff',transition:'border-color 0.15s, box-shadow 0.15s'}}
              />

              {/* Send row */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--text3)'}}>Ctrl+Enter to send · {selectedAccount&&<span style={{color:'var(--primary)',fontWeight:600}}>{selectedAccount.from_email}</span>}</span>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{setReplyBody('');setCc('');setBcc('');setForwardTo('');}} style={{padding:'7px 14px',background:'none',border:'1px solid var(--border2)',borderRadius:8,fontSize:13,color:'var(--text2)',cursor:'pointer',fontFamily:'inherit'}}>Clear</button>
                  <button onClick={handleSend} disabled={sending||!replyBody.trim()} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 20px',background:sending||!replyBody.trim()?'#94a3b8':'var(--primary)',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:sending||!replyBody.trim()?'not-allowed':'pointer',fontFamily:'inherit',transition:'background 0.15s'}}>
                    {sending?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Sending...</>:<><Send size={13}/>{mode==='forward'?'Forward':'Send Reply'}</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete thread button */}
        <div style={{padding:'8px 20px 12px',display:'flex',justifyContent:'flex-end',borderTop:'1px solid var(--border)',background:'#fafafa'}}>
          <button onClick={()=>onDelete&&onDelete(thread)} style={{background:'none',border:'1px solid #fca5a5',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,color:'#dc2626',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
            🗑 Delete Thread
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Messages Component ─────────────────────
export default function Messages({ type = 'inbox' }) {
  const [messages,setMessages]     = useState([]);
  const [total,setTotal]           = useState(0);
  const [unread,setUnread]         = useState(0);
  const [loading,setLoading]       = useState(true);
  const [search,setSearch]         = useState('');
  const [page,setPage]             = useState(1);
  const [filterTag,setFilterTag]   = useState('');
  const [openThread,setOpenThread] = useState(null);
  const [showSyncModal,setShowSyncModal] = useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    try{
      const ep=type==='inbox'?'/messages/inbox':'/messages/auto-replies';
      // Always fetch ALL messages (no tag filter sent to backend)
      // Tag filtering happens client-side at the THREAD level so full conversations always show
      const{data}=await api.get(ep,{params:{search:search||undefined,page,limit:50}});
      setMessages(data.messages||[]);setTotal(data.total||0);setUnread(data.unread||0);
    }catch{toast.error('Failed to load');}
    finally{setLoading(false);}
  },[type,search,page]); // tag filter is client-side, no need to refetch

  useEffect(()=>{load();},[load]);

  const handleDelete = useCallback(async (thread) => {
    if (!confirm('Delete this conversation thread? This cannot be undone.')) return;
    try {
      const msgs = thread.msgs || [thread];
      for (const m of msgs) {
        try { await api.delete(`/messages/${m.id}`); } catch {}
      }
      setOpenThread(null);
      toast.success('Thread deleted');
      load();
    } catch { toast.error('Failed to delete thread'); }
  }, [load]);

  const handleUpdate = useCallback((msgId,updates)=>{
    if(!msgId&&!updates){load();return;}
    setMessages(prev=>prev.map(m=>m.id===msgId?{...m,...updates}:m));
    setOpenThread(prev=>{
      if(!prev)return prev;
      const updated=prev.msgs.map(m=>m.id===msgId?{...m,...updates}:m);
      return{...prev,msgs:updated,latest:updated[updated.length-1]};
    });
    if(updates?.status==='read')setUnread(u=>Math.max(0,u-1));
  },[load]);

  // Client-side tag filtering at THREAD level:
  // A thread is included if ANY message in it has the tag.
  // All messages in that thread are shown (including sent replies with no tag).
  const allThreads = groupThreads(messages);
  const threads = filterTag
    ? allThreads.filter(t => t.msgs.some(m => m.tag === filterTag))
    : allThreads;
  const activeTab = type==='inbox'?'/messages/inbox':'/messages/auto-replies';

  return(
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <PageHeader
        title="Messages"
        subtitle={type==='inbox'?`Inbox${unread>0?` · ${unread} unread`:''}` :'Auto-replies'}
        action={type==='inbox'&&<Btn onClick={()=>setShowSyncModal(true)}><RefreshCw size={14}/> Sync Inbox</Btn>}
      />
      <div style={{display:'flex',borderBottom:'2px solid var(--border)',marginBottom:16}}>
        {[{label:`📥 Inbox${unread>0?` (${unread})`:'' }`,path:'/messages/inbox'},{label:'⚙️ Auto-replies',path:'/messages/auto-replies'}].map(t=>(
          <a key={t.path} href={t.path} style={{padding:'10px 18px',borderBottom:`2px solid ${activeTab===t.path?'var(--primary)':'transparent'}`,marginBottom:-2,color:activeTab===t.path?'var(--primary)':'var(--text2)',fontWeight:activeTab===t.path?600:400,fontSize:14,textDecoration:'none'}}>{t.label}</a>
        ))}
      </div>
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}/>
          <input placeholder="Search messages..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{width:'100%',background:'#fff',border:'1px solid var(--border2)',borderRadius:8,padding:'8px 12px 8px 32px',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--text3)',fontWeight:600}}>Filter:</span>
          <button onClick={()=>setFilterTag('')} style={{padding:'4px 10px',borderRadius:20,border:`1px solid ${!filterTag?'var(--primary)':'var(--border2)'}`,background:!filterTag?'var(--primary-dim)':'#fff',color:!filterTag?'var(--primary)':'var(--text2)',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:!filterTag?600:400}}>All</button>
          {TAGS.map(tag=>(
            <button key={tag.key} onClick={()=>setFilterTag(filterTag===tag.key?'':tag.key)} style={{padding:'4px 10px',borderRadius:20,border:`1px solid ${filterTag===tag.key?tag.color:'var(--border2)'}`,background:filterTag===tag.key?tag.bg:'#fff',color:filterTag===tag.key?tag.color:'var(--text2)',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:filterTag===tag.key?600:400}}>{tag.label}</button>
          ))}
        </div>
      </div>
      {type==='inbox'&&(
        <div style={{fontSize:12,color:'var(--text3)',marginBottom:12,display:'flex',alignItems:'center',gap:5}}>
          <RefreshCw size={11}/> Auto-syncs every 5 min ·{' '}
          <button onClick={()=>setShowSyncModal(true)} style={{background:'none',border:'none',color:'var(--primary)',cursor:'pointer',fontSize:12,padding:0,fontFamily:'inherit'}}>Sync now</button>
        </div>
      )}
      {loading?<Spinner/>:threads.length===0?(
        <Empty icon={MessageSquare}
          title={filterTag ? `No conversations tagged ${TAG_MAP[filterTag]?.label}` : type==='inbox' ? 'No messages yet' : 'No auto-replies yet'}
          description={filterTag ? 'Try a different tag filter, or tag a conversation first.' : type==='inbox' ? 'Replies from your campaigns will appear here.' : 'Auto-replies will appear here.'}
          action={type==='inbox'&&!filterTag&&<Btn onClick={()=>setShowSyncModal(true)} variant="secondary"><RefreshCw size={14}/> Sync Inbox</Btn>}
        />
      ):(
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          {threads.map(({key,msgs,latest,count},i)=>{
            const tag=TAG_MAP[msgs.find(m=>m.tag)?.tag];
            const hasUnread=msgs.some(m=>m.status==='unread');
            const leadMsg=msgs.find(m=>m.status!=='sent')||msgs[0];
            const isOpen=openThread?.key===key;
            const preview=extractNew(latest.body);
            const latestIsSent=latest.status==='sent';
            return(
              <div key={key} onClick={()=>setOpenThread({key,msgs,latest,count})}
                style={{display:'grid',gridTemplateColumns:'44px 1fr auto',gap:12,padding:'13px 16px',borderBottom:i<threads.length-1?'1px solid var(--border)':'none',background:isOpen?'#eff6ff':hasUnread?'#f8faff':'#fff',borderLeft:isOpen?'3px solid var(--primary)':hasUnread?'3px solid var(--primary)':'3px solid transparent',cursor:'pointer',transition:'background 0.1s'}}
                onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background='#f8faff';}}
                onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background=hasUnread?'#f8faff':'#fff';}}
              >
                <div style={{display:'flex',alignItems:'center'}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:avatarColor(leadMsg?.from_email),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:15,flexShrink:0,position:'relative'}}>
                    {initials(leadMsg?.from_name,leadMsg?.from_email)}
                    {count>1&&<div style={{position:'absolute',bottom:-2,right:-2,width:16,height:16,borderRadius:'50%',background:'var(--primary)',color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>{count}</div>}
                  </div>
                </div>
                <div style={{minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    {hasUnread&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--primary)',flexShrink:0,display:'inline-block'}}/>}
                    <span style={{fontWeight:hasUnread?700:500,fontSize:14,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{leadMsg?.from_name||leadMsg?.from_email}</span>
                    {tag&&<span style={{fontSize:11,padding:'1px 7px',borderRadius:10,background:tag.bg,color:tag.color,border:`1px solid ${tag.border}`,fontWeight:600,flexShrink:0}}>{tag.label}</span>}
                    {leadMsg?.replied===1&&<span style={{fontSize:11,flexShrink:0}}>✅</span>}
                  </div>
                  <div style={{fontSize:13,fontWeight:hasUnread?600:400,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2}}>
                    {(latest.subject||'(no subject)').replace(/^(Re:\s*)+/i,'')}
                  </div>
                  <div style={{fontSize:12,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {latestIsSent&&<span style={{color:'#3b82f6',fontWeight:600,marginRight:4}}>You:</span>}
                    {preview?preview.substring(0,100):''}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                  <span style={{fontSize:11,color:'var(--text3)',whiteSpace:'nowrap'}}>{timeAgo(latest.received_at)}</span>
                  {isAutoReplyMsg(latest)&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#f1f5f9',color:'#64748b',border:'1px solid #e2e8f0'}}>auto</span>}
                  <button onClick={e=>{e.stopPropagation();handleDelete({key,msgs,latest,count});}}
                    title="Delete thread"
                    style={{background:'none',border:'none',cursor:'pointer',color:'#fca5a5',padding:'2px',fontSize:13,lineHeight:1,display:'block'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#dc2626'}
                    onMouseLeave={e=>e.currentTarget.style.color='#fca5a5'}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
          <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafafa'}}>
            <span style={{fontSize:12,color:'var(--text3)'}}>
              {threads.length} conversation{threads.length!==1?'s':''}
              {filterTag && ` tagged ${TAG_MAP[filterTag]?.label}`}
              {unread>0&&` · ${unread} unread`}
            </span>
            <Pagination page={page} total={total} limit={50} onChange={setPage}/>
          </div>
        </div>
      )}
      {openThread&&(
        <>
          <div onClick={()=>setOpenThread(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',zIndex:999,backdropFilter:'blur(2px)'}}/>
          <ThreadPanel thread={openThread} onClose={()=>setOpenThread(null)} onUpdate={handleUpdate} onDelete={handleDelete}/>
        </>
      )}
      <SyncModal open={showSyncModal} onClose={()=>setShowSyncModal(false)} onSynced={load}/>
    </div>
  );
}
