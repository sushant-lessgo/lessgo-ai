# perf-03 image-weight — implementation audit

## Phase 1 — prod content base64 scan (read-only)

**Files changed**
- `scripts/scanBase64Content.ts` (new)

### What changed
Added a standalone READ-ONLY diagnostic script. Bootstrap matches the existing
`scripts/checkDuplicates.ts` pattern: `import { config } from 'dotenv'` +
`import { prisma } from '../src/lib/prisma'` + `config({ path: '.env.local' })`.
DATABASE_URL is ambient (never hardcoded) — the DB target is whatever `.env.local`
provides; the script only prints a credential-masked form of it.

Behavior: `prisma.project.findMany` (reads only) selecting
`id, tokenId, title, content, themeValues`. Each project's `content` and
`themeValues` are `JSON.stringify`'d and regex-scanned for `data:image/…;…` and
`blob:…` occurrences. Per hit: kind, 48-char prefix, matched substring length
(approx size). Per project: id, token (tokenId), title, hit count, embedded KB.
Summary line: projects scanned / affected / total hits / total embedded bytes.

### Zero-writes confirmation
Only `findMany` + `$disconnect` are called. No create/update/upsert/delete
anywhere. Read-only.

### How it is invoked
```
npx tsx scripts/scanBase64Content.ts
```
(No `tsx`/`ts-node` in devDeps; `npx tsx` fetches the runner on the fly, same as
the other `scripts/*.ts`. DATABASE_URL comes from `.env.local`.)

### Dev-DB scan output (executed)
```
DATABASE_URL: postgresql://***@ep-nameless-thunder-a2lj1s9v.eu-central-1.aws.neon.tech/neondb (dev)

Projects affected: 5 — all `blob:http://localhost:3000/<uuid>` (ephemeral object URLs),
each ~0.1 KB prefix-only (the URL string, not embedded image bytes).

Summary
  Projects scanned:  628
  Projects affected: 5
  Total hits:        5
  Total embedded:    ~0.3 KB (315 bytes)
