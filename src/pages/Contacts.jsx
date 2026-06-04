import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Pagination } from '../components/UI';
import { Users, Plus, Upload, Trash2, Search, Edit2, CheckSquare, Square, List, Tag, X, Pencil, Check, Linkedin, ExternalLink } from 'lucide-react';

// ── Company logo from domain ─────────────────────
function CompanyLogo({ email, company, size = 28 }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!email) return;
    const domain = email.split('@')[1];
    if (!domain) return;
    // Skip common free email providers
    const free = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','aol.com','protonmail.com'];
    if (free.includes(domain.toLowerCase())) return;
    // Logo.dev — free, no API key needed, great coverage
    setLogoUrl(`https://img.logo.dev/${domain}?token=pk_SgO4DRZSR8KnSFBGFJDOHQ`);
  }, [email]);

  const initials = (company || email || '?').charAt(0).toUpperCase();
  const bgColor = (() => {
    const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
    let h = 0;
    for (let i = 0; i < (email||'').length; i++) h = (email||'').charCodeAt(i) + ((h<<5)-h);
    return colors[Math.abs(h) % colors.length];
  })();

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Initials avatar */}
      <div style={{ width: size, height: size, borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
        {initials}
      </div>
      {/* Company logo overlay — bottom right */}
      {logoUrl && !failed && (
        <img
          src={logoUrl}
          alt=""
          onError={() => setFailed(true)}
          style={{ position: 'absolute', bottom: -2, right: -2, width: size * 0.55, height: size * 0.55, borderRadius: '50%', border: '2px solid #fff', background: '#fff', objectFit: 'contain' }}
        />
      )}
    </div>
  );
}

// ── Tag Pill ─────────────────────────────────────
function TagPill({ tag, color, onRemove }) {
  const COLORS = {
    blue:   { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
    green:  { bg: '#f0fff4', text: '#16a34a', border: '#86efac' },
    red:    { bg: '#fff5f5', text: '#dc2626', border: '#fca5a5' },
    yellow: { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
    purple: { bg: '#f5f3ff', text: '#7c3aed', border: '#c4b5fd' },
    gray:   { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' },
  };
  const c = COLORS[color] || COLORS.blue;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {tag}
      {onRemove && <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, padding: 0, display: 'flex', lineHeight: 1 }}><X size={10}/></button>}
    </span>
  );
}

// ── Inline tag editor for a contact ─────────────
function ContactTagEditor({ contact, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const tags = (() => {
    try { return JSON.parse(contact.tags || '[]'); } catch { return []; }
  })();
  const TAG_COLORS = ['blue','green','red','yellow','purple','gray'];

  const addTag = async () => {
    const tag = input.trim();
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    const newTags = [...tags, tag];
    setInput('');
    try {
      await api.put(`/contacts/${contact.id}`, { tags: JSON.stringify(newTags) });
      onUpdate(contact.id, { tags: JSON.stringify(newTags) });
    } catch { toast.error('Failed to add tag'); }
  };

  const removeTag = async (tag) => {
    const newTags = tags.filter(t => t !== tag);
    try {
      await api.put(`/contacts/${contact.id}`, { tags: JSON.stringify(newTags) });
      onUpdate(contact.id, { tags: JSON.stringify(newTags) });
    } catch { toast.error('Failed to remove tag'); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {tags.map((tag, i) => (
        <TagPill key={tag} tag={tag} color={TAG_COLORS[i % TAG_COLORS.length]} onRemove={() => removeTag(tag)} />
      ))}
      {open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } if (e.key === 'Escape') setOpen(false); }}
            placeholder="Add tag..."
            style={{ border: '1px solid var(--border2)', borderRadius: 6, padding: '2px 7px', fontSize: 11, outline: 'none', width: 80 }}
          />
          <button type="button" onClick={addTag} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 2, display: 'flex' }}><Check size={12}/></button>
          <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, display: 'flex' }}><X size={12}/></button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{ background: 'none', border: '1px dashed var(--border2)', borderRadius: 20, padding: '2px 7px', cursor: 'pointer', fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Tag size={9}/> {tags.length === 0 ? 'Add tag' : '+'}
        </button>
      )}
    </div>
  );
}

