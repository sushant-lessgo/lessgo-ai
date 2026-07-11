# social-posts — plan

Branch: `feature/social-posts`
Spec: `docs/task/social-posts.spec.md`
Worktree note: worktree already has a `node_modules` junction + copied `.env`/`.env.local` — `npm run build` / tests work in place.

## Overview

Per-project on-brand social post generator: user opens `/dashboard/social/[token]`, picks platform (LinkedIn/X/Facebook) + input mode (archetype / archetype+fresh-context / polish-draft), generates text posts from the project's stored brand data, and manages a minimal saved-post library (list/copy/delete). One engine + a data-driven per-platform preset table; gating via a separate `socialPostsLimit` (Free 10 lifetime, Pro ~300/mo soft cap) that never touches the page-generation credit pool. Landing-page generation/edit/publish pipeline is read-only-consumed and untouched.

## Progress log

```
phase 1 brand-context accessor: done (commit 25200178, review loops 1)
phase 2 SocialPost schema + migration: done (commit 9378fffe, review loops 1, human gate APPROVED by user; migration 20260710105655_social_posts; backfill matched 0 rows on dev — 0 PRO rows exist — and will apply on prod at `migrate deploy`)
phase 3 post engine (LinkedIn preset, 3 modes, mock): done (commit acb1e58b, review loops 1)
phase 4 API routes (generate/list/delete): done (commit efc4985d, review loops 1)
phase 5 dashboard UI: done (commit e789d449, review loops 1; phase-6 simulation passed — zero UI edits needed)
phase 6 X + Facebook presets: done (commit eec2c0d7, review loops 1; UI needed ZERO edits — contract held; mockPosts.ts deliberately unedited, invariant beats plan step)
phase 7 gating/caps + upgrade wall: DEFERRED (PO call 2026-07-10) — blocked on docs/task/pricing-v2.spec.md; do NOT merge/deploy phases 1-6 without it or a kill-switch (Free = unlimited posts until then). Plan §Phase 7 is complete and ready to implement as-is.
```

## Decisions (restated — do not relitigate)

- **D1 — Key on `tokenId`, NOT published `slug`.** Social posts must work on unpublished drafts. Route: `/dashboard/social/[token]`. Every API route gated with `assertProjectOwner(clerkId, tokenId, { action })` (`src/lib/security.ts:57`).
- **D2 — Do NOT persist `copyStrategy`, do NOT touch the generation pipeline.** Brand context is assembled read-only from `Project.brief` + `Project.content.onboarding` (confirmedFields, featuresFromAI, hiddenInferredFields.brandTone) + `Project.inputText` + `content` testimonials/features sections, via a NEW dedicated accessor `src/modules/social/brandContext.ts` that normalizes BOTH testimonial shapes (product collection array vs service flat block) and tolerates missing keys (`content['testimonials']?.elements` guard — absent section = missing key, not `[]`).
- **D3 — Use `src/lib/aiClient.ts`** (`generateRawJson` / `generateWithSchema`, config via `src/lib/modelConfig.ts`), NOT the legacy USE_OPENAI→Nebius chain. Clone the structure of `src/app/api/audience/service/generate-copy/route.ts` but REMOVE the `consumeCredits` call.
- **D4 (revised) — Gating without the credit pool; count the `UsageEvent` LEDGER, not `SocialPost` rows.**
  - Free = 10 posts lifetime → `prisma.usageEvent.count({ where: { userId: clerkId, eventType: UsageEventType.SOCIAL_POST_GENERATION } })` (no reset logic, no counter column).
  - Pro = ~300/mo soft cap → same query + `createdAt >= <start of current period>`, period boundary derived consistently with `getCurrentPeriod()` (`src/lib/creditSystem.ts:64-69`).
  - Feed count into `checkLimit(clerkId, 'socialPosts', currentCount)` after adding `socialPosts` to the nested `limits` config + `socialPostsLimit` to `UserPlan`.
  - **Rationale:** the post library exposes delete (spec Scope IN), so counting `SocialPost` rows would let a Free user delete-and-regenerate past the 10-post cap forever. `UsageEvent` is append-only and never deleted → correct source of truth for a lifetime cap. This makes the D5 ledger write load-bearing (correctness, not telemetry): it must happen on EVERY successful generation, including mock mode, inside the same transaction as the `SocialPost` persist, so a post can never be persisted without its ledger row.
