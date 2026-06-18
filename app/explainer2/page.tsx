'use client';

/* A simple, light, "how it works" workflow explainer — the Echo flow draws
   itself out step by step so it's understood at a glance. Cozy app vibe.
   Open fullscreen → Play → screen-record. (The 3D one lives at /explainer.) */

import { useEffect, useRef, useState } from 'react';
import { EchoLogo, Ic, LogoMark } from '@/components/ui';

type CSS = React.CSSProperties;

const NODES = [
  { ic: 'mic', c: 'var(--sage)', t: 'You talk', s: 'Speak freely — voice-first' },
  { ic: 'chat', c: 'var(--lav)', t: 'Echo reflects', s: 'Listens & guides, gently' },
  { ic: 'heart', c: 'var(--rose)', t: 'Keep what matters', s: 'You approve every memory' },
  { ic: 'anchor', c: 'var(--mint)', t: 'Stored & owned', s: 'Walrus blob · Sui pointer', special: true },
  { ic: 'rewind', c: 'var(--sky)', t: 'Remembered', s: 'Recalled, every session' },
];
// cumulative ms after Play for each step (1 = title, 2..6 = nodes, 7 = loop, 8 = close)
const STEP_MS = [0, 2400, 1900, 1900, 1900, 2000, 2200, 2800];
const TOTAL = STEP_MS.reduce((a, b) => a + b, 0);

const DOODLES: [string, string, string, string][] = [
  ['8%', '18%', 'spark', 'var(--sun)'], ['90%', '22%', 'star', 'var(--sun)'], ['12%', '78%', 'heart', 'var(--rose)'],
  ['86%', '74%', 'cloud', 'var(--ink)'], ['50%', '90%', 'spark', 'var(--lav-deep)'],
];

export default function Explainer2() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [playId, setPlayId] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setStarted(true); setStep(1); setPlayId(p => p + 1);
    let t = 0;
    for (let s = 2; s <= STEP_MS.length; s++) { t += STEP_MS[s - 1]; timers.current.push(setTimeout(() => setStep(s), t)); }
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const close = step >= 8;

  return (
    <div className="ex2-stage">
      <div className="ex2-bg" aria-hidden>
        {DOODLES.map(([x, y, ic, c], k) => (
          <span key={k} className="ex2-doodle" style={{ left: x, top: y, animationDelay: `${k * 0.7}s` }}>
            <Ic name={ic} size={26} stroke={c} fill={ic === 'cloud' ? 'var(--paper)' : c} sw={2.2} />
          </span>
        ))}
      </div>

      {started && (
        <div className="ex2-content" key={playId}>
          <div className="ex2-head">
            <EchoLogo size={44} />
            <div>
              <h1 className="display ex2-title">How Echo works</h1>
              <p className="ex2-subtitle">Talk it out · keep what matters · own it forever</p>
            </div>
          </div>

          <div className="ex2-flow">
            {NODES.map((n, i) => (
              <div key={i} className="ex2-cell">
                {i > 0 && <span className={'ex2-conn' + (step >= i + 2 ? ' on' : '')} />}
                <div className={'ex2-node' + (n.special ? ' ex2-node-key' : '') + (step >= i + 2 ? ' on' : '')}>
                  <span className="ex2-num">{i + 1}</span>
                  <span className="ex2-node-ic" style={{ background: n.c }}>
                    {n.special
                      ? <span className="ex2-marks"><LogoMark brand="walrus" size={17} /><LogoMark brand="sui" size={17} /></span>
                      : <Ic name={n.ic} size={26} />}
                  </span>
                  <div className="ex2-node-t">{n.t}</div>
                  <div className="ex2-node-s">{n.s}</div>
                </div>
              </div>
            ))}

            {/* loop-back: remembered → you talk */}
            <svg className={'ex2-loop' + (step >= 7 ? ' on' : '')} viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden>
              <path d="M97 16 C97 3, 80 2, 50 2 C20 2, 3 3, 3 14" fill="none" stroke="var(--ink)" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="2 1.6" />
              <path d="M3 14 l-1.6 -2.4 M3 14 l1.9 -2.2" fill="none" stroke="var(--ink)" strokeWidth="0.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className={'ex2-caption' + (step >= 7 ? ' on' : '')}>
            <Ic name="spark" size={15} stroke="var(--peach-deep)" fill="var(--peach-deep)" />
            Every session builds on the last — your memory, verifiable on <b>Walrus</b> &amp; <b>Sui</b>.
          </div>

          {close && (
            <div className="ex2-close">
              <span className="display ex2-close-h">Memory that’s actually yours.</span>
              <span className="ex2-badge"><LogoMark brand="walrus" size={16} /> Sui Overflow 2026 · <b>Walrus Track</b></span>
            </div>
          )}
        </div>
      )}

      {started && <div className="ex2-progress"><span key={playId} style={{ animationDuration: `${TOTAL}ms` } as CSS} /></div>}

      {!started && (
        <div className="ex2-start">
          <EchoLogo size={92} style={{ filter: 'drop-shadow(0 14px 30px rgba(237,156,116,.4))' }} />
          <h2 className="display ex2-start-h">Echo — how it works</h2>
          <p className="ex2-start-p">~20s · a simple flow · press play, then screen-record. Best fullscreen.</p>
          <button className="ex2-play" onClick={play}><Ic name="play" size={22} /> Play</button>
        </div>
      )}

      {started && close && <button className="ex2-replay" onClick={play}><Ic name="rewind" size={18} /> Replay</button>}
    </div>
  );
}
