// Lightweight, dependency-free topic tagging. Maps reflection text to a small
// set of canonical themes so the journey timeline can show real recurring
// threads (not mocked). Intentionally simple — good enough for a calm summary.

const THEME_DICT: { label: string; color: string; re: RegExp }[] = [
  { label: 'Work stress',     color: 'var(--peach)', re: /\b(work|deadline|deadlines|job|boss|project|meeting|email|overtime|career)\b/i },
  { label: 'Sleep & rest',    color: 'var(--sky)',   re: /\b(sleep|asleep|awake|tired|exhausted|rest|insomnia|4am|night|wake)\b/i },
  { label: 'Movement helps',  color: 'var(--sage)',  re: /\b(walk|walking|run|running|exercise|gym|movement|outside|fresh air|stretch)\b/i },
  { label: 'Relationships',   color: 'var(--lav)',   re: /\b(family|partner|friend|friends|people|others|sister|brother|mum|dad|relationship|lonely)\b/i },
  { label: 'Anxiety',         color: 'var(--rose)',  re: /\b(anxious|anxiety|worry|worried|panic|nervous|on edge|racing)\b/i },
  { label: 'Money',           color: 'var(--sun)',   re: /\b(money|rent|bills|finance|financial|debt|afford)\b/i },
  { label: 'Overwhelm',       color: 'var(--peach)', re: /\b(overwhelm|overwhelmed|too much|behind|can'?t cope|drowning|pile)\b/i },
  { label: 'Self-worth',      color: 'var(--lav)',   re: /\b(not good enough|failure|worthless|guilt|ashamed|never enough|let.* down)\b/i },
];

export function themeTagsFor(text: string): string[] {
  return THEME_DICT.filter(t => t.re.test(text)).map(t => t.label);
}

export function themeColor(label: string): string {
  return THEME_DICT.find(t => t.label === label)?.color ?? 'var(--mint)';
}
