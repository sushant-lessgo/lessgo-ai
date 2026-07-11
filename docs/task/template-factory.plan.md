# template-factory — plan

Branch: `feature/template-factory`
Spec: `docs/task/template-factory.spec.md`

## Overview

Build the two halves of the template factory: (A) the repeatable template-addition
pipeline — consolidated `templateConformance(templateId)` suite, code-derived design-kit
generator, handoff lint, anchor library, Playwright screenshot parity-diff; (B) per-template
flexibility — tokenized knob mechanism (data-attr → CSS-var, blocks never branch),
hearth knobs pilot with ≥3 named looks in the picker, deterministic generation spread.
Finish with the thin `/new-template` skill rewrite. The atelier end-to-end drill is OUT of
this build (separate spec, runs after) — but kit/lint/conformance/parity-diff must be ready
for it.

**Prerequisite check (phase 2):** editorPlan phases 0–3 (edit-primitive vocabulary,
`src/modules/editing/primitiveTypes.ts`) — landed per editor-phase-3 commits; confirm before
wiring editor-basics assertions.

## Decisions (made here, not open)

- **Look storage = hybrid, NO migration.** `themeValues` JSON gains `{ lookId, knobs: {...} }`
  (precedent: VestriaThemePopover already writes `mood` there). Resolved `variantId`/`paletteId`
  keep being written to their flat columns (back-compat: serve gate, swap, analytics untouched).
  No `lookId` column, no `prisma migrate`.
- **Legacy variantId = stable alias.** Existing stored `variantId` strings keep resolving exactly
  as today; knobs are an ADDITIVE layer (`data-knob-*` attrs mirroring the `data-variant`
  mechanism). Default knob values emit NO CSS block (default = `:root`), so knob-unaware
  projects render byte-identical.
- **Kit = committed script, outputs NOT committed.** `scripts/generateDesignKit.ts` (thin CLI)
  over pure `src/modules/engines/designKit.ts`; a vitest test proves generation for
  thing/trust/work — derived artifact can't rot; regenerate on demand at design time.
  (Work/trust contracts partly legacy-layout — generator falls back to
  `resolveEngineSectionSchema` per section and labels the source.)
- **Anchor library home = committed docs file** (`docs/product/anchorLibrary.md`) — versioned,
  agent-visible, reviewable; `template-design/` is gitignored so unusable for agents/CI.
- **Looks are List-3 data.** Named looks live in `templateMeta.ts` (additive `looks` key —
  scout confirmed net-new, consumers read by named key). Knob axis vocabulary lives in a new
  pure-data `src/modules/templates/knobs.ts`. Neither imports template modules (firewall).
- **`blockManifest.test.ts` folded into `templateConformance` and deleted** (its 3 checks +
  the duplicated default∈variants rule + duplicated `contractFor` helper merge in).
- **Published/client boundary stays a GLOBAL test.** The existing
  `src/modules/templates/publishedClientBoundary.test.ts` walks the filesystem across ALL
  `*.published.tsx` import graphs — stronger than any per-template assertion.
  `templateConformance` does NOT reinvent it; the spec's boundary conformance line is
  satisfied by keeping + cross-referencing that test (phase 1).
- **Block mocks = shared canonical home.** `MERIDIAN_BLOCK_MOCKS` (currently
  `src/app/dev/meridian/blocks/mockContent.ts`) moves to `src/modules/templates/blockMocks/`;
  the old path becomes a thin re-export so BOTH existing importers
  (`MeridianBlocksStage.tsx` and `src/modules/templates/__tests__/renderParity.meridian.test.tsx`)
  keep working; the parity test is re-pointed to the canonical home (phase 2).
- **Dual-renderer CONTENT parity is already owned** by
  `renderParity.meridian.test.tsx` (jsdom, visible-text diff, `mode:'preview'`). Phase 2
  REUSES its store-mock harness; phase 7's screenshot diff covers VISUAL/CSS parity ONLY —
  no content-parity re-implementation anywhere.

## Progress log

