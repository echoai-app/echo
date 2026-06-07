import React from 'react';

/* ============================================================
   ECHO · UI system — primitives, doodle icons, companion orb
   Ported from design_handoff_echo/prototype/components/echo-ui.jsx
   ============================================================ */

type CSS = React.CSSProperties;

/* ---------- doodle icon set ---------- */
export function Ic({ name, size = 30, stroke = 'var(--ink)', sw = 2.6, fill = 'none' }: {
  name: string; size?: number; stroke?: string; sw?: number; fill?: string;
}) {
  const p = { fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    spark: <path d="M12 2c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7Z" {...p} fill={fill} />,
    star: <path d="M12 3l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 21l-5.1-2.2 1.1-5.8-4.3-4 5.8-.7L12 3Z" {...p} fill={fill} />,
    heart: <path d="M12 20s-7-4.4-9-9.2C1.6 7.2 3.6 4 7 4c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.2 4 6.8C19 15.6 12 20 12 20Z" {...p} fill={fill} />,
    cloud: <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6 9.5 4.2 4.2 0 0 0 7 18Z" {...p} fill={fill} />,
    chat: <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" {...p} fill={fill} />,
    breeze: <g {...p} fill="none"><path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5" /><path d="M3 14h14a2.5 2.5 0 1 1-2.5 2.5" /><path d="M3 12h6" /></g>,
    lens: <g {...p} fill="none"><circle cx="11" cy="11" r="6.4" /><path d="M11 8.6c.9-1.4 3.2-1 3.2.8 0 1.6-2.4 2.6-3.2 3.4-.8-.8-3.2-1.8-3.2-3.4 0-1.8 2.3-2.2 3.2-.8Z" /><path d="M16 16l4 4" /></g>,
    rewind: <g {...p} fill="none"><path d="M4 12a8 8 0 1 1 2.6 5.9" /><path d="M4 7v5h5" /></g>,
    pulse: <path d="M3 12h4l2-6 4 12 2-6h6" {...p} fill="none" />,
    shield: <path d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6l7-3Z" {...p} fill={fill} />,
    leaf: <g {...p} fill="none"><path d="M5 19c0-7 5-12 14-13C18 13 13 19 5 19Z" /><path d="M5 19c3-4 6-6 10-7.5" /></g>,
    wallet: <g {...p} fill="none"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 9h14a2 2 0 0 1 2 2v3" /><circle cx="16.5" cy="13" r="1.3" fill="var(--ink)" stroke="none" /></g>,
    ghost: <path d="M5 11a7 7 0 0 1 14 0v9l-2.3-1.6L14.3 20 12 18.3 9.7 20 7.3 18.4 5 20v-9Z" {...p} fill={fill} />,
    db: <g {...p} fill="none"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></g>,
    check: <path d="M5 12.5l4.5 4.5L19 6.5" {...p} fill="none" />,
    arrowR: <path d="M5 12h13M13 6l6 6-6 6" {...p} fill="none" />,
    arrowL: <path d="M19 12H6M11 6l-6 6 6 6" {...p} fill="none" />,
    play: <path d="M7 4.5l13 7.5-13 7.5v-15Z" {...p} fill={fill} />,
    plus: <path d="M12 5v14M5 12h14" {...p} fill="none" />,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} fill="none" />,
    lock: <g {...p} fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2.6" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></g>,
    clock: <g {...p} fill="none"><circle cx="12" cy="12" r="8.4" /><path d="M12 7v5l3.2 2" /></g>,
    sun: <g {...p} fill="none"><circle cx="12" cy="12" r="4.3" /><path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" /></g>,
    map: <g {...p} fill="none"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" /><path d="M9 4v14M15 6v14" /></g>,
    sprout: <g {...p} fill="none"><path d="M12 21v-8" /><path d="M12 13c0-3 2-5 6-5-.2 3.5-2.5 5-6 5Z" /><path d="M12 14c0-2.4-1.6-4-4.5-4 .2 2.8 1.8 4 4.5 4Z" /></g>,
    anchor: <g {...p} fill="none"><circle cx="12" cy="5" r="2" /><path d="M12 7v13M5 13a7 7 0 0 0 14 0M5 13H3m16 0h2" /></g>,
    mic: <g {...p} fill="none"><rect x="9" y="3" width="6" height="11" rx="3" fill={fill} /><path d="M5.5 11a6.5 6.5 0 0 0 13 0" /><path d="M12 17.5V21M8.5 21h7" /></g>,
    micOff: <g {...p} fill="none"><path d="M15 9.5V6a3 3 0 0 0-5.7-1.3" /><path d="M9 9v2.2a3 3 0 0 0 4.4 2.6" /><path d="M5.5 11a6.5 6.5 0 0 0 10.2 5.3M18.5 11v.4" /><path d="M12 17.5V21M8.5 21h7" /><path d="M4 4l16 16" /></g>,
    pause: <path d="M9 5v14M15 5v14" {...p} fill="none" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="3.2" {...p} fill={fill} />,
    keyboard: <g {...p} fill="none"><rect x="3" y="6.5" width="18" height="11" rx="3" /><path d="M7 10.2h.01M11 10.2h.01M15 10.2h.01M8 14h8" /></g>,
    wave: <g {...p} fill="none"><path d="M3 12h0M7 8.5v7M11 5v14M15 8.5v7M19 11v2M21 12h0" /></g>,
    sui: <path d="M12 3.2c4 5 6.2 7.7 6.2 10.8a6.2 6.2 0 0 1-12.4 0C5.8 10.9 8 8.2 12 3.2Z" {...p} fill={fill} />,
    ear: <g {...p} fill="none"><path d="M7 9a5 5 0 0 1 10 0c0 3-2.6 3.6-3.4 5.2-.5 1-.2 2.3-1.6 3.1A2.6 2.6 0 0 1 8 15" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0" /></g>,
    home: <g {...p} fill="none"><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /><path d="M10 20v-5h4v5" /></g>,
    gear: <g {...p} fill="none"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a7.5 7.5 0 0 0 0-3l1.8-1.4-1.5-2.6-2.1.8a7.5 7.5 0 0 0-2.6-1.5L14.5 3.5h-3l-.4 2.3A7.5 7.5 0 0 0 8.5 7.3l-2.1-.8-1.5 2.6 1.8 1.4a7.5 7.5 0 0 0 0 3l-1.8 1.4 1.5 2.6 2.1-.8a7.5 7.5 0 0 0 2.6 1.5l.4 2.3h3l.4-2.3a7.5 7.5 0 0 0 2.6-1.5l2.1.8 1.5-2.6-1.8-1.4Z" /></g>,
    logout: <g {...p} fill="none"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M13 12h8M18 8l4 4-4 4" /></g>,
    help: <g {...p} fill="none"><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2-2.5 3.8" /><path d="M12 17.2v.01" /></g>,
    bell: <g {...p} fill="none"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></g>,
    moon: <path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z" {...p} fill={fill} />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" className="spark">{paths[name] || null}</svg>;
}

