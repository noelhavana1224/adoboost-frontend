import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, Badge, Spinner } from '../components/UI';
import { Calendar, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const STATUS_COLOR = { draft:'default', active:'green', paused:'yellow', completed:'blue' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function SendingCalendar() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [sends, setSends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(new Date());

  useEffect(() => {
    Promise.all([
      api.get('/campaigns'),
      api.get('/analytics/summary?range=30'),
    ]).then(([cr, ar]) => {
      setCampaigns(cr.data);
      setSends(ar.data.dailySends || []);
    }).finally(() => setLoading(false));
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getSendsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const send = sends.find(s => s.date === dateStr);
    return send?.count || 0;
  };

  const getCampaignsForDay = (day) => {
    const date = new Date(year, month, day);
    return campaigns.filter(c => {
      // A campaign appears only on its launch/scheduled day — not every day.
      // Scheduled campaigns use scheduled_at; immediate ones use created_at (launch day).
      const launchRaw = c.scheduled_at || c.created_at;
      if (!launchRaw) return false;
      const launch = new Date(launchRaw);
      return launch.toDateString() === date.toDateString();
    });
  };

  // Block Trial users
  if (!loading && user?.plan?.toLowerCase() === 'trial') {
    return (
      <div>
        <PageHeader title="Calendar Booking Page" subtitle="Share a booking link so prospects can schedule calls directly." />
        <div style={{ textAlign:'center', padding:'64px 24px', background:'var(--bg2)', borderRadius:16, border:'1px solid var(--border)', maxWidth:520, margin:'0 auto' }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Lock size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:10 }}>Upgrade to access Calendar Booking</h2>
          <p style={{ fontSize:14, color:'var(--text3)', lineHeight:1.7, marginBottom:24, maxWidth:380, margin:'0 auto 24px' }}>
            The Calendar Booking Page is available on Starter and above. Share a booking link with prospects so they can schedule calls directly — no third-party tools needed.
          </p>
          <a href="/settings/billing" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', padding:'11px 28px', borderRadius:10, fontWeight:700, fontSize:14, textDecoration:'none' }}>
            Upgrade your plan →
          </a>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <PageHeader title="Sending Calendar" subtitle="View scheduled and active campaigns by day" />

      {/* Month navigation */}
      <Card style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button onClick={()=>setCurrent(new Date(year, month-1, 1))} style={{ background:'none', border:'1px solid var(--border2)', borderRadius:6, padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
            <ChevronLeft size={14}/> Prev
          </button>
          <h2 style={{ fontSize:18, fontWeight:700 }}>{MONTHS[month]} {year}</h2>
          <button onClick={()=>setCurrent(new Date(year, month+1, 1))} style={{ background:'none', border:'1px solid var(--border2)', borderRadius:6, padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
            Next <ChevronRight size={14}/>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text3)', padding:'6px 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const isToday = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
            const sendCount = getSendsForDay(day);
            const dayCampaigns = getCampaignsForDay(day);
            return (
              <div key={day} style={{
                minHeight:80, border:`1px solid ${isToday?'var(--primary)':'var(--border)'}`,
                borderRadius:8, padding:'6px 8px',
                background: isToday ? 'var(--primary-dim)' : 'var(--bg3)',
              }}>
                <div style={{ fontSize:13, fontWeight: isToday?700:400, color: isToday?'var(--primary)':'var(--text)', marginBottom:4 }}>{day}</div>
                {sendCount > 0 && (
                  <div style={{ fontSize:10, background:'var(--primary)', color:'#fff', borderRadius:4, padding:'1px 5px', marginBottom:3, display:'inline-block' }}>
                    {sendCount} sent
                  </div>
                )}
                {dayCampaigns.slice(0,2).map(c => (
                  <div key={c.id} style={{ fontSize:10, background: c.status==='active'?'#f0fff4':'#fffff0', color: c.status==='active'?'#276749':'#975a16', borderRadius:4, padding:'1px 5px', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.name}
                  </div>
                ))}
                {dayCampaigns.length > 2 && <div style={{ fontSize:10, color:'var(--text3)' }}>+{dayCampaigns.length-2} more</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Active campaigns list */}
      <Card style={{ padding:20 }}>
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Active & Scheduled Campaigns</h3>
        {campaigns.filter(c=>c.status==='active'||c.status==='paused').length===0 ? (
          <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No active campaigns this month</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {campaigns.filter(c=>c.status==='active'||c.status==='paused').map(c=>(
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{c.list_name||'No list'} · {c.sent_count||0} sent</div>
                </div>
                <Badge color={STATUS_COLOR[c.status]}>{c.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
