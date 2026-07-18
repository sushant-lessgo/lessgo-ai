---
tier: full
tier-why: touches classify.ts + businessTypes registry (new `ambiguous` state) + serveGate + BriefSchema.copyEngine + onboarding entry + wizard hydrate + persona gate (/api/start) + 6 hi-fi onboarding screens. High blast radius, load-bearing routing surface.
---

# engineDecider — spec

## Problem / why
The onboarding entry assumes a single engine (`work`). Every incoming business is actually one of **5 engines** (work/trust/thing/place/quick-yes), but there's no routing layer — so the flow is broken: **O1 (18 July QA)** — user clicks "New site with AI" → lands on a one-liner box → types "I am a photographer in Amsterdam" → gets dropped into the **work** journey whose Step 1 asks for the **same one-liner again** → double-entry, and a non-work business would be mis-served as work. Worse failure mode: a portfolio-led studio built as a trust/process site — a **wrong *site*, not a wrong color** (the "cirkles" case). **This is a pre-beta blocker — beta cannot ship without it.**

## Goal
A single common first screen (the one-liner) that resolves an incoming business to an engine — asking a plain-language question **only when the engine is genuinely undetermined** — then routes into the right flow. Kills the double-entry, prevents wrong-site mis-serving, and retires the persona gate as a classifier. The engine is a **revisable belief** (inferred → confirmable → hard-committed at the plan gate), not a step-1 hard fork.

