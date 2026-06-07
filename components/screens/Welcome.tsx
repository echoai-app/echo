'use client';

import { useEffect } from 'react';
import { Doodles, Btn, Ic, LogoMark, PoweredBy } from '../ui';
import { useEcho } from '@/lib/store';

export default function Welcome() {
  const go = useEcho(s => s.go);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); go('onboard'); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  return (
    <div className="bg-peachwash" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', padding: '24px 24px 22px', overflow: 'hidden' }}>
      <div className="aurora" />
      <Doodles items={[
        { ic: 'spark', x: '11%', y: '16%', s: 26, c: 'var(--sun)', f: 1, r: -8 },
        { ic: 'heart', x: '15%', y: '78%', s: 24, c: 'var(--rose)', f: 1, r: 6 },
        { ic: 'star', x: '87%', y: '18%', s: 28, c: 'var(--sun)', f: 1, r: 10 },
        { ic: 'cloud', x: '84%', y: '78%', s: 38, c: 'var(--ink)', f: 1, r: 0 },
      ]} />

      <div className="tc" style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, maxWidth: 660, margin: '0 auto', width: '100%' }}>
        <span className="hero-badge up d1"><Ic name="spark" size={15} stroke="var(--peach-deep)" fill="var(--peach-deep)" /> your AI reflection companion</span>

        <div className="up d2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <span className="wm">
            <h1 className="display" style={{ fontSize: 'clamp(74px,13vw,154px)', letterSpacing: '-.04em', margin: 0 }}>
              ech<span style={{ color: 'var(--peach-deep)' }}>o</span>
            </h1>
            <svg className="wm-underline" viewBox="0 0 200 18" fill="none" preserveAspectRatio="none" aria-hidden>
              <path d="M5 11 Q 52 2 100 9 T 195 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
          <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: 'clamp(18px,2.4vw,23px)', maxWidth: 480, lineHeight: 1.4, color: 'var(--ink)' }}>
            Think out loud. Notice your patterns.<br />Be <span style={{ color: 'var(--peach-deep)' }}>remembered</span>.
          </p>
        </div>

        <div className="up d3 hero-feat">
          <span>Evidence-informed</span>
          <span className="dot" />
          <span>Remembers you</span>
          <span className="dot" />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LogoMark brand="walrus" size={16} /> Yours on Walrus</span>
        </div>

        <div className="up d4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <Btn variant="primary" size="lg" icon="play" onClick={() => go('onboard')}>Begin reflecting</Btn>
          <button className="linkbtn" onClick={() => go('recall')}>
            <Ic name="rewind" size={16} /> I&apos;ve been here before
          </button>
        </div>
      </div>

      <div className="up d5" style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
        <PoweredBy variant="named" size={20} boxed />
      </div>
    </div>
  );
}
