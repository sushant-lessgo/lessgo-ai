# template-factory — implementation audit

## Phase 1 — `templateConformance(templateId)` consolidation

### Files changed
- `src/modules/templates/templateConformance.ts` (NEW) — parameterized per-template
  suite factory + shared `contractFor` and other deduped helpers.
- `src/modules/templates/conformance.test.ts` (REWRITE) — loops
  `templateConformance(id)` per templateId; retains cross-template/global +
  template-specific exemption proofs.
- `src/modules/templates/blockManifest.test.ts` (DELETED) — its 3 checks folded
  into `templateConformance`.
- `src/modules/templates/publishedClientBoundary.test.ts` (DOC-COMMENT ONLY) —
  added a cross-reference header naming it as the global boundary-enforcement
  point; assertions untouched.

### What changed, per file

**`templateConformance.ts` (new).** Holds the consolidated per-template suite and
all shared machinery: `RESOLVERS`, `resolvesReal`, `resolveComponent`, the single
shared `contractFor(layoutName)` (deduped from the two identical local copies),
`contractKeys`, `classify`, `synthContent`, `ALL_ASSETS`, `COLLECTION_FAMILY`,
`STRUCTURAL_CAPABILITIES`, `assertCollectionCapabilityBacked`, and
`templateConformance(templateId)`. The factory reads `templateMeta[templateId]`
to apply the retired/bespoke exemptions itself. Header carries the
published/client-boundary cross-reference (names `publishedClientBoundary.test.ts`
as the enforcement point; does not reinvent it).

**`conformance.test.ts` (rewrite).** Now: (1) global resolver+meta key parity;
(2) `for (const id of templateIds) templateConformance(id)`; (3) global sanity
(≥1 manifest declaration; structural-cap ⊆ closed vocab); (4) template-specific
exemption proofs kept verbatim (lumen bespoke D-A #2, techpremium retired,
vestria flat-grid); (5) global (d) dormancy lock + negative fixtures (drive the
exported `assertCollectionCapabilityBacked` with fake metadata).

**`blockManifest.test.ts` (deleted).** All 3 checks folded — see mapping.

**`publishedClientBoundary.test.ts`.** One doc-comment block added to the header;
no code/assertion change.

### OLD-CHECK → NEW-HOME mapping (zero coverage loss)

| Old location | Old check | New home |
|---|---|---|
| conformance `it` | resolver entry for every templateId + templateMeta key parity | conformance.test.ts global `it` (kept) |
| conformance (a) | engine-core resolves real edit+published (skip retired/bespoke) | `templateConformance` group (a) |
| conformance (b) | declared block-backed capability → capabilitySections entry resolves non-placeholder | `templateConformance` group (b) |
| conformance (b+) | every capabilitySections VALUE resolves both modes | `templateConformance` group (b+) `it` #1 |
| conformance (b+) | every capabilitySections entry declared in capabilities (no orphan) | `templateConformance` group (b+) `it` #2 |
| conformance | structural cap list ⊆ closed capability vocab | conformance.test.ts global `it` (kept) |
| conformance | lumen bespoke: skipped by (a), load-bearing missing work-core | conformance.test.ts `lumen bespoke exemption` (kept) |
| conformance | lumen exercised by (b): gallery+lead-form resolve | conformance.test.ts `lumen bespoke exemption` (kept) |
| conformance (c) | default layout ∈ declared variants | `templateConformance` group (c) `it` (also absorbs blockManifest(1) — deduped) |
| conformance (c) | each variant resolves real block both modes | `templateConformance` group (c) |
| conformance (c) | internalDispatch variant === default component both modes | `templateConformance` group (c) |
| conformance (c) | non-dispatch variant !== default component both modes (distinctness) | `templateConformance` group (c) |
| conformance (d) | per-template: declared collection cap ⇒ resolvable catalog+item pair | `templateConformance` group (d) |
| conformance (d) | DORMANT: no shipping template declares a family cap | conformance.test.ts global (kept) |
| conformance (d) | vestria stays flat-grid (`catalog`, never family cap) | conformance.test.ts global (kept) |
| conformance (d) | negative fixtures: `products` no-evidence throws; `services` placeholder throws | conformance.test.ts global (kept; drives exported helper) |
| conformance (e) | MAIN: no both-ways-scalar-divergent co-eligible pair per section | `templateConformance` group (e) main loop |
| conformance (e) | CONSISTENCY: different-copyShape co-eligible pairs runtime-hidden both ways | `templateConformance` group (e) (per-template scoped) |
| conformance (e) | HYGIENE: copyShape never collides with a consumed key | `templateConformance` group (e) (per-template scoped) |
| conformance | techpremium retired: empty engine/capability lists | conformance.test.ts global `it` (kept) |
| blockManifest (1) | default ∈ variants | folded into `templateConformance` (c) default-membership `it` (deduped — identical assertion) |
| blockManifest (2) | every capacity minCards ≤ maxCards | `templateConformance` block-manifest data group |
| blockManifest (3) | consumes ⊆ getAllElements(contract) | `templateConformance` block-manifest data group |
| blockManifest | "has at least one declaration" sanity | conformance.test.ts global "≥1 manifest declaration" `it` |
| blockManifest | local `contractFor` helper | deduped into shared `contractFor` in templateConformance.ts |
| conformance (e) | local `contractFor` helper | deduped into shared `contractFor` in templateConformance.ts |

