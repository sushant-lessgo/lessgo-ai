# i18n-phase-1 — implementation plan (rev 2, post plan-review)

**Branch:** `feature/i18n-phase-1`
**Spec:** `docs/task/i18n-phase-1.spec.md` · Track: `docs/tracks/i18nPlan.md`
**Date:** 2026-07-11

## Overview

Add a platform content-language layer (independent authoring only): locale-keyed content as a
back-compatible **overlay** on today's flat content, per-project locale config, an editor language
toggle re-pointing all Editables, and per-locale pre-rendered published pages with a shared
`switcher.v1.js` (geo default + localStorage) **plus reciprocal hreflang/canonical tags so the
geo redirect is crawler-safe**. `bilingual` becomes queryable via a Brief field + serve-gate
derivation, backed by a structural honesty test. Existing single-locale projects see zero
storage/behavior diff — locale machinery is invisible until a project declares a 2nd locale.

## Progress log

- phase 1 content-model types + locale resolver: done (commit 78891443, review loops 1). Carry-forward → 3b: guard `resolveLocaleElements` empty-overlay reference churn (perf-01/02 memo). See audit.
- phase 2 persistence (saveDraft/loadDraft locale-aware): done (commit 1df7756c, review loops 1). Schema lives in `src/lib/validation.ts` (not route.ts). Carry-forward → 3a: (i) full-map export invariant is load-bearing (partial map WIPES omitted locales); (ii) loadDraft emits `localeConfig: null` for legacy — hydration must OMIT the key on save, never send null (schema `.optional()` rejects null → 400); (iii) mirror test(f) `declaredLocalesFullyPresent` shape for the store-side flush assertion.
- phase 3a editor store state layer (activeLocale, writes, history, persistence): done (review loops 1, ship). Store types live in `src/types/store/{state,actions}.ts` (not storeTypes.ts); undo/redo restore lives in `src/hooks/editStore/uiActions.ts` (both added to scope). Locale-aware undo/redo COMPLETE. Reviewer finding #1 (base-write undo mis-route for locale-shared collection edits) FIXED in-phase — Phase-4 precondition discharged (base-write history entries stamp default-locale, not activeLocale).
- phase 3b editor read-site threading (enumerated read-site list): pending
- phase 4 editor language toggle + locale config UI: pending
- phase 5 static export per-locale + hreflang + switcher asset: pending
- phase 6 publish route + KV locale paths: pending
- phase 7 bilingual queryable + honesty test: pending
- phase 8 generic en/nl pilot + docs: pending

## Plan decisions (spec's deferred calls)

### D1 — Content-model shape: **default-locale base + per-locale overlay** (variant of `content[locale]`)

Canonical flat `finalContent.content` (Record<sectionId, SectionData>) **stays exactly as-is and
IS the default locale** — zero migration, no read-time adapter needed for legacy data, and the 27
`updateElementContent` call sites keep their signature. Non-default locales live in a sibling
overlay: `finalContent.localeContent: { [locale]: { [sectionId]: { [elementKey]: string|string[] } } }`
— text values only, structure (sections/layouts/metadata) never duplicated, so locales can't
structurally diverge (matches "templates render whatever locale is active").

- **Reads:** pure helper `resolveLocaleElements(base, overlay, locale)` — overlay value wins,
  absent key falls back to base (default-locale copy). No materialization into the working copy
  → no "frozen fallback" bug (later EN edits still flow through to unauthored NL fields).
- **Parity-ordering invariant:** editor reads resolve the overlay FIRST, then run
  `extractLayoutContent` — identical order to the published export path, and both sides go
  through the single `resolveLocaleElements` helper. Never reimplement the merge per call site.
- **Writes (text):** text writers branch on ambient store field `activeLocale` (Lumen `editLang`
  pattern, lifted to store level): `activeLocale === defaultLocale` → write `state.content` as
  today; else → write `state.localeContent[activeLocale][sectionId][key]`. Zero caller changes.
- **Writes (structure/media) — deliberately locale-SHARED:** section add/remove/reorder, layout
  changes, props via `setSection`, and image `src` values all target base regardless of
  `activeLocale`. This is intended (structure and media are shared across locales); Phase 3a
  documents and tests it explicitly.
