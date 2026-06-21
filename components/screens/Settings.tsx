'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ConnectModal, useDisconnectWallet } from '@mysten/dapp-kit';
import { AppBar } from '../chrome';
import { Doodles, Eyebrow, Btn, Chip, Ic, LogoMark, PoweredBy, EchoLogo } from '../ui';
import { useEcho, type ScreenId } from '@/lib/store';
import { useIdentity } from '../identity';
import { BASELINE_SAFETY_NOTE } from '@/lib/echo/safety';

/* ---------- shared bits ---------- */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    try { navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return { copied, copy };
}

function CopyField({ value, label }: { value: string; label?: string }) {
  const { copied, copy } = useCopy();
  return (
    <div>
      {label && <div className="kicker" style={{ marginBottom: 8 }}>{label}</div>}
      <div className="copy-field">
        <span className="mono">{value}</span>
        <button className={'copy-btn' + (copied ? ' done' : '')} onClick={() => copy(value)}>
          <Ic name={copied ? 'check' : 'plus'} size={14} sw={3} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

const TABS: { id: ScreenId; label: string; ic: string }[] = [
  { id: 'profile', label: 'Profile', ic: 'heart' },
  { id: 'account', label: 'Account & identity', ic: 'gear' },
  { id: 'privacy', label: 'Privacy & memory', ic: 'lock' },
  { id: 'help', label: 'Help & support', ic: 'help' },
];

export function AccentDisc({ icon, accent, size = 74 }: { icon: string; accent: string; size?: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px`, display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--ink)', background: `radial-gradient(circle at 38% 32%, var(--paper), ${accent} 82%)`, boxShadow: '3px 4px 0 var(--ink)' }} />
      <Ic name={icon} size={Math.round(size * 0.48)} sw={2.2} stroke="var(--ink)" />
      <span className="doodle float" style={{ top: '-8%', right: '-8%', ['--r']: '0deg' } as React.CSSProperties}><Ic name="spark" size={15} stroke="var(--sun)" fill="var(--sun)" sw={2.2} /></span>
    </div>
  );
}

function SettingsShell({ active, eyebrow, icon, title, sub, accent, children }: {
  active: ScreenId; eyebrow: string; icon: string; title: string; sub: string; accent: string; children: React.ReactNode;
}) {
  const go = useEcho(s => s.go);
  return (
    <div className="bg-cream" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar active="home" />
      <div className="screen-scroll" style={{ position: 'relative' }}>
        <Doodles />
        <div className="screen-pad" style={{ maxWidth: 980, margin: '0 auto', position: 'relative', zIndex: 2, paddingTop: 8, paddingBottom: 54 }}>
          <div className="up d1 card card-lg" style={{ padding: 'clamp(22px,3vw,28px)', marginBottom: 20, background: 'linear-gradient(120deg, var(--paper) 0%, var(--cream) 100%)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <AccentDisc icon={icon} accent={accent} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <Eyebrow ic="gear">{eyebrow}</Eyebrow>
              <h2 className="display" style={{ marginTop: 6 }}>{title}</h2>
              <p className="lede" style={{ marginTop: 6, maxWidth: 560 }}>{sub}</p>
            </div>
          </div>

          <div className="set-tabs up d2">
            {TABS.map(t => (
              <button key={t.id} className={'set-tab' + (active === t.id ? ' on' : '')} onClick={() => go(t.id)}>
                <Ic name={t.ic} size={16} /> {t.label}
              </button>
            ))}
          </div>

          <div className="up d3">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- stats helper (fetches journey once for the count cards) ---------- */
function useJourneyStats() {
  const { journey, setJourney } = useEcho();
  const id = useIdentity();
  useEffect(() => {
    if (journey || !id.ready || !id.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/journey?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}`);
        const data = await res.json();
        if (!cancelled) setJourney(data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId]);
  const reflections = journey?.sessions.length ?? 0;
  const onWalrus = journey?.total_on_walrus ?? 0;
  const streak = journey ? new Set(journey.sessions.map(s => s.when.slice(0, 10))).size : 0;
  return { reflections, onWalrus, streak };
}

function StatsRow() {
  const { reflections, onWalrus, streak } = useJourneyStats();
  const stat = (n: number, label: string, ic: string, bg: string) => (
    <div className="tile" style={{ flex: 1, padding: 18, display: 'flex', alignItems: 'center', gap: 13 }}>
      <div className="mem-ic deco" style={{ width: 44, height: 44, flex: '0 0 44px', background: bg }}><Ic name={ic} size={22} /></div>
      <div><div className="display" style={{ fontSize: 24, lineHeight: 1 }}>{n}</div><div className="muted" style={{ fontWeight: 700, fontSize: 12.5 }}>{label}</div></div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {stat(reflections, 'reflections', 'pulse', 'var(--peach)')}
      {stat(streak, 'day streak', 'leaf', 'var(--sage)')}
      {stat(onWalrus, 'on Walrus', 'db', 'var(--mint)')}
    </div>
  );
}

/* ================= PROFILE ================= */
export function Profile() {
  const { name, setName, pfp, setPfp, prefs, setPref } = useEcho();
  const id = useIdentity();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1_500_000) { alert('Please choose an image under ~1.5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setPfp(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(f);
  };

  return (
    <SettingsShell active="profile" eyebrow="this is you" icon="heart" title="My profile" accent="var(--mint)"
      sub="A calm corner that's yours. Set how Echo greets you — it stays on this device.">
      <div className="card card-lg" style={{ padding: 'clamp(22px,3vw,28px)', marginBottom: 18, display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap', background: 'linear-gradient(120deg, var(--mint) 0%, var(--cream) 120%)' }}>
        <div className="pfp-edit" style={{ background: pfp ? 'var(--paper)' : 'var(--sage)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pfp ? <img src={pfp} alt="profile" /> : (name[0]?.toUpperCase() || 'E')}
          <button className="pfp-cam" onClick={() => fileRef.current?.click()} title="Upload a picture"><Ic name="plus" size={20} sw={3} /></button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>what should Echo call you?</div>
          <input className="field-edit" value={name} maxLength={32} onChange={e => setName(e.target.value || 'friend')} placeholder="your name" style={{ maxWidth: 400 }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip sm ic={id.mode === 'wallet' ? 'sui' : 'ghost'} tone={id.mode === 'wallet' ? 'sage' : ''}>
              {id.mode === 'wallet' ? `Wallet · ${id.shortAddress}` : 'Guest session'}
            </Chip>
            {pfp && <button className="copy-btn" onClick={() => setPfp(null)}><Ic name="x" size={13} sw={3} /> Remove photo</button>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}><StatsRow /></div>

      <div className="card" style={{ padding: 22 }}>
        <div className="display" style={{ fontSize: 18, marginBottom: 4 }}>Quick preferences</div>
        <p className="muted" style={{ fontWeight: 600, fontSize: 13.5, margin: '0 0 8px' }}>Fine-tune how a session feels.</p>
        {([
          ['voiceReplies', 'ear', 'Voice replies', 'Echo speaks responses aloud'],
          ['studioVoice', 'spark', 'Studio voice', 'Warmer neural voice — but a little slower to start (off = instant)'],
          ['saveToWalrus', 'anchor', 'Save memories to Walrus', 'Always reviewed before anything is kept'],
          ['reducedMotion', 'moon', 'Reduced motion', 'Calmer, simpler animations'],
        ] as const).map(([k, ic, label, sub]) => (
          <div key={k} className="pm-row toggle" style={{ padding: '12px 6px' }}>
            <span className="pic" style={{ background: prefs[k] ? 'var(--mint)' : 'var(--cream-2)' }}><Ic name={ic} size={18} /></span>
            <div style={{ flex: 1 }}>{label}<div className="sub">{sub}</div></div>
            <div className={'switch' + (prefs[k] ? ' on' : '')} role="switch" aria-checked={prefs[k]} tabIndex={0}
              onClick={() => setPref(k, !prefs[k])} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPref(k, !prefs[k])} />
          </div>
        ))}
      </div>
    </SettingsShell>
  );
}

/* ================= ACCOUNT & IDENTITY ================= */
export function Account() {
  const id = useIdentity();
  const { mutate: disconnect } = useDisconnectWallet();
  const [connectOpen, setConnectOpen] = useState(false);
  const connected = id.mode === 'wallet';

  return (
    <SettingsShell active="account" eyebrow="who holds your memory" icon="gear" title="Account & identity" accent="var(--sky)"
      sub="Your identity is the key your memories are saved under. Stay as a guest, or connect a Sui wallet to make them portable and verifiable.">
      <ConnectModal open={connectOpen} onOpenChange={setConnectOpen} trigger={<span aria-hidden style={{ display: 'none' }} />} />

      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div className="mem-ic deco" style={{ width: 52, height: 52, flex: '0 0 52px', background: connected ? 'var(--mint)' : 'var(--cream-2)' }}>
            <Ic name={connected ? 'wallet' : 'ghost'} size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 21 }}>{connected ? 'Sui Wallet' : 'Guest session'}</div>
            <div className="muted" style={{ fontWeight: 700, fontSize: 13.5 }}>{connected ? 'Portable & verifiable across devices' : 'Stored on this device for now'}</div>
          </div>
          {connected
            ? <Chip sm tone="sage" ic="check">connected</Chip>
            : <Chip sm ic="ghost">local only</Chip>}
        </div>

        {connected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CopyField label="your sui address" value={id.address ?? ''} />
            <CopyField label="memory workspace" value={id.workspaceId ?? ''} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Chip sm tone="sky"><LogoMark brand="sui" size={14} /> testnet</Chip>
              <button className="copy-btn" onClick={() => disconnect()}><Ic name="logout" size={14} /> Disconnect wallet</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CopyField label="guest id" value={id.userId ?? ''} />
            <div className="tile" style={{ padding: 16, background: 'var(--mint)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="mem-ic deco" style={{ width: 44, height: 44, flex: '0 0 44px', background: 'var(--paper)' }}><Ic name="sui" size={22} /></div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 16 }}>Make your memory portable</div>
                <div className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>Connect a Sui wallet so your reflections follow you to any device.</div>
              </div>
              <button className="btn sage sm" onClick={() => setConnectOpen(true)}><Ic name="wallet" size={18} /> Connect</button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 22, background: 'var(--cream-2)' }}>
        <div className="display" style={{ fontSize: 17, marginBottom: 8 }}>How identity works in Echo</div>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
          <li>Your <b>user id</b> (wallet address or guest id) is the private key your memories are scoped to.</li>
          <li>Reflections from one identity never mix with another — full isolation.</li>
          <li>Connect a wallet and the same memory follows you anywhere you sign in.</li>
        </ul>
      </div>
    </SettingsShell>
  );
}

/* ================= PRIVACY & MEMORY ================= */
export function Privacy() {
  const { go, setName, setPfp } = useEcho();
  const { onWalrus } = useJourneyStats();
  const id = useIdentity();

  const resetLocal = () => {
    if (!confirm('Reset your local name and photo on this device? Your saved memories on Walrus are untouched.')) return;
    setName('friend'); setPfp(null);
  };

  const DO = [
    'Emotional summaries of a session (never the raw transcript)',
    'Triggers, patterns, and what helped',
    'One tiny next step',
  ];
  const DONT = [
    'Raw chat or casual small talk',
    'Anything you didn’t review and approve',
    'Crisis content — it’s routed to safety, never stored',
    'Duplicates of what you already saved',
  ];

  return (
    <SettingsShell active="privacy" eyebrow="you’re in control" icon="lock" title="Privacy & memory" accent="var(--lav)"
      sub="Nothing is remembered until you approve it. Here’s exactly what Echo keeps, what it never keeps, and how to manage it.">
      <div className="card" style={{ padding: 24, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div className="mem-ic deco" style={{ width: 54, height: 54, flex: '0 0 54px', background: 'var(--mint)' }}><Ic name="anchor" size={28} /></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="display" style={{ fontSize: 20 }}>{onWalrus} {onWalrus === 1 ? 'memory' : 'memories'} on Walrus</div>
          <div className="muted" style={{ fontWeight: 600, fontSize: 14 }}>Stored under {id.mode === 'wallet' ? 'your wallet' : 'your guest session'} · verifiable & yours</div>
        </div>
        <Btn variant="primary" iconR="map" onClick={() => go('timeline')}>View my journey</Btn>
      </div>

      <div className="r-2" style={{ marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="display" style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}><Ic name="check" size={20} stroke="var(--sage-deep)" /> Echo keeps</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 9, fontWeight: 600, fontSize: 14.5 }}>{DO.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
        <div className="card" style={{ padding: 22, background: 'var(--cream-2)' }}>
          <div className="display" style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}><Ic name="x" size={20} stroke="var(--rose-deep)" /> Echo never keeps</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 9, fontWeight: 600, fontSize: 14.5, color: 'var(--ink-soft)' }}>{DONT.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
      </div>

      <div className="card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="display" style={{ fontSize: 17 }}>Reset this device</div>
          <div className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>Clears your local name and photo. Saved Walrus memories are not affected.</div>
        </div>
        <button className="copy-btn" onClick={resetLocal}><Ic name="logout" size={14} /> Reset local profile</button>
      </div>
    </SettingsShell>
  );
}

/* ================= HELP & SUPPORT ================= */
const FAQS: { q: string; a: string }[] = [
  { q: 'Is Echo therapy?', a: 'No. Echo is an evidence-informed reflection companion — a calm space to think out loud and notice patterns. It is not therapy, medical care, or a crisis service, and it never diagnoses or treats.' },
  { q: 'What does Echo remember?', a: 'Only the distilled, meaningful threads you approve — an emotional summary, a trigger, a pattern, what helped, and a tiny next step. Never your raw words or casual chatter.' },
  { q: 'Where do my memories live?', a: 'On Walrus, a decentralized storage network, keyed to your Sui wallet (or a guest session). You can see the blob proof for every saved memory in the Debrief.' },
  { q: 'Do I need a wallet?', a: 'No — guest mode works instantly. Connecting a Sui wallet makes your memory portable and verifiable across devices.' },
  { q: 'Can Echo hear me?', a: 'In Chrome or Edge, Echo can listen and speak using your browser’s built-in speech. Elsewhere you can type — the experience is the same.' },
];

export function Help() {
  return (
    <SettingsShell active="help" eyebrow="we’re here for you" icon="help" title="Help & support" accent="var(--sun)"
      sub="A few things worth knowing — and where to turn if you need more than reflection.">
      <div className="card card-lg" style={{ padding: 24, marginBottom: 18, background: 'linear-gradient(120deg, #FBE2D4 0%, var(--cream) 120%)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <EchoLogo size={60} />
        <div>
          <div className="display" style={{ fontSize: 18 }}>Echo is a reflection companion — not medical care.</div>
          <p className="muted" style={{ margin: '4px 0 0', fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>{BASELINE_SAFETY_NOTE}</p>
        </div>
      </div>

      <div className="display" style={{ fontSize: 18, margin: '4px 0 12px' }}>Common questions</div>
      <div style={{ marginBottom: 18 }}>
        {FAQS.map((f, i) => (
          <details className="faq" key={i} open={i === 0}>
            <summary>{f.q} <Ic name="arrowR" size={16} stroke="var(--ink-faint)" /></summary>
            <p className="fa">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="mem-ic deco" style={{ width: 48, height: 48, flex: '0 0 48px', background: 'var(--lav)' }}><Ic name="chat" size={24} /></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="display" style={{ fontSize: 17 }}>Still need a hand?</div>
          <div className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>Reach the team — we read every note.</div>
        </div>
        <a className="btn primary sm" href="mailto:echo.gethelp@gmail.com?subject=Echo%20support" style={{ textDecoration: 'none' }}><Ic name="bell" size={18} /> Contact support</a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <PoweredBy variant="named" size={20} boxed />
      </div>
    </SettingsShell>
  );
}
