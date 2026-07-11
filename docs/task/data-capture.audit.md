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

## Phase 2 — Server-side baseline freeze + delta capture in saveDraft

### Files changed
- `src/lib/editDelta/capture.ts` (new) — `extractElementText`, `collectElements`, `computeNextBaseline`, `captureEditDeltas` + the parity-invariant documentation comment.
- `src/lib/editDelta/capture.test.ts` (new) — 20 vitest cases incl. the parity fixture.
- `src/app/api/saveDraft/route.ts` — wired baseline freeze + delta capture.
- `src/lib/admin.ts` — added exported `isAdminClerkId(clerkId)` (delegates to existing `isAdmin`; no `requireAdmin` change).

(Not mine: `docs/task/data-capture.plan.md` carries a pre-existing uncommitted 1-line progress-log edit from Phase 1 — SHA backfill `pending-sha → 29efec07` — left untouched.)

### PARITY EVIDENCE — the two element serializations found (statically traced)
- **Freeze side** — `finalContent.content[id].elements` (`finalize.ts:76` `elements = copy[type].elements`; multipage merge `multiPageAssembly.ts:423` `sec.elements[field] = value`). After `parseAiResponse` (`result.content[key] = processedElement.value`, parseAiResponse.ts:530) each value that actually reaches finalContent is a plain **`string`** (headline/subheadline/…) or **`string[]`** (pipe/collection fields, e.g. `feature_titles`). `form_id` etc. are plain strings. The `SectionCopy.elements` *type* (generation.ts:387) also admits `{ value, needsReview }` (ElementValueReview) and `Record<string,unknown>[]`, but those don't survive the parser into finalContent.
- **Diff side** — editor store `export()` (`persistenceActions.ts:569` → `autoSaveDraft.ts:155`). `SectionData.elements` (content.ts:129) is the **V2 direct format**: `contentActions.ts:306` writes `elements[key] = <string>` and list writes keep `<string[]>` — no wrapper. So the common path is ALSO `string | string[]` ⇒ parity holds trivially. The legacy flattened→legacy rebuild (`flattenedState.ts:256`) can emit `{ content, type, isEditable }` wrappers.
- **How the extractor unifies them:** `extractElementText` normalizes BOTH to one string — `string`→as-is, `string[]`→join `'\n'`, `{ content }`→recurse `.content` (legacy editor wrapper), `{ value }`→recurse `.value` (defensive, freeze-side review wrapper), everything else/empty→`null` (skipped). Because the SAME extractor runs on both the frozen baseline text and the current export text, differing wrappers are harmless as long as inner strings match. Proven by the automated parity fixture: a generate-copy-shaped section and its editor-export-shaped equivalent (incl. one `{ content }`-wrapped field + array field) `collectElements` to identical `{elementKey → text}` maps ⇒ `captureEditDeltas` writes ZERO upserts.

### What was wired in saveDraft
- Extended the `findUnique` select with `aiBaseline`, `templateId`, `audienceType`. **Owner clerkId NOT selected** — `assertProjectOwner` guarantees the saver is the project owner (or first-writer orphan-claim), so the authed `clerkId` already equals the owner's clerkId; `isFounderEdit = isAdminClerkId(clerkId)`. Cheapest option, documented in code.
- Read `body.aiBaselinePatch` from the RAW body (same pattern/comment as `baseline`; `DraftSaveSchema` untouched).
- Compute next baseline when `finalContent` OR a patch is present; write the `aiBaseline` column in BOTH upsert branches **only when `changed === true`** (skips large-JSON rewrites on no-op autosaves). Patch-only saves still merge + persist.
- After the upsert: `captureEditDeltas` in try/catch that logs-and-continues (`logger.warn`) — a capture failure never fails the autosave. Only invoked when `finalContent` produced collected elements. Effective `templateId = body.templateId ?? stored ?? null`; `audienceType = stored ?? null`.

