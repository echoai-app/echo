'use client';

/* A short, clean outro end-card for the demo video — Echo logo + slogan, cozy
   app vibe. Auto-plays a ~2s entrance then holds with a gentle float.
   Open fullscreen → screen-record the last few seconds. Replay to loop. */

import { useState } from 'react';
import { EchoLogo, Ic } from '@/components/ui';

const DOODLES: [string, string, string, string][] = [
  ['10%', '20%', 'spark', 'var(--sun)'], ['88%', '24%', 'star', 'var(--sun)'], ['14%', '76%', 'heart', 'var(--rose)'],
  ['84%', '72%', 'cloud', 'var(--ink)'], ['50%', '12%', 'spark', 'var(--lav-deep)'], ['78%', '86%', 'star', 'var(--peach-deep)'],
  ['22%', '40%', 'heart', 'var(--rose)'],
];

export default function Outro() {
  const [k, setK] = useState(0);
  return (
    <div className="outro-stage">
      <div className="outro-bg" aria-hidden>
        {DOODLES.map(([x, y, ic, c], i) => (
          <span key={i} className="outro-doodle" style={{ left: x, top: y, animationDelay: `${i * 0.6}s` }}>
            <Ic name={ic} size={26} stroke={c} fill={ic === 'cloud' ? 'var(--paper)' : c} sw={2.2} />
          </span>
        ))}
      </div>

      <div className="outro-card" key={k}>
        <EchoLogo size={132} className="outro-logo" />
        <h1 className="display outro-slogan">
          Reflect with{' '}
          <span className="outro-em">
            Echo
            <svg className="outro-underline" viewBox="0 0 200 18" fill="none" preserveAspectRatio="none" aria-hidden>
              <path d="M5 11 Q 52 2 100 9 T 195 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="outro-sub">The AI that remembers you.</p>
      </div>

      <button className="outro-replay" onClick={() => setK(x => x + 1)} title="Replay"><Ic name="rewind" size={18} /> Replay</button>
    </div>
  );
}
