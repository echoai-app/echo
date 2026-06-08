'use client';

import React, { useEffect, useRef } from 'react';
import type { OrbState } from '../ui';

type CSS = React.CSSProperties;

/* ============================================================================
   ReflectionScene — the immersive "you're in the room" stage behind the orb.

   A first-person cozy room rendered in Echo's doodle style: you're sitting next
   to a doodle companion on a couch, a warm light between you. Mouse movement
   drives per-layer parallax + a subtle 3D tilt, so the room has real depth and
   feels alive. Pure SVG + GPU transforms — no WebGL. Honors reduced motion.
   ========================================================================== */

const INK = '#352A1F';

// One parallax layer. `d` = depth (px of travel at full cursor deflection):
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
            {/* seat shadow */}
            <ellipse cx="120" cy="236" rx="78" ry="13" fill="rgba(53,42,31,.12)" />

            {/* body / cozy sweater */}
            <path d="M52 168 q68 -34 136 0 q12 46 4 78 q-72 16 -144 0 q-8 -32 4 -78 Z"
              fill="var(--lav)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            {/* sweater fold hints */}
            <path d="M86 196 q34 14 68 0" fill="none" stroke="var(--lav-deep)" strokeWidth="3" strokeLinecap="round" />
            {/* arms resting in lap */}
            <path d="M58 182 q-14 36 18 54 q22 10 44 10 q22 0 44 -10 q32 -18 18 -54"
              fill="var(--lav)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            {/* hands */}
            <circle cx="98" cy="232" r="13" fill="#F6D9C0" stroke={INK} strokeWidth="4" />
            <circle cx="142" cy="232" r="13" fill="#F6D9C0" stroke={INK} strokeWidth="4" />

            {/* head group — bobs / tilts with state */}
            <g className="companion-head">
              {/* hair back */}
              <path d="M58 96 q62 -64 124 0 q6 30 -2 50 q-60 -26 -120 0 q-8 -20 -2 -50 Z"
                fill="var(--ink-soft)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
              {/* face */}
              <circle cx="120" cy="104" r="52" fill="#F8E4D2" stroke={INK} strokeWidth="4.5" />
              {/* hair front sweep */}
              <path d="M70 84 q22 -34 58 -30 q-26 12 -30 34 q-16 -8 -28 -4 Z"
                fill="var(--ink-soft)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              {/* cheeks */}
              <circle cx="92" cy="116" r="8.5" fill="var(--rose)" opacity=".55" />
              <circle cx="148" cy="116" r="8.5" fill="var(--rose)" opacity=".55" />
              {/* eyes (blink) */}
              <g className="companion-eyes">
                <circle cx="100" cy="100" r="6" fill={INK} />
                <circle cx="140" cy="100" r="6" fill={INK} />
                {/* eye sparkle */}
                <circle cx="102" cy="98" r="1.8" fill="#fff" />
                <circle cx="142" cy="98" r="1.8" fill="#fff" />
              </g>
              {/* brows (lift when listening) */}
              <g className="companion-brows" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
                <path d="M91 86 q9 -5 18 0" />
                <path d="M131 86 q9 -5 18 0" />
              </g>
              {/* soft mouth (talks when speaking) */}
              <path className="companion-mouth" d="M108 126 q12 12 24 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* tiny thought dots (only while thinking) */}
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

export function ReflectionScene({ state = 'idle' }: { state?: OrbState }) {
  const root = useRef<HTMLDivElement>(null);

  // Mouse-driven parallax: write smoothed --mx/--my (-1..1) onto the root.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;
      el.style.setProperty('--mx', cx.toFixed(4));
      el.style.setProperty('--my', cy.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="scene-3d" ref={root} aria-hidden>
      <div className="scene-tilt">
        <div className="scene-drift">

          {/* back wall + floor */}
          <Pf d={5} className="scene-wall" />
          <div className="scene-floorline" />

          {/* warm ambient glow (behind the orb) */}
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
              {/* back cushions */}
              <rect x="26" y="20" width="428" height="104" rx="30" fill="var(--peach)" stroke={INK} strokeWidth="5" />
              <line x1="240" y1="26" x2="240" y2="118" stroke={INK} strokeWidth="3.5" opacity=".5" />
              {/* seat */}
              <rect x="8" y="104" width="464" height="78" rx="26" fill="var(--peach-deep)" stroke={INK} strokeWidth="5" />
              {/* arms */}
              <rect x="0" y="84" width="46" height="104" rx="22" fill="var(--peach)" stroke={INK} strokeWidth="5" />
              <rect x="434" y="84" width="46" height="104" rx="22" fill="var(--peach)" stroke={INK} strokeWidth="5" />
              {/* "your" cushion (right, empty — first person) */}
              <rect x="300" y="112" width="150" height="62" rx="20" fill="var(--sun)" stroke={INK} strokeWidth="4" opacity=".9" />
            </svg>
          </Pf>

          {/* the doodle companion, sitting next to you (left of centre) */}
          <Pf d={33} style={{ left: '27%', bottom: '13%', width: 'clamp(180px,22vw,262px)', ['--tx']: '-50%' } as CSS}>
            <Companion state={state} />
          </Pf>

          {/* rug under the moment */}
          <Pf d={38} className="scene-rug" />

          {/* coffee table + two steaming mugs (front) */}
          <Pf d={46} style={{ left: '50%', bottom: '4%', width: 'min(360px,52%)', ['--tx']: '-50%' } as CSS}>
            <svg viewBox="0 0 320 150" width="100%">
              {/* steam */}
              <g className="scene-steam" fill="none" stroke="var(--ink-faint)" strokeWidth="3.4" strokeLinecap="round">
                <path d="M96 44 q-7 -10 0 -20 q7 -10 0 -20" />
                <path d="M232 44 q7 -10 0 -20 q-7 -10 0 -20" />
              </g>
              {/* mugs */}
              <g>
                <rect x="78" y="44" width="40" height="34" rx="9" fill="var(--sage)" stroke={INK} strokeWidth="4.5" />
                <path d="M118 52 q14 2 14 14 q0 12 -14 12" fill="none" stroke={INK} strokeWidth="4.5" />
                <rect x="206" y="44" width="40" height="34" rx="9" fill="var(--sky)" stroke={INK} strokeWidth="4.5" />
                <path d="M206 52 q-14 2 -14 14 q0 12 14 12" fill="none" stroke={INK} strokeWidth="4.5" />
              </g>
              {/* table top + legs */}
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
      {/* vignette sits above the parallax (no travel) for depth framing */}
      <div className="scene-vignette" />
    </div>
  );
}
