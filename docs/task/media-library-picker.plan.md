# media-library-picker — implementation plan (rev 3, post plan-review round 2)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\media-library-picker`
- **Branch:** `feature/media-library-picker` (verify `git branch --show-current` before every phase; hard-stop on mismatch, never checkout/switch)
- **Spec:** `docs/task/media-library-picker.spec.md` (tier: full)
- **E2 shape sources:** `docs/task/work-onboarding-shell.spec.md`, `docs/tracks/workEndtoEnd.md` §2 (E2 ingestion is NOT built — shape confirmed against docs, not code)

## Overview

Ship a per-project **`MediaAsset` registry** (Prisma), a **shared image-pipeline module** (sharp resize→WebP + blur placeholder + shared blob/dev-fs storage, Buffer-in so E2's scrape path can reuse it), server-side registry writes in `/api/upload-image` + `/api/proxy-image` (the seam — zero editor-store changes; every upload entry point inherits rows for free), token-scoped `/api/media` routes, and a **media picker modal** (Library/Upload + Stock tabs) that the existing `ImageToolbar` **Replace** action opens (old bare file-input + `StockPhotosPanel` retired — with the panel's **template-aware stock search carried forward**, not dropped). t8 storage manager, other image entry points (logo/avatar/collection/SEO-OG), Unsplash, From-CMS depth, and the MediaGroup entity are all deferred.

**Baked-in rulings (do not re-litigate during implementation):**
1. `ui-foundation` is NOT on this branch (held for big-bang deploy) → build on existing `src/components/ui/` primitives (dialog/button/input). **Logged deviation** from spec line "Built on ui-foundation primitives".
2. Do NOT refactor `upload-image` onto `assertProjectOwner` (it admits demo token + orphan-claiming = behavior change on a live path). Inline check stays; duplication logged as debt below.
3. MediaAsset creation costs **0 credits** (storage/DB, not LLM).
4. Registry writes from the two ROUTES are **best-effort/non-throwing** — an upload never fails because the row failed; `bulkUploadImages`' never-throws contract preserved (we don't touch it at all). **Scope note:** ruling 4 constrains the routes, NOT the registry module's API — the module also exports a strict throwing variant for E2, where the row IS the deliverable (`workEndtoEnd.md` §8a "never lose her work").
5. SVG gets an **explicit branch** in the pipeline (stored as-is today, no sharp processing).
6. Stock picks go through `/api/proxy-image` (blob copy), never hotlink `photos[].url`. The store's `searchStockPhotos` is a hardcoded MOCK — do not use it; call `/api/images/search` directly.
7. `/api/images/search` has NO mock mode (503 without `PEXELS_API_KEY`, live Pexels, `withFormRateLimit`); `NEXT_PUBLIC_USE_MOCK_GPT` does not touch it → e2e must never hit it live. Stock e2e = Playwright `page.route()` interception only.
8. The picker's Stock tab **carries forward `StockPhotosPanel`'s template-aware behaviors** (palette-enriched queries, category buttons, curated-on-mount) — see phase 4. Repo lesson: field drops cause silent semantic regressions tests miss — "grep all readers, re-point don't delete".

## Progress log

- phase 1 MediaAsset model + migration: **done** (commit `130f22cd`, review loops 1, verdict `ship`). Gate CLEARED by founder: `curationSignal` EXCLUDED · `checksum` + `@@index([projectId, checksum])` INCLUDED (store-only v1) · `groupId`/`sortOrder`/`selected` ALL INCLUDED · DB target confirmed DEV (`ep-nameless-thunder-a2lj1s9v`). Migration `20260716164706_media_asset` applied to dev, additive-only, safe for `migrate deploy` on prod. Compound-unique input is `tokenId_url`. NOTE for later phases: `updatedAt` is `@updatedAt`, so the cache-hit `update:{hiddenAt:null}` arm bumps it — use `createdAt` for "first seen" ordering.
- phase 2 shared pipeline + registry seam in upload/proxy routes: **done** (commit `67c4a0d7`, review loops 1, verdict `ship`). `pipeline.ts` (processImage Buffer-in + storeImage) + `registry.ts` (strict `recordMediaAsset` for E2 / `recordMediaAssetBestEffort` for routes). Both routes rewired; zero store changes; no new dep. tsc 1 known error, tests 196 files/3357. Proxy cacheKey verified byte-identical post-extraction (cache still hits). `userId` = **Clerk id** (SocialPost idiom) — verified consistent both routes. Fixed latent bug: malformed SVG used to orphan a live blob then 500 *after* upload succeeded.
  - **Carried to phase 3 (orchestrator ruling):** add `storeImage` unit coverage (mock `@vercel/blob`) — reviewer flagged it as untested, and blob-key drift there silently kills the proxy cache with no failing test. Also: `proxy-image:149` passes a hardcoded `'image/webp'` mime that is a lie (Pexels source is usually JPEG); harmless today (raster path ignores it) — pass `undefined` instead.
  - **Phase 4 constraints from audit:** dev-fs rows store *relative* `/uploads/{token}/{file}` URLs (grid must handle relative AND absolute); `blurDataUrl` is null for SVG + cache-hit backfill rows (grid needs a null fallback); `assetId` is now on the upload response if the picker wants to skip a refetch.
