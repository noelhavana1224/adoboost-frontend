import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ── Button ──────────────────────────────────────
export function Btn({ children, variant='primary', size='md', loading, disabled, style, ...props }) {
  const v = {
    primary:   { background:'var(--primary)', color:'#fff', border:'1px solid var(--primary)' },
    secondary: { background:'#fff', color:'var(--text2)', border:'1px solid var(--border2)' },
    danger:    { background:'var(--red-dim)', color:'var(--red)', border:'1px solid var(--red-border)' },
    ghost:     { background:'transparent', color:'var(--text2)', border:'1px solid transparent' },
    success:   { background:'var(--green-dim)', color:'var(--green)', border:'1px solid var(--green-border)' },
    outline:   { background:'transparent', color:'var(--primary)', border:'1px solid var(--primary)' },
    green:     { background:'var(--green)', color:'#fff', border:'1px solid var(--green)' },
  };
  const s = {
    sm: { padding:'5px 12px', fontSize:12, borderRadius:6, gap:4 },
    md: { padding:'8px 16px', fontSize:14, borderRadius:8, gap:6 },
    lg: { padding:'11px 22px', fontSize:15, borderRadius:10, gap:7 },
  };
  return (
    <button disabled={disabled||loading} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontWeight:500, cursor: disabled||loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition:'all 0.15s', fontFamily:'inherit',
      ...v[variant], ...s[size], ...style,
    }} {...props}>
      {loading && <Loader2 size={13} style={{ animation:'spin 1s linear infinite', flexShrink:0 }} />}
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────
export function Card({ children, style, ...props }) {
  return <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)', ...style }} {...props}>{children}</div>;
}

// ── Input ─────────────────────────────────────────
export function Input({ label, error, style, containerStyle, hint, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, ...containerStyle }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>{label}</label>}
      <input style={{
        background:'var(--bg2)', border:`1px solid ${error?'var(--red)':'var(--border2)'}`,
        borderRadius:'var(--radius-sm)', color:'var(--text)',
        padding:'9px 12px', fontSize:14, outline:'none', width:'100%',
        transition:'border-color 0.15s', ...style,
      }}
        onFocus={e => e.target.style.borderColor = error?'var(--red)':'var(--primary)'}
        onBlur={e => e.target.style.borderColor = error?'var(--red)':'var(--border2)'}
        {...props} />
      {hint && !error && <span style={{ fontSize:11, color:'var(--text3)' }}>{hint}</span>}
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────
export function Select({ label, error, children, style, containerStyle, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, ...containerStyle }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>{label}</label>}
      <select style={{
        background:'var(--bg2)', border:`1px solid ${error?'var(--red)':'var(--border2)'}`,
        borderRadius:'var(--radius-sm)', color:'var(--text)',
        padding:'9px 12px', fontSize:14, outline:'none', ...style,
      }} {...props}>{children}</select>
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────
export function Textarea({ label, error, style, containerStyle, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, ...containerStyle }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>{label}</label>}
      <textarea style={{
        background:'var(--bg2)', border:`1px solid ${error?'var(--red)':'var(--border2)'}`,
        borderRadius:'var(--radius-sm)', color:'var(--text)',
        padding:'9px 12px', fontSize:14, outline:'none', resize:'vertical', minHeight:100, ...style,
      }}
        onFocus={e => e.target.style.borderColor='var(--primary)'}
        onBlur={e => e.target.style.borderColor=error?'var(--red)':'var(--border2)'}
        {...props} />
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────
export function Badge({ children, color='default', style }) {
  const c = {
    default: { bg:'#edf2f7', text:'#718096' },
    green:   { bg:'#f0fff4', text:'#276749' },
    red:     { bg:'#fff5f5', text:'#c53030' },
    yellow:  { bg:'#fffff0', text:'#975a16' },
    blue:    { bg:'#ebf8ff', text:'#2b6cb0' },
    purple:  { bg:'#faf5ff', text:'#553c9a' },
    orange:  { bg:'#fffaf0', text:'#c05621' },
    cyan:    { bg:'#e6fffa', text:'#234e52' },
  }[color] || { bg:'#edf2f7', text:'#718096' };
  return (
    <span style={{ background:c.bg, color:c.text, padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:600, display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap', ...style }}>
      {children}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color='blue', bg, style }) {
  const colors = { blue:'#1565C0', green:'#38a169', yellow:'#d69e2e', red:'#e53e3e', purple:'#6b46c1', cyan:'#00897B' };
  const bgs = { blue:'#ebf8ff', green:'#f0fff4', yellow:'#fffff0', red:'#fff5f5', purple:'#faf5ff', cyan:'#e6fffa' };
  const c = colors[color]||colors.blue;
  const b = bgs[color]||bgs.blue;
  return (
    <Card style={{ padding:20, ...style }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:13, color:'var(--text2)', fontWeight:500 }}>{label}</span>
        <div style={{ width:40, height:40, background:b, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={18} color={c} />
        </div>
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:5 }}>{sub}</div>}
    </Card>
  );
}