```
Zero `data:image` (base64) hits on dev. The 5 hits are all `blob:` object-URL
strings — exactly the ImageToolbar reload-death bug phase 2 targets (a dead
`blob:` URL persisted into content). These are string-length only, not real
embedded image weight.

### tsc
`npx tsc --noEmit` reports no errors referencing `scanBase64Content`. `scripts/`
is inside the app tsconfig `include` (`**/*.ts`), so the script is type-checked
in-tree and is clean.

### Deviations
- None material. Chose to also mask the DB URL credentials in the printed target
  line (conservative — avoids leaking passwords when output is pasted to the
  user). This is additive/log-only.

### Open risks / notes for orchestrator
- Prod scan NOT run (per instructions — orchestrator handles prod + the human
  gate). Dev is clean of true base64; if prod matches, phase 1b (migration) can
  be skipped. The `blob:` hits are a separate concern already owned by phase 2.
- Script is a delete-after-use candidate (plan phase 7).

---

## Phase 2 — write-layer base64/blob guard + ImageToolbar persistence fix

### Files changed
- `src/hooks/editStore/imageWriteGuard.ts` (new) — pure sync guard.
- `src/hooks/editStore/imageWriteGuard.test.ts` (new) — 9 unit tests.
- `src/hooks/editStore/contentActions.ts` — guard at `updateElementContent` chokepoint.
- `src/hooks/editStore/formsImageActions.ts` — new `uploadImageFromObjectUrl` adapter.
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` — `handleImageEditorSave` now routes ephemeral blob: through the adapter.

### Write-path enumeration result (done FIRST, before landing the reject)
Grepped `URL.createObjectURL` under `src/`, all `updateElementContent`/`replaceImage`
callers, and `blob:`/`createObjectURL` in ImageToolbar. Findings:
- **ImageToolbar `handleImageEditorSave`** — the ONE genuine offender. SimpleImageEditor
  (`crop`/`resize` → `canvas.toBlob` → `URL.createObjectURL`, lines 186/213) hands back a
  `blob:` object URL that was persisted directly → dies on reload. FIXED (routed through adapter).
- **ImageToolbar stock-photo path (`onSelectImage`, ~:424) + `selectStockPhoto` (formsImageActions:591)**
  — write a Pexels **https** preview, then swap to a compressed https Blob-storage URL from
  `/api/proxy-image`. Neither is `data:`/`blob:`. SAFE, unchanged. Confirmed on disk.
- **`AvatarEditableComponent.tsx`, `HeaderLogo.tsx`** — each call `URL.createObjectURL` for a
  local preview, but grep shows they're imported only by self + `components/README.md` → DEAD.
  Not modified (out of scope per plan).
- `ExportFormCSV.tsx` / `ExportCSV.tsx` `createObjectURL` are CSV download blobs, not content writes — irrelevant.
- **No legit transient-preview flow beyond ImageToolbar** would be broken by the hard reject
  (the only transient-preview flows use https, not data:/blob:). Proceeded without pausing (plan unresolved-Q1 resolved: no pause needed).

### Per-file
- **imageWriteGuard.ts**: `isForbiddenImageSrc(value)` → true for `data:image/` and `blob:` prefixes.
  Pure, dependency-free (no fetch/store), non-string returns false.
- **contentActions.ts**: added guard immediately after the EDITOR_DEBUG block in `updateElementContent`.
  Guards STRING values only (`typeof content === 'string'`) — arrays / nested-collection non-string
  paths untouched. Forbidden value → `console.warn` in dev (`NODE_ENV !== 'production'`) / silent
  no-op in prod, returns without mutating (old value preserved, not marked dirty).
- **formsImageActions.ts**: new `uploadImageFromObjectUrl(objectUrl, targetElement)` — `fetch(url)` →
  `blob()` → `new File(...)` → delegates to existing `uploadImage(file, targetElement)` (which owns
  FormData + `tokenId` + writes permanent URL via updateElementContent + full save). No new token-less
  `/api/upload-image` fetch was added.
- **ImageToolbar.tsx**: `handleImageEditorSave` is now async; forbidden src → adapter with
  `isUploading` spinner + `uploadError` toast (both pre-existing UI), keeps old value on failure;
  non-forbidden src → direct `updateElementContent` (https passthrough). Stock-photo path unchanged.

### Deviations
- **Did NOT touch `src/types/store/actions.ts`** (out of Files-touched). The new `uploadImageFromObjectUrl`
  is therefore not declared on the `FormsImageActions` interface. `formsImageActions.ts` returns
  `as unknown as FormsImageActions`, so the extra method compiles there; ImageToolbar accesses it via a
  typed cast off the store instance (`(store as any).uploadImageFromObjectUrl`). Conservative choice to
  stay in scope — a follow-up may add the type declaration. tsc is green regardless.
- `isImageValue` in `aiActions.ts:84-89` intentionally LEFT UNCHANGED (read-side preserve-during-regen;
  existing base64 projects must keep rendering/regenerating).

### Verification
- `npx tsc --noEmit`: green.
- `npm run test:run`: green — 128 files passed / 1 skipped; 2016 passed / 3 skipped. New file
  `imageWriteGuard.test.ts` = 9/9 passing.
- Manual dev browser upload NOT run (per instructions; adapter delegation covered by mocked unit test).

### Open risks
- The type-declaration gap (deviation above) means callers get no compile-time signature for
  `uploadImageFromObjectUrl`; only ImageToolbar uses it and does so via cast. Low risk.

## Phase 3 — PILOT: techpremium img attrs (both renderers)

**Files changed** (all under `src/modules/templates/techpremium/blocks/`)
- `Hero/TechPremiumHero.tsx` + `Hero/TechPremiumHero.published.tsx`
- `Header/TechPremiumNav.tsx` + `Header/TechPremiumNav.published.tsx`
- `Footer/TechPremiumFooter.tsx` + `Footer/TechPremiumFooter.published.tsx`
- `Trust/TechPremiumTrust.tsx` + `Trust/TechPremiumTrust.published.tsx`
- `Explainer/TechPremiumExplainer.tsx` + `Explainer/TechPremiumExplainer.published.tsx`
- `Gallery/TechPremiumGallery.tsx` + `Gallery/TechPremiumGallery.published.tsx`
- `GalleryPreview/TechPremiumGalleryPreview.tsx` + `GalleryPreview/TechPremiumGalleryPreview.published.tsx`
- `Lineup/TechPremiumLineup.tsx` + `Lineup/TechPremiumLineup.published.tsx`
- `Catalog/TechPremiumCatalog.tsx` + `Catalog/TechPremiumCatalog.published.tsx`
- `ProductDetail/TechPremiumProductDetail.tsx` + `ProductDetail/TechPremiumProductDetail.published.tsx`

No CSS/styles files were modified (no aspect-ratio additions needed — see per-block table).

### What changed — per block

Attribute sets are IDENTICAL between each `.tsx` (edit) and its `.published.tsx` (published) sibling. Only `loading` + `decoding` attrs were added; `src`/`alt`/`className` and all layout/markup unchanged.

| Block | img(s) | attrs added | aspect-ratio wrapper |
|-------|--------|-------------|----------------------|
| Hero | `.tp-hero__photo` (LCP) | `loading="eager" decoding="async"` | `.tp-ph--unit` aspect-ratio:4/4.4 — pre-existing (unchanged, eager) |
| Header/Nav | `.tp-brand__img` (above-fold logo) | `loading="eager" decoding="async"` | fixed logo size — n/a (eager) |
| Footer | `.tp-footer__img` (logo) | `loading="lazy" decoding="async"` | `.tp-footer__img { height:32px }` fixed height — pre-existing reservation |
| Trust | logo row img | `loading="lazy" decoding="async"` | `.tp-trust__logo img { height:60px }` fixed height — pre-existing reservation |
| Explainer | `.tp-ph` media img | `loading="lazy" decoding="async"` | `.tp-explain-media .tp-ph { aspect-ratio:4/3 }` — pre-existing |
| Gallery | `.tp-ph` grid img | `loading="lazy" decoding="async"` | `.tp-ggrid .tp-gitem .tp-ph { aspect-ratio:1/1 }` — pre-existing |
| GalleryPreview | `.tp-ph` masonry img | `loading="lazy" decoding="async"` | masonry (variable natural ratios) — NO aspect added (see Deviations) |
| Lineup | `.tp-pshot` img | `loading="lazy" decoding="async"` | `.tp-pshot { aspect-ratio:4/3 }` — pre-existing |
| Catalog | `.tp-pshot` img | `loading="lazy" decoding="async"` | `.tp-pshot { aspect-ratio:4/3 }` — pre-existing |
| ProductDetail | stage img | `loading="lazy" decoding="async"` | `.tp-pd-stage { aspect-ratio:4/3 }` — pre-existing |
| ProductDetail | thumb img | `loading="lazy" decoding="async"` | `.tp-pd-thumb { aspect-ratio:1/1 }` — pre-existing |
| ProductDetail | related img | `loading="lazy" decoding="async"` | `.tp-pshot { aspect-ratio:4/3 }` — pre-existing |

All 12 `<img>` sites (2 eager + 10 lazy; ProductDetail carries 3) covered. Grep of the
techpremium block dirs confirmed no additional `<img>` beyond those listed. Edit/published
attribute parity confirmed for every pair.

### Deviations

- **GalleryPreview masonry — no aspect-ratio added (in-scope judgment call).** The
  GalleryPreview grid is CSS `column-count` masonry (`.tp-masonry`), where each `.tp-ph`
  intentionally renders at the image's *natural, variable* aspect ratio (that is the whole
  point of masonry). There is no single "current rendered ratio" to reserve; forcing a fixed
  `aspect-ratio` on `.tp-ph` would crop/reshape every tile — a real VISUAL change, which the
  phase forbids. Masonry already reflows as images load today (pre-change), independent of the
  `loading` attr; `loading="lazy"` only shifts *when* that load happens, not whether reflow
  occurs. Per the conservative rule I kept the lazy attr (explicitly required by the plan) and
  did NOT fabricate an aspect-ratio. Net: no visual change; no NEW layout-shift character
  beyond what masonry already has. (The full `Gallery` block, by contrast, uses a fixed
  `.tp-ggrid` 1/1 grid and IS reserved.)
- Note: ProductDetail's first stage image is set lazy per the explicit plan list (all
  ProductDetail imgs lazy). On a standalone product-detail subpage this stage image could be
  near-top; the plan intentionally treats ProductDetail as below-fold, so I followed it.

### Verification
- `npx tsc --noEmit` — GREEN (no output).
- `npm run build` — GREEN (buildPublishedCSS + buildAssets + next build all completed; full
  route table emitted). Published CSS/assets recompiled so editor/published parity is trustworthy.
- Editor↔published `<img>` attribute sets confirmed identical for all 10 block pairs.
- Lighthouse/LCP + visual-parity gate deferred to orchestrator/human per phase instructions (not run here).

### Open risks
- Minor CLS possible on the GalleryPreview masonry grid on scroll (below-fold), unchanged in
  character from pre-existing masonry behavior — flagged above for the human parity/LCP gate.

## Phase 4 — sweep: meridian + surge + shared blog blocks

**Files changed**
- src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.tsx
- src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.published.tsx
- src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx
- src/modules/templates/meridian/blocks/Header/MeridianNavHeader.published.tsx
- src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx
- src/modules/templates/surge/blocks/Header/WarmNavHeader.published.tsx
- src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx
- src/modules/templates/surge/blocks/Footer/ContactFooterRich.published.tsx
- src/modules/templates/shared/blog/BlogPostBodyBlock.tsx
- src/modules/templates/shared/blog/BlogIndexBlock.tsx

**Per-block changes (attrs only, no markup/layout/CSS changes):**

| Block | img | eager/lazy | decoding | reservation | parity |
|-------|-----|-----------|----------|-------------|--------|
| meridian EditorialPhotoHero (hero_image, LCP) | :161 / pub:69 | eager (added) | async (added) | pre-existing wrapper; eager so N/A | edit+published identical |
| meridian MeridianNavHeader (logo_image) | :116 / pub:59 | eager (added) | async (added) | above-fold logo, eager | edit+published identical |
| surge WarmNavHeader (logo_image) | :94 / pub:48 | eager (added) | async (added) | above-fold logo, eager | edit+published identical |
| surge ContactFooterRich (logo_image, below-fold) | :124 / pub:53 | lazy (added) | async (added) | .sg-footer__img fixed height:30px reserves space (pre-existing) | edit+published identical |
| shared BlogPostBodyBlock (heroImage) | :67 | lazy (pre-existing, kept) | async (added) | pre-existing (was already lazy) | single-file (no .published.tsx) |
| shared BlogIndexBlock (heroImage) | :41 | lazy (pre-existing, kept) | async (added) | pre-existing (was already lazy) | single-file (no .published.tsx) |

**Blog block .published.tsx check:** Verified on disk — `src/modules/templates/shared/blog/` contains ONLY `BlogIndexBlock.tsx` and `BlogPostBodyBlock.tsx`. No `.published.tsx` pair exists for either; single file covers both render paths. Decoding added; existing `loading="lazy"` preserved.

**Aspect-ratio:** No `aspect-ratio` additions needed. Only newly-lazied img is the surge footer logo, whose `.sg-footer__img` CSS already fixes `height: 30px` (space reserved). Both blog imgs were already lazy pre-change (reservation pre-existing, unchanged). Eager images (heroes, nav logos) load immediately so need no reservation. `styles.ts` untouched (out of scope, and unneeded).

**Deviations from plan:** None.

**Test results:**
- `npx tsc --noEmit` — green (no output).
- `npm run build` — green (full build incl. published CSS/assets recompile completed, route table printed).

**Open risks:** None. Attrs-only changes, edit/published parity confirmed identical for every pair, layout/CSS unchanged.
