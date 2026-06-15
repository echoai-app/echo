'use client';

import React, { useEffect, useState } from 'react';
import { AppBar } from '../chrome';
import { Doodles, Ic } from '../ui';
import { useEcho, displayName } from '@/lib/store';
import { useIdentity } from '../identity';
import { MODES, type EchoMode } from '@/lib/echo/modes';

type CSS = React.CSSProperties;

function greetCtx() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', ic: 'sun', bg: 'var(--sun)' };
  if (h < 18) return { text: 'Good afternoon', ic: 'sun', bg: 'var(--peach)' };
  return { text: 'Good evening', ic: 'moon', bg: 'var(--lav)' };
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

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="home2">

          {/* a calm greeting */}
          <div className="up d1 home2-greet">
            <div className="home2-greet-ic">
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--ink)', background: `radial-gradient(circle at 38% 32%, var(--paper), ${t.bg} 82%)`, boxShadow: '3px 4px 0 var(--ink)' }} />
              <Ic name={t.ic} size={30} sw={2.3} stroke="var(--ink)" />
            </div>
            <h2 className="display" style={{ fontSize: 'clamp(26px,4vw,40px)', lineHeight: 1.05 }}>{t.text}, <span style={{ color: 'var(--peach-deep)' }}>{displayName(name)}</span>.</h2>
            {hasHistory && <span className="home2-count"><Ic name="leaf" size={13} /> {reflections} reflection{reflections === 1 ? '' : 's'} kept</span>}
          </div>

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
