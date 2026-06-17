'use client';

/* Cinematic 3D explainer: a flying camera through animated Three.js scenes
   (components/explainer/*) with a synced kinetic-typography overlay.
   Open fullscreen → Play → screen-record. */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EchoLogo, Ic, LogoMark } from '@/components/ui';

const ExplainerCanvas = dynamic(() => import('@/components/explainer/ExplainerCanvas'), { ssr: false });

const BEATS = [
  { eyebrow: '', big: 'echo', sub: 'The AI that remembers you.' },
  { eyebrow: 'the problem', big: 'Most AI forgets you the moment you leave.', sub: 'And your words live on someone else’s servers.' },
  { eyebrow: 'how it feels', big: 'Just talk. Echo listens & reflects.', sub: 'Voice-first · talk over it any time · it knows your name' },
  { eyebrow: 'the part that matters', big: 'Memory you actually own.', sub: 'Real blobs on Walrus · a pointer you own on Sui · independently verifiable' },
  { eyebrow: 'built solo · ~3 weeks', big: 'One product. One stack.', sub: 'Next.js · React Three Fiber · neural voice · Mnemos · Walrus + Sui' },
  { eyebrow: '', big: 'echo', sub: 'The AI that remembers you.' },
];
const DUR = [8000, 10000, 12000, 15000, 11000, 8000];
const TOTAL = DUR.reduce((a, b) => a + b, 0);

export default function Explainer() {
  const [started, setStarted] = useState(false);
  const [beat, setBeat] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [playId, setPlayId] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStarted(true); setBeat(0); setStartMs(performance.now()); setPlayId(p => p + 1);
    let t = 0;
    for (let s = 1; s < DUR.length; s++) { t += DUR[s - 1]; timers.current.push(setTimeout(() => setBeat(s), t)); }
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const atEnd = beat === BEATS.length - 1;
  const b = BEATS[beat];
  const logoBeat = beat === 0 || beat === 5;

  return (
    <div className="exp3-stage">
      <div className="exp3-canvas"><ExplainerCanvas startMs={startMs} running={started} /></div>
      <div className="exp3-scrim" />

      {started && (
        <div className="exp3-overlay" key={beat}>
          {b.eyebrow && <div className="exp3-eyebrow">{b.eyebrow}</div>}
          {logoBeat ? (
            <div className="exp3-logorow">
              <EchoLogo size={88} className="exp3-logo" />
              <h1 className="display exp3-word">echo</h1>
            </div>
          ) : (
            <h1 className="display exp3-big">{b.big}</h1>
          )}
          <p className="exp3-sub">{b.sub}</p>
          {beat === 5 && (
            <div className="exp3-badge"><LogoMark brand="walrus" size={18} /> Sui Overflow 2026 · <b>Walrus Track</b></div>
          )}
        </div>
      )}

      {started && (
        <div className="exp3-progress"><span key={playId} style={{ animationDuration: `${TOTAL}ms` }} /></div>
      )}

      {!started && (
        <div className="exp3-start">
          <EchoLogo size={96} style={{ filter: 'drop-shadow(0 16px 38px rgba(237,156,116,.55))' }} />
          <h2 className="display exp3-start-h">Echo — cinematic explainer</h2>
          <p className="exp3-start-p">~1 minute · press play, then screen-record. Best in fullscreen.</p>
          <button className="exp3-play" onClick={play}><Ic name="play" size={22} stroke="#fff" /> Play</button>
        </div>
      )}

      {started && atEnd && (
        <button className="exp3-replay" onClick={play}><Ic name="rewind" size={18} /> Replay</button>
      )}
    </div>
  );
}
