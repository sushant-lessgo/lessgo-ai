# section-background — plan (rev 3, final)

WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\section-background`
BRANCH: `feature/section-background`
Spec: `docs/task/section-background.spec.md` · Scout: `docs/task/section-background.scout.md`

## Overview

Un-defer the SectionToolbar `background` action on the work skeleton (`atelier`): Color = pick one
of the template's surfaces, delivered through BOTH the `[data-sid]{--u-bg;--u-fg}` block channel
and the wrapper `data-surface` attribute; hero additionally gets Image mode (variants that actually
RENDER `portrait_image` — slider/image/split; center is Color-only) and an emergent slideshow with
filmstrip tray (slider layout only); Video = greyed chip. Sequencing per orchestrator ruling:
slice 1 = Color on BODY sections (hero/header/collection sections excluded — see D7 rationale),
hero's Background control ships in phase 3 together with the `bgMode` semantics. Folds in two
editor gaps: `worksRow` in `CmsPanel` and rail tab "CMS"→"Content".

## Progress log

- phase 1 surface-override plumbing + contrast pair (slice 1a): **done** (commit 2393cee4, review loops 1, verdict `ship`)
- phase 2 background toolbar UI, colour on body sections (slice 1b): **done** (commits a335464d + eec08890 polish, review loops 1, verdict `ship`) — **AT SLICE-1 HUMAN GATE**
- phase 3 hero — Color + Image mode + bgMode + slides invariant (slice 2): pending
- phase 4 filmstrip tray (slice 3): pending
- phase 5 editor gaps — worksRow + Content label (slice 4, independent): pending

---

## Design decisions (resolved; implementers do not re-derive)

**D1 — Storage: reuse `SectionStyleTokens.background`.** `src/modules/skeletons/styleTokens.ts:23,38`
already has `UBackground = 'default'|paper|paper-2|dark|accent` keyed by sectionId
(`StyleTokens = Record<sectionId, SectionStyleTokens>`), persisted at
`Project.themeValues.styleTokens`, threaded to published via SSRTokens. No new key, no migration.
`bgMode?: 'color' | 'image'` = NEW optional field on `SectionStyleTokens`, **introduced in phase 3
and NEVER written before phase 3** — nothing consumes it earlier, so persisting it earlier would be
dead data. Data-attr-style lever like `headerMode`, deliberately NOT serialized to CSS. Absent →
derive from data (today's behaviour; existing drafts + frozen fixtures untouched). `'video'` is
never stored (greyed chip).

**D2 — Delivery: complete the `--u-*` pair, keep the wrapper channel. Phase 1 OWNS a
`BACKGROUND_CSS` contrast fix.** Confirmed: work-skeleton blocks SELF-PAINT their roots
(`background:var(--u-bg, <default>)`), so a wrapper-only `data-surface` override is painted over.
But today's `BACKGROUND_CSS` (`styleTokens.ts:56-62`) emits `--u-fg` ONLY for `dark`/`accent`.
Dark-default roots — `.wk-hero` (`Hero/styles.ts:13`), `.wk-hero-img` (`:55`), `.wk-footer`
(`Footer/styles.ts:14`) — declare `color:var(--u-fg, var(--wk-on-dark))` at the block root, which
BEATS any inherited wrapper colour → picking paper/paper-2 there yields light-on-light. So:
- Phase 1 changes `BACKGROUND_CSS`: `paper` and `paper-2` additionally emit
  `['--u-fg', 'var(--wk-ink)']`. Every non-default surface now emits the COMPLETE bg+fg pair.
  This also fixes `.wk-hero__cta--ghost` (`Hero/styles.ts:44`, `color:var(--u-fg, var(--wk-on-dark))`)
  — it resolves through the same pair; eyeball at the slice-1 gate.
- This IS a serialization change. Safe because no shipped UI has ever written
  `styleTokens[*].background` (the Design ▾ panel was never built; implementer verifies by grepping
  for writers). Fallout check: `src/modules/skeletons/work/tokenContract.test.ts:242-264` uses
  exact-string `toBe` — the existing cases (corners/spacing/shadow at :248, dark at :253) stay
  green; NEW table-driven cases assert BOTH `--u-bg` AND `--u-fg` for ALL four non-default surfaces.
- Honest framing: the complete `--u-*` pair ALONE would deliver colour with zero renderer call-site
  edits (the CSS channel is already threaded end-to-end). The wrapper `data-surface` channel is
  resolved from the same stored value anyway because it carries what the vars don't:
  `[data-surface="paper-2"]`'s `border-block` hairline, template-agnostic consumers, and the
  `analyticsGenerator.js:126` `[data-surface][id]` attribute — NOT because "the two halves agree by
  construction" (fg and hairline genuinely differ between channels today).
- The stale `SectionToolbar.tsx:320-333` comment gets rewritten to record this two-channel truth.

**D3 — The writer.** New store action `setSectionStyleTokens(sectionId, patch: Partial<SectionStyleTokens>)`
— type in `src/types/store/actions.ts`, **impl in `src/hooks/editStore/persistenceActions.ts`, next
to `updateMeta` (`persistenceActions.ts:886`)**. (`src/stores/editStore.ts:418-433` only COMPOSES
action slices — it is NOT edited; the earlier rev's file pointer was wrong.) Semantics: immer
deep-merge — `themeValues.styleTokens[sectionId] = {...existing, ...patch}` preserving every other
`themeValues` key and every other section's tokens; then trigger autosave (match sibling actions'
pattern). Round-trip is safe WITHOUT server changes: `autoSaveDraft.ts:219-224` sends the store's
whole `themeValues` blob, so `saveDraft/route.ts:285`'s column REPLACE receives the full merged
object. The merge obligation lives client-side, in this one action — nothing else may write
`themeValues.styleTokens`.
- *Considered & rejected:* inlining `updateMeta({themeValues: …})` at call sites
  (`VestriaThemePopover.tsx:150-156` precedent) — rejected because multiple call sites
  (BackgroundPanel chips, phase-3 tab switch) will write these tokens; one merge owner beats
  scattering the merge obligation, and a shallow-merge slip at any one call site would silently
  drop sibling `themeValues` keys.

**D4 — Resolution, gating, and the editor injector gap.**
- New pure helper in `styleTokens.ts`:
  `resolveSectionSurface(templateId, styleTokens, sectionId, fallback): string` →
  `styleTokens?.[sectionId]?.background`, treating absent/`'default'` as "use fallback", and
  **returning the fallback unconditionally when `!isSkeletonBacked(templateId)`**
  (`src/modules/skeletons/ids.ts` — pure data, firewall-safe import). Rationale (orchestrator R5):
  service templates are user-switchable and `styleTokens` is project-global, so an ungated resolver
  would leak `dark`/`paper-2` values onto hearth/lex after a template switch. `isSkeletonBacked` is
  the right predicate (surfaces are a SKELETON concept), not `isWorkCopyTemplate` (copy-engine
  axis). The `--u-*` CSS channel needs no gate — only work-skeleton injectors call
  `serializeStyleTokens`.
- Three renderer call sites call it with `tmpl.getSurfaceForSection(sectionType) ?? 'cream'` as
  fallback: `EditablePageRenderer.tsx:79-81` (needs a styleTokens selector added),
  `LandingPageRenderer.tsx:523` (preview mode; themeValues in scope),
  `LandingPagePublishedRenderer.tsx:156` (styleTokens prop in scope). The preview call site is
  additionally EXERCISED by a phase-2 e2e hop (it would otherwise ship untested).
- **Editor injector gap (phase 1):** `EditLayout.tsx:277-283` passes only
  `paletteId`/`variantId`/`mood` to `tmpl.ThemeInjector` — it NEVER passes `styleTokens`, so the
  edit route currently emits NO `[data-sid]{--u-*}` CSS at all (published does, via
  `LandingPageRenderer.tsx:967` / SSRTokens). Phase 1 adds `styleTokens={themeValues?.styleTokens}`
  there (the work injector already accepts the prop, `ThemeInjector.tsx:32`; other templates ignore
  it; the TemplateModule typing already permits it — `LandingPageRenderer.tsx:967` compiles today).
  Without this, the #1 dual-renderer trap: editor shows nothing, published shows the band.
  **Out-of-scope observation (record, don't fix):** `EditLayout.tsx` ALSO never passes `knobs` to
  `tmpl.ThemeInjector` while `LandingPageRenderer.tsx:963` does — same divergence class; note it in
  the phase-1 audit for a later cleanup, change nothing about knobs here.
- SSR fallback gap CLOSED in phase 1: `p/[slug]/renderPublishedRoot.tsx:147` and
  `p/[slug]/[...subpath]/page.tsx:322` additionally pass `themeValues.styleTokens`.
- Per-BLOCK delivery (`bgMode` to published hero cores): the published renderer's usesTemplate
  branch passes `styleTokens={styleTokens?.[sectionId]}` to `LayoutComponent` (phase 3). Edit
  wrappers read the store directly with a **scalar** selector —
  `useEditStore(s => s.themeValues?.styleTokens?.[sectionId]?.bgMode)` (no `useShallow`, no object
  churn).

**D5 — Header is EXCLUDED from Color entirely in this feature (orchestrator R2).**
`--wk-header-bg` is declared on `:root` (`tokenContract.ts:399`) and cannot be retro-bound
per-section; header background belongs to toolbar-wave-2's surface. Do NOT touch
`tokenContract.ts:399` or `.wk-header`. `WorkHeader.published.tsx`'s dead
`content[sectionId].styleTokens` read also stays untouched (wave-2 owns it); the phase-3 per-block
prop (D4) gives wave-2 the correct channel — note in the phase-3 audit, change nothing in WorkHeader.

**D6 — NO signature widening of `getSurfaceForSection`.** Its existing 2nd param is TYPE-keyed skin
data (`skin.selections.surfaceBySection`); routing an ID-keyed user override through it conflates
the two key spaces (the spec's own trap). Resolution is renderer-side via `resolveSectionSurface`.
`src/types/template.ts` and all 8 template `sectionRules.ts` files: ZERO edits.

**D7 — Toolbar gating + scope matrix (orchestrator R1, R3, R6).**
- Template gate: `const bgEnabled = isSkeletonBacked(templateId)` (same predicate as the resolver —
  one axis, never drifts). Non-work templates keep the EXACT current `disabledTitle`
  ("Section backgrounds are coming with the design system.") so `toolbar-dispatch.spec.ts:214-222,
  369-390, 432` greyed assertions stay green unmodified (they seed meridian/hearth — verified).
- **Section eligibility matrix** (section type via the `${type}-${uuid}` prefix parse, `isFooterId`
  grammar):

  | Sections | Phase 2 | Phase 3+ | Why |
  |---|---|---|---|
  | body: `gallery` `proof` `packages` `about` `faq` `results` `contact` `footer` | Color | — | self-paint `var(--u-bg,…)`; band visibly changes |
  | `hero` | greyed ("Hero background lands with image mode.") | Color + Image (variant-scoped, see below) + Video(greyed) | Precise rationale: on `workheroslider`/`workheroimage` the band is fully covered by `.wk-hero__media`/`__slides` + `__scrim` (`Hero/styles.ts:14,19,33,56,59`), so Color is INVISIBLE there until `bgMode:'color'` suppresses the media. On split/center Color is ALREADY visible — but hero ships as ONE coherent control in phase 3 (R1 sequencing stands); shipping half the hero variants in slice 1 would fork the gate story. End state unchanged from spec. |
  | `header` | excluded (greyed, "Header background comes with the header toolbar.") | excluded | D5 / R2 |
  | `workcatalog` `workdetail` | excluded (greyed, why-tooltip: shared collection machinery) | excluded | orchestrator R1 |

- **Accent chip ships GREYED with a why-tooltip** (greyed-placeholder rule, R3). Live chips v1:
  `Auto` (reset → `'default'`) + `paper` + `paper-2` + `dark`. Reason string: accent bands need a
  contrast pass — accent-coloured elements inside blocks (`.wk-hero__cta`,
  `.wk-hero__eyebrow::before`, `.wk-hero__name em`, …) would vanish on an accent band. "Audit
  accent bands vs drop the chip" is an explicit ASK at the slice-1 founder gate.
- **Image mode scope (R6, corrected per-variant — orchestrator ruling):**
  - `workheroslider` + `workheroimage`: Image tab live; slideshow (Add-more + promote) = slider
    layout ONLY; image variant gets single-image replace only.
  - `workherosplit`: Image tab live, single-image replace only.
  - `workherocenter`: **Color only.** Its core does NOT render `portrait_image`
    (`WorkHeroCenter.core.tsx:7-9` says so; `WORK_HERO_CENTER_STYLES`, `Hero/styles.ts:97-100`,
    has no `__media`/`__scrim` rule). Its Image tab ships **greyed with a why-tooltip** ("This
    hero layout doesn't display a background image.") — same greyed-placeholder pattern as Video.
    `bgMode` is a **no-op** on center and the panel never writes it there.
  - Chip label `Slideshow · N` only when slider layout && `slides.length >= 2 && bgMode !== 'color'`,
    else `Background`.
- **Per-variant Color-mode (`bgMode:'color'`) render matrix** — replaces any blanket
  "render no media/scrim" sentence:

  | Variant | `bgMode:'color'` behaviour | Where |
  |---|---|---|
  | `workheroslider` | drop the absolute `__slides`/`__media` + `__scrim` layers (they're `position:absolute;inset:0` overlays) | core conditional; no new CSS needed |
  | `workheroimage` | drop the absolute `__media` + `__scrim` layers | core conditional; no new CSS needed |
  | `workherosplit` | media is a GRID COLUMN (`.wk-hero-split__media`, `aspect-ratio:4/5`, `Hero/styles.ts:86`), not an overlay — dropping it alone leaves a `1.05fr 0.95fr` grid with one empty column. So: core omits the media column AND adds a modifier class (e.g. `.wk-hero-split--no-media`) whose rule collapses the grid to a single column. **New CSS rule lands in `src/modules/skeletons/work/blocks/Hero/styles.ts`** (new selector only — D9). | core + `Hero/styles.ts` |
  | `workherocenter` | no-op (no media rendered today) | nothing |

- Verify `'palette'` has an `ActionIcon` iconMap entry (`SectionToolbar.tsx:507-573`) — confirmed
  present; no edit expected.

**D8 — Slides invariant, read-side normalization, stamp guard (orchestrator R4).** Pure helpers in
NEW `src/modules/skeletons/work/heroSlides.ts` — ALL of them land in phase 3 (reorder/replace
included; phase 4 adds no helpers):
- `normalizeSlides(elements)` — read-side coercion EVERY panel/helper entry point runs first: a
  pre-existing length-1 `slides` array is treated as single-image state WITHOUT mutating the draft
  on read. **Tie-break: `portrait_image` WINS when both are present** — `WorkHeroSlider.core.tsx:58-61`
  forks at `>=2`, so a length-1 draft renders `portrait_image` on canvas; the panel must agree with
  what the user sees (the never-rendered orphan slide loses).
- `promoteToSlides(elements, newImage)` — slide 1 = the CURRENT normalized visible image
  (`portrait_image` when present, per the tie-break above; else the orphan slide's image); result
  `[{id, image}, {id, image: new}]`. A never-rendered orphan slide image may be discarded here —
  it was invisible, so nothing the user sees is lost.
- `demoteToSingle(slides, removedId)` — survivor → `portrait_image`, and the `slides` KEY is
  removed (byte-clean vs an untouched draft; if `updateElementContent` can't delete a key, an empty
  array is the accepted fallback — both are "single-image state" to `normalizeSlides`).
- `reorderSlides`, `replaceSlide`, `removeSlide` (auto-demotes at length 2).
- Invariant: no helper ever RETURNS `slides` of length 1.
- **Write-side guard:** `stampHeroSlides` (`src/modules/generation/workCollections.ts:145-161`)
  currently stamps whatever length ≥1 it derives — change to skip when the derived array length
  `< 2` (today's `length === 0` early-return is not enough).
- Writes go through `updateElementContent(sectionId, key, value)`; each user gesture wrapped in ONE
  `executeUndoableAction` (BlockVariantSelector precedent — inline warning, no confirm dialog,
  single undo restores everything).
- *Considered & rejected:* delivering `bgMode` as a CSS var (e.g. `--u-hero-media-display:none`
  serialized by the injector) instead of a per-block prop — rejected because a `display:none` hero
  image is STILL DOWNLOADED by the browser; the prop path removes the element from the markup.

**D9 — Don't-break ledger** (every phase's reviewer checks these):
- `work.v1.js` byte-unchanged; no new/renamed JS hooks; `SLIDER_INTERVAL_MS`/transition untouched.
- Absent override / absent `bgMode` → all renderers emit byte-identical DOM.
  `kundiusPages.test.tsx`, `oldContentFallback.test.tsx`, `coreParity.test.ts`,
  `uiFoundationIsolation.test.tsx.snap` must pass UNMODIFIED (a needed snapshot update = a defect).
- Wrapper keeps BOTH `id` + `data-surface` attrs (`analyticsGenerator.js:126` reads
  `[data-surface][id]`); only the VALUE may change. (SectionIds are globally unique across pages —
  `p/[slug]/[...subpath]/page.tsx:288-291` — so id-keying genuinely avoids multi-page bleed.)
- Header: `tokenContract.ts:399` (`--wk-header-bg` on `:root`), `.wk-header` rules, and
  `WorkHeader.*` untouched (D5).
- `workcatalog`/`workdetail` blocks untouched. `WorkHeroCenter.*` untouched (D7).
- No code writes `bgMode` before phase 3 lands.
- `WORK_HERO_STYLES`/`WORK_HERO_IMAGE_STYLES`/`WORK_HERO_SPLIT_STYLES`: existing rules must not
  change; NEW selectors only (the split single-column modifier is the one expected addition).
- `MediaPickerModal` (`'use client'`) never imported from any `.published.tsx`/core path.

---

## Phase 1 — Surface-override plumbing + contrast pair (Slice 1a: storage → renderers → export)

**Goal:** an id-keyed `styleTokens[sectionId].background` value set in the store visibly changes
that ONE section's band — background AND foreground — in edit, preview, published blob HTML, and
the SSR fallback — with zero UI.

**Steps**
1. `styleTokens.ts`: (a) `BACKGROUND_CSS` completes the pair — `paper`/`paper-2` add
   `['--u-fg', 'var(--wk-ink)']` (D2); (b) add `resolveSectionSurface()` with the
   `isSkeletonBacked` gate (D4). Grep-verify nothing writes `styleTokens[*].background` today (D2
   safety claim).
2. `src/types/store/actions.ts` (type) + `src/hooks/editStore/persistenceActions.ts` (impl, beside
   `updateMeta` at `:886`): add `setSectionStyleTokens` (D3). `src/stores/editStore.ts` is slice
   COMPOSITION only — not edited.
3. Thread `resolveSectionSurface` through the three call sites (D4): `EditablePageRenderer.tsx`
   (add `useEditStore(s => s.themeValues?.styleTokens)` selector), `LandingPageRenderer.tsx:523`,
   `LandingPagePublishedRenderer.tsx:156`. Keep the `id`/`data-surface` attribute pair intact.
4. **Close the editor injector gap:** `EditLayout.tsx:277-283` passes
   `styleTokens={themeValues?.styleTokens}` to `tmpl.ThemeInjector` (D4). Record the parallel
   `knobs` divergence in the audit as out-of-scope (D4) — do not fix it.
5. Close the SSR fallback gap: pass `themeValues.styleTokens` in `renderPublishedRoot.tsx` and
   `p/[slug]/[...subpath]/page.tsx`.
6. Tests (deterministic, land WITH the phase):
   - `src/modules/skeletons/work/tokenContract.test.ts` (the serializer's existing home — do not
     split the suite): NEW table-driven case iterating ALL four non-default `UBackground` values,
     asserting the emitted block contains BOTH a `--u-bg` and a `--u-fg` declaration (fails if any
     surface ships background-only); existing exact-string cases stay green unmodified.
   - NEW `src/modules/skeletons/styleTokens.test.ts` (resolver only; cross-reference comment to
     tokenContract.test.ts): override wins; `'default'`/absent → fallback; **no-bleed** (`hero-aaa`
     override leaves `hero-bbb` at fallback); **gating** — same styleTokens with
     `templateId: 'hearth'` → fallback returned (the template-switch leak case, R5).
   - Extend `src/lib/staticExport/htmlGenerator.test.ts` (neighbour: the AC-L123 block at
     `:101-129`) — published-side proof for BOTH channels: styleTokens with `background: 'dark'` on
     one section → published HTML's wrapper for THAT section carries `data-surface="dark"` with
     `id` intact, sibling keeps its default, AND the emitted stylesheet contains the
     `[data-sid="…"]` block with BOTH `--u-bg:var(--wk-dark)` and `--u-fg:var(--wk-on-dark)`.
     **The no-bleed sibling needs a SECOND section — build it as a LOCAL fixture inside the new
     test case; do NOT mutate the shared `buildPage()`/`render()` helpers (`:18-51`), which all
     four suites in that file share.** (String-level is the published equivalent of a
     computed-style check — jsdom can't compute the `var()` cascade; the live computed-style check
     is phase 2's e2e.)
   - NEW edit-side test (`renderParity.work.test.tsx` mounts blocks via `resolveWorkBlock` and
     never runs the wrapper-emitting renderers, so it CANNOT prove this): jsdom test mounting
     `EditablePageRenderer` with a store seeded `styleTokens['hero-aaa'] = {background: 'dark'}` →
     assert the section wrapper element for `hero-aaa` has `data-surface="dark"` and the wrapper
     for `hero-bbb` keeps the skin default. (Extend an existing EditablePageRenderer test file if
     one exists; else new `EditablePageRenderer.surface.test.tsx` beside the component.)

**Files touched**
- `src/modules/skeletons/styleTokens.ts`
- `src/modules/skeletons/styleTokens.test.ts` (new)
- `src/modules/skeletons/work/tokenContract.test.ts`
- `src/types/store/actions.ts`
- `src/hooks/editStore/persistenceActions.ts`
- `src/app/edit/[token]/components/layout/EditLayout.tsx`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.surface.test.tsx` (new, or existing suite)
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/app/p/[slug]/renderPublishedRoot.tsx`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `src/lib/staticExport/htmlGenerator.test.ts`

**Verification:** `npx tsc --noEmit` · `npm run test:run` — the NEW assertions above are the gate
(each fails if: any surface emits bg without fg / the resolver leaks across templates / either
renderer drops the wrapper value / published CSS drops either var); D9 tripwires green UNMODIFIED
· `npm run lint`. Manual: none (no UI yet).

---

## Phase 2 — Background toolbar UI, Colour on body sections (Slice 1b — the decision gate)

**Goal:** Background chip live on work-skeleton BODY sections (D7 matrix) with chips
`Auto · Paper · Subtle · Ink` + greyed `Accent`; hero/header/collection sections greyed with
per-case why-tooltips; every other template keeps today's greyed placeholder verbatim.

**Steps**
1. `SectionToolbar.tsx`: gate per D7 (template gate + section matrix, three distinct
   `disabledTitle` strings); rewrite the stale `:320-333` comment (record D2's two-channel truth);
   handler opens the panel; `'palette'` iconMap entry confirmed present (verify, no edit expected).
2. NEW `BackgroundPanel.tsx`: toolbar-docked dropdown (`absolute top-full left-0` sibling inside
   the pill — `ImageToolbar.tsx:22-28` precedent; `ToolbarShell` chrome is `relative`, no
   `overflow-hidden`). v1 renders the Color chip row only; live chips call
   `setSectionStyleTokens(sectionId, {background})` — **`{background}` ONLY, `bgMode` is never
   written in this phase** (D1). Accent chip greyed per D7/R3 (`aria-disabled` + why-tooltip).
   Active chip reflects stored value. `data-testid` kebab convention (`section-bg-panel`,
   `section-bg-chip-paper`, `section-bg-chip-accent-disabled`, …).
3. NEW `e2e/section-background.spec.ts` — **register it in `playwright.config.ts` under the
   `authed` project** (`playwright.config.ts:40-42,67-71` documents `testMatch` as an explicit
   ALLOWLIST — an unregistered spec matches no project and the suite goes green having never run
   it; this spec IS the decision gate, so registration is non-optional).
   **Seeding: follow `e2e/work-library.spec.ts:145-160`** — Clerk session (`auth.setup.ts`) →
   `POST /api/saveDraft` with `templateId: 'atelier'` + `finalContent` → open `/edit/[token]`.
   (NOT the `workWave2.spec.ts` pattern — that targets the public dev stage `/dev/blocks/atelier`
   with no editor/store/autosave; and NOT "mock mode" — mock mode bypasses generation, not auth on
   `/edit/[token]`.) Assertions that FAIL if either paint channel is missing (`data-surface`
   presence alone is inert):
   - Pick Ink on a body section → `page.evaluate` `getComputedStyle` of the block ROOT
     (`[data-sid="<id>"]`): `backgroundColor` CHANGED from its captured baseline AND `color`
     CHANGED from its baseline (both channels live in the EDITOR DOM — this is what catches the
     EditLayout gap regressing).
   - Wrapper `data-surface="dark"` + `id` both present; a second section's computed
     `backgroundColor` unchanged (no-bleed at paint level).
   - Pick Paper on the FOOTER (dark-default root) → **contrast assertion rule (explicit, no
     tautology): the footer root's computed `color` must EQUAL the resolved value of `--wk-ink`
     (read `--wk-ink` via `getComputedStyle`, normalize both to rgb via a probe element and
     compare)** — proves the D2 pair end-to-end, not merely "something changed".
   - **Preview hop (third renderer call site):** after picking a surface, navigate to the preview
     rendering (`LandingPageRenderer.tsx:523` path) and assert the same computed `backgroundColor`
     survives — without this, that call site ships unexercised.
   - Reload → override persisted (autosave round-trip).
   - Hero + header toolbars: background action disabled with the phase-2 tooltips.
   - Published side: covered by phase 1's `htmlGenerator.test.ts` two-channel assertions +
     `parity.spec.ts` below.
   Non-work stays covered by `toolbar-dispatch.spec.ts` untouched — run it; grep e2e/tests for
   selectors keyed on the old disabledTitle before changing anything.

**Files touched**
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx` (new)
- `e2e/section-background.spec.ts` (new)
- `playwright.config.ts`

