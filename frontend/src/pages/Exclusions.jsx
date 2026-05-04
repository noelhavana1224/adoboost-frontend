import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Btn, Badge, Spinner, Empty, Modal, Input, Table, TR, TD, Pagination } from '../components/UI';
import { Ban, Plus, Upload, Trash2, Search } from 'lucide-react';

export default function Exclusions({ type='exclusions' }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (type==='exclusions') {
        const { data } = await api.get('/exclusions', { params:{ search:search||undefined, page, limit:10 } });
        setItems(data.items); setTotal(data.total);
      } else {
        const { data } = await api.get('/exclusions/unsubscribes', { params:{ page, limit:10 } });
        setItems(data.items); setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, [type, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try { await api.delete(`/exclusions/${id}`); toast.success('Removed'); load(); } catch { toast.error('Failed'); }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return toast.error('Select a file');
    const fd = new FormData(); fd.append('file', file);
    try { const { data } = await api.post('/exclusions/import', fd, { headers:{'Content-Type':'multipart/form-data'} }); toast.success(`Imported ${data.imported}`); load(); }
    catch { toast.error('Import failed'); }
  };

  const handleExport = () => {
    const csv = items.map(i=>`${i.email||i.value},${i.campaign_name||''},${new Date(i.created_at).toLocaleDateString()}`).join('\n');
    const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='unsubscribes.csv'; a.click();
  };

  return (
    <div>
      <PageHeader title={type==='exclusions'?'Exclusions':'Unsubscribe List'}
        subtitle={type==='exclusions'?'Emails and domains excluded from campaigns':'Contacts who have unsubscribed'}
        action={type==='exclusions'?(
          <div style={{ display:'flex', gap:8 }}>
            <label style={{ cursor:'pointer' }}>
              <Btn variant="secondary" as="span"><Upload size={13}/> Import</Btn>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleImport} />
            </label>
            <Btn onClick={()=>setShowAdd(true)}><Plus size={13}/> Add Exclusion</Btn>
          </div>
        ):(
          <Btn variant="secondary" onClick={handleExport}><Upload size={13}/> Export List</Btn>
        )}
      />
      {type==='exclusions' && (
        <div style={{ position:'relative', marginBottom:16 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
          <input placeholder="Search domain or email..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            style={{ width:'100%', maxWidth:380, background:'#fff', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px 9px 32px', fontSize:14, outline:'none' }} />
        </div>
      )}
      {loading ? <Spinner /> : items.length===0 ? (
        <Empty icon={Ban} title={type==='exclusions'?'No exclusions':'No unsubscribes'} description={type==='exclusions'?'Add emails or domains to exclude from all campaigns.':'Contacts who unsubscribe will appear here.'} />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <Table headers={type==='exclusions'?['Name/Email','Date Created','Type','Actions']:['Campaign','Email','Date']}>
            {items.map((item,i) => (
              <TR key={item.id||i}>
                {type==='exclusions' ? <>
                  <TD style={{ fontWeight:500 }}>{item.value}</TD>
                  <TD style={{ color:'var(--text2)' }}>{new Date(item.created_at).toLocaleDateString()}</TD>
                  <TD><Badge color={item.type==='domain'?'purple':'blue'}>{item.type}</Badge></TD>
                  <TD><Btn size="sm" variant="danger" onClick={()=>handleDelete(item.id)}><Trash2 size={12}/></Btn></TD>
                </> : <>
                  <TD style={{ color:item.campaign_name?'var(--red)':'var(--text2)' }}>{item.campaign_name||'CAMPAIGN DELETED'}</TD>
                  <TD>{item.email}</TD>
                  <TD style={{ color:'var(--text3)' }}>{new Date(item.created_at).toLocaleString()}</TD>
                </>}
              </TR>
            ))}
          </Table>
          <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
            <Pagination page={page} total={total} limit={10} onChange={setPage} />
          </div>
        </Card>
      )}
      <AddExclusionModal open={showAdd} onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false);load();}} />
    </div>
  );
}

function AddExclusionModal({ open, onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [type, setType] = useState('email');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/exclusions', { value, type }); toast.success('Added'); onSaved(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Exclusion">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input label="Email or Domain" placeholder="e.g. user@example.com or example.com" value={value} onChange={e=>setValue(e.target.value)} required />
        <div style={{ display:'flex', gap:8 }}>
          {['email','domain'].map(t => (
            <button type="button" key={t} onClick={()=>setType(t)} style={{ padding:'7px 16px', borderRadius:7, border:`2px solid ${type===t?'var(--primary)':'var(--border2)'}`, background:type===t?'var(--primary-dim)':'#fff', color:type===t?'var(--primary)':'var(--text2)', fontWeight:type===t?700:400, fontSize:13, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>Add</Btn>
        </div>
      </form>
    </Modal>
  );
}
