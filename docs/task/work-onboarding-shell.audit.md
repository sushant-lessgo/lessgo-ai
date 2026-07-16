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
