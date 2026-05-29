import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Must match the pattern in utils/api.js: VITE_API_URL + '/api' or just '/api'
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmtTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtSlot(time) {
  const [h, m] = time.split(':').map(Number);
  return fmtTime(h, m);
}

function getAvailableDates(availability, year, month) {
  // Returns set of date strings 'YYYY-MM-DD' that have at least one available day
  const avail = availability || {};
  const available = new Set();
  const days = ['sun','mon','tue','wed','thu','fri','sat'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date < new Date(new Date().toDateString())) continue; // skip past
    const dow = days[date.getDay()];
    if (avail[dow]?.enabled) {
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      available.add(key);
    }
  }
  return available;
}

export default function PublicBooking() {
  const { slug } = useParams();
  const [calInfo, setCalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar state
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  // Form state
  const [step, setStep] = useState('date'); // 'date' | 'time' | 'form' | 'confirmed'
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', answers: {} });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/public/book/${slug}`)
      .then(r => { setCalInfo(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.data?.error || 'Booking page not found'); setLoading(false); });
  }, [slug]);

  const loadSlots = useCallback(async (date) => {
    setLoadingSlots(true);
    try {
      const r = await axios.get(`${API_BASE}/public/book/${slug}?date=${date}`);
      setSlots(r.data.slots || []);
    } catch { setSlots([]); }
    setLoadingSlots(false);
  }, [slug]);

  function selectDate(dateStr) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSlots([]);
    loadSlots(dateStr);
    setStep('time');
  }

  function selectTime(time) {
    setSelectedTime(time);
    setStep('form');
  }

  async function submitBooking() {
    if (!form.name.trim()) { setSubmitError('Please enter your name'); return; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setSubmitError('Please enter a valid email'); return; }

    // Check required custom questions
    const missing = (calInfo.custom_questions || []).filter(q => q.required && !form.answers[q.id]);
    if (missing.length > 0) { setSubmitError(`Please answer: ${missing.map(q=>q.label).join(', ')}`); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const r = await axios.post(`${API_BASE}/public/book/${slug}`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        date: selectedDate,
        time: selectedTime,
        timezone: tz,
        answers: form.answers,
        notes: form.notes.trim(),
      });
      setConfirmedBooking(r.data);
      setStep('confirmed');
    } catch (e) {
      setSubmitError(e.response?.data?.error || 'Booking failed. Please try again.');
    } finally { setSubmitting(false); }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const accent = calInfo?.accent_color || '#1d4ed8';

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:`3px solid ${accent}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#718096', fontSize:14 }}>Loading booking page…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
        <h2 style={{ fontWeight:700, marginBottom:8 }}>Page Not Found</h2>
        <p style={{ color:'#718096' }}>{error}</p>
      </div>
    </div>
  );

  const availDates = getAvailableDates(calInfo.availability, viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date(new Date().toDateString());

  const locIcon = { zoom:'🎥', teams:'💼', meet:'🟢', phone:'📞', custom:'🔗' }[calInfo.location_type] || '🔗';

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <div style={{ background: accent, padding:'16px 24px', textAlign:'center' }}>
        <div style={{ fontFamily:'Georgia,serif', fontWeight:800, fontSize:22, color:'#fff', letterSpacing:'-0.5px' }}>
          ado<span style={{ color:'#fbbf24' }}>boost</span>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 16px' }}>
        {/* Calendar Info Card */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', display:'flex', flexWrap:'wrap' }}>

          {/* Left Panel — Calendar Info */}
          <div style={{ width:280, minWidth:260, padding:28, borderRight:'1px solid #f1f5f9', background:'#f8fafc', flexShrink:0 }}>
            <div style={{ width:48, height:48, borderRadius:12, background: accent + '20', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, fontSize:24 }}>
              📅
            </div>
            <h1 style={{ margin:'0 0 6px', fontSize:20, fontWeight:800, color:'#1a202c', lineHeight:1.3 }}>{calInfo.name}</h1>
            <p style={{ margin:'0 0 16px', fontSize:13, color:'#718096', lineHeight:1.6 }}>{calInfo.host_name}</p>

            {calInfo.description && (
              <p style={{ margin:'0 0 16px', fontSize:13, color:'#4a5568', lineHeight:1.6 }}>{calInfo.description}</p>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#4a5568' }}>
                <span style={{ fontSize:16 }}>🕐</span>
                <strong>{calInfo.duration} minutes</strong>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#4a5568' }}>
                <span style={{ fontSize:16 }}>🌐</span>
                {calInfo.timezone}
              </div>
              {calInfo.location_type && calInfo.location_type !== 'custom' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#4a5568' }}>
                  <span style={{ fontSize:16 }}>{locIcon}</span>
                  {{ zoom:'Zoom', teams:'Microsoft Teams', meet:'Google Meet', phone:'Phone Call' }[calInfo.location_type] || 'Online'}
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div style={{ marginTop:24, display:'flex', gap:6 }}>
              {['date','time','form'].map((s, idx) => (
                <div key={s} style={{ flex:1, height:4, borderRadius:2,
                  background: ['date','time','form','confirmed'].indexOf(step) >= idx ? accent : '#e2e8f0' }} />
              ))}
            </div>
            <div style={{ display:'flex', gap:6, marginTop:6 }}>
              {['Select Date', 'Pick Time', 'Your Info'].map((label, idx) => (
                <div key={label} style={{ flex:1, fontSize:10, color: ['date','time','form','confirmed'].indexOf(step) >= idx ? accent : '#9ca3af', fontWeight:600, textAlign:'center' }}>{label}</div>
              ))}
            </div>
          </div>

          {/* Right Panel — Steps */}
          <div style={{ flex:1, minWidth:280, padding:28 }}>

            {/* STEP: DATE */}
            {(step === 'date' || step === 'time') && step === 'date' && (
              <div>
                <h2 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:'#1a202c' }}>Select a Date</h2>

                {/* Month Navigation */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <button onClick={prevMonth}
                    style={{ padding:'6px 12px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:16 }}>←</button>
                  <span style={{ fontWeight:700, fontSize:15 }}>{MONTHS[viewMonth]} {viewYear}</span>
                  <button onClick={nextMonth}
                    style={{ padding:'6px 12px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:16 }}>→</button>
                </div>

                {/* Day headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:8 }}>
                  {DAYS_SHORT.map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'#9ca3af', padding:'4px 0' }}>{d}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const date = new Date(viewYear, viewMonth, day);
                    const isPast = date < today;
                    const isAvail = availDates.has(dateStr);
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button key={day} onClick={() => !isPast && isAvail && selectDate(dateStr)}
                        disabled={isPast || !isAvail}
                        style={{
                          padding:'8px 4px', border:'none', borderRadius:8, cursor: isAvail && !isPast ? 'pointer' : 'default',
                          background: isSelected ? accent : isAvail && !isPast ? accent + '15' : 'transparent',
                          color: isSelected ? '#fff' : isPast ? '#d1d5db' : isAvail ? '#1a202c' : '#d1d5db',
                          fontWeight: isAvail && !isPast ? 700 : 400,
                          fontSize:14, transition:'all 0.15s',
                        }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP: TIME */}
            {step === 'time' && (
              <div>
                <button onClick={() => setStep('date')} style={{ background:'none', border:'none', cursor:'pointer', color:'#718096', fontSize:13, display:'flex', alignItems:'center', gap:4, marginBottom:16, padding:0 }}>
                  ← Back
                </button>
                <h2 style={{ margin:'0 0 4px', fontSize:16, fontWeight:700, color:'#1a202c' }}>Pick a Time</h2>
                <p style={{ margin:'0 0 20px', fontSize:13, color:'#718096' }}>{fmtDate(selectedDate)} · {calInfo.timezone}</p>

                {loadingSlots ? (
                  <div style={{ textAlign:'center', padding:32 }}>
                    <div style={{ width:32, height:32, border:`3px solid ${accent}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 8px' }} />
                    <p style={{ color:'#718096', fontSize:13 }}>Loading available times…</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign:'center', padding:32, background:'#f8fafc', borderRadius:10 }}>
                    <p style={{ color:'#718096', margin:0 }}>No available slots on this day. Please pick another date.</p>
                    <button onClick={() => setStep('date')} style={{ marginTop:12, padding:'8px 16px', background: accent, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 }}>
                      Choose Another Date
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:10 }}>
                    {slots.map(time => (
                      <button key={time} onClick={() => selectTime(time)}
                        style={{ padding:'10px 8px', border:`2px solid ${selectedTime===time ? accent : '#e2e8f0'}`,
                          borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600,
                          background: selectedTime===time ? accent : '#fff',
                          color: selectedTime===time ? '#fff' : '#374151',
                          transition:'all 0.15s' }}>
                        {fmtSlot(time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP: FORM */}
            {step === 'form' && (
              <div>
                <button onClick={() => setStep('time')} style={{ background:'none', border:'none', cursor:'pointer', color:'#718096', fontSize:13, display:'flex', alignItems:'center', gap:4, marginBottom:16, padding:0 }}>
                  ← Back
                </button>

                {/* Booking summary */}
                <div style={{ background: accent + '10', border:`1px solid ${accent}40`, borderRadius:10, padding:14, marginBottom:20, display:'flex', gap:12 }}>
                  <span style={{ fontSize:24 }}>📅</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1a202c' }}>{fmtDate(selectedDate)}</div>
                    <div style={{ color:'#4a5568', fontSize:13 }}>{fmtSlot(selectedTime)} · {calInfo.duration} min · {calInfo.timezone}</div>
                  </div>
                </div>

                <h2 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1a202c' }}>Your Details</h2>

                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Full Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}
                        placeholder="Your name"
                        style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email *</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))}
                        placeholder="your@email.com"
                        style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Phone <span style={{ color:'#9ca3af', fontWeight:400 }}>(optional)</span></label>
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}
                      placeholder="+1 555 000 0000"
                      style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }} />
                  </div>

                  {/* Custom questions */}
                  {(calInfo.custom_questions || []).map(q => (
                    <div key={q.id}>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>
                        {q.label} {q.required && <span style={{ color:'#dc2626' }}>*</span>}
                      </label>
                      {q.type === 'textarea' ? (
                        <textarea value={form.answers[q.id] || ''} onChange={e => setForm(f => ({...f, answers:{...f.answers, [q.id]:e.target.value}}))}
                          rows={3}
                          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, resize:'vertical' }} />
                      ) : q.type === 'select' ? (
                        <select value={form.answers[q.id] || ''} onChange={e => setForm(f => ({...f, answers:{...f.answers, [q.id]:e.target.value}}))}
                          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }}>
                          <option value="">Select…</option>
                          {(q.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input type={q.type === 'phone' ? 'tel' : 'text'}
                          value={form.answers[q.id] || ''} onChange={e => setForm(f => ({...f, answers:{...f.answers, [q.id]:e.target.value}}))}
                          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }} />
                      )}
                    </div>
                  ))}

                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Additional Notes <span style={{ color:'#9ca3af', fontWeight:400 }}>(optional)</span></label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))}
                      rows={2} placeholder="Anything you'd like to discuss or share before the meeting..."
                      style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, resize:'vertical' }} />
                  </div>

                  {submitError && (
                    <div style={{ padding:12, background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, color:'#dc2626', fontSize:13 }}>
                      {submitError}
                    </div>
                  )}

                  <button onClick={submitBooking} disabled={submitting}
                    style={{ padding:'12px 24px', background: accent, color:'#fff', border:'none', borderRadius:8, cursor: submitting ? 'not-allowed' : 'pointer', fontSize:15, fontWeight:700, opacity: submitting ? 0.75 : 1, transition:'opacity 0.15s' }}>
                    {submitting ? '⏳ Booking…' : '✅ Confirm Meeting'}
                  </button>

                  <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', margin:0 }}>
                    You'll receive a confirmation email with a calendar invite.
                  </p>
                </div>
              </div>
            )}

            {/* STEP: CONFIRMED */}
            {step === 'confirmed' && confirmedBooking && (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
                <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:800, color:'#16a34a' }}>Meeting Confirmed!</h2>
                <p style={{ color:'#4a5568', margin:'0 0 24px', fontSize:14 }}>A confirmation email with a calendar invite has been sent to <strong>{form.email}</strong></p>

                <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:20, marginBottom:24, textAlign:'left' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', gap:10, fontSize:14 }}>
                      <span style={{ color:'#9ca3af', minWidth:100 }}>📅 Date</span>
                      <strong style={{ color:'#1a202c' }}>{fmtDate(selectedDate)}</strong>
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:14 }}>
                      <span style={{ color:'#9ca3af', minWidth:100 }}>🕐 Time</span>
                      <strong style={{ color:'#1a202c' }}>{fmtSlot(selectedTime)}</strong>
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:14 }}>
                      <span style={{ color:'#9ca3af', minWidth:100 }}>⏱ Duration</span>
                      <strong style={{ color:'#1a202c' }}>{confirmedBooking.duration} minutes</strong>
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:14 }}>
                      <span style={{ color:'#9ca3af', minWidth:100 }}>🌐 Timezone</span>
                      <strong style={{ color:'#1a202c' }}>{confirmedBooking.timezone || calInfo.timezone}</strong>
                    </div>
                    {confirmedBooking.meeting_link && (
                      <div style={{ display:'flex', gap:10, fontSize:14, alignItems:'center' }}>
                        <span style={{ color:'#9ca3af', minWidth:100 }}>🔗 Meeting</span>
                        <a href={confirmedBooking.meeting_link} target="_blank" rel="noreferrer"
                          style={{ color: accent, fontWeight:700, textDecoration:'none' }}>
                          Join Meeting →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ fontSize:13, color:'#718096', margin:'0 0 20px' }}>
                  Check your inbox — we've also sent a <strong>.ics calendar file</strong> so you can add this to your calendar app.
                </p>

                <button onClick={() => { setStep('date'); setSelectedDate(null); setSelectedTime(null); setForm({ name:'', email:'', phone:'', notes:'', answers:{} }); setConfirmedBooking(null); }}
                  style={{ padding:'10px 24px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 }}>
                  Book Another Meeting
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'#9ca3af', marginTop:20 }}>
          Powered by <a href="https://adobosolutions.com" style={{ color:'#9ca3af' }}>AdoBoost</a>
        </p>
      </div>
    </div>
  );
}