// ── Page Header ───────────────────────────────────
export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
      <div>
        {back && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>{back}</div>}
        <h1 style={{ fontSize:20, fontWeight:700, marginBottom:2 }}>{title}</h1>
        {subtitle && <p style={{ color:'var(--text3)', fontSize:13 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ display:'flex', gap:8 }}>{action}</div>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────
export function Spinner({ size=24 }) {
  return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:48 }}>
    <Loader2 size={size} color="var(--primary)" style={{ animation:'spin 1s linear infinite' }} />
  </div>;
}

// ── Empty State ───────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', animation:'fadeIn 0.3s ease' }}>
      <div style={{ width:60, height:60, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <Icon size={26} color="var(--text3)" />
      </div>
      <h3 style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{title}</h3>
      <p style={{ color:'var(--text3)', fontSize:13, marginBottom: action ? 20 : 0, maxWidth:360, margin:'0 auto', lineHeight:1.6 }}>{description}</p>
      {action && <div style={{ marginTop:20 }}>{action}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────
export function Modal({ open, onClose, title, children, width=520 }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(2px)' }}
      onClick={onClose}>
      <div style={{ background:'var(--bg2)', borderRadius:14, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)', animation:'fadeIn 0.2s ease' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:16, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:22, lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
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
          <tr style={{ background:'var(--bg3)', borderBottom:'2px solid var(--border)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick, style }) {
  return <tr onClick={onClick} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.1s', cursor:onClick?'pointer':'default', ':hover':{ background:'var(--bg3)' }, ...style }}>{children}</tr>;
}

export function TD({ children, style }) {
  return <td style={{ padding:'11px 14px', fontSize:13, ...style }}>{children}</td>;
}

// ── Alert ─────────────────────────────────────────
export function Alert({ type='info', title, children }) {
  const styles = {
    info:    { bg:'#ebf8ff', border:'#bee3f8', icon: Info,         color:'#2b6cb0' },
    success: { bg:'#f0fff4', border:'#9ae6b4', icon: CheckCircle,  color:'#276749' },
    error:   { bg:'#fff5f5', border:'#feb2b2', icon: AlertCircle,  color:'#c53030' },
    warning: { bg:'#fffff0', border:'#faf089', icon: AlertCircle,  color:'#975a16' },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', gap:10 }}>
      <s.icon size={18} color={s.color} style={{ flexShrink:0, marginTop:1 }} />
      <div>
        {title && <div style={{ fontSize:13, fontWeight:600, color:s.color, marginBottom:3 }}>{title}</div>}
        <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border)', marginBottom:24 }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)} style={{
          padding:'10px 18px', background:'none', border:'none', borderBottom:`2px solid ${active===tab.key?'var(--primary)':'transparent'}`,
          marginBottom:-2, color:active===tab.key?'var(--primary)':'var(--text2)',
          fontWeight:active===tab.key?600:400, fontSize:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', display:'flex', alignItems:'center', gap:7,
        }}>{tab.icon && <tab.icon size={15} />}{tab.label}</button>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────
export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total/limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end', padding:'12px 0' }}>
      <Btn size="sm" variant="secondary" disabled={page===1} onClick={() => onChange(page-1)}>Previous</Btn>
      <span style={{ fontSize:12, color:'var(--text2)', padding:'0 8px' }}>Page {page} of {pages}</span>
      <Btn size="sm" variant="secondary" disabled={page>=pages} onClick={() => onChange(page+1)}>Next</Btn>
    </div>
  );
}
