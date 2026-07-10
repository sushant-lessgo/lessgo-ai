# social-posts — implementation audit

## Phase 1 — Brand-context accessor (pure, tested)

### Files changed
- `src/modules/social/types.ts` (new)
- `src/modules/social/brandContext.ts` (new)
- `src/modules/social/brandContext.test.ts` (new)
- `src/modules/social/README.md` (new)

### What was built
A pure, read-only `src/modules/social/` module. `buildBrandContext(project)`
distills a Project row into a normalized `BrandContext` (businessName, oneLiner,
category, goal, offer, audience, brandTone, facts, features[], testimonials[],
socialProfiles[]) drawing from `Project.brief`, `Project.content.onboarding`
(confirmedFields / featuresFromAI / hiddenInferredFields.brandTone),
`Project.content.finalContent` sections, and `inputText`/`title`. It normalizes
BOTH testimonial shapes (product collection array vs service flat block) and
folds features/services collections into `{feature,benefit}` pairs.
`summarizeBrandContext(ctx)` renders a compact, section-omitting prompt block.
Every accessor is null-safe; array fields are always arrays.

### Key implementation decisions / ambiguities resolved
- **finalContent has TWO storage modes.** The plan referenced
  `Project.content.finalContent.content`, but current editor drafts use
  page-store mode (`finalContent.pages[pageId].content`) — confirmed in
  `src/lib/testimonials/applyToPage.ts`. `collectSections()` scans BOTH (all
  pages + flat mirror) so testimonials/features are found regardless of mode.
  Conservative: merge both, page slices win. Logged as in-scope decision.
- **Feature field names.** Onboarding `featuresFromAI` uses `{feature,benefit}`,
  but content-section feature/service collections use `{title,description}`
  (verified in `audience/{product,service}/elementSchema.ts`). Normalizer maps
  `title→feature`, `description→benefit`. Onboarding `featuresFromAI` is
  preferred; content sections are a fallback only when onboarding has none (avoids
  duplicating the same features from two sources).
- **`goal` is a string.** `Brief.goal` is an object `{intent,mechanism,...}`;
  rendered as `"intent · mechanism"`. Onboarding `landingPageGoals` confirmed
  value preferred when present.
- **businessName** resolves `confirmedFields.productName` → `businessName` →
  `project.name` → `project.title`. (Note: prisma `Project` has `title`, not
  `name`; both are accepted on the loose input type so phase 4's separate
  `findUnique` can pass either.)
- **Input type is loose** (`BrandContextInput`: all optional, `content: unknown`)
  so a bare `{ brief }`, a raw prisma row, or `{}` all type-check and never throw.
- Testimonials require both `quote` AND an author name to be emitted (a bare
  service testimonials section with empty defaults yields `[]`, not a junk entry).