- **saveDraft merge semantics (corrected from rev 1):** `localeContent` is **NOT** a top-level
  wholesale replace like `baseline` (route ~line 179). It lives INSIDE `finalContent` and rides
  the shallow `...finalContent` spread (~lines 161–166): key absent in payload ⇒ existing map
  preserved; key present ⇒ whole map replaced. Safety therefore rests on a **store-side
  invariant: every save exports the COMPLETE `localeContent` map** (all locales, all pages'
  overlays where applicable), including across the multi-page working-copy park boundary.
  Enforced by assertion + tests in Phases 2 and 3a. `localeConfig` (D4) is top-level →
  wholesale-replaced like `baseline`.
- **Multi-page composition:** locale sits **below** the page axis — each page blob
  (`finalContent` for root, `ProjectPage.content` for subpages) carries its own `localeContent`
  key, so overlays travel through every existing page save/load/publish path untouched.
  `activeLocale`/`localeConfig` are project-global (one toggle; page switch keeps locale).

### D2 — Published strategy: **per-locale pre-rendered blobs** (default at `/`, others at `/{locale}`)

Diverges from Scout B's client-swap lean, deliberately. Client-swap's lumen-style twin-attrs
require every block to emit `data-{locale}` attributes — that **violates the spec's
"no template involvement" constraint** (published blocks own their markup; the renderer can't
inject attributes into block-internal elements). The template-agnostic client-swap alternative
(embed N full bodies, swap innerHTML) breaks `form.v1.js`/analytics bindings on toggle (shipped
assets are immutable — can't teach them to rebind) and ~doubles payload per locale. Per-locale
pre-render instead **reuses the multi-page machinery verbatim**: `renderPublishedExport` already
emits N docs, `extraRoutes` + `atomicPublish` + middleware are already fully path-keyed (Scout B:
"adding route:{host}:/nl keys is FREE"). Comparable blast radius, no parity traps, and real
per-locale URLs make hreflang (now in-scope, see D3) trivial.

- Default locale publishes at `/` **byte-identical to today** (no switcher script, no hreflang
  block, no extra routes when single-locale) — back-compat law holds at the publish layer.
- Non-default locales at `/{locale}` (+ `/{locale}/{subpage}` for multi-page), added to
  `extraRoutes`; KV/middleware/blob-proxy/versioning untouched.
- Switcher = new shared `switcher.v1.js` (new filename per asset-versioning contract): renders
  its own minimal floating pill UI (templates stay untouched), boot = localStorage →
  `geo-country` cookie (middleware already stamps it) → `navigator.language` → redirect to the
  matching locale path; toggle = `location.href` navigate + persist. Injected only when
  `locales.length > 1`. The first-visit geo redirect is crawler-safe because every locale doc
  carries reciprocal hreflang + self-canonical (D3) — no duplicate-URL competition.
- Each locale doc gets correct `<html lang>` (fixes today's hardcoded `"en"`).

### D3 — SEO surface: **hreflang + canonical SHIP in v1** (plan-review decision; per-locale meta deferred)

Rev-1 deferred hreflang; review flagged that geo auto-redirect WITHOUT hreflang makes `/` and
`/{locale}` compete as duplicate-language URLs (Google guidance) — SEO-harmful, not neutral.
Decision made here (not deferred): **Phase 5's export loop emits, on every locale doc of a
multi-locale project:** (a) self-referencing canonical, (b) reciprocal `<link rel="alternate"
hreflang="{locale}">` tags for ALL locales, (c) `hreflang="x-default"` pointing at the default
locale's URL. The loop already iterates locales, so cost is trivial. This keeps the geo-default
UX (spec decision 4) without the SEO harm. **Still deferred to a later phase:** per-locale
title/description/OG overrides. Single-locale projects emit none of this (byte-identical).

### D4 — Locale config home: **JSON, no schema migration**

`localeConfig: { locales: string[], defaultLocale: string }` at `ProjectContent` top level
(sibling of `finalContent`/`baseline`, wholesale-replaced). Absent ⇒ legacy single-locale.
Avoids a Prisma migration entirely; publish + editor read project content anyway. Serve-gate
queryability comes from the **Brief** (D5), not a Project column.

### D5 — `bilingual` queryable: **both** Brief derivation AND structural honesty test

Brief gains optional `locales?: string[]`; `requiredCapabilitiesFromBrief` derives `bilingual`
when >1 (closes scalePlan §7.2 gap). Since the layer is platform-level (template-agnostic),
`fit()` treats `bilingual` as platform-satisfied for all non-retired templates (shared-capability
pattern), replacing Lumen's trust-on-declaration. Honesty = structural test asserting the
machinery actually exists (resolver, asset map entry, htmlGenerator injection, per-locale
routes) — conformance's `STRUCTURAL_CAPABILITIES` exemption comment gets pointed at it.

**Known limitation (stated, not solved):** platform-satisfied ≠ proven per-template NL render
fidelity. Fixed-width text assumptions, hardcoded English strings inside blocks, and long-word
overflow are per-template risks the structural test cannot catch. That remains a **manual gate**
per template (first exercised in the atelier build); the honesty test proves the machinery, not
the typography.

---

## Phase 1 — Content-model types + locale resolver (foundation)

Pure types + helpers, zero behavior change. **Plain module — NOT `'use client'`** (published
renderer + htmlGenerator will import it; published/client boundary law).

Steps:
1. Add `LocaleConfig` type + `LocaleContentOverlay` type; extend `LandingPageContent` /
   `ProjectContent` typings with optional `localeContent` / `localeConfig`.
2. New `src/lib/i18n/localeContent.ts`: `resolveLocaleElements(base, overlay, locale)` (returns
   merged Record<sectionId, SectionData> without mutating base; handles string[] values +
   nested V2 collection values), `getEffectiveElementValue()`, `isMultiLocale(config)`,
   `SUPPORTED_LOCALES` list (en + the 11 coverage-100 langs).
3. Unit tests: fallback semantics, overlay wins, undefined/legacy inputs pass through untouched,
   base never mutated.

**Files touched:**
- `src/types/core/content.ts`
- `src/lib/i18n/localeContent.ts` (new)
- `src/lib/i18n/localeContent.test.ts` (new)

**Verification:** `tsc --noEmit` clean; `npm run test:run` green (new unit tests); no runtime
code imports the module yet → zero behavior change.

## Phase 2 — Persistence: saveDraft/loadDraft locale-aware

Steps:
1. `DraftSaveSchema`: accept optional `localeContent` (inside finalContent payload) +
   `localeConfig` (top level).
2. saveDraft merge rules per D1 (corrected): `localeConfig` wholesale-replace (mirror `baseline`
   handling at ~line 179); `localeContent` rides the shallow `...finalContent` spread
   (~lines 161–166 — absent key preserved, present map replaced). Comment BOTH mechanisms at the
   merge site, plus the store-side "always export the full map" invariant this depends on.
3. loadDraft: pass both through (verify no key-stripping/sanitization drops them).
4. Tests:
   (a) legacy payload without locale fields round-trips byte-identical — back-compat regression;
   (b) **automated zero-locale-keys law:** a legacy project's saved JSON, after a full
       save→load→save cycle, contains NO `localeContent`/`localeConfig` keys anywhere
       (deep-key assertion, not manual spot-check);
   (c) save with only-EN edits does NOT strip existing NL overlay (payload includes full map);
   (d) save with payload MISSING the `localeContent` key preserves the stored overlay
       (spread semantics proven, not asserted);
   (e) localeConfig replace semantics;
   (f) **multi-page + multi-locale round-trip:** project with root + 1 subpage, overlays on
       both; simulate the working-copy/park boundary (subpage active in working copy, root's
       overlay parked in pages map) → flush → save payload → assert NO save can emit a
       partial/empty map that wipes a locale on either page. (Store-side flush half lands in
       3a; this phase builds the route-side fixture/assertions so 3a plugs into it.)

**Files touched:**
- `src/app/api/saveDraft/route.ts`
- `src/app/api/loadDraft/route.ts` (read-path pass-through check; edit only if it strips keys)
- saveDraft/loadDraft test files (extend existing or new `src/app/api/saveDraft/i18n.test.ts`)

**Verification:** `tsc`; `npm run test:run` green incl. legacy round-trip + zero-locale-keys +
spread-semantics tests.

## Phase 3a — Editor store state layer: activeLocale, write paths, history, persistence

State layer only — no render-side/read threading (that's 3b). Split per plan review: 3a is
independently reviewable via unit tests (no visible behavior change since nothing reads
`activeLocale` yet).

Steps:
1. Store fields: `localeConfig`, `activeLocale` (init = defaultLocale), `localeContent`
   (working copy for current page); `setActiveLocale(locale)` action.
2. **Text-write inventory (explicit deliverable, listed in the audit):** enumerate ALL paths
   that write element text into `state.content`, and branch each on `activeLocale` per D1.
   Known set (implementer confirms completeness by grepping writers in
   `src/hooks/editStore/` — **grep scope MUST include `coreActions.ts`**):
   - **Shadowed duplicate write funnels — branch the LIVE copy only.** `updateElementContent`
     is defined TWICE (`coreActions.ts:149` AND `contentActions.ts:60`); `updateFromAIResponse`
     is defined twice (`contentActions.ts:560` AND `generationActions.ts:123`). The
     `editStore.ts` composition spread order (core ~399 → content ~400 → generation ~403) means
     the WINNERS are `contentActions.ts:60` and `generationActions.ts:123`. **Branch the
     composition-WINNING override only (verify via the editStore.ts spread order: content
     overrides core, generation overrides content). Do NOT branch the dead/shadowed
     `coreActions.ts:149` `updateElementContent` copy — neutralize confusion by leaving it or
     adding a `// shadowed by contentActions — not the live impl` comment.**
   - `updateElementContent` (contentActions.ts:60 — the live copy): plain set + nested V2
     collection path (~line 162) → locale-branched. Image-src guard (~lines 82–90) → stays base
     (locale-shared media, documented).
   - `bulkUpdateSection` (contentActions.ts) → locale-branched (it writes element text).
   - Bulk-apply paths in `aiActions.ts` / `generationActions.ts` → these are generation/regen
     writes; combined with the regen guard (step 5) they must be either (i) unreachable when
     `activeLocale !== defaultLocale`, or (ii) explicitly forced to write base. Implementer
     picks per path and documents; net effect: no AI write can land in an overlay in v1.
     Note: `regenerationActions.ts` (`regenerateContentOnly`/`regenerateDesignAndCopy`) writes
     via the `updateFromAIResponse` funnel, so it's covered by the generationActions guard
     (step 5) + Phase 4's regen-disable UX — no separate branching needed; state the dependency
     in the audit.
   - `collectionHelpers.ts` (`src/hooks/editStore/collectionHelpers.ts`) writes/reads
     `.elements[` directly — route its text mutations through the same branch.
3. **Locale-shared writes PROVEN, then documented + tested:** `setSection`
   (`coreActions.ts:140`) does `Object.assign(state.content[sectionId], updates)` where
   `updates: Partial<SectionData>` CAN include `elements` — so "structural-only" must be
   proven, not asserted. **Grep `setSection` callers; confirm no text-edit passes an `elements`
   payload; document the proof (caller list + payload shapes) in the audit; only then treat it
   as locale-shared structure.** If any caller DOES pass element text through `setSection`, that
   path must be branched on `activeLocale` like the step-2 writers. Once proven: add a comment
   at each locale-shared site (setSection, image-src writes) naming the invariant, and a unit
   test asserting a structural write under `activeLocale='nl'` mutates base only, overlay
   untouched.
4. **Locale-aware undo/redo:** `pushContentHistoryEntry` (`historyHelpers.ts`, driven by
   `useUndoRedo.ts`) is keyed sectionId+storageKey only — locale-blind. An NL edit's undo would
   restore into base `content[sectionId].elements[key]`, corrupting EN. Fix: record `locale`
   in each history entry; undo/redo restore against that entry's target (base vs
   `localeContent[locale]`). Test: edit EN → switch NL → edit → undo restores NL overlay value
   and leaves EN base untouched; redo re-applies to overlay.
5. Regen guard: element/section regeneration actions no-op + console.warn when
   `activeLocale !== defaultLocale` (UI disable in phase 4). This is the guard step 2 leans on
   for `aiActions.ts`/`generationActions.ts` (and, via the `updateFromAIResponse` funnel,
   `regenerationActions.ts`).
6. Multi-page: page-switch flush (working copy ↔ pages map in `editStore.ts`) carries
   `localeContent` with each page blob; `activeLocale` survives page switch.
7. Persistence: `persistenceActions.ts` export includes `localeConfig` + the **COMPLETE**
   `localeContent` map — full-map invariant per D1, enforced with a dev-mode assertion (declared
   locales with authored overlays must all be present in the export) + unit test wired into
   Phase 2's multi-page round-trip fixture. `hydrateStoreFromPayload` restores them (absent ⇒
   single-locale defaults); localStorage persist partialize includes them.

**Files touched:**
- `src/stores/editStore.ts`
- `src/types/store/state.ts` + `src/types/store/actions.ts` (store types actually live here; plan's `storeTypes.ts` does not exist)
- `src/hooks/editStore/uiActions.ts` (holds the undo/redo content-restore — added to scope during 3a to complete locale-aware undo/redo)
- `src/hooks/editStore/coreActions.ts` (shadowed-copy comment on `updateElementContent`;
  setSection caller-proof scope; NO locale branching here unless step 3's grep finds a text-edit
  caller)
- `src/hooks/editStore/contentActions.ts`
- `src/hooks/editStore/aiActions.ts`
- `src/hooks/editStore/generationActions.ts`
- `src/hooks/editStore/collectionHelpers.ts` (write-side mutations; read-side in 3b)
- `src/hooks/editStore/historyHelpers.ts`
- `src/app/edit/[token]/components/ui/useUndoRedo.ts`
- `src/hooks/editStore/persistenceActions.ts`
- store unit test file (new or extended): write-branch matrix, locale-shared structural write,
  undo/redo locale test, full-map export assertion, page-flush carry

**Verification:** `tsc`; `npm run test:run`; manual dev run: legacy single-locale project —
edit, undo/redo, autosave, reload → **zero behavior diff** (regression). Multi-locale write
paths exercised via unit tests (no reader exists yet). Audit contains the write inventory incl.
the shadowed-copy verdicts and the setSection caller proof.

## Phase 3b — Editor read-site threading (enumerated, grep-verified)

Route every locale-relevant text READER through the resolver. Riskiest surface of the feature —
any reader that keeps hitting `state.content` directly silently shows default-locale copy in NL
mode.

Steps:
1. **Read-site enumeration (explicit deliverable, BEFORE any edit):** grep
   `state.content` / `s.content` / `.elements[` across editor + shared-block code
   (`src/app/edit/`, `src/hooks/`, `src/modules/generatedLanding/`, `src/components/`,
   `src/modules/templates/shared/`); produce
   the enumerated list in the audit with a per-site verdict: *locale-relevant text reader →
   thread* / *structural or media reader → leave, with reason*. Review checks the list against
   the grep, not vibes. Known-from-review starting set (all must appear in the list):
   - `src/hooks/useUniversalElements.ts`
   - `src/modules/templates/shared/useTemplateBlock.ts` — the ONE shared block-resolution
     funnel: all per-template block hooks (useMeridianBlock/useVestriaBlock/etc.) delegate to
     it, so threading it covers all templates.
   - `src/modules/generatedLanding/sharedBlocks/LeadForm/*.tsx`
   - `src/modules/generatedLanding/sharedBlocks/FollowStrip/*.tsx`
   - `src/modules/generatedLanding/sharedBlocks/StoreBadges/*.tsx`
   - `src/components/navigation/NavigationEditor.tsx`
   - `src/components/ui/HeaderLogo.tsx`
   - `src/components/forms/FormPlacementRenderer.tsx`
   - `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx`
   - `src/hooks/editStore/collectionHelpers.ts` (read side)
2. Thread each locale-relevant reader through `resolveLocaleElements` /
   `getEffectiveElementValue` selectors keyed on `activeLocale`. Respect the parity-ordering
   invariant (D1): resolve overlay FIRST, then `extractLayoutContent` — same order the published
   export will use.
3. **Perf guard (perf-01/02 protection):** `useTemplateBlock`'s memo is keyed on the
   `sectionContent` ref — the perf win against whole-store subscriptions. Add a NARROW
   `localeContent?.[activeLocale]?.[sectionId]` selector (+ `activeLocale`) to its deps; do NOT
   subscribe to the whole `localeContent` map or whole store. Call this out in the audit;
   reviewer checks subscription width.
4. **Minimal dev-only locale switch (throwaway ok):** tiny dev-flag-gated control (e.g. behind
   `NEXT_PUBLIC_DEBUG_EDITOR` or a temporary keybinding) that calls `setActiveLocale`, so 3b's
   parity/back-compat can be MANUALLY exercised now instead of waiting for Phase 4's real
   toggle. Removed or absorbed by Phase 4.
5. Back-compat check: with no `localeConfig` (legacy project), every threaded reader resolves to
   base with zero extra renders.

**Files touched:**
- `src/hooks/useUniversalElements.ts`
- `src/modules/templates/shared/useTemplateBlock.ts`
- `src/modules/generatedLanding/sharedBlocks/LeadForm/*.tsx`
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/*.tsx`
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/*.tsx`
- `src/components/navigation/NavigationEditor.tsx`
- `src/components/ui/HeaderLogo.tsx`
- `src/components/forms/FormPlacementRenderer.tsx`
- `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx`
- `src/hooks/editStore/collectionHelpers.ts` (read side)
- dev-only locale switch (one small new file or a guarded block in an existing editor debug
  surface — named in audit)
- (+ any additional readers surfaced by step 1's grep — added to this list in the audit before
  editing; a reader edited but not listed = defect)

**Verification:** `tsc`; `npm run test:run`; manual on `npm run dev` via the dev switch:
2-locale project — flip locale, ALL text surfaces (blocks, nav, header logo, forms, shared
blocks, inline editor) show overlay copy with base fallback; flip back → EN intact. Legacy
project: zero visual/behavior diff. Audit contains the full enumerated read-site list.

## Phase 4 — Editor language toggle + locale config UI

Steps:
1. `LanguageToggle` in the editor header/toolbar: visible only when `isMultiLocale`; pills per
   locale; sets `activeLocale`; all Editables re-render via store subscription (spec decision 3:
   one toggle, no side-by-side). Replaces/absorbs 3b's dev-only switch.
2. Minimal locale-config UI ("Languages" popover in editor settings/header): add/remove locale
   from `SUPPORTED_LOCALES`, pick default; writes `localeConfig`; removing a locale warns +
   drops its overlay. (This is how a project "declares" its 2nd locale — acceptance needs it.)
3. Disable regen buttons/menu items when `activeLocale !== defaultLocale` (tooltip: switch to
   default language) — pairs with 3a's guard.
4. Unauthored-field affordance: when editing non-default locale, fields showing base fallback
   get a subtle visual marker (e.g. reduced-opacity badge) so the author can see what's not yet
   translated. Keep tiny; skip if it balloons — mark TODO.

**Files touched:**
- new `src/app/edit/[token]/components/editor/LanguageToggle.tsx` (+ `LocaleSettings.tsx`)
- editor header/toolbar component that hosts it (implementer locates the header file under
  `src/app/edit/[token]/components/`; that one file + the two new ones only)
- regen button/menu component(s) for the disable state (locate via existing regen UI; keep to
  the minimal set, list them in the audit)
- removal of 3b's dev-only switch file/block (if separate)

**Verification:** manual on `npm run dev`: 2-locale project — toggle EN↔NL, edit both, autosave,
reload, both survive (acceptance #1); single-locale project shows **no toggle, no UI diff**
(regression); `tsc` clean.

## Phase 5 — Static export: per-locale docs + hreflang + `switcher.v1.js`

Steps:
1. `StaticHTMLOptions`: add `locale`, `localeConfig` (optional → absent = today's behavior).
2. `htmlGenerator.ts`: `<html lang="{locale}">` (replace hardcoded `en`); when multi-locale,
   per D3 emit on EVERY locale doc: self-referencing canonical, reciprocal
   `<link rel="alternate" hreflang="{locale}" href=...>` for all locales, and
   `hreflang="x-default"` → default-locale URL; inject
   `<script src=".../assets/switcher.v1.js" defer>` + a tiny inline
   `window.__lessgoLocales = {locales, defaultLocale, current}` config. Single-locale: none of
   the above (byte-identical output).
3. `renderPublishedExport.ts`: outer loop over `localeConfig.locales` × existing pages loop;
   non-default locales render with `resolveLocaleElements(...)` applied to each page's content
   BEFORE the existing extract/render step (parity-ordering invariant, D1 — same helper, same
   order as the editor); default locale path unchanged (`/`), others `/{locale}` +
   `/{locale}/{subpath}`; returns locale docs in `extraRoutes`. Absolute URLs for
   hreflang/canonical built from the same base-URL source the generator already uses.
4. New `src/lib/staticExport/switcherBehaviors.js`: IIFE modeled on `lumenBehaviors.js` —
   renders its own floating switcher pill (per D2, templates untouched); boot order
   `localStorage['lessgo.lang']` → `geo-country` cookie → `navigator.language` → if resolved
   locale ≠ current doc's locale, `location.replace` to the sibling locale path (path-prefix
   swap, preserves subpage path); toggle click = persist + navigate. Guard against redirect
   loops (only redirect when target path exists in the embedded locale list). Crawler-safe per
   D3 (hreflang tags ship in the same docs).
5. `scripts/buildAssets.js`: add `{src:'switcherBehaviors.js', out:'switcher.v1.js'}` (new
   filename — versioning contract).
6. Unit tests: 2-locale fixture through `generateStaticHTML` — lang attr, canonical, full
   reciprocal hreflang set + x-default, script injection present, hreflang URLs mutually
   consistent across the locale docs; single-locale fixture output **identical to pre-change
   snapshot** (regression).

**Files touched:**
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/renderPublishedExport.ts`
- `src/lib/staticExport/switcherBehaviors.js` (new)
- `scripts/buildAssets.js`
- static-export test file (new or extended)

**Verification:** `npm run build` (buildAssets emits `public/assets/switcher.v1.js`; published
CSS unaffected); `npm run test:run` incl. single-locale snapshot regression + hreflang
reciprocity test; `tsc`.

## Phase 6 — Publish route + KV locale paths ⚠ **HUMAN GATE**

Publish pipeline + routing change — founder eyeballs a real publish before phase closes.
**Precondition: unresolved Q1 (URL scheme `/nl` prefix) decided by founder BEFORE this gate —
the scheme locks permanently once a customer publishes.**

Steps:
1. `POST /api/publish`: read `localeConfig` from project content, pass to
   `renderPublishedExport`; locale docs land in `extraRoutes` → `atomicPublishWithRetry` writes
   `route:{domain}:/{locale}` keys exactly like subpage paths (Scout B: no middleware/blob-proxy
   changes needed — verify, don't edit).
2. Confirm `cleanupOldVersions` handles the larger per-version blob set (it's version-scoped —
   verify only).
3. Reserved-path check: ensure locale prefixes can't collide with multi-page subpage slugs
   (reject a subpage slug that equals a declared locale code; smallest viable guard).

**Files touched:**
- `src/app/api/publish/route.ts`
- slug/subpage validation site for the collision guard (locate; likely publish route or
  checkSlug/page-slug validation — one file, named in audit)

**Verification:** `tsc`; `npm run test:run`; **manual (dev env): publish a 2-locale project →
`/p/{slug}` + `/p/{slug}/nl` both serve, switcher visible, geo/localStorage default + toggle
persistence work, view-source shows reciprocal hreflang + canonical on both docs
(acceptance #2); publish an existing single-locale project → routes/HTML unchanged vs before
branch (regression, acceptance #3).** Founder sign-off on both publishes.

## Phase 7 — `bilingual` queryable + honesty test

Steps:
1. `src/types/brief.ts`: optional `locales?: string[]` on Brief.
2. `src/modules/brief/fit.ts`: derivation clause — `brief.locales.length > 1` ⇒ require
   `bilingual`; satisfaction — treat `bilingual` as platform-provided for all non-retired
   templates (alongside sharedBlockCapabilities check); remove/update the "no language field on
   Brief yet" comments (fit.ts:65, :114).
3. `templateMeta.ts`: comment update — bilingual now platform-satisfied; Lumen's declaration
   stays (retired/bespoke, harmless).
4. Honesty test (new `src/lib/i18n/i18nHonesty.test.ts` or extend `conformance.test.ts`):
   asserts (a) `bilingual` ∈ capabilityIds, (b) derivation fires for a 2-locale Brief and
   `fit()` passes for every active template, (c) structural machinery exists —
   `resolveLocaleElements` exported, `switcherBehaviors.js` present in buildAssets map, a
   2-locale fixture's generated HTML contains the switcher script + `lang` attr + hreflang.
   Update the `STRUCTURAL_CAPABILITIES` exemption comment in `conformance.test.ts` to point
   here. **Add the D5 limitation as a test-file comment:** this proves machinery, NOT
   per-template NL render fidelity (fixed-width text, hardcoded English in blocks) — that stays
   a manual per-template gate (first: atelier build).
5. `serveGate.ts`: verify decideServe needs no change (fit handles it) — edit only if a
   bilingual-specific clause is required.

**Files touched:**
- `src/types/brief.ts`
- `src/modules/brief/fit.ts`
- `src/modules/brief/serveGate.ts` (verify; edit only if needed)
- `src/modules/templates/templateMeta.ts`
- `src/modules/templates/conformance.test.ts`
- `src/lib/i18n/i18nHonesty.test.ts` (new)

**Verification:** `npm run test:run` — conformance + honesty green; `tsc`. Acceptance #4 closed.

## Phase 8 — Generic en/nl pilot + docs ⚠ **HUMAN GATE (final)**

Proves the mechanism generically with en/nl; the full atelier/Kundius end-to-end gate (incl.
per-template NL render-fidelity check per D5's limitation) lands in the atelier template build
per spec — this phase is its precondition.

Steps:
1. Dev project on an existing service template (hearth or lex): declare `[en, nl]`, author NL
   for hero + 2–3 sections via the toggle.
2. Run full acceptance sweep: editor toggle round-trip incl. autosave/reload + undo/redo across
   a locale switch; publish; live switcher + geo default + persistence; both locales fully
   rendered; hreflang present; multi-page spot-check if the project has subpages.
3. Regression sweep: one untouched legacy single-locale project — edit/save/publish → zero
   visual/storage diff (the automated zero-locale-keys test from Phase 2 is the law; this is
   the belt-and-suspenders manual pass).
4. Editor↔published parity check per locale (`/manual-test` style: same copy, same layout —
   both sides ran resolve-then-extract via the same helper, D1 invariant).
5. Docs: update `docs/tracks/i18nPlan.md` (Phase 1 built, gates status), note supersession of
   Lumen twin-fields (mechanism retired-in-place, not migrated).

**Files touched:**
- `docs/tracks/i18nPlan.md`
- (no src changes; any bug found → fix loops back through the owning phase's files + review)

**Verification:** manual acceptance checklist above, all 5 spec acceptance boxes ticked
(box 5 partially — atelier E2E deferred to atelier build); `npm run build` + `npm run test:run`
green on the branch before merge. **Founder sign-off = gate.**

---

## Unresolved questions

1. **MUST DECIDE BEFORE PHASE 6 GATE:** locale URL scheme `/nl` prefix locks permanently once a
   customer publishes — confirm prefix, or want `?lang=`/subdomain weighed first?
2. Switcher pill = script-rendered floating UI (template-agnostic, generic look) — acceptable
   for v1, or must templates restyle/host it (bigger)?
3. Regen disabled on non-default locale (v1) — fine, or need regen-into-locale now?
4. Supported locale list = en + 11 coverage-100 langs — enough, or free-text locale codes?
5. First-visit geo redirect = brief default-locale flash before `location.replace` — acceptable?
   (Crawler side now safe via hreflang; this is UX-only.)