- phase 1 templateConformance consolidation: done (commit c8523046, review loops 1; tsc clean, 2103 tests pass)
- phase 2 editor-basics conformance subset: done (commit 530105f8, review loops 1; markers no-leak verified, mocks relocated, negative control red-then-reverted; tsc clean, 2200 tests pass; i18n flake pre-existing/unrelated)
- phase 3 knob mechanism: done (commit 89132c3d, review loops 1; default-emits-nothing proven both fns, seam threaded+inert all 3 call sites, rule dormant, firewall intact; tsc clean, 2212 tests, build green)
- phase 4 design-kit generator: done (commit 0dd9b186, review loops 1; derived not-frozen, firewall intact, 3 engines generate w/ source labels, primitive=labeled hint; tsc clean, 2223 tests)
- phase 5 handoff lint: done (commit PENDING, review loops 1, ship; broken fixture fails both distinct findings, derived from kit, marker convention agrees kit<->lint, all 5 checks real; tsc clean, 2231 tests)
- phase 6 anchor library: pending
- phase 7 screenshot parity harness + diff: pending
- phase 8 hearth knobs pilot + looks data: pending
- phase 9 looks in picker: pending
- phase 10 generation spread: pending
- phase 11 skill rewrite + manual-test subsection: pending

---

## Phase 1 — `templateConformance(templateId)` consolidation

Consolidate the existing two suites into one parameterized single-call suite. Adding a
template later = add one line. Pure refactor: NO assertion may be lost — map every existing
check to its new home in the phase audit.

Checks to absorb (from scout): conformance.test.ts groups (a) engine-core resolves
non-placeholder edit+published, (b) capability evidence, (b+) capabilitySections no orphans,
(c) variant resolution + distinctness (strict-!== default / === when internalDispatch),
(d) collection-family pair (+ negative fixtures), (e) variant-swap-integrity, resolver/meta
key parity, structural-cap subset, lumen bespoke exemption, techpremium retired; and
blockManifest.test.ts: default∈variants, minCards≤maxCards, consumes⊆getAllElements.
Dedupe the two identical local `contractFor(layoutName)` helpers into one shared helper.

Published/client boundary: DO NOT add a per-template check —
`src/modules/templates/publishedClientBoundary.test.ts` already enforces the boundary
globally via a filesystem walk over every `*.published.tsx` import graph (stronger: covers
templates not yet enrolled in conformance). Keep it standalone; add cross-reference doc
comments both ways (templateConformance header names it as the boundary enforcement point;
the boundary test header names templateConformance as the per-template suite). This
satisfies the spec's "published/client boundary" conformance list line — no new check
invented in this phase.

**Files touched**
- `src/modules/templates/templateConformance.ts` (new — suite factory + shared `contractFor`)
- `src/modules/templates/conformance.test.ts` (rewrite → per-template `templateConformance(id)` calls + template-specific exemptions)
- `src/modules/templates/blockManifest.test.ts` (delete after fold)
- `src/modules/templates/publishedClientBoundary.test.ts` (doc-comment cross-reference ONLY — assertions untouched)

**Verification:** `npx tsc --noEmit`; `npm run test:run` green (boundary test included,
unweakened); audit lists old-check → new-home mapping (reviewer confirms zero coverage loss).

---

## Phase 2 — editor-basics machine-checkable subset in conformance

Implement the spec's editor-basics v0 contract, machine-checkable part, on **meridian** +
**hearth** (hearth needed for phases 7–8; surge/vestria enrollment deferred — noted in suite
as skipped-with-reason, not silently absent).

**The DOM signal (defined here, exactly):** grep-verified NOTHING emits an editable marker
today — `useEditor.ts:220` checks `[data-editable="true"]` but no component sets it; the
edit-primitive vocabulary (`primitiveTypes.ts`) is types/declarations only. So step 1 ADDS
the marker: template Editable wrappers (`MeridianEditable.tsx`, `HearthEditable.tsx`) emit
`data-edit-primitive="text"` (or `"button"` when `isButton`) alongside the
`data-element-key`/`data-section-id` attrs they already emit in preview mode. Emitted in all
render modes of the edit component; published `.published.tsx` blocks never import these
wrappers, so published HTML is unaffected (data attrs are also pixel-neutral for phase 7).

