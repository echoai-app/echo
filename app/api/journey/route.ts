import { NextRequest, NextResponse } from 'next/server';
import { getJourney } from '@/lib/echo/recall';
import { ensureWorkspaceId } from '@/lib/workspace';
import { getUserBlobMetadata, restoreIndexFromBlob } from '@/lib/walrus/memory';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/journey?user_id=&workspace_id=&index_blob_id=
// Returns sessions, intensity trend, recurring themes, and saved artifacts.
// When index_blob_id is provided (the client remembers its latest Walrus index
// blob), the index is restored from Walrus inline — so stats are correct on
// ANY serverless instance, not just the one that handled the save.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ?? ensureWorkspaceId(userId);
  const indexBlobId = req.nextUrl.searchParams.get('index_blob_id');

  if (indexBlobId) {
    try {
      const meta = await getUserBlobMetadata(userId, workspaceId);
      if (meta.length === 0) await restoreIndexFromBlob(userId, indexBlobId);
    } catch { /* fall through to whatever local state exists */ }
  }

  try {
    const journey = await getJourney(userId, workspaceId);
    return NextResponse.json(journey);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Journey load failed';
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
