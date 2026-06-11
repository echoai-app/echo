'use client';

import React, { useEffect } from 'react';
import { AppBar } from '../chrome';
import { Doodles, Chip, Ic } from '../ui';
import { useEcho, displayName } from '@/lib/store';
import { useIdentity } from '../identity';
import { MODES, type EchoMode } from '@/lib/echo/modes';

type CSS = React.CSSProperties;

function greetCtx() {
  const h = new Date().getHours();
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  if (h < 12) return { text: 'Good morning', ic: 'sun', bg: 'var(--sun)', period: 'morning', sub: 'A fresh start — how are you arriving today?', day };
  if (h < 18) return { text: 'Good afternoon', ic: 'sun', bg: 'var(--peach)', period: 'afternoon', sub: 'A good moment to pause and check in.', day };
  return { text: 'Good evening', ic: 'moon', bg: 'var(--lav)', period: 'evening', sub: 'Let’s unwind and reflect on your day.', day };
}

export default function Modes() {
  const { go, name, startSession, lastTheme, journey, setJourney } = useEcho();
  const id = useIdentity();
  const t = greetCtx();
  // returning users often go straight into a session — pre-warm the 3D room
  useEffect(() => { import('@/components/reflection/ImmersiveRoom3D'); }, []);
  // keep the greeting count honest — refetch whenever the journey was invalidated
  useEffect(() => {
    if (!id.ready || !id.userId || journey) return;
    let c = false;
    (async () => {
      try {
        const r = await fetch(`/api/journey?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}`);
        const d = await r.json();
        if (!c) setJourney(d);
      } catch { /* greeting still works */ }
    })();
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId, journey]);
  const pick = (m: EchoMode) => { startSession({ mode: m.id, modeTitle: m.title }); go('setup'); };
  const reflections = journey?.sessions.length ?? 0;

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          {/* greeting hero */}
          <div className="up d1 card card-lg" style={{ background: 'linear-gradient(120deg, var(--paper) 0%, var(--cream) 100%)', padding: 'clamp(22px,3vw,30px)', marginBottom: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', width: 78, height: 78, flex: '0 0 78px', display: 'grid', placeItems: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--ink)', background: `radial-gradient(circle at 38% 32%, var(--paper), ${t.bg} 82%)`, boxShadow: '3px 4px 0 var(--ink)' }} />
                <Ic name={t.ic} size={40} sw={2.3} stroke="var(--ink)" />
                <span className="doodle float" style={{ top: '-8%', right: '-8%', ['--r']: '0deg' } as CSS}><Ic name="spark" size={17} stroke="var(--sun)" fill="var(--sun)" sw={2.2} /></span>
              </div>
              <div>
                <div className="kicker" style={{ marginBottom: 6 }}>{t.day} · {t.period}</div>
                <h2 className="display" style={{ fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.02 }}>{t.text}, <span style={{ color: 'var(--peach-deep)' }}>{displayName(name)}</span>.</h2>
                <p className="lede" style={{ marginTop: 6, maxWidth: 480 }}>{t.sub}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--mint)', border: '2.8px solid var(--ink)', borderRadius: 18, padding: '13px 18px', boxShadow: '3px 4px 0 var(--ink)', flex: '0 0 auto', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, border: '2.5px solid var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--paper)', flex: '0 0 46px' }}><Ic name="leaf" size={24} /></div>
              <div>
                <div className="display" style={{ fontSize: 24, lineHeight: 1 }}>{reflections}</div>
                <div className="muted" style={{ fontWeight: 800, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>reflection{reflections === 1 ? '' : 's'} kept</div>
              </div>
            </div>
          </div>

          {/* section label */}
          <div className="up d2" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span className="kicker">how do you want to reflect?</span>
            <span style={{ flex: 1, height: 2.5, background: 'var(--cream-3)', borderRadius: 9 }} />
            <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>there’s no wrong doorway</span>
          </div>

          {/* mode grid */}
          <div className="up d2 r-3">
            {MODES.map((m) => (
              <div key={m.id} className="mode-card clickable" tabIndex={0} role="button" style={{ background: m.color }} onClick={() => pick(m)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && pick(m)}>
                <div className="mode-ic deco"><Ic name={m.ic} size={36} sw={2.3} /></div>
                <div>
                  <h3 className="display" style={{ fontSize: 22 }}>{m.title}</h3>
                  <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>{m.sub}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Chip sm>{m.chip}</Chip>
                  <span className="tap-tag">choose <Ic name="arrowR" size={14} /></span>
                </div>
              </div>
            ))}

            {/* continue from last time */}
            <div className="mode-card clickable" tabIndex={0} role="button" style={{ background: 'var(--sky)' }} onClick={() => go('recall')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && go('recall')}>
              <span className="rec-badge"><Ic name="spark" size={12} fill="var(--ink)" stroke="var(--ink)" /> recommended</span>
              <div className="mode-ic deco" style={{ background: 'var(--paper)' }}><Ic name="rewind" size={36} sw={2.3} /></div>
              <div>
                <h3 className="display" style={{ fontSize: 22 }}>Continue from last time</h3>
                <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>Echo remembers <b>{lastTheme}</b>.</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Chip sm tone="sun">pick up</Chip>
                <span className="tap-tag" style={{ background: 'var(--sun)' }}>recall <Ic name="arrowR" size={14} /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
