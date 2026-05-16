import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Phone, Megaphone, ArrowRight, X,
  HeadphonesIcon, Search, Linkedin, Database, FileSpreadsheet, MoreHorizontal
} from 'lucide-react';

const PRICED_OPTIONS = [
  {
    id: 'caller',
    icon: Phone,
    title: 'Caller VA',
    rate: '$7/hr',
    desc: 'Trained agents who call your leads, qualify them, and book meetings.',
    bullets: [
      'Outbound calling from your scripts or ours',
      'Lead qualification and discovery',
      'Calendar booking directly to your tool',
    ],
    hoursOptions: [
      { value: 'half-time', label: 'Half-time (20 hrs/week)' },
      { value: 'full-time', label: 'Full-time (40 hrs/week)' },
    ],
  },
  {
    id: 'campaign_manager',
    icon: Megaphone,
    title: 'Campaign Manager VA',
    rate: '$4/hr',
    desc: 'A dedicated VA who builds, sends, and monitors your cold email campaigns for you.',
    bullets: [
      'Campaign setup, sequences, and follow-ups',
      'Inbox monitoring and lead replies',
      'Weekly reporting on your numbers',
    ],
    hoursOptions: [
      { value: 'part-time', label: 'Part-time (20 hrs/week)' },
    ],
  },
];

const CONTACT_SALES_SERVICES = [
  { id: 'admin_support',       icon: HeadphonesIcon,   label: 'Admin Support' },
  { id: 'lead_gen',            icon: Search,           label: 'Lead Generation Specialist' },
  { id: 'linkedin_lead_gen',   icon: Linkedin,         label: 'LinkedIn Lead Gen Specialist' },
  { id: 'data_entry',          icon: FileSpreadsheet,  label: 'Data Entry' },
  { id: 'database_management', icon: Database,         label: 'Database Management' },
  { id: 'other',               icon: MoreHorizontal,   label: 'Something else' },
];

