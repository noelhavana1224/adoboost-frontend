import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { PageHeader, Spinner, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  CalendarCheck, Plus, Copy, ExternalLink, Trash2, Edit2,
  Clock, MapPin, Mail, ChevronDown, ChevronUp, X, Check,
  Users, Link2, Globe, Video, Phone, Zap, HelpCircle
} from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];
const BUFFERS   = [0, 5, 10, 15, 30];

const LOCATION_TYPES = [
  { value: 'zoom',   label: 'Zoom',          icon: '🎥' },
  { value: 'teams',  label: 'Microsoft Teams', icon: '💼' },
  { value: 'meet',   label: 'Google Meet',    icon: '🟢' },
  { value: 'phone',  label: 'Phone Call',     icon: '📞' },
  { value: 'custom', label: 'Custom / Other', icon: '🔗' },
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Madrid', 'Europe/Rome', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Manila',
  'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
];

const DEFAULT_AVAILABILITY = {
  mon: { enabled: true, start: '09:00', end: '17:00' },
  tue: { enabled: true, start: '09:00', end: '17:00' },
  wed: { enabled: true, start: '09:00', end: '17:00' },
  thu: { enabled: true, start: '09:00', end: '17:00' },
  fri: { enabled: true, start: '09:00', end: '17:00' },
  sat: { enabled: false, start: '09:00', end: '17:00' },
  sun: { enabled: false, start: '09:00', end: '17:00' },
};

