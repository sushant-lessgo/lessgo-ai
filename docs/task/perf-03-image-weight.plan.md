# perf-03 — image weight & hygiene — implementation plan

**Branch:** `feature/perf-03-image-weight` (orchestrator owns branch state; implementers/reviewers hard-stop on mismatch).
**Spec:** `docs/task/perf-03-image-weight.spec.md`

## Overview

Make images stop being a scaling risk in both renderers: below-fold block images get `loading="lazy"` + `decoding="async"` with layout reserved by the existing CSS aspect-ratio wrappers; hero/LCP + above-fold logos stay eager; base64 (`data:image`) and ephemeral `blob:` URLs are blocked at the write layer and auto-uploaded via the EXISTING store `uploadImage` action so they can never enter content JSON. Pilot on techpremium (naayom's template) with a human gate, then mechanically sweep the remaining templates. hearth + lex have no raw `<img>` in blocks — nothing to do there.

Key design decisions (from scout + plan review):
- Content `src` is a bare URL string with no dimension metadata → do NOT add per-image `width`/`height` (would need a content-shape change). Rely on existing CSS aspect-ratio wrappers (`.tp-pshot`, `.lm-shot`, `.gr-cover`, …) for space reservation; each sweep phase verifies the wrapper exists for every img it lazies and adds a matching `aspect-ratio` to the wrapper CSS (both renderers) only where missing.
- granth + vestria use a single shared `Img` primitive used in hero AND below-fold → add an `eager?: boolean` prop (default lazy) instead of touching every usage; hero/nav usages pass `eager`.
- Base64/blob guard = two layers with a hard split of concerns:
  (a) **sync prefix-reject** — pure, unit-testable function in a plain module, called at the `updateElementContent` write chokepoint (cheap `data:image/` / `blob:` prefix check);
  (b) **async auto-upload** — lives IN THE STORE, as a thin adapter over the existing `uploadImage(file, {sectionId, elementKey})` action (`formsImageActions.ts:304`), which already builds FormData with `tokenId` from `get().tokenId` (:324), uploads, and writes the permanent Blob URL via `updateElementContent` (:353). Do NOT write a new token-less fetch helper — `/api/upload-image` returns 400 without `tokenId` (`upload-image/route.ts:52-54`), so upload logic must stay where the tokenId lives. This also fixes the real `ImageToolbar` bug where an ephemeral `blob:` object URL is persisted (dies on reload).
- Renderers stay unchanged for READING — existing projects containing base64 must still render.
- Sweep scope note: the shared primitives `src/components/published/{ImagePublished,LogoPublished,AvatarPublished}.tsx` and `src/components/ui/{HeaderLogo,AvatarEditableComponent}.tsx` are dead — no block/renderer imports them (grep: self + README + index only). They are NOT the sweep target; a shared-helper refactor would be larger than the per-template sweep, so per-template phasing is correctly right-sized. Out of scope.

## Progress log

- phase 1 prod base64 scan: DONE (commit 36399e3a, review loops 1). Dev clean of base64 (5 blob: only). PROD scan 2026-07-11: 34 projects, 0 base64, 0 blob:. Gate CLEARED clean.
- phase 1b base64 migration (conditional): SKIPPED — prod scan clean, nothing to migrate
- phase 2 write-layer base64/blob guard: DONE (review loops 1, ship). Pure isForbiddenImageSrc + updateElementContent guard + uploadImageFromObjectUrl adapter + ImageToolbar reload-death fix. tsc+2016 tests green. Follow-up nit: declare uploadImageFromObjectUrl in types/store/actions.ts (currently `as any` read; benign).
- phase 3 pilot — techpremium img attrs: code DONE (review loops 1, ship). 10 blocks × 2 renderers, eager Hero+Nav / lazy rest, all reservation pre-existing (GalleryPreview masonry intentionally no aspect-ratio). tsc+build+tests green. PILOT gate CLEARED 2026-07-11 (commit ff8e2ad8, user Option B — accept green gates + parity review, skip empirical LCP check).
- phase 4 sweep — meridian + surge + shared blog blocks: DONE (review loops 1, ship). meridian Hero+Nav eager, surge Nav eager / Footer lazy, blog blocks +decoding (single-file, no .published pair). tsc+build+tests green.
- phase 5 sweep — lumen: DONE (review loops 1, ship). Hero+Nav eager, Portfolio+About lazy. LumenAbout STOP guard did NOT trip (published renders <img>, pure no-op). All reservation pre-existing. tsc+build+tests green.
- phase 6 shared Img primitive — granth + vestria: pending
- phase 7 final verification + acceptance: pending

---

## Phase 1 — prod content base64 scan (read-only)

Answers the spec's open question ("do any prod contents already contain base64 blobs?") before any migration decision.

**Steps**
1. Write a standalone read-only script that iterates `Project` rows, stringifies `content` (and `themeValues`), and searches for `data:image` and `blob:` substrings.
2. Output per hit: project id, token, matched prefix, approximate blob size (matched substring length), count per project; plus a summary line (projects scanned / projects affected / total base64 bytes).
3. Run against dev DB first, then prod DB (both read-only; DATABASE_URL selects target — user supplies/confirms prod URL).

**Files touched**
- `scripts/scanBase64Content.ts` (new; delete-after-use candidate, don't commit long-term per docs policy — keep on branch until phase 1b decision, then remove in phase 7 if unused)

**Verification**
- Script runs green on dev DB; prod run output pasted to the user.
- No writes anywhere (script uses only `findMany`/reads).

**Human gate:** YES — user reviews scan output and decides: clean → skip phase 1b entirely; blobs found → phase 1b proceeds. (Scan itself is safe; the gate is on the decision.)

---

## Phase 1b — migrate existing base64 content (CONDITIONAL — only if phase 1 finds blobs)

**HUMAN GATE (prod data mutation) — requires explicit user sign-off before running against prod. Skip phase entirely if scan is clean.**

**Steps**
1. Script: for each affected project, extract each `data:image` value, decode → Buffer → upload via the same sharp/webp path as `/api/upload-image` (or call the route logic directly), replace the content value with the returned Blob URL, save project.
2. Dry-run mode (report what WOULD change) is the default; `--apply` flag to write.
3. Back up affected rows (JSON dump to `backups/`) before `--apply`.

**Files touched**
- `scripts/migrateBase64Images.ts` (new)

**Verification**
- Dry-run output reviewed by user; after `--apply`, re-run phase 1 scan → zero hits; spot-open one migrated project in `/edit/[token]` and confirm images render.

---

## Phase 2 — write-layer base64/blob guard + ImageToolbar persistence fix

Logic-heavy phase, independent of the img-attr sweeps. Two-layer design: sync reject = pure module; async auto-upload = store adapter over existing `uploadImage` (which has the tokenId). NO new token-less uploader.

**Steps**
1. **Enumerate write paths FIRST (before any reject lands):** grep all image-content setters and paste/drop handlers for `blob:`/`data:` writes and confirm none transiently persist a preview that the sync reject would silently eat. Known landscape:
   - `ImageToolbar.tsx` `handleImageEditorSave` (~:253) — the one KNOWN offender (persists ephemeral `blob:`).
   - `formsImageActions.ts` `selectStockPhoto` (:606) — writes a preview URL, but it's a Pexels **https** URL, then swaps to compressed Blob URL (:620) → safe; confirm on disk.
   - `AvatarEditableComponent.tsx`, `HeaderLogo.tsx` — believed dead (no imports); confirm dead, don't modify.
   - Any other setter found by grepping `updateElementContent`/`replaceImage` callers + `URL.createObjectURL` usages under `src/`. If a legit transient-preview flow is found, surface it before proceeding (don't silently break it).
2. New plain module `src/hooks/editStore/imageWriteGuard.ts` — **sync check only**:
   - `isForbiddenImageSrc(value: string): boolean` — true for `data:image/` and `blob:` prefixes. Pure, no fetch, no store access.
3. `contentActions.ts` `updateElementContent` (line ~59): sync defense-in-depth — if incoming string value hits `isForbiddenImageSrc`, refuse the write (keep old value) + `console.warn` (dev) / silent no-op (prod). Cheap prefix check only; no behavior change for text content.
4. **Store-side auto-upload adapter** in `formsImageActions.ts` (new small action, e.g. `uploadImageFromObjectUrl(objectUrl, targetElement)`): converts `data:`/`blob:` → `File` via `fetch(value).then(r => r.blob())` → `new File([blob], name, {type})`, then DELEGATES to the existing `uploadImage(file, {sectionId, elementKey})` action (:304), which handles FormData + `tokenId` (:324) and writes the permanent URL via `updateElementContent` (:353). `replaceImage` (:503) already routes real uploads through `uploadImage` (:713) — leave that path as-is.
5. Route the real image-write offenders through the adapter:
   - `ImageToolbar.tsx` `handleImageEditorSave` (~:253) — currently persists an ephemeral `blob:` object URL from SimpleImageEditor; change to call the store adapter (upload edited image → permanent Blob URL lands via `uploadImage`'s own `updateElementContent` write). Show a saving state / toast on failure, keep old value. (Fixes the reload-death bug.)
   - `ImageToolbar.tsx` stock remote URL path (~:424) — https passthrough, no upload; unchanged behavior.
6. Leave `aiActions.ts:84-89` `isImageValue` UNCHANGED — it's a read-side preserve-during-regen check; existing base64 projects must keep rendering/regenerating.
7. Unit tests: `imageWriteGuard.test.ts` — `isForbiddenImageSrc` rejects `data:image/png;base64,...` and `blob:...`; passes `https://`, `/relative`, empty string. Store-level test: `updateElementContent` refuses forbidden values. Adapter test (mock fetch + mock `uploadImage`): `data:`/`blob:` input → File → delegates to `uploadImage` with the right targetElement.

**Files touched**
- `src/hooks/editStore/imageWriteGuard.ts` (new — pure sync check only)
- `src/hooks/editStore/imageWriteGuard.test.ts` (new)
- `src/hooks/editStore/contentActions.ts`
- `src/hooks/editStore/formsImageActions.ts` (new adapter action delegating to existing `uploadImage`)
- `src/components/.../ImageToolbar.tsx` (path as found by implementer; scout ref `ImageToolbar.tsx:253/324/424/436`)

**Verification**
- `npx tsc --noEmit` green; `npm run test:run` green (new tests pass).
- Manual (dev): edit an image via SimpleImageEditor → save → reload editor → image persists (no `blob:` in content); stock-photo select still swaps preview→compressed URL; paste/insert flows cannot land `data:image` in content JSON (inspect saved draft).

---

## Phase 3 — PILOT: techpremium img attrs (both renderers)

10 blocks × 2 files. Dual-renderer discipline: every change lands identically in `.tsx` and `.published.tsx`.

**Steps**
1. Eager (explicit `loading="eager"` — do NOT lazy) + `decoding="async"`:
   - `Hero/TechPremiumHero` (LCP; keep any preload behavior untouched)
   - `Header/TechPremiumNav` (above-fold logo)
2. `loading="lazy"` + `decoding="async"` on all other imgs:
   - `Footer/TechPremiumFooter`, `Trust/TechPremiumTrust`, `Explainer/TechPremiumExplainer`, `Gallery/TechPremiumGallery`, `GalleryPreview/TechPremiumGalleryPreview`, `Lineup/TechPremiumLineup`, `Catalog/TechPremiumCatalog`, `ProductDetail/TechPremiumProductDetail` (3 imgs: stage + thumbs + related).
3. Per lazied img: confirm a CSS aspect-ratio wrapper reserves space (`.tp-pshot` etc.); where genuinely missing, add `aspect-ratio` to the wrapper style IN BOTH files matching the current rendered ratio (no visual change).

**Files touched** (all under `src/modules/templates/techpremium/blocks/`)
- `Hero/TechPremiumHero.tsx` + `.published.tsx`
- `Header/TechPremiumNav.tsx` + `.published.tsx`
- `Footer/TechPremiumFooter.tsx` + `.published.tsx`
- `Trust/TechPremiumTrust.tsx` + `.published.tsx`
- `Explainer/TechPremiumExplainer.tsx` + `.published.tsx`
- `Gallery/TechPremiumGallery.tsx` + `.published.tsx`
- `GalleryPreview/TechPremiumGalleryPreview.tsx` + `.published.tsx`
- `Lineup/TechPremiumLineup.tsx` + `.published.tsx`
- `Catalog/TechPremiumCatalog.tsx` + `.published.tsx`
- `ProductDetail/TechPremiumProductDetail.tsx` + `.published.tsx`

(Exact filenames per scout; implementer verifies on disk before editing — any extra techpremium img found in these dirs gets the same treatment, any file OUTSIDE this list is out of phase scope.)

**Verification**
- `npx tsc --noEmit` green.
- `npm run build` green (REQUIRED — published CSS/assets recompile; parity untrustworthy without it).
- Manual (dev): naayom-scale techpremium page — editor↔published visual parity (`/manual-test` parity items), network tab shows below-fold images deferred, hero loads eagerly.
- Lighthouse on published output: LCP not regressed vs pre-change baseline (record both numbers).

**Human gate:** YES — pilot sign-off (visual parity + LCP numbers) before the mechanical sweep proceeds. This is naayom's live template.

---

## Phase 4 — sweep: meridian + surge + shared blog blocks

Same mechanical treatment as phase 3, plus the shared blog blocks (they're non-hero block images → acceptance criterion 1 applies).

**Steps**
1. meridian: `Hero/EditorialPhotoHero` (:161 / .published:69) = LCP → eager + `decoding="async"`, preload untouched. `Header/MeridianNavHeader` logo → eager + async.
2. surge: `Header/WarmNavHeader` logo → eager + async. `Footer/ContactFooterRich` logo → lazy + async.
3. Shared blog blocks: `shared/blog/BlogPostBodyBlock.tsx` (:67) and `shared/blog/BlogIndexBlock.tsx` (:41) render `<img loading="lazy">` with NO `decoding` — add `decoding="async"` (already lazy). These are single-file shared blocks; implementer verifies on disk whether a `.published.tsx` pair exists — if one does, it joins this list and gets the identical change.
4. Aspect-ratio wrapper check per lazied img (as phase 3 step 3).

**Files touched**
- `src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.tsx` + `.published.tsx`
- `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx` + `.published.tsx`
- `src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx` + `.published.tsx`
- `src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx` + `.published.tsx`
- `src/modules/templates/shared/blog/BlogPostBodyBlock.tsx`
- `src/modules/templates/shared/blog/BlogIndexBlock.tsx`

**Verification**
- `npx tsc --noEmit` + `npm run build` green.
- Quick dev spot-check: meridian + surge page, editor vs published render, hero eager; a published blog post/index page renders unchanged with `decoding="async"` present.

---

## Phase 5 — sweep: lumen

Lumen = photography stress-test template (Kundius pilot — treat visual output carefully).

**Steps**
1. `Hero/LumenHero` = LCP → eager + `decoding="async"`. `Header/LumenNav` logo → eager + async.
2. `Portfolio/LumenCategoryGallery` grid (below-fold) → lazy + async; confirm `.lm-shot` aspect wrappers reserve space.
3. `About/LumenPhotographerAbout` — NOTE: earlier "parity gap" premise was WRONG; the published renderer DOES render `<img>` when `about_image` is present (`LumenPhotographerAbout.published.tsx:36-40`), so there is no structural edit/published divergence to reconcile. Expected work = add `loading="lazy"` + `decoding="async"` to the `<img>` in BOTH files — a visual no-op. Implementer confirms on disk. **STOP guard:** if the published output visually changes for any reason, stop and surface to the user before landing (Kundius is a live bespoke customer).

**Files touched** (all under `src/modules/templates/lumen/blocks/`)
- `Hero/LumenHero.tsx` + `.published.tsx`
- `Header/LumenNav.tsx` + `.published.tsx`
- `About/LumenPhotographerAbout.tsx` + `.published.tsx`
- `Portfolio/LumenCategoryGallery.tsx` + `.published.tsx`

**Verification**
- `npx tsc --noEmit` + `npm run build` green.
- Manual (dev): lumen page editor↔published parity, EN/NL both if trivially reachable; About portrait identical across renderers; gallery images lazy in network tab.

(No human gate expected — phase is mechanical. The STOP guard in step 3 escalates to the user only if published output visibly changes.)

---

## Phase 6 — shared Img primitive: granth + vestria

Different edit shape: single-source `.core.tsx` blocks (parity is automatic), one shared `Img` per template rendered by edit + published primitive factories.

**Steps**
1. Add `eager?: boolean` to `GranthImgProps` (`granth/blocks/primitives.ts:33`) and `VestriaImgProps` (`vestria/blocks/primitives.ts:33`).
2. In BOTH primitive impls per template (`editPrimitives.tsx:~83-103` and `publishedPrimitives.tsx:~25`): render `loading={eager ? 'eager' : 'lazy'}` + `decoding="async"`. Default = lazy (a blanket lazy default is safe ONLY because heroes pass `eager` in step 3 — do not land steps 1-2 without step 3).
3. Pass `eager` at above-fold usages:
   - granth: `Hero/GranthHero.core.tsx:49` (portrait_image).
   - vestria: `Hero/VestriaFullBleedHero.core.tsx:48` (poster), `Hero/VestriaTailoredHero.core.tsx:60` (hero_image), `Header/VestriaNavHeader.core.tsx:65` (logo).
4. Below-fold usages need NO edit (default lazy): granth `Books/GranthBooks.core.tsx`; vestria `About/VestriaAboutStats.core.tsx`, `Industries/VestriaIndustriesGrid.core.tsx`, `Catalog/VestriaCatalogueGrid.core.tsx`. Confirm their wrappers (`.gr-cover` etc.) reserve aspect ratio; add only if missing (files then join this list).

**Files touched**
- `src/modules/templates/granth/blocks/primitives.ts`
- `src/modules/templates/granth/blocks/editPrimitives.tsx`
- `src/modules/templates/granth/blocks/publishedPrimitives.tsx`
- `src/modules/templates/granth/blocks/Hero/GranthHero.core.tsx`
- `src/modules/templates/vestria/blocks/primitives.ts`
- `src/modules/templates/vestria/blocks/editPrimitives.tsx`
- `src/modules/templates/vestria/blocks/publishedPrimitives.tsx`
- `src/modules/templates/vestria/blocks/Hero/VestriaFullBleedHero.core.tsx`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.core.tsx`
- `src/modules/templates/vestria/blocks/Header/VestriaNavHeader.core.tsx`

**Verification**
- `npx tsc --noEmit` + `npm run test:run` (dispatch/regression suites) + `npm run build` green.
- Dev spot-check granth + vestria: hero images eager, book covers / catalog images lazy, edit vs published identical.

---

## Phase 7 — final verification + acceptance

**Steps**
1. Full gates: `npx tsc --noEmit`, `npm run test:run`, `npm run build` — all green.
2. `/manual-test` parity pass on **lumen + techpremium** (per acceptance criteria) against `npm run dev` + a real publish preview.
3. Lighthouse on a published naayom-scale techpremium page: LCP not regressed vs the phase-3 baseline; record numbers in the phase commit message.
4. Sanity greps (BOTH, so criterion 1 is actually enforced): grep `src/modules/templates` for `<img` without `loading=` AND for `<img` without `decoding=` → only intentional cases remain (should be zero, given hearth/lex have none; shared blog blocks covered in phase 4). Any hit goes back to the owning phase.
5. Remove `scripts/scanBase64Content.ts` (and `migrateBase64Images.ts` if phase 1b ran and completed) per the no-long-term-scratch policy, unless user wants them kept.

**Files touched**
- `scripts/scanBase64Content.ts` (delete)
- `scripts/migrateBase64Images.ts` (delete, if it exists)
- (no source edits expected; any fix found here goes back to the owning phase)

**Verification**
- All acceptance-criteria checkboxes in the spec tick green; evidence (LCP numbers, parity result) reported to user.

**Human gate:** merge to main is the standard human gate (user merges + pushes; deploy-watcher polls Vercel).

---

## Unresolved questions

1. `blob:`/`data:` write-path enumeration is now a phase-2 step; if it finds a legit transient-preview flow beyond ImageToolbar, OK to pause phase 2 and surface before hard-rejecting?
2. Phase 1 prod scan: run with existing prod DATABASE_URL from `.env`, or user provides a read-only connection?
3. Keep scan/migration scripts in repo after use, or delete (plan assumes delete)?
