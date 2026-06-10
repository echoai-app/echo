'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { EchoLogo, Ic, Chip } from '@/components/ui';

/* ============================================================================
   Memory Inspector — trustless agent-memory explorer.

   Paste any wallet address and this page reads the whole memory chain with
   ZERO Echo backend involvement:

     wallet ──▶ MemoryPointer (Sui RPC, read in your browser)
                  └──▶ index blob (Walrus aggregator, read in your browser)
                         └──▶ memory artifacts (Walrus blobs)

   This is the point of the architecture: agent memory that anyone can
   inspect, verify, and recover — even if Echo's servers disappear.
   ========================================================================== */

const PKG = process.env.NEXT_PUBLIC_ECHO_PACKAGE_ID ?? '';
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet';
const RPC = `https://fullnode.${NETWORK}.sui.io`;
const AGGREGATOR = `https://aggregator.walrus-${NETWORK}.walrus.space`;

interface PointerInfo { objectId: string; indexBlobId: string; updates: number }
interface IndexEntry {
  blob_id: string; type: string; tags: string[]; created_at: string;
  session_id?: string; workspace_id?: string; memory_type?: string;
  importance?: number; summary?: string; vector?: number[];
}
interface MemIndex { user_id: string; entries: IndexEntry[]; updated_at: string }

const short = (s: string, h = 8, t = 6) => (s.length <= h + t + 1 ? s : `${s.slice(0, h)}…${s.slice(-t)}`);
const suiscan = (p: string) => `https://suiscan.xyz/${NETWORK}/${p}`;
const walruscan = (id: string) => `https://walruscan.com/${NETWORK}/blob/${id}`;

async function fetchPointer(owner: string): Promise<PointerInfo | null> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'suix_getOwnedObjects',
      params: [owner, { filter: { StructType: `${PKG}::memory_registry::MemoryPointer` }, options: { showContent: true } }, null, 10],
    }),
  });
  const json = await res.json();
  for (const o of json?.result?.data ?? []) {
    const f = o?.data?.content?.fields;
    if (f?.index_blob_id) return { objectId: o.data.objectId, indexBlobId: f.index_blob_id, updates: Number(f.updates ?? 0) };
  }
  return null;
}

