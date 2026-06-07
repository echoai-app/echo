import { NextRequest, NextResponse } from 'next/server';
import { restoreIndexFromBlob } from '@/lib/walrus/memory';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/memory/restore — rehydrate a user's memory index from a Walrus blob
// id (read from their on-chain MemoryPointer). This is the recovery step:
// wallet → Sui pointer → Walrus index blob → this restore → recall/journey work.
export async function POST(req: NextRequest) {
  let body: { user_id?: string; index_blob_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { user_id, index_blob_id } = body;
  if (!user_id || !index_blob_id) {
    return NextResponse.json({ error: 'user_id and index_blob_id are required' }, { status: 400 });
  }

  const result = await restoreIndexFromBlob(user_id, index_blob_id);
  return NextResponse.json(result);
}
