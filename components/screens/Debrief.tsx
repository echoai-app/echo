'use client';

import React, { useState } from 'react';
import { SessionBar } from '../chrome';
import { Doodles, Eyebrow, Btn, Chip, Ic, EchoLogo } from '../ui';
import { ProofBadge, ProofModal } from '../proof';
import { useEcho } from '@/lib/store';
import { kindMeta } from '@/lib/echo/artifacts';
import type { ArtifactKind } from '@/types';

function Panel({ title, ic, c, children }: { title: string; ic: string; c: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, border: '2.5px solid var(--ink)', display: 'grid', placeItems: 'center', background: c, flex: '0 0 40px' }}><Ic name={ic} size={22} /></div>
        <span className="display" style={{ fontSize: 18 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function Debrief() {
  const { go, session, proposed, saved, proof } = useEcho();
  const [showProof, setShowProof] = useState(false);
  const did = saved && saved.length > 0;

  const find = (kind: ArtifactKind): string | undefined =>
    proposed?.artifacts.find(a => a.kind === kind)?.text;

  const summaryLine = proposed?.summary || 'You took time to put words to what you were carrying — that matters.';

  return (
    <div className="bg-cream2" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SessionBar step={3} />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* verdict */}
          <div className="up d1 card card-lg" style={{ background: 'var(--sage)', padding: 28, marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center' }}>
              <div className="tile" style={{ width: 88, height: 88, display: 'grid', placeItems: 'center', background: 'var(--paper)' }}><EchoLogo size={64} /></div>
              <div>
                <Eyebrow>your reflection · gathered</Eyebrow>
                <h2 className="display" style={{ margin: '10px 0 8px' }}>You let some weight down.</h2>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 17, lineHeight: 1.5 }}>{summaryLine}</p>
              </div>
            </div>
          </div>

          {/* structured report */}
          <div className="up d2 r-2" style={{ marginBottom: 18 }}>
            <Panel title="Situation" ic="clock" c="var(--sky)">
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>{find('context') || find('summary') || summaryLine}</p>
            </Panel>
            <Panel title="Emotions noticed" ic="pulse" c="var(--peach)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {(session.feelings.length ? session.feelings : ['Heard', 'Held']).map(f => <Chip key={f} sm tone="peach">{f}</Chip>)}
              </div>
            </Panel>
            <Panel title="Repeating thought" ic="lens" c="var(--lav)">
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>{find('pattern') || 'No fixed pattern surfaced this time — just being present with it was enough.'}</p>
            </Panel>
            <Panel title="Possible trigger" ic="spark" c="var(--rose)">
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>{find('trigger') || 'Nothing pinned down yet — worth noticing next time.'}</p>
            </Panel>
            <Panel title="What helped" ic="leaf" c="var(--sage)">
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>{find('coping') || 'Naming it out loud, gently, is itself a kind of relief.'}</p>
            </Panel>
            <Panel title="Tiny next step" ic="sprout" c="var(--sun)">
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>{find('next_step') || 'Be a little gentle with yourself before sleep tonight.'}</p>
            </Panel>
          </div>

          {/* what echo remembered */}
          <div className="up d3 card" style={{ padding: 24, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <span className="display" style={{ fontSize: 20 }}>{did ? `Echo will remember ${saved.length} ${saved.length === 1 ? 'thing' : 'things'}` : 'Nothing was saved this time'}</span>
              {did && proof && <ProofBadge onClick={() => setShowProof(true)} pending={proof.pending} sui={!!proof.sui_registry} />}
            </div>
            {did ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {saved.map(m => {
                  const km = kindMeta(m.kind);
                  const onWalrus = m.blob_id && !m.blob_id.startsWith('local-');
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div className="mem-ic" style={{ width: 38, height: 38, flex: '0 0 38px', background: km.color }}><Ic name={km.ic} size={20} /></div>
                      <Chip sm>{m.type}</Chip>
                      <span style={{ fontWeight: 600, fontSize: 15, flex: 1, minWidth: 120 }}>{m.text}</span>
                      {onWalrus
                        ? <a href={`https://walruscan.com/${m.proof?.sui_registry?.network ?? 'testnet'}/blob/${m.blob_id}`} target="_blank" rel="noreferrer"
                            className="chip sm mono" style={{ textDecoration: 'none', fontSize: 11, color: 'var(--ink)', background: 'var(--mint)' }} title={m.blob_id}>
                            <Ic name="db" size={12} /> {m.blob_id.slice(0, 6)}…{m.blob_id.slice(-4)} ↗
                          </a>
                        : <span className="chip sm" style={{ fontSize: 11, background: 'var(--cream-2)' }}>syncing</span>}
                    </div>
                  );
                })}
              </div>
            ) : <p className="muted" style={{ margin: 0, fontWeight: 600 }}>That&apos;s okay — sometimes you just need to be heard.</p>}
          </div>

          <div className="up d4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 14 }}>
            <span className="muted" style={{ fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ic name="heart" size={15} stroke="var(--rose-deep)" fill="var(--rose)" /> Be gentle with yourself. I&apos;ll remember where we left off.</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn icon="arrowL" onClick={() => go('modes')}>Home</Btn>
              <Btn variant="primary" iconR="map" onClick={() => go('timeline')}>See my journey</Btn>
            </div>
          </div>
        </div>
      </div>
      <ProofModal open={showProof} onClose={() => setShowProof(false)} proof={proof} count={saved.length} />
    </div>
  );
}
