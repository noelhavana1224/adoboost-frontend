import React, { useState, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calculator, Mail, Globe, Flame, DollarSign, Sparkles, ArrowRight, X, Check, Server, Minus, Plus } from 'lucide-react';

// ── Your pricing ──────────────────────────────────────────────
const PRICES = {
  google:    { label: 'Google Workspace', mailbox: 6.5 },
  microsoft: { label: 'Microsoft 365',    mailbox: 4.0 },
};
const DOMAIN_PRICE = 16; // per domain / year

const money = n => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function NumInput({ label, value, onChange, suffix }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type="number" min={1} value={value} onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 9, padding: '11px 13px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8fafc' }} />
        {suffix && <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function PricingCalculator() {
  const [volume, setVolume]   = useState(3000);
  const [provider, setProvider] = useState('google');
  const [perMailbox, setPerMailbox] = useState(30);
  const [warmupPer, setWarmupPer]   = useState(30);
  const [perDomain, setPerDomain]   = useState(3);
  const [showOrder, setShowOrder]   = useState(false);

  const calc = useMemo(() => {
    const mailboxes = perMailbox > 0 ? Math.ceil(volume / perMailbox) : 0;
    const domains   = perDomain > 0 ? Math.ceil(mailboxes / perDomain) : 0;
    const warmup    = mailboxes * warmupPer;
    const mp = PRICES[provider].mailbox;
    const firstMonth = domains * DOMAIN_PRICE + mailboxes * mp;
    const monthly    = mailboxes * mp + (domains * DOMAIN_PRICE) / 12;
    const annual     = mailboxes * mp * 12 + domains * DOMAIN_PRICE;
    return { mailboxes, domains, warmup, mp, firstMonth, monthly, annual };
  }, [volume, provider, perMailbox, warmupPer, perDomain]);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Calculator size={24} color="#2563eb" /> Cold Email Infrastructure Calculator
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>
          Find exactly how many mailboxes and domains you need for your volume — and what it costs, done-for-you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>
        {/* ── Configuration ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} color="#64748b" /> Configuration
          </div>
          <NumInput label="Target Volume of Cold Emails Per Day" value={volume} onChange={setVolume} suffix="emails/day" />

          {/* Provider */}
          <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Email Provider</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {Object.entries(PRICES).map(([k, v]) => (
              <button key={k} onClick={() => setProvider(k)}
                style={{ padding: '12px', borderRadius: 10, border: `1.5px solid ${provider === k ? '#2563eb' : '#e2e8f0'}`, background: provider === k ? '#eff6ff' : '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: provider === k ? '#2563eb' : '#334155' }}>{v.label}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{money(v.mailbox)}/mailbox/mo</div>
              </button>
            ))}
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Infrastructure Settings</div>
            <NumInput label="Outreach emails per mailbox per day" value={perMailbox} onChange={setPerMailbox} />
            <NumInput label="Warm-up emails per mailbox per day" value={warmupPer} onChange={setWarmupPer} />
            <div style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Mailboxes per domain</label>
              <input type="number" min={1} value={perDomain} onChange={e => setPerDomain(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 9, padding: '11px 13px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }} />
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Requirements */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} color="#64748b" /> Infrastructure Requirements
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Mail size={13} /> Mailboxes Needed</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>{calc.mailboxes}</div>
              </div>
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12.5, color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Globe size={13} /> Domains Needed</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#7c3aed', letterSpacing: '-1.5px', lineHeight: 1 }}>{calc.domains}</div>
              </div>
            </div>
            <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12.5, color: '#0891b2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Flame size={13} /> Total Warm-up Sends Per Day</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0891b2', letterSpacing: '-1px', lineHeight: 1 }}>{calc.warmup.toLocaleString()} <span style={{ fontSize: 14 }}>emails</span></div>
            </div>
          </div>

          {/* Costs */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} color="#16a34a" /> Estimated Costs
            </div>
            {/* First month */}
            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>First Month Cost</div>
              <Row l={`Domains (${calc.domains} × $${DOMAIN_PRICE}/year)`} v={money(calc.domains * DOMAIN_PRICE)} />
              <Row l={`Mailboxes (${calc.mailboxes} × ${money(calc.mp)})`} v={money(calc.mailboxes * calc.mp)} />
              <Row l="Total First Month" v={money(calc.firstMonth)} bold color="#7c3aed" />
            </div>
            {/* Monthly */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>Ongoing Monthly Cost</div>
              <Row l={`Mailboxes (${calc.mailboxes} × ${money(calc.mp)})`} v={money(calc.mailboxes * calc.mp)} />
              <Row l="Domains (annual ÷ 12)" v={money((calc.domains * DOMAIN_PRICE) / 12)} />
              <Row l="Total Monthly" v={money(calc.monthly)} bold color="#16a34a" />
            </div>
            {/* Annual */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Annual Cost</div>
              <Row l={`Mailboxes (${calc.mailboxes} × ${money(calc.mp)} × 12)`} v={money(calc.mailboxes * calc.mp * 12)} />
              <Row l={`Domains (${calc.domains} × $${DOMAIN_PRICE})`} v={money(calc.domains * DOMAIN_PRICE)} />
              <Row l="Total Annual" v={money(calc.annual)} bold color="#0f172a" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary / CTA ── */}
      <div style={{ marginTop: 22, background: 'linear-gradient(135deg,#eff6ff,#ecfeff)', border: '1px solid #bae6fd', borderRadius: 16, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Infrastructure Summary</div>
          <div style={{ fontSize: 13.5, color: '#475569', marginBottom: 8 }}>To send <b>{volume.toLocaleString()} cold emails/day</b>, you'll need:</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#334155' }}>
            <li>• <b>{calc.mailboxes} mailboxes</b> across <b>{calc.domains} domains</b></li>
            <li>• <b>{calc.warmup.toLocaleString()} warm-up emails</b> sent daily to keep reputation high</li>
            <li>• First month <b>{money(calc.firstMonth)}</b> (includes domain registration)</li>
            <li>• Ongoing <b>{money(calc.monthly)}/month</b> · set up in 24–48 hours</li>
          </ul>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>Get started today for</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>{money(calc.firstMonth)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>then {money(calc.monthly)}/month</div>
          <button onClick={() => setShowOrder(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1e293b,#0f172a)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(15,23,42,0.3)' }}>
            <Sparkles size={15} /> Order Now <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {showOrder && <OrderModal calc={calc} provider={provider} volume={volume} warmupPer={warmupPer} onClose={() => setShowOrder(false)} />}
    </div>
  );
}

function Row({ l, v, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: bold ? '8px 0 0' : '3px 0', marginTop: bold ? 6 : 0, borderTop: bold ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
      <span style={{ fontSize: bold ? 14 : 12.5, fontWeight: bold ? 700 : 400, color: bold ? (color || '#0f172a') : '#64748b' }}>{l}</span>
      <span style={{ fontSize: bold ? 17 : 13, fontWeight: bold ? 800 : 600, color: bold ? (color || '#0f172a') : '#334155' }}>{v}</span>
    </div>
  );
}

// ── Order modal (done-for-you) ──────────────────────────────────
function OrderModal({ calc, provider, volume, warmupPer, onClose }) {
  const [prov, setProv]       = useState(provider);
  const [mailboxes, setMailboxes] = useState(calc.mailboxes);
  const [domains, setDomains]     = useState(calc.domains);
  const [ownDomain, setOwnDomain] = useState(false);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mp = PRICES[prov].mailbox;
  const effDomains = ownDomain ? 0 : domains;
  const firstMonth = effDomains * DOMAIN_PRICE + mailboxes * mp;
  const monthly    = mailboxes * mp + (effDomains * DOMAIN_PRICE) / 12;

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/infra-orders', {
        provider: prov, target_volume: volume, mailboxes, domains: effDomains, warmup_per_day: mailboxes * warmupPer,
        mailbox_price: mp, domain_price: DOMAIN_PRICE,
        first_month_cost: +firstMonth.toFixed(2), monthly_cost: +monthly.toFixed(2), annual_cost: +(mailboxes * mp * 12 + effDomains * DOMAIN_PRICE).toFixed(2),
        own_domain: ownDomain, notes,
      });
      toast.success('🎉 Order placed! Our team will set up your infrastructure within 24–48 hours.');
      onClose();
    } catch { toast.error('Failed to place order'); }
    finally { setSubmitting(false); }
  };

  const Counter = ({ label, value, set, price }) => (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 11, padding: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => set(Math.max(0, value - 1))} style={ctrBtn}><Minus size={14} /></button>
        <span style={{ fontSize: 20, fontWeight: 800, minWidth: 36, textAlign: 'center' }}>{value}</span>
        <button onClick={() => set(value + 1)} style={ctrBtn}><Plus size={14} /></button>
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{price}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(640px,94vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 16, zIndex: 1001, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={17} color="#7c3aed" /> Done-for-you Email Infrastructure</div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
            Legitimate official accounts with admin-panel access for each domain. Free automated setup, optimized for inbox placement — delivered within 24 hours.
          </p>

          {/* Provider */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {Object.entries(PRICES).map(([k, v]) => (
              <button key={k} onClick={() => setProv(k)} style={{ padding: '14px', borderRadius: 11, border: `1.5px solid ${prov === k ? '#2563eb' : '#e2e8f0'}`, background: prov === k ? '#eff6ff' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: prov === k ? '#2563eb' : '#334155' }}>
                {v.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Counter label="Mailboxes" value={mailboxes} set={setMailboxes} price={`${money(mp)}/mailbox/mo`} />
            <Counter label="Domains" value={domains} set={setDomains} price={`$${DOMAIN_PRICE}/domain/year`} />
          </div>

          {/* Own domain */}
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 11, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={ownDomain} onChange={e => setOwnDomain(e.target.checked)} style={{ marginTop: 2, accentColor: '#2563eb' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Already own your domain(s)?</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>We'll connect them and just set up mailboxes — no domain registration fee.</div>
            </div>
          </label>

          {/* Benefits */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 16 }}>
            {['Send 30–35 per account daily', 'Automatic SPF, DKIM & DMARC', 'Optimized for inbox placement', 'Best-practice DNS setup', 'Delivered within 24 hours', 'Admin-panel access included'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><Check size={13} color="#16a34a" /> {b}</div>
            ))}
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any preferences? (preferred domain names, niche, region…)"
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 13px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 56, resize: 'vertical', marginBottom: 16 }} />

          {/* Totals */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 11, padding: 14, marginBottom: 16 }}>
            <Row l={`${mailboxes} mailboxes × ${money(mp)}`} v={`${money(mailboxes * mp)}/mo`} />
            {!ownDomain && <Row l={`${domains} domains × $${DOMAIN_PRICE}`} v={`${money(domains * DOMAIN_PRICE)}/yr`} />}
            <Row l="Due today (first month)" v={money(firstMonth)} bold color="#0f172a" />
          </div>

          <button onClick={submit} disabled={submitting || mailboxes < 1}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#1e293b,#0f172a)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? 'Placing order…' : <>Get Started — {money(firstMonth)} today <ArrowRight size={15} /></>}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', marginTop: 10 }}>Setup within 24–48 hours · our team handles everything</div>
        </div>
      </div>
    </>
  );
}
const ctrBtn = { width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' };