- phase 3 /api/media routes + ownership e2e: **done** (commit `dda96051`, review loops 1, verdict `ship`). GET/DELETE(soft-hide)/POST(restore+alt, no create) all gated via `assertProjectOwner`; `tokenId` in both mutating WHEREs (verified — no id-only mutation). e2e/media.spec.ts = **7 passed** (1 setup + 6 authed), both spec regexes registered. Folded-in `storeImage` coverage + proxy-image mime fix done. **tsc now 0 errors** (the `founder.jpg` one vanished once gitignored `next-env.d.ts` got generated — expected, strictly better). test:run 196 files/3360.
  - **Deviation 1 (logged):** anonymous → **404 not 401** — `/api/media` isn't in `isPublicRoute`, so Clerk `auth.protect()` rejects before the handler. Assertion is `[401, 404]`; reviewer verified this is honest, not loosened: `gate()` checks `!clerkId → 401` BEFORE `assertProjectOwner` (which short-circuits on the demo token *before* its own clerkId check), so anonymous is closed by two independent gates.
  - **PHASE 4 MUST DO — e2e port:** ports 3000-3004 are held by other worktrees' dev servers; with `reuseExistingServer:true` a default run tests the WRONG code. Only `PORT=3021 E2E_PORT=3021` together work today (`playwright.config.ts:15` reads `E2E_PORT`, but `webServer.env` `:78-82` doesn't forward `PORT`). **Fix in config: add `PORT: String(PORT)` to `webServer.env`** so `E2E_PORT` alone suffices. (Not false-greening today only because these specs assert positive behavior — `expect(res.ok())` fails loudly against a server without `/api/media`.)
  - Nits carried: anonymous test uses a fake token (`some-token`) so "no auth" and "token doesn't exist" are conflated in the 404 arm; `test.skip(!token,…)` is a soft-green vector if `/api/start` breaks (visible as a skip count, but `expect(token).toBeTruthy()` would fail honestly).
  - Inherited house behavior (conscious, not a defect): demo token + orphan projects let any authed caller list/hide/restore that project's media — same as `brief`.
- phase 4 media picker UI wired into ImageToolbar Replace: **done** (commit `ccfdbeb1`, review loops 2 — 1× `fix first` → fixed → verified, verdict `ship`). MediaPickerModal + Replace re-pointed; `StockPhotosPanel` (~320 lines) + `handleStockPhotos` + `handleFileUpload` retired. **Ruling 8 verified line-by-line**: guard shape exact, `|| 'hearth'` verbatim, 6 categories, curated-on-mount, `useShallow`; modal is now the SOLE `getServiceImageQuery` UI consumer, no orphaned imports. Zero store diff. **FULL GATE GREEN:** tsc 0 · test:run 196 files/3360 · lint 0 new errors · **build exit 0** · media-picker e2e 3 passed (2 real tests) · media.spec **6/6 in the full suite, 0 did not run**.
  - **Blocker found+fixed (was ours, not pre-existing):** `media.spec.ts` used the `request` fixture, whose storageState-pinned Clerk JWT goes stale in a long run → 401 at *authentication* → and because the file is `mode:'serial'`, the first failure **aborted 5 more tests** (all ownership 403/404/400 coverage silently evaporated in every full-suite run). Now `page.request` (shares the browser context, Clerk keeps `__session` live). Proof it was staleness not an authz bug: `media-picker.spec.ts` does the identical upload to the same route in the same long run via `page.request` and passes. The unauth describe deliberately KEEPS the bare `request` fixture (empty storageState) — a `warmUpSession` doc comment guards it from being "fixed".
  - **Deviation (reviewer-approved):** `handleFileUpload` deleted, not left functional — unreachable once Replace points at the picker; a second upload path contradicts "no two implementations". Client-side type/size check dropped with it, but `upload-image/route.ts:11,55,63` enforces the identical `ALLOWED_TYPES` + 10MB server-side. The old forced `save()` is gone → plain autosave, proven by the Library test (saveDraft POST carries the URL, 200, survives `page.reload()`).
  - **Improvements over the retired panel:** stock is now proxy-only (the old optimistic `downloadUrl` **hotlink window is gone**); ruling 6 is stricter than before.
  - **Known non-blockers:** StockTab remounts on tab switch (Radix unmounts inactive TabsContent) → re-fires curated-on-mount + resets search box; no debounce on stock search (carried verbatim from the old panel, but now points at a rate-limited live Pexels route); `showUploader` dead state in ImageToolbar (pre-existing).
  - ⚠️ **`publish.spec.ts` Hearth is genuinely flaky** (`pub?.status()` undefined at `:63`) — failed both of the implementer's full runs, passed the reviewer's. PRE-EXISTING, unrelated to this feature (touches no publish/renderer path), but it will intermittently red the suite on a no-CI/push-to-main workflow. **Wants its own triage.**
  - Durable-fix idea (out of scope): the `request` fixture stays stale-session-prone for any FUTURE authed spec; only a doc comment guards it. A lint rule would be the real fix.

