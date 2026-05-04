import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Textarea, Table, TR, TD } from '../components/UI';
import { Send, Plus, Play, Pause, Trash2, Edit2, BarChart2, X, Calendar } from 'lucide-react';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const pct = (n,d) => d>0?((n/d)*100).toFixed(1)+'%':'—';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCampaign, setEditCampaign] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    api.get('/campaigns').then(r=>setCampaigns(r.data)).finally(()=>setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (id) => {
    try { const { data } = await api.post(`/campaigns/${id}/launch`); toast.success(`Campaign launched! ${data.scheduled} emails scheduled.`); load(); }
    catch(err) { toast.error(err.response?.data?.error||'Launch failed'); }
  };
  const handlePause = async (id, status) => {
    try { await api.post(`/campaigns/${id}/${status==='active'?'pause':'resume'}`); toast.success(status==='active'?'Paused':'Resumed'); load(); }
    catch { toast.error('Failed'); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign and all its data?')) return;
    try { await api.delete(`/campaigns/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Manage your cold email campaigns"
        action={<Btn onClick={()=>setShowCreate(true)}><Plus size={14}/> Create New Campaign</Btn>} />

      {campaigns.length===0 ? (
        <Empty icon={Send} title="No campaigns yet" description="Create your first campaign to start sending cold emails."
          action={<Btn onClick={()=>setShowCreate(true)}><Plus size={14}/> Create Campaign</Btn>} />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <Table headers={['Campaign','Status','Sent','Opened','Clicked','Replied','Bounced','List','Actions']}>
            {campaigns.map(c => (
              <TR key={c.id}>
                <TD style={{ fontWeight:600, maxWidth:200 }}>
                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  {c.account_email && <div style={{ fontSize:11, color:'var(--text3)' }}>{c.account_email}</div>}
                </TD>
                <TD><Badge color={STATUS_COLOR[c.status]||'default'}>{c.status}</Badge></TD>
                <TD>{(c.sent_count||0).toLocaleString()}</TD>
                <TD style={{ color:'var(--cyan)' }}>{pct(c.opened_count, c.sent_count)}</TD>
                <TD style={{ color:'var(--green)' }}>{pct(c.clicked_count, c.sent_count)}</TD>
                <TD style={{ color:'var(--purple)' }}>{pct(c.replied_count, c.sent_count)}</TD>
                <TD style={{ color:'var(--red)' }}>{pct(c.bounced_count, c.sent_count)}</TD>
                <TD style={{ color:'var(--text2)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.list_name||'—'}</TD>
                <TD>
                  <div style={{ display:'flex', gap:4 }}>
                    {c.status==='draft' && <>
                      <Btn size="sm" variant="ghost" onClick={()=>setEditCampaign(c)} title="Edit"><Edit2 size={12}/></Btn>
                      <Btn size="sm" variant="success" onClick={()=>handleLaunch(c.id)} title="Launch"><Play size={12}/></Btn>
                    </>}
                    {c.status==='active' && <Btn size="sm" variant="secondary" onClick={()=>handlePause(c.id,'active')}><Pause size={12}/></Btn>}
                    {c.status==='paused' && <Btn size="sm" variant="success" onClick={()=>handlePause(c.id,'paused')}><Play size={12}/></Btn>}
                    <Btn size="sm" variant="danger" onClick={()=>handleDelete(c.id)}><Trash2 size={12}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      <CampaignModal open={showCreate||!!editCampaign} campaign={editCampaign}
        onClose={()=>{setShowCreate(false);setEditCampaign(null);}}
        onSaved={()=>{setShowCreate(false);setEditCampaign(null);load();}} />
    </div>
  );
}

function CampaignModal({ open, campaign, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', email_account_id:'', list_id:'', daily_limit:50, track_opens:true, track_clicks:true });
  const [sequences, setSequences] = useState([{ subject:'', body:'', delay_days:0, delay_hours:0 }]);
  const [accounts, setAccounts] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/email-accounts').then(r=>setAccounts(r.data));
    api.get('/contacts/lists').then(r=>setLists(r.data));
    if (campaign) {
      setForm({ name:campaign.name, email_account_id:campaign.email_account_id||'', list_id:campaign.list_id||'', daily_limit:campaign.daily_limit, track_opens:!!campaign.track_opens, track_clicks:!!campaign.track_clicks });
      api.get(`/campaigns/${campaign.id}`).then(r=>{ if (r.data.sequences?.length) setSequences(r.data.sequences); });
    } else {
      setForm({ name:'', email_account_id:'', list_id:'', daily_limit:50, track_opens:true, track_clicks:true });
      setSequences([{ subject:'', body:'', delay_days:0, delay_hours:0 }]);
    }
  }, [open, campaign]);

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sequences.some(s=>!s.subject||!s.body)) return toast.error('All steps need a subject and body');
    setLoading(true);
    try {
      campaign ? await api.put(`/campaigns/${campaign.id}`, {...form,sequences}) : await api.post('/campaigns', {...form,sequences});
      toast.success(campaign?'Campaign updated':'Campaign created');
      onSaved();
    } catch(err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setLoading(false); }
  };

  const VARS = ['{{first_name}}','{{last_name}}','{{company}}','{{email}}','{{title}}'];

  return (
    <Modal open={open} onClose={onClose} title={campaign?'Edit Campaign':'Create New Campaign'} width={700}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Input label="Campaign Name *" placeholder="e.g. Q2 Outreach — SaaS Founders" value={form.name} onChange={e=>f('name',e.target.value)} required />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Select label="Email Account" value={form.email_account_id} onChange={e=>f('email_account_id',e.target.value)}>
            <option value="">Select account...</option>
            {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.from_email})</option>)}
          </Select>
          <Select label="Contact List" value={form.list_id} onChange={e=>f('list_id',e.target.value)}>
            <option value="">Select list...</option>
            {lists.map(l=><option key={l.id} value={l.id}>{l.name} ({l.total_contacts||0})</option>)}
          </Select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <Input label="Daily Limit" type="number" min={1} max={1000} value={form.daily_limit} onChange={e=>f('daily_limit',+e.target.value)} />
          <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Track Opens</span>
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, cursor:'pointer' }}>
              <input type="checkbox" checked={form.track_opens} onChange={e=>f('track_opens',e.target.checked)} style={{ width:16,height:16,accentColor:'var(--primary)' }} />
              <span style={{ fontSize:13 }}>Enable</span>
            </label>
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Track Clicks</span>
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, cursor:'pointer' }}>
              <input type="checkbox" checked={form.track_clicks} onChange={e=>f('track_clicks',e.target.checked)} style={{ width:16,height:16,accentColor:'var(--primary)' }} />
              <span style={{ fontSize:13 }}>Enable</span>
            </label>
          </label>
        </div>

        <div style={{ background:'#ebf8ff', border:'1px solid #bee3f8', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--primary)', marginBottom:6 }}>Personalization Variables</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{VARS.map(v=><code key={v} style={{ fontSize:11, background:'#fff', padding:'2px 7px', borderRadius:4 }}>{v}</code>)}</div>
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <label style={{ fontSize:13, fontWeight:700 }}>Email Sequences ({sequences.length} step{sequences.length!==1?'s':''})</label>
            <Btn type="button" size="sm" variant="secondary" onClick={()=>setSequences(s=>[...s,{subject:'',body:'',delay_days:s.length>0?3:0,delay_hours:0}])}><Plus size={12}/> Add Follow-up</Btn>
          </div>
          {sequences.map((seq,i)=>(
            <div key={i} style={{ border:'1px solid var(--border2)', borderRadius:10, padding:14, marginBottom:10, background:'var(--bg3)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:i===0?'var(--primary)':'var(--orange)' }}>
                  {i===0?'📧 Initial Email':`🔄 Follow-up ${i}`}
                </span>
                {i>0&&<button type="button" onClick={()=>setSequences(s=>s.filter((_,idx)=>idx!==i))} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer' }}><X size={14}/></button>}
              </div>
              {i>0&&(
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <Input label="Delay (days)" type="number" min={0} value={seq.delay_days} onChange={e=>setSequences(s=>s.map((sq,idx)=>idx===i?{...sq,delay_days:+e.target.value}:sq))} />
                  <Input label="Delay (hours)" type="number" min={0} max={23} value={seq.delay_hours} onChange={e=>setSequences(s=>s.map((sq,idx)=>idx===i?{...sq,delay_hours:+e.target.value}:sq))} />
                </div>
              )}
              <Input label="Subject Line *" placeholder="Quick question about {{company}}" value={seq.subject} onChange={e=>setSequences(s=>s.map((sq,idx)=>idx===i?{...sq,subject:e.target.value}:sq))} containerStyle={{ marginBottom:10 }} />
              <Textarea label="Email Body (HTML supported)" placeholder={`Hi {{first_name}},\n\nI noticed {{company}} is...`} value={seq.body} onChange={e=>setSequences(s=>s.map((sq,idx)=>idx===i?{...sq,body:e.target.value}:sq))} style={{ minHeight:130 }} />
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{campaign?'Save Changes':'Create Campaign'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