Every old `it`/assertion is accounted for. The only intentional dedupe:
blockManifest(1) `default ∈ variants` and conformance(c) `default layout is one
of the declared variants` are the identical assertion — kept once in (c).

### Deviations
- Added a guard `it('is a registered template …')` at the top of every
  `templateConformance(id)` suite. Reason: vitest errors on an empty `describe`,
  and retired techpremium (no engines/capabilities/manifest) would otherwise emit
  an empty suite. Conservative — asserts only meta+resolver presence (already
  covered globally), keeps every suite non-empty.
- The block-manifest capacity group emits a `declares no capacities (nothing to
  check)` placeholder `it` when a template (e.g. vestria) has zero capacity
  declarations — same empty-`describe` avoidance. No assertion lost: originally
  the capacity loop was global so at least one template supplied a body; per
  template some have none.
- (e) CONSISTENCY and HYGIENE checks are now scoped per-template inside the
  factory (originally single global loops). Coverage identical (they only compare
  variants within one section/set); split emission if anything strengthens
  granularity.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run conformance.test.ts publishedClientBoundary.test.ts` —
  `Test Files 2 passed`, `Tests 199 passed`. Boundary test green and unweakened.
- `npm run test:run` (full) — `Test Files 137 passed | 1 skipped (138)`,
  `Tests 2103 passed | 3 skipped (2106)`.

### Open risks
- `templateConformance.ts` is a non-`.test` module that statically imports every
  template resolver/placeholder/schema. It is imported ONLY by
  `conformance.test.ts` (vitest-only), so the registry firewall is unaffected —
  same idiom as the former test file. If any app/bundle code ever imports it, the
  firewall would break; a future guard could enforce test-only importers.

## Phase 1 — impl-review verdict
- Verdict: **ship** (loop 1). Independent reviewer confirmed faithful pure refactor: every OLD assertion (conformance.test.ts groups a/b/b+/c/d+neg-fixtures/e, key-parity, structural-cap, lumen bespoke, techpremium retired) + blockManifest.test.ts's 3 checks mapped to a live NEW home; single deduped `contractFor`; boundary test assertions untouched; guard/placeholder `it`s inert. Gate re-run by reviewer: `tsc --noEmit` clean, `test:run` 2103 passed/3 skipped.
- Non-blocking (orchestrator note): a FOREIGN commit `82f5d806` (editor-phase-3 "shell shift crossAxis", ToolbarShell.tsx) appeared on `feature/template-factory` from concurrent work — NOT part of this pipeline. Left in place; raise at the merge gate (may need cherry-pick off / belongs to editor track).

## Phase 2 — editor-basics conformance subset + shared block-mock home

**Files changed**
- `src/modules/templates/meridian/components/MeridianEditable.tsx` — emit `data-edit-primitive`
- `src/modules/templates/hearth/components/HearthEditable.tsx` — emit `data-edit-primitive`
- `src/modules/templates/blockMocks/harness.ts` (new) — extracted store-mock scaffolding
- `src/modules/templates/blockMocks/meridian.ts` (new) — canonical MERIDIAN_BLOCK_MOCKS + editBasics
- `src/modules/templates/blockMocks/hearth.ts` (new) — hearth mocks + editBasics
- `src/modules/templates/blockMocks/index.ts` (new) — registry + editBasics types
- `src/app/dev/meridian/blocks/mockContent.ts` — now a thin re-export
- `src/modules/templates/__tests__/renderParity.meridian.test.tsx` — re-point import + consume harness
- `src/modules/templates/templateConformance.ts` — assertEditorBasics() group
- `src/modules/templates/conformance.test.ts` — enroll editor-basics (meridian+hearth) + store mocks

### Prerequisite-check findings (all confirmed, no divergence from plan)
- `src/modules/editing/primitiveTypes.ts` EXISTS and is types/declarations only (PrimitiveKind, PrimitiveSlot, ImageCollectionItem, LogoValue) — no React/hooks. Prereq satisfied.
- NOTHING emitted an editable marker before this phase — grep confirms only data-element-key/data-section-id were emitted; the new data-edit-primitive attr had zero occurrences repo-wide before this phase.
- MeridianEditable + HearthEditable already emit data-element-key/data-section-id in the preview (mode !== 'edit') static path — confirmed; the new marker was added alongside them there (and on the edit-mode button-selectable path).
- Published boundary: .published.tsx blocks do NOT import the Editable wrappers (they read flat props), so the marker never reaches published HTML. Global publishedClientBoundary.test.ts still enforces this.

### What changed, per file
- MeridianEditable / HearthEditable: added `const editPrimitive = isButton ? 'button' : 'text'` and emit `data-edit-primitive={editPrimitive}` on (1) the button-selectable edit path and (2) both static (preview/published) branches (isHtml + plain). No layout/CSS change; attr is pixel-neutral (phase-7 safe). The mode:'edit' text path delegates to InlineTextEditorV2 (out of scope, not in files-touched) — marker not added there; assertions run in preview, the only jsdom-drivable path.
- harness.ts: extracted buildStoreState(sections) + createHarnessStore(sections) VERBATIM from renderParity (behavior-preserving). Per the review caveat, vi.mock/vi.hoisted were NOT moved — they stay inline in each test file.
- blockMocks/meridian.ts: MERIDIAN_BLOCK_MOCKS moved verbatim from the dev path + new MERIDIAN_EDIT_BASICS (per-section marker expectations authored against each block's ACTUAL preview render path).
- blockMocks/hearth.ts: new mocks for the 7 hearth manifest-declared blocks + editBasics.
- blockMocks/index.ts: EditBasicsExpectation/CollectionExpectation/BlockMockSection types + BLOCK_MOCKS registry (meridian, hearth) + ALL_BLOCK_MOCK_SECTIONS. Unique sectionIds (template-section) so one store seeds all.
- mockContent.ts: thin re-export of the canonical home; MeridianBlocksStage import unchanged.
- renderParity test: import from canonical home + createHarnessStore(SECTIONS); local buildStoreState/createStore removed; vi.mock shims + assertions unchanged. Stays green (proves extraction changed no behavior).
- conformance.test.ts: added vi.mock of @/hooks/useEditStoreLegacy (selector-honoring useEditStoreLegacy + useEditStoreApi) and @/components/EditProvider (useEditStoreContext) onto one store seeded from ALL_BLOCK_MOCK_SECTIONS; enrolled assertEditorBasics('meridian') + ('hearth').

### Exact selectors asserted (per manifest-declared edit block, preview mode)
- text slot: [data-edit-primitive="text"][data-element-key="KEY"] — exactly 1.
- button slot: [data-edit-primitive="button"][data-element-key="KEY"] — exactly 1.
- collection item roots: [data-element-key^="countPrefix"] count === N mock items (concrete per-item marker, not undefined). meridian features features_title_ -> 6; testimonials testimonials_quote_ -> 3 + logos logos_name_ -> 6; pricing tiers_plan_ -> 3; footer footer_columns_heading_ -> 4; hearth nav nav_items_label_ -> 4, services services_title_ -> 3, packages packages_name_ -> 3, footer social social_platform_ -> 3.
- no-orphan: every [data-edit-primitive] element's key is in (text union button) OR startsWith a collection itemPrefix — catches dead/undeclared markers.

### editBasics authored against ACTUAL preview render (concrete exclusions found)
- meridian header: nav labels render as plain anchors in preview (NOT editable) -> NO nav_items collection markers.
- meridian footer: newsletter_* render only when a form is connected; column LINKS render only in mode:'edit' -> only column HEADINGS are markers; text = wordmark/tag/copyright/location.
- meridian hero: cta_subtext absent from mock -> not rendered in preview (mock-excluded optional, exempt).

### Explicitly NOT machine-checked (declared it.skip with reason, per template -> phase-11 /manual-test)
- image-upload wiring (per-block inline uploadImage — no shared image primitive component to mark yet)
- logo primitive interaction
- collection add/remove/reorder affordances (edit-only, absent in preview)
- Button-Settings popover actually opening

### Negative control (red-then-reverted)
Temporarily removed data-edit-primitive from MeridianEditable's plain static branch -> conformance went RED with 25 failed assertions, e.g.:
```
x text slot "logo_text" -> exactly one [data-edit-primitive="text"]
x button slot "signin_text" -> exactly one [data-edit-primitive="button"]
x text slot "status_text" -> exactly one [data-edit-primitive="text"]
x text slot "wordmark" -> exactly one [data-edit-primitive="text"]
FAIL editor-basics edit-primitive markers (meridian) > header (MeridianNavHeader) > text slot "logo_text"
```
(hearth stayed green — marker only stripped from MeridianEditable; headline stayed green — it renders via the isHtml branch, which still emitted the marker.) Marker restored; suite green again.

### Verification
- npx tsc --noEmit — clean.
- npx vitest run conformance.test.ts renderParity.meridian.test.tsx — 321 passed / 8 skipped. renderParity green post-extraction; new editor-basics pass for meridian+hearth; 8 skipped = the 4 not-machine-checked items x 2 templates.
- npm run test:run — 2199 passed / 11 skipped / 1 failed. The single failure (i18nHonesty.test.ts -> generateStaticHTML 2-locale fixture) is a 5s test-timeout flake under full-suite load (unrelated to this phase — untouched file, per-file mocks can't leak); it PASSES in isolation (vitest run i18nHonesty.test.ts -> 15/15). No regressions attributable to phase 2.

### Deviations
- The mode:'edit' text path (InlineTextEditorV2) does NOT emit the marker — that component is out of files-touched and jsdom can't drive contentEditable anyway; the plan asserts in preview. Conservative, in-scope. Logged here.
- conformance.test.ts useEditStoreLegacy mock also provides useEditStoreApi (needed by hearth blocks' useImageToolbar) — a superset of the renderParity mock, required for the hearth render path. In-scope (test file on the list).

### Open risks
- editBasics expectations are hand-authored from each block's source; if a block's preview render path changes (e.g. a slot becomes edit-only), the expectation must be updated. The no-orphan + exact-count checks make drift loud (red), not silent.
- Foreign commit 82f5d806 (editor-track) still present on the branch — flagged in phase 1; not touched here.

## Phase 2 — impl-review verdict
- Verdict: **ship** (loop 1). Independent reviewer confirmed: `data-edit-primitive` emitted ONLY edit-side (zero `.published.tsx` refs — dual-renderer safe); text→exactly-one `[data-edit-primitive="text"][data-element-key]`, button→"button", collections→`[data-element-key^=prefix]` count===N (concrete, non-vacuous); 4 not-machine-checked items are `it.skip` with reasons; negative control genuinely red on marker-absence; mock re-export keeps old path working, renderParity re-pointed with assertions unchanged, harness extracted w/ vi.mock shims left inline; hearth mocks cover all 7 manifest blocks. Gate: `tsc` clean, `test:run` 2200 passed/11 skipped/0 failed.
- Non-blocking: (1) i18n `i18nHonesty.test.ts:122` 5s-timeout flake surfaces more under heavier suite load — pre-existing, NOT Phase 2 (touches no i18n/staticExport); owner=i18n, bump that test's testTimeout separately. (2) per-collection-item marker verified indirectly (via scalar negative control + no-orphan), acceptable per brief.
