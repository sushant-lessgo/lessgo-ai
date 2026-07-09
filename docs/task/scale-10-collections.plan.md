# scale-10 — collections convergence: implementation plan

Branch: `feature/scale-10-collections`
Spec: `docs/task/scale-10-collections.spec.md` (6 Scope-IN items, 5 binding founder decisions)
Revision: 2 (post plan-review — vestria `catalog` disambiguation, dormant-ship posture)

## Overview

Make collection pages (index + N item pages) generate at birth from Brief data for ANY collection type / ANY declaring template: Brief carries `facts.collections` (scraped verbatim, edited at gate 7b), the capability vocab gains the per-type collection family (products · services · case-studies · works), the serve gate + demand board get per-collection granularity, and a registry-gated bridge in `multiPageAssembly` creates index + `collectionItem` pages via the existing collections machinery. AI never invents items (clamp to Brief entries), slugs are code-derived (`slugify`), copy fan-out charge stays flat, and the Products editor panel generalizes to one panel keyed by `collectionKey`. Block pairs are Scope-OUT (demand-gated rung C).

**Key disambiguation (reconciles spec §2):** the spec's "`catalog` → per-type flags" split applies to the collection CONCEPT, not to vestria's flat grid. Vestria's existing `catalog` capability (`templateMeta.ts`, the only live `catalog` declaration) is a FLAT GRID of plain `ai_generated` items — explicitly NOT a registered collection (multiPageAssembly invariant). It merely shares the name. **Decision: the `catalog` capabilityId SURVIVES unchanged as vestria's flat-grid capability, outside the collection family.** The family (`products|services|case-studies|works`) is ADDED as new, distinct capabilityIds. The collections registry will never contain a def keyed `catalog`, so vestria can never trigger the bridge.

**Dormancy posture:** NO shipping template declares a collection-family capability (techpremium is `retired:true` — adding `products` would un-retire it; naayom runs via grandfathered `buildNaayomProductPages`, not the bridge; vestria declares only flat-grid `catalog`). The phase-5 bridge and phase-7 conformance test therefore ship DORMANT — exercised only by test fixtures — and become live when rung-C block pairs land.

## Progress log

- phase 1 data layer (family capability ids + registry family + Brief collections reader): pending
- phase 2 scrape extraction → facts.collections: pending
- phase 3 serve gate + requiredCollections + demand granularity: pending
- phase 4 structure gate 7b collection node: pending
- phase 5 generation→collections bridge (dormant, fixture-tested): pending
- phase 6 editor panel generalization: pending
- phase 7 conformance test (declared collection capability ⇒ block pair): pending

---

## Phase 1 — Data layer: family capability ids, registry family, Brief collections type/reader

