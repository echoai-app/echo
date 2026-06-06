'use client';

import { create } from 'zustand';
import type {
  ReflectionTurn, SavedArtifact, WalrusProof, RecalledMemory, Journey, SessionMeta,
} from '@/types';
import type { ProposeResult } from '@/lib/echo/extractor';

export type ScreenId =
  | 'welcome' | 'onboard' | 'consent' | 'modes' | 'setup'
  | 'room' | 'memory' | 'debrief' | 'recall' | 'timeline';

export interface SessionState {
  session_id: string;
  mode: string;
  modeTitle: string;
  feelings: string[];
  intensity: number;
  remember: boolean;
}

export interface Prefs {
  voiceReplies: boolean;
  saveToWalrus: boolean;
  reducedMotion: boolean;
}

interface EchoState {
  screen: ScreenId;
  account: 'guest' | 'wallet';        // the user's chosen identity at consent
  name: string;

  session: SessionState;
  transcript: ReflectionTurn[];

  proposed: ProposeResult | null;
  saved: SavedArtifact[];
  proof: WalrusProof | null;

  recalled: RecalledMemory[];
  journey: Journey | null;
  lastTheme: string;                  // for "continue from last time"

  prefs: Prefs;

  // actions
  go: (s: ScreenId) => void;
  setAccount: (a: 'guest' | 'wallet') => void;
  setName: (n: string) => void;
  startSession: (patch: Partial<SessionState>) => void;
  patchSession: (patch: Partial<SessionState>) => void;
  setTranscript: (t: ReflectionTurn[]) => void;
  addTurn: (t: ReflectionTurn) => void;
  setProposed: (p: ProposeResult | null) => void;
  setSaved: (s: SavedArtifact[], proof: WalrusProof | null) => void;
  setRecalled: (r: RecalledMemory[]) => void;
  setJourney: (j: Journey | null) => void;
  setPref: (k: keyof Prefs, v: boolean) => void;
  resetSession: () => void;
}

function newSession(): SessionState {
  return {
    session_id: `s-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))}`,
    mode: 'vent',
    modeTitle: 'I need to vent',
    feelings: [],
    intensity: 6,
    remember: true,
  };
}

export const useEcho = create<EchoState>((set) => ({
  screen: 'welcome',
  account: 'guest',
  name: 'friend',

  session: newSession(),
  transcript: [],

  proposed: null,
  saved: [],
  proof: null,

  recalled: [],
  journey: null,
  lastTheme: 'work deadlines & lost sleep',

  prefs: { voiceReplies: true, saveToWalrus: true, reducedMotion: false },

  go: (screen) => set({ screen }),
  setAccount: (account) => set({ account }),
  setName: (name) => set({ name }),
  startSession: (patch) => set({ session: { ...newSession(), ...patch }, transcript: [], proposed: null, saved: [], proof: null }),
  patchSession: (patch) => set((st) => ({ session: { ...st.session, ...patch } })),
  setTranscript: (transcript) => set({ transcript }),
  addTurn: (t) => set((st) => ({ transcript: [...st.transcript, t] })),
  setProposed: (proposed) => set({ proposed }),
  setSaved: (saved, proof) => set({ saved, proof }),
  setRecalled: (recalled) => set({ recalled }),
  setJourney: (journey) => set({ journey }),
  setPref: (k, v) => set((st) => ({ prefs: { ...st.prefs, [k]: v } })),
  resetSession: () => set({ session: newSession(), transcript: [], proposed: null, saved: [], proof: null }),
}));

// Helper to assemble session meta for API calls.
export function sessionMeta(s: SessionState): SessionMeta {
  return {
    feelings: s.feelings,
    intensity: s.intensity,
    remember: s.remember,
    startedAt: new Date().toISOString(),
    modeTitle: s.modeTitle,
  };
}
