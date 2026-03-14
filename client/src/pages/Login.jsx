import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* ── Feature data ───────────────────────────────────── */
const FEATURES = [
  { icon: 'log',    label: 'Trade Logging',    desc: 'Symbol, setup, session, grade & emotion' },
  { icon: 'curve',  label: 'Equity Curve',      desc: 'Track P&L and max drawdown over time' },
  { icon: 'photo',  label: 'Chart Screenshots', desc: 'Attach & review images for every trade' },
  { icon: 'cal',    label: 'Trading Calendar',  desc: 'Daily wins and losses across each month' },
  { icon: 'streak', label: 'Streak Tracker',    desc: 'Live consecutive win/loss counter' },
  { icon: 'target', label: 'Setup Analytics',   desc: 'Win rate and P&L broken down by setup' },
];

/* ── 3D Candlestick Animation ───────────────────────── */
function CandleAnimation() {
  const canvasRef = useRef();
  const wrapRef   = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const W = wrap.clientWidth || 600;
    const H = 230;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    const CW = 17, GAP = 9, STEP = CW + GAP;
    const N  = Math.floor((W - 60) / STEP);
    const PL = 20, PT = 22, PB = 22;
    const CH = H - PT - PB;
    const DEPTH = 5;

    let price = 100;
    const makeCandle = () => {
      price = Math.max(60, Math.min(140, price + (Math.random() - 0.46) * 7));
      const o = price, d = (Math.random() - 0.5) * 5, c = o + d;
      return { o, c, h: Math.max(o, c) + Math.random() * 4 + 0.5, l: Math.min(o, c) - Math.random() * 4 - 0.5 };
    };

    const candles = Array.from({ length: N }, makeCandle);
    const allPx = candles.flatMap(c => [c.h, c.l]);
    const minP = Math.min(...allPx) - 3, maxP = Math.max(...allPx) + 3;
    const range = maxP - minP || 1;
    const py = p => PT + CH - ((p - minP) / range) * CH;

    let t = 0, reveal = 0, raf;

    const draw = () => {
      ctx.fillStyle = 'rgba(4, 4, 14, 0.88)';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = PT + (CH / 4) * i;
        ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PL, y); ctx.stroke();
      }
      // Vertical grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      for (let i = 0; i <= 8; i++) {
        const x = PL + ((W - PL * 2) / 8) * i;
        ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + CH); ctx.stroke();
      }

      candles.forEach((c, i) => {
        const x = PL + i * STEP;
        const alpha = Math.min(1, (reveal - i) * 2.5);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;

        const isLive = i === candles.length - 1;
        const liveOff = isLive ? Math.sin(t * 1.8) * 2.5 : 0;
        const liveC   = c.c + liveOff;
        const bull    = liveC >= c.o;
        const main    = bull ? '#05d890' : '#ff3d5a';
        const side    = bull ? '#016e40' : '#961020';
        const top     = bull ? '#09ffbe' : '#ff7080';

        const bTop = py(Math.max(c.o, liveC));
        const bBot = py(Math.min(c.o, liveC));
        const bH   = Math.max(bBot - bTop, 1.5);
        const wTop = py(isLive ? Math.max(c.h, liveC + 0.5) : c.h);
        const wBot = py(c.l);

        // Right face
        ctx.fillStyle = side;
        ctx.beginPath();
        ctx.moveTo(x + CW, bTop); ctx.lineTo(x + CW + DEPTH, bTop - DEPTH * 0.55);
        ctx.lineTo(x + CW + DEPTH, bBot - DEPTH * 0.55); ctx.lineTo(x + CW, bBot);
        ctx.closePath(); ctx.fill();

        // Top face
        ctx.fillStyle = top;
        ctx.beginPath();
        ctx.moveTo(x, bTop); ctx.lineTo(x + DEPTH, bTop - DEPTH * 0.55);
        ctx.lineTo(x + CW + DEPTH, bTop - DEPTH * 0.55); ctx.lineTo(x + CW, bTop);
        ctx.closePath(); ctx.fill();

        // Front face
        if (isLive) { ctx.shadowBlur = 18; ctx.shadowColor = main; }
        ctx.fillStyle = main;
        ctx.fillRect(x, bTop, CW, bH);
        ctx.shadowBlur = 0;

        // Wicks
        ctx.strokeStyle = main + 'aa'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + CW/2, wTop); ctx.lineTo(x + CW/2, bTop); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + CW/2, bBot); ctx.lineTo(x + CW/2, wBot); ctx.stroke();

        // Live cursor blink
        if (isLive && (Math.floor(t * 3) % 2 === 0)) {
          ctx.fillStyle = main;
          ctx.shadowBlur = 8; ctx.shadowColor = main;
          ctx.fillRect(x + CW/2 - 2, wTop - 7, 4, 3);
          ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;

      // Edge fades
      const fl = ctx.createLinearGradient(0, 0, 50, 0);
      fl.addColorStop(0, 'rgba(4,4,14,1)'); fl.addColorStop(1, 'rgba(4,4,14,0)');
      ctx.fillStyle = fl; ctx.fillRect(0, 0, 50, H);
      const fr = ctx.createLinearGradient(W-50, 0, W, 0);
      fr.addColorStop(0, 'rgba(4,4,14,0)'); fr.addColorStop(1, 'rgba(4,4,14,1)');
      ctx.fillStyle = fr; ctx.fillRect(W-50, 0, 50, H);

      t += 0.02;
      if (reveal < N + 1) reveal += 0.2;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{
        display: 'block',
        transform: 'perspective(1100px) rotateX(20deg) rotateY(-5deg)',
        transformOrigin: '50% 100%',
        borderRadius: 10,
        border: '1px solid rgba(5,216,144,0.1)',
        filter: 'drop-shadow(0 20px 50px rgba(5,216,144,0.12))',
      }} />
    </div>
  );
}

