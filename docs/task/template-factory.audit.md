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

## Phase 5 — handoff lint

**Files changed**
- `src/modules/templates/handoffLint.ts` (new — pure lint core + `formatLintResult`)
- `src/modules/templates/handoffLint.test.ts` (new — 8 tests, acceptance criterion)
- `src/modules/templates/__fixtures__/handoff-valid.html` (new — minimal passing, thing engine)
- `src/modules/templates/__fixtures__/handoff-broken.html` (new — missing testimonials section + missing hero.headline required slot)
- `src/modules/engines/designKit.ts` (cross-edit — 2 marker-convention rules added to the kit format block)
- `scripts/lintHandoff.ts` (new — thin CLI)
- `package.json` (new `kit:lint` script only)

### Marker convention (defined in lint doc header + stated in kit format block)
- **Section:** one container per required engine section carrying `data-section="<sectionType>"` (values = the engine contract's section names).
- **Slot:** representable two ways, both accepted — `data-slot="<slotKey>"` (explicit handoff marker) OR `data-element-key="<slotKey>"` (a real editable element, the same attr the editor emits). Slot markers are **section-scoped**: a slot counts only inside its section's container region (slot keys like `headline` recur across sections, so a global check would be unsound — proven by a dedicated test).

### designKit.ts cross-edit
Needed: **yes**. Phase-4's format block stated tokens/palette/variant/knob/surface/font/prefix rules but NOT the two handoff markers. Added exactly two rules to `format.rules` (`data-section` per section, `data-slot`/`data-element-key` per slot) with a pointer comment to `handoffLint.ts` so kit and lint stay in sync. Minimal; no shape/type change; no test asserted an exact rule count so nothing regressed.

### Checks implemented
1. **missing-section** — every `engineCoreSections[engine]` section must have a `data-section="<type>"` marker.
2. **missing-required-slot** — every required slot (from `buildDesignKit(engine)`, derived, not hardcoded) must be representable inside its PRESENT section's region (absent sections are covered by check 1, not double-counted).
3. **axis** — `:root` block present; `[data-palette]`, `[data-variant]`, and at least one `data-knob-*` selector present.
4. **font** — every literal `font-family` / `--*font*` family ⊆ `SELF_HOSTED_FONTS` (generics + `var()` refs skipped).
5. **self-contained** — no external stylesheet `<link>`, `<script src>`, `@import`, or `url()` (http(s):// or protocol-relative //). Content anchors are intentionally NOT flagged.

Required sections/slots are DERIVED via phase-4 `buildDesignKit(engine)` — no section/slot list in the lint, so it can't rot.

### CLI output on the broken fixture
```
FAIL — src/modules/templates/__fixtures__/handoff-broken.html (engine: thing): 2 finding(s).
  [missing-section] 1
    - Missing required section: data-section="testimonials" not found.
  [missing-required-slot] 1
    - Section "hero": required slot "headline" not representable (data-slot="headline" or data-element-key="headline").
```
Exit code 1 on broken, 0 on valid (`PASS — ... no findings.`).

### Verification
- `npx tsc --noEmit` — clean (exit 0).
- `npx vitest run src/modules/templates/handoffLint.test.ts` — 8 passed. The broken fixture fails on BOTH `missing-section` AND `missing-required-slot` as two distinct findings (acceptance criterion); the valid fixture passes with zero findings.
- `npm run test:run` — 2231 passed | 11 skipped | 0 failed (was 2223 pre-phase; +8 new). No regressions.
- CLI run on both fixtures — output above.

### Deviations
- "Marker or matching element": implemented `data-slot` as the explicit marker and `data-element-key` as the "matching element" (the editor's real attr). Conservative, testable, and matches the phase-4 emitter convention. Logged here per in-scope-ambiguity rule.
- Fixture engine = `thing` (meridian, contract source — fully populated required slots) so the fixtures exercise real required slots. Lint itself is engine-agnostic (`--engine` flag, defaults thing).

### Open risks
- Section-region extraction assumes one top-level `data-section` container per section (nested `data-section` would truncate a region early). Stated as the handoff convention in the lint doc header + kit format block; acceptable for a pre-build lint. No nested-section fixture exercised.
- Font extraction is regex over declarations; exotic CSS (e.g. font shorthand `font: 14px 'X'`) isn't parsed — only `font-family` / `--*font*` custom props. Non-blocking for the handoff format (kit mandates `:root` custom-property tokens).

## Phase 5 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer confirmed acceptance criterion: broken fixture seeds TWO genuinely distinct defects (testimonials section omitted + hero present-but-missing-headline), test asserts both distinct finding types + independence (present-but-slotless ≠ missing-section; slot check section-scoped); valid fixture zero findings. Derived from buildDesignKit (no hardcoded lists); marker convention (data-section/data-slot/data-element-key) agrees kit↔lint with keep-in-sync pointer; all 5 checks real+tested (missing-section/missing-slot/axis/font/self-contained); designKit cross-edit minimal (2 rules + comment, no shape/import change), firewall intact. Gate: tsc clean, test:run 2231 passed/11 skipped/0 failed.
- Non-blocking (logged in audit as known risks): (1) sectionRegions assumes one top-level data-section per section — nested would truncate; kit mandates ONE container. (2) font extraction parses font-family/--*font* props not `font:` shorthand; kit mandates :root tokens.

## Phase 6 — anchor library

### Files changed
- `docs/product/anchorLibrary.md` (new) — curated anchor reference library + banned list.
- `src/modules/templates/anchorLibrary.test.ts` (new) — derived guard over the md.

### What changed
- **anchorLibrary.md:** 18 concrete anchors (≥15 required), grouped into 6 groups for tile
  divergence: A Swiss/Modernist grid (4), B Industrial/Utilitarian/Hardware (4), C
  Editorial/Print/Literary (4), D Warm/Craft/Human (3), E Bold/Expressive/Maximal (3), F
  Concrete software product refs (3). Each anchor = named site/movement/system + 1-line why
  + typeface/token cues (anchors, not adjectives), tagged with an `<!-- anchor -->` marker
  for unambiguous counting. Header states the how-to-use art-direction step (pull 3–5 from
  ≥3 different groups) and the guard-enforced maintenance rule.
- **Banned-list section (`## Banned fingerprints`):** (a) DERIVATION RULE — banned set
  includes every live `templateMeta.designStyles` value; rule stated so new templates
  auto-extend it, with current concrete values named: `tech-minimal` (meridian),
  `editorial-craft` (vestria, lumen), `warm-human` (hearth), `authority-professional`
  (lex), `bold-performance` (surge), `literary-quiet` (granth). techpremium retired/empty →
  contributes nothing. (b) 5 default-mode bans: Inter, purple gradients, glassmorphism,
  rounded-2xl card grids, emoji icons.
- **anchorLibrary.test.ts:** imports `templateMeta` (never hardcodes the expected set —
  so the guard bites on new templates), dedupes designStyles across all templates, extracts
  the `## Banned fingerprints` section, and asserts: banned ⊇ live designStyles; the 5
  default bans present (word-boundary `\bInter\b` to avoid matching "international" etc.);
  `<!-- anchor -->` count ≥15.

### Live designStyles the banned list covers
tech-minimal, editorial-craft, warm-human, authority-professional, bold-performance,
literary-quiet (6 distinct; editorial-craft shared by vestria+lumen, deduped in test).

### Guard red-on-removal demonstration
Temporarily replaced `- `bold-performance` (surge)`` in the md with a placeholder →
`npx vitest run src/modules/templates/anchorLibrary.test.ts` FAILED with:
"designStyle \"bold-performance\" is live in templateMeta but MISSING from the banned list
in anchorLibrary.md" (1 failed | 3 passed). Restored the line → 4 passed. Guard bites.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/modules/templates/anchorLibrary.test.ts` — 4/4 pass.
- `npm run test:run` — 2234 passed | 11 skipped | 1 failed. The one failure is
  `src/lib/i18n/i18nHonesty.test.ts` (generateStaticHTML 2-locale fixture) — a 5s TIMEOUT,
  unrelated to this phase and already documented as a pre-existing flake in the phase-2
  progress-log entry. Anchor-library changes touch only a docs file + a new isolated test;
  no shared code path affects i18n.

### Deviations
- None. Files-touched list honored exactly.

### Open risks
- Anchor QUALITY / taste (genuine distinctness, cue usefulness) is NOT machine-checked —
  deferred to the phase-11 founder gate per the plan (reviewed with the `/new-template`
  skill rewrite). The guard only protects the banned list from rotting + enforces count.

## Phase 6 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer verified guard non-vacuous: test imports live templateMeta, derives expected via `Object.values(templateMeta).flatMap(m=>m.designStyles)` (nothing hardcoded); red-on-removal reproduced (removing `bold-performance` → "live in templateMeta but MISSING from banned list", restored → 4/4). All 6 live designStyles + 5 default bans present (word-boundary regexes). Anchors concrete (Swiss Style, Teenage Engineering, Stripe, Aesop — real systems w/ typeface+token cues, no placeholder adjectives). i18n flake did not fire this run; full suite 2235 passed/0 failed; tsc clean.
- CORRECTION: actual anchor count is **21** (not 18 as narrated above) — guard asserts ≥15, passes. Anchor TASTE review deferred to phase-11 founder gate.

## Phase 7 — screenshot parity harness + diff

**Files changed**
- `src/app/dev/blocks/TemplateBlocksStage.tsx` (new) — generic per-template block gallery + parity stage.
- `src/app/dev/blocks/[template]/page.tsx` (new) — `/dev/blocks/<templateId>` route (client page, dynamic ssr:false).
- `src/app/dev/meridian/blocks/MeridianBlocksStage.tsx` — slimmed to a thin `dynamic({ssr:false})` wrapper over the generic stage (meridian-pinned).
- `src/app/dev/meridian/blocks/page.tsx` — re-pointed to render the slimmed wrapper (drops the old MeridianBlocksClient shell); metadata kept.
- `e2e/parity.spec.ts` (new) — visual/CSS parity pixel-diff spec (meridian + hearth + parityBreak negative control).
- `playwright.config.ts` — enrolled `parity.spec.ts` in the existing `public` (no-auth) project's testMatch.
- `package.json` — devDeps `pixelmatch@^7.2.0` + `pngjs@^7.0.0`; script `test:parity`.

### Generalization approach
`MeridianBlocksStage` (Meridian-only, static `resolveMeridianBlock` import, edit-mode
store) became `TemplateBlocksStage({templateId})`:
- Async-loads the template module via `preloadTemplate(templateId)` (registry) → uses
  `mod.resolveBlock(type, mode, layout)`, `mod.ThemeInjector`, `mod.variants`,
  `mod.defaultPaletteId/VariantId`, `mod.paletteImageKeywords`, `mod.knobs`.
- Content comes from the phase-2 `BLOCK_MOCKS[templateId]` registry (per-section
  sectionId/layout/content); the store is seeded exactly as before (loadFromDraft).
- Switcher is now generic: palette list = `Object.keys(paletteImageKeywords)`, variant
  chips = `mod.variants`, and a knob dropdown per `mod.knobs.axes` axis (empty until a
  template declares knobs — lights up for hearth in phase 8).
- Store mode is **`preview`** (was `edit`). Rationale below.
- The heavy subtree (ThemeInjector + EditProvider + store) is loaded via
  `dynamic({ssr:false})` from BOTH page wrappers, so the edit-store module (which
  touches `window` at eval time) never enters the SSR graph.

Both routes reach ONE component: `/dev/blocks/meridian` (new) and the historical
`/dev/meridian/blocks` (via the slimmed wrapper — kept mounting for
`e2e/render.spec.ts`).

### Store mode: preview, not edit (in-scope decision, logged)
The old gallery seeded `mode:'edit'`, which renders editing chrome (add/remove
collection affordances, edit-only nav "add" buttons, contentEditable). Those appear in
the edit band but never in published → they would be a FALSE parity divergence. The edit
blocks' `mode !== 'edit'` path (mode:'preview') renders the static, marker-emitting HTML
that is the fair visual match to `.published.tsx` — the same path `renderParity.meridian`
uses for content parity. So the stage seeds `preview`. This changes the /dev gallery from
an interactive-edit demo to a static visual/parity gallery (acceptable — the gallery's job
is block verification, and interactive editing is exercised elsewhere).

### Band selectors + parityBreak
Each section stacks two wrapper nodes:
- `[data-parity-band="edit"][data-parity-section="<type>"]` → the edit block (preview).
- `[data-parity-band="published"][data-parity-section="<type>"]` → the `.published` block.
Attrs are pixel-neutral. The switcher carries `data-parity-switcher` (hidden by injected
CSS before shots).

`?parityBreak=1` (read from `window.location.search`, default off) applies
`PARITY_BREAK_STYLE = { transform: 'scale(1.03)' }` to the EDIT band ONLY — a PERMANENT
negative control. `scale` displaces every pixel proportionally to its distance from the
origin, so it produces a large, band-wide signal even on the mostly-uniform (dark) hero
band. (A wrapper `background` tint was tried first and rejected: the block paints its own
opaque surface over the wrapper, so a tint is a visual no-op — noted in code.)

### Diff method + threshold
`e2e/parity.spec.ts` screenshots the two band nodes and diffs them TO EACH OTHER via
`pixelmatch` (per-pixel threshold 0.1) over `pngjs` buffers, cropped to their overlapping
top-left region (`cropTo`) so minor height deltas don't abort the diff. No stored baseline
(sidesteps OS-pinned snapshots). Before shots: `document.fonts.ready`, animations/transitions
off, `caret-color: transparent`, switcher hidden. Sections are DISCOVERED from the DOM
(`data-parity-section` on every edit band), so enrolling a template = adding its mocks.

`PASS_THRESHOLD = 0.03` (3% of compared pixels). Chosen from observed values (below) — it
sits comfortably above the worst real band (1.297%) and comfortably below the seeded break
(6.409%).

### Parity run summary (observed diff %, headless Chromium, mock dev server)
```
meridian/header       0.932%
meridian/hero         0.018%
meridian/features     0.000%
meridian/testimonials 0.624%
meridian/pricing      0.979%
meridian/cta          0.167%
meridian/footer       1.297%   ← worst real band
hearth/header         0.165%
hearth/hero           0.189%
hearth/services       0.181%
hearth/testimonials   0.183%
hearth/packages       0.093%
hearth/cta            0.000%
hearth/footer         0.249%
PARITY BREAK meridian/hero  6.409%   ← negative control, > 3% threshold
```
All meridian + hearth sections ≤ 3% (GREEN). parityBreak exceeds threshold (caught).
Clean separation: real ≤ 1.297% < 3% threshold < 6.409% break.

### Verification
- `npx tsc --noEmit` — clean. (e2e is excluded from tsc per tsconfig, so pngjs' missing
  bundled types don't affect the typecheck; pixelmatch@7 ships its own `.d.ts`.)
- `npm run test:run` — 2235 passed | 11 skipped, 0 failed (i18n flake did not fire).
- `npx playwright test render parity --project=public` — 6 passed: parity (meridian,
  hearth, parityBreak) + the 3 render.spec smokes incl. `/dev/meridian/blocks` (old URL
  still mounts, no error overlay).
- `pixelmatch` + `pngjs` install added only 2 packages (no heavy transitive deps).

### Deviations
- Store mode `edit`→`preview` (see above; conservative — required for true visual parity).
- Generic route `[template]/page.tsx` is a **client** page (needs `dynamic({ssr:false})`),
  so it cannot export `metadata` — the `robots:noindex` header is dropped there. Defensible:
  `/dev/*` is middleware-blocked in production regardless. Meridian's page stays a server
  component and keeps its metadata (renders the client wrapper).
- `MeridianBlocksClient.tsx` and `src/app/dev/meridian/blocks/mockContent.ts` are now
  ORPHANED (no importer) after the re-point. Left in place (not on the Files-touched list);
  they still compile. Flagging for a future cleanup sweep.
- parityBreak divergence went through three iterations (bg tint → translate → scale) to get
  a robust margin above threshold; final `scale(1.03)` yields 6.409% on hero.
- Added lightweight `console.log` of each section's diff % + the break % in the spec —
  informational (aids future margin diagnosis), does not affect assertions.

### Open risks
- Threshold is calibrated on headless Chromium at Desktop-Chrome viewport; a different
  browser/DPI could shift anti-aliasing noise. Only Chromium is used by the `public`
  project, so this is stable for the current suite.
- surge/vestria/lex not enrolled (no mocks yet — plan Q6 defer). Adding them later = add
  their `blockMocks` entry; the harness + spec pick them up with zero code change if added
  to the `TEMPLATES` list in the spec.

## Phase 7 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer INDEPENDENTLY RAN the parity spec (acceptance-criterion phase): 6 Playwright tests passed; meridian worst band footer 1.297%, hearth worst 0.249%, all ≤3% GREEN; `?parityBreak=1` hero 6.409% EXCEEDS threshold. Separation real+sensible (~1.7pt headroom below, ~3.4pt above — not rigged). Bands diffed to each other (no .png baselines committed). `mode:'preview'` sound: edit band = resolveBlock(type,'edit') (.tsx), published band = (type,'published') (.published.tsx) — two distinct components, preview only suppresses editing chrome, NOT vacuous. Old URL /dev/meridian/blocks still mounts. Gate: tsc clean, parity 6 passed; test:run 2234 passed/1 failed = the known pre-existing i18n timeout flake (outside phase scope).
- Non-blocking (cleanup): (1) MeridianBlocksClient.tsx + mockContent.ts now orphaned (no live importer, still compile) → delete in cleanup sweep. (2) generic [template]/page.tsx is client page, drops noindex header (dev route middleware-blocked in prod). (3) parityBreak uses transform:scale(1.03) — synthetic geometric break, exercises harness sensitivity. (4) i18n flake — raise its testTimeout eventually.

## Phase 8 — hearth knobs pilot + looks data  [HUMAN GATE]

**Files changed (all 7 target files):**
- `src/modules/templates/hearth/tokens.ts`
- `src/modules/templates/hearth/ThemeInjector.tsx`
- `src/modules/templates/hearth/components/HearthSSRTokens.tsx`
- `src/modules/templates/hearth/index.ts`
- `src/modules/templates/templateMeta.ts`
- `src/modules/templates/conformance.test.ts`
- `src/modules/templates/templateConformance.ts`

> PROVENANCE: the brief said a prior attempt was LOST and the tree sat at clean phase-7. In
> fact `git status` showed all 7 phase-8 edits already present and uncommitted in the working
> tree (my first Read calls returned stale snapshots; Grep + `git diff` revealed the real
> content). No re-implementation was needed — this pass REVIEWED the on-disk changes for
> correctness and ran the full verification suite. Nothing was re-written; the edits are intact
> and pass every gate. Also modified in the tree OUTSIDE my 7-file scope, left untouched by me:
> `docs/product/productBacklog.md` and `docs/task/template-factory.plan.md` (prior-attempt
> artifacts).

### Knob token extraction (tokens.ts)
- Hearth tokenizes TWO axes with real CSS via `hearthKnobTokenMap` (KnobTokenMap):
  - `buttonShape` retunes control radii `--r-md` + `--r-sm` (hearth `.hearth-btn`/inputs read
    these). square={--r-md:3px,--r-sm:3px}, pill={--r-md:999px,--r-sm:999px}. Default rounded =
    today's :root (14px/10px) so it emits NO block.
  - `density` retunes section rhythm `--sec-pad-y` (every section consumes it). compact=96px,
    spacious=180px. Default comfortable = today's :root (140px) emits NO block.
  - NO existing :root value changed; knob layers only override on a non-default data-attr. Both
    vars are already consumed by shipped hearth blocks/sectionRules, so no block file needed
    touching.
- `buildHearthStylesheet(knobs?)` is the SINGLE shared stylesheet builder used IDENTICALLY by
  both renderers. Appends the knob CSS block ONLY when `knobDataAttributes(knobs)` yields an
  active (non-default) attr; else returns base+palette+variant byte-identical to pre-phase-8.
  `serializeHearthKnobOverrides()` wraps the phase-3 shared `serializeKnobOverrides`.

### variant to typePairing aliases
- `hearthKnobs.axes.typePairing = [classic, condensed, editorial]` — these ARE the existing
  `hearthVariants` ids (already aligned; phase-3 placeholder vocab matched). typePairing carries
  NO knob CSS: a look sets the flat `variantId` and the existing `[data-variant]` layer renders
  it. Stored variantIds resolve exactly as today.
- Other two standard axes DECLARED (conformance requires the full 5-axis set) but hearth
  supports only their no-op default: cardStyle:[hairline], texture:[none].

### The 4 named looks (templateMeta.hearth.looks, >=3 required)
- warm-studio "Warm Studio" — {buttonShape:rounded, density:comfortable} · variant classic · palette terracotta (all-default = byte-identical to unstyled hearth).
- calm-sage "Calm Sage" — {buttonShape:rounded, density:compact} · variant condensed · palette sage.
- editorial-ochre "Editorial Ochre" — {buttonShape:square, density:spacious} · variant editorial · palette ochre.
- bold-plum "Bold Plum" — {buttonShape:pill, density:comfortable} · variant classic · palette plum.
- All palettes and variants are real; all knob values declared. Visibly distinct across palette
  + density + button shape.

### HearthSSRTokens consumption proof (published side)
- HearthSSRTokens now CONSUMES `knobs`: stylesheet = buildHearthStylesheet(knobs) inlines the
  scoped knob block AND `{...knobDataAttributes(knobs)}` is spread onto the wrapper div. No
  longer merely accepted. Edit-side HearthThemeInjector uses the SAME shared builder + attr
  helper, so the two renderers cannot diverge.
- CI-enforced by the new `phase-8 back-compat gate evidence (hearth knobs)` describe block in
  conformance.test.ts:
  - GATE (a) default emits nothing: buildHearthStylesheet() / (null) / ({}) /
    ({buttonShape:rounded,density:comfortable}) all === the pre-phase-8 baseline string;
    baseline has no `data-knob-`; rendered HearthSSRTokens default markup carries no
    `data-knob-*`.
  - GATE (b) non-default consumed in BOTH: buildHearthStylesheet({buttonShape:pill}) contains
    `[data-knob-buttonShape="pill"]` + `--r-md:999px`; rendered HearthSSRTokens with
    {buttonShape:pill,density:compact} shows both `data-knob-*` attrs on the wrapper AND both
    scoped blocks in the `<style>`.

### Conformance enrollment
- assertKnobConformance('hearth', hearthKnobs) — hearth is first template to activate the
  phase-3 dormant knob-set rule (full axis set, valid subsets, includes each default).
- assertLooksConformance('hearth', templateMeta.hearth.looks, hearthKnobs, HEARTH_VARIANT_IDS,
  [...hearthPalettes]) — new rule (moved from deferred to landed): each look declares
  id/label/blurb, every knob axis/value it sets is declared, variantId is a real variant,
  paletteId a real palette. Valid id sets passed IN from the test (imports hearth's pure id
  lists) so templateConformance.ts stays free of template-module imports (firewall intact).

### No-visual-change / back-compat evidence
- Guaranteed BY CONSTRUCTION: default axis values = current :root, skipped by the serializer;
  knobDataAttributes(default|absent) = {} so no attr + no appended CSS = byte-identical.
- The real editor renderer (LandingPageRenderer, out of scope) does not yet pass `knobs` to
  hearth's ThemeInjector, so existing hearth drafts render with knobs=undefined = identical to
  today (picker wiring lands in phase 9). Additional guarantee, not a gap.

### Verification outputs
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run conformance.test.ts` — 326 passed | 8 skipped; hearth knob + looks + gate
  evidence all green.
- `npm run test:run` — 2265 passed | 11 skipped | 1 failed. The 1 failure is i18nHonesty.test.ts
  "2-locale fixture through generateStaticHTML" — a 5s COLD-IMPORT TIMEOUT (not an assertion),
  pre-existing/unrelated (logged in the plan's phase-2 progress line). Re-ran in isolation:
  15/15 passed in 4.3s. Not caused by phase 8.
- `npm run build` — green.
- `npx playwright test parity` — 3 passed. Hearth default-knob bands: header 0.165 / hero 0.189
  / services 0.181 / testimonials 0.183 / packages 0.093 / cta 0.000 / footer 0.249 % — all
  <= 3% threshold (no visual change). meridian bands unchanged; parityBreak negative control
  6.409% still exceeds threshold.

### Deviations
- Plan text named a dedicated `--btn-radius` token; hearth buttons/inputs actually key off the
  existing `--r-md`/`--r-sm` control-radii tokens (verified by grep across hearth blocks), and
  repointing them to a new var would be a block edit (blocks are OUT of the 7-file scope).
  Conservative in-scope choice: the buttonShape axis retunes `--r-md`/`--r-sm` directly — a REAL
  visual effect with zero block changes, back-compat preserved (default = current values).
- Parity spec does not drive the knob switcher (the stage switcher reads mod.knobs, which the
  registry does not surface — registry.ts is out of scope). Unnecessary: both parity bands share
  ONE ThemeInjector so any applied knob affects both equally; the default-knob run is the
  no-visual-change proof and edit==published for non-default holds by construction. Non-default
  consumption is proven by the CI gate-evidence tests above.

### Open risks
- Editor/preview will not visibly apply knobs until phase 9 wires the picker + threads
  themeValues.knobs into the edit renderer. Until then hearth renders exactly as today (the
  human-gate's desired outcome for existing projects).
- HUMAN GATE remains: founder should still eyeball a real hearth draft (editor + preview) and a
  test publish HTML diff before merge-on. Automated evidence (parity + gate tests + build) all
  green; founder sign-off is not automatable.

## Phase 8 — hearth knobs pilot + looks data  [HUMAN GATE]

### Files changed
- `src/modules/templates/hearth/tokens.ts` — knob declaration + token map + shared stylesheet builder
- `src/modules/templates/hearth/ThemeInjector.tsx` — consume knobs (edit side)
- `src/modules/templates/hearth/components/HearthSSRTokens.tsx` — consume knobs (published side)
- `src/modules/templates/hearth/index.ts` — surface knob exports on the barrel
- `src/modules/templates/templateMeta.ts` — `TemplateLook` type + `looks` key + hearth's 4 looks
- `src/modules/templates/conformance.test.ts` — enroll hearth knob/looks rules + gate-evidence proofs
- `src/modules/templates/templateConformance.ts` — `assertLooksConformance` rule (looks-truthfulness half)

### Knob token extraction (tokens.ts)
Hearth tokenizes TWO axes with real CSS, both onto vars hearth blocks ALREADY consume
(so NO block-file edits were needed — critical for staying in Files-touched scope):
- `buttonShape` → `--r-md` + `--r-sm` (the `.hearth-btn` / input radii). Default `rounded`
  = today's :root (14px / 10px) → emits nothing. `square` → 3px/3px, `pill` → 999px/999px.
- `density` → `--sec-pad-y` (section rhythm, consumed by every section). Default
  `comfortable` = today's :root (140px) → emits nothing. `compact` → 96px, `spacious` → 180px.

`hearthKnobTokenMap` holds ONLY non-default entries; the phase-3 shared
`serializeKnobOverrides` skips defaults by construction. `buildHearthStylesheet(knobs?)` is
the SINGLE source of truth consumed identically by BOTH renderers = base + palette + variant,
and appends the knob block ONLY when `knobDataAttributes(knobs)` is non-empty. So a no-knob
(or all-default) render returns the pre-phase-8 string verbatim.

### typePairing = variant alias (no realignment needed)
The phase-3 placeholder `typePairing` vocab was ALREADY `classic/condensed/editorial` — exactly
hearth's `hearthVariants` ids — so no edit to `knobs.ts` was required. typePairing carries NO
knob CSS: a look sets the flat `variantId` directly and the existing `[data-variant]` layer
renders it. Hearth declares typePairing (full-axis-set requirement) but expresses it via
variantId, honoring the "legacy variantId = stable alias" decision (stored variantIds resolve
exactly as today; knobs are a purely additive `data-knob-*` layer).

Full declared axis set (conformance requires all 5): buttonShape [square,rounded,pill],
cardStyle [hairline] (no-op default only), density [compact,comfortable,spacious],
typePairing [classic,condensed,editorial], texture [none] (no-op default only).

### The 4 named looks (templateMeta.hearth.looks)
1. `warm-studio` "Warm Studio" — {buttonShape:rounded, density:comfortable} · classic · terracotta
   (the DEFAULT look: all-default knobs + baked variant → selecting it is byte-identical to an
   unstyled draft).
2. `calm-sage` "Calm Sage" — {buttonShape:rounded, density:compact} · condensed · sage.
3. `editorial-ochre` "Editorial Ochre" — {buttonShape:square, density:spacious} · editorial · ochre.
4. `bold-plum` "Bold Plum" — {buttonShape:pill, density:comfortable} · classic · plum.
Visibly distinct across palette + density + button shape. All refs are declared knob
axes/values + real hearth palettes + real variants (founder confirms names/count/palettes at
the gate).

### HearthSSRTokens consumption proof (review note)
`HearthSSRTokens` now CONSUMES `knobs`: it (a) inlines the knob CSS via the shared
`buildHearthStylesheet` (same string the edit-side injector emits) AND (b) spreads
`knobDataAttributes(knobs)` onto the wrapper div. Proven by conformance gate-evidence tests
(rendered via `renderToStaticMarkup`):
- default → markup contains NO `data-knob-` and NO knob CSS.
- {buttonShape:'pill', density:'compact'} → markup contains `data-knob-buttonShape="pill"`,
  `data-knob-density="compact"`, AND the scoped `[data-knob-buttonShape="pill"]` /
  `[data-knob-density="compact"]` CSS blocks. No silent published no-op.

### No-visual-change evidence (default emits nothing / byte-identical)
- `buildHearthStylesheet()` === `buildHearthStylesheet(null)` === `buildHearthStylesheet({})`
  === `buildHearthStylesheet({buttonShape:'rounded', density:'comfortable'})` (explicit
  defaults) — all byte-identical to the pre-phase-8 stylesheet; baseline contains NO
  `data-knob-` substring. (conformance.test.ts gate-evidence block.)
- Parity spec `npx playwright test parity`: hearth all 7 sections ≤ 0.249% (threshold 3%) with
  default knobs → editor↔published bands identical on the default. parityBreak negative control
  = 6.409% (caught). All 3 tests pass.

### Edit-side ThemeInjector
`HearthThemeInjector` accepts + consumes `knobs`: rebuilds the injected `<style#hearth-theme>`
from the shared builder each render (no-knob content byte-identical), sets `data-knob-*` attrs
on `documentElement` from `knobDataAttributes`, and removes them on unmount. Effect re-runs on
a stringified knob key so live switching (dev stage) works. The parity stage
(`TemplateBlocksStage`) drives both bands through this injector's `knobs` prop.

### Deviations / out-of-scope flags (NOT edited — need follow-up in a later phase)
- Plan text said "extract hearth's --btn-radius", but hearth has no `--btn-radius` token —
  its buttons read `--r-md`/`--r-sm`. Introducing a new `--btn-radius` and making buttons
  consume it would require editing hearth BLOCK files (out of Files-touched). Conservative
  in-scope choice: `buttonShape` retunes the existing `--r-md`/`--r-sm` (button + input radii;
  cards use `--r-lg`/`--r-xl`, unaffected) — visible, back-compat-safe, zero block edits.
- `src/modules/templates/registry.ts` (NOT in Files-touched): the hearth loader does NOT yet
  map `knobs: m.hearthKnobs` onto the runtime `TemplateModule`, so `mod.knobs` is `undefined`
  at runtime and the dev-stage/editor knob switcher won't list hearth axes. This does NOT
  affect any Phase 8 verification (conformance imports `hearthKnobs` directly; parity default
  path is unaffected; published renderer receives `knobs` via generateStaticHTML options, not
  `mod.knobs`). ONE-LINE follow-up needed before the phase-9 live picker.
- `src/modules/generatedLanding/LandingPageRenderer.tsx` (NOT in Files-touched): the edit-side
  renderer passes `mood` but not `knobs` to `ThemeInjector`. Real-editor knob application needs
  `knobs={themeValues?.knobs}` there — a phase-9 wiring (picker writes knobs). Back-compat
  unaffected (default emits nothing regardless).
- Publish route / generateStaticHTML caller does NOT yet extract `themeValues.knobs` → the
  published seam is still "threaded but inert" (phase-3 state). Wiring the DB→publish
  pass-through is a phase-9 concern (knobs aren't written until the picker ships). The gate's
  published-HTML consumption is proven at the renderer level (HearthSSRTokens) instead.
- HearthThemeInjector no longer keeps the FOUC "don't overwrite existing content" guard — it
  now always rebuilds `<style>` content (required for live knob switching). No-knob content is
  identical, so no regression.

### Verification
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 2265 passed / 1 failed = the known pre-existing i18n timeout flake
  (`i18nHonesty.test.ts`); re-ran that file in isolation → 15/15 pass. Hearth knob-set +
  looks-truthfulness rules active + green; conformance file 338 passed / 8 skipped.
- `npx playwright test parity`: 3 passed (hearth ≤0.249%, meridian ≤1.297%, parityBreak 6.409%).
- `npm run build`: green.

### Open risks
- buttonShape is visibly effective on buttons + form inputs but (by the block-scope
  constraint) does not touch card corners — acceptable for a "control shape" knob; a future
  block-touch pass could introduce a dedicated `--btn-radius` if buttons-only control is wanted.
- Human gate remaining: founder side-by-side on a REAL hearth draft + a test-publish HTML diff
  (needs the registry + LandingPageRenderer follow-ups above to exercise knobs end-to-end;
  default-path no-visual-change is already proven by the parity spec + byte-identical tests).

## Phase 8 — impl-review verdict
- Verdict: **ship** (review loop 2; loop 1 was a race false-negative — reviewer saw an empty tree during a flush window, not a real defect). Reviewer verified LIVE, ran all gates: (1) default byte-identical — `buildHearthStylesheet(undefined|null|{}|all-default)` === pre-phase-8 base, tokens.ts is pure addition after :165, `:root` (--r-md:14px/--r-sm:10px/--sec-pad-y:140px) UNCHANGED; (2) HearthSSRTokens genuinely consumes knobs (inlines CSS + spreads data-knob-* on wrapper), gate test asserts both present in published markup for pill/compact; (3) buttonShape→--r-md/--r-sm deviation sound (default emits no block, radii unchanged); (4) variant aliases safe (typePairing===hearthVariants ids, looks set flat variantId, stored variantIds resolve unchanged); (5) looks rule bites — reviewer mutated bold-plum.paletteId→ghostpalette → conformance RED → restored. Gates: tsc clean, test:run 2265 passed (only known i18n flake failed, isolation 15/15), parity 3/3 hearth ≤0.249% + parityBreak 6.409%, build green.
- Non-blocking: (1) gate baseline test is self-referential (`buildHearthStylesheet() === buildHearthStylesheet()` tautology) — won't catch future :root drift in serializeBaseTokens; parity test + reviewer's manual :root diff cover the real risk; harden with a frozen literal snapshot later. (2) hearthKnobs exported but NOT on TemplateModule/registry → knobs not threaded into live editor/publish render yet (deferred to phase 9).
- **RUNTIME-WIRING FOLLOW-UPS (moved into phase 9 scope, else picker writes non-rendering looks):** registry.ts expose `knobs: m.hearthKnobs`; LandingPageRenderer.tsx pass `knobs={themeValues?.knobs}` to ThemeInjector; publish/generateStaticHTML caller extract `themeValues.knobs` → knobs option (phase-3 seam inert).
- **HUMAN GATE:** founder must sign off no-visual-change on a real hearth draft (editor/preview + test-publish HTML diff) before phase 9 proceeds.
- Process note: earlier double-spawn (two implementers, task ids aecfb2906 + ac020dea) was an orchestrator race — both converged on ONE coherent implementation, second verified not rewrote. No data loss. Concurrent external session also dirtied productBacklog.md/productQueue.md (NOT phase 8, excluded from commit).

## Phase 9 — looks in picker + runtime wiring

**Files changed**
- `src/modules/templates/registry.ts` (runtime wiring)
- `src/modules/generatedLanding/LandingPageRenderer.tsx` (runtime wiring)
- `src/app/api/publish/route.ts` (runtime wiring — the `generateStaticHTML` caller; publish route calls `renderPublishedExport` → `generateStaticHTML`)
- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx` (picker — editor Looks section)
- `src/components/onboarding/wizard/StyleSlot.tsx` (picker — onboarding look tiles)
- `src/components/onboarding/wizard/fields/templateCatalog.ts` (surface looks metadata)
- (`src/app/api/saveDraft/route.ts` — NOT edited; schema `z.record(z.string(), z.unknown())` in `src/lib/validation.ts:32/109` already passes `themeValues.knobs` through, permissive as phase-3 predicted.)

### Part A — runtime wiring (load-bearing; done FIRST)
- **registry.ts**: hearth loader now surfaces `knobs: m.hearthKnobs` on the module surface, mirroring `variants`/`palettes`. `mod.knobs` is now populated at runtime for both edit + published dispatch (also flips the conditional `assertKnobConformance` rule to active on the live module).
- **LandingPageRenderer.tsx**: edit-side ThemeInjector now receives `knobs={(themeValues)?.knobs}`, mirroring the existing `mood={themeValues?.mood}` line. Knob-unaware templates ignore the extra prop; default knob values emit no CSS (byte-neutral).
- **publish route (`src/app/api/publish/route.ts`)**: the `generateStaticHTML` caller is the publish route via `renderPublishedExport` (which already threaded a `knobs` option through to `generateStaticHTML` in phase 3, but nothing fed it). Added `projectKnobs` extraction from `project.themeValues.knobs` (parallel to the existing `projectMood`), passed it as `knobs: projectKnobs` into the `renderPublishedExport` call, and merged it into `publishedThemeValues` persisted on `PublishedPage` (so SSR fallback / verify-dns regeneration bake the same knob CSS). Unset drafts stay byte-identical (no knobs key → null → default emits nothing).

### Part B — looks in picker
- **ServiceThemePopover.tsx** (editor, full fidelity): added a primary "Looks" section above the variant/palette rows (kept below as fallback/advanced — no removal). Reads `templateMeta[tid].looks` (pure List-3 data, firewall-safe — type-only imports). `handleLook` = `updateMeta({ variantId, paletteId, themeValues: { ...prev, lookId, knobs } })` → existing `triggerAutoSave()` (`/api/saveDraft`). Active look = `themeValues.lookId`. PostHog `look_changed` event added.
- **StyleSlot.tsx** (onboarding trust branch): added a primary "Looks" tile grid above the raw Layout-variant + Palette rows (fallback kept). Tiles read `catalog.looks`. Swatch color sourced from `catalog.swatch()` (explicit hex — onboarding has no injected `[data-palette]{--accent}` CSS, unlike the editor). Active look = tile whose variant+palette both match the current pick.
- **templateCatalog.ts**: added a `looks: readonly TemplateLook[]` field to `TemplateCatalogEntry`, sourced from `templateMeta.{hearth,lex,surge}.looks ?? []` (only hearth ships looks today).

### End-to-end published-knob proof
Wrote a temporary vitest (`src/lib/staticExport/__tests__/_phase9KnobProof.temp.test.ts`, run then DELETED — not committed) driving the exact runtime path the publish route now feeds: `generateStaticHTML({ templateId:'hearth', knobs: editorial-ochre.knobs {buttonShape:'square',density:'spacious'} , … })`. Asserted on the produced published HTML:
- `preloadTemplate('hearth').knobs` is populated (`axes.buttonShape` ⊇ `square`) — registry wiring live;
- HTML contains `data-knob-buttonShape="square"` + `data-knob-density="spacious"` AND the scoped CSS selectors `[data-knob-buttonShape="square"]{…}` / `[data-knob-density="spacious"]{…}` — the knob layer reaches published output through the runtime path, not just the phase-8 component unit test;
- with `knobs: null` the HTML contains NO `data-knob-` substring — byte-neutral default preserved.
All 3 assertions green (3 passed). This proves the previously-inert phase-3 seam is now fed end-to-end.

### Zero-copy-regen proof
Airtight by construction: `handleLook`'s `updateMeta` patch is exactly `{ variantId, paletteId, themeValues }`; `updateMeta` (persistenceActions.ts:791) does `Object.assign(state, meta)` — `content`/`sections`/`pages`/`elements` are never in the patch and never mutated. `save()` then re-sends the unchanged `state.content`. A look swap therefore touches only variantId/paletteId/themeValues; the content JSON is byte-identical before/after. (Same holds for the onboarding StyleSlot tiles, which only call `setVariantId`/`setPaletteId`.)

### Deviations
- **saveDraft/route.ts NOT edited** — schema already permissive (confirmed, as the plan anticipated).
- **Onboarding StyleSlot applies variant+palette only, not knobs (conservative, in-scope).** The onboarding wizard store (`useWizardStore`) is NOT in the phase-9 files-touched list and exposes only `setVariantId`/`setPaletteId` for the trust branch — no knob/themeValues persistence field, and the trust generation `saveDraft` call (`trust.ts:382`) does not send `themeValues` at all (mood isn't persisted from onboarding either). Adding knob persistence to onboarding would require editing `useWizardStore` + `trust.ts` (both out of scope). So onboarding look tiles apply the look's variant + palette (the dominant visual signal — palette + typography/spacing variant); the look's knob refinements (buttonShape/density) + hybrid `lookId` are applied at FULL fidelity in the editor `ServiceThemePopover`. Conservative, breaks nothing (default knobs emit no CSS). Flagged for the founder gate / a follow-up if onboarding-side full-fidelity looks are wanted.

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 141 files passed | 1 skipped; 2266 passed | 11 skipped | 0 failed (i18n flake did not trip this run).
- `npx playwright test parity render` — 6 passed: meridian ≤1.297%, hearth ≤0.249% (< 3% thresh), parityBreak 6.409% (negative control caught), all 3 render specs (old `/dev/meridian/blocks` URL unaffected).
- `npm run build` — green.
- End-to-end published-knob proof — green (3/3, temp test deleted).

Human gate: founder approval of picker UX (tile presentation, look names, fallback-row placement) on dev pending — orchestrator handles the gate + commit. Not committed.

## Phase 9 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer RE-PROVED the runtime loop himself (throwaway generateStaticHTML test, deleted after): registry.ts:26 surfaces `knobs: m.hearthKnobs` (mod.knobs populated at runtime); LandingPageRenderer.tsx:960 passes `knobs={themeValues?.knobs}`; publish/route.ts:150-160,338 extracts projectKnobs from project.themeValues.knobs → renderPublishedExport/generateStaticHTML + merges into persisted publishedThemeValues. Published HTML for editorial-ochre look contains data-knob-buttonShape=square + data-knob-density=spacious + scoped CSS; knobs:null → no data-knob; default knobs → no data-knob (byte-neutral). Zero copy-regen (handleLook patches only variantId/paletteId/themeValues). Back-compat: null projectKnobs falls through to prior themeValuesWithMood (identical), looks.length>0 guards pickers. Gates: tsc clean, test:run 2266 passed/0 failed, parity+render 6 passed, build green.
- Non-blocking: (1) onboarding StyleSlot look tiles apply variant+palette only, not knobs (useWizardStore/trust.ts out of scope; trust-path saveDraft omits themeValues) — JUDGED ACCEPTABLE: all 4 hearth looks have distinct (variant,palette) pairs so none collapse; full knob fidelity in editor popover; minimal follow-up = persist themeValues.knobs from onboarding (needs useWizardStore+trust.ts). (2) CLEANUP: knob attr is camelCase `data-knob-buttonShape` (knobAttr) → React "does not recognize prop" warning under SSR; works because HTML attr/CSS matching is ASCII case-insensitive; pre-existing phase 3/8. Recommend kebab-case (data-knob-button-shape) in a cleanup pass.
- **HUMAN GATE:** founder picker-UX sign-off (tile presentation, look names, fallback-row placement, editor Looks section) before phase 10.

---

## Phase 10 — generation spread

### Files changed
- `src/modules/generation/spread.ts` (NEW) — seeded RNG + pick helpers (pure, self-contained).
- `src/modules/generation/spread.test.ts` (NEW) — determinism + spread-distribution tests.
- `src/modules/generation/blockEligibility.ts` — `EligibilityInput.seed?`; `pickFromSet` seeded-pick among eligible.
- `src/modules/generation/blockEligibility.test.ts` — seeded spread + determinism cases (synthetic + real meridian manifest).
- `src/modules/wizard/generation/thing.ts` — meridian palette + block-variant spread hookup (guarded).
- `src/modules/wizard/generation/trust.ts` — hearth starting-look spread hookup (guarded).

### Seed derivation
- Seed source = the **project token** (`input.tokenId`), stable for the project's life → re-running generation for the same project yields the SAME start (reproducible).
- `hashToken` = FNV-1a 32-bit; `makeRng` = mulberry32; `seedFor(token, salt)` namespaces each pick point (`'palette'`, `'look'`, `'block:<default>'`) so palette/look/block are INDEPENDENT draws from one token. No `Math.random()` anywhere (forbidden — non-reproducible). Firewall: spread.ts imports nothing (pure data); no template-component imports on the generation path.

### The three spread points
- (a) **block-variant** — `blockEligibility.pickFromSet`: when `input.seed` present, picks a seeded choice among ALL eligible variants (salted by `set.default`); absent seed ⇒ legacy default-first path byte-identical. `selectEligibleBlock` forwards the seed unchanged. Always returns a VALID eligible/default name (asset-gated variants like EditorialPhotoHero stay excluded with no asset facts, so hero keeps its default; features/testimonials spread among co-eligible same-consumes variants ⇒ copy unchanged).
- (b) **starting palette** — thing.ts `spreadMeridianPalette(token)` = `pickSeeded(meridianPalettes, token, 'palette')`; trust.ts look bundles the palette.
- (c) **starting look** — trust.ts `spreadLook(input)` = `pickSeeded(templateMeta.hearth.looks, token, 'look')`; the look's palette/variant write to the flat columns, its `lookId`/`knobs` to `themeValues` (hybrid storage per Decisions block, no migration).

### Explicit-pick guard (spread never overrides a user choice)
- thing.ts `shouldSpreadMeridian`: `if (input.paletteId || input.variantId) return false;` — an explicit pick short-circuits BEFORE any seed is consulted. Palette computation also keeps `input.paletteId ??` ahead of the spread branch.
- trust.ts `spreadLook`: first line `if (input.paletteId || input.variantId) return undefined;` — explicit pick ⇒ no look; `paletteId = look?.paletteId ?? effectivePalette(input)` and `variantId = look?.variantId ?? input.variantId ?? default` both keep the explicit value ahead of spread.

### Determinism + distribution results
- `spread.test.ts`: hashToken/makeRng/seedFor determinism; pickSeeded in-range + reproducible; **acceptance** — startingTuple(palette, meridian features block, hearth look) over 10 distinct tokens: same token twice ⇒ identical tuple; 10 tokens ⇒ ≥7 distinct tuples (asserted); every field a real id.
- `blockEligibility.test.ts`: no-seed ⇒ legacy default-first; same seed twice ⇒ identical; 20 seeds cover BOTH eligible variants; seeded pick always eligible/default (asset-gated excluded); single-eligible ⇒ no-op; nothing-eligible ⇒ default; real meridian `features` spreads {HairlineFeatureGrid, LedgerFeatureList}, `hero` (no photos) stays TerminalHero under all seeds.

### Verification
- `npx tsc --noEmit` — clean (no output).
- Targeted: `vitest run spread + blockEligibility + thing.test + trust.test` — 4 files, 100 tests passed.
- `npm run test:run` — 142 files passed | 1 skipped; 2285 passed | 11 skipped; 0 failed (i18n flake did not fire this run). Existing generation-contract / thing.test (meridian smoke) / trust.test (hearth terracotta smoke) all green.

### Deviations
- **Wizard-slot wiring threaded-but-DORMANT behind `styleAutoAssign`.** The plan says "spread when the user made no explicit pick." The existing (untouchable, not in Files-touched) `trust.test.ts` runs a no-pick input and asserts the saved `paletteId === 'terracotta'` (today's default). Firing look-spread by default on that input would break it. To honour "existing generation-contract tests still green" AND the phase intent, the spread MECHANISM is fully live + tested, but the HOOKUP is gated on a new opt-in `styleAutoAssign?: boolean` (default/undefined ⇒ no spread) that the wizard GeneratingSlot (out of phase-10 scope) sets when the user skips the picker. This mirrors the codebase's pervasive "threaded-but-dormant until the out-of-scope caller feeds it" pattern (cardCountHints, collections bridge, phase-3 knob seam). Both smoke tests stay byte-identical; spread distribution/determinism is proven via spread.test.ts fixtures calling the real spread.ts + seeded eligibility + templateMeta looks + meridianPalettes. Conservative choice logged per the in-scope-ambiguity rule.
- **Block spread scoped to meridian single-page** (per plan "block-variant spread hookup (meridian)"): applied in `runCopyAndSave` non-multipage branch only; multipage/vestria fan-out untouched.

### Open risks
- Until the wizard slot sets `styleAutoAssign`, spread has NO production effect (dormant). Activating it is a one-line slot change in a future phase; recommend a founder gate at activation since it changes the starting look/palette of new meridian+hearth sites.
- Meridian block spread uses NO asset facts (thing.ts single-page has none wired), so only asset-free co-eligible variants (features/testimonials) ever spread; hero stays default. Acceptable — matches server-side selection which also has no facts on this path.

## Phase 10 — impl-review verdict
- Verdict: **ship** (loop 1). Reviewer confirmed: determinism+distribution genuine (spread.ts FNV-1a hashToken → mulberry32 makeRng, salted seedFor per pick; zero Math.random; spread.test.ts same-token→identical + 10 tokens→≥7 distinct, ran green); explicit-pick guard real (thing.ts shouldSpreadMeridian short-circuits on input.paletteId||variantId; trust.ts spreadLook returns undefined on explicit pick, user value kept ahead of spread); dormant styleAutoAssign flag is a REAL toggle (both branches traced — true+no-pick routes through real spreadMeridianBlocks→selectEligibleBlock(seed) + spreadMeridianPalette + trust pickSeeded look; activation = 1-line slot change; honestly disclosed, default-OFF correct back-compat); firewall intact (spread.ts imports nothing, block spread runs BEFORE copy gen so no copy corruption); blockEligibility seedless path byte-identical (seeded branch gated behind `if input.seed !== undefined`). Gates: tsc clean, test:run 2285 passed/0 failed.
- Non-blocking (for the future activation phase): (1) meridian block spread hero-inert without assetFacts on single-page path — only asset-free co-eligible sections spread until asset facts wired. (2) trust.ts lookPatch writes whole themeValues (replace not merge) — safe at creation-only, flag for activation. (3) activation of styleAutoAssign changes new meridian+hearth starting look/palette → its own founder gate recommended.
