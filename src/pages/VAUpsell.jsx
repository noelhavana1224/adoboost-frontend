import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Phone, Megaphone, ArrowRight, X } from 'lucide-react';


const VA_OPTIONS = [
  {
    id: 'caller',
    icon: Phone,
    title: 'Caller VA',
    rate: '$7/hr',
    desc: 'Trained agents who call your leads, qualify them, and book meetings.',
    hoursOptions: [
      { value: 'half-time', label: 'Half-time (20 hrs/week)' },
      { value: 'full-time', label: 'Full-time (40 hrs/week)' },
    ],
  },
  {
    id: 'campaign_manager',
    icon: Megaphone,
    title: 'Campaign Manager VA',
    rate: '$3/hr',
    desc: 'A dedicated VA who builds, sends, and monitors your cold email campaigns for you.',
    hoursOptions: [
      { value: 'part-time', label: 'Part-time (20 hrs/week)' },
    ],
  },
];

export default function VAUpsell() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [hours, setHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInterested = async () => {
    if (!selected) return toast.error('Pick a VA option first');
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

  const handleSkip = async () => {
    try {
     await api.post('/va-upsell/dismiss', {});
    } catch (e) { /* silent */ }
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', padding:'40px 20px', position:'relative' }}>
      <button onClick={handleSkip} style={{ position:'absolute', top:20, right:20, background:'transparent', border:'none', display:'flex', alignItems:'center', gap:6, color:'#718096', fontSize:13, cursor:'pointer' }}>
        Skip for now <X size={14} />
      </button>

      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h1 style={{ fontSize:32, fontWeight:800, color:'#1a202c', marginBottom:10 }}>
            Need a hand running your outreach?
          </h1>
          <p style={{ fontSize:16, color:'#718096', maxWidth:600, margin:'0 auto' }}>
            AdoBoost gives you the tools — our Filipino VAs give you the time back. Trained, vetted, and ready to plug into your workflow.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
          {VA_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => { setSelected(opt.id); setHours(opt.hoursOptions[0].value); }}
                style={{
                  background:'#fff',
                  border: isSelected ? '2px solid #1565C0' : '2px solid #e2e8f0',
                  borderRadius:14,
                  padding:24,
                  cursor:'pointer',
                  transition:'all 0.15s',
                  boxShadow: isSelected ? '0 4px 14px rgba(21,101,192,0.15)' : 'none',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:44, height:44, background: isSelected ? '#1565C0' : '#edf2f7', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={22} color={isSelected ? '#fff' : '#4a5568'} />
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#1a202c' }}>{opt.title}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:'#1565C0' }}>{opt.rate}</div>
                  </div>
                </div>
                <p style={{ fontSize:14, color:'#4a5568', lineHeight:1.6, marginBottom:14 }}>{opt.desc}</p>

                {isSelected && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #e2e8f0' }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>
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

        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
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
              background: (!selected || submitting) ? '#90cdf4' : '#1565C0',
              color:'#fff', border:'none', borderRadius:10,
              padding:'12px 28px', fontSize:14, fontWeight:700,
              cursor:(!selected || submitting) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Sending...' : "I'm interested"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </div>

        <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'#a0aec0' }}>
          No commitment — we'll reach out with details before anything starts.
        </p>
      </div>
    </div>
  );
}