/* ---------- companion orb ---------- */
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'saving' | 'paused' | 'ended';
export function Orb({ size = 180, listening = false, state, mood = 'lav' }: {
  size?: number; listening?: boolean; state?: OrbState; mood?: string;
}) {
  const st = state || (listening ? 'speaking' : 'idle');
  const moodByState: Record<string, string> =
    { listening: 'rose', speaking: 'peach', thinking: 'lav', saving: 'sky', paused: 'lav', idle: 'lav', ended: 'sage' };
  const tintKey = moodByState[st] || mood;
  const tints: Record<string, string> = { lav: 'var(--lav)', sage: 'var(--sage)', peach: 'var(--peach)', sky: 'var(--sky)', rose: 'var(--rose)' };
  const tint = tints[tintKey] || 'var(--lav)';
  return (
    <div className={'orb-wrap st-' + st} style={{ width: size, height: size }}>
      <div className="orb-aura" />
      <div className="sound-ring s1" />
      <div className="sound-ring s2" />
      <div className="sound-ring s3" />
      <div className="orb-ring" />
      <div className="orb-ring" style={{ animationDelay: '1.3s' }} />
      <div className="orb" style={{
        width: size, height: size,
        background: `radial-gradient(circle at 36% 32%, #FFFFFF 0%, #FFF4EC 14%, ${tint} 46%, var(--peach) 82%, var(--peach-deep) 100%)`,
      }} />
      {/* centered white sparkle — matches the Echo logo mark */}
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 2, pointerEvents: 'none' }}>
        <Ic name="spark" size={Math.round(size * 0.5)} stroke="#fff" sw={2} fill="#fff" />
      </div>
      <div className="orb-spark" style={{ ['--d']: size * 0.6 + 'px', animationDelay: '-7s', animationDuration: '18s' } as CSS}><Ic name="spark" size={Math.max(8, Math.round(size * 0.1))} stroke="var(--sun)" sw={2.4} fill="var(--sun)" /></div>
    </div>
  );
}

