'use client';

import { useEffect, useRef, useState } from 'react';
import { Ic } from './ui';
import { useEcho } from '@/lib/store';

/* A small grounding companion that lives in the bottom-left corner.
   Tap the orb → a calm popover with a guided breathing pace and a gentle
   affirmation. Always available — a quick reset, no session needed. */

const AFFIRMATIONS = [
  'You’re allowed to take up space.',
  'This feeling is real — and it will pass.',
  'You’re doing better than you think.',
  'One small step is still a step.',
  'It’s okay to rest. Rest is doing something.',
  'You came back. That matters.',
  'You don’t have to carry it all at once.',
  'Be as kind to yourself as you’d be to a friend.',
];

// Inhale → hold → exhale, with a longer, calming out-breath.
const PHASES = [
  { label: 'Breathe in…', ms: 4000, scale: 1.42 },
  { label: 'Hold', ms: 3000, scale: 1.42 },
  { label: 'Breathe out…', ms: 6000, scale: 0.82 },
];

export function CalmCorner() {
  const { prefs, go } = useEcho();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState(0);
  const [affirm, setAffirm] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drive the breathing cycle while open (respect reduced motion).
  useEffect(() => {
    if (!open || prefs.reducedMotion) return;
    let p = 0;
    const tick = () => {
      setPhase(p);
      timer.current = setTimeout(() => { p = (p + 1) % PHASES.length; tick(); }, PHASES[p].ms);
    };
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [open, prefs.reducedMotion]);

  const openPanel = () => { setAffirm(Math.floor(Math.random() * AFFIRMATIONS.length)); setPhase(0); setOpen(true); };
  const cur = PHASES[phase];
  const scale = prefs.reducedMotion ? 1 : cur.scale;

  return (
    <>
      <button className="calm-btn" onClick={() => (open ? setOpen(false) : openPanel())} title="A calm moment" aria-label="Open a calm moment">
        <Ic name={open ? 'x' : 'heart'} size={24} stroke="var(--ink)" fill={open ? 'none' : 'var(--rose)'} />
      </button>

      {open && (
        <div className="calm-pop" role="dialog" aria-label="A calm moment">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="eyebrow" style={{ boxShadow: '1.5px 2px 0 var(--ink)' }}><Ic name="leaf" size={14} /> a calm moment</span>
          </div>

          <div className="breathe-ring" style={{ transform: `scale(${scale})`, transitionDuration: `${cur.ms}ms` }}>
            <Ic name="spark" size={26} stroke="#fff" fill="#fff" sw={2.2} />
          </div>
          <div className="breathe-phase" style={{ marginBottom: 14 }}>{prefs.reducedMotion ? 'Take a slow breath' : cur.label}</div>

          <div className="calm-affirm" style={{ marginBottom: 14 }}>
            <Ic name="heart" size={16} stroke="var(--rose-deep)" fill="var(--rose)" />
            <span>{AFFIRMATIONS[affirm]}</span>
          </div>

          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn ghost sm" style={{ flex: 1 }} onClick={() => setAffirm((affirm + 1) % AFFIRMATIONS.length)}>
              <Ic name="spark" size={16} /> Another
            </button>
            <button className="btn lav sm" style={{ flex: 1 }} onClick={() => { setOpen(false); go('help'); }}>
              <Ic name="help" size={16} /> Support
            </button>
          </div>
        </div>
      )}
    </>
  );
}
