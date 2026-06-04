import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/UI';
import { Flame, ThumbsUp, RefreshCw, Search, Mail, ArrowRight, Sparkles, Inbox } from 'lucide-react';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function avatarColor(s) {
  const c = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0; for (let i = 0; i < (s||'').length; i++) h = (s||'').charCodeAt(i) + ((h<<5)-h);
  return c[Math.abs(h) % c.length];
}
function initials(name, email) {
  const s = name || email || '?';
  const parts = s.split(/[\s@._]+/).filter(Boolean);
  return (parts.length >= 2 ? parts[0][0]+parts[1][0] : s.slice(0,2)).toUpperCase();
}
function snippet(body) {
  return String(body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
}

const CAT = {
  interested: { label: '🔥 Interested', color: '#dc2626', bg: '#fff5f5', border: '#fca5a5' },
  positive:   { label: '👍 Positive',   color: '#16a34a', bg: '#f0fff4', border: '#86efac' },
};

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads]     = useState([]);
  const [counts, setCounts]   = useState({ interested: 0, positive: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // all | interested | positive
  const [search, setSearch]   = useState('');

  const load = useCallback(async (cat = filter, q = search) => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/leads', { params: { category: cat, search: q || undefined } });
      setLeads(data.leads || []);
      setCounts(data.counts || { interested: 0, positive: 0, unread: 0 });
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { load('all', ''); }, []);

  const applyFilter = (cat) => { setFilter(cat); load(cat, search); };
  const handleSearch = (e) => { e.preventDefault(); load(filter, search); };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} color="#dc2626"/> Hot Leads
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={12} color="#7c3aed"/> Every reply our AI flagged as interested or positive — auto-collected across all campaigns
          </p>
        </div>
        <button onClick={() => load(filter, search)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { key: 'interested', label: 'Interested', value: counts.interested, icon: <Flame size={18} color="#dc2626"/>, color: '#dc2626', bg: '#fff5f5' },
          { key: 'positive',   label: 'Positive',   value: counts.positive,   icon: <ThumbsUp size={18} color="#16a34a"/>, color: '#16a34a', bg: '#f0fff4' },
          { key: 'unread',     label: 'Unread leads', value: counts.unread,    icon: <Mail size={18} color="#2563eb"/>, color: '#2563eb', bg: '#eff6ff' },
        ].map(s => (
          <div key={s.key} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','All'],['interested','🔥 Interested'],['positive','👍 Positive']].map(([k, lbl]) => (
            <button key={k} onClick={() => applyFilter(k)}
              style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${filter===k ? '#dc2626' : '#e2e8f0'}`, background: filter===k ? '#fff5f5' : '#fff', color: filter===k ? '#dc2626' : '#64748b', fontSize: 13, fontWeight: filter===k ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              {lbl}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
            style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}/>
        </form>
      </div>

      {/* Leads list */}
      {loading ? (
        <Spinner />
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '2px dashed #e2e8f0' }}>
          <Flame size={40} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px', color: '#dc2626' }}/>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>No hot leads yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
            As replies come in, our AI automatically flags interested &amp; positive ones here.<br/>
            They'll appear within a few minutes of landing in your inbox.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leads.map(l => {
            const cat = CAT[l.ai_category] || CAT.positive;
            const isUnread = l.status === 'unread';
            return (
              <div key={l.id}
                onClick={() => navigate('/messages/inbox')}
                style={{ background: '#fff', borderRadius: 12, border: `1px solid ${isUnread ? cat.border : '#e2e8f0'}`, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: avatarColor(l.from_email), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {initials(l.from_name, l.from_email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{l.from_name || l.from_email}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{cat.label}</span>
                    {isUnread && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9, background: '#eff6ff', color: '#2563eb' }}>NEW</span>}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{timeAgo(l.received_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{l.from_email}</span>
                    {l.campaign_name && <span>· 📣 {l.campaign_name}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 3 }}>{(l.subject || '(no subject)').replace(/^(Re:\s*)+/i, '')}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{snippet(l.body)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', flexShrink: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>Open <ArrowRight size={13}/></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
