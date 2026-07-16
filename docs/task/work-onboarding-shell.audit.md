# work-onboarding-shell — implementation audit

## Phase 1 — Rail data model + entry→work seed + brief plumbing (pure, no UI)

### Files changed

- `src/lib/schemas/workFacts.schema.ts` (edit — additive-optional only)
- `src/modules/wizard/work/rail.ts` (new)
- `src/modules/wizard/work/rail.test.ts` (new)
- `docs/task/work-onboarding-shell.audit.md` (new — this file)

Nothing else. No new deps. No React/store/network in the module (pure, per plan).

---

### 1. `src/lib/schemas/workFacts.schema.ts`

Two strictly additive-optional fields:

```ts
identity: z.object({
  name: z.string(),               // UNCHANGED — REQUIRED inside identity
  location: z.string().optional(),
  reach: z.string().optional(),
  descriptor: z.string().optional(),   // NEW — "WHAT YOU DO"
}).optional(),
…
userNotes: z.array(z.string()).optional(),   // NEW — "Something wrong?" log
```

Both are `.optional()` ⇒ every pre-existing facts bag parses exactly as before. Proven by test, not assertion: `getWorkFacts` non-null for a bag that OMITS both and for one that INCLUDES both. Full suite (incl. `work.llm.test.ts`, `workContract.test.ts`, `copyPrompt.factsLaw.test.ts`, generation-contract fixtures) green ⇒ the addition is inert for work generation.

### 2. `src/modules/wizard/work/rail.ts` — the shape the founder is signing off

```ts
export interface WorkRailGroup {
  name: string;
  kind: 'category' | 'story';
  price: WorkPrice;          // {mode:'exact'|'from'|'on-request', amount?, currency?}
  priceLabel: string;        // "On request" | "From EUR 500" | "1200"
}

export interface WorkRail {
  name: string | null;             // facts.work.identity.name        (STORED)
  descriptor: string | null;       // facts.work.identity.descriptor  (STORED, new)
  location: string | null;         // facts.work.identity.location    (STORED)
  reach: string | null;            // facts.work.identity.reach       (STORED)
  groups: WorkRailGroup[];         // facts.work.groups[]             (STORED)
  pricePosition: PricePosition | null;  // *** DERIVED, NEVER STORED ***
  languages: string[];             // facts.work.languages[]          (STORED)
  // carried (modelled now, not all rendered in E1 — generation branches on them)
  establishment: 'new' | 'established' | null;
  dreamClient: string | null;
  praise: string[];
  contactMethod: 'whatsapp' | 'booking' | 'form' | null;
  userNotes: string[];             // facts.work.userNotes[]          (STORED, new)
}
```

`null` / `[]` = **unknown** ⇒ the skeleton (opacity-50 + stripes) state in P3's UI. The rail is recomputed from `facts.work` on every read — no parallel store, nothing to drift.

Exports: `railFromBrief` / `railFromFacts` / `railFromWorkFacts` (projection) · `deriveRailPricePosition` · `seedWorkFactsFromEntry` · `normalizeWorkGroup` · `applyRailEdit` · `appendUserNote` · `workFactsToBriefPatch`.

#### Seed mapping — concrete before/after (this is the gate item)

BEFORE — `facts.entry` as classify writes it (excerpt):

```json
{ "businessName": "Kundius Studio",
  "summary": "Documentary wedding photography",
  "categories": ["photography", "weddings"],
  "offerings": ["Wedding day coverage", "Engagement session"] }
```

AFTER — `seedWorkFactsFromEntry(entry)` ⇒ `facts.work`:

```json
{ "identity": { "name": "Kundius Studio",
                "descriptor": "Documentary wedding photography" },
  "groups": [
    { "name": "Wedding day coverage", "kind": "category", "price": { "mode": "on-request" } },
    { "name": "Engagement session",   "kind": "category", "price": { "mode": "on-request" } }
  ] }
```

Rules baked in:
- `businessName → identity.name`. **Empty/missing businessName ⇒ `identity` is OMITTED ENTIRELY** — never `{name: undefined}`, which fails parse and nulls `getWorkFacts` (same failure class as the `kind` bug). Tested.
- `summary` → `descriptor`; **falls back to `categories.join(', ')`** when summary is absent.
- `offerings[]` → one group each, always `{name, kind:'category', price:{mode:'on-request'}}`. `'category'` because entry offerings are service/category names; `'story'` is the case-study shape (client/problem/result) the seed has no data for.
- Defensive: `getEntryFacts` is a **raw cast, not a safeParse**, so garbage/sparse input can arrive. Non-string/junk values are dropped; nothing worth seeding ⇒ returns `null` (caller omits `facts.work`). Output is `safeParse`d before return ⇒ **it always passes `getWorkFacts`, or is null**.

#### Derived vs stored

- **Derived, never stored:** `pricePosition`, `priceLabel`. `deriveRailPricePosition` returns `null` (unknown ⇒ skeleton) when there are no groups, and otherwise delegates to the existing canonical `derivePricePosition` (`src/modules/audience/work/pricePosition.ts`) — the rubric is not re-implemented here. A test asserts no `pricePosition` key ever appears in an emitted facts bag.
- **Stored:** everything else, all inside `facts.work`.

#### Write side (hard rules)

