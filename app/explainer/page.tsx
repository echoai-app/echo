'use client';

/* A ~60s auto-playing, animated explainer for Echo — open fullscreen and
   screen-record it. Built from Echo's own design system with 3D-depth motion. */

import { useEffect, useRef, useState } from 'react';
import { EchoLogo, Ic, LogoMark } from '@/components/ui';

const DUR = [5200, 8200, 11000, 14000, 12500, 8500]; // ms per scene
const TOTAL = DUR.reduce((a, b) => a + b, 0);

export default function Explainer() {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(-1);
  const [playId, setPlayId] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStarted(true);
    setPlayId(p => p + 1);
    setI(0);
    let t = 0;
    for (let s = 1; s < DUR.length; s++) {
      t += DUR[s - 1];
      timers.current.push(setTimeout(() => setI(s), t));
    }
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const atEnd = i === DUR.length - 1;

  return (
    <div className="exp-stage">
      <div className="exp-bg" aria-hidden>
        {[['8%', '16%', 'spark', 'var(--sun)'], ['90%', '20%', 'star', 'var(--sun)'], ['12%', '78%', 'heart', 'var(--rose)'],
          ['86%', '72%', 'cloud', 'var(--ink)'], ['50%', '8%', 'spark', 'var(--lav-deep)'], ['72%', '88%', 'star', 'var(--peach-deep)']]
          .map(([x, y, ic, c], k) => (
            <span key={k} className="exp-doodle" style={{ left: x, top: y, animationDelay: `${k * 0.8}s` }}>
              <Ic name={ic} size={26} stroke={c} fill={ic === 'cloud' ? 'var(--paper)' : c} sw={2.2} />
            </span>
          ))}
      </div>

      <div className="exp-scenes" key={playId}>
        {/* ── 1 · TITLE ── */}
        <section className={'exp-scene exp-center' + (i === 0 ? ' on' : '')}>
          <EchoLogo size={120} className="anim exp-logo-spin" />
          <h1 className="anim display exp-h1" style={{ animationDelay: '.25s' }}>echo</h1>
          <p className="anim exp-tag" style={{ animationDelay: '.5s' }}>The AI that <b>remembers you</b>.</p>
        </section>

        {/* ── 2 · THE PROBLEM ── */}
        <section className={'exp-scene' + (i === 1 ? ' on' : '')}>
          <div className="exp-col">
            <h2 className="anim display exp-h2">Most AI forgets you the second you leave.</h2>
            <div className="exp-row" style={{ marginTop: 26 }}>
              <div className="anim exp-card exp-fade-card" style={{ animationDelay: '.4s' }}>
                <Ic name="chat" size={20} /> <span>“…you were telling me about—”</span>
                <span className="exp-erase" />
              </div>
              <div className="anim exp-card exp-bad" style={{ animationDelay: '.9s' }}>
                <Ic name="db" size={20} /> <span>your words live on <b>their</b> servers</span>
                <span className="exp-x"><Ic name="x" size={18} stroke="#fff" sw={3} /></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 · THE EXPERIENCE ── */}
        <section className={'exp-scene' + (i === 2 ? ' on' : '')}>
          <div className="exp-col">
            <div className="anim exp-eyebrow">how it feels</div>
            <h2 className="anim display exp-h2" style={{ animationDelay: '.15s' }}>Just talk. Echo listens & reflects.</h2>
            <div className="anim exp-wave" style={{ animationDelay: '.5s' }}>
              {Array.from({ length: 11 }).map((_, k) => <i key={k} style={{ animationDelay: `${k * 0.07}s` }} />)}
            </div>
            <div className="exp-loop">
              {['Situation', 'Feeling', 'Thought', 'Body', 'Action', 'Reframe', 'Next step'].map((s, k) => (
                <span key={s} className="anim exp-chip" style={{ animationDelay: `${0.7 + k * 0.18}s` }}>{s}</span>
              ))}
            </div>
            <p className="anim exp-note" style={{ animationDelay: '2.1s' }}>Voice-first · talk over it any time · it knows your name</p>
          </div>
        </section>

        {/* ── 4 · MEMORY ON WALRUS + SUI (the core) ── */}
        <section className={'exp-scene' + (i === 3 ? ' on' : '')}>
          <div className="exp-col">
            <div className="anim exp-eyebrow">the part that matters</div>
            <h2 className="anim display exp-h2" style={{ animationDelay: '.15s' }}>Keep only what matters — and <i>own</i> it.</h2>
            <div className="exp-chain" style={{ perspective: 900 }}>
              <div className="anim exp-node" style={{ animationDelay: '.5s' }}>
                <Ic name="heart" size={26} stroke="var(--rose-deep)" fill="var(--rose)" />
                <span>a memory</span>
              </div>
              <span className="anim exp-arrow"><Ic name="arrowR" size={26} /></span>
              <div className="anim exp-node exp-node-walrus" style={{ animationDelay: '1.1s' }}>
                <LogoMark brand="walrus" size={26} />
                <span>Walrus blob</span>
                <small className="mono">blob_id…aZ9</small>
              </div>
              <span className="anim exp-arrow"><Ic name="arrowR" size={26} /></span>
              <div className="anim exp-node" style={{ animationDelay: '1.7s' }}>
                <Ic name="db" size={24} />
                <span>index blob</span>
              </div>
              <span className="anim exp-arrow"><Ic name="arrowR" size={26} /></span>
              <div className="anim exp-node exp-node-sui" style={{ animationDelay: '2.3s' }}>
                <LogoMark brand="sui" size={26} />
                <span>MemoryPointer</span>
                <small>Sui · wallet-signed</small>
              </div>
            </div>
            <p className="anim exp-note" style={{ animationDelay: '3s' }}>Real, independently verifiable on Walruscan & Suiscan. <b>Portable. Yours.</b></p>
          </div>
        </section>

        {/* ── 5 · HOW IT'S BUILT ── */}
        <section className={'exp-scene' + (i === 4 ? ' on' : '')}>
          <div className="exp-col">
            <div className="anim exp-eyebrow">built solo · ~3 weeks</div>
            <h2 className="anim display exp-h2" style={{ animationDelay: '.15s' }}>One product. One stack.</h2>
            <div className="exp-stack" style={{ perspective: 1100 }}>
              {[
                { t: 'Next.js · React 19 · TypeScript', s: 'the app shell', c: 'var(--paper)', ic: 'spark' },
                { t: 'React Three Fiber', s: 'the cozy 3D reflection room', c: 'var(--peach)', ic: 'home' },
                { t: 'Neural voice — Groq', s: 'real-time speech, barge-in', c: 'var(--sun)', ic: 'mic' },
                { t: 'Mnemos memory engine', s: 'extract · embed · recall', c: 'var(--lav)', ic: 'lens' },
                { t: 'Walrus + Sui', s: 'verifiable, user-owned memory', c: 'var(--mint)', ic: 'anchor' },
              ].map((l, k) => (
                <div key={l.t} className="anim exp-layer" style={{ background: l.c, animationDelay: `${0.45 + k * 0.22}s`, ['--lz' as string]: `${-k * 30}px` }}>
                  <span className="exp-layer-ic"><Ic name={l.ic} size={20} /></span>
                  <div><b>{l.t}</b><span>{l.s}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6 · CLOSE ── */}
        <section className={'exp-scene exp-center' + (i === 5 ? ' on' : '')}>
          <EchoLogo size={104} className="anim exp-logo-spin" />
          <h1 className="anim display exp-h1" style={{ fontSize: 'clamp(48px,9vw,104px)', animationDelay: '.2s' }}>echo</h1>
          <p className="anim exp-tag" style={{ animationDelay: '.4s' }}>The AI that remembers you.</p>
          <div className="anim exp-badge" style={{ animationDelay: '.7s' }}>
            <LogoMark brand="walrus" size={18} /> Sui Overflow 2026 · <b>Walrus Track</b>
          </div>
        </section>
      </div>

      {started && (
        <div className="exp-progress">
          <span key={playId} style={{ animationDuration: `${TOTAL}ms` }} />
        </div>
      )}

      {!started && (
        <div className="exp-start">
          <EchoLogo size={88} style={{ filter: 'drop-shadow(0 14px 30px rgba(237,156,116,.45))' }} />
          <h2 className="display" style={{ fontSize: 34, margin: '18px 0 6px' }}>Echo — animated explainer</h2>
          <p className="muted" style={{ fontWeight: 600, marginBottom: 22 }}>~1 min · press play, then screen-record. Best fullscreen.</p>
          <button className="exp-play" onClick={play}><Ic name="play" size={22} /> Play explainer</button>
        </div>
      )}

      {started && atEnd && (
        <button className="exp-replay" onClick={play} title="Replay"><Ic name="rewind" size={18} /> Replay</button>
      )}
    </div>
  );
}