**Verification:** `tsc --noEmit` · `test:run` · `lint` · `npm run build` (`git status
public/assets` empty diff — `work.v1.js` untouched) · `npx playwright test
e2e/section-background.spec.ts e2e/toolbar-dispatch.spec.ts e2e/parity.spec.ts` (bands <3%) —
confirm the runner REPORTS section-background tests as executed (allowlist check).

**HUMAN GATE (slice-1 decision gate — blocks phases 3–4):**
founder eyeballs the 3 live surfaces on a real Kundius draft (taste sign-off) · **DECIDE: audit
accent bands for a contrast pass vs drop the Accent chip** (R3) · published parity QA · multi-page
no-bleed check on a real multi-page project · Kundius byte-identity (tripwires green, untouched
draft renders identically).

---

## Phase 3 — Hero: Color + Image mode + `bgMode` + slides invariant (Slice 2)

**Goal:** hero's Background control goes live with Color | Image | Video(greyed) tabs. `bgMode:
'color'` suppresses hero media per the D7 per-variant matrix (slider/image drop the overlay
layers; split collapses to a single column; center is a no-op — Color-only there). Slider layout
gets the always-visible "Add image — add more to make a slideshow" slot; 2nd image promotes to
slides; Color↔Image switching is lossless.

**Steps**
1. `styleTokens.ts`: add `bgMode?: 'color' | 'image'` to `SectionStyleTokens` (NOT serialized —
   assert in `tokenContract.test.ts` that a `bgMode`-only section emits nothing, `headerMode`
   pattern).
2. NEW `heroSlides.ts` + tests: ALL D8 helpers land here (normalize/promote/demote/reorder/
   replace/remove — phase 4 adds none). Tests: invariant (no helper returns length-1 `slides`);
   `normalizeSlides` handles a pre-existing length-1 draft without mutating input AND applies the
   `portrait_image`-wins tie-break (panel agrees with canvas); `promoteToSlides` uses the
   normalized visible image as slide 1; demote sets `portrait_image` to the survivor and removes
   the `slides` key.
3. `workCollections.ts`: `stampHeroSlides` skips when the derived slide array length < 2 (R4
   write-side guard). Extend `workCollections.test.ts`: one-cover collection set → hero left
   byte-identical (no length-1 stamp).
4. Hero cores per the D7 render matrix — THREE variants change (`WorkHeroSlider`/`Image`/`Split`
   accept optional `bgMode`; `'color'` behaviour per matrix; absent or `'image'` → today's exact
   markup, byte-identical). **`WorkHeroCenter.core.tsx`/`.tsx`/`.published.tsx` are DELIBERATELY
   UNTOUCHED** (renders no `portrait_image`; `bgMode` is a no-op there — D7). `Hero/styles.ts`
   gains ONE new selector: the split single-column modifier (D7 matrix; D9 — no existing rule
   changes).
5. Wrappers: each touched edit wrapper reads the D4 scalar selector
   (`s.themeValues?.styleTokens?.[sectionId]?.bgMode`) and passes to its core; each touched
   published wrapper accepts the new per-section `styleTokens` prop and passes `bgMode` to its core.
6. `LandingPagePublishedRenderer.tsx`: usesTemplate branch passes
   `styleTokens={styleTokens?.[sectionId]}` to `LayoutComponent` (D4/D5 — WorkHeader NOT touched;
   record in audit; components that don't declare the prop ignore it).
7. `SectionToolbar.tsx`: un-grey hero (D7 matrix column 2); dynamic chip label `Slideshow · N`.
8. `BackgroundPanel.tsx`: hero tabs (Color chips per D7; Image; Video greyed with `aria-disabled`
   + why-tooltip). **Image tab is variant-aware:** greyed with why-tooltip on `workherocenter`
   (D7 — never writes `bgMode` there); live elsewhere. Image tab wires `MediaPickerModal`
   (caller-owned `open` state, `tokenId`, `initialTab="library"` — `editPrimitives.tsx:187`
   precedent); entry runs `normalizeSlides` first (D8); pick on empty → write `portrait_image`;
   **slider layout only:** always-visible Add slot with slideshow hint, 2nd pick → promote inside
   ONE `executeUndoableAction`; image/split variants: single-image replace only (R6). Tab switch
   writes `bgMode` only — images never cleared.
9. Tests: NEW `heroBackground.test.tsx` — per TOUCHED hero core: absent `bgMode` ≡ current markup
   (byte-comparison vs pre-change fixture); `'color'` → slider/image render no media element,
   split renders no media column AND carries the single-column modifier class — in BOTH the edit
   and published wrapper output (parity, per variant); center: `bgMode:'color'` in styleTokens
   changes NOTHING (no-op proof); slider promote output renders 2 `.wk-hero__slide`s with frozen
   hooks verbatim. Extend `e2e/section-background.spec.ts`: hero pick Ink in Color mode →
   computed `backgroundColor`/`color` of `.wk-hero` root change and NO `img` is rendered (proves
   suppression, not just attributes); Image pick → promote → chip `Slideshow · 2`; Color↔Image
   round-trip lossless.

**Files touched**
- `src/modules/skeletons/styleTokens.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`
- `src/modules/skeletons/work/heroSlides.ts` (new)
- `src/modules/skeletons/work/heroSlides.test.ts` (new)
- `src/modules/generation/workCollections.ts`
- `src/modules/generation/workCollections.test.ts`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroImage.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSplit.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Hero/styles.ts` (ONE new selector: split single-column modifier)
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/modules/skeletons/work/blocks/__tests__/heroBackground.test.tsx` (new)
- `e2e/section-background.spec.ts`

*(Deliberately NOT touched: `WorkHeroCenter.core.tsx`/`.tsx`/`.published.tsx` — D7 ruling.)*

**Verification:** `tsc --noEmit` · `test:run` (heroSlides invariant + stamp guard + heroBackground
per-variant parity incl. the center no-op + ALL D9 tripwires unmodified-green) · `build`
(`work.v1.js` byte-diff empty) · targeted Playwright: `section-background.spec.ts`,
`workWave2.spec.ts`, `parity.spec.ts`.

---

## Phase 4 — Filmstrip tray (Slice 3)

**Goal:** the 2+ state grows the same panel into a horizontal filmstrip: drag-reorder = play order,
numbered `01/02/03`, per-card replace/delete, click = canvas preview, cap 6.

**Steps**
1. NEW `HeroSlidesTray.tsx`: dnd-kit per `EditableImageCollection.tsx` precedent
   (`PointerSensor {distance:6}` + keyboard sensor, `SortableContext`, `arrayMove`, ONE
   `onChange(next)` per drop; `horizontalListSortingStrategy` + `restrictToHorizontalAxis` — first
   horizontal use in repo; `@dnd-kit/modifiers` is installed). Per-card: replace
   (→ `MediaPickerModal`), delete (no confirm; `removeSlide` auto-demotes at 2; ONE
   `executeUndoableAction` + inline "Undo restores" hint). Add slot hidden at cap 6
   (`workSections.ts:187-197`) with a cap notice (SocialItemsEditor `:385-399` pattern). All
   mutations via the phase-3 helpers — this phase adds NO helper. `data-testid`s:
   `hero-slides-tray`, `hero-slide` (+`data-slide-id`), `hero-slide-replace`, `hero-slide-remove`,
   `hero-slide-add`, `hero-slides-cap-notice`.
2. Thumbnail click → `window.dispatchEvent(new CustomEvent('lessgo:wk-hero-preview-slide',
   {detail:{sectionId, slideId}}))` (precedent: `lessgo:manage-collections`). `WorkHeroSlider.tsx`
   edit effect listens, forces that slide active, pauses autoplay while the panel is open.
   Edit-only; zero published impact.
3. `BackgroundPanel.tsx`: Image tab renders tray when `normalizeSlides` yields ≥2 (State B growth).
4. Tests: NEW `HeroSlidesTray.test.tsx` (jsdom): reorder writes the FULL new order once; delete at
   2 → demote payload (`portrait_image` set, `slides` key gone, invariant holds); add hidden at 6 +
   notice; delete-then-undo restores. Extend `e2e/section-background.spec.ts`: reorder → first
   visible slide changes; published play order = tray order (assert via published-renderer markup
   order in vitest — DOM order IS play order, `work.v1.js` iterates `.wk-hero__slide` in document
   order).

**Files touched**
- `src/app/edit/[token]/components/toolbars/HeroSlidesTray.tsx` (new)
- `src/app/edit/[token]/components/toolbars/HeroSlidesTray.test.tsx` (new)
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.tsx`
- `e2e/section-background.spec.ts`