- **Full-facts re-emit (landmine 4):** `applyRailEdit`/`appendUserNote` return `patch = { facts: {...liveFacts, work: nextWork} }` — never a partial `facts`. `facts.entry` / `facts.collections` survive; tested.
- **Snapshot sync (reviewer #6):** the result is `{ok:true, patch, facts}` where `patch.facts === facts` (same object) so P3's store action can `saveDraft` and set `state.briefFacts` in ONE `set`. Tested: two consecutive edits both survive when the merged bag is fed back.
- **Client-side zod pre-validate (landmine 5):** every emission is checked against `WorkFactsSchema` **and** `BriefSchema.partial()` (the exact schema `saveDraft` uses before it silently 200s and drops the write). Invalid ⇒ `{ok:false, error}`, nothing sent.
- **Group validity (landmine 6):** `normalizeWorkGroup` gives every group `kind` (`'category'` default) and a valid price (`on-request` unless a finite amount is supplied for `exact`/`from` — `{mode:'exact'}` with no amount would fail `WorkPriceSchema`'s refinement, so it degrades to `on-request`). Unnameable groups return `null` and are never emitted. Regression guard asserts a `kind`-less group nulls `getWorkFacts` while everything we emit does not.

### 3. `src/modules/wizard/work/rail.test.ts`

27 tests: seed mapping · seed regression (`kind`/price/`getWorkFacts` non-null) · descriptor fallback · **identity-omitted-when-nameless** · garbage/sparse entry · additive-optional proof (omit AND include) · projection round-trip + all-unknown + carried fields · price-position unknown/derived/never-persisted · group normalization · sibling preservation · consecutive-edit lost-update guard · invalid-edit rejection · empty-facts-bag path · languages round-trip · note append.

---

### Deviations from the plan (2, both conservative)

1. **`derivePricePosition` → exported as `deriveRailPricePosition`.** The plan named the rail export `derivePricePosition(facts)`, but that name is already the canonical band-rubric export in `src/modules/audience/work/pricePosition.ts`. Duplicating the name (and the rubric) invites drift. The rail wrapper adds only the unknown case (`null` when no groups — the canonical one defaults to `'middle'`, which would render a confident band over zero evidence) and delegates otherwise.
2. **Descriptor uses `summary` with a `categories` FALLBACK, not a concatenation.** The plan says "`summary` (+ `categories` when present)". Concatenating produces awkward rail text ("Documentary wedding photography · photography, weddings"). Chosen: `summary ?? categories.join(', ')`. Easy to flip in P3 if the founder prefers the combined string.

Also noted: the test run rewrote `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` with CRLF line endings (no content change). Since that file is outside this phase's scope, it was restored with `git checkout --` on that path only. No other git state changed; no commits.

### Test results

- `npx tsc --noEmit` — clean except one **pre-existing, unrelated** error: `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (the file exists; missing image type decl — untouched by this phase).
- `npm run test:run` — **195 files passed / 1 skipped; 3370 tests passed / 18 skipped**. Includes the new 27 rail tests and all existing work generation/schema tests (`work.llm.test.ts`, `workContract.test.ts`, `copyPrompt.factsLaw.test.ts`, `pricePosition.test.ts`, generation-contract fixtures) ⇒ the schema addition is inert.
- `npx eslint` on the three touched files — clean.

### For the founder at the phase-1 gate

- Sign-off asks: (a) the two new optional fields `identity.descriptor` + `userNotes`; (b) the seed mapping incl. the `kind:'category'` default and on-request price; (c) price-position as derived-never-stored with `null` = unknown/skeleton; (d) the descriptor fallback deviation above.
- **Pre-E1 work projects have no `facts.work`** and are not back-seeded (plan ruling). They resume into STEP 03, whose rail actions emit `kind`-valid groups. No dead end.
- **`languages` is never seeded** — entry facts carry no language signal. It renders as unknown/skeleton until E3 asks. Deliberate.
- Rail edits are refused (not silently dropped) when there is no name yet — `identity.name` is required by the schema, so a descriptor/location edit before a name has nowhere to hang. P3's UI prefills name from the seed, so this should be rare; the error surfaces via `{ok:false, error}`.
- Open risk: nothing yet CALLS this module. The seed only takes effect when P3 wires `WorkEntryStep`'s confirm to it; until then `facts.work` stays unwritten for new work briefs.

---

# Phase 1 amendment — widen the group seam (photos/items)

**Files changed**
- `src/modules/wizard/work/rail.ts`
- `src/modules/wizard/work/rail.test.ts`
- `docs/task/work-onboarding-shell.audit.md`

## Why (founder ruling at the phase-1 human gate)

Impl-review found a latent data-loss seam: `WorkGroupSchema` carries optional `photos`/`items`, but `WorkGroupInput` did not and `normalizeWorkGroup` RECONSTRUCTED every group as `{name, kind, price}` — dropping them. Since `applyRailEdit({field:'groups'})` replaces the whole `groups` array, any rail group edit would silently wipe E2-ingested photos once E2 lands. Founder ruled: **widen the seam now** (E2 is the next slice) rather than ship a known wipe.

## What changed

`rail.ts`
- `WorkGroupInput` gains `photos?: WorkGroup['photos']` and `items?: WorkGroup['items']` — typed off `WorkGroupSchema`'s inferred type, never re-declared, schema untouched.
- `normalizeWorkGroup` now CARRIES `photos`/`items` verbatim when supplied instead of reconstructing without them. Absent keys stay absent (no `{photos: undefined}` in persisted facts).
- Doc comments record that these are carried-not-authored (E2 owns them) and that a malformed value fails `WorkFactsSchema` at emit ⇒ `{ok:false}` — same never-persist-garbage rule as the rest of the module.
- All phase-1 invariants preserved unchanged: `kind` always set (`category` default, `story` honoured), price always valid (`on-request` default; `exact`/`from` degrade to `on-request` without a valid amount), unnameable group ⇒ `null`, output always passes `getWorkFacts`.

`rail.test.ts` (+2 tests, all existing kept)
- `normalizeWorkGroup` preserves photos/items and the result parses; absent keys stay absent.
- Full `applyRailEdit({field:'groups'})` round-trip over a live E2-shaped bag: photos/items intact, price edit applied, `getWorkFacts` non-null, `facts.entry` sibling preserved.

## Deviations
- None from the instruction. One judgment call (conservative option taken): `applyRailEdit` does NOT auto-merge photos from the current facts by group name when an input omits them — that would be inventing merge semantics beyond the phase. The seam is now WIDE (callers *can* pass them through); making P3's rail UI actually round-trip them is a P3 obligation (see risk below).

## Open risks
- `WorkRailGroup` (the read-side projection) still exposes only `{name, kind, price, priceLabel}`. A P3 UI that rebuilds `WorkGroupInput[]` **from the projection** would drop photos/items again. P3 must build group edits from `facts.work.groups[]` (or the projection must be widened then). Flagged for P3/E2.

## Note for later — rail fields modelled but not rendered in E1 (founder ruling, context only)
The E1 rail renders only **NAME / WHAT YOU DO / WHAT YOU SELL / PRICE POSITION**. `location`, `reach` and `languages` stay **MODELLED but UNRENDERED** until E2/E3 give them a source (entry facts carry no location; nothing infers language in E1). **The rail model KEEPS those fields — no removal.** This is a phase-3 RENDER decision, not a model change: their absence from the E1 rail UI is deliberate, not an oversight.

## Verification
- `npx tsc --noEmit` — clean except the one pre-existing unrelated error (`src/app/page.tsx` missing `founder.jpg` type decl), untouched.
- `npm run test:run` — **195 files passed / 1 skipped; 3372 tests passed / 18 skipped**. Green.

---

## Phase 2a — Seam contract + registry + leaf + work seam skeleton + drift guard

### Files changed

- `src/components/onboarding/journey/engines/types.ts` (new — THE CONTRACT)
- `src/components/onboarding/journey/engines/registry.ts` (new)
- `src/components/onboarding/journey/engines/registry.test.ts` (new — drift guard + eligibility table)
- `src/components/onboarding/journey/engines/work.ts` (new — the work seam skeleton)
- `src/lib/journeyEngines.ts` (new — the eligibility leaf)
- `docs/task/work-onboarding-shell.audit.md` (this append)

Nothing else. No new deps. No UI, no store slice, no dispatch, no e2e (all P2b).

---

### THE CONTRACT AS SHIPPED (`engines/types.ts`) — what the gate is signing

```ts
// ── Rail view-model the AGNOSTIC UnderstoodRail renders ────────────────────
interface RailFieldVM {
  id: string;                                 // seam-defined stable field id
  label: string;                              // mono header ("WHAT YOU SELL")
  kind: 'text' | 'chips' | 'derived';
  value: string | null;                       // text/derived; null = unknown
  chips?: { id: string; label: string }[];    // chips — id is SEAM-ISSUED
  skeleton: boolean;                          // true = UNKNOWN (stripes), not ""
  editable: boolean;
}
interface RailVM { fields: RailFieldVM[] }    // ORDER = render order

// ── The only handle that survives rename + reorder ─────────────────────────
type RailChipEdit = { id?: string; label: string };   // absent id = NEW entry
type RailEditValue =
  | { kind: 'text';  value: string }
  | { kind: 'chips'; value: RailChipEdit[] };

// ── Every rail write returns a commit the agnostic store applies atomically ─
type RailCommit =
  | { ok: true;
      patch: Partial<Brief>;                  // FULL-facts re-emit (landmine 4)
      facts: NonNullable<Brief['facts']>;     // SAME bag → same-`set` snapshot sync
      fieldMirrors?: { fieldId: string; value: string }[] }   // work NAME → fields['name']
  | { ok: false; error: string };             // zod pre-validate failed → surfaced, never sent

interface JourneyRailAdapter {
  toVM(facts: Brief['facts']): RailVM;
  applyEdit(fieldId: string, value: RailEditValue, liveFacts: Brief['facts']): RailCommit;
  appendNote(note: string, liveFacts: Brief['facts']): RailCommit;
}

// ── STEP 03 question descriptors — CLOSED at 3 kinds for E1 ────────────────
type JourneyQuestion =
  | { id: string; kind: 'text';  label: string; prefill?: string;
      commit(value: string, liveFacts: Brief['facts']): RailCommit }
  | { id: string; kind: 'group'; label: string;
      commit(name: string, liveFacts: Brief['facts']): RailCommit }
  | { id: string; kind: 'price'; label: string;
      commit(price: { mode: 'exact'|'from'|'on-request'; amount?: number },
             liveFacts: Brief['facts']): RailCommit };

// ── The seam ───────────────────────────────────────────────────────────────
interface JourneyEngineSeam {
  engine: CopyEngine;
  rail: JourneyRailAdapter;
  enrichDraftForConfirm(draft: Brief): Brief;                 // 01, pre-confirm; pure
  steps: {
    showWork: { title: string; body: string; icon: string };  // 02 — content only
    questions(vm: RailVM): JourneyQuestion[];                 // 03 — only what's still needed
    plan: { prepare(wizardApi: JourneyWizardApi): Promise<void>;      // 04
            items(state: JourneyWizardState): { title: string }[] };
  };
  preflight(state: JourneyWizardState): JourneyPreflightResult;        // 05 — SYNC
  runGeneration(state: JourneyWizardState,
                cb: JourneyGenerationCallbacks): Promise<JourneyGenerationResult>;
  resolveResumeStep(loaded: JourneyLoadedDraft): Promise<JourneyStep>; // 2|3|4|5|6
}

type JourneyPreflightResult =
  | { ok: true } | { ok: false; reason: 'engine-disabled' | 'missing-facts'; message: string };
type JourneyGenerationResult =
  | { ok: true } | { ok: false; kind: 'credits' | 'error'; message: string };
type JourneyStep = 2 | 3 | 4 | 5 | 6;   // STEP 01 is never resumed (pre-confirm, entry-page-owned)
```

Support types (see Deviations — these replace three names the plan sketch used that do not exist in the codebase):

```ts
type JourneyWizardState = WizardStore;                          // store snapshot (state & actions)
interface JourneyWizardApi { getState(): JourneyWizardState }   // live handle for plan.prepare
interface JourneyLoadedDraft { brief?, audienceType?, templateId?, finalContent?: unknown }
type JourneyGenerationStage = 'strategy' | 'copy' | 'saving' | 'done';
interface JourneyGenerationCallbacks { onStage?, onPageProgress? }
```

**The MANDATORY chip-id doc comment sits on `RailChipEdit` (cross-referenced from `toVM` + `applyEdit`), with the required intent verbatim:** *"Chip ids are valid ONLY against the facts bag they were projected from. The shell MUST pass the current `briefFacts` as `liveFacts`, and MUST NOT carry a chip array across a commit."* It also records the full join semantics (id ⇒ live entry carrying its unprojected data through, no id ⇒ new entry, unreferenced live entry ⇒ deleted, edited array order ⇒ new order), why ids exist at all (the chip projection is LOSSY and a groups edit REPLACES the array), and that the contract only requires "stable within a projection" so engine #2 may pick a different derivation. **No id field was added to `workFacts.schema.ts`.**

### What an engine #2 author must implement (also in the file header)

1. **A facts schema for its engine — THE REAL BLOCKER; none exists today** (only `workFacts.schema.ts`).
2. A rail adapter over it (its `rail.ts` equivalent) obeying the phase-1 hard rules: FULL-facts re-emit, zod pre-validate, `{patch, facts}` snapshot sync, chip-id join.
3. `enrichDraftForConfirm`.
4. Step content: `steps.showWork` copy, `steps.questions`, `steps.plan.prepare`/`items`.
5. `preflight` + `runGeneration` over ITS generation driver.
6. `resolveResumeStep`.
7. An entry in `JOURNEY_SEAM_ENGINES` **and** in `journeySeamRegistry` (the drift guard fails otherwise).
8. A template-eligibility predicate (work's `isWorkCopyTemplate` equivalent) wired into `isJourneyEligible`'s switch.

Inherited free: shell, top bar, dot progress, rail UI (skeleton/edit/notes), step frames 02–06, STEP 06 reveal verbatim, store slice + atomic `commitRail`, dispatch plumbing, e2e seeding pattern.

### What is honestly engine-shaped, and why — please read at the gate

- **STEP 05 generation (`preflight` / `runGeneration`) is work-shaped by necessity: there is no generic generation driver in this codebase.** `runWorkLLMGeneration` owns saveDraft-before-copy, per-page fan-out, resume, and the mandatory `finalizeMultiPageGeneration`. So the seam OWNS the drive and the agnostic StepBuilding owns only UI + state routing. Engine #2 supplies its own driver behind the same two functions. This is stated in the contract rather than papered over with a fake generic driver.
- **`resolveResumeStep` is likewise engine-owned** — resumability is a property of the driver's persisted shape, so `JourneyLoadedDraft.finalContent` is deliberately `unknown`.
- **The rail MODEL cannot be agnostic** (no thing/trust facts schema exists) — only the rail UI is. Hence VM-projection + per-engine adapter. thing/trust are DECLARED (contract exists; registry keys absent), not filled. No speculative seams or fact schemas were invented.
- `copyEngines` untouched: `['thing','trust','work']`. `place`/`quick-yes` stay reserved and out of the type; the registry being `Partial<Record<CopyEngine, …>>` means they cost nothing when the type widens.

### File-by-file

**`src/lib/journeyEngines.ts` (leaf).** Zero-dep besides `isWorkCopyTemplate` from the `@/lib/workCopyEngine` leaf (plus a type-only `CopyEngine`). Exports `JOURNEY_SEAM_ENGINES = ['work'] as const`, `hasJourneySeam` (a type guard), `isJourneyEligible(engine, templateId)` = seam exists AND the engine's template gate passes. This is the ONLY module the entry page imports for dispatch (P2b) — no seam/shell/generation code can reach the entry bundle through it. Doc records why the template half is structural, not a work hardcode (granth is work-engine but must stay on `WizardShell`).

**`engines/registry.ts`.** `Partial<Record<CopyEngine, () => Promise<JourneyEngineSeam>>>` with an async dynamic-import loader (`await import('./work')`), mirroring `src/modules/templates/registry.ts`. `loadJourneySeam(engine)` returns the seam or `null`. No static seam import anywhere; only the shell/entry step (themselves `ssr:false` dynamic) will call it.

**`engines/work.ts` (skeleton).** Module-top static imports are exactly `@/modules/wizard/work/rail` (pure), `@/types/brief` (type-only), `./types` (type-only). **No `@/modules/wizard/generation/*` and no `@/modules/generation/*`.** (`@/lib/workCopyEngine` is not imported yet — `preflight` is a stub until P5 relocates `workCopyEngineEnabled` into that leaf; it joins the allowed list then, as `resumeStep.ts` does in P2b.) Implemented for real: `enrichDraftForConfirm` (delegates to phase 1's `seedWorkFactsFromEntry` — seeding is never re-derived; full-facts re-emit; `null` seed ⇒ draft untouched, never an empty work bag) and the rail adapter. Stubbed, each with its fill-in phase named in the doc comment: `steps.showWork` copy, `questions() → []`, `plan.prepare` no-op / `items() → []`, `preflight → {ok:true}`, `runGeneration → {ok:false,kind:'error'}`, `resolveResumeStep → 2`. Nothing consumes them yet (no shell exists).

**`engines/registry.test.ts` (12 tests).** Drift guard: registry keys ⟺ `JOURNEY_SEAM_ENGINES`; every listed engine has a loader; every registered key is a real `CopyEngine`; E1 registers work only (thing/trust explicitly absent). `loadJourneySeam('work')` loads and satisfies the whole contract surface; thing/trust/null/undefined ⇒ `null`. Eligibility truth table: work+atelier ⇒ true; **work+granth ⇒ false**; work+lumen/unknown/null ⇒ false; thing/trust + any template ⇒ false; null engine ⇒ false.

### Deviations from the plan (all in-scope; conservative option taken, logged per protocol)

1. **Three type names in the plan's sketch do not exist in the codebase.** `WizardState` is NOT exported (`useWizardStore.ts:169` — only `WizardStore = WizardState & WizardActions` is); neither `WizardStoreApi` nor `LoadDraftResult` exists anywhere. Substituted, honestly named and documented: `JourneyWizardState = WizardStore` (the exported shape — a hand-copied narrowing would drift), `JourneyWizardApi { getState() }` (structural, so the contract needn't import zustand; the real store api satisfies it), `JourneyLoadedDraft` (structural — `/api/loadDraft` has no exported response type). Semantics unchanged.
2. **`GenerationStage` / `GenerationCallbacks` are RESTATED, not imported.** They live in `@/modules/wizard/generation/index.ts`; even a type-only import would put that path in `engines/`'s source (which the P2b purity guard scans) and would sit one careless `import type` → `import` away from landmine 14. Restated as `JourneyGenerationStage` / `JourneyGenerationCallbacks`, structurally identical, with the reason in a comment.
3. **`RailCommit.facts` is `NonNullable<Brief['facts']>`**, not `Brief['facts']` — the latter includes `undefined`, and a successful commit always has a bag. Still derived from the schema, never re-declared.
4. **`toVM` is NOT minimal.** The plan permitted a minimal `toVM` ("full 4-field mapping + chip-id join land P3"). I shipped the real 4-field projection (NAME / WHAT YOU DO / WHAT YOU SELL / PRICE POSITION, chip ids `g0..gN`) and the real chip-id join, because a skeleton that *lied* about chips (e.g. returning `{ok:false, error:'not implemented'}`) is the kind of placeholder that ships. **P3 still owns the rail UI, the seam wiring, and the mandated regression tests** (rename + reorder + add over an E2-shaped bag with photos/items) — no adapter unit tests were written this phase; `engines/work.test.ts` is a P3 file and was NOT created. `location`/`reach`/`languages` remain modelled-but-unrendered per the founder ruling.
5. **`stub: true` is absent from the contract** (per rev 5) — E1's "STEP 02 renders showWork as a stub" stays an implementation detail of P4's frame.

### Verification

- `npx tsc --noEmit` — clean except the one pre-existing unrelated error (`src/app/page.tsx` missing `founder.jpg` type decl), untouched.
- `npm run test:run` — **196 files passed / 1 skipped; 3384 tests passed / 18 skipped** (3372 → 3384: +12, all new drift-guard/eligibility tests). Green.
- `npm run lint` — no errors; zero warnings from any new file (pre-existing warnings elsewhere unchanged).

### Open risks / notes for the next phase

- `preflight` currently returns `{ok:true}` unconditionally. Harmless today (nothing calls it), but **P5 must fill it** — an `{ok:true}` preflight with the kill-switch OFF is exactly landmine 2 (silent empty reveal). Flagged in the file's doc comment.
- The firewall on `engines/work.ts` is currently guaranteed by review only; **the mechanical guard lands in P2b** (`journeyAgnostic.test.ts`, extended per rev-5 NB1 to cover `journey/engines/*.ts` + `resumeStep.ts`). Until it exists, a static generation import here would go undetected.
- The chip-id join's one hole is a STALE VM. Unreachable in E1, but **P3's `UnderstoodRail` must key/reset chip drafts on VM re-projection** — the contract states the rule; nothing enforces it mechanically.

### Phase 2a follow-up fixes (impl-review)

**Files changed**
- `src/components/onboarding/journey/engines/work.ts`
- `src/components/onboarding/journey/engines/registry.test.ts`
- `docs/task/work-onboarding-shell.audit.md`

**FIX 1 — `chipIndex` mis-join (`'g'` joined to `groups[0]`).** Review found the guard was `id.startsWith('g')` + `Number(id.slice(1))`; `Number('') === 0`, so a chip `{id:'g'}` returned index `0` and inherited `groups[0]`'s ENTIRE payload (price, photos, items) instead of becoming a NEW group — directly contradicting the semantics documented on `commitGroupChips` ("an id this bag never issued → a NEW entry"). Now `if (!id || !/^g\d+$/.test(id)) return null;`, which also closes the whitespace-coercion variants (`' 1'`, `'g 1'`, `' g1'`). Unreachable in E1 (`chipId()` only emits `g<int>`; the UI carries ids and never mints them), but this file is the artifact engine #2 clones. Doc comment on `chipIndex` now states the rule and the `Number('')` trap. **Contract semantics and the doc comment now match.**

**FIX 2 — `preflight` flipped fail-OPEN → fail-CLOSED.** It returned `{ok:true}` unconditionally as a P5 placeholder. That is the wrong default direction for landmine 2, whose failure mode is "flag off ⇒ silent skeleton ⇒ empty reveal": if P5 fills `runGeneration` and forgets `preflight`, an unconditional `{ok:true}` reproduces the landmine silently. Now returns `{ok:false, reason:'engine-disabled', message:'preflight not wired'}` — the exact `JourneyPreflightResult` false shape from `types.ts`. The doc comment still names **P5** as the phase that fills it with the real `workCopyEngineEnabled(templateId)` + `getWorkFacts` checks (one kill-switch source, from the `@/lib/workCopyEngine` leaf), and now also records why the placeholder fails closed. Nothing calls `preflight` today (no `StepBuilding` until P5), so this trades a silent-ship risk for a loud dev-time failure. This supersedes the "preflight returns `{ok:true}`" item under Phase 2a's *Open risks*.

**Test placement (judgment call, per instructions).** Both guards went into `registry.test.ts`, NOT a new `engines/work.test.ts` — P3 owns that file (mandated rename/reorder/add regression tests) and creating it here would collide. `chipIndex` is private, so it is exercised through the only public door, `seam.rail.applyEdit('groups', …)`, over an E2-shaped live bag (group 0 with `price.exact` + `photos`, group 1 with `price.from` + `items`). 11 new tests: `'g'`, `'g 1'`, `' g1'`, `'gx'`, `''`, `'g99'` (out of range), `'g-1'`, `'g1.0'` and an id-less chip ⇒ all become NEW groups (`kind:'category'`, on-request price, no inherited payload); `'g0'`/`'g1'` still join, carrying price+photos+items through a rename with the edited order winning; plus one test pinning `preflight` fail-closed. These are join-guard tests, not the rail-adapter coverage P3 owes.

**Verification** — all green:
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: **196 files passed / 1 skipped; 3395 tests passed / 18 skipped** (3384 → 3395: +11 new).
- `npm run lint`: no errors; zero warnings from the touched files.
- The known `core.autocrlf` churn on `uiFoundationIsolation.test.tsx.snap` (zero content change) was restored with `git checkout --` on that path only.

**Deviations** — none.

**Open risks** — unchanged from Phase 2a except the `preflight` item (now closed). P5 must replace the fail-closed placeholder with the real checks or STEP 05 will hard-fail by design.

---

## Phase 2b — Journey shell scaffold (agnostic) + dispatch + e2e registration

### Files changed

**New:**
- `src/components/onboarding/journey/JourneyShell.tsx`
- `src/components/onboarding/journey/JourneyTopBar.tsx`
- `src/components/onboarding/journey/JourneyEntryStep.tsx`
- `src/components/onboarding/journey/JourneyEntryStep.test.tsx`
- `src/components/onboarding/journey/journeyAgnostic.test.ts`
- `src/components/onboarding/journey/steps/JourneyStepPlaceholder.tsx` *(deviation 1)*
- `src/components/onboarding/journey/steps/StepShowWork.tsx`
- `src/components/onboarding/journey/steps/StepQuestions.tsx`
- `src/components/onboarding/journey/steps/StepPlan.tsx`
- `src/components/onboarding/journey/steps/StepBuilding.tsx`
- `src/components/onboarding/journey/steps/StepReveal.tsx`
- `src/modules/wizard/work/resumeStep.ts`
- `src/modules/wizard/work/resumeStep.test.ts`
- `src/modules/wizard/work/workBriefFixture.test.ts`
- `e2e/helpers/workBriefFixture.ts` *(deviation 2)*
- `e2e/helpers/seedWorkBrief.ts`
- `e2e/work-onboarding.spec.ts`

**Edited (shared — see "Shared-file edits" below):**
- `src/hooks/useWizardStore.ts`
- `src/app/onboarding/[token]/page.tsx`
- `playwright.config.ts`
- `src/components/onboarding/journey/engines/work.ts`
- `docs/task/work-onboarding-shell.audit.md` (this append)

**The seam contract (`engines/types.ts`) was NOT touched** — it is founder-signed and was consumed as-is. Nothing in it needed to change.

No new deps. No rail UI, no real STEP 01 visuals, no icon regen, no thin steps, no generation, no reveal (all P3+).

---

### What was built

**Agnostic shell.** `JourneyShell` mounts on the confirmed brief, hydrates `useWizardStore` exactly like `WizardShell` (one-shot `useEffect`, same clobber rule), resolves the seam via `loadJourneySeam(brief.copyEngine)`, then `seam.resolveResumeStep(...)` → `journeyStep`. Steps 02–06 are walkable with next/back. `JourneyTopBar` = the handoff's 58px bar rebuilt with real primitives (`Logo`, `AppIcon`, `app-*` tokens) — `support.js` was not ported. Step bodies are placeholders that name their landing phase.

**`.app-chrome` scope.** Attached on exactly two wrappers — `JourneyShell`'s and `JourneyEntryStep`'s own full-viewport roots. Never `<body>`, never around an editor canvas or a revealed site (STEP 06 will reveal through an iframe for precisely this reason). Both are app-shell wrappers the journey owns, per `src/components/ui/README.md` and the dashboard/auth precedent.

**Dispatch (post-confirm, template-gated).** Entry page imports **only** the leaf `@/lib/journeyEngines`; both shells are `next/dynamic` + `ssr:false`. Two full-viewport early returns placed **outside** the legacy `max-w-xl` card. **Granth verified**: eligibility is `isJourneyEligible(engine, templateId)`, so a work-engine granth project is `false` → falls to `setStep('wizard')` → `WizardShell`, unchanged. The pre-confirm branch keys on `hasJourneySeam` only (template unknown then) — the accepted, data-inert decision-2 cosmetic.

**Purity guard** (`journeyAgnostic.test.ts`, 9 tests) — **parses static import specifiers; does not grep raw source.** This mattered exactly as the review predicted: `engines/work.ts`'s header names the generation path in PROSE, and a text scan fails on its own documentation. Two halves, honestly weighted:
- *(a) import assertions (load-bearing)* — shell imports no `@/modules/wizard/work/**` and no generation graph; **rev-5 NB1**: neither `journey/engines/*.ts` nor `src/modules/wizard/work/resumeStep.ts` statically imports `@/modules/wizard/generation/**` or `@/modules/generation/**`.
- *(b) templateId literal tripwire (NOT a proof)* — quoted-form match only (a bare substring would fire on `lex` inside `flex`); the `'work'` string deliberately unscanned.

The matcher's own semantics are pinned by tests: a lazy `await import()` is legal, a prose mention does not fire, a real static import **does**, and multi-line / `export … from` clauses parse. It also asserts it found the files it claims to guard — a vacuous empty scan cannot pass.

**Proven non-vacuous, not just asserted:** I temporarily added a static `isResumableGeneration` import from `@/modules/generation/multiPageAssembly` to `resumeStep.ts`; the guard failed, naming the file and the fix ("use a LAZY await import(…)"). Reverted; guard green.

---

### Shared-file edits — each, and why it's safe

**`src/hooks/useWizardStore.ts` (shared: product/service/writer all use it).** Purely additive: `journeyStep: WizardJourneyStep` (state, init `2`), `setJourneyStep` (action), `selectJourneyStep` / `selectSetJourneyStep` (selectors), and the exported `WizardJourneyStep` union. **Untouched:** slot machine (`slots`/`currentSlot`/`goToSlot`/`nextSlot`/`prevSlot`), `hydrate`, `buildBriefPatch`, `save`, `fetchStrategy`, `reset`. Safety: a project renders EITHER `WizardShell` (slots) OR `JourneyShell` (journeyStep), never both, so the two machines cannot interact; nothing existing reads the new key. Full suite green proves the addition is inert.

**`src/app/onboarding/[token]/page.tsx` (shared entry).** Added the leaf import, two dynamic shells, `'journey'` to `EntryStep`, one ternary in load-detection (`journey ? 'journey' : 'wizard'`), and two early returns. Every legacy path is byte-equivalent: a non-eligible confirmed brief still sets `'wizard'`; the confirm branch only diverts when `hasJourneySeam`; `onManual` reuses the existing manual path verbatim. E2E asserts the legacy trust/agency path still reaches `WizardShell` with no journey chrome.

**`playwright.config.ts` (shared).** Registered `/work-onboarding\.spec\.ts/` in the **`authed`** project (an unregistered spec silently matches no project = false confidence) and added `NEXT_PUBLIC_WORK_COPY_ENGINE: 'true'` to `webServer.env`, with the `reuseExistingServer: !CI` stale-server trap documented inline. Existing projects/specs/env untouched.

**`src/components/onboarding/journey/engines/work.ts`.** Two changes only: static import of the pure `resumeStep.ts` (an explicitly allow-listed import, with the firewall reason in the comment) and `resolveResumeStep` delegating to it. Rail adapter, `enrichDraftForConfirm`, fail-closed `preflight` all untouched.

---

### Test results

- `npx tsc --noEmit` — **clean, no output.** (The `founder.jpg` error noted in earlier phases no longer appears.)
- `npm run test:run` — **200 files passed / 1 skipped; 3419 passed / 18 skipped** (3395 → 3419: +24 new — 9 purity/firewall, 6 fixture drift, 3 resume, 6 entry-step branches). Green.
- `npm run lint` — no errors; **zero warnings from any new/edited file** (pre-existing template `<img>` / ph-provider warnings unchanged).
- `npx playwright test e2e/work-onboarding.spec.ts` — **4 passed** (incl. the `setup` auth project) against a **FRESH dev server**. Ran fully, nothing skipped or faked:
  1. served work brief resumes the JOURNEY shell at STEP 02, not `WizardShell`; `loadDraft` ⇒ `audienceType:'service'` + `templateId:'atelier'` + `brief.copyEngine:'work'`;
  2. the step machine walks 02→06 and back (06 terminal, 02 floor);
  3. legacy unchanged — a trust/agency brief still reaches `WizardShell`, zero journey chrome.
- The known `core.autocrlf` churn on `uiFoundationIsolation.test.tsx.snap` (zero content change) was restored with `git checkout --` on that path only. No commits; no other git state changed.

**One environment note, stated plainly:** a dev server was already listening on **port 3000** and was NOT mine (it may serve another worktree). Killing it was not mine to do, and `reuseExistingServer: !CI` would have reused it *without* the new build-time-inlined env — the exact stale-server trap. I therefore ran the suite on a dedicated fresh server via `E2E_PORT=3123 PORT=3123`, the config's own supported toggle. The run is genuine; the only thing unverified is the default-port path, which differs by port number alone.

---

### Deviations from the plan (2, both in-scope; conservative option taken)

1. **`steps/JourneyStepPlaceholder.tsx` — one extra file, not on the Files-touched list.** The five step files are P2b placeholders by design; five hand-copied placeholder bodies would be five things to delete in P4/P5/P6. Extracted into one shared scaffold component inside `steps/` (already an in-scope directory). It is explicitly labelled P2b scaffolding and carries the `data-testid` + `data-journey-step` the e2e asserts. Zero behavioural surface.
2. **`e2e/helpers/workBriefFixture.ts` split out of `seedWorkBrief.ts`.** Pre-authorised by the instruction, and required in practice: `seedWorkBrief.ts` imports `expect` from `@playwright/test` **as a value**, so the Vitest drift guard importing the fixture from it would drag Playwright into Vitest (the `seedDraft.ts:2` hazard the instruction flagged). The fixture module has **zero imports** — not even `import type { Brief }` — so both runners can load it. It is untyped by necessity; `workBriefFixture.test.ts` is what proves it parses, serves, and yields non-null work facts.

Explicitly NOT deviated: `engines/types.ts` untouched; `understand`/`scrape-website` untouched; `rail.ts` untouched; no P3+ work.

---

### What P3 must know

1. **`resolveResumeStep` cannot see `finalContent`.** The entry page's load-detection reads only `{brief, audienceType, templateId}`, so that is all `JourneyShell` can pass. P5/P6's resume rules (`isResumableGeneration` ⇒ 5, finished ⇒ 6) **need `finalContent`** — the phase adding them must widen what the shell is given (either load-detection fetches it, or the shell fetches it itself). Flagged in `JourneyShell.tsx` at the call site. P2b's rule (confirmed ⇒ 2) is unaffected.
2. **`JourneyEntryStep` is minimal by intent** — dispatch proof only. P3 owns handoff 1a (radial-gradient body, `rocket_launch` chip, display headline, 720px card, segmented tabs, coral CTA) + the edited-line re-classify. Its 6 branch tests (serve / manual / missing-tag fallback / seam enrichment / non-ok / thrown fetch) must stay green through that rework — they are STEP 01's real gate, since e2e cannot reach it.
3. **The CTA is disabled until the seam resolves, and a missing seam fails loudly** rather than POSTing an un-enriched draft. An un-enriched work brief confirms into a journey whose rail has nothing to project — a silent, unrecoverable-looking empty rail. Keep that guard when rebuilding the screen.
4. **Icons: `icons.txt` already contains every glyph on P3's list** (`rocket_launch`, `edit_note`, `link`, `chat_bubble`, `progress_activity`, `check_circle`, `add_photo_alternate`, `tune`, `folder`, `language`, `close`, `arrow_forward`, `edit`, `check`). P3's icon step is likely a **no-op** — diff before regenerating, and never regenerate from the full font (landmine 11).
5. **The purity guard scans `journey/*.tsx` + `journey/steps/*`.** `UnderstoodRail.tsx` lands in that scope: it must import nothing from `@/modules/wizard/work/**` and carry no templateId literal — the rail renders `RailVM` only, and reaches work through `seam.rail`.
6. **Store note for `commitRail` (P3):** `WizardJourneyStep` is declared in the store rather than imported from `engines/types.ts`, because that module imports `WizardStore` from the store — importing back would be a cycle. Same closed literal union, assignable both ways. `commitRail` faces the same direction constraint: the store must not import the seam contract.
7. Open risk (unchanged from 2a): `preflight` is still the **fail-closed** placeholder. P5 must fill it with the real `workCopyEngineEnabled(templateId)` + `getWorkFacts` checks or STEP 05 hard-fails by design.

---

## Phase 2b — follow-up fixes (impl-review), 2026-07-16

### Files changed

- `src/components/onboarding/journey/journeyAgnostic.test.ts` — guard made 1-hop transitive (+ type-only awareness)
- `src/modules/wizard/work/resumeStep.ts` — doc correction (comments only; zero behaviour change)
- `docs/task/work-onboarding-shell.audit.md` — this section

---

### FIX 1 — the purity guard was not transitive

**Chosen: option (b), the 1-hop closure.** It stayed simple (one resolver + one `Map` build, ~20 lines) and fast (no measurable delta; the guard file still runs in ~1s). (a) would have papered over the class of bug rather than the instance: `SEAM_FILES` would need a manual append every time a seam grows a new import, and the next missed edge would be as silent as the rail one.

`SEAM_CLOSURE` = `SEAM_FILES` + one hop of each seam's own `@/`-local **value** static imports (resolved via `@/` → `src/`, trying `.ts`/`.tsx`/`index.ts`/`index.tsx`; unresolvable specifiers are skipped). Ban set unchanged: `@/modules/wizard/generation/**` + `@/modules/generation/**`. The guard still **parses import statements** — never greps raw source (`engines/work.ts`'s header names the banned path in prose, and a guard that fires on its own documentation gets deleted).

Non-vacuity is pinned by an explicit test asserting `rail.ts ∈ SEAM_CLOSURE` and `SEAM_CLOSURE.length > SEAM_FILES.length` — if the closure ever silently degrades to direct-imports-only, that test fails rather than the scan quietly narrowing.

**Proof (as requested):** temporarily prepended `import { isResumableGeneration } from '@/modules/generation/multiPageAssembly';` to `src/modules/wizard/work/rail.ts` → the guard **FAILED** and named the file:

> `modules/wizard/work/rail.ts statically imports "@/modules/generation/multiPageAssembly". Seams load PRE-CONFIRM on the entry page — reach generation with a LAZY \`await import(…)\` inside the function instead.`

Poison reverted via `git checkout -- src/modules/wizard/work/rail.ts`; `rail.ts` is untouched in the final diff (`git status` verified). Guard green after revert: 11/11.

#### Deviation (in-scope, and load-bearing): the closure must ignore `import type`

The first poisoned run failed on the **wrong file** — `hooks/useWizardStore.ts`, via a **pre-existing** edge, not via rail.ts. Cause: `engines/types.ts` does `import type { WizardStore } from '@/hooks/useWizardStore'`, and that module type-imports `@/modules/wizard/generation/{thing,trust,work}` for its input contracts.

Those are **type-only imports — fully erased by TypeScript, zero bytes on the entry bundle**. A naive 1-hop closure therefore reports a firewall violation against code that cannot possibly cause one. Shipping that would have made the guard cry wolf on day one (and P3 would rightly have deleted or `.skip`ped it).

So the closure follows, and the ban applies to, **value imports only** (`valueImportSpecifiers`). This is not a loosening — it encodes the actual rule (runtime edges are the bug), consistent with the existing dynamic-import carve-out. `import { type A, B }` correctly still counts (`B` is a real edge); only a leading `import type` / `export type` is erased. Two self-tests pin these semantics. Shell-purity tests keep the original all-specifiers behaviour (a type-import of an engine module in the agnostic shell is still a purity smell worth failing on).

**Note for P3/P5:** `useWizardStore.ts`'s generation imports are type-only **today**. If any of them is ever changed to a value import, the guard will fail — correctly: that would put the generation graph on the pre-confirm STEP-01 path.

---

### FIX 2 — `resumeStep.ts`'s doc misled P5 into a silent bug

The old doc said *"P5/P6 branch on `loaded.finalContent`"*, implying availability. It is not available: `JourneyShell.tsx:105` passes only `{brief, audienceType, templateId}`. Combined with `resumeStep.test.ts` fabricating `loaded` objects directly, P5 could have shipped `if (loaded.finalContent) return 5` with **green** unit tests and a rule that never fires — resume-at-2-forever.

Rewrote the function doc and added a header section (`READ THIS BEFORE ADDING A finalContent RULE`) — where P5's implementer actually reads before editing — stating plainly:

- `finalContent` is **declared** on the contract (`engines/types.ts` — `finalContent?: unknown`) but **NOT passed** by the shell ⇒ always `undefined` in production;
- the shell (`JourneyShell.tsx`, and possibly `src/app/onboarding/[token]/page.tsx`'s load-detection) **must be widened to pass it** first;
- **unit tests fabricating `loaded` will NOT catch this** — green tests are not evidence; a rule added without widening the shell is dead code that silently resumes at step 2 forever.

**Shell NOT widened** (out of scope — orchestrator is adding `JourneyShell.tsx` to P5's Files-touched). The existing `JourneyShell.tsx:105` call-site note is left as-is and now agrees with the module doc. Comments only; `resolveWorkResumeStep` behaviour is unchanged (confirmed ⇒ 2).

---

### Test results

- `npx tsc --noEmit` — **clean** (exit 0)
- `npm run test:run` — **200 passed | 1 skipped (201 files); 3421 passed | 18 skipped**
- `npm run lint` — **no errors**; pre-existing warnings only (`vestria/publishedPrimitives.tsx` no-img-element, `ph-provider.tsx` exhaustive-deps) — untouched by this phase
- `journeyAgnostic.test.ts` — 11/11 (was 9; +2: closure non-vacuity, type-only semantics)
- Known CRLF churn on `__snapshots__/uiFoundationIsolation.test.tsx.snap` (zero content change) restored via `git checkout --` on that path only. Final `git status` shows only the two source files above.

### Open risks

1. **The closure is 1 hop, not transitive-to-fixpoint.** A generation import at depth 2 (e.g. `rail.ts` → some pure helper → generation) stays invisible. Accepted deliberately: hop-1 covers the real surface (what a seam directly pulls onto the entry path), and any depth-2 module becomes a hop-1 the day a seam imports it. Depth ≥2 remains review's job. If a seam ever grows a deep pure-helper tree, revisit.
2. `resolveAlias` handles `@/`-alias specifiers only — relative (`./types`) and package specifiers are not followed. In-scope files are all `@/`-imported today; a seam that starts importing a *relative* sibling outside `engines/` would not be closed over. `engines/*.ts` are all directly in `SEAM_FILES`, so today's relative edges (`./types`) are already scanned.
3. P5 still must widen the shell before any `finalContent` rule. The doc now says so in two places, but nothing **mechanically** enforces it — a `finalContent` rule with fabricated-`loaded` tests will still go green. The real gate is P5's reviewer.

---

## Phase 3 — STEP 01 (real) + "What we understood" rail (agnostic UI + work adapter) + icons

### Files changed

**New:**
- `src/components/onboarding/journey/UnderstoodRail.tsx` (the agnostic rail)
- `src/components/onboarding/journey/UnderstoodRail.test.tsx` *(deviation 1)*
- `src/components/onboarding/journey/engines/work.test.ts` (the mandated regression)

**Edited:**
- `src/components/onboarding/journey/JourneyEntryStep.tsx` (handoff 1a + re-classify)
- `src/components/onboarding/journey/JourneyEntryStep.test.tsx`
- `src/components/onboarding/journey/JourneyShell.tsx` (rail layout + ToastProvider)
- `src/hooks/useWizardStore.ts` (**shared** — additive `commitRail` + 2 selectors)
- `e2e/work-onboarding.spec.ts`
- `docs/task/work-onboarding-shell.audit.md` (this append)

**NOT changed, deliberately:**
- `engines/types.ts` — founder-signed; consumed as-is, nothing needed changing.
- `engines/work.ts` — **already complete.** P2a shipped the real 4-field `toVM` +
  chip-id join (its deviation 4) and its review folded the `chipIndex` strict-regex
  fix. P3's remaining debt on it was the TESTS, which is what `work.test.ts` is.
  Editing it to satisfy a Files-touched line would have been churn.
- `public/fonts/material-symbols-rounded/icons.txt` + the subset — **no-op, verified
  by diff, not assumed** (see Icons).
- `rail.ts`, `buildBriefPatch`'s collections-only `facts` guard — untouched (load-bearing).

---

### 1. `UnderstoodRail.tsx` — the agnostic rail

312px aside (steps 02–06), mono "WHAT WE UNDERSTOOD" + "Tap anything to correct it",
one block per `RailFieldVM` **in the adapter's order**, trailing `edit` affordance →
thin inline input (no dialog), footer "Something wrong?" → `adapter.appendNote`.
Unknown = `opacity-50` + a `bg-app-stripes` bar (per handoff), with `data-skeleton`
for tests. Toasts from `@/components/ui/toast` (NOT the edit-page-local provider).
`app-*` utilities only.

**It knows no field names.** Labels/order/kinds/skeleton/editability all come from
`seam.rail.toVM(briefFacts)`; the engine is reachable only through the injected
adapter. It renders FOUR fields today because the work adapter emits four — no WHERE,
no LANGUAGES (founder ruling: no E1 source, and a rail headed "WHAT WE UNDERSTOOD"
must not present a default as a belief). They stay modelled in `rail.ts`.

#### The chip lifecycle — how "no chip array survives a commit" is GUARANTEED

Not by discipline — structurally, three ways:

1. **The chips editor is a separate component keyed on the FACTS-BAG IDENTITY.**
   `projectionKey(facts)` = a module-level `WeakMap<object, number>` -> `p<n>`.
   `commitRail` swaps `briefFacts` for the seam's merged bag in one `set`, so a new
   object reference *is* "a commit happened, ids re-issued" => new key => React
   unmounts the editor and the draft dies with it. A WeakMap on identity, not a
   content hash: two commits producing identical labels are still two projections,
   and a content hash would let a draft survive one.
2. **`liveFacts` is always the store's current `briefFacts`** — the same bag `toVM`
   just projected. Never a captured copy, never a value closed over at edit-open time.
3. **The UI never mints, reuses or reorders an id.** Surviving chips carry `id`
   verbatim; "Add" pushes `{label:''}` with **no id**; remove just stops submitting the
   chip; array order = new order. All join semantics stay in the adapter — the rail
   never rebuilds groups from labels or positions (that is the wipe, one layer up).

Pinned by a test that opens the chips editor, commits a *different* field, and asserts
the editor is gone.

### 2. `engines/work.test.ts` — the mandated regression (24 tests)

**The hard gate, concretely:** over an **E2-shaped bag** (g0 `Weddings` with `photos`
+ a `from EUR 2400` price, g1 `Portraits` with `items`), **ONE** `applyEdit` that
RENAMES g0 to "Wedding days", REORDERS it after g1, and ADDS an id-less "Newborn":

- renamed group keeps `photos` **and** its price and `kind` (rebuilt from `liveFacts`,
  not from the lossy chip) — label-match would have lost it, positional index would
  have handed it g1's payload;
- reordered sibling keeps its `items`;
- new group = `{name, kind:'category', price:{mode:'on-request'}}`, **no** inherited photos;
- `getWorkFacts(result.facts)` non-null; `facts.entry` preserved; `patch.facts === facts`.

Plus: the FOUR-field VM shape/order, WHERE/LANGUAGES **absent**, chip ids `g0..gN`,
PRICE POSITION derived + `editable:false` + `null` => skeleton, all-skeleton VM for
`undefined`/`{}`/garbage (never a throw), **re-projection re-issues ids for the NEW
order** (why a draft must never cross a commit) + a second edit against the new bag
joining correctly, delete-by-omission, NAME mirror, invalid => `{ok:false}`.

### 3. `commitRail` (store, additive, engine-agnostic)

`WizardRailCommit` / `WizardRailCommitResult` are declared IN the store, not imported
from `engines/types.ts` — that module imports `WizardStore` from the store, so
importing back is a cycle (the `WizardJourneyStep` precedent P2b flagged).
Structurally identical => a `RailCommit & {ok:true}` passes with no cast, and the
store never learns what `work` is.

Order, all of it load-bearing: (1) snapshot `briefFacts` + every field a mirror will
overwrite **before** the optimistic `set`; (2) ONE `set` applies `facts` + mirrors (so
the rail re-projects immediately and the next edit's `liveFacts` IS that snapshot —
which is what makes the index-derived chip ids safe); (3) POST `/api/saveDraft` with
`save()`'s body shape and **check `res.ok`** — non-2xx/throw => restore BOTH in one
`set` => `{ok:false}`. Never keeps optimistic state on failure: `briefFacts` is what
generation reads, so an unpersisted belief would make STEP 05 generate from data that
vanishes on reload. A mirror that CREATED a field is deleted on revert, not left as an
`undefined`-valued entry. `stepIndex` = `save()`'s `-1 -> 0` (verified-harmless per
decision 5). `buildBriefPatch` / `save` / slot machine / `hydrate` untouched.

### 4. `JourneyEntryStep.tsx` — handoff 1a, rebuilt with real primitives

Radial-gradient body, `rocket_launch` badge, 40px display headline, 720px card with
`SegmentedControl` ("Describe your site" / "Use my current site" **disabled** stub),
the one-liner **prefilled and editable**, coral CTA "Build my site" + `arrow_forward`.
Copy is UNIVERSAL (ruling). Confirm path unchanged: seam `enrichDraftForConfirm` ->
`/api/brief/confirm` -> serve => `window.location.assign` / manual => `onManual(missing)`.
CTA still disabled until the seam resolves; a missing seam still fails loudly (P2b's
guard kept). Edited line => `/api/v2/understand` re-classify -> seamed result: load
**that engine's** seam and confirm the fresh draft; non-seam result: hand back via
`onDraftCorrected` (see Deviations 3 — **this needs one line in `page.tsx`**).
Its 6 P2b branch tests stayed green through the rework; +5 new.

### 5. `JourneyShell.tsx`

Two-column from STEP 02: `<UnderstoodRail rail={seam.rail} />` + step body, wrapped in
the ui-foundation `ToastProvider`. `.app-chrome` scope unchanged (still exactly the two
shell wrappers; the toast viewport portals to `<body>`, outside the scope, and carries
its own `app-*` tokens).

### Icons — no-op, and I checked rather than assumed

Diffed P3's list (`rocket_launch, edit_note, link, chat_bubble, progress_activity,
check_circle, add_photo_alternate, tune, folder, language, close, arrow_forward, edit,
check`) plus the two the rail actually needed (`add`, `send`) against the committed
`icons.txt`: **every one is already present** (P2b predicted this). So `icons.txt` is
unchanged and the subset was **NOT regenerated** — regenerating a byte-identical set
would only risk the landmine-11 failure (the full upstream font is deliberately not
committed, so a regen here could only have come from the wrong source). If a future
phase adds a glyph: append to `icons.txt`, regen per NOTICE (`--no-layout-closure`,
all four axes, never `--instance`).

---

### Deviations (3, all in-scope; conservative option taken, logged per protocol)

1. **`UnderstoodRail.test.tsx` — one extra test file.** The plan mandates the
   revert-on-failure test ("mocked non-2xx => briefFacts + fields identical, toast
   shown") in step 5, whose Files-touched lists `useWizardStore.ts` but **no store test
   file**. Options were: edit `src/hooks/useWizardStore.test.ts` (a shared file *not* on
   the list), or bury a store test in `engines/work.test.ts` (misleading). Chose a new
   file in this phase's own directory, which also lets the mandated test assert the
   **toast** (which only exists at the UI layer) and covers the rail UI the plan builds.
   It exercises the REAL work seam adapter — a fake adapter would prove the test, not
   the product.
2. **`commitRail` REVERTS but does not TOAST; the rail toasts.** A zustand action cannot
   call the `useToast` hook, and there is no global toast singleton. The data-integrity
   half (revert) is in the store; the store returns `{ok:false, error}` and
   `UnderstoodRail` raises the ruled copy — *"Couldn't save — reverted, try again"*.
   Same guarantee, correct layer. Both halves are asserted in one test.
3. **`JourneyEntryStep` gained an OPTIONAL `onDraftCorrected` prop, and
   `src/app/onboarding/[token]/page.tsx` was NOT edited** (not on Files-touched —
   reported, not edited). See "What P4 must know" #1: the flip needs one line there.

Two smaller judgment calls: chips render as `Badge variant="secondary"` (a named
variant — blue tint, `app-badge` 6px), which is the handoff's chip exactly; the
README's "use status/pill variants" warning is about the raw `default`, and `status` is
grey. And STEP 01's radial-gradient body uses the handoff's hex values as an arbitrary
Tailwind gradient — there is no token for a decorative gradient, and it touches no
stock Tailwind key.

### Test results (all green, run in full)

- `npx tsc --noEmit` — **clean** (exit 0, no output).
- `npm run test:run` — **202 passed | 1 skipped (203 files); 3451 passed | 18 skipped**
  (3421 -> 3451: **+30** — 24 adapter incl. the mandated rename+reorder+add regression,
  11 rail/commitRail incl. the mocked non-2xx revert, +5 entry-step re-classify, none
  removed). Purity guard still green: `UnderstoodRail.tsx` is in its scanned set and
  imports no engine module and carries no templateId literal.
- `npm run lint` — no errors; **zero warnings from any new/edited file** (pre-existing
  template `<img>` / ph-provider warnings unchanged).
- `npx playwright test e2e/work-onboarding.spec.ts` — **5 passed** (incl. `setup`), on a
  **FRESH dev server** via the config's own `E2E_PORT=3123 PORT=3123` toggle (same
  reason as P2b: `reuseExistingServer: !CI` would silently reuse a server built without
  the inlined env). Nothing skipped or faked. The new spec asserts, against real
  Postgres: rail projects the seeded name/descriptor/chips -> NAME edit -> an
  **immediately consecutive** DESCRIPTOR edit (the lost-update guard for same-`set`
  snapshot sync) -> a group-chip RENAME -> a note -> `loadDraft` shows **both** edits,
  the renamed group still `kind:'category'`, the note, **`facts.entry` intact**, and
  service/atelier/work unchanged -> reload re-projects from the DB.
- Known `core.autocrlf` churn on `__snapshots__/uiFoundationIsolation.test.tsx.snap`
  (zero content change) restored via `git checkout --` on that path only. No commits.

### What P4 must know

1. **BLOCKING, one line, out of my scope:** `src/app/onboarding/[token]/page.tsx` must
   pass `onDraftCorrected={setBriefDraft}` to `<JourneyEntryStep>`. It is what makes
   decision 3's "non-seam re-classify => back to `ConfirmBriefStep`" real: the parent
   re-renders from the corrected draft, the seam-keyed branch (b) goes false, and the
   legacy confirm step takes over (`step` is already `'confirm'`) — no page logic needed
   beyond the prop. Without it the component surfaces an explicit error instead of
   silently stranding the user in a journey his engine cannot drive. The seamed
   re-classify path works today regardless.
2. **STEP 03 group questions must keep firing only when `groups` is empty.** That is the
   assumption that makes the stale-VM hole unreachable: the rail's chip editor is the
   only other group writer, and it cannot be open on chips that do not exist.
3. **`commitRail` is the ONE write door for question commits** (plan P4 step 2) —
   `commit(...)` returns a `RailCommit`; pass its `ok:true` half straight in. Do not add
   a second saveDraft path, and do not "fix" `buildBriefPatch`'s collections-only `facts`
   guard (it is what stops legacy autosave clobbering rail facts).
4. **`engines/work.ts`'s `preflight` is still the fail-CLOSED placeholder** (P5 owns it),
   and `resolveResumeStep` still cannot see `finalContent` (P5 must widen the shell —
   `resumeStep.ts`'s header says so; fabricated-`loaded` unit tests will NOT catch it).
5. The rail occupies 312px from STEP 02 on; step bodies now live in the remaining column
   (`max-w-3xl`). No responsive pass in E1 (decision 8).
