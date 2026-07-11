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
