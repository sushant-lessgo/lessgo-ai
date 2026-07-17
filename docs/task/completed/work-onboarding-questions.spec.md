---
tier: standard
tier-why: onboarding STEP-03 UI + deterministic gating logic + writes to the frozen work facts contract + rail updates. No AI, no schema, no editor-store/publish/billing surface. Shares the onboarding store/rail with in-flight E2 → one impl-review over the diff. Auto-escalate only if scout finds shared-store risk.
---

# work-onboarding-questions — spec

E3 of the work vertical · STEP 03 of onboarding · Work engine (pilot: Kundius). Builds on E1 (shell/rail) + reads the facts E2 ingestion + upstream understanding produce.

## Problem / why
E1 shipped STEP 03 as a thin placeholder on generation defaults. But a work site that converts needs a handful of facts only the person can give — price, story angle, who they serve — and the copy engine can't invent them. The trap is asking too much: a wizard that interrogates burns trust. The heart of this step is **"never ask twice"** — by STEP 03 most facts are already worked out (from the one-liner's understanding + E2's grouped work), so the person confirms what we know and answers only the 2–6 gaps, all in taps. Without E3, the work site generates on generic defaults instead of their real price/story/audience.

## Goal
STEP 03 collects the **8-slot fact list** with a **deterministic, no-AI gating**: for each fact, if we already know it → show it pre-filled (tap to correct); almost sure → one-tap confirm; don't know → ask, as chips. A person sees only the gaps (five questions is the ceiling), every answer updates the "What we understood" rail and writes to the frozen work facts contract the copy engine reads. Questions are worded per profession (static templates) — no AI hop in this step.

## Scope OUT (non-goals)
- **AI wording personalization** ((b) — an AI touch to phrase questions to their specific work). Deferred post-beta. E3 adds **zero new AI calls** — pre-fill understanding is upstream (`v2/understand`/entry classification), gating + wording are code.
- **Re-running fact pre-fill.** E3 **reads** the facts upstream produced (one-liner understanding + E2 groups); it does not re-derive them with AI.
- **The site-plan gate (E4)** — STEP 04, separate; consumes E3's answers + E2's groups.
- **The open-chat exception handler** ("something wrong? tell us") — that lives at the plan step (E4), not here.
- **Story-seller case-study depth** (client+problem+result full treatment) — v1 centers category sellers (photographer); carry only what the frozen contract already holds.
- **Other 4 engines' STEP 03** (thing/trust/place/quick-yes) — E3 is the Work engine's depth; they snap into the same seam later.
- **Editor-side editing** of these facts — onboarding only.

