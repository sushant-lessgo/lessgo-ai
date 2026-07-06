# onboarding2 — implementation audit

## Phase 1 — Full-bleed video hero block pair + element schema

**Branch:** `feature/onboarding2` (guard verified before any edit).

**Files changed**
- `src/modules/templates/vestria/blocks/Hero/VestriaFullBleedHero.core.tsx` (NEW)
- `src/modules/templates/vestria/blocks/Hero/styles.ts`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.published.tsx`
- `src/modules/audience/product/elementSchema.ts`
- `src/modules/templates/vestria/coreParity.test.ts`
- `src/modules/templates/vestria/registration.test.ts`

### Per-file detail

**`VestriaFullBleedHero.core.tsx` (new)** — single-source full-bleed hero core, ported from `template-design/Vestria - Uniform Manufacturing v2 (full-bleed hero).html`. Plain server-safe module: no `'use client'`, no hooks, no editPrimitives import — renders only through injected `VestriaPrimitives` (passes the coreParity FORBIDDEN scan). Structure: dark section → absolute media layer (poster `E.Img` + up to two `<video>`s) → `.vs-heroFull__veil` gradient → centered tag (`vs-tag vs-center vs-on-dark`) / h1 (`vs-display`, white, italic accent `em`) / lede / primary (`vs-btn vs-accent`) + ghost CTA → bottom stat row. Content type `VestriaFullBleedHeroContent extends VestriaHeroContent` + 3 media keys.
- Video slots: desktop = `hero_video_desktop`, mobile = `hero_video_mobile`. Each `<video>` rendered ONLY when its clip URL resolves; if only ONE clip exists it renders for all viewports (no `--desktop/--mobile` class → no media-query hiding). Both carry `autoPlay loop muted playsInline poster preload="metadata"`.
- No clip at all → NO `<video>`; poster-only background. Poster chain: `hero_video_poster` → `hero_image` → hatched placeholder. The bg `E.Img` binds its `elementKey` to whichever key is being displayed (`hero_video_poster` if set, else `hero_image`) so an edit-mode Replace writes the key the user is looking at.
- Stats: first stat = `stamp_value`/`stamp_label` (when present), then `values[]` via `E.List` (min 0 max 3) mapped **title → stat value (big display b), kicker → stat label (mono span)**; `description` unused but preserved (content-preserving swaps).

**`styles.ts`** — appended `vs-heroFull*` CSS block (before `HATCH_PLACEHOLDER_CSS`), ported 1:1 from the mock: `min-height:min(92vh,880px)`, `background:var(--dark)`, veil gradient, centered inner stack, on-dark ghost button, `hf-stat` row, `@media(max-width:680px)` h1/stat shrink + desktop↔mobile `<video>` `display` toggle. Two adaptations: (1) `.vs-heroFull__bg` sized via `width/height:100%` instead of `position:absolute` because the edit Img primitive forces inline `position:relative` — identical result in both renderers (parity by construction); (2) `.vs-heroFull__statsList{display:contents}` so `E.List`'s wrapper div doesn't break the flex stat row. Tailored-hero CSS untouched.

**`VestriaTailoredHero.tsx` (edit wrapper)** — branches on `layout` from `useVestriaBlock` (reads authoritative `content[heroId].layout`): `'VestriaFullBleedHero'` → full-bleed core, default/unknown → tailored core. Same provider/ctx as before.

**`VestriaTailoredHero.published.tsx` (published wrapper)** — identical branch; layout read via `props.content?.[props.sectionId]?.layout` (the published renderer passes the full content map + sectionId but not a layout prop). Server-safe, no client imports.

**`elementSchema.ts`** — added `VestriaFullBleedHero` entry (sectionType `'hero'`) directly after `VestriaTailoredHero`: SAME copy keys/defaults/fillModes as tailored (tag_text, headline, lede, cta pair, secondary cta pair, hero_image, stamp_value/stamp_label, values[] min0/max3) PLUS `hero_video_desktop`/`hero_video_mobile`/`hero_video_poster` as `fillMode:'manual_preferred'` (never enters AI generation — no prompt-builder change, firewall intact). NOT added to `VESTRIA_LAYOUT_NAMES` (that map is the per-section default layout; the variant is selected via `content[heroId].layout`). Header doc-comment updated 12→13 layouts. Entry flows automatically into `layoutElementSchema` + `productElementSchema` spreads.

**`coreParity.test.ts`** — core count 12→13; added full-bleed renderToStaticMarkup fixture; added a dedicated `<video>` contract test: with clips → exactly 2 videos, each tag contains `muted`, `autoplay`, `playsinline`, `poster="…"`; without clips → zero `<video>` and the `hero_image` poster URL present.

**`registration.test.ts`** — new `VestriaFullBleedHero variant schema` describe: `getSchemaDefaults('VestriaFullBleedHero') !== null` + sectionType `'hero'`; shared-copy-contract key check (swap is content-preserving); 3 media keys asserted `manual_preferred`.

### Orchestrator open-question decisions applied
1. **No bundled placeholder clip** — `public/assets/vestria-hero-placeholder.mp4` NOT created. No clip → `<video>` omitted, poster-only rendering (`hero_video_poster` → `hero_image` → placeholder). Avoids the `validateAndResolveAssetURLs` poster-rewrite gap (no relative asset URLs introduced).
2. **Stats reuse existing keys** — stamp pair + `values[]` (title→value, kicker→label); zero new stat copy keys.
3. **Media keys** `hero_video_desktop/mobile/poster` added with `fillMode:'manual_preferred'`.

### Deviations / judgment calls (in-scope)
- `values[]` field→stat mapping wasn't pinned by the orchestrator ("each item's fields map to stat value+label"): chose **title → stat value, kicker → stat label** (kicker's mono-uppercase styling matches the mock's stat label; description ignored but preserved). Conservative, reversible.
- Poster-only fallback uses `E.Img` (not a bare `<img>`) so the background image is already editable in the editor pre-Phase-2; its elementKey follows the displayed key (`hero_video_poster` if set, else `hero_image`).
- Single-clip case renders ONE viewport-agnostic `<video>` instead of two identical hidden/shown ones (avoids double-fetch; still the CSS `@media display` toggle when both clips exist).
- `elementSchema.ts` header comment updated 12→13 (same file, doc accuracy).

### `muted` static-markup check
Verified empirically on the repo's React (18.3.1): `renderToStaticMarkup(<video autoPlay loop muted playsInline …/>)` emits `<video autoplay="" loop="" muted="" playsinline="" …>` — `muted` IS present, no workaround needed. Locked in permanently by the new coreParity test (regex over `<video…>` tags asserts `muted`/`autoplay`/`playsinline`/`poster`), so a React upgrade that drops `muted` turns the suite red.

### Test / build results
- `npx tsc --noEmit` — clean, zero errors.
- `npm run test:run` — **51 files passed | 1 skipped; 670 tests passed | 2 skipped** (coreParity at 13 cores + video contract; registration variant-schema asserts green).
- `npm run build` — green (published CSS + assets + next build completed).
- `git status --porcelain` — only the 7 Files-touched entries modified/created (plus pre-existing untracked plan/spec docs). Zero out-of-scope diffs.

### Open risks
- Manual dev check still pending (per plan): set `content[heroId].layout = 'VestriaFullBleedHero'` on a vestria draft and eyeball editor/preview/publish; automated coverage proves markup + schema, not visuals.
- Until Phase 2 upload UI, the only in-editor media control on the full-bleed hero is the poster-image Replace affordance; clips can only arrive via draft-content edits.
- Generated `values[]` copy authored for the tailored hero (e.g. title "Quality Assurance") will read as prose, not numbers, in the stat row until regenerated/edited — accepted consequence of the reuse-keys decision.
- `.vs-heroFull__stats` renders (dashed-top stat borders) whenever stamp or values exist — with tailored-style prose values this is cosmetically fine but worth an eyeball at the pilot gate.

---

## Phase 2 — video upload: Blob CLIENT upload route + editor upload chrome

### Files changed
- `src/app/api/upload-video/route.ts` (NEW)
- `src/hooks/editStore/formsImageActions.ts`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx`

