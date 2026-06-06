'use client';

import { Ic, Btn } from './ui';
import type { WalrusProof } from '@/types';

export function ProofBadge({ onClick, pending }: { onClick: () => void; pending?: boolean }) {
  return (
    <button className={'proof-badge' + (pending ? ' pending' : '')} onClick={onClick}>
      <span className={'proof-dot' + (pending ? ' pending' : '')} />
      {pending ? 'Saved · syncing to Walrus' : 'Saved to Walrus'} <Ic name="arrowR" size={13} />
    </button>
  );
}

function short(s?: string, head = 10, tail = 8): string {
  if (!s) return '—';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function ProofModal({ open, onClose, proof, count }: {
  open: boolean; onClose: () => void; proof: WalrusProof | null; count: number;
}) {
  if (!open || !proof) return null;
  const pending = proof.pending;
  const walruscan = proof.blob_id && !pending
    ? `https://walruscan.com/testnet/blob/${proof.blob_id}`
    : undefined;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(53,42,31,.42)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="card card-lg" style={{ width: 'min(560px,94vw)', padding: 0, overflow: 'hidden', animation: 'up .4s both' }}>
        <div style={{ background: pending ? 'var(--cream-2)' : 'var(--mint)', padding: '22px 26px', borderBottom: '3px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, border: '3px solid var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--paper)', boxShadow: '2px 3px 0 var(--ink)' }}><Ic name="anchor" size={30} /></div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22 }}>{pending ? 'Saving to Walrus' : 'Stored on Walrus'}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-soft)' }}>{count} reflection {count === 1 ? 'memory' : 'memories'} · {pending ? 'finalizing on testnet…' : 'verifiable & portable'}</div>
          </div>
          <button onClick={onClose} className="chip" style={{ cursor: 'pointer', boxShadow: '2px 3px 0 var(--ink)' }}><Ic name="x" size={16} /></button>
        </div>
        <div style={{ padding: '10px 26px 22px' }}>
          <div className="proof-row"><span className="k">Blob ID</span><span className="v mono" style={{ fontSize: 12.5, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{proof.blob_id}</span></div>
          <div className="proof-row"><span className="k">Sui object</span><span className="v mono">{short(proof.sui_object)}</span></div>
          <div className="proof-row"><span className="k">Stored at epoch</span><span className="v">{proof.epoch ?? '—'} {proof.expiry != null && <span className="muted" style={{ fontWeight: 600 }}>· through {proof.expiry}</span>}</span></div>
          <div className="proof-row"><span className="k">Size · cost</span><span className="v">{proof.size ?? '—'}{proof.cost ? ` · ${proof.cost}` : ''}</span></div>
          <div className="proof-row"><span className="k">Status</span><span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span className={'proof-dot' + (pending ? ' pending' : '')} /> {pending ? 'Syncing' : proof.certified ? 'Certified' : 'Stored'}</span></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {walruscan
              ? <a href={walruscan} target="_blank" rel="noreferrer" className="btn sm block" style={{ textDecoration: 'none' }}><Ic name="db" size={18} /> View on Walruscan</a>
              : <Btn size="sm" block icon="db">View on Walruscan</Btn>}
            <Btn size="sm" variant="sage" block icon="check" onClick={onClose}>Done</Btn>
          </div>
          <div className="muted tc" style={{ fontWeight: 600, fontSize: 12.5, marginTop: 12 }}>
            {pending ? 'Your words are kept safe locally and sync to Walrus when testnet confirms.' : 'Only shown when real storage succeeds. Your words stay yours.'}
          </div>
        </div>
      </div>
    </div>
  );
}
