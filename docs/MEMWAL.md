# Mnemos × MemWal (Walrus Memory)

> How Echo's memory engine relates to [MemWal](https://github.com/MystenLabs/MemWal), Mysten's Walrus Memory SDK — and the concrete adapter design that lets Mnemos use MemWal as a pluggable backend.

## Two takes on the same conviction

Echo's memory engine (**Mnemos**) and **MemWal** were built independently on the same thesis: *agent memory belongs on a verifiable data layer, not inside an app's database.* Both store memories on **Walrus**, anchor **ownership on Sui**, and retrieve via **semantic search**. The architectures differ in where they put trust and visibility:

| | **Mnemos** (Echo's engine) | **MemWal** (Walrus Memory) |
|---|---|---|
| Storage unit | Distilled, **user-approved artifacts** (JSON blobs) + a versioned index blob | Encrypted memory records, scoped by `owner + namespace` |
| Encryption | None yet (testnet demo data is public, stated at consent; **Seal is the roadmap**) | **SEAL** end-to-end — relayer encrypts before upload |
| Embeddings & search | Voyage embeddings; index mirrored locally + backed up to Walrus | Relayer-managed embeddings; vector metadata in PostgreSQL |
| Sui's role | A user-**owned `MemoryPointer` object** → latest index blob, updated only by wallet-signed txs | Account ownership + access control via `accountId` + delegate keys |
| Trustless recovery | **Yes** — wallet → pointer → index → blobs, reproducible by [curl](../README.md#verify-it-with-curl--no-echo-backend-involved) or the [Memory Inspector](https://echoai-app.vercel.app/inspect) with zero app backend | Via the relayer (`restore(namespace)`) |
| Infrastructure | No extra services — public Walrus publisher/aggregator + Sui RPC | SDK → **relayer** service → Walrus + Sui |
| Status | Live in Echo (testnet) | Beta (`@mysten-incubation/memwal`) |

**The short version:** MemWal optimizes for *privacy and developer convenience* (encrypted records, managed relayer). Mnemos optimizes for *public verifiability and self-custody of the pointer* (every hop independently checkable). These are complementary ends of the same design space — which is exactly why an adapter makes sense.

## The adapter design

Echo's memory operations already reduce to three verbs, which map 1:1 onto MemWal's API:

```ts
// lib/memory/backend.ts — the contract both engines satisfy
export interface MemoryBackend {
  /** Persist one approved artifact; resolves with a verifiable reference. */
  remember(userId: string, artifact: MemorySpec): Promise<{ ref: string; proof?: WalrusProof }>;
  /** Semantic recall scoped to the user's memory space. */
  recall(userId: string, query: string, limit?: number): Promise<RecalledMemory[]>;
  /** Rebuild local state from the durable layer (new device / cold start). */
  restore(userId: string, pointer?: string): Promise<{ ok: boolean; entries: number }>;
}
```

| `MemoryBackend` | Mnemos implementation (today) | MemWal implementation (adapter) |
|---|---|---|
| `remember` | Walrus blob write + index flush (`storeMemoriesBatch`) | `memwal.remember(text)` + `waitForRememberJob(job_id)` |
| `recall` | Local index + embedding search (`/api/recall`) | `memwal.recall({ query })` |
| `restore` | Sui pointer → `restoreIndexFromBlob` | `memwal.restore(namespace)` |
| identity scope | `user_id` / `workspace_id` (`echo:<user>`) | `accountId` + `namespace` |

Configuration (env, server-side only):

```
MEMWAL_DELEGATE_KEY=…      # from the MemWal Playground
MEMWAL_ACCOUNT_ID=…
MEMWAL_SERVER_URL=…        # relayer endpoint
MEMORY_BACKEND=memwal      # default: mnemos
```

## Why the adapter isn't shipped in this submission

We hold a hard rule: **nothing incomplete or unreliable in the final build.** Wiring MemWal for real requires a Playground account + delegate key and a live relayer, and its SEAL encryption intentionally hides blob contents — which would silently break the two features judges can verify by hand today (the proof card's public Walruscan links and the trustless Inspector). Shipping an untested backend days before the deadline would trade working proof for a checkbox.

So the honest sequencing is:

1. **Now (this submission):** Mnemos backend, fully verifiable end-to-end on testnet.
2. **Next:** the `MemoryBackend` adapter above, with MemWal as the **privacy-tier** backend — encrypted records via MemWal/SEAL for sensitive memory, public-verifiable Mnemos artifacts for provable memory, selectable per workspace.
3. **With Seal on Mnemos blobs**, the two layers converge: public availability, private readability, user-owned pointers.

*References: [MemWal repo](https://github.com/MystenLabs/MemWal) · [Walrus Memory](https://walrus.xyz/products/walrus-memory/) · [Seal](https://github.com/MystenLabs/seal)*
