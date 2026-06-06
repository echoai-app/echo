# Echo — a calm, voice-first emotional reflection companion

> Echo helps you think out loud, understand your patterns, and take one small next step —
> and, unlike a normal chatbot, it **remembers what matters** across sessions.
> Memory is powered by **Mnemos**, persisted verifiably on **Walrus**, keyed to your **Sui** identity.

Echo is the **product layer**. [Mnemos](https://github.com/i-anasop/Mnemos) is the **memory engine**. This repo
reuses Mnemos' stable memory substrate (Walrus storage, semantic index, Sui-wallet identity,
consent-gated memory) and adds an emotional-reflection brain and a warm, polished UI on top.

Echo is an **evidence-informed reflection companion, not medical care.** It does not diagnose,
treat, or replace professional help. See [Safety](#safety).

---

## The magic moment

1. You reflect out loud with a calm companion orb (voice-first).
2. Echo distills the meaningful threads — your **trigger**, the **pattern**, **what helped**, a **tiny next step**.
3. You **approve** which memories to keep. Only those are written to **Walrus** (you see the blob proof).
4. Days later you return, and Echo says: *"Last time, deadlines were keeping you up — and a walk helped. How have things been since?"* — each recalled memory shows **why** it was selected.
5. Your **journey** shows intensity easing over time, recurring themes, and every saved artifact — all recalled from Walrus.

---

## Screens (the full flow)

`Welcome → Onboarding → Consent/account → Mode select → Session setup → Voice reflection room → Memory review → Debrief (+ Walrus proof) → Return & recall → Memory journey`

A floating **demo map** (bottom-left ⌕) jumps to any screen for walking the flow.

---

## How Echo uses Mnemos

| Echo concept | Implementation |
|---|---|
| `user_id` | Sui wallet address (connected) **or** a guest session id (`useIdentity`) |
| `workspace_id` | `echo:<user_id>` — isolates each user's reflection journey |
| reflection turn | `POST /api/reflect` → warm, memory-aware LLM reply (with crisis-safety routing) |
| memory proposal | `POST /api/memory/propose` → distills approved-only candidate artifacts from the transcript |
| commit (approved only) | `POST /api/memory/commit` → batched, parallel **Walrus** writes + verifiable proof |
| recall | `GET /api/recall` → semantic (Voyage) or kind/importance ranking, each with a "selected because…" reason |
| journey | `GET /api/journey` → sessions, intensity trend, recurring themes, saved artifacts |

The reused engine substrate lives under `lib/` (`walrus/`, `embeddings/`, `llm/`). The Echo-specific
brain lives under `lib/echo/` (`reflection`, `extractor`, `recall`, `safety`, `modes`, `artifacts`, `text`).

### Memory rules
Echo stores **only user-approved, distilled artifacts** — emotional summary, trigger, pattern,
what-helped, tiny next step. It never stores raw transcripts, casual chatter (shown in the
"left out" list), duplicates, or crisis content (routed to safety first).

---

## Walrus proof (real, with graceful fallback)
Every approved memory is a real blob on Walrus testnet. The Debrief proof card shows the live
`blob_id`, `sui_object`, epoch/expiry, size, and cost (WAL). If testnet is slow, the commit falls
back to a local "syncing" proof so the demo never blocks. Index writes are mirrored locally (fast
cross-request recall) and backed up to Walrus in the background.

---

## Voice (hybrid)
The reflection room is voice-first with a single state machine
(`idle · listening · thinking · speaking · paused · saving`) driving the orb's aura, sound-rings,
and equalizer. It uses the browser **Web Speech API** for real speech-to-text and spoken replies
where supported (Chrome/Edge), and degrades cleanly to tap-to-talk, suggestion chips, and typed
input elsewhere. Honors `prefers-reduced-motion` and the profile "Reduced motion" toggle.

---

## Safety
- Single gentle note, shown once on Consent — no repeated "see a doctor" banners.
- Everyday sadness/stress/overwhelm get **reflection, not redirection**.
- Genuine crisis or self-harm signals route to a warm safety response (local emergency / a trusted
  person) and are **not** stored as memory. Requests for diagnosis/treatment are gently redirected.
- No diagnosis/treatment/therapy/clinical language anywhere.

---

## Run locally

```bash
npm install
cp .env.local.example .env.local   # add at least one LLM key (Groq is free)
npm run dev                         # http://localhost:3000
```

Environment (`.env.local`):
- **LLM** (one required): `GROQ_API_KEY` (free, recommended) · `GEMINI_API_KEY` · `ANTHROPIC_API_KEY`
- **Embeddings** (optional): `VOYAGE_API_KEY` — enables semantic recall; without it, recall ranks by kind/importance/recency.
- **Walrus** (testnet defaults provided): `WALRUS_PUBLISHER_URL`, `WALRUS_AGGREGATOR_URL`
- Optional: `ECHO_EMBED_ON_COMMIT=1` to embed inline at commit time (slower under Voyage's free 3-req/min limit).

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run lint
```

---

## Tech
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · `@mysten/dapp-kit` /
`@mysten/sui` / `@mysten/walrus` · pluggable LLM (Groq / Gemini / Anthropic) · Voyage embeddings.

Design system ported faithfully from the Echo design handoff: warm pastel · thick ink outlines ·
sticker shadows · the companion orb. Built on the Mnemos engine for **Sui Overflow 2026 (Walrus track)**.