/* ---------- ecosystem logo marks (real brand glyphs in sticker circles) ---------- */
export function LogoMark({ brand, size = 20 }: { brand: 'mnemos' | 'walrus' | 'sui'; size?: number }) {
  const g = size * 0.66;
  const marks: Record<string, { bg: string; el: React.ReactNode }> = {
    // Mnemos — the real memory-loop mark (cyan→indigo→violet gradient).
    mnemos: { bg: 'var(--paper)', el: (
      <svg viewBox="0 0 40 40" width={g} height={g} fill="none" aria-hidden>
        <defs>
          <linearGradient id="echoMnemos" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06b6d4" /><stop offset="0.52" stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path d="M20 20 C 18 10.5 7.5 10.5 7.5 20 C 7.5 29.5 18 29.5 20 20 C 22 10.5 32.5 10.5 32.5 20 C 32.5 29.5 22 29.5 20 20 Z"
          stroke="url(#echoMnemos)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="3.1" fill="url(#echoMnemos)" />
      </svg>) },
    // Walrus — the official white WAL token mark, centered on black.
    walrus: { bg: '#000000', el: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/walrus-token.png" alt="Walrus" style={{ width: '76%', height: '76%', objectFit: 'contain', display: 'block' }} />
    ) },
    // Sui — the real droplet, white on Sui blue.
    sui: { bg: '#4DA2FF', el: (
      <svg viewBox="0 0 783 1000" width={g * 0.78} height={g} aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF" d="M626.027 417.029C666.817 468.244 691.209 533.014 691.209 603.469C691.209 673.925 666.076 740.673 624.214 792.176L620.588 796.626L619.641 790.981C618.817 786.201 617.869 781.34 616.757 776.478C595.785 684.349 527.471 605.365 415.03 541.378C339.095 498.28 295.626 446.448 284.213 387.487C276.838 349.375 282.318 311.098 292.907 278.301C303.496 245.545 319.235 218.063 332.626 201.541L376.383 148.06C384.046 138.666 398.426 138.666 406.09 148.06L626.068 417.029H626.027ZM695.206 363.59L402.01 5.12968C396.407 -1.70989 385.942 -1.70989 380.338 5.12968L87.184 363.59L86.2363 364.784C32.3026 431.738 0 516.821 0 609.444C0 825.138 175.151 1000 391.174 1000C607.198 1000 782.349 825.138 782.349 609.444C782.349 516.821 750.046 431.738 696.112 364.826L695.165 363.631L695.206 363.59ZM157.351 415.876L183.556 383.779L184.339 389.712C184.957 394.409 185.74 399.106 186.646 403.844C203.622 492.883 264.23 567.088 365.546 624.565C453.637 674.708 504.934 732.35 519.684 795.554C525.864 821.924 526.936 847.881 524.258 870.584L524.093 871.985L522.816 872.603C483.055 892.009 438.351 902.927 391.133 902.927C225.459 902.927 91.1394 768.855 91.1394 603.428C91.1394 532.396 115.902 467.172 157.269 415.793L157.351 415.876Z" />
      </svg>) },
  };
  const m = marks[brand];
  return (
    <span className="logo-mark" style={{ width: size, height: size, background: m.bg }} title={brand[0].toUpperCase() + brand.slice(1)}>
      {m.el}
    </span>
  );
}

export function PoweredBy({ variant = 'marks', size = 20, boxed = false }: {
  variant?: 'marks' | 'named' | 'bare'; size?: number; boxed?: boolean;
}) {
  const brands: ('mnemos' | 'walrus' | 'sui')[] = ['mnemos', 'walrus', 'sui'];
  if (variant === 'bare') {
    return (
      <span className={'powered-logos' + (boxed ? ' boxed' : '')} title="Powered by Mnemos · Walrus · Sui">
        <span className="marks">{brands.map(b => <LogoMark key={b} brand={b} size={size} />)}</span>
      </span>
    );
  }
  if (variant === 'named') {
    return (
      <span className={'powered-logos' + (boxed ? ' boxed' : '')}>
        <span>powered by</span>
        <span className="marks" style={{ gap: 11 }}>
          {brands.map(b => (
            <span key={b} className="mname"><LogoMark brand={b} size={size} /><b>{b[0].toUpperCase() + b.slice(1)}</b></span>
          ))}
        </span>
      </span>
    );
  }
  return (
    <span className={'powered-logos' + (boxed ? ' boxed' : '')}>
      <span>powered by</span>
      <span className="marks">{brands.map(b => <LogoMark key={b} brand={b} size={size} />)}</span>
    </span>
  );
}

