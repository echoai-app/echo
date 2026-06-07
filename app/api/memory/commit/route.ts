import { NextRequest, NextResponse } from 'next/server';
import { storeMemoriesBatch, findDuplicateMemory, type MemorySpec } from '@/lib/walrus/memory';
import { themeTagsFor } from '@/lib/echo/text';
import { ensureWorkspaceId } from '@/lib/workspace';
import type { ReflectionArtifact, SavedArtifact, WalrusProof, SessionMeta } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface CommitBody {
  user_id: string;
  workspace_id?: string;
  session_id: string;
  mode?: string;
  meta?: Partial<SessionMeta>;
  approved: ReflectionArtifact[];
  summary?: string;
  theme?: string;
}

function pendingProof(seed: string): WalrusProof {
  return { blob_id: `local-${seed}`, certified: false, pending: true };
}

// POST /api/memory/commit — writes ONLY the approved artifacts to Walrus (in one
// batched, parallel commit), plus a session summary for the journey. Returns
// each saved artifact's verifiable proof.
export async function POST(req: NextRequest) {
  let body: CommitBody;
  try {
    body = (await req.json()) as CommitBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { user_id, session_id, mode, meta = {}, approved = [], summary, theme } = body;
  if (!user_id || !session_id) {
    return NextResponse.json({ error: 'user_id and session_id are required' }, { status: 400 });
  }
  const workspace_id = body.workspace_id ?? ensureWorkspaceId(user_id);

  // Dedupe against existing memory so we never re-submit identical artifacts.
  const fresh: ReflectionArtifact[] = [];
  for (const art of approved) {
    try {
      const dup = await findDuplicateMemory(user_id, workspace_id, art.kind, art.text);
      if (!dup) fresh.push(art);
    } catch { fresh.push(art); }
  }

  // Build the batch: one spec per approved artifact + one session-summary spec.
  const artifactSpecs: MemorySpec[] = fresh.map(art => ({
    content: { text: art.text, kind: art.kind, confidence: art.confidence },
    type: 'reflection_artifact',
    tags: ['reflection', art.kind, ...themeTagsFor(art.text).map(t => `theme:${t}`)],
    session_id,
    workspace_id,
    memory_type: art.kind,
    importance: art.confidence,
    summary: art.text,
  }));

  const sessionSpec: MemorySpec | null = fresh.length > 0 ? {
    content: {
      theme: theme ?? '', summary: summary ?? '', mode: mode ?? '',
      intensity: meta.intensity, feelings: meta.feelings ?? [], savedCount: fresh.length,
    },
    type: 'session_summary',
    tags: ['session', `mode:${meta.modeTitle ?? mode ?? 'Reflection'}`, `intensity:${meta.intensity ?? ''}`],
    session_id,
    workspace_id,
    importance: 0.5,
    summary: theme ?? summary ?? 'A reflection',
  } : null;

  const allSpecs = sessionSpec ? [...artifactSpecs, sessionSpec] : artifactSpecs;
  // Flush the durable index synchronously so we can return its Walrus blob id —
  // the client registers that id on-chain (the MemoryPointer) right after.
  const { results, indexBlobId } = allSpecs.length
    ? await storeMemoriesBatch(user_id, allSpecs, { flushIndex: true })
    : { results: [], indexBlobId: null };

  // Map artifact results back to SavedArtifacts (the session summary is last).
  const saved: SavedArtifact[] = fresh.map((art, i) => {
    const r = results[i];
    return {
      ...art,
      blob_id: r?.blob_id ?? `local-${art.id}`,
      proof: r?.proof ?? pendingProof(art.id),
      savedAt: new Date().toISOString(),
    };
  });

  const walrusOk = results.some(r => r.ok);
  const proof = saved.find(s => !s.proof.pending)?.proof ?? saved[0]?.proof ?? pendingProof(session_id);

  return NextResponse.json({ saved, proof, total: saved.length, walrusOk, workspace_id, index_blob_id: indexBlobId });
}
