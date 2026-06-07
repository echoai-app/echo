<div align="center">

<img src="public/echo-mark.svg" width="96" alt="Echo logo" />

# Echo

**A calm, voice-first emotional reflection companion that actually remembers you.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://typescriptlang.org)
[![Walrus](https://img.shields.io/badge/Storage-Walrus%20Testnet-00c2ff)](https://walrus.xyz)
[![Sui](https://img.shields.io/badge/Identity-Sui-6fbcf0?logo=sui)](https://sui.io)
[![Mnemos](https://img.shields.io/badge/Memory-Mnemos-cbbcee)](https://github.com/i-anasop/Mnemos)

*Built for [Sui Overflow 2026](https://suioverflow.com) — Walrus Track · a product layer on the [Mnemos](https://github.com/i-anasop/Mnemos) engine*

</div>

---

## What is Echo?

A normal chatbot forgets you the moment a chat ends. For emotional reflection, that forgetting is the whole problem — you re-explain your context, your stressors, and what helped, every single time. **Echo fixes this.**

Echo is a warm, voice-first companion that helps you think out loud, understand your patterns, and take one small next step. Each session runs a light, evidence-informed reflection loop (Situation → Feeling → Thought → Body → Action → Reframe → Next step), and — crucially — **remembers what matters across sessions**. Memory is powered by **[Mnemos](https://github.com/i-anasop/Mnemos)**, persisted verifiably on **[Walrus](https://walrus.xyz)**, and keyed to a **Sui** wallet (or a guest identity).

The magic moment: you reflect, approve a few memories, leave — and days later Echo recalls your triggers, the coping that actually helped, and how your intensity is trending.

> **Echo is an evidence-informed reflection companion, not medical care.** It does not diagnose, treat, or replace professional help. See [Safety](#safety).

### Key properties

- **Consent-first** — nothing is remembered until you review and approve it in a Memory step
- **Curated** — Echo stores only *distilled* artifacts (summary, trigger, pattern, what-helped, next step), never raw transcripts or chatter
- **Verifiable** — every saved memory is a real Walrus blob with a public `blob_id` and Sui object id
- **Recall with reasons** — returning surfaces relevant memories, each with a plain-English "selected because…"
- **Identity-scoped** — memory is keyed to a Sui wallet or a guest id; users' reflections never mix
- **Voice-first** — a companion orb driven by a single state machine, with real speech where the browser supports it
- **Safe by design** — crisis content is routed to support and never stored; no clinical language anywhere

---

## The reflection flow

In order. The first three screens are first-visit only; a returning user lands on Mode selection.

| # | Screen | Purpose |
|---|--------|---------|
| 1 | **Welcome** | Brand hero, set the tone, enter. |
| 2 | **Onboarding** | What it is · the reflection loop · why it remembers. |
| 3 | **Consent / account** | Memory promises + identity choice (Guest vs Sui Wallet). |
| 4 | **Mode selection** | Pick a reflection mode (check-in · vent · understand · reset · weekly · continue). |
| 5 | **Session setup** | Feeling chips + intensity (1–10) + "remember this?" toggle. |
| 6 | **Voice reflection room** | The core — a voice-first session with the companion orb. |
| 7 | **Memory review** | Approve/skip the distilled memories before anything is saved. |
| 8 | **Debrief** | Structured reflection report + the Walrus proof card. |
| 9 | **Return & recall** | "Days later" — Echo recalls last time and what helped. |
| 10 | **Memory journey** | Timeline of sessions, intensity trend, recurring themes. |

Plus a persistent header (Home · My Journey · profile), a session stepper (Setup → Reflect → Memory → Debrief), themed **Profile / Account / Privacy / Help** pages, and a floating **"calm moment"** companion (guided breathing + affirmations).

---

## How Echo uses Mnemos

Echo is a **product layer**. It reuses the stable Mnemos memory substrate — Walrus storage, the semantic index, Sui-wallet identity, and consent-gated memory — and adds an emotional-reflection brain plus the UI. The engine is **adapted into this repo** (`lib/walrus`, `lib/embeddings`, `lib/llm`, `components/identity`); the Echo-specific brain lives in `lib/echo`.

| Echo concept | Implementation |
|---|---|
| `user_id` | Sui wallet address (connected) **or** a guest session id |
| `workspace_id` | `echo:<user_id>` — isolates each user's reflection journey |
| reflection turn | `POST /api/reflect` → warm, memory-aware reply with crisis-safety routing |
| memory proposal | `POST /api/memory/propose` → distills approved-only candidate artifacts from the transcript |
| commit (approved only) | `POST /api/memory/commit` → batched, parallel Walrus writes + verifiable proof |
| recall | `GET /api/recall` → relevant memories, each with a "selected because…" reason |
| journey | `GET /api/journey` → sessions, intensity trend, recurring themes, saved artifacts |

### Memory persistence model

```
commit (only the artifacts you approved)
  ├── write each artifact blob   → Walrus  (parallel, in one batch)
  ├── write a session summary    → Walrus  (drives the journey timeline)
  ├── update the vector index    → local file (fast cross-request recall)
  └── back up the index          → Walrus  (deferred, durable, via after())

recall / journey
  ├── read the index             → local mirror (instant)
  └── semantic match or rank      → "selected because…" reasons
```

Commit is **batched and parallel** so an N-memory save is one round-trip of latency, not N. The durable Walrus index write is deferred with `after()` so the user is never blocked on it — the local index mirror keeps recall instant.

---

## Memory rules

**Echo keeps** (only after you approve it in Memory review):
- An emotional **summary** of the session (1–2 lines — never the transcript)
- **Triggers** ("compressed deadlines + late-night work")
- **Patterns** ("all-or-nothing thinking: 'I'll never get it all done'")
- **What helped** ("a short walk gave relief")
- A **tiny next step**

**Echo never keeps:**
- Raw transcripts or emotional dumps
- Casual chatter (surfaced in the "left out" list, never saved)
- Crisis content (routed to safety first — see below)
- Duplicates (deduped against existing memory before writing)

---

## Voice interaction

The reflection room is **voice-first**, driven by a single state machine that powers the orb's aura, sound-rings, and equalizer:

| State | Orb | Caption |
|---|---|---|
| `idle` | calm lavender | "Tap to talk" + suggestion chips |
| `listening` | rose, receiving rings | live transcript |
| `thinking` | lavender pulse | "reflecting…" |
| `speaking` | warm peach, emitting rings | the reply (also spoken) |
| `paused` | dimmed | "take your time" |
| `saving` | sky | "weaving memory…" |

It uses the browser **Web Speech API** for real speech-to-text and spoken replies where supported (Chrome/Edge), and degrades cleanly to tap-to-talk, suggestion chips, and a typed input elsewhere. Entrance animations degrade to visible and honor `prefers-reduced-motion` (and the profile "Reduced motion" toggle).

---

## Safety

- **Baseline (quiet):** a single gentle note, shown once on Consent — no repeated "see a doctor" banners.
- **Everyday** sadness, stress, and overwhelm get **reflection, not redirection**.
- **Crisis signals** (self-harm, intent to harm others, abuse, or a request for diagnosis/treatment) route to a warm safety response that points to local emergency support and trusted people — and that content is **never stored as memory**.
- No diagnosis / treatment / therapy / clinical language anywhere. Echo's vocabulary is reflection, check-in, journaling, mood awareness, grounding, and a gentle next step.

---

## API reference

All routes are `nodejs` runtime.

### `POST /api/reflect`
One warm reflection turn. Routes crisis/medical signals to a safe response.
```json
{ "message": "string", "mode": "vent", "history": [], "recalled": [] }
→ { "reply": "string", "safety": "none" | "crisis" | "medical" }
```

### `POST /api/memory/propose`
Distills candidate memories from a finished transcript. Stores nothing.
```json
{ "turns": [...], "meta": { "feelings": [], "intensity": 7 }, "mode": "vent" }
→ { "summary", "theme", "artifacts": [...], "left_out" }
```

### `POST /api/memory/commit`
Writes **only the approved** artifacts to Walrus + a session summary. Returns each artifact's proof.
```json
{ "user_id", "session_id", "approved": [...], "summary", "theme", "meta" }
→ { "saved": [...], "proof": { "blob_id", "sui_object", "epoch", "cost", "certified" }, "total" }
```

### `GET /api/recall?user_id=&workspace_id=&context=`
Returns the memories Echo selected as relevant, each with a `reason`.

### `GET /api/journey?user_id=&workspace_id=`
Returns sessions, intensity trend, recurring themes, and saved artifacts.

---

## Quick start

**Prerequisites:** Node.js 18+, a free [Groq](https://console.groq.com) key. A free [Voyage AI](https://dashboard.voyageai.com) key is optional (enables semantic recall).

```bash
git clone https://github.com/i-anasop/echo.git
cd echo
npm install
cp .env.local.example .env.local
# Add your GROQ_API_KEY (and optionally VOYAGE_API_KEY)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Chrome or Edge** for real voice.

---

## Environment variables

| Variable | Required | Source |
|----------|----------|--------|
| `GROQ_API_KEY` | ✅ Yes — free | [console.groq.com](https://console.groq.com) |
| `VOYAGE_API_KEY` | Optional — semantic recall | [dashboard.voyageai.com](https://dashboard.voyageai.com) |
| `WALRUS_PUBLISHER_URL` | Defaults to testnet | — |
| `WALRUS_AGGREGATOR_URL` | Defaults to testnet | — |
| `GEMINI_API_KEY` | Optional fallback LLM | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `ANTHROPIC_API_KEY` | Optional fallback LLM | [console.anthropic.com](https://console.anthropic.com) |
| `ECHO_EMBED_ON_COMMIT` | Optional — embed inline at commit | `1` to enable |

**LLM priority order:** Groq → Gemini → Anthropic. Only one is needed.

---

## Project structure

```
echo/
├── app/
│   ├── api/
│   │   ├── reflect/        # One warm reflection turn (+ safety routing)
│   │   ├── memory/propose/ # Distill approved-only candidate memories
│   │   ├── memory/commit/  # Batched Walrus writes + proof
│   │   ├── recall/         # "Selected because…" recall
│   │   └── journey/        # Timeline, trend, themes
│   ├── icon.svg            # Echo favicon
│   ├── page.tsx            # Client router over the 14 screens
│   └── providers.tsx       # Sui dapp-kit + React Query
├── components/
│   ├── ui.tsx              # Primitives: Orb, Ic, LogoMark, Avatar, Btn…
│   ├── chrome.tsx          # AppBar · ProfileMenu · SessionProgress
│   ├── proof.tsx           # Walrus proof badge + modal
│   ├── CalmCorner.tsx      # Grounding/breathing companion widget
│   ├── identity.ts         # useIdentity (guest / Sui wallet)
│   └── screens/            # Welcome, Onboarding, Consent, Modes, Setup,
│                           #   Room, MemoryReview, Debrief, Recall, Timeline, Settings
├── lib/
│   ├── echo/               # The reflection brain
│   │   ├── reflection.ts   # Memory-aware reply + safety routing
│   │   ├── extractor.ts    # Approved-only artifact distillation
│   │   ├── recall.ts       # Recall + journey assembly
│   │   ├── safety.ts       # Crisis / medical detection + responses
│   │   ├── modes.ts        # Reflection modes
│   │   ├── artifacts.ts    # Artifact kinds → labels/icons
│   │   └── text.ts         # Lightweight theme tagging
│   ├── walrus/             # client.ts (store + proof) · memory.ts (index, batch)
│   ├── embeddings/         # voyage.ts · search.ts (cosine)
│   ├── llm/                # Provider factory (Groq · Gemini · Anthropic)
│   ├── store.ts            # Zustand app store (persisted prefs/profile)
│   ├── voice.ts            # Web Speech STT/TTS hook
│   └── workspace.ts        # Per-user workspace ids
└── types/index.ts          # Shared TypeScript interfaces
```

---

## Tech stack

| | Technology |
|-|-----------|
| Framework | Next.js 16, App Router (Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind v4 · Baloo 2 (display) · Nunito (body) |
| State | Zustand (persisted preferences) |
| Identity | Sui via `@mysten/dapp-kit` / `@mysten/sui` |
| Storage | Walrus (Sui decentralized blob storage) |
| Memory | Mnemos engine (adapted) · Voyage embeddings |
| LLM | Groq / Gemini / Anthropic (pluggable) |
| Voice | Web Speech API (STT + TTS) with fallbacks |

---

## Scripts

```bash
npm run dev        # Development server (Turbopack)
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

---

## Security

- API keys load server-side only — never exposed to the browser
- `.env.local` is gitignored; use `.env.local.example` as the setup template
- `data/` (local index + registry) is gitignored — rebuilt automatically
- Walrus blobs on testnet are public; only approved, distilled artifacts are ever stored — never raw transcripts

---

<div align="center">

Made by [Muhammad Anas](https://github.com/i-anasop) for Sui Overflow 2026 — Walrus Track

</div>
