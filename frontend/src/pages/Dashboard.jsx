import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Spinner } from '../components/UI';
import { Send, Mail, MousePointer, Reply, AlertCircle, Users, Activity, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../utils/api';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const pct = (n,d) => d>0?((n/d)*100).toFixed(1)+'%':'0%';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/analytics/summary?range=${range}`).then(r=>setData(r.data)).finally(()=>setLoading(false));
  }, [range]);

  if (loading) return <Spinner />;
  const sent = data?.total_sent || 0;

  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, marginBottom:2 }}>Dashboard</h1>
          <p style={{ color:'var(--text3)', fontSize:13 }}>Welcome back, {user?.name?.split(' ')[0]}!</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['7','14','30'].map(d => (
            <button key={d} onClick={()=>setRange(d)} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--border2)', background:range===d?'var(--primary)':'#fff', color:range===d?'#fff':'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {d==='7'?'Last 7 days':d==='14'?'Last 14 days':'Last 30 days'}
            </button>
          ))}
          <Link to="/campaigns/new" style={{ padding:'6px 16px', borderRadius:6, background:'var(--primary)', color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center' }}>
            + Create Campaign
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:20 }}>
        <StatCard icon={Send}         label="Total Sent"    value={(sent).toLocaleString()}                     sub="emails delivered"  color="blue" />
        <StatCard icon={Mail}         label="Total Opened"  value={`${pct(data?.total_opened,sent)}`}           sub={`${(data?.total_opened||0).toLocaleString()} opens`} color="cyan" />
        <StatCard icon={MousePointer} label="Total Clicks"  value={`${pct(data?.total_clicked,sent)}`}          sub={`${(data?.total_clicked||0).toLocaleString()} clicks`} color="green" />
        <StatCard icon={Reply}        label="Total Replies" value={`${pct(data?.total_replied,sent)}`}          sub={`${(data?.total_replied||0).toLocaleString()} replies`} color="purple" />
        <StatCard icon={AlertCircle}  label="Bounced"       value={`${pct(data?.total_bounced,sent)}`}          sub={`${(data?.total_bounced||0).toLocaleString()} bounced`} color="red" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Chart */}
        <Card style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16, color:'var(--text2)' }}>Overview</h3>
          {(data?.dailySends||[]).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.dailySends} margin={{ left:-20, right:0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1565C0" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fill:'#a0aec0', fontSize:11 }} tickFormatter={d=>d.slice(5)} />
                <YAxis tick={{ fill:'#a0aec0', fontSize:11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12 }} />
                <Area type="monotone" dataKey="count" stroke="#1565C0" fill="url(#grad)" strokeWidth={2} name="Sent" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:13 }}>No data for this period</div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16, color:'var(--text2)' }}>Recent Activity</h3>
          {(data?.recentActivity||[]).length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:13, padding:'20px 0' }}>No recent activity yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {data.recentActivity.map((a,i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <div style={{ fontWeight:500, marginBottom:2 }}>Email "{a.subject?.slice(0,30)}..." sent to {a.contact_email}</div>
                  <div style={{ color:'var(--text3)' }}>from campaign: {a.campaign_name} · {new Date(a.sent_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600 }}>Top Campaigns</h3>
          <Link to="/campaigns" style={{ fontSize:12, color:'var(--primary)' }}>View all →</Link>
        </div>
        {(data?.topCampaigns||[]).length === 0 ? (
          <div style={{ color:'var(--text3)', fontSize:13, padding:'20px 0', textAlign:'center' }}>
            No campaigns yet. <Link to="/campaigns/new">Create your first one →</Link>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg3)', borderBottom:'2px solid var(--border)' }}>
                {['Campaign','Status','Sent','Open Rate','Reply Rate'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topCampaigns.map((c,i) => (
                <tr key={c.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'11px 14px', fontWeight:500, fontSize:13 }}>{c.name}</td>
                  <td style={{ padding:'11px 14px' }}><Badge color={STATUS_COLOR[c.status]||'default'}>{c.status}</Badge></td>
                  <td style={{ padding:'11px 14px', fontSize:13 }}>{(c.sent||0).toLocaleString()}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'var(--cyan)' }}>{pct(c.opened,c.sent)}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'var(--purple)' }}>{pct(c.replied,c.sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
