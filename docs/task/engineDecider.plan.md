# engineDecider — implementation plan

Spec: `docs/task/engineDecider.spec.md` · Scout: `docs/task/engineDecider.scout.md` · Design (UNTRACKED, main repo only): `C:\Users\susha\lessgo-ai\docs\Design\Lessgo AI UI redesign\design_handoff_lessgo_app\Engine Decider\README.md`
Branch: `feature/engineDecider` (worktree `C:\Users\susha\lessgo-ai\.claude\worktrees\engineDecider`). Beta scope on `main`. Product name: **Lessgo AI**.

## Overview

Build the Engine Decider: the one-liner entry (D1) resolves every incoming business to one of 5 copy engines, asking a plain-language buyer-decision question (D4) ONLY when the engine is genuinely undetermined, then routes — work → existing journey (D2/D3 → D6), clear thing/trust → generic wizard at the `understanding` slot, place/quick-yes → D5 demand board. Kills O1 double-entry (JourneyEntryStep re-asking the one-liner), adds the `ambiguous` registry state + "HOW YOUR SITE WINS" rail field, and finishes the already-90%-done persona-gate retirement. Firewall in every phase: AI only signals (`EntrySignals`); code resolves the engine; never a blocking confirm.

## Progress log

- phase 1 engine-resolution core (types + registry `ambiguous` + resolveEngine): done (commit 45d9c93d, impl-review 1 loop → ship; founder gate: ambiguous set = {designer, agency, manufacturer} — manufacturer flipped per founder; deviations: confidence clamp post-parse not Zod, workContract set incl. agency)
- phase 2 decider state machine + D1 entry + rail engine field: done (commit 1c5a0eea, impl-review 1 loop → ship; carry to P3: wire a DeciderState reader, verify entrySignals confidence source clamped-vs-raw)
- phase 3 work lane D2/D3/D6 + journey handoff (O1 kill): done (commit <pending>, impl-review 1 loop → ship; STEP0 photographer serves via atelier; JourneyEntryStep DELETED, handoff → D6Handoff; O1 e2e assertion verified real; FOUNDER GATE OWED: dev "photographer in Amsterdam" no-double-entry)
- phase 4 D4 buyer-decision question + routing table + wizard step-2 entry: pending
- phase 5 D5 demand board + serve-gate demand wiring: pending
- phase 6 /api/start residual cleanup + persona-gate verification: pending
- phase 7 copy humanization + hi-fi polish + full e2e + gates: pending

## Design rulings (implementer follows these)

### R1 — Q3 confidence gate: DETERMINISTIC resolution; confidence modulates presentation only
**Ruled: deterministic.** Which screen fires is decided by **registry state**, never by AI confidence:

| Deterministic condition | engineStatus | Screen |
|---|---|---|
| `businessTypeGuess` ∈ registry, `engineState:'committed'`, confidence ≥ 0.6 | `known` | D2 (zero questions, auto-continue) |
| `businessTypeGuess` ∈ registry, `engineState:'committed'`, confidence < 0.6 | `almost-sure` | D3 (one-tap confirm of the SAME lookup engine) |
| `businessTypeGuess` ∈ registry, `engineState:'ambiguous'` | `ambiguous` | D4 (prior pre-selected) |
| `businessTypeGuess` null / not in registry | `ambiguous` | D4 (prior = tiebreaker result if any, else none) |

Rationale: matches E3 doctrine + the new registry state; the AI self-report number (unclamped, un-calibrated) can never change WHICH engine resolves or WHETHER D4 fires — a bogus confidence costs at most one extra tap (D3 instead of D2), never a wrong engine. D3 needs *some* trigger and this is the only safe job left for confidence. Also: add Zod `.min(0).max(1)` clamp on `businessTypeConfidence` in `entryClassify.schema.ts` (missing today). The design's "confidence bar" is pure visual. `LOW_CONFIDENCE_THRESHOLD` stays at 0.6, now consumed by the D2/D3 presentation branch (its current single consumer `ConfirmBriefStep.tsx:36` behavior preserved for the non-decider confirm path).

### R2 — `ambiguous` registry shape + where the engine union type lives
Discriminated union on `BusinessTypeEntry` (`src/modules/businessTypes/config.ts`):