function StepChip({ label, sub, on, dim }: { label: string; sub: string; on?: boolean; dim?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', border: '2.6px solid var(--ink)', borderRadius: 14, padding: '7px 14px', background: on ? 'var(--mint)' : 'var(--paper)', opacity: dim ? 0.45 : 1, boxShadow: '2px 3px 0 var(--ink)' }}>
      <b style={{ fontSize: 13.5, lineHeight: 1.15, fontFamily: 'var(--display)' }}>{label}</b>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{sub}</span>
    </span>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14, padding: '8px 0', borderBottom: '2px dashed var(--cream-3)', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink-soft)', letterSpacing: '.03em', textTransform: 'uppercase' }}>{k}</span>
      <span className="mono" style={{ fontWeight: 600, fontSize: 13, wordBreak: 'break-all', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function ArtifactCard({ e }: { e: IndexEntry }) {
  const [raw, setRaw] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const view = async () => {
    if (raw) { setRaw(null); return; }
    setBusy(true);
    try {
      const r = await fetch(`${AGGREGATOR}/v1/blobs/${e.blob_id}`);
      const txt = await r.text();
      try { setRaw(JSON.stringify(JSON.parse(txt), null, 2)); } catch { setRaw(txt.slice(0, 2000)); }
    } catch { setRaw('— could not fetch this blob from the aggregator —'); }
    setBusy(false);
  };
  return (
    <div className="card" style={{ padding: '16px 20px', boxShadow: '3px 4px 0 var(--ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <Chip sm>{e.memory_type ?? e.type}</Chip>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 160 }}>{e.summary || '(no summary)'}</span>
        <span className="muted" style={{ fontWeight: 700, fontSize: 12 }}>{e.created_at?.slice(0, 10)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <a className="chip sm mono" style={{ textDecoration: 'none', fontSize: 11, color: 'var(--ink)', background: 'var(--mint)' }} href={walruscan(e.blob_id)} target="_blank" rel="noreferrer" title={e.blob_id}>
          <Ic name="db" size={12} /> {short(e.blob_id)} ↗
        </a>
        <button className="chip sm chip-btn" style={{ fontSize: 11.5 }} onClick={view} disabled={busy}>
          <Ic name="lens" size={12} /> {busy ? 'fetching…' : raw ? 'hide raw blob' : 'view raw blob'}
        </button>
        {e.vector && e.vector.length > 0 && <span className="muted" style={{ fontSize: 11, fontWeight: 700 }}>embedding[{e.vector.length}] omitted</span>}
        {(e.tags ?? []).slice(0, 4).map(t => <span key={t} className="muted" style={{ fontSize: 11, fontWeight: 700 }}>#{t}</span>)}
      </div>
      {raw && (
        <pre className="mono" style={{ marginTop: 12, marginBottom: 0, background: 'var(--cream-2)', border: '2.5px solid var(--ink)', borderRadius: 12, padding: 14, fontSize: 11.5, lineHeight: 1.5, overflowX: 'auto', maxHeight: 320 }}>{raw}</pre>
      )}
    </div>
  );
}

export default function InspectPage() {
  const [address, setAddress] = useState('');
  const [phase, setPhase] = useState<'idle' | 'pointer' | 'index' | 'done' | 'nopointer' | 'error'>('idle');
  const [pointer, setPointer] = useState<PointerInfo | null>(null);
  const [index, setIndex] = useState<MemIndex | null>(null);
  const [error, setError] = useState('');

  const inspect = useCallback(async (addr: string) => {
    const a = addr.trim();
    if (!/^0x[0-9a-fA-F]{4,}$/.test(a)) { setError('That doesn’t look like a Sui address (0x…).'); setPhase('error'); return; }
    setError(''); setPointer(null); setIndex(null);
    setPhase('pointer');
    try {
      const ptr = await fetchPointer(a);
      if (!ptr) { setPhase('nopointer'); return; }
      setPointer(ptr);
      setPhase('index');
      const res = await fetch(`${AGGREGATOR}/v1/blobs/${ptr.indexBlobId}`);
      if (!res.ok) throw new Error(`aggregator returned ${res.status}`);
      const idx = (await res.json()) as MemIndex;
      setIndex(idx);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong reading the chain.');
      setPhase('error');
    }
  }, []);

  // shareable links: /inspect?address=0x…
  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get('address');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL params are only readable client-side, after mount
    if (a) { setAddress(a); inspect(a); }
  }, [inspect]);

  const entries = index?.entries ?? [];
  const visible = [...entries].sort((x, y) => (y.created_at ?? '').localeCompare(x.created_at ?? ''));

  return (
    <div className="bg-cream" style={{ minHeight: '100vh', overflowY: 'auto', position: 'absolute', inset: 0 }}>
      {/* slim header */}
      <div className="appbar">
        <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'var(--ink)' }} title="Back to Echo">
          <EchoLogo size={38} />
          <span style={{ letterSpacing: '-.01em' }}>ech<span style={{ color: 'var(--peach-deep)' }}>o</span></span>
        </Link>
        <span className="chip" style={{ boxShadow: '2px 3px 0 var(--ink)' }}><Ic name="lens" size={16} /> Memory Inspector</span>
        <Link href="/" className="chip chip-btn" style={{ textDecoration: 'none', color: 'var(--ink)' }}><Ic name="arrowL" size={14} /> Back to app</Link>
      </div>

      <div className="screen-pad" style={{ maxWidth: 880, margin: '0 auto' }}>
        <div className="tc" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <h1 className="display" style={{ margin: 0, fontSize: 'clamp(30px,4.5vw,44px)' }}>Inspect any agent&rsquo;s memory.</h1>
          <p className="lede" style={{ maxWidth: 640, margin: 0 }}>
            This page reads the full memory chain — <b>Sui RPC → MemoryPointer → Walrus index → artifacts</b> — directly in your browser.
            <b> No Echo backend involved.</b>{' '}If Echo&rsquo;s servers vanished tomorrow, this page would still work.
          </p>
        </div>

        {/* address input */}
        <div className="card card-lg" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <input className="field" style={{ flex: 1, minWidth: 240 }} placeholder="0x… any Sui wallet that saved memories with Echo"
            value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && inspect(address)} />
          <button className="btn primary" onClick={() => inspect(address)} disabled={phase === 'pointer' || phase === 'index'}>
            <Ic name="lens" size={18} /> {phase === 'pointer' || phase === 'index' ? 'Reading chain…' : 'Inspect'}
          </button>
        </div>

        {/* the chain, lighting up as it resolves */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 22 }}>
          <StepChip label="wallet" sub="Sui address" on={phase !== 'idle'} />
          <Ic name="arrowR" size={15} stroke="var(--ink-faint)" />
          <StepChip label="MemoryPointer" sub="Sui object" on={!!pointer} dim={phase === 'nopointer'} />
          <Ic name="arrowR" size={15} stroke="var(--ink-faint)" />
          <StepChip label="index blob" sub="Walrus" on={!!index} dim={phase === 'nopointer'} />
          <Ic name="arrowR" size={15} stroke="var(--ink-faint)" />
          <StepChip label={`${entries.length || '…'} artifacts`} sub="Walrus blobs" on={entries.length > 0} dim={phase === 'nopointer'} />
        </div>

        {phase === 'nopointer' && (
          <div className="card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
            <div className="mem-ic deco" style={{ width: 50, height: 50, flex: '0 0 50px', background: 'var(--cream-2)' }}><Ic name="ghost" size={26} /></div>
            <div>
              <div className="display" style={{ fontSize: 19 }}>No MemoryPointer on this wallet.</div>
              <p className="muted" style={{ margin: '4px 0 0', fontWeight: 600, fontSize: 14 }}>This address hasn&rsquo;t saved wallet-mode memories with Echo yet — connect it in the app, save a reflection, and the pointer appears here.</p>
            </div>
          </div>
        )}
        {phase === 'error' && (
          <div className="card" style={{ padding: 20, marginBottom: 18, background: 'var(--rose)' }}>
            <b>Couldn&rsquo;t read the chain:</b> <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {pointer && (
          <div className="card" style={{ padding: 22, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="display" style={{ fontSize: 19 }}>On-chain MemoryPointer</span>
              <Chip sm style={{ background: 'var(--sky)' }}>Sui · {NETWORK}</Chip>
            </div>
            <Row k="Object">
              <a href={suiscan(`object/${pointer.objectId}`)} target="_blank" rel="noreferrer" style={{ color: 'var(--ink)' }}>{short(pointer.objectId, 12, 8)} ↗</a>
            </Row>
            <Row k="Points to index">
              <a href={walruscan(pointer.indexBlobId)} target="_blank" rel="noreferrer" style={{ color: 'var(--ink)' }}>{short(pointer.indexBlobId, 12, 8)} ↗</a>
            </Row>
            <Row k="Updates (wallet-signed)">{pointer.updates}</Row>
          </div>
        )}

        {index && (
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px', flexWrap: 'wrap' }}>
              <span className="display" style={{ fontSize: 19 }}>Memory artifacts</span>
              <Chip sm style={{ background: 'var(--mint)' }}>{entries.length} in index</Chip>
              <span className="muted" style={{ fontWeight: 700, fontSize: 12.5 }}>index updated {index.updated_at?.slice(0, 10)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visible.map((e, i) => <ArtifactCard key={e.blob_id + i} e={e} />)}
            </div>
          </div>
        )}

        <div className="tc" style={{ paddingBottom: 36 }}>
          <p className="muted" style={{ fontWeight: 600, fontSize: 12.5, maxWidth: 560, margin: '0 auto' }}>
            Built on <b>Mnemos</b> — a verifiable agent-memory layer on Walrus + Sui. Echo is for reflection &amp; self-awareness, not medical or crisis care.
          </p>
        </div>
      </div>
    </div>
  );
}
