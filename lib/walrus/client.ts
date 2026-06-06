const PUBLISHER = process.env.WALRUS_PUBLISHER_URL ?? 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = process.env.WALRUS_AGGREGATOR_URL ?? 'https://aggregator.walrus-testnet.walrus.space';
const DEFAULT_EPOCHS = 52;

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw new Error('unreachable');
}

// The rich receipt parsed from a Walrus publisher store. Powers Echo's proof card.
export interface WalrusStoreResult {
  blob_id: string;
  sui_object?: string;
  registered_epoch?: number;
  certified_epoch?: number;
  end_epoch?: number;
  size?: number;          // bytes
  cost?: number;          // FROST (1 WAL = 1e9 FROST)
  certified: boolean;
  already: boolean;       // true if the blob was already certified on Walrus
}

/** Store bytes on Walrus, returning the full verifiable receipt. */
export async function walrusStoreWithProof(
  data: string | Uint8Array,
  epochs = DEFAULT_EPOCHS,
): Promise<WalrusStoreResult> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const body: BodyInit = bytes.buffer as ArrayBuffer;
  return withRetry(async () => {
    const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    if (!res.ok) throw new Error(`Walrus store failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as WalrusStoreResponse;

    if (json.newlyCreated?.blobObject) {
      const o = json.newlyCreated.blobObject;
      return {
        blob_id: o.blobId,
        sui_object: o.id,
        registered_epoch: o.registeredEpoch,
        certified_epoch: o.certifiedEpoch ?? undefined,
        end_epoch: o.storage?.endEpoch,
        size: o.size,
        cost: json.newlyCreated.cost,
        certified: o.certifiedEpoch != null,
        already: false,
      };
    }
    if (json.alreadyCertified) {
      return {
        blob_id: json.alreadyCertified.blobId,
        sui_object: json.alreadyCertified.event?.txDigest,
        end_epoch: json.alreadyCertified.endEpoch,
        certified: true,
        already: true,
      };
    }
    throw new Error('Walrus store: unexpected response shape');
  });
}

/** Back-compat: store and return just the blob id. */
export async function walrusStore(data: string | Uint8Array, epochs = DEFAULT_EPOCHS): Promise<string> {
  const result = await walrusStoreWithProof(data, epochs);
  return result.blob_id;
}

export async function walrusFetch(blobId: string): Promise<Uint8Array> {
  return withRetry(async () => {
    const res = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
    if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  });
}

export async function walrusFetchText(blobId: string): Promise<string> {
  const bytes = await walrusFetch(blobId);
  return new TextDecoder().decode(bytes);
}

export async function walrusFetchJSON<T>(blobId: string): Promise<T> {
  const text = await walrusFetchText(blobId);
  return JSON.parse(text) as T;
}

export function aggregatorUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}

// Walrus REST response shapes
interface WalrusBlobObject {
  id: string;
  blobId: string;
  registeredEpoch?: number;
  certifiedEpoch?: number | null;
  size?: number;
  storage?: { startEpoch?: number; endEpoch?: number; storageSize?: number };
}
interface WalrusStoreResponse {
  newlyCreated?: { blobObject: WalrusBlobObject; cost?: number };
  alreadyCertified?: { blobId: string; endEpoch?: number; event?: { txDigest?: string } };
}
