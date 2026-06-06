'use client';

import { useEffect, useState } from 'react';
import { AppBar } from '../chrome';
import { Doodles, Eyebrow, Btn, Chip, Ic, Orb } from '../ui';
import { ProofBadge } from '../proof';
import { useEcho } from '@/lib/store';
import { useIdentity } from '../identity';
import { kindMeta } from '@/lib/echo/artifacts';
import type { RecalledMemory } from '@/types';

function bubbleText(recalled: RecalledMemory[]): string {
  const trigger = recalled.find(m => m.kind === 'trigger')?.text;
  const coping = recalled.find(m => m.kind === 'coping')?.text;
  const summary = recalled.find(m => m.kind === 'summary')?.text;
  if (trigger && coping) return `Last time, ${trigger.replace(/\.$/, '')} — and you mentioned ${coping.replace(/^.*?(a |an )/i, '$1').replace(/\.$/, '')}. I've been holding onto that. How have things been since?`;
  if (trigger) return `Last time, ${trigger.replace(/\.$/, '')} was weighing on you. I've kept that in mind. How have things been since?`;
  if (summary) return `Last time, ${summary.replace(/\.$/, '')}. I've been holding onto that. How are you arriving today?`;
  return `It's good to have you back. I've kept what mattered from last time. How are you arriving today?`;
}

export default function Recall() {
  const { go, recalled, setRecalled, lastTheme, startSession } = useEcho();
  const id = useIdentity();
  const [show, setShow] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id.ready || !id.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `/api/recall?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}&context=${encodeURIComponent(lastTheme)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) setRecalled(data.recalled ?? []);
      } catch {
        if (!cancelled) setRecalled([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId]);

  useEffect(() => {
    const t = [setTimeout(() => setShow(1), 400), setTimeout(() => setShow(2), 1100), setTimeout(() => setShow(3), 1800)];
    return () => t.forEach(clearTimeout);
  }, [recalled]);

  const hasMemories = recalled.length > 0;
  const pickUp = () => { startSession({ mode: 'continue', modeTitle: 'Continue from last time' }); go('room'); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#EAF1E9 0%,#F3ECE0 60%,#F7EAD6 100%)' }}>
      <AppBar active="journey" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 980, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 30, alignItems: 'center', marginBottom: 28 }}>
            <div className="up d1" style={{ display: 'grid', placeItems: 'center' }}><Orb size={140} listening /></div>
            <div className="up d2">
              <Eyebrow ic="rewind">welcome back</Eyebrow>
              <h2 className="display" style={{ margin: '10px 0 14px' }}>Good to see you again.</h2>
              <div className="bubble echo italic" style={{ maxWidth: 600, fontSize: 18 }}>
                &ldquo;{hasMemories ? bubbleText(recalled) : "It's good to have you here. We haven't saved anything yet — let's create your first memory together."}&rdquo;
              </div>
            </div>
          </div>

          {hasMemories ? (
            <div className="up d3 card" style={{ padding: 24, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <span className="display" style={{ fontSize: 20, display: 'inline-flex', alignItems: 'center', gap: 10 }}><Ic name="db" size={22} /> What Echo recalled — and why</span>
                <ProofBadge onClick={() => go('timeline')} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recalled.map((m, i) => {
                  const km = kindMeta(m.kind);
                  return (
                    <div key={m.blob_id || i} className="mem" style={{ opacity: show > i ? 1 : 0, transform: show > i ? 'none' : 'translateY(10px)', transition: 'all .5s', boxShadow: '3px 4px 0 var(--ink)' }}>
                      <div className="mem-ic" style={{ background: km.color }}><Ic name={km.ic} size={24} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                          <Chip sm>{m.type}</Chip>
                          <span style={{ fontWeight: 700, fontSize: 16 }}>{m.text}</span>
                        </div>
                        <div className="muted" style={{ fontWeight: 700, fontSize: 13, marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <Ic name="spark" size={13} stroke="var(--lav-deep)" fill="var(--lav-deep)" /> selected because — {m.reason}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="up d3 card" style={{ padding: 28, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
              <div className="mem-ic deco" style={{ width: 54, height: 54, flex: '0 0 54px', background: 'var(--mint)' }}><Ic name="sprout" size={28} /></div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 20 }}>{loading ? 'Looking back through your memories…' : 'Your story starts now.'}</div>
                <p className="muted" style={{ margin: '4px 0 0', fontWeight: 600 }}>{loading ? 'One moment.' : 'Reflect once and approve a memory — next time, Echo will remember it here.'}</p>
              </div>
              {!loading && <Btn variant="primary" iconR="arrowR" onClick={() => go('modes')}>Start reflecting</Btn>}
            </div>
          )}

          <div className="up d4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 30 }}>
            <span className="safety"><Ic name="anchor" size={15} /> Recalled from Walrus · {id.mode === 'wallet' ? 'signed by your wallet' : 'guest blob'}</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn icon="map" onClick={() => go('timeline')}>See my journey</Btn>
              <Btn variant="primary" iconR="arrowR" onClick={pickUp}>Pick up where we left off</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
