import { retrieveMemory, getUserBlobMetadata } from '@/lib/walrus/memory';
import { kindLabel } from './artifacts';
import { themeColor } from './text';
import { hasEmbeddings } from '@/lib/embeddings/voyage';
import type { ArtifactKind, BlobMetadata, Journey, JourneySession, RecalledMemory } from '@/types';

function reasonFor(kind: ArtifactKind, daysAgo: number): string {
  const recency = daysAgo < 1 ? 'from your last reflection'
    : daysAgo < 7 ? `from ${Math.max(1, Math.round(daysAgo))} day${Math.round(daysAgo) === 1 ? '' : 's'} ago`
    : 'from a while back';
  switch (kind) {
    case 'trigger':   return `Most relevant to how you tend to arrive here — ${recency}`;
    case 'coping':    return `A coping thread worth offering again — ${recency}`;
    case 'pattern':   return `Recurring across your recent visits — ${recency}`;
    case 'next_step': return `The small step you set ${recency}`;
    case 'summary':   return `The heart of where we left off — ${recency}`;
    default:          return `Surfaced from your past reflections — ${recency}`;
  }
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

/** What Echo recalls on return. Prefers semantic match; falls back to the most
 *  important/recent artifacts when embeddings aren't available. */
export async function recall(params: {
  user_id: string;
  workspace_id: string;
  context?: string;
  limit?: number;
}): Promise<RecalledMemory[]> {
  const { user_id, workspace_id, context, limit = 3 } = params;

  // Semantic recall when we have embeddings and a query context.
  if (hasEmbeddings() && context) {
    try {
      const { blobs, blobIds, scored } = await retrieveMemory({
        query: context, user_id, workspace_id, top_k: limit + 2,
      });
      const recalled = blobs
        .filter(b => b.type === 'reflection_artifact')
        .map((b, i) => {
          const kind = (b.memory_type ?? 'summary') as ArtifactKind;
          const text = b.summary ?? String((b.content as { text?: string }).text ?? '');
          return {
            blob_id: blobIds[i],
            kind, type: kindLabel(kind), text,
            reason: reasonFor(kind, daysSince(b.created_at)),
            source_session: b.session_id,
            savedAt: b.created_at,
            score: scored[i]?.score,
          } as RecalledMemory;
        })
        .filter(m => m.text)
        .slice(0, limit);
      if (recalled.length) return recalled;
    } catch {
      // fall through to metadata recall
    }
  }

  // Fallback: highest-importance / most-recent artifacts.
  const meta = (await getUserBlobMetadata(user_id, workspace_id))
    .filter(m => m.type === 'reflection_artifact' && m.summary);
  return rankByValue(meta).slice(0, limit).map(m => {
    const kind = (m.memory_type ?? 'summary') as ArtifactKind;
    return {
      blob_id: m.blob_id,
      kind, type: kindLabel(kind), text: m.summary!,
      reason: reasonFor(kind, daysSince(m.created_at)),
      source_session: m.session_id,
      savedAt: m.created_at,
    };
  });
}

function rankByValue(meta: BlobMetadata[]): BlobMetadata[] {
  // Prefer trigger/coping/pattern, then importance, then recency.
  const kindWeight: Record<string, number> = { trigger: 3, coping: 3, pattern: 2.5, next_step: 1.5, summary: 1, context: 0.5 };
  return [...meta].sort((a, b) => {
    const wa = (kindWeight[a.memory_type ?? ''] ?? 1) + (a.importance ?? 0);
    const wb = (kindWeight[b.memory_type ?? ''] ?? 1) + (b.importance ?? 0);
    if (wb !== wa) return wb - wa;
    return b.created_at.localeCompare(a.created_at);
  });
}

/** The full memory journey for the timeline screen. Built entirely from index
 *  metadata — no extra Walrus reads. */
export async function getJourney(user_id: string, workspace_id: string): Promise<Journey> {
  const meta = await getUserBlobMetadata(user_id, workspace_id);
  const summaries = meta.filter(m => m.type === 'session_summary');
  const artifacts = meta.filter(m => m.type === 'reflection_artifact');

  // Sessions (newest first) from session_summary blobs.
  const sessions: JourneySession[] = summaries.map(s => {
    const tags = s.tags ?? [];
    const modeTag = tags.find(t => t.startsWith('mode:'))?.slice(5);
    const intensityTag = tags.find(t => t.startsWith('intensity:'))?.slice(10);
    const memoryCount = artifacts.filter(a => a.session_id === s.session_id).length;
    return {
      session_id: s.session_id,
      when: s.created_at,
      mode: modeTag ?? 'Reflection',
      intensity: intensityTag ? Number(intensityTag) : undefined,
      theme: s.summary,
      memoryCount,
    };
  });

  // Intensity trend oldest → newest.
  const intensity_trend = [...sessions]
    .filter(s => typeof s.intensity === 'number')
    .reverse()
    .map(s => ({ when: s.when, value: s.intensity as number }));

  // Recurring themes from artifact tags (canonical theme labels).
  const counts = new Map<string, number>();
  for (const a of artifacts) {
    for (const t of a.tags ?? []) {
      if (t.startsWith('theme:')) {
        const label = t.slice(6);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
  }
  const recurring_themes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, n]) => ({ label, n }));

  // Saved artifacts (latest unique-ish set).
  const saved_artifacts = artifacts.slice(0, 8).map(a => {
    const kind = (a.memory_type ?? 'summary') as ArtifactKind;
    return { kind, type: kindLabel(kind), text: a.summary ?? '' };
  });

  return {
    sessions,
    intensity_trend,
    recurring_themes,
    saved_artifacts,
    total_on_walrus: meta.length,
  };
}

export { themeColor };
