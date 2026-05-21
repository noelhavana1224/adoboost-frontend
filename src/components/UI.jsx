import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ── Button ──────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', loading, disabled, style, ...props }) {
  const v = {
    primary:   { background:'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)', color:'#fff', border:'none', boxShadow:'0 2px 10px rgba(37,99,235,0.28)' },
    secondary: { background:'#fff', color:'var(--text2)', border:'1px solid var(--border2)', boxShadow:'var(--shadow)' },
    danger:    { background:'#fef2f2', color:'var(--red)', border:'1px solid #fecaca' },
    ghost:     { background:'transparent', color:'var(--text2)', border:'1px solid transparent' },
    success:   { background:'#f0fdf4', color:'var(--green)', border:'1px solid var(--green-border)' },
    outline:   { background:'transparent', color:'var(--primary)', border:'1px solid var(--primary)' },
    green:     { background:'linear-gradient(135deg,#16a34a 0%,#15803d 100%)', color:'#fff', border:'none', boxShadow:'0 2px 10px rgba(22,163,74,0.28)' },
  };
  const s = {
    sm: { padding:'5px 12px', fontSize:12, borderRadius:7, gap:4 },
    md: { padding:'8px 18px', fontSize:13.5, borderRadius:9, gap:6 },
    lg: { padding:'11px 24px', fontSize:15, borderRadius:10, gap:7 },
  };
  return (
    <button disabled={disabled || loading} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontWeight:600, cursor:disabled || loading ? 'not-allowed' : 'pointer',
      opacity:disabled ? 0.55 : 1, transition:'all 0.18s ease', fontFamily:'inherit',
      letterSpacing:'-0.01em',
      ...v[variant], ...s[size], ...style,
    }} {...props}>
      {loading && <Loader2 size={13} style={{ animation:'spin 1s linear infinite', flexShrink:0 }} />}
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────
export function Card({ children, style, ...props }) {
  return (
    <div style={{
      background:'var(--bg2)', border:'1px solid var(--border)',
      borderRadius:'var(--radius)',
      boxShadow:'0 1px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────
export function Input({ label, error, style, containerStyle, hint, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...containerStyle }}>
      {label && (
        <label style={{ fontSize:11.5, fontWeight:600, color:'var(--text2)', letterSpacing:'0.04em', textTransform:'uppercase' }}>
          {label}
        </label>
      )}
      <input
        style={{
          background:'var(--bg3)', border:`1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius:'var(--radius-sm)', color:'var(--text)',
          padding:'9px 13px', fontSize:14, outline:'none', width:'100%',
          transition:'all 0.18s',
          ...style,
        }}
        onFocus={e => {
          e.target.style.borderColor = error ? 'var(--red)' : 'var(--primary)';
          e.target.style.background = 'var(--bg2)';
          e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.09)';
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)';
          e.target.style.background = 'var(--bg3)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {hint && !error && <span style={{ fontSize:11, color:'var(--text3)' }}>{hint}</span>}
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────
export function Select({ label, error, children, style, containerStyle, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...containerStyle }}>
      {label && (
        <label style={{ fontSize:11.5, fontWeight:600, color:'var(--text2)', letterSpacing:'0.04em', textTransform:'uppercase' }}>
          {label}
        </label>
      )}
      <select style={{
        background:'var(--bg3)', border:`1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius:'var(--radius-sm)', color:'var(--text)',
        padding:'9px 13px', fontSize:14, outline:'none', cursor:'pointer',
        ...style,
      }} {...props}>
        {children}
      </select>
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────
export function Textarea({ label, error, style, containerStyle, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...containerStyle }}>
      {label && (
        <label style={{ fontSize:11.5, fontWeight:600, color:'var(--text2)', letterSpacing:'0.04em', textTransform:'uppercase' }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          background:'var(--bg3)', border:`1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius:'var(--radius-sm)', color:'var(--text)',
          padding:'9px 13px', fontSize:14, outline:'none', resize:'vertical', minHeight:100,
          transition:'all 0.18s',
          ...style,
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.background = 'var(--bg2)';
          e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.09)';
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)';
          e.target.style.background = 'var(--bg3)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────
export function Badge({ children, color = 'default', style }) {
  const c = {
    default: { bg:'#f1f5f9', text:'#64748b', border:'#e2e8f0' },
    green:   { bg:'#f0fdf4', text:'#15803d', border:'#86efac' },
    red:     { bg:'#fef2f2', text:'#dc2626', border:'#fecaca' },
    yellow:  { bg:'#fefce8', text:'#a16207', border:'#fde047' },
    blue:    { bg:'#eff6ff', text:'#1d4ed8', border:'#93c5fd' },
    purple:  { bg:'#faf5ff', text:'#7c3aed', border:'#c4b5fd' },
    orange:  { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
    cyan:    { bg:'#ecfeff', text:'#0e7490', border:'#67e8f9' },
  }[color] || { bg:'#f1f5f9', text:'#64748b', border:'#e2e8f0' };
  return (
    <span style={{
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      padding:'2px 9px', borderRadius:100, fontSize:11, fontWeight:600,
      display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
      letterSpacing:'0.02em',
      ...style,
    }}>
      {children}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = 'blue', style }) {
  const g = {
    blue:   { a:'#2563eb', b:'#3b82f6', glow:'rgba(37,99,235,0.18)' },
    green:  { a:'#16a34a', b:'#22c55e', glow:'rgba(22,163,74,0.18)' },
    yellow: { a:'#ca8a04', b:'#eab308', glow:'rgba(202,138,4,0.18)' },
    red:    { a:'#dc2626', b:'#ef4444', glow:'rgba(220,38,38,0.18)' },
    purple: { a:'#7c3aed', b:'#8b5cf6', glow:'rgba(124,58,237,0.18)' },
    cyan:   { a:'#0891b2', b:'#06b6d4', glow:'rgba(8,145,178,0.18)' },
    orange: { a:'#ea580c', b:'#f97316', glow:'rgba(234,88,12,0.18)' },
  }[color] || { a:'#2563eb', b:'#3b82f6', glow:'rgba(37,99,235,0.18)' };
  return (
    <Card style={{ padding:'18px 20px', ...style }}>
      <div style={{ marginBottom:14 }}>
        <div style={{
          width:44, height:44,
          background:`linear-gradient(135deg,${g.a} 0%,${g.b} 100%)`,
          borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 4px 14px ${g.glow}`,
        }}>
          <Icon size={20} color="#fff" />
        </div>
      </div>
      <div style={{ fontSize:27, fontWeight:800, color:'var(--text)', letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12.5, color:'var(--text2)', marginTop:5, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:3 }}>{sub}</div>}
    </Card>
  );
}

// ── Page Header ───────────────────────────────────
export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
      <div>
        {back && (
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>
            {back}
          </div>
        )}
        <h1 style={{ fontSize:21, fontWeight:800, marginBottom:3, letterSpacing:'-0.04em', color:'var(--text)' }}>{title}</h1>
        {subtitle && <p style={{ color:'var(--text3)', fontSize:13, lineHeight:1.55 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ display:'flex', gap:8, flexShrink:0, marginTop:2 }}>{action}</div>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────
export function Spinner({ size = 30 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:64, gap:14 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        border:'3px solid var(--border2)',
        borderTopColor:'var(--primary)',
        animation:'spin 0.75s linear infinite',
      }} />
      <span style={{ fontSize:12, color:'var(--text3)', fontWeight:500 }}>Loading...</span>
    </div>
  );
}

// ── Empty State ───────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign:'center', padding:'64px 20px', animation:'fadeIn 0.3s ease' }}>
      <div style={{
        width:64, height:64,
        background:'var(--bg3)', border:'1px solid var(--border)',
        borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 18px', boxShadow:'var(--shadow)',
      }}>
        <Icon size={26} color="var(--text3)" />
      </div>
      <h3 style={{ fontSize:16, fontWeight:700, marginBottom:7, color:'var(--text)', letterSpacing:'-0.02em' }}>{title}</h3>
      <p style={{ color:'var(--text3)', fontSize:13, maxWidth:320, margin:'0 auto', lineHeight:1.65 }}>{description}</p>
      {action && <div style={{ marginTop:22 }}>{action}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,0.65)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:20, backdropFilter:'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background:'var(--bg2)', borderRadius:16,
        width:'100%', maxWidth:width, maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
        animation:'slideUp 0.22s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'var(--bg3)', borderRadius:'16px 16px 0 0',
        }}>
          <h3 style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.03em' }}>{title}</h3>
          <button onClick={onClose} style={{
            background:'var(--border2)', border:'none', color:'var(--text2)',
            cursor:'pointer', width:26, height:26, borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:17, lineHeight:1, transition:'background 0.15s',
          }}>×</button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────