// ── Inline list name editor ──────────────────────
function EditableListName({ list, onRename }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(list.name);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = async () => {
    if (!val.trim() || val === list.name) { setEditing(false); setVal(list.name); return; }
    try {
      await api.put(`/contacts/lists/${list.id}`, { name: val.trim() });
      onRename(list.id, val.trim());
      toast.success('List renamed!');
    } catch { toast.error('Failed to rename'); setVal(list.name); }
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setVal(list.name); }}}
          style={{ flex: 1, border: '1px solid var(--primary)', borderRadius: 5, padding: '2px 6px', fontSize: 12, outline: 'none', minWidth: 0 }} />
        <button type="button" onClick={save} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 1, display: 'flex' }}><Check size={11}/></button>
        <button type="button" onClick={() => { setEditing(false); setVal(list.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 1, display: 'flex' }}><X size={11}/></button>
      </div>
    );
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110, flex: 1 }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.name}</span>
      <button type="button" onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 1, display: 'flex', flexShrink: 0, opacity: 0.5 }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
        <Pencil size={10}/>
      </button>
    </span>
  );
}

// ── Email verification status dot ────────────────
function EmailStatusDot({ status, reason }) {
  if (!status || status === 'unverified') return null;
  const map = {
    valid:   { c: '#16a34a', t: 'Valid — deliverable' },
    risky:   { c: '#d97706', t: 'Risky' },
    invalid: { c: '#dc2626', t: 'Invalid — will not be sent' },
  };
  const m = map[status]; if (!m) return null;
  return (
    <span title={`${m.t}${reason ? ' · ' + reason : ''}`}
      style={{ width: 7, height: 7, borderRadius: '50%', background: m.c, flexShrink: 0, display: 'inline-block' }} />
  );
}

