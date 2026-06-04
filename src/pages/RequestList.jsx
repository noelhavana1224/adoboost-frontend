import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/UI';
import { ListChecks, Sparkles, Send, Clock, Loader2, CheckCircle2, XCircle, Building2, Users, MapPin, Target, Tag } from 'lucide-react';

const SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+', 'Any'];
const COUNTS = [100, 250, 500, 1000, 2500];

const STATUS = {
  pending:     { label: 'Pending',     color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: Clock },
  in_progress: { label: 'In progress', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Loader2 },
  delivered:   { label: 'Delivered',   color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: XCircle },
};

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={13} color="#94a3b8" /> {label}
      </label>
      {children}
    </div>
  );
}
const inputStyle = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' };

export default function RequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ industries: '', job_titles: '', locations: '', company_size: 'Any', target_count: 250, keywords: '', notes: '' });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/list-requests'); setRequests(data || []); }
    catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.industries.trim() && !form.job_titles.trim()) { toast.error('Add at least an industry or job title.'); return; }
    setSubmitting(true);
    try {
      await api.post('/list-requests', form);
      toast.success('✅ Request sent! Our team will start building your list.');
      setForm({ industries: '', job_titles: '', locations: '', company_size: 'Any', target_count: 250, keywords: '', notes: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this request?')) return;
    try { await api.post(`/list-requests/${id}/cancel`); toast.success('Request cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListChecks size={20} color="#2563eb" /> Request a Lead List
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Tell us your ideal customer — our team builds a <strong>verified, ready-to-send</strong> list and drops it straight into your Contacts.
        </p>
      </div>

      {/* Value banner */}
      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', border: '1px solid #c7d2fe', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 12.5, color: '#3730a3', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Sparkles size={15} color="#6366f1" style={{ flexShrink: 0 }} />
        <span>Done-for-you list building: our team sources leads matched to your criteria, runs them through <strong>email verification</strong>, and delivers a clean list — no scraping or bad data on your end.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, alignItems: 'start' }}>
        {/* Form */}
        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field icon={Building2} label="Target industries">
            <input style={inputStyle} placeholder="e.g. SaaS, Plumbing, Real Estate, Healthcare" value={form.industries} onChange={e => f('industries', e.target.value)} />
          </Field>
          <Field icon={Users} label="Job titles / roles">
            <input style={inputStyle} placeholder="e.g. Owner, Marketing Director, VP of Sales" value={form.job_titles} onChange={e => f('job_titles', e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field icon={MapPin} label="Locations">
              <input style={inputStyle} placeholder="e.g. United States, UK, Texas" value={form.locations} onChange={e => f('locations', e.target.value)} />
            </Field>
            <Field icon={Building2} label="Company size">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.company_size} onChange={e => f('company_size', e.target.value)}>
                {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </Field>
          </div>
          <Field icon={Target} label="How many leads?">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COUNTS.map(c => (
                <button type="button" key={c} onClick={() => f('target_count', c)}
                  style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${form.target_count === c ? '#2563eb' : '#e2e8f0'}`, background: form.target_count === c ? '#eff6ff' : '#fff', color: form.target_count === c ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: form.target_count === c ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c.toLocaleString()}
                </button>
              ))}
            </div>
          </Field>
          <Field icon={Tag} label="Keywords / extra criteria (optional)">
            <input style={inputStyle} placeholder="e.g. uses Shopify, recently funded, hiring" value={form.keywords} onChange={e => f('keywords', e.target.value)} />
          </Field>
          <Field icon={ListChecks} label="Anything else? (optional)">
            <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} placeholder="Exclusions, specific companies to target/avoid, deadline…" value={form.notes} onChange={e => f('notes', e.target.value)} />
          </Field>
          <button type="submit" disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            {submitting ? 'Sending…' : 'Request My List'}
          </button>
        </form>

        {/* Requests history */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Your requests</div>
          {loading ? <Spinner /> : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: 13 }}>
              No requests yet. Fill the form to get your first list.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map(r => {
                const s = STATUS[r.status] || STATUS.pending;
                const SIcon = s.icon;
                return (
                  <div key={r.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        <SIcon size={11} style={r.status === 'in_progress' ? { animation: 'spin 1.4s linear infinite' } : {}} /> {s.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>
                      {r.target_count?.toLocaleString()} leads · {r.industries || r.job_titles}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>
                      {[r.job_titles, r.locations, r.company_size && `${r.company_size} emp`].filter(Boolean).join(' · ')}
                    </div>
                    {r.status === 'delivered' && r.delivered_count > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', borderRadius: 7, padding: '6px 10px' }}>
                        ✅ {r.delivered_count.toLocaleString()} verified leads delivered to your Contacts
                      </div>
                    )}
                    {r.admin_notes && (
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#475569', background: '#f8fafc', borderRadius: 7, padding: '6px 10px' }}>💬 {r.admin_notes}</div>
                    )}
                    {r.status === 'pending' && (
                      <button onClick={() => cancel(r.id)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#dc2626', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Cancel request</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
