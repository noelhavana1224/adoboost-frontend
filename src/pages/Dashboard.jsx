import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Spinner } from '../components/UI';
import { Send, Mail, MousePointer, Reply, AlertCircle, TrendingUp, Zap, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import VAUpsellBanner from '../components/VAUpsellBanner';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '0%';

function WelcomeBanner({ user, totalSent }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{
      background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#0c1445 100%)',
      borderRadius:16, padding:'26px 28px', marginBottom:22,
      position:'relative', overflow:'hidden',
      animation:'fadeIn 0.4s ease',
    }}>
      {/* Decorative glow orbs */}
      <div style={{ position:'absolute', top:-50, right:-30, width:200, height:200, background:'radial-gradient(circle,rgba(37,99,235,0.22) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, right:160, width:140, height:140, background:'radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:10, right:300, width:100, height:100, background:'radial-gradient(circle,rgba(8,145,178,0.14) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', marginBottom:4, fontWeight:500, letterSpacing:'0.03em' }}>
            {greeting},
          </p>
          <h2 style={{ fontSize:23, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.04em', lineHeight:1.1 }}>
            {firstName} 👋
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.55, maxWidth:440 }}>
            {totalSent > 0
              ? `You've sent ${totalSent.toLocaleString()} emails this period — your outreach is live!`
              : 'Ready to launch your next campaign? Start sending and watch replies roll in.'}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, flexShrink:0 }}>
          <Link to="/campaigns/new" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)',
            color:'#fff', borderRadius:10, padding:'10px 20px',
            fontSize:13.5, fontWeight:700, textDecoration:'none',
            boxShadow:'0 4px 18px rgba(37,99,235,0.4)',
            letterSpacing:'-0.01em',
          }}>
            <Send size={14} /> New Campaign
          </Link>
          <Link to="/email-accounts" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
            color:'rgba(255,255,255,0.85)', borderRadius:10, padding:'10px 18px',
            fontSize:13.5, fontWeight:600, textDecoration:'none',
            backdropFilter:'blur(4px)',
            letterSpacing:'-0.01em',
          }}>
            <Mail size={14} /> Email Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}