### Key decisions / deviations
- `collectElements` single-walk: walks `pages[*].content` when `pages` is present & non-empty, ELSE top-level `content` — never both (avoids double-processing home on multipage). Global-unique section IDs ⇒ no page nesting in the baseline. Empty-skeleton pages (`content: {}`) yield nothing; `localeContent` (top-level i18n overlay) is never walked; a `META_KEYS` guard defensively skips non-section top-level keys if a flattened blob is ever passed.
- `EditDeltaPrisma` mock interface uses `any` (not `unknown`) arg types so the real Prisma client's precisely-typed `upsert`/`deleteMany` stay assignable (arg contravariance). Conservative in-scope call.
- `extractElementText` also unwraps `.value` (beyond the plan's `.content`): the freeze-side type explicitly allows `{ value, needsReview }`, so covering it improves parity robustness at zero risk. Logged here per the in-scope-ambiguity rule.
- Revert cleanup: one `deleteMany` over all at-baseline keys (idempotent; deletes 0 when no row exists), only when candidates exist.

### Verification results
- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx` `@/assets/images/founder.jpg` error; zero errors from the new/edited files.
- `npx vitest run src/lib/editDelta/capture.test.ts`: 20/20 pass.
- `npm run test:run`: 2142 passed / 3 skipped; the ONLY failure was the known env-flake `src/lib/i18n/i18nHonesty.test.ts` (its `generateStaticHTML` case hitting the hard 5000ms `testTimeout` under full-suite load). Confirmed environmental: with my `saveDraft`/`admin` edits stashed it passed in 2.86s, and with them restored it passed again (2.85s) — that test does not import any file I touched; the timeout is pure machine-load timing variance.

### Deferred to the final human gate (Phase 4 gate)
- **Live-dev zero-row acceptance check** (`npm run dev` → fresh real-LLM generate → no edits → autosave → 0 EditDelta rows via SQL) is intentionally NOT run here. The automated parity fixture in `capture.test.ts` is the rigorous proof of the invariant for Phase 2; the live end-to-end check remains pending for the final gate.

### Post-review follow-up (demo-token skip)
- **Demo-token capture skip added** (reviewer follow-up): the `lessgodemomockdata` demo path bypasses `assertProjectOwner` but previously still ran freeze + capture on the shared demo project — dataset noise. Guard: the baseline-compute block now gates on `!isDemo && (finalContent || aiBaselinePatch !== undefined)`. Because `nextAiBaseline` stays `undefined` when skipped, both the `aiBaseline` column write (`aiBaselineChanged` stays false) and `captureEditDeltas` (guarded by `nextAiBaseline && collectedElements.length > 0`) are naturally bypassed — one condition, no other change. `tsc` clean (only the known `founder.jpg` error); `capture.test.ts` 20/20 still pass.

### Accepted non-blocking items (NOT fixed — deliberate, beta-acceptable)
- **Revert `deleteMany` OR-fan-out:** on a fresh unedited page every at-baseline element becomes a revert candidate → one `deleteMany` with a large `OR` list per autosave (deletes 0 rows). Minor perf only, bounded by page element count (~tens); acceptable for beta volume.
- **`aiBaselinePatch` raw cast unvalidated:** read from raw body and cast (like the existing `baseline`/`brief` passthroughs). It is owner-scoped (post-`assertProjectOwner`) and defensively filtered inside `computeNextBaseline` (only `typeof val === 'string'` entries merge), so a malformed patch can't corrupt the baseline — consistent with the existing raw-body pattern. No schema change.

### Open risks
- Element shapes not covered by `extractElementText` (number/boolean values, object-array card structures) get no baseline and are silently excluded from capture — matches the plan (text-only). No corruption risk (same on both sides).
- Legacy projects with no `aiBaseline` freeze current (possibly already-edited) text as baseline on first post-deploy save (plan Unresolved question — accepted for minimum build).