- **D5 — Ledger via new `UsageEventType.SOCIAL_POST_GENERATION`** enum member (added to the enum at `src/lib/creditSystem.ts:27`; value string follows sibling-member convention; ALL writes and count queries reference the enum member, never a bare string literal) with `creditsUsed: 0`. No schema change for the ledger. Per D4-revised this write is load-bearing for gating — required on every successful generation (mock included), atomically coupled to the `SocialPost` persist. (Reviewer-confirmed: `deductCredits`'s switch has no `default` and is already non-exhaustive → adding the member is `tsc`-safe.)
- **D6 — ID space pinned (blocking-review finding).** `UserPlan.userId` and `UsageEvent.userId` are **Clerk IDs** (`schema.prisma:276`; `getUserPlan`/`checkLimit` key on Clerk id), while `Project.userId` is the **internal** `User.id` FK (`schema.prisma:22-23`) and `assertProjectOwner` returns the internal `userRecord.id`. Therefore: the `UsageEvent` ledger write, the gating count query, and `checkLimit` ALL use the **clerkId from `auth()`** — never `userRecord.id`. `SocialPost.userId` ALSO stores the **clerkId** (bare clerkId, no `@relation` — matches the `FormSubmission` precedent; the Project relation is carried by `projectId`/`tokenId`). A swap is invisible to `tsc` (both `string`) and would make `usageEvent.count` return 0 forever → Free cap never fires; phase 7 includes a test that fails if the id spaces are swapped.
- **D7 — Mock-mode ledger requires a REAL clerkId.** Two mock triggers exist and they are NOT equivalent: (a) `NEXT_PUBLIC_USE_MOCK_GPT==='true'` with a real signed-in user → real `auth()` clerkId → full atomic persist+ledger path (this is the path gating tests and manual cap verification MUST use); (b) demo bearer `lessgodemomockdata` → `assertProjectOwner` short-circuits with `userRecord: null, isDemo: true` (`security.ts:63-64`), NO real clerkId → the demo-token path must NOT write a `SocialPost` row or a `UsageEvent` ledger row (returns an ephemeral, non-persisted mock post only). A null/empty `userId` ledger row would poison gating counts and prove nothing.

Scope OUT enforced throughout: no scheduling/auto-post/OAuth, no images, no calendar, no other platforms, no analytics/hashtags, no folders/tags/search.

## ⚠️ CURRENT STATE — phases 1-6 done, phase 7 DEFERRED (2026-07-10)

**The feature is BUILT and UNGATED.** The POST route has NO `checkLimit` call; `PLAN_CONFIGS` has no `socialPosts` entry; the Social button is live on every project card. Merging/deploying this branch as-is gives every Free user unlimited AI post generation (~$0.002/post COGS, but unbounded).

Phase 7 is deferred behind `docs/task/pricing-v2.spec.md` (PO call). Its plan section below is complete and implementable as written; the schema it depends on (`SocialPost`, `UserPlan.socialPostsLimit`, and the PRO→300 / AGENCY,ENTERPRISE→-1 backfill) ALREADY SHIPPED in phase 2's migration `20260710105655_social_posts`. Note this means existing `UserPlan` rows already carry a `socialPostsLimit` value that nothing currently reads.

**To resume:** implement plan §Phase 7 verbatim (it survived 3 plan-review rounds), or add a kill-switch first if the branch must merge sooner (see "Merge options" below).

**Merge options while phase 7 is deferred:**
1. Leave `feature/social-posts` unmerged (safest; nothing deploys).
2. Merge behind a kill-switch: env flag gating the POST route + hiding the ProjectCard button. Small, but it IS a code change and needs its own review.
3. Merge ungated — only acceptable if generation is otherwise unreachable in prod.

## Known, accepted, out-of-scope for this feature

- **Orphan-project generation (inherited, NOT introduced here).** `assertProjectOwner` without `claimIfOrphan` returns `ok:true` for a project whose `userId` is `null`, so any authenticated user can generate/list posts on an unowned draft. This matches existing platform behavior for other token-scoped routes (see the deferred "Class B unauth compute-spend routes"). Self-limiting: posts persist under the GENERATOR's clerkId, so they consume the generator's own allowance, and DELETE remains self-scoped (`post.userId === clerkId`). Flagged by phase-4 impl-review; not a phase-4 regression; fix belongs to the authz track, not social-posts.
- **Residual `toContain(<map-lookup>)` coercion traps** in `postEngine.test.ts` (~lines 145/146/155/156/171/176): `toContain(PLATFORM_PRESETS.x.tone)` falsely passes if the field were ever `undefined` (builder emits `"Tone: undefined"`; `toContain(undefined)` → `.includes("undefined")`). Low severity — the Set-size distinctness test guards the real copy-paste risk, and these are literal data in the same file. Fix pattern: the verbatim-guard test at ~line 187 does it right via an `instruction.length > 0` precondition. Also line 142's `toContain('X')` is trivially satisfied by `'characters MAX'`. Cosmetic; not worth a review round. Flagged by phase-6 impl-review.
- **Env-mock output bypasses `validatePostOutput`.** `getMockPost` self-clamps to `maxChars`; the route trusts that. Implicit coupling, harmless — noted so a future mock change knows it must keep clamping.

## Phase-1 findings (verified against real code — correct earlier plan guesses)

These were discovered while implementing phase 1 and **verified by impl-review against the schemas**. Later phases must use these, not the plan's earlier assumptions:

- **`finalContent` has TWO storage modes.** Current editor drafts store `finalContent.pages[pageId].content` (authoritative); the flat `finalContent.content` is a derived mirror. `buildBrandContext` scans BOTH. Any later phase reading page content must do the same — reading only the flat form silently misses current drafts.
- **Content-section feature/service collections use `{title, description}`**, NOT onboarding's `{feature, benefit}`. `brandContext` normalizes `title→feature`, `description→benefit`.
- **`Project` has no `name` column** — the display field is `title` (`schema.prisma:26`).

---

## Phase 1 — Brand-context accessor (pure, tested)

**Goal:** Read-only module that turns a `Project` row into a normalized `BrandContext` for prompting, degrading gracefully for any audience/template.

Steps:
1. Create `src/modules/social/types.ts`: `Platform` (`'linkedin' | 'x' | 'facebook'`), `Archetype` (`'inspirational' | 'product_spotlight' | 'testimonial_quote' | 'tip' | 'announcement'`), `Mode` (`'archetype' | 'archetype_context' | 'polish'`), and `BrandContext` shape (`businessName, oneLiner, category, goal, offer, audience, brandTone, facts, features: {feature,benefit}[], testimonials: {quote, authorName, authorRole?, authorCompany?}[], socialProfiles`), all fields optional-tolerant.
2. Create `src/modules/social/brandContext.ts`: `buildBrandContext(project)` — inputs: `Project.brief` (typed via `@/types/brief`, zod source `src/lib/schemas/brief.schema.ts`), `Project.content.onboarding` (shape per `src/app/api/saveDraft/route.ts:33-45`), `Project.inputText`, and `Project.content.finalContent.content` sections. Normalize BOTH testimonial shapes: product collection `elements.testimonials: [{id,quote,author_name,author_role}]` AND service flat `elements.{quote,author_name,author_role,author_company}`; features/services collections likewise. Every accessor null-safe (missing section = missing key). Also export `summarizeBrandContext(ctx)` → compact prompt-ready text block.
3. Create `src/modules/social/brandContext.test.ts` (Vitest): fixtures for (a) product project with testimonials collection, (b) service project with flat testimonial + no products, (c) writer/bare project with brief only, (d) project with neither testimonials nor features — assert no crash + sensible partial output for each.
4. Create `src/modules/social/README.md` (module purpose, invariants: read-only over Project, dual testimonial shapes, no imports from `'use client'` files, D6 id-space rule).

**Files touched:**
- `src/modules/social/types.ts` (new)
- `src/modules/social/brandContext.ts` (new)
- `src/modules/social/brandContext.test.ts` (new)
- `src/modules/social/README.md` (new)

**Verification:** `npx tsc --noEmit` clean; `npm run test:run` green incl. new tests; no other module imports changed (pure addition).

---

## Phase 2 — `SocialPost` schema + migration  **[HUMAN GATE]**

**Goal:** Persist generated posts per project/user; also add the `socialPostsLimit` column WITH a hand-edited backfill so existing paid rows are never capped at the Free default. This is the feature's ONLY migration.

Steps:
1. Add model `SocialPost` to `prisma/schema.prisma`, following `FormSubmission` conventions: `id String @id @default(cuid())`, `userId String` (**Clerk id** per D6, bare — no `@relation`, indexed), `projectId String` + `tokenId String` (indexed; relation to `Project` like sibling models), `platform String`, `archetype String?` (null for polish mode), `mode String`, `content String @db.Text`, `createdAt DateTime @default(now())`. Composite index `@@index([userId, createdAt])` and `@@index([tokenId, createdAt])` (library list). (Gating counts read `UsageEvent`, not this table — per D4-revised.)
2. Add `socialPostsLimit Int @default(10)` to `UserPlan` (near existing `*Limit` fields, `schema.prisma:296-301` area).
3. Generate SQL with `npx prisma migrate dev --name social_posts --create-only` (NEVER `db push`), then **HAND-EDIT the generated migration.sql BEFORE applying** — this edit is part of why this phase is a human gate. Append backfill:
   - `-- these values must equal PLAN_CONFIGS[*].limits.socialPosts (see phase 7)` (comment IN the SQL file)
   - `UPDATE "UserPlan" SET "socialPostsLimit" = 300 WHERE "tier" = 'PRO';`
   - `UPDATE "UserPlan" SET "socialPostsLimit" = -1 WHERE "tier" IN ('AGENCY','ENTERPRISE');`
   (FREE keeps the 10 default.) **Rationale (blocking-review finding):** `checkLimit` (`planManager.ts:415-424`) reads `userPlan['socialPostsLimit']` straight from the DB row; `@default(10)` backfills 10 onto EVERY existing row including PRO, and the plan-mutation fns only write the column on FUTURE plan mutations — they never retroactively fix existing rows. Without this backfill the existing paying Pro customer hits the Free wall at 10 posts, violating acceptance "Pro user unaffected".
4. Apply with `npx prisma migrate dev`. Commit the generated+edited migration folder.

**Files touched:**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_social_posts/migration.sql` (generated, then hand-edited per step 3)

**Verification:** migration applies cleanly on dev DB; `npx prisma generate` implicit; **backfill assertion: query `UserPlan` and confirm `tier='PRO'` rows have `socialPostsLimit = 300` (NOT 10), AGENCY/ENTERPRISE `= -1`, FREE `= 10`**; `npx tsc --noEmit` + `npm run test:run` + `npm run build` green.

**human gate — checklist:**
1. Sign off model shape + column default.
2. **SQL↔TS cross-check (SQL cannot import TS, so this manual side-by-side IS the source-of-truth reconciliation):** implementer pastes the intended phase-7 `PLAN_CONFIGS` `limits.socialPosts` block (FREE 10 / PRO 300 / AGENCY -1 / ENTERPRISE -1) next to the backfill SQL at the gate; user confirms the numbers match before applying.
3. Confirm the `-- must equal PLAN_CONFIGS` comment is present in `migration.sql`.

---

## Phase 3 — Post engine: presets (LinkedIn), 3-mode prompt assembly, mock

**Goal:** Pure generation core — one engine, mode-conditional prompt, data-driven preset table (LinkedIn row only for now), zod output schema, mock generator.

Steps:
1. Create `src/modules/social/presets.ts`: `PLATFORM_PRESETS: Record<Platform, PlatformPreset>` where `PlatformPreset = { label, maxChars, tone, formatHints, hashtagGuidance }`. Populate LinkedIn fully (e.g. maxChars ~1300, professional-warm tone, short paragraphs + line breaks, 0–3 hashtags); stub X/Facebook entries typed but marked inactive via an `ACTIVE_PLATFORMS: Platform[]` export = `['linkedin']` (phase 6 flips data only).
2. Create `src/modules/social/postEngine.ts`:
   - `buildSocialPostPrompt({ ctx, platform, archetype?, mode, freshContext?, draft? })` — single builder, mode-conditional sections: archetype-only = brand summary + archetype instruction; archetype+context = same + user free-text; polish = brand voice summary + rewrite-this-draft instruction. Preset injected as constraints (tone, maxChars, format). Archetype definitions live here as a small data map (5 archetypes → instruction snippet). Prompt asks for JSON `{ post: string }`.
   - `socialPostOutputSchema` (zod) + `validatePostOutput(raw, preset)` → parse + hard length check against `preset.maxChars` (returns violation so route can retry once).
3. Create `src/modules/social/mockPosts.ts`: deterministic `getMockPost({ platform, archetype, mode, ctx })` returning plausible on-brand-ish text using `ctx.businessName` (so tests can assert brand data flows through); respects maxChars.
4. Create `src/modules/social/postEngine.test.ts`: prompt contains brand name/offer/testimonial when present; omits testimonial section cleanly when absent; polish mode embeds draft; length validator rejects over-limit output; mock respects preset.
5. Update `src/modules/social/README.md` with engine + preset invariants ("presets are DATA; adding a platform = preset row, never a code path").

**Files touched:**
- `src/modules/social/presets.ts` (new)
- `src/modules/social/postEngine.ts` (new)
- `src/modules/social/mockPosts.ts` (new)
- `src/modules/social/postEngine.test.ts` (new)
- `src/modules/social/README.md`

**Verification:** `npx tsc --noEmit`; `npm run test:run` green (new engine tests); no runtime surface touched yet.

---

## Phase 4 — API routes: generate / list / delete

**Goal:** Token-scoped, owner-gated CRUD + generation endpoint using `aiClient`, mock-mode short-circuit, load-bearing atomic `UsageEvent` ledger write, ZERO credit spend.

Steps:
1. Add endpoint config for `'social-posts'` in `src/lib/modelConfig.ts` (cheap tier: gpt-4o-mini primary, existing backup), following existing endpoint entries.
2. Add `SOCIAL_POST_GENERATION` member to the `UsageEventType` enum (`src/lib/creditSystem.ts:27`), value per sibling-member convention. Enum member ONLY — no other creditSystem changes (`deductCredits` switch has no `default`; confirmed `tsc`-safe). All writes/counts use the enum, never a bare string.
3. Create `src/app/api/social/[token]/posts/route.ts`:
   - `POST` (generate): zod-validate body `{ platform, mode, archetype?, freshContext?, draft? }` (cross-field: archetype required unless mode='polish'; draft required for polish; platform ∈ `ACTIVE_PLATFORMS`). Clone structure of `src/app/api/audience/service/generate-copy/route.ts` (:84-124 validation → requireAuth → mock short-circuit → prompt → `generateRawJson` retry loop → parse → respond via `createSecureResponse`, exported wrapped in `withAIRateLimit`).
   - Ownership vs data load: `assertProjectOwner(clerkId, tokenId, { action: 'social-posts' })` GATES access but **selects only `{ userId }`** (`security.ts:79-82`) — it does NOT return brand data. Do a SEPARATE `prisma.project.findUnique` (select `brief`, `content`, `inputText`, **`title`**) to feed `buildBrandContext(project)`. **NOTE (phase-1 finding, verified against `schema.prisma:26`): `Project` has NO `name` column — the display field is `title`.** An earlier draft of this plan said `name`; that was wrong.
   - **ID space (D6, unmissable):** the `clerkId` from `auth()` — NOT `userRecord.id` returned by `assertProjectOwner` — goes into `UsageEvent.userId` AND `SocialPost.userId`. `Project.userId` is the internal id space; using it here would make the gating count return 0 forever and silently disable the Free cap.
   - **NO `consumeCredits`**; on over-length output retry once with stricter instruction, else trim at sentence boundary.
   - **Persist + ledger = one atomic unit (CORRECTNESS requirement per D4-revised, not telemetry):** after a successful generation, `prisma.$transaction` containing `tx.socialPost.create(...)` AND `tx.usageEvent.create({ userId: clerkId, eventType: UsageEventType.SOCIAL_POST_GENERATION, creditsUsed: 0, metadata: { tokenId, platform, mode, archetype } })` (field shape mirroring `logUsageEvent()` `creditSystem.ts:231-256`). **Direct `tx.usageEvent.create`, NOT `logUsageEvent()` — confirmed: `logUsageEvent()` uses the module-level `prisma` client and swallows errors without rethrow, so it CANNOT join a `$transaction`; do not "simplify" back to it later.** Failure semantics: a persisted `SocialPost` with NO matching `UsageEvent` = a free post and MUST be impossible; if the transaction fails, persist neither and return error. Failed generations (LLM error, validation fail after retry) persist nothing and consume no allowance.
   - **Mock mode — two paths, NOT equivalent (D7):**
     - Env mock (`NEXT_PUBLIC_USE_MOCK_GPT==='true'`, real signed-in user; helper `src/lib/mockMode.ts`): real `auth()` clerkId exists → `getMockPost()` goes through the SAME atomic persist+ledger path. This is the path ALL gating/library e2e verification uses.
     - Demo bearer (`lessgodemomockdata`): `assertProjectOwner` short-circuits with `userRecord: null, isDemo: true` (`security.ts:63-64`) — NO real clerkId → return an EPHEMERAL mock post only; **no `SocialPost` row, no `UsageEvent` row** (a null/empty `userId` ledger row would poison gating counts).
   - `GET` (library list): owner-gated, `prisma.socialPost.findMany({ where: { tokenId }, orderBy: { createdAt: 'desc' } })`.
4. Create `src/app/api/social/[token]/posts/[postId]/route.ts`: `DELETE` — owner-gated AND `socialPost.tokenId === token` + `socialPost.userId === clerkId` (clerkId space per D6) before delete. Deletes the `SocialPost` row ONLY — NEVER the `UsageEvent` (append-only; gating depends on it).
5. Error convention: `{ success: false, error, remaining? }` JSON (no 402), matching existing routes.

**Files touched:**
- `src/lib/modelConfig.ts`
- `src/lib/creditSystem.ts` (`UsageEventType` enum member only)
- `src/app/api/social/[token]/posts/route.ts` (new)
- `src/app/api/social/[token]/posts/[postId]/route.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run build` green. Manual (dev, `NEXT_PUBLIC_USE_MOCK_GPT=true`, REAL signed-in user — not the demo bearer): POST generate on an owned token → post row persists AND matching `UsageEvent` row exists with `userId` = the CLERK id (spot-check the row value against the Clerk id, NOT `User.id`); GET lists it; DELETE removes the post but the `UsageEvent` row REMAINS; other user's token → 403; **demo-bearer request returns a mock post but writes NO `SocialPost` and NO `UsageEvent` row (D7)**; `UserUsage.creditsRemaining` UNCHANGED after generation.

---

## Phase 5 — Dashboard UI: `/dashboard/social/[token]` + entry point

**Goal:** Generator panel + minimal library (list/copy/delete) per project; entry button on project cards (drafts included, per D1).

Steps:
1. Create `src/app/dashboard/social/[token]/page.tsx` (server comp): Clerk auth + ownership check, plus its OWN `prisma.project.findUnique` by tokenId for display data (mirror blog page's resolve pattern at `src/app/dashboard/blog/[slug]/page.tsx:28-34`, but keyed on token directly; note the ownership helper does NOT return the full project — load it separately). Render header (project name, back-to-dashboard) + client panel.
2. Create `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx` (`'use client'`): platform picker rendered FROM `ACTIVE_PLATFORMS`/preset table (LinkedIn only shows now; phase 6 = zero UI code change), mode tabs (3 modes), archetype select (5 archetypes), free-text box (mode 2), draft textarea (mode 3), generate button with loading state (pattern: `src/app/dashboard/blog/[slug]/components/NewPostButton.tsx`), result card with copy-to-clipboard (pattern: `CollectLinksDialog.tsx:29-32`).
3. Create `src/app/dashboard/social/[token]/components/PostLibrary.tsx` (`'use client'`): fetch GET list, newest-first cards with platform/archetype badge, created date, copy + delete buttons (delete → confirm via `src/components/ui/dialog.tsx` or simple confirm). Nothing more (no folders/tags/search per scope).
4. Edit `src/components/dashboard/ProjectCard.tsx`: add "Social" button linking `/dashboard/social/${tokenId}` — visible for BOTH published and draft cards (D1), alongside existing Edit/Analytics/Forms buttons (:116-147 region).

**Files touched:**
- `src/app/dashboard/social/[token]/page.tsx` (new)
- `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx` (new)
- `src/app/dashboard/social/[token]/components/PostLibrary.tsx` (new)
- `src/components/dashboard/ProjectCard.tsx`

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run build`. Manual (dev, env mock mode, real signed-in user): from dashboard open Social on (a) a product project, (b) a service project WITHOUT products, (c) a draft (unpublished) project → generate in all 3 modes, copy works, library survives refresh, delete works, no crash on missing testimonials/features. Landing editor/publish smoke: open `/edit/[token]`, publish flow unaffected.

---

## Phase 6 — X + Facebook presets

**Goal:** Activate the two remaining platforms as preset DATA (X ≤ 280 chars enforced); prove the one-engine claim.

Steps:
1. Edit `src/modules/social/presets.ts`: fill X preset (maxChars 280, punchy/conversational, no hashtag stuffing, single-thought format) + Facebook preset (~500-800 chars target, conversational-warm, short paras, optional question-CTA). Set `ACTIVE_PLATFORMS = ['linkedin','x','facebook']`.
2. Edit `src/modules/social/mockPosts.ts`: per-platform mock variants honoring maxChars (X mock < 280).
3. Extend `src/modules/social/postEngine.test.ts`: X preset prompt includes 280 constraint; `validatePostOutput` rejects 281-char X output; presets visibly differ (tone/length assertions); Facebook prompt sane.
   **Also close two phase-3 impl-review test nits (carried forward):**
   - (a) `clampToLimit`'s hard-cut branch is never exercised — the archetype mock body (~160 chars) never exceeds X's 280. Add a case feeding an over-budget input (long `freshContext` or `draft`) so the trim branch is actually covered.
   - (b) `postEngine.test.ts:107` asserts `toContain(ARCHETYPE_INSTRUCTIONS.announcement)`. If that map were emptied the lookup is `undefined`, the builder emits the literal `"undefined"`, and `.toContain(undefined)` coerces to `.includes("undefined")` → **the test still passes**. Replace with an assertion on the literal instruction text so an emptied archetype map goes red.
4. UI/route pick platforms up automatically from `ACTIVE_PLATFORMS` — expect ZERO changes; `SocialPostsPanel.tsx` listed only as safety valve if a hardcode slipped in phase 5.

**Files touched:**
- `src/modules/social/presets.ts`
- `src/modules/social/mockPosts.ts`
- `src/modules/social/postEngine.test.ts`
- `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx` (only if needed to de-hardcode; prefer no edit)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run build`. Manual (dev): generate one post per platform on same project → outputs visibly differ in length/tone; X output ≤ 280 chars (real-LLM spot check once, plus mock check).

---

## Phase 7 — Gating/caps + upgrade wall  **[HUMAN GATE]**

**Goal:** Free = 10 posts lifetime then upgrade wall; Pro = ~300/mo soft cap; counts read the append-only `UsageEvent` ledger keyed on CLERK id (D4-revised + D6); credits pool untouched.

Steps:
1. Create `src/modules/social/gating.ts`: pure helpers `getSocialPostWindow(tier)` → `'lifetime'` for FREE, `'monthly'` otherwise; `monthStartFor(period)` → `Date` from "YYYY-MM" — re-implemented locally because `getCurrentPeriod()` (`src/lib/creditSystem.ts:64-69`) is private/non-exported; keep boundary math consistent with it. **Note: the monthly window is a CALENDAR month, intentionally different from the page-gen credits' Stripe-anniversary reset — acceptable because the Pro cap is an invisible soft abuse cap, not a billed entitlement.** `buildSocialPostCountWhere(clerkId, window)` → pure prisma where-clause builder (`{ userId: clerkId, eventType: UsageEventType.SOCIAL_POST_GENERATION }` + monthly adds `createdAt: { gte: monthStartFor(...) }`); plus thin data fn `countSocialPostGenerations(clerkId, window)` = `prisma.usageEvent.count({ where: buildSocialPostCountWhere(...) })`. Parameters NAMED `clerkId` in every signature (D6) so a `userRecord.id` handoff reads wrong at the call site.
2. Create `src/modules/social/gating.test.ts`: window selection per tier; `monthStartFor` boundary math (month start, year rollover, "2026-01" → Jan 1); where-clause construction lifetime vs monthly (pure, no DB); **id-space swap test (D6): with a mocked `prisma.usageEvent.count`, call `countSocialPostGenerations(<clerkId>, ...)` and assert the where-clause carries exactly that Clerk id + the `UsageEventType.SOCIAL_POST_GENERATION` enum value — a test that FAILS if an internal `User.id` (or bare string eventType) is threaded through instead.**
3. Edit `src/lib/planManager.ts` **(gated)**: `checkLimit`'s `limitType` is `keyof PlanConfig['limits']` — so add `socialPosts` to the **NESTED `limits` sub-object of EACH tier** in `PLAN_CONFIGS` (:54-171): FREE 10, PRO 300, AGENCY -1, ENTERPRISE -1; then map `config.limits.socialPosts → socialPostsLimit` (DB column) in **ALL FOUR limit-column writers** (blocking-review finding — there are four, not three):
   - `createDefaultPlan` (:207-211)
   - `upgradePlan` (:256-260)
   - `downgradePlan` (:296-300)
   - **`startTrial` (:322-359 — writes limit columns at :338-343; LIVE, invoked by the Stripe webhook `src/app/api/stripe/webhooks/route.ts:197`).** Missing it would leave a trialing PRO/AGENCY user's row at its stale prior value (e.g. FREE's 10), capping a trialing Pro user at 10 posts — same "Pro user unaffected" acceptance violation as the phase-2 backfill bug, via a different path. `tsc` cannot catch it: a Prisma `update` needn't include the new field.
   Values must match the phase 2 backfill SQL. `checkLimit(clerkId, 'socialPosts', currentCount)` then works unmodified (it keys on Clerk id — D6). **Durable guard: adding ANY new `*Limit` column requires grepping `planManager.ts` for EVERY writer of the limit columns (currently four: `createDefaultPlan`, `upgradePlan`, `downgradePlan`, `startTrial`) — the compiler cannot enforce completeness on a Prisma `update`.** Record this guard as a comment near the `*Limit` writes and in `src/modules/social/README.md` is NOT needed — planManager comment suffices.
4. Edit `src/app/api/social/[token]/posts/route.ts` POST: BEFORE generation, `currentCount = countSocialPostGenerations(clerkId, window)` (window from user tier; clerkId from `auth()`, per D6) → `checkLimit(clerkId, 'socialPosts', currentCount)`; on fail return `{ success: false, error: 'limit_reached', remaining: 0, tier }` (no 402). Env-mock mode counts automatically (writes ledger row per phase 4/D7); demo-bearer path never reaches gating (no persist, no ledger). Deleting library posts does NOT restore allowance (ledger append-only). **TOCTOU acknowledged: two concurrent POSTs at 9/10 can both pass `checkLimit` → 11 posts; accepted for a soft cap, no locking added.** **No `consumeCredits`, no `UserUsage` writes.**
5. Edit `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx`: on `limit_reached` show upgrade wall — Free: blocking card with upgrade CTA (visually consistent with `src/components/billing/OutOfCreditsModal.tsx`, but a local component; do NOT edit billing components); Pro soft cap: quiet inline message ("monthly limit reached — resets next month"), invisible until hit per spec.

**Files touched:**
- `src/modules/social/gating.ts` (new)
- `src/modules/social/gating.test.ts` (new)
- `src/lib/planManager.ts`
- `src/app/api/social/[token]/posts/route.ts`
- `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx`

**Verification:** `npx tsc --noEmit`; `npm run test:run` (gating tests incl. id-space swap test + all prior green); `npm run build`. **Writer-completeness grep: `rg -n "socialPostsLimit" src/lib/planManager.ts` and assert it appears in ALL FOUR writers — `createDefaultPlan`, `upgradePlan`, `downgradePlan`, `startTrial` — plus `checkLimit`'s read path.** Manual (dev, env mock mode, real signed-in user): Free user generates 10 → 11th blocked with upgrade wall; deleting library posts does NOT unblock the 11th (ledger count unchanged); Pro user (post-backfill row = 300) unaffected; after blocking, `UserUsage.creditsRemaining` still unchanged; page-generation flow (onboarding generate) still consumes credits normally.

**human gate:** `planManager.ts` plan-limits edit (billing surface) — user sign-off on limit values (FREE 10 / PRO 300 / AGENCY -1 / ENTERPRISE -1; must equal phase 2 backfill) and enforcement semantics BEFORE implementing; sign-off explicitly covers the `startTrial` write.

---

## Global invariants (every phase)

- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green before phase commit.
- Zero edits to generation pipeline, editor stores, renderers, publish path (none of those files appear in any Files-touched list — enforced).
- No imports from `'use client'` files into server routes/modules; `src/modules/social/*` stays plain-module (published/client boundary landmine — not directly at risk here since no published renderer is touched, but keep the module server-safe).
- `SocialPost` persist + `UsageEvent` ledger write are atomic (D4-revised); `SOCIAL_POST_GENERATION` `UsageEvent` rows are NEVER deleted.
- **ID space (D6): ledger writes, gating counts, `checkLimit`, and `SocialPost.userId` all use the CLERK id from `auth()`; the internal `Project.userId` / `assertProjectOwner` `userRecord.id` NEVER flows into gating or ledger. Demo-bearer path (no clerkId) persists nothing (D7).**
- `prisma migrate dev` only (phase 2: `--create-only` + hand-edited backfill SQL, then apply), never `db push`.
- Merge to main = orchestrator's human gate (not planned here).

## Unresolved questions

1. `SocialPost.archetype` nullable for polish mode OK, or force `'polish'` sentinel?
2. (Resolved) delete-and-regen loophole: closed by counting append-only `UsageEvent`, not `SocialPost` rows (D4-revised).
3. (Resolved) `logUsageEvent()` CANNOT join `$transaction` (module-level prisma + swallows errors without rethrow) — phase 4 uses direct `tx.usageEvent.create`.
4. (Resolved) monthly window = calendar month, intentionally not Stripe anniversary; acceptable for invisible soft cap.
5. (Resolved — reviewer DISPROVED earlier assumption) `@default(10)` WOULD have permanently capped existing Pro rows at 10 — fixed via hand-edited backfill SQL in phase 2.
6. (Resolved) SQL↔TS backfill drift: cross-check is a phase-2 gate CHECKLIST item (side-by-side paste of PLAN_CONFIGS block vs backfill SQL) + `-- must equal PLAN_CONFIGS` comment in migration.sql.
7. (Resolved — round-2 blocker) limit-column writers = FOUR (`createDefaultPlan`/`upgradePlan`/`downgradePlan`/`startTrial`, the last live via Stripe webhook); phase 7 updates all four + grep verification + durable guard note.
8. (Resolved) mock-mode ledger id (D7): env-mock with real signed-in clerkId → full persist+ledger path (used for all gating verification); demo bearer (no clerkId) → ephemeral post, NO `SocialPost`/`UsageEvent` rows.
9. Pro soft cap message wording — surface "300/mo" number or keep vague?
10. `/dashboard/social/[token]` — small "Social" icon/label on ProjectCard, or text button fine?
11. X preset: threads later? (out of scope; single post ≤280 assumed.)
