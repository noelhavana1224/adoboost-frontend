import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { PageHeader, Card, Badge, Spinner, Empty, Table, TR, TD, Pagination, Tabs } from '../components/UI';
import { MessageSquare, Search } from 'lucide-react';

const STATUS_COLOR = { engaging:'green', unsubscribe:'red', 'auto-reply':'blue' };

export default function Messages({ type='inbox' }) {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type==='inbox' ? '/messages/inbox' : '/messages/auto-replies';
      const { data } = await api.get(endpoint, { params:{ search:search||undefined, page, limit:20 } });
      setMessages(data.messages); setTotal(data.total);
    } finally { setLoading(false); }
  }, [type, search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Messages" subtitle={type==='inbox'?'Track replies from your campaigns':'View auto-reply responses'} />
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border)', marginBottom:20 }}>
        {[{label:'Inbox',path:'/messages/inbox'},{label:'Auto-replies',path:'/messages/auto-replies'}].map(t=>(
          <a key={t.path} href={t.path} style={{ padding:'10px 18px', borderBottom:`2px solid ${window.location.pathname===t.path?'var(--primary)':'transparent'}`, marginBottom:-2, color:window.location.pathname===t.path?'var(--primary)':'var(--text2)', fontWeight:window.location.pathname===t.path?600:400, fontSize:14, textDecoration:'none', transition:'all 0.15s' }}>{t.label}</a>
        ))}
      </div>
      <div style={{ position:'relative', marginBottom:16 }}>
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
        <input placeholder="Search messages..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
          style={{ width:'100%', maxWidth:380, background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:14, outline:'none' }} />
      </div>
      {loading ? <Spinner /> : messages.length===0 ? (
        <Empty icon={MessageSquare} title={type==='inbox'?'No messages yet':'No auto-replies yet'} description="Replies from your campaigns will appear here." />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <Table headers={type==='inbox'?['Name','Email','Subject','Campaign','Date','Status']:['Name','Email','Subject','Campaign','Date','Status','Automation','Resume Date']}>
            {messages.map(m => (
              <TR key={m.id}>
                <TD style={{ fontWeight:500 }}>{m.from_name||'—'}</TD>
                <TD style={{ color:'var(--text2)' }}>{m.from_email}</TD>
                <TD style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.subject||'—'}</TD>
                <TD style={{ color:'var(--text2)' }}>{m.campaign_name||'...'}</TD>
                <TD style={{ color:'var(--text3)', whiteSpace:'nowrap' }}>{new Date(m.received_at).toLocaleDateString()}</TD>
                <TD><Badge color={STATUS_COLOR[m.status]||'default'}>{m.status}</Badge></TD>
                {type==='auto-replies' && <><TD><Badge color={m.automation_status==='running'?'green':'yellow'}>{m.automation_status}</Badge></TD><TD style={{ color:'var(--text3)' }}>—</TD></>}
              </TR>
            ))}
          </Table>
          <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
