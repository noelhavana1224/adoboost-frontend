import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Table, TR, TD } from '../components/UI';
import { FileText, Plus, Edit2, Trash2, Download, Bold, Italic, Underline, List, ChevronDown } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { name:'Quick Introduction', subject:'Quick question about {{company}}', body:`Hi {{first_name}},\n\nI came across {{company}} and wanted to reach out.\n\nWe help businesses like yours [your value prop].\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\n[Your Name]`, category:'introduction' },
  { name:'Follow-up #1', subject:'Re: {{company}} — Following up', body:`Hi {{first_name}},\n\nJust wanted to follow up on my previous email.\n\nI know you're busy, but I wanted to make sure this didn't get lost.\n\n[Your value prop in 1 sentence]\n\nWorth a quick chat?\n\nBest,\n[Your Name]`, category:'follow-up' },
  { name:'Final Follow-up', subject:'Last note — {{company}}', body:`Hi {{first_name}},\n\nI'll keep this brief — this is my last follow-up.\n\nIf the timing isn't right, no worries at all. I'll check back in a few months.\n\nIf you are interested, I'm happy to schedule a quick call at your convenience.\n\nBest,\n[Your Name]`, category:'follow-up' },
];

// ── Personalization variables ─────────────────────
const VARS = [
  { label: 'First Name',  value: '{{first_name}}' },
  { label: 'Last Name',   value: '{{last_name}}' },
  { label: 'Full Name',   value: '{{full_name}}' },
  { label: 'Company',     value: '{{company}}' },
  { label: 'Email',       value: '{{email}}' },
  { label: 'Title/Role',  value: '{{title}}' },
  { label: 'Website',     value: '{{website}}' },
];

