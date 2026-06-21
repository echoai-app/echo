'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* Web Speech API wrapper — real mic input (SpeechRecognition) + spoken replies
   (speechSynthesis), with graceful capability detection. If the browser lacks
   support, the room falls back to tap/type and silent replies. */

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyWindow = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

export interface VoiceHook {
  supported: boolean;
  ttsSupported: boolean;
  listening: boolean;
  partial: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, onEnd?: () => void, onStart?: () => void, neural?: boolean) => void;
  cancelSpeech: () => void;
}

export function useVoice(opts: {
  onResult: (finalText: string) => void;
  enabled?: boolean;
}): VoiceHook {
  const { onResult } = opts;
  const [supported, setSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const recRef = useRef<any>(null);
  const keepAlive = useRef(false);       // we intend to be listening (auto-restart)
  const startingRef = useRef(false);     // debounce overlapping start() calls
  const committedRef = useRef(false);    // this turn already sent (ignore late results)
  const turnTextRef = useRef('');        // best transcript so far this turn
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef(onResult);
  // Keep the latest callback without re-creating the recognizer each render.
  useEffect(() => { onResultRef.current = onResult; });

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const chosenVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Holds the currently-playing neural-TTS clip so it can be interrupted.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Increments on every speak/cancel so a slow in-flight request can't play
  // late and double up with a newer line ("two voices at once").
  const speakToken = useRef(0);
  // After a cloud-TTS request 5xx's (e.g. terms not accepted), stop retrying it
  // for the rest of the session and just use the browser voice.
  const cloudTtsOff = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as AnyWindow;
    // Pre-warm TTS voices: Chrome returns [] until voiceschanged fires, which
    // is why a first message can be silently voiceless.
    const loadVoices = () => {
      try {
        voicesRef.current = window.speechSynthesis?.getVoices() ?? [];
        chosenVoiceRef.current = pickWarmVoice(voicesRef.current);
      } catch { /* noop */ }
    };
    loadVoices();
    try { window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices); } catch { /* noop */ }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    let sttOk = false;
    if (SR) {
      sttOk = true;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onstart = () => { startingRef.current = false; };
      // Turn-taking by silence: accumulate what's heard, and ~1s after they stop,
      // commit it as their turn. Robust, and it never waits on a slow "final".
      rec.onresult = (e: any) => {
        if (committedRef.current) return;
        // join each result with a space (they mash into gibberish otherwise) and
        // collapse whitespace — this is the clean, readable transcript so far.
        let txt = '';
        for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript + ' ';
        txt = txt.replace(/\s+/g, ' ').trim();
        if (!txt) return;
        turnTextRef.current = txt;
        setPartial(txt);
        if (silenceRef.current) clearTimeout(silenceRef.current);
        silenceRef.current = setTimeout(() => {
          if (committedRef.current) return;
          committedRef.current = true;
          const t = turnTextRef.current.trim();
          turnTextRef.current = '';
          setPartial('');
          if (t) onResultRef.current(t);
        }, 1050);
      };
      rec.onend = () => {
        startingRef.current = false;
        // keep listening across short gaps until we deliberately stop
        if (keepAlive.current) {
          setTimeout(() => {
            const r = recRef.current;
            if (r && keepAlive.current && !startingRef.current) {
              startingRef.current = true;
              try { r.start(); } catch { startingRef.current = false; }
            }
          }, 150);
        } else setListening(false);
      };
      rec.onerror = (e: any) => {
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') { keepAlive.current = false; setListening(false); }
      };
      recRef.current = rec;
    }
    const tts = typeof window.speechSynthesis !== 'undefined';
    // One-time browser capability detection (external system) — not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(sttOk);
    setTtsSupported(tts);
    return () => {
      try { recRef.current?.abort?.(); } catch { /* noop */ }
      try { window.speechSynthesis?.cancel?.(); } catch { /* noop */ }
    };
  }, []);

  // start() throws if recognition is already running — guard so we never crash
  // or double-start during the rapid speak→listen→barge-in transitions.
  const safeStart = useCallback(() => {
    const rec = recRef.current;
    if (!rec || !keepAlive.current || startingRef.current) return;
    startingRef.current = true;
    try { rec.start(); }
    catch { startingRef.current = false; /* already running — that's fine */ }
  }, []);

  const startListening = useCallback(() => {
    if (!recRef.current) return;
    keepAlive.current = true;
    committedRef.current = false;   // fresh turn
    turnTextRef.current = '';
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
    setPartial('');
    setListening(true);
    safeStart();
  }, [safeStart]);

  const stopListening = useCallback(() => {
    keepAlive.current = false;
    committedRef.current = true;    // ignore any late results
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
    turnTextRef.current = '';
    try { recRef.current?.stop?.(); } catch { /* noop */ }
    try { recRef.current?.abort?.(); } catch { /* noop */ }
    setListening(false);
    setPartial('');
  }, []);

  // Fallback: the browser's own speechSynthesis with the warmest local voice.
  const browserSpeak = useCallback((text: string, onEnd?: () => void, onStart?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd?.(); return; }
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      // Pick the warmest available voice (cached). Natural/neural voices sound
      // best at their native pitch; only nudge rate down a touch for calm pacing.
      const voices = voicesRef.current.length ? voicesRef.current : synth.getVoices();
      const voice = chosenVoiceRef.current ?? pickWarmVoice(voices);
      if (voice) u.voice = voice;
      // deep + a touch monotone for a robotic, masculine fallback tone
      u.rate = 0.96;
      u.pitch = 0.7;
      // Chrome quietly pauses long utterances after ~15s — keep nudging it.
      const keepAlive = setInterval(() => { try { if (synth.speaking) synth.resume(); else clearInterval(keepAlive); } catch { clearInterval(keepAlive); } }, 9000);
      const done = () => { clearInterval(keepAlive); onEnd?.(); };
      u.onstart = () => onStart?.();
      u.onend = done;
      u.onerror = done;
      // cancel() immediately followed by speak() silently drops the utterance
      // on some Chrome builds — give the queue one tick to clear.
      setTimeout(() => { try { synth.speak(u); } catch { done(); } }, 50);
    } catch {
      onEnd?.();
    }
  }, []);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try { a.pause(); a.onplaying = null; a.onended = null; a.onerror = null; if (a.src) URL.revokeObjectURL(a.src); } catch { /* noop */ }
      audioRef.current = null;
    }
  }, []);

  // Primary: Echo's neural voice (Groq Orpheus). One clean clip — no ring-mod
  // (that produced a ghostly "second voice"). Falls back to the browser voice on
  // any hiccup. onStart fires when audio ACTUALLY begins, so the mouth syncs.
  const speak = useCallback((text: string, onEnd?: () => void, onStart?: () => void, neural = false) => {
    if (typeof window === 'undefined') { onEnd?.(); return; }
    const myToken = ++speakToken.current;
    const current = () => myToken === speakToken.current;
    let settled = false;
    const finish = () => { if (settled) return; settled = true; onEnd?.(); };
    const start = () => { if (current()) onStart?.(); };
    // stop whatever's currently speaking before starting a new line
    try { window.speechSynthesis?.cancel?.(); } catch { /* noop */ }
    stopAudio();

    // Default: the INSTANT on-device voice (the neural cloud voice adds 2–5s of
    // latency per reply, which kills the real-time feel). Neural is opt-in.
    if (!neural || cloudTtsOff.current) { browserSpeak(text, finish, start); return; }

    (async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        // Any non-2xx means cloud TTS won't work this session (terms not
        // accepted, key/quota, etc.) — stop retrying it and use the browser voice.
        if (!res.ok) { cloudTtsOff.current = true; throw new Error('tts ' + res.status); }
        const blob = await res.blob();
        if (!blob.size) throw new Error('empty audio');
        if (!current() || settled) return; // a newer line already took over → don't double up
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplaying = start;              // mouth + bubble sync to real audio
        audio.onended = () => { stopAudio(); finish(); };
        audio.onerror = () => { stopAudio(); if (!settled && current()) browserSpeak(text, finish, start); };
        await audio.play();
      } catch {
        if (!settled && current()) browserSpeak(text, finish, start);
      }
    })();
  }, [browserSpeak, stopAudio]);

  const cancelSpeech = useCallback(() => {
    speakToken.current++;   // invalidate any in-flight request so it can't play late
    try { window.speechSynthesis?.cancel?.(); } catch { /* noop */ }
    stopAudio();
  }, [stopAudio]);

  // Make sure neural audio never outlives the room.
  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  return { supported, ttsSupported, listening, partial, startListening, stopListening, speak, cancelSpeech };
}

