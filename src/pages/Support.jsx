import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Card, Btn, Input, Textarea, PageHeader, Badge, Table, TR, TD } from '../components/UI';
import { HelpCircle, Send, CheckCircle } from 'lucide-react';

export default function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(() => {
    if (user) setForm(p=>({...p, name:user.name||'', email:user.email||''}));
    api.get('/tickets').then(r=>setTickets(r.data)).catch(()=>{});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/tickets', form);
      toast.success('Ticket submitted! We\'ll get back to you within 24 hours.');
      setSubmitted(true);
      setForm(p=>({...p, subject:'', message:'', phone:''}));
      api.get('/tickets').then(r=>setTickets(r.data));
    } catch { toast.error('Failed to submit'); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Support" subtitle="We're here to help — typically respond within 24 hours" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card style={{ padding:24 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Submit a Ticket</h3>
          <p style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>Describe your issue and our team will get back to you. You can also email us at <strong>support@adoboost.com</strong></p>
          {submitted && (
            <div style={{ background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:8, padding:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={16} color="var(--green)" />
              <span style={{ fontSize:13, color:'var(--green)' }}>Ticket submitted successfully!</span>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Input label="Name *" value={form.name} onChange={e=>f('name',e.target.value)} required />
              <Input label="Email *" type="email" value={form.email} onChange={e=>f('email',e.target.value)} required />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Input label="Subject *" value={form.subject} onChange={e=>f('subject',e.target.value)} required />
              <Input label="Phone" value={form.phone} onChange={e=>f('phone',e.target.value)} />
            </div>
            <Textarea label="Message *" placeholder="Describe your issue in detail..." value={form.message} onChange={e=>f('message',e.target.value)} style={{ minHeight:140 }} required />
            <p style={{ fontSize:12, color:'var(--text3)' }}>Our support team responds within 24 hours. You may also reach out via chat.</p>
            <Btn type="submit" loading={loading} style={{ alignSelf:'flex-end' }}><Send size={13}/> Send Ticket</Btn>
          </form>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card style={{ padding:24 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>My Tickets</h3>
            {tickets.length===0 ? (
              <p style={{ color:'var(--text3)', fontSize:13 }}>No tickets submitted yet.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {tickets.map(t => (
                  <div key={t.id} style={{ padding:'12px 14px', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg3)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>{t.subject}</span>
                      <Badge color={t.status==='open'?'yellow':t.status==='resolved'?'green':'blue'}>{t.status}</Badge>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{new Date(t.created_at).toLocaleString()}</div>
                    {t.admin_reply && <div style={{ marginTop:8, fontSize:12, color:'var(--primary)', background:'var(--primary-dim)', padding:'8px 10px', borderRadius:6 }}>Reply: {t.admin_reply}</div>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding:24 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Quick Help</h3>
            {[
              ['How to connect Gmail?','Go to Email Accounts → Connect → Select Gmail → Use App Password'],
              ['How to import contacts?','Go to Contacts → Import CSV → Upload file with email column'],
              ['Campaign not sending?','Check SMTP account is connected and test connection passes'],
              ['How to track replies?','Replies appear in Messages → Inbox after contacts respond'],
            ].map(([q,a]) => (
              <div key={q} style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{q}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>{a}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
