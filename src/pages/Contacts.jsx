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
  const [step, setStep] = useState(1); // 1=upload, 2=map columns, 3=options, 4=result
  const [listId, setListId] = useState('');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({});
  const [duplicateAction, setDuplicateAction] = useState('skip'); // skip or update
  const [fallbacks, setFallbacks] = useState({
    first_name: 'there',
    last_name: '',
    company: 'your company',
    title: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const FIELDS = [
    { key: 'email',      label: 'Email *',     required: true },
    { key: 'first_name', label: 'First Name',   required: false },
    { key: 'last_name',  label: 'Last Name',    required: false },
    { key: 'company',    label: 'Company',      required: false },
    { key: 'title',      label: 'Job Title',    required: false },
    { key: 'phone',      label: 'Phone',        required: false },
    { key: 'website',    label: 'Website',      required: false },
  ];

  useEffect(() => {
    if (!open) { setStep(1); setFile(null); setHeaders([]); setPreview([]); setMapping({}); setResult(null); }
  }, [open]);

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
      // Auto-detect mapping
      const autoMap = {};
      const fieldAliases = {
        email:      ['email', 'e-mail', 'email address', 'emailaddress'],
        first_name: ['first_name', 'firstname', 'first name', 'fname', 'first'],
        last_name:  ['last_name', 'lastname', 'last name', 'lname', 'last'],
        company:    ['company', 'company name', 'organization', 'org', 'business'],
        title:      ['title', 'job title', 'jobtitle', 'position', 'role'],
        phone:      ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
        website:    ['website', 'url', 'web', 'domain'],
      };
      rawHeaders.forEach(h => {
        const hl = h.toLowerCase().trim();
        for (const [field, aliases] of Object.entries(fieldAliases)) {
          if (aliases.includes(hl) && !autoMap[field]) {
            autoMap[field] = h;
          }
        }
      });
      setMapping(autoMap);
      // Preview first 3 data rows
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
    if (!mapping.email) return toast.error('You must map the Email column!');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (listId) fd.append('list_id', listId);
      fd.append('mapping', JSON.stringify(mapping));
      fd.append('duplicate_action', duplicateAction);
      fd.append('fallbacks', JSON.stringify(fallbacks));
      const { data } = await api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      setStep(4);
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    finally { setLoading(false); }
  };

  const m = (k, v) => setMapping(p => ({ ...p, [k]: v }));
  const fb = (k, v) => setFallbacks(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={() => { onClose(); setStep(1); setResult(null); }} title="Import Contacts from CSV" width={640}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {['Upload File', 'Map Columns', 'Options', 'Done'].map((s, i) => (
          <div key={s} style={{ padding: '8px 16px', fontSize: 12, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--primary)' : step > i + 1 ? 'var(--green)' : 'var(--text3)', borderBottom: `2px solid ${step === i + 1 ? 'var(--primary)' : 'transparent'}`, marginBottom: -2 }}>
            {step > i + 1 ? '✅ ' : `${i + 1}. `}{s}
          </div>
        ))}
      </div>

      {/* STEP 1 — Upload */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--bg3)', border: '2px dashed var(--border2)', borderRadius: 10, padding: 32, textAlign: 'center' }}>
            <Upload size={32} color="var(--text3)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Upload your CSV file</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
              Any CSV format works — you'll map the columns in the next step.<br />
              The only required column is one containing email addresses.
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} style={{ fontSize: 13 }} />
          </div>
          <Select label="Add to List (optional)" value={listId} onChange={e => setListId(e.target.value)}>
            <option value="">No list — just import contacts</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.total_contacts || 0} contacts)</option>)}
          </Select>
          <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text2)' }}>
            💡 <strong>Tip:</strong> Your CSV can have any column names — e.g. "Email Address", "First", "Org Name". You'll match them to the right fields in the next step.
          </div>
        </div>
      )}

      {/* STEP 2 — Column Mapping */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            Your CSV has <strong>{headers.length} columns</strong>. Match each field below to the correct column. We auto-detected what we could!
          </p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg3)', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
              <div>AdoBoost Field</div>
              <div>Your CSV Column</div>
            </div>
            {FIELDS.map(field => (
              <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: mapping[field.key] ? 'var(--bg2)' : field.required ? '#fff5f5' : 'var(--bg2)' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{field.label}</span>
                  {field.required && <span style={{ color: 'var(--red)', marginLeft: 4, fontSize: 11 }}>required</span>}
                </div>
                <select value={mapping[field.key] || ''} onChange={e => m(field.key, e.target.value)}
                  style={{ background: 'var(--bg2)', border: `1px solid ${mapping[field.key] ? 'var(--green)' : 'var(--border2)'}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%' }}>
                  <option value="">— Not mapped —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Preview (first 3 rows)</div>
              <div style={{ overflowX: 'auto', fontSize: 11, border: '1px solid var(--border)', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg3)' }}>
                      {FIELDS.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        {FIELDS.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} style={{ padding: '6px 10px', color: row[mapping[f.key]] ? 'var(--text)' : 'var(--text3)' }}>
                            {row[mapping[f.key]] || <em>empty</em>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn onClick={() => { if (!mapping.email) return toast.error('Please map the Email column!'); setStep(3); }}>
              Next: Options →
            </Btn>
          </div>
        </div>
      )}

      {/* STEP 3 — Options */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Duplicate handling */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>If a contact already exists (duplicate email):</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'skip', label: 'Skip — keep existing contact unchanged', desc: 'Safe option — existing data is preserved' },
                { value: 'update', label: 'Update — overwrite with new data from CSV', desc: 'Updates name, company, title etc. from the CSV' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, padding: '12px 14px', border: `2px solid ${duplicateAction === opt.value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: duplicateAction === opt.value ? 'var(--primary-dim)' : 'var(--bg2)' }}>
                  <input type="radio" name="dup" value={opt.value} checked={duplicateAction === opt.value} onChange={e => setDuplicateAction(e.target.value)} style={{ marginTop: 2, accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fallback values */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Fallback values when a field is empty</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
              If a contact has no first name, use this fallback in your emails instead of leaving it blank.<br />
              Example: "Hi <strong>there</strong>" instead of "Hi "
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="First Name fallback" placeholder='e.g. there' value={fallbacks.first_name} onChange={e => fb('first_name', e.target.value)} hint='Used in {{first_name}} if empty' />
              <Input label="Last Name fallback" placeholder='e.g. (leave blank)' value={fallbacks.last_name} onChange={e => fb('last_name', e.target.value)} hint='Used in {{last_name}} if empty' />
              <Input label="Company fallback" placeholder='e.g. your company' value={fallbacks.company} onChange={e => fb('company', e.target.value)} hint='Used in {{company}} if empty' />
              <Input label="Title fallback" placeholder='e.g. (leave blank)' value={fallbacks.title} onChange={e => fb('title', e.target.value)} hint='Used in {{title}} if empty' />
            </div>
            <div style={{ marginTop: 10, background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
              💡 <strong>Example:</strong> Your email says "Hi {'{{first_name}}'}," — if contact has no first name, it will say "Hi <strong>{fallbacks.first_name || '(blank)'}</strong>,"
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
            <Btn loading={loading} onClick={handleImport}><Upload size={13} /> Import Now</Btn>
          </div>
        </div>
      )}

      {/* STEP 4 — Result */}
      {step === 4 && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Import Complete!</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              ['Imported', result.imported, 'var(--green)'],
              ['Updated', result.updated || 0, 'var(--primary)'],
              ['Skipped', result.skipped, 'var(--yellow)'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red-border)', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <strong>Issues found:</strong> {result.errors.slice(0, 3).join(', ')}
              {result.errors.length > 3 && ` and ${result.errors.length - 3} more`}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={onSaved}>Done ✓</Btn>
          </div>
        </div>
      )}
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
