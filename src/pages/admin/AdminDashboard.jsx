import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { StatCard, Card, Badge, Spinner } from '../../components/UI';
import { Users, Send, Mail, TrendingUp, UserCheck, AlertCircle, Ticket, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/stats').then(r=>setData(r.data)).finally(()=>setLoading(false)); }, []);
  if (loading) return <Spinner />;
  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom:24 }}><h1 style={{ fontSize:22, fontWeight:700 }}>Admin Panel</h1><p style={{ color:'var(--text3)', fontSize:13 }}>Platform overview and management</p></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <StatCard icon={Users}      label="Total Users"    value={data?.totalUsers||0}     color="blue" />
        <StatCard icon={UserCheck}  label="Paid Users"     value={data?.paidUsers||0}      sub={`${data?.trialUsers||0} on trial`} color="green" />
        <StatCard icon={Send}       label="Emails Sent"    value={(data?.totalEmails||0).toLocaleString()} color="purple" />
        <StatCard icon={Ticket}      label="Open Tickets"  value={data?.openTickets||0}    color="yellow" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <Card style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>New Users (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.newUsersWeek||[]} margin={{ left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'#a0aec0' }} tickFormatter={d=>d.slice(5)} />
              <YAxis tick={{ fontSize:11, fill:'#a0aec0' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
              <Bar dataKey="count" fill="#1565C0" radius={[4,4,0,0]} name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Plan Breakdown</h3>
          {(data?.planBreakdown||[]).map(p => (
            <div key={p.plan} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, textTransform:'capitalize' }}>{p.plan}</span>
              <Badge color={p.plan==='trial'?'yellow':p.plan==='starter'?'blue':p.plan==='pro'?'green':'purple'}>{p.count}</Badge>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600 }}>Recent Users</h3>
          <Link to="/admin/users" style={{ fontSize:12, color:'var(--primary)' }}>View all →</Link>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'var(--bg3)', borderBottom:'2px solid var(--border)' }}>
            {['Name','Email','Plan','Campaigns','Joined','Status'].map(h=><th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {(data?.recentUsers||[]).map(u => (
              <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'11px 14px', fontWeight:500, fontSize:13 }}>{u.name}</td>
                <td style={{ padding:'11px 14px', fontSize:13, color:'var(--text2)' }}>{u.email}</td>
                <td style={{ padding:'11px 14px' }}><Badge color={u.plan==='trial'?'yellow':u.plan==='unlimited'?'purple':'green'}>{u.plan}</Badge></td>
                <td style={{ padding:'11px 14px', fontSize:13 }}>{u.campaigns}</td>
                <td style={{ padding:'11px 14px', fontSize:13, color:'var(--text3)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding:'11px 14px' }}><Badge color={u.is_suspended?'red':'green'}>{u.is_suspended?'Suspended':'Active'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
