import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SupportEntry() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const userId = params.get('userId');
    const name = params.get('name');
    const email = params.get('email');
    const expiresIn = parseInt(params.get('expiresIn') || '1800', 10);

    if (!token || !userId) {
      toast.error('Invalid support session');
      navigate('/login');
      return;
    }

    localStorage.setItem('ab_support_token', token);
    localStorage.setItem('ab_support', JSON.stringify({
      target: { id: userId, name, email },
      expiresAt: Date.now() + expiresIn * 1000,
    }));

    // Tiny delay so localStorage commits, then go to dashboard
    setTimeout(() => navigate('/dashboard', { replace: true }), 50);
  }, []); // eslint-disable-line

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system, sans-serif', color:'#64748b' }}>
      Starting support session…
    </div>
  );
}