### Per-file detail

**`src/app/api/upload-video/route.ts` (new)**
- First `@vercel/blob/client` client-upload route in the repo. POST handler parses `request.json()` as `HandleUploadBody` and delegates to `handleUpload({ body, request, onBeforeGenerateToken, onUploadCompleted })`.
- `onBeforeGenerateToken(pathname, clientPayload)`: Clerk `auth()` → `prisma.user.findUnique({ clerkId })` → parse `clientPayload` JSON for `tokenId` → `prisma.token.findUnique({ value }, include: { project })` → ownership `token.project.userId === user.id` with the SAME admin override as `/api/upload-image` (`isAdmin(clerkId)` + `logAdminOverride(action: 'video.upload')`). All failures `throw` (→ 400, token refused; file never uploaded).
- Token constraints returned: `allowedContentTypes: ['video/mp4','video/webm']`, `maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES` (named const, **50MB — orchestrator decision Q1**; enforced HERE, not via request body since the file never transits the function), `addRandomSuffix: false` (client pathname is timestamp-unique, matches image-route convention), `tokenPayload` with `{tokenId, userId}`.
- Extra guard (in-scope hardening): pathname must start with `uploads/${tokenId}/` so a token minted for project A can't write into project B's folder.
- `onUploadCompleted`: console log only. **Localhost caveat:** Blob calls this via a public webhook URL, so it will NOT fire on localhost — non-fatal, the client gets the blob URL from `upload()`'s return value directly (documented in the route header).
- Errors return `NextResponse.json({error}, {status: 400})` per handleUpload convention.

