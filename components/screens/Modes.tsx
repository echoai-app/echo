'use client';

import React, { useEffect, useState } from 'react';
import { AppBar } from '../chrome';
import { Doodles, Ic, Orb } from '../ui';
import { useEcho, displayName } from '@/lib/store';
import { useIdentity } from '../identity';
import { MODES, type EchoMode } from '@/lib/echo/modes';

type CSS = React.CSSProperties;

function greetCtx() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', mood: 'peach', sub: 'A fresh start — how are you arriving today?' };
  if (h < 18) return { text: 'Good afternoon', mood: 'peach', sub: 'A good moment to pause and check in.' };
  return { text: 'Good evening', mood: 'lav', sub: 'Let’s unwind and reflect on your day.' };
}

// a small, calm strip of recent reflection intensity — only for returning users
function RhythmStrip({ trend }: { trend: { when: string; value: number }[] }) {
  const data = trend.slice(-12);
  if (!data.length) return null;
  const band = (v: number) => (v >= 7 ? 'var(--rose)' : v >= 4 ? 'var(--sun)' : 'var(--mint)');
  return (
    <div className="up d2 home2-rhythm">
      <span className="home2-rhythm-label">your recent rhythm</span>
      <div className="home2-rhythm-bars">
        {data.map((d, i) => (
          <span key={i} className="home2-rhythm-bar" style={{ height: `${8 + (Math.min(10, Math.max(1, d.value)) / 10) * 22}px`, background: band(d.value) }}
            title={`${new Date(d.when).toLocaleDateString()} · ${d.value}/10`} />
        ))}
      </div>
    </div>
  );
}

export default function Modes() {
  const { go, name, startSession, journey, setJourney, lastIndexBlob } = useEcho();
  const id = useIdentity();
  const t = greetCtx();
  const [focus, setFocus] = useState<EchoMode>(MODES[0]);
  const [showFocus, setShowFocus] = useState(false);

  // returning users often go straight into a session — pre-warm the 3D room
  useEffect(() => { import('@/components/reflection/ImmersiveRoom3D'); }, []);
  // quietly load stats for the small count (no UI depends on it being ready)
  useEffect(() => {
    if (!id.ready || !id.userId || journey) return;
    let c = false;
    (async () => {
      try {
        const r = await fetch(`/api/journey?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}${lastIndexBlob ? `&index_blob_id=${encodeURIComponent(lastIndexBlob)}` : ''}`);
        const d = await r.json();
        if (!c) setJourney(d);
      } catch { /* fine without it */ }
    })();
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId, journey]);

  const begin = () => { startSession({ mode: focus.id, modeTitle: focus.title }); go('setup'); };
  const reflections = journey?.sessions.length ?? 0;
  const hasHistory = reflections > 0;
  const trend = journey?.intensity_trend ?? [];

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="home2">

          {/* a calm, living greeting */}
          <div className="up d1 home2-greet">
            <div className="home2-orb"><Orb size={110} state="idle" mood={t.mood} /></div>
            <h2 className="display" style={{ fontSize: 'clamp(26px,4vw,40px)', lineHeight: 1.05 }}>{t.text}, <span style={{ color: 'var(--peach-deep)' }}>{displayName(name)}</span>.</h2>
            <p className="lede" style={{ margin: 0, maxWidth: 380 }}>{t.sub}</p>
            {hasHistory && <span className="home2-count"><Ic name="leaf" size={13} /> {reflections} reflection{reflections === 1 ? '' : 's'} kept</span>}
          </div>

          {hasHistory && <RhythmStrip trend={trend} />}

          {/* THE one obvious action */}
          <button className="up d2 home2-start" onClick={begin}>
            <span className="home2-start-orb"><Ic name="mic" size={34} stroke="var(--ink)" /></span>
            <span className="home2-start-text">
              <b>Start reflecting</b>
              <span>Just talk — Echo listens, reflects, and remembers what matters.</span>
            </span>
            <Ic name="arrowR" size={26} stroke="var(--ink)" />
          </button>

          {/* optional focus — hidden until asked for, so it never adds noise */}
          <div className="up d3 home2-focus">
            <button className="home2-focus-toggle" onClick={() => setShowFocus(s => !s)} aria-expanded={showFocus}>
              <Ic name={focus.ic} size={15} /> Focus: <b>{focus.title}</b>
              <Ic name={showFocus ? 'arrowL' : 'arrowR'} size={14} stroke="var(--ink-faint)" />
            </button>
            {showFocus && (
              <div className="home2-pills">
                {MODES.map((m) => (
                  <button key={m.id} className={'mode-pill' + (focus.id === m.id ? ' on' : '')} style={{ ['--pc']: m.color } as CSS}
                    onClick={() => { setFocus(m); }}>
                    <Ic name={m.ic} size={17} /> <span>{m.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* quiet secondary doorways */}
          <div className="up d4 home2-more">
            <button className="home2-link" onClick={() => go('recall')}>
              <Ic name="rewind" size={17} /> Continue from last time
            </button>
            <span className="home2-dot" />
            <button className="home2-link" onClick={() => go('timeline')}>
              <Ic name="map" size={17} /> Your journey
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
