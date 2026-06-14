// Tiny persistence for user feedback, backed by Vercel KV / Upstash Redis over
// its REST API — no extra dependency, and it degrades gracefully (returns null/
// false) when the store isn't configured yet, so the app never breaks.

export interface Feedback {
  rating: number;        // 1..5
  message: string;
  contact?: string;      // optional email / handle
  screen?: string;       // where they were
  at: string;            // ISO timestamp
}

const KEY = 'echo:feedback';

function creds(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function cmd(args: (string | number)[]): Promise<{ result?: unknown; error?: string } | null> {
  const c = creds();
  if (!c) return null;
  try {
    const res = await fetch(c.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    return (await res.json()) as { result?: unknown; error?: string };
  } catch {
    return null;
  }
}

/** True if a persistent store is wired up. */
export function feedbackConfigured(): boolean {
  return creds() !== null;
}

/** Append one feedback entry. Returns false if the store isn't configured. */
export async function pushFeedback(item: Feedback): Promise<boolean> {
  const out = await cmd(['LPUSH', KEY, JSON.stringify(item)]);
  return !!out && !out.error;
}

/** Most-recent-first list of all feedback (null if the store isn't configured). */
export async function listFeedback(): Promise<Feedback[] | null> {
  const out = await cmd(['LRANGE', KEY, 0, -1]);
  if (!out || out.error || !Array.isArray(out.result)) return out === null ? null : [];
  return (out.result as string[])
    .map((s) => { try { return JSON.parse(s) as Feedback; } catch { return null; } })
    .filter((x): x is Feedback => !!x);
}
