'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Ic, EchoLogo, type OrbState } from '../ui';
import { useEcho } from '@/lib/store';
import type { Room3DApi } from '../reflection/ImmersiveRoom3D';

type CSS = React.CSSProperties;

/* ============================================================================
   ReflectionScene — the immersive "you're seated in the room" stage.

   Default experience: a REAL 3D room (Three.js / R3F, lazy client-only chunk —
   see components/reflection/ImmersiveRoom3D.tsx) with drag-to-look. The CSS
   pseudo-3D room below remains as the automatic fallback whenever WebGL is
   unavailable, the renderer crashes/loses context, or the user prefers
   reduced motion / calm mode.
   ========================================================================== */

const INK = '#352A1F';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* Warm loading screen while the 3D room chunk + scene spin up in the background. */
function RoomLoading() {
  return (
    <div className="room-loading">
      <div className="room-loading-card">
        <EchoLogo size={62} className="room-loading-logo" />
        <div className="room-loading-title">Setting up your room…</div>
        <div className="room-loading-sub">Loading in the background — just a moment.</div>
        <div className="room-loading-dots"><span /><span /><span /></div>
      </div>
    </div>
  );
}

// One parallax layer. `d` = depth (px of travel at full look deflection):
// bigger = closer to you = moves more.
function Pf({ d, className = '', style, children }: {
  d: number; className?: string; style?: CSS; children?: React.ReactNode;
}) {
  return <div className={'pf ' + className} style={{ ['--d']: d, ...style } as CSS}>{children}</div>;
}

