import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import api from '../utils/api';

export default function VAUpsellBanner() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    api.get('/va-upsell/status')
      .then(r => setShow(!!r.data?.show))
      .catch(() => {});
  }, []);

  const handleDismiss = async (e) => {
    e?.stopPropagation();
    setDismissing(true);
    try {
      await api.post('/va-upsell/dismiss', {});
    } catch (err) { /* silent */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:16,
      background:'linear-gradient(90deg, #0D47A1 0%, #1565C0 100%)',
      color:'#fff', borderRadius:12, padding:'14px 18px', marginBottom:20,
      boxShadow:'0 2px 10px rgba(13,71,161,0.18)'
    }}>
      <div style={{ width:38, height:38, background:'rgba(255,255,255,0.18)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Sparkles size={20} color="#FCD116" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>
          Want a Filipino VA to run this for you?
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)' }}>
          From $3/hr. Trained VAs who build and monitor your campaigns — or call your leads.
        </div>
      </div>
      <button
        onClick={() => navigate('/welcome-va')}
        style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#fff', color:'#0D47A1', border:'none',
          borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:700, cursor:'pointer',
          flexShrink:0
        }}
      >
        Tell me more <ArrowRight size={14} />
      </button>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        aria-label="Dismiss"
        style={{
          background:'rgba(255,255,255,0.12)', color:'#fff',
          border:'none', borderRadius:8, padding:8,
          cursor:dismissing?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
