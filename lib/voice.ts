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
  speak: (text: string, onEnd?: () => void) => void;
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
  const onResultRef = useRef(onResult);
  // Keep the latest callback without re-creating the recognizer each render.
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const chosenVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Holds the currently-playing neural-TTS clip so it can be interrupted.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Web Audio graph for the robotic voice effect (ring modulation).
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
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
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setPartial(interim || final);
        if (final.trim()) {
          onResultRef.current(final.trim());
          setPartial('');
        }
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
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

  const startListening = useCallback(() => {
    if (!recRef.current) return;
    try {
      setPartial('');
      setListening(true);
      recRef.current.start();
    } catch {
      // start() throws if already started — ignore.
      setListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    try { recRef.current?.stop?.(); } catch { /* noop */ }
    setListening(false);
  }, []);

  // Fallback: the browser's own speechSynthesis with the warmest local voice.
  const browserSpeak = useCallback((text: string, onEnd?: () => void) => {
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
      u.onend = done;
      u.onerror = done;
      // cancel() immediately followed by speak() silently drops the utterance
      // on some Chrome builds — give the queue one tick to clear.
      setTimeout(() => { try { synth.speak(u); } catch { done(); } }, 60);
    } catch {
      onEnd?.();
    }
  }, []);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try { a.pause(); a.onended = null; a.onerror = null; if (a.src) URL.revokeObjectURL(a.src); } catch { /* noop */ }
      audioRef.current = null;
    }
    const s = srcRef.current;
    if (s) {
      try { s.onended = null; s.stop(); } catch { /* already stopped */ }
      srcRef.current = null;
    }
  }, []);

  // Play the TTS clip through a ring-modulator so the male voice reads as a
  // friendly robot — a sine "carrier" mixed with the dry voice so words stay
  // clear. Returns false if Web Audio is unavailable so we can fall back.
  const playRobotic = useCallback(async (data: ArrayBuffer, onEnd: () => void): Promise<boolean> => {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      const ctx = ctxRef.current ?? new Ctor();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await ctx.decodeAudioData(data.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 0.96; // a touch deeper / more machine-like
      // ring modulation: multiply the voice by a low sine to get a robotic timbre
      const ring = ctx.createGain(); ring.gain.value = 0;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 60;
      osc.connect(ring.gain);
      // mostly the clear voice with just a hint of robotic shimmer on top
      const wet = ctx.createGain(); wet.gain.value = 0.22;
      const dry = ctx.createGain(); dry.gain.value = 0.95;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      src.connect(ring); ring.connect(wet); wet.connect(lp);
      src.connect(dry); dry.connect(lp);
      lp.connect(ctx.destination);
      osc.start();
      src.onended = () => { try { osc.stop(); } catch { /* noop */ } onEnd(); };
      srcRef.current = src;
      src.start();
      return true;
    } catch {
      return false;
    }
  }, []);

  // Primary: Echo's warm neural voice (Groq PlayAI TTS). Falls back to the
  // browser voice on any hiccup — autoplay blocks, network, or terms not set.
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined') { onEnd?.(); return; }
    let settled = false;
    const finish = () => { if (settled) return; settled = true; onEnd?.(); };
    // stop whatever's currently speaking before starting a new line
    try { window.speechSynthesis?.cancel?.(); } catch { /* noop */ }
    stopAudio();

    if (cloudTtsOff.current) { browserSpeak(text, finish); return; }

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
        const data = await res.arrayBuffer();
        if (!data.byteLength) throw new Error('empty audio');
        if (settled) return; // a newer line already took over
        // primary: robotic-male effect via Web Audio
        const ok = await playRobotic(data, () => { stopAudio(); finish(); });
        if (ok) return;
        // fallback: plain element playback, pitched down a touch for a deeper tone
        const url = URL.createObjectURL(new Blob([data], { type: 'audio/wav' }));
        const audio = new Audio(url);
        type PitchAudio = HTMLAudioElement & { preservesPitch?: boolean; mozPreservesPitch?: boolean; webkitPreservesPitch?: boolean };
        const pa = audio as PitchAudio;
        pa.preservesPitch = false; pa.mozPreservesPitch = false; pa.webkitPreservesPitch = false;
        audio.playbackRate = 0.94;
        audioRef.current = audio;
        audio.onended = () => { stopAudio(); finish(); };
        audio.onerror = () => { stopAudio(); if (!settled) browserSpeak(text, finish); };
        await audio.play();
      } catch {
        if (!settled) browserSpeak(text, finish);
      }
    })();
  }, [browserSpeak, stopAudio, playRobotic]);

  const cancelSpeech = useCallback(() => {
    try { window.speechSynthesis?.cancel?.(); } catch { /* noop */ }
    stopAudio();
  }, [stopAudio]);

  // Make sure neural audio never outlives the room.
  useEffect(() => () => {
    stopAudio();
    try { ctxRef.current?.close(); } catch { /* noop */ }
    ctxRef.current = null;
  }, [stopAudio]);

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
