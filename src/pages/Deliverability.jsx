import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/UI';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, Globe, Server, HelpCircle } from 'lucide-react';

function StatusPill({ status }) {
  const map = {
    listed:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '⛔ Listed' },
    clean:   { bg: '#f0fdf4', color: '#16a34a', border: '#86efac', label: '✓ Clean' },
    unknown: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: '— Unknown' },
  };
  const s = map[status] || map.unknown;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function DomainCard({ d }) {
  const clean    = d.listedCount === 0 && d.totalLists > 0;
  const listed   = d.listedCount > 0;
  const unchecked = d.totalLists === 0 || d.checkedAt == null;

  const headColor = listed ? '#dc2626' : clean ? '#16a34a' : '#94a3b8';
  const HeadIcon  = listed ? ShieldAlert : clean ? ShieldCheck : Shield;

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${listed ? '#fecaca' : '#e2e8f0'}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f1f5f9', background: listed ? '#fff5f5' : clean ? '#f7fef9' : '#fafafa' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: `1px solid ${headColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HeadIcon size={19} color={headColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={12} color="#94a3b8" /> {d.domain}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {d.ip ? <><Server size={10} style={{ verticalAlign: -1 }} /> {d.ip}</> : 'no A record'}
            {d.checkedAt && <> · checked {new Date(d.checkedAt).toLocaleString()}</>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {unchecked ? (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Not scanned yet</span>
          ) : listed ? (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>{d.listedCount} / {d.totalLists} listed</span>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>All clear</span>
          )}
        </div>
      </div>

      {/* List breakdown */}
      {d.results.length > 0 && (
        <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {d.results.map(r => (
            <div key={r.list} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>
                {r.list} <span style={{ fontSize: 10, color: '#94a3b8' }}>({r.type})</span>
              </span>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}

      {/* Listed warning + remediation */}
      {listed && (
        <div style={{ margin: '0 18px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
          <strong>Action needed:</strong> This domain is on a blocklist, which can send your emails straight to spam. Pause campaigns on this domain, request delisting at the blocklist's site (e.g. spamhaus.org/lookup), check for compromised accounts or spammy content, and let it cool down before resuming.
        </div>
      )}
    </div>
  );
}

// ── DNS Authentication (SPF / DKIM / DMARC / MX) ────────────────────────────
const CHECK_STYLE = {
  pass: { bg: '#f0fdf4', color: '#16a34a', border: '#86efac', icon: '✓' },
  warn: { bg: '#fffbeb', color: '#d97706', border: '#fcd34d', icon: '!' },
  fail: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '✕' },
};
function gradeColor(g) { return g === 'A' ? '#16a34a' : g === 'B' ? '#65a30d' : g === 'C' ? '#d97706' : '#dc2626'; }

function DnsDomainCard({ d }) {
  if (d.error) {
    return <div style={{ background:'#fff', borderRadius:14, border:'1px solid #fecaca', padding:'14px 18px', fontSize:13, color:'#dc2626' }}>{d.domain}: {d.error}</div>;
  }
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ width:42, height:42, borderRadius:10, background: gradeColor(d.grade)+'15', border:`1px solid ${gradeColor(d.grade)}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:900, fontSize:18, color: gradeColor(d.grade) }}>
          {d.grade}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', display:'flex', alignItems:'center', gap:6 }}>
            <Globe size={12} color="#94a3b8" /> {d.domain}
          </div>
          <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Authentication score: <strong style={{ color: gradeColor(d.grade) }}>{d.score}/100</strong></div>
        </div>
      </div>
      <div style={{ padding:'12px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10 }}>
        {d.checks.map(c => {
          const s = CHECK_STYLE[c.status] || CHECK_STYLE.warn;
          return (
            <div key={c.id} style={{ border:`1px solid ${s.border}`, background:s.bg, borderRadius:10, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                <span style={{ width:18, height:18, borderRadius:'50%', background:s.color, color:'#fff', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</span>
                <span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{c.label}</span>
              </div>
              <div style={{ fontSize:11.5, color:'#475569', lineHeight:1.5 }}>{c.detail}</div>
              {c.fix && <div style={{ fontSize:11, color:s.color, marginTop:5, lineHeight:1.5 }}><strong>Fix:</strong> {c.fix}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DnsAuthSection() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    toast.loading('Checking DNS records…', { id: 'dns' });
    try {
      const { data } = await api.get('/analytics/dns-health/all');
      setDomains(data.domains || []);
      setLoaded(true);
      toast.success('DNS check complete', { id: 'dns' });
    } catch { toast.error('DNS check failed', { id: 'dns' }); }
    finally { setLoading(false); }
  }, []);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:8 }}>
            <ShieldCheck size={18} color="#16a34a" /> DNS Authentication
          </h2>
          <p style={{ fontSize:12.5, color:'#64748b', margin:'3px 0 0' }}>
            SPF, DKIM, DMARC &amp; MX setup for your sending domains — the foundation of inbox placement.
          </p>
        </div>
        <button onClick={run} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
          <RefreshCw size={14} style={loading ? { animation:'spin 1s linear infinite' } : {}} />
          {loading ? 'Checking…' : loaded ? 'Re-check' : 'Check DNS'}
        </button>
      </div>
      {!loaded ? (
        <div style={{ background:'#f0fdf4', border:'1px dashed #86efac', borderRadius:12, padding:'18px', fontSize:13, color:'#166534' }}>
          Run a check to verify SPF, DKIM, DMARC and MX records on every domain you send from. Missing or misconfigured records are the #1 cause of cold emails landing in spam.
        </div>
      ) : domains.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:12, border:'2px dashed #e2e8f0', padding:'30px', textAlign:'center', fontSize:13, color:'#94a3b8' }}>
          No sending domains found. Connect an email account first.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {domains.map(d => <DnsDomainCard key={d.domain} d={d} />)}
        </div>
      )}
    </div>
  );
}

export default function Deliverability() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/blacklist');
      setDomains(data.domains || []);
    } catch { toast.error('Failed to load deliverability data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    setScanning(true);
    toast.loading('Scanning blocklists…', { id: 'scan' });
    try {
      const { data } = await api.post('/blacklist/check');
      setDomains((data.domains || []).map(d => ({ ...d, checkedAt: d.checkedAt || new Date().toISOString() })));
      const listed = (data.domains || []).reduce((s, d) => s + (d.listedCount || 0), 0);
      toast.success(listed > 0 ? `Scan done — ${listed} blocklist hit(s) found` : 'Scan done — all domains clean ✓', { id: 'scan' });
    } catch { toast.error('Scan failed', { id: 'scan' }); }
    finally { setScanning(false); }
  };

  const totalListed = domains.reduce((s, d) => s + (d.listedCount || 0), 0);
  const anyChecked  = domains.some(d => d.checkedAt);

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="#2563eb" /> Deliverability — Blacklist Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Checks your sending domains against the major DNS blocklists. Auto-scans every 12 hours.
          </p>
        </div>
        <button onClick={handleScan} disabled={scanning}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: scanning ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={14} style={scanning ? { animation: 'spin 1s linear infinite' } : {}} />
          {scanning ? 'Scanning…' : 'Scan Now'}
        </button>
      </div>

      {/* Summary banner */}
      {anyChecked && (
        <div style={{ background: totalListed > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${totalListed > 0 ? '#fecaca' : '#86efac'}`, borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalListed > 0 ? <ShieldAlert size={20} color="#dc2626" /> : <ShieldCheck size={20} color="#16a34a" />}
          <div style={{ fontSize: 13, color: totalListed > 0 ? '#991b1b' : '#166534', fontWeight: 600 }}>
            {totalListed > 0
              ? `${totalListed} blocklist hit(s) across your domains — review the flagged domains below.`
              : `All ${domains.length} domain(s) are clean across every blocklist checked. 🎉`}
          </div>
        </div>
      )}

      {/* What this means */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '11px 16px', marginBottom: 18, fontSize: 12, color: '#1d4ed8', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <HelpCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Being on a blocklist (Spamhaus, Barracuda, SpamCop, SORBS, SURBL) means receiving servers may route your emails to spam or reject them. Catching it early lets you pause, fix the cause, and request delisting before reply rates tank.
        </span>
      </div>

      {/* DNS authentication (SPF/DKIM/DMARC/MX) */}
      <DnsAuthSection />

      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={18} color="#2563eb" /> Blacklist Monitor
      </h2>

      {/* Domain list */}
      {loading ? (
        <Spinner />
      ) : domains.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '2px dashed #e2e8f0' }}>
          <Shield size={40} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>No sending domains yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Add email accounts first — their domains will be monitored here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!anyChecked && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '11px 16px', fontSize: 12.5, color: '#92400e' }}>
              These domains haven't been scanned yet. Click <strong>Scan Now</strong> to run the first check (the automatic scan also runs every 12 hours).
            </div>
          )}
          {domains.map(d => <DomainCard key={d.domain} d={d} />)}
        </div>
      )}
    </div>
  );
}
