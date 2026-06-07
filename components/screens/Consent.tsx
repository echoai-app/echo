'use client';

import React, { useEffect, useState } from 'react';
import { ConnectModal } from '@mysten/dapp-kit';
import { Doodles, Eyebrow, Btn, Chip, Ic, Orb } from '../ui';
import { useEcho } from '@/lib/store';
import { useIdentity } from '../identity';
import { BASELINE_SAFETY_NOTE } from '@/lib/echo/safety';

const PROMISES = [
  { ic: 'check', tone: 'var(--sage)', t: "You choose what's saved", d: 'Nothing is remembered until you review and approve it.' },
  { ic: 'leaf', tone: 'var(--peach)', t: 'Only meaningful insights', d: 'Echo keeps reflections and patterns — never raw, casual chatter.' },
  { ic: 'shield', tone: 'var(--sky)', t: 'Yours to forget', d: 'You can revisit or delete any saved memory, any time.' },
];

function SectionLabel({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '30px 0 16px' }}>
      <span className="kicker">{children}</span>
      <span style={{ flex: 1, height: 2.5, background: 'var(--cream-3)', borderRadius: 9 }} />
      {note && <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{note}</span>}
    </div>
  );
}

function AccountCard({ active, onClick, ic, tone, title, sub, body, chip, chipIc, chipTone }: {
  active: boolean; onClick: () => void; ic: string; tone: string; title: string; sub: string;
  body: string; chip: string; chipIc?: string | null; chipTone?: string;
}) {
  return (
    <div onClick={onClick} tabIndex={0} role="button" onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="mode-card clickable"
      style={{ background: active ? tone : 'var(--paper)', boxShadow: active ? '7px 9px 0 var(--ink)' : '5px 6px 0 var(--ink)', outline: active ? '3px solid var(--ink)' : 'none', outlineOffset: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="mode-ic deco" style={{ width: 58, height: 58, background: tone }}><Ic name={ic} size={32} /></div>
        <div style={{ width: 28, height: 28, borderRadius: 99, border: '2.6px solid var(--ink)', display: 'grid', placeItems: 'center', background: active ? 'var(--sage-deep)' : 'var(--paper)' }}>{active && <Ic name="check" size={16} stroke="#fff" />}</div>
      </div>
      <div>
        <div className="display" style={{ fontSize: 24 }}>{title}</div>
        <div className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{sub}</div>
      </div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, lineHeight: 1.45, color: 'var(--ink)' }}>{body}</p>
      <Chip sm tone={chipTone} ic={chipIc}>{chip}</Chip>
    </div>
  );
}