// ── Logo Field — URL or Upload ─────────────────────────────────────────────
function LogoField({ value, onChange }) {
  const [mode, setMode] = useState(value && !value.startsWith('http') ? 'upload' : 'url');
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Logo must be under 3 MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await api.post('/booking-calendar/upload-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
      toast.success('Logo uploaded!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  }

  return (
    <div style={{ background:'#f8fafc', borderRadius:10, padding:16, border:'1px solid #e2e8f0' }}>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>🖼️ Your Logo</div>
      <p style={{ fontSize:13, color:'#718096', margin:'0 0 12px' }}>
        Shown in booking confirmation emails instead of the AdoBoost logo.
      </p>
      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {[['url','🔗 Image URL'], ['upload','📁 Upload File']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding:'6px 14px', border:`2px solid ${mode===m ? '#1d4ed8' : '#e2e8f0'}`,
              borderRadius:8, background: mode===m ? '#eff6ff' : '#fff',
              color: mode===m ? '#1d4ed8' : '#6b7280', fontSize:13, fontWeight: mode===m ? 700 : 400, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <input value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="https://yourcompany.com/logo.png"
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
      ) : (
        <label style={{ display:'block', padding:'20px', border:'2px dashed #d1d5db', borderRadius:8, textAlign:'center', cursor:'pointer', background:'#fff' }}>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFile} style={{ display:'none' }} />
          {uploading
            ? <div style={{ color:'#1d4ed8', fontSize:13, fontWeight:600 }}>⏳ Uploading…</div>
            : <div>
                <div style={{ fontSize:28, marginBottom:4 }}>📁</div>
                <div style={{ fontSize:13, color:'#6b7280' }}>Click to choose a file <span style={{ color:'#9ca3af' }}>(JPG, PNG, SVG — max 3 MB)</span></div>
              </div>
          }
        </label>
      )}

      {value && (
        <div style={{ marginTop:12, padding:12, background:'#fff', borderRadius:8, border:'1px solid #e2e8f0', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <img src={value} alt="logo" style={{ maxHeight:52, maxWidth:180, objectFit:'contain' }}
            onError={e => { e.target.style.display='none'; }} />
          <button onClick={() => onChange('')}
            style={{ fontSize:12, color:'#dc2626', background:'#fee2e2', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function fmtDateTime(dt) {
  try {
    return new Date(dt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return dt; }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

// ── Calendar Editor Drawer ─────────────────────────────────────────────────
function CalendarEditor({ calendar, onSave, onClose }) {
  const isEdit = !!calendar;
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [form, setForm] = useState({
    name: calendar?.name || '',
    description: calendar?.description || '',
    duration: calendar?.duration || 30,
    buffer_time: calendar?.buffer_time || 0,
    timezone: calendar?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    location_type: calendar?.location_type || 'custom',
    location_url: calendar?.location_url || '',
    forward_email: calendar?.forward_email || '',
    accent_color: calendar?.accent_color || '#1d4ed8',
    custom_questions: calendar?.custom_questions || [],
    availability: calendar?.availability || { ...DEFAULT_AVAILABILITY },
    // Branding
    logo_url: calendar?.logo_url || '',
    smtp_host: calendar?.smtp_host || '',
    smtp_port: calendar?.smtp_port || 587,
    smtp_user: calendar?.smtp_user || '',
    smtp_pass: calendar?.smtp_pass || '',
    smtp_from_name: calendar?.smtp_from_name || '',
    smtp_from_email: calendar?.smtp_from_email || '',
    smtp_secure: calendar?.smtp_secure ? true : false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function save() {
    if (!form.name.trim()) { toast.error('Calendar name required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, custom_questions: form.custom_questions, availability: form.availability };
      let result;
      if (isEdit) {
        result = (await api.put(`/booking-calendar/${calendar.id}`, payload)).data;
      } else {
        result = (await api.post('/booking-calendar', payload)).data;
      }
      onSave(result);
      toast.success(isEdit ? 'Booking page updated!' : 'Booking page created!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  function addQuestion() {
    const q = { id: `q_${Date.now()}`, label: '', type: 'text', required: false };
    set('custom_questions', [...form.custom_questions, q]);
  }
  function updateQuestion(idx, field, val) {
    const updated = form.custom_questions.map((q, i) => i === idx ? { ...q, [field]: val } : q);
    set('custom_questions', updated);
  }
  function removeQuestion(idx) {
    set('custom_questions', form.custom_questions.filter((_, i) => i !== idx));
  }
  function setAvail(day, field, val) {
    set('availability', { ...form.availability, [day]: { ...form.availability[day], [field]: val } });
  }

  async function testSmtp() {
    setTestingSmtp(true);
    try {
      await api.post('/booking-calendar/test-smtp', {
        smtp_host: form.smtp_host, smtp_port: form.smtp_port,
        smtp_user: form.smtp_user, smtp_pass: form.smtp_pass,
        smtp_from_email: form.smtp_from_email, smtp_from_name: form.smtp_from_name,
        smtp_secure: form.smtp_secure,
      });
      toast.success('SMTP connection successful!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'SMTP test failed');
    } finally { setTestingSmtp(false); }
  }

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'availability', label: 'Availability' },
    { id: 'meeting', label: 'Meeting Link' },
    { id: 'questions', label: 'Questions' },
    { id: 'notify', label: 'Notifications' },
    { id: 'branding', label: 'Branding & Email' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex' }}>
      <div style={{ flex:1, background:'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ width:560, background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-4px 0 24px rgba(0,0,0,0.15)', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>{isEdit ? 'Edit Booking Page' : 'Create Booking Page'}</h2>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#718096' }}>Set up your scheduling link</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', color:'#718096' }}><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid #e2e8f0', padding:'0 24px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontSize:13,
                fontWeight: tab===t.id ? 700 : 400,
                color: tab===t.id ? '#1d4ed8' : '#718096',
                borderBottom: tab===t.id ? '2px solid #1d4ed8' : '2px solid transparent',
                marginBottom:-1, whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, padding:24, overflowY:'auto' }}>

          {/* GENERAL */}
          {tab === 'general' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Calendar Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. 30-Minute Discovery Call"
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tell prospects what this meeting is about..."
                  rows={3}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Duration (minutes)</label>
                  <select value={form.duration} onChange={e => set('duration', Number(e.target.value))}
                    style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }}>
                    {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Buffer Between Meetings</label>
                  <select value={form.buffer_time} onChange={e => set('buffer_time', Number(e.target.value))}
                    style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }}>
                    {BUFFERS.map(b => <option key={b} value={b}>{b === 0 ? 'No buffer' : `${b} min`}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Timezone</label>
                <select value={form.timezone} onChange={e => set('timezone', e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 }}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Accent Color</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)}
                    style={{ width:44, height:36, padding:2, border:'1px solid #d1d5db', borderRadius:6, cursor:'pointer' }} />
                  <span style={{ fontSize:13, color:'#718096' }}>Used on your public booking page</span>
                </div>
              </div>
            </div>
          )}

          {/* AVAILABILITY */}
          {tab === 'availability' && (
            <div>
              <p style={{ fontSize:13, color:'#718096', marginTop:0 }}>Set the days and hours when prospects can book meetings with you.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {DAYS.map(({ key, label }) => {
                  const avail = form.availability[key] || { enabled: false, start: '09:00', end: '17:00' };
                  return (
                    <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background: avail.enabled ? '#f0f9ff' : '#f8fafc', borderRadius:8, border:`1px solid ${avail.enabled ? '#bae6fd' : '#e2e8f0'}` }}>
                      <label style={{ display:'flex', alignItems:'center', gap:8, minWidth:110, cursor:'pointer' }}>
                        <input type="checkbox" checked={avail.enabled}
                          onChange={e => setAvail(key, 'enabled', e.target.checked)}
                          style={{ width:16, height:16, accentColor:'#1d4ed8' }} />
                        <span style={{ fontSize:14, fontWeight: avail.enabled ? 600 : 400, color: avail.enabled ? '#1e40af' : '#9ca3af' }}>{label}</span>
                      </label>
                      {avail.enabled ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
                          <input type="time" value={avail.start}
                            onChange={e => setAvail(key, 'start', e.target.value)}
                            style={{ padding:'6px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13 }} />
                          <span style={{ color:'#718096', fontSize:13 }}>to</span>
                          <input type="time" value={avail.end}
                            onChange={e => setAvail(key, 'end', e.target.value)}
                            style={{ padding:'6px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13 }} />
                        </div>
                      ) : (
                        <span style={{ fontSize:13, color:'#9ca3af', marginLeft:'auto' }}>Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MEETING LINK */}
          {tab === 'meeting' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <p style={{ fontSize:13, color:'#718096', marginTop:0 }}>Paste your Zoom, Teams, or Google Meet link. No OAuth needed — just the URL.</p>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Meeting Type</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {LOCATION_TYPES.map(lt => (
                    <button key={lt.value} onClick={() => set('location_type', lt.value)}
                      style={{ padding:'10px 14px', border:`2px solid ${form.location_type===lt.value ? '#1d4ed8' : '#e2e8f0'}`,
                        background: form.location_type===lt.value ? '#eff6ff' : '#fff',
                        borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                        fontSize:13, fontWeight: form.location_type===lt.value ? 600 : 400,
                        color: form.location_type===lt.value ? '#1d4ed8' : '#374151' }}>
                      <span>{lt.icon}</span> {lt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>
                  {form.location_type === 'phone' ? 'Phone Number' : 'Meeting URL'}
                </label>
                <input value={form.location_url} onChange={e => set('location_url', e.target.value)}
                  placeholder={
                    form.location_type === 'zoom'   ? 'https://zoom.us/j/123456789' :
                    form.location_type === 'teams'  ? 'https://teams.microsoft.com/l/meetup-join/...' :
                    form.location_type === 'meet'   ? 'https://meet.google.com/abc-defg-hij' :
                    form.location_type === 'phone'  ? '+1 (555) 123-4567' :
                    'https://example.com/meeting'
                  }
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
              </div>
              {form.location_url && (
                <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:12, display:'flex', alignItems:'center', gap:8 }}>
                  <Check size={16} color="#16a34a" />
                  <span style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>Meeting link added — will be included in confirmation emails</span>
                </div>
              )}
            </div>
          )}

          {/* QUESTIONS */}
          {tab === 'questions' && (
            <div>
              <p style={{ fontSize:13, color:'#718096', marginTop:0 }}>Add custom questions to your booking form. Name and email are always collected automatically.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {form.custom_questions.map((q, idx) => (
                  <div key={q.id} style={{ padding:14, border:'1px solid #e2e8f0', borderRadius:8, background:'#f8fafc' }}>
                    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                      <input value={q.label} onChange={e => updateQuestion(idx, 'label', e.target.value)}
                        placeholder="Question label (e.g. Company Name)"
                        style={{ flex:1, padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13 }} />
                      <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}
                        style={{ padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13 }}>
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="phone">Phone</option>
                        <option value="select">Dropdown</option>
                      </select>
                      <button onClick={() => removeQuestion(idx)}
                        style={{ padding:'6px 10px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, cursor:'pointer', color:'#dc2626' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {q.type === 'select' && (
                      <input value={q.options || ''} onChange={e => updateQuestion(idx, 'options', e.target.value)}
                        placeholder="Option 1, Option 2, Option 3 (comma-separated)"
                        style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13, boxSizing:'border-box', marginBottom:8 }} />
                    )}
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'#374151' }}>
                      <input type="checkbox" checked={q.required || false}
                        onChange={e => updateQuestion(idx, 'required', e.target.checked)} />
                      Required field
                    </label>
                  </div>
                ))}
              </div>
              <button onClick={addQuestion}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', border:'2px dashed #d1d5db', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13, color:'#6b7280', width:'100%', justifyContent:'center' }}>
                <Plus size={16} /> Add Custom Question
              </button>
            </div>
          )}

          {/* BRANDING & EMAIL */}
          {tab === 'branding' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Logo */}
              <LogoField value={form.logo_url} onChange={v => set('logo_url', v)} />

              {/* Custom SMTP */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:16, border:'1px solid #e2e8f0' }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                  📧 Custom Sender Email (SMTP)
                </div>
                <p style={{ fontSize:13, color:'#718096', margin:'0 0 14px', lineHeight:1.5 }}>
                  Send booking notifications from your own email (e.g. <em>noreply@yourcompany.com</em>).
                  Leave blank to use the AdoBoost system mailer.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>From Name</label>
                      <input value={form.smtp_from_name} onChange={e => set('smtp_from_name', e.target.value)}
                        placeholder="Apple Inc."
                        style={{ width:'100%', padding:'9px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, boxSizing:'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>From Email</label>
                      <input type="email" value={form.smtp_from_email} onChange={e => set('smtp_from_email', e.target.value)}
                        placeholder="noreply@yourdomain.com"
                        style={{ width:'100%', padding:'9px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, boxSizing:'border-box' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>SMTP Host</label>
                    <input value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)}
                      placeholder="smtp.gmail.com  or  smtp.hostinger.com"
                      style={{ width:'100%', padding:'9px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Port</label>
                      <select value={form.smtp_port} onChange={e => set('smtp_port', Number(e.target.value))}
                        style={{ width:'100%', padding:'9px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13 }}>
                        <option value={587}>587 (TLS/STARTTLS)</option>
                        <option value={465}>465 (SSL)</option>
                        <option value={25}>25 (Plain)</option>
                      </select>
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                        <input type="checkbox" checked={form.smtp_secure} onChange={e => set('smtp_secure', e.target.checked)}
                          style={{ width:16, height:16, accentColor:'#1d4ed8' }} />
                        <span style={{ fontWeight:600 }}>Use SSL (port 465)</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>SMTP Username</label>
                    <input value={form.smtp_user} onChange={e => set('smtp_user', e.target.value)}
                      placeholder="noreply@yourdomain.com"
                      style={{ width:'100%', padding:'9px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>SMTP Password</label>
                    <input type="password" value={form.smtp_pass} onChange={e => set('smtp_pass', e.target.value)}
                      placeholder="••••••••••••"
                      style={{ width:'100%', padding:'9px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                  {form.smtp_host && form.smtp_user && form.smtp_pass && (
                    <button onClick={testSmtp} disabled={testingSmtp}
                      style={{ padding:'9px 16px', border:'1px solid #1d4ed8', borderRadius:8, background:'#eff6ff', color:'#1d4ed8', cursor:'pointer', fontSize:13, fontWeight:700, opacity: testingSmtp ? 0.7 : 1 }}>
                      {testingSmtp ? '⏳ Testing…' : '🔌 Test SMTP Connection'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ background:'#fefce8', borderRadius:10, padding:12, border:'1px solid #fde68a' }}>
                <p style={{ margin:0, fontSize:13, color:'#92400e' }}>
                  💡 This SMTP is <strong>only for calendar booking emails</strong> — it won't be used for campaigns or warmup. Credentials are stored securely in your account.
                </p>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notify' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#eff6ff', borderRadius:10, padding:16, border:'1px solid #bfdbfe' }}>
                <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                  <Mail size={18} color="#1d4ed8" style={{ flexShrink:0, marginTop:2 }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1e40af' }}>How meeting notifications work</div>
                    <div style={{ fontSize:13, color:'#3b82f6', lineHeight:1.5, marginTop:4 }}>
                      When someone books a meeting:
                      <ul style={{ margin:'6px 0 0', paddingLeft:16 }}>
                        <li>The <strong>booker</strong> gets a confirmation email with a .ics calendar file</li>
                        <li>You get a booking alert at the <strong>forward email</strong> below — also with a .ics file so you can accept/decline in your own calendar</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Forward Meeting Notifications To</label>
                <input type="email" value={form.forward_email} onChange={e => set('forward_email', e.target.value)}
                  placeholder="your@email.com"
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                <p style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>
                  You'll receive a calendar invite (.ics) you can accept — it'll show up in Google Calendar, Outlook, Apple Calendar, etc.
                </p>
              </div>
              <div style={{ background:'#fefce8', borderRadius:10, padding:14, border:'1px solid #fde68a' }}>
                <p style={{ margin:0, fontSize:13, color:'#92400e' }}>
                  💡 <strong>No OAuth required!</strong> Just enter any email — we'll send the .ics invite there. Accept it in your inbox to add the meeting to your personal calendar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose}
            style={{ padding:'10px 20px', border:'1px solid #d1d5db', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14, color:'#374151' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:'10px 24px', border:'none', borderRadius:8, background:'#1d4ed8', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Booking Page'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Booking Row ────────────────────────────────────────────────────────────
function BookingRow({ booking, onCancel }) {
  const isPast = new Date(booking.start_time) < new Date();
  const statusColor = { confirmed: '#16a34a', cancelled: '#dc2626', rescheduled: '#d97706' };

  return (
    <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
      <td style={{ padding:'12px 16px', fontSize:13 }}>
        <div style={{ fontWeight:600, color:'#1a202c' }}>{booking.booker_name}</div>
        <div style={{ color:'#718096', fontSize:12 }}>{booking.booker_email}</div>
        {booking.booker_phone && <div style={{ color:'#718096', fontSize:12 }}>{booking.booker_phone}</div>}
      </td>
      <td style={{ padding:'12px 16px', fontSize:13 }}>
        <div style={{ fontWeight:600 }}>{fmtDateTime(booking.start_time)}</div>
        <div style={{ color:'#718096', fontSize:12 }}>{booking.cal_timezone || booking.timezone}</div>
      </td>
      <td style={{ padding:'12px 16px', fontSize:13 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:12,
          background: booking.accent_color ? booking.accent_color + '20' : '#eff6ff',
          color: booking.accent_color || '#1d4ed8', fontWeight:600, fontSize:12 }}>
          {booking.calendar_name}
        </span>
      </td>
      <td style={{ padding:'12px 16px' }}>
        <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:12, fontWeight:700,
          background: booking.status === 'confirmed' ? '#dcfce7' : '#fee2e2',
          color: statusColor[booking.status] || '#718096' }}>
          {booking.status}
        </span>
      </td>
      <td style={{ padding:'12px 16px' }}>
        {booking.meeting_link ? (
          <a href={booking.meeting_link} target="_blank" rel="noreferrer"
            style={{ fontSize:12, color:'#1d4ed8', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            <ExternalLink size={13} /> Join
          </a>
        ) : <span style={{ fontSize:12, color:'#9ca3af' }}>—</span>}
      </td>
      <td style={{ padding:'12px 16px' }}>
        {booking.status === 'confirmed' && !isPast && (
          <button onClick={() => onCancel(booking.id)}
            style={{ fontSize:12, color:'#dc2626', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:6, background:'#fee2e2' }}>
            Cancel
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BookingCalendarPage() {
  const { user } = useAuth();
  const isTrial = !user || user.plan === 'trial';

  // Plan gate — show upgrade prompt for trial users
  if (isTrial) return (
    <div style={{ maxWidth:560, margin:'80px auto', textAlign:'center', padding:32 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📅</div>
      <h2 style={{ fontWeight:800, fontSize:22, marginBottom:8 }}>Booking Calendar</h2>
      <p style={{ color:'#718096', fontSize:15, marginBottom:24, lineHeight:1.6 }}>
        Let prospects book meetings directly from your email outreach — with automatic .ics calendar invites, custom questions, and your own branded emails.
      </p>
      <div style={{ background:'#fefce8', borderRadius:12, padding:20, border:'1px solid #fde68a', marginBottom:24, textAlign:'left' }}>
        <div style={{ fontWeight:700, fontSize:14, color:'#92400e', marginBottom:10 }}>Available on Starter, Professional & Agency</div>
        {['Unlimited booking pages','Custom availability & time zones','Branded emails with your logo & SMTP','Custom questions for your booking form','.ics calendar invites (no OAuth needed)','Zoom, Teams, Meet, Phone support'].map(f => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#78350f', marginBottom:6 }}>
            <span style={{ color:'#d97706', fontWeight:700 }}>✓</span> {f}
          </div>
        ))}
      </div>
      <a href="/settings/billing"
        style={{ display:'inline-block', padding:'12px 32px', background:'#1d4ed8', color:'#fff', borderRadius:8, fontWeight:700, fontSize:15, textDecoration:'none' }}>
        Upgrade to Starter — $29/mo →
      </a>
      <p style={{ fontSize:12, color:'#9ca3af', marginTop:12 }}>No contracts. Cancel anytime.</p>
    </div>
  );

  const [tab, setTab] = useState('pages');
  const [calendars, setCalendars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCal, setEditingCal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadCalendars = useCallback(async () => {
    try {
      const res = await api.get('/booking-calendar');
      setCalendars(res.data);
    } catch (e) { toast.error('Failed to load booking pages'); }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.get('/booking-calendar/bookings/all');
      setBookings(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadCalendars(), loadBookings()]).finally(() => setLoading(false));
  }, []);

  function getBookingLink(slug) {
    return `${FRONTEND_URL}/book/${slug}`;
  }

  function handleCopy(slug, id) {
    copyToClipboard(getBookingLink(slug));
    setCopiedId(id);
    toast.success('Booking link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this booking page? All bookings will also be deleted.')) return;
    try {
      await api.delete(`/booking-calendar/${id}`);
      setCalendars(c => c.filter(x => x.id !== id));
      setBookings(b => b.filter(x => x.calendar_id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  }

  async function handleCancelBooking(bookingId) {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/booking-calendar/bookings/${bookingId}`);
      setBookings(b => b.map(bk => bk.id === bookingId ? { ...bk, status: 'cancelled' } : bk));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed to cancel'); }
  }

  function handleEditorSave(cal) {
    if (editingCal) {
      setCalendars(c => c.map(x => x.id === cal.id ? cal : x));
    } else {
      setCalendars(c => [cal, ...c]);
    }
    setShowEditor(false);
    setEditingCal(null);
  }

  function openCreate() { setEditingCal(null); setShowEditor(true); }
  function openEdit(cal) { setEditingCal(cal); setShowEditor(true); }

  const upcomingCount = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) >= new Date()).length;

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner /></div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:800, display:'flex', alignItems:'center', gap:10 }}>
            <CalendarCheck size={24} color="#1d4ed8" /> Booking Calendar
          </h1>
          <p style={{ margin:0, color:'#718096', fontSize:14 }}>Let prospects book meetings directly from your email outreach</p>
        </div>
        <button onClick={openCreate}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <Plus size={16} /> New Booking Page
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24 }}>
        {[
          { label: 'Booking Pages', value: calendars.length, icon: CalendarCheck, color: '#1d4ed8' },
          { label: 'Total Bookings', value: bookings.filter(b => b.status==='confirmed').length, icon: Users, color: '#16a34a' },
          { label: 'Upcoming Meetings', value: upcomingCount, icon: Clock, color: '#d97706' },
        ].map(stat => (
          <div key={stat.label} style={{ background:'#fff', borderRadius:10, padding:16, border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:10, background: stat.color + '15', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:'#1a202c' }}>{stat.value}</div>
              <div style={{ fontSize:12, color:'#718096' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e2e8f0', marginBottom:20 }}>
        {[['pages','📋 Booking Pages'], ['bookings','📅 All Bookings']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'10px 18px', border:'none', background:'none', cursor:'pointer', fontSize:14,
              fontWeight: tab===id ? 700 : 400, color: tab===id ? '#1d4ed8' : '#718096',
              borderBottom: tab===id ? '2px solid #1d4ed8' : '2px solid transparent', marginBottom:-2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* BOOKING PAGES TAB */}
      {tab === 'pages' && (
        <div>
          {calendars.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:12, border:'2px dashed #e2e8f0' }}>
              <CalendarCheck size={48} color="#d1d5db" style={{ marginBottom:12 }} />
              <h3 style={{ margin:'0 0 8px', fontWeight:700 }}>No booking pages yet</h3>
              <p style={{ color:'#718096', margin:'0 0 20px', fontSize:14 }}>Create your first booking page and share the link in your email campaigns.</p>
              <button onClick={openCreate}
                style={{ padding:'10px 24px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:700 }}>
                <Plus size={14} style={{ marginRight:6 }} /> Create Booking Page
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {calendars.map(cal => {
                const link = getBookingLink(cal.slug);
                const ltInfo = LOCATION_TYPES.find(l => l.value === cal.location_type);
                return (
                  <div key={cal.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                    <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
                      {/* Color stripe */}
                      <div style={{ width:6, height:56, borderRadius:3, background: cal.is_active ? (cal.accent_color || '#1d4ed8') : '#d1d5db', flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                          <span style={{ fontWeight:700, fontSize:16 }}>{cal.name}</span>
                          <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:10,
                            background: cal.is_active ? '#dcfce7' : '#f3f4f6',
                            color: cal.is_active ? '#16a34a' : '#9ca3af' }}>
                            {cal.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                          <span style={{ fontSize:12, color:'#718096', display:'flex', alignItems:'center', gap:4 }}>
                            <Clock size={12} /> {cal.duration} min
                          </span>
                          <span style={{ fontSize:12, color:'#718096', display:'flex', alignItems:'center', gap:4 }}>
                            <Globe size={12} /> {cal.timezone}
                          </span>
                          <span style={{ fontSize:12, color:'#718096', display:'flex', alignItems:'center', gap:4 }}>
                            {ltInfo?.icon} {ltInfo?.label}
                          </span>
                          <span style={{ fontSize:12, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                            <Users size={12} /> {cal.booking_count || 0} bookings
                          </span>
                        </div>
                        {/* Booking link */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, padding:'6px 10px', background:'#f8fafc', borderRadius:6, border:'1px solid #e2e8f0' }}>
                          <Link2 size={13} color="#718096" />
                          <span style={{ fontSize:12, color:'#4b5563', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{link}</span>
                          <button onClick={() => handleCopy(cal.slug, cal.id)}
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff', cursor:'pointer', fontSize:12, color:'#374151', whiteSpace:'nowrap', flexShrink:0 }}>
                            {copiedId === cal.id ? <><Check size={12} color="#16a34a" /> Copied!</> : <><Copy size={12} /> Copy</>}
                          </button>
                          <a href={link} target="_blank" rel="noreferrer"
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff', cursor:'pointer', fontSize:12, color:'#374151', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
                            <ExternalLink size={12} /> Preview
                          </a>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <button onClick={() => openEdit(cal)}
                          style={{ padding:'8px 14px', border:'1px solid #d1d5db', borderRadius:8, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151' }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(cal.id)}
                          style={{ padding:'8px 12px', border:'1px solid #fca5a5', borderRadius:8, background:'#fff', cursor:'pointer', color:'#dc2626' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Template variable hint */}
          {calendars.length > 0 && (
            <div style={{ marginTop:20, padding:14, background:'#fefce8', borderRadius:10, border:'1px solid #fde68a', display:'flex', alignItems:'flex-start', gap:10 }}>
              <Zap size={16} color="#d97706" style={{ flexShrink:0, marginTop:2 }} />
              <div style={{ fontSize:13, color:'#92400e' }}>
                <strong>Pro tip:</strong> Copy your booking link and paste it directly into your email campaign templates. You can add it as a button like: <em>"Click here to book a 30-min call → [your link]"</em>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0' }}>
              <Users size={48} color="#d1d5db" style={{ marginBottom:12 }} />
              <h3 style={{ margin:'0 0 8px', fontWeight:700 }}>No bookings yet</h3>
              <p style={{ color:'#718096', fontSize:14, margin:0 }}>When prospects book meetings through your booking pages, they'll appear here.</p>
            </div>
          ) : (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                    {['Prospect', 'Date & Time', 'Booking Page', 'Status', 'Meeting Link', 'Actions'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <BookingRow key={b.id} booking={b} onCancel={handleCancelBooking} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Editor Drawer */}
      {showEditor && (
        <CalendarEditor
          calendar={editingCal}
          onSave={handleEditorSave}
          onClose={() => { setShowEditor(false); setEditingCal(null); }}
        />
      )}
    </div>
  );
}