---

## Phase 1 — `MediaAsset` model + migration  **[HUMAN GATE — mandatory]**

**Goal:** land the E2-shared spine schema. This phase carries BOTH mandatory gates: (a) the Prisma migration, (b) the MediaAsset-shape sign-off incl. the two ballot fields below. Founder reviews the shape, rules on the ballot, then authorizes `migrate dev`.

**Files touched:**
- `prisma/schema.prisma` (new `MediaAsset` model + `MediaSource` enum + `mediaAssets MediaAsset[]` back-relation on `Project`)
- `prisma/migrations/<timestamp>_media_asset/migration.sql` (generated by `migrate dev`, committed)

**Proposed shape** (mimics `SocialPost` at `prisma/schema.prisma:252-266`: bare Clerk `userId` no-relation, `projectId` + cascade relation, `tokenId` as route key to skip a lookup):

```prisma
enum MediaSource {
  upload
  stock
  scrape
}

model MediaAsset {
  id          String      @id @default(cuid())
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tokenId     String
  userId      String      // Clerk id, no @relation (SocialPost pattern)
  url         String      // OUR blob URL (or dev-fallback relative URL)
  source      MediaSource
  sourceUrl   String?     // origin URL: Pexels src.large / scraped page URL; distinct from url — hotlinks rot, published pages are static snapshots. Nullable: unknown on proxy cache-hit backfill.
  width       Int?        // nullable: SVG may not yield dims; unknown on cache-hit backfill
  height      Int?
  bytes       Int         // NON-NULL, always obtainable: processed-buffer length on the normal path, blobs[0].size on the proxy cache-hit path
  format      String      // 'webp' | 'svg' (pipeline output format)
  blurDataUrl String?     // base64 webp micro-thumb; null for SVG and for cache-hit backfill
  checksum    String?     // GATE BALLOT — sha256 of processed buffer; see below
  alt         String?
  hiddenAt    DateTime?   // soft-delete — workEndtoEnd v1 promise: "photos are hidden, never destroyed — restorable anytime"
  // E2-forward nullable/defaulted scalars — see honest framing below (MediaGroup MODEL itself lands with E2 — not built here):
  groupId     String?
  sortOrder   Int         @default(0)
  selected    Boolean     @default(true) // picker uploads are deliberate → default true; E2 curation (~150 in → ~30 used) flips to false for rejects
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([tokenId, url])              // REQUIRED by phase 2: proxy cache-hit dedupe uses prisma upsert, which needs a unique input
  @@index([tokenId, createdAt])
  @@index([projectId])
  @@index([groupId])
  @@index([projectId, checksum])        // only if checksum ballots IN
}
```

**Why `@@unique([tokenId, url])` is safe:** upload filenames carry `timestamp-nanoid` (globally unique per write), proxy blob keys are `uploads/{tokenId}/pexels-{id}.webp` (unique per token+photo), dev-fallback relative URLs embed the same token+filename. Collisions on `(tokenId, url)` can only mean "same asset re-registered" — exactly what the constraint must collapse. Without it, Prisma `upsert` on `(tokenId, url)` does not compile.

**Explicitly NOT added:** usage refs / folderId (t8), tags, caption, aiScore column, video fields.

**GATE BALLOT — two fields, founder rules on each; do not silently decide:**

1. **`curationSignal Json?` — planner lean: EXCLUDE.**
   - Include: E2's 3-tier curation (user signals > technical filter > AI taste) gets a home with zero future migration; Json = shape-flexible while E2 is undesigned.
   - Exclude: no consumer exists; E2 may want structured columns instead (Json is unqueryable for ordering); adding a nullable Json later is a trivial additive migration.