**Render mode asserted: `mode:'preview'`** — jsdom can't drive `contentEditable`, and
`renderParity.meridian.test.tsx` already proved this path: `vi.mock` of
`useEditStoreLegacy` (selector-honoring) + `@/components/EditProvider` context onto one
vanilla zustand store seeded from the mocks, `renderToStaticMarkup`. REUSE that harness:
extract it to `blockMocks/harness.ts` and re-point the parity test to consume it — do not
reinvent the scaffolding. In preview the wrapper renders the static path, and the new marker
makes wrapper-presence observable there.
**Extraction caveat (review note):** `vi.mock`/`vi.hoisted` are per-file hoisted and CANNOT
move into `harness.ts` — extract only `buildStoreState` + the selector-honoring store
accessor; leave the small `vi.mock` shims inline in each test file.

**Assertions per manifest-declared edit block, per contract slot:**
- every contract text element → exactly one `[data-edit-primitive="text"][data-element-key="<key>"]`
  (no dead text; mock-excluded optional elements exempt);
- every CTA/button element → marker kind `"button"` (asserts the `isButton` wiring that
  makes Button Settings reachable);
- collections → mock content with N items renders N item roots. **Pin to a concrete signal**
  (review note): count `[data-element-key]` descendants under the collection key (or an
  equivalent per-item marker) — do NOT leave "item root" undefined, or this check is as
  untrustworthy as the marker-less text case it replaced.

**Explicitly NOT machine-checked** (declared skipped-with-reason in the suite; land in the
`/manual-test` editor-basics subsection, phase 11, + parity QA): image-upload wiring
(meridian wires `uploadImage` inline per block — no shared image primitive component to mark
yet), logo primitive interaction, collection add/remove/reorder affordances,
Button-Settings popover actually opening. Honest subset > untrustworthy assertion.

**Negative control (trustworthy by construction):** temporarily replace one
`MeridianEditable` with raw text in a throwaway edit → the text-marker assertion goes red
(marker absent); revert; record in audit.

Mock maps double as the parity-harness content source (phase 7) — per-template,
per-section, keyed off the contract.

**Files touched**
- `src/modules/templates/templateConformance.ts` (editor-basics assertion group)
- `src/modules/templates/meridian/components/MeridianEditable.tsx` (emit `data-edit-primitive`)
- `src/modules/templates/hearth/components/HearthEditable.tsx` (emit `data-edit-primitive`)
- `src/modules/templates/blockMocks/meridian.ts` (new — canonical home for MERIDIAN_BLOCK_MOCKS, moved from `src/app/dev/meridian/blocks/mockContent.ts`)
- `src/modules/templates/blockMocks/hearth.ts` (new)
- `src/modules/templates/blockMocks/index.ts` (new — per-template registry, test/dev-only consumers)
- `src/modules/templates/blockMocks/harness.ts` (new — store-mock harness extracted from `renderParity.meridian.test.tsx`)
- `src/app/dev/meridian/blocks/mockContent.ts` (becomes thin re-export of `blockMocks/meridian` — `MeridianBlocksStage.tsx` import keeps working unchanged)
- `src/modules/templates/__tests__/renderParity.meridian.test.tsx` (re-point mock import to canonical home + consume shared harness; assertions unchanged)
- `src/modules/templates/conformance.test.ts` (enroll editor-basics for meridian+hearth)

