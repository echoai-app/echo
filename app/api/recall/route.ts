import { NextRequest, NextResponse } from 'next/server';
import { recall } from '@/lib/echo/recall';
import { ensureWorkspaceId } from '@/lib/workspace';

export const runtime = 'nodejs';

// GET /api/recall?user_id=&workspace_id=&context=
// Returns the memories Echo selected as relevant, each with a "selected because" reason.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ?? ensureWorkspaceId(userId);
  const context = req.nextUrl.searchParams.get('context') ?? undefined;

  try {
    const recalled = await recall({ user_id: userId, workspace_id: workspaceId, context });
    return NextResponse.json({ recalled });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Recall failed';
    return NextResponse.json({ error: message, recalled: [] }, { status: 200 });
  }
}
