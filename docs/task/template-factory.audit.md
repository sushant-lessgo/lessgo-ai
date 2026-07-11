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

## Phase 3 — knob mechanism (data-attr axes, tokens, injection)

**Files changed**
- `src/types/template.ts` — added `KnobAxis`/`KnobValue`/`KnobSelection`/`TemplateKnobDeclaration` types; extended `ThemeInjector` + `SSRTokens` prop signatures with optional `knobs?: KnobSelection`; added optional `TemplateModule.knobs?`.
- `src/modules/templates/knobs.ts` (new) — standard axis registry (pure data leaf).
- `src/modules/templates/shared/knobCss.ts` (new) — serializer + attr-apply helpers.
- `src/modules/templates/shared/knobCss.test.ts` (new) — 12 unit tests.
- `src/lib/staticExport/htmlGenerator.ts` — thread `knobs` option → published renderer.
- `src/lib/staticExport/renderPublishedExport.ts` — `knobs?` input + threaded into all 3 `generateStaticHTML` calls (root/subpage/locale).
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` — `knobs` prop → `tmpl.SSRTokens`.
- `src/modules/templates/templateConformance.ts` — exported conditional `assertKnobConformance` (dormant this phase).

### Axis registry (`knobs.ts`)
`STANDARD_KNOB_AXES` (pure data, type-only import from `types/template`, NO template imports → firewall-safe):

| axis | attr | values | default (emits nothing) |
|------|------|--------|--------------------------|
| buttonShape | `data-knob-buttonShape` | square · rounded · pill | rounded |
| cardStyle | `data-knob-cardStyle` | hairline · shadow · flat | hairline |
| density | `data-knob-density` | compact · comfortable · spacious | comfortable |
| typePairing | `data-knob-typePairing` | classic · condensed · editorial | classic (aliases variant axis) |
| texture | `data-knob-texture` | none · grain · paper | none (subsumes mood) |

`knobAttr(axis)` is the single source of truth for the `data-knob-<axis>` convention. Helpers: `isValidKnobValue`, `isDefaultKnobValue`, `KNOB_AXES`. The registry holds VOCABULARY only — the CSS values each value emits are template-provided (tokens.ts, phase 8), mirroring how `serializeVariantOverrides` is per-template while the format is standard.

### Serializer contract (`shared/knobCss.ts`) — default-emits-nothing proof
Two halves, both upholding "default = `:root`":
1. `serializeKnobOverrides(tokenMap)` → CSS text. For each axis/value with declarations, emits `[data-knob-<axis>="<value>"]{--var:val;…}` (scoped on the wrapper attr, NOT `html[...]`, so it applies at any depth — identical scoping law to `serializeVariantOverrides`). **DEFAULT value is `continue`-skipped**; empty token map → `''`; values with no declarations skipped; deterministic STANDARD axis order.
2. `knobDataAttributes(selection)` → wrapper attr object. Emits `data-knob-<axis>` ONLY for a selected value that is (a) truthy, (b) non-default, (c) in the axis vocabulary. Null/undefined/`{}` selection → `{}` (no attrs). Stale/hostile values ignored (never thrown).

Test proof (12 tests, all green): empty map → `''`; default value → `''`; non-default → exact scoped block `[data-knob-buttonShape="pill"]{\n  --btn-radius:999px;\n}`; no `html` in output; multi-var/multi-value with default skipped; empty-decl skip; axis-order; and the attr helper mirror-cases (null/default → `{}`, non-default → attr, invalid ignored, mixed selection skips default axis). This is the byte-identical guarantee for knob-unaware / all-default projects.

### Published-seam threading (exact)
Mirrors the `mood` flow verified in the plan:
- `StaticHTMLOptions.knobs?: KnobSelection | null` (htmlGenerator.ts) → passed as `knobs: options.knobs ?? null` into `LandingPagePublishedRenderer` alongside `mood`.
- `RenderPublishedExportInput.knobs?` → destructured → `knobs: knobs ?? null` added to ALL THREE `generateStaticHTML` call sites (root L~198, subpage L~292, locale-fanout L~447).
- `LandingPagePublishedRenderer`: new `knobs?: KnobSelection | null` prop (default `null`) → `<tmpl.SSRTokens … knobs={knobs ?? undefined}>`.
- Edit side: `ThemeInjector`/`SSRTokens` prop signatures both carry optional `knobs?` in `types/template.ts`; `knobDataAttributes` is the shared helper both a future ThemeInjector and SSRTokens use to apply attrs identically. NO template SSRTokens/ThemeInjector wired this phase (that is phase 8) — knob-unaware templates simply ignore the extra prop, so output is byte-neutral.
- No caller of `renderPublishedExport`/`generateStaticHTML` passes `knobs` yet (optional → `undefined`/`null` everywhere), so published output is unchanged this phase.

### Conformance rule (conditional, dormant)
`assertKnobConformance(templateId, knobs)` exported (NOT auto-fired inside `templateConformance`, same pattern as `assertEditorBasics`). When `knobs` is `undefined` → single green "does not declare knobs" test. When declared → asserts the FULL standard axis set is covered, each axis' declared values are a non-empty subset of the standard vocabulary AND include the axis default. Looks-truthfulness half deferred to phase 8 (needs `templateMeta.looks`). No template declares knobs yet and the helper is not enrolled in `conformance.test.ts` this phase → suite stays green (2212 passed / 11 skipped).

### DraftSaveSchema confirmation (read-only, no edit)
`src/lib/validation.ts:32` — `themeValues: z.record(z.string(), z.unknown()).optional()`. Fully permissive; `themeValues.knobs` passes through unchanged. saveDraft route persists `themeValues` as-is (`route.ts:221/232`). No edit made or needed.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run …/knobCss.test.ts` — 12 passed.
- `npm run test:run` — 2212 passed | 11 skipped (138 files pass, 1 skipped); no failures.
- `npm run build` — green (build:published-css → build:assets → next build all succeeded; route table emitted; grep for error/failed → none). Published CSS path unaffected.

