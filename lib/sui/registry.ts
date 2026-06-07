'use client';

import { Transaction } from '@mysten/sui/transactions';
import type { useSuiClient } from '@mysten/dapp-kit';

// The exact client type dapp-kit's useSuiClient() returns (version-agnostic).
export type EchoSuiClient = ReturnType<typeof useSuiClient>;

/* Client helpers for the on-chain Echo MemoryRegistry.
   The Move package id is injected at build time. Until it's set, the registry is
   "disabled" and Echo runs Walrus-only (no on-chain claims). */

export const ECHO_PACKAGE_ID = process.env.NEXT_PUBLIC_ECHO_PACKAGE_ID ?? '';
export const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as 'testnet' | 'mainnet' | 'devnet';
const MODULE = 'memory_registry';
const STRUCT = 'MemoryPointer';

/** True only when a real package id is configured. */
export function registryEnabled(): boolean {
  return /^0x[0-9a-fA-F]{2,}$/.test(ECHO_PACKAGE_ID);
}

export function pointerType(): string {
  return `${ECHO_PACKAGE_ID}::${MODULE}::${STRUCT}`;
}

export interface MemoryPointerInfo {
  objectId: string;
  indexBlobId: string;
  updates?: number;
}

/** Find the wallet's MemoryPointer (if it has one) and read its latest index blob id. */
export async function getMemoryPointer(client: EchoSuiClient, owner: string): Promise<MemoryPointerInfo | null> {
  if (!registryEnabled()) return null;
  try {
    const res = await client.getOwnedObjects({
      owner,
      filter: { StructType: pointerType() },
      options: { showContent: true },
    });
    for (const o of res.data) {
      const content = o.data?.content;
      const objectId = o.data?.objectId;
      if (objectId && content && content.dataType === 'moveObject') {
        const fields = content.fields as { index_blob_id?: string; updates?: string };
        if (fields?.index_blob_id) {
          return { objectId, indexBlobId: fields.index_blob_id, updates: fields.updates ? Number(fields.updates) : undefined };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Build the register transaction — `update` if a pointer exists, else `create`. */
export function buildRegisterTx(indexBlobId: string, existingObjectId?: string | null): Transaction {
  const tx = new Transaction();
  if (existingObjectId) {
    tx.moveCall({
      target: `${ECHO_PACKAGE_ID}::${MODULE}::update`,
      arguments: [tx.object(existingObjectId), tx.pure.string(indexBlobId)],
    });
  } else {
    tx.moveCall({
      target: `${ECHO_PACKAGE_ID}::${MODULE}::create`,
      arguments: [tx.pure.string(indexBlobId)],
    });
  }
  return tx;
}

export function suiscanTxUrl(digest: string): string {
  return `https://suiscan.xyz/${SUI_NETWORK}/tx/${digest}`;
}
export function suiscanObjectUrl(id: string): string {
  return `https://suiscan.xyz/${SUI_NETWORK}/object/${id}`;
}
