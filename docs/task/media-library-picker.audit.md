# media-library-picker — implementation audit

## Phase 1 — `MediaAsset` model + migration

**Files changed**
- `prisma/schema.prisma` (modified)
- `prisma/migrations/20260716164706_media_asset/migration.sql` (created by `migrate dev`)
- `docs/task/media-library-picker.audit.md` (created — this file)

### `prisma/schema.prisma`

Two edits:

1. `model Project` — added the back-relation `mediaAssets MediaAsset[]` (last line of the relation block, after `outreachMessages`).
2. New `enum MediaSource { upload stock scrape }` + `model MediaAsset`, placed immediately after `SocialPost` (the model it mimics) and before `EmailSequence`.

Final shape (as landed):

```prisma
enum MediaSource { upload  stock  scrape }

model MediaAsset {
  id          String      @id @default(cuid())
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tokenId     String
  userId      String      // bare Clerk id, no @relation (SocialPost pattern)
  url         String
  source      MediaSource
  sourceUrl   String?
  width       Int?
  height      Int?
  bytes       Int         // NON-NULL
  format      String      // 'webp' | 'svg'
  blurDataUrl String?
  checksum    String?     // store-only in v1
  alt         String?
  hiddenAt    DateTime?   // soft-delete
  groupId     String?
  sortOrder   Int         @default(0)
  selected    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([tokenId, url])
  @@index([tokenId, createdAt])
  @@index([projectId])
  @@index([groupId])
  @@index([projectId, checksum])
}
```

Founder ballot rulings applied exactly:
- `curationSignal Json?` — **EXCLUDED** (not added).
- `checksum String?` — **INCLUDED** + `@@index([projectId, checksum])`; store-only, no dedupe UX.
- `groupId` / `sortOrder` / `selected` — **all three INCLUDED** (E2 spine). Nothing in this pilot writes them; schema comments say so explicitly.

Comment blocks record the load-bearing rationale so phases 2-4 don't re-derive it: bare-`userId` precedent, why `@@unique([tokenId, url])` exists (the phase-2 `upsert({ where: { tokenId_url } })`), why `bytes` is non-null, hiddenAt = "never destroyed" v1 promise, blob GC deferred to t8, and the `ALTER TYPE ... ADD VALUE` note for future enum members.

### Migration

Name: **`20260716164706_media_asset`** (house pattern, sits after `20260712120000_pricing_v2_ltd_pool`).

SQL generated: `CREATE TYPE "MediaSource"`, `CREATE TABLE "MediaAsset"`, 4 `CREATE INDEX`, 1 `CREATE UNIQUE INDEX` (`MediaAsset_tokenId_url_key`), 1 FK to `Project(id)` `ON DELETE CASCADE`. **Purely additive — no ALTER/DROP on any existing table, no data touched.**

Ran `npx prisma migrate dev --name media_asset` against `DATABASE_URL` → host `ep-nameless-thunder-a2lj1s9v` (the DEV DB, founder-confirmed). Applied cleanly with **no drift warning and no reset prompt** — worth noting given the known worktree/dev-DB drift history. `.env` untouched; the commented `ep-muddy-thunder-...-pooler` line untouched.

### Deviations

None. Shape matches the plan minus the excluded ballot field.

### Verification

| Gate | Result |
|---|---|
| `npx prisma migrate dev` | applied; `migration.sql` present, ready to commit |
| `npx prisma migrate status` | `30 migrations found` · **"Database schema is up to date!"** |
| `npx prisma generate` | ran as part of `migrate dev` — `✔ Generated Prisma Client (v6.8.2)` |
| `MediaAsset` on client | `typeof prisma.mediaAsset === 'object'`; `MediaSource = {upload, stock, scrape}` exported |
| `npx tsc --noEmit` | **1 error — the known pre-existing one** (`src/app/page.tsx(6,26)` … `@/assets/images/founder.jpg`, missing `next-env.d.ts`). Count unchanged; nothing new. |
| `npm run test:run` | **194 passed / 1 skipped (195 files); 3343 passed / 18 skipped** — unaffected, as expected for a schema-only phase |
| `npm run build` | not run — phase 4 owns the full gate, per instructions |

