// Dynamic session intro: the opening line Echo speaks and the "say something
// like…" suggestion chips are both shaped by WHAT the person came in carrying
// (their selected feelings) and HOW LOUD it feels (intensity 1–10) — so the
// room never greets two different people the same way.

import { displayName } from '@/lib/store';

const INTENSITY_WORD = [
  'barely there', 'a quiet hum', 'noticeable', 'weighing on you', 'pretty loud',
  'hard to ignore', 'heavy', 'overwhelming', 'all-consuming', 'at your limit',
];

// Per-feeling things a person might actually open with — [gentler, more intense].
// Used to seed the suggestion chips so they match the mood, not a fixed script.
const OPENERS: Record<string, [string, string]> = {
  Heavy: ["There's a heaviness I can't shake", 'Everything feels really heavy right now'],
  Anxious: ['My mind keeps racing a bit', "I can't stop worrying and it's a lot"],
  'Worn out': ["I'm pretty worn out", "Honestly, I'm completely exhausted"],
  Numb: ['I feel kind of flat today', "I just feel numb, like nothing reaches me"],
  Frustrated: ["Something's been getting to me", "I'm so frustrated I could scream"],
  'Okay-ish': ["I'm okay-ish, just checking in", "I'm holding it together, barely"],
  Hopeful: ["I'm feeling a little hopeful", 'Something shifted and I want to hold onto it'],
  Restless: ["I can't quite switch off", "I'm so restless I can't sit still"],
};

const FALLBACK_CHIPS = ["I'm not sure where to start", "It's been one of those days", 'Can I just think out loud?'];

/** Up to three opener suggestions, matched to the selected feelings + intensity. */
export function suggestionChips(feelings: string[] = [], intensity = 6): string[] {
  const intense = intensity >= 7;
  const picks: string[] = [];
  for (const f of feelings) {
    const pair = OPENERS[f];
    if (pair && !picks.includes(pair[intense ? 1 : 0])) picks.push(pair[intense ? 1 : 0]);
    if (picks.length === 3) break;
  }
  for (const fb of FALLBACK_CHIPS) {
    if (picks.length === 3) break;
    if (!picks.includes(fb)) picks.push(fb);
  }
  return picks.slice(0, 3);
}

/** Echo's spoken opening line — greets by name, reflects the feeling + how loud it is. */
export function openingLine(name: string, feelings: string[] = [], intensity = 6): string {
  const who = displayName(name); // 'friend' when no name was given
  const feel = feelings.length
    ? feelings.slice(0, 2).map(f => f.toLowerCase()).join(' and ')
    : '';
  const loud = INTENSITY_WORD[Math.min(Math.max(intensity, 1), 10) - 1];

  // No feelings picked → a warm, open welcome.
  if (!feel) {
    return `Hey ${who} — I'm really glad you made the time. There's no rush here; take a breath. What's sitting with you right now?`;
  }

  // High intensity → slower, more tender; lighter intensity → warmer, curious.
  if (intensity >= 8) {
    return `Hey ${who}. I'm right here with you. It sounds like ${feel} is sitting with you — ${loud}. We don't have to rush any of it. What feels loudest in this moment?`;
  }
  if (intensity >= 5) {
    return `Hey ${who} — I'm really glad you're here. It sounds like you came in carrying ${feel}, and it's feeling ${loud}. Take your time. What's the part of it that's pulling at you most?`;
  }
  return `Hey ${who} — good to have you here. Sounds like there's a bit of ${feel} with you today, ${loud}. No agenda; where would you like to start?`;
}
