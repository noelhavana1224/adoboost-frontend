import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Textarea, Table, TR, TD } from '../components/UI';
import { Send, Plus, Play, Pause, Trash2, Edit2, Eye, X, BarChart2 } from 'lucide-react';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const pct = (n,d) => d>0?((n/d)*100).toFixed(1)+'%':'—';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCampaign, setEditCampaign] = useState(null);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    api.get('/campaigns').then(r=>setCampaigns(r.data)).finally(()=>setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (id) => {
    try {
      const { data } = await api.post(`/campaigns/${id}/launch`);
      toast.success(`Campaign launched! ${data.scheduled} emails scheduled.`);
      load();
    } catch(err) { toast.error(err.response?.data?.error||'Launch failed'); }
  };

  const handlePause = async (id, status) => {
    try {
      await api.post(`/campaigns/${id}/${status==='active'?'pause':'resume'}`);
      toast.success(status==='active'?'Campaign paused':'Campaign resumed');
      load();
    } catch { toast.error('Failed'); }
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
                <TD>
                  <div style={{ fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
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
                    {/* View button - always available */}
                    <Btn size="sm" variant="ghost" onClick={()=>setViewCampaign(c)} title="View"><Eye size={12}/></Btn>
                    {/* Edit - only for draft/paused */}
                    {(c.status==='draft'||c.status==='paused') && (
                      <Btn size="sm" variant="ghost" onClick={()=>setEditCampaign(c)} title="Edit"><Edit2 size={12}/></Btn>
                    )}
                    {/* Launch - only draft */}
                    {c.status==='draft' && (
                      <Btn size="sm" variant="success" onClick={()=>handleLaunch(c.id)} title="Launch"><Play size={12}/></Btn>
                    )}
                    {/* Pause/Resume */}
                    {c.status==='active' && (
                      <Btn size="sm" variant="secondary" onClick={()=>handlePause(c.id,'active')} title="Pause"><Pause size={12}/></Btn>
                    )}
                    {c.status==='paused' && (
                      <Btn size="sm" variant="success" onClick={()=>handlePause(c.id,'paused')} title="Resume"><Play size={12}/></Btn>
                    )}
                    <Btn size="sm" variant="danger" onClick={()=>handleDelete(c.id)} title="Delete"><Trash2 size={12}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      {/* View Campaign Modal */}
      <ViewCampaignModal campaign={viewCampaign} onClose={()=>setViewCampaign(null)} />

      {/* Create/Edit Modal */}
      <CampaignModal
        open={showCreate||!!editCampaign}
        campaign={editCampaign}
        onClose={()=>{setShowCreate(false);setEditCampaign(null);}}
        onSaved={()=>{setShowCreate(false);setEditCampaign(null);load();}}
      />
    </div>
  );
}

function ViewCampaignModal({ campaign, onClose }) {
  const [data, setData] = useState(null);
  const [sends, setSends] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!campaign) return;
    api.get(`/campaigns/${campaign.id}`).then(r=>setData(r.data));
    api.get(`/campaigns/${campaign.id}/sends`).then(r=>setSends(r.data));
  }, [campaign]);

  if (!campaign) return null;

  const pct = (n,d) => d>0?((n/d)*100).toFixed(1)+'%':'0%';
  const sent = campaign.sent_count||0;

  return (
    <Modal open={!!campaign} onClose={onClose} title={`Campaign: ${campaign.name}`} width={720}>
      <div style={{ display:'flex', gap:8, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:12 }}>
        {['overview','sends'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${tab===t?'var(--primary)':'var(--border2)'}`, background:tab===t?'var(--primary-dim)':'#fff', color:tab===t?'var(--primary)':'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:tab===t?600:400, textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            {[['Sent',sent,'var(--primary)'],['Opened',pct(campaign.opened_count,sent),'var(--cyan)'],['Clicked',pct(campaign.clicked_count,sent),'var(--green)'],['Replied',pct(campaign.replied_count,sent),'var(--purple)'],['Bounced',pct(campaign.bounced_count,sent),'var(--red)']].map(([l,v,c])=>(
              <div key={l} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'12px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Status',<Badge color={STATUS_COLOR[campaign.status]||'default'}>{campaign.status}</Badge>],['List',campaign.list_name||'—'],['Email Account',campaign.account_email||'—'],['Daily Limit',campaign.daily_limit],['Created',new Date(campaign.created_at).toLocaleDateString()],['Started',campaign.started_at?new Date(campaign.started_at).toLocaleDateString():'Not started']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--bg3)', borderRadius:6, fontSize:13 }}>
                <span style={{ color:'var(--text2)' }}>{k}</span>
                <span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
          {data?.sequences?.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Email Sequences ({data.sequences.length})</div>
              {data.sequences.map((s,i)=>(
                <div key={s.id} style={{ border:'1px solid var(--border)', borderRadius:8, padding:12, marginBottom:8, background:'var(--bg3)' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--primary)', marginBottom:4 }}>Step {s.step_number}: {s.subject}</div>
                  {i>0 && <div style={{ fontSize:11, color:'var(--text3)' }}>Delay: {s.delay_days}d {s.delay_hours}h after previous</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==='sends' && (
        <div style={{ maxHeight:400, overflowY:'auto' }}>
          {sends.length===0 ? <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>No sends yet</div> : (
            <Table headers={['Email','Step','Status','Scheduled','Sent','Opened']}>
              {sends.map(s=>(
                <TR key={s.id}>
                  <TD style={{ fontSize:12 }}>{s.email}</TD>
                  <TD style={{ fontSize:12 }}>#{s.step_number}</TD>
                  <TD><Badge color={s.status==='sent'?'green':s.status==='failed'?'red':s.status==='pending'?'yellow':'default'} style={{ fontSize:10 }}>{s.status}</Badge></TD>
                  <TD style={{ fontSize:11, color:'var(--text3)' }}>{s.scheduled_at?new Date(s.scheduled_at).toLocaleString():'—'}</TD>
                  <TD style={{ fontSize:11, color:'var(--text3)' }}>{s.sent_at?new Date(s.sent_at).toLocaleString():'—'}</TD>
                  <TD style={{ fontSize:12 }}>{s.opened_at?'✅':'—'}</TD>
                </TR>
              ))}
            </Table>
          )}
        </div>
      )}
    </Modal>
  );
}

function CampaignModal({ open, campaign, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', email_account_id:'', list_id:'', daily_limit:50, track_opens:true, track_clicks:true });
  const [sequences, setSequences] = useState([{ subject:'', body:'', delay_days:0, delay_hours:0 }]);
  const [accounts, setAccounts] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const isActive = campaign?.status === 'active';

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
    if (!isActive && sequences.some(s=>!s.subject||!s.body)) return toast.error('All steps need a subject and body');
    setLoading(true);
    try {
      campaign ? await api.put(`/campaigns/${campaign.id}`, {...form, sequences: isActive ? undefined : sequences})
                : await api.post('/campaigns', {...form, sequences});
      toast.success(campaign?'Campaign updated':'Campaign created');
      onSaved();
    } catch(err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setLoading(false); }
  };

  const VARS = ['{{first_name}}','{{last_name}}','{{company}}','{{email}}','{{title}}'];

  return (
    <Modal open={open} onClose={onClose} title={campaign?`Edit Campaign — ${campaign?.name}`:'Create New Campaign'} width={700}>
      {isActive && (
        <div style={{ background:'#fffff0', border:'1px solid #faf089', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#975a16' }}>
          ⚠️ This campaign is <strong>active</strong>. You can update the name and daily limit but sequences cannot be changed while running.
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Input label="Campaign Name *" value={form.name} onChange={e=>f('name',e.target.value)} required />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Select label="Email Account" value={form.email_account_id} onChange={e=>f('email_account_id',e.target.value)} disabled={isActive}>
            <option value="">Select account...</option>
            {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.from_email})</option>)}
          </Select>
          <Select label="Contact List" value={form.list_id} onChange={e=>f('list_id',e.target.value)} disabled={isActive}>
            <option value="">Select list...</option>
            {lists.map(l=><option key={l.id} value={l.id}>{l.name} ({l.total_contacts||0})</option>)}
          </Select>
        </div>
        <Input label="Daily Limit" type="number" min={1} max={1000} value={form.daily_limit} onChange={e=>f('daily_limit',+e.target.value)} />

        {!isActive && (
          <>
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
                  <Textarea label="Email Body" placeholder={`Hi {{first_name}},\n\nI noticed {{company}} is...`} value={seq.body} onChange={e=>setSequences(s=>s.map((sq,idx)=>idx===i?{...sq,body:e.target.value}:sq))} style={{ minHeight:130 }} />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{campaign?'Save Changes':'Create Campaign'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