**`src/hooks/editStore/formsImageActions.ts`**
- Added `uploadVideo(file, {sectionId, elementKey})` sibling to `uploadImage` plus consts `VALID_VIDEO_TYPES = ['video/mp4','video/webm']`, `MAX_VIDEO_SIZE_MB = 50`, and `import { upload } from '@vercel/blob/client'`.
- Flow: client MIME/size guards → require `get().tokenId` → `upload(\`uploads/${tokenId}/${Date.now()}-${safeName}\`, file, { access:'public', handleUploadUrl:'/api/upload-video', clientPayload: JSON.stringify({tokenId}), contentType, onUploadProgress })` — direct-to-Blob, NOT a fetch POST of the file (4.5MB serverless body limit) → `updateElementContent(sectionId, elementKey, blob.url)` → `await get().save()` (full save()/export() path so multi-page `pages` serialize — mirrors uploadImage's fix; save failure is non-blocking, isDirty stays) → history undo entry → progress cleanup. Errors set `state.errors['video-upload']` and rethrow.
- Uses `state.images.uploadProgress` map like uploadImage (real progress via `onUploadProgress` percentage).
- No change to `FormsImageActions` type needed — factory return is cast, and callers access via `(store as any)` per existing template-block precedent (surge/lumen/techpremium do this for uploadImage).

**`src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx` (edit wrapper only)**
- When `layout === 'VestriaFullBleedHero'`, renders `<FullBleedMediaChrome>` after the core (inside the provider, hero render untouched): 3 `MediaSlot`s — desktop clip + mobile clip (accept mp4/webm, via `store.uploadVideo`) and poster image (via EXISTING `store.uploadImage`, elementKey `hero_video_poster`). Each slot: hidden file input + Upload/Replace button + current filename tail + busy state + inline error.
- Chrome is edit-only by design (published wrapper untouched); parity lives in the shared core + styles.ts from Phase 1. Chrome uses inline styles (avoids touching styles.ts, which is not in this phase's Files-touched). Uploaded URLs land in the Phase-1 schema-backed media keys, so they survive `extractLayoutContent` + reload.

### handleUpload/upload shapes used (from `@vercel/blob@^2.0.0` `client.d.ts`)
- `handleUpload({ body: HandleUploadBody, request, onBeforeGenerateToken: (pathname, clientPayload, multipart) => Promise<Pick<GenerateClientTokenOptions,'allowedContentTypes'|'maximumSizeInBytes'|...> & {tokenPayload?, callbackUrl?}>, onUploadCompleted?: ({blob, tokenPayload}) => Promise<void> })`
- `upload(pathname, file, { access:'public', handleUploadUrl, clientPayload, contentType, onUploadProgress }) => Promise<PutBlobResult>` (`.url` used).

### Deviations
- Added pathname-prefix validation in `onBeforeGenerateToken` (not in plan text; conservative security hardening within the file's scope).
- `uploadVideo`'s `targetElement` param is REQUIRED (orchestrator signature `uploadVideo(file,{sectionId,elementKey})`), unlike uploadImage's optional — video uploads always target a media key.

### Test results
- `npx tsc --noEmit` — clean, no output.
- `npm run test:run` — 51 files passed | 1 skipped; 670 tests passed | 2 skipped.
- `npm run build` — green (full build incl. buildPublishedCSS/buildAssets).
- `git status --porcelain` — exactly the 3 Files-touched; `git diff HEAD -- src/app/api/upload-image/route.ts` — empty (byte-unchanged, read only).

### Reasoned walkthrough (can't do a real prod upload here)
- Oversized file: client guard throws at 50MB; even if bypassed, Blob rejects at `maximumSizeInBytes` in the minted token.
- Wrong MIME: client guard + `allowedContentTypes` in token → refused.
- Non-owner: `onBeforeGenerateToken` throws before any token is minted → route 400 → `upload()` rejects client-side; no file reaches Blob.
- Unauthenticated: Clerk `auth()` null → throw → 400.

### Open risks
- **Post-deploy check required (plan):** one real ~20–50MB upload through Vercel to confirm no 413 — this phase is the repo's first client-upload pattern.
- `onUploadCompleted` won't fire on localhost (no public callback URL) — logging-only, non-fatal.
- Blob videos are never garbage-collected on replace (same as images today) — storage cost accrues on repeated re-uploads; accepted, matches image behavior.
- Local dev needs `BLOB_READ_WRITE_TOKEN` in `.env.local` — unlike upload-image there is NO filesystem fallback (client upload goes direct to Blob); without the token dev uploads fail with a clear error.
- This phase is a HUMAN GATE (route existence + 50MB cap + new pattern sign-off before merge).

---

## Phase 3 — Generation-time hero-variant picker (non-blocking)

**Files changed**
- `src/hooks/useProductGenerationStore.ts` (modified)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` (modified)
- `src/app/onboarding/product/[token]/components/fields/HeroVariantPicker.tsx` (new)

### Per-file

**`src/hooks/useProductGenerationStore.ts`**
- Added exported `VestriaHeroVariant = 'VestriaTailoredHero' | 'VestriaFullBleedHero'` type.
- Added `heroVariant` state (default `'VestriaTailoredHero'` — no-pick = existing behavior) + `setHeroVariant` action. Included in `initialState` so `reset()` clears it.
- **(Review fix)** Added `heroVariantPicked: boolean` (default `false`, in `initialState` so `reset()` clears it); `setHeroVariant` flips it `true` on any explicit pick. This flag — not the template guard — is what prevents a resumed run from clobbering a persisted pick (see Deviations).

**`src/app/onboarding/product/[token]/components/fields/HeroVariantPicker.tsx`** (new)
- Two-card radio-group chooser (Image hero / Video hero) with miniature CSS layout sketches (two-column image vs dark full-bleed with play glyph). Controlled component (`value`/`onChange`), fire-and-forget — writes only the store; no pipeline interaction. Copy notes video clips are uploaded later in the editor (Phase 1 poster/placeholder behavior until then).

**`src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx`**
- Module-level `applyHeroVariantToFinalContent(fc, variant)` helper (mutates payload before save).
- `saveFC` now applies the CURRENT store hero variant (via `useProductGenerationStore.getState()`, never a stale closure) on EVERY save when `isManufacturerFlow(storeTemplateId) && heroVariantPicked` — covers skeleton save (no-op, no hero yet), every per-page save, and the final save after `finalizeMultiPageGeneration` (the completion re-apply).
- Single-page vestria fallback (`runCopyAndSave`, no sitemap): same application on `finalContent` right after `buildFinalContent`, gated `explicitVestria && heroVariantPicked`.
- Picker rendered below the STAGES `<ol>` only when `stage === 'copy' && isManufacturerFlow(storeTemplateId)`; wired to `heroVariant`/`setHeroVariant` selectors. Pipeline never awaits it.

### Hero-id location + authoritative-field write
Hero sections are found by the `${type}-${uuid}` id convention: any key in a `content` map starting with `hero-`. For each match, the helper writes:
1. `content[heroId].layout = variant` — the **authoritative** field (published renderer + `useVestriaBlock`/`getSchemaDefaults` read this);
2. mirrors `sectionLayouts[heroId] = variant` (matches `updateSectionLayout` behavior).

It applies to BOTH the flat top-level (`fc.content` + `fc.layout.sectionLayouts`) AND every `fc.pages[key]` entry (`page.content` + `page.sectionLayouts`) — after a DB round-trip (resume) these are no longer shared references. Extra safety guard: only entries whose current layout is already a vestria hero layout (`VestriaTailoredHero`/`VestriaFullBleedHero`) are touched, so meridian/service payloads pass through byte-identical even if the helper were ever miscalled. No new API fields; `/api/saveDraft` already persists both fields.

### Race handling
The picker is non-blocking, so the home/hero page may be saved before OR after the pick. Handled by re-applying the live store value at every `saveFC` call: pick-before-hero-save → applied when the hero page merges; pick-after-hero-save → applied on the next per-page save AND unconditionally on the final completion save. `getState()` guarantees the value read is at save-time, not pipeline-start. Default (never picked) = tailored → identical output to pre-phase behavior.

### Deviations / judgment calls (in-scope)
- **Resumed runs (reload mid-generation) never re-apply — via `heroVariantPicked`, NOT the template guard (review fix):** the original audit claimed a resumed run's store resets to `templateId: 'meridian'` so `isManufacturerFlow(storeTemplateId)` skips the application. That claim was FALSE — the resume path (`page.tsx:86`) sets `templateId: 'vestria'` BEFORE `GeneratingStep` mounts, so the flow guard is TRUE on resume and `saveFC` would have re-applied the default tailored variant, silently clobbering a previously persisted `'VestriaFullBleedHero'` pick. Real mechanism now: both apply sites are additionally gated on `heroVariantPicked === true`, which only `setHeroVariant` (an explicit user pick this session) sets; a resumed run's store reset leaves it `false`, so the persisted choice survives. Fresh no-pick run: `false` → no application → byte-identical to pre-phase output (merged hero already defaults to tailored). Fresh pick: `true` → applies; the every-save re-apply race handling is unchanged.
- Picker gate uses `isManufacturerFlow(storeTemplateId)` directly (the D1 single-source helper), same guard as the rest of the vestria pipeline.
- Single-page vestria fallback path also gets the variant applied (plan text focuses on the fan-out; leaving the fallback tailored-only would be an inconsistent gap).

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 51 files passed, 1 skipped (670 passed / 2 skipped).
- `npm run build` — green.
- Diff scope: `git status` shows only the 3 Files-touched (2 modified + 1 new).
- Reasoning check: mid-stream video pick → next `saveFC` (and the guaranteed final one) writes `content[heroId].layout === 'VestriaFullBleedHero'` + mirrored `sectionLayouts`; no pick → `heroVariantPicked` false → helper never called, generated value untouched; resume-with-saved-pick → store reset (`picked=false`) → persisted full-bleed layout survives every subsequent save; pipeline has zero awaits on the picker; meridian (isManufacturerFlow false) and service (different route tree) render no picker and take no code path through the helper.

### Open risks
- Pick landing in the ~600ms window between the final save and the redirect is lost (picker unmounts at `stage==='saving'`, so effectively unreachable).
- Full-bleed pick at generation shows poster-only/placeholder until editor upload (Phase 1 fallback chain) — expected per plan step 4.

---

## Phase 4 — Editor hero swap via scoped LayoutChangeModal

### Files changed
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx` (modified)
- `src/app/edit/[token]/components/ui/VestriaHeroVariantSelector.tsx` (new)

### Per-file detail

**LayoutChangeModal.tsx** — narrowed the blanket template-module gate. The old
`if (usesTemplateModule(audienceType, templateId)) return null;` becomes:
inside the `usesTemplateModule` branch, compute

```
isVestriaHero = templateId === 'vestria'
             && layoutChangeModal.sectionType === 'hero'
             && !!effectiveLayout
             && VESTRIA_HERO_LAYOUTS.includes(effectiveLayout)
```

where `effectiveLayout = content[sectionId]?.layout ?? layoutChangeModal.currentLayout`
(a new `useStoreState` selector reads the authoritative `content[sectionId].layout`).
`!isVestriaHero` → `return null` (all other template modules + all non-hero
vestria sections stay disabled exactly as before). `isVestriaHero` → render the
new `VestriaHeroVariantSelector` — NOT the legacy `LayoutChangeSelector`.
`onSelect` calls the existing `updateSectionLayout(sectionId, layoutId)` (only
when the layout actually changes) then `hideLayoutChangeModal()`. No
`setSection` call — element content, including uploaded `hero_video_*` URLs,
is never touched, so a round-trip swap preserves everything (both layouts have
schema entries + shared copy keys from Phase 1). Legacy non-module path
(`LayoutChangeSelector` + `handleLayoutChange`) is byte-identical.

**VestriaHeroVariantSelector.tsx** — bespoke 2-card selector following the
existing modal conventions (`Dialog`/`DialogContent`/`DialogHeader`, `cn`,
`ring-2 ring-primary bg-primary/5` selected state, `Badge` "Current" marker,
mirroring `LayoutChangeSelector`'s card styling and `HeroVariantPicker`'s
thumbnails). Cards: "Tailored" (`VestriaTailoredHero`, image sketch) and
"Full-bleed" (`VestriaFullBleedHero`, dark video sketch with play glyph).
Presentational: current variant via `currentLayout` prop; pick via `onSelect`
prop (the modal owns the store write). Exports `VESTRIA_HERO_LAYOUTS` used by
the modal's gate.

### Persistence path
`updateSectionLayout` (`src/hooks/editStore/layoutActions.ts:279`) writes BOTH
`sectionLayouts[sectionId]` and `content[sectionId].layout`, marks
`persistence.isDirty` (autosave), and pushes undo history — reused unmodified,
no reimplemented persistence.

### Other modules stay disabled
surge / hearth / lex / lumen / meridian / techpremium all fail
`templateId === 'vestria'` → `return null` (same behavior as before). Vestria
non-hero sections fail the layout-membership check (and usually the
sectionType check) → `return null`. Legacy non-module products never enter the
`usesTemplateModule` branch → unchanged legacy selector.

### Deviations
- **Added layout-membership check beyond the planned `sectionType === 'hero'`
  gate (conservative, in-scope):** `SectionToolbar`'s
  `getSectionTypeFromLayout()` DEFAULTS unknown layouts to `'hero'`, and
  vestria's new section types (`industries`, `about`, `materials`, `trust`, …)
  are neither in that map nor in the sectionId-regex fallback — so vestria
  NON-hero sections reach the modal with `sectionType === 'hero'`. Gating on
  sectionType alone would open the hero selector on them. Requiring the
  section's current layout ∈ {VestriaTailoredHero, VestriaFullBleedHero}
  closes that hole without touching `SectionToolbar.tsx` (out of scope).
- Selector is presentational (modal passes `onSelect` that calls
  `updateSectionLayout`) rather than reading the store itself — same write
  path, cleaner separation; matches how the modal already drives the legacy
  selector.

### Test results
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 51 files passed, 1 skipped; 670 tests passed, 2 skipped.
- `npm run build` — green (published CSS + assets + next build).
- `git status` — only the 2 Files-touched changed.

### Open risks
- Manual gate pending (per plan): dev-verify swap both directions persists on
  reload + publish, video URLs survive round-trip, no-op on other modules.
- If a future vestria hero variant is added, `VESTRIA_HERO_LAYOUTS` must be
  extended or the gate silently hides the modal for it (fail-closed by design).
