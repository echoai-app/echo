'use client';

import { useEffect, useState } from 'react';
import { Doodles, Btn, Ic, PoweredBy, EchoLogo } from '../ui';
import { useEcho } from '@/lib/store';

// Honest early-tester reflections (collected June 2026). Emails withheld for privacy.
const TESTIMONIALS = [
  { name: 'Hanan', initial: 'H', tone: 'var(--mint)', quote: 'A thoughtful, voice-first experience that supports reflection, self-awareness, and small, practical next steps.' },
  { name: 'Rehan', initial: 'R', tone: 'var(--lav)', quote: 'A safe place to share your feelings.' },
];

function TestimonialRotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % TESTIMONIALS.length), 5200);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[i];
  return (
    <div className="testimonial-card" role="group" aria-label="early tester reflection">
      <Ic name="chat" size={18} stroke="var(--ink-faint)" />
      <p key={i}>&ldquo;{t.quote}&rdquo;</p>
      <div className="t-by">
        <span className="t-av" style={{ background: t.tone }}>{t.initial}</span>
        <b>{t.name}</b><span className="muted">· early tester</span>
        <span className="t-dots">{TESTIMONIALS.map((_, k) => <span key={k} className={'t-dot' + (k === i ? ' on' : '')} />)}</span>
      </div>
    </div>
  );
}

export default function Welcome() {
  const go = useEcho(s => s.go);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); go('onboard'); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  return (
    <div className="bg-peachwash" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', padding: '20px 24px 16px', overflow: 'hidden' }}>
      <div className="aurora" />
      <Doodles items={[
        { ic: 'spark', x: '10%', y: '14%', s: 26, c: 'var(--sun)', f: 1, r: -8 },
        { ic: 'heart', x: '13%', y: '76%', s: 24, c: 'var(--rose)', f: 1, r: 6 },
        { ic: 'star', x: '88%', y: '15%', s: 28, c: 'var(--sun)', f: 1, r: 10 },
        { ic: 'cloud', x: '86%', y: '74%', s: 38, c: 'var(--ink)', f: 1, r: 0 },
      ]} />

      <div className="tc" style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, maxWidth: 660, margin: '0 auto', width: '100%' }}>
        <div className="up d2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <EchoLogo size={84} style={{ filter: 'drop-shadow(0 10px 22px rgba(237,156,116,.35))', animation: 'breathe 4.5s ease-in-out infinite' }} />
          <span className="wm">
            <h1 className="display" style={{ fontSize: 'clamp(68px,12vw,150px)', letterSpacing: '-.04em', margin: 0 }}>
              ech<span style={{ color: 'var(--peach-deep)' }}>o</span>
            </h1>
            <svg className="wm-underline" viewBox="0 0 200 18" fill="none" preserveAspectRatio="none" aria-hidden>
              <path d="M5 11 Q 52 2 100 9 T 195 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
          <p style={{ margin: '8px 0 0', fontWeight: 700, fontSize: 'clamp(17px,2.2vw,21px)', maxWidth: 420, lineHeight: 1.45, color: 'var(--ink-soft)' }}>
            The AI companion that <span style={{ color: 'var(--peach-deep)' }}>remembers you</span>.
          </p>
        </div>

        <div className="up d4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 2 }}>
          <Btn variant="primary" size="lg" icon="play" onClick={() => go('onboard')}>Begin reflecting</Btn>
          <button className="linkbtn" onClick={() => go('consent')} title="Sign back in — connect your wallet to recover your memories">
            <Ic name="rewind" size={16} /> I&apos;ve been here before
          </button>
        </div>

        <div className="up d5"><TestimonialRotator /></div>
      </div>

      <div className="up d5 landing-foot" style={{ position: 'relative', zIndex: 2 }}>
        <PoweredBy variant="named" size={20} boxed />
      </div>
    </div>
  );
}
