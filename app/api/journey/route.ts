import { NextRequest, NextResponse } from 'next/server';
import { getJourney } from '@/lib/echo/recall';
import { ensureWorkspaceId } from '@/lib/workspace';

export const runtime = 'nodejs';

// GET /api/journey?user_id=&workspace_id=
// Returns sessions, intensity trend, recurring themes, and saved artifacts.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ?? ensureWorkspaceId(userId);

  try {
    const journey = await getJourney(userId, workspaceId);
    return NextResponse.json(journey);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Journey load failed';
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
