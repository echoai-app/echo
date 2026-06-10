import { NextRequest, NextResponse } from 'next/server';
import { getJourney } from '@/lib/echo/recall';
import { getUserBlobMetadata, restoreIndexFromBlob, storeMemoriesBatch, type MemorySpec } from '@/lib/walrus/memory';
import { getProvider, hasProvider } from '@/lib/llm';
import { ensureWorkspaceId } from '@/lib/workspace';

export const runtime = 'nodejs';
export const maxDuration = 60;

/* POST /api/insight — the INSIGHT AGENT.
   A second, separate agent in the workflow: it READS the same persistent
   Walrus memory that Echo (the companion agent) writes, synthesizes an
   insight report across sessions, and STORES that report back to Walrus as a
   durable artifact (updating the shared memory index). Multi-agent,
   artifact-driven, one verifiable memory layer underneath.

   Accepts optional index_blob_id (from the user's on-chain MemoryPointer) so
   the same serverless instance can restore the index before reading. */

export interface InsightReport {
  title: string;
  period: string;
  patterns: string[];
  what_helped: string[];
  gentle_suggestion: string;
  closing_note: string;
}

const INSIGHT_SYSTEM = `You are Insight — a calm, separate reflection agent. You do NOT talk to the user live; you read their saved reflection memories (distilled artifacts they approved) and write a short, warm insight report across sessions.

Rules:
- Ground every observation in the provided memories — never invent events.
- Tone: warm, plain, encouraging; like a thoughtful friend summarizing a journal. No clinical language, no diagnosis, no treatment advice, no crisis content.
- Be concise. 2–3 patterns max, 1–2 things that helped, ONE gentle suggestion.
- Reply with STRICT JSON only (no markdown fences):
{"title": "a short warm title", "period": "e.g. this week", "patterns": ["…", "…"], "what_helped": ["…"], "gentle_suggestion": "…", "closing_note": "one warm sentence"}`;

function fallbackReport(themes: string[], sessions: number, helped: string[]): InsightReport {
  return {
    title: 'What your reflections show',
    period: sessions === 1 ? 'your first reflection' : `your last ${sessions} reflections`,
    patterns: themes.length ? themes.slice(0, 3).map(t => `“${t}” keeps coming up across your sessions.`) : ['You showed up and put words to what you were carrying.'],
    what_helped: helped.length ? helped.slice(0, 2) : ['Naming things out loud, gently.'],
    gentle_suggestion: 'Pick the one thing that helped most and give it a small, regular place this week.',
    closing_note: 'Returning is its own kind of progress — these memories are yours, and they add up.',
  };
}

export async function POST(req: NextRequest) {
  let body: { user_id?: string; workspace_id?: string; index_blob_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { user_id, index_blob_id } = body;
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  const workspace_id = body.workspace_id ?? ensureWorkspaceId(user_id);

  // Serverless-safe: restore the shared memory from Walrus on this instance
  // (pointer blob id is read client-side from the user's Sui MemoryPointer).
  let restored = false;
  if (index_blob_id) {
    try {
      const meta = await getUserBlobMetadata(user_id, workspace_id);
      if (meta.length === 0) restored = (await restoreIndexFromBlob(user_id, index_blob_id)).ok;
    } catch { /* fall through */ }
  }

  const meta = (await getUserBlobMetadata(user_id, workspace_id))
    .filter(m => m.type === 'reflection_artifact' || m.type === 'session_summary');
  if (meta.length === 0) {
    return NextResponse.json({ ok: false, reason: 'no_memories', restored });
  }

  const journey = await getJourney(user_id, workspace_id);
  const themes = journey.recurring_themes?.map(t => (typeof t === 'string' ? t : (t as { theme?: string }).theme ?? '')).filter(Boolean) ?? [];
  const helped = meta.filter(m => m.memory_type === 'coping' && m.summary).map(m => m.summary as string);

  // ── The Insight agent reads the shared memory and writes its report ──
  let report: InsightReport;
  const memoryLines = meta
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 30)
    .map(m => `- [${m.memory_type ?? m.type}] (${(m.created_at ?? '').slice(0, 10)}) ${m.summary ?? ''}`)
    .join('\n');

  if (hasProvider()) {
    try {
      const res = await getProvider().call({
        system: INSIGHT_SYSTEM,
        messages: [{ role: 'user', content: `Saved memories (newest first):\n${memoryLines}\n\nSessions: ${journey.sessions.length}. Write the JSON insight report.` }],
        max_tokens: 420,
        temperature: 0.5,
      });
      const raw = res.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw) as InsightReport;
      if (!parsed.title || !Array.isArray(parsed.patterns)) throw new Error('bad shape');
      report = parsed;
    } catch {
      report = fallbackReport(themes, journey.sessions.length, helped);
    }
  } else {
    report = fallbackReport(themes, journey.sessions.length, helped);
  }

  // ── Store the report back into the SAME Walrus memory (a durable artifact) ──
  const spec: MemorySpec = {
    content: { ...report, generated_by: 'insight-agent', sources: meta.length, source_types: ['reflection_artifact', 'session_summary'] },
    type: 'insight_report',
    tags: ['insight', 'agent:insight', `sessions:${journey.sessions.length}`],
    session_id: `insight-${Date.now()}`,
    workspace_id,
    importance: 0.6,
    summary: report.title,
  };

  try {
    const { results, indexBlobId } = await storeMemoriesBatch(user_id, [spec], { flushIndex: true });
    const r = results[0];
    return NextResponse.json({
      ok: true,
      restored,
      report,
      sources: meta.length,
      blob_id: r?.blob_id ?? null,
      walrusOk: !!r?.ok,
      proof: r?.proof ?? null,
      index_blob_id: indexBlobId,
    });
  } catch {
    // report generated but storage failed — still return it, honestly unproven
    return NextResponse.json({ ok: true, restored, report, sources: meta.length, blob_id: null, walrusOk: false, proof: null, index_blob_id: null });
  }
}