```ts
// shared fields unchanged (requiredCapabilities, defaultStyle, wizardFields, …)
type EngineBinding =
  | { engineState: 'committed'; copyEngine: CopyEngine }
  | { engineState: 'ambiguous'; candidateEngines: ResolvedEngine[]; priorEngine: ResolvedEngine };
```

**Import-cycle resolution:** `ResolvedEngine` currently lives in `classify.ts` (which imports `config.ts`) — config importing classify would cycle, and config is deliberately import-light (header L14-17). **Move the engine union to `src/types/brief.ts`** (already the canonical home of the closed-3 `copyEngines` enum at L16): add `export const resolvedEngines = [...copyEngines, 'place', 'quick-yes'] as const; export type ResolvedEngine = ...`. `classify.ts` re-exports `ResolvedEngine` for back-compat so existing importers don't churn. `config.ts` imports only from `src/types/brief.ts` (it already does for `CopyEngine`).

`resolveEngine` return becomes a union (single-engine collapse at classify.ts:133-147 is the #1 change):

```ts
type EngineResolution =
  | { state: 'resolved'; engine: ResolvedEngine; source: 'lookup' | 'tiebreaker' }
  | { state: 'ask'; candidates: ResolvedEngine[]; prior: ResolvedEngine | null;
      reason: 'ambiguous-type' | 'unknown-type' };
```

Unknown/`'none'` no longer silently collapses to `'thing'` (classify.ts:144) — it returns `ask` with `prior` = tiebreaker ladder result (ladder retained as prior-derivation, not verdict). `EntryFacts` gains `engineStatus: 'resolving'|'known'|'almost-sure'|'ambiguous'|'confirmed'` and `resolvedEngine` becomes nullable (null only while `ambiguous` pre-pick).

**Null-engine invariant + serve-gate tag (ruled):** the decider flow guarantees a pick has happened by `/api/brief/confirm` time (D4 cannot be skipped past), so a null `resolvedEngine` reaching `decideServe` is a defect, not a state. Belt-and-braces: `decideServe` treats null as not-bridgeable (manual) AND emits a dedicated **`engine-unresolved`** tag — never a misleading `rungC:*`/`rungE:*` misfile. Test-asserted in Phase 1.

**"Work businessTypes" set — semantic redefinition (load-bearing):** once `designer` flips to `ambiguous`, "the work-engine businessTypes" can no longer mean `copyEngine === 'work'`. New definition used by tests/vocabulary coverage: **committed-`'work'` entries ∪ ambiguous entries whose `candidateEngines` include `'work'`**. This is a semantic decision, not a mechanical narrow — an ambiguous `designer` can still be PICKED into the work engine at D4, so it MUST keep its `professionWording`/`dreamClientChips` coverage. Expected set stays `{designer, photographer, writer}` (+ `agency` remains covered via the `WorkProfession` list). A helper (e.g. `workCandidateBusinessKeys()` exported from `config.ts` or derived inline in tests) encodes this once.

**Initial ambiguous entries (product call, confirm at Gate C):** `designer` → `{candidateEngines:['work','trust'], priorEngine:'work'}` (the cirkles case); `agency` → `{['trust','work'], prior:'trust'}`; `manufacturer` → `{['thing','trust'], prior:'thing'}`. Remaining 6 (saas/app→thing, consultant/coach→trust, writer/photographer→work) stay committed — preserves Kundius→work zero-question path. **⚠ manufacturer trade-off (explicit, not silent):** today manufacturer is a clear committed `thing` (vestria pilot, tailored-trade voiceHint) with a ZERO-question path; flipping it to `ambiguous` forces D4 on every manufacturer — in tension with "when we know, we don't ask." This is a founder call at the Phase 1 gate (see Unresolved Q1); default if undecided: keep manufacturer **committed `thing`** and ship only designer+agency ambiguous.

### R3 — Fonts & icons
Do NOT add Google Fonts runtime deps. Icons: map Material Symbols names → **lucide-react** (already used across onboarding). JetBrains Mono is self-hosted (eyebrows/tags OK). **Onest is not in the repo** — use the existing app-chrome font stack from the ui-foundation tokens for UI text; per the app-chrome font-bleed landmine, if the founder wants true Onest it must be self-hosted under a DISTINCT family name scoped to app chrome (never via root layout) — flagged as unresolved question, default = existing app font.

### R4 — Component placement
New decider screens live in `src/app/onboarding/[token]/components/decider/` (D1–D6 as separate components + a small pure `deciderMachine.ts` for the status transitions). Rail engine field extends `UnderstoodRail.tsx` (journey rail is the shared shell). Decider state stays in the existing LOCAL step machine of `EntryOnboardingPage` (React state, no new store) — consistent with page.tsx today. Seam discipline: the D6→journey handoff uses the existing `JourneyEngineSeam` / `loadJourneySeam(engine)` unchanged — **do not widen the seam contract** (`engines/types.ts` is founder-signed).

---

## Phase 1 — Engine-resolution core (logic only, no UI)

The type/registry/resolver rework everything else stands on. No screen changes; existing entry flow keeps working (committed types behave identically).

**Files touched**
- `src/types/brief.ts` — add `resolvedEngines` const + `ResolvedEngine` type (R2)
- `src/modules/businessTypes/config.ts` — `EngineBinding` discriminated union; flip designer/agency (+ manufacturer pending Gate C) to `ambiguous`; export the work-candidate helper (R2 semantic redefinition). Also fix the now-stale comments at `:247-249` and `:274-277` ("no shipped template declares gallery… serve gate rejects photographer") — atelier DOES declare `gallery` on the work engine (`fit.test.ts:148`); comment-only correction.
- `src/modules/businessTypes/config.test.ts` — union invariants (committed entries have valid engine; ambiguous entries: prior ∈ candidates, candidates ⊆ resolvedEngines, length ≥ 2)
- `src/modules/businessTypes/pipelineGuards.test.ts` — update "every entry has copyEngine" asserts to union-aware
- `src/modules/engines/workContract.test.ts` — **semantic rewrite, not mechanical** (`:141-149`): `businessTypes[k].copyEngine === 'work'` won't type-check against the union AND would drop `designer` from the covered set. Rewrite the "work businessTypes" derivation per R2: **committed `'work'` ∪ ambiguous with `'work'` ∈ `candidateEngines`** — expected sorted set stays `['designer','photographer','writer']`, and every member (a possible D4 work-pick) must still map to a `professionWording` row.
- `src/lib/schemas/extraction/extraction.test.ts` — union-aware rewrite of `:86-93` (iterates `businessTypeKeys` reading `.copyEngine` → compile break). Runtime `extractionForBusinessType` is SAFE (keys off the shared `extractionSchemaKey` field, unchanged) — only the test's engine-derivation changes: for committed entries assert `extractionSchemaKey` aligns with `copyEngine` as today; for ambiguous entries assert it aligns with `priorEngine` (the extraction vocabulary the entry runs under until/unless a D4 pick changes the lane) — keep the `manufacturer → 'manufacturer'` special case.
- `src/lib/schemas/entryClassify.schema.test.ts` — **behavioral-output rewrite of `:111-116`** ("output feeds buildBriefDraft cleanly"): the fixture is agency-shaped (`businessTypeGuess:'agency'` at `:17`) and R2 flips agency to `ambiguous {candidateEngines:['trust','work'], priorEngine:'trust'}` — so `buildBriefDraft` now resolves agency to `ask`, and per the null-engine invariant the current asserts (`brief.copyEngine === 'trust'`, `facts.entry.resolvedEngine === 'trust'`) FAIL. **Ruling: keep the agency fixture** (it's shared by five other tests in the file — parse checks + the scrape fixture — repointing it is needless churn) and rewrite the one test union-aware, preserving BOTH intents:
  - (a) ask-path (agency, the shared fixture): `brief.copyEngine` **undefined**, `facts.entry.resolvedEngine` **null**, `engineStatus === 'ambiguous'`, prior `'trust'` (candidates `['trust','work']`) — this now exercises the new invariant through the schema seam, which is exactly what "feeds buildBriefDraft cleanly" should mean post-R2;
  - (b) committed-path (one-line override `{...validUnderstandFixture, businessTypeGuess: 'consultant'}`): `brief.copyEngine === 'trust'` + `resolvedEngine === 'trust'` — preserves the original "lookup, not AI" resolution intent with a still-committed trust type.
- `src/modules/brief/classify.ts` — `EngineResolution` union return for `resolveEngine`; `EntryFacts.engineStatus` + nullable `resolvedEngine`; `buildBriefDraft` (sets `brief.copyEngine` only when resolved ∧ isSchemaEngine; status per R1); `applyBusinessTypeCorrection` union-aware; NEW `applyEnginePick(draft, engine)` — the D4-pick writer (sets resolvedEngine, `engineStatus:'confirmed'`, source `'user-pick'`, re-parses BriefSchema; place/quick-yes NEVER written to `brief.copyEngine`)
- `src/modules/brief/classify.test.ts` — photographer→resolved work/lookup; designer→ask{work,trust} prior work; unknown→ask reason unknown-type with tiebreaker prior; place resolves but copyEngine unset; applyEnginePick paths
- `src/modules/brief/serveGate.ts` — null `resolvedEngine` → not-bridgeable/manual with the dedicated **`engine-unresolved`** tag (never misfiled under `rungC:*`/`rungE:*`); rungE tagging otherwise unchanged. Note (diagnostic shift, no test break): with designer/agency (+manufacturer if flipped) now resolving to `ask`, the admin **serveMatrix** rows for those keys flip serve→manual — expected/honest (matrix shows the pre-pick state; it does NOT simulate a D4 pick — ruled: keep as-is, note in the admin page if trivial).
- `src/modules/brief/serveGate.test.ts` — null-engine → manual with `engine-unresolved` tag; existing serve cases regression
- `src/lib/schemas/entryClassify.schema.ts` — Zod clamp `businessTypeConfidence` 0..1 (R1); keep `EntrySignals` parity guard green
- `src/lib/journeyEngines.ts` — union-aware reads (if it touches registry engine field; verify + adjust)
- `src/app/onboarding/[token]/components/ConfirmBriefStep.tsx` — minimal compile fix only for `applyBusinessTypeCorrection` signature (behavior unchanged)
- `src/modules/audience/product/voice.ts` — `:122` reads `businessTypes[key].copyEngine`; narrow with `engineState === 'committed'` guard (ambiguous → fall through to existing default voice path; mechanical, no voice change for committed types)
- `src/app/admin/page.tsx` — union-aware read for the serveability/engine column (display `ask (candidates)` for ambiguous entries; mechanical)

**Reader/behavior audit (two sweeps, both mandatory — half a sweep = the "grep all readers" landmine):**
1. **Registry-field readers** (`businessTypes[key].copyEngine` / `.copyEngine` on entry values): the known set is the seven files above — voice.ts, admin/page.tsx, workContract.test.ts, extraction.test.ts, pipelineGuards.test.ts, entryClassify.schema.test.ts, ConfirmBriefStep.tsx — plus classify/serveGate themselves.
2. **Behavioral-output tests**: grep the test suite for tests that assert `buildBriefDraft`/`resolveEngine`/confirm-path OUTPUT for any FLIPPED type key (`agency`, `designer`, and `manufacturer` if Gate C flips it) — e.g. `grep -rn "agency\|designer\|manufacturer" src/**/*.test.*` filtered to resolution/brief assertions. These break at runtime, not compile time, so field-grep alone misses them (entryClassify.schema.test.ts was exactly this class). If Gate C flips `manufacturer` to ambiguous, every `entryClassify`/`serveMatrix`/`classify` fixture using `manufacturer` needs the same union-aware treatment (copyEngine undefined / resolvedEngine null / prior asserts) — add them to this phase's list at that point.

**Verified-not-touched (implementer confirms, does not assume):** `src/modules/brief/serveMatrix.ts` + `src/modules/brief/serveMatrix.test.ts` survive the flip as-is — the designer/agency/manufacturer rows only hit the generic row-shape test and the single==multi equality check, where manual===manual still holds after those keys go pre-pick manual. Run their tests and confirm green; if either asserts a specific serve outcome for a flipped key, it graduates into Files-touched via the audit rule above.

If the implementer finds ANOTHER reader or behavioral test at build time, it goes in the audit + this list, not silently patched.

**Verification:** `npx tsc --noEmit` + `npm run test:run` green. New unit tests above are the deliverable proof. **⛔ HUMAN GATE (spec gate 3, part 1/2):** review the resolver diff — Kundius/photographer must resolve `work` via lookup with zero prompts; confirm the ambiguous-entry set as product call, **including the manufacturer trade-off explicitly** (ambiguous = D4 on every manufacturer vs today's zero-question committed-thing path; default = keep manufacturer committed). (Full end-to-end no-double-entry check lands at Phase 3's gate.)

## Phase 2 — Decider state machine + D1 entry + rail engine field

**Files touched**
- `src/app/onboarding/[token]/components/decider/deciderMachine.ts` — pure function: `EngineResolution` + confidence → `engineStatus` (R1 table) + transitions (`resolving→known|almost-sure|ambiguous`, `→confirmed` on pick); unit-testable
- `src/app/onboarding/[token]/components/decider/deciderMachine.test.ts` — the R1 table, exhaustively
- `src/app/onboarding/[token]/components/decider/D1Entry.tsx` — hi-fi composer (radial bg, 2-tab describe/use-my-site, orange Continue, 3 example rows); wraps the existing submit logic of `EntryInputStep` (URL→`/api/v2/scrape-website`, text→`/api/v2/understand`, `entry:true`); rail live on the right
- `src/app/onboarding/[token]/components/EntryInputStep.tsx` — extract submit/classify logic for reuse (keep component working for any residual callers this phase)
- `src/components/onboarding/journey/UnderstoodRail.tsx` — NEW "HOW YOUR SITE WINS" engine field: 3 visual states keyed on `engineStatus` (resolving spinner / set card + green check when confirmed / amber "could go two ways"), striped placeholders, "Change how buyers decide" link (emits callback; wired in Phase 4)
- `src/components/onboarding/journey/UnderstoodRail.test.tsx` — 3 states + link render
- `src/app/onboarding/[token]/page.tsx` — extend `EntryStep` machine with decider steps (`'decider'` sub-states via `engineStatus`); D1 replaces the bare input step; hold decider state (`oneLiner`, `entrySignals`, `engineStatus`, `resolvedEngine`, `demandTag`) in local state; existing `confirm|manual|wizard|journey` branches still reachable (routing re-pointed in Phases 3–5)

**Verification:** `tsc` + `test:run` green (deciderMachine + rail tests). Manual dev check: submit a one-liner → rail spinner → resolved card. No e2e yet (routing lands next phases).

## Phase 3 — Work lane: D2 / D3 / D6 + journey handoff — **O1 dies here**

Critical path (Kundius demo). Decider becomes work-journey STEP 01; `JourneyEntryStep`'s duplicate one-liner screen is bypassed.

**Confirm-handoff ownership (the O1 replacement — explicit):** today `JourneyEntryStep.confirmDraft` (`:98-126`) owns the WHOLE pre-journey handoff: `loadJourneySeam(engine)` → `seam.enrichDraftForConfirm(draft)` (`:103`) → **`POST /api/brief/confirm`** → on `serve` hard-navigate to `redirectTo` (full reload re-runs page.tsx load-detection `:136-155`, which mounts `JourneyShell` only when a CONFIRMED brief exists — `brief.copyEngine` + persisted `audienceType`+`templateId`, all written by the confirm serve branch) → journey resumes at its first post-entry step (`showWork`); on non-serve → `onManual(missing)`. Bypassing `JourneyEntryStep` means this ownership MOVES, it does not evaporate. **New owner: `D6Handoff.tsx`** — its Continue CTA performs exactly this sequence (seam load for the resolved engine, pure `enrichDraftForConfirm`, POST `/api/brief/confirm`, serve → `window.location.assign(redirectTo)`, manual → route to the demand presentation — Phase 5's D5-style screen; THIS phase wires the existing `manual`/`ManualOnboardStep` branch so the path is never a dead-end, Phase 5 reskins it). page.tsx only routes; it does not duplicate the POST. Consumed contract (NO edits): `src/app/api/brief/confirm/route.ts` — request/response shape unchanged; if any server-side change turns out to be needed, STOP and escalate (plan deviation).

**Serveability pre-check (required BEFORE asserting the critical path):** `photographer`/`designer` carry `requiredCapabilities:['gallery']` (config `:250`,`:283`), and config/serveGate comments claim gallery is unbacked → rejects to manual. Those comments are STALE: atelier natively declares `gallery` on the work engine (`src/modules/templates/fit.test.ts:148`, `templateMeta.atelier.capabilities`), so a confirmed photographer brief should shortlist atelier and **serve**. Step 0 of this phase: prove it — a serve-gate/confirm-path test asserting photographer confirm → `outcome:'serve'` with an atelier `templateId` (and same for designer-picked-work). **If it does NOT serve, the work critical-path acceptance (photographer → D2 → work journey) is unmet — STOP, escalate to the founder; do not paper over by routing to demand.** (Risk flag: if atelier is somehow excluded from the shortlist for these keys, this phase blocks.)

**Files touched**
- `src/app/onboarding/[token]/components/decider/D2Known.tsx` — "You're a photographer — so we'll lead with your work." icon tile, change-affordance card (→ D4, wired Phase 4; this phase can route to it as stub or defer link), blue CTA, auto-continue micro-beat
- `src/app/onboarding/[token]/components/decider/D3AlmostSure.tsx` — one-tap confirm ("Yes — that's it" primary card; "something else" secondary → D4 in Phase 4); "Yes" = confirm same lookup engine, NO re-classification, no extra UNDERSTAND credit
- `src/app/onboarding/[token]/components/decider/D6Handoff.tsx` — "ENGINE SET" header, belief-lifecycle card (Inferred → Revised in ingestion → Committed at plan gate), dark handoff banner; **owns the confirm handoff** (see ownership block above): seam load + enrich + `POST /api/brief/confirm` + serve/manual branch; Continue → hard nav to `redirectTo` (journey at `showWork`); manual → demand/manual branch (Phase 5 reskin); 6-dot tracker variant in top bar
- `src/app/onboarding/[token]/page.tsx` — work-lane routing: resolved work → D2 (or D3) → D6; serve outcome re-enters via load-detection (`:136-155`) which renders `JourneyShell` at its FIRST post-entry step (showWork), NOT `JourneyEntryStep`; manual outcome → existing `manual` branch (Phase 5 replaces its presentation); resume logic (`resolveResumeStep`) unaffected
- `src/modules/brief/serveGate.test.ts` (or `classify.test.ts` if better-homed) — the serveability pre-check: photographer/designer-picked-work confirm-shape brief → serve with atelier shortlisted
- `src/components/onboarding/journey/JourneyEntryStep.tsx` — retire from the entry path (no longer re-presents an editable one-liner; keep file if journey resume still references it, else delete + update imports)
- `src/components/onboarding/journey/JourneyEntryStep.test.tsx` — update/retire accordingly
- `e2e/engine-decider.spec.ts` — NEW Playwright spec (mock mode): photographer one-liner → D2 shown → D6 → confirm POST fires once → work journey step renders → **assert the one-liner textarea appears exactly once in the whole flow** (the O1 regression trap)
- `e2e/work-onboarding.spec.ts` — update entry steps to go through the decider

**Verification:** serveability pre-check test green FIRST, then `tsc` + `test:run` + `npx playwright test e2e/engine-decider.spec.ts e2e/work-onboarding.spec.ts` green. **⛔ HUMAN GATE (spec gate 3, part 2/2):** founder runs dev: "I am a photographer in Amsterdam" → D2 → work journey, one-liner typed ONCE, no double-entry, no extra credit burn, and the project actually SERVES (atelier), not demand.

## Phase 4 — D4 buyer-decision question + full routing table + wizard step-2 entry

**Files touched**
- `src/app/onboarding/[token]/components/decider/D4BuyerDecision.tsx` — the key screen: context pill, 5 option rows via `src/components/onboarding/shared/OptionCard.tsx` styling (work/trust/thing active; place/quick-yes dashed "SOON" → D5), prior pre-selected + "best guess" caption, footer "Continue with <pick>"
- `src/app/onboarding/[token]/page.tsx` — routing table complete: `ambiguous`/unknown → D4; D4 pick → `applyEnginePick` → work→D6 · trust/thing→wizard at `understanding` slot · place/quick-yes→D5 (Phase 5 renders it; stub route this phase); clear thing/trust from D2/D3 ALSO route to wizard-at-understanding; rail "Change how buyers decide" reopens D4 from any decider/wizard screen pre-plan-gate (wire the Phase 2 callback + D2/D3 change-affordances)
- `src/hooks/useWizardStore.ts` — wire enter-at-slot: accept an initial slot on hydrate (plumbing exists: `goToSlot` L1047 + pre-hydrated `oneLiner` L477-499; currently starts slot 0 L965 with NO caller) so `identity` slot is skipped when the decider hands off — no re-ask of name/one-liner. **Name-hydration guard:** the `identity` slot is name+oneLiner — verify `businessName` is hydrated via `prefillValueFor` (`:478`, `businessName` from `fieldStr(fields,'name')` `:725`) before enabling enter-at-`understanding`, else generation loses the business name. **Back-nav guard:** `prevSlot` is index-based and clamps only at slot 0 (`useWizardStore.test.ts:323-338`) — entering at `understanding` must make `identity` unreachable via prevSlot (floor the back-nav at the entry slot; Basics reachable only via explicit edit).
- `src/hooks/useWizardStore.test.ts` — NAMED tests (not prose-only): (a) hydrate with initial slot `understanding` → `businessName` present/prefilled; (b) `prevSlot` from `understanding` after decider entry does NOT land on `identity`
- `src/components/onboarding/wizard/WizardShell.tsx` — accept/forward the initial-slot prop
- `src/modules/brief/classify.test.ts` — (only if applyEnginePick gaps surface) — otherwise untouched
- `e2e/engine-decider.spec.ts` — extend: (a) SaaS one-liner → no decider question → wizard visible at understanding slot, one-liner not re-asked; (b) branding-studio one-liner → D4 fires, prior=work pre-selected, 5 options incl. 2 dashed SOON; pick trust → wizard; pick work → D6

**Verification:** `tsc` + `test:run` + `npx playwright test e2e/engine-decider.spec.ts` green. **⛔ HUMAN GATE (spec gate 4 — wrong-site check):** founder runs the cirkles case (branding & design studio one-liner) on dev: must reach D4, be routable to work AND (separately) trust, never silently forced to either.

## Phase 5 — D5 demand board + serve-gate demand wiring

Backend EXISTS (`DemandLead` model + `POST/PATCH /api/demand-lead` + founder email + rungE tags) — this phase is UI + wiring only. No schema migration expected; if any field gap forces one, STOP and escalate (migration = new human gate, `prisma migrate dev` never `db push`).

**Files touched**
- `src/app/onboarding/[token]/components/decider/D5DemandBoard.tsx` — amber tile, honest headline ("We don't build <X> sites yet — but we're close"), email capture card → `POST /api/demand-lead` `{userId, input: oneLiner, briefDraft, missing/tags incl. rungE:<engine> demand tag, email, fasttrack}`, confirmed state, "go back" escape → reopens D4; **never writes `brief.copyEngine`**
- `src/components/onboarding/journey/UnderstoodRail.tsx` — "DEMAND LOGGED · #PLACE"-style amber chip when `demandTag` set
- `src/components/onboarding/journey/UnderstoodRail.test.tsx` — chip render
- `src/app/onboarding/[token]/page.tsx` — D4 place/quick-yes pick → D5; serve-gate `manual` outcome from `/api/brief/confirm` (unserveable confirmed Brief — the branch D6Handoff routes to since Phase 3) → D5-style demand presentation instead of the bare `ManualOnboardStep` dead-end (relocated access gate, honest + logged, never a cold waitlist). Includes any `engine-unresolved`-tagged manual outcome (defect-path, still honest).
- `src/app/onboarding/[token]/components/ManualOnboardStep.tsx` — reuse/absorb into D5 presentation (keep the API contract identical)
- `e2e/engine-decider.spec.ts` — extend: restaurant one-liner (or D4 place pick) → D5 renders, email submit posts demand-lead (mock/intercept), `brief.copyEngine` never set to place, go-back returns to D4

**Verification:** `tsc` + `test:run` + `npx playwright test e2e/engine-decider.spec.ts` green. **⛔ HUMAN GATE (spec gate 2, part 1/2):** founder confirms on dev: place path logs a `DemandLead` row + founder email fires; unserveable outcome shows the demand board (no silent dead-end, no cold waitlist).

## Phase 6 — /api/start residual cleanup + persona-gate verification

Scout finding: persona gate ALREADY retired (scale-02); `/api/start` is a pure creator. This phase = verify + finish residual back-compat cleanup, NOT a rebuild.

**Files touched**
- `src/app/api/start/route.ts` — remove residual `personaToAudienceType`/persona plumbing (~L50-53, 67-69) IF no live caller still sends `persona` (grep dashboard/marketing entry points first; if a caller exists, re-point the caller in the same phase and list it)
- Caller sites of `/api/start` that still pass `persona` (identified by grep at implement time; expected: dashboard "New site" CTA) — stop sending persona
- `src/app/onboarding/waitlist/page.tsx` — verify unreferenced from the new flow; retire ONLY if zero inbound routes remain (else leave, note in audit)
- `src/app/api/start/*.test.ts` / affected route tests — update

**Verification:** `tsc` + `test:run` + `npx playwright test e2e/engine-decider.spec.ts e2e/generation.spec.ts` (start-path regression) green. **⛔ HUMAN GATE (spec gate 2, part 2/2 — first-touch access path):** founder sign-off on the /api/start diff: no persona question anywhere in first-touch; nobody who should be served can be turned away pre-Brief; EVERY rejection path (serve-gate manual + place/quick-yes) demonstrably logs a demand signal. Legacy `/onboarding/product|service/[token]` routes untouched (out of scope; existing projects keep working).

## Phase 7 — Copy humanization + hi-fi polish + full gates

**Files touched**
- `src/app/onboarding/[token]/components/decider/D1Entry.tsx`, `D2Known.tsx`, `D3AlmostSure.tsx`, `D4BuyerDecision.tsx`, `D5DemandBoard.tsx`, `D6Handoff.tsx` — final plain-language copy (no engine jargon; keep buyer-decision lines verbatim; "Lessgo AI" everywhere), token-accurate polish vs the handoff (colors/spacing/radii/shadows per §Design Tokens; lucide icon mapping)
- `src/components/onboarding/journey/UnderstoodRail.tsx` — rail labels humanized ("HOW YOUR SITE WINS" → founder-approved plain label), footer notes
- `src/components/onboarding/journey/JourneyTopBar.tsx` — entry pill / 6-dot tracker / D1 composer variant per handoff (only if Phase 3 didn't already need it; otherwise polish here)
- `e2e/engine-decider.spec.ts` — final pass: all four routing outcomes in one spec (work / clear-non-work / ambiguous→D4 / place→D5) + rail-reopen-D4 check
- `docs/architecture/copyEngines.md` — short "entry decider" section (routing table + revisable-belief lifecycle) so the reference doc matches reality

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` · `npm run test:e2e` — ALL green. **⛔ HUMAN GATE (spec gate 1 — copy sign-off + spec decision gate):** founder verifies on the QA preview: all 6 screens' copy (founder taste — the whole point), and the four routing outcomes end-to-end, before the beta push/merge. Merge to main is itself a human gate per branch rules.

---

## Cross-phase invariants (reviewer checklist)

- **Firewall:** AI never emits an engine; `entryClassify.schema` keeps forbidding it; only `resolveEngine`/`applyEnginePick` decide. No blocking confirm anywhere — D2 auto-continues, D3/D4 are one-tap.
- **Schema:** `BriefSchema.copyEngine` enum stays `{thing,trust,work}`; place/quick-yes resolve + route to demand only; `isSchemaEngine` guard untouched.
- **Confirm contract:** `/api/brief/confirm` request/response shape unchanged across ALL phases (consumed by D6Handoff from Phase 3); any needed server change = plan deviation → escalate.
- **Null engine never reaches confirm** (D4 pick guaranteed first); serve-gate backstop tags it `engine-unresolved`, never a misleading `rungC:*`.
- **Seam:** `JourneyEngineSeam` contract not widened; wizard bridge for thing/trust uses existing slots so future thing/trust journeys re-point with near-zero change.
- **No renderer/template/published-page code touched** — dual-renderer parity not in blast radius (assert in every impl-review).
- Each phase ends `tsc` + `test:run` green; per-phase commit on `feature/engineDecider` only.

## Unresolved questions

1. Ambiguous entry set: designer+agency confirmed? **manufacturer: flip to ambiguous (costs its current zero-question committed-thing path — D4 on every manufacturer) or keep committed `thing`?** Default = keep committed. (Gate at Phase 1. If flipped: manufacturer fixtures in `entryClassify`/`serveMatrix`/`classify` tests need the same union-aware treatment — covered by the Phase 1 audit rule.)
2. Onest font: accept existing app-chrome font, or self-host Onest (distinct family, app-scoped)?
3. D2 auto-continue: keep timed auto-advance (design says "auto-continues in a moment") or CTA-only? Timed advance can race the change-affordance.
4. `waitlist` page: retire now if unreferenced, or keep until legacy product/service routes retire?
5. D3 "Yes" + D2 change-affordance: OK that neither re-runs classification (no credit burn), pure local state?
6. Admin serveMatrix: OK showing designer/agency(/manufacturer) as `ask`/manual pre-pick (no simulated D4 pick)?