**Goal:** the shared vocabulary + data shapes every later phase imports. Pure types/data + safe readers; no behavior change. `catalog` capabilityId is NOT touched (vestria's flat grid keeps it).

**Files touched**
- `src/types/brief.ts` — ADD `products`, `services`, `case-studies`, `works` to `capabilityIds` (`locations` NOT added — reserved P3, note in comment). KEEP `catalog` with a comment: "vestria flat-grid capability — NOT a collection; never key a CollectionDef `catalog`". `CapabilityId` union follows.
- `src/modules/templates/templateMeta.ts` — comment-only edit: annotate vestria's `catalog` declaration as flat-grid/non-collection. NO capability re-point; NO addition to techpremium (retired stays retired) or any other template.
- `src/modules/collections/registry.ts` — add `CollectionDef` entries for `services`, `case-studies`, `works` (data only: key, basePath, label, archetype keys, catalog/item section types). Add `labelFields: string[]` (or `deriveLabel` rule) to `CollectionDef` so phase 6 can drop the hard-coded `rec.model`/`rec.name` fallback — set it for `products` too. `CollectionKey` type must exactly equal the family ids; `catalog` is NOT a valid key.
- `src/modules/collections/README.md` — document the family, labelFields, and the vestria-catalog-is-not-a-collection rule.
- `src/modules/brief/collections.ts` — NEW: `CollectionEntry` type (name, slug, oneLiner?, imageUrl?, …), `getCollections(brief)` safe reader (EntryFacts idiom), `setCollections`-style pure helper for writers. `facts.collections` stays optional; no `brief.schema.ts` change needed since `facts` is a loose record.
- `src/modules/brief/collections.test.ts` — NEW: reader round-trip, missing/malformed facts tolerated, slug derivation via `slugify`.
- `src/modules/engines/structureConvergence.test.ts`, `src/modules/templates/fit.test.ts`, `src/modules/templates/swap.test.ts` — **grep-confirm, expected no-op**: these hardcode `catalog` as a CapabilityId (`requiredCapabilities:['catalog']`, `toEqual(['catalog','lead-form'])`, swap fixtures). Because `catalog` SURVIVES as a capabilityId, they remain valid — edit ONLY if the added family ids break an exhaustive assertion (e.g. a test enumerating the full capabilityIds list); otherwise leave untouched.

**Steps**
1. Grep the repo for the `catalog` literal to enumerate ALL readers before touching anything (field-drop lesson). Expected findings: templateMeta (vestria declaration — keep), tests above (keep), sectionType/StructureSlot usages (out of scope — `catalog` as sectionType is untouched). `fit.ts` has NO `catalog` literal (capability derivation is generic via `capabilitySections` + `requiredCapabilities`) — zero fit.ts edits. `businessTypes/config.ts` has NO `catalog` in `requiredCapabilities` (comments only) — zero config.ts edits this phase.
2. Add family ids + registry entries; keep the pure-data firewall (no store/template imports).
3. Add `CollectionEntry` + `getCollections`; use `slugify` from `src/lib/normalize.ts` ("slugs never AI").

**Verification:** `npx tsc --noEmit`; `npm run test:run` — must stay green with NO edits expected: `fit.test.ts`, `swap.test.ts`, `structureConvergence.test.ts`, dispatch/conformance/blockManifest, `serveGate.test.ts`, `classify.test.ts`; new `collections.test.ts` passes.

---

## Phase 2 — Scrape extraction: collection entries into signals → `facts.collections`

**Goal:** existing single scrape call also extracts collection entries verbatim (founder decision 2: zero extra scrape, names + one-liners only, image URL strings iff same crawl saw them). Note: this data may sit UNUSED at generation time for templates without collection capabilities (e.g. vestria-served thing leads) — that is fine and intended; it feeds gate 7b, the demand signal, and future rung-C.

**Files touched**
- `src/lib/schemas/extraction/index.ts` — `EngineExtraction`: add optional collections extraction field + fold into signals via `enrichSignals`; add a collection-carrier field on `EntrySignals`.
- `src/lib/schemas/extraction/thing.ts` — `collections.products` extraction (zod: `z.array(z.object({name, oneLiner, imageUrl?}))`, strict-json-schema friendly — no min/max), follow the `manufacturer.ts` enrichment pattern.
- `src/lib/schemas/extraction/manufacturer.ts` — same, `products`.
- `src/lib/schemas/extraction/trust.ts` — `services` / `case-studies`.
- `src/lib/schemas/extraction/work.ts` — `services` (photographer portfolio = services, decision 1) / `works` where applicable.
- `src/lib/schemas/extraction/extraction.test.ts` — extend: schema parses fixture with/without collections.
- `src/modules/brief/classify.ts` — `buildBriefDraft`: map signal-carried entries → `facts.collections[key]` with code-derived slugs; keep `applyBusinessTypeCorrection` coherent (correction changes businessType, entries persist).
- `src/modules/brief/classify.test.ts` — extend: scrape with entries → `facts.collections` populated verbatim; no entries → key absent (DROP path).

**Steps**
1. Extend each engine's `entryEnrichmentFields` + `entryEnrichmentPrompt()` with the collections ask (verbatim extraction instruction, no invention).
2. Carry through `enrichSignals` → `EntrySignals` → `buildBriefDraft` → `facts.collections`.
3. Record fields verbatim; slugs derived in code, never taken from AI output.

**Verification:** `npx tsc --noEmit`; `npm run test:run` — `extraction.test.ts`, `classify.test.ts`, `bridge.test.ts`, `generationContract` stay green.

---

## Phase 3 — Serve gate: `requiredCollections` + per-collection demand granularity

**Goal:** businessType declares which collections it needs; if no serveable template declares that collection capability → MANUAL-ONBOARD with the precise missing collection tag, so the demand board can rank "3 leads blocked on portfolio". (Gates on TEMPLATE capability supply, not data presence — empty collections still serve with empty-state per Scope-IN §1.) This is where `businessTypes/config.ts` gets its REAL edit (phase 1 touches it not at all — it contains no `catalog` requiredCapability today).

**Files touched**
- `src/modules/businessTypes/config.ts` — add `requiredCollections?: readonly CollectionKey[]` to `BusinessTypeEntry`; populate for founder-approved types (candidates: manufacturer → `products`, photographer → `services`).
- `src/modules/brief/serveGate.ts` — `decideServe`: if the businessType's `requiredCollections` include a key no shortlisted template covers (via collection-family capability), return manual with granular missing tag (e.g. `collection:services`). Vestria's flat-grid `catalog` capability does NOT satisfy any `requiredCollections` key.
- `src/modules/brief/serveGate.test.ts` — extend: required collection covered (fixture template) → serve; uncovered → manual + precise tag; flat-grid `catalog` does not cover `products`.
- `src/app/api/demand-lead/route.ts` — accept/store the granular `collection:<key>` missing tags (likely no schema change — `missing` is already a free tag; verify + widen any allowlist).
- `src/app/onboarding/[token]/components/ManualOnboardStep.tsx` — surface the missing-collection reason in copy.

**Verification:** `npx tsc --noEmit`; `npm run test:run` — `serveGate.test.ts` (extended) green; manual check: demand-lead POST with `collection:services` tag persists.

**Human gate: YES** — this changes who gets served. Because NO live template declares a collection-family capability, giving manufacturer→`products` / photographer→`services` a `requiredCollections` routes EVERY such lead to MANUAL-ONBOARD until rung-C blocks land — including leads vestria's flat grid serves today. That is the intended demand signal, but it needs explicit founder sign-off per businessType (option: populate none at first, keeping the mechanism dormant like the bridge).

---

## Phase 4 — Structure gate (7b): collection node

**Goal:** one collapsible row per collection ("Products · 8 items"), entries editable (rename / remove / add name-only), never N flat AI rows. Edits land in `Brief.facts.collections` BEFORE copy (7b law).

**Files touched**
- `src/components/onboarding/wizard/StructureSlot.tsx` — render one collection-node row per key in `facts.collections` (and per businessType `requiredCollections` even when empty → count-only/empty node, decision 2); collapsible entry list with rename/remove/add(name-only); zero-entry state allowed (index ships empty-state).
- `src/hooks/useWizardStore.ts` — collection-edit actions (`renameCollectionEntry`, `removeCollectionEntry`, `addCollectionEntry`); fold edited entries into `buildBriefPatch` so `save()` persists them before generation; re-derive slugs on rename via `slugify`; keep `recomputeRequiredCapabilities` coherent. **Critical:** `buildBriefPatch` must carry the COMPLETE `facts` object (incl. `collections` AND all sibling facts) — saveDraft's shallow `BriefSchema.partial()` merge would otherwise drop siblings.
- `src/hooks/useWizardStore.test.ts` — extend: add/rename/remove round-trips into the brief patch; removing 2 of 8 leaves 6; slugs re-derived; patch preserves sibling `facts` keys.

**Steps**
1. Collection node is a SEPARATE row type from section rows — do not reuse `toggleStructureSection` for entries.
2. No waterfall (`src/modules/wizard/waterfall.ts`) change: collections are a parallel channel; no per-item ASK questions (decision 2). Note in code comments.
3. Persist BEFORE copy: Continue → `save()` → patch carries full `facts` incl. `collections`; generation reads only the persisted brief.

**Verification:** `npx tsc --noEmit`; `npm run test:run` — `useWizardStore.test.ts` (extended), `loadDetection.test.ts` stay green; manual: wizard 7b shows "Products · N", edits survive reload, unrelated facts survive save.

---

## Phase 5 — Generation→collections bridge (registry-gated, ships DORMANT) + clamp

**Goal:** post-gate assembly creates the index singleton + one `collectionItem` page per Brief entry via registry archetypes; per-page copy fan-out fills copy FROM the record (record fields verbatim, AI writes connective copy only); AI-invented items clamped to Brief entries. Lift the `multiPageAssembly` no-collections invariant ONLY behind the double gate below.

**Bridge gate (registry-backed opt-in):** bridge fires for key K iff (a) `getCollectionDef(K)` exists in the collections registry AND (b) the template declares capability K (collection family). **Why vestria can never trigger it:** vestria declares no collection-family capability — its only relevant capability is flat-grid `catalog`, which is not a `CollectionKey` and has no registry def by construction (phase 1). So even though phase 2 populates `facts.collections.products` from thing/manufacturer scrapes, no vestria page is ever stamped `collectionItem`/`collectionKey`; the flat-grid path and the multiPageAssembly invariant hold on vestria unchanged.

**Dormancy:** since NO live template declares a collection-family capability, the bridge ships dormant — tests exercise it via a TEST-FIXTURE template meta/manifest only (never a real template; do NOT add capabilities to techpremium or anyone else). It goes live when rung-C block pairs + capability declarations land.

**Files touched**
- `src/modules/generation/multiPageAssembly.ts` — bridge per the gate above: emit index page (singleton, catalog section per collection def) + N item pages stamped `kind:'collectionItem'` + `collectionKey`, slugs = `def.basePath + slugify(entry.name)`; empty collection ⇒ index only. Update the header invariant comment: invariant holds EXCEPT behind a declared collection-family capability + registry def; vestria's flat-grid `catalog` is explicitly outside it.
- `src/hooks/editStore/archetypes.ts` — generic Brief/entry-driven slice builders (generalize `buildCatalogSlice` / `buildProductDetailSlice` to take `collectionKey` + `CollectionEntry[]`); do NOT touch `buildNaayomProductPages` / `buildTechPremiumHomeFinalContent` (naayom grandfathered).
- `src/modules/wizard/generation/thing.ts` — fan-out: item pages POST with the record in the payload; on merge, CLAMP — drop/overwrite any AI-returned item not in Brief entries (intersect by slug), keep record fields verbatim; charge stays FLAT (decision 3); per-page persistence/resume (`completedPageKeys`) covers item pages.
- `src/modules/wizard/generation/trust.ts` — same clamp + record-payload treatment (mirror of thing.ts).
- `src/modules/wizard/generation/work.ts` — same.
- `src/modules/generation/multiPageAssembly.test.ts` — UPDATE: (a) all real-template paths still assert ZERO `collectionKey`/`collectionItem` (invariant intact — bridge dormant); (b) bridge exercised ONLY via a test-fixture template meta/manifest declaring e.g. `products` (inject/mock the meta lookup — no real template gains a capability): asserts index + N items, deterministic slugs, removed-at-gate entries produce no pages, empty collection ⇒ index only, `facts.collections` present but capability absent ⇒ no bridge (the vestria case), def absent ⇒ no bridge.
- `src/hooks/editStore/pageActions.test.ts` — extend if needed: bridge-produced pages behave under existing collection CRUD (add-post-reveal on an empty collection).

**Steps**
1. Reuse `collectionHelpers` (`materializeIntoPages`, `materializeHomeTeasers`, `collectionKeysInPages`) at the export boundary — NO edits expected there (`buildPagesForExport` already sweeps generically).
2. Clamp is a hard post-parse step, not a prompt hope.
3. Index-page composition per founder decision 5: collection def owns topology + required grid section; scale-07 engine grammar decides optional sections; template supplies blocks only. Guard: bridge must NOT assume a resolvable block exists for `services`/`case-studies`/`works` until rung-C — capability gate guarantees this today, keep the assumption explicit in comments.
4. Dual-renderer note: this phase creates page DATA only — no block `.tsx`/`.published.tsx` edits. If any renderer edit turns out necessary, it lands as a pair.

**Verification:** `npx tsc --noEmit`; `npm run test:run` — `multiPageAssembly.test.ts` (updated), `naayomProducts.test.ts`, `homeTeasers.test.ts`, `pageActions.test.ts`, `generationContract.test.ts`, golden `captureGolden.test.ts` all green. Manual: mock-mode birth on a real template confirms NO collection pages appear (dormant check); fixture-driven test covers the live path.

**Human gate: YES** — bridge correctness + the lifted invariant; also touches copy generation/charging path. Demo the fixture acceptance scenario (8 → gate remove 2 → 6 pages; empty → empty-state; vestria-case no-fire) before proceeding.

---

## Phase 6 — Editor panel generalization

**Goal:** one panel component, N collections — Products panel re-keyed by `collectionKey`, labels/paths/section-types from the registry. Today only `products` pages exist (naayom, grandfathered), so behavior must be pixel-identical for them.

**Files touched**
- `src/app/edit/[token]/components/ui/ProductsModal.tsx` — replace `const COLLECTION='products'` with a `collectionKey` prop; read label/basePath/`itemSectionType`/`catalogSectionType` + `labelFields` from `getCollectionDef`; generalize copy strings ("Add {def.label} item"); replace `extractSectionType(sid)==='productdetail'` with `def.itemSectionType`. Guard: panel must not assume a resolvable block for `services`/`case-studies`/`works` defs until rung-C (it only opens for collections present in pages, which the capability gate bounds — note in comment). (Optionally rename to `CollectionPanel.tsx` — keep a re-export if renamed.)
- `src/app/edit/[token]/components/layout/PageSwitcher.tsx` — open the panel per collection present in pages (`collectionKeysInPages`), passing `collectionKey`; `showProductsModal()` call-site updated (widen the modal-manager signature if it carries no payload today).

**Steps**
1. Store actions already take the collection arg (generic) — UI-only change.
2. Empty-collection add flow must work post-reveal (acceptance criterion) — verify `ensureCatalogPage`/`addCollectionItem` path from the panel.

**Verification:** `npx tsc --noEmit`; `npm run test:run` (no regressions in `pageActions.test.ts`); manual `npm run dev`: naayom products panel behaves exactly as before (grandfather check); a fixture/dev project with services pages shows "Services" panel with add/rename/remove/reorder.

---

## Phase 7 — Conformance test: declared collection capability ⇒ block pair exists (ships vacuous)

**Goal:** lock the contract that lets block pairs ship demand-gated later. Assertion shape: **IF a template declares a collection-family capability THEN** `capabilitySections` includes that def's `catalogSectionType` + `itemSectionType` AND each resolves non-placeholder in BOTH the edit and published registries. Today NO template declares one, so the assertion is vacuously true — it becomes real the moment a rung-C template declares. Do NOT bind it to techpremium (retired) or any real template; a deliberate negative fixture in the test may prove the assertion bites.

**Files touched**
- `src/modules/templates/conformance.test.ts` — the quantified assertion above (extends the existing capability-evidence pattern); plus an explicit assertion that vestria does NOT declare any collection-family capability (flat-grid stays out — regression lock for issue-1).
- `src/modules/templates/blockManifest.test.ts` — expected untouched (no manifest-covered template declares a collection capability); edit only if the fixture approach forces it.

**Verification:** `npx tsc --noEmit`; `npm run test:run` — full suite green (conformance, dispatch, blockManifest, registration, coreParity, plus everything from phases 1–6).

---

## Cross-cutting notes

- **Dormant-ship summary:** phases 5 and 7 ship with no live trigger (no template declares a collection-family capability; block pairs are rung-C Scope-OUT). Phase 3's `requiredCollections` population is the only live behavior switch and is human-gated.
- **Vestria firewall:** `catalog` capabilityId = flat grid, never a `CollectionKey`, never a registry def. Locked by phase-1 comments/types + phase-5 no-fire test + phase-7 negative assertion.
- **No DB migration:** `facts.collections` rides Brief JSON; item content rides page content. If anything forces schema change, STOP — human gate + `prisma migrate dev` (never `db push`).
- **Dual-renderer:** no block-pair work in scope; any incidental renderer edit = `.tsx` + `.published.tsx` together; never import a `'use client'` fn into published.
- **Untouchables:** Vestria flat-grid (`VestriaCatalogueGrid.core.tsx`), naayom builders (`buildNaayomProductPages`), techpremium (retired — no capability additions), blog/testimonials systems, `waterfall.ts` per-field loop.
- **Grep-first rule:** where this plan says "re-point occurrences", the implementer greps for the literal and edits what exists — no invented edits (fit.ts and businessTypes/config.ts contain NO `catalog` capability literals; phase 1 does not touch them).
- **Build:** `npm run build` (not bare `next build`) before merge; merge to main = human gate per branch rules.

## Open questions

1. Rename vestria's `catalog` → `catalog-grid` for clarity, or keep as-is? (Plan assumes keep — zero test churn.)
2. Phase 3: populate `requiredCollections` for manufacturer/photographer now (all such leads → manual until rung-C), or ship mechanism empty?
3. Rename `ProductsModal.tsx` → `CollectionPanel.tsx` in phase 6, or defer?
