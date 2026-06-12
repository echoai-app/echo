'use client';

import React, { useState } from 'react';
import { Doodles, Eyebrow, Btn, Ic } from '../ui';
import { useEcho } from '@/lib/store';

type CSS = React.CSSProperties;

const ONBOARD = [
  { num: '01', tag: 'meet echo', color: 'var(--peach)', deep: 'var(--peach-deep)', ic: 'chat', loop: false,
    title: 'A space to think out loud.', body: "Talk openly, journal a feeling, or just check in. Echo listens, reflects gently, and helps you notice what's going on underneath — no scripts, no judgement." },
  { num: '02', tag: 'how echo helps', color: 'var(--lav)', deep: 'var(--lav-deep)', ic: 'lens', loop: true,
    title: 'Built on reflection patterns.', body: 'Echo gently guides you through an evidence-informed reflection loop — so a session actually goes somewhere, instead of going in circles.' },
  { num: '03', tag: 'why it remembers', color: 'var(--sky)', deep: 'var(--sky-deep)', ic: 'db', loop: false,
    title: 'It remembers what matters.', body: 'Most chats forget you the moment they end. Echo keeps the meaningful parts — your patterns, triggers, and what helped — as memories you own, stored verifiably on Walrus.' },
];
const LOOP_STEPS = ['Situation', 'Feeling', 'Thought', 'Body', 'Action', 'Reframe', 'Next step'];

export default function Onboarding() {
  const go = useEcho(s => s.go);
  const [i, setI] = useState(0);
  const c = ONBOARD[i];
  const last = i === ONBOARD.length - 1;
  const next = () => (last ? go('consent') : setI(i + 1));

  return (
    <div className="bg-cream2 ob-page" style={{ height: '100%', position: 'relative' }}>
      <Doodles />

      <div className="card card-lg up" key={i} style={{ width: 'min(940px,92vw)', background: c.color, padding: 'clamp(26px,4vw,40px)', position: 'relative', zIndex: 2, minHeight: 'min(424px, 62dvh)', display: 'flex', alignItems: 'center', overflow: 'hidden', animation: 'up .45s cubic-bezier(.2,.8,.2,1) both' }}>
        {/* big faint step number watermark */}
        <div style={{ position: 'absolute', right: 'clamp(10px,3vw,40px)', top: -18, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(150px,22vw,240px)', color: 'rgba(53,42,31,.07)', lineHeight: 1, pointerEvents: 'none', zIndex: 0, userSelect: 'none' }}>{c.num}</div>

        <div className="ob-grid" style={{ position: 'relative', zIndex: 1 }}>
          {/* illustrated sticker disc */}
          <div className="ob-disc" style={{ position: 'relative', width: 240, height: 240, display: 'grid', placeItems: 'center', justifySelf: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--ink)', background: `radial-gradient(circle at 38% 30%, var(--paper), ${c.color} 78%)`, boxShadow: '5px 6px 0 var(--ink)' }} />
            <span className="doodle float" style={{ top: '2%', right: '6%', ['--r']: '0deg' } as CSS}><Ic name="spark" size={22} stroke="var(--sun)" fill="var(--sun)" sw={2.2} /></span>
            <span className="doodle float" style={{ bottom: '4%', left: '2%', ['--r']: '0deg', animationDelay: '-2s' } as CSS}><Ic name="heart" size={18} stroke="var(--rose-deep)" fill="var(--rose)" sw={2.2} /></span>
            <span className="doodle float" style={{ top: '46%', left: '-4%', ['--r']: '0deg', animationDelay: '-4s' } as CSS}><Ic name="star" size={15} stroke={c.deep} fill={c.deep} sw={2.2} /></span>
            <span style={{ position: 'relative', zIndex: 1, display: 'grid', placeItems: 'center' }}><Ic name={c.ic} size={104} sw={2} stroke="var(--ink)" /></span>
          </div>

          {/* content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Eyebrow ic={c.ic}>{c.num} · {c.tag}</Eyebrow>
            <h2 className="display" style={{ fontSize: 'clamp(23px,3.4vw,42px)', lineHeight: 1.08 }}>{c.title}</h2>
            <p style={{ margin: 0, fontSize: 'clamp(14px,1.6vw,17.5px)', lineHeight: 1.5, fontWeight: 600, maxWidth: 470 }}>{c.body}</p>
            {c.loop && (
              <div className="tile" style={{ background: 'var(--paper)', padding: '15px 18px', marginTop: 6, boxShadow: '3px 4px 0 var(--ink)' }}>
                <div className="kicker" style={{ marginBottom: 11, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic name="rewind" size={14} /> the reflection loop</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px 6px', alignItems: 'center' }}>
                  {LOOP_STEPS.map((s, k) => {
                    const lastStep = k === LOOP_STEPS.length - 1;
                    return (
                      <React.Fragment key={s}>
                        <span className="chip sm" style={{ background: lastStep ? 'var(--sun)' : 'var(--cream-2)', fontSize: 12.5, padding: '6px 12px', boxShadow: '1.5px 2px 0 var(--ink)' }}>
                          {lastStep && <Ic name="sprout" size={13} />}{s}
                        </span>
                        {!lastStep && <Ic name="arrowR" size={12} stroke="var(--ink-faint)" sw={2.8} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* progress + nav */}
      <div className="ob-nav">
        <div className="pdots">{ONBOARD.map((_, k) => <span key={k} className={'pdot ' + (k === i ? 'on' : '')} />)}</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
          {i > 0 && <Btn icon="arrowL" onClick={() => setI(i - 1)}>Back</Btn>}
          <Btn variant="primary" iconR="arrowR" onClick={next}>{last ? 'Take me in' : 'Next'}</Btn>
          {!last && <button className="linkbtn" onClick={() => go('consent')}>Skip</button>}
        </div>
      </div>
    </div>
  );
}
