import { randomUUID } from 'crypto';
import { getProvider, hasProvider } from '@/lib/llm';
import { kindLabel } from './artifacts';
import { ALL_KINDS } from './artifacts';
import type { ArtifactKind, ReflectionArtifact, ReflectionTurn, SessionMeta } from '@/types';

export interface ProposeResult {
  summary: string;          // 1–2 line emotional summary of the session
  theme: string;            // short phrase for the journey timeline
  artifacts: ReflectionArtifact[];
  left_out: string;         // what Mnemos deliberately kept out of memory
}

const SYSTEM = `You are the memory distiller for Echo, an emotional reflection companion. Given a reflection conversation, extract ONLY the meaningful, durable threads worth remembering across future sessions — never raw transcript or small talk.

Return STRICT JSON:
{
  "summary": "a warm 1-2 sentence emotional summary of the session (not a transcript)",
  "theme": "a short 4-8 word phrase for a timeline entry, e.g. 'Tried a walk — it helped a little'",
  "artifacts": [
    { "kind": "trigger" | "pattern" | "coping" | "summary" | "next_step" | "context", "text": "one clear sentence", "confidence": 0.0-1.0 }
  ],
  "left_out": "one short line naming the casual chatter you deliberately did NOT store"
}

RULES:
- Extract 2 to 5 artifacts. Quality over quantity. If little of substance was shared, return fewer.
- kinds: trigger = the stressor / what set this off · pattern = a recurring thought or thinking style · coping = what helped or gave relief · summary = the core emotional summary · next_step = one tiny doable action · context = softer background worth remembering.
- Always include exactly one "summary" and, if any forward motion is possible, one "next_step".
- Each artifact text must be a single distilled sentence, specific to what they actually said. Never invent details.
- Warm, plain language. No clinical terms (no diagnosis/therapy/disorder).
- Do NOT include casual chatter, greetings, or anything off-topic — name those in "left_out".`;

interface RawArtifact { kind?: string; text?: string; confidence?: number }
interface RawResult { summary?: string; theme?: string; artifacts?: RawArtifact[]; left_out?: string }

function transcriptText(turns: ReflectionTurn[]): string {
  return turns
    .filter(t => t.text?.trim())
    .map(t => `${t.role === 'echo' ? 'Echo' : 'User'}: ${t.text.trim()}`)
    .join('\n');
}

function coerceKind(k: string | undefined): ArtifactKind {
  const v = (k ?? '').toLowerCase().replace(/\s+/g, '_');
  return (ALL_KINDS as string[]).includes(v) ? (v as ArtifactKind) : 'context';
}

function toArtifact(raw: RawArtifact): ReflectionArtifact | null {
  const text = (raw.text ?? '').trim();
  if (!text) return null;
  const kind = coerceKind(raw.kind);
  const confidence = typeof raw.confidence === 'number'
    ? Math.max(0, Math.min(1, raw.confidence))
    : 0.7;
  return { id: `m-${randomUUID().slice(0, 8)}`, kind, type: kindLabel(kind), text, confidence };
}

/** Distill candidate memories from a finished reflection. Approved-only happens
 *  later, in the commit step — this only proposes. */
export async function proposeArtifacts(params: {
  turns: ReflectionTurn[];
  meta?: Partial<SessionMeta>;
  mode?: string;
}): Promise<ProposeResult> {
  const { turns, meta = {} } = params;
  const userTurns = turns.filter(t => t.role === 'user' && t.text?.trim());

  // Nothing substantial said — nothing to remember.
  if (userTurns.length === 0) {
    return { summary: 'A quiet moment together.', theme: 'A quiet check-in', artifacts: [], left_out: '' };
  }

  if (hasProvider()) {
    try {
      const provider = getProvider();
      const context = [
        meta.feelings?.length ? `Feelings going in: ${meta.feelings.join(', ')}.` : '',
        meta.intensity ? `Intensity: ${meta.intensity}/10.` : '',
        '',
        'Conversation:',
        transcriptText(turns),
      ].filter(Boolean).join('\n');

      const res = await provider.call({
        system: SYSTEM,
        messages: [{ role: 'user', content: context }],
        max_tokens: 700,
        temperature: 0.3,
        json_mode: true,
      });

      const parsed = JSON.parse(res.text) as RawResult;
      const artifacts = (parsed.artifacts ?? [])
        .map(toArtifact)
        .filter((a): a is ReflectionArtifact => a !== null)
        .slice(0, 6);

      // Guarantee a summary artifact exists.
      if (!artifacts.some(a => a.kind === 'summary') && parsed.summary) {
        artifacts.unshift({
          id: `m-${randomUUID().slice(0, 8)}`,
          kind: 'summary', type: kindLabel('summary'),
          text: parsed.summary.trim(), confidence: 0.8,
        });
      }

      return {
        summary: (parsed.summary ?? '').trim() || deriveSummary(meta),
        theme: (parsed.theme ?? '').trim() || deriveTheme(meta),
        artifacts,
        left_out: (parsed.left_out ?? '').trim(),
      };
    } catch {
      // fall through to deterministic fallback
    }
  }

  return deterministicFallback(turns, meta);
}

// ── Deterministic fallback (no/failed LLM) ──────────────────────────────────
function deterministicFallback(turns: ReflectionTurn[], meta: Partial<SessionMeta>): ProposeResult {
  const userText = turns.filter(t => t.role === 'user').map(t => t.text).join(' ').toLowerCase();
  const artifacts: ReflectionArtifact[] = [];
  const push = (kind: ArtifactKind, text: string, confidence = 0.6) =>
    artifacts.push({ id: `m-${randomUUID().slice(0, 8)}`, kind, type: kindLabel(kind), text, confidence });

  push('summary', deriveSummary(meta), 0.7);

  if (/deadline|work|behind|too much|overwhelm/.test(userText))
    push('trigger', 'Work pressure is a main stressor right now.', 0.6);
  if (/sleep|awake|4am|night|can'?t switch off|insomnia/.test(userText))
    push('pattern', 'Stress is following into the night and affecting rest.', 0.6);
  if (/walk|run|music|talk|breath|outside/.test(userText))
    push('coping', 'Something simple gave relief before — worth returning to.', 0.6);

  push('next_step', 'Choose one small, kind thing to do next.', 0.6);

  return {
    summary: deriveSummary(meta),
    theme: deriveTheme(meta),
    artifacts: artifacts.slice(0, 5),
    left_out: 'Casual small talk was kept out of memory.',
  };
}

function deriveSummary(meta: Partial<SessionMeta>): string {
  const feel = meta.feelings?.length ? meta.feelings.join(', ') : 'a lot';
  return `Tonight felt like ${feel}${meta.intensity ? ` (around ${meta.intensity}/10)` : ''} — and you took time to put words to it.`;
}

function deriveTheme(meta: Partial<SessionMeta>): string {
  if (meta.feelings?.length) return `Sat with feeling ${meta.feelings[0].toLowerCase()}`;
  return 'A moment of reflection';
}
