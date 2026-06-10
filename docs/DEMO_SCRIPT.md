# Echo — Demo Video Script (≤ 5 min, target 4:00)

> Shot-by-shot. Record at 1920×1080, Chrome, **two browser profiles ready** (main + a second/incognito-like profile with your Sui wallet importable). Do one full dry run first so Walrus/Sui latency doesn't surprise you. Speak slowly — the script is ~520 words ≈ 3:40 at calm pace.

## Prep (before recording)
- [ ] Wallet on **testnet** with gas; already onboarded once so you know the flow
- [ ] Tabs open: `echoai-app.vercel.app` (fresh profile), `echoai-app.vercel.app/inspect`, Suiscan, Walruscan
- [ ] Second browser profile signed out / fresh (for the recovery moment)
- [ ] Terminal with the curl from README §"Verify it with curl" pasted, ready to run
- [ ] Mic check; close notifications

---

## 0:00–0:25 · The hook (talking over the landing page)

> "AI agents have a memory problem. Everything they learn about you lives in one company's database — and disappears when the session ends, or when the app does. I'm Anas, and this is **Echo**: an AI reflection companion whose memory is **user-owned, verifiable, and portable** — built on **Walrus and Sui**."

*Action: slow scroll on the landing page, click **Begin reflecting**.*

## 0:25–1:15 · The product (3D room)

> "Echo is a calm space to think out loud. You're seated in a real 3D room with a companion — it listens, reflects, and asks one gentle question at a time."

*Action: drag to look around the room once (show depth + companion). Type or speak 2 short lines (e.g. "work deadlines keep piling up and I barely sleep" → reply → "an evening walk helped a little"). Show the companion talking + the forming-memory chips.*

> "Echo is for reflection and self-awareness — not therapy. And it never saves anything without you."

## 1:15–2:00 · Consent → Walrus → wallet-signed Sui pointer

*Action: hit **End** → Memory review appears.*

> "When a session ends, Echo proposes distilled memories — never transcripts. **I choose what's kept.**"

*Action: keep 2–3, click **Save to Walrus** → wallet popup appears → approve.*

> "Each approved memory becomes a **real Walrus blob**. Then my wallet signs a Sui transaction pointing my on-chain **MemoryPointer** at the new memory index. The chain of custody is mine."

*Action: in Debrief, open the **proof card**. Hover the chain: memory blob → index blob → MemoryPointer. Click the Walruscan link (show the blob exists), back; point at the Sui tx digest.*

## 2:00–2:50 · The wow: recovery on a fresh browser

*Action: switch to the second browser profile (visibly fresh). Open the app → connect the same wallet → Return & recall.*

> "Now the real test. A completely fresh browser — no local data, nothing. I connect my wallet… and Echo finds my MemoryPointer on Sui, pulls the index from Walrus, and **remembers me** — with reasons for every memory it recalled."

*Action: show the "restored from Walrus · via your Sui pointer" badge + the recalled memories with their 'selected because' lines.*

## 2:50–3:30 · It's bigger than Echo: Inspector + Insight agent

*Action: open `/inspect`, paste the wallet address, let the chain light up.*

> "Memory this open should be inspectable. The **Memory Inspector** reads the whole chain — Sui RPC, pointer, Walrus index, every artifact — **entirely in the browser. No Echo backend.** If our servers vanished tomorrow, this page still works."

*Action: quick flash of the terminal: run the curl, show JSON entries. Then: My Journey → **Generate insight report**.*

> "And because the memory layer is shared, **a second agent** — the Insight agent — reads the same Walrus memory and writes its report **back as a durable artifact**. Multi-agent workflows on one verifiable memory layer."

*Action: show the report + "report stored on Walrus" chip.*

## 3:30–4:00 · Close

*Action: back to the landing page or the README architecture diagram.*

> "Echo runs on **Mnemos** — our agent-memory engine on Walrus and Sui. Echo proves it with something deeply human: being remembered. The same layer can back any agent. Talk today. Understand tomorrow. **Echo** — built for the Walrus track, live on testnet, link below."

---

## Don'ts
- Don't claim therapy/diagnosis/crisis support — ever.
- Don't skip the wallet-popup moment (it's the proof the pointer is user-signed).
- Don't fake or pre-cut the recovery — judges can smell it; the real latency (a few seconds) reads as authentic.
- If Walrus testnet is slow on camera, say so plainly ("testnet finalizing") — honesty reads better than a cut.