**Verification:** `tsc --noEmit` · `test:run` · `lint` · Playwright `section-background.spec.ts` +
`workWave2.spec.ts`. Manual (not automatable): drag feel + preview-on-click against `npm run dev`.

**HUMAN GATE:** founder QA of the full Background surface on a Kundius-like draft + publish →
live-page slideshow behaviour check (autoplay/arrows/dots via frozen `work.v1.js`).

---

## Phase 5 — Editor gaps: worksRow + "Content" label (Slice 4 — independent, may land any time)

**Goal:** editor rail CMS panel deep-links to the works board; rail tab reads "Content".

**Steps**
1. `CmsPanel.tsx`: port the `worksRow` from `CmsBoardClient.tsx:374-384` (range VERIFIED — comment
   `:374`, JSX `:375-384`; the board gates on its `hasWorkLibrary` prop) — same
   `data-testid="cms-works-link"`, href `/dashboard/${token}/work`, gated by
   `templateHasCapability(templateId, 'works')` (`@/modules/templates/templateMeta`, plain data —
   client-safe; templateId from the edit store).
2. `LeftPanel.tsx:140`: label `'CMS'` → `'Content'`. LABEL ONLY — `value: 'cms'`, `RailTab`,
   `LIVE_RAIL_TABS`, `lessgo:manage-collections` plumbing untouched. Before committing: grep
   `src` + `e2e` for selectors matching the literal tab label (name:'CMS') and fix any.
