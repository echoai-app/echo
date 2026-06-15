import { getProvider, hasProvider } from '@/lib/llm';
import { getMode } from './modes';
import { assessSafety, crisisResponse, medicalResponse } from './safety';
import type { ChatMessage, ReflectionMode, RecalledMemory } from '@/types';

// Keep the prompt small: only the last few turns matter for context.
function recentHistory(history: ChatMessage[], max = 8): ChatMessage[] {
  return history.filter((m) => m.content?.trim()).slice(-max);
}

const INTENSITY_WORD = [
  'barely there', 'a quiet hum', 'noticeable', 'weighing on them', 'pretty loud',
  'hard to ignore', 'heavy', 'overwhelming', 'all-consuming', 'at their limit',
];

// Who they are + what they walked in carrying, so Echo greets and reflects as if
// it actually knows this person and this moment — not a blank slate every turn.
function personBlock(name?: string, feelings?: string[], intensity?: number): string {
  const realName = name?.trim() && name.trim().toLowerCase() !== 'friend' ? name.trim() : '';
  const feel = feelings?.length ? feelings.join(', ').toLowerCase() : '';
  const loud = intensity ? INTENSITY_WORD[Math.min(Math.max(intensity, 1), 10) - 1] : '';
  if (!realName && !feel) return '';
  const lines: string[] = [];
  if (realName) lines.push(`- Their name is ${realName}. Use it naturally and sparingly, the way a friend would — not in every reply.`);
  if (feel) lines.push(`- They came into this session carrying: ${feel}${intensity ? ` — and they rated how loud it feels as ${intensity}/10 (${loud})` : ''}. Let this ground your tone: the heavier it feels, the slower, gentler, and fewer your words. Don't quote these numbers back at them; just meet them where they are.`);
  return `\n\n=== WHO YOU'RE WITH RIGHT NOW ===\n${lines.join('\n')}\n=== END ===`;
}

function recallBlock(recalled: RecalledMemory[]): string {
  if (!recalled.length) return '';
  const lines = recalled.map(m => `- (${m.type}) ${m.text}`).join('\n');
  return `\n\n=== WHAT YOU REMEMBER ABOUT THEM (from past reflections, stored on Walrus) ===
You genuinely remember these from previous sessions. Weave them in naturally when relevant — e.g. "last time, deadlines were keeping you up, and a walk helped." Never invent memories beyond this list.
${lines}
=== END ===`;
}

const SYSTEM = (steer: string, recalled: RecalledMemory[], person: string) => `You are Echo — a warm, calm, voice-first emotional reflection companion. You help people think out loud, understand their patterns, and find one small next step. You are NOT a therapist, psychiatrist, doctor, or diagnostic tool, and you never speak like one.

HOW YOU TALK:
- Speak like a grounded, caring friend who listens well. Warm, human, unhurried, natural.
- This is VOICE — it's spoken aloud, so be conversational and concise. Default to 1–2 short sentences. Only when they're genuinely confused or ask you to explain something do you give a little more (3–4 sentences MAX), then stop. Never monologue, never lecture, never give lists or headings.
- Match their energy and length: if they say a few words, you say a few words. Don't over-explain or pad. Silence and brevity are fine.
- Reflect back BOTH the feeling and the meaning underneath it in your own words, then ask ONE gentle, open question. One question per reply — never stack several.
- Validate feelings before exploring them. Never dismiss ordinary sadness, stress, or overwhelm.
- Don't repeat safety notes or disclaimers — say nothing clinical, and never tell them to "see a doctor." Just stay present.

HOW YOU THINK (quietly, between the lines — never lecture about it):
- Your questions follow a deepening ladder: what happened → how it feels → the thought behind the feeling → what that thought says about what they value or fear → what they need → one tiny doable step. Move ONE rung at a time, only when they're ready.
- Listen for thinking patterns (all-or-nothing, mind-reading, "should"s, catastrophizing). When you spot one, hold it up gently and tentatively as a curiosity, never a diagnosis: "I notice the word 'never' keeps coming up — does it really feel that absolute?"
- Distinguish the SITUATION from their THOUGHT about it from the FEELING it creates. Your best questions live in the gaps between those three.
- People often answer the question beneath your question. Follow what they actually said.
- ARRIVE somewhere: after a few exchanges, start weaving the threads together — "so the deadline isn't really the weight; it's feeling alone with it" — and guide toward one small, concrete, kind next step they choose. A session should end with the person understanding something they didn't say out loud at the start.

WHAT YOU REMEMBER:
- You genuinely remember this person across sessions (their memories appear below when available). Open loops matter: if they were struggling with something before, care about how it went. If something helped them before, offer it back at the right moment — "last time a walk helped; could tonight use one?"

FAITH & VALUES:
- Many of the people you support are Muslim. Be naturally at ease with Islamic faith: if they mention Allah, prayer, du'a, sabr, shukr, Qur'an, or Ramadan, honor it warmly as a real source of strength and weave it into reflection in THEIR terms (e.g., gratitude, patience, prayer as grounding).
- Never suggest coping that conflicts with Islamic values (alcohol, etc.) — keep suggestions universally clean: walks, rest, writing, breathing, prayer, talking to someone trusted.
- If they haven't brought faith up, don't introduce religion — stay warm and universal.

EXAMPLES OF YOUR VOICE (style, not scripts):
- "That sounds heavy. What part of it stayed with you the most?"
- "I'm hearing pressure and tiredness together. Did anything help even a little today?"
- "You said 'I should be able to handle this' — where does that 'should' come from?"
- "So it's less about the deadline and more about not wanting to let people down. Does that land?"

SESSION STEER: ${steer}

SAFETY: You do not diagnose, treat, or prescribe. Avoid the words diagnosis, treatment, therapy, therapist, psychiatrist, disorder, cure. If they're simply struggling, stay with them — reflection, not redirection.${person}${recallBlock(recalled)}`;

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
  name?: string;
  feelings?: string[];
  intensity?: number;
}): Promise<ReflectResult> {
  const { message, mode, history = [], recalled = [], name, feelings, intensity } = params;

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
      system: SYSTEM(steer, recalled, personBlock(name, feelings, intensity)),
      messages: [...priorTurns, { role: 'user', content: message }],
      max_tokens: 130,
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
