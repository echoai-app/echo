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
      <div className="card card-lg" key={i} style={{ width: 'min(880px,90vw)', background: c.color, padding: 30, position: 'relative', zIndex: 2 }}>
        <div className="up" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 30, alignItems: 'center' }}>
          <div className="tile" style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}>
            <Ic name={c.ic} size={84} sw={2.2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Eyebrow>{c.tag}</Eyebrow>
            <h2 className="display">{c.title}</h2>
            <p style={{ margin: 0, fontSize: 18.5, lineHeight: 1.55, fontWeight: 600 }}>{c.body}</p>
            {c.loop && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 2 }}>
                {LOOP_STEPS.map((s, k) => (
                  <React.Fragment key={s}>
                    <span className="chip" style={{ background: k === LOOP_STEPS.length - 1 ? 'var(--sun)' : 'var(--paper)', fontSize: 13.5 }}>{s}</span>
                    {k < LOOP_STEPS.length - 1 && <Ic name="arrowR" size={14} stroke="var(--ink-soft)" />}
                  </React.Fragment>
                ))}
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
