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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as AnyWindow;
    // Pre-warm TTS voices: Chrome returns [] until voiceschanged fires, which
    // is why a first message can be silently voiceless.
    const loadVoices = () => { try { voicesRef.current = window.speechSynthesis?.getVoices() ?? []; } catch { /* noop */ } };
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

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd?.(); return; }
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.96;
      u.pitch = 1.02;
      // Chrome quietly pauses long utterances after ~15s — keep nudging it.
      const keepAlive = setInterval(() => { try { if (synth.speaking) synth.resume(); else clearInterval(keepAlive); } catch { clearInterval(keepAlive); } }, 9000);
      const done = () => { clearInterval(keepAlive); onEnd?.(); };
      u.onend = done;
      u.onerror = done;
      // Prefer a warm, natural English voice when available (pre-warmed list).
      const voices = voicesRef.current.length ? voicesRef.current : synth.getVoices();
      const preferred = voices.find(v => /female|samantha|aria|jenny|libby|sonia/i.test(v.name) && /en/i.test(v.lang))
        ?? voices.find(v => /en-US|en-GB/i.test(v.lang));
      if (preferred) u.voice = preferred;
      // cancel() immediately followed by speak() silently drops the utterance
      // on some Chrome builds — give the queue one tick to clear.
      setTimeout(() => { try { synth.speak(u); } catch { done(); } }, 60);
    } catch {
      onEnd?.();
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    try { window.speechSynthesis?.cancel?.(); } catch { /* noop */ }
  }, []);

  return { supported, ttsSupported, listening, partial, startListening, stopListening, speak, cancelSpeech };
}