/* ── Feature items ──────────────────────────────────── */
function FeatureIcon({ type }) {
  const s = { width: 14, height: 14, fill: 'none', stroke: '#05d890', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'log':    return <svg viewBox="0 0 24 24" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case 'curve':  return <svg viewBox="0 0 24 24" style={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'photo':  return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case 'cal':    return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'streak': return <svg viewBox="0 0 24 24" style={s}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'target': return <svg viewBox="0 0 24 24" style={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    default:       return null;
  }
}

function FeatureItem({ icon, label, desc }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 9,
    }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}><FeatureIcon type={icon} /></div>
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#b0b0cc', lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: '0.69rem', color: '#404060', marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ── Form helpers ───────────────────────────────────── */
function FieldIcon({ type }) {
  if (type === 'user') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, fontSize: '0.95rem', color: '#f0f0ff',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit'
};

function FormField({ label, value, onChange, type = 'text', placeholder, autoFocus, showToggle, showPw, onTogglePw }) {
  const isPassword = type === 'password' || showToggle;
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8888b0', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#44446a', pointerEvents: 'none' }}>
          <FieldIcon type={isPassword ? 'lock' : 'user'} />
        </span>
        <input
          type={showToggle ? (showPw ? 'text' : 'password') : type}
          value={value} onChange={onChange} placeholder={placeholder}
          required autoFocus={autoFocus}
          autoComplete={isPassword ? 'new-password' : 'username'}
          style={{ ...inputStyle, padding: `13px ${showToggle ? '44px' : '14px'} 13px 42px`, letterSpacing: showToggle && !showPw ? '0.12em' : 'normal' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(5,216,144,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,216,144,0.08)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
        />
        {showToggle && (
          <button type="button" onClick={onTogglePw} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#44446a', padding: 4, display: 'flex' }}>
            {showPw
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted]           = useState(false);
  const [mode, setMode]                 = useState('login');
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const resetForm = () => { setUsername(''); setPassword(''); setConfirm(''); setError(''); setShowPw(false); setShowConfirm(false); };
  const switchMode = m => { resetForm(); setMode(m); };

  const handleSubmit = e => {
    e.preventDefault(); setError('');
    if (!username.trim()) { setError('Please enter a username.'); return; }
    if (!password)        { setError('Please enter a password.'); return; }
    if (mode === 'setup') {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      setLoading(true);
      setTimeout(() => { setupAccount(username.trim(), password); navigate('/'); }, 400);
    } else {
      setLoading(true);
      setTimeout(() => {
        if (login(username.trim(), password)) { navigate('/'); }
        else { setError('Invalid username or password.'); setLoading(false); }
      }, 500);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#06060f', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* ══════════════ Left: Hero ══════════════ */}
      <div className="login-hero" style={{
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        padding: '44px 56px',
        background: 'linear-gradient(150deg, #09091e 0%, #05050f 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'
      }}>
        {/* Fine grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(28,28,60,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,60,0.25) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Glow blobs — background only, no overlap with text */}
        <div style={{ position: 'absolute', top: '30%', left: '30%', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(5,216,144,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(77,100,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Corner tick marks — purely decorative, inside padding zone */}
        {[[{ top: 12, left: 12 }, [0,1,1,0]], [{ top: 12, right: 12 }, [0,1,0,1]], [{ bottom: 12, left: 12 }, [1,0,1,0]], [{ bottom: 12, right: 12 }, [1,0,0,1]]].map(([pos, sides], i) => (
          <div key={i} style={{ position: 'absolute', ...pos, width: 16, height: 16, pointerEvents: 'none', opacity: 0.25 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTop: sides[0] ? '1px solid #05d890' : 'none', borderBottom: sides[1] ? '1px solid #05d890' : 'none', borderLeft: sides[2] ? '1px solid #05d890' : 'none', borderRight: sides[3] ? '1px solid #05d890' : 'none' }} />
          </div>
        ))}

        {/* ── Main content — fills full height evenly ── */}
        <div style={{
          position: 'relative', zIndex: 1, flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column',
          animation: mounted ? 'fadeUp 0.6s ease both' : 'none'
        }}>

          {/* 1. Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
              <svg width="36" height="36" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 0 10px rgba(5,216,144,0.5))', flexShrink: 0 }}>
                <defs>
                  <linearGradient id="lg1" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00c07e"/><stop offset="100%" stopColor="#05d890"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="#0a0a18"/>
                <rect width="32" height="32" rx="8" fill="none" stroke="#05d890" strokeWidth="1" opacity="0.3"/>
                <polyline points="4,24 9,18 14,21 20,12 28,7" stroke="url(#lg1)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="12" r="3.5" fill="#05d890" opacity="0.2"/>
                <circle cx="20" cy="12" r="2" fill="#05d890"/>
              </svg>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.03em' }}>Edgeflow</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(5,216,144,0.08)', border: '1px solid rgba(5,216,144,0.18)', borderRadius: 99, padding: '3px 10px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05d890', display: 'inline-block', boxShadow: '0 0 6px #05d890' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#05d890', letterSpacing: '0.04em' }}>Professional Trade Journal</span>
              </div>
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 2.8vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.18, marginBottom: 10, color: '#f0f0ff' }}>
              Track every edge.<br />
              <span style={{ background: 'linear-gradient(90deg, #05d890 0%, #00c07e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Grow every week.
              </span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#50507a', lineHeight: 1.65, maxWidth: 520 }}>
              Built for serious traders who want data-driven insights into their performance.
            </p>
          </div>

          {/* 2. 3D Candlestick Animation — flex:1 absorbs remaining space */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '0.65rem', color: '#28284a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05d890', boxShadow: '0 0 6px #05d890', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
              Live Market Simulation
            </div>
            <CandleAnimation />
            <div style={{ height: 24, marginTop: -4, background: 'radial-gradient(ellipse at 50% 0%, rgba(5,216,144,0.08) 0%, transparent 70%)', filter: 'blur(6px)' }} />
          </div>

          {/* 3. Feature grid */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.65rem', color: '#28284a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Everything included</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {FEATURES.map(f => <FeatureItem key={f.label} {...f} />)}
            </div>
          </div>

          {/* 4. Stats row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Win Rate', value: '72%',     icon: '◎' },
              { label: 'Avg R:R',  value: '2.4:1',   icon: '⟳' },
              { label: 'Net P&L',  value: '+$8,940', icon: '▲' },
            ].map((s, i) => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '9px 14px', flex: 1,
                animation: 'fadeUp 0.6s ease both', animationDelay: `${0.2 + i * 0.1}s`
              }}>
                <span style={{ fontSize: '0.88rem', color: '#05d890' }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#303050', marginBottom: 1 }}>{s.label}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0ff', letterSpacing: '-0.02em' }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ Right: Form ══════════════ */}
      <div className="login-form-side" style={{
        width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 56px',
        background: '#060609', position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(5,216,144,0.4), transparent)' }} />

        <div style={{ width: '100%', maxWidth: 360, animation: mounted ? 'fadeUp 0.5s ease 0.15s both' : 'none' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.03em', marginBottom: 8 }}>
              {mode === 'setup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p style={{ color: '#44446a', fontSize: '0.9rem' }}>
              {mode === 'setup' ? 'Set up your personal trading journal' : 'Sign in to your trading journal'}
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.25)', borderRadius: 10, padding: '11px 14px', marginBottom: 20, fontSize: '0.85rem', color: '#ff3d5a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FormField label="Username" value={username} onChange={e => setUsername(e.target.value)} type="text"
              placeholder={mode === 'setup' ? 'Choose a username' : 'Enter your username'} autoFocus />
            <FormField label="Password" value={password} onChange={e => setPassword(e.target.value)} type="password"
              placeholder={mode === 'setup' ? 'Create a password (min 6 chars)' : '••••••••'}
              showToggle showPw={showPw} onTogglePw={() => setShowPw(v => !v)} />
            {mode === 'setup' && (
              <FormField label="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} type="password"
                placeholder="Repeat your password" showToggle showPw={showConfirm} onTogglePw={() => setShowConfirm(v => !v)} />
            )}
            <button type="submit" disabled={loading} style={{
              marginTop: 6, padding: '14px',
              background: loading ? 'rgba(5,216,144,0.5)' : 'linear-gradient(135deg, #05d890 0%, #00c07e 100%)',
              border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, color: '#021a0e',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
              boxShadow: loading ? 'none' : '0 0 20px rgba(5,216,144,0.3)', letterSpacing: '-0.01em'
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(5,216,144,0.45)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(5,216,144,0.3)'; }}
            >
              {loading ? (
                <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(2,26,14,0.35)', borderTopColor: '#021a0e', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  {mode === 'setup' ? 'Creating account…' : 'Signing in…'}</>
              ) : (mode === 'setup' ? 'Create Account →' : 'Sign In →')}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            {mode === 'login' ? (
              <p style={{ fontSize: '0.82rem', color: '#44446a' }}>
                New journal?{' '}
                <button type="button" onClick={() => switchMode('setup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#05d890', fontSize: '0.82rem', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                  Create an account
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#44446a' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#05d890', fontSize: '0.82rem', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                  Sign in
                </button>
              </p>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.75rem', color: '#2a2a42' }}>
            © 2026 Edgeflow · Trade smarter
          </p>
        </div>
      </div>
    </div>
  );
}