const RANGE_OPTS = [
  { key:'7',  label:'7 days' },
  { key:'14', label:'14 days' },
  { key:'30', label:'30 days' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/summary?range=${range}`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [range]);

  if (loading) return <Spinner />;
  const sent = data?.total_sent || 0;

  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      <VAUpsellBanner />
      <WelcomeBanner user={user} totalSent={sent} />

      {/* Range selector + section title */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <BarChart2 size={16} color="var(--text3)" />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Overview</span>
        </div>
        <div style={{ display:'flex', gap:4, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:9, padding:3 }}>
          {RANGE_OPTS.map(o => (
            <button key={o.key} onClick={() => setRange(o.key)} style={{
              padding:'5px 14px', borderRadius:7, border:'none', fontSize:12, fontWeight:600, cursor:'pointer',
              background:range === o.key ? '#fff' : 'transparent',
              color:range === o.key ? 'var(--primary)' : 'var(--text3)',
              boxShadow:range === o.key ? 'var(--shadow)' : 'none',
              transition:'all 0.15s',
            }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:18 }}>
        <StatCard icon={Send}         label="Total Sent"    value={sent.toLocaleString()}                              sub="emails delivered"  color="blue" />
        <StatCard icon={Mail}         label="Open Rate"     value={pct(data?.total_opened, sent)}                      sub={`${(data?.total_opened||0).toLocaleString()} opens`}   color="cyan" />
        <StatCard icon={MousePointer} label="Click Rate"    value={pct(data?.total_clicked, sent)}                     sub={`${(data?.total_clicked||0).toLocaleString()} clicks`} color="green" />
        <StatCard icon={Reply}        label="Reply Rate"    value={pct(data?.total_replied, sent)}                     sub={`${(data?.total_replied||0).toLocaleString()} replies`} color="purple" />
        <StatCard icon={AlertCircle}  label="Bounce Rate"   value={pct(data?.total_bounced, sent)}                     sub={`${(data?.total_bounced||0).toLocaleString()} bounced`} color="red" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:14, marginBottom:14 }}>
        {/* Area chart */}
        <Card style={{ padding:'20px 20px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>Sending activity</h3>
              <p style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Emails sent per day</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:7, padding:'4px 10px' }}>
              <TrendingUp size={12} color="#2563eb" />
              <span style={{ fontSize:11, fontWeight:600, color:'#2563eb' }}>{sent.toLocaleString()} total</span>
            </div>
          </div>
          {(data?.dailySends || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={data.dailySends} margin={{ left:-20, right:4, top:2, bottom:0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18}/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill:'var(--text3)', fontSize:11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, fontSize:12, boxShadow:'var(--shadow-md)' }}
                  cursor={{ stroke:'var(--border)', strokeWidth:1 }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563eb" fill="url(#areaGrad)" strokeWidth={2.5} name="Sent" dot={false} activeDot={{ r:4, fill:'#2563eb', strokeWidth:0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:210, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:13 }}>
              No data for this period
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>Recent activity</h3>
            <Zap size={14} color="var(--text3)" />
          </div>
          {(data?.recentActivity || []).length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:13, padding:'24px 0', textAlign:'center', lineHeight:1.6 }}>
              No recent activity yet.
              <br />
              <Link to="/campaigns/new" style={{ color:'var(--primary)', fontWeight:600, fontSize:12 }}>Create a campaign →</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {data.recentActivity.map((a, i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{
                    width:7, height:7, borderRadius:'50%', background:'var(--primary)',
                    marginTop:5, flexShrink:0, boxShadow:'0 0 0 3px rgba(37,99,235,0.12)',
                  }} />
                  <div>
                    <div style={{ fontWeight:500, fontSize:12.5, color:'var(--text)', marginBottom:2, lineHeight:1.4 }}>
                      "{a.subject?.slice(0, 28)}…" → {a.contact_email}
                    </div>
                    <div style={{ color:'var(--text3)', fontSize:11.5 }}>
                      {a.campaign_name} · {new Date(a.sent_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>Top campaigns</h3>
            <p style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Best performing in the selected period</p>
          </div>
          <Link to="/campaigns" style={{ fontSize:12, color:'var(--primary)', fontWeight:600 }}>View all →</Link>
        </div>
        {(data?.topCampaigns || []).length === 0 ? (
          <div style={{ color:'var(--text3)', fontSize:13, padding:'28px 0', textAlign:'center', lineHeight:1.7 }}>
            No campaigns yet.<br />
            <Link to="/campaigns/new" style={{ color:'var(--primary)', fontWeight:600, fontSize:13 }}>Create your first campaign →</Link>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg3)', borderBottom:'1px solid var(--border)' }}>
                  {['Campaign', 'Status', 'Sent', 'Open Rate', 'Reply Rate'].map(h => (
                    <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topCampaigns.map((c, i) => (
                  <tr key={c.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ borderBottom:'1px solid var(--border)', transition:'background 0.12s' }}>
                    <td style={{ padding:'11px 16px', fontWeight:600, fontSize:13, color:'var(--text)' }}>{c.name}</td>
                    <td style={{ padding:'11px 16px' }}><Badge color={STATUS_COLOR[c.status] || 'default'}>{c.status}</Badge></td>
                    <td style={{ padding:'11px 16px', fontSize:13, color:'var(--text2)' }}>{(c.sent || 0).toLocaleString()}</td>
                    <td style={{ padding:'11px 16px', fontSize:13, fontWeight:600, color:'var(--cyan)' }}>{pct(c.opened, c.sent)}</td>
                    <td style={{ padding:'11px 16px', fontSize:13, fontWeight:600, color:'var(--purple)' }}>{pct(c.replied, c.sent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
