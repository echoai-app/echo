// ─── Echo memory types ───────────────────────────────────────────────────────
// Echo is a product layer on the Mnemos engine. It stores ONLY user-approved
// reflection artifacts (distilled, never raw transcripts), persisted on Walrus
// and keyed to a Sui wallet (or a guest identity).

// Structural blob type (how it's stored).
export type MemoryBlobType = 'reflection_artifact' | 'session_summary' | 'embedding_index';

// Semantic kind of a reflection artifact (what it means to the user).
//  trigger    — a stressor / what set this off
//  pattern    — a recurring thought / thinking style
//  coping      — what helped ("a walk gave relief")
//  summary    — the emotional summary of the session (1–2 lines)
//  next_step  — the tiny next action
//  context    — softer background (kept only if user approves)
//  goal       — something the user is working toward
export type ArtifactKind = 'trigger' | 'pattern' | 'coping' | 'summary' | 'next_step' | 'context' | 'goal';

// A single prior conversation turn, passed to the engine for context.
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Stored memory blob (on Walrus) ──────────────────────────────────────────
export interface MemoryBlob {
  schema_version: '1.0';
  type: MemoryBlobType;
  workspace_id: string;
  session_id: string;
  user_id: string;
  created_at: string;
  tags: string[];
  // Reflection-artifact metadata
  memory_type?: ArtifactKind;
  importance?: number;
  summary?: string;
  content: Record<string, unknown>;
}

export interface BlobMetadata {
  blob_id: string;
  type: MemoryBlobType;
  workspace_id: string;
  session_id: string;
  created_at: string;
  tags: string[];
  memory_type?: ArtifactKind;
  importance?: number;
  summary?: string;
  preview?: string;
}

// ─── Vector index (semantic recall) ──────────────────────────────────────────
export interface VectorEntry {
  blob_id: string;
  vector: number[];
  type: MemoryBlobType;
  tags: string[];
  created_at: string;
  session_id?: string;
  confidence?: number;
  workspace_id?: string;
  memory_type?: ArtifactKind;
  importance?: number;
  summary?: string;
}

export interface VectorIndex {
  user_id: string;
  entries: VectorEntry[];
  updated_at: string;
}

// ─── Walrus proof (the verifiable receipt) ───────────────────────────────────
// Surfaced in the Debrief proof card. `pending` = stored locally/optimistically
// while Walrus testnet finalizes (graceful fallback — Echo never blocks on it).
export interface SuiRegistryProof {
  digest: string;          // the on-chain transaction digest (wallet-signed)
  object_id: string;       // the user-owned MemoryPointer object id
  index_blob_id: string;   // the Walrus index blob the pointer now points to
  network: string;         // 'testnet' | 'mainnet' | …
}

export interface WalrusProof {
  blob_id: string;
  sui_object?: string;
  epoch?: number;
  expiry?: number;        // end epoch
  nodes?: string;         // e.g. "112 / 167" storage nodes
  size?: string;          // human-readable, e.g. "1.84 KiB"
  cost?: string;          // e.g. "0.0021 SUI"
  certified: boolean;
  pending: boolean;       // true when Walrus hasn't confirmed yet (local fallback)
  aggregator_url?: string;
  // Set only after a real wallet-signed Sui transaction registers the pointer.
  sui_registry?: SuiRegistryProof | null;
}

// ─── Reflection artifact (candidate in Memory review) ────────────────────────
export interface ReflectionArtifact {
  id: string;
  kind: ArtifactKind;
  type: string;           // human label, e.g. "Trigger", "What helped"
  text: string;
  confidence: number;     // 0..1
}

// A committed artifact carries its Walrus proof.
export interface SavedArtifact extends ReflectionArtifact {
  blob_id: string;
  proof: WalrusProof;
  savedAt: string;
}

// ─── Recall ──────────────────────────────────────────────────────────────────
export interface RecalledMemory {
  blob_id: string;
  kind: ArtifactKind;
  type: string;
  text: string;
  reason: string;         // "selected because — most relevant to today"
  source_session: string;
  savedAt: string;
  score?: number;
}

// ─── Journey ─────────────────────────────────────────────────────────────────
export interface JourneySession {
  session_id: string;
  when: string;           // ISO
  mode: string;
  intensity?: number;
  theme?: string;
  memoryCount: number;
}

export interface JourneyTheme {
  label: string;
  n: number;
}

export interface Journey {
  sessions: JourneySession[];
  intensity_trend: { when: string; value: number }[];
  recurring_themes: JourneyTheme[];
  saved_artifacts: { kind: ArtifactKind; type: string; text: string }[];
  total_on_walrus: number;
}

// ─── Reflection session (server-side) ────────────────────────────────────────
export type ReflectionMode = 'checkin' | 'vent' | 'understand' | 'reset' | 'weekly' | 'continue';

export interface SessionMeta {
  feelings: string[];
  intensity: number;      // 1..10
  remember: boolean;
  startedAt: string;
  modeTitle?: string;
}

export interface ReflectionTurn {
  role: 'user' | 'echo';
  text: string;
  source: 'voice' | 'text';
  at: string;
}

// ─── SSE events from /api/reflect ────────────────────────────────────────────
export type ReflectEvent =
  | { event: 'reply'; text: string; safety?: 'crisis' }
  | { event: 'error'; message: string };

// ─── API payloads ────────────────────────────────────────────────────────────
export interface ReflectRequest {
  message: string;
  session_id: string;
  user_id: string;
  workspace_id?: string;
  mode?: ReflectionMode;
  meta?: Partial<SessionMeta>;
  history?: ChatMessage[];
}
