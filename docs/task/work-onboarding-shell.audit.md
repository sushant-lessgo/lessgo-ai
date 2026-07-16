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
