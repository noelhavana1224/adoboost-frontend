import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, Card } from '../components/UI';
import { BarChart2, TrendingUp, Mail, MousePointer, MessageSquare, AlertCircle, UserMinus, XCircle, Trophy, RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';

// ── Helpers ──────────────────────────────────────
const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) : '0.0') + '%';
const num = (n) => (n || 0).toLocaleString();

function rateColor(rate, thresholds) {
  const val = parseFloat(rate);
  if (val >= thresholds.good) return '#16a34a';
  if (val >= thresholds.ok)   return '#d97706';
  return '#dc2626';
}

// ── Mini Bar ─────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pctVal}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Stat Card ────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 20, color })}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Simple Bar Chart ─────────────────────────────
function BarChart({ data, valueKey, labelKey, color, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = max > 0 ? Math.max(((d[valueKey] || 0) / max) * 100, 2) : 2;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${d[labelKey]}: ${d[valueKey]}`}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{d[valueKey] || 0}</div>
            <div style={{ width: '100%', height: `${h}%`, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', minHeight: 2 }} />
            <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {(d[labelKey] || '').substring(0, 8)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Rate Comparison Chart ────────────────────────
function RateChart({ campaigns }) {
  const metrics = [
    { key: 'open_rate',   label: 'Open Rate',   color: '#0284c7', good: 40, ok: 20 },
    { key: 'reply_rate',  label: 'Reply Rate',  color: '#7c3aed', good: 10, ok: 5  },
    { key: 'click_rate',  label: 'Click Rate',  color: '#16a34a', good: 5,  ok: 2  },
    { key: 'bounce_rate', label: 'Bounce Rate', color: '#dc2626', good: 0,  ok: 2  },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {campaigns.slice(0, 8).map(c => (
        <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>
            {c.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {metrics.map(m => (
              <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                  <span>{m.label}</span>
                  <span style={{ fontWeight: 700, color: rateColor(c[m.key] || '0', m) }}>{parseFloat(c[m.key] || 0).toFixed(1)}%</span>
                </div>
                <MiniBar value={parseFloat(c[m.key] || 0)} max={m.key === 'open_rate' ? 100 : m.key === 'reply_rate' ? 30 : 20} color={m.color} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Campaign Row ─────────────────────────────────
function CampaignRow({ c, isExpanded, onToggle, maxSent }) {
  const STATUS_COLOR = { active: '#16a34a', paused: '#d97706', draft: '#64748b', completed: '#2563eb' };

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', background: isExpanded ? '#f8faff' : '#fff', cursor: 'pointer', transition: 'background 0.1s' }}
        onClick={onToggle}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '#fff'; }}>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isExpanded ? <ChevronUp size={14} color="var(--primary)"/> : <ChevronDown size={14} color="var(--text3)"/>}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.account_email}</div>
            </div>
          </div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: STATUS_COLOR[c.status] + '20', color: STATUS_COLOR[c.status], fontWeight: 600 }}>
            {c.status}
          </span>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{num(c.sent_count)}</span>
            <MiniBar value={c.sent_count || 0} max={maxSent} color="#64748b" />
          </div>
        </td>
        <td style={{ padding: '12px 16px', color: rateColor(c.open_rate || '0', { good: 40, ok: 20 }), fontWeight: 700 }}>
          {parseFloat(c.open_rate || 0).toFixed(1)}%
        </td>
        <td style={{ padding: '12px 16px', color: rateColor(c.click_rate || '0', { good: 5, ok: 2 }), fontWeight: 700 }}>
          {parseFloat(c.click_rate || 0).toFixed(1)}%
        </td>
        <td style={{ padding: '12px 16px', color: rateColor(c.reply_rate || '0', { good: 10, ok: 5 }), fontWeight: 700 }}>
          {parseFloat(c.reply_rate || 0).toFixed(1)}%
        </td>
        <td style={{ padding: '12px 16px', color: parseFloat(c.bounce_rate || 0) > 2 ? '#dc2626' : 'var(--text2)', fontWeight: 700 }}>
          {parseFloat(c.bounce_rate || 0).toFixed(1)}%
        </td>
        <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: 13 }}>
          {num(c.unsubscribed_count || 0)}
        </td>
        <td style={{ padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
          {num(c.failed_count || 0)}
        </td>
      </tr>
      {/* Expanded detail row */}
      {isExpanded && (
        <tr style={{ background: '#f0f4ff', borderBottom: '2px solid var(--primary)' }}>
          <td colSpan={9} style={{ padding: '16px 20px 16px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {[
                { label: '📤 Total Sent',     value: num(c.sent_count),          color: '#64748b' },
                { label: '👁 Opened',          value: `${num(c.opened_count)} (${parseFloat(c.open_rate||0).toFixed(1)}%)`, color: '#0284c7' },
                { label: '🖱 Clicked',          value: `${num(c.clicked_count)} (${parseFloat(c.click_rate||0).toFixed(1)}%)`, color: '#16a34a' },
                { label: '💬 Replied',         value: `${num(c.replied_count)} (${parseFloat(c.reply_rate||0).toFixed(1)}%)`, color: '#7c3aed' },
                { label: '⚠️ Bounced',         value: `${num(c.bounced_count)} (${parseFloat(c.bounce_rate||0).toFixed(1)}%)`, color: '#dc2626' },
                { label: '🚫 Unsubscribed',   value: num(c.unsubscribed_count||0), color: '#d97706' },
                { label: '❌ Failed',          value: num(c.failed_count||0),      color: '#dc2626' },
                { label: '📅 List',            value: c.list_name || '—',         color: '#64748b' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* Per-campaign bar chart */}
            {c.sent_count > 0 && (
              <div style={{ marginTop: 14, background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Performance Breakdown</div>
                <div style={{ display: 'flex', gap: 6, height: 80, alignItems: 'flex-end' }}>
                  {[
                    { label: 'Sent',    val: c.sent_count || 0,          color: '#94a3b8' },
                    { label: 'Opened',  val: c.opened_count || 0,        color: '#0284c7' },
                    { label: 'Clicked', val: c.clicked_count || 0,       color: '#16a34a' },
                    { label: 'Replied', val: c.replied_count || 0,       color: '#7c3aed' },
                    { label: 'Bounced', val: c.bounced_count || 0,       color: '#f87171' },
                    { label: 'Failed',  val: c.failed_count || 0,        color: '#dc2626' },
                    { label: 'Unsub',   val: c.unsubscribed_count || 0,  color: '#fbbf24' },
                  ].map(bar => {
                    const maxBar = c.sent_count || 1;
                    const h = Math.max((bar.val / maxBar) * 100, bar.val > 0 ? 3 : 0);
                    return (
                      <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{bar.val}</div>
                        <div style={{ width: '100%', height: `${h}%`, background: bar.color, borderRadius: '4px 4px 0 0', minHeight: bar.val > 0 ? 4 : 0 }} />
                        <div style={{ fontSize: 9, color: 'var(--text3)' }}>{bar.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Reports Component ────────────────────────
export default function Reports() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [sortBy, setSortBy]       = useState('sent_count');
  const [sortDir, setSortDir]     = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/campaigns/reports');
      setCampaigns(data || []);
    } catch {
      // Fallback to regular campaigns endpoint and compute rates client-side
      try {
        const { data } = await api.get('/campaigns');
        const enriched = (data || []).map(c => ({
          ...c,
          open_rate:   c.sent_count > 0 ? ((c.opened_count  || 0) / c.sent_count * 100).toFixed(1) : '0.0',
          click_rate:  c.sent_count > 0 ? ((c.clicked_count || 0) / c.sent_count * 100).toFixed(1) : '0.0',
          reply_rate:  c.sent_count > 0 ? ((c.replied_count || 0) / c.sent_count * 100).toFixed(1) : '0.0',
          bounce_rate: c.sent_count > 0 ? ((c.bounced_count || 0) / c.sent_count * 100).toFixed(1) : '0.0',
          failed_count: 0,
          unsubscribed_count: 0,
        }));
        setCampaigns(enriched);
      } catch { toast.error('Failed to load reports'); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  // Filter + sort
  const filtered = campaigns
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .sort((a, b) => {
      const av = parseFloat(a[sortBy] || 0), bv = parseFloat(b[sortBy] || 0);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  // Overall totals
  const totals = campaigns.reduce((acc, c) => ({
    sent:         acc.sent         + (c.sent_count         || 0),
    opened:       acc.opened       + (c.opened_count       || 0),
    clicked:      acc.clicked      + (c.clicked_count      || 0),
    replied:      acc.replied      + (c.replied_count      || 0),
    bounced:      acc.bounced      + (c.bounced_count      || 0),
    unsubscribed: acc.unsubscribed + (c.unsubscribed_count || 0),
    failed:       acc.failed       + (c.failed_count       || 0),
  }), { sent:0, opened:0, clicked:0, replied:0, bounced:0, unsubscribed:0, failed:0 });

  const maxSent = Math.max(...filtered.map(c => c.sent_count || 0), 1);

  const SortTh = ({ label, field }) => (
    <th onClick={() => toggleSort(field)} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: sortBy === field ? 'var(--primary)' : 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', background: 'var(--bg3)', borderBottom: '2px solid var(--border)' }}>
      {label} {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Campaign Reports"
        subtitle="Track performance across all your cold email campaigns"
        action={
          <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <RefreshCw size={14}/> Refresh
          </button>
        }
      />

      {campaigns.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:12, border:'1px solid var(--border)' }}>
          <BarChart2 size={48} style={{ opacity:0.2, display:'block', margin:'0 auto 16px' }}/>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>No campaign data yet</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>Launch a campaign to start seeing reports here.</div>
        </div>
      ) : (
        <>
          {/* ── Overview stat cards ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:24 }}>
            <StatCard icon={<Mail/>}       label="Total Sent"       value={num(totals.sent)}         color="#64748b" />
            <StatCard icon={<Eye/>}        label="Total Opened"     value={num(totals.opened)}       sub={pct(totals.opened, totals.sent) + ' open rate'}   color="#0284c7" bg="#f0f9ff" />
            <StatCard icon={<MousePointer/>} label="Total Clicked"  value={num(totals.clicked)}      sub={pct(totals.clicked, totals.sent) + ' click rate'} color="#16a34a" bg="#f0fff4" />
            <StatCard icon={<MessageSquare/>} label="Total Replied" value={num(totals.replied)}      sub={pct(totals.replied, totals.sent) + ' reply rate'} color="#7c3aed" bg="#f5f3ff" />
            <StatCard icon={<AlertCircle/>} label="Bounced"         value={num(totals.bounced)}      sub={pct(totals.bounced, totals.sent)}                 color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={<UserMinus/>}  label="Unsubscribed"    value={num(totals.unsubscribed)}  color="#d97706" />
            <StatCard icon={<XCircle/>}    label="Failed"           value={num(totals.failed)}        color="#dc2626" />
            <StatCard icon={<Trophy/>}     label="Campaigns"        value={campaigns.length}          sub={`${campaigns.filter(c=>c.status==='active').length} active`} color="#0f766e" bg="#f0fdfa" />
          </div>

          {/* ── Charts row ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            {/* Sent per campaign bar chart */}
            <Card>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <BarChart2 size={16} color="var(--primary)"/> Emails Sent per Campaign
              </div>
              {filtered.length > 0 ? (
                <BarChart
                  data={filtered.slice(0,10).map(c => ({ name: c.name?.substring(0,10)||'', sent: c.sent_count||0 }))}
                  valueKey="sent" labelKey="name" color="#6366f1"
                />
              ) : <div style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:20 }}>No data</div>}
            </Card>

            {/* Rate comparison */}
            <Card>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <TrendingUp size={16} color="var(--primary)"/> Rate Comparison by Campaign
              </div>
              {filtered.length > 0 ? (
                <RateChart campaigns={filtered} />
              ) : <div style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:20 }}>No data</div>}
            </Card>
          </div>

          {/* ── 2026 Benchmarks ── */}
          <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#0284c7', marginBottom:10 }}>📊 2026 Cold Email Benchmarks</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10 }}>
              {[
                { metric:'Open Rate',   good:'40%+', avg:'25–40%', bad:'<25%' },
                { metric:'Reply Rate',  good:'10%+', avg:'5–10%',  bad:'<5%'  },
                { metric:'Click Rate',  good:'5%+',  avg:'2–5%',   bad:'<2%'  },
                { metric:'Bounce Rate', good:'<1%',  avg:'1–3%',   bad:'>3%'  },
              ].map(b => (
                <div key={b.metric} style={{ background:'#fff', borderRadius:8, padding:'10px 12px', border:'1px solid #bae6fd' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0369a1', marginBottom:6 }}>{b.metric}</div>
                  <div style={{ fontSize:11, display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ color:'#16a34a' }}>✅ Good: {b.good}</span>
                    <span style={{ color:'#d97706' }}>⚡ Avg: {b.avg}</span>
                    <span style={{ color:'#dc2626' }}>❌ Low: {b.bad}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Filter row ── */}
          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>Filter:</span>
            {['all','active','paused','draft','completed'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filterStatus===s?'var(--primary)':'var(--border2)'}`, background:filterStatus===s?'var(--primary-dim)':'#fff', color:filterStatus===s?'var(--primary)':'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:filterStatus===s?700:400, textTransform:'capitalize' }}>
                {s}
              </button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>{filtered.length} campaign{filtered.length!==1?'s':''}</span>
          </div>

          {/* ── Campaign table ── */}
          <Card style={{ padding:0, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <SortTh label="Campaign"    field="name" />
                    <SortTh label="Status"      field="status" />
                    <SortTh label="Sent"        field="sent_count" />
                    <SortTh label="Open Rate"   field="open_rate" />
                    <SortTh label="Click Rate"  field="click_rate" />
                    <SortTh label="Reply Rate"  field="reply_rate" />
                    <SortTh label="Bounce Rate" field="bounce_rate" />
                    <SortTh label="Unsub"       field="unsubscribed_count" />
                    <SortTh label="Failed"      field="failed_count" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <CampaignRow
                      key={c.id} c={c}
                      isExpanded={expanded === c.id}
                      onToggle={() => setExpanded(p => p === c.id ? null : c.id)}
                      maxSent={maxSent}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', background:'#fafafa', fontSize:12, color:'var(--text3)', display:'flex', justifyContent:'space-between' }}>
              <span>Click any row to expand campaign details</span>
              <span>{filtered.length} campaign{filtered.length!==1?'s':''} · {num(totals.sent)} total emails sent</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
