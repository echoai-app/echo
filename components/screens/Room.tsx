'use client';

import { useEffect, useRef, useState } from 'react';
import { SessionBar } from '../chrome';
import { Orb, Ic, Chip, Typing, Btn, LogoMark, type OrbState } from '../ui';
import { ReflectionScene } from './ReflectionScene';
import { useEcho, sessionMeta } from '@/lib/store';
import { useIdentity } from '../identity';
import { useVoice } from '@/lib/voice';
import type { ChatMessage, ReflectionTurn } from '@/types';

const STATE_META: Record<string, { dot: string; label: string; live: boolean }> = {
  idle: { dot: 'var(--ink-faint)', label: 'ready when you are', live: false },
  listening: { dot: 'var(--rose-deep)', label: 'listening', live: true },
  thinking: { dot: 'var(--lav-deep)', label: 'reflecting…', live: false },
  speaking: { dot: 'var(--sage-deep)', label: 'Echo is speaking', live: true },
  saving: { dot: 'var(--sky-deep)', label: 'weaving memory…', live: true },
  paused: { dot: 'var(--ink-faint)', label: 'paused — take your time', live: false },
};

const IDLE_CHIPS = ["Work's been a lot", "I can't switch off", "Honestly, I'm exhausted"];

// forming-memory chip detectors (real-time, from what's been said)
const FORMING: { re: RegExp; label: string; ic: string; c: string }[] = [
  { re: /\b(work|deadline|job|boss|project)\b/i, label: 'Work pressure', ic: 'pulse', c: 'var(--peach)' },
  { re: /\b(sleep|awake|tired|rest|4am|night)\b/i, label: 'Lost sleep', ic: 'lens', c: 'var(--lav)' },
  { re: /\b(walk|run|exercise|outside|breath|music)\b/i, label: 'Something that helped', ic: 'leaf', c: 'var(--sage)' },
  { re: /\b(anxious|anxiety|worry|panic|nervous)\b/i, label: 'Anxiety', ic: 'pulse', c: 'var(--rose)' },
  { re: /\b(family|partner|friend|people|alone|lonely)\b/i, label: 'Relationships', ic: 'heart', c: 'var(--sky)' },
];

function opening(feelings: string[]): string {
  const feel = feelings.length
    ? ` It sounds like you came in carrying ${feelings.slice(0, 2).join(' and ').toLowerCase()}.`
    : '';
  return `Hey — I'm really glad you're here. No rush at all; take a breath.${feel} What's sitting with you right now?`;
}

