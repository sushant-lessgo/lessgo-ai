**Branch:** feature/onboarding2 — based off feature/onboarding1 (NOT main; onboarding2 depends on onboarding1's manufacturer/vestria flow). Merge ordering: onboarding1 → main first, THEN onboarding2.

# onboarding2 — plan

Spec: `docs/task/onboarding2.spec.md`

## Overview

Give the vestria/manufacturer pilot two independent, later-editable look axes chosen while copy streams: **Axis B** — a second hero variant (full-bleed autoplay video, separate desktop+mobile clips, self-serve upload) alongside the current two-column image hero; **Axis A** — a cosmetic look (typeface variant + accent palette + neutral mood). Axis B ships first (urgent customer need), then a human decision gate on the real pilot site, then Axis A. All choices persist without schema migration (Project `variantId`/`paletteId`, `content[heroId].layout` + `sectionLayouts`, `themeValues` for mood). Other templates and the service path stay byte-unchanged; the firewall (templateId never in prompt builders) is untouched — both axes are pure render/skin concerns.

**Key design decision (from scout):** `componentRegistry.ts` dispatches template-module blocks by section TYPE only; the stored layout string reaches the block as its `layout` prop. So the hero variant is implemented as an **internal branch inside the vestria hero block** (Option a): both the generation-time picker and the toolbar swap set the layout string (`'VestriaTailoredHero'` | `'VestriaFullBleedHero'`), and the hero wrappers branch between two `.core.tsx` files. No registry/dispatch changes.

**Authoritative variant field (review correction):** the field that actually drives rendering is **`content[heroId].layout`** — that's what the published renderer reads (`LandingPagePublishedRenderer.tsx:80`) and what `useVestriaBlock` → `getSchemaDefaults` read. The top-level `finalContent.layout.sectionLayouts` map is vestigial for template modules (published renderer rebuilds it). `updateSectionLayout` (`layoutActions.ts:288`) writes BOTH; any code path that sets the variant directly (Phase 3 picker) MUST write `content[heroId].layout`, not only `sectionLayouts`.

**Schema is NOT optional (review correction):** the vestria edit path is `resolveVestriaBlock('hero','edit')` → wrapper → `useVestriaBlock` → `getSchemaDefaults(layout)` → `extractLayoutContent` (`src/types/storeTypes.ts:357`, iterates schema keys ONLY). Template-module pages do NOT bypass this. Without a `VestriaFullBleedHero` entry in `src/modules/audience/product/elementSchema.ts`, `getSchemaDefaults` returns null → hero renders EMPTY in the editor and the 3 media keys are dropped from blockContent (uploaded video never renders). The schema entry is a Phase 1 requirement.

**Naming landmine (from scout):** the designer mock's neutral-mood attr is `data-surface` (bone/slate), which **collides** with vestria's existing per-section `data-surface` bands (paper/dark from `sectionRules.ts`). Axis A must use a different attribute — plan uses **`data-mood`** on the root element.

---

## PART 1 — Axis B: video hero + upload (ship first)

### Phase 1 — Full-bleed video hero block pair + element schema

Add the second hero rendering, dual-renderer safe, with placeholder/poster fallback. No pickers yet — verifiable by manually setting the hero layout.

**Files touched**
- `src/modules/templates/vestria/blocks/Hero/VestriaFullBleedHero.core.tsx` (new — single-source core, mirrors `VestriaTailoredHero.core.tsx` pattern; server-safe: NO hooks/editPrimitives — the core-purity test enforces this)
- `src/modules/templates/vestria/blocks/Hero/styles.ts` (add full-bleed hero CSS: `min-height:min(92vh,880px)`, `.hero-veil` gradient, centered stack, bottom 3-stat row, desktop/mobile `<video>` `@media display` toggle — port from `template-design/Vestria - Uniform Manufacturing v2 (full-bleed hero).html`)
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx` (edit wrapper: branch on `layout` prop → tailored core vs full-bleed core)
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.published.tsx` (identical branch — parity)
- `src/modules/audience/product/elementSchema.ts` (**REQUIRED** — add `VestriaFullBleedHero` entry near the existing vestria hero schema ~line 646: same copy keys as the tailored hero PLUS media keys `hero_video_desktop`/`hero_video_mobile`/`hero_video_poster` with `fillMode:'manual_preferred'` or `'system'` so they stay OUT of AI generation — firewall intact, no prompt-builder change. The full-bleed hero's 3-stat contract (Q7) is decided in this entry.)
- `src/modules/templates/vestria/coreParity.test.ts` (scans `blocks/**/*.core.tsx`, asserts count === 12 → bump to 13; add `renderToStaticMarkup` fixture for `VestriaFullBleedHeroCore`; new core must pass the FORBIDDEN core-purity scan)
- `src/modules/templates/vestria/registration.test.ts` (add `getSchemaDefaults('VestriaFullBleedHero') !== null` assertion — safety net against silent missing-schema failures)
- `public/assets/vestria-hero-placeholder.mp4` (new — small bundled placeholder clip; see open questions — Q2 is a real content dependency; fallback below)

**Steps**
1. Build `VestriaFullBleedHero.core.tsx` from the v2 mock: dark full-bleed section, stretched background media slot, `.hero-veil` overlay, tag (accent) / h1 (white, italic accent em) / lede / primary+ghost CTAs / bottom 3-stat row. Core imports NO hooks/editPrimitives (coreParity FORBIDDEN scan).
2. **Reuse the existing hero content contract** — same element keys as the tailored hero (`tag_text`, `headline`, `lede`, `cta_text/cta_href`, `secondary_cta_text/href`, `stamp_value/stamp_label`, `values[]` for stats) so swapping variants never regenerates or loses copy. Add three **media keys** (`hero_video_desktop`, `hero_video_mobile`, `hero_video_poster`) read by the block, never AI-generated.
3. Add the `VestriaFullBleedHero` schema entry to `elementSchema.ts` per Files-touched note. This is what makes `getSchemaDefaults`/`extractLayoutContent` keep the media keys in blockContent and the editor render non-empty.
4. Responsive clips: TWO `<video autoplay loop muted playsInline poster>` elements + CSS `@media` display toggle (precedent for the @media display-toggle CSS pattern: `TechPremiumHero.published.tsx` — note it is NOT a `<video>` precedent; there is no `<video>` in the repo today); do NOT use `<source media>`. **Static-markup gotcha:** React can drop `muted` in server markup, and without it mobile autoplay fails — verification must assert the published HTML carries `muted autoplay playsinline` (workaround if needed, e.g. `muted=""` via props spread or `dangerouslySetInnerHTML`-free attribute check first).
5. Fallback chain per slot: uploaded clip → placeholder clip (`/assets/vestria-hero-placeholder.mp4`); poster: `hero_video_poster` → `hero_image` → none. Mobile clip absent → fall back to desktop clip. **Poster gap:** `validateAndResolveAssetURLs` (`src/lib/staticExport/assetResolver.ts`) rewrites `src="…"` and `background-image:url(…)` but NOT `<video poster="…">` — a relative `/assets/...` poster breaks on custom domains. Prefer an absolute/Blob poster URL (absolute Blob URLs pass through untouched); if a bundled placeholder poster is used, either make it absolute or extend nothing — just default poster to the uploaded (Blob-absolute) `hero_image`. Video `src`/`<source src>` ARE resolved, so the relative placeholder *clip* is fine.
6. Wire both wrappers to branch on `layout === 'VestriaFullBleedHero'` (default/unknown → tailored). Registry untouched.
7. Update `coreParity.test.ts` (count 13 + full-bleed fixture) and `registration.test.ts` (schema-defaults assertion).
8. **Q2 fallback so acceptance isn't blocked on content:** if no placeholder clip is supplied in time, ship a tiny generated black loop (~1–2s, <100KB) or poster-only rendering (video elements omitted when no clip resolves) — decide with user, but implementation must not stall.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` (coreParity now expects 13 cores; registration asserts full-bleed schema), `npm run build` green.
- Manual (dev): set the hero to `VestriaFullBleedHero` (via `updateSectionLayout` in console or a temp draft edit — remember `content[heroId].layout` is the authoritative field) on a vestria draft; hero renders full-bleed with placeholder in editor AND preview/publish path; editor is NOT empty (schema entry proven); edit↔published layout-identical; unknown layout string falls back to tailored.
- Published HTML inspection: `<video>` tags carry `muted autoplay playsinline poster`; placeholder clip src resolved to absolute on custom-domain-style output; poster URL absolute.
- Grep confirm: zero diffs outside `vestria/` blocks+tests, `elementSchema.ts`, placeholder asset.

---

### Phase 2 — Video upload: Blob CLIENT upload route + editor upload UI  ⚠️ **HUMAN GATE**

**Gate reason:** new upload route = larger files / storage cost / abuse surface, AND this is the repo's **first `@vercel/blob/client` client-upload pattern** (no precedent — every existing upload is a server-side `put()`). User signs off on route existence + size cap + the new pattern before merge of this phase.

**Transport (review correction):** a server handler reading `request.formData()` (the upload-image clone approach) dies at Vercel Serverless Functions' ~4.5MB request-body limit regardless of any in-code size cap — a real hero video (tens of MB; spec forbids transcode/compress) would 413 in prod. The 10MB image route only works because images are small. Therefore: **client upload** — the browser uploads directly to Blob; the route only mints tokens and receives the completion callback.

**Files touched**
- `src/app/api/upload-video/route.ts` (new — implements `handleUpload` from `@vercel/blob/client`. `onBeforeGenerateToken`: Clerk auth → user lookup → ownership check via `tokenId` passed in `clientPayload` (`token.project.userId === user.id`, admin override) → return token constrained to `allowedContentTypes: ['video/mp4','video/webm']` + `maximumSizeInBytes` (cap enforced HERE, not by request body size; 50MB default pending Q1) + pathname prefix `uploads/${tokenId}/`. `onUploadCompleted`: optional logging. No sharp, no formData.)
- `src/hooks/editStore/formsImageActions.ts` (add `uploadVideo(file,{sectionId,elementKey})` sibling to `uploadImage`: client MIME/size guards → `upload(file, { access:'public', handleUploadUrl:'/api/upload-video', clientPayload: JSON.stringify({tokenId}) })` from `@vercel/blob/client` — NOT a fetch POST of the file — then `updateElementContent(sectionId,elementKey,url)` → force `get().save()` so multi-page pages serialize)
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx` (edit wrapper only: when full-bleed variant active, edit-mode chrome for 3 slots — desktop clip, mobile clip, poster image; clips via `uploadVideo`, poster via existing `uploadImage`)

**Steps**
1. Build the `handleUpload` route per above; all validation (MIME allow-list, size cap, ownership) lives in `onBeforeGenerateToken` since the file never transits our function.
2. Dev-server note: client upload targets Blob directly; confirm local-dev behavior (`BLOB_READ_WRITE_TOKEN` in `.env.local` — Vercel Blob client upload works from localhost with a valid token; document any `onUploadCompleted` localhost caveat, it won't fire without a public URL — non-fatal, URL comes back to the client anyway).
3. Add `uploadVideo` store action; must route through `save()`/`export()` (bespoke payloads drop the upload on reload — scout finding).
4. Edit-only upload affordances live in the edit wrapper (edit-only chrome is allowed; the published wrapper renders the same layout without chrome — parity is about layout/CSS, kept in the shared core + `styles.ts`).
5. Uploaded URLs land in `content[heroId]` media keys from Phase 1 (schema-backed, so they survive `extractLayoutContent`) → autosaved into `finalContent`. Poster upload gives an absolute Blob URL — closes the poster relative-URL gap from Phase 1.

**Verification**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green.
- Manual (dev): upload a **>5MB** mp4 desktop + mobile + poster on a vestria full-bleed hero (proves the client-upload path, not just small files); reload draft → URLs persist; publish → published HTML serves clips from Blob URLs; oversized file + wrong MIME rejected (token refused) with clear client error; non-owner token rejected.
- Prod-shaped check after deploy of this phase: one real ~20–50MB upload through Vercel to confirm no 413.
- Confirm image route byte-unchanged.

---

### Phase 3 — Generation-time hero-variant picker (non-blocking)

**Files touched**
- `src/hooks/useProductGenerationStore.ts` (add `heroVariant: 'VestriaTailoredHero' | 'VestriaFullBleedHero'` + setter; default tailored)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` (render picker during the `'copy'` stage alongside the STAGES `<ol>` (~lines 648–703); apply choice to the saved payload — see step 3 for the exact fields)
- `src/app/onboarding/product/[token]/components/fields/HeroVariantPicker.tsx` (new — two-card visual chooser, image vs video hero; manufacturer/vestria only)

**Steps**
1. Picker mounts when `stage==='copy'` (the multi-second per-page fan-out window) and `isManufacturerFlow`; never blocks the pipeline — no await on user input.
2. **Race handling:** the hero page may already be saved when the user picks. Apply the current store value on every `saveFC` AND re-apply once at pipeline completion (final `saveFC`) so a late pick still lands. Default (no pick) = tailored.
3. **Write the authoritative field (review correction):** the picker MUST set `content[heroId].layout = heroVariant` in the saved `finalContent` — that is what the renderers and `getSchemaDefaults` read; writing only `sectionLayouts[heroId]` renders as tailored. Also mirror into `sectionLayouts[heroId]` for consistency (matches what `updateSectionLayout` does). `/api/saveDraft` already persists both — no new API fields, no schema change.
4. Full-bleed choice at generation time shows the placeholder clip until the user uploads in the editor (acceptance criterion — depends on Q2 placeholder/fallback from Phase 1).

**Verification**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green.
- Manual (dev): run manufacturer onboarding; pick video hero mid-stream → generated page opens with full-bleed hero + placeholder (confirm `content[heroId].layout === 'VestriaFullBleedHero'` in the saved draft); pick nothing → tailored; picker absent on non-manufacturer product flow and service flow.

---

### Phase 4 — Editor hero swap via scoped LayoutChangeModal  ⚠️ **HUMAN GATE**

**Gate reason:** re-enabling `LayoutChangeModal` for a template module — user confirms surge/hearth/lex/lumen/meridian/techpremium remain disabled before merge of this phase.

**Files touched**
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx` (replace blanket `if (usesTemplateModule(...)) return null` (line ~48) with: template modules still return null EXCEPT `templateId==='vestria' && sectionType==='hero'`, which renders a bespoke 2-variant selector — NOT the legacy `LayoutChangeSelector`)
- `src/app/edit/[token]/components/ui/VestriaHeroVariantSelector.tsx` (new — two cards: Tailored (image) / Full-bleed (video); writes via `updateSectionLayout(sectionId, newLayout)` from `hooks/editStore/layoutActions.ts` + autosave)

**Steps**
1. `SectionToolbar.tsx` `change-layout` action already calls `showLayoutChangeModal(...)` — no toolbar edit; only the modal's gate changes.
2. Selector highlights current variant (read from `content[heroId].layout`, the authoritative field); swap is content-preserving (shared element keys from Phase 1); previously uploaded video URLs survive a round-trip swap (schema entries on both layouts keep the media keys).
3. `updateSectionLayout` (existing, `layoutActions.ts:288`) already writes BOTH `content[sectionId].layout` and `sectionLayouts[sectionId]` and autosaves — reuse, no edit needed.

**Verification**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green.
- Manual (dev): vestria hero toolbar → Change Layout → swap both directions, reload persists, publish reflects; hero copy + uploaded videos survive swap; Change Layout still no-ops on vestria non-hero sections AND on surge/hearth/lex/lumen/meridian/techpremium sections; legacy (non-module) pages unchanged.

---

### DECISION GATE — pilot eyeball  ⚠️ **HUMAN GATE**

Publish the video hero to the real pilot (uniform manufacturer; likely custom domain → **prod pilot publish is itself a human gate** per spec). User eyeballs live desktop + mobile playback (incl. mobile autoplay — the `muted` attribute check from Phase 1), poster, LCP feel. Only after explicit go-ahead does Part 2 (Axis A) start. Feedback here may reshape Phases 5–6.

---

## PART 2 — Axis A: cosmetic look (after gate)

### Phase 5 — Vestria look system: accents, typefaces, mood

Extract the mock's three cosmetic controls into the vestria token/palette module. Pure skin work — no prompt/generation changes.

**Files touched**
- `src/modules/templates/vestria/palettes.ts` (add 7 accents from mock lines 53–59 — brass, emerald, safety, claret, teal, aubergine, indigo — alongside existing cobalt; oklch pairs → `--accent`/`--accent-deep` via existing `serializePaletteOverrides()`; update `pilotEnabledPalettes`)
- `src/modules/templates/vestria/tokens.ts` (typeface variants: expand `vestriaVariantDefs` to `tailored` = editorial look (Bodoni Moda + Hanken Grotesk — **id stays `tailored`, hard rule, see step 1**), `modern` (Space Grotesk + Hanken), `heritage` (Cormorant Garamond + Source Serif 4); implement `serializeVariantOverrides()` (currently returns '') keyed off `[data-variant]`; add **`[data-mood="slate"]`** neutral overrides — `bone` = default `:root` values, NOT a `data-surface` value)
- `src/modules/templates/vestria/paletteSelection.ts` (optional: `inferDefaultPalette()` heuristic beyond hard-coded cobalt; conservative = leave stub, note it)
- `src/modules/templates/vestria/ThemeInjector.tsx` (set `documentElement.dataset.mood` from themeValues; keep palette/variant behavior)
- `src/modules/templates/vestria/components/VestriaSSRTokens.tsx` (published mirror: emit same `data-mood` attr + serialized CSS — parity)
- `src/types/product.ts` (extend `vestriaPalettes`/`vestriaVariants` option lists; keep `defaultVestriaPalette`/`defaultVestriaVariant` — default stays cobalt/tailored unless user says otherwise, see open questions)
- `public/fonts/*` + `src/styles/fonts-self-hosted.css` (**review correction:** Bodoni Moda + Hanken Grotesk are ALREADY self-hosted (~lines 268/282/290) and Source Serif 4 too — only **Space Grotesk + Cormorant Garamond** are genuinely new woff2 downloads + `@font-face` additions)
- `src/modules/templates/CriticalFontPreload.tsx` (**correct path — NOT generatedLanding**; vestria already has a preload entry ~lines 64–71. Make the vestria case in `criticalFontHrefs` **variant-aware** — like meridian/lex/granth — so a typeface variant that swaps the display face preloads the right hero-headline font)

**Steps**
1. **Variant id rule (resolved, Q6 closed):** KEEP id `tailored` as the editorial look. Renaming would churn `defaultVestriaVariant` (tokens.ts:148), the ThemeInjector default, coreParity fixtures, and persisted drafts — not worth it. Add `modern` + `heritage` alongside.
2. Mood persists in `Project.themeValues` JSON (exists — no migration). Variant/palette persist in existing `variantId`/`paletteId` columns. **No schema change**; if one becomes unavoidable it is a HUMAN GATE.
3. Fonts: download Space Grotesk + Cormorant Garamond woff2, add `@font-face` per Design System v3 convention; note `npm run build` re-runs `buildPublishedCSS`/`buildAssets` so published pages pick up font CSS. No re-download of already-hosted families.
4. Convert the vestria `criticalFontHrefs` entry from static to variant-aware (function of variantId, matching the meridian/lex/granth pattern).
5. Keep per-section `data-surface` (sectionRules) 100% untouched — mood layers under it via `data-mood` on root.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` (incl. palette-selection + dispatch regression suites), `npm run build` green.
- Manual (dev): flip `data-palette`/`data-variant`/`data-mood` on a vestria page in devtools → all 8 accents, 3 typefaces, 2 moods render; edit vs published identical (SSRTokens parity); other templates' pages visually unchanged; network tab shows the correct hero-headline font preloaded per variant.

---

### Phase 6 — Cosmetic pickers: generation-time + editor popover

**Files touched**
- `src/hooks/useProductGenerationStore.ts` (add `variantId`, `paletteId`, `mood` + setters)
- `src/app/onboarding/product/[token]/components/fields/ProductStylePicker.tsx` (new — clone service `StyleStep`/`PaletteSwatch` pattern: variant cards + accent swatches (from injected `[data-palette]{--accent}` vars — firewall-safe) + mood toggle)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` (mount ProductStylePicker in the same non-blocking `'copy'`-stage slot as Phase 3's picker — hero variant first, then cosmetic, per spec; replace hardcoded `cobalt`/`tailored` at save with store values; write mood into `themeValues` in the saveDraft payload)
- `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx` (new — clone `ServiceThemePopover.tsx`: reads templateId/variantId/paletteId from `useEditStoreLegacy`, writes `updateMeta({variantId|paletteId})` + mood via themeValues update + `triggerAutoSave()`; gated `templateId==='vestria'`)
- `src/app/edit/[token]/components/layout/EditHeader.tsx` (lines ~30–47: product + vestria → render VestriaThemePopover instead of the static LOCKED label; product + meridian/techpremium keep LOCKED label; service/legacy branches untouched)

**Steps**
1. Same non-blocking + race rules as Phase 3: choices applied on every `saveFC` + re-applied at completion; defaults (cobalt/tailored/bone) when user skips.
2. Persistence is already in place (verified, not a worry): `/api/saveDraft` persists `variantId`/`paletteId`, and `DraftSaveSchema.themeValues` is a permissive record — mood round-trips through `themeValues` with NO payload-handling change and NO migration.
3. Popover live-updates via ThemeInjector reacting to store meta (service pattern); verify `usePaletteSwap`-style live swap or re-render suffices for vestria.

**Verification**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green.
- Manual (dev): full manufacturer run — pick hero variant + cosmetic mid-stream → generated page reflects all choices; editor popover changes variant/palette/mood live + persists across reload + publish; ServiceThemePopover + service StyleStep behavior unchanged; meridian/techpremium still show LOCKED label.
- Run `/manual-test` editor↔published parity items for vestria before merge.

---

## Cross-cutting rules (all phases)

- Every hero change lands in `.core.tsx` + both wrappers; never import from a `'use client'` block into published code (shared helpers → plain modules). Cores stay hook-free (coreParity FORBIDDEN scan enforces).
- No prompt-builder file is touched in any phase (firewall); new media keys are `manual_preferred`/`system` fillMode → never enter AI generation.
- `prisma migrate dev` only if a migration becomes unavoidable — currently NONE planned; any migration = HUMAN GATE.
- Per-phase commit on `feature/onboarding2`; merge to main is a human gate, ordered AFTER onboarding1.

## Resolved (do not reopen)

- Variant id stays **`tailored`** (= editorial look). Renaming churns `defaultVestriaVariant` (tokens.ts:148), ThemeInjector default, coreParity fixtures, persisted drafts. Hard rule.
- `themeValues` persistence needs no work: `DraftSaveSchema.themeValues` is already a permissive record; mood persists with no migration.
- Hero-variant source of truth = `content[heroId].layout`; `sectionLayouts` is mirrored but vestigial for template modules.
- Video upload transport = Blob CLIENT upload (`handleUpload` + `@vercel/blob/client`); server formData is a dead end (~4.5MB Vercel body limit).

## Unresolved questions

1. Video size cap (enforced in `onBeforeGenerateToken`): 50MB ok, or 100MB? (Blob storage cost only — transport no longer limits it.)
2. **Placeholder clip supplier — real content dependency, blocks Phase 1/3 acceptance.** Who supplies it, and bundle in `public/assets/` vs one-time Blob upload + hardcoded URL? Fallback planned (tiny black loop or poster-only) so implementation proceeds regardless — pick fallback preference.
3. Mood attr name: `data-mood` ok?
4. Mood = 3rd control in pickers now, or defer (ship variant+palette only)?
5. Default look post-Axis-A: keep cobalt/tailored, or switch to mock defaults brass/editorial(bone)?
6. Full-bleed stats (decided in the Phase 1 `elementSchema.ts` entry): reuse `stamp_value/stamp_label` + `values[]`, or mock's exact 3-stat contract?
7. Placeholder poster: ship one (must be absolute URL — `validateAndResolveAssetURLs` doesn't rewrite `poster`), or poster empty until upload?