### Surprises / notes for the next phase

- Nothing surprising. Migration was clean on the first attempt.
- **Phase 2:** `tokenId_url` is the compound-unique input name Prisma generated — `upsert({ where: { tokenId_url: { tokenId, url } } })` compiles as planned.
- **Phase 2:** `updatedAt` is `@updatedAt`, so the cache-hit `update: { hiddenAt: null }` arm also bumps `updatedAt`. Harmless, but if any later ordering wants "first seen", use `createdAt`, not `updatedAt`.
- **Phase 3:** `@@index([projectId])` exists but the list route is specced to query by `tokenId` — `@@index([tokenId, createdAt])` is the one that serves it.
- Schema + migration dir must be committed **together** (user commits manually).

### Open risks

- `checksum` is store-only by ruling: rows written before phase 2 computes it (and every proxy cache-hit backfill row) carry `checksum = null`. Any future dupe-collapse UX must treat null as "unknown", never as "no match".
- `@@index([projectId, checksum])` is dead weight until a checksum consumer exists — accepted cost of the ruling.
- `groupId` has an index but no `MediaGroup` FK (that model lands with E2) — referential integrity for grouping is E2's problem, not enforced here.

---

## Phase 2 — Shared image pipeline + storage + registry writes in upload/proxy routes

**Files changed**
- `src/lib/media/pipeline.ts` (created)
- `src/lib/media/registry.ts` (created)
- `src/lib/media/pipeline.test.ts` (created)
- `src/lib/media/registry.test.ts` (created)
- `src/app/api/upload-image/route.ts` (modified)
- `src/app/api/proxy-image/route.ts` (modified)
- `docs/task/media-library-picker.audit.md` (appended — this section)

Exactly the plan's Phase-2 Files-touched list. Nothing outside it.

### `src/lib/media/pipeline.ts` (new)

Buffer-in shared module, two exports plus constants (`MAX_WIDTH=2400`, `WEBP_QUALITY=85`, `BLUR_WIDTH=16`, `SVG_MIME`):

- `processImage(buffer, mimeType?)` → `{ buffer, width, height, bytes, format, blurDataUrl, checksum, extension, contentType }`.
  - Raster: `sharp().resize(2400, null, { withoutEnlargement: true, fit: 'inside' }).webp({ quality: 85 })` — byte-identical to the code lifted from both routes.
  - Blur: sharp-only (`resize(16)` → `webp({quality:40})` → `data:image/webp;base64,…`). **No new dependency** (`sharp ^0.34.3` already present). Wrapped in try/catch → returns null rather than failing an upload.
  - Checksum: sha256 of the **processed** buffer via `crypto.createHash`. Store-only in v1 per the founder ruling — nothing reads it, no dedupe UX.
  - **Explicit SVG branch** (ruling 5): buffer passed through untouched (no sharp re-encode — rasterizing would defeat the point of a vector), `format:'svg'`, `blurDataUrl:null`, dims best-effort in try/catch.
- `storeImage(buffer, { tokenId, filename, contentType })` → `{ url, storage: 'blob' | 'dev-fs' }` — the `put()` + dev-fs fallback lifted out of both routes. Prefix stays `uploads/{tokenId}/{filename}`; dev-fs returns `/uploads/{tokenId}/{filename}`. Both routes now USE it — no third copy left.