3. Extend `CmsPanel.test.tsx`: works-capable project → link rendered with correct href; non-works
   template → absent.

**Files touched**
- `src/app/edit/[token]/components/cms/CmsPanel.tsx`
- `src/app/edit/[token]/components/cms/CmsPanel.test.tsx`
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`

**Verification:** `tsc --noEmit` · `test:run` (CmsPanel suite) · Playwright
`cms-authoring.spec.ts` + `cms-publish.spec.ts` (prove the rename broke no selector/event flow).

---

## Final gates (after all phases)

`tsc --noEmit` · `test:run` · `lint` · `npm run build` · full Playwright incl. `parity.spec.ts`
(<3% bands) · `git diff` shows `public/assets`/`scripts/legacy` untouched.
**HUMAN GATE:** merge to main + push (standard).

## Implementer notes — BINDING (from the final plan review, verified in code)

Plan APPROVED at plan-review iteration 3. These were raised as non-blocking but are load-bearing
implementation facts — treat them as part of the phase they name.

**N1 (phase 2, MUST-FIX before writing `e2e/section-background.spec.ts`) — the cited seed cannot
render the work skeleton.** `POST /api/saveDraft` never writes `Project.audienceType`
(`src/app/api/saveDraft/route.ts:264-298` — absent from both `create` and `update`), and
`loadDraft` defaults it (`src/app/api/loadDraft/route.ts:133` →
`audienceType: project.audienceType || 'product'`). With `('product','atelier')`,
`usesTemplateModule` (`src/types/service.ts:85-93`) returns **false** → the editor takes the LEGACY
path: no `data-surface` wrapper, no `tmpl.ThemeInjector`, no `[data-sid]{--u-*}` CSS, no work
blocks. (`work-library.spec.ts` got away with it because the dashboard board reads `brief.facts`,
not the editor.) **Fix:** prepend the standard editor-seed prelude used by
`e2e/edit-persistence.spec.ts:45-49`, `editor-preview-mode.spec.ts:53-57`,
`cms-authoring.spec.ts:39-43` — `POST /api/user/persona {persona:'agency'}` → `GET /api/start`
(this is where `audienceType` is captured) → use the returned token for `saveDraft` with
`templateId:'atelier'`. Dev-only escape hatch: `/edit/<token>?templateId=atelier` forces
`audienceType='service'` (`persistenceActions.ts:480-489`).

**N2 (phase 2) — the gallery section type is `work`, NOT `gallery`.**
`resolveWorkBlock.ts:114` registers the gallery under key `work`; `workSections.ts:204` declares
`sectionType:'work'` (sectionIds are `work-<uuid>`). Only `sectionRules.ts:25` uses the legacy name
`gallery`. **Implement the section gate as a DENYLIST** (`hero` greyed until phase 3;
`header`/`workcatalog`/`workdetail` excluded; everything else gets Color) — an allowlist copied
literally from D7's matrix would ship the atelier gallery, the centrepiece body section, greyed.
Applies to the e2e's choice of body section too.

**N3 (phase 1)** — `EditLayout.tsx` does NOT use `useEditStore`; it reads via `useStoreState`
(`EditLayout.tsx:5,58`). Add `useStoreState(s => (s.themeValues as any)?.styleTokens)` alongside the
existing `mood` selector at `:58`.

**N4 (phase 3)** — in `LandingPagePublishedRenderer.tsx:160-169`, `{...flattenedData}` is spread
**last**; place `styleTokens={styleTokens?.[sectionId]}` accordingly and note that a same-named
content key would clobber it (low risk, ordering is load-bearing).

**N5 (phase 3)** — `demoteToSingle` must genuinely DELETE the `slides` key, not write `[]`:
`stampHeroSlides` skips only when `Array.isArray(el.slides) && el.slides.length > 0`
(`workCollections.ts:159`), so an empty array would be re-stamped on a later collection run. If
deletion is impossible, record the edge case in the audit.

**N6 (phase 3/4)** — the toolbar-docked-dropdown precedent is `TextToolbarMVP.tsx:635,689`
(pattern documented at `ToolbarShell.tsx:248`), not `ImageToolbar.tsx:22-28` (that's just its
`useState` block).

**N7 (phase 1, confirmed safe)** — no existing exact-string serializer test covers `paper`/`paper-2`
(`tokenContract.test.ts:242-269` covers corners/spacing/shadow, `dark`, border, `headerMode`), so
adding `--u-fg` to paper/paper-2 keeps them green as D2 claims.

**N8 (phase 2, from the phase-1 impl-review) — D2's root `--u-bg`/`--u-fg` pair is NOT the whole
contrast story.** Dark-default blocks hardcode on-dark colours on their CHILDREN:
`.wk-footer__note` / `.wk-footer__eyebrow` use `color:var(--wk-on-dark-soft)` and `.wk-footer__top`
uses `border-bottom:1px solid var(--wk-line-dark)` (`blocks/Footer/styles.ts:11-13`); the hero has
the same pattern. Picking `paper`/`paper-2` on footer/hero fixes the ROOT foreground but leaves
secondary text and hairlines near-white on paper — which violates spec AC "No surface choice can
produce an unreadable text/background pairing". **Phase 2 must handle this** (surface-scoped
overrides for the on-dark children, or soft/hairline tokens that follow `--u-fg`), and the
slice-1 founder gate must eyeball it alongside the Accent-chip question.

**N9 (follow-up ticket, NOT this feature)** — `src/lib/blog/ssr.tsx:88` renders
`LandingPagePublishedRenderer` without `styleTokens` (also without `mood`/`knobs`) — the same
divergence class as the recorded `EditLayout` `knobs` gap. Blog sections aren't in the styleTokens
map today, so it's inert; log it, don't fix it here.

**N10 (phase 2, cheap)** — `htmlGenerator.test.ts`'s CHANNEL-2 no-bleed assertion is
value-vacuous: the sibling it compares is `hero`, whose skin default already IS `dark` (the override
value under test), so it can never detect a bleed *of `dark`*. Resolver- and edit-level no-bleed
tests ARE non-vacuous, so this is cosmetic — strengthen it in one line by also rendering with
`{[ABOUT]: {background:'paper'}}` and asserting the hero wrapper still reads `data-surface="dark"`.

## Founder rulings at the slice-1 gate (2026-07-22) — CLOSED

**Gate PASSED.** Three rulings, all now binding:

- **G1 — Auto and Paper read too close.** Auto renders a solid swatch of whatever it resolves to,
  which for most body sections IS paper → the two chips look identical. **Fix:** make Auto read as a
  MODE, not a colour (distinct swatch treatment — not a solid fill duplicating Paper — plus a hint of
  which surface it currently resolves to). Subtle and Ink are distinct enough as-is. Landed in
  phase 2b.
- **G2 — DROP the Accent chip for now.** Founder ruling supersedes the greyed-placeholder default
  (R3) and closes the "fund a contrast pass vs drop" question: **drop**. Live chips = Auto · Paper ·
  Subtle · Ink. No greyed Accent chip. Accent bands + their contrast pass are a later spec. Landed
  in phase 2b.
- **G3 — Dark-band nested cards losing separation: ACCEPTABLE for now.** No card treatment. Do not
  spend on it.

Also ruled at the gate: the two known-but-unfixed items stay unfixed on this branch — the live
Kundius `proof`-on-dark contrast bug (needs its own ticket; fixing it means editing shared
`[data-surface]` rules and would break the untouched-draft-identical contract) and the absent
automated coverage for "header is greyed on atelier" (a work-skeleton header dispatches no toolbar
to click).

## Unresolved questions

- Chip labels OK: Auto / Paper / Subtle / Ink (+ greyed Accent)?
- Accent at slice-1 gate: fund a contrast-pass audit of accent bands, or drop the chip?
- Greyed tooltip copy OK — hero (pre-phase-3), header, collection sections, Video, Accent, center's
  Image tab?
- Slice-1 gate venue: live Kundius draft or preview-env clone?
