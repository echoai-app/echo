import { NextRequest, NextResponse } from 'next/server';
import { proposeArtifacts } from '@/lib/echo/extractor';
import type { ReflectionTurn, SessionMeta } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/memory/propose — distill candidate memories from a finished session.
// The client owns the transcript and sends it here; nothing is stored yet.
export async function POST(req: NextRequest) {
  let body: { turns?: ReflectionTurn[]; meta?: Partial<SessionMeta>; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const turns = body.turns ?? [];
  try {
    const result = await proposeArtifacts({ turns, meta: body.meta, mode: body.mode });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not distill memories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
