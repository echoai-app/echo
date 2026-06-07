'use client';

import React, { useState } from 'react';
import { Doodles, Eyebrow, Btn, Ic } from '../ui';
import { useEcho } from '@/lib/store';

const ONBOARD = [
  { tag: '01 · meet echo', color: 'var(--peach)', ic: 'chat', loop: false,
    title: 'A space to think out loud.', body: "Talk openly, journal a feeling, or just check in. Echo listens, reflects gently, and helps you notice what's going on underneath — no scripts, no judgement." },
  { tag: '02 · how echo helps', color: 'var(--lav)', ic: 'lens', loop: true,
    title: 'Built on reflection patterns.', body: 'Echo gently guides you through an evidence-informed reflection loop — so a session actually goes somewhere, instead of going in circles.' },
  { tag: '03 · why it remembers', color: 'var(--sky)', ic: 'db', loop: false,
    title: 'It remembers what matters.', body: 'Most chats forget you the moment they end. Echo keeps the meaningful parts — your patterns, triggers, and what helped — as memories you own, stored verifiably on Walrus.' },
];
const LOOP_STEPS = ['Situation', 'Feeling', 'Thought', 'Body', 'Action', 'Reframe', 'Next step'];

export default function Onboarding() {
  const go = useEcho(s => s.go);
  const [i, setI] = useState(0);
  const c = ONBOARD[i];
  const next = () => (i < ONBOARD.length - 1 ? setI(i + 1) : go('consent'));
  return (
    <div className="bg-cream2" style={{ height: '100%', display: 'grid', placeItems: 'center', position: 'relative' }}>
      <Doodles />
      <div style={{ position: 'absolute', top: 30, left: 0, right: 0, display: 'grid', placeItems: 'center', zIndex: 3 }}>
        <div className="pdots">{ONBOARD.map((_, k) => <span key={k} className={'pdot ' + (k === i ? 'on' : '')} />)}</div>
      </div>
      <div className="card card-lg" key={i} style={{ width: 'min(900px,92vw)', background: c.color, padding: 32, position: 'relative', zIndex: 2, minHeight: 372, display: 'flex', alignItems: 'center' }}>
        <div className="up" style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 32, alignItems: 'center', width: '100%' }}>
          <div className="tile" style={{ width: 210, height: 210, display: 'grid', placeItems: 'center', background: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 38%, ${c.color}55, transparent 70%)` }} />
            <Ic name={c.ic} size={92} sw={2.1} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Eyebrow ic={c.ic}>{c.tag}</Eyebrow>
            <h2 className="display" style={{ fontSize: 'clamp(26px,3.4vw,40px)' }}>{c.title}</h2>
            <p style={{ margin: 0, fontSize: 17.5, lineHeight: 1.55, fontWeight: 600, maxWidth: 460 }}>{c.body}</p>
            {c.loop && (
              <div className="tile" style={{ background: 'var(--paper)', padding: '16px 18px', marginTop: 4, boxShadow: '3px 4px 0 var(--ink)' }}>
                <div className="kicker" style={{ marginBottom: 12, fontSize: 11 }}>the reflection loop</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px 7px', alignItems: 'center' }}>
                  {LOOP_STEPS.map((s, k) => {
                    const last = k === LOOP_STEPS.length - 1;
                    return (
                      <React.Fragment key={s}>
                        <span className="chip sm" style={{ background: last ? 'var(--sun)' : 'var(--cream-2)', fontSize: 13, padding: '7px 13px', boxShadow: '1.5px 2px 0 var(--ink)' }}>
                          {last && <Ic name="sprout" size={13} />}{s}
                        </span>
                        {!last && <Ic name="arrowR" size={13} stroke="var(--ink-faint)" sw={2.8} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, zIndex: 3 }}>
        {i > 0 && <Btn icon="arrowL" onClick={() => setI(i - 1)}>Back</Btn>}
        <Btn variant="primary" iconR="arrowR" onClick={next}>{i < ONBOARD.length - 1 ? 'Next' : 'Take me in'}</Btn>
      </div>
    </div>
  );
}
