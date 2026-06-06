'use client';

import { useMemo, useState } from 'react';
import { AppBar, SessionProgress } from '../chrome';
import { Doodles, Eyebrow, Btn, Chip, Ic, Orb } from '../ui';
import { useEcho, sessionMeta } from '@/lib/store';
import { useIdentity } from '../identity';
import { kindMeta } from '@/lib/echo/artifacts';
import type { ReflectionArtifact } from '@/types';

interface Item extends ReflectionArtifact { keep: boolean }

function SavingBar() {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--mint)' }}>
      <Orb size={40} state="saving" />
      <div style={{ flex: 1 }}>
        <div className="display" style={{ fontSize: 16 }}>Encoding reflection · erasure-coding across Walrus nodes…</div>
        <div style={{ height: 12, borderRadius: 9, border: '2.5px solid var(--ink)', marginTop: 8, overflow: 'hidden', background: 'var(--paper)' }}>
          <div style={{ height: '100%', background: 'var(--sage-deep)', width: '92%', animation: 'savefill 1.6s ease forwards' }} />
        </div>
      </div>
      <style>{'@keyframes savefill{from{width:6%}to{width:100%}}'}</style>
    </div>
  );
}

export default function MemoryReview() {
  const { go, session, proposed, setSaved } = useEcho();
  const id = useIdentity();
  const initial = useMemo<Item[]>(
    () => (proposed?.artifacts ?? []).map(a => ({ ...a, keep: a.kind !== 'context' })),
    [proposed],
  );
  const [items, setItems] = useState<Item[]>(initial);
  const [saving, setSaving] = useState(false);
  const keepCount = items.filter(i => i.keep).length;
  const toggle = (id_: string) => setItems(its => its.map(i => i.id === id_ ? { ...i, keep: !i.keep } : i));
  const leftOut = proposed?.left_out;

  const save = async () => {
    if (keepCount === 0 || saving) return;
    setSaving(true);
    const approved = items.filter(i => i.keep).map(({ keep, ...rest }) => { void keep; return rest; });
    try {
      const res = await fetch('/api/memory/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id.userId,
          workspace_id: id.workspaceId,
          session_id: session.session_id,
          mode: session.mode,
          meta: sessionMeta(session),
          approved,
          summary: proposed?.summary,
          theme: proposed?.theme,
        }),
      });
      const data = await res.json();
      setSaved(data.saved ?? [], data.proof ?? null);
    } catch {
      setSaved([], null);
    }
    // brief beat so the "writing to Walrus" state is felt
    setTimeout(() => go('debrief'), 900);
  };

  const empty = items.length === 0;

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="session" />
      <SessionProgress step={2} />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="up d1" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <Eyebrow ic="db">you&apos;re in control</Eyebrow>
            <h2 className="display">Worth keeping?</h2>
            <p className="lede">Echo pulled out the meaningful threads — not every word. Keep what feels true; drop what doesn&apos;t. Only what you keep is saved to Walrus.</p>
          </div>

          {empty ? (
            <div className="up d2 card" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
              <div className="mem-ic deco" style={{ width: 54, height: 54, flex: '0 0 54px', background: 'var(--sage)' }}><Ic name="heart" size={28} /></div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 20 }}>Nothing needs saving this time.</div>
                <p className="muted" style={{ margin: '4px 0 0', fontWeight: 600 }}>Sometimes you just need to be heard. That counts too.</p>
              </div>
              <Btn variant="primary" iconR="arrowR" onClick={() => { setSaved([], null); go('debrief'); }}>Continue</Btn>
            </div>
          ) : (
            <>
              <div className="up d2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {items.map(m => {
                  const km = kindMeta(m.kind);
                  return (
                    <div key={m.id} className="mem" style={{ opacity: m.keep ? 1 : 0.5, background: m.keep ? 'var(--paper)' : 'var(--cream-2)' }}>
                      <div className="mem-ic" style={{ background: km.color }}><Ic name={km.ic} size={24} /></div>
                      <div style={{ flex: 1 }}>
                        <Chip sm>{m.type}</Chip>
                        <p style={{ margin: '9px 0 0', fontWeight: 600, fontSize: 16, lineHeight: 1.45 }}>{m.text}</p>
                      </div>
                      <button onClick={() => toggle(m.id)} className="chip chip-btn" style={{ alignSelf: 'center', background: m.keep ? 'var(--sage)' : 'var(--paper)' }}>
                        {m.keep ? <><Ic name="check" size={15} /> Keep</> : 'Skip'}
                      </button>
                    </div>
                  );
                })}
                {leftOut && (
                  <div className="tile" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--cream-2)', boxShadow: 'none', borderStyle: 'dashed' }}>
                    <Ic name="x" size={22} stroke="var(--ink-soft)" />
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink-soft)' }}><b>Left out of memory.</b> {leftOut}</div>
                  </div>
                )}
              </div>

              <div className="up d3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, flexWrap: 'wrap', gap: 14 }}>
                <span className="safety"><Ic name="db" size={15} /> {keepCount} {keepCount === 1 ? 'memory' : 'memories'} → {id.mode === 'wallet' ? 'Walrus (signed by your wallet)' : 'Walrus (guest blob)'}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Btn onClick={() => { setSaved([], null); go('debrief'); }}>Skip saving</Btn>
                  <Btn variant="primary" icon="db" onClick={save} disabled={saving || keepCount === 0}>
                    {saving ? 'Writing to Walrus…' : `Save ${keepCount} to Walrus`}
                  </Btn>
                </div>
              </div>
              {saving && <div className="up" style={{ marginTop: 16 }}><SavingBar /></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
