import type { ReflectionMode } from '@/types';

export interface EchoMode {
  id: ReflectionMode;
  title: string;
  sub: string;
  ic: string;       // doodle icon name
  color: string;    // CSS var
  chip: string;
  // A one-line steer for the reflection responder's system prompt.
  steer: string;
}

export const MODES: EchoMode[] = [
  {
    id: 'checkin', title: 'Quick check-in', sub: 'Two minutes. How am I, really?',
    ic: 'pulse', color: 'var(--sage)', chip: '≈ 2 min',
    steer: 'Keep it short and warm. One or two gentle questions, then help name how they really are and one tiny thing for today.',
  },
  {
    id: 'vent', title: 'I need to vent', sub: 'Let it out. No fixing, just space.',
    ic: 'chat', color: 'var(--peach)', chip: 'open-ended',
    steer: 'Hold space. Do NOT rush to fix or advise. Validate, reflect back, and let them release. Only gently surface a thread near the end.',
  },
  {
    id: 'understand', title: 'Understand my thoughts', sub: 'Walk the reflection loop together.',
    ic: 'lens', color: 'var(--lav)', chip: 'guided',
    steer: 'Gently walk the reflection loop: situation → feeling → thought → body → what helped → reframe → tiny next step. One step at a time.',
  },
  {
    id: 'reset', title: 'Stress reset', sub: 'A grounding pause and one small step.',
    ic: 'breeze', color: 'var(--mint)', chip: '≈ 5 min',
    steer: 'Offer a brief grounding (breath / senses), then help them set down one worry and choose one small step. Calm, slow pacing.',
  },
  {
    id: 'weekly', title: 'Weekly reflection', sub: 'Zoom out — what shifted this week?',
    ic: 'star', color: 'var(--sun)', chip: 'weekly',
    steer: 'Zoom out across the week. What shifted, what recurred, what they learned about themselves, and one intention for next week.',
  },
];

export function getMode(id: string | undefined): EchoMode {
  return MODES.find(m => m.id === id) ?? MODES[1];
}