2. **`checksum String?` (+ `@@index([projectId, checksum])`) — planner lean: INCLUDE.** Two concrete named consumers:
   - `workEndtoEnd.md` §2's technical filter "kills near-duplicate frames" at ~150-image ingestion — exact-dupe kill needs a checksum, and backfilling one later means re-downloading every blob.
   - The picker's own dupe problem TODAY: same file uploaded twice → new `timestamp-nanoid` filename → two blobs, two rows, two identical library tiles. v1 scope = **store the checksum only** (computed in the pipeline, ~free via `crypto.createHash`); dupe-collapse UX (skip-create or tile grouping) is a fast-follow that becomes possible only if the column exists.

**Honest framing on `groupId` / `sortOrder` / `selected`:** all three are nullable-or-defaulted scalars — adding them LATER is *exactly* as cheap as adding `curationSignal` later (one additive migration, no backfill). Keeping them now is a coin-flip taste call ("schema states its E2 intent" vs "no dead columns"), NOT a migration-cost argument. Planner keeps them for intent-legibility; founder may strike any/all at the gate at zero cost either way.

**Steps:**
1. Present shape + the two-field ballot + coin-flip framing at the gate; get sign-off (adjust per ruling).
2. Edit `prisma/schema.prisma` per approved shape.
3. **MIGRATION SAFETY:** there is NO `DIRECT_URL`/shadow split — single `DATABASE_URL`, and BOTH Neon dev and prod URLs live in `.env`. **Verify `DATABASE_URL` points at DEV** before running anything.
4. `npx prisma migrate dev --name media_asset` (NEVER `db push`). Commit schema + migration dir together.

**Verification:**
- `npx prisma migrate status` clean; migration dir exists alongside latest `20260712120000_pricing_v2_ltd_pool`.
- `npx tsc --noEmit` green (client regenerated by migrate dev). Note: fresh worktree shows 1 pre-existing error (`src/app/page.tsx` founder.jpg) until first `next build` generates `next-env.d.ts` — NOT real, don't chase.
- `npm run test:run` green (no runtime code changed yet).

---

## Phase 2 — Shared image pipeline + storage + registry writes in upload/proxy routes

**Goal:** extract the twice-duplicated sharp processing (MAX_WIDTH=2400 / WEBP_QUALITY=85) AND the twice-duplicated storage logic (blob `put()` + dev-filesystem fallback, `upload-image/route.ts:137-178` ≈ `proxy-image/route.ts:139-173`) into one Buffer-in module, add the blur placeholder (sharp-only, NO new dep: tiny resize → webp → base64), then write `MediaAsset` rows server-side in both routes. Zero editor-store changes — bulk/toolbar/logo/SEO/objectURL entry points inherit registry rows through the routes.