### Verification
- `npx tsc --noEmit`: clean for this module. One PRE-EXISTING unrelated error
  remains — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`
  (asset import, not touched by this phase, present before my changes).
- `npx vitest run src/modules/social/brandContext.test.ts`: 8 passed.
- `npm run test:run`: 104 files passed / 1 skipped; 1765 tests passed / 3 skipped.
  No regressions.
- `git status`: only `src/modules/social/` is new — exactly the 4 phase-1 files.

### Notes for phases 2-7
- **finalContent dual storage mode** (above) — any later code reading page content
  must handle `finalContent.pages[*].content`, not just flat `.content`.
- **Content feature/service collections use `title/description`, not
  `feature/benefit`** — already normalized in brandContext; keep in mind if any
  later phase reads sections directly.
- **Prisma `Project` display field is `title`, not `name`** — the plan's phase-4
  `findUnique` select list mentions `name`; use `title` (or add both). The
  accessor tolerates either.
- `Brief.goal.destination` and `Brief.facts` are loose (`z.record`) — carried
  verbatim; no schema assumptions made.

### Phase 1 follow-up — section-fallback coverage

- **Gap closed:** the `extractFeaturesFromSections` fallback (title→feature,
  description→benefit) was previously unexercised — every existing fixture either
  supplied `featuresFromAI` (product) or an empty features result (service/bare).
- **Fixture added** (`brandContext.test.ts`, case `(e)`
  `sectionFeaturesFallbackProject`): onboarding OMITS `featuresFromAI` entirely so
  the fallback fires, and a page-store `services-svc00001` section carries a
  `services` collection of `{ id, title, description }` items. Section key
  exercised: `services-*`; collection element key: `services`; item keys:
  `title` / `description` (matches `audience/service/elementSchema.ts` IconServiceCards).
- **Assertion is failable:** asserts exact mapped strings —
  `features[0].feature === 'Brand Strategy'`, `features[0].benefit === 'Position you to win'`
  (plus the second item). Swapping title/description in the normalizer, or dropping
  the fallback, turns it red (features would be `[]` or reversed).
- Only `src/modules/social/brandContext.test.ts` was touched. This file now has 9
  tests (was 8). Full suite: 1766 passed / 3 skipped (was 1765/3). `tsc` clean
  aside from the known unrelated `app/page.tsx` / `founder.jpg` error.

## Phase 2 — `SocialPost` schema + migration [HUMAN GATE — approved]

### Files changed
- `prisma/schema.prisma`
- `prisma/migrations/20260710105655_social_posts/migration.sql` (new, generated then hand-edited)
- `prisma/migrations/migration_lock.toml` (see Deviations — EOL-only artifact, content identical)

### What changed in the schema
- New model `SocialPost` (added after `FormSubmission`), following `FormSubmission`
  conventions:
  - `id String @id @default(cuid())`
  - `userId String` — BARE Clerk User ID, NO `@relation` (matches `FormSubmission`; D6)
  - `projectId String` + `project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)`
  - `tokenId String` — bare route-key string (no relation; route resolves token→project via `assertProjectOwner`)
  - `platform String`, `archetype String?` (null for polish mode), `mode String`,
    `content String @db.Text`, `createdAt DateTime @default(now())`
  - `@@index([userId, createdAt])`, `@@index([tokenId, createdAt])`
- Reverse relation `socialPosts SocialPost[]` added on `Project` (Prisma requires the
  back-relation for the `@relation` above to compile — an expected in-scope
  `schema.prisma` edit per the phase brief, mirroring `blogPosts BlogPost[]`).
- New column on `UserPlan`: `socialPostsLimit Int @default(10)` (placed after
  `teamMembersLimit`, in the "Feature limits" group).

### Migration
- Name: `social_posts` → folder `20260710105655_social_posts`.
- Generated with `npx prisma migrate dev --name social_posts --create-only`, then
  hand-edited (backfill appended), then applied with `npx prisma migrate dev`.
  Applied cleanly to the dev DB (Neon `neondb`).

### Exact appended backfill SQL (verbatim, end of migration.sql)
```
-- these values must equal PLAN_CONFIGS[*].limits.socialPosts (see phase 7)
UPDATE "UserPlan" SET "socialPostsLimit" = 300 WHERE "tier" = 'PRO';
UPDATE "UserPlan" SET "socialPostsLimit" = -1 WHERE "tier" IN ('AGENCY','ENTERPRISE');
```
FREE keeps the schema `@default(10)`. The `-- must equal PLAN_CONFIGS` comment is
present in the file.

### Backfill verification (actual output)
- Dev DB has 3 `UserPlan` rows, ALL `tier='FREE'`, all `socialPostsLimit = 10`
  (correct default). There are ZERO PRO/AGENCY/ENTERPRISE rows in dev, so the two
  backfill `UPDATE`s matched 0 rows at migration time (nothing existing to fix).
- To PROVE the backfill SQL is itself correct, inserted temp rows (PRO/AGENCY/ENTERPRISE,
  each defaulting to 10), ran the EXACT two backfill statements, observed:
  - before: PRO=10, AGENCY=10, ENTERPRISE=10
  - after:  PRO=300, AGENCY=-1, ENTERPRISE=-1
  Then deleted the 3 temp rows (dev DB back to 3 FREE rows). So: FREE=10, PRO=300,
  AGENCY=-1, ENTERPRISE=-1 all confirmed.

### tsc / test:run / build
- `npx tsc --noEmit`: only the known pre-existing unrelated error
  `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`. No new errors.
- `npm run test:run`: 104 files passed / 1 skipped; 1766 passed / 3 skipped. Green, no regressions.
- `npm run build`: green.

### prisma-generate / node_modules junction note
- `prisma migrate dev` ran `prisma generate`, regenerating the client into
  `node_modules/@prisma/client`. This worktree's `node_modules` is a JUNCTION to the
  main repo's, so the regenerated client is SHARED with the main checkout. Expected
  and safe here because the schema change is purely additive (new model + new nullable-
  defaulted column); the orchestrator should be aware the main checkout now sees the
  new `SocialPost` / `socialPostsLimit` types.

### Deviations
- `prisma/migrations/migration_lock.toml` shows as modified but the change is EOL-only
  (LF→CRLF); content is byte-identical (`provider = "postgresql"`). This is an
  unavoidable artifact of running the mandated `prisma migrate dev`, not a semantic
  edit. Flagged rather than reverted (reverting would require a git checkout, which is
  disallowed).

### What phases 3-7 must know
- `SocialPost.userId` and gating counts key on the CLERK id (D6). The Project link is
  `projectId` (FK, cascade) + `tokenId` (route key) — NOT userId.
- `archetype` is NULLABLE (null = polish mode) — resolves unresolved question #1 in the
  plan (nullable chosen over a `'polish'` sentinel; conservative, matches plan step 1).
- Cascade delete: deleting a `Project` deletes its `SocialPost` rows. This does NOT touch
  `UsageEvent` (separate table, append-only, the gating source of truth per D4).
- Phase 7 `PLAN_CONFIGS[*].limits.socialPosts` MUST equal the backfill: FREE 10 / PRO 300
  / AGENCY -1 / ENTERPRISE -1.

## Phase 3 — Post engine: presets (LinkedIn), 3-mode prompt assembly, mock

### Files changed
- `src/modules/social/presets.ts` (new)
- `src/modules/social/postEngine.ts` (new)
- `src/modules/social/mockPosts.ts` (new)
- `src/modules/social/postEngine.test.ts` (new)
- `src/modules/social/README.md` (updated — added the phase-3 generation-core section)

### What was built
Pure, testable generation core. No AI call, no Prisma, no `next/*`, no
`'use client'` imports — a plain module a server route imports in phase 4.

- **`presets.ts`** — `PLATFORM_PRESETS: Record<Platform, PlatformPreset>` where
  `PlatformPreset = { label, maxChars, tone, formatHints, hashtagGuidance }`.
  LinkedIn fully populated (`maxChars 1300`, professional-warm, short paras +
  blank-line breaks, 0-3 hashtags). X (`maxChars 280`) and Facebook (`maxChars 700`)
  rows are typed + present but INACTIVE via `ACTIVE_PLATFORMS: Platform[] = ['linkedin']`.
  Also exports `isPlatformActive(platform)`. Phase 6 activates X/Facebook by editing
  `ACTIVE_PLATFORMS` DATA only — never a new code path.
- **`postEngine.ts`** — single mode-conditional `buildSocialPostPrompt(...)`,
  `socialPostOutputSchema` (zod `{ post: string }`), `validatePostOutput(raw, preset)`,
  and the exported `ARCHETYPE_INSTRUCTIONS` data map.
- **`mockPosts.ts`** — deterministic `getMockPost(...)` (no `Math.random`, no
  `Date.now`), always includes `ctx.businessName`, always clamps to `preset.maxChars`.

### Archetype instruction map (DATA, `ARCHETYPE_INSTRUCTIONS`)
- `inspirational` — belief/lesson/mission grounded in what the business stands for.
- `product_spotlight` — one concrete capability/offer + its tangible benefit.
- `testimonial_quote` — social-proof post centered on customer results (base snippet;
  the builder then appends a testimonial-presence-conditional clause, see below).
- `tip` — one genuinely useful, specific, expertise-tied piece of advice.
- `announcement` — news/launch/milestone, exciting but credible and concrete.

### `testimonial_quote` with ZERO testimonials — handling
The builder is conditional (never fabricates a quote):
- **Has testimonials** → appends "Draw on a real testimonial from the brand context…
  you may quote or closely paraphrase it, and attribute it as given."
- **No testimonials** → appends "No customer testimonials are available, so DO NOT
  fabricate a quote or attribute words to a named customer. Instead, speak to the
  results and value the business delivers…". The `Testimonials:` heading is absent
  from the brand block entirely because `summarizeBrandContext` omits empty sections.
A real customer quote is never hallucinated. Tests assert both branches (the
no-testimonial prompt contains "DO NOT fabricate a quote" and NOT the heading).

### `validatePostOutput` retry contract (phase 4 consumes this)
Signature: `validatePostOutput(raw: unknown, preset: PlatformPreset): ValidatePostResult`
where `ValidatePostResult =`
- `{ ok: true; post: string }` — use `post` (trimmed).
- `{ ok: false; reason: 'invalid_shape'; error: string }` — zod parse failed OR empty
  post; treat as a parse failure (retry/error, NOT a trim).
- `{ ok: false; reason: 'too_long'; post: string; length: number; maxChars: number }` —
  over the limit; **never thrown**. Phase 4 retries once with a stricter instruction,
  else trims at a sentence boundary. `post` is still returned so the route can trim it.

### Verification
- `npx tsc --noEmit`: clean, no output, no new errors. (The `founder.jpg` error noted in
  earlier phases did not surface this run — regardless, no NEW errors from phase 3.)
- `npx vitest run src/modules/social/postEngine.test.ts`: 14 passed.
- `npm run test:run`: 105 files passed / 1 skipped; **1780 passed / 3 skipped** (was
  1766/3 → +14 new). No regressions.
- `git status`: only the 5 allowed files created/modified. `docs/task/social-posts.plan.md`
  shows a pre-existing 1-line progress-log edit made by the orchestrator (NOT phase 3).

### Deviations
- None materially. In-scope choice: Facebook `maxChars` set to 700 now (the plan's
  phase-6 range was 500-800); a fact-ish placeholder while inactive — phase 6 owns the
  final value. `mockPosts.getMockPost` clamps on a word boundary only when it keeps
  ≥70% of the budget, else hard-cuts, guaranteeing the limit is never exceeded.

### What phases 4 / 6 must know
- **Phase 4** imports `buildSocialPostPrompt`, `validatePostOutput`,
  `socialPostOutputSchema` from `postEngine.ts`; `getMockPost` from `mockPosts.ts`;
  `PLATFORM_PRESETS`, `ACTIVE_PLATFORMS`, `isPlatformActive` from `presets.ts`. Body
  validation must enforce `platform ∈ ACTIVE_PLATFORMS`. The retry-once loop keys off
  `validatePostOutput(...).reason === 'too_long'`.
- **Phase 6** activates X + Facebook by editing `ACTIVE_PLATFORMS` (and refining the two
  preset rows + mock variants) — no engine/route/UI code path changes. The 280 X limit
  is already correct and already unit-tested via `validatePostOutput`.
