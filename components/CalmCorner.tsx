'use client';

import { useEffect, useRef, useState } from 'react';
import { Ic, EchoLogo } from './ui';
import { useEcho } from '@/lib/store';

/* The Calm Corner — a small grounding companion in the bottom-left.
   Three quick tools (Breathe · Ground · Affirm) plus an in-place Support panel.
   Nothing here navigates away. */

const SUPPORT_EMAIL = 'echo.gethelp@gmail.com';
type Tab = 'breathe' | 'ground' | 'affirm' | 'support';

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
  { label: 'Breathe in…', ms: 4000, scale: 1.28 },
  { label: 'Hold', ms: 3000, scale: 1.28 },
  { label: 'Breathe out…', ms: 6000, scale: 0.86 },
];

// 5-4-3-2-1 grounding.
const GROUND = [
  { n: 5, text: 'things you can see', color: 'var(--sky)' },
  { n: 4, text: 'things you can feel', color: 'var(--peach)' },
  { n: 3, text: 'sounds you can hear', color: 'var(--lav)' },
  { n: 2, text: 'things you can smell', color: 'var(--mint)' },
  { n: 1, text: 'thing you can taste', color: 'var(--sun)' },
];

export function CalmCorner() {
  const { prefs } = useEcho();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('breathe');
  const [phase, setPhase] = useState(0);
  const [affirm, setAffirm] = useState(0);
  const [gIdx, setGIdx] = useState(0);
  const [taps, setTaps] = useState(0);
  const [breaths, setBreaths] = useState(0);
  const [burst, setBurst] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Breathing cycle — only while the Breathe tab is open.
  useEffect(() => {
    if (!open || tab !== 'breathe' || prefs.reducedMotion) return;
    let p = 0;
    let started = false;
    const tick = () => {
      setPhase(p);
      if (p === 0 && started) setBreaths(b => b + 1);
      if (p === PHASES.length - 1) started = true;
      timer.current = setTimeout(() => { p = (p + 1) % PHASES.length; tick(); }, PHASES[p].ms);
    };
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [open, tab, prefs.reducedMotion]);

  const openPanel = () => {
    setTab('breathe'); setPhase(0); setGIdx(0); setTaps(0); setBreaths(0);
    setAffirm(Math.floor(Math.random() * AFFIRMATIONS.length));
    setOpen(true);
  };
  const copyEmail = () => { try { navigator.clipboard.writeText(SUPPORT_EMAIL); } catch { /* noop */ } setCopied(true); setTimeout(() => setCopied(false), 1400); };

  const cur = PHASES[phase];
  const coreScale = prefs.reducedMotion ? 1 : cur.scale;
  const haloScale = prefs.reducedMotion ? 1.3 : cur.scale * 1.55;
  const g = GROUND[gIdx];

  return (
    <>
      <button className="calm-btn" onClick={() => (open ? setOpen(false) : openPanel())} title="Calm corner" aria-label="Open the calm corner">
        <Ic name={open ? 'x' : 'heart'} size={24} stroke="var(--ink)" fill={open ? 'none' : 'var(--rose)'} />
      </button>

      {open && (
        <div className="calm-pop" role="dialog" aria-label="Calm corner">
          <div className="calm-head">
            <EchoLogo size={36} />
            <div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1 }}>Calm corner</div>
              <div className="muted" style={{ fontWeight: 700, fontSize: 12 }}>{tab === 'support' ? 'we’re here for you' : 'a quick reset, anytime'}</div>
            </div>
          </div>

          {tab === 'support' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>Reach the Echo team any time — we read every note.</p>
              <div className="copy-field">
                <span className="mono" style={{ fontSize: 13 }}>{SUPPORT_EMAIL}</span>
                <button className={'copy-btn' + (copied ? ' done' : '')} onClick={copyEmail}>
                  <Ic name={copied ? 'check' : 'plus'} size={13} sw={3} /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn ghost sm" style={{ flex: 1 }} onClick={() => setTab('breathe')}><Ic name="arrowL" size={16} /> Back</button>
                <a className="btn primary sm" style={{ flex: 1, textDecoration: 'none' }} href={`mailto:${SUPPORT_EMAIL}?subject=Echo%20support`}><Ic name="bell" size={16} /> Email us</a>
              </div>
              <div className="muted tc" style={{ fontWeight: 600, fontSize: 11.5 }}>Echo is a reflection companion, not crisis care. In an emergency, contact local services.</div>
            </div>
          ) : (
            <>
              <div className="calm-tabs">
                <button className={'calm-tab' + (tab === 'breathe' ? ' on' : '')} onClick={() => setTab('breathe')}><Ic name="breeze" size={15} /> Breathe</button>
                <button className={'calm-tab' + (tab === 'ground' ? ' on' : '')} onClick={() => setTab('ground')}><Ic name="anchor" size={15} /> Ground</button>
                <button className={'calm-tab' + (tab === 'affirm' ? ' on' : '')} onClick={() => setTab('affirm')}><Ic name="heart" size={15} /> Affirm</button>
              </div>

              <div className="calm-body">
              {tab === 'breathe' && (
                <>
                  <div className="breathe-stage">
                    <span className="breathe-halo" style={{ transform: `scale(${haloScale})`, opacity: phase === 2 ? 0.1 : 0.22, transitionDuration: `${cur.ms}ms` }} />
                    <span className="breathe-halo" style={{ transform: `scale(${haloScale * 1.4})`, opacity: phase === 2 ? 0.06 : 0.14, transitionDuration: `${cur.ms}ms` }} />
                    <span className="breathe-core" style={{ transform: `scale(${coreScale})`, transitionDuration: `${cur.ms}ms` }}>
                      <Ic name="spark" size={22} stroke="#fff" fill="#fff" sw={2.2} />
                    </span>
                  </div>
                  <div className="breathe-phase">{prefs.reducedMotion ? 'Take a slow, kind breath' : cur.label}</div>
                  <p className="muted tc" style={{ fontWeight: 600, fontSize: 12.5, margin: '6px 0 10px' }}>In through your nose, out through your mouth.</p>
                  {breaths > 0 && <div className="tc"><span className="breath-count"><Ic name="leaf" size={13} /> {breaths} {breaths === 1 ? 'breath' : 'breaths'} together</span></div>}
                </>
              )}

              {tab === 'ground' && (
                <div className="tc">
                  <div className="muted" style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>5 · 4 · 3 · 2 · 1 — come back to now</div>
                  <div className="ground-num ground-tap" style={{ background: g.color }} role="button" tabIndex={0}
                    onClick={() => {
                      const nt = taps + 1;
                      setTaps(nt);
                      if (nt >= g.n) setTimeout(() => { setGIdx(i => (i + 1) % GROUND.length); setTaps(0); }, 420);
                    }}>{g.n - Math.min(taps, g.n) || '✓'}</div>
                  <div className="display" style={{ fontSize: 18, marginTop: 12 }}>{g.text}</div>
                  <div className="muted" style={{ fontWeight: 600, fontSize: 12.5, marginTop: 3 }}>tap the circle for each one you notice</div>
                  <div className="tap-dots">{Array.from({ length: g.n }).map((_, i) => <span key={i} className={'tap-dot' + (i < taps ? ' on' : '')} />)}</div>
                  <div className="ground-dots">{GROUND.map((_, i) => <span key={i} className={'ground-dot' + (i <= gIdx ? ' on' : '')} />)}</div>
                </div>
              )}

              {tab === 'affirm' && (
                <div className="tc" style={{ paddingTop: 6, position: 'relative' }}>
                  {burst > 0 && <span key={burst} className="heart-burst" aria-hidden>
                    {['-44px', '-18px', '4px', '26px', '50px'].map((hx, i) => <i key={i} style={{ ['--hx']: hx, animationDelay: (i * 0.06) + 's' } as React.CSSProperties}>{'❤️'}</i>)}
                  </span>}
                  <button style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 18, border: '3px solid var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--rose)', boxShadow: '3px 4px 0 var(--ink)', cursor: 'pointer' }}
                    onClick={() => setBurst(b => b + 1)} title="Send yourself some love" aria-label="Send yourself some love">
                    <Ic name="heart" size={28} stroke="var(--ink)" fill="var(--paper)" />
                  </button>
                  <p style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, lineHeight: 1.35 }}>{AFFIRMATIONS[affirm]}</p>
                  <button className="btn ghost sm" style={{ marginTop: 16 }} onClick={() => setAffirm((affirm + 1) % AFFIRMATIONS.length)}>
                    <Ic name="spark" size={16} /> Another
                  </button>
                </div>
              )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, paddingTop: 12, borderTop: '2.5px dashed var(--cream-3)' }}>
                <button className="linkbtn" style={{ fontSize: 13.5 }} onClick={() => setTab('support')}>
                  <Ic name="chat" size={15} /> Need to talk? Reach support
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
