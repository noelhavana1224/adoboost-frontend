import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Select, Table, TR, TD, Pagination } from '../components/UI';
import { Users, Plus, Upload, Trash2, Search, List, ShoppingCart } from 'lucide-react';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [lists, setLists] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, lr] = await Promise.all([
        api.get('/contacts', { params: { list_id:selectedList||undefined, search:search||undefined, page, limit:50 } }),
        api.get('/contacts/lists'),
      ]);
      setContacts(cr.data.contacts); setTotal(cr.data.total); setLists(lr.data);
    } finally { setLoading(false); }
  }, [page, search, selectedList]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try { await api.delete(`/contacts/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleDeleteList = async (id) => {
    if (!confirm('Delete this list and all its contacts?')) return;
    try { await api.delete(`/contacts/lists/${id}`); toast.success('List deleted'); if (selectedList===id) setSelectedList(''); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${total.toLocaleString()} total contacts`}
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={()=>setModal('list')}><List size={14}/> New List</Btn>
            <Btn variant="secondary" onClick={()=>setModal('import')}><Upload size={14}/> Import CSV</Btn>
            <Btn onClick={()=>setModal('add')}><Plus size={14}/> Add Contact</Btn>
          </div>
        }
      />
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20 }}>
        {/* Lists sidebar */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Lists</div>
          <Card style={{ padding:8 }}>
            <button onClick={()=>{setSelectedList('');setPage(1);}} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'8px 10px', borderRadius:6, border:'none', background:selectedList===''?'var(--primary-dim)':'transparent', color:selectedList===''?'var(--primary)':'var(--text2)', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:selectedList===''?600:400 }}>
              <span>All Contacts</span><span>{total}</span>
            </button>
            {lists.map(l => (
              <div key={l.id} style={{ display:'flex', alignItems:'center', gap:2 }}>
                <button onClick={()=>{setSelectedList(l.id);setPage(1);}} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:6, border:'none', background:selectedList===l.id?'var(--primary-dim)':'transparent', color:selectedList===l.id?'var(--primary)':'var(--text2)', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:selectedList===l.id?600:400 }}>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{l.name}</span>
                  <span style={{ fontSize:11, flexShrink:0 }}>{l.total_contacts||0}</span>
                </button>
                <button onClick={()=>handleDeleteList(l.id)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:'2px 4px', fontSize:16 }}>×</button>
              </div>
            ))}
          </Card>
          {lists.length > 0 && (
            <div style={{ marginTop:8, fontSize:11, color:'var(--text3)' }}>
              {lists.reduce((a,l)=>a+(l.good_contacts||0),0)} good · {lists.reduce((a,l)=>a+(l.bad_contacts||0),0)} bad
            </div>
          )}
        </div>

        {/* Main */}
        <div>
          <div style={{ position:'relative', marginBottom:14 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
            <input placeholder="Search contacts..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              style={{ width:'100%', background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:14, outline:'none', color:'var(--text)' }} />
          </div>
          {loading ? <Spinner /> : contacts.length===0 ? (
            <Empty icon={Users} title="No contacts" description="Add contacts manually or import a CSV file."
              action={<Btn onClick={()=>setModal('import')}><Upload size={14}/> Import CSV</Btn>} />
          ) : (
            <Card style={{ padding:0, overflow:'hidden' }}>
              <Table headers={['Email','Name','Company','Title','Status','Actions']}>
                {contacts.map(c => (
                  <TR key={c.id}>
                    <TD style={{ fontWeight:500 }}>{c.email}</TD>
                    <TD>{[c.first_name,c.last_name].filter(Boolean).join(' ')||'—'}</TD>
                    <TD style={{ color:'var(--text2)' }}>{c.company||'—'}</TD>
                    <TD style={{ color:'var(--text2)' }}>{c.title||'—'}</TD>
                    <TD>{c.unsubscribed?<Badge color="red">Unsub</Badge>:c.bounced?<Badge color="yellow">Bounced</Badge>:<Badge color="green">Active</Badge>}</TD>
                    <TD><Btn size="sm" variant="danger" onClick={()=>handleDelete(c.id)}><Trash2 size={12}/></Btn></TD>
                  </TR>
                ))}
              </Table>
              <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
                <Pagination page={page} total={total} limit={50} onChange={setPage} />
              </div>
            </Card>
          )}
        </div>
      </div>

      <AddContactModal open={modal==='add'} onClose={()=>setModal(null)} lists={lists} onSaved={()=>{setModal(null);load();}} />
      <ImportModal open={modal==='import'} onClose={()=>setModal(null)} lists={lists} onSaved={()=>{setModal(null);load();}} />
      <NewListModal open={modal==='list'} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}} />
    </div>
  );
}

function AddContactModal({ open, onClose, lists, onSaved }) {
  const [form, setForm] = useState({ email:'', first_name:'', last_name:'', company:'', title:'', phone:'', list_id:'' });
  const [loading, setLoading] = useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/contacts', form); toast.success('Contact added'); onSaved(); }
    catch(err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Contact">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input label="Email *" type="email" value={form.email} onChange={e=>f('email',e.target.value)} required />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Input label="First Name" value={form.first_name} onChange={e=>f('first_name',e.target.value)} />
          <Input label="Last Name" value={form.last_name} onChange={e=>f('last_name',e.target.value)} />
          <Input label="Company" value={form.company} onChange={e=>f('company',e.target.value)} />
          <Input label="Job Title" value={form.title} onChange={e=>f('title',e.target.value)} />
        </div>
        <Select label="Add to List" value={form.list_id} onChange={e=>f('list_id',e.target.value)}>
          <option value="">No list</option>
          {lists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Add Contact</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ open, onClose, lists, onSaved }) {
  const [listId, setListId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const handleImport = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return toast.error('Select a CSV file');
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('file', file); if (listId) fd.append('list_id', listId);
      const { data } = await api.post('/contacts/import', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setResult(data); toast.success(`Imported ${data.imported} contacts`);
    } catch(err) { toast.error(err.response?.data?.error||'Import failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={()=>{onClose();setResult(null);}} title="Import Contacts from CSV">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--bg3)', border:'2px dashed var(--border2)', borderRadius:10, padding:24, textAlign:'center' }}>
          <Upload size={30} color="var(--text3)" style={{ marginBottom:10 }} />
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:10 }}>
            Required column: <code>email</code><br/>
            Optional: <code>first_name</code>, <code>last_name</code>, <code>company</code>, <code>title</code>, <code>phone</code>
          </p>
          <input ref={fileRef} type="file" accept=".csv" style={{ fontSize:13 }} />
        </div>
        <Select label="Add to List (optional)" value={listId} onChange={e=>setListId(e.target.value)}>
          <option value="">No list</option>
          {lists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
        {result && <div style={{ background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:8, padding:12, fontSize:13 }}>✅ <strong>{result.imported}</strong> imported · <strong>{result.skipped}</strong> skipped</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
          {!result && <Btn loading={loading} onClick={handleImport}><Upload size={13}/> Import</Btn>}
          {result && <Btn onClick={onSaved}>Done</Btn>}
        </div>
      </div>
    </Modal>
  );
}

function NewListModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', description:'' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/contacts/lists', form); toast.success('List created'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create Contact List">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input label="List Name *" placeholder="e.g. Hotels & Motels USA" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
        <Input label="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Create List</Btn>
        </div>
      </form>
    </Modal>
  );
}