/* word-by-word reveal for spoken lines */
export function WordReveal({ text, stagger = 0.045 }: { text: string; stagger?: number }) {
  const words = String(text).split(' ');
  return (
    <span className="wr">
      {words.map((w, i) => (
        <span key={i} style={{ animationDelay: (i * stagger) + 's' }}>{w}{i < words.length - 1 ? ' ' : ''}</span>
      ))}
    </span>
  );
}

/* ---------- decorative doodle field ---------- */
type Doodle = { ic: string; x: string; y: string; s: number; c: string; f?: number; r?: number };
export function Doodles({ items }: { items?: Doodle[] }) {
  const def: Doodle[] = items || [
    { ic: 'spark', x: '8%', y: '16%', s: 26, c: 'var(--sun)', f: 1, r: -8 },
    { ic: 'star', x: '6%', y: '62%', s: 30, c: 'var(--sun)', f: 1, r: -12 },
    { ic: 'heart', x: '9%', y: '82%', s: 24, c: 'var(--rose)', f: 1, r: 6 },
    { ic: 'spark', x: '90%', y: '20%', s: 22, c: 'var(--sky-deep)', f: 1, r: 10 },
    { ic: 'cloud', x: '86%', y: '70%', s: 40, c: 'var(--ink)', f: 1, r: 0 },
    { ic: 'spark', x: '93%', y: '54%', s: 18, c: 'var(--lav-deep)', f: 1, r: 0 },
  ];
  return (
    <div className="doodles">
      {def.map((d, i) => (
        <div key={i} className={'doodle ' + (d.f ? 'float' : '')}
          style={{ left: d.x, top: d.y, ['--r']: (d.r || 0) + 'deg', animationDelay: (i * 0.7) + 's', transform: `rotate(${d.r || 0}deg)` } as CSS}>
          <Ic name={d.ic} size={d.s} stroke={d.c} fill={d.ic === 'cloud' ? 'var(--paper)' : (d.ic === 'heart' || d.ic === 'star' || d.ic === 'spark') ? d.c : 'none'} sw={2.4} />
        </div>
      ))}
    </div>
  );
}

/* ---------- small building blocks ---------- */
export function Eyebrow({ children, ic }: { children: React.ReactNode; ic?: string }) {
  return <span className="eyebrow">{ic && <Ic name={ic} size={15} />}{children}</span>;
}

export function Chip({ children, tone = '', ic, sm, style }: {
  children: React.ReactNode; tone?: string; ic?: string | null; sm?: boolean; style?: CSS;
}) {
  return <span className={`chip ${tone} ${sm ? 'sm' : ''}`} style={style}>{ic && <Ic name={ic} size={sm ? 13 : 15} />}{children}</span>;
}

export function Btn({ children, variant = 'ghost', size = '', icon, iconR, onClick, disabled, block, type }: {
  children?: React.ReactNode; variant?: string; size?: string; icon?: string; iconR?: string;
  onClick?: () => void; disabled?: boolean; block?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button type={type || 'button'} className={`btn ${variant} ${size} ${block ? 'block' : ''}`} onClick={onClick} disabled={disabled}>
      {icon && <Ic name={icon} size={20} />}{children}{iconR && <Ic name={iconR} size={20} />}
    </button>
  );
}

/* avatar — uploaded pfp image or the name initial */
export function Avatar({ name, pfp, size = 42, bg = 'var(--sage)', className = 'avatar' }: {
  name?: string; pfp?: string | null; size?: number; bg?: string; className?: string;
}) {
  return (
    <div className={className} style={{ width: size, height: size, background: bg, overflow: 'hidden', padding: 0 }}>
      {pfp
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={pfp} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name?.[0]?.toUpperCase() || 'E')}
    </div>
  );
}

/* typing dots */
export function Typing() {
  return <div className="bubble echo" style={{ display: 'inline-flex', gap: 6, padding: '16px 20px' }}>
    {[0, 1, 2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: 9, background: 'var(--ink-soft)', display: 'inline-block', animation: `up2 1s ${i * 0.18}s infinite alternate` }} />)}
  </div>;
}