export default function VAUpsell() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [hours, setHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contact-sales sub-state
  const [showContactSales, setShowContactSales] = useState(false);
  const [contactService, setContactService] = useState('');
  const [contactNotes, setContactNotes] = useState('');

  const handleInterested = async () => {
    if (!selected) return toast.error('Pick an option first');
    setSubmitting(true);
    try {
      await api.post('/va-interest', {
        va_type: selected,
        hours_type: hours || null,
      });
      toast.success("Got it! We'll be in touch within 24 hours.");
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactService) return toast.error('Pick a service first');
    setSubmitting(true);
    try {
      await api.post('/va-interest', {
        va_type: contactService,
        hours_type: null,
        notes: contactNotes || null,
      });
      toast.success("Thanks! Our sales team will reach out within 24 hours.");
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await api.post('/va-upsell/dismiss', {});
    } catch (e) { /* silent */ }
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', padding:'40px 20px', position:'relative' }}>
      <button
        onClick={handleSkip}
        style={{ position:'absolute', top:20, right:20, background:'transparent', border:'none', display:'flex', alignItems:'center', gap:6, color:'#718096', fontSize:13, cursor:'pointer' }}
      >
        Skip for now <X size={14} />
      </button>

      <div style={{ maxWidth:980, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h1 style={{ fontSize:32, fontWeight:800, color:'#1a202c', marginBottom:10, letterSpacing:'-0.02em' }}>
            Need a hand running your outreach?
          </h1>
          <p style={{ fontSize:16, color:'#718096', maxWidth:620, margin:'0 auto', lineHeight:1.6 }}>
            AdoBoost gives you the tools. Our trained Filipino VAs give you the time back — pick a service below or talk to our team about something custom.
          </p>
        </div>

        {/* PRICED CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
          {PRICED_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => { setSelected(opt.id); setHours(opt.hoursOptions[0].value); setShowContactSales(false); }}
                style={{
                  background:'#fff',
                  border: isSelected ? '2px solid #0D47A1' : '2px solid #e2e8f0',
                  borderRadius:14,
                  padding:24,
                  cursor:'pointer',
                  transition:'all 0.15s',
                  boxShadow: isSelected ? '0 4px 18px rgba(13,71,161,0.18)' : 'none',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:44, height:44, background: isSelected ? '#0D47A1' : '#edf2f7', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}>
                    <Icon size={22} color={isSelected ? '#fff' : '#4a5568'} />
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#1a202c' }}>{opt.title}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:'#0D47A1' }}>{opt.rate}</div>
                  </div>
                </div>
                <p style={{ fontSize:14, color:'#4a5568', lineHeight:1.6, marginBottom:14 }}>{opt.desc}</p>
                <ul style={{ listStyle:'none', padding:0, margin:0, marginBottom: isSelected ? 0 : 4 }}>
                  {opt.bullets.map(b => (
                    <li key={b} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'#4a5568', marginBottom:6, lineHeight:1.5 }}>
                      <span style={{ color:'#0D47A1', fontWeight:700, lineHeight:1.5 }}>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #e2e8f0' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>
                      Hours
                    </label>
                    {opt.hoursOptions.map(h => (
                      <label key={h.value} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', fontSize:14, color:'#2d3748', cursor:'pointer' }}>
                        <input
                          type="radio"
                          name="hours"
                          checked={hours === h.value}
                          onChange={() => setHours(h.value)}
                          onClick={e => e.stopPropagation()}
                        />
                        {h.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PRICED CTA */}
        {!showContactSales && (
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:30 }}>
            <button
              onClick={handleSkip}
              style={{ background:'#fff', color:'#4a5568', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 28px', fontSize:14, fontWeight:600, cursor:'pointer' }}
            >
              Skip for now
            </button>
            <button
              onClick={handleInterested}
              disabled={!selected || submitting}
              style={{
                display:'flex', alignItems:'center', gap:8,
                background: (!selected || submitting) ? '#94a3b8' : 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
                color:'#fff', border:'none', borderRadius:10,
                padding:'12px 28px', fontSize:14, fontWeight:700,
                cursor:(!selected || submitting) ? 'not-allowed' : 'pointer',
                boxShadow: (!selected || submitting) ? 'none' : '0 4px 14px rgba(13,71,161,0.25)',
              }}
            >
              {submitting ? 'Sending...' : "I'm interested"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </div>
        )}

        {/* DIVIDER */}
        <div style={{ position:'relative', textAlign:'center', margin:'10px 0 28px' }}>
          <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'#e2e8f0' }} />
          <span style={{ position:'relative', background:'#f0f4f8', padding:'0 16px', fontSize:12, color:'#94a3b8', fontWeight:700, letterSpacing:'0.08em' }}>
            LOOKING FOR SOMETHING ELSE?
          </span>
        </div>

        {/* CONTACT SALES SECTION */}
        <div style={{ background:'#fff', border:'2px solid #e2e8f0', borderRadius:14, padding:28, marginBottom:24 }}>
          <div style={{ textAlign:'center', marginBottom: showContactSales ? 24 : 16 }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#1a202c', marginBottom:6 }}>
              Other VA services
            </h2>
            <p style={{ fontSize:14, color:'#64748b', maxWidth:520, margin:'0 auto', lineHeight:1.55 }}>
              We offer specialists across admin, sales operations, and data work. Tell our sales team what you need and they'll send you a quote within 24 hours.
            </p>
          </div>

          {!showContactSales ? (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <button
                onClick={() => { setShowContactSales(true); setSelected(null); }}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  background:'#fff', color:'#0D47A1',
                  border:'2px solid #0D47A1', borderRadius:10,
                  padding:'11px 24px', fontSize:14, fontWeight:700,
                  cursor:'pointer',
                  transition:'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f4f8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                Contact Sales <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:10 }}>
                Which service?
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:20 }}>
                {CONTACT_SALES_SERVICES.map(s => {
                  const Icon = s.icon;
                  const isSel = contactService === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setContactService(s.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'12px 14px',
                        background: isSel ? '#0D47A1' : '#f8fafc',
                        color: isSel ? '#fff' : '#1a202c',
                        border: isSel ? '2px solid #0D47A1' : '2px solid transparent',
                        borderRadius:10,
                        fontSize:13, fontWeight:600,
                        cursor:'pointer', textAlign:'left',
                        transition:'all 0.15s',
                      }}
                    >
                      <Icon size={16} color={isSel ? '#fff' : '#64748b'} style={{ flexShrink:0 }} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>

              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>
                Tell us a bit more (optional)
              </label>
              <textarea
                value={contactNotes}
                onChange={e => setContactNotes(e.target.value)}
                placeholder="What does the work look like? Hours per week? Tools you use? Anything that helps us send the right quote."
                rows={4}
                style={{
                  width:'100%', boxSizing:'border-box',
                  background:'#fff',
                  border:'1.5px solid #e2e8f0',
                  borderRadius:10,
                  padding:'12px 14px',
                  fontSize:14, color:'#1a202c',
                  fontFamily:'inherit', resize:'vertical',
                  outline:'none',
                }}
              />

              <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:18 }}>
                <button
                  onClick={() => { setShowContactSales(false); setContactService(''); setContactNotes(''); }}
                  style={{ background:'#fff', color:'#4a5568', border:'1px solid #e2e8f0', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:600, cursor:'pointer' }}
                >
                  Back
                </button>
                <button
                  onClick={handleContactSubmit}
                  disabled={!contactService || submitting}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    background: (!contactService || submitting) ? '#94a3b8' : 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
                    color:'#fff', border:'none', borderRadius:10,
                    padding:'11px 22px', fontSize:14, fontWeight:700,
                    cursor:(!contactService || submitting) ? 'not-allowed' : 'pointer',
                    boxShadow: (!contactService || submitting) ? 'none' : '0 4px 14px rgba(13,71,161,0.25)',
                  }}
                >
                  {submitting ? 'Sending...' : 'Send to sales'}
                  {!submitting && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', marginTop:8, fontSize:12, color:'#94a3b8' }}>
          No commitment — we'll reach out with details before anything starts.
        </p>
      </div>
    </div>
  );
}
