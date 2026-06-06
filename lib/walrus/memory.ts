import { walrusStore, walrusStoreWithProof, walrusFetchJSON, aggregatorUrl } from './client';
import { embed, hasEmbeddings } from '@/lib/embeddings/voyage';
import { searchVectors, addToIndex, emptyIndex } from '@/lib/embeddings/search';
import type { ScoredEntry } from '@/lib/embeddings/search';
import type { MemoryBlob, MemoryBlobType, ArtifactKind, VectorIndex, BlobMetadata, WalrusProof } from '@/types';
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace';
import { promises as fs } from 'fs';
import path from 'path';

export type { ScoredEntry };

// Index persistence has two tiers:
//  1. LOCAL  — a fast JSON file per user (data/index/<user>.json) + a registry
//     pointer. This is the cross-request source of truth in dev/single-node and
//     is written synchronously (milliseconds), so recall/journey see new
//     memories immediately after a commit.
//  2. WALRUS — the durable, verifiable backup. The index blob is written to
//     Walrus too (can be deferred to background) so memory survives a cold start.
const DATA_DIR = path.join(process.cwd(), 'data');
const REGISTRY_PATH = path.join(DATA_DIR, 'registry.json');
const INDEX_DIR = path.join(DATA_DIR, 'index');

const indexCache = new Map<string, { index: VectorIndex; blobId: string | null }>();

function localIndexPath(userId: string): string {
  return path.join(INDEX_DIR, encodeURIComponent(userId) + '.json');
}

async function readRegistry(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(REGISTRY_PATH, 'utf-8')) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeRegistry(userId: string, blobId: string): Promise<void> {
  try {
    const reg = await readRegistry();
    reg[userId] = blobId;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(reg, null, 2), 'utf-8');
  } catch { /* non-fatal */ }
}

async function saveIndexLocal(userId: string, index: VectorIndex): Promise<void> {
  try {
    await fs.mkdir(INDEX_DIR, { recursive: true });
    await fs.writeFile(localIndexPath(userId), JSON.stringify(index), 'utf-8');
  } catch { /* non-fatal: still cached in memory */ }
}

async function readIndexLocal(userId: string): Promise<VectorIndex | null> {
  try {
    return JSON.parse(await fs.readFile(localIndexPath(userId), 'utf-8')) as VectorIndex;
  } catch {
    return null;
  }
}

async function loadIndex(userId: string): Promise<{ index: VectorIndex; blobId: string | null }> {
  if (indexCache.has(userId)) return indexCache.get(userId)!;

  // Fast local file (cross-request truth in dev/single-node).
  const local = await readIndexLocal(userId);
  if (local) {
    const entry = { index: local, blobId: null };
    indexCache.set(userId, entry);
    return entry;
  }

  // Rehydrate durable index from Walrus via the registry pointer.
  const reg = await readRegistry();
  const indexBlobId = reg[userId];
  if (indexBlobId) {
    try {
      const index = await walrusFetchJSON<VectorIndex>(indexBlobId);
      const entry = { index, blobId: indexBlobId };
      indexCache.set(userId, entry);
      await saveIndexLocal(userId, index);
      return entry;
    } catch {
      // Walrus fetch failed (transient) — fall through to empty
    }
  }

  const empty = { index: emptyIndex(userId), blobId: null };
  indexCache.set(userId, empty);
  return empty;
}

// Durable index write (Walrus) + local mirror + registry pointer.
async function saveIndex(userId: string, index: VectorIndex): Promise<string> {
  await saveIndexLocal(userId, index);
  const blobId = await walrusStore(JSON.stringify(index));
  indexCache.set(userId, { index, blobId });
  await writeRegistry(userId, blobId);
  return blobId;
}

