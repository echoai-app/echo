# Sui Overflow 2026 — Submission Package (Walrus Track)

> Everything needed for the DeepSurge form, in one place. Deadline: **June 21** (submit June 20). Demo Day (if shortlisted): **July 20–21, virtual** — be available.

## The form fields

| Field | Value |
|---|---|
| **Project name** | Echo |
| **Tagline** | Talk today. Understand tomorrow. |
| **Track** | Special — Walrus |
| **Live site** | https://echoai-app.vercel.app |
| **GitHub** | https://github.com/i-anasop/echo (public through judging) |
| **Logo (1:1)** | `public/echo-logo.png` (512×512 ring mark) |
| **Deployment** | Sui **testnet** |
| **Package ID** | `0xec0f4d2bfb1eb7d8e4b5df2cd110f326301ace269b421188594ef8937bfb1715` |
| **Demo video** | _(YouTube link — record with `docs/DEMO_SCRIPT.md`, ≤ 5 min)_ |

## Description (paste-ready, ~170 words)

> AI agents are stateless: everything they learn lives in one company's database and dies with the session — or the company. **Echo** is an AI reflection companion that proves the alternative. You talk through how you feel in an immersive 3D room; Echo proposes distilled memories and **you approve what's kept**. Approved memories become **real Walrus blobs**; a **wallet-signed Sui `MemoryPointer`** always references the latest memory index — so on any device, Echo recovers your context **from chain + Walrus alone**.
>
> The memory layer is bigger than one app: a second agent (the **Insight agent**) reads the same Walrus memory and stores its reports back as durable artifacts — multi-agent workflows on one verifiable layer. The **Memory Inspector** lets anyone audit a wallet's agent memory entirely client-side (Sui RPC + Walrus aggregator, zero backend), and a copy-paste `curl` in the README proves memory survives without us. Built on **Mnemos**, our reusable agent-memory engine. Echo is a reflection companion — not therapy, diagnosis, or crisis care.

## One-liner

> User-owned, verifiable AI memory on Walrus + Sui — proven through a companion that actually remembers you.

## Eligibility & rules checklist

- [x] Built during the hackathon period (Echo repo started June 6; Mnemos engine also built during the period — both within May 7 – Jun 21)
- [x] Deployed on Sui **testnet** (Move package live; Walrus testnet storage)
- [x] Public GitHub repo
- [ ] **Demo video** recorded + uploaded (YouTube, ≤ 5 min) ← the big remaining task
- [ ] **DeepSurge profile: "currently a university student" flag set** (University Award, $2,500 × 10 — solo student = eligible)
- [ ] Available for virtual **Demo Day July 20–21**
- [ ] KYC-ready (at least one team member must pass KYC for prizes)
- [ ] Not in an OFAC-sanctioned region ✓

## Judge fast-path (put in the submission notes)

1. Live app: https://echoai-app.vercel.app (guest mode works without a wallet)
2. Trustless verification: https://echoai-app.vercel.app/inspect?address=0x6cb2c7e04bebba1dc343b40bba8bd8c98d22d57db1c13cb4751fd9eb144540ba
3. No-backend recovery proof: README → "Verify it with curl"
4. Contract: [package on Suiscan](https://suiscan.xyz/testnet/object/0xec0f4d2bfb1eb7d8e4b5df2cd110f326301ace269b421188594ef8937bfb1715) · [publish tx](https://suiscan.xyz/testnet/tx/DMBQFE9EzFYwzGGPsT8SwDvZKw4a4MRTRjmuYYGSLAwy)
5. MemWal/Seal engagement: `docs/MEMWAL.md`

## Prize mechanics to remember

- 50% of any prize is paid at announcement; the other 50% **after mainnet deployment** (100% upfront if already on mainnet by August). → Plan: publish the Move package to mainnet post-submission; Walrus mainnet storage when WAL budget allows.
- $250k+ post-hackathon value (audits, mentorship) for winners — the roadmap in the README is written to show we'll keep building.
