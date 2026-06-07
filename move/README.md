# Echo — MemoryRegistry (Sui Move)

A tiny user-owned object that stores a wallet's **latest Walrus memory index blob id** on Sui.
This is the on-chain pointer that makes Echo's memory portable and verifiable:

```
wallet → MemoryPointer (owned object) → latest Walrus index blob → saved reflection artifacts
```

- `create(index_blob_id)` — first commit; mints a `MemoryPointer` and transfers it to the sender.
- `update(&mut MemoryPointer, index_blob_id)` — later commits; overwrites + bumps `updates`.

Each call is **signed by the user's wallet** from the browser (dapp-kit).

---

## Deploy (one time, testnet)

Prereqs: the [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) and a testnet address with gas.

```bash
# 1. a testnet address + gas (skip if you already have one)
sui client new-address ed25519
sui client switch --env testnet            # or: sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client faucet                           # fund the active address

# 2. publish
cd move/memory_registry
sui client publish --gas-budget 100000000
```

Copy the **published package id** from the output (`Published Objects → PackageID`), then add it to `echo/.env.local`:

```
NEXT_PUBLIC_ECHO_PACKAGE_ID=0x<your_package_id>
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Restart `npm run dev`. The app now registers a wallet-signed on-chain pointer on every commit.

> Until `NEXT_PUBLIC_ECHO_PACKAGE_ID` is set, Echo runs **Walrus-only** and never claims an on-chain
> pointer — guest and wallet saves both work, the Sui step is simply skipped.
