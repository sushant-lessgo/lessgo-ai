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
