/* ──────────────────────────────────────────────────────────────────────────
   Workspace model — "one workspace = one memory context".

   In Echo, a workspace is the user's reflection journey. Every memory carries a
   workspace_id and retrieval is scoped to it, so a user's reflections stay
   isolated from other users and (potentially) other journeys.
   ────────────────────────────────────────────────────────────────────────── */

export const ECHO_APP = 'echo';
export const DEFAULT_WORKSPACE_ID = 'echo-reflection';

/** The reflection-journey workspace for a given user. One journey per user for
 *  the MVP; the id is namespaced so Echo memory never collides with anything. */
export function ensureWorkspaceId(userId: string | undefined | null): string {
  if (!userId) return DEFAULT_WORKSPACE_ID;
  return `${ECHO_APP}:${userId}`;
}

export function normalizeWorkspaceId(id: string | undefined | null): string {
  return id || DEFAULT_WORKSPACE_ID;
}