// ── Variable Dropdown ────────────────────────────
function VarsDropdown({ onInsert }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button type="button" onClick={() => setOpen(p=>!p)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:6, fontSize:12, color:'#2563eb', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
        {'{ }'} Add Variable <ChevronDown size={11}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }}/>
          <div style={{ position:'absolute', top:'110%', left:0, zIndex:100, background:'#fff', border:'1px solid var(--border2)', borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', minWidth:190, overflow:'hidden' }}>
            <div style={{ padding:'6px 10px', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid var(--border)' }}>Personalization Variables</div>
            {VARS.map(v => (
              <button key={v.value} type="button" onClick={() => { onInsert(v.value); setOpen(false); }}
                style={{ width:'100%', padding:'8px 12px', border:'none', background:'none', textAlign:'left', cursor:'pointer', fontSize:12, fontFamily:'inherit', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                <span>{v.label}</span>
                <code style={{ fontSize:10, background:'#f1f5f9', padding:'1px 5px', borderRadius:4, color:'#2563eb' }}>{v.value}</code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Subject Input with Variable Dropdown ─────────
function SubjectInput({ value, onChange }) {
  const inputRef = useRef(null);
  const insertVar = (variable) => {
    const el = inputRef.current;
    if (!el) { onChange(value + variable); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    const newVal = value.substring(0, start) + variable + value.substring(end);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
  };
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <label style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Subject Line</label>
        <VarsDropdown onInsert={insertVar} />
      </div>
      <input ref={inputRef} placeholder="Quick question about {{company}}" value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', color:'var(--text)', boxSizing:'border-box' }} />
    </div>
  );
}

// ── Rich Text Body Editor ────────────────────────
function RichBodyEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value ? value.replace(/\n/g, '<br>') : '';
      setInitialized(true);
    }
  }, [initialized]);

  const exec = (cmd, val = null) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); onChange(editorRef.current?.innerHTML || ''); };
  const insertVar = (v) => { editorRef.current?.focus(); document.execCommand('insertText', false, v); onChange(editorRef.current?.innerHTML || ''); };
  const insertLink = () => { const url = prompt('Enter URL:'); if (url) exec('createLink', url.startsWith('http') ? url : 'https://' + url); };
  const sep = () => <div style={{ width:1, height:18, background:'#d1d5db', margin:'0 4px', flexShrink:0 }}/>;

  const T = ({ title, onCmd, children }) => (
    <button type="button" title={title} onMouseDown={e => { e.preventDefault(); onCmd(); }}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 7px', borderRadius:5, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:'inherit', transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background='#f3f4f6'}
      onMouseLeave={e => e.currentTarget.style.background='none'}>
      {children}
    </button>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <label style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Email Body</label>
        <VarsDropdown onInsert={insertVar} />
      </div>
      <div style={{ border:'1.5px solid #d1d5db', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
        onFocusCapture={e => e.currentTarget.style.borderColor='#6366f1'}
        onBlurCapture={e => e.currentTarget.style.borderColor='#d1d5db'}>
        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', gap:2, padding:'6px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', flexWrap:'wrap' }}>
          <T title="Undo" onCmd={() => exec('undo')}>↩</T>
          <T title="Redo" onCmd={() => exec('redo')}>↪</T>
          {sep()}
          <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontName',e.target.value)} style={{ border:'1px solid #e5e7eb', background:'#fff', fontSize:12, cursor:'pointer', color:'#374151', outline:'none', fontFamily:'inherit', borderRadius:5, padding:'3px 6px' }}>
            <option value="sans-serif">Sans Serif</option><option value="serif">Serif</option><option value="monospace">Monospace</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Verdana">Verdana</option>
          </select>
          <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontSize',e.target.value)} style={{ border:'1px solid #e5e7eb', background:'#fff', fontSize:12, cursor:'pointer', color:'#374151', outline:'none', fontFamily:'inherit', borderRadius:5, padding:'3px 6px', width:52 }}>
            <option value="2">10</option><option value="3">12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option>
          </select>
          {sep()}
          <T title="Bold" onCmd={() => exec('bold')}><strong>B</strong></T>
          <T title="Italic" onCmd={() => exec('italic')}><em>I</em></T>
          <T title="Underline" onCmd={() => exec('underline')}><span style={{ textDecoration:'underline' }}>U</span></T>
          <T title="Strikethrough" onCmd={() => exec('strikeThrough')}><span style={{ textDecoration:'line-through' }}>S</span></T>
          {sep()}
          {/* Color pickers */}
          <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
            <button type="button" title="Font Color" onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:5, fontSize:13, color:'#374151', display:'flex', alignItems:'center' }}>
              <strong>A</strong>
              <input type="color" defaultValue="#000000" onChange={e=>exec('foreColor',e.target.value)} style={{ width:0, height:0, opacity:0, position:'absolute', pointerEvents:'none' }}/>
            </button>
          </div>
          <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
            <button type="button" title="Highlight" onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:5, fontSize:13, color:'#374151', display:'flex', alignItems:'center' }}>
              <span style={{ background:'#fef08a', padding:'0 3px', borderRadius:2, fontWeight:700 }}>A</span>
              <input type="color" defaultValue="#fef08a" onChange={e=>exec('hiliteColor',e.target.value)} style={{ width:0, height:0, opacity:0, position:'absolute', pointerEvents:'none' }}/>
            </button>
          </div>
          {sep()}
          <T title="Align Left" onCmd={() => exec('justifyLeft')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          </T>
          <T title="Align Center" onCmd={() => exec('justifyCenter')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </T>
          <T title="Align Right" onCmd={() => exec('justifyRight')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
          </T>
          {sep()}
          <T title="Bullet List" onCmd={() => exec('insertUnorderedList')}>
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
        {/* Editable area */}
        <div ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={() => onChange(editorRef.current?.innerHTML || '')}
          data-placeholder={placeholder || 'Hi {{first_name}},\n\nI noticed {{company}} is...'}
          style={{ minHeight:200, padding:'12px 16px', fontSize:13, lineHeight:1.8, color:'#111827', outline:'none', wordBreak:'break-word' }}
        />
      </div>
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none;white-space:pre}[contenteditable] a{color:#4f46e5;text-decoration:underline}[contenteditable] ul{padding-left:20px}[contenteditable] ol{padding-left:20px}`}</style>
    </div>
  );
}

// ── Main Templates Page ──────────────────────────
export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);
  const [showAdd, setShowAdd]     = useState(false);

  const load = useCallback(() => {
    api.get('/templates').then(r => setTemplates(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try { await api.delete(`/templates/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleGetDefaults = async () => {
    try { for (const t of DEFAULT_TEMPLATES) await api.post('/templates', t); toast.success('Default templates loaded!'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Templates" subtitle="Store and reuse email templates across campaigns"
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={handleGetDefaults}><Download size={13}/> Get Defaults</Btn>
            <Btn onClick={() => setShowAdd(true)}><Plus size={13}/> New Template</Btn>
          </div>
        }
      />
      {templates.length === 0 ? (
        <Empty icon={FileText} title="No templates yet" description="Create reusable email templates to speed up campaign creation."
          action={<div style={{ display:'flex', gap:8, justifyContent:'center' }}><Btn variant="secondary" onClick={handleGetDefaults}>Get Defaults</Btn><Btn onClick={() => setShowAdd(true)}>Add Template</Btn></div>} />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <Table headers={['Name','Category','Subject Preview','Date','Actions']}>
            {templates.map(t => (
              <TR key={t.id}>
                <TD style={{ fontWeight:600 }}>{t.name}</TD>
                <TD><Badge color={t.category==='follow-up'?'blue':t.category==='introduction'?'green':'default'}>{t.category}</Badge></TD>
                <TD style={{ color:'var(--text2)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.subject||'—'}</TD>
                <TD style={{ color:'var(--text3)', whiteSpace:'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</TD>
                <TD>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => setEditing(t)}><Edit2 size={12}/> Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(t.id)}><Trash2 size={12}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}
      <TemplateModal open={showAdd || !!editing} template={editing}
        onClose={() => { setShowAdd(false); setEditing(null); }}
        onSaved={() => { setShowAdd(false); setEditing(null); load(); }} />
    </div>
  );
}

// ── Template Modal ───────────────────────────────
function TemplateModal({ open, template, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', subject:'', body:'', category:'general' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) setForm({ name:template.name, subject:template.subject||'', body:template.body, category:template.category });
    else setForm({ name:'', subject:'', body:'', category:'general' });
  }, [template, open]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      // Convert HTML body to plain text + HTML
      const body = form.body;
      template ? await api.put(`/templates/${template.id}`, { ...form, body }) : await api.post('/templates', { ...form, body });
      toast.success(template ? 'Template updated' : 'Template created');
      onSaved();
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Edit Template' : 'New Template'} width={720}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:10 }}>
          <Input label="Template Name *" placeholder="e.g. Introduction Email" value={form.name} onChange={e => f('name', e.target.value)} required />
          <Select label="Category" value={form.category} onChange={e => f('category', e.target.value)}>
            <option value="general">General</option>
            <option value="introduction">Introduction</option>
            <option value="follow-up">Follow-up</option>
            <option value="closing">Closing</option>
          </Select>
        </div>

        {/* Subject with variable dropdown */}
        <SubjectInput value={form.subject} onChange={val => f('subject', val)} />

        {/* Rich body editor with variable dropdown */}
        <RichBodyEditor
          value={form.body}
          onChange={val => f('body', val)}
          placeholder={'Hi {{first_name}},\n\nI noticed {{company}} is...'}
        />

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{template ? 'Save Changes' : 'Create Template'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
