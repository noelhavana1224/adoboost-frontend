import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Table, TR, TD } from '../components/UI';
import { Send, Plus, Play, Pause, Trash2, Edit2, Eye, X, Copy, ChevronDown, Sparkles, Shield } from 'lucide-react';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const pct = (n,d) => d>0?((n/d)*100).toFixed(1)+'%':'—';

// ── Personalization variables ────────────────────
const VARS = [
  { label: 'First Name',  value: '{{first_name}}' },
  { label: 'Last Name',   value: '{{last_name}}' },
  { label: 'Full Name',   value: '{{full_name}}' },
  { label: 'Company',     value: '{{company}}' },
  { label: 'Email',       value: '{{email}}' },
  { label: 'Title/Role',  value: '{{title}}' },
  { label: 'Website',     value: '{{website}}' },
  { label: 'Signature',   value: '{{signature}}' },
  { label: 'From Name',   value: '{{from_name}}' },
  { label: 'From Email',  value: '{{from_email}}' },
];

// ── Personalization Dropdown ─────────────────────
function VarsDropdown({ onInsert, label = 'Insert Variable' }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen(p => !p)} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6,
        fontSize: 12, color: '#2563eb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>
        {'{ }'} {label} <ChevronDown size={11}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }}/>
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 100,
            background: '#fff', border: '1px solid var(--border2)', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden',
          }}>
            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
              Personalization Variables
            </div>
            {VARS.map(v => (
              <button key={v.value} type="button" onClick={() => { onInsert(v.value); setOpen(false); }} style={{
                width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ color: 'var(--text)' }}>{v.label}</span>
                <code style={{ fontSize: 10, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, color: '#2563eb' }}>{v.value}</code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── AI Credits Bar ───────────────────────────────
function AICreditsBar({ refreshKey }) {
  const [credits, setCredits] = useState(null);
  useEffect(() => {
    api.get('/ai/credits').then(r => setCredits(r.data)).catch(() => {});
  }, [refreshKey]);
  if (!credits) return null;
  const remaining = credits.remaining ?? 0;
  const limit     = credits.limit ?? 1;
  const pctLeft   = Math.round((remaining / limit) * 100);
  const barColor  = pctLeft > 40 ? '#16a34a' : pctLeft > 15 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, marginBottom:10 }}>
      <Sparkles size={13} color="#6366f1"/>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontWeight:600, color:'#374151' }}>AI Credits</span>
          <span style={{ color: barColor }}>
            <strong>{remaining}</strong> / {limit} remaining
          </span>
        </div>
        <div style={{ height:4, background:'#e5e7eb', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pctLeft}%`, background: barColor, borderRadius:2, transition:'width 0.3s' }}/>
        </div>
      </div>
      <span style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600, whiteSpace:'nowrap' }}>
        {credits.plan}
      </span>
    </div>
  );
}

// ── Subject Line Input with AI + Variable Dropdown ─
function SubjectInput({ value, onChange, emailBody = '', onCreditUsed }) {
  const inputRef     = useRef(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiLines,    setAiLines]    = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const insertVar = (variable) => {
    const el = inputRef.current;
    if (!el) { onChange(value + variable); return; }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const newVal = value.substring(0, start) + variable + value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const generateSubjects = async () => {
    const cleanBody = (emailBody || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanBody) { toast.error('Write your email body first, then generate subject lines.'); return; }
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/subject-lines', { body: cleanBody });
      setAiLines(data.lines || []);
      setShowPicker(true);
      onCreditUsed?.();
    } catch (e) {
      if (e.response?.status === 402) toast.error(e.response.data.error || 'AI credits exhausted. Upgrade your plan.');
      else toast.error('AI unavailable — check OPENAI_API_KEY in backend .env');
    } finally { setAiLoading(false); }
  };

  return (
    <div style={{ position:'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Subject Line *</label>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button type="button" onClick={generateSubjects} disabled={aiLoading} style={{
            display:'flex', alignItems:'center', gap:5, padding:'4px 10px',
            background: aiLoading ? '#f1f5f9' : '#f5f3ff', border:'1px solid #c4b5fd',
            borderRadius:6, fontSize:12, color:'#7c3aed', cursor: aiLoading ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', fontWeight:600, opacity: aiLoading ? 0.7 : 1,
          }}>
            <Sparkles size={11}/>{aiLoading ? 'Generating…' : 'AI Subjects'}
          </button>
          <VarsDropdown onInsert={insertVar} label="Add Variable" />
        </div>
      </div>
      <input
        ref={inputRef}
        placeholder="Quick question about {{company}}"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
      />
      {/* AI Subject Picker popover */}
      {showPicker && aiLines.length > 0 && (
        <>
          <div onClick={() => setShowPicker(false)} style={{ position:'fixed', inset:0, zIndex:199 }}/>
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200, background:'#fff', border:'1px solid #c4b5fd', borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.15)', overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed', display:'flex', alignItems:'center', gap:5 }}>
                <Sparkles size={11}/>AI-Generated Subject Lines — click to use
              </span>
              <button type="button" onClick={() => setShowPicker(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', lineHeight:1 }}><X size={13}/></button>
            </div>
            {aiLines.map((line, idx) => (
              <button key={idx} type="button" onClick={() => { onChange(line); setShowPicker(false); }}
                style={{ width:'100%', padding:'9px 14px', border:'none', borderBottom:'1px solid var(--border)', background:'#fff', textAlign:'left', cursor:'pointer', fontSize:13, fontFamily:'inherit', color:'var(--text)' }}
                onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                {line}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Rich Text Editor for Email Body ─────────────
function RichBodyEditor({ value, onChange, placeholder, subject = '', onCreditUsed }) {
  const editorRef    = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // ── AI Rewrite state ──
  const [rewriteOpen,    setRewriteOpen]    = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewritePreview, setRewritePreview] = useState(null); // { tone, text }

  // ── AI Spam Score state ──
  const [spamLoading, setSpamLoading] = useState(false);
  const [spamResult,  setSpamResult]  = useState(null);

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value ? value.replace(/\n/g, '<br>') : '';
      setInitialized(true);
    }
  }, [initialized]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  };

  const insertVar = (variable) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, variable);
    onChange(editorRef.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url.startsWith('http') ? url : 'https://' + url);
  };

  // Apply AI rewrite to editor
  const applyRewrite = (text) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = text.replace(/\n/g, '<br>');
    }
    onChange(text);
    setRewritePreview(null);
    setRewriteOpen(false);
  };

  const handleRewrite = async (tone) => {
    const cleanBody = editorRef.current?.innerText?.trim() || '';
    if (!cleanBody) { toast.error('Email body is empty — write your email first.'); return; }
    setRewriteLoading(true);
    setRewriteOpen(false);
    try {
      const { data } = await api.post('/ai/rewrite', { body: cleanBody, tone });
      setRewritePreview({ tone, text: data.rewritten });
      onCreditUsed?.();
    } catch (e) {
      if (e.response?.status === 402) toast.error(e.response.data.error || 'AI credits exhausted.');
      else toast.error('AI rewrite failed — check OPENAI_API_KEY');
    } finally { setRewriteLoading(false); }
  };

  const handleSpamScore = async () => {
    const cleanBody = editorRef.current?.innerHTML || '';
    if (!cleanBody.replace(/<[^>]*>/g,'').trim()) { toast.error('Email body is empty.'); return; }
    setSpamLoading(true);
    setSpamResult(null);
    try {
      const { data } = await api.post('/ai/spam-score', { subject, body: cleanBody });
      setSpamResult(data);
      onCreditUsed?.();
    } catch (e) {
      if (e.response?.status === 402) toast.error(e.response.data.error || 'AI credits exhausted.');
      else toast.error('Spam check failed — check OPENAI_API_KEY');
    } finally { setSpamLoading(false); }
  };

  const GRADES = { A:'#16a34a', B:'#2563eb', C:'#d97706', D:'#ea580c', F:'#dc2626' };
  const TONES  = [
    { key:'human',        label:'More Human',        desc:'Remove corporate language' },
    { key:'shorter',      label:'Make Shorter',      desc:'2-3 sentences max' },
    { key:'professional', label:'More Professional', desc:'Polished, not stiff' },
    { key:'softer_cta',   label:'Softer CTA',        desc:'Less pushy ask' },
  ];

  const sep = () => <div style={{ width: 1, height: 18, background: '#d1d5db', margin: '0 4px', flexShrink: 0 }}/>;

  const T = ({ title, onCmd, children, active }) => (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); onCmd(); }}
      style={{ background: active ? '#e0e7ff' : 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: 5, color: active ? '#4f46e5' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'inherit', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}>
      {children}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Email Body</label>
        <VarsDropdown onInsert={insertVar} label="Add Variable" />
      </div>
      <div style={{ border: '1.5px solid #d1d5db', borderRadius: 10, overflow: 'visible', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onFocusCapture={e => { const el = e.currentTarget.querySelector('[contenteditable]'); if (el && e.target === el) e.currentTarget.style.borderColor = '#6366f1'; }}
        onBlurCapture={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap', borderRadius: '10px 10px 0 0' }}>

          {/* Undo / Redo */}
          <T title="Undo" onCmd={() => exec('undo')}>↩</T>
          <T title="Redo" onCmd={() => exec('redo')}>↪</T>
          {sep()}

          {/* Font family */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => exec('fontName', e.target.value)}
            style={{ border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151', outline: 'none', fontFamily: 'inherit', borderRadius: 5, padding: '3px 6px' }}>
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Tahoma">Tahoma</option>
          </select>

          {/* Font size */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => exec('fontSize', e.target.value)}
            style={{ border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151', outline: 'none', fontFamily: 'inherit', borderRadius: 5, padding: '3px 6px', width: 52 }}>
            <option value="1">8</option>
            <option value="2">10</option>
            <option value="3" defaultValue>12</option>
            <option value="4">14</option>
            <option value="5">18</option>
            <option value="6">24</option>
            <option value="7">36</option>
          </select>
          {sep()}

          {/* Bold Italic Underline Strikethrough */}
          <T title="Bold (Ctrl+B)" onCmd={() => exec('bold')}><strong>B</strong></T>
          <T title="Italic (Ctrl+I)" onCmd={() => exec('italic')}><em style={{ fontStyle: 'italic' }}>I</em></T>
          <T title="Underline (Ctrl+U)" onCmd={() => exec('underline')}><span style={{ textDecoration: 'underline' }}>U</span></T>
          <T title="Strikethrough" onCmd={() => exec('strikeThrough')}><span style={{ textDecoration: 'line-through' }}>S</span></T>
          {sep()}

          {/* Font color */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button type="button" title="Font Color"
              onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 5, fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontWeight: 700 }}>A</span>
              <input type="color" defaultValue="#000000"
                onChange={e => exec('foreColor', e.target.value)}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }} />
            </button>
          </div>

          {/* Highlight color */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button type="button" title="Highlight Color"
              onMouseDown={e => { e.preventDefault(); e.currentTarget.querySelector('input').click(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 5, fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ background: '#fef08a', padding: '0 3px', borderRadius: 2, fontWeight: 700 }}>A</span>
              <input type="color" defaultValue="#fef08a"
                onChange={e => exec('hiliteColor', e.target.value)}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }} />
            </button>
          </div>
          {sep()}

          {/* Alignment */}
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

          {/* Lists */}
          <T title="Bullet List" onCmd={() => exec('insertUnorderedList')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
          </T>
          <T title="Numbered List" onCmd={() => exec('insertOrderedList')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">3.</text></svg>
          </T>
          {sep()}

          {/* Indent */}
          <T title="Indent" onCmd={() => exec('indent')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><polyline points="9 12 13 12"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="3 9 6 12 3 15"/></svg>
          </T>
          <T title="Outdent" onCmd={() => exec('outdent')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="15 9 12 12 15 15"/></svg>
          </T>
          {sep()}

          {/* Link */}
          <T title="Insert Link" onCmd={insertLink}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </T>

          {/* Remove formatting */}
          <T title="Clear Formatting" onCmd={() => exec('removeFormat')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3H7l-4 9h4l-2 9 12-12h-4l4-6z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
          </T>

          {sep()}

          {/* ── AI: Rewrite button ── */}
          <div style={{ position:'relative' }}>
            <button type="button"
              onMouseDown={e => { e.preventDefault(); if (!rewriteLoading) setRewriteOpen(p => !p); }}
              disabled={rewriteLoading}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background: rewriteOpen?'#f5f3ff':'none', border:`1px solid ${rewriteOpen?'#c4b5fd':'transparent'}`, borderRadius:6, cursor: rewriteLoading?'not-allowed':'pointer', color:'#7c3aed', fontSize:12, fontFamily:'inherit', fontWeight:600, opacity: rewriteLoading?0.6:1 }}
              title="AI Rewrite">
              <Sparkles size={11}/>{rewriteLoading ? 'Rewriting…' : 'Rewrite'}
            </button>
            {rewriteOpen && (
              <>
                <div onMouseDown={() => setRewriteOpen(false)} style={{ position:'fixed', inset:0, zIndex:299 }}/>
                <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:300, background:'#fff', border:'1px solid #c4b5fd', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.14)', width:210, overflow:'hidden' }}>
                  <div style={{ padding:'7px 11px', borderBottom:'1px solid var(--border)', background:'#f5f3ff' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed' }}>Choose rewrite style</span>
                  </div>
                  {TONES.map(t => (
                    <button key={t.key} type="button"
                      onMouseDown={e => { e.preventDefault(); handleRewrite(t.key); }}
                      style={{ width:'100%', padding:'8px 12px', border:'none', borderBottom:'1px solid var(--border)', background:'#fff', textAlign:'left', cursor:'pointer', fontFamily:'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{t.label}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── AI: Spam Score button ── */}
          <button type="button"
            onMouseDown={e => { e.preventDefault(); handleSpamScore(); }}
            disabled={spamLoading}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'none', border:'1px solid transparent', borderRadius:6, cursor: spamLoading?'not-allowed':'pointer', color:'#059669', fontSize:12, fontFamily:'inherit', fontWeight:600, opacity: spamLoading?0.6:1 }}
            title="Check spam score">
            <Shield size={11}/>{spamLoading ? 'Checking…' : 'Spam Score'}
          </button>
        </div>

        {/* ── AI Rewrite Preview ── */}
        {rewritePreview && (
          <div style={{ padding:'12px 14px', borderBottom:'1px solid #c4b5fd', background:'#f5f3ff' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#7c3aed', display:'flex', alignItems:'center', gap:5 }}>
                <Sparkles size={12}/>AI Rewrite Preview
              </span>
              <div style={{ display:'flex', gap:6 }}>
                <button type="button" onClick={() => applyRewrite(rewritePreview.text)}
                  style={{ padding:'4px 10px', background:'#7c3aed', border:'none', borderRadius:5, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                  ✓ Accept
                </button>
                <button type="button" onClick={() => setRewritePreview(null)}
                  style={{ padding:'4px 10px', background:'#fff', border:'1px solid #c4b5fd', borderRadius:5, color:'#7c3aed', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✗ Discard
                </button>
              </div>
            </div>
            <div style={{ fontSize:13, color:'#374151', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:180, overflowY:'auto', background:'#fff', padding:'10px 12px', borderRadius:6, border:'1px solid #e9d5ff' }}>
              {rewritePreview.text}
            </div>
          </div>
        )}

        {/* Editable content area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(editorRef.current?.innerHTML || '')}
          data-placeholder={placeholder || 'Hi {{first_name}},\n\nI noticed {{company}} is...'}
          style={{ minHeight: 160, padding: '12px 16px', fontSize: 13, lineHeight: 1.8, color: '#111827', outline: 'none', wordBreak: 'break-word' }}
        />
      </div>

      {/* ── Spam Score Panel ── */}
      {spamResult && (() => {
        const gradeColor = GRADES[spamResult.grade] || '#374151';
        const verdictIcon = spamResult.verdict === 'inbox' ? '✅' : spamResult.verdict === 'promotions' ? '📁' : '🚫';
        return (
          <div style={{ marginTop:8, border:'1px solid #d1fae5', borderRadius:10, overflow:'hidden', fontSize:13 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f0fdf4', borderBottom:'1px solid #d1fae5' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:`2.5px solid ${gradeColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:gradeColor, flexShrink:0 }}>
                {spamResult.grade}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#111827' }}>
                  Spam Score: {spamResult.score}/100 &nbsp;{verdictIcon} <span style={{ fontWeight:400, color:'#6b7280', textTransform:'capitalize' }}>{spamResult.verdict}</span>
                </div>
                <div style={{ fontSize:12, color:'#374151', marginTop:1 }}>{spamResult.summary}</div>
              </div>
              <button type="button" onClick={() => setSpamResult(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={14}/></button>
            </div>
            {spamResult.issues?.length > 0 && (
              <div style={{ padding:'10px 14px', background:'#fff' }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#374151', marginBottom:8 }}>Issues Found:</div>
                {spamResult.issues.map((issue, idx) => (
                  <div key={idx} style={{ marginBottom:8, paddingBottom:8, borderBottom: idx < spamResult.issues.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                      <span style={{ fontSize:11, padding:'2px 7px', borderRadius:10, background:'#fee2e2', color:'#dc2626', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
                        {(issue.type||'').replace(/_/g,' ')}
                      </span>
                      <div>
                        <div style={{ fontSize:12, color:'#374151' }}>
                          <strong>"{issue.text}"</strong>
                        </div>
                        <div style={{ fontSize:11, color:'#059669', marginTop:2 }}>
                          💡 {issue.suggestion}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {spamResult.issues?.length === 0 && (
              <div style={{ padding:'10px 14px', background:'#fff', fontSize:13, color:'#059669', fontWeight:600 }}>
                🎉 No spam issues detected — looks clean!
              </div>
            )}
          </div>
        );
      })()}

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; white-space: pre; }
        [contenteditable] a { color: #4f46e5; text-decoration: underline; }
        [contenteditable] ul { padding-left: 20px; }
        [contenteditable] ol { padding-left: 20px; }
      `}</style>
    </div>
  );
}

// ── Main Campaigns Component ─────────────────────
export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editCampaign, setEditCampaign]   = useState(null);
  const [viewCampaign, setViewCampaign]   = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [cloneCampaign, setCloneCampaign] = useState(null);

  const load = useCallback(() => {
    api.get('/campaigns').then(r => setCampaigns(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (id) => {
    try {
      const { data } = await api.post(`/campaigns/${id}/launch`);
      toast.success(`Campaign launched! ${data.scheduled} emails scheduled.`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Launch failed'); }
  };

  const handlePause = async (id, status) => {
    try {
      await api.post(`/campaigns/${id}/${status === 'active' ? 'pause' : 'resume'}`);
      toast.success(status === 'active' ? 'Campaign paused' : 'Campaign resumed');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign and all its data?')) return;
    try { await api.delete(`/campaigns/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  // ── Clone campaign ──
  const handleClone = async (campaign) => {
    try {
      const { data: full } = await api.get(`/campaigns/${campaign.id}`);
      const newCamp = {
        name: `${full.name} (Copy)`,
        email_account_id: full.email_account_id || '',
        list_id: full.list_id || '',
        daily_limit: full.daily_limit || 50,
        track_opens: !!full.track_opens,
        track_clicks: !!full.track_clicks,
        sequences: (full.sequences || []).map(s => ({
          subject:     s.subject,
          body:        s.body,
          delay_days:  s.delay_days || 0,
          delay_hours: s.delay_hours || 0,
        })),
      };
      await api.post('/campaigns', newCamp);
      toast.success(`✅ Campaign cloned as "${newCamp.name}"`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Clone failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Manage your cold email campaigns"
        action={<Btn onClick={() => setShowCreate(true)}><Plus size={14}/> Create New Campaign</Btn>} />

      {campaigns.length === 0 ? (
        <Empty icon={Send} title="No campaigns yet" description="Create your first campaign to start sending cold emails."
          action={<Btn onClick={() => setShowCreate(true)}><Plus size={14}/> Create Campaign</Btn>} />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={['Campaign', 'Status', 'Sent', 'Opened', 'Clicked', 'Replied', 'Bounced', 'List', 'Actions']}>
            {campaigns.map(c => (
              <TR key={c.id}>
                <TD>
                  <div style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  {c.account_email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.account_email}</div>}
                </TD>
                <TD><Badge color={STATUS_COLOR[c.status] || 'default'}>{c.status}</Badge></TD>
                <TD>{(c.sent_count || 0).toLocaleString()}</TD>
                <TD style={{ color: 'var(--cyan)' }}>{pct(c.opened_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--green)' }}>{pct(c.clicked_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--purple)' }}>{pct(c.replied_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--red)' }}>{pct(c.bounced_count, c.sent_count)}</TD>
                <TD style={{ color: 'var(--text2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.list_name || '—'}</TD>
                <TD>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn size="sm" variant="ghost" onClick={() => setViewCampaign(c)} title="View"><Eye size={12}/></Btn>
                    {(c.status === 'draft' || c.status === 'paused') && (
                      <Btn size="sm" variant="ghost" onClick={() => setEditCampaign(c)} title="Edit"><Edit2 size={12}/></Btn>
                    )}
                    <Btn size="sm" variant="ghost" onClick={() => handleClone(c)} title="Clone Campaign">
                      <Copy size={12}/>
                    </Btn>
                    {c.status === 'draft' && (
                      <Btn size="sm" variant="success" onClick={() => handleLaunch(c.id)} title="Launch"><Play size={12}/></Btn>
                    )}
                    {c.status === 'active' && (
                      <Btn size="sm" variant="secondary" onClick={() => handlePause(c.id, 'active')} title="Pause"><Pause size={12}/></Btn>
                    )}
                    {c.status === 'paused' && (
                      <Btn size="sm" variant="success" onClick={() => handlePause(c.id, 'paused')} title="Resume"><Play size={12}/></Btn>
                    )}
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={12}/></Btn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      <ViewCampaignModal campaign={viewCampaign} onClose={() => setViewCampaign(null)} />

      <CampaignModal
        open={showCreate || !!editCampaign}
        campaign={editCampaign}
        onClose={() => { setShowCreate(false); setEditCampaign(null); }}
        onSaved={() => { setShowCreate(false); setEditCampaign(null); load(); }}
      />
    </div>
  );
}

// ── View Campaign Modal ──────────────────────────
function ViewCampaignModal({ campaign, onClose }) {
  const [data, setData]   = useState(null);
  const [sends, setSends] = useState([]);
  const [tab, setTab]     = useState('overview');

  useEffect(() => {
    if (!campaign) return;
    api.get(`/campaigns/${campaign.id}`).then(r => setData(r.data));
    api.get(`/campaigns/${campaign.id}/sends`).then(r => setSends(r.data));
  }, [campaign]);

  if (!campaign) return null;

  const pctV = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '0%';
  const sent = campaign.sent_count || 0;

  return (
    <Modal open={!!campaign} onClose={onClose} title={`Campaign: ${campaign.name}`} width={720}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['overview', 'sends'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border2)'}`, background: tab === t ? 'var(--primary-dim)' : '#fff', color: tab === t ? 'var(--primary)' : 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
            {[['Sent', sent, 'var(--primary)'], ['Opened', pctV(campaign.opened_count, sent), 'var(--cyan)'], ['Clicked', pctV(campaign.clicked_count, sent), 'var(--green)'], ['Replied', pctV(campaign.replied_count, sent), 'var(--purple)'], ['Bounced', pctV(campaign.bounced_count, sent), 'var(--red)']].map(([l, v, c]) => (
              <div key={l} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {data?.sequences?.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Email Sequences</div>
              {data.sequences.map((s, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8, background: 'var(--bg3)' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: i === 0 ? 'var(--primary)' : 'var(--orange)' }}>
                    {i === 0 ? '📧 Initial Email' : `🔄 Follow-up ${i}`}
                    {i > 0 && <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>({s.delay_days}d {s.delay_hours}h delay)</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{s.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 80, overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: s.body }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sends' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 8 }}>
            <Btn size="sm" variant="secondary" onClick={async () => {
              try {
                await api.post(`/campaigns/${campaign.id}/retry-failed`);
                toast.success('Failed sends queued for retry!');
                api.get(`/campaigns/${campaign.id}/sends`).then(r => setSends(r.data));
              } catch { toast.error('Retry failed'); }
            }}>🔄 Retry Failed</Btn>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {sends.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No sends yet</div> : (
              <Table headers={['Email', 'Step', 'Status', 'Error', 'Scheduled', 'Sent', 'Opened']}>
                {sends.map(s => (
                  <TR key={s.id}>
                    <TD style={{ fontSize: 12 }}>{s.email}</TD>
                    <TD style={{ fontSize: 12 }}>#{s.step_number}</TD>
                    <TD><Badge color={s.status === 'sent' ? 'green' : s.status === 'failed' ? 'red' : s.status === 'pending' ? 'yellow' : 'default'} style={{ fontSize: 10 }}>{s.status}</Badge></TD>
                    <TD style={{ fontSize: 11, color: 'var(--red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.error_message}>{s.error_message || '—'}</TD>
                    <TD style={{ fontSize: 11, color: 'var(--text3)' }}>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}</TD>
                    <TD style={{ fontSize: 11, color: 'var(--text3)' }}>{s.sent_at ? new Date(s.sent_at).toLocaleString() : '—'}</TD>
                    <TD style={{ fontSize: 12 }}>{s.opened_at ? '✅' : '—'}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Inbox Rotation Dropdown Select ──────────────
function RotationSelect({ accounts, value, onChange, disabled }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => {
    if (disabled) return;
    const next = value.includes(id) ? value.filter(v => v !== id) : [...value, id];
    onChange(next);
  };

  const selectedAccounts = accounts.filter(a => value.includes(a.id));

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <label style={{ fontSize:13, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
        Email Account(s)
        {value.length > 1 && (
          <span style={{ marginLeft:8, fontSize:11, padding:'2px 8px', borderRadius:10, background:'#eff6ff', color:'#2563eb', fontWeight:700 }}>
            🔄 Rotation: {value.length} accounts
          </span>
        )}
      </label>

      <button type="button" onClick={() => !disabled && setOpen(p => !p)}
        style={{ width:'100%', border:`1px solid ${open?'var(--primary)':'var(--border2)'}`, borderRadius:8, padding:'9px 12px', background:disabled?'var(--bg3)':'#fff', cursor:disabled?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, fontFamily:'inherit', textAlign:'left', transition:'border-color 0.15s' }}>
        <div style={{ flex:1, minWidth:0 }}>
          {selectedAccounts.length === 0 ? (
            <span style={{ fontSize:13, color:'var(--text3)' }}>Select account(s)…</span>
          ) : selectedAccounts.length === 1 ? (
            <div>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{selectedAccounts[0].name}</span>
              <span style={{ fontSize:11, color:'var(--text3)', marginLeft:6 }}>{selectedAccounts[0].from_email}</span>
            </div>
          ) : (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {selectedAccounts.map(a => (
                <span key={a.id} style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--primary-dim)', color:'var(--primary)', fontWeight:600, border:'1px solid #93c5fd' }}>
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown size={14} color="var(--text3)" style={{ flexShrink:0, transform: open?'rotate(180deg)':'none', transition:'transform 0.15s' }}/>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200, background:'#fff', border:'1px solid var(--border2)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', overflow:'hidden' }}>
          <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Select accounts for rotation</span>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} style={{ fontSize:11, color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Clear all</button>
            )}
          </div>
          {accounts.map(a => {
            const selected = value.includes(a.id);
            return (
              <label key={a.id} onClick={() => toggle(a.id)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', background:selected?'#eff6ff':'#fff', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background='var(--bg3)'; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background='#fff'; }}>
                <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${selected?'var(--primary)':'var(--border2)'}`, background:selected?'var(--primary)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  {selected && <span style={{ color:'#fff', fontSize:11, fontWeight:700, lineHeight:1 }}>✓</span>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:selected?600:400, color:'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{a.from_email}</div>
                </div>
                {a.signature && <span style={{ fontSize:10, color:'#16a34a', fontWeight:600, flexShrink:0 }}>✍️ Sig</span>}
                {selected && <span style={{ fontSize:10, color:'var(--primary)', fontWeight:700, flexShrink:0 }}>✓</span>}
              </label>
            );
          })}
          {accounts.length === 0 && <div style={{ padding:'14px', fontSize:13, color:'var(--text3)', textAlign:'center' }}>No accounts connected</div>}
          {value.length > 1 && (
            <div style={{ padding:'8px 12px', background:'#f0f9ff', borderTop:'1px solid #bae6fd', fontSize:11, color:'#0284c7' }}>
              🔄 Sends will rotate <strong>randomly</strong> across {value.length} accounts — each using its own signature & daily limit
            </div>
          )}
        </div>
      )}

      {value.length === 0 && <div style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>Select at least one email account</div>}
    </div>
  );
}

// ── Create/Edit Campaign Modal ───────────────────
function CampaignModal({ open, campaign, onClose, onSaved }) {
  const [form, setForm]       = useState({ name: '', email_account_id: '', list_id: '', daily_limit: 50, track_opens: true, track_clicks: true });
  const [sequences, setSequences] = useState([{ subject: '', body: '', delay_days: 0, delay_hours: 0 }]);
  const [accounts, setAccounts]   = useState([]);
  const [lists, setLists]         = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showAISeq, setShowAISeq] = useState(false);
  const [creditsKey, setCreditsKey] = useState(0); // bump to refresh credits bar
  const isActive = campaign?.status === 'active';

  useEffect(() => {
    if (!open) return;
    api.get('/email-accounts').then(r => setAccounts(r.data));
    api.get('/contacts/lists').then(r => setLists(r.data));
    api.get('/templates').then(r => setTemplates(r.data));
    if (campaign) {
      let rotationIds = [];
      try { rotationIds = JSON.parse(campaign.rotation_account_ids || '[]'); } catch {}
      if (!rotationIds.length && campaign.email_account_id) rotationIds = [campaign.email_account_id];
      setForm({ name: campaign.name, email_account_id: campaign.email_account_id || '', rotation_ids: rotationIds, list_id: campaign.list_id || '', daily_limit: campaign.daily_limit, track_opens: !!campaign.track_opens, track_clicks: !!campaign.track_clicks });
      api.get(`/campaigns/${campaign.id}`).then(r => { if (r.data.sequences?.length) setSequences(r.data.sequences); });
    } else {
      setForm({ name: '', email_account_id: '', rotation_ids: [], list_id: '', daily_limit: 50, track_opens: true, track_clicks: true });
      setSequences([{ subject: '', body: '', delay_days: 0, delay_hours: 0 }]);
    }
  }, [open, campaign]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateSeq = (i, key, val) => setSequences(s => s.map((sq, idx) => idx === i ? { ...sq, [key]: val } : sq));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isActive && sequences.some(s => !s.subject)) return toast.error('All steps need a subject');
    setLoading(true);
    try {
      const payload = {
        ...form,
        email_account_id: (form.rotation_ids||[]).length > 0 ? form.rotation_ids[0] : form.email_account_id,
        rotation_account_ids: JSON.stringify(form.rotation_ids || []),
        sequences: isActive ? undefined : sequences,
      };
      campaign
        ? await api.put(`/campaigns/${campaign.id}`, payload)
        : await api.post('/campaigns', payload);
      toast.success(campaign ? 'Campaign updated' : 'Campaign created');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  // Called by AI sub-components after a credit is consumed
  const onCreditUsed = () => setCreditsKey(k => k + 1);

  return (
    <Modal open={open} onClose={onClose} title={campaign ? `Edit Campaign — ${campaign?.name}` : 'Create New Campaign'} width={720}>
      {isActive && (
        <div style={{ background: '#fffff0', border: '1px solid #faf089', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#975a16' }}>
          ⚠️ This campaign is <strong>active</strong>. You can update the name and daily limit but sequences cannot be changed while running.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Campaign Name *" value={form.name} onChange={e => f('name', e.target.value)} required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <RotationSelect accounts={accounts} value={form.rotation_ids||[]} onChange={ids => { f('rotation_ids', ids); if (ids.length && !form.email_account_id) f('email_account_id', ids[0]); }} disabled={isActive} />
          <Select label="Contact List" value={form.list_id} onChange={e => f('list_id', e.target.value)} disabled={isActive}>
            <option value="">Select list...</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.total_contacts || 0})</option>)}
          </Select>
        </div>

        {/* Auto-computed capacity from selected accounts */}
        {(form.rotation_ids||[]).length > 0 && (() => {
          const selected = accounts.filter(a => (form.rotation_ids||[]).includes(a.id));
          const totalLimit = selected.reduce((sum, a) => sum + (a.daily_limit || 50), 0);
          return (
            <div style={{ background:'#f0fff4', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:13 }}>
              <div style={{ fontWeight:700, color:'#16a34a', marginBottom:4 }}>
                📊 Campaign Capacity: <strong>{totalLimit.toLocaleString()} emails/day</strong>
              </div>
              <div style={{ color:'#166534', fontSize:12, lineHeight:1.6 }}>
                {selected.map(a => (
                  <span key={a.id} style={{ marginRight:12 }}>
                    {a.name}: <strong>{a.daily_limit || 50}/day</strong>
                  </span>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#166534', marginTop:4, opacity:0.8 }}>
                💡 Limit is set per account in <strong>Settings → Sending Speed</strong>. Rotation switches accounts when one hits its limit.
              </div>
            </div>
          );
        })()}

        {!isActive && (
          <div>
            {/* ── Sequences header with AI controls ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Email Sequences ({sequences.length} step{sequences.length !== 1 ? 's' : ''})
              </label>
              <div style={{ display:'flex', gap:6 }}>
                <button type="button" onClick={() => setShowAISeq(true)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:7, fontSize:12, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, boxShadow:'0 2px 6px rgba(124,58,237,0.35)' }}>
                  <Sparkles size={12}/>AI Write Sequence
                </button>
                <Btn type="button" size="sm" variant="secondary"
                  onClick={() => setSequences(s => [...s, { subject: '', body: '', delay_days: s.length > 0 ? 3 : 0, delay_hours: 0 }])}>
                  <Plus size={12}/> Add Follow-up
                </Btn>
              </div>
            </div>

            {/* AI Credits bar */}
            <AICreditsBar refreshKey={creditsKey}/>

            {sequences.map((seq, i) => (
              <div key={i} style={{ border: '1px solid var(--border2)', borderRadius: 10, padding: 16, marginBottom: 12, background: 'var(--bg3)' }}>
                {/* Step header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--primary)' : 'var(--orange)' }}>
                    {i === 0 ? '📧 Initial Email' : `🔄 Follow-up ${i}`}
                  </span>
                  {i > 0 && (
                    <button type="button" onClick={() => setSequences(s => s.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                      <X size={14}/>
                    </button>
                  )}
                </div>

                {/* Template selector */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>Load from template:</span>
                    <select onChange={e => {
                      const tpl = templates.find(t => t.id === e.target.value);
                      if (!tpl) return;
                      updateSeq(i, 'subject', tpl.subject || '');
                      updateSeq(i, 'body', tpl.body || '');
                      e.target.value = '';
                      toast.success(`Template "${tpl.name}" loaded!`);
                    }} style={{ border:'1px solid var(--border2)', borderRadius:6, padding:'4px 8px', fontSize:12, background:'#fff', outline:'none', color:'var(--text2)', cursor:'pointer' }}>
                      <option value="">— Select a template —</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                    </select>
                  </div>
                </div>

                {/* Delay for follow-ups */}
                {i > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <Input label="Delay (days)" type="number" min={0} value={seq.delay_days}
                      onChange={e => updateSeq(i, 'delay_days', +e.target.value)} />
                    <Input label="Delay (hours)" type="number" min={0} max={23} value={seq.delay_hours}
                      onChange={e => updateSeq(i, 'delay_hours', +e.target.value)} />
                  </div>
                )}

                {/* Subject with AI + variable dropdown */}
                <div style={{ marginBottom: 12 }}>
                  <SubjectInput
                    value={seq.subject}
                    onChange={val => updateSeq(i, 'subject', val)}
                    emailBody={seq.body}
                    onCreditUsed={onCreditUsed}
                  />
                </div>

                {/* Rich text body editor with AI rewrite + spam score */}
                <RichBodyEditor
                  key={`seq-body-${i}-${seq.subject}`}
                  value={seq.body}
                  onChange={val => updateSeq(i, 'body', val)}
                  subject={seq.subject}
                  onCreditUsed={onCreditUsed}
                  placeholder={`Hi {{first_name}},\n\nI noticed {{company}} is...`}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{campaign ? 'Save Changes' : 'Create Campaign'}</Btn>
        </div>
      </form>

      {/* AI Sequence Generator modal */}
      <AISequenceModal
        open={showAISeq}
        onClose={() => setShowAISeq(false)}
        onApply={(steps) => {
          setSequences(steps.map((s, i) => ({
            subject:     s.subject,
            body:        s.body,
            delay_days:  s.delay_days  ?? (i === 0 ? 0 : i * 3),
            delay_hours: s.delay_hours ?? 0,
          })));
          setShowAISeq(false);
          onCreditUsed();
          toast.success('✨ AI sequence applied!');
        }}
      />
    </Modal>
  );
}

// ── AI Sequence Generator Modal ──────────────────
function AISequenceModal({ open, onClose, onApply }) {
  const [audience, setAudience] = useState('');
  const [offer,    setOffer]    = useState('');
  const [niche,    setNiche]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [preview,  setPreview]  = useState(null); // array of steps

  const reset = () => { setAudience(''); setOffer(''); setNiche(''); setPreview(null); };
  const handleClose = () => { reset(); onClose(); };

  const generate = async () => {
    if (!audience.trim() || !offer.trim() || !niche.trim()) {
      toast.error('Fill in all three fields'); return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const { data } = await api.post('/ai/sequence', { audience, offer, niche });
      if (!data.steps?.length) throw new Error('Empty response');
      setPreview(data.steps);
    } catch (e) {
      if (e.response?.status === 402) toast.error(e.response.data.error || 'AI credits exhausted.');
      else toast.error('Sequence generation failed — check OPENAI_API_KEY');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={handleClose} title="✨ AI Sequence Generator" width={640}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Input form */}
        {!preview && (
          <>
            <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #c4b5fd', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#5b21b6', lineHeight:1.6 }}>
              <strong><Sparkles size={13} style={{ display:'inline', marginRight:4 }}/>How it works:</strong> Describe your audience, what you offer, and your industry. AI writes a humanized 3-step cold email sequence (intro → follow-up → breakup) optimised for inbox delivery.
            </div>
            <Input label="Target Audience *" placeholder="e.g. Marketing Directors at SaaS companies" value={audience} onChange={e => setAudience(e.target.value)} />
            <Input label="Your Offer / Product *" placeholder="e.g. AI-powered email automation tool that saves 5 hrs/week" value={offer} onChange={e => setOffer(e.target.value)} />
            <Input label="Niche / Industry *" placeholder="e.g. B2B SaaS, eCommerce, Real Estate" value={niche} onChange={e => setNiche(e.target.value)} />
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Btn type="button" variant="secondary" onClick={handleClose}>Cancel</Btn>
              <Btn type="button" onClick={generate} loading={loading}
                style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none' }}>
                <Sparkles size={13}/> {loading ? 'Writing…' : 'Generate Sequence (5 credits)'}
              </Btn>
            </div>
          </>
        )}

        {/* Preview */}
        {preview && (
          <>
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#166534', fontWeight:600 }}>
              ✅ 3-step sequence generated! Review below, then click "Use This Sequence" to apply.
            </div>
            <div style={{ maxHeight:420, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
              {preview.map((step, i) => (
                <div key={i} style={{ border:'1px solid var(--border2)', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ padding:'8px 12px', background: i===0?'#eff6ff': i===1?'#fff7ed':'#fdf4ff', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontWeight:700, fontSize:12, color: i===0?'#2563eb': i===1?'#c2410c':'#7c3aed' }}>
                      {i===0 ? '📧 Step 1 — Day 0' : i===1 ? `🔄 Step 2 — Day ${step.delay_days}` : `💔 Step 3 — Day ${step.delay_days}`}
                    </span>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>Subject: <strong>{step.subject}</strong></span>
                  </div>
                  <div style={{ padding:'10px 14px', fontSize:13, color:'#374151', lineHeight:1.7, whiteSpace:'pre-wrap', background:'#fff' }}>
                    {step.body}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Btn type="button" variant="secondary" onClick={() => setPreview(null)}>← Regenerate</Btn>
              <Btn type="button" onClick={() => onApply(preview)}
                style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none' }}>
                <Sparkles size={13}/> Use This Sequence
              </Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