/* Rank the device's voices and return the warmest, most human one available.
   Browser TTS quality varies wildly: modern "Natural"/"Neural" voices (Edge
   Online, Google, Apple premium) sound genuinely warm, while legacy compact /
   eSpeak voices sound robotic. We score so the good ones always win, falling
   back gracefully to whatever English voice exists. */
function pickWarmVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const en = voices.filter(v => /^en[-_]?/i.test(v.lang));
  const pool = en.length ? en : voices;

  const score = (v: SpeechSynthesisVoice): number => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural/.test(n)) s += 120;          // the real quality jump
    if (/google/.test(n)) s += 60;                   // Chrome's Google voices are smooth
    if (/online/.test(n)) s += 35;                    // Edge online (natural) voices
    if (/premium|enhanced|siri/.test(n)) s += 45;     // Apple high-quality voices
    // warm, well-liked named voices across platforms
    if (/\b(aria|jenny|ava|emma|libby|sonia|michelle|samantha|serena|allison|nora|hazel|zira)\b/.test(n)) s += 30;
    if (/en[-_](us|gb|au)/i.test(v.lang)) s += 12;    // prefer familiar English accents
    // a gentle lean toward a warmer, softer default voice for this product
    if (/female|woman|aria|jenny|ava|emma|libby|sonia|samantha|serena|allison|nora|hazel|zira|michelle/.test(n)) s += 10;
    // push obviously robotic / low-quality voices to the bottom
    if (/espeak|compact|albert|fred|zarvox|bells|bahh|boing|trinoids|robot|whisper/.test(n)) s -= 80;
    if (v.localService) s += 1;                       // tiny tiebreak: lower latency
    return s;
  };

  return pool.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
}
