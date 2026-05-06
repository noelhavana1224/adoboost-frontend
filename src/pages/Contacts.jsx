import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Pagination } from '../components/UI';
import { Users, Plus, Upload, Trash2, Search, Edit2, CheckSquare, Square, List } from 'lucide-react';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [lists, setLists] = useState([]);
  const [allTotal, setAllTotal] = useState(0); // total count regardless of filter
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [dragOverList, setDragOverList] = useState(null);
  const [draggingContact, setDraggingContact] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const [cr, lr, allCr] = await Promise.all([
        api.get('/contacts', { params: { list_id: selectedList || undefined, search: search || undefined, page, limit: 50 } }),
        api.get('/contacts/lists'),
        // Always fetch total count without filter for "All Contacts" badge
        api.get('/contacts', { params: { page: 1, limit: 1 } }),
      ]);
      setContacts(cr.data.contacts);
      setTotal(cr.data.total);
      setLists(lr.data);
      setAllTotal(allCr.data.total);
    } finally { setLoading(false); }
  }, [page, search, selectedList]);

  useEffect(() => { load(); }, [load]);

  // Selection handlers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map(c => c.id)));
    }
  };

  const handleDeleteOne = async (id, force = false) => {
    if (!force && !confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}${force ? '?force=true' : ''}`);
      toast.success('Contact deleted');
      load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.warning) {
        const { message } = err.response.data;
        const confirmed = confirm(`⚠️ Warning!\n\n${message}\n\nAre you sure you want to delete anyway?`);
        if (confirmed) handleDeleteOne(id, true);
      } else {
        toast.error(err.response?.data?.error || 'Failed to delete');
      }
    }
  };

  const handleBulkDelete = async (force = false) => {
    if (selected.size === 0) return;
    if (!force && !confirm(`Delete ${selected.size} selected contact${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const { data } = await api.post('/contacts/bulk-delete', { ids: Array.from(selected), force });
      toast.success(`${data.deleted} contact${data.deleted > 1 ? 's' : ''} deleted`);
      setSelected(new Set());
      load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.warning) {
        const { message, inCampaign } = err.response.data;
        const campaignNames = [...new Set(inCampaign.map(c => c.campaign))].join(', ');
        const emails = inCampaign.map(c => c.email).join(', ');
        const confirmed = confirm(`⚠️ Warning!\n\n${message}\n\nCampaign(s): ${campaignNames}\nAffected: ${emails}\n\nDelete anyway?`);
        if (confirmed) handleBulkDelete(true);
      } else {
        toast.error(err.response?.data?.error || 'Bulk delete failed');
      }
    } finally { setDeleting(false); }
  };

  const handleDeleteList = async (id) => {
    if (!confirm('Delete this list? Contacts will not be deleted, just removed from the list.')) return;
    try {
      await api.delete(`/contacts/lists/${id}`);
      toast.success('List deleted');
      if (selectedList === id) setSelectedList('');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleBulkMove = async (listId) => {
    try {
      const { data } = await api.post('/contacts/bulk-move', { ids: Array.from(selected), list_id: listId });
      toast.success(`${data.moved} contact${data.moved > 1 ? 's' : ''} moved to list`);
      setSelected(new Set());
      setShowMoveModal(false);
      load();
    } catch { toast.error('Failed to move contacts'); }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, contact) => {
    setDraggingContact(contact);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', contact.id);
  };

  const handleDragEnd = () => {
    setDraggingContact(null);
    setDragOverList(null);
  };

  const handleDragOver = (e, listId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverList(listId);
  };

  const handleDragLeave = () => {
    setDragOverList(null);
  };

  const handleDrop = async (e, listId) => {
    e.preventDefault();
    setDragOverList(null);
    if (!draggingContact) return;
    if (draggingContact.list_id === listId) return;
    try {
      await api.post('/contacts/bulk-move', { ids: [draggingContact.id], list_id: listId });
      toast.success(`Moved ${draggingContact.email} to list`);
      load();
    } catch { toast.error('Failed to move contact'); }
    setDraggingContact(null);
  };

  const handleDropToAll = async (e) => {
    e.preventDefault();
    setDragOverList(null);
    if (!draggingContact) return;
    try {
      await api.post('/contacts/bulk-move', { ids: [draggingContact.id], list_id: null });
      toast.success(`Removed ${draggingContact.email} from list`);
      load();
    } catch { toast.error('Failed'); }
    setDraggingContact(null);
  };

  const allSelected = contacts.length > 0 && selected.size === contacts.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${allTotal.toLocaleString()} total contacts`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModal('list')}><List size={14} /> New List</Btn>
            <Btn variant="secondary" onClick={() => setModal('import')}><Upload size={14} /> Import CSV</Btn>
            <Btn onClick={() => setModal('add')}><Plus size={14} /> Add Contact</Btn>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Lists Sidebar */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lists</div>
          {draggingContact && (
            <div style={{ fontSize: 11, color: 'var(--primary)', marginBottom: 6, padding: '4px 8px', background: 'var(--primary-dim)', borderRadius: 6, textAlign: 'center' }}>
              🖱️ Drop onto a list to move
            </div>
          )}
          <Card style={{ padding: 8 }}>
            {/* All Contacts — always shows total regardless of filter */}
            <button
              onClick={() => { setSelectedList(''); setPage(1); }}
              onDragOver={(e) => handleDragOver(e, 'all')}
              onDragLeave={handleDragLeave}
              onDrop={handleDropToAll}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 10px', borderRadius: 6, border: dragOverList === 'all' ? '2px dashed var(--primary)' : '2px solid transparent',
                background: selectedList === '' ? 'var(--primary-dim)' : dragOverList === 'all' ? 'var(--primary-dim)' : 'transparent',
                color: selectedList === '' ? 'var(--primary)' : 'var(--text2)',
                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                fontWeight: selectedList === '' ? 600 : 400,
                transition: 'all 0.15s',
              }}>
              <span>All Contacts</span>
              <span style={{ fontSize: 12, background: 'var(--bg3)', padding: '1px 7px', borderRadius: 10 }}>{allTotal}</span>
            </button>

            {/* Individual Lists */}
            {lists.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  onClick={() => { setSelectedList(l.id); setPage(1); }}
                  onDragOver={(e) => handleDragOver(e, l.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, l.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 6,
                    border: dragOverList === l.id ? '2px dashed var(--primary)' : '2px solid transparent',
                    background: selectedList === l.id ? 'var(--primary-dim)' : dragOverList === l.id ? 'var(--primary-dim)' : 'transparent',
                    color: selectedList === l.id ? 'var(--primary)' : 'var(--text2)',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                    fontWeight: selectedList === l.id ? 600 : 400,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{l.name}</span>
                  <span style={{ fontSize: 11, flexShrink: 0, background: 'var(--bg3)', padding: '1px 6px', borderRadius: 10 }}>{l.total_contacts || 0}</span>
                </button>
                <button onClick={() => handleDeleteList(l.id)} style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  cursor: 'pointer', padding: '4px 6px', borderRadius: 4,
                  fontSize: 16, lineHeight: 1, flexShrink: 0,
                }} title="Delete list">×</button>
              </div>
            ))}
            {lists.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 10px', textAlign: 'center' }}>No lists yet</div>
            )}
          </Card>
          {draggingContact && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
              Moving: {draggingContact.email}
            </div>
          )}
        </div>

        {/* Main Contact Table */}
        <div>
          {/* Search + Bulk Actions Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input placeholder="Search by email, name or company..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 14, outline: 'none', color: 'var(--text)' }} />
            </div>
            {selected.size > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setShowMoveModal(true)}>
                  📂 Move {selected.size} to List
                </Btn>
                <Btn variant="danger" loading={deleting} onClick={() => handleBulkDelete()}>
                  <Trash2 size={13} /> Delete {selected.size}
                </Btn>
              </div>
            )}
          </div>

          {loading ? <Spinner /> : contacts.length === 0 ? (
            <Empty icon={Users} title="No contacts found"
              description={search ? 'Try a different search term' : selectedList ? 'This list is empty. Import contacts or drag contacts here from All Contacts.' : 'Add contacts manually or import a CSV file.'}
              action={!search && <Btn onClick={() => setModal('import')}><Upload size={14} /> Import CSV</Btn>} />
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg3)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '10px 14px', width: 40 }}>
                        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: allSelected ? 'var(--primary)' : 'var(--text3)' }}>
                          {allSelected ? <CheckSquare size={16} /> : someSelected ? <CheckSquare size={16} color="var(--primary)" style={{ opacity: 0.5 }} /> : <Square size={16} />}
                        </button>
                      </th>
                      {['', 'Email', 'Name', 'Company', 'Title', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(c => (
                      <tr key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, c)}
                        onDragEnd={handleDragEnd}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: selected.has(c.id) ? 'var(--primary-dim)' : draggingContact?.id === c.id ? 'var(--bg3)' : 'transparent',
                          transition: 'background 0.1s',
                          cursor: 'grab',
                          opacity: draggingContact?.id === c.id ? 0.5 : 1,
                        }}>
                        <td style={{ padding: '10px 14px', width: 40 }}>
                          <button onClick={() => toggleSelect(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: selected.has(c.id) ? 'var(--primary)' : 'var(--text3)' }}>
                            {selected.has(c.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        {/* Drag handle */}
                        <td style={{ padding: '10px 6px', width: 20, color: 'var(--text3)', fontSize: 16, cursor: 'grab' }} title="Drag to move to a list">⠿</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13 }}>
                          {[c.first_name, c.last_name].filter(Boolean).join(' ') || <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>{c.company || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>{c.title || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {c.unsubscribed ? <Badge color="red">Unsubscribed</Badge>
                            : c.bounced ? <Badge color="yellow">Bounced</Badge>
                              : <Badge color="green">Active</Badge>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Btn size="sm" variant="secondary" onClick={() => setEditContact(c)} title="Edit">
                              <Edit2 size={12} />
                            </Btn>
                            <Btn size="sm" variant="danger" onClick={() => handleDeleteOne(c.id)} title="Delete">
                              <Trash2 size={12} />
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {selected.size > 0 ? (
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selected.size} selected — drag to a list or use Move button</span>
                  ) : (
                    <span>Showing {contacts.length} of {total.toLocaleString()} contacts{draggingContact ? ' — drop on a list to move' : ' — drag rows to move between lists'}</span>
                  )}
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

function AddContactModal({ open, onClose, lists, onSaved }) {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '', title: '', phone: '', list_id: '' });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  useEffect(() => { if (open) setForm({ email: '', first_name: '', last_name: '', company: '', title: '', phone: '', list_id: '' }); }, [open]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/contacts', form); toast.success('Contact added'); onSaved(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Contact">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Email *" type="email" value={form.email} onChange={e => f('email', e.target.value)} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="First Name" value={form.first_name} onChange={e => f('first_name', e.target.value)} />
          <Input label="Last Name" value={form.last_name} onChange={e => f('last_name', e.target.value)} />
          <Input label="Company" value={form.company} onChange={e => f('company', e.target.value)} />
          <Input label="Job Title" value={form.title} onChange={e => f('title', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} />
        </div>
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

function EditContactModal({ contact, onClose, lists, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  useEffect(() => {
    if (contact) setForm({ email: contact.email, first_name: contact.first_name || '', last_name: contact.last_name || '', company: contact.company || '', title: contact.title || '', phone: contact.phone || '', list_id: contact.list_id || '' });
  }, [contact]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.put(`/contacts/${contact.id}`, form);
      toast.success('Contact updated'); onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={!!contact} onClose={onClose} title="Edit Contact">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Email *" type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="First Name" value={form.first_name || ''} onChange={e => f('first_name', e.target.value)} />
          <Input label="Last Name" value={form.last_name || ''} onChange={e => f('last_name', e.target.value)} />
          <Input label="Company" value={form.company || ''} onChange={e => f('company', e.target.value)} />
          <Input label="Job Title" value={form.title || ''} onChange={e => f('title', e.target.value)} />
          <Input label="Phone" value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
        </div>
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

// FIX: Pass selectedList as default listId so imported contacts go to the right list
function ImportModal({ open, onClose, lists, selectedList, onSaved }) {
  const [step, setStep] = useState(1);
  const [listId, setListId] = useState('');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({});
  const [duplicateAction, setDuplicateAction] = useState('skip');
  const [fallbacks, setFallbacks] = useState({ first_name: 'there', last_name: '', company: 'your company', title: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const FIELDS = [
    { key: 'email', label: 'Email *', required: true },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'company', label: 'Company' },
    { key: 'title', label: 'Job Title' },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
  ];

  useEffect(() => {
    if (!open) {
      setStep(1); setFile(null); setHeaders([]); setPreview([]); setMapping({}); setResult(null);
    } else {
      // FIX: Pre-select current list when opening import modal
      setListId(selectedList || '');
    }
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
        email: ['email', 'e-mail', 'email address', 'emailaddress', 'mail'],
        first_name: ['first_name', 'firstname', 'first name', 'fname', 'first'],
        last_name: ['last_name', 'lastname', 'last name', 'lname', 'last'],
        company: ['company', 'company name', 'organization', 'org', 'business'],
        title: ['title', 'job title', 'jobtitle', 'position', 'role'],
        phone: ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
        website: ['website', 'url', 'web', 'domain'],
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
      // FIX: Always send list_id if selected — this was the main bug
      if (listId) fd.append('list_id', listId);
      fd.append('mapping', JSON.stringify(mapping));
      fd.append('duplicate_action', duplicateAction);
      fd.append('fallbacks', JSON.stringify(fallbacks));
      const { data } = await api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      setStep(4);
      toast.success(`Import complete! ${data.imported} contacts added${listId ? ' to list' : ''}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    finally { setLoading(false); }
  };

  const m = (k, v) => setMapping(p => ({ ...p, [k]: v }));
  const fb = (k, v) => setFallbacks(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={() => { onClose(); }} title="Import Contacts from CSV" width={660}>
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
            <Upload size={32} color="var(--text3)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Upload your CSV file</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Any CSV format works — you'll map the columns in the next step</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} style={{ fontSize: 13 }} />
          </div>
          <Select label="Add to List (optional)" value={listId} onChange={e => setListId(e.target.value)}>
            <option value="">No list — just import contacts</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
          {listId && (
            <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 10px', background: '#f0fff4', borderRadius: 6, border: '1px solid #9ae6b4' }}>
              ✅ Contacts will be imported into: <strong>{lists.find(l => l.id === listId)?.name}</strong>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Match each field to the correct column from your CSV. We auto-detected what we could!</p>
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
          {listId && (
            <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 10px', background: '#f0fff4', borderRadius: 6, border: '1px solid #9ae6b4' }}>
              ✅ Will import into list: <strong>{lists.find(l => l.id === listId)?.name}</strong>
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>If a contact already exists (same email):</div>
            {[{ value: 'skip', label: 'Skip — keep existing data unchanged', desc: 'Safe — existing contact info is preserved' }, { value: 'update', label: 'Update — overwrite with CSV data', desc: 'Updates name, company, title etc.' }].map(opt => (
              <label key={opt.value} style={{ display: 'flex', gap: 12, padding: '12px 14px', border: `2px solid ${duplicateAction === opt.value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: duplicateAction === opt.value ? 'var(--primary-dim)' : 'var(--bg2)', marginBottom: 8 }}>
                <input type="radio" name="dup" value={opt.value} checked={duplicateAction === opt.value} onChange={e => setDuplicateAction(e.target.value)} style={{ accentColor: 'var(--primary)', marginTop: 2 }} />
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{opt.desc}</div></div>
              </label>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Fallback values when a field is empty</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>If a contact has no first name, use this instead in your emails.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="First Name fallback" placeholder="there" value={fallbacks.first_name} onChange={e => fb('first_name', e.target.value)} />
              <Input label="Last Name fallback" placeholder="(leave blank)" value={fallbacks.last_name} onChange={e => fb('last_name', e.target.value)} />
              <Input label="Company fallback" placeholder="your company" value={fallbacks.company} onChange={e => fb('company', e.target.value)} />
              <Input label="Title fallback" placeholder="(leave blank)" value={fallbacks.title} onChange={e => fb('title', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
            <Btn loading={loading} onClick={handleImport}><Upload size={13} /> Import Now</Btn>
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

function MoveToListModal({ open, onClose, lists, onMove, count }) {
  const [listId, setListId] = useState('');
  useEffect(() => { if (!open) setListId(''); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={`Move ${count} Contact${count !== 1 ? 's' : ''} to List`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          Select which list to move the selected contacts to.
        </p>
        <Select label="Select List" value={listId} onChange={e => setListId(e.target.value)}>
          <option value="">— Choose a list —</option>
          <option value="none">Remove from list (No list)</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.total_contacts || 0} contacts)</option>)}
        </Select>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (!listId) return; onMove(listId === 'none' ? null : listId); }} disabled={!listId}>
            📂 Move to List
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
