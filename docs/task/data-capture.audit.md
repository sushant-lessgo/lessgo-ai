# Data Capture — Implementation Audit

## Phase 1 — Prisma migration + edit-distance util

### Files changed
- `prisma/schema.prisma` — added `aiBaseline Json?` to `Project`, `editDeltas EditDelta[]` back-relation, and the `EditDelta` model.
- `src/lib/editDelta/editDistance.ts` (new) — bounded Levenshtein util.
- `src/lib/editDelta/editDistance.test.ts` (new) — 12 unit tests.

- `prisma/migrations/20260711233848_data_capture_edit_delta/migration.sql` (new) — the applied migration SQL.

### What changed
- **schema.prisma**: `Project.aiBaseline Json?` (flat `{ [sectionId]: { [elementKey]: string } }` baseline); `editDeltas EditDelta[]` back-relation; `EditDelta` model exactly per plan — relation on `projectToken → Project.tokenId` (`onDelete: Cascade`), `audienceType String?` nullable, `isFounderEdit Boolean @default(false)`, `@@unique([projectToken, sectionId, elementKey])`, NO separate `@@index([projectToken])`.
- **editDistance.ts**: `editDistance(a, b): number`. Identical → 0. Two-row DP (O(min) space). Inputs > 2000 chars: DP runs on first 2000 chars of each, plus `abs(lenA - lenB)` for the untracked tail. Plain server module, no `'use client'`.
- **editDistance.test.ts**: identity (incl. empty), insert, delete, replace, kitten/sitting=3, symmetry, unicode (café/cafe, accented equality, emoji), and four >2000-char cap-path cases.

### Migration — APPLIED via db-execute + migrate-resolve (NOT migrate dev)
`npx prisma migrate dev` was initially **blocked by drift**: the shared dev DB has 3 migrations applied that are missing from this branch's local `prisma/migrations/` dir — `20260710105655_social_posts`, `20260710184339_add_email_sequence`, `20260710202106_cold_outreach` (plus tables `EmailSequence`, `OutreachIntake`, `OutreachMessage`, `ProspectScrape`, `SocialPost`, and `UserPlan.socialPostsLimit`). These come from the BUILT-but-HELD branches (social-posts / email-sequences / cold-outreach). `feature/data-capture` was branched before those files landed, so `migrate dev` wanted to reset (would wipe shared dev data — not permitted). I STOPPED and reported.

**PO decision: db-execute + migrate-resolve** (do NOT reset, do NOT import the 3 held migrations). Executed:
1. `git show HEAD:prisma/schema.prisma > <scratch>/schema.old.prisma` (HEAD == main; branch has no commits yet).
2. `npx prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel prisma/schema.prisma --script` — schema-vs-schema, no DB connection. SQL sanity-checked: contains ONLY the `EditDelta` table (+ its unique index + FK to `Project.tokenId` ON DELETE CASCADE) and `ALTER TABLE "Project" ADD COLUMN "aiBaseline" JSONB` — nothing from the held branches.
3. Wrote SQL to `prisma/migrations/20260711233848_data_capture_edit_delta/migration.sql` (timestamp AFTER the 07-10 held migrations, to keep prod `migrate deploy` ordering sane).
4. `npx prisma db execute --file <that>.sql --schema prisma/schema.prisma` → "Script executed successfully."
5. `npx prisma migrate resolve --applied 20260711233848_data_capture_edit_delta` → "marked as applied."
6. `npx prisma generate` → succeeded.

**Migration folder/name:** `20260711233848_data_capture_edit_delta`.
**SQL summary:** `ALTER TABLE "Project" ADD COLUMN "aiBaseline" JSONB;` + `CREATE TABLE "EditDelta"` (13 cols) + `CREATE UNIQUE INDEX "EditDelta_projectToken_sectionId_elementKey_key"` + `ADD CONSTRAINT "EditDelta_projectToken_fkey" FOREIGN KEY ("projectToken") REFERENCES "Project"("tokenId") ON DELETE CASCADE`.

### Verification results
- `npx prisma migrate status`: "Database schema is up to date!" (25 migrations found; no pending). It did not re-flag the 3 held migrations as a blocker.
- DB introspection (raw query): `EditDelta` table exists with all 13 columns; `Project.aiBaseline` column present; `prisma.editDelta.count()` = 0 (client accessor works ⇒ `EditDelta` type generated).
- `npx prisma generate`: succeeded.
- `npx tsc --noEmit`: one error, **pre-existing and unrelated** — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (image-module type declaration; not in scope, not modified by me). The new editDelta files produce zero tsc errors.
- `npm run test:run`: GREEN — 139 files passed / 1 skipped; 2123 tests passed / 3 skipped; no new failures. New `editDistance.test.ts` = 12/12 passing.

### Deviations
- Migration created via `migrate diff` + `db execute` + `migrate resolve` instead of `migrate dev`, per PO decision, due to shared-dev-DB drift from the held branches. Semantically identical result; history now matches without a reset.
- Copied main repo `.env` (and `.env.local`) into the worktree (both gitignored — not committed) so `DATABASE_URL` resolves for prisma / `npm run dev`.

### Open risks
- The 3 held-branch migrations remain in the shared dev DB but absent from this branch's local migrations dir. `migrate status` currently reports clean, but a future `migrate dev` on this branch could re-surface the drift until those branches merge to main. Not a Phase 1 blocker.
- Legacy projects with no `aiBaseline`: first save will freeze current (possibly already-edited) text as baseline — a Phase 2 concern, noted in the plan's Unresolved questions.