## Constraints
- **Build on the E1 per-engine step seam** — STEP 03 is the Work engine's implementation behind E1's pluggable interface; don't fork the shell. Token-scoped like existing onboarding.
- **Deterministic gating, no AI:** read the facts store + a confidence signal per slot → know (pre-fill, tap-correct) / almost-sure (one-tap confirm, choices) / don't-know (ask as chips; free text last resort). Which questions show is **code**, driven by what's already known.
- **Static profession-appropriate wording** ((a)) — templated per profession ("galleries" for photographers, "projects" for designers), no AI phrasing hop.
- **Five-question ceiling** — never show more than 5; someone with rich upstream signals may see 2. Never replay a one-liner back for confirmation; never ask an irrelevant question (a photographer "what do you sell?").
- **The 8 slots** (from `workEndtoEnd.md` §3): name/where/reach · what-you-sell (work groups, from E2) · **price (required)** · **new-vs-established (a story BRANCH: established→proof-led, new→fresh-eyes, never fake proof)** · dream client · what clients praise · contact method · **site language(s) (required; NL/EN for Kundius)**.
- **Answers write to the frozen work facts contract** (work-contract's 8-slot facts schema) the copy engine already reads — no shape change, no new schema. Each answer updates the **rail** (E1 rail contract) progressively + correctably.
- **Coordinate with in-flight E2** — E3 and E2 both read/write the shared onboarding store + rail (E2 is re-planning). Build against the **frozen facts contract + fixtures**; expect a merge reconciliation on the shared store, and the "never ask twice" behavior is verified end-to-end only once **both** land (integration check).
- **No new AI call, no new credit cost.**
- No CI gate — `tsc` + `test:run` + build + lint green; plus a live STEP-01→03 walk on a work project.

## References
- `docs/tracks/workEndtoEnd.md` §3 "A few questions only they can answer" — the acceptance-criteria source: 8 slots, the know/almost/don't-know gating, five-question ceiling, category-vs-story sellers, required price+language, the new-vs-established branch.
- `docs/task/work-onboarding-shell.spec.md` — the E1 per-engine step seam + rail contract E3 plugs into (the STEP-03 placeholder it replaces).
- `docs/task/work-onboarding-ingestion.spec.md` (E2) — the sibling step; shared onboarding store/rail + the `groups` fact E3's slot 2 reads.
- work-contract's **8-slot work facts schema** — the frozen contract E3 writes to (no reshape).
- `v2/understand` / entry classification — where the upstream pre-fill facts come from (E3 reads, doesn't re-run).
- The work copy engine (`slimStrategy`/`copyPrompt`) — the downstream consumer of these facts (esp. the new-vs-established branch + price position).

## Open exploration questions (feeds scout)
- What **confidence signal** exists per fact today (how does E3 know "confidently known" vs "almost sure" vs "unknown")? Is it on the facts store, or must a per-slot confidence be derived?
- Exactly which of the 8 slots does upstream (`v2/understand` + E2) already populate for a work project, so E3 shows only real gaps?
- Where does the **new-vs-established branch** get consumed downstream — does the copy engine already read an `establishment` fact (so E3 just sets it), or does the branch need wiring?
- The E1 rail contract — how does a step push progressive fact updates into the rail?
- Profession→wording map — does a profession-appropriate label layer already exist (from work-contract buyer-words), or is it new?
- Shared-store shape with E2 — what does E2 add to the onboarding store, to anticipate the reconciliation?

## Candidate human gates
- **Live STEP 01→03 walk** on a work project (Kundius fixture): sees only real gaps, ≤5 questions, taps not typing, rail updates, required price+language enforced. Founder eyeball on question relevance ("never ask twice" actually holds).
- **The new-vs-established branch** — confirm it routes the story correctly (proof-led vs fresh-eyes) once wired to the copy engine.

## Acceptance criteria
- [ ] STEP 03 replaces E1's placeholder behind the per-engine seam (shell unforked), Work engine.
- [ ] Deterministic gating: known facts show pre-filled (tap-correct), almost-sure as one-tap confirm, unknown as chips — **which** questions show is code from the facts store; **no AI call added**.
- [ ] A person sees **≤5** questions; a rich-signal project sees fewer; no irrelevant/already-known question appears.
- [ ] **Price + language are required** (can't proceed without); other slots skippable when known/confirmed.
- [ ] The **new-vs-established** answer is captured and set on the facts contract (branches the story downstream).
- [ ] Every answer writes to the **frozen work facts contract** (no reshape) and updates the **rail** progressively + correctably.
- [ ] Wording is profession-appropriate (static templates); zero new AI/credit surface.
- [ ] `tsc` + `test:run` + build + lint green (unit-tested against fixture facts; E2 integration verified when both land).

## Pilot / smallest slice
Single self-contained step. **Decision gate = the live STEP 01→03 walk on the Kundius fixture:** she sees ~2–3 real questions (price / new-vs-established / dream client), all taps, rail updates, and the generated copy downstream reflects her price + story branch. If she sees questions we should already know, the gating (not the wording) is wrong — fix that first. E4 (site-plan) consumes this; AI wording-personalization (b) is the post-beta upgrade.
