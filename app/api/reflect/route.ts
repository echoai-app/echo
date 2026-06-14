import { NextRequest, NextResponse } from 'next/server';
import { runReflection } from '@/lib/echo/reflection';
import type { ReflectRequest, RecalledMemory } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/reflect — one warm reflection turn. Returns { reply, safety }.
// Safety signals ('crisis' | 'medical') route to a safe response in the lib.
export async function POST(req: NextRequest) {
  let body: ReflectRequest & { recalled?: RecalledMemory[]; name?: string; feelings?: string[]; intensity?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, mode, history, recalled, name, feelings, intensity } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const result = await runReflection({ message, mode, history, recalled, name, feelings, intensity });
    return NextResponse.json({ reply: result.text, safety: result.safety });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reflection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
