import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { StatCard, Card, Badge, Spinner } from '../../components/UI';
import { Users, Send, Mail, TrendingUp, UserCheck, AlertCircle, Ticket, Activity, Zap, DollarSign, BarChart2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const planColors = { trial: 'yellow', starter: 'blue', professional: 'green', unlimited: 'purple' };
const planPrices = { trial: 0, starter: 29, professional: 79, unlimited: 199 };

function MRRCard({ mrr }) {
  return (
    <div style={{ background:'linear-gradient(135deg,#1565C0 0%,#0288d1 100%)', borderRadius:12, padding:20, color:'#fff', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, fontWeight:600, opacity:0.85, letterSpacing:'0.05em', textTransform:'uppercase' }}>Monthly Revenue</span>
        <DollarSign size={18} style={{ opacity:0.7 }} />
      </div>
      <div style={{ fontSize:28, fontWeight:800 }}>${mrr.toLocaleString()}</div>
      <div style={{ fontSize:12, opacity:0.75 }}>MRR — current active plans</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/stats').then(r => setData(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <Spinner />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Panel</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>Platform overview and management</p>
      </div>

      {/* Row 1: Revenue + key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
        <MRRCard mrr={data?.mrr || 0} />
        <StatCard icon={Users}     label="Total Users"       value={data?.totalUsers || 0}                              color="blue" />
        <StatCard icon={UserCheck} label="Paid Users"        value={data?.paidUsers || 0}  sub={`${data?.trialUsers || 0} on trial`} color="green" />
        <StatCard icon={Ticket}    label="Open Tickets"      value={data?.openTickets || 0}                             color="yellow" />
      </div>

      {/* Row 2: Activity metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon={Zap}       label="AI Credits (Month)" value={(data?.aiCreditsMonth || 0).toLocaleString()}     color="purple" />
        <StatCard icon={BarChart2} label="Active Campaigns"   value={data?.activeCampaigns || 0}                       color="blue" />
        <StatCard icon={Send}      label="Emails Today"       value={(data?.emailsToday || 0).toLocaleString()}         color="green" />
        <StatCard icon={Clock}     label="Active Today"       value={data?.activeToday || 0}                           color="yellow" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Users — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.newUsersWeek || []} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a0aec0' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#a0aec0' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#1565C0" radius={[4, 4, 0, 0]} name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Plan Breakdown</h3>
            {(data?.planBreakdown || []).map(p => {
              const total = (data?.planBreakdown || []).reduce((s, x) => s + x.count, 0) || 1;
              const pct = Math.round((p.count / total) * 100);
              return (
                <div key={p.plan} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 500 }}>{p.plan}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.count} · ${(planPrices[p.plan] || 0) * p.count}/mo</span>
                  </div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: planColors[p.plan] === 'green' ? '#22c55e' : planColors[p.plan] === 'purple' ? '#7c3aed' : planColors[p.plan] === 'blue' ? '#1565C0' : '#eab308' }} />
                  </div>
                </div>
              );
            })}
          </Card>

          {/* AI Usage by Feature */}
          {(data?.aiByFeature || []).length > 0 && (
            <Card style={{ padding: 20, flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>AI Usage by Feature</h3>
              {(data.aiByFeature).map(f => (
                <div key={f.feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{f.feature.replace(/_/g, ' ')}</span>
                  <Badge color="purple">{f.credits} cr</Badge>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Recent Users */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Users</h3>
          <Link to="/admin/users" style={{ fontSize: 12, color: 'var(--primary)' }}>View all →</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '2px solid var(--border)' }}>
              {['Name', 'Email', 'Plan', 'Campaigns', 'Joined', 'Last Login', 'Status'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.recentUsers || []).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '11px 14px', fontWeight: 500, fontSize: 13 }}>{u.name}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                <td style={{ padding: '11px 14px' }}>
                  <Badge color={planColors[u.plan] || 'gray'} style={{ textTransform: 'capitalize' }}>{u.plan}</Badge>
                </td>
                <td style={{ padding: '11px 14px', fontSize: 13 }}>{u.campaigns}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text3)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text3)' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  <Badge color={u.is_suspended ? 'red' : 'green'}>{u.is_suspended ? 'Suspended' : 'Active'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