### Deviations
- Axis value vocabularies + per-axis defaults are pragmatic/semantic picks (documented in `knobs.ts`). They are inert this phase (no template opts in). Conservative note recorded: a template opting in (phase 8) MUST align its `:root` with each axis default so all-default renders stay byte-identical — stated in the `knobs.ts` header LAW comment.
- `typePairing` is defined with generic archetype values (classic/condensed/editorial) as a placeholder vocabulary; phase 8 will map hearth's stored variantIds to these as aliases. Flagged so phase 8 can adjust the vocabulary if hearth's variant names differ.

## Phase 3 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer confirmed dormant + byte-neutral: default value emits NO CSS on BOTH `serializeKnobOverrides` (knobCss.ts:49) and `knobDataAttributes` (:78-80), asserted in tests; published seam threaded as optional `knobs` option through all 3 `generateStaticHTML` call sites (renderPublishedExport.ts:198/293/449) → LandingPagePublishedRenderer → `tmpl.SSRTokens`, no template SSRTokens/ThemeInjector wired; `assertKnobConformance` defined-but-not-enrolled (single green "does not declare knobs" test); firewall intact (type-only + data imports, no template components); serializer wrapper-scoped `[data-knob-*]` not `html[...]` (test asserts). Gates re-run: tsc clean, test:run 2212 passed/11 skipped, build green.
- Non-blocking: (1) `typePairing` placeholder vocab (classic/condensed/editorial) → phase 8 realigns to hearth's real variantIds. (2) serializer/attr helpers consumed only by tests this phase (dormant mechanism) — land for phase 8.

## Phase 4 — design-kit generator

**Files changed**
- `src/modules/engines/designKit.ts` (new)
- `src/modules/engines/designKit.test.ts` (new)
- `scripts/generateDesignKit.ts` (new)
- `package.json` (added `kit:generate` script only)

### designKit.ts — kit structure
Pure derivation joining four flat maps per copy engine into a `DesignKit`:
- required sections IN ORDER ← `engineCoreSections[engine]`;
- per-section slots (key, required, fillMode, isCard, inferred primitive) + card min/max ←
  `getAllElements()` / `getCardRequirements()` over the section schema;
- capacities / requiresAssets / declared variants ← `blockManifests[flagship][sectionType]`;
- knob RANGES ← `STANDARD_KNOB_AXES` (full axis set, values, default, note);
- `KitFormat` block: class-prefix convention, design-axis attrs
  (`[data-palette]`/`[data-variant]`/`data-knob-*`/`[data-surface]`), self-hosted font whitelist
  (hardcoded from `src/styles/fonts-self-hosted.css` with a pointer comment), self-contained rules.
`renderDesignKitMarkdown(kit)` renders the kit to markdown (sections-in-order line, per-section
slot tables + capacity/variants, knob-range table, format-constraints block).

Types exported: `DesignKit`, `KitSection`, `KitSlot`, `KitVariant`, `KitKnobAxis`, `KitFormat`,
`ContractSource`, `SELF_HOSTED_FONTS`; fns `buildDesignKit`, `renderDesignKitMarkdown`.

**Firewall:** only TYPE-only imports (`CopyEngine`, `TemplateId`, `PrimitiveKind`, manifest/schema
types) + PURE-DATA leaves (`coreSections`, `elementContracts`, `blockManifest`, `knobs`, audience
element schemas + their pure helpers `getAllElements`/`getCardRequirements`/`layoutElementSchema`).
No `.tsx`, no `'use client'`, no resolver/ThemeInjector/SSRTokens. `tsc --noEmit` clean confirms.