## Scope IN
- **D1 — one-liner entry = the single common first screen** for all businesses (replaces the persona gate's classifier job; one-liner captured **once**). AI names the business type (`EntrySignals`), code resolves the engine (`resolveEngine`) — the firewall stays.
- **Routing after classify (beta routing table):**
  | Resolves to | Behavior |
  |---|---|
  | **work** (clear) | D2/D3 confirm as appropriate → **work journey (existing Steps 2–6, unchanged)** |
  | **trust / thing** (clear) | route **directly to the existing generic wizard at step 2** (one-liner already captured — no re-ask) |
  | **ambiguous** (spans engines) or **unknown type** | **D4 buyer-decision question** → route per the user's pick |
  | **place / quick-yes** | **D5 demand board** (honest "not built — we'll call you" + demand tag; **never** written to `brief.copyEngine`) |
- **The 6 decider screens (D1–D6)** per the designer handoff (`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Engine Decider/`): D1 entry, D2 known/don't-ask, D3 almost-sure one-tap confirm, D4 buyer-decision question (the key screen), D5 demand board, D6 engine-set hand-off. Recreate in-codebase (React/Next, existing components/shell/rail) — **do not ship the annotated HTML**.
- **Registry `ambiguous` state** — each `businessTypes` entry declares **either** `{ committed engine }` **or** `{ engine-ambiguous, candidate engines, prior }`. Unambiguous → lookup, skip the question; ambiguous-known **or** unknown → fire D4. One question serves both.
- **"HOW YOUR SITE WINS" rail field** (the engine, as a revisable belief) — resolving spinner → set card → amber when ambiguous; "change how buyers decide" reopens D4 any time before the plan gate.
- **Persona gate (`/api/start`) split:** classifier job (product-vs-service persona) **retires**; the access-gate job **relocates to the serve gate on the confirmed Brief** (`serveable = type entry ∧ engine live ∧ ≥1 template fits`), unserveable → the D5 demand board, never a cold upfront waitlist.
- **Engine hard-commit at the plan gate** (belief-lifecycle: inferred here → revised in ingestion → committed at plan gate).
- **Journey-ready hand-off seam** — the non-work → "existing wizard step 2" bridge is built on the **same seam work-onboarding uses** (`loadStep?`/`questions()`), so when the thing/trust journeys land (separate pre-beta specs) the decider re-points to them with near-zero change.
- **Copy = plain user language.** Convert the designer's technical placeholder copy (labels like "HOW YOUR SITE WINS", engine tags "WORK/TRUST/THING", "portfolio is the argument") into copy a non-technical user understands; keep the already-plain buyer-decision lines ("They see my work and love it"). **Product name is always "Lessgo AI", never "Lessgo"** (`memory/product_name_lessgo_ai`).

## Scope OUT (non-goals)
- **thing/trust bespoke journeys** — separate pre-beta specs; for now clear non-work → existing generic wizard step 2. (Design the seam to accept them, don't build them here.)
- **place / quick-yes engines** — not built; D5 demand board is the honest handling, nothing more.
- **Ingestion-overturn automation** — the belief *can* be reopened via the rail ("change how buyers decide") and the design promises ingestion can revise; auto re-propose on contradicting uploads is deferred (see open Q).
- **Full retirement of the generic wizard** — it stays as the non-work bridge until the thing/trust journeys replace it.
- Writing `place`/`quick-yes` to `brief.copyEngine` (schema enum stays `{thing,trust,work}`; they resolve + route to demand only).

## Constraints
- **Firewall intact:** AI only *signals* (business-type guess + confidence + tiebreaker); **code resolves** the engine. Never a silent AI verdict, never a blocking confirm — show-back + one-tap correct.
- **"When we know, we don't ask."** Only stays better-than-Wix if we genuinely don't ask on the ~80% clear cases. One tap for the ambiguous ~20%.
- **Revisable belief, not a hard fork** — provisional engine only picks which ingestion/questions to show; hard-commit at the plan gate.
- **`ambiguous` ripples:** `resolveEngine` returns a single engine today; downstream (`serveGate`, wizard hydrate, `BriefSchema.copyEngine`, voice derivation) assume a resolved engine — they must handle "not-yet-resolved → ask."
- **Design = visual input, flow = founder-dictated** (ownership follows functionality). Hi-fi: match colors/type/spacing using existing codebase components (buttons, cards, onboarding shell, "What we understood" rail), not by copying the HTML.
- **This is beta scope on `main`** (pre-beta blocker), not `next` — coordinate the release re-plan (rejoins beta, re-QA) separately.
- Full-tier /feature pipeline (scout → plan → plan-review → per-phase implement + impl-review + gates).

## References
- **Designer handoff (visual source of truth):** `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Engine Decider/` — `README.md` (screens D1–D6, state model, interactions, tokens, code-pointers) + `Lessgo Engine Decider.dc.html` (annotated reference — extract screen interiors, do NOT ship).
- **Product decision doc:** `docs/tracks/engineDecider.md` (D1–D4 decisions, the three cracks, `ambiguous` rationale). Peer: `docs/architecture/copyEngines.md`.
- **Current code to rework:** `src/modules/brief/classify.ts` (`resolveEngine`, `EntrySignals`, `EntryFacts`, `applyBusinessTypeCorrection`, `LOW_CONFIDENCE_THRESHOLD`) · `src/modules/businessTypes/config.ts` (registry, add `ambiguous`) · `src/modules/brief/serveGate.ts` + `serveMatrix.ts` (D5 path) · `src/app/onboarding/[token]/components/EntryInputStep.tsx` + `src/components/onboarding/journey/JourneyEntryStep.tsx` (entry) · `src/lib/schemas/entryClassify.schema.ts` · `/api/brief/confirm` · `/api/start` (persona gate split).
- **Seam to reuse for the hand-off:** work-onboarding's `loadStep?` / `questions()` journey seam (`engines/journey/…`) — the founder-signed extension mechanism; do not widen it (see `memory/feedback_shared_contract_coordination`).
- **State model** (verbatim from handoff): `oneLiner`, `entrySignals`, `resolvedEngine`, `engineStatus` (`resolving|known|almost-sure|ambiguous|confirmed`), `engineCommitted`, `demandTag`, `EntryFacts`.

## Open exploration questions (feeds scout/plan)
- **Confidence gate (Q3):** keep the AI `0.6` self-report driving D2-vs-D3-vs-D4, or replace with a deterministic rule (is the guess a known-unambiguous type? y/n) per E3 doctrine? The design references a "confidence bar" but E3 leans deterministic — resolve at plan.
- **`ambiguous` registry shape:** `{ prior + candidates[] }` (design says yes) — confirm no consumer needs candidates-only.
- **Is the existing generic wizard actually functional for thing/trust from step 2 today** (given O1 shows the current entry is broken)? What does "step 2" concretely mean in `WizardShell`?
- **Ingestion overturn (Q4):** auto re-propose engine on contradicting upload, or surface as a rail nudge the user confirms? (Design leaves open.)
- Where the persona-gate access check moves exactly, and what the pilot allowlist → serve-gate migration touches.

## Candidate human gates
- **Copy sign-off** — the humanized user-facing copy for all 6 screens (founder taste; the whole point is "what users understand").
- **Persona-gate / `/api/start` change** — retiring the classifier + relocating the access gate touches the first-touch access path (allowlist/waitlist); verify no one who should be served is turned away, and every rejection logs a demand signal.
- **`ambiguous` + `resolveEngine` change** — regression on the existing work classification (Kundius must still resolve `work` and reach the journey with no double-entry).
- **Wrong-site check** — the cirkles case (branding studio) must reach D4 and be routable to work OR trust, never silently forced.

## Acceptance criteria
- [ ] One-liner is entered **once** (D1); the work journey no longer re-asks it — **O1 is dead**.
- [ ] A photographer one-liner resolves to `work`, shows D2 "we know", and continues into the existing work journey.
- [ ] A clear SaaS/product one-liner resolves to `thing` and routes directly into the existing generic wizard at step 2 (no decider babysitting, no re-ask).
- [ ] An ambiguous type (branding studio / agency / manufacturer) fires **D4**, pre-selects the prior, shows all 5 buyer-decision options (place/quick-yes marked "SOON"), and routes per pick.
- [ ] Picking `place`/`quick-yes` shows the **D5 demand board**, captures email, logs a demand tag, and does **not** write `brief.copyEngine`.
- [ ] The "HOW YOUR SITE WINS" rail field renders resolving → set → amber-ambiguous, and "change how buyers decide" reopens D4 before the plan gate.
- [ ] Persona gate no longer asks product-vs-service; access gating happens on the confirmed Brief (serve gate), unserveable → demand board.
- [ ] All 6 screens match the hi-fi design using existing components; **all user-facing copy is plain-language** (no engine jargon) and says "Lessgo AI".
- [ ] Green gates: `tsc` · `test:run` · `build` · `lint`; existing work classification + journey regression-clean.

## Pilot / smallest slice
Not sliceable below "the decider works end-to-end" for beta — but the **critical path is the work lane** (D1 → D2/D3 → D6 → existing work journey), which is the Kundius demo and the O1 fix. Suggested build order for the planner: (1) D1 unified entry + carry-through (kills O1) → (2) `resolveEngine`/registry `ambiguous` + rail engine field → (3) routing table incl. D4 ambiguous + D5 demand board → (4) persona-gate split + serve-gate relocation → (5) copy humanization pass + design polish. **Decision gate:** founder verifies, on the QA preview, the four routing outcomes (work / clear-non-work / ambiguous→D4 / place→D5) end-to-end, plus copy sign-off, before the beta push.