export function Table({ headers, children, style }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', ...style }}>
        <thead>
          <tr style={{ background:'var(--bg3)', borderBottom:'1px solid var(--border)' }}>
            {headers.map(h => (
              <th key={h} style={{
                padding:'10px 16px', textAlign:'left',
                fontSize:11, fontWeight:700, color:'var(--text2)',
                textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick, style }) {
  return (
    <tr
      onClick={onClick}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
      style={{
        borderBottom:'1px solid var(--border)',
        transition:'background 0.12s',
        cursor:onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </tr>
  );
}

export function TD({ children, style }) {
  return <td style={{ padding:'11px 16px', fontSize:13, ...style }}>{children}</td>;
}

// ── Alert ─────────────────────────────────────────
export function Alert({ type = 'info', title, children }) {
  const styles = {
    info:    { bg:'#eff6ff', border:'#bfdbfe', icon:Info,        color:'#1d4ed8', bar:'#3b82f6' },
    success: { bg:'#f0fdf4', border:'#bbf7d0', icon:CheckCircle, color:'#15803d', bar:'#22c55e' },
    error:   { bg:'#fef2f2', border:'#fecaca', icon:AlertCircle, color:'#dc2626', bar:'#ef4444' },
    warning: { bg:'#fefce8', border:'#fef08a', icon:AlertCircle, color:'#a16207', bar:'#eab308' },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{
      background:s.bg, border:`1px solid ${s.border}`,
      borderLeft:`3px solid ${s.bar}`,
      borderRadius:'var(--radius)', padding:'13px 16px',
      display:'flex', gap:10,
    }}>
      <s.icon size={17} color={s.color} style={{ flexShrink:0, marginTop:1 }} />
      <div>
        {title && <div style={{ fontSize:13, fontWeight:700, color:s.color, marginBottom:3 }}>{title}</div>}
        <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.55 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)} style={{
          padding:'10px 18px', background:'none', border:'none',
          borderBottom:`2px solid ${active === tab.key ? 'var(--primary)' : 'transparent'}`,
          marginBottom:-1,
          color:active === tab.key ? 'var(--primary)' : 'var(--text2)',
          fontWeight:active === tab.key ? 700 : 400, fontSize:13.5,
          cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
          display:'flex', alignItems:'center', gap:7, letterSpacing:'-0.01em',
        }}>
          {tab.icon && <tab.icon size={15} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────
export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end', padding:'14px 0' }}>
      <Btn size="sm" variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</Btn>
      <span style={{ fontSize:12, color:'var(--text3)', padding:'0 10px', fontWeight:500 }}>
        {page} / {pages}
      </span>
      <Btn size="sm" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</Btn>
    </div>
  );
}
