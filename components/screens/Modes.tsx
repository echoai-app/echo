'use client';

import React, { useEffect, useState } from 'react';
import { AppBar } from '../chrome';
import { Doodles, Chip, Ic, Btn } from '../ui';
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

// a small bar visualization of recent reflection intensity ("your rhythm")
function RhythmViz({ trend }: { trend: { when: string; value: number }[] }) {
  const data = trend.slice(-14);
  if (!data.length) {
    return <div className="rhythm-empty">Your reflection rhythm will show here as you check in.</div>;
  }
  const band = (v: number) => (v >= 7 ? 'var(--rose)' : v >= 4 ? 'var(--sun)' : 'var(--mint)');
  return (
    <div className="rhythm-bars" role="img" aria-label="recent reflection intensity">
      {data.map((d, i) => (
        <span key={i} className="rhythm-bar" style={{ height: `${9 + (Math.min(10, Math.max(1, d.value)) / 10) * 47}px`, background: band(d.value) }}
          title={`${new Date(d.when).toLocaleDateString()} · ${d.value}/10`} />
      ))}
    </div>
  );
}

export default function Modes() {
  const { go, name, startSession, lastTheme, journey, setJourney, lastIndexBlob } = useEcho();
  const id = useIdentity();
  const t = greetCtx();
  const [focus, setFocus] = useState<EchoMode>(MODES[0]);

  // returning users often go straight into a session — pre-warm the 3D room
  useEffect(() => { import('@/components/reflection/ImmersiveRoom3D'); }, []);
  // keep stats honest — refetch whenever the journey was invalidated
  useEffect(() => {
    if (!id.ready || !id.userId || journey) return;
    let c = false;
    (async () => {
      try {
        const r = await fetch(`/api/journey?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}${lastIndexBlob ? `&index_blob_id=${encodeURIComponent(lastIndexBlob)}` : ''}`);
        const d = await r.json();
        if (!c) setJourney(d);
      } catch { /* greeting still works */ }
    })();
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId, journey]);

  const begin = () => { startSession({ mode: focus.id, modeTitle: focus.title }); go('setup'); };

  const sessions = journey?.sessions ?? [];
  const reflections = sessions.length;
  const onWalrus = journey?.total_on_walrus ?? 0;
  const themes = journey?.recurring_themes ?? [];
  const trend = journey?.intensity_trend ?? [];

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          {/* ── greeting + rhythm visualization ── */}
          <div className="up d1 card card-lg home-hero">
            <div className="home-greet">
              <div className="home-greet-ic">
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--ink)', background: `radial-gradient(circle at 38% 32%, var(--paper), ${t.bg} 82%)`, boxShadow: '3px 4px 0 var(--ink)' }} />
                <Ic name={t.ic} size={38} sw={2.3} stroke="var(--ink)" />
                <span className="doodle float" style={{ top: '-8%', right: '-8%', ['--r']: '0deg' } as CSS}><Ic name="spark" size={16} stroke="var(--sun)" fill="var(--sun)" sw={2.2} /></span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="kicker" style={{ marginBottom: 5 }}>{t.day} · {t.period}</div>
                <h2 className="display" style={{ fontSize: 'clamp(27px,3.6vw,42px)', lineHeight: 1.04 }}>{t.text}, <span style={{ color: 'var(--peach-deep)' }}>{displayName(name)}</span>.</h2>
                <p className="lede" style={{ marginTop: 5, maxWidth: 440 }}>{t.sub}</p>
              </div>
            </div>

            <div className="home-rhythm">
              <div className="home-rhythm-top">
                <span className="kicker">your rhythm</span>
                <span className="muted" style={{ fontWeight: 700, fontSize: 12 }}>{trend.length ? `last ${Math.min(trend.length, 14)}` : 'no data yet'}</span>
              </div>
              <RhythmViz trend={trend} />
              <div className="home-stats">
                <div className="home-stat"><b>{reflections}</b><span>reflections</span></div>
                <div className="home-stat"><b>{onWalrus}</b><span>on Walrus</span></div>
                <div className="home-stat"><b>{themes.length}</b><span>themes</span></div>
              </div>
            </div>
          </div>

          {/* ── primary doorway: one start, pick your focus ── */}
          <div className="up d2 card card-lg home-primary">
            <div>
              <h3 className="display" style={{ fontSize: 'clamp(22px,3vw,30px)', lineHeight: 1.05 }}>Start a reflection</h3>
              <p className="muted" style={{ fontWeight: 600, fontSize: 14.5, marginTop: 3 }}>Pick how you’d like to reflect — Echo adapts to it.</p>
            </div>

            <div className="mode-pills">
              {MODES.map((m) => (
                <button key={m.id} className={'mode-pill' + (focus.id === m.id ? ' on' : '')} style={{ ['--pc']: m.color } as CSS} onClick={() => setFocus(m)}>
                  <Ic name={m.ic} size={19} /> <span>{m.title}</span>
                </button>
              ))}
            </div>

            <div className="home-focus-desc" style={{ background: focus.color }}>
              <Ic name={focus.ic} size={18} />
              <span><b>{focus.title}.</b> {focus.sub}</span>
              <Chip sm>{focus.chip}</Chip>
            </div>

            <Btn variant="primary" size="lg" block icon="play" iconR="arrowR" onClick={begin}>Begin reflecting</Btn>
          </div>

          {/* ── two genuinely different doorways ── */}
          <div className="up d3 home-two">
            <div className="card home-door" style={{ background: 'var(--sky)' }} role="button" tabIndex={0}
              onClick={() => go('recall')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && go('recall')}>
              <span className="rec-badge"><Ic name="spark" size={12} fill="var(--ink)" stroke="var(--ink)" /> remembers you</span>
              <div className="mode-ic deco" style={{ background: 'var(--paper)' }}><Ic name="rewind" size={30} sw={2.3} /></div>
              <h3 className="display" style={{ fontSize: 20 }}>Continue from last time</h3>
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>Pick up where you left off — Echo recalls <b>{lastTheme}</b>.</div>
              <span className="tap-tag home-door-go" style={{ background: 'var(--sun)' }}>recall <Ic name="arrowR" size={14} /></span>
            </div>

            <div className="card home-door" style={{ background: 'var(--lav)' }} role="button" tabIndex={0}
              onClick={() => go('timeline')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && go('timeline')}>
              <div className="mode-ic deco" style={{ background: 'var(--paper)' }}><Ic name="map" size={30} sw={2.3} /></div>
              <h3 className="display" style={{ fontSize: 20 }}>Your journey</h3>
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{reflections ? 'Patterns, themes and what’s shifted over time.' : 'Your patterns will grow here over time.'}</div>
              {themes.length > 0 && (
                <div className="home-theme-chips">
                  {themes.slice(0, 3).map(th => <Chip sm key={th.label}>{th.label}</Chip>)}
                </div>
              )}
              <span className="tap-tag home-door-go">explore <Ic name="arrowR" size={14} /></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
