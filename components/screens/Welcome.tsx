'use client';

import { useEffect } from 'react';
import { Orb, Doodles, Btn, Ic, LogoMark, PoweredBy } from '../ui';
import { useEcho } from '@/lib/store';

export default function Welcome() {
  const go = useEcho(s => s.go);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); go('onboard'); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  return (
    <div className="bg-peachwash" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '32px 24px 22px', gap: 26 }}>
      <Doodles />
      <div className="tc" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div className="up d1"><Orb size={128} /></div>
        <div className="up d2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <h1 className="display" style={{ fontSize: 'clamp(52px,8vw,100px)', letterSpacing: '-.02em', margin: 0, lineHeight: 1 }}>
            ech<span style={{ color: 'var(--peach-deep)' }}>o</span>
          </h1>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(18px,2.4vw,22px)', maxWidth: 560, textAlign: 'center', lineHeight: 1.4 }}>
            A gentle companion that <span style={{ color: 'var(--peach-deep)' }}>remembers</span> your emotional journey.
          </p>
        </div>
        <div className="up d3" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 620 }}>
          <span className="vprop"><Ic name="lens" size={17} /> Evidence-informed</span>
          <span className="vprop"><Ic name="anchor" size={17} /> Remembers you</span>
          <span className="vprop"><LogoMark brand="walrus" size={17} /> Yours on Walrus</span>
        </div>
        <div className="up d4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <Btn variant="primary" size="lg" icon="play" onClick={() => go('onboard')}>Begin reflecting</Btn>
          <button className="linkbtn" onClick={() => go('recall')}>
            <Ic name="rewind" size={16} /> I&apos;ve been here before — continue
          </button>
        </div>
      </div>
      <div className="up d5" style={{ position: 'relative', zIndex: 2 }}>
        <PoweredBy variant="named" size={22} boxed />
      </div>
    </div>
  );
}
