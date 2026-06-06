/* ──────────────────────────────────────────────────────────────────────────
   Safety — calm by default, strong only when it matters.

   Echo is an evidence-informed reflection companion, NOT medical care. Everyday
   sadness / stress / overwhelm get reflection, not redirection. We escalate ONLY
   on genuine crisis signals (self-harm, harm to others, abuse, medical
   emergency, or a request for diagnosis/treatment). Crisis content is handled by
   the safety flow and must NOT be silently stored as memory.
   ────────────────────────────────────────────────────────────────────────── */

// High-signal crisis phrases. Deliberately specific to avoid over-warning on
// ordinary "I'm so stressed / exhausted / I can't do this work" language.
const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill|hurt|harm|cut|end)\s+(myself|me)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(it|my life|things)\b/i,
  /\b(want|going|plan|planning|ready)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(be alive|live|wake up)\b/i,
  /\bno\s+reason\s+to\s+(live|go on)\b/i,
  /\b(self[-\s]?harm|self[-\s]?injur)/i,
  /\b(kill|hurt|harm)\s+(him|her|them|someone|people)\b/i,
  /\boverdos(e|ing)\b/i,
  /\b(being|been)\s+(abused|assaulted|attacked)\b/i,
];

// A request for clinical care Echo must not pretend to provide.
const MEDICAL_REQUEST = /\b(diagnos(e|is)|prescri(be|ption)|what (medication|meds)|do i have (depression|bipolar|ptsd|adhd|ocd)|am i (depressed|bipolar))\b/i;

export type SafetySignal = 'none' | 'crisis' | 'medical';

export function assessSafety(text: string): SafetySignal {
  if (CRISIS_PATTERNS.some(re => re.test(text))) return 'crisis';
  if (MEDICAL_REQUEST.test(text)) return 'medical';
  return 'none';
}

// The single gentle baseline note (shown once, on Consent).
export const BASELINE_SAFETY_NOTE =
  'Echo is a reflection companion, not medical care. If you ever feel at risk of harm or in crisis, please contact local emergency support or someone you trust.';

export function crisisResponse(): string {
  return (
    "I'm really glad you told me — and I want to make sure you're safe right now. " +
    "What you're carrying sounds like more than anyone should hold alone, and you deserve real support with it. " +
    "If you might be in danger or thinking about harming yourself, please reach out to your local emergency number, or a crisis line, right away — " +
    "and if you can, tell someone you trust so you don't have to be alone with this. " +
    "I'm still here with you. We can take the next moment together, slowly."
  );
}

export function medicalResponse(): string {
  return (
    "I can't diagnose or give medical advice — that's something only a qualified professional can do, and you'd deserve that care done properly. " +
    "What I can do is help you reflect on what you're noticing and how it's been affecting you, so you have a clearer picture to bring to someone who can help. " +
    "Would it help to talk through what's been going on?"
  );
}