**Verification:** `npm run test:run` (renderParity test still green post-extraction —
proves harness reuse didn't change behavior); negative control above red-then-reverted;
`npx tsc --noEmit`.

---

## Phase 3 — knob mechanism (data-attr axes, tokens, injection)

The generic mechanism, no template opted in yet. Standard knob axes as pure data:
`buttonShape` (square/rounded/pill → `--btn-radius`), `cardStyle` (hairline/shadow/flat),
`density` (spacing multiplier), `typePairing` (aliases the existing variant axis),
`texture/mood`. Each axis = `data-knob-<axis>` attr; CSS emitted as
`[data-knob-btn="pill"]{--btn-radius:…}` layers via a shared serializer (mirrors
`serializeVariantOverrides`). Blocks NEVER branch on a knob — CSS-token only, dual-renderer
safe by construction. Default value per axis emits nothing.

Plumbing both renderers — **published seam verified:** variant/palette/mood do NOT go
through `<html>` attrs in `htmlGenerator.ts`; they thread as options
(`htmlGenerator.ts:38/124` → `renderPublishedExport.ts`) into
`LandingPagePublishedRenderer.tsx`, which hands them to the template's `SSRTokens`
(line 217) — SSRTokens applies the data attrs on its wrapper and inlines the CSS. Knobs
mirror the `mood` flow exactly:
- published side — thread `knobs` through `generateStaticHTML` options →
  `renderPublishedExport` → `LandingPagePublishedRenderer` → `tmpl.SSRTokens`, which applies
  `data-knob-*` on its wrapper + inlines the knob CSS block via the shared serializer
  (SSRTokens prop signature extended in `src/types/template.ts`, optional — knob-unaware
  templates unchanged);
- edit side — shared helper for ThemeInjectors to apply knob attrs from `themeValues.knobs`
  (same wrapper-attr approach as SSRTokens, keeping both renderers' scoping identical).
Confirm `DraftSaveSchema` passes `themeValues.knobs` through (expected: yes, permissive —
read-only check).

Conformance: new rule — a template declaring knobs must declare the full standard axis set
with valid values, and looks (when present, phase 8) must reference declared axes/values.
Rule is conditional (only knob-declaring templates), so suite stays green now.

**Files touched**
- `src/types/template.ts` (KnobAxis/KnobValue types; `TemplateModule.knobs?` optional; SSRTokens/ThemeInjector prop extension, optional)
- `src/modules/templates/knobs.ts` (new — standard axis registry, pure data)
- `src/modules/templates/shared/knobCss.ts` (new — serializer + attr-apply helpers)
- `src/modules/templates/shared/knobCss.test.ts` (new)
- `src/lib/staticExport/htmlGenerator.ts` (thread `knobs` option, mood precedent)
- `src/lib/staticExport/renderPublishedExport.ts` (thread `knobs` option, mood precedent)
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` (pass `knobs` to `tmpl.SSRTokens`)
- `src/modules/templates/templateConformance.ts` (knob-set rule, conditional)

**Verification:** `npx tsc --noEmit`; `npm run test:run` (serializer unit tests: default emits
nothing, non-default emits scoped block); `npm run build` green (published CSS path unaffected).

---

## Phase 4 — design-kit generator

Pure derivation joining three flat maps: `engineCoreSections` (required sections in order) +
`elementContracts` per section via `getAllElements()`/`getCardRequirements()` (slots,
optionality, card min/max) + `blockManifest` (capacities, requiresAssets, variants) +
`knobs.ts` (knob RANGES to design) + edit-primitive assignments per slot + format constraints
block (one self-contained static HTML, `:root` tokens, `[data-palette]`/`[data-variant]`/
`data-knob-*`/`[data-surface]` axes, class prefix, self-hosted font list from
`src/styles/fonts-self-hosted.css` — hardcode the list in kit data with a pointer comment).
Engines without populated `elementContracts` (trust/work) fall back to
`resolveEngineSectionSchema` per legacy layout; each section labeled with its contract source.
Firewall: leaf pure-data + type-only imports; NO template component imports.

CLI emits markdown per engine (stdout or `--out` path); outputs not committed.

**Files touched**
- `src/modules/engines/designKit.ts` (new — pure derivation → structured kit object + markdown render)
- `src/modules/engines/designKit.test.ts` (new — thing/trust/work all generate; kit contains sections-in-order, every required slot, capacities, knob ranges, format block; contract change reflected = derive from live schema in test)
- `scripts/generateDesignKit.ts` (new — thin CLI)
- `package.json` (script: `kit:generate`)

**Verification:** `npm run test:run`; `npx tsc --noEmit`; run CLI for all 3 engines, eyeball
one output in audit.

---

## Phase 5 — handoff lint

Validates a designer's single-HTML handoff BEFORE build: all engine core sections present
(define the handoff marker convention in the lint's doc header — e.g. `data-section="hero"`;
the kit's format block must state the same convention → small phase-4 cross-edit if needed),
every required contract slot representable (marker or matching element), axes structured
(`:root` tokens present; `[data-palette]`/`[data-variant]`/`data-knob-*` selectors exist),
fonts ⊆ self-hosted list, self-contained (no external stylesheet/script/font URLs).
Pure core (vitest-testable) + thin CLI.

**Files touched**
- `src/modules/templates/handoffLint.ts` (new — pure)
- `src/modules/templates/handoffLint.test.ts` (new)
- `src/modules/templates/__fixtures__/handoff-valid.html` (new — minimal passing fixture)
- `src/modules/templates/__fixtures__/handoff-broken.html` (new — missing section + missing required slot)
- `src/modules/engines/designKit.ts` (only if marker convention needs stating in kit format block)
- `scripts/lintHandoff.ts` (new — thin CLI)
- `package.json` (script: `kit:lint`)

**Verification:** `npm run test:run` — broken fixture fails on BOTH missing-section and
missing-required-slot (acceptance criterion); valid fixture passes; `npx tsc --noEmit`.

---

## Phase 6 — anchor library

Author `docs/product/anchorLibrary.md`: ≥15 concrete reference anchors (named
sites/movements/systems with 1-line why + typeface/token cues — anchors, not adjectives),
grouped for tile divergence. Banned-list section: derivation rule from
`templateMeta.designStyles` fingerprints (read live from templateMeta) + default-mode bans
(Inter, purple gradients, glassmorphism, rounded-2xl grids, emoji icons). Header states
maintenance rule: new template ships → its fingerprint joins the banned list. Founder
reviews at phase 11 gate (with skill).

Plus a tiny derived guard so the banned list can't rot: a vitest test reads the md file and
asserts its banned list ⊇ the LIVE `templateMeta` designStyles set (+ the 5 default-mode
bans present) — a new template's designStyle missing from the doc turns the suite red.

**Files touched**
- `docs/product/anchorLibrary.md` (new)
- `src/modules/templates/anchorLibrary.test.ts` (new — banned list ⊇ live `templateMeta.designStyles` + 5 default bans; anchor count ≥15)

**Verification:** `npm run test:run` (derived banned-list + count assertions); manual read
for anchor quality (full taste review at phase 11 gate).

---

## Phase 7 — screenshot parity harness + diff

**Scope: VISUAL/CSS parity ONLY.** Dual-renderer CONTENT parity is already enforced in jsdom
by `renderParity.meridian.test.tsx` (visible-text diff per section) — this phase does not
re-do it. The pixel diff catches what jsdom can't: CSS/layout divergence between the pair.

Generalize the Meridian-only blocks stage into a per-template harness, then pixel-diff
edit-band vs published-band per section (compare the two bands TO EACH OTHER, not to a
baseline — sidesteps OS-pinned snapshots).

- Generic `TemplateBlocksStage` (from `MeridianBlocksStage`): takes templateId, pulls
  `resolveBlock(type,'edit')`/`(type,'published')` via the template's resolver, content from
  `blockMocks` registry (phase 2), palette/variant/knob switcher. Client-only
  `dynamic({ssr:false})` as today. Route `/dev/blocks/[template]`; existing
  `/dev/meridian/blocks` re-points to the generic stage (URL kept, e2e render.spec untouched).
- Dev-only seeded-break flag: `?parityBreak=1` injects a small style divergence into the edit
  band — permanent negative control.
- `e2e/parity.spec.ts`: per section, screenshot edit node + published node (stable band
  selectors, animations disabled, caret hidden), diff via `pixelmatch`+`pngjs` (devDeps),
  threshold small-but-nonzero (anti-aliasing). Asserts: meridian all-sections ≤ threshold;
  with `parityBreak=1` the diff EXCEEDS threshold (seeded-failure acceptance criterion).
  Enroll hearth too (mocks exist from phase 2) — feeds phase 8 verification.

**Files touched**
- `src/app/dev/blocks/[template]/page.tsx` (new)
- `src/app/dev/blocks/TemplateBlocksStage.tsx` (new — generalized)
- `src/app/dev/meridian/blocks/MeridianBlocksStage.tsx` (slim to wrapper or delete + re-point page; mock import already served by the phase-2 re-export)
- `src/app/dev/meridian/blocks/page.tsx` (re-point to generic stage)
- `e2e/parity.spec.ts` (new)
- `playwright.config.ts` (only if parity needs its own project entry; else untouched)
- `package.json` (devDeps: pixelmatch, pngjs; script `test:parity` optional)

**Verification:** `npx tsc --noEmit`; `npm run test:e2e` (or targeted `npx playwright test
parity`) — meridian+hearth green, parityBreak negative control red-then-caught; existing
render.spec still green.

---

## Phase 8 — hearth knobs pilot + looks data  **[HUMAN GATE]**

First template opts into knobs: tokenize `buttonShape` + `density` (+ map hearth's existing
inline variants (`hearthVariants`, tokens.ts:148) to the `typePairing` axis as ALIASES —
stored variantIds unchanged). Author ≥3 named looks for hearth in `templateMeta.ts`
(`looks` key: id, label, blurb, knob bundle + palette/variant refs). Wire hearth
ThemeInjector + `HearthSSRTokens` to apply knob attrs via the phase-3 shared helpers;
published plumbing already generic (phase 3). Enable the conformance knob-set +
looks-truthfulness rules for hearth.

**Human gate (knob decomposition touches live rendering):** before merge-on, founder verifies
NO visual change on existing customer/hearth projects — existing project with no
`themeValues.knobs` renders identically in editor, preview, AND published output (default
knob values emit no CSS). Evidence: parity spec green on hearth + side-by-side dev check on
a real hearth draft + `npm run build` + published-HTML diff on a test publish.

**Files touched**
- `src/modules/templates/hearth/tokens.ts` (extract `--btn-radius`/spacing-multiplier tokens; knob CSS layers via shared serializer)
- `src/modules/templates/hearth/ThemeInjector.tsx` (apply knob attrs)
- `src/modules/templates/hearth/components/HearthSSRTokens.tsx` (apply knob attrs + inline knob CSS, published side). **Review note:** `HearthSSRTokens` today accepts `mood` but doesn't use it in its stylesheet — when extending its prop signature for knobs, CONSUME the knob prop (apply data-attrs AND append the serialized CSS block), don't merely accept it, else published knobs silently no-op while the editor shows them. The no-visual-change gate's published-HTML diff must positively show the knob CSS present.
- `src/modules/templates/hearth/index.ts` (declare `knobs`)
- `src/modules/templates/templateMeta.ts` (additive `looks` key on TemplateMeta + hearth's ≥3 looks)
- `src/modules/templates/conformance.test.ts` (enroll hearth knob/looks rules)
- `src/modules/templates/templateConformance.ts` (looks-truthfulness rule if not fully landed in phase 3)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npx playwright test parity` (hearth,
per look via stage switcher); `npm run build`; the gate's no-visual-change evidence above.

---

## Phase 9 — looks in picker  **[HUMAN GATE]**

Customer-facing surface. For templates with `looks` in templateMeta: onboarding style step —
`StyleSlot.tsx` (which branches internally to the trust-path `TrustStyleSlot` render) shows
curated look tiles as the PRIMARY choice for look-bearing templates (raw variant+palette
controls kept below as the fallback/advanced row — conservative, no removal this build);
editor `ServiceThemePopover` gains a Looks section. `ProductStylePicker.tsx` (product path)
is intentionally untouched — hearth is service-side; product-picker absence stays out of
scope. Picking a look: resolve bundle →
`updateMeta({ variantId, paletteId, themeValues: {...prev, lookId, knobs} })` → existing
auto-save path (`/api/saveDraft` untouched — themeValues permissive, verify only).
Templates without looks: UI unchanged. Zero copy-regen on look swap (render-side only —
assert content JSON untouched).

**Human gate:** founder approves the picker UX (tile presentation, look names, fallback-row
placement) on dev before merge-on.

**Files touched**
- `src/components/onboarding/wizard/StyleSlot.tsx` (look tiles in the trust-path branch)
- `src/components/onboarding/wizard/fields/templateCatalog.ts` (surface looks metadata if catalog feeds the slot)
- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx` (Looks section)
- `src/app/api/saveDraft/route.ts` (expected NO edit — read-only schema confirmation; listed in case DraftSaveSchema needs a key allowance)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run test:e2e`
(edit-persistence + publish specs green); manual: pick each hearth look → editor + published
both correct, content JSON byte-identical before/after swap.

---

## Phase 10 — generation spread

Deterministic variety for same-niche new sites: seeded RNG (hash of project token) applied at
three pick points — (a) block-variant choice among eligible (extend
`blockEligibility` — currently deterministic-first), (b) starting palette tie-break among
top-scoring, (c) starting look for look-bearing templates (hearth). Same seed → same result
(reproducible); different tokens → spread. Copy untouched (render-side only); firewall
untouched (pure data in generation path, as today).

**Files touched**
- `src/modules/generation/spread.ts` (new — seeded RNG + pick helpers)
- `src/modules/generation/spread.test.ts` (new)
- `src/modules/generation/blockEligibility.ts` (seeded pick among eligible)
- `src/modules/generation/blockEligibility.test.ts` (spread + determinism cases)
- `src/modules/wizard/generation/trust.ts` (palette/look spread at creation when user made no explicit pick)
- `src/modules/wizard/generation/thing.ts` (block-variant spread hookup, meridian)

**Verification:** `npm run test:run` — 10 distinct seeds yield ≥7 distinct
(palette, look, hero-variant) tuples for hearth+meridian fixtures; same seed twice →
identical; `npx tsc --noEmit`; existing generation-contract tests green.

---

## Phase 11 — `/new-template` skill rewrite + manual-test subsection  **[HUMAN GATE]**

Rewrite thin: (1) decision gate FIRST (capability gap → path C block-pairs on flagship;
style gap → path D new template; engine missing → path E, refuse/escalate — skill refuses
"new template" when C fits, per scalePlan §7); (2) workflow = kit (`npm run kit:generate`) →
art-direction (anchor library, banned list) → 3–5 hero tiles → founder pick → full design →
lint (`npm run kit:lint`) → agent port via `/feature` → `templateConformance(id)` green →
parity spec → parity QA sign-off; (3) evergreen landmines ONLY (dual-renderer discipline,
plain `styles.ts`, class prefixing, margin-collapse through `data-surface`, self-hosted
fonts, behaviors asset, two-identifier discipline, bespoke §13 mode). DELETE every
code-derivable fact — point at `blockManifest.ts`/`elementContracts.ts`/`registry.ts`/
`knobs.ts`/`templateMeta.ts`. Both paths (C and D) share the one build core.
Also: `/manual-test` gains the editor-basics subsection — the visual/interactive items NOT
in the phase-2 jsdom subset (image-upload wiring, logo interaction, collection
add/remove/reorder, Button-Settings opening, nav/footer links, social links, form-builder
config, live knob/palette switching).

**Human gate:** founder reads skill rewrite + anchor library (phase 6) before either governs
a build (spec's "skill rewrite review" gate).

**Files touched**
- `.claude/skills/new-template/SKILL.md` (rewrite)
- `.claude/skills/manual-test/SKILL.md` (editor-basics subsection)

**Verification:** manual founder review (the gate); self-check in audit: zero layout maps /
export-name lists / schema-location prose remain; decision-gate table matches scalePlan §7;
manual-test subsection covers exactly the items phase 2 declared not-machine-checked.

---

## Acceptance-criteria mapping

- Decision gate documented / skill refuses D-when-C → phase 11.
- Kit generated for thing+trust+work, derived, regenerable → phase 4 (work grammar deepens
  later via atelier spec; generator's legacy-layout fallback covers it now).
- Anchor library ≥15 + banned-list derivation → phase 6 (derived test guards the banned list).
- Lint catches broken HTML (missing section, missing slot) → phase 5.
- `templateConformance(templateId)` single call, full coverage incl. editor-basics subset →
  phases 1–3, 8. Published/client boundary line = the existing GLOBAL
  `publishedClientBoundary.test.ts` (kept, cross-referenced in phase 1 — stronger than a
  per-template check). Dual-renderer content parity = existing
  `renderParity.meridian.test.tsx` (harness reused in phase 2).
- Knob set on ≥1 flagship, ≥3 looks in picker, zero-copy swap, both renderers → phases 8–9.
- Screenshot parity diff runs + fails on seeded break → phase 7 (visual/CSS parity only).
- Skill rewritten thin → phase 11.
- End-to-end atelier drill → OUT (docs/task/atelier-template.spec.md, after this build).
- Style-tile taste-pick gate → out of build scope (exercised in the atelier drill); the
  workflow slot for it is written in phase 11.

## Unresolved questions

- Hearth look names/count (3 vs more) + which palettes bundle — founder taste, decide at
  phase 8 gate?
- Picker: keep raw variant/palette row under look tiles (planned) or hide for look-bearing
  templates — confirm at phase 9 gate?
- Surge/vestria editor-basics + parity enrollment: this build (extra mocks) or defer to
  their next touch? Planned: defer.