### Engine → source (contract vs legacy-layout)
- **thing** → flagship `meridian`; all 5 core sections resolve via the populated
  `elementContracts.thing` → labeled **contract**.
- **trust** → flagship `hearth`; `elementContracts.trust` NOT populated → sections resolve via
  `PILOT_LAYOUT_NAMES[sectionType]` → `layoutElementSchema` → labeled **legacy-layout**.
- **work** → flagship `granth`; `elementContracts.work` NOT populated → section→layout derived by
  scanning `writerElementSchema` for matching `sectionType` → labeled **legacy-layout**.

### CLI
`scripts/generateDesignKit.ts` — thin CLI, flags `--engine=<thing|trust|work>`, `--out=<path>`
(dir when multiple engines), `--all`; no args → all engines to stdout. Outputs NOT committed.
Invocations verified: `npm run kit:generate -- --engine=thing|trust|work` and
`npx tsx scripts/generateDesignKit.ts --engine=<e>`. (`kit:generate` uses `npx tsx` to match the
repo's existing `.ts`-script convention — `tsx` is not a local devDep; adding one is out of this
phase's file scope.)

### Sample output excerpt (thing engine — real derived data)
```
# Design kit — `thing` engine
_Derived artifact. Flagship reference template: `meridian`. ..._

## Required sections (in order)
`header` → `hero` → `features` → `testimonials` → `footer`

### `hero` — ref layout `TerminalHero`  _(source: contract)_
| slot | req | fill | primitive | card |
| `headline` | required | ai_generated | `text` |  |
| `cta_text` | required | ai_generated | `button` |  |
| `hero_image` | optional | manual_preferred | `image` |  |
| `stats.value` | optional | ai_generated_needs_review | `text` | yes |
- Collection `stats`: min 0, max 4 (optimal 0–4).
- Declared variants:
  - `TerminalHero` · Terminal hero
  - `EditorialPhotoHero` · Editorial photo hero [needs photos] — Photo-led split hero — needs a hero image.
```
(Full hero slot list = 24 keys — the LIVE meridian∪vestria thing-contract union; capacities +
variants come straight from the live `blockManifest`.)

### Verification
- `npx tsc --noEmit` — clean.
- `npx vitest run src/modules/engines/designKit.test.ts` — 11 passed.
- `npm run test:run` — 2223 passed | 11 skipped (140 files); no regressions vs phase-3 baseline.
- CLI run for all 3 engines — thing (contract), trust + work (legacy-layout) all emit real
  sections/slots/capacities/knob-ranges/format block.

### Deviations
- **Primitive assignments are HEURISTICALLY INFERRED**, not declared. No per-slot primitive
  declaration exists in the schema yet (future editorPlan work); `inferPrimitive()` maps by key
  name (logo/image/link/button/text). Conservative: surfaced as a design HINT (documented in the
  `KitSlot` doc comment), not a hard contract. Chose inference over omission so the kit's
  edit-primitive column is populated per the phase brief.
- **Flagship per engine** (meridian/hearth/granth) chosen as the capacity/variant reference source
  since `blockManifest` is template-keyed and the kit is engine-level. `granth` has no manifest
  entry → work sections carry no manifest capacity/variants (only schema-derived card min/max),
  which is correct (nothing to surface).

### Open risks
- None for this phase. The kit is a design-time artifact only (not imported by any runtime path);
  the font whitelist is the one hand-synced datum (pointer comment flags the source CSS for phase-5
  lint parity).

## Phase 4 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer confirmed: derived from live maps (engineCoreSections + elementContracts/layoutElementSchema via getAllElements/getCardRequirements + blockManifests + STANDARD_KNOB_AXES), test re-derives liveKeys (no frozen golden); firewall intact (traced transitive imports — all type-only/pure-data, no .tsx/blocks/resolver); all 3 engines generate (thing=contract, trust/work=legacy-layout fallback via resolveEngineSectionSchema, sections labeled with source); heuristic `inferPrimitive` honestly labeled as hint in code + audit; outputs not committed. Gate: tsc clean, test:run 2223 passed/11 skipped/0 failed.
- Non-blocking (deferred polish, not fixed this phase): (1) rendered markdown prints inferred `primitive` column without an "inferred hint, not contract" legend — add a footnote in renderDesignKitMarkdown; borderline vs spec's don't-present-guesses-as-truth. (2) `inferPrimitive` misses bare `socials.href`→text (suffix rule only matches `_href`). (3) dead ternary scripts/generateDesignKit.ts:38-40. (4) `kit:generate` uses `npx tsx` w/ no local devDep. → capture in a phase-11 or cleanup pass.
