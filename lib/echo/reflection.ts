import { getProvider, hasProvider } from '@/lib/llm';
import { getMode } from './modes';
import { assessSafety, crisisResponse, medicalResponse } from './safety';
import type { ChatMessage, ReflectionMode, RecalledMemory } from '@/types';

// Keep the prompt small: only the last few turns matter for context.
function recentHistory(history: ChatMessage[], max = 8): ChatMessage[] {
  return history.filter((m) => m.content?.trim()).slice(-max);
}

function recallBlock(recalled: RecalledMemory[]): string {
  if (!recalled.length) return '';
  const lines = recalled.map(m => `- (${m.type}) ${m.text}`).join('\n');
  return `\n\n=== WHAT YOU REMEMBER ABOUT THEM (from past reflections, stored on Walrus) ===
You genuinely remember these from previous sessions. Weave them in naturally when relevant — e.g. "last time, deadlines were keeping you up, and a walk helped." Never invent memories beyond this list.
${lines}
=== END ===`;
}

const SYSTEM = (steer: string, recalled: RecalledMemory[]) => `You are Echo — a warm, calm, voice-first emotional reflection companion. You help people think out loud, understand their patterns, and find one small next step. You are NOT a therapist, psychiatrist, doctor, or diagnostic tool, and you never speak like one.

HOW YOU TALK:
- Speak like a grounded, caring friend who listens well. Warm, human, unhurried.
- This is voice-first: keep replies SHORT — 1–2 sentences, rarely 3. No lists, no headings, no jargon, no motivational quotes.
- Reflect back what you heard in your own words so they feel understood, then ask ONE gentle, open question that moves things forward. One question per reply — never stack several.
- When you notice a pattern across what they've said (or from what you remember), name it gently and tentatively — "I'm hearing pressure and tiredness together," not a verdict.
- Validate feelings before exploring them. Never dismiss ordinary sadness, stress, or overwhelm.
- Don't repeat safety notes or disclaimers — say nothing clinical, and never tell them to "see a doctor." Just stay present.
- You gently follow an evidence-informed reflection loop (situation → feeling → thought → body → what helped → reframe → tiny next step) — conversationally, never as a checklist.
- When they name something that helped before, hold onto it warmly ("I'll hold onto that").

EXAMPLES OF YOUR VOICE (style, not scripts):
- "That sounds heavy. What part of it stayed with you the most?"
- "I'm hearing pressure and tiredness together. Did anything help even a little today?"
- "Let's slow it down. What happened first?"

SESSION STEER: ${steer}

SAFETY: You do not diagnose, treat, or prescribe. Avoid the words diagnosis, treatment, therapy, therapist, psychiatrist, disorder, cure. If they're simply struggling, stay with them — reflection, not redirection.${recallBlock(recalled)}`;

export interface ReflectResult {
  text: string;
  safety: 'none' | 'crisis' | 'medical';
}

/** One reflection turn. Handles safety routing, falls back gracefully if no LLM. */
export async function runReflection(params: {
  message: string;
  mode?: ReflectionMode;
  history?: ChatMessage[];
  recalled?: RecalledMemory[];
}): Promise<ReflectResult> {
  const { message, mode, history = [], recalled = [] } = params;

  // ── Safety first: crisis / medical signals short-circuit the LLM ──
  const signal = assessSafety(message);
  if (signal === 'crisis') return { text: crisisResponse(), safety: 'crisis' };
  if (signal === 'medical') return { text: medicalResponse(), safety: 'medical' };

  const steer = getMode(mode).steer;

  if (!hasProvider()) {
    // No LLM configured — a calm, generic-but-kind reflective fallback so the
    // room still works for a demo.
    return { text: calmFallback(message, history.length), safety: 'none' };
  }

  try {
    const provider = getProvider();
    const priorTurns = recentHistory(history);
    const response = await provider.call({
      system: SYSTEM(steer, recalled),
      messages: [...priorTurns, { role: 'user', content: message }],
      max_tokens: 160,
      temperature: 0.7,
    });
    const text = response.text.trim();
    return { text: text || calmFallback(message, history.length), safety: 'none' };
  } catch {
    return { text: calmFallback(message, history.length), safety: 'none' };
  }
}

// A gentle, content-light reflective reply used only when the LLM is unavailable.
function calmFallback(message: string, turnCount: number): string {
  const openers = [
    "Thank you for saying that out loud. What feels heaviest about it right now?",
    "I hear you. When you sit with that, where do you notice it most?",
    "That makes sense. What do you think is underneath it?",
    "I'm with you. Has anything, even something small, helped you carry it before?",
    "That's a lot to hold. If tonight could feel a little lighter, what would help?",
  ];
  return openers[Math.min(turnCount, openers.length - 1)];
}
