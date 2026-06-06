import type { ArtifactKind } from '@/types';

// Single source of truth for how each artifact kind is labelled and styled.
// Used by the extractor (label) and every screen that renders artifacts.
export const KIND_META: Record<ArtifactKind, { label: string; ic: string; color: string }> = {
  trigger:   { label: 'Trigger',        ic: 'pulse',  color: 'var(--peach)' },
  pattern:   { label: 'Pattern',        ic: 'lens',   color: 'var(--lav)' },
  coping:    { label: 'What helped',    ic: 'leaf',   color: 'var(--sage)' },
  summary:   { label: 'Summary',        ic: 'heart',  color: 'var(--sky)' },
  next_step: { label: 'Tiny next step', ic: 'sprout', color: 'var(--sun)' },
  context:   { label: 'Context',        ic: 'heart',  color: 'var(--sky)' },
  goal:      { label: 'Goal',           ic: 'star',   color: 'var(--sun)' },
};

export const ALL_KINDS = Object.keys(KIND_META) as ArtifactKind[];

export function kindLabel(kind: ArtifactKind): string {
  return KIND_META[kind]?.label ?? 'Reflection';
}

export function kindMeta(kind: ArtifactKind) {
  return KIND_META[kind] ?? KIND_META.summary;
}
