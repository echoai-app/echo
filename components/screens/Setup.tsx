'use client';

import { useState } from 'react';
import { SessionBar } from '../chrome';
import { Doodles, Eyebrow, Btn, Ic } from '../ui';
import { useEcho } from '@/lib/store';
import { getMode } from '@/lib/echo/modes';

const FEELINGS = [
  { k: 'Heavy', c: 'var(--lav)' }, { k: 'Anxious', c: 'var(--peach)' },
  { k: 'Worn out', c: 'var(--sky)' }, { k: 'Numb', c: 'var(--cream-3)' },
  { k: 'Frustrated', c: 'var(--rose)' }, { k: 'Okay-ish', c: 'var(--sage)' },
  { k: 'Hopeful', c: 'var(--mint)' }, { k: 'Restless', c: 'var(--sun)' },
];
const INTENSITY = ['barely there', 'a quiet hum', 'noticeable', 'weighing on me', 'pretty loud', 'hard to ignore', 'heavy', 'overwhelming', 'all-consuming', 'at my limit'];

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} style={{ width: 64, height: 36, borderRadius: 99, border: '3px solid var(--ink)', background: on ? 'var(--sage-deep)' : 'var(--cream-3)', position: 'relative', padding: 0, transition: 'background .2s', flex: '0 0 64px' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 30 : 2, width: 26, height: 26, borderRadius: 99, background: 'var(--paper)', border: '2.5px solid var(--ink)', transition: 'left .2s' }} />
    </button>
  );
}

export default function Setup() {
  const { go, session, patchSession } = useEcho();
  const [feels, setFeels] = useState<string[]>(session.feelings || []);
  const [intensity, setIntensity] = useState(session.intensity || 6);
  const [remember, setRemember] = useState(session.remember);
  const toggle = (k: string) => setFeels(f => f.includes(k) ? f.filter(x => x !== k) : [...f, k]);
  const begin = () => { patchSession({ feelings: feels, intensity, remember }); go('room'); };

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SessionBar step={0} />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="up d1 tc" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 26 }}>
            <Eyebrow ic={getMode(session.mode).ic}>{session.modeTitle}</Eyebrow>
            <h2 className="display">Let&apos;s set the scene.</h2>
            <p className="lede">A couple of soft questions before we settle in.</p>
          </div>

          <div className="up d2 card" style={{ padding: 26, marginBottom: 18 }}>
            <div className="kicker" style={{ marginBottom: 14 }}>what&apos;s the feeling right now? · pick any</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11 }}>
              {FEELINGS.map(f => (
                <button key={f.k} onClick={() => toggle(f.k)}
                  className="chip chip-btn" style={{ background: feels.includes(f.k) ? f.c : 'var(--paper)', fontSize: 16, padding: '10px 18px', transform: feels.includes(f.k) ? 'translateY(-1px)' : 'none' }}>
                  {feels.includes(f.k) && <Ic name="check" size={15} />}{f.k}
                </button>
              ))}
            </div>
          </div>

          <div className="up d3 card" style={{ padding: 26, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <span className="kicker">how loud is it?</span>
              <span className="display" style={{ fontSize: 20 }}>{intensity}<span className="muted" style={{ fontSize: 15 }}>/10 · {INTENSITY[intensity - 1]}</span></span>
            </div>
            <input className="range" type="range" min={1} max={10} value={intensity} onChange={e => setIntensity(+e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)' }}><span>gentle</span><span>intense</span></div>
          </div>

          <div className="up d4 card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 18, background: remember ? 'var(--mint)' : 'var(--paper)' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, border: '2.6px solid var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--paper)', flex: '0 0 50px' }}><Ic name="db" size={26} /></div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 18 }}>Remember this session?</div>
              <div className="muted" style={{ fontWeight: 600, fontSize: 14 }}>{remember ? "Echo will offer to save meaningful insights to Walrus — you'll review them first." : 'This stays in the moment. Nothing will be saved.'}</div>
            </div>
            <Toggle on={remember} set={setRemember} />
          </div>

          <div className="up d5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 32 }}>
            <Btn variant="primary" size="lg" iconR="arrowR" onClick={begin}>Begin reflection</Btn>
            <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>take your time — there&apos;s no wrong way to start</span>
          </div>
        </div>
      </div>
    </div>
  );
}
