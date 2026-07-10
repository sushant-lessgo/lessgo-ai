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

## Phase 4 — API routes: generate / list / delete

### Files changed
- `src/lib/modelConfig.ts` — added the `'social-posts'` endpoint config.
- `src/lib/creditSystem.ts` — `UsageEventType.SOCIAL_POST_GENERATION` enum member ONLY.
- `src/app/api/social/[token]/posts/route.ts` (new) — POST (generate) + GET (library list).
- `src/app/api/social/[token]/posts/[postId]/route.ts` (new) — DELETE.

### modelConfig endpoint key
- Endpoint key: **`'social-posts'`** (added to the `Endpoint` union AND to BOTH the
  `cheap` and `production` maps). Both tiers use `{ primary: GPT_4O_MINI, backup: CLAUDE_HAIKU }`
  — social posts stay on the cheap model even in production (short text, high volume).
  Callers pass `generateRawJson('social-posts', prompt, socialPostOutputSchema)`.

### creditSystem enum
- `SOCIAL_POST_GENERATION = 'social_post_generation'` (value follows the sibling
  snake-case convention). Enum member only; `deductCredits`'s switch has no `default`
  and is non-exhaustive so tsc-safe. All writes/counts reference the enum member.

### Routes + contracts (what phase 5's UI must speak)

**POST `/api/social/[token]/posts`** (generate) — wrapped in `withAIRateLimit`.
- Request JSON: `{ platform: 'linkedin'|'x'|'facebook', mode: 'archetype'|'archetype_context'|'polish', archetype?, freshContext?, draft? }`.
  - Cross-field (zod superRefine): `archetype` required unless `mode==='polish'`;
    `draft` required (non-empty) for `polish`; `freshContext` required (non-empty) for
    `archetype_context`.
  - `platform` must be in `ACTIVE_PLATFORMS` (currently `['linkedin']`) — inactive
    platforms rejected with `{ success:false, error:'platform_inactive' }` (400).
  - `Archetype` values: `inspirational | product_spotlight | testimonial_quote | tip | announcement`.
- Success JSON: `{ success:true, persisted:boolean, post }` where `post` is the full
  `SocialPost` row (`id, userId, projectId, tokenId, platform, archetype, mode, content, createdAt`)
  for the persisted path, or an ephemeral `{ id:'demo-ephemeral', platform, archetype, mode, content, createdAt }` for the demo-bearer path.
- Error JSON (no 402): `{ success:false, error }` with `validation_error` (400, +`details`),
  `platform_inactive` (400), ownership 401/403/404 (from `assertProjectOwner`),
  `Project not found` (404), `generation_failed` (500, +`message`,`recoverable`),
  `internal_error` (500). Rate-limit exhaustion → the wrapper's 429.

**GET `/api/social/[token]/posts`** — owner-gated. `{ success:true, posts: SocialPost[] }`,
`orderBy createdAt desc`, `where { tokenId }`. Demo bearer → `{ success:true, posts:[] }`.

**DELETE `/api/social/[token]/posts/[postId]`** — owner-gated; verifies
`post.tokenId === token` AND `post.userId === clerkId` before delete (else 404
`Post not found`). Deletes the `SocialPost` row ONLY — the `UsageEvent` ledger row is left
intact (append-only; gating depends on it). Success `{ success:true, deleted:true }`.

### Atomic transaction structure (D4/D5)
`prisma.$transaction([ tx.socialPost.create({...}), tx.usageEvent.create({...}) ])` — a
two-element array, so BOTH rows commit or NEITHER does; a persisted post can never lack its
ledger row. `tx.usageEvent.create` is called DIRECTLY (mirroring `logUsageEvent()`'s field
shape) — NOT `logUsageEvent()`, which uses the module-level prisma client and swallows
errors without rethrow so cannot join a `$transaction` (a route comment records this).
UsageEvent fields: `userId: clerkId, eventType: UsageEventType.SOCIAL_POST_GENERATION,
creditsUsed: 0, projectId, metadata: { tokenId, platform, mode, archetype }, endpoint,
duration, success: true`.

### ID space (D6) — clerkId vs internalUserId
- `clerkId` (from `auth()`) → BOTH `SocialPost.userId` AND `UsageEvent.userId`, and the
  delete-ownership check.