`extension`/`contentType` were added to the return shape (beyond the plan's listed fields) so callers don't re-branch on SVG to build a filename — the branch lives in one place. Module JSDoc documents the E2 seam.

### `src/lib/media/registry.ts` (new)

Per ruling 4's scope note — two exports:
- `recordMediaAsset(input)` — **STRICT, throws**, returns `assetId`. E2's entry point (`workEndtoEnd.md` §8a: the row IS the deliverable).
- `recordMediaAssetBestEffort(input)` — try/catch wrapper, logs, **never throws**, returns `assetId | null`. The only thing the two routes call.

Both go through `prisma.mediaAsset.upsert({ where: { tokenId_url: { tokenId, url } }, update: { hiddenAt: null }, create: {…} })`. The `hiddenAt: null` update arm is the resurrection-bug fix and is asserted in tests. Optional inputs normalized to `null` via `?? null`.

### `src/app/api/upload-image/route.ts`

Inline sharp/put/fs deleted → `processImage` + `storeImage` + `recordMediaAssetBestEffort({ source: 'upload' })`. `sharp`/`put` imports dropped (now unused).

- **Ruling 2 honored:** the inline ownership check (user lookup → token → `token.project.userId !== user.id` → `isAdmin`/`logAdminOverride`) is **completely untouched**. No `assertProjectOwner`.
- Response only **extended**: `metadata` gains `blurDataUrl` + `assetId`. `width`/`height`/`size`/`format` unchanged (`?? undefined` preserves the old "absent key" shape when sharp yields no dims, rather than newly emitting `null`). `uploadImage`/`bulkUploadImages`/`EditableImageCollection` keep working unmodified.
- `userId` on the row = **Clerk id** (`clerkId`), per the schema's `userId String // Clerk User ID` comment — deliberately NOT the internal `user.id`. `projectId` = `token.project.id`.

### `src/app/api/proxy-image/route.ts`

Miss path rewired the same way with `source:'stock'`, `sourceUrl` = the Pexels `src.large` URL, full metadata. `cacheKey` is still used as the `list()` prefix, and `storeImage` reproduces the identical blob key (`uploads/{tokenId}/pexels-{id}.webp`) — verified by inspection.

Cache-hit branch added exactly as specified: `recordMediaAssetBestEffort` with `bytes: blobs[0].size`, `format:'webp'`, `source:'stock'`, everything else omitted → null. No Pexels call. It sits inside the existing `try{list}catch{}`, which is harmless since the best-effort fn cannot throw.

### Decisions / deviations

- **No deviations from the plan.** Two in-scope judgment calls, both conservative:
  1. `extension`/`contentType` added to `ProcessedImage` (rationale above) — additive, no caller impact.
  2. Upload response uses `?? undefined` not `?? null` for width/height, to avoid narrowing/changing the existing JSON shape for consumers.
- Behavior deltas, both strictly wider (nothing narrowed): (a) a sharp-metadata failure on a malformed SVG previously 500'd the upload route; it now stores with null dims. (b) an SVG upload now gets a registry row and a checksum.
- Not touched, as instructed: `bulkUploadImages`, editor store, `src/stores/*`, `src/lib/testimonials/photo.ts` (logged debt).

### Verification

- `npx tsc --noEmit` → **1 error**, the known pre-existing `src/app/page.tsx` / `@/assets/images/founder.jpg` (gitignored `next-env.d.ts` not generated until first `next build`). Count unchanged from baseline — not mine.
- `npm run test:run` → **196 files passed | 1 skipped (197)**, **3357 passed | 18 skipped (3375)**. Baseline was 194 files / 3343 tests; delta is exactly my 2 files / 14 tests. Nothing regressed.
- `npx eslint` on all touched paths → clean.
- `npm run build` NOT run (phase 4's gate, per instructions).
- Not committed — orchestrator commits.

`pipeline.test.ts` carries `// @vitest-environment node` (sharp is native; nothing DOM-y in the file). It passes under it — no jsdom trouble observed.

### Notes for phases 3 / 4

- Registry rows now exist for **every** upload/stock pick, including the dev-fs fallback path, where `url` is the **relative** `/uploads/{token}/{file}` string. Phase 3's GET `/api/media` and phase 4's grid must render relative AND absolute URLs.
- `blurDataUrl` is populated on the upload path → phase 3's e2e "registry-row-on-upload check incl. blurDataUrl" will find it. It is **null** for SVG uploads and for cache-hit backfill rows — the phase-4 grid must tolerate a null placeholder.
- The `assetId` is now on the upload response `metadata` if phase 4 wants to skip a grid refetch after upload.
- Manual dev verification (blob/dev-fs file + row via prisma studio, repeat-pick single row, un-hide) is NOT done — no dev server was run this phase. It remains on the founder's manual pass listed under phase 2/4 verification.
