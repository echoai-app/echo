'use client';

import { useEffect, useState } from 'react';
import { AppBar } from '../chrome';
import { Doodles, Eyebrow, Btn, Chip, Ic } from '../ui';
import { ProofBadge, ProofModal } from '../proof';
import { useEcho } from '@/lib/store';
import { useIdentity } from '../identity';
import { kindMeta } from '@/lib/echo/artifacts';
import { themeColor } from '@/lib/echo/text';
import type { Journey } from '@/types';

function relTime(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (d < 0.02) return 'Just now';
  if (d < 1) return 'Today';
  if (d < 2) return 'Yesterday';
  return `${Math.round(d)} days ago`;
}

function TrendChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 460, h = 130, pad = 24, max = 10, min = 0;
  if (data.length < 2) {
    return <div className="muted" style={{ fontWeight: 600, fontSize: 14, padding: '18px 0' }}>A couple more reflections and your trend will appear here.</div>;
  }
  const xs = data.map((_, i) => pad + (i * (w - pad * 2)) / (data.length - 1));
  const ys = data.map(v => pad + (1 - (v - min) / (max - min)) * (h - pad * 2));
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', marginTop: 12 }}>
      {[0, 1, 2].map(g => <line key={g} x1={pad} x2={w - pad} y1={pad + g * (h - pad * 2) / 2} y2={pad + g * (h - pad * 2) / 2} stroke="var(--cream-3)" strokeWidth="2" strokeDasharray="4 5" />)}
      <polyline points={pts} fill="none" stroke="var(--sage-deep)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="7" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />)}
      {xs.map((x, i) => <text key={'v' + i} x={x} y={ys[i] - 14} textAnchor="middle" fontFamily="var(--display)" fontWeight="800" fontSize="15" fill="var(--ink)">{data[i]}</text>)}
      {xs.map((x, i) => <text key={'l' + i} x={x} y={h - 4} textAnchor="middle" fontFamily="var(--body)" fontWeight="700" fontSize="12" fill="var(--ink-soft)">{labels[i] ?? ''}</text>)}
    </svg>
  );
}

function patternsFrom(j: Journey): string[] {
  const out: string[] = [];
  const top = j.recurring_themes[0]?.label;
  if (top) out.push(`${top} keeps coming up across your reflections.`);
  if (j.recurring_themes.some(t => t.label === 'Movement helps')) out.push('Movement shows up whenever things start to ease.');
  if (j.recurring_themes.some(t => t.label === 'Sleep & rest')) out.push('Rest is closely tied to how heavy things feel.');
  if (out.length === 0) out.push('A few more reflections and Echo will start noticing your patterns.');
  return out.slice(0, 3);
}

