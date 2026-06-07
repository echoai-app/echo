'use client';

import { AppBar } from '../chrome';
import { Doodles, Chip, Ic } from '../ui';
import { useEcho, displayName } from '@/lib/store';
import { MODES, type EchoMode } from '@/lib/echo/modes';

function timeOfDay(): { text: string; ic: string; bg: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', ic: 'sun', bg: 'var(--sun)' };
  if (h < 18) return { text: 'Good afternoon', ic: 'sun', bg: 'var(--peach)' };
  return { text: 'Good evening', ic: 'moon', bg: 'var(--lav)' };
}

export default function Modes() {
  const { go, name, startSession, lastTheme, journey } = useEcho();
  const t = timeOfDay();
  const pick = (m: EchoMode) => { startSession({ mode: m.id, modeTitle: m.title }); go('setup'); };
  const reflections = journey?.sessions.length ?? 0;

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="up d1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 66, height: 66, flex: '0 0 66px', borderRadius: 20, border: '3px solid var(--ink)', display: 'grid', placeItems: 'center', background: t.bg, boxShadow: '3px 4px 0 var(--ink)' }}>
                <Ic name={t.ic} size={34} sw={2.4} />
              </div>
              <div>
                <h2 className="display" style={{ fontSize: 'clamp(28px,3.8vw,42px)', lineHeight: 1.04 }}>{t.text}, <span style={{ color: 'var(--peach-deep)' }}>{displayName(name)}</span>.</h2>
                <p className="lede" style={{ marginTop: 6, maxWidth: 520 }}>How do you want to reflect today? There&apos;s no wrong doorway.</p>
              </div>
            </div>
            <div className="card" style={{ background: 'var(--paper)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 13, flex: '0 0 auto' }}>
              <div className="mode-ic deco" style={{ width: 46, height: 46, background: 'var(--mint)' }}><Ic name="leaf" size={24} /></div>
              <div>
                <div className="muted" style={{ fontWeight: 800, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{reflections > 0 ? `${reflections} reflection${reflections === 1 ? '' : 's'}` : 'a fresh start'}</div>
                <div className="display" style={{ fontSize: 17 }}>{reflections > 0 ? 'You keep showing up.' : 'Glad you came.'}</div>
              </div>
            </div>
          </div>

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