function fmtSize(bytes?: number): string | undefined {
  if (bytes == null) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function fmtCost(frost?: number): string | undefined {
  if (frost == null) return undefined;
  // 1 WAL = 1e9 FROST
  const wal = frost / 1e9;
  return `${wal.toFixed(4)} WAL`;
}

export interface StoreResult {
  blob_id: string;
  proof: WalrusProof;
}

/**
 * Stores one curated memory blob on Walrus and indexes it for recall.
 * Returns the blob id plus the full verifiable proof for the UI.
 *
 * Embedding is best-effort: if Voyage is unavailable/rate-limited the blob is
 * still persisted (recall then falls back to recency/importance ordering).
 */
export async function storeMemory(params: {
  content: Record<string, unknown>;
  type: MemoryBlobType;
  tags: string[];
  session_id: string;
  user_id: string;
  workspace_id?: string;
  memory_type?: ArtifactKind;
  importance?: number;
  summary?: string;
}): Promise<StoreResult> {
  const { content, type, tags, session_id, user_id, memory_type, importance, summary } = params;
  const workspace_id = params.workspace_id ?? DEFAULT_WORKSPACE_ID;

  const blob: MemoryBlob = {
    schema_version: '1.0',
    type,
    workspace_id,
    session_id,
    user_id,
    created_at: new Date().toISOString(),
    tags,
    memory_type,
    importance,
    summary,
    content,
  };

  // Store the memory blob on Walrus, capturing the verifiable receipt.
  const receipt = await walrusStoreWithProof(JSON.stringify(blob));

  const proof: WalrusProof = {
    blob_id: receipt.blob_id,
    sui_object: receipt.sui_object,
    epoch: receipt.certified_epoch ?? receipt.registered_epoch,
    expiry: receipt.end_epoch,
    size: fmtSize(receipt.size),
    cost: fmtCost(receipt.cost),
    certified: receipt.certified,
    pending: false,
    aggregator_url: aggregatorUrl(receipt.blob_id),
  };

  // Indexing strategy:
  //  - By default we index metadata-only (no embedding) so a multi-memory commit
  //    stays fast and deterministic — Voyage's free tier (3 req/min) would
  //    otherwise serialize each artifact behind a rate-limit backoff.
  //  - Recall still works: it ranks by kind/importance/recency when vectors are
  //    absent, and uses cosine search when they're present.
  //  - Set ECHO_EMBED_ON_COMMIT=1 to embed inline (richer semantic recall) when
  //    you have generous embedding quota.
  const embedOnCommit = process.env.ECHO_EMBED_ON_COMMIT === '1';
  if (embedOnCommit && hasEmbeddings()) {
    try {
      const embeddingText = (summary ? `${summary}\n` : '') + JSON.stringify(content).slice(0, 4000);
      const vector = await embed(embeddingText);
      const confidence = typeof content.confidence === 'number' ? content.confidence : importance;
      const { index } = await loadIndex(user_id);
      const updated = addToIndex(index, {
        blob_id: receipt.blob_id,
        vector,
        type,
        tags,
        created_at: blob.created_at,
        session_id,
        confidence,
        workspace_id,
        memory_type,
        importance,
        summary,
      });
      await saveIndex(user_id, updated);
    } catch {
      await indexMetadataOnly(user_id, receipt.blob_id, blob);
    }
  } else {
    await indexMetadataOnly(user_id, receipt.blob_id, blob);
  }

  return { blob_id: receipt.blob_id, proof };
}

// ── Batch store ──────────────────────────────────────────────────────────────
// Writes many memories in ONE commit: all blob writes run in parallel and the
// vector index is saved exactly once. This is the path the Echo commit route
// uses — it turns an N-memory save from N sequential Walrus round-trips (plus N
// index re-writes) into ~one round-trip of latency + a single index write.
export interface MemorySpec {
  content: Record<string, unknown>;
  type: MemoryBlobType;
  tags: string[];
  session_id: string;
  workspace_id?: string;
  memory_type?: ArtifactKind;
  importance?: number;
  summary?: string;
}

export interface BatchItemResult {
  ok: boolean;
  blob_id: string;
  proof: WalrusProof;
  spec: MemorySpec;
}

export async function storeMemoriesBatch(
  user_id: string,
  specs: MemorySpec[],
  opts?: { flushIndex?: boolean },
): Promise<BatchItemResult[]> {
  const now = new Date().toISOString();

  const writes = await Promise.allSettled(specs.map(async (spec) => {
    const workspace_id = spec.workspace_id ?? DEFAULT_WORKSPACE_ID;
    const blob: MemoryBlob = {
      schema_version: '1.0',
      type: spec.type,
      workspace_id,
      session_id: spec.session_id,
      user_id,
      created_at: now,
      tags: spec.tags,
      memory_type: spec.memory_type,
      importance: spec.importance,
      summary: spec.summary,
      content: spec.content,
    };
    const receipt = await walrusStoreWithProof(JSON.stringify(blob));
    return { receipt, blob };
  }));

  const results: BatchItemResult[] = [];
  // Collect successful index entries, then write the index ONCE.
  let index = (await loadIndex(user_id)).index;
  let indexChanged = false;

  writes.forEach((res, i) => {
    const spec = specs[i];
    const workspace_id = spec.workspace_id ?? DEFAULT_WORKSPACE_ID;
    if (res.status === 'fulfilled') {
      const { receipt, blob } = res.value;
      results.push({
        ok: true,
        blob_id: receipt.blob_id,
        proof: {
          blob_id: receipt.blob_id,
          sui_object: receipt.sui_object,
          epoch: receipt.certified_epoch ?? receipt.registered_epoch,
          expiry: receipt.end_epoch,
          size: fmtSize(receipt.size),
          cost: fmtCost(receipt.cost),
          certified: receipt.certified,
          pending: false,
          aggregator_url: aggregatorUrl(receipt.blob_id),
        },
        spec,
      });
      index = addToIndex(index, {
        blob_id: receipt.blob_id,
        vector: [],
        type: blob.type,
        tags: blob.tags,
        created_at: blob.created_at,
        session_id: blob.session_id,
        confidence: blob.importance,
        workspace_id,
        memory_type: blob.memory_type,
        importance: blob.importance,
        summary: blob.summary,
      });
      indexChanged = true;
    } else {
      results.push({
        ok: false,
        blob_id: `local-${spec.session_id}-${i}`,
        proof: { blob_id: `local-${spec.session_id}-${i}`, certified: false, pending: true },
        spec,
      });
    }
  });

  if (indexChanged) {
    // Update the in-memory cache AND the fast local file synchronously so
    // recall/journey see the new memories immediately (across worker requests).
    indexCache.set(user_id, { index, blobId: indexCache.get(user_id)?.blobId ?? null });
    await saveIndexLocal(user_id, index);
    if (opts?.flushIndex !== false) {
      try { await saveIndex(user_id, index); } catch { /* local copy already written */ }
    }
  }
  return results;
}

/** Persist the (cached) vector index to Walrus. Call from `after()` so a commit
 *  can return before the durable index write finishes. */
export async function persistIndex(user_id: string): Promise<void> {
  const cached = indexCache.get(user_id);
  if (cached) {
    try { await saveIndex(user_id, cached.index); } catch { /* keep cache */ }
  }
}

// Records an entry in the index without a real vector (zero-vector) so it still
// appears in journey/listing even when embeddings are unavailable.
async function indexMetadataOnly(userId: string, blobId: string, blob: MemoryBlob): Promise<void> {
  try {
    const { index } = await loadIndex(userId);
    const updated = addToIndex(index, {
      blob_id: blobId,
      vector: [],
      type: blob.type,
      tags: blob.tags,
      created_at: blob.created_at,
      session_id: blob.session_id,
      confidence: blob.importance,
      workspace_id: blob.workspace_id,
      memory_type: blob.memory_type,
      importance: blob.importance,
      summary: blob.summary,
    });
    await saveIndex(userId, updated);
  } catch {
    // best-effort
  }
}

const MIN_RELEVANCE = Number(process.env.ECHO_MIN_RELEVANCE ?? 0.32);

export async function retrieveMemory(params: {
  query: string;
  user_id: string;
  top_k?: number;
  workspace_id?: string;
  min_relevance?: number;
}): Promise<{ blobs: MemoryBlob[]; blobIds: string[]; scored: ScoredEntry[] }> {
  const { query, user_id, top_k = 5 } = params;
  const workspace_id = params.workspace_id ?? DEFAULT_WORKSPACE_ID;
  const minRelevance = params.min_relevance ?? MIN_RELEVANCE;

  const { index } = await loadIndex(user_id);
  if (index.entries.length === 0 || !hasEmbeddings()) return { blobs: [], blobIds: [], scored: [] };

  // Skip the query embedding entirely if nothing in this workspace was embedded
  // (metadata-only index) — recall then falls back to kind/importance ranking.
  const hasVectors = index.entries.some(
    e => (e.workspace_id ?? workspace_id) === workspace_id && Array.isArray(e.vector) && e.vector.length > 0,
  );
  if (!hasVectors) return { blobs: [], blobIds: [], scored: [] };

  const queryVector = await embed(query);
  const nearest = searchVectors(index, queryVector, top_k, minRelevance, workspace_id);
  if (nearest.length === 0) return { blobs: [], blobIds: [], scored: [] };

  const fetched = await Promise.all(
    nearest.map(async ({ entry }) => {
      try {
        return await walrusFetchJSON<MemoryBlob>(entry.blob_id);
      } catch {
        return null;
      }
    })
  );

  const valid = fetched.flatMap((b, i) => (b ? [{ blob: b, scored: nearest[i] }] : []));
  return {
    blobs: valid.map(v => v.blob),
    blobIds: valid.map(v => v.scored.entry.blob_id),
    scored: valid.map(v => v.scored),
  };
}

/** Returns true if a memory duplicating (workspace, kind, normalized summary) exists. */
export async function findDuplicateMemory(
  userId: string,
  workspaceId: string | undefined,
  memoryType: ArtifactKind | undefined,
  summary: string | undefined,
): Promise<string | null> {
  if (!summary) return null;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '').trim();
  const target = norm(summary);
  if (!target) return null;
  const ws = workspaceId ?? DEFAULT_WORKSPACE_ID;
  const { index } = await loadIndex(userId);
  const hit = index.entries.find(e =>
    (e.workspace_id ?? DEFAULT_WORKSPACE_ID) === ws &&
    e.memory_type === memoryType &&
    e.summary && norm(e.summary) === target,
  );
  return hit ? hit.blob_id : null;
}

export async function getUserBlobMetadata(userId: string, workspaceId?: string): Promise<BlobMetadata[]> {
  const { index } = await loadIndex(userId);
  return index.entries
    .filter(entry => !workspaceId || (entry.workspace_id ?? DEFAULT_WORKSPACE_ID) === workspaceId)
    .map(entry => ({
      blob_id: entry.blob_id,
      type: entry.type,
      workspace_id: entry.workspace_id ?? DEFAULT_WORKSPACE_ID,
      session_id: entry.session_id ?? '',
      created_at: entry.created_at,
      tags: entry.tags,
      memory_type: entry.memory_type,
      importance: entry.importance,
      summary: entry.summary,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function fetchMemoryBlob(blobId: string): Promise<MemoryBlob> {
  return walrusFetchJSON<MemoryBlob>(blobId);
}
