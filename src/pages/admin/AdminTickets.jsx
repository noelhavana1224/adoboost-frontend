import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Textarea, Select } from '../../components/UI';
import { HelpCircle, MessageSquare } from 'lucide-react';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(null);
  const load = () => api.get('/admin/tickets').then(r=>setTickets(r.data)).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={`${tickets.filter(t=>t.status==='open').length} open tickets`} />
      {tickets.length===0 ? <Empty icon={HelpCircle} title="No tickets" description="No support tickets submitted yet." /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {tickets.map(t => (
            <Card key={t.id} style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:4 }}>
                    <h3 style={{ fontSize:14, fontWeight:700 }}>{t.subject}</h3>
                    <Badge color={t.status==='open'?'yellow':t.status==='resolved'?'green':'blue'}>{t.status}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>From: <strong>{t.user_name}</strong> ({t.user_email}) · {new Date(t.created_at).toLocaleString()}</div>
                </div>
                <Btn size="sm" onClick={()=>setReplying(t)}><MessageSquare size={12}/> Reply</Btn>
              </div>
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12, fontSize:13, color:'var(--text2)', marginBottom: t.admin_reply?10:0 }}>{t.message}</div>
              {t.admin_reply && <div style={{ background:'var(--primary-dim)', border:'1px solid #bee3f8', borderRadius:8, padding:12, fontSize:13 }}><strong>Your Reply:</strong> {t.admin_reply}</div>}
            </Card>
          ))}
        </div>
      )}
      <ReplyModal ticket={replying} onClose={()=>setReplying(null)} onSaved={()=>{setReplying(null);load();}} />
    </div>
  );
}

function ReplyModal({ ticket, onClose, onSaved }) {
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('in-progress');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (ticket) { setReply(ticket.admin_reply||''); setStatus(ticket.status||'open'); } }, [ticket]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.put(`/admin/tickets/${ticket.id}`, { status, admin_reply:reply }); toast.success('Reply saved'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={!!ticket} onClose={onClose} title={`Reply — ${ticket?.subject}`}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12, fontSize:13 }}>{ticket?.message}</div>
        <Select label="Status" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
        <Textarea label="Reply" value={reply} onChange={e=>setReply(e.target.value)} style={{ minHeight:120 }} required />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Send Reply</Btn>
        </div>
      </form>
    </Modal>
  );
}