/* ---------------- the doodle companion (reacts to the conversation) -------- */
function Companion({ state }: { state: OrbState }) {
  const cls =
    state === 'listening' ? 'is-listening'
    : state === 'thinking' ? 'is-thinking'
    : state === 'speaking' ? 'is-speaking'
    : '';
  return (
    <div className={'companion ' + cls}>
      <div className="companion-lean">
        <div className="companion-figure">
          <svg viewBox="0 0 240 250" width="100%" aria-hidden>
            <ellipse cx="120" cy="236" rx="78" ry="13" fill="rgba(53,42,31,.12)" />
            {/* body / cozy sweater */}
            <path d="M52 168 q68 -34 136 0 q12 46 4 78 q-72 16 -144 0 q-8 -32 4 -78 Z"
              fill="var(--lav)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M86 196 q34 14 68 0" fill="none" stroke="var(--lav-deep)" strokeWidth="3" strokeLinecap="round" />
            {/* arms resting in lap */}
            <path d="M58 182 q-14 36 18 54 q22 10 44 10 q22 0 44 -10 q32 -18 18 -54"
              fill="var(--lav)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <circle cx="98" cy="232" r="13" fill="#F6D9C0" stroke={INK} strokeWidth="4" />
            <circle cx="142" cy="232" r="13" fill="#F6D9C0" stroke={INK} strokeWidth="4" />
            {/* head — bobs / tilts with state */}
            <g className="companion-head">
              <path d="M58 96 q62 -64 124 0 q6 30 -2 50 q-60 -26 -120 0 q-8 -20 -2 -50 Z"
                fill="var(--ink-soft)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
              <circle cx="120" cy="104" r="52" fill="#F8E4D2" stroke={INK} strokeWidth="4.5" />
              <path d="M70 84 q22 -34 58 -30 q-26 12 -30 34 q-16 -8 -28 -4 Z"
                fill="var(--ink-soft)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              <circle cx="92" cy="116" r="8.5" fill="var(--rose)" opacity=".55" />
              <circle cx="148" cy="116" r="8.5" fill="var(--rose)" opacity=".55" />
              <g className="companion-eyes">
                <circle cx="100" cy="100" r="6" fill={INK} />
                <circle cx="140" cy="100" r="6" fill={INK} />
                <circle cx="102" cy="98" r="1.8" fill="#fff" />
                <circle cx="142" cy="98" r="1.8" fill="#fff" />
              </g>
              <g className="companion-brows" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
                <path d="M91 86 q9 -5 18 0" />
                <path d="M131 86 q9 -5 18 0" />
              </g>
              <path className="companion-mouth" d="M108 126 q12 12 24 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* thought dots (only while reflecting) */}
            <g className="companion-think">
              <circle cx="186" cy="64" r="4" fill="var(--lav-deep)" />
              <circle cx="198" cy="50" r="5.5" fill="var(--lav-deep)" />
              <circle cx="214" cy="34" r="7.5" fill="var(--lav-deep)" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

function CssReflectionScene({ state = 'idle' }: { state?: OrbState }) {
  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  // All look-state in a ref so dragging never triggers React re-renders.
  const view = useRef({ drag: false, lx: 0, ly: 0, tx: 0, ty: 0, cx: 0, cy: 0 });
  const [hintGone, setHintGone] = useState(false);

  // Smooth render loop: lerp toward the dragged target + a gentle idle drift,
  // and write --mx/--my onto the scene root. Drag handlers just set the target.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const tick = () => {
      const v = view.current;
      v.cx += (v.tx - v.cx) * 0.09;
      v.cy += (v.ty - v.cy) * 0.09;
      const t = performance.now() * 0.0004;
      const dx = reduce ? 0 : Math.sin(t) * 0.05;
      const dy = reduce ? 0 : Math.cos(t * 0.7) * 0.035;
      el.style.setProperty('--mx', (v.cx + dx).toFixed(4));
      el.style.setProperty('--my', (v.cy + dy).toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const v = view.current;
    v.drag = true; v.lx = e.clientX; v.ly = e.clientY;
    surface.current?.setPointerCapture(e.pointerId);
    surface.current?.classList.add('grabbing');
    if (!hintGone) setHintGone(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const v = view.current;
    if (!v.drag) return;
    const w = window.innerWidth, h = window.innerHeight;
    v.tx = clamp(v.tx + (e.clientX - v.lx) / (w * 0.5), -1, 1);
    v.ty = clamp(v.ty + (e.clientY - v.ly) / (h * 0.8), -0.55, 0.55);
    v.lx = e.clientX; v.ly = e.clientY;
  };
  const onUp = (e: React.PointerEvent) => {
    view.current.drag = false;
    surface.current?.releasePointerCapture(e.pointerId);
    surface.current?.classList.remove('grabbing');
  };
  const reset = () => { view.current.tx = 0; view.current.ty = 0; };

  return (
    <div className="scene-3d" ref={root}>
      {/* drag-to-look surface (sits over the room, under the dock/panels) */}
      <div ref={surface} className="scene-drag" onPointerDown={onDown} onPointerMove={onMove}
        onPointerUp={onUp} onPointerCancel={onUp} aria-hidden />

      <div className="scene-tilt">
        <div className="scene-drift">

          <Pf d={5} className="scene-wall" />
          <div className="scene-floorline" />
          <Pf d={18} className="scene-glow" />

          {/* window with a sunset (left, far) */}
          <Pf d={15} style={{ left: '4%', top: '11%', width: 'clamp(110px,13vw,168px)' }}>
            <svg viewBox="0 0 140 162" width="100%">
              <defs>
                <linearGradient id="rsSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F7CBA4" /><stop offset="0.55" stopColor="#E7C0DE" /><stop offset="1" stopColor="#CBD8F0" />
                </linearGradient>
              </defs>
              <rect x="8" y="8" width="124" height="132" rx="16" fill="#F2DEBE" stroke={INK} strokeWidth="5" />
              <rect x="20" y="20" width="100" height="108" rx="8" fill="url(#rsSky)" stroke={INK} strokeWidth="3" />
              <circle cx="92" cy="46" r="12" fill="#F5CE74" stroke={INK} strokeWidth="3" />
              <path d="M30 104c10-16 22-16 34-2 6-7 14-6 18 2Z" fill="#fff" opacity="0.85" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
              <line x1="70" y1="20" x2="70" y2="128" stroke={INK} strokeWidth="3" />
              <line x1="20" y1="74" x2="120" y2="74" stroke={INK} strokeWidth="3" />
              <rect x="2" y="138" width="136" height="13" rx="5" fill="#E3C397" stroke={INK} strokeWidth="4" />
            </svg>
          </Pf>

          {/* memory notes pinned to the wall (mid-far) */}
          <Pf d={22} style={{ left: '23%', top: '8%', width: 'clamp(118px,15vw,176px)' }}>
            <div className="wall-notes">
              <div className="wall-note n1">a walk helped</div>
              <div className="wall-note n2">one small step</div>
              <div className="wall-note n3">you showed up</div>
            </div>
          </Pf>

          {/* shelf · frame · plant (right, far) */}
          <Pf d={19} style={{ right: '5%', top: '13%', width: 'clamp(108px,13vw,150px)' }}>
            <svg viewBox="0 0 150 102" width="100%">
              <rect x="14" y="6" width="64" height="50" rx="6" fill="#FFFDF8" stroke={INK} strokeWidth="4" />
              <path d="M20 48l13-19 9 11 8-13 12 21Z" fill="#A9C9E9" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <circle cx="61" cy="20" r="5" fill="#F5CE74" stroke={INK} strokeWidth="2.5" />
              <path d="M97 34h22l-4 22h-14Z" fill="#F4B89A" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
              <g fill="none" stroke="#7FC295" strokeWidth="3.4" strokeLinecap="round"><path d="M108 34c-6-8-7-15-7-19" /><path d="M108 34c6-8 9-13 12-16" /><path d="M108 34c0-10 0-17 0-21" /></g>
              <rect x="2" y="58" width="146" height="11" rx="4" fill="#E3C397" stroke={INK} strokeWidth="4" />
            </svg>
          </Pf>

          {/* pendant light (center top) */}
          <Pf d={11} style={{ left: '50%', top: 0, width: 60, ['--tx']: '-50%' } as CSS}>
            <svg viewBox="0 0 80 84" width="100%">
              <line x1="40" y1="0" x2="40" y2="28" stroke={INK} strokeWidth="3.5" />
              <ellipse cx="40" cy="62" rx="20" ry="5" fill="#F8E6B8" stroke={INK} strokeWidth="3" />
              <path d="M22 54a18 16 0 0 1 36 0Z" fill="#F5CE74" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </Pf>

          {/* the couch you share (mid) */}
          <Pf d={28} className="scene-couch" style={{ left: '50%', bottom: '11%', width: 'min(660px,80%)', ['--tx']: '-50%' } as CSS}>
            <svg viewBox="0 0 480 210" width="100%">
              <rect x="26" y="20" width="428" height="104" rx="30" fill="var(--peach)" stroke={INK} strokeWidth="5" />
              <line x1="240" y1="26" x2="240" y2="118" stroke={INK} strokeWidth="3.5" opacity=".5" />
              <rect x="8" y="104" width="464" height="78" rx="26" fill="var(--peach-deep)" stroke={INK} strokeWidth="5" />
              <rect x="0" y="84" width="46" height="104" rx="22" fill="var(--peach)" stroke={INK} strokeWidth="5" />
              <rect x="434" y="84" width="46" height="104" rx="22" fill="var(--peach)" stroke={INK} strokeWidth="5" />
              <rect x="300" y="112" width="150" height="62" rx="20" fill="var(--sun)" stroke={INK} strokeWidth="4" opacity=".9" />
            </svg>
          </Pf>

          {/* the doodle companion, across the table (left of centre) */}
          <Pf d={33} style={{ left: '27%', bottom: '13%', width: 'clamp(180px,22vw,262px)', ['--tx']: '-50%' } as CSS}>
            <Companion state={state} />
          </Pf>

          <Pf d={38} className="scene-rug" />

          {/* small cozy table + two steaming mugs (front) */}
          <Pf d={46} style={{ left: '50%', bottom: '4%', width: 'min(360px,52%)', ['--tx']: '-50%' } as CSS}>
            <svg viewBox="0 0 320 150" width="100%">
              <g className="scene-steam" fill="none" stroke="var(--ink-faint)" strokeWidth="3.4" strokeLinecap="round">
                <path d="M96 44 q-7 -10 0 -20 q7 -10 0 -20" />
                <path d="M232 44 q7 -10 0 -20 q-7 -10 0 -20" />
              </g>
              <rect x="78" y="44" width="40" height="34" rx="9" fill="var(--sage)" stroke={INK} strokeWidth="4.5" />
              <path d="M118 52 q14 2 14 14 q0 12 -14 12" fill="none" stroke={INK} strokeWidth="4.5" />
              <rect x="206" y="44" width="40" height="34" rx="9" fill="var(--sky)" stroke={INK} strokeWidth="4.5" />
              <path d="M206 52 q-14 2 -14 14 q0 12 14 12" fill="none" stroke={INK} strokeWidth="4.5" />
              <ellipse cx="160" cy="98" rx="150" ry="30" fill="#E3C397" stroke={INK} strokeWidth="5" />
              <ellipse cx="160" cy="92" rx="150" ry="28" fill="#F0D9B4" stroke={INK} strokeWidth="4" />
              <rect x="44" y="112" width="9" height="30" rx="4" fill={INK} />
              <rect x="267" y="112" width="9" height="30" rx="4" fill={INK} />
            </svg>
          </Pf>

          {/* foreground potted plant (closest, left) */}
          <Pf d={54} style={{ left: '6%', bottom: '4%', width: 'clamp(78px,9vw,104px)' }}>
            <svg viewBox="0 0 100 122" width="100%">
              <g fill="#AEDAB9" stroke={INK} strokeWidth="3.4" strokeLinejoin="round">
                <path d="M50 72C40 42 22 36 18 32 31 30 48 42 50 72Z" />
                <path d="M50 72C60 42 78 36 82 32 69 30 52 42 50 72Z" />
              </g>
              <path d="M50 74C48 40 50 24 50 18 52 28 54 46 50 74Z" fill="#7FC295" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
              <path d="M30 72h40l-6 38a6 6 0 0 1-6 5H42a6 6 0 0 1-6-5Z" fill="var(--peach)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              <rect x="26" y="66" width="48" height="12" rx="5" fill="var(--peach-deep)" stroke={INK} strokeWidth="4" />
            </svg>
          </Pf>

          {/* floor lamp (closest, right) */}
          <Pf d={50} style={{ right: '6%', bottom: '5%', width: 'clamp(64px,8vw,84px)' }}>
            <svg viewBox="0 0 90 204" width="100%">
              <ellipse cx="45" cy="36" rx="42" ry="34" fill="#F5CE74" opacity="0.30" />
              <path d="M26 14h38l8 36H18Z" fill="#FBF1E0" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              <rect x="43" y="50" width="4.5" height="124" fill={INK} />
              <path d="M26 180h38l-7 12H33Z" fill="var(--lav)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </Pf>

          {/* drifting light motes (closest) */}
          <Pf d={66} className="motes">
            {[
              { x: '18%', y: '64%', s: 7, t: '8s', dl: '0s' },
              { x: '34%', y: '38%', s: 5, t: '11s', dl: '1.6s' },
              { x: '52%', y: '54%', s: 9, t: '9.5s', dl: '.7s' },
              { x: '63%', y: '32%', s: 6, t: '12s', dl: '2.4s' },
              { x: '74%', y: '60%', s: 8, t: '10s', dl: '1.1s' },
              { x: '46%', y: '24%', s: 4, t: '13s', dl: '3.1s' },
              { x: '86%', y: '46%', s: 6, t: '9s', dl: '.4s' },
            ].map((m, i) => (
              <span key={i} className="mote" style={{ left: m.x, top: m.y, width: m.s, height: m.s, ['--t']: m.t, animationDelay: m.dl } as CSS} />
            ))}
          </Pf>

        </div>
      </div>

      <div className="scene-vignette" />

      {/* look-around hint (fades on first drag) + reset view */}
      {!hintGone && <div className="scene-hint"><Ic name="lens" size={15} /> drag to look · tap the room</div>}
      <button className="scene-reset" onClick={reset} title="Recenter view" aria-label="Recenter view">
        <Ic name="rewind" size={17} sw={2.7} />
      </button>

      {/* unobtrusive positioning note */}
      <div className="scene-note">Echo is for reflection &amp; self-awareness — not medical or crisis care.</div>
    </div>
  );
}

/* ============================================================================
   3D-first wrapper — real Three.js room by default, CSS room as fallback.
   ========================================================================== */

// Lazy client-only chunk: three/R3F never load on first paint or for fallback users.
const ImmersiveRoom3D = dynamic(() => import('../reflection/ImmersiveRoom3D'), {
  ssr: false,
  loading: () => <RoomLoading />,
});

function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// If the 3D canvas throws for any reason, swap to the CSS room instead of crashing.
class SceneBoundary extends React.Component<{ onFail: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function ReflectionScene({ state = 'idle', onMode }: { state?: OrbState; onMode?: (m: '3d' | 'css') => void }) {
  const calm = useEcho(s => s.prefs.reducedMotion);
  const [mode, setMode] = useState<'boot' | '3d' | 'css'>('boot');
  const [hintGone, setHintGone] = useState(false);
  const api = useRef<Room3DApi | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const next = reduce || calm || !webglOK() ? 'css' : '3d';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL/motion capability can only be detected client-side, after mount
    setMode(next);
    onMode?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm]);
  const fail = () => { setMode('css'); onMode?.('css'); };

  if (mode === 'css') return <CssReflectionScene state={state} />;
  if (mode === 'boot') return <RoomLoading />;

  return (
    <div style={{ position: 'absolute', inset: 0 }} onPointerDownCapture={() => { if (!hintGone) setHintGone(true); }}>
      <SceneBoundary onFail={fail}>
        <ImmersiveRoom3D state={state} apiRef={api} onFail={fail} />
      </SceneBoundary>

      <div className="scene-vignette" style={{ zIndex: 4 }} />

      {!hintGone && <div className="scene-hint"><Ic name="lens" size={15} /> drag to look · tap the room</div>}
      <button className="scene-reset" onClick={() => api.current?.reset()} title="Recenter view" aria-label="Recenter view">
        <Ic name="rewind" size={17} sw={2.7} />
      </button>

      <div className="scene-note">Echo is for reflection &amp; self-awareness — not medical or crisis care.</div>
    </div>
  );
}
