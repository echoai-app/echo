'use client';

import React, { useEffect, useState } from 'react';
import { ConnectModal } from '@mysten/dapp-kit';
import { Doodles, Eyebrow, Btn, Chip, Ic } from '../ui';
import { useEcho } from '@/lib/store';
import { useIdentity } from '../identity';
import { BASELINE_SAFETY_NOTE } from '@/lib/echo/safety';

const PROMISES = [
  { ic: 'check', t: "You choose what's saved", d: 'Nothing is remembered until you review and approve it.' },
  { ic: 'leaf', t: 'Only meaningful insights', d: 'Echo keeps reflections and patterns — never raw, casual chatter.' },
  { ic: 'shield', t: 'Yours to forget', d: 'You can revisit or delete any saved memory, any time.' },
];

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
  const { go, setAccount, setOnboarded, name, setName } = useEcho();
  const id = useIdentity();
  const [sel, setSel] = useState<'guest' | 'wallet'>('guest');
  const [connectOpen, setConnectOpen] = useState(false);
  const [nm, setNm] = useState(name);

  // When a wallet connects, reflect it in the selection.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local UI choice to the external wallet-connection state
  useEffect(() => { if (id.mode === 'wallet') setSel('wallet'); }, [id.mode]);

  const [confirmed, setConfirmed] = useState(false);
  const connected = id.mode === 'wallet';
  const named = nm.trim().length > 0;

  const confirmName = () => { if (named) { setName(nm.trim()); setConfirmed(true); } };

  const cont = () => {
    if (!named) return;
    setName(nm.trim());
    if (sel === 'wallet' && !connected) { setConnectOpen(true); return; }
    setAccount(sel);
    setOnboarded(true);   // intro is done — returning users skip it next time
    go('modes');
  };

  return (
    <div className="bg-lavwash" style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <Doodles />
      <ConnectModal open={connectOpen} onOpenChange={setConnectOpen} trigger={<span aria-hidden style={{ display: 'none' }} />} />
      <div className="screen-pad" style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 2, paddingTop: 56, paddingBottom: 40 }}>
        <div className="up d1" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Eyebrow ic="db">how your memory works</Eyebrow>
          <h2 className="display">Before we begin.</h2>
          <p className="lede" style={{ maxWidth: 640 }}>Echo is a calm place to reflect and understand yourself — guided gently, and remembered over time. Here&apos;s how your memories work, and how to keep them.</p>
        </div>

        <div className="up d2 card" style={{ marginTop: 26, padding: 22, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', background: 'var(--paper)' }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, border: '2.6px solid var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--peach)', flex: '0 0 50px' }}><Ic name="heart" size={26} /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="kicker" style={{ marginBottom: 8 }}>first — what should Echo call you?</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 420 }}>
              <input className={'field-edit' + (confirmed ? ' ok' : '')} autoFocus value={nm} maxLength={32} placeholder="your name or nickname"
                onChange={e => { setNm(e.target.value); setConfirmed(false); }}
                onKeyDown={e => e.key === 'Enter' && confirmName()} style={{ flex: 1 }} />
              <button className={'tick-btn' + (confirmed ? ' on' : '')} disabled={!named} onClick={confirmName}
                title="Confirm name" aria-label="Confirm name">
                <Ic name="check" size={24} sw={3.2} stroke={confirmed ? '#fff' : 'var(--ink)'} />
              </button>
            </div>
            {confirmed && <div style={{ marginTop: 8, fontWeight: 700, fontSize: 13.5, color: 'var(--sage-deep)', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic name="spark" size={14} stroke="var(--sage-deep)" fill="var(--sage-deep)" /> Lovely to meet you, {nm.trim()}.</div>}
          </div>
        </div>

        <div className="up d2 r-3" style={{ marginTop: 22 }}>
          {PROMISES.map((p, k) => (
            <div key={k} className="tile" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, border: '2.5px solid var(--ink)', display: 'grid', placeItems: 'center', background: ['var(--sage)', 'var(--peach)', 'var(--sky)'][k] }}><Ic name={p.ic} size={26} /></div>
              <div className="display" style={{ fontSize: 19 }}>{p.t}</div>
              <div className="muted" style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.45 }}>{p.d}</div>
            </div>
          ))}
        </div>

        <div className="up d3" style={{ marginTop: 30 }}>
          <div className="kicker" style={{ marginBottom: 12 }}>how should your memories live?</div>
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
