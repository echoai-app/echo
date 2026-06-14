'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ic, Btn, LogoMark } from './ui';
import { suiscanTxUrl, suiscanObjectUrl } from '@/lib/sui/registry';
import type { WalrusProof } from '@/types';

export function ProofBadge({ onClick, pending, sui }: { onClick: () => void; pending?: boolean; sui?: boolean }) {
  return (
    <button className={'proof-badge' + (pending ? ' pending' : '')} onClick={onClick}>
      <span className={'proof-dot' + (pending ? ' pending' : '')} />
      {pending ? 'Saved · syncing to Walrus' : sui ? 'Walrus + Sui proof' : 'Saved to Walrus'} <Ic name="arrowR" size={13} />
    </button>
  );
}

/* Tap an id → a popover (rendered to <body>, so it's never clipped by the
   modal's scroll area) with the full value, copy, and explorer link. Click-to-
   toggle + close-on-outside-click means you can actually move to the buttons. */
function IdPopover({ value, link, label }: { value: string; link?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
    const estH = 138;
    const top = r.bottom + 8 + estH > window.innerHeight - 12 ? Math.max(12, r.top - estH - 8) : r.bottom + 8;
    setPos({ top, left, width: w });
  };
  const toggle = () => { if (!open) place(); setOpen(o => !o); };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || document.getElementById('idpop-live')?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch { /* visible anyway */ }
  };

  return (
    <>
      <span ref={triggerRef} className="v mono idpop-trigger" style={{ fontSize: 12.5, color: 'var(--ink)' }}
        role="button" tabIndex={0} onClick={toggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
        {short(value)}{link ? ' ↗' : ''}
      </span>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <span id="idpop-live" className="idpop" style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          onClick={e => e.stopPropagation()}>
          {label && <b style={{ fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>{label}</b>}
          <span className="full mono">{value}</span>
          <span className="acts">
            <button onClick={copy}><Ic name={copied ? 'check' : 'chat'} size={12} /> {copied ? 'Copied' : 'Copy'}</button>
            {link && <a href={link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><Ic name="db" size={12} /> Open</a>}
          </span>
        </span>,
        document.body
      )}
    </>
  );
}

function short(s?: string, head = 10, tail = 8): string {
  if (!s) return '—';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// The judge-verification chain, in plain English: each chip is a real,
// independently checkable artifact — no claims without a link.
function ProofChain({ signed }: { signed: boolean }) {
  const steps = [
    { label: 'memory blob', sub: 'Walrus' },
    { label: 'index blob', sub: 'Walrus' },
    { label: 'MemoryPointer', sub: signed ? 'Sui · wallet-signed' : 'Sui (wallet mode)' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '12px 0 2px' }}>
      {steps.map((s, i) => (
        <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <Ic name="arrowR" size={13} stroke="var(--ink-faint)" />}
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', border: '2.4px solid var(--ink)', borderRadius: 12, padding: '5px 11px', background: i === 2 && signed ? 'var(--sky)' : 'var(--cream-2)', opacity: i === 2 && !signed ? 0.55 : 1 }}>
            <b style={{ fontSize: 12.5, lineHeight: 1.1 }}>{s.label}</b>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{s.sub}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

export function ProofModal({ open, onClose, proof, count }: {
  open: boolean; onClose: () => void; proof: WalrusProof | null; count: number;
}) {
  const [copied, setCopied] = useState(false);
  if (!open || !proof) return null;
  const pending = proof.pending;
  const walruscan = proof.blob_id && !pending
    ? `https://walruscan.com/testnet/blob/${proof.blob_id}`
    : undefined;
  const reg = proof.sui_registry;
  const indexScan = reg ? `https://walruscan.com/${reg.network}/blob/${reg.index_blob_id}` : undefined;

  const verifyLinks = [
    walruscan && `Memory blob (Walruscan): ${walruscan}`,
    indexScan && `Memory index blob (Walruscan): ${indexScan}`,
    reg && `Pointer transaction (Suiscan): ${suiscanTxUrl(reg.digest)}`,
    reg?.object_id && `MemoryPointer object (Suiscan): ${suiscanObjectUrl(reg.object_id)}`,
  ].filter(Boolean).join('\n');

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(verifyLinks);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable — links remain visible in the card */ }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(53,42,31,.42)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="card card-lg proof-modal" style={{ width: 'min(560px,94vw)', maxHeight: '92dvh', padding: 0, overflowY: 'auto', animation: 'up .4s both' }}>
        <div className="proof-mod-head" style={{ background: pending ? 'var(--cream-2)' : 'var(--mint)', borderBottom: '3px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, border: '3px solid var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--paper)', boxShadow: '2px 3px 0 var(--ink)' }}><Ic name="anchor" size={30} /></div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22 }}>{pending ? 'Saving to Walrus' : 'Stored on Walrus'}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-soft)' }}>{count} reflection {count === 1 ? 'memory' : 'memories'} · {pending ? 'finalizing on testnet…' : proof.sui_registry ? 'verifiable on Walrus + Sui' : 'verifiable & portable'}</div>
          </div>
          <button onClick={onClose} className="chip" style={{ cursor: 'pointer', boxShadow: '2px 3px 0 var(--ink)' }}><Ic name="x" size={16} /></button>
        </div>
        <div className="proof-mod-body">
          {!pending && (
            <>
              <ProofChain signed={!!reg} />
              <p className="muted" style={{ margin: '8px 0 6px', fontWeight: 600, fontSize: 12.5, lineHeight: 1.45 }}>
                Your approved memories are real blobs on Walrus; an index blob maps them; {reg ? 'your wallet signed a Sui transaction pointing your on-chain MemoryPointer at that index.' : 'in wallet mode, a Sui MemoryPointer you own points at that index.'} Every link below is independently verifiable.
              </p>
            </>
          )}
          <div className="proof-row"><span className="k">Blob ID</span><IdPopover value={proof.blob_id} link={walruscan} label="Walrus memory blob" /></div>
          <div className="proof-row"><span className="k">Sui object</span><span className="v mono">{short(proof.sui_object)}</span></div>
          <div className="proof-row"><span className="k">Stored at epoch</span><span className="v">{proof.epoch ?? '—'} {proof.expiry != null && <span className="muted" style={{ fontWeight: 600 }}>· through {proof.expiry}</span>}</span></div>
          <div className="proof-row"><span className="k">Size · cost</span><span className="v">{proof.size ?? '—'}{proof.cost ? ` · ${proof.cost}` : ''}</span></div>
          <div className="proof-row"><span className="k">Status</span><span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span className={'proof-dot' + (pending ? ' pending' : '')} /> {pending ? 'Syncing' : proof.certified ? 'Certified' : 'Stored'}</span></div>

          {/* on-chain pointer — only shown after a real wallet-signed Sui tx */}
          {proof.sui_registry && (
            <div style={{ marginTop: 14, border: '2.5px solid var(--ink)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: 'var(--sky)', padding: '10px 14px', borderBottom: '2.5px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 13.5 }}>
                <LogoMark brand="sui" size={18} /> Pointer registered on Sui · {proof.sui_registry.network}
              </div>
              <div style={{ padding: '4px 14px 10px' }}>
                <div className="proof-row"><span className="k">Sui tx</span><IdPopover value={proof.sui_registry.digest} link={suiscanTxUrl(proof.sui_registry.digest)} label="wallet-signed transaction" /></div>
                {proof.sui_registry.object_id && <div className="proof-row"><span className="k">Pointer object</span><IdPopover value={proof.sui_registry.object_id} link={suiscanObjectUrl(proof.sui_registry.object_id)} label="your MemoryPointer on Sui" /></div>}
                <div className="proof-row"><span className="k">Points to index</span><IdPopover value={proof.sui_registry.index_blob_id} link={indexScan} label="Walrus index blob" /></div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {walruscan
              ? <a href={walruscan} target="_blank" rel="noreferrer" className="btn sm block" style={{ textDecoration: 'none' }}><Ic name="db" size={18} /> View on Walruscan</a>
              : <Btn size="sm" block icon="db">View on Walruscan</Btn>}
            {verifyLinks && <Btn size="sm" block icon={copied ? 'check' : 'chat'} onClick={copyAll}>{copied ? 'Copied!' : 'Copy proof links'}</Btn>}
            <Btn size="sm" variant="sage" block icon="check" onClick={onClose}>Done</Btn>
          </div>
          <div className="muted tc" style={{ fontWeight: 600, fontSize: 12.5, marginTop: 12 }}>
            {pending ? 'Your words are kept safe locally and sync to Walrus when testnet confirms.' : 'Only shown when real storage succeeds. Your words stay yours.'}
            {!pending && <>{' '}· <a href="/inspect" style={{ color: 'var(--ink)', fontWeight: 800 }}>open the Memory Inspector ↗</a></>}
          </div>
        </div>
      </div>
    </div>
  );
}
