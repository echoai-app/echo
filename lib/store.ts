'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ReflectionTurn, SavedArtifact, WalrusProof, RecalledMemory, Journey, SessionMeta,
} from '@/types';
import type { ProposeResult } from '@/lib/echo/extractor';

export type ScreenId =
  | 'welcome' | 'onboard' | 'consent' | 'modes' | 'setup'
  | 'room' | 'memory' | 'debrief' | 'recall' | 'timeline'
  | 'profile' | 'account' | 'privacy' | 'help';

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
  studioVoice: boolean;   // warm neural voice (slower to start) vs instant on-device voice
}

interface EchoState {
  screen: ScreenId;
  history: ScreenId[];                 // back stack (session-only, not persisted)
  account: 'guest' | 'wallet';        // the user's chosen identity at consent
  onboarded: boolean;                 // completed the intro (welcome→consent) — persisted
  name: string;
  pfp: string | null;                 // data-URL avatar (persisted locally)

  session: SessionState;
  transcript: ReflectionTurn[];

  proposed: ProposeResult | null;
  saved: SavedArtifact[];
  proof: WalrusProof | null;

  recalled: RecalledMemory[];
  journey: Journey | null;
  lastTheme: string;                  // for "continue from last time"
  lastIndexBlob: string | null;       // latest Walrus index blob — lets any
                                      // serverless instance restore stats/recall

  prefs: Prefs;

  // actions
  go: (s: ScreenId) => void;          // navigate forward (pushes back stack)
  back: () => void;                   // pop the back stack
  resetTo: (s: ScreenId) => void;     // jump and clear history (boot/logout/onboard-done)
  setAccount: (a: 'guest' | 'wallet') => void;
  setOnboarded: (b: boolean) => void;
  setName: (n: string) => void;
  setPfp: (d: string | null) => void;
  startSession: (patch: Partial<SessionState>) => void;
  patchSession: (patch: Partial<SessionState>) => void;
  setTranscript: (t: ReflectionTurn[]) => void;
  addTurn: (t: ReflectionTurn) => void;
  setProposed: (p: ProposeResult | null) => void;
  setSaved: (s: SavedArtifact[], proof: WalrusProof | null) => void;
  setRecalled: (r: RecalledMemory[]) => void;
  setJourney: (j: Journey | null) => void;
  setLastIndexBlob: (b: string | null) => void;
  setPref: (k: keyof Prefs, v: boolean) => void;
  resetSession: () => void;
  logout: () => void;                 // wipe identity + memory so the next sign-in starts fresh
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

export const useEcho = create<EchoState>()(
  persist(
    (set) => ({
      screen: 'welcome',
      history: [],
      account: 'guest',
      onboarded: false,
      name: '',
      pfp: null,

      session: newSession(),
      transcript: [],

      proposed: null,
      saved: [],
      proof: null,

      recalled: [],
      journey: null,
      lastTheme: 'work deadlines & lost sleep',
      lastIndexBlob: null,

      prefs: { voiceReplies: true, saveToWalrus: true, reducedMotion: false, studioVoice: false },

      go: (screen) => set((st) => (st.screen === screen ? {} : { screen, history: [...st.history, st.screen].slice(-25) })),
      back: () => set((st) => {
        if (st.history.length === 0) return { screen: 'modes' as ScreenId };
        const history = st.history.slice();
        const prev = history.pop() as ScreenId;
        return { screen: prev, history };
      }),
      resetTo: (screen) => set({ screen, history: [] }),
      setAccount: (account) => set({ account }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setName: (name) => set({ name }),
      setPfp: (pfp) => set({ pfp }),
      startSession: (patch) => set({ session: { ...newSession(), ...patch }, transcript: [], proposed: null, saved: [], proof: null }),
      patchSession: (patch) => set((st) => ({ session: { ...st.session, ...patch } })),
      setTranscript: (transcript) => set({ transcript }),
      addTurn: (t) => set((st) => ({ transcript: [...st.transcript, t] })),
      setProposed: (proposed) => set({ proposed }),
      setSaved: (saved, proof) => set({ saved, proof }),
      setRecalled: (recalled) => set({ recalled }),
      setJourney: (journey) => set({ journey }),
      setLastIndexBlob: (lastIndexBlob) => set({ lastIndexBlob }),
      setPref: (k, v) => set((st) => ({ prefs: { ...st.prefs, [k]: v } })),
      resetSession: () => set({ session: newSession(), transcript: [], proposed: null, saved: [], proof: null }),
      // Full sign-out: clears the persisted identity (name, pfp, account, index
      // blob) plus all in-memory session/memory state, and returns to welcome —
      // so logging back in (or a new person on this device) starts clean.
      logout: () => set({
        name: '', pfp: null, account: 'guest', onboarded: false, lastIndexBlob: null,
        journey: null, recalled: [], saved: [], proof: null, proposed: null,
        session: newSession(), transcript: [],
        screen: 'welcome', history: [],
      }),
    }),
    {
      name: 'echo-app',
      storage: createJSONStorage(() => localStorage),
      // Persist only durable preferences/identity — not transient session state.
      partialize: (s) => ({ name: s.name, pfp: s.pfp, prefs: s.prefs, account: s.account, onboarded: s.onboarded, lastIndexBlob: s.lastIndexBlob }),
    },
  ),
);

// Display name — capitalized first letter, friendly fallback.
export function displayName(name: string): string {
  const n = name.trim();
  if (!n) return 'friend';
  return n.charAt(0).toUpperCase() + n.slice(1);
}

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