**Files touched:**
- `src/lib/media/pipeline.ts` (new — shared constants; `processImage(buffer, mime)` → `{ buffer, width, height, bytes, format, blurDataUrl, checksum? }` (checksum = sha256 of processed buffer, only if ballot IN); explicit SVG branch: passthrough bytes, `format:'svg'`, dims best-effort via `sharp().metadata()` in try/catch, `blurDataUrl:null`; **plus `storeImage(buffer, { tokenId, filename, contentType })` → `{ url, storage: 'blob' | 'dev-fs' }`** — the `put()` + dev-filesystem-fallback logic lifted verbatim from the two routes so E2's scrape path is NOT a third copy)
- `src/lib/media/registry.ts` (new — **two exports**: `recordMediaAsset(...)` STRICT, throws on failure, returns `assetId` — this is E2's entry point where the row IS the deliverable; and `recordMediaAssetBestEffort(...)` thin wrapper: try/catch around the strict fn, logs, NEVER throws, returns `assetId | null` — this is what the two routes call, per ruling 4)
- `src/lib/media/pipeline.test.ts` (new — vitest unit: processing/storage cases)
- `src/lib/media/registry.test.ts` (new — vitest unit: strict-throws / best-effort-swallows / upsert-mode cases, mocked prisma)
- `src/app/api/upload-image/route.ts` (call `processImage` + `storeImage` instead of inline sharp/put/fs; then `recordMediaAssetBestEffort` with `source:'upload'`; add optional `assetId` + `blurDataUrl` to response `metadata`; dev fallback path records a row with the relative URL — handled inside `storeImage`)
- `src/app/api/proxy-image/route.ts` (same rewiring for the MISS path: `processImage` + `storeImage` + `recordMediaAssetBestEffort` with `source:'stock'`, `sourceUrl` = Pexels `src.large`, full metadata — **plus the explicit CACHE-HIT branch below**)

**Proxy cache-hit branch (`route.ts:61-70`) — specified, not hand-waved.** The early return fires BEFORE any Pexels fetch, so `sourceUrl`/`width`/`height`/`blurDataUrl` are unobtainable there. Chosen approach: **partial-row backfill, no Pexels call** (reviewer option b, refined):
- On hit, call `recordMediaAssetBestEffort` in **upsert mode**: `prisma.mediaAsset.upsert({ where: { tokenId_url: { tokenId, url: blobs[0].url } }, update: { hiddenAt: null }, create: {...} })` — legal only because of phase 1's `@@unique([tokenId, url])`.
- **Why `update: { hiddenAt: null }`, not `update: {}`:** re-picking an asset is an explicit "I want this on my page" — a previously hidden stock photo that lands on the page must reappear in the library. With `update: {}`, hide → re-pick would leave the asset live on the page but invisible in the library (resurrection bug).
- The `create` payload is a **partial row**: `url` = `blobs[0].url`, `bytes` = **`blobs[0].size`** (this is why `bytes` stays NON-NULL — it is always available), `format:'webp'` (proxy always emits webp), `source:'stock'`, `sourceUrl`/`width`/`height`/`blurDataUrl`/`checksum` = null (all nullable by schema design).
- **Why not option (a) (always fetch Pexels metadata first):** the cache exists precisely to avoid Pexels calls — option (a) reintroduces rate-limit exposure (429s) + latency on every repeat pick for zero user value. And partial rows are RARE by construction: post-phase-2, the miss path writes the full row on first proxy, so the cache-hit `create` only ever fires as backfill for pre-feature blobs; every subsequent hit is an un-hide-only `update`.

**Constraints honored:** upload-image's inline ownership check untouched (ruling 2); no behavior change to accepted types / caps / blob keys (`uploads/${tokenId}/…`, distinct from publish `pages/…`); response shape only extended, never narrowed — `uploadImage`/`bulkUploadImages` store actions and `EditableImageCollection`'s empty `catch{}` keep working unmodified. `src/lib/testimonials/photo.ts` (3rd sharp user) NOT migrated — logged as debt.

**E2 seam (document in module JSDoc — this is the "shared spine" spec criterion, now fully met):** E2's scrape ingestion is server-side and imports the module directly: `processImage(buffer)` → `storeImage(buffer, …)` → **strict** `recordMediaAsset({source:'scrape', sourceUrl})` (throws → E2 surfaces the failure instead of silently losing a photo, per §8a). Buffer entry point exists precisely because `upload-image` only takes multipart `File`; `storeImage` exists so E2 doesn't re-implement blob/dev-fs. Scraped URLs are copied to blob, `sourceUrl` keeps origin.

**Steps:**
1. Build `pipeline.ts` (move constants; raster path = existing `resize(2400,null,{withoutEnlargement,fit:'inside'}).webp({quality:85})`; blur = `resize(16)` → webp → `data:image/webp;base64,…`; SVG branch; checksum per ballot; `storeImage` lifted from the two routes).
2. Build `registry.ts` (strict `recordMediaAsset` + `recordMediaAssetBestEffort` wrapper; upsert mode for the cache-hit caller, `update: { hiddenAt: null }`).
3. Rewire both routes onto pipeline + storage + best-effort registry; add the proxy cache-hit upsert branch; keep dev fallback working.
4. Unit tests — `pipeline.test.ts`: raster resized + blur prefix `data:image/webp;base64,`; oversize clamped to 2400; SVG passthrough w/ null blur; checksum stable for identical buffers (if ballot IN). `registry.test.ts` (mock prisma): strict variant THROWS on DB error while best-effort wrapper swallows + returns null; upsert mode targets `tokenId_url` and sets `hiddenAt: null` on the update arm.

**Verification:**
- `npx tsc --noEmit`, `npm run test:run`, `npm run lint` green.
- Manual (dev server): upload an image via editor toolbar → blob/`public/uploads/` file appears AND `MediaAsset` row exists (check via `npx prisma studio`); pick a stock photo → full row with `source:'stock'` + `sourceUrl`; pick the SAME stock photo again → cache hit, still exactly ONE row (upsert no-dup); hide that row (set `hiddenAt` manually or via phase-3 DELETE once it exists) → re-pick → `hiddenAt` back to null.

---

## Phase 3 — `/api/media` routes + ownership e2e

**Goal:** token-scoped list + soft-delete/restore for the registry — what the picker (phase 4) and E2 read.

**Files touched:**
- `src/app/api/media/route.ts` (new — `export const dynamic='force-dynamic'`; single file, `brief/route.ts` precedent: **GET** list via `?tokenId=` searchParam + `validateToken`, excludes `hiddenAt != null` unless `?includeHidden=1`, ordered `createdAt desc`; **DELETE** soft-delete = set `hiddenAt` (blob NOT deleted — v1 "never destroyed" promise); **POST** restore = clear `hiddenAt` and/or update `alt`. No create via POST — creation happens only through the upload/proxy seam (server-side callers like E2 import `src/lib/media/registry.ts` directly); note this in a route comment.)
- `src/lib/schemas/media.schema.ts` (new — Zod bodies for DELETE/POST; `<name>.schema.ts` house convention per `brief.schema.ts`/`copy.schema.ts`/`workFacts.schema.ts`)
- `e2e/media.spec.ts` (new — authed Playwright, `auth.setup.ts`/`publish.spec.ts` Clerk-session precedent)
- `playwright.config.ts` (**register the new specs — MANDATORY**: `playwright.config.ts:52-56` warns in-file that "a spec only runs if it is listed HERE — an unregistered spec silently matches no project and gives false confidence". Add `/media\.spec\.ts/` AND **pre-register** `/media-picker\.spec\.ts/` (phase 4's spec) to the `authed` project's `testMatch` — the same file documents that listing a not-yet-existing file is harmless, per the dashboard-workspace-ia precedent.)

**Auth pattern (verbatim per scout):** `auth()` → 401 no clerkId → validate tokenId → `assertProjectOwner(clerkId, tokenId, {action})` → `if (!access.ok) return createSecureResponse({error: access.error}, access.status)` (discriminated union, never throws). No invented CSRF gate; 0 credits.

**Steps:**
1. Zod schemas (`{tokenId, assetId}` for DELETE; `{tokenId, assetId, restore?, alt?}` for POST) in `media.schema.ts`.
2. Route with the three methods; `createSecureResponse` everywhere.
3. Register both spec regexes in `playwright.config.ts` `authed.testMatch`.
4. e2e spec (deterministic-QA rule): authed request-context flow — upload via `/api/upload-image` (multipart fixture) → GET `/api/media` lists the row incl. `blurDataUrl` (**registry-row-on-upload check**) → DELETE hides it → GET no longer lists → POST restores. Negative: no session → 401; wrong/foreign token → 403/404 per `assertProjectOwner`.
5. **Cleanup discipline:** dev-fallback uploads write REAL files to `public/uploads/<token>/` + rows to the dev DB every run. Spec must `afterAll`: DELETE-hide is not enough — hard-delete the created `MediaAsset` rows via prisma (test-only) and `fs.rm` the `public/uploads/<test-token>/` dir, so repeated runs don't litter the worktree/DB.

**Verification:**
- `npx tsc --noEmit`, `npm run test:run`, `npm run lint` green.
- `npm run test:e2e` — `media.spec.ts` passes locally **and shows a non-zero test count for the `authed` project** (guards against the silent-no-match trap).

---

## Phase 4 — Media picker UI wired into ImageToolbar Replace

**Goal:** the t7 picker — one Radix Dialog modal, tabs **Library/Upload** (project assets grid from GET `/api/media` + drop-zone/file-input posting to `/api/upload-image`) and **Stock** (Pexels via POST `/api/images/search`, pick → POST `/api/proxy-image` → our blob URL — **carrying `StockPhotosPanel`'s template-aware search behaviors forward**, see below). "From CMS" tab stubbed/hidden. On pick → `replaceImage(sectionId, elementKey, url)` (undo-friendly setter at `formsImageActions.ts:524-543`).

**Re-point, don't add (one implementation, not two):**
- The existing **`replace-image` action (`ImageToolbar.tsx:270-292`)** stops creating a bare dynamic `<input type=file>` and instead **opens the picker** (Library/Upload tab default). No new "Choose from library" action.
- The existing **`stock-photos` action (:293-298)** is re-pointed to open the SAME picker on the Stock tab; `handleStockPhotos` (:221-227), the `showStockPhotos` state (:28), and the in-file **`StockPhotosPanel` (:477+) are retired/absorbed** — the picker's Stock tab is their replacement, not a sibling, and it must be a FULL replacement (behavior parity below), not a bare search box.
- **`onPick(url)` MUST route through `parseTargetId(targetId)`** — `replaceImage` takes `(sectionId, elementKey, url)` but the toolbar only holds `targetId`; mirror `handleFileUpload`'s parse at `ImageToolbar.tsx:199` (invalid parse → surface error, no-op).
- **Post-replace write = `replaceImage`, full stop — no extra save call.** `replaceImage` already delegates to `updateElementContent` + pushes an undo entry; auto-save persistence picks the change up like any other content edit. (For the record: the retired panel called `updateElementContent` directly at `:391,403`, and `selectStockPhoto` is dead code with zero UI consumers — there is NO "post-replace save behavior" precedent to mirror. Don't invent one.)

**Stock tab behavior parity — MUST carry forward from `StockPhotosPanel` (field-drop lesson: "grep all readers, re-point don't delete"; `ImageToolbar` is the ONLY UI consumer of `getServiceImageQuery`, so dropping these here kills the feature platform-wide with no test to catch it):**
1. **Palette-aware query enrichment** (`ImageToolbar.tsx:15,484-500,554,601`): free-text searches send `getServiceImageQuery(query.trim(), undefined, palettePhrase)` where `palettePhrase = usesTemplateModule(audienceType, templateId) ? getLoadedTemplate(templateId)?.paletteImageKeywords?.[paletteId] : undefined`. Every template ships `PALETTE_IMAGE_KEYWORDS` (surfaced on the module contract at `registry.ts:25-169`; documented at `src/modules/templates/README.md:66` as "Optional `paletteId → phrase` map for editor image search"); live across all 8 templates + `atelier2` + `skeletons/work/skin.ts:57`. Silently dropping it degrades stock relevance everywhere.
2. **Six category buttons** — featured / business / tech / people / nature / lifestyle (`:587-632,684-704`): `featured` = `{searchType:'curated', per_page:12}`; the other five send `{searchType:<category>, query: getServiceImageQuery(category, undefined, palettePhrase), per_page:12}` — same enrichment.
3. **Curated-on-mount default** (`:509-540`): tab opens with `{searchType:'curated', per_page:12}` results, not an empty grid.

Implementation notes: identity fields read inside `MediaPickerModal` via a narrow `useShallow` selector for `{audienceType, templateId, paletteId}` — the exact pattern the panel uses today (`:484-490`). `MediaPickerModal` lives in the editor bundle, so importing `getLoadedTemplate` from `@/modules/templates/registry` is **firewall-legal** (same import the toolbar already makes; the module is preloaded by `EditablePageRenderer` before any toolbar opens — undefined phrase → helper omits the mood suffix, same graceful fallback as today).

**Files touched:**
- `src/app/edit/[token]/components/ui/MediaPickerModal.tsx` (new — modal-convention home per StyleBrowserModal/ElementToggleModal precedents; Radix `Dialog` from `@/components/ui/dialog`; existing-primitives-only per ruling 1; imports `getServiceImageQuery`, `getLoadedTemplate`, `usesTemplateModule` for the Stock tab parity above)
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` (re-point `replace-image` + `stock-photos` actions at the picker; remove `handleStockPhotos`/`showStockPhotos`/`StockPhotosPanel` and the now-unused enrichment imports IF fully migrated into the modal; local `open`+`tab` state owned by toolbar — NOT `useModalManager`; `handleFileUpload`/`handleImageEditor` paths left functional)
- `e2e/media-picker.spec.ts` (new — deterministic replace check; already registered in `playwright.config.ts` by phase 3)

**Constraints honored:**
- NO new store slices/state — local component state only; `useEditStore` with selectors only (bare call is lint-banned); actions via `useEditStore.getState()`/`useEditStoreApi()`.
- Do NOT touch `bulkUploadImages`, `EditableImageCollection`, `EditableLogo`, `AvatarEditableComponent`, `SimpleImageEditor`, or `SeoSettingsModal` (4th entry point, OG image) — all fast-follow; they already inherit registry rows via the phase-2 seam.
- Crop: SKIPPED ("if cheap" spec clause) — existing SimpleImageEditor path stays as-is next to the picker.
- No renderer/block edits → dual-renderer parity unaffected (image URL lives in content; both renderers already consume it).
- Stock tab hits `/api/images/search` + `/api/proxy-image` directly (never store `searchStockPhotos` mock, never hotlink `photos[].url`).

**Steps:**
1. Build `MediaPickerModal` (props: `open`, `onOpenChange`, `initialTab`, `tokenId`, `onPick(url)`): Library/Upload tab = asset grid (blur placeholder as loading bg, hidden assets excluded) + upload input → refresh grid → auto-pick; Stock tab = curated-on-mount grid + search box (palette-enriched queries) + the six category buttons (enriched) + Pexels attribution, pick → proxy-image spinner → `onPick(url)`; From-CMS tab hidden behind a `false` const with TODO.
2. Rewire `ImageToolbar` per "Re-point, don't add" above; `onPick` = `parseTargetId` → `replaceImage(...)` (no extra save); delete the dead panel + state.
3. e2e (**deterministic — NO live Pexels, per ruling 7**): authed editor at `/edit/[token]` → select image element →
   - **Library leg (real):** pre-upload an asset via `/api/upload-image`, open picker via Replace, pick the tile → image `src` in DOM changes to the picked URL; reload → persists.
   - **Stock leg (intercepted):** `page.route('**/api/images/search', …)` → fixture Pexels-shaped payload, **capturing each intercepted request body**; `page.route('**/api/proxy-image', …)` → `{success:true, url:<the pre-uploaded asset URL>}`. Assert: (a) tab-open fires a `{searchType:'curated'}` request (curated-on-mount); (b) typing a search fires a request whose `query` equals `getServiceImageQuery(<typed text>, undefined, <fixture project's palette phrase>)` — i.e. **enrichment demonstrably applied**, not the raw string (fixture project's `templateId`/`paletteId` are known, so the expected phrase is deterministic); (c) clicking a category button fires the enriched category query; (d) pick swaps the DOM `src`. The REAL Pexels→proxy→blob path is exercised by the phase-2 manual check and stays on the founder's manual pass below.
   - Same cleanup discipline as phase 3 (`afterAll` row + `public/uploads/<test-token>/` removal).

**Verification (full gates — pre-merge green per no-PR workflow):**
- `npx tsc --noEmit`, `npm run test:run`, `npm run lint`, `npm run build` (build:published-css → build:assets → next build) all green.
- `npm run test:e2e` — `media.spec.ts` + `media-picker.spec.ts` pass with non-zero test counts, including the enrichment-body assertions above.
- `getServiceImageQuery` grep check: after the panel is deleted, the picker modal is its (sole) UI consumer — the import moved, not dropped.
- Manual dev check (founder or implementer, real `PEXELS_API_KEY`): replace an image via each tab **including a real Stock search + pick**; confirm Stock tab opens pre-populated (curated), category buttons work, and results for a palette-bearing project visibly reflect the mood phrase (compare a query with/without template context if in doubt); verify editor AND `/preview/[token]` show the pick; confirm registry rows for both paths; repeat-pick same stock photo → single row.
- (Merge to main itself = human gate per branch rules — user merges + pushes.)

---

## Logged debt / deferred (do not fix in this feature)

- `upload-image` inline ownership check duplicates `assertProjectOwner` semantics (minus demo-token + orphan-claim) — intentional, ruling 2.
- `src/lib/testimonials/photo.ts:30` still uses its own sharp constants — migrate to `src/lib/media/pipeline.ts` in fast-follow.
- Store `searchStockPhotos` (`formsImageActions.ts:545`) returns hardcoded mocks — deletion candidate in fast-follow (its toolbar consumer `StockPhotosPanel` dies in phase 4). `selectStockPhoto` is likewise dead code (zero UI consumers) — same fast-follow deletion candidate.
- **Blob orphaning (t8):** `MediaAsset` cascades on `Project` delete but blobs are NOT deleted → orphaned blobs with no row. Pre-existing behavior (uploaded blobs already leak on project delete today), not a regression — t8 storage manager owns reconciliation/GC.
- Checksum dupe-collapse UX (skip-create / tile grouping on identical checksum) — fast-follow, only if ballot lands IN.
- Fast-follow entry points: `EditableImageCollection`, `EditableLogo`, `AvatarEditableComponent`, `SimpleImageEditor` crop output, `SeoSettingsModal.tsx:146` OG image (unlisted in spec; inherits registry via seam already).
- MediaGroup model + curation board, t8 storage manager, Unsplash, From-CMS depth → later slices (E2 / t8).

**Spec deviation log:**
1. Picker built on existing `src/components/ui/` primitives, NOT ui-foundation (held branch, ruling 1).
2. Picker's Upload tab posts single files to `/api/upload-image` directly, NOT via `bulkUploadImages` as spec lines 38-44/77-79 mandate. Justification: the phase-2 route seam yields registry rows for free regardless of caller; the picker's upload UX is single-file, so the bulk store action adds indirection for nothing; `bulkUploadImages` is deliberately untouched (ruling 4 preserves its never-throws contract) and keeps inheriting rows through the same seam.

## Unresolved questions (for founder, mostly at Phase-1 gate)

1. `curationSignal Json?` — in or out? (Lean: OUT; trivial to add later.)
2. `checksum String?` + index — in or out? (Lean: IN; two named consumers — E2 near-dup filter + picker dupe tiles; backfill later = re-download every blob.)
3. `groupId`/`sortOrder`/`selected` — keep for E2-intent legibility, or strike? Honest coin-flip: adding later is exactly as cheap as `curationSignal`.
4. `source` as Prisma enum (proposed) vs plain String — enum = type-safe; Neon PG supports `ALTER TYPE … ADD VALUE`, expect ~2 tiny additive migrations for Instagram/Google Drive per workEndtoEnd §2. OK?
5. DELETE = soft-hide only, blob never deleted (v1 "never destroyed") — storage cost acceptable until t8?
6. No POST-create on `/api/media` (creation via upload/proxy seam; E2 imports registry module server-side) — OK?
7. Library grid + upload as ONE tab (vs spec's bare "Upload" tab) — OK?
8. Stock e2e = intercepted (deterministic); REAL Pexels path covered only by manual pass — acceptable?
9. Upload tab bypasses `bulkUploadImages` (deviation #2 above) — OK, or want the store action wired anyway?