function JStat({ n, label, ic, bg }: { n: number; label: string; ic: string; bg: string }) {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div className="mem-ic deco" style={{ width: 50, height: 50, flex: '0 0 50px', background: bg }}><Ic name={ic} size={26} /></div>
      <div>
        <div className="display" style={{ fontSize: 28, lineHeight: 1 }}>{n}</div>
        <div className="muted" style={{ fontWeight: 700, fontSize: 12.5 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Timeline() {
  const { go, journey, setJourney, proof } = useEcho();
  const id = useIdentity();
  const [showProof, setShowProof] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id.ready || !id.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/journey?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}`);
        const data = await res.json();
        if (!cancelled) setJourney(data);
      } catch {
        if (!cancelled) setJourney({ sessions: [], intensity_trend: [], recurring_themes: [], saved_artifacts: [], total_on_walrus: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId]);

  const j = journey;
  const hasData = (j?.sessions.length ?? 0) > 0;
  const streak = j ? new Set(j.sessions.map(s => s.when.slice(0, 10))).size : 0;
  const trendVals = j?.intensity_trend.map(t => t.value) ?? [];
  const trendLabels = j?.intensity_trend.map(t => relTime(t.when).replace(' days ago', 'd').replace('Just now', 'now').replace('Today', 'now').replace('Yesterday', '1d')) ?? [];
  const trendDelta = trendVals.length >= 2 ? `${trendVals[0]} → ${trendVals[trendVals.length - 1]}` : null;

  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="journey" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 1120, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="up d1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <Eyebrow ic="map">your journey · {j?.sessions.length ?? 0} reflection{(j?.sessions.length ?? 0) === 1 ? '' : 's'}</Eyebrow>
              <h2 className="display" style={{ marginTop: 10 }}>How you&apos;ve been, over time.</h2>
              <p className="lede" style={{ marginTop: 8, maxWidth: 540 }}>Everything here was distilled from your reflections and recalled from Walrus — only what you chose to keep.</p>
            </div>
            {(j?.total_on_walrus ?? 0) > 0 && <ProofBadge onClick={() => setShowProof(true)} pending={proof?.pending} />}
          </div>

          {hasData && j && (
            <div className="up d2 r-3" style={{ marginBottom: 18 }}>
              <JStat n={j.sessions.length} label="reflections" ic="pulse" bg="var(--peach)" />
              <JStat n={streak} label="day streak" ic="leaf" bg="var(--sage)" />
              <JStat n={j.total_on_walrus} label="memories on Walrus" ic="db" bg="var(--mint)" />
            </div>
          )}

          {!hasData ? (
            <div className="up d2 card" style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className="mem-ic deco" style={{ width: 60, height: 60, flex: '0 0 60px', background: 'var(--sage)' }}><Ic name="sprout" size={30} /></div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 22 }}>{loading ? 'Gathering your journey…' : 'Your journey starts here.'}</div>
                <p className="muted" style={{ margin: '6px 0 0', fontWeight: 600, fontSize: 15.5 }}>{loading ? 'One moment while Echo reads your Walrus memory.' : 'Reflect, approve a memory, and your timeline, trends, and themes will grow here — all recalled from Walrus.'}</p>
              </div>
              {!loading && <Btn variant="primary" iconR="arrowR" onClick={() => go('modes')}>Start a reflection</Btn>}
            </div>
          ) : j && (
            <>
              <div className="up d2 r-2" style={{ marginBottom: 18 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="display" style={{ fontSize: 19 }}>Intensity over time</span>
                    {trendDelta && <Chip sm tone="sage" ic="sprout">{trendDelta}</Chip>}
                  </div>
                  <TrendChart data={trendVals} labels={trendLabels} />
                </div>
                <div className="card" style={{ padding: 24, background: 'var(--mint)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="display" style={{ fontSize: 19, display: 'flex', alignItems: 'center', gap: 9 }}><Ic name="sprout" size={22} /> A note on progress</div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}>You&apos;ve shown up {j.sessions.length} {j.sessions.length === 1 ? 'time' : 'times'}. The weight is real — but you keep returning, and that&apos;s its own kind of movement.</p>
                </div>
              </div>

              {j.recurring_themes.length > 0 && (
                <div className="up d3 card" style={{ padding: 24, marginBottom: 18 }}>
                  <span className="display" style={{ fontSize: 19 }}>Recurring themes</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
                    {j.recurring_themes.map(t => (
                      <div key={t.label} className="chip" style={{ background: themeColor(t.label), fontSize: 16, padding: '11px 18px', boxShadow: '2px 3px 0 var(--ink)' }}>
                        {t.label} <span style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 99, padding: '1px 9px', fontSize: 13 }}>×{t.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="up d4 r-2" style={{ marginBottom: 30 }}>
                <div className="card" style={{ padding: 24 }}>
                  <span className="display" style={{ fontSize: 19 }}>Sessions</span>
                  <div style={{ position: 'relative', marginTop: 18, paddingLeft: 12 }}>
                    <div className="tl-line" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {j.sessions.map((s, i) => {
                        const c = ['var(--peach)', 'var(--lav)', 'var(--sky)', 'var(--sage)'][i % 4];
                        return (
                          <div key={s.session_id || i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                            <div className="tl-node" style={{ background: c, marginTop: 6 }} />
                            <div className="tile" style={{ flex: 1, padding: '14px 16px', boxShadow: '3px 4px 0 var(--ink)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: 14.5 }}>{relTime(s.when)}</span>
                                <div style={{ display: 'flex', gap: 7 }}>
                                  <Chip sm>{s.mode}</Chip>
                                  {s.intensity != null && <Chip sm tone="peach">{s.intensity}/10</Chip>}
                                </div>
                              </div>
                              {s.theme && <p style={{ margin: '8px 0 8px', fontWeight: 600, fontSize: 15 }}>&ldquo;{s.theme}&rdquo;</p>}
                              <span className="muted" style={{ fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ic name="db" size={13} /> {s.memoryCount} {s.memoryCount === 1 ? 'memory' : 'memories'} on Walrus</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="card" style={{ padding: 24, background: 'var(--lav)' }}>
                    <span className="display" style={{ fontSize: 19, display: 'flex', alignItems: 'center', gap: 9 }}><Ic name="lens" size={22} /> Patterns Echo noticed</span>
                    <ul style={{ margin: '14px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {patternsFrom(j).map((p, i) => <li key={i} style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.4 }}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="card" style={{ padding: 24 }}>
                    <span className="display" style={{ fontSize: 19 }}>Saved reflection artifacts</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                      {j.saved_artifacts.map((a, i) => {
                        const km = kindMeta(a.kind);
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div className="mem-ic" style={{ width: 36, height: 36, flex: '0 0 36px', background: km.color }}><Ic name={km.ic} size={19} /></div>
                            <Chip sm>{a.type}</Chip>
                            <span style={{ fontWeight: 600, fontSize: 14.5 }}>{a.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="up d5" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
            <Btn icon="arrowL" onClick={() => go('modes')}>Back to home</Btn>
            <Btn variant="primary" iconR="arrowR" onClick={() => go('modes')}>Start a new reflection</Btn>
          </div>
        </div>
      </div>
      <ProofModal open={showProof} onClose={() => setShowProof(false)} proof={proof ?? { blob_id: 'stored on Walrus', certified: true, pending: false }} count={j?.total_on_walrus ?? 0} />
    </div>
  );
}
