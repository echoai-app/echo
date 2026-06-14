import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST /api/tts — neural text-to-speech for Echo's spoken replies.
// Uses Groq's fast PlayAI TTS (warm, human voice) with the key already
// configured for reflection. Returns audio/wav bytes. On any failure it
// responds non-2xx so the client falls back to the browser voice — speech
// never silently breaks.
const GROQ_TTS = 'https://api.groq.com/openai/v1/audio/speech';

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return new NextResponse(null, { status: 501 }); // no cloud voice → browser fallback

  let text = '';
  let voice = '';
  try {
    const body = (await req.json()) as { text?: string; voice?: string };
    text = (body.text ?? '').trim();
    voice = (body.voice ?? '').trim();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!text) return new NextResponse(null, { status: 400 });

  try {
    const r = await fetch(GROQ_TTS, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_TTS_MODEL ?? 'canopylabs/orpheus-v1-english',
        // "tara" is a warm, calm female voice — a good fit for Echo.
        voice: voice || process.env.GROQ_TTS_VOICE || 'tara',
        input: text.slice(0, 1200),
        response_format: 'wav',
      }),
    });
    if (!r.ok) return new NextResponse(null, { status: 502 }); // e.g. terms not accepted → fallback
    const audio = await r.arrayBuffer();
    if (!audio.byteLength) return new NextResponse(null, { status: 502 });
    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