export default function Consent() {
  const { resetTo, setAccount, setOnboarded, name, setName } = useEcho();
  const id = useIdentity();
  const [sel, setSel] = useState<'guest' | 'wallet'>('guest');
  const [connectOpen, setConnectOpen] = useState(false);
  const [nm, setNm] = useState(name);
  const [confirmed, setConfirmed] = useState(false);

  // When a wallet connects, reflect it in the selection.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local UI choice to the external wallet-connection state
  useEffect(() => { if (id.mode === 'wallet') setSel('wallet'); }, [id.mode]);

  const connected = id.mode === 'wallet';
  const named = nm.trim().length > 0;

  const confirmName = () => { if (named) { setName(nm.trim()); setConfirmed(true); } };

  const cont = () => {
    if (!named) return;
    setName(nm.trim());
    if (sel === 'wallet' && !connected) { setConnectOpen(true); return; }
    setAccount(sel);
    setOnboarded(true);   // intro is done — returning users skip it next time
    resetTo('modes');     // fresh history — can't go "back" into the intro
  };

  return (
    <div className="bg-lavwash" style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <Doodles />
      <ConnectModal open={connectOpen} onOpenChange={setConnectOpen} trigger={<span aria-hidden style={{ display: 'none' }} />} />
      <div className="screen-pad" style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 2, paddingTop: 52, paddingBottom: 44 }}>
        <div className="up d1" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Eyebrow ic="db">how your memory works</Eyebrow>
          <h2 className="display">Before we begin.</h2>
          <p className="lede" style={{ maxWidth: 620 }}>Echo is a calm place to reflect and understand yourself — guided gently, and remembered over time. Here&apos;s how your memories work, and how to keep them.</p>
        </div>

        {/* name — the warm welcome */}
        <div className="up d2 card card-lg" style={{ marginTop: 28, padding: 'clamp(22px,3vw,28px)', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', background: 'linear-gradient(120deg, var(--paper) 0%, var(--cream) 100%)' }}>
          <Orb size={68} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 className="display" style={{ fontSize: 'clamp(20px,2.4vw,26px)', margin: 0 }}>What should Echo call you?</h3>
            <p className="muted" style={{ fontWeight: 600, fontSize: 13.5, margin: '4px 0 12px' }}>Echo will greet you by this — you can change it any time.</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 440 }}>
              <input className={'field-edit' + (confirmed ? ' ok' : '')} autoFocus value={nm} maxLength={32} placeholder="your name or nickname"
                onChange={e => { setNm(e.target.value); setConfirmed(false); }}
                onKeyDown={e => e.key === 'Enter' && confirmName()} style={{ flex: 1 }} />
              <button className={'tick-btn' + (confirmed ? ' on' : '')} disabled={!named} onClick={confirmName} title="Confirm name" aria-label="Confirm name">
                <Ic name="check" size={24} sw={3.2} stroke={confirmed ? '#fff' : 'var(--ink)'} />
              </button>
            </div>
            {confirmed && <div style={{ marginTop: 10, fontWeight: 700, fontSize: 13.5, color: 'var(--sage-deep)', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic name="spark" size={14} stroke="var(--sage-deep)" fill="var(--sage-deep)" /> Lovely to meet you, {nm.trim()}.</div>}
          </div>
        </div>

        <SectionLabel note="consent-first, always">your privacy promises</SectionLabel>
        <div className="up d2 r-3">
          {PROMISES.map((p, k) => (
            <div key={k} className="tile" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, border: '2.6px solid var(--ink)', display: 'grid', placeItems: 'center', background: p.tone, boxShadow: '2px 3px 0 var(--ink)' }}><Ic name={p.ic} size={26} /></div>
              <div className="display" style={{ fontSize: 19 }}>{p.t}</div>
              <div className="muted" style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.45 }}>{p.d}</div>
            </div>
          ))}
        </div>

        <SectionLabel>how should your memories live?</SectionLabel>
        <div className="up d3">
          <div className="r-2">
            <AccountCard active={sel === 'guest'} onClick={() => setSel('guest')} ic="ghost" tone="var(--cream-2)"
              title="Guest" sub="Just exploring" body="Memories stay tied to this browser for now. Nothing is signed by a wallet." chip="No wallet needed" />
            <AccountCard active={sel === 'wallet'} onClick={() => setSel('wallet')} ic="wallet" tone="var(--mint)"
              title="Sui Wallet" sub="Portable & verifiable"
              body="Your wallet address becomes your private memory key. Reflections persist on Walrus across any device."
              chip={connected ? `${id.shortAddress} · connected` : 'Recommended'} chipIc="sui" chipTone="sage" />
          </div>
          {sel === 'wallet' && !connected && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
              <button className="btn sage" onClick={() => setConnectOpen(true)}><Ic name="wallet" size={20} /> Connect Sui Wallet</button>
            </div>
          )}
        </div>

        <div className="up d4" style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="safety" style={{ borderRadius: 16, padding: '12px 18px', alignItems: 'flex-start', lineHeight: 1.45, fontSize: 13.5 }}>
            <Ic name="heart" size={16} stroke="var(--rose-deep)" fill="var(--rose)" />
            <span>{BASELINE_SAFETY_NOTE}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
            {!named && <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>add your name to continue</span>}
            <Btn variant="primary" iconR="arrowR" onClick={cont} disabled={!named}>
              {sel === 'wallet' && !connected ? 'Connect to continue' : 'I understand — continue'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
