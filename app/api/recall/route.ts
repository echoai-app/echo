import { NextRequest, NextResponse } from 'next/server';
import { recall } from '@/lib/echo/recall';
import { ensureWorkspaceId } from '@/lib/workspace';
import { getUserBlobMetadata, restoreIndexFromBlob } from '@/lib/walrus/memory';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/recall?user_id=&workspace_id=&context=&index_blob_id=
// Returns the memories Echo selected as relevant, each with a "selected because"
// reason. When index_blob_id is provided (read client-side from the user's
// on-chain MemoryPointer), the index is restored from Walrus inline — the same
// serverless instance that restores also answers, so recovery can't race
// across instances with ephemeral filesystems.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ?? ensureWorkspaceId(userId);
  const context = req.nextUrl.searchParams.get('context') ?? undefined;
  const indexBlobId = req.nextUrl.searchParams.get('index_blob_id');

  let restored = false;
  if (indexBlobId) {
    try {
      const meta = await getUserBlobMetadata(userId, workspaceId);
      if (meta.length === 0) restored = (await restoreIndexFromBlob(userId, indexBlobId)).ok;
    } catch { /* fall through to whatever local state exists */ }
  }

  try {
    const recalled = await recall({ user_id: userId, workspace_id: workspaceId, context });
    return NextResponse.json({ recalled, restored });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Recall failed';
    return NextResponse.json({ error: message, recalled: [], restored }, { status: 200 });
  }
}
