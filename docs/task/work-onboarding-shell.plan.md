# work-onboarding-shell — implementation plan (rev 5: chip-id wipe guard + firewall-clean preflight; engine-agnostic journey shell + work seam pilot)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-onboarding-shell`
- **BRANCH:** `feature/work-onboarding-shell`
- **Tier:** full
- **Spec:** `docs/task/work-onboarding-shell.spec.md` · **Scout:** `docs/task/work-onboarding-shell.scout.md` (ground truth; spec References partly stale)
- **Rev 4 ruling (stands; supersedes the spec's framing):** onboarding is organized by **COPY ENGINE**, not `audienceType`. The 6-step journey (one-line → show-work → questions → plan → build → reveal + persistent rail) is **universal**; only step CONTENT varies per engine. E1 therefore builds an **engine-AGNOSTIC journey shell** with a per-engine **seam**; **work is the ONLY seam built** (pilot). Phase 1 (rev 3) is DONE and STANDS unchanged.
- **Rev 5 deltas (review blockers):** (1) `workCopyEngineEnabled` moves into the leaf `src/lib/workCopyEngine.ts` (re-exported from `work.llm.ts` — same precedent as `isWorkCopyTemplate`) so `preflight` stays **sync** AND firewall-clean; (2) rail chips carry a **seam-issued stable id** so group edits join back to `liveFacts.work.groups[]` through renames/reorders/adds — closes the photos/items wipe for real. Plus: P2 split into P2a (contract → human gate) / P2b (shell), `commitRail` persistence-failure surfacing, purity scan honesty, `chrome=0` Suspense-primary, `stub:true` dropped from the contract.

## Overview

Build the universal 6-step onboarding **journey shell** (agnostic chrome + step machine + rail UI + reveal) in `src/components/onboarding/journey/`, plus a **per-engine seam** (`engines/`) that supplies rail adapter, step content, entry enrichment, and the generation driver. The **work engine is the pilot and only seam implemented** — its rail adapter is phase 1's `src/modules/wizard/work/rail.ts` (unchanged). Dispatch stays **post-confirm** from the existing `/onboarding/[token]` entry, gated on *seam exists AND template eligible* (`work` + `isWorkCopyTemplate` — atelier only); granth (work-engine, not allow-listed) and legacy thing/trust stay on `WizardShell`. A served work brief still means `audienceType:'service'` + `templateId:'atelier'` (work = engine, never audience). State reuses `useWizardStore`; generation reuses `runWorkLLMGeneration` behind the seam.

## Progress log

- phase 1 rail data model + entry→work seed + brief plumbing: **done** (commits 715e4c63 + 43938e1d, review loops 1, verdict ship) — **STANDS under rev 4** (rail.ts = the WORK seam's rail adapter, verbatim)
- phase 2a seam contract + registry + leaf + work seam + drift guard: **done** (commit fe2d063f, review loops 1, verdict ship; +2 review fixes folded pre-gate: chipIndex regex guard, preflight fail-closed) — **AWAITING HUMAN GATE (seam-contract sign-off)**
- phase 2b journey shell scaffold (agnostic) + dispatch + e2e registration: pending
- phase 3 STEP 01 + rail UI (agnostic) + work rail adapter wiring + icons: pending
- phase 4 thin steps 02/03/04 (agnostic frames + work seam content): pending
- phase 5 STEP 05 building (seam-driven generation): pending
- phase 6 STEP 06 reveal + editor handoff (agnostic): pending
- phase 7 gates sweep + founder QA: pending

## The seam contract (rev 4 core design — mirror of `getContract`/`slotsForEngine`, not a new invention)

Precedent: the legacy wizard is ALREADY engine-seamed — `slotsForEngine(engine, templateId, briefSignal)` + `getContract(engine).slotSkips` (`src/hooks/useWizardStore.ts:501-514`, `src/modules/engines/inputContracts.ts:102-220`): a closed per-engine record, a thin accessor, engine-specific DATA + narrow functions consumed by shared machinery. The journey seam copies that shape.

**Honesty rule (ruling ground truth): an engine-agnostic rail UI is buildable; an engine-agnostic rail MODEL is not — only `workFacts.schema.ts` exists (no thingFacts/trustFacts).** So the rail UI renders a generic *projection* (view-model) and each engine supplies the adapter that produces it and constructs edits. Work's adapter = phase 1's `rail.ts`. thing/trust adapters are NOT BUILT (no facts schema to project) — the seam is **declared, not filled**. Do NOT invent fact schemas or speculative seams for other engines. `place`/`quick-yes` are RESERVED, not in `copyEngines` (`src/types/brief.ts:16`) — the registry is `Partial<Record<CopyEngine, …>>`; they wait for the type to widen.

Concrete shape (types only, `src/components/onboarding/journey/engines/types.ts`):

```ts
// Rail view-model the AGNOSTIC UnderstoodRail renders (skeleton = unknown):
interface RailFieldVM {
  id: string;                 // seam-defined stable id ('name' | 'descriptor' | 'groups' | 'pricePosition' …)
  label: string;              // mono header ("WHAT YOU SELL")
  kind: 'text' | 'chips' | 'derived';
  value: string | null;                    // text/derived
  chips?: { id: string; label: string }[]; // chips — id is SEAM-ISSUED and STABLE (see id rule below)
  skeleton: boolean; editable: boolean;
}
interface RailVM { fields: RailFieldVM[] }   // ORDER = render order; E1 work emits EXACTLY FOUR fields

// Chip edits carry ids back — the ONLY handle that survives rename + reorder:
type RailChipEdit = { id?: string; label: string };   // absent id = NEW group

// Every rail write returns a commit the agnostic store action applies atomically:
type RailCommit =
  | { ok: true;
      patch: Partial<Brief>;               // FULL-facts re-emit (landmine 4)
      facts: Brief['facts'];               // merged bag — same-`set` briefFacts snapshot sync (decision 5)
      fieldMirrors?: { fieldId: string; value: string }[] }  // e.g. work NAME → fields['name']
  | { ok: false; error: string };          // zod pre-validate failed → surfaced, never sent (landmine 5)

interface JourneyRailAdapter {
  toVM(facts: Brief['facts'] | undefined): RailVM;
  // MUST construct edits from liveFacts (e.g. facts.work.groups[]), NEVER by rebuilding from the VM
  // — the VM projection (WorkRailGroup) drops photos/items. Chip edits (kind:'chips',
  // value: RailChipEdit[]) are JOINED ON id against liveFacts.work.groups[] so photos/items
  // survive rename/reorder/add (label-match breaks on rename; positional index breaks on add/remove).
  applyEdit(fieldId: string, value: { kind: 'text'; value: string } | { kind: 'chips'; value: RailChipEdit[] },
            liveFacts: Brief['facts']): RailCommit;
  appendNote(note: string, liveFacts: Brief['facts']): RailCommit;
}

// STEP 03 question descriptors — commits route through the rail adapter (kind-valid groups guaranteed):
type JourneyQuestion =
  | { id: string; kind: 'text';  label: string; prefill?: string; commit(v: string, liveFacts): RailCommit }
  | { id: string; kind: 'group'; label: string;                   commit(name: string, liveFacts): RailCommit }
  | { id: string; kind: 'price'; label: string;                   commit(p: {mode:'exact'|'from'|'on-request'; amount?: number}, liveFacts): RailCommit };

interface JourneyEngineSeam {
  engine: CopyEngine;
  rail: JourneyRailAdapter;
  // STEP 01: enrich the classified draft BEFORE /api/brief/confirm (work: facts.work = seedWorkFactsFromEntry)
  enrichDraftForConfirm(draft: Brief): Brief;
  steps: {
    showWork: { title: string; body: string; icon: string };                // 02 — content only; E1 RENDERS it
                                                                            // as a data-only stub + Skip (E1
                                                                            // implementation detail, NOT contract)
    questions(vm: RailVM): JourneyQuestion[];                              // 03 — only the ones still needed
    plan: { prepare(wizardApi: WizardStoreApi): Promise<void>;             // 04 — work: chargeless sitemap seed
            items(state: WizardState): { title: string }[] };
  };
  // STEP 05 — HONESTLY work-shaped in E1: no generic generation driver exists. The seam OWNS it.
  // preflight is SYNC (decided rev 5) — firewall-clean because workCopyEngineEnabled lives in the
  // LEAF `@/lib/workCopyEngine` (moved there in P5; re-exported from work.llm.ts), so `engines/work.ts`
  // never statically imports the generation graph.
  preflight(state: WizardState): { ok: true } | { ok: false; reason: 'engine-disabled' | 'missing-facts'; message: string };
  runGeneration(state: WizardState, cb: { onStage; onPageProgress }): Promise<
    { ok: true } | { ok: false; kind: 'credits' | 'error'; message: string }>;   // lazy-imports work.llm at CALL time
  resolveResumeStep(loaded: LoadDraftResult): Promise<2 | 3 | 4 | 5 | 6>;        // lazy isResumableGeneration
}
```

### Chip stable-id rule (rev 5 — closes landmine 15 for real; do NOT improvise)

- **`WorkGroup` gets NO id field** — `workFacts.schema.ts` is untouched. Ids are **derived at projection time**: `toVM` assigns each group chip `id = 'g' + index` of that group in `liveFacts.work.groups[]` (the array the VM was projected from), i.e. `groups[0] → 'g0'`, `groups[1] → 'g1'`, …
- `applyEdit({kind:'chips', value: RailChipEdit[]})` interprets the edit against the SAME liveFacts: each chip WITH an id joins `groups[parseInt(id.slice(1))]` — its `photos`/`items`/`kind`/`price` carry through via `WorkGroupInput`, only `name` takes the (possibly renamed) label; the edited array's ORDER = the new group order (reorder-safe); a chip WITHOUT an id = a NEW group (`{name, kind:'category', price:{mode:'on-request'}}` seed defaults); a live group whose id appears in NO chip = deleted.
- **Why index-derived ids are safe here:** ids are generation-scoped — `commitRail` applies `result.facts` to `briefFacts` in one `set`, the rail re-runs `toVM` on the new snapshot, and the next edit's `liveFacts` IS that snapshot. VM and liveFacts can never be one edit apart, so the index join cannot cross-wire. (If a future engine needs multi-edit staleness tolerance, THAT engine's adapter picks a different derivation — the contract only requires "stable within a projection".)
- ⟳ **Rev 5 (review NB2) — MANDATORY doc comment on `RailChipEdit` + `toVM` in `engines/types.ts`, verbatim intent:** *"Chip ids are valid ONLY against the facts bag they were projected from. The shell MUST pass the current `briefFacts` as `liveFacts`, and MUST NOT carry a chip array across a commit."* Correspondingly **P3's `UnderstoodRail` inline chips editor must be keyed on / reset by VM re-projection** (never hold a chip draft across a commit). The one real hole in index-derived ids is a STALE VM — a local chip draft held across someone else's group write would mis-join or mis-delete. Unreachable in E1 (the only other group writer is STEP 03's group question, which per P4 fires ONLY when `groups` is empty — i.e. when there are no chips to edit), but this sentence is what stops engine #2 from getting it wrong. The reviewer explicitly weighed and REJECTED content-hash/WeakMap ids as over-engineering for E1 given `WorkGroup` has no id and E1 must not migrate the schema.

### Registry + dispatch + firewall (rev 4, rev-5 amendments marked ⟲)

- **Leaf eligibility module `src/lib/journeyEngines.ts`** (NEW; mirrors `workCopyEngine.ts` — zero-dep leaf, imports ONLY `isWorkCopyTemplate`): `JOURNEY_SEAM_ENGINES = ['work'] as const`; `hasJourneySeam(engine)`; `isJourneyEligible(engine, templateId)` — true only when a seam exists AND the engine's template gate passes (work: `isWorkCopyTemplate(templateId)`). **The entry page imports ONLY this leaf** for dispatch decisions — no seam/shell/generation code enters the entry bundle.
- **Seam registry `src/components/onboarding/journey/engines/registry.ts`**: `Partial<Record<CopyEngine, () => Promise<JourneyEngineSeam>>>` with async dynamic-import loaders (same dispatch-firewall pattern as `src/modules/templates/registry.ts`). Only `JourneyShell`/`JourneyEntryStep` (themselves `ssr:false` dynamic imports) call `loadJourneySeam(engine)`.
- **Drift guard (Vitest):** registry keys ⟺ `JOURNEY_SEAM_ENGINES` — the leaf and the registry can never disagree (a leaf-listed engine with no seam would dispatch into a crash; a registered engine missing from the leaf would be unreachable).
- **Heavy code stays lazy INSIDE the seam:** ⟲ `engines/work.ts` may statically import `rail.ts` (pure), `resumeStep.ts` (pure), `@/lib/workCopyEngine` (zero-dep leaf — hosts `isWorkCopyTemplate` AND, from P5, `workCopyEngineEnabled`), `@/types/brief`, and copy strings — NOTHING else at module top. `runGeneration`/`resolveResumeStep` lazy-import `@/modules/wizard/generation/work.llm` + `buildWorkInput` at call time (the `useWizardStore` lazy-adapter pattern) — `work.llm.ts`'s module top statically pulls `preloadTemplate` + `multiPageAssembly`, so a static import of it anywhere in `journey/` puts the generation+template graph on the STEP-01 entry path (landmine 14). NO template resolver/registry/renderer imports anywhere in `journey/`.
- **Agnostic-purity guard (Vitest, static) — two halves, honestly weighted:** ⟲ `journeyAgnostic.test.ts` reads the source of `journey/*.tsx` + `journey/steps/*`. (a) **Import-graph assertion (load-bearing, reliable):** no import from `src/modules/wizard/work/**` and no import of `@/modules/wizard/generation/**`. (b) **Literal tripwire (NOT a proof):** no `'atelier'` or other templateId-ish literals outside `engines/` — the `'work'` string is deliberately NOT scanned (false-positives on `data-testid="step-show-work"`, `work-onboarding`, comments; trivially bypassed anyway). The ruling ("do not hardcode work assumptions into the shell") is enforced by (a) + review, tripwired by (b).

### Agnostic vs work-specific (per surface — honest split)

| Surface | Agnostic (shell) | Behind the work seam (E1) |
|---|---|---|
| Chrome (`JourneyShell`/`JourneyTopBar`) | fully — bar, dot progress, save/exit, `.app-chrome` wrapper | nothing (copy strings only) |
| Step machine (`journeyStep` 2–6, resume dispatch) | machine + store slice | resume RULES (`resolveResumeStep` → work.llm resumability) |
| Rail UI (`UnderstoodRail`) | rendering, skeleton state, inline edit affordance, notes box, toasts | projection + edit construction = `rail.ts` via adapter |
| STEP 01 (`JourneyEntryStep`) | handoff-1a visuals, confirm/serve/manual plumbing, re-classify flip | draft enrichment (`seedWorkFactsFromEntry`) |
| STEP 02 show-work | frame + Skip | title/body/icon (work: portfolio-images stub) |
| STEP 03 questions | renderer for 3 input kinds (text/group/price) | question list + commits (kind-valid groups) |
| STEP 04 plan | page cards + CTA | `prepare` (chargeless work sitemap seed) + `items` |
| STEP 05 building | dark honest-progress UI, stage checklist, error/credit states | `preflight` (flag + `getWorkFacts`) + `runGeneration` (wraps `runWorkLLMGeneration`) — no generic driver exists; do not pretend |
| STEP 06 reveal | **fully agnostic** — iframe `/preview/{token}?chrome=0`, editor CTA, no publish | nothing |

### What E2/E3 and engine #2 inherit

- **Inherited free:** shell + top bar + dot progress, rail UI (skeleton/edit/notes), step frames 02–06, STEP 06 reveal verbatim, store slice + atomic rail-commit action, dispatch plumbing, e2e seeding pattern.
- **Engine #2 (thing or trust) must implement:** (1) a facts schema for its engine — **the real blocker; none exists today**; (2) a rail adapter over it (its `rail.ts` equivalent, phase-1 hard rules apply: full-facts re-emit, zod pre-validate, snapshot-sync commit shape, chip-id join rule); (3) `enrichDraftForConfirm`; (4) step content (showWork copy — trust=credentials, thing=the offer — questions, plan prepare/items); (5) `preflight`/`runGeneration` over ITS generation driver; (6) `resolveResumeStep`; (7) an entry in `JOURNEY_SEAM_ENGINES` + the registry (drift guard forces both); (8) template-eligibility predicate (its `isWorkCopyTemplate` equivalent). E1 must not pre-build any of this.
- **E2/E3 (work):** fill rail model fields already carried (location/reach/languages via ingestion/answers), render them by widening the seam's `toVM` output, close the silent-`en` language default.

## Design decisions (rev 3 base, rev 4 amendments ⟲, rev 5 amendments ⟳)

1. **work = engine, not audience — everywhere.** Served work brief ⇒ `audienceType:'service'` + `templateId:'atelier'` (`serveGate.ts` `TEMPLATE_AUDIENCE`). Nothing ever asserts `audienceType==='work'`. ⟲ Rev 4 strengthens this: the shell never mentions work at all; engine identity lives only in the seam.
2. **Dispatch is POST-CONFIRM only, keyed on seam + eligibility.** ⟲ Entry-page load-detection: confirmed brief AND `isJourneyEligible(brief.copyEngine, templateId)` (leaf module) → full-viewport early return rendering `JourneyShell` (dynamic import, `ssr:false`) instead of `WizardShell`. Eligibility EXPRESSES the allow-list through the seam (work → `isWorkCopyTemplate`, atelier only) — **granth is work-engine but NOT eligible, so writers keep `WizardShell` post-confirm; an engine-only dispatch would strand them; the guard is structural, not a work hardcode.** Known cosmetic overlap (accepted E1, unchanged from rev 3): the pre-confirm branch keys on `hasJourneySeam(briefDraft.copyEngine)` only (template unknown pre-confirm), so a granth-bound work draft ALSO sees STEP 01 before landing on WizardShell after confirm — data-inert (`waterfall.ts` reads only `facts.entry`; granth generation ignores `brief`), do not build an exclusion.
3. **STEP 01 = the entry page's confirm-step replacement when a seam exists.** ⟲ `JourneyEntryStep` (agnostic visuals, handoff 1a) replaces `ConfirmBriefStep` when `hasJourneySeam(draft.copyEngine)`; it loads the seam and calls `seam.enrichDraftForConfirm(draft)` before POSTing `/api/brief/confirm`. Everything else stands from rev 3: serve ⇒ `window.location.assign(redirectTo)` (full reload → load-detection → resume mount at STEP 02); manual ⇒ `onManual(missing)` → existing `ManualOnboardStep`; edited line ⇒ re-classify, non-seam result ⇒ `setStep('confirm')` with the fresh draft. Accepted E1 trade-offs stand: no `applyBusinessTypeCorrection`, 1 UNDERSTAND credit per re-classify. **Ruling (closed): STEP 01 headline/copy is UNIVERSAL in E1** — seam override optional and unused.
4. **`facts.work` is seeded at confirm** via the seam's `enrichDraftForConfirm` → phase 1's `seedWorkFactsFromEntry` (every group `{name, kind:'category', price:{mode:'on-request'}}` — `kind` REQUIRED or `getWorkFacts` nulls and strategy 400s unrecoverably). Pre-E1 confirmed work projects resume into STEP 03 (rail actions collect the generation minimum, `kind`-valid); no retro-seed. Unchanged from rev 3 — the seed fn SHIPPED in phase 1.
5. **State = `useWizardStore` journey slice; `briefFacts` is THE source of truth.** ⟲ Rev 4 makes the store action engine-agnostic: `commitRail(result: RailCommit)` applies `result.facts` to `state.briefFacts` AND `result.fieldMirrors` (work: NAME → `fields['name']`) in ONE `set`, then persists `result.patch`. The seam declares the mirrors; the store knows no engine. ⟳ **Rev 5 — persistence failure MUST surface (landmine-5 class, one layer up):** there is no generic `saveDraft(patch)` store action, and the existing `save()` (`useWizardStore.ts:1234-1251`) is best-effort — it swallows errors and never checks `res.ok`. `commitRail` therefore does its OWN `POST /api/saveDraft` reusing `save()`'s body shape (`{tokenId, stepIndex: Math.max(0, slots.indexOf(currentSlot)), brief: result.patch}` — the `-1 → 0` stepIndex in the journey is harmless — ⟳ **VERIFIED (rev 5, review NB3 — grepped, not assumed):** the only consumer of the persisted `stepIndex` is `src/components/dashboard/continueRouting.ts:56-72`. Mid-journey (no `finalContent`) a `stepIndex:0` falls to branch 4 → `/onboarding/product/{token}` → redirect stub → `/onboarding/{token}` → load-detection → journey resume-mount. Correct. POST-generation (rail is still on screen at STEP 06, so a late rail edit CAN overwrite a `999` with `0`) it falls to **branch 3** (`finalContent` bare) → `/edit/{token}`. Also correct. **Branch 3 is what makes this safe** — its own comment flags it as "easy to drop; without it, content-bearing drafts silently bounce back to onboarding." Do NOT remove branch 3, and do not "fix" the stepIndex write), **checks `res.ok`, and on non-2xx/throw REVERTS + toasts** (orchestrator ruling, closed): before the optimistic `set`, snapshot the pre-edit `state.briefFacts` AND any `fields` the mirrors will overwrite; on failure restore BOTH in ONE `set` and toast "Couldn't save — reverted, try again". **Do NOT keep optimistic state on failure.** Rationale: `briefFacts` is what generation READS (`resolveWorkBrief` → `buildWorkInput`), so an unpersisted rail belief makes STEP 05 generate from data that vanishes on reload — silent divergence, the exact landmine-5 class this plan exists to prevent. The rail must never show a belief we failed to persist. (The "next commit re-sends the full bag" reasoning is explicitly REJECTED — it is what makes the loss silent.) ⟳ Also RECORD, don't "fix": `buildBriefPatch` (`useWizardStore.ts:1223-1228`) only emits `facts` when `state.collections` is non-empty — so the legacy autosave can NEVER clobber rail-written facts in E1. This is load-bearing; leave it exactly as is. Slot machine, `hydrate`, `buildWorkInput`, `fetchStrategy` untouched; all store edits additive.
6. **Reveal isolation via iframe + `chrome=0` preview** — unchanged ruling; ⟳ rev 5 pins the mechanism: `/preview/[token]` gains `chrome=0` → renders ONLY the site (no action bar/Publish/modals). **Primary and ONLY read: `useSearchParams` in a small child component under `<Suspense fallback={null}>`** (precedent `src/app/dashboard/billing/page.tsx:155`); the page is one `"use client"` component with NO Suspense today, so the wrapper is needed regardless — do NOT use a `window.location.search`-in-an-effect fallback (it first-paints the action bar INSIDE the reveal iframe, then removes it — a flash the founder will see). Local `npm run build` in the phase that edits it. `.app-chrome` is never an ancestor of the revealed site. STEP 06 is fully agnostic. E2E must assert the Publish control is **absent from the iframe DOM**, not merely hidden.
7. **Flag honesty** — unchanged: `NEXT_PUBLIC_WORK_COPY_ENGINE` OFF or `workCopyEngineEnabled(templateId)` false ⇒ EXPLICIT error state at STEP 05, never the silent skeleton. ⟲ Lives in the work seam's `preflight`; the agnostic StepBuilding renders whatever `{ok:false}` the seam returns. ⟳ Rev 5: `preflight` stays **sync**; it calls `workCopyEngineEnabled` from the LEAF `@/lib/workCopyEngine` (moved there in P5, re-exported from `work.llm.ts` — the `isWorkCopyTemplate` relocation precedent at `work.llm.ts:57`). **Never re-implement the env check inside the seam** — two sources for the kill-switch is the field-drop/drift bug class.
8. **E1 thinness + two by-design nulls** — unchanged: no feel picker; STEP 02 = stub + Skip; no responsive pass; no new npm deps; (a) thin steps never set `goalIntent` (finalize runs with `briefGoal=null`, accepted); (b) work branch leaves `state.strategy` NULL by design (real strategy call inside `runWorkLLMGeneration`).
9. **E2E strategy: seeded-resume, NOT mocked-entry** — unchanged in full (mock mode's `ENTRY_DEMO_SIGNALS` is agency-shaped; `understand`/`scrape-website` OUT OF SCOPE). `e2e/helpers/seedWorkBrief.ts` + `WORK_BRIEF_FIXTURE` (photographer, `resolvedEngine:'work'`, non-tiebreaker source, pre-embedded `kind`-valid `facts.work`); Vitest fixture drift guard; every e2e spec = seed → `goto` → shell resumes at STEP 02; journey e2e covers 02→06; STEP 01 covered by Vitest (`JourneyEntryStep.test.tsx`) + P7 founder QA, explicitly not faked.
10. ⟲ **Seam contract is the durable artifact.** Types in `engines/types.ts`; registry `Partial<Record<CopyEngine,…>>` with async loaders; leaf⟷registry drift guard; agnostic-purity import assertion + literal tripwire. Work is the ONLY registered seam. ⟳ Rev 5: the contract is signed at the END OF P2a (human gate BEFORE any UI is built on it — its whole value); the 3 question kinds (text/group/price) are CLOSED for E1 (ruling; engine #2 extends the enum if needed); `stub:true` removed from the contract (E1 scaffolding doesn't belong in the durable artifact). E1 rail renders EXACTLY FOUR fields (NAME / WHAT YOU DO / WHAT YOU SELL / PRICE POSITION) — `location`/`reach`/`languages` stay MODELLED but UNRENDERED (no E1 source); generation silently defaults `en` → P7 QA item (g).
11. ⟳ **Group-edit wipe guard — CHIP-ID JOIN (rev 5; assigned to P3).** `WorkRailGroup` (read-side projection) exposes only `{name, kind, price, priceLabel}`; `WorkGroupSchema` carries optional `photos`/`items` and `normalizeWorkGroup` carries them through — but `applyRailEdit({field:'groups'})` **replaces the whole array** (`rail.ts:100-102, 115-122`), so the adapter must rebuild EVERY group from `liveFacts.work.groups[]`. Label-match breaks on rename (the PRIMARY what-you-sell edit); positional index breaks on add/remove. Rule (baked into the contract + unit-tested in P3): chips carry seam-issued stable ids (`'g'+index` at projection time — see "Chip stable-id rule"); `applyEdit` **joins edited chips on id** against `liveFacts.work.groups[]` and carries `photos`/`items` through `WorkGroupInput`; absent id = new group; the agnostic rail UI never reconstructs groups from labels or positions. **No id field is added to `workFacts.schema.ts`.**

## Rail data model (phase 1, SHIPPED — unchanged; see audit)

`src/modules/wizard/work/rail.ts` — pure projection of `brief.facts.work` + two additive optional schema fields (`identity.descriptor?`, `userNotes?`). Exports: `railFromBrief`/`railFromFacts`/`railFromWorkFacts`, `deriveRailPricePosition` (null = unknown ⇒ skeleton; delegates to canonical `derivePricePosition`), `seedWorkFactsFromEntry`, `normalizeWorkGroup` (carries `photos`/`items`), `applyRailEdit`, `appendUserNote`, `workFactsToBriefPatch`. Hard rules (all unit-tested, 29 tests): full-facts re-emit; same-object `{patch, facts}` for snapshot sync; zod pre-validate (`WorkFactsSchema` + `BriefSchema.partial()`); every emitted group `kind`-valid with a valid price; output always passes `getWorkFacts`. ⟲ Rev 4 role: this module IS the work seam's rail adapter core — `engines/work.ts` wraps it into `JourneyRailAdapter` (`toVM` maps `WorkRail` → 4 `RailFieldVM`s; `applyEdit`/`appendNote` delegate; ⟳ the chip-id join lives in the ADAPTER layer — `rail.ts` itself is unchanged).

## Landmine coverage map (scout §Landmines → phase, rev 5 placement re-verified)

| # | Landmine | Handled in |
|---|---|---|
| 1 | `.app-chrome` must not wrap revealed site | P6 (iframe + `chrome=0` preview) + P2b (`.app-chrome` only on the shell wrapper) |
| 2 | `NEXT_PUBLIC_WORK_COPY_ENGINE` off ⇒ empty reveal | P5 (work seam `preflight` explicit state) + P2b (env in playwright webServer) + P7 (founder decides prod flag at gate) |
| 3 | `saveDraft` never writes `audienceType` | P2b/P3 (STEP 01 CTA → `/api/brief/confirm`; serve ⇒ redirect, manual ⇒ `ManualOnboardStep`) + e2e asserts `loadDraft` ⇒ `audienceType:'service'` + `templateId:'atelier'` (+ `brief.copyEngine:'work'` separately) |
| 4 | shallow `facts` patch wipes siblings | P1 model rule (shipped) + P3 rail commits; unit + e2e persistence asserts |
| 5 | invalid patch → silent 200 | P1 zod pre-validate (shipped); surfaced via `RailCommit {ok:false}` in P3 UI; ⟳ + `commitRail` checks `res.ok` ⇒ **REVERT + toast** (decision 5 — never keep unpersisted optimistic state; generation reads `briefFacts`) |
| 6 | price/shape parse → silent null facts | P1 (`kind:'category'` + on-request defaults, shipped) + P4 (question commits route through the adapter — never a `kind`-less group) |
| 7 | `finalizeMultiPageGeneration` omission | P5 (seam `runGeneration` wraps `runWorkLLMGeneration` verbatim — finalize inside the driver) |
| 8 | STEP 04 vs `fetchStrategy` idempotency | P4 (seam `plan.prepare` = existing chargeless work sitemap path behind `strategyStatus` guard; never the charged path) |
| 9 | credits/ownership on work routes | No route changes; ownership stays at `saveDraft`/`brief:confirm` (noted, not fixed here) |
| 10 | isolation guards | P7 (fresh `npm run build` → published.css sha, `tailwindConfigFreeze`, `e2e/ui-isolation.spec.ts`; fixture NEVER regenerated) |
| 11 | icon subset | P3 (append to `icons.txt`, regen per NOTICE, once) |
| 12 | toast/badge gotchas | P3 (`@/components/ui/toast`; chips = pill/status badge variants) |
| 13 | mock mode cannot classify work | Decision 9 (seeded-resume e2e; STEP 01 = Vitest + P7 founder QA; `understand`/`scrape-website` not edited) |
| ⟲14 | seam drags generation/template code into entry bundle | P2a (leaf `journeyEngines.ts` is the ONLY entry-page import; registry async loaders) + P5 (⟳ `workCopyEngineEnabled` moved to the LEAF so sync `preflight` needs NO static `work.llm` import; lazy work.llm inside seam fns) + P2b (agnostic-purity import assertion) |
| ⟲15 | rail UI rebuilds groups from VM → photos/items wipe | P3 (⟳ decision 11: chip-id join against `liveFacts.work.groups[]`; regression test = rename + reorder + add over an E2-shaped bag) |

Also: entry-page + `WizardShell` firewall (scout §1) preserved — `JourneyShell`/`JourneyEntryStep` dynamically imported (`ssr:false`), import no template resolver/registry/renderer.

---

## Phase 1 — Rail data model + entry→work seed + brief plumbing (pure, no UI) — **DONE, STANDS under rev 4**

Shipped as specced in rev 3 (see `docs/task/work-onboarding-shell.audit.md`): `workFacts.schema.ts` additive-optional `identity.descriptor?` + `userNotes?`; `rail.ts` (+ amendment: `WorkGroupInput` carries `photos`/`items` through `normalizeWorkGroup`); 29 unit tests; full suite green. Human gate passed (founder ruled: 4 rendered fields; group seam widened). **Rev 4 reframes its ROLE only:** `rail.ts` = the work engine's rail adapter core behind the seam. No file changes.

**Files touched:** `src/lib/schemas/workFacts.schema.ts` (edit) · `src/modules/wizard/work/rail.ts` (new) · `src/modules/wizard/work/rail.test.ts` (new) — committed 715e4c63 + 43938e1d.

---

## Phase 2a — Seam contract + registry + leaf + work seam skeleton + drift guard (⟳ split from rev-4 P2)

**Goal:** the seam contract exists as a REVIEWABLE artifact — types, registry, leaf eligibility, the work seam skeleton proving the contract is implementable, and the drift guard — with NOTHING built on top of it yet, so the founder signs the contract BEFORE code depends on it (the gate's whole value; in rev 4 it sat after 23 files).

**Steps:**
1. **Seam contract** `engines/types.ts` — exactly the types above: `JourneyEngineSeam`, `JourneyRailAdapter`, `RailVM`/`RailFieldVM` (chips `{id, label}`), `RailChipEdit`, `RailCommit`, `JourneyQuestion` (3 kinds, closed for E1), sync `preflight`. Include the chip stable-id rule + the "edits from liveFacts, join on id" invariant as doc comments ON the types (the artifact engine #2 reads).
2. **Seam registry** `engines/registry.ts`: `Partial<Record<CopyEngine, () => Promise<JourneyEngineSeam>>>`, async dynamic-import loaders, `loadJourneySeam`.
3. **Leaf** `src/lib/journeyEngines.ts`: `JOURNEY_SEAM_ENGINES=['work']`, `hasJourneySeam`, `isJourneyEligible` (work → `isWorkCopyTemplate`); zero-dep besides the `workCopyEngine` leaf.
4. **Work seam skeleton** `engines/work.ts` (.ts, no JSX — seam content is data + functions): `engine:'work'`; `rail` adapter wrapping phase 1's `rail.ts` (`toVM` may be minimal here — full 4-field mapping + chip-id join land P3); `enrichDraftForConfirm` → `seedWorkFactsFromEntry`; placeholder `steps` content; `preflight`/`runGeneration`/`resolveResumeStep` stubs (fleshed out P4/P5; generation fns lazy-import at call time). Static imports limited to `rail.ts` + `@/lib/workCopyEngine` + `@/types/brief` (`resumeStep.ts` joins the allowed list when it lands in P2b) — NO work.llm/template imports at module top.
5. **Drift guard** `engines/registry.test.ts`: registry keys ⟺ `JOURNEY_SEAM_ENGINES`; eligibility truth table: work+atelier ⇒ true, work+granth ⇒ false, thing/trust+anything ⇒ false.

**Files touched:**
- `src/components/onboarding/journey/engines/types.ts` (new)
- `src/components/onboarding/journey/engines/registry.ts` (new)
- `src/components/onboarding/journey/engines/registry.test.ts` (new)
- `src/components/onboarding/journey/engines/work.ts` (new — skeleton)
- `src/lib/journeyEngines.ts` (new — leaf)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (drift guard + eligibility table) · `npm run lint`.

**HUMAN GATE — seam contract sign-off (ruling: KEPT, here).** The founder approves `JourneyEngineSeam` (the shape engine #2 and E2/E3 build against): rail adapter interface + `RailCommit` + the chip-id join rule, question descriptor kinds (closed for E1), the honest work-shaped surfaces (`preflight`/`runGeneration`/`resolveResumeStep` behind the seam), leaf/registry split, and the "What engine #2 must implement" list — BEFORE any UI is built on it.

---

## Phase 2b — Journey shell scaffold (agnostic) + dispatch + e2e registration (⟳ split from rev-4 P2)

**Goal:** the agnostic journey exists as a navigable shell (placeholder step bodies) on the signed contract, dispatch live behind seam-eligibility, and the seeded-resume e2e infrastructure registered — so every later gate runs against a real served work project and the shell is provably work-free.

**Steps:**
1. **Agnostic shell:** `JourneyShell.tsx` (client; `.app-chrome` on ITS OWN full-viewport wrapper only; resume-mode props `{tokenId, brief, audienceType, templateId}`; resolves the seam via `loadJourneySeam(brief.copyEngine)` with a loading state; hydrates `useWizardStore` like `WizardShell`); `JourneyTopBar.tsx` (58px bar, logo, "New site", centered dot progress 2–6, right slot; STEP 01 variant per handoff; glyphs restricted to the current subset until P3); `JourneyEntryStep.tsx` (STEP 01, mounted by the ENTRY PAGE pre-confirm; P2b = functional skeleton: one-liner shown, CTA → seam `enrichDraftForConfirm` → `/api/brief/confirm`, serve ⇒ `window.location.assign`, manual ⇒ `onManual(missing)`); `steps/StepShowWork|StepQuestions|StepPlan|StepBuilding|StepReveal.tsx` placeholder bodies + working next/back (02–06 machine walkable).
2. **Agnostic-purity guard** `journeyAgnostic.test.ts` (static source scan of `journey/*.tsx` + `journey/steps/*`): (a) import assertion — nothing from `src/modules/wizard/work/**` or `@/modules/wizard/generation/**` (load-bearing); (b) literal TRIPWIRE — no `'atelier'`/templateId-ish literals outside `engines/`; the `'work'` string deliberately NOT scanned (testids/comments false-positive).
   - ⟳ **Rev 5 (review NB1) — extend the import assertion to `journey/engines/*.ts` AND `src/modules/wizard/work/resumeStep.ts`:** assert NEITHER statically imports `@/modules/wizard/generation/**` or `@/modules/generation/**`. This closes landmine 14's one remaining live edge: `isResumableGeneration` lives in `src/modules/generation/multiPageAssembly.ts:123`, whose module top pulls `selectProductBlocks`, `collections/registry`, and `hooks/editStore/archetypes` — heavy. The plan mandates a lazy import for it (P5 step 4), but **nothing guards that mandate**, and `engines/work.ts` statically imports `resumeStep.ts` — so one careless static import there silently re-drags the template+generation graph onto the STEP-01 entry bundle (the seam loads pre-confirm). ~5 lines in a guard file this phase already creates.
3. **Store slice** in `useWizardStore.ts` (ADDITIVE): `journeyStep: 2|3|4|5|6`, `setJourneyStep`, selectors. Slot machine untouched.
4. **Resume:** `src/modules/wizard/work/resumeStep.ts` (+ test): `resolveResumeStep(loaded)` — confirmed ⇒ 2; refined P5/P6; exposed through the work seam (edit `engines/work.ts` to wire it — joins the seam's allowed static imports). STEP 01 never resumed (pre-confirm, entry-page-owned).
5. **Entry dispatch** in `src/app/onboarding/[token]/page.tsx` (NARROW, two branches, full-viewport early returns, imports ONLY the leaf): (a) load-detection confirmed AND `isJourneyEligible(brief.copyEngine, templateId)` → `JourneyShell` (dynamic, `ssr:false`); (b) `step==='confirm' && hasJourneySeam(briefDraft.copyEngine)` → `JourneyEntryStep` (dynamic) instead of `ConfirmBriefStep`; `onManual` reuses the existing manual path. Granth/thing/trust/non-eligible: unchanged post-confirm.
6. **E2E registration + seeding** (unchanged from rev 3): register `/work-onboarding\.spec\.ts/` in the **`authed`** Playwright project; add `NEXT_PUBLIC_WORK_COPY_ENGINE:'true'` to `webServer.env` (note `reuseExistingServer:!CI` — kill stale dev servers); `e2e/helpers/seedWorkBrief.ts` (`WORK_BRIEF_FIXTURE` photographer brief per decision 9, pre-embedded `kind`-valid `facts.work`; mint token via `GET /api/start` per `publish.spec.ts:31-34`, `POST /api/brief/confirm`, assert serve); Vitest fixture drift guard `workBriefFixture.test.ts` (`BriefSchema.parse` ok; `decideServe` ⇒ serve/atelier/service; `getWorkFacts` non-null).
7. **`JourneyEntryStep` unit test** (jsdom, mocked fetch): serve ⇒ `window.location.assign(redirectTo)`; manual ⇒ `onManual(missing)`, no navigation; the POSTed brief contains the seam enrichment (`facts.work` with `kind` on every group).
8. **e2e `e2e/work-onboarding.spec.ts`:** (a) `seedWorkBrief` → `goto('/onboarding/{token}')` → `JourneyShell` mounts at STEP 02 (dot progress visible), NOT `WizardShell`; `loadDraft` ⇒ `audienceType:'service'` + `templateId:'atelier'` + `brief.copyEngine:'work'`; (b) legacy-unchanged: product/service token still reaches `ConfirmBriefStep`/`WizardShell`. No assertion fakes the mocked classify→STEP 01 path (landmine 13).

**Files touched:**
- `src/components/onboarding/journey/JourneyShell.tsx` (new)
- `src/components/onboarding/journey/JourneyTopBar.tsx` (new)
- `src/components/onboarding/journey/JourneyEntryStep.tsx` (new)
- `src/components/onboarding/journey/JourneyEntryStep.test.tsx` (new)
- `src/components/onboarding/journey/journeyAgnostic.test.ts` (new)
- `src/components/onboarding/journey/steps/StepShowWork.tsx` (new)
- `src/components/onboarding/journey/steps/StepQuestions.tsx` (new)
- `src/components/onboarding/journey/steps/StepPlan.tsx` (new)
- `src/components/onboarding/journey/steps/StepBuilding.tsx` (new)
- `src/components/onboarding/journey/steps/StepReveal.tsx` (new)
- `src/components/onboarding/journey/engines/work.ts` (edit — wire `resolveResumeStep`)
- `src/modules/wizard/work/resumeStep.ts` (new)
- `src/modules/wizard/work/resumeStep.test.ts` (new)
- `src/modules/wizard/work/workBriefFixture.test.ts` (new)
- `src/hooks/useWizardStore.ts` (edit — additive journey slice; **shared file, regression risk**)
- `src/app/onboarding/[token]/page.tsx` (edit — dispatch branches, leaf import only; **shared file, regression risk**)
- `playwright.config.ts` (edit — spec registration + webServer env; **shared file, regression risk**)
- `e2e/helpers/seedWorkBrief.ts` (new)
- `e2e/work-onboarding.spec.ts` (new)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (agnostic-purity, fixture drift, entry-step branches, resume) · `npx playwright test e2e/work-onboarding.spec.ts` (fresh dev server) · `npm run lint`.

---

## Phase 3 — STEP 01 (real) + "What we understood" rail (agnostic UI + work adapter) + icons

**Goal:** one line seeds flow + `facts.work` + rail; serve gate stamps audience/template; the agnostic rail renders the work adapter's 4-field projection, persists edits (failure surfaced), and never wipes group photos/items — through renames, reorders, and adds.

**Steps:**
1. `JourneyEntryStep.tsx` real per handoff 1a (agnostic visuals): radial-gradient body, `rocket_launch` chip, display headline, 720px card with the one-liner prefilled (segmented "Describe your site"/"Use my current site" — second tab stub/disabled), coral CTA "Build my site". CTA: `seam.enrichDraftForConfirm` → `/api/brief/confirm` (mirror `ConfirmBriefStep` request/error handling) → serve ⇒ `window.location.assign(redirectTo)`; manual ⇒ `onManual(missing)`. Edited line ⇒ re-classify; non-seam result ⇒ `setStep('confirm')` with the fresh draft (decision 3 trade-offs stand; copy universal per ruling).
2. `UnderstoodRail.tsx` (AGNOSTIC — renders `RailVM` only): 312px fixed aside (steps 02–06), mono header "WHAT WE UNDERSTOOD" + "Tap anything to correct it", one block per `RailFieldVM` in order — skeleton = `opacity-50` + `bg-app-stripes` (E1: only PRICE POSITION can legitimately show it until STEP 03 collects a price), trailing `edit` affordance → inline input (thin, no dialog), footer "Something wrong?" free-text → `adapter.appendNote`. Chips = badge pill/status variants rendered from `{id, label}`; **chip edits submit `RailChipEdit[]` — each surviving chip keeps its `id` verbatim; new entries get NO id** (the UI never mints, reuses, or reorders ids on its own — it only carries them). Toasts from `@/components/ui/toast` (landmine 12). The rail knows NO field names — order/labels/kinds come from the adapter.
3. **Work adapter full** in `engines/work.ts`: `toVM` emits EXACTLY FOUR fields — NAME / WHAT YOU DO (descriptor) / WHAT YOU SELL (group chips + derived price labels) / PRICE POSITION (derived, read-only) — chips get `id='g'+index` from the group's position in `liveFacts.work.groups[]` at projection time (chip stable-id rule); `location`/`reach`/`languages` stay modelled-unrendered (founder ruling; generation still silently defaults `en` → P7 item g). `applyEdit` for `groups`: **joins edited chips ON id against `liveFacts.work.groups[]`** — id-matched group carries `photos`/`items`/`kind`/`price` through `WorkGroupInput` with only `name` updated; edited-array order = new order; id-less chip = new group (`kind:'category'`, on-request price); unreferenced live group = deleted; NEVER label-match, NEVER positional (decision 11 / landmine 15). NAME edit returns `fieldMirrors:[{fieldId:'name', value}]`.
4. **Adapter unit tests** `engines/work.test.ts`: 4-field VM shape + skeleton states + chip ids `g0..gN`; **regression (the wipe-one-layer-up test, concrete): over an E2-shaped bag (groups WITH `photos`/`items`), one `applyEdit` that RENAMES group A, REORDERS it, and ADDS a new group ⇒ `photos`/`items` intact on the RENAMED group, new group `kind`-valid with no photos, `getWorkFacts` non-null, `facts.entry` preserved in the emitted facts**; delete-by-omission drops the group; NAME mirror emitted; invalid edit ⇒ `{ok:false}`.
5. **Store wiring** in `useWizardStore.ts` (additive, engine-agnostic): `commitRail(result: RailCommit)` — ONE `set` updates `state.briefFacts` to `result.facts` + applies `fieldMirrors` → then `POST /api/saveDraft` with `save()`'s body shape (`{tokenId, stepIndex, brief: result.patch}` per decision 5), **checking `res.ok`; non-2xx/throw ⇒ REVERT + failure toast** (ruling, decision 5): snapshot pre-edit `briefFacts` + the mirrored `fields` BEFORE the optimistic `set`; on failure restore both in ONE `set` + toast "Couldn't save — reverted, try again". Never retain optimistic state on failure — generation reads `briefFacts`, so an unpersisted belief = silent divergence at STEP 05. Unlike `save()`, NOT fire-and-forget. Test: a mocked non-2xx `saveDraft` ⇒ `briefFacts` + `fields` identical to pre-edit, toast shown. `buildBriefPatch`'s collections-only `facts` guard left untouched (decision 5 — it's what keeps legacy autosave from clobbering rail facts).
6. Shell layout: rail + step body two-column from STEP 02 on.
7. Icons (landmine 11, once): append needed ligatures (`rocket_launch`, `edit_note`, `link`, `chat_bubble`, `progress_activity`, `check_circle`, `add_photo_alternate`, `tune`, `folder`, `language`, `close`, `arrow_forward`, `edit`, `check` — diff against current `icons.txt`), regenerate subset per `public/fonts/material-symbols-rounded/NOTICE`.
8. Unit: extend `JourneyEntryStep.test.tsx` — edited-line re-classify: non-seam result ⇒ `setStep('confirm')`; serve/manual branches still green with real UI.
9. e2e additions (seeded-resume): rail shows fixture-seeded name + descriptor + group chips; edit a rail field → reload → persisted AND `facts.entry` survives (landmine 4); rename a group chip → reload → renamed group still `kind`-valid (id-join sanity at the e2e layer); two consecutive edits both survive reload (lost-update guard); note round-trips; `loadDraft` still ⇒ service/atelier/work.

**Files touched:**
- `src/components/onboarding/journey/JourneyEntryStep.tsx` (edit)
- `src/components/onboarding/journey/JourneyEntryStep.test.tsx` (edit)
- `src/components/onboarding/journey/UnderstoodRail.tsx` (new — agnostic)
- `src/components/onboarding/journey/JourneyShell.tsx` (edit — rail layout)
- `src/components/onboarding/journey/engines/work.ts` (edit — full rail adapter incl. chip-id join)
- `src/components/onboarding/journey/engines/work.test.ts` (new)
- `src/hooks/useWizardStore.ts` (edit — `commitRail`; **shared file, regression risk**)
- `public/fonts/material-symbols-rounded/icons.txt` (edit)
- `public/fonts/material-symbols-rounded/` regenerated subset artifact(s) per NOTICE (edit)
- `e2e/work-onboarding.spec.ts` (edit)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (rename+reorder+add photos/items regression + entry-step = STEP 01's gate) · `npx playwright test e2e/work-onboarding.spec.ts` · `npm run lint`.

---

## Phase 4 — Thin steps 02 / 03 / 04 (agnostic frames + work seam content)

**Goal:** journey completes through STEP 04 with just enough data for generation defaults. NO gold-plating — depth is E2/E3/E4.

**Steps:**
1. `StepShowWork.tsx` (02, agnostic frame): renders `seam.steps.showWork` (title/body/icon) as a dropzone-styled stub (`image-placeholder` primitive) + "Skip for now" (E1 renders the content as a stub — an implementation choice, not a contract field). Work content: portfolio-images copy, `add_photo_alternate`. No upload pipeline, no scrape.
2. `StepQuestions.tsx` (03, agnostic renderer for the 3 question kinds — closed set per ruling): renders `seam.steps.questions(vm)`; each answer calls the question's `commit` → `commitRail` (rail visibly fills — the journey's core promise). Work questions (in `engines/work.ts`): name (prefilled; asked only if empty), "what do you sell" (one group; only if seed produced none — commit routes through the adapter ⇒ `{name, kind:'category', price:…}`, never `kind`-less), optional price (segmented exact/from/on-request, default on-request — landmine 6).
3. `StepPlan.tsx` (04, agnostic): calls `seam.steps.plan.prepare(wizardApi)` once, renders `items()` as simple cards + "Build my site" CTA → STEP 05. Work `prepare` = the EXISTING chargeless work sitemap seeding (`fetchStrategy` work+multipage branch, `useWizardStore.ts:1094-1113`, behind the `strategyStatus` guard — never the charged path; landmine 8). Implementer notes stand: `state.strategy` stays NULL by design; thin steps never set `goalIntent` ⇒ finalize with `briefGoal=null`, accepted. No tap powers (add/rename/reorder = E4).
4. e2e (seeded-resume): journey 02→04 — 03 answers appear in the rail; a STEP 03 group answer round-trips through `loadDraft` with `kind:'category'`; 04 lists ≥1 page; back-nav across 02–04 doesn't duplicate sitemap seeding.
5. Unit: extend `engines/work.test.ts` for `questions()` ask-if logic; `rail.test.ts` only if a new rail action shape is needed (avoid churn).

**Files touched:**
- `src/components/onboarding/journey/steps/StepShowWork.tsx` (edit)
- `src/components/onboarding/journey/steps/StepQuestions.tsx` (edit)
- `src/components/onboarding/journey/steps/StepPlan.tsx` (edit)
- `src/components/onboarding/journey/engines/types.ts` (edit — only if question-kind shape needs adjusting)
- `src/components/onboarding/journey/engines/work.ts` (edit — showWork copy, questions, plan prepare/items)
- `src/components/onboarding/journey/engines/work.test.ts` (edit)
- `src/hooks/useWizardStore.ts` (edit — ONLY if the sitemap seed needs a shell-callable wrapper; otherwise untouched; **shared file, regression risk**)
- `src/modules/wizard/work/rail.test.ts` (edit — only if needed)
- `e2e/work-onboarding.spec.ts` (edit)

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npx playwright test e2e/work-onboarding.spec.ts` · `npm run lint`.

---

## Phase 5 — STEP 05: we write and build it (seam-driven generation)

**Goal:** STEP 05 drives generation end-to-end through the seam, with honest progress + explicit failure states. Honest scope: there is no generic generation driver — the work seam OWNS the drive; the agnostic step owns only the UI + state routing.

**Steps:**
1. ⟳ **Kill-switch relocation (BLOCKER-1 fix; follow the `isWorkCopyTemplate` precedent, don't invent):** MOVE `workCopyEngineEnabled` from `src/modules/wizard/generation/work.llm.ts:67` into the leaf `src/lib/workCopyEngine.ts` (it reads `process.env.NEXT_PUBLIC_WORK_COPY_ENGINE` + `isWorkCopyTemplate` — zero-dep, leaf-safe), and **re-export it from `work.llm.ts`** exactly as `isWorkCopyTemplate` already is (`work.llm.ts:57`) so all generation callers keep their import surface. Do NOT re-implement the env check inside the seam — one kill-switch source, ever. Move/extend its coverage in `src/lib/workCopyEngine.test.ts` (flag off ⇒ false; flag on + atelier ⇒ true; flag on + granth ⇒ false).
2. `engines/work.ts` — fill `preflight` (SYNC, statically importing `workCopyEngineEnabled` from `@/lib/workCopyEngine` — firewall-clean per step 1) + `runGeneration`: preflight (a) `workCopyEngineEnabled(templateId)` FALSE ⇒ `{ok:false, reason:'engine-disabled'}` (landmine 2 — near-unreachable given dispatch eligibility; keep the guard); (b) `getWorkFacts(brief-from-live-briefFacts)` null ⇒ `{ok:false, reason:'missing-facts'}`. `runGeneration`: lazy-import `buildWorkInput` + `runWorkLLMGeneration` at call time → run verbatim (saveDraft-before-copy, per-page persistence, resume, MANDATORY `finalizeMultiPageGeneration` all come free — landmine 7); map credits-402 and errors to distinct `{ok:false}` kinds.
3. `StepBuilding.tsx` (agnostic): on entry, `seam.preflight` — `engine-disabled` ⇒ explicit error state (never silent skeleton); `missing-facts` ⇒ send back to STEP 03 with a message. Then `seam.runGeneration(state, {onStage, onPageProgress})`; success ⇒ `journeyStep=6` (NO `router.push` — the reveal owns forward motion). UI per handoff LEFT PANEL ONLY (dark `#0b1830` honest-progress: eyebrow, display line, progress bar, per-page checklist) — full-width; NO feel picker. Top bar right slot = "Building…" + spinning `progress_activity`.
4. Resume: extend `resolveResumeStep` (work) — `isResumableGeneration(loaded)` ⇒ 5 (driver resumes mid-fan-out); finished finalContent ⇒ 6. Lazy-import inside the fn. Update test.
5. Env: `NEXT_PUBLIC_WORK_COPY_ENGINE=true` + mock mode already in `playwright.config.ts` webServer env (P2b). Both build-time inlined + `reuseExistingServer:!CI` ⇒ **kill/restart the dev server before this phase's e2e run.**
6. e2e (seeded-resume — the fixture's persisted `facts.work` is what makes mock work generation runnable): 02→05 with mock generation completes → STEP 06 state; `loadDraft` after completion has `finalContent` (finalize marker cleared).
7. ⟳ `work.llm.ts` is a **REAL edit this phase — re-export-only** (step 1). Expect it in the audit as such, NOT as a deviation; anything beyond the re-export IS a deviation.

**Files touched:**
- `src/components/onboarding/journey/steps/StepBuilding.tsx` (edit)
- `src/components/onboarding/journey/JourneyTopBar.tsx` (edit — building status slot)
- `src/components/onboarding/journey/engines/work.ts` (edit — preflight + runGeneration)
- `src/components/onboarding/journey/engines/work.test.ts` (edit — preflight branches)
- `src/lib/workCopyEngine.ts` (edit — receive `workCopyEngineEnabled`; **shared file, regression risk: editor story-panel gate imports it**)
- `src/lib/workCopyEngine.test.ts` (edit — `workCopyEngineEnabled` coverage at its new home)
- `src/modules/wizard/generation/work.llm.ts` (edit — RE-EXPORT-ONLY, per step 1; **shared file, regression risk**)
- `src/modules/wizard/work/resumeStep.ts` (edit)
- `src/modules/wizard/work/resumeStep.test.ts` (edit)
- `e2e/work-onboarding.spec.ts` (edit)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (incl. `work.llm.test.ts` untouched-and-green — proves the re-export preserved the generation callers) · `npx playwright test e2e/work-onboarding.spec.ts` (mock generation, fresh server) · `npm run lint`.

---

## Phase 6 — STEP 06: the reveal → editor handoff (fully agnostic)

**Goal:** the magic moment — real generated site revealed, isolated from app chrome, one forward path into the editor, NO publish surface. This step is engine-free (token-based) — engine #2 inherits it verbatim.

**Steps:**
1. Preview chrome-suppress (decision 6): `src/app/preview/[token]/page.tsx` gains `chrome=0` — when set, render ONLY `LandingPageRenderer`; action bar (Publish/Custom Domain/Back to Edit, `page.tsx:457-534`), SlugModal, domain modal not rendered (absent from the tree, not hidden). Default behavior byte-identical. ⟳ **Mechanism (pinned, no fallback):** the page is one `"use client"` component with NO `useSearchParams`/Suspense today — read the param via `useSearchParams` in a small child component wrapped in `<Suspense fallback={null}>` per the `src/app/dashboard/billing/page.tsx:155` precedent. Do NOT read `window.location.search` in an effect — that first-paints the action bar inside the reveal iframe before removing it. Run local `npm run build` in THIS phase.
2. `StepReveal.tsx`: `<iframe src="/preview/{token}?chrome=0">` full-size scrollable — separate document ⇒ `.app-chrome` can never leak (landmine 1; verify no non-iframe site rendering anywhere in the shell). Desktop/phone segmented toggle (phone = constrained iframe width). Primary CTA "Open the editor" → `router.push('/edit/{token}')`. NO publish action. Loading state until iframe loads.
3. Top bar on 06 per handoff (`#f7f8fa` body, "Save & exit" → `/dashboard`).
4. e2e — FULL-JOURNEY assertion (seeded-resume; real 01→02 entry = P7 founder QA): seed → 02→06 → iframe visible with generated content (mock copy marker) → ⟳ iframe document contains **NO Publish control in the DOM (count = 0 / not-attached — not merely invisible)**; site content only inside the iframe → "Open the editor" → `/edit/{token}` loads editable; `loadDraft` asserts `audienceType:'service'` + `templateId:'atelier'` + `brief.copyEngine:'work'` throughout.

**Files touched:**
- `src/app/preview/[token]/page.tsx` (edit — `chrome=0` via Suspense-wrapped `useSearchParams` child; **shared file, regression risk: default preview unchanged**)
- `src/components/onboarding/journey/steps/StepReveal.tsx` (edit)
- `src/components/onboarding/journey/JourneyTopBar.tsx` (edit — step-06 variant polish)
- `src/modules/wizard/work/resumeStep.ts` (edit — finished ⇒ 6, if not fully landed in P5)
- `e2e/work-onboarding.spec.ts` (edit — full-journey spec)

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npx playwright test e2e/work-onboarding.spec.ts` · `npm run lint` · **`npm run build` (Suspense/useSearchParams safety — don't defer to P7)** · manual: `/preview/{token}` WITHOUT the param still shows the normal action bar, no flash with it.

---

## Phase 7 — Gates sweep + founder QA

**Goal:** green everything; prove isolation + shell agnosticism; human sign-off on the handoff.

**Steps:**
1. Full sweep: `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · **fresh** `npm run build` (published.css sha vs fixture only valid against a fresh artifact — landmine 10).
2. Isolation guards: `tailwindConfigFreeze.test.ts` green (NO tailwind keys added); `npx playwright test e2e/ui-isolation.spec.ts` green; fixture `e2e/fixtures/ui-isolation-computed-styles.json` NOT regenerated. Agnostic-purity (import assertion + literal tripwire) + registry/leaf drift guards green.
3. Full e2e suite `npm run test:e2e` (work-onboarding + dispatch + legacy-unchanged + ui-isolation) — fresh server.
4. Founder QA checklist: (a) **real STEP 01 entry (real-LLM, flag ON, mock OFF — the path automation CANNOT cover):** work-shaped one-liner (Kundius-style photographer) classifies to work → `JourneyEntryStep` renders → confirm serves → shell mounts at STEP 02 with correctly seeded rail; spot-check the manual verdict path + one edited-line re-classify (1 UNDERSTAND credit; no `applyBusinessTypeCorrection` — decision 3 trade-off); (b) full journey 01→06: reveal quality, rail correctness/correctability — **include one group RENAME on a project with photos, verify photos survive** (the landmine-15 scenario, live); (c) reveal→editor: site opens EDITABLE, edits save, template `atelier` + audience `service`; (d) **founder decides `NEXT_PUBLIC_WORK_COPY_ENGINE` prod/Vercel state at the merge gate** (build-time inlined; flip = redeploy — landmine 2); (e) legacy thing/trust onboarding spot-check + **granth/writer path lands on `WizardShell` post-confirm** (pre-confirm STEP 01 visual for granth drafts = accepted decision-2 cosmetic); (f) `/preview/{token}` default (no param) unchanged; (g) **language assumption:** rail deliberately does NOT render LANGUAGES in E1 (no source), generation silently defaults to `en` (`slimStrategy.ts` — `languages[0] ?? 'en'`) — a Dutch/NL business (Kundius) gets English copy silently; closing = E2/E3 (ingestion → location + site → language inference); flag if pilot-blocking; (h) ⟲ **seam sanity:** founder eyeballs `engines/work.ts` as "the thing engine #2 clones" — confirm nothing in `journey/` root would need touching for a second engine (the inherit list above).
5. Fixes arising ONLY in files already listed in P1–P6.

**Files touched:**
- (fix-only; limited to files already in P1–P6 lists)

**Verification:** all green gates above.

**HUMAN GATE — reveal → editor handoff (founder QA).** A generated work site opens editable from STEP 06; the REAL classify→STEP 01 entry is verified here; prod flag decision made by the founder; seam-inheritance sanity confirmed. Merge to main is the usual separate human gate.

---

## Green gates (every phase where code changes)

`npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` (P6 + P7 mandatory; earlier phases at implementer discretion when styling/assets change). Playwright needs a FRESH dev server whenever env flags changed (`reuseExistingServer:!CI`).

## Unresolved questions

None — `commitRail` save-failure UX RULED (decision 5): **revert + toast**, never keep optimistic state.
