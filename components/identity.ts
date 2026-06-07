'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ensureWorkspaceId } from '@/lib/workspace';

/* User identity for Echo.
   - Wallet connected → user_id = Sui wallet address (persistent across devices).
   - Otherwise        → user_id = a temporary guest session id (localStorage).
   Memory is always keyed by this user_id (+ workspace_id) server-side. */

const GUEST_KEY = 'echo-guest-id';

function loadGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = `guest-${crypto.randomUUID()}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return `guest-${crypto.randomUUID()}`;
  }
}

export type IdentityMode = 'guest' | 'wallet';

export interface Identity {
  userId: string | null;       // null until guest id hydrates on the client
  workspaceId: string | null;
  mode: IdentityMode;
  address: string | null;
  shortAddress: string | null;
  ready: boolean;
}

export function useIdentity(): Identity {
  const account = useCurrentAccount();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    // Resolve the guest id only on the client (localStorage is unavailable during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestId(loadGuestId());
  }, []);

  const address = account?.address ?? null;
  const userId = address ?? guestId;
  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return {
    userId,
    workspaceId: userId ? ensureWorkspaceId(userId) : null,
    mode: address ? 'wallet' : 'guest',
    address,
    shortAddress,
    ready: userId != null,
  };
}
