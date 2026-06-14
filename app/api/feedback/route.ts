import { NextRequest, NextResponse } from 'next/server';
import { pushFeedback, listFeedback, feedbackConfigured, type Feedback } from '@/lib/feedback-store';

export const runtime = 'nodejs';

// The owner key that gates reading feedback. Set FEEDBACK_KEY in the env to
// change it; a default keeps the viewer working out of the box.
const ADMIN_KEY = process.env.FEEDBACK_KEY || 'echo-anas-2026';

// POST /api/feedback — leave feedback. { rating, message, contact?, screen? }
export async function POST(req: NextRequest) {
  let body: Partial<Feedback>;
  try { body = (await req.json()) as Partial<Feedback>; }
  catch { return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 }); }

  const rating = Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0)));
  const message = (body.message ?? '').toString().slice(0, 2000).trim();
  if (!message && !rating) return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 });

  const item: Feedback = {
    rating,
    message,
    contact: (body.contact ?? '').toString().slice(0, 200).trim() || undefined,
    screen: (body.screen ?? '').toString().slice(0, 40) || undefined,
    at: new Date().toISOString(),
  };

  if (!feedbackConfigured()) {
    // No store wired yet — tell the client so it can thank the user anyway.
    return NextResponse.json({ ok: true, stored: false });
  }
  const stored = await pushFeedback(item);
  return NextResponse.json({ ok: true, stored });
}

// GET /api/feedback?key=... — owner-only: list all feedback.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') ?? '';
  if (key !== ADMIN_KEY) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  if (!feedbackConfigured()) return NextResponse.json({ ok: true, configured: false, items: [] });
  const items = (await listFeedback()) ?? [];
  return NextResponse.json({ ok: true, configured: true, items });
}