// ── Main Contacts Component ──────────────────────
export default function Contacts() {
  const [contacts, setContacts]         = useState([]);
  const [lists, setLists]               = useState([]);
  const [allTotal, setAllTotal]         = useState(0);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [filterTag, setFilterTag]       = useState('');
  const [page, setPage]                 = useState(1);
  const [modal, setModal]               = useState(null);
  const [editContact, setEditContact]   = useState(null);
  const [selected, setSelected]         = useState(new Set());
  const [deleting, setDeleting]         = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [dragOverList, setDragOverList] = useState(null);
  const [draggingContact, setDraggingContact] = useState(null);
  const [verifying, setVerifying]       = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(null);
  const [summary, setSummary]           = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/contacts/verify-summary', { params: { list_id: selectedList || undefined } });
      setSummary(data);
    } catch {}
  }, [selectedList]);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const [cr, lr, allCr] = await Promise.all([
        api.get('/contacts', { params: { list_id: selectedList || undefined, search: search || undefined, page, limit: 50 } }),
        api.get('/contacts/lists'),
        api.get('/contacts', { params: { page: 1, limit: 1 } }),
      ]);
      setContacts(cr.data.contacts);
      setTotal(cr.data.total);
      setLists(lr.data);
      setAllTotal(allCr.data.total);
    } finally { setLoading(false); }
  }, [page, search, selectedList]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  const handleVerify = async () => {
    setVerifying(true); setVerifyProgress({ done: 0, total: 0 });
    try {
      const { data } = await api.post('/contacts/verify', { list_id: selectedList || undefined });
      const jobId = data.jobId;
      const poll = setInterval(async () => {
        try {
          const { data: job } = await api.get(`/contacts/verify-status/${jobId}`);
          setVerifyProgress(job);
          if (job.status === 'done' || job.status === 'error') {
            clearInterval(poll);
            setVerifying(false);
            if (job.status === 'done') {
              toast.success(`Verified ${job.total}: ${job.valid} valid · ${job.risky} risky · ${job.invalid} invalid`);
              loadSummary(); load();
            } else { toast.error('Verification failed'); }
          }
        } catch { clearInterval(poll); setVerifying(false); }
      }, 1500);
    } catch { setVerifying(false); toast.error('Could not start verification'); }
  };

  const handleDeleteInvalid = async () => {
    if (!confirm('Delete all INVALID contacts? These addresses cannot receive email (would bounce).')) return;
    try {
      const { data } = await api.post('/contacts/delete-invalid', { list_id: selectedList || undefined });
      toast.success(`Removed ${data.deleted} invalid contact${data.deleted !== 1 ? 's' : ''}`);
      loadSummary(); load();
    } catch { toast.error('Failed'); }
  };

  // Update a single contact in state without full reload
  const updateContact = (id, updates) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Rename list in sidebar state
  const handleRenameList = (id, newName) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    selected.size === contacts.length ? setSelected(new Set()) : setSelected(new Set(contacts.map(c => c.id)));
  };

  const handleDeleteOne = async (id, force = false) => {
    if (!force && !confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}${force ? '?force=true' : ''}`);
      toast.success('Contact deleted'); load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.warning) {
        if (confirm(`⚠️ ${err.response.data.message}\n\nDelete anyway?`)) handleDeleteOne(id, true);
      } else toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleBulkDelete = async (force = false) => {
    if (selected.size === 0) return;
    if (!force && !confirm(`Delete ${selected.size} contact${selected.size > 1 ? 's' : ''}?`)) return;
    setDeleting(true);
    try {
      const { data } = await api.post('/contacts/bulk-delete', { ids: Array.from(selected), force });
      toast.success(`${data.deleted} contact${data.deleted > 1 ? 's' : ''} deleted`);
      setSelected(new Set()); load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.warning) {
        const { message, inCampaign } = err.response.data;
        if (confirm(`⚠️ ${message}\n\nDelete anyway?`)) handleBulkDelete(true);
      } else toast.error(err.response?.data?.error || 'Bulk delete failed');
    } finally { setDeleting(false); }
  };

  const handleDeleteList = async (id) => {
    if (!confirm('Delete this list? Contacts will not be deleted.')) return;
    try { await api.delete(`/contacts/lists/${id}`); toast.success('List deleted'); if (selectedList === id) setSelectedList(''); load(); }
    catch { toast.error('Failed'); }
  };

  const handleBulkMove = async (listId) => {
    try {
      const { data } = await api.post('/contacts/bulk-move', { ids: Array.from(selected), list_id: listId });
      toast.success(`${data.moved} contact${data.moved > 1 ? 's' : ''} moved`);
      setSelected(new Set()); setShowMoveModal(false); load();
    } catch { toast.error('Failed to move contacts'); }
  };

  const handleDragStart = (e, contact) => { setDraggingContact(contact); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', contact.id); };
  const handleDragEnd = () => { setDraggingContact(null); setDragOverList(null); };
  const handleDragOver = (e, listId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverList(listId); };
  const handleDragLeave = () => setDragOverList(null);
  const handleDrop = async (e, listId) => {
    e.preventDefault(); setDragOverList(null);
    if (!draggingContact || draggingContact.list_id === listId) return;
    try { await api.post('/contacts/bulk-move', { ids: [draggingContact.id], list_id: listId }); toast.success(`Moved ${draggingContact.email}`); load(); }
    catch { toast.error('Failed'); }
  };
  const handleDropToAll = async (e) => {
    e.preventDefault(); setDragOverList(null);
    if (!draggingContact) return;
    try { await api.post('/contacts/bulk-move', { ids: [draggingContact.id], list_id: null }); toast.success(`Removed from list`); load(); }
    catch { toast.error('Failed'); }
    setDraggingContact(null);
  };

  // Collect all unique tags across visible contacts
  const allTags = [...new Set(contacts.flatMap(c => { try { return JSON.parse(c.tags || '[]'); } catch { return []; } }))];

  // Client-side tag filter
  const filteredContacts = filterTag
    ? contacts.filter(c => { try { return JSON.parse(c.tags || '[]').includes(filterTag); } catch { return false; } })
    : contacts;

  const allSelected = filteredContacts.length > 0 && selected.size === filteredContacts.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${allTotal.toLocaleString()} total contacts`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={handleVerify} loading={verifying}>
              <Check size={14}/> {verifying ? `Verifying ${verifyProgress?.done || 0}/${verifyProgress?.total || 0}` : 'Verify Emails'}
            </Btn>
            <Btn variant="secondary" onClick={() => setModal('list')}><List size={14}/> New List</Btn>
            <Btn variant="secondary" onClick={() => setModal('import')}><Upload size={14}/> Import CSV</Btn>
            <Btn onClick={() => setModal('add')}><Plus size={14}/> Add Contact</Btn>
          </div>
        }
      />

      {/* Email verification summary */}
      {summary && (summary.valid + summary.risky + summary.invalid) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: 'var(--text2)' }}>📋 Email health{selectedList ? ' (this list)' : ''}:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} /> {summary.valid} valid</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} /> {summary.risky} risky</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} /> {summary.invalid} invalid</span>
          {summary.unverified > 0 && <span style={{ color: 'var(--text3)' }}>· {summary.unverified} unverified</span>}
          {summary.invalid > 0 && (
            <button onClick={handleDeleteInvalid} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 7, color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Trash2 size={12}/> Remove {summary.invalid} invalid
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text3)', width: '100%' }}>Invalid emails are automatically skipped when you launch campaigns — protecting your sender reputation.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Lists Sidebar */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lists</div>
          {draggingContact && <div style={{ fontSize: 11, color: 'var(--primary)', marginBottom: 6, padding: '4px 8px', background: 'var(--primary-dim)', borderRadius: 6, textAlign: 'center' }}>🖱️ Drop onto a list to move</div>}
          <Card style={{ padding: 8 }}>
            <button onClick={() => { setSelectedList(''); setPage(1); }} onDragOver={e => handleDragOver(e, 'all')} onDragLeave={handleDragLeave} onDrop={handleDropToAll}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 10px', borderRadius: 6, border: dragOverList === 'all' ? '2px dashed var(--primary)' : '2px solid transparent', background: selectedList === '' ? 'var(--primary-dim)' : dragOverList === 'all' ? 'var(--primary-dim)' : 'transparent', color: selectedList === '' ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: selectedList === '' ? 600 : 400, transition: 'all 0.15s' }}>
              <span>All Contacts</span>
              <span style={{ fontSize: 12, background: 'var(--bg3)', padding: '1px 7px', borderRadius: 10 }}>{allTotal}</span>
            </button>
            {lists.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button onClick={() => { setSelectedList(l.id); setPage(1); }} onDragOver={e => handleDragOver(e, l.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, l.id)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, border: dragOverList === l.id ? '2px dashed var(--primary)' : '2px solid transparent', background: selectedList === l.id ? 'var(--primary-dim)' : dragOverList === l.id ? 'var(--primary-dim)' : 'transparent', color: selectedList === l.id ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: selectedList === l.id ? 600 : 400, transition: 'all 0.15s', gap: 4 }}>
                  <EditableListName list={l} onRename={handleRenameList} />
                  <span style={{ fontSize: 11, flexShrink: 0, background: 'var(--bg3)', padding: '1px 6px', borderRadius: 10 }}>{l.total_contacts || 0}</span>
                </button>
                <button onClick={() => handleDeleteList(l.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 16, lineHeight: 1, flexShrink: 0 }} title="Delete list">×</button>
              </div>
            ))}
            {lists.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 10px', textAlign: 'center' }}>No lists yet</div>}
          </Card>
        </div>

        {/* Main Table */}
        <div>
          {/* Search + Tag filter + Bulk actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input placeholder="Search by email, name or company..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 14, outline: 'none', color: 'var(--text)' }} />
            </div>
            {selected.size > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setShowMoveModal(true)}>📂 Move {selected.size}</Btn>
                <Btn variant="danger" loading={deleting} onClick={() => handleBulkDelete()}><Trash2 size={13}/> Delete {selected.size}</Btn>
              </div>
            )}
          </div>

          {/* Tag filter pills */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}><Tag size={10}/> Filter:</span>
              <button onClick={() => setFilterTag('')} style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${!filterTag ? 'var(--primary)' : 'var(--border2)'}`, background: !filterTag ? 'var(--primary-dim)' : '#fff', color: !filterTag ? 'var(--primary)' : 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: !filterTag ? 700 : 400 }}>All</button>
              {allTags.map((tag, i) => {
                const colors = ['blue','green','red','yellow','purple','gray'];
                const c = colors[i % colors.length];
                return (
                  <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)} style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${filterTag === tag ? 'var(--primary)' : 'var(--border2)'}`, background: filterTag === tag ? 'var(--primary-dim)' : '#fff', color: filterTag === tag ? 'var(--primary)' : 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: filterTag === tag ? 700 : 400 }}>
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? <Spinner /> : filteredContacts.length === 0 ? (
            <Empty icon={Users} title="No contacts found"
              description={search ? 'Try a different search term' : selectedList ? 'This list is empty.' : 'Add contacts or import a CSV.'}
              action={!search && <Btn onClick={() => setModal('import')}><Upload size={14}/> Import CSV</Btn>} />
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg3)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '10px 14px', width: 40 }}>
                        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: allSelected ? 'var(--primary)' : 'var(--text3)' }}>
                          {allSelected ? <CheckSquare size={16}/> : someSelected ? <CheckSquare size={16} color="var(--primary)" style={{ opacity: 0.5 }}/> : <Square size={16}/>}
                        </button>
                      </th>
                      {['', 'Contact', 'Company', 'Title', 'LinkedIn', 'Value Prop', 'Tags', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => {
                      const custom = (() => { try { return JSON.parse(c.custom_fields || '{}'); } catch { return {}; } })();
                      const linkedIn = custom.linkedin || c.linkedin || '';
                      const valueProp = custom.value_prop || c.value_prop || '';
                      return (
                        <tr key={c.id} draggable onDragStart={e => handleDragStart(e, c)} onDragEnd={handleDragEnd}
                          style={{ borderBottom: '1px solid var(--border)', background: selected.has(c.id) ? 'var(--primary-dim)' : draggingContact?.id === c.id ? 'var(--bg3)' : 'transparent', transition: 'background 0.1s', cursor: 'grab', opacity: draggingContact?.id === c.id ? 0.5 : 1 }}>
                          <td style={{ padding: '10px 14px', width: 40 }}>
                            <button onClick={() => toggleSelect(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: selected.has(c.id) ? 'var(--primary)' : 'var(--text3)' }}>
                              {selected.has(c.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                            </button>
                          </td>
                          {/* Drag handle */}
                          <td style={{ padding: '10px 6px', width: 20, color: 'var(--text3)', fontSize: 16, cursor: 'grab' }}>⠿</td>
                          {/* Contact — avatar + logo + name + email */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <CompanyLogo email={c.email} company={c.company} size={32} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                  {[c.first_name, c.last_name].filter(Boolean).join(' ') || <span style={{ color: 'var(--text3)', fontWeight: 400 }}>No name</span>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</span>
                                  <EmailStatusDot status={c.email_status} reason={c.email_check_reason} />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>{c.title || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                          {/* LinkedIn */}
                          <td style={{ padding: '10px 14px' }}>
                            {linkedIn ? (
                              <a href={linkedIn.startsWith('http') ? linkedIn : `https://linkedin.com/in/${linkedIn}`} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
                                <Linkedin size={14}/> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>Profile</span>
                              </a>
                            ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                          </td>
                          {/* Value Prop */}
                          <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={valueProp}>
                            {valueProp || <span style={{ color: 'var(--text3)' }}>—</span>}
                          </td>
                          {/* Tags — inline editable */}
                          <td style={{ padding: '10px 14px', minWidth: 120 }}>
                            <ContactTagEditor contact={c} onUpdate={updateContact} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {c.unsubscribed ? <Badge color="red">Unsubscribed</Badge> : c.bounced ? <Badge color="yellow">Bounced</Badge> : <Badge color="green">Active</Badge>}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn size="sm" variant="secondary" onClick={() => setEditContact(c)} title="Edit"><Edit2 size={12}/></Btn>
                              <Btn size="sm" variant="danger" onClick={() => handleDeleteOne(c.id)} title="Delete"><Trash2 size={12}/></Btn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {selected.size > 0
                    ? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selected.size} selected</span>
                    : <span>Showing {filteredContacts.length} of {total.toLocaleString()} contacts{filterTag ? ` tagged "${filterTag}"` : ''}</span>}
                </div>
                <Pagination page={page} total={total} limit={50} onChange={setPage} />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddContactModal open={modal === 'add'} onClose={() => setModal(null)} lists={lists} onSaved={() => { setModal(null); load(); }} />
      <EditContactModal contact={editContact} onClose={() => setEditContact(null)} lists={lists} onSaved={() => { setEditContact(null); load(); }} />
      <ImportModal open={modal === 'import'} onClose={() => setModal(null)} lists={lists} selectedList={selectedList} onSaved={() => { setModal(null); load(); }} />
      <NewListModal open={modal === 'list'} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      <MoveToListModal open={showMoveModal} onClose={() => setShowMoveModal(false)} lists={lists} onMove={handleBulkMove} count={selected.size} />
    </div>
  );
}

// ── Add Contact Modal ────────────────────────────
function AddContactModal({ open, onClose, lists, onSaved }) {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '', title: '', phone: '', website: '', list_id: '', linkedin: '', value_prop: '', tags: '', city: '', country: '', location: '', company_location: '' });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  useEffect(() => { if (open) setForm({ email: '', first_name: '', last_name: '', company: '', title: '', phone: '', website: '', list_id: '', linkedin: '', value_prop: '', tags: '', city: '', country: '', location: '', company_location: '' }); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const custom_fields = JSON.stringify({
        linkedin: form.linkedin, value_prop: form.value_prop,
        city: form.city, country: form.country,
        location: form.location, company_location: form.company_location,
      });
      await api.post('/contacts', { ...form, tags: JSON.stringify(tags), custom_fields });
      toast.success('Contact added'); onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Contact" width={620}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Email *" type="email" value={form.email} onChange={e => f('email', e.target.value)} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="First Name" value={form.first_name} onChange={e => f('first_name', e.target.value)} />
          <Input label="Last Name" value={form.last_name} onChange={e => f('last_name', e.target.value)} />
          <Input label="Company Name" value={form.company} onChange={e => f('company', e.target.value)} />
          <Input label="Job Title" value={form.title} onChange={e => f('title', e.target.value)} />
          <Input label="Phone / Mobile" value={form.phone} onChange={e => f('phone', e.target.value)} />
          <Input label="Website" value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://..." />
        </div>
        <Input label="LI Profile URL" value={form.linkedin} onChange={e => f('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/username" />
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: -4 }}>📍 Location</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Contact City" value={form.city} onChange={e => f('city', e.target.value)} />
          <Input label="Contact Country" value={form.country} onChange={e => f('country', e.target.value)} />
          <Input label="Contact Location" value={form.location} onChange={e => f('location', e.target.value)} placeholder="e.g. New York, USA" />
          <Input label="Company Location" value={form.company_location} onChange={e => f('company_location', e.target.value)} placeholder="e.g. San Francisco, CA" />
        </div>
        <Input label="Value Proposition" value={form.value_prop} onChange={e => f('value_prop', e.target.value)} placeholder="What value do you offer this contact?" />
        <Input label="Tags (comma separated)" value={form.tags} onChange={e => f('tags', e.target.value)} placeholder="e.g. hot lead, decision maker, Q2" />
        <Select label="Add to List" value={form.list_id} onChange={e => f('list_id', e.target.value)}>
          <option value="">No list</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Add Contact</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Contact Modal ───────────────────────────
function EditContactModal({ contact, onClose, lists, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (contact) {
      const custom = (() => { try { return JSON.parse(contact.custom_fields || '{}'); } catch { return {}; } })();
      const tags = (() => { try { return JSON.parse(contact.tags || '[]').join(', '); } catch { return ''; } })();
      setForm({
        email:            contact.email,
        first_name:       contact.first_name || '',
        last_name:        contact.last_name || '',
        company:          contact.company || '',
        title:            contact.title || '',
        phone:            contact.phone || '',
        website:          contact.website || '',
        list_id:          contact.list_id || '',
        linkedin:         custom.linkedin || '',
        value_prop:       custom.value_prop || '',
        city:             custom.city || contact.city || '',
        country:          custom.country || contact.country || '',
        location:         custom.location || '',
        company_location: custom.company_location || '',
        tags,
      });
    }
  }, [contact]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const custom_fields = JSON.stringify({
        linkedin:         form.linkedin,
        value_prop:       form.value_prop,
        city:             form.city,
        country:          form.country,
        location:         form.location,
        company_location: form.company_location,
      });
      await api.put(`/contacts/${contact.id}`, { ...form, tags: JSON.stringify(tags), custom_fields });
      toast.success('Contact updated'); onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={!!contact} onClose={onClose} title="Edit Contact" width={620}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Email *" type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} required />

        {/* Name + Company */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="First Name" value={form.first_name || ''} onChange={e => f('first_name', e.target.value)} />
          <Input label="Last Name" value={form.last_name || ''} onChange={e => f('last_name', e.target.value)} />
          <Input label="Company Name" value={form.company || ''} onChange={e => f('company', e.target.value)} />
          <Input label="Job Title" value={form.title || ''} onChange={e => f('title', e.target.value)} />
          <Input label="Phone / Mobile" value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
          <Input label="Website" value={form.website || ''} onChange={e => f('website', e.target.value)} placeholder="https://..." />
        </div>

        {/* LinkedIn */}
        <Input label="LI Profile URL" value={form.linkedin || ''} onChange={e => f('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/username" />

        {/* Location fields */}
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: -4 }}>📍 Location</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Contact City" value={form.city || ''} onChange={e => f('city', e.target.value)} />
          <Input label="Contact Country" value={form.country || ''} onChange={e => f('country', e.target.value)} />
          <Input label="Contact Location" value={form.location || ''} onChange={e => f('location', e.target.value)} placeholder="e.g. New York, USA" />
          <Input label="Company Location" value={form.company_location || ''} onChange={e => f('company_location', e.target.value)} placeholder="e.g. San Francisco, CA" />
        </div>

        {/* Value Prop + Tags */}
        <Input label="Value Proposition" value={form.value_prop || ''} onChange={e => f('value_prop', e.target.value)} placeholder="What value do you offer this contact?" />
        <Input label="Tags (comma separated)" value={form.tags || ''} onChange={e => f('tags', e.target.value)} placeholder="e.g. Food & Bev, hot lead, Q2" />

        <Select label="List" value={form.list_id || ''} onChange={e => f('list_id', e.target.value)}>
          <option value="">No list</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Save Changes</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── New List Modal ───────────────────────────────
function NewListModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (open) setForm({ name: '', description: '' }); }, [open]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/contacts/lists', form); toast.success('List created'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create Contact List">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="List Name *" placeholder="e.g. Hotels & Motels USA" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Create List</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Import Modal ─────────────────────────────────
function ImportModal({ open, onClose, lists, selectedList, onSaved }) {
  const [step, setStep] = useState(1);
  const [listId, setListId] = useState('');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({});
  const [duplicateAction, setDuplicateAction] = useState('skip');
  const [fallbacks, setFallbacks] = useState({ first_name: 'there', last_name: '', company: 'your company', title: '' });
  const [importTags, setImportTags] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const FIELDS = [
    { key: 'email',    label: 'Email *',          required: true },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name',  label: 'Last Name' },
    { key: 'title',    label: 'Title / Job Title' },
    { key: 'company',  label: 'Company Name' },
    { key: 'website',  label: 'Website' },
    { key: 'linkedin', label: 'LI Profile URL' },
    { key: 'phone',    label: 'Phone / Mobile Phone' },
    { key: 'city',     label: 'Contact City' },
    { key: 'country',  label: 'Contact Country' },
    { key: 'location', label: 'Contact Location' },
    { key: 'company_location', label: 'Company Location' },
  ];

  useEffect(() => {
    if (!open) { setStep(1); setFile(null); setHeaders([]); setPreview([]); setMapping({}); setResult(null); setImportTags(''); }
    else setListId(selectedList || '');
  }, [open, selectedList]);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (!lines.length) return;
      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(rawHeaders);
      const autoMap = {};
      const aliases = {
        email:            ['email', 'e-mail', 'email address', 'emailaddress', 'mail', 'work email'],
        first_name:       ['first_name', 'firstname', 'first name', 'fname', 'first'],
        last_name:        ['last_name', 'lastname', 'last name', 'lname', 'last'],
        company:          ['company', 'company name', 'organization', 'org', 'business', 'employer'],
        title:            ['title', 'job title', 'jobtitle', 'position', 'role'],
        phone:            ['phone', 'phone number', 'mobile', 'mobile phone', 'cell', 'telephone'],
        website:          ['website', 'url', 'web', 'domain', 'company website'],
        linkedin:         ['linkedin', 'linkedin url', 'linkedin profile', 'li profile url', 'linkedin profile url', 'li profile'],
        city:             ['city', 'contact city', 'town'],
        country:          ['country', 'contact country'],
        location:         ['location', 'contact location', 'contact loc'],
        company_location: ['company location', 'company loc', 'hq location', 'office location'],
      };
      rawHeaders.forEach(h => {
        const hl = h.toLowerCase().trim();
        for (const [field, als] of Object.entries(aliases)) {
          if (als.includes(hl) && !autoMap[field]) autoMap[field] = h;
        }
      });
      setMapping(autoMap);
      const rows = lines.slice(1, 4).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        rawHeaders.forEach((h, i) => obj[h] = vals[i] || '');
        return obj;
      });
      setPreview(rows);
      setStep(2);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!mapping.email) return toast.error('Please map the Email column!');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (listId) fd.append('list_id', listId);
      fd.append('mapping', JSON.stringify(mapping));
      fd.append('duplicate_action', duplicateAction);
      fd.append('fallbacks', JSON.stringify(fallbacks));
      // Tags to apply to all imported contacts
      if (importTags.trim()) fd.append('import_tags', JSON.stringify(importTags.split(',').map(t => t.trim()).filter(Boolean)));
      const { data } = await api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data); setStep(4);
      toast.success(`Import complete! ${data.imported} contacts added`);
      if (data.limit_message) toast(data.limit_message, { icon: '⚠️', duration: 7000 });
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    finally { setLoading(false); }
  };

  const m = (k, v) => setMapping(p => ({ ...p, [k]: v }));
  const fb = (k, v) => setFallbacks(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Import Contacts from CSV" width={660}>
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {['Upload File', 'Map Columns', 'Options', 'Done'].map((s, i) => (
          <div key={s} style={{ padding: '8px 14px', fontSize: 12, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--primary)' : step > i + 1 ? 'var(--green)' : 'var(--text3)', borderBottom: `2px solid ${step === i + 1 ? 'var(--primary)' : 'transparent'}`, marginBottom: -2 }}>
            {step > i + 1 ? '✅ ' : `${i + 1}. `}{s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--bg3)', border: '2px dashed var(--border2)', borderRadius: 10, padding: 32, textAlign: 'center' }}>
            <Upload size={32} color="var(--text3)" style={{ marginBottom: 12 }}/>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Upload your CSV file</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Any CSV format — map columns in the next step</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} style={{ fontSize: 13 }}/>
          </div>
          <Select label="Add to List (optional)" value={listId} onChange={e => setListId(e.target.value)}>
            <option value="">No list</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Match each field to your CSV column. Auto-detected what we could!</p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg3)', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              <div>AdoBoost Field</div><div>Your CSV Column</div>
            </div>
            {FIELDS.map(field => (
              <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: mapping[field.key] ? 'var(--bg2)' : field.required ? '#fff5f5' : 'var(--bg2)' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{field.label}</span>
                  {field.required && <span style={{ color: 'var(--red)', marginLeft: 4, fontSize: 11 }}>required</span>}
                </div>
                <select value={mapping[field.key] || ''} onChange={e => m(field.key, e.target.value)}
                  style={{ background: '#fff', border: `1px solid ${mapping[field.key] ? 'var(--green)' : 'var(--border2)'}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none' }}>
                  <option value="">— Not mapped —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          {preview.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Preview (first 3 rows)</div>
              <div style={{ overflowX: 'auto', fontSize: 11, border: '1px solid var(--border)', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
                  <thead><tr style={{ background: 'var(--bg3)' }}>
                    {FIELDS.filter(f => mapping[f.key]).map(f => <th key={f.key} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>{f.label}</th>)}
                  </tr></thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        {FIELDS.filter(f => mapping[f.key]).map(f => <td key={f.key} style={{ padding: '6px 10px', color: row[mapping[f.key]] ? 'var(--text)' : 'var(--text3)' }}>{row[mapping[f.key]] || '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn onClick={() => { if (!mapping.email) return toast.error('Map the Email column first!'); setStep(3); }}>Next: Options →</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {listId && <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 10px', background: '#f0fff4', borderRadius: 6, border: '1px solid #9ae6b4' }}>✅ Will import into: <strong>{lists.find(l => l.id === listId)?.name}</strong></div>}

          {/* Tags for all imported contacts */}
          <div>
            <Input label="Apply tags to all imported contacts (comma separated)" value={importTags} onChange={e => setImportTags(e.target.value)} placeholder="e.g. imported, Q2 2026, cold leads" />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>These tags will be added to every contact in this import batch.</div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>If a contact already exists:</div>
            {[{ value: 'skip', label: 'Skip — keep existing data unchanged', desc: 'Safe — existing contact info is preserved' }, { value: 'update', label: 'Update — overwrite with CSV data', desc: 'Updates name, company, title etc.' }].map(opt => (
              <label key={opt.value} style={{ display: 'flex', gap: 12, padding: '12px 14px', border: `2px solid ${duplicateAction === opt.value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: duplicateAction === opt.value ? 'var(--primary-dim)' : 'var(--bg2)', marginBottom: 8 }}>
                <input type="radio" name="dup" value={opt.value} checked={duplicateAction === opt.value} onChange={e => setDuplicateAction(e.target.value)} style={{ accentColor: 'var(--primary)', marginTop: 2 }}/>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{opt.desc}</div></div>
              </label>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Fallback values when a field is empty</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Used in email personalization when contact has no value.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="First Name fallback" placeholder="there" value={fallbacks.first_name} onChange={e => fb('first_name', e.target.value)} />
              <Input label="Last Name fallback" placeholder="(leave blank)" value={fallbacks.last_name} onChange={e => fb('last_name', e.target.value)} />
              <Input label="Company fallback" placeholder="your company" value={fallbacks.company} onChange={e => fb('company', e.target.value)} />
              <Input label="Title fallback" placeholder="(leave blank)" value={fallbacks.title} onChange={e => fb('title', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
            <Btn loading={loading} onClick={handleImport}><Upload size={13}/> Import Now</Btn>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Import Complete!</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[['Imported', result.imported, 'var(--green)'], ['Updated', result.updated || 0, 'var(--primary)'], ['Skipped', result.skipped, 'var(--yellow)']].map(([l, v, c]) => (
              <div key={l} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          {listId && <p style={{ fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>✅ Contacts added to: <strong>{lists.find(l => l.id === listId)?.name}</strong></p>}
          <Btn onClick={onSaved}>Done ✓</Btn>
        </div>
      )}
    </Modal>
  );
}

// ── Move to List Modal ───────────────────────────
function MoveToListModal({ open, onClose, lists, onMove, count }) {
  const [listId, setListId] = useState('');
  useEffect(() => { if (!open) setListId(''); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={`Move ${count} Contact${count !== 1 ? 's' : ''} to List`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>Select which list to move the selected contacts to.</p>
        <Select label="Select List" value={listId} onChange={e => setListId(e.target.value)}>
          <option value="">— Choose a list —</option>
          <option value="none">Remove from list</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.total_contacts || 0} contacts)</option>)}
        </Select>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (!listId) return; onMove(listId === 'none' ? null : listId); }} disabled={!listId}>📂 Move to List</Btn>
        </div>
      </div>
    </Modal>
  );
}
