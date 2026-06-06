'use client';

import { AppBar } from '../chrome';
import { Doodles, Eyebrow, Chip, Ic } from '../ui';
import { useEcho } from '@/lib/store';
import { MODES, type EchoMode } from '@/lib/echo/modes';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'good morning';
  if (h < 18) return 'good afternoon';
  return 'good evening';
}

export default function Modes() {
  const { go, name, startSession, lastTheme, journey } = useEcho();
  const pick = (m: EchoMode) => { startSession({ mode: m.id, modeTitle: m.title }); go('setup'); };
  const reflections = journey?.sessions.length ?? 0;

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="up d1" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Eyebrow ic="sun">{greeting()}, {name}</Eyebrow>
              <h2 className="display" style={{ fontSize: 'clamp(30px,4vw,44px)' }}>How do you want to reflect?</h2>
              <p className="lede" style={{ maxWidth: 540 }}>Pick a doorway — there&apos;s no wrong one. You can always change tack once you&apos;re inside.</p>
            </div>
            <div className="card" style={{ background: 'var(--paper)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 13, flex: '0 0 auto' }}>
              <div className="mode-ic deco" style={{ width: 46, height: 46, background: 'var(--mint)' }}><Ic name="leaf" size={24} /></div>
              <div>
                <div className="muted" style={{ fontWeight: 800, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{reflections > 0 ? `${reflections} reflection${reflections === 1 ? '' : 's'}` : 'a fresh start'}</div>
                <div className="display" style={{ fontSize: 17 }}>{reflections > 0 ? 'You keep showing up.' : 'Glad you came.'}</div>
              </div>
            </div>
          </div>

          <div className="up d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
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
