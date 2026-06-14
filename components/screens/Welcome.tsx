'use client';

import { useEffect, useRef } from 'react';
import { Doodles, Btn, Ic, PoweredBy, EchoLogo } from '../ui';
import { useEcho } from '@/lib/store';

// Honest early-tester reflections (collected June 2026). Emails withheld for privacy.
const TESTIMONIALS = [
  {
    name: 'Hanan', initial: 'H', tone: 'var(--mint)',
    quote: 'Well designed — a thoughtful, voice-first experience that supports reflection, self-awareness, and small, practical next steps through a clear, structured approach.',
  },
  {
    name: 'Rehan', initial: 'R', tone: 'var(--lav)',
    quote: 'A safe place to share your feelings.',
  },
];

export default function Welcome() {
  const go = useEcho(s => s.go);
  const proofRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); go('onboard'); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  return (
    <div className="bg-peachwash" style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      {/* ── first screen: the hero ── */}
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative', padding: '24px 24px 18px' }}>
        <div className="aurora" />
        <Doodles items={[
          { ic: 'spark', x: '11%', y: '14%', s: 26, c: 'var(--sun)', f: 1, r: -8 },
          { ic: 'heart', x: '14%', y: '76%', s: 24, c: 'var(--rose)', f: 1, r: 6 },
          { ic: 'star', x: '87%', y: '16%', s: 28, c: 'var(--sun)', f: 1, r: 10 },
          { ic: 'cloud', x: '85%', y: '74%', s: 38, c: 'var(--ink)', f: 1, r: 0 },
        ]} />

        <div className="tc" style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, maxWidth: 660, margin: '0 auto', width: '100%' }}>
          <div className="up d2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <EchoLogo size={88} style={{ filter: 'drop-shadow(0 10px 22px rgba(237,156,116,.35))', animation: 'breathe 4.5s ease-in-out infinite' }} />
            <span className="wm">
              <h1 className="display" style={{ fontSize: 'clamp(74px,13vw,154px)', letterSpacing: '-.04em', margin: 0 }}>
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

          <div className="up d4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 4 }}>
            <Btn variant="primary" size="lg" icon="play" onClick={() => go('onboard')}>Begin reflecting</Btn>
            <button className="linkbtn" onClick={() => go('consent')} title="Sign back in — connect your wallet to recover your memories">
              <Ic name="rewind" size={16} /> I&apos;ve been here before
            </button>
          </div>

          {/* social-proof teaser — scrolls to the reflections below */}
          <button className="up d5 scroll-cue" onClick={() => proofRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="scroll-hearts"><Ic name="heart" size={13} stroke="var(--rose-deep)" fill="var(--rose)" /><Ic name="heart" size={13} stroke="var(--rose-deep)" fill="var(--rose)" /></span>
            loved by early reflectors <Ic name="arrowR" size={14} sw={2.8} stroke="var(--ink-soft)" />
          </button>
        </div>

        <div className="up d5 landing-foot" style={{ position: 'relative', zIndex: 2 }}>
          <PoweredBy variant="named" size={20} boxed />
        </div>
      </div>

      {/* ── early reflections ── */}
      <section ref={proofRef} className="landing-proof">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="tc" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            <span className="kicker">what early users say</span>
            <h2 className="display" style={{ margin: 0, fontSize: 'clamp(26px,4vw,40px)' }}>Early reflections.</h2>
          </div>
          <div className="r-2">
            {TESTIMONIALS.map(t => (
              <figure key={t.name} className="tcard">
                <Ic name="chat" size={26} stroke="var(--ink-faint)" />
                <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption>
                  <span className="tavatar" style={{ background: t.tone }}>{t.initial}</span>
                  <span>
                    <b>{t.name}</b>
                    <span className="muted" style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>early tester</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="tc" style={{ marginTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Btn variant="primary" size="lg" icon="play" onClick={() => go('onboard')}>Try it yourself</Btn>
            <span className="muted" style={{ fontWeight: 700, fontSize: 12.5 }}>Echo is for reflection &amp; self-awareness — not medical or crisis care.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
