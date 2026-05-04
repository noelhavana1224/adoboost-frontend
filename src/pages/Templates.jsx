import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Textarea, Table, TR, TD } from '../components/UI';
import { FileText, Plus, Edit2, Trash2, Upload, Download } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { name:'Quick Introduction', subject:'Quick question about {{company}}', body:`Hi {{first_name}},\n\nI came across {{company}} and wanted to reach out.\n\nWe help businesses like yours [your value prop].\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\n[Your Name]`, category:'introduction' },
  { name:'Follow-up #1', subject:'Re: {{company}} — Following up', body:`Hi {{first_name}},\n\nJust wanted to follow up on my previous email.\n\nI know you're busy, but I wanted to make sure this didn't get lost.\n\n[Your value prop in 1 sentence]\n\nWorth a quick chat?\n\nBest,\n[Your Name]`, category:'follow-up' },
  { name:'Final Follow-up', subject:'Last note — {{company}}', body:`Hi {{first_name}},\n\nI'll keep this brief — this is my last follow-up.\n\nIf the timing isn't right, no worries at all. I'll check back in a few months.\n\nIf you are interested, I'm happy to schedule a quick call at your convenience.\n\nBest,\n[Your Name]`, category:'follow-up' },
];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    api.get('/templates').then(r=>setTemplates(r.data)).finally(()=>setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try { await api.delete(`/templates/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleGetDefaults = async () => {
    try {
      for (const t of DEFAULT_TEMPLATES) await api.post('/templates', t);
      toast.success('Default templates loaded!'); load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Templates" subtitle="Store and reuse email templates across campaigns"
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={handleGetDefaults}><Download size={13}/> Get Default Templates</Btn>
            <Btn onClick={()=>setShowAdd(true)}><Plus size={13}/> Add New Template</Btn>
          </div>
        }
      />
      {templates.length===0 ? (
        <Empty icon={FileText} title="No templates yet" description="Create reusable email templates to speed up campaign creation."
          action={<div style={{ display:'flex', gap:8, justifyContent:'center' }}><Btn variant="secondary" onClick={handleGetDefaults}>Get Default Templates</Btn><Btn onClick={()=>setShowAdd(true)}>Add Template</Btn></div>} />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <Table headers={['Name','Category','Subject Preview','Date','Actions']}>
            {templates.map(t => (
              <TR key={t.id}>
                <TD style={{ fontWeight:500 }}>{t.name}</TD>
                <TD><Badge color={t.category==='follow-up'?'blue':t.category==='introduction'?'green':'default'}>{t.category}</Badge></TD>
                <TD style={{ color:'var(--text2)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.subject||'—'}</TD>
                <TD style={{ color:'var(--text3)', whiteSpace:'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn size="sm" variant="secondary" onClick={()=>setEditing(t)}><Edit2 size={12}/> Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>handleDelete(t.id)}><Trash2 size={12}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}
      <TemplateModal open={showAdd||!!editing} template={editing} onClose={()=>{setShowAdd(false);setEditing(null);}} onSaved={()=>{setShowAdd(false);setEditing(null);load();}} />
    </div>
  );
}

function TemplateModal({ open, template, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', subject:'', body:'', category:'general' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (template) setForm({ name:template.name, subject:template.subject||'', body:template.body, category:template.category }); else setForm({ name:'', subject:'', body:'', category:'general' }); }, [template]);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      template ? await api.put(`/templates/${template.id}`, form) : await api.post('/templates', form);
      toast.success(template?'Template updated':'Template created'); onSaved();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  const VARS = ['{{first_name}}','{{last_name}}','{{company}}','{{email}}','{{title}}'];
  return (
    <Modal open={open} onClose={onClose} title={template?'Edit Template':'New Template'} width={660}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:10 }}>
          <Input label="Template Name" placeholder="e.g. Introduction Email" value={form.name} onChange={e=>f('name',e.target.value)} required />
          <Select label="Category" value={form.category} onChange={e=>f('category',e.target.value)}>
            <option value="general">General</option>
            <option value="introduction">Introduction</option>
            <option value="follow-up">Follow-up</option>
            <option value="closing">Closing</option>
          </Select>
        </div>
        <Input label="Subject Line" placeholder="Quick question about {{company}}" value={form.subject} onChange={e=>f('subject',e.target.value)} />
        <div style={{ background:'var(--primary-dim)', border:'1px solid #bee3f8', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--primary)', marginBottom:6 }}>Personalization Variables</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{VARS.map(v=><code key={v} style={{ fontSize:11, background:'#fff', padding:'2px 7px', borderRadius:4, color:'var(--text)' }}>{v}</code>)}</div>
        </div>
        <Textarea label="Email Body (HTML supported)" placeholder="Hi {{first_name}},..." value={form.body} onChange={e=>f('body',e.target.value)} style={{ minHeight:200 }} required />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{template?'Save Changes':'Create Template'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