export default function Room() {
  const { go, session, transcript, addTurn, setProposed, recalled, prefs } = useEcho();
  const [vs, setVs] = useState<OrbState>('idle');
  const [scene3d, setScene3d] = useState(false);
  const [showText, setShowText] = useState(false);
  const [text, setText] = useState('');
  // one-time mic explainer so the permission prompt never startles anyone
  const [micHint, setMicHint] = useState(() => typeof window !== 'undefined' && !localStorage.getItem('echo-mic-hint'));
  // open by default only where it fits beside the room (phones: toggle it in)
  const [showTr, setShowTr] = useState(() => typeof window !== 'undefined' && window.innerWidth > 820);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth > 820);
  const trRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(false);
  // Hands-free conversation: after Echo finishes speaking, the mic re-opens by
  // itself — no tapping every turn. Typing (or pausing) hands control back.
  const handsFree = useRef(true);
  const id = useIdentity();

  const voice = useVoice({ onResult: (t) => send(t, 'voice') });

  // Every session is memory-aware: quietly recall this user's context at the
  // start (not just on the "continue from last time" path).
  const { setRecalled } = useEcho.getState();
  useEffect(() => {
    if (!id.ready || !id.userId || recalled.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const blob = useEcho.getState().lastIndexBlob;
        const res = await fetch(`/api/recall?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}&context=${encodeURIComponent(session.modeTitle)}${blob ? `&index_blob_id=${encodeURIComponent(blob)}` : ''}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.recalled) && data.recalled.length) setRecalled(data.recalled);
      } catch { /* session still works without recall */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId]);

  // Track viewport width so the transcript docks beside the room only where it
  // fits; on phones it overlays instead (no layout squeeze).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 821px)');
    const h = () => setWide(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const docked = showTr && wide;

  // Opening line, once.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = timers.current;
    if (transcript.length === 0) {
      const line = opening(session.feelings);
      addTurn({ role: 'echo', text: line, source: 'voice', at: new Date().toISOString() });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: kick off the opening "speaking" state on mount
      setVs('speaking');
      speakOrTimeout(line);
    }
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (trRef.current) trRef.current.scrollTop = trRef.current.scrollHeight; }, [transcript, vs, showTr]);

  // First successful listen → the hint has done its job, forever.
  useEffect(() => {
    if (voice.listening && micHint) {
      try { localStorage.setItem('echo-mic-hint', '1'); } catch { /* private mode */ }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the external mic lifecycle
      setMicHint(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.listening]);

  // If a voice listen ends with no result, settle back to idle.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing orb state to the external speech-recognition lifecycle
    if (!voice.listening && vs === 'listening') setVs('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.listening]);

  const lastEcho = [...transcript].reverse().find(m => m.role === 'echo')?.text;

  function speakOrTimeout(line: string, onDone?: () => void) {
    const finish = () => {
      // hands-free: Echo finished talking → open the mic for their reply
      if (handsFree.current) {
        voice.startListening();
        setVs('listening');
      } else {
        setVs('idle');
      }
      onDone?.();
    };
    // check the real browser capability — the hook's state isn't set yet on the
    // very first render, which silently muted the opening line
    const ttsNow = typeof window !== 'undefined' && !!window.speechSynthesis;
    if (prefs.voiceReplies && ttsNow) {
      voice.speak(line, finish);
    } else {
      const dur = Math.min(4200, 1400 + line.length * 22);
      timers.current.push(setTimeout(finish, dur));
    }
  }

  async function send(said: string, source: 'voice' | 'text') {
    const msg = said.trim();
    if (!msg || vs === 'thinking' || vs === 'saving') return;
    // typing means they'd rather not be on-mic — stop auto-listening
    if (source === 'text') handsFree.current = false;
    voice.cancelSpeech();
    setShowText(false); setText('');

    const history: ChatMessage[] = transcript.map(t => ({
      role: t.role === 'echo' ? 'assistant' : 'user', content: t.text,
    }));
    addTurn({ role: 'user', text: msg, source, at: new Date().toISOString() });
    setVs('thinking');

    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, mode: session.mode, history, recalled }),
      });
      const data = await res.json();
      const reply: string = data.reply ?? "I'm here with you. Tell me more whenever you're ready.";
      addTurn({ role: 'echo', text: reply, source: 'voice', at: new Date().toISOString() });
      setVs('speaking');
      speakOrTimeout(reply);
    } catch {
      const reply = "I'm here with you — take your time.";
      addTurn({ role: 'echo', text: reply, source: 'voice', at: new Date().toISOString() });
      setVs('speaking');
      speakOrTimeout(reply);
    }
  }

  const micTap = () => {
    if (vs === 'thinking' || vs === 'saving') return;
    if (voice.supported) {
      if (voice.listening) { handsFree.current = false; voice.stopListening(); setVs('idle'); }
      else { handsFree.current = true; voice.cancelSpeech(); voice.startListening(); setVs('listening'); }
    } else {
      setShowText(true);
    }
  };

  async function endReflection() {
    voice.cancelSpeech(); voice.stopListening();
    setVs('saving');
    const turns: ReflectionTurn[] = transcript;
    try {
      const res = await fetch('/api/memory/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns, meta: sessionMeta(session), mode: session.mode }),
      });
      const data = await res.json();
      setProposed(data);
    } catch {
      setProposed({ summary: '', theme: '', artifacts: [], left_out: '' });
    }
    timers.current.push(setTimeout(() => go('memory'), 700));
  }

  const userText = transcript.filter(t => t.role === 'user').map(t => t.text).join(' ');
  const forming = FORMING.filter(f => f.re.test(userText)).slice(0, 3);
  const meta = STATE_META[vs] ?? STATE_META.idle;
  const idleWithChips = vs === 'idle';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SessionBar step={1} risk action={{ label: 'End & review', onClick: endReflection, disabled: vs === 'saving' }} />
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div className="room">
          <ReflectionScene state={vs} onMode={(m) => setScene3d(m === '3d')} />

          {/* this-session forming memory */}
          <div className="room-panel" style={{ position: 'absolute', top: 18, left: 18, padding: '13px 15px', maxWidth: 224, zIndex: 4 }}>
            <div className="kicker" style={{ marginBottom: 9, fontSize: 11 }}>this session</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {forming.length ? forming.map(f => (
                <span key={f.label} className="forming-chip"><Ic name={f.ic} size={13} stroke="var(--ink)" /> {f.label}</span>
              )) : <span className="muted" style={{ fontWeight: 700, fontSize: 12.5 }}>listening for what matters…</span>}
            </div>
          </div>

          {docked && (
            <div style={{ position: 'absolute', top: 18, right: 372, zIndex: 4 }}>
              <span className="chip sm deco" style={{ background: 'var(--mint)', boxShadow: '2px 3px 0 var(--ink)' }}>
                <LogoMark brand="walrus" size={15} /> kept memories save to Walrus
              </span>
            </div>
          )}
          {!showTr && (
            <button className="btn ghost sm" style={{ position: 'absolute', top: 14, right: 16, zIndex: 6 }} onClick={() => setShowTr(true)}>
              <Ic name="chat" size={16} /> Transcript
            </button>
          )}

          {/* center: bubble + orb + live feedback (in 3D, the companion is the
              presence — bubbles anchor near the top and the 2D orb stays out) */}
          <div style={{ position: 'absolute', left: 0, right: docked ? 354 : 0, top: 64, bottom: scene3d ? 'auto' : 244, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: scene3d ? 'flex-start' : 'center', gap: 12, zIndex: 5, pointerEvents: 'none' }}>
            {!showTr && vs === 'speaking' && lastEcho &&
              <div className="say italic shimmer" key={lastEcho} style={{ animation: 'popIn .4s ease both', maxWidth: 440, position: 'relative', overflow: 'hidden' }}>&ldquo;{lastEcho}&rdquo;</div>}
            {!showTr && (vs === 'idle' || vs === 'ended') && lastEcho &&
              <div className="say italic" key={lastEcho} style={{ animation: 'popIn .4s ease both', maxWidth: 440 }}>&ldquo;{lastEcho}&rdquo;</div>}
            {!showTr && vs === 'thinking' && <div className="say" style={{ animation: 'popIn .3s ease both' }}><Typing /></div>}
            {vs === 'listening' &&
              <div className="say" style={{ animation: 'popIn .3s ease both', display: 'flex', alignItems: 'center', gap: 13, pointerEvents: 'none' }}>
                <span className="wave"><i /><i /><i /><i /><i /><i /><i /></span>
                <span style={{ fontWeight: 700 }}>{voice.partial || "I'm listening…"}</span>
              </div>}

            {!scene3d && <Orb size={138} state={vs} mood="lav" />}

            {(vs === 'speaking' || vs === 'listening') && !scene3d ? (
              <div className={'orb-eq ' + (vs === 'listening' ? 'rose' : 'peach')}>
                {Array.from({ length: 9 }).map((_, i) => <i key={i} />)}
              </div>
            ) : !(idleWithChips) && (
              <div className="state-pill">
                <span className={'state-dot' + (meta.live ? ' live' : '')} style={{ background: meta.dot }} />
                {meta.label}
              </div>
            )}
          </div>

          {showTr && <Transcript onClose={() => setShowTr(false)} trRef={trRef} intensity={session.intensity} msgs={transcript} thinking={vs === 'thinking'} />}

          {/* voice dock */}
          <div className="voice-dock" style={{ left: docked ? 'calc((100% - 354px) / 2)' : '50%', width: docked ? 'min(560px, calc(100% - 384px))' : 'min(680px, 92%)' }}>
            {showText &&
              <div className="dock-bar" style={{ padding: '12px 16px', width: '100%', gap: 12 }}>
                <input className="field" autoFocus value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(text, 'text')} placeholder="type instead of speaking…" style={{ flex: 1 }} />
                <Btn variant="primary" icon="arrowR" onClick={() => send(text, 'text')} />
              </div>}

            {idleWithChips &&
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span className="muted" style={{ fontWeight: 800, fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase' }}>say something like…</span>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
                  {IDLE_CHIPS.map(c => (
                    <button key={c} className="chip chip-btn" style={{ background: 'var(--paper)' }} onClick={() => send(c, 'text')}>{c}</button>
                  ))}
                </div>
              </div>}

            {micHint && voice.supported && (
              <div className="mic-hint">
                <Ic name="ear" size={14} /> Echo listens after it speaks — allow the mic once, then just talk.
              </div>
            )}
            <div className="dock-bar">
              <div className="dock-col">
                <button className={'mic-btn' + (vs === 'listening' ? ' listening' : '') + ((vs === 'thinking' || vs === 'saving') ? ' busy' : '')}
                  onClick={micTap} disabled={vs === 'thinking' || vs === 'saving'} aria-label="Talk to Echo">
                  <span className="mic-ring" /><span className="mic-ring r2" />
                  {vs === 'listening'
                    ? <span className="wave" style={{ height: 30 }}><i /><i /><i /><i /><i /></span>
                    : <Ic name="mic" size={34} stroke="var(--ink)" />}
                </button>
                <span className="mic-cap">
                  {vs === 'idle' ? (voice.supported ? 'Tap to talk' : 'Tap to type')
                    : vs === 'listening' ? 'Listening…'
                      : vs === 'thinking' ? '…'
                        : vs === 'speaking' ? 'Echo speaking' : '…'}
                </span>
              </div>

              <div className="dock-div" />

              <div className="dock-col">
                <button className={'ctrl-btn' + (showText ? ' on' : '')} onClick={() => setShowText(s => !s)} aria-label="Type instead">
                  <Ic name="keyboard" size={22} />
                </button>
                <span className="ctrl-cap">Type</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Transcript({ msgs, onClose, trRef, intensity, thinking }: {
  msgs: ReflectionTurn[]; onClose: () => void; trRef: React.RefObject<HTMLDivElement | null>; intensity: number; thinking?: boolean;
}) {
  return (
    <div className="transcript">
      <div className="transcript-head">
        <span className="display" style={{ fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ic name="chat" size={18} /> Transcript</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Chip sm tone="peach" ic="pulse">{intensity}/10</Chip>
          <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={onClose} title="Hide transcript"><Ic name="x" size={16} /></button>
        </div>
      </div>
      <div ref={trRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} className={'bubble ' + (m.role === 'echo' ? 'echo italic' : 'me')} style={{ maxWidth: '94%', fontSize: 14.5, boxShadow: '3px 4px 0 var(--ink)' }}>
            {m.role === 'echo' ? `“${m.text}”` : m.text}
          </div>
        ))}
        {thinking && <Typing />}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '3px solid var(--ink)', background: 'var(--cream)' }}>
        <span className="muted" style={{ fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Ic name="ear" size={14} /> Text just supports — Echo leads by listening.</span>
      </div>
    </div>
  );
}