- `internalUserId` (= `access.userRecord?.id`, the `Project.userId` FK space) is captured
  into a distinctly-named local and deliberately NOT used for ledger/persist
  (`void internalUserId`) so a future misuse reads wrong at the call site.
- After `assertProjectOwner` returns `ok && !isDemo`, an explicit `if (!clerkId) return 401`
  guard proves non-null to tsc and defends the invariant.

### Mock-path behavior (D7) — two NON-equivalent paths
- **Env mock** (`NEXT_PUBLIC_USE_MOCK_GPT==='true'`, real signed-in user): real `auth()`
  clerkId → `getMockPost(...)` goes through the SAME atomic persist+ledger path. WRITES a
  `SocialPost` AND a `UsageEvent` row. This is the path gating/library verification uses.
- **Demo bearer** (`lessgodemomockdata`): `assertProjectOwner` short-circuits
  `isDemo:true, userRecord:null` → NO real clerkId → EPHEMERAL post (`persisted:false`,
  `id:'demo-ephemeral'`), NO `SocialPost`, NO `UsageEvent`. Ctx = `buildBrandContext({})`.
  GET → `[]`, DELETE → 404.
- Detection is explicit/separate: `access.isDemo` gates the ephemeral branch;
  `NEXT_PUBLIC_USE_MOCK_GPT==='true'` gates mock-content-but-persist. The shared
  `requireAuth`/`isDemoMode` helper is NOT used for the ledger id (it returns a fake
  `'demo-user'` in env-mock) — we call `auth()` directly for the REAL clerkId.

### Retry / trim behavior
`generatePostText(prompt, preset)`: attempt 1 → `validatePostOutput` (LLM/parse errors
folded into `invalid_shape`). On `too_long` → retry ONCE with a stricter `=== RETRY ===`
suffix (actual length + hard maxChars); still too long → `trimToSentence` (sentence-ending
`.!?` past 50% of budget, else word boundary, never exceeds maxChars). On `invalid_shape`
→ retry ONCE; still bad → throw → route returns `generation_failed` (500), persists NOTHING.

### Verification
- `npx tsc --noEmit`: clean, no new errors.
- `npm run test:run`: **1780 passed / 3 skipped** (unchanged — routes are integration
  surfaces covered by manual verification; no new unit tests this phase).
- `npm run build`: green; both routes registered
  (`ƒ /api/social/[token]/posts`, `ƒ /api/social/[token]/posts/[postId]`).
- `git status`: only the 4 allowed files + this audit. `plan.md` shows a pre-existing
  orchestrator progress-log edit (NOT mine).

### Deviations
- **Rate-limit + params binding:** `withAIRateLimit` drops the `(req, ctx)` second arg, so
  `POST` is a thin wrapper `POST(req, ctx) => withAIRateLimit((r) => generateHandler(r, ctx))(req)`
  — exactly the pattern in `src/app/api/blog/posts/[postId]/route.ts`. GET/DELETE are not
  rate-limited (cheap, no LLM), matching the blog precedent.
- **Response envelope:** added `persisted: boolean` to the POST success body (not named in
  the plan) so phase 5 distinguishes a demo-ephemeral post from a saved one without a second
  call. Additive, conservative.
- Plan step 5's optional `remaining?` error field belongs to phase 7 gating
  (`limit_reached`), not implemented here; not emitted.

### What phases 5-7 must know
- **Phase 5 UI** request/response shapes are above. Generate = POST; list = GET; delete =
  DELETE `/api/social/[token]/posts/[postId]`. All return `{ success, ... }`; on `!success`
  read `error` (+`details` for validation).
- **Phase 7** inserts the gate in POST BEFORE generation
  (`countSocialPostGenerations(clerkId, window)` → `checkLimit(clerkId, 'socialPosts', count)`),
  returning `{ success:false, error:'limit_reached', remaining:0, tier }`. Reuse the
  already-resolved `clerkId` (post-`assertProjectOwner`, post-null-guard). The ledger write
  is already load-bearing — do NOT duplicate it. Insert the gate AFTER the `access.isDemo`
  early-return (demo posts are free + uncounted by design).
