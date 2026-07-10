# email-sequences — implementation audit

> **Phase 1 re-applied on `feature/social-posts` base (drift resolution).** The worktree
> is now based on `feature/social-posts`, not main. All Phase 1 edits are ADDITIVE alongside
> the existing social-posts entries (SocialPost model, socialPostsLimit, 'social-posts'
> endpoint, SOCIAL_POST_GENERATION event) — nothing social-posts was removed or modified.
> Migration pending orchestrator run.

## Phase 1 — Schema + shared plumbing

**Files changed**
- `prisma/schema.prisma`
- `src/lib/modelConfig.ts`
- `src/lib/creditSystem.ts`

### `prisma/schema.prisma`
- Added inverse relation field `emailSequence EmailSequence?` to `model Project`, directly after the existing `socialPosts SocialPost[]` relation (both kept).
- Added new `EmailSequence` model (placed before `model UserIntegration`):

```prisma
model EmailSequence {
  id        String   @id @default(cuid())
  userId    String
  projectId String   @unique
  tokenId   String
  intent    String
  archetype String
  emails    Json // [{ position, key, subject, body }]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenId])
}
```

### `src/lib/modelConfig.ts`
- Added `'emailSequence'` to the `Endpoint` union type (alongside existing `'social-posts'`).
- Added `emailSequence: { primary: GPT_4O_MINI, backup: null }` to BOTH the `cheap` and `production` maps, after each `'social-posts'` entry (which is unchanged). NO Anthropic backup (spec constraint — OpenAI-only path). `ModelConfig.backup` is typed `string | null`, so `null` type-checks.

### `src/lib/creditSystem.ts`
- Added `EMAIL_SEQUENCE_GENERATION = 'email_sequence_generation'` to the `UsageEventType` enum, after the existing `SOCIAL_POST_GENERATION` (unchanged). No `CREDIT_COSTS` entry, no `deductCredits` switch case, no planManager change (ungated, creditsUsed 0).

### Migration
- **Migration NOT run — awaiting human gate sign-off.** Proposed migration: `add_email_sequence`.
- `npx prisma generate` NOT run (no TS references the new model in Phase 1; unnecessary).

### Verification
- `npx tsc --noEmit`: green for all Phase 1 edits (filtered grep on `modelConfig|creditSystem|emailSequence` → "NO ERRORS"). Reported errors are all PRE-EXISTING and unrelated to this phase:
  - `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — missing asset, untouched.
  - `src/app/api/social/[token]/posts/**: Property 'socialPost' does not exist on PrismaClient` — the Prisma client has not been regenerated in this worktree, so the social-posts model isn't on the client yet. Same class as the pending emailSequence generate; resolved when the orchestrator runs the migration + `prisma generate`. Not caused by this phase's edits.
- `test:run` not run (no DB, no test-relevant surface for Phase 1).

### Deviations
- None material. Field added directly after `socialPosts SocialPost[]` matching existing alignment; no reflow of the social-posts line.

### Open risks
- Pre-existing unrelated tsc errors persist on the branch (missing `founder.jpg` asset; `socialPost` Prisma-client property absent until `prisma generate` runs) — none introduced here.
- Schema left edited but unmigrated by design — dev/prod DB is out of sync with schema until the orchestrator runs the migration.

## Phase 2 — Archetype map + prompt engine (Show-up only) + tests

**Files changed** (all new)
- `src/modules/email/archetypes.ts`
- `src/modules/email/brandContext.ts`
- `src/modules/email/sequenceEngine.ts`
- `src/modules/email/archetypes.test.ts`
- `src/modules/email/sequenceEngine.test.ts`

### `src/modules/email/archetypes.ts`
- Pure data module (no AI/Prisma/next/'use client' imports). Types: `EmailArchetypeId` (union of all 6 planned archetype ids for forward-compat; only `show-up` has a live def this phase), `EmailDef { key, purpose, timingLabel, promptInstructions }`, `SequenceDef { archetype, emails }`, `SequencePlan` (3-state union).
- `SHOW_UP_SEQUENCE`: 4 emails — confirm+agenda ("Send immediately after booking") → proof ("Send 2 days before") → 24h reminder ("Send 24h before") → 1h reminder ("Send 1h before"). Timing labels are static metadata (decision #2).
- Exhaustiveness enforced by a `const INTENT_PLAN: Record<GoalIntent, SequencePlan>` literal — the compiler rejects the file if any of the 18 frozen intents is missing. `getSequencePlanForIntent(intent)` is a pure lookup into it. 4 show-up → available; 5 no-email → skipped; remaining 9 (enquiry, request-quote, apply, lead-magnet, waitlist, subscribe-newsletter, enroll, signup-free, free-trial) → deferred.

### `src/modules/email/brandContext.ts`
- Pure defensive extractor (decision #7). `buildBrandContext(brief)` narrows `brief.facts.entry.{offer, offerings, audiences, testimonials}` + top-level `brief.proofAvailable` with `asRecord`/`str`/`strArray` helpers — never throws on missing/malformed input (tested against undefined/null/{}/`facts:'nope'`/`entry:5`). Returns `EmailBrandContext { offer?, offerings, audiences, testimonials, proofAvailable }` (array fields always arrays). `summarizeBrandContext(ctx)` → compact prompt block with a non-empty safe fallback; `hasTestimonials(ctx)` helper.
- Wrote NEW narrowing rather than importing `getEntryFacts` from classify.ts — keeps this module self-contained and maximally defensive (classify's reader assumes a well-formed object shape).

### `src/modules/email/sequenceEngine.ts`
- Pure module. `buildSequencePrompt({def, brandContext, intent})` and `buildSingleEmailPrompt({def, position, siblings, brandContext})` — both inject `summarizeBrandContext` + `PROOF_TRUTH_FRAGMENT` (paraphrased from copyPrompt.ts, NOT imported) + a testimonial-availability note; JSON-only output instruction (array for sequence, object for single).
- **Caps split OUT of the generateRawJson schemas (decision #10):** `sequenceOutputSchema(def)` = `z.array({subject,body}).length(def.emails.length)` and `SingleEmailOutputSchema` = `{subject,body}` — SHAPE ONLY (fields/types/length), NO subject/body max-char constraints. Length caps (`SUBJECT_MAX_CHARS=120`, `BODY_MAX_CHARS=2000`) live ONLY in `validateSequence()`/`validateSingleEmail()`, which return the `ok | invalid_shape | too_long` discriminated union (keyed on `status`). This keeps `too_long` distinguishable from `invalid_shape` for the phase-3 retry/trim contract.
- `mockSequenceOutput(def)` / `mockSingleEmailOutput()` for mock/demo — both pass their own schema + validator.

### Tests
- `archetypes.test.ts` (7 tests): all 18 intents resolve to a known status; 3-bucket partition covers the frozen vocabulary exactly; 4 show-up → available with 4-email defs, each email has non-empty static timingLabel/key/purpose/promptInstructions; last two carry "Send 24h before"/"Send 1h before"; 5 skip → skipped; 9 deferred incl. explicit signup-free/free-trial.
- `sequenceEngine.test.ts` (15 tests): brandContext extraction + never-throws on malformed; sequence prompt contains brand facts + proof-truth fragment + JSON instruction + intent + each email purpose/timingLabel; single-email prompt references target position ("email 2 of 4") + sibling copy + proof fragment; validate ok/invalid_shape(length mismatch + missing field)/too_long; **over-cap payload PASSES `sequenceOutputSchema`/`SingleEmailOutputSchema` but fails validator as too_long** (guards decision #10); mocks pass their own schema + validator.

### Verification
- `npx tsc --noEmit`: fully GREEN (0 errors — the prior founder.jpg/next-env issue is fixed in this worktree).
- `npm run test:run`: GREEN — **1807 passed | 3 skipped** (was 1785; +22 new email tests). Email module isolated run: 2 files, 22 passed.

### Deviations
- `EmailArchetypeId` enumerates all 6 planned archetype ids (not just `show-up`) — forward-compat for phase 6, zero runtime effect (conservative, in-scope).
- `sequenceOutputSchema` is exported as a factory `(def) => schema` (the array length is def-dependent) rather than a bare const; `SingleEmailOutputSchema` is a const. Both remain cap-free per decision #10.
- Added a `hasTestimonials` helper in brandContext.ts (small, in-scope) used by both prompt builders.

### Open risks
- None specific to phase 2. Prompt copy quality is validated at the phase-5 human gate; wording tweaks land in these same two engine files.

---

## Phase 3 — API routes + kill-switch

**Files changed**
- `src/app/api/email-sequences/[token]/route.ts` (new) — GET, POST, DELETE
- `src/app/api/email-sequences/[token]/regenerate/route.ts` (new) — POST {position}
- `.env.example` (new — did not exist; see Deviations)

### `[token]/route.ts` — handlers
- **GET**: kill-switch → auth/`assertProjectOwner` → load `Project.brief` → `resolvePlan()` (BriefSchema.safeParse → intent → `getSequencePlanForIntent`) → returns `{sequence, status}`. Demo bearer or no persisted row → `{sequence:null, status}`. Persisted row → emails merged with static `timingLabel`+`purpose` from the archetype def via `withTimingLabels()`. `findFirst({where:{tokenId}})` (tokenId is not `@unique`; only `projectId` is).
- **POST** (generate whole sequence): kill-switch → auth/owner → load brief → `resolvePlan()`; `status !== 'available'` OR missing goal/def/intent → **409 JSON** `{error:'not_available', status}` (no throw). Demo bearer → ephemeral `mockSequenceOutput`, persists nothing. Else `NEXT_PUBLIC_USE_MOCK_GPT` → mock; real path → `generateSequenceEmails()`. Persist via `prisma.$transaction([ emailSequence.upsert({where:{projectId}}), usageEvent.create({eventType: EMAIL_SEQUENCE_GENERATION, creditsUsed:0}) ])`. Stored emails = `{position, key, subject, body}` (key from def slot). `clerkId` (not internal id) into both `userId` fields. Wrapped in `withAIRateLimit`.
- **DELETE**: kill-switch → auth/owner → `findFirst` row, verify `row.userId === clerkId` → `emailSequence.delete`. Demo/no-row → 404.

### `[token]/regenerate/route.ts` — handler
- **POST** `{position}`: kill-switch → validate body (`z.number().int().min(0)`) → auth/owner → load existing sequence (`findFirst`; 404 if none or not owner) → resolve def from `row.intent` via `getSequencePlanForIntent` (409 if no longer available) → range-check position → load brief for brand context → build `siblings` (all stored emails except target) → mock or `buildSingleEmailPrompt` + `regenerateEmail()`. Read-modify-write: `nextEmails` = stored with ONLY `emails[position]` replaced (key/position preserved). `$transaction([ update, usageEvent.create ])` — same `EMAIL_SEQUENCE_GENERATION` type, metadata `{regen:true, position, ...}`. Wrapped in `withAIRateLimit`.

### Retry / validate split wiring (decisions #9 + #10)
- `generateRawJson('emailSequence', prompt, sequenceOutputSchema(def) | SingleEmailOutputSchema)` runs the SHAPE-only schema's `.parse` internally. The returned object is then passed to `validateSequence()` / `validateSingleEmail()` which enforce the char caps and return a discriminated `{status: ok | invalid_shape | too_long}`.
- `attemptSequence`/`attemptSingle`: LLM throw → `invalid_shape`. Then one retry: `too_long` appends a stricter length instruction; `invalid_shape` re-sends the same prompt. After retry: `ok` → emails; `too_long` → trim via `trimToSentence` (subject cap 120, body cap 2000); `invalid_shape` → throw → route returns **500 `generation_failed`**. This keeps `too_long` distinguishable because caps are NOT in the generateRawJson schema.

### Tx shape
- Both routes use a `prisma.$transaction([...])` array of raw client writes (upsert/update + `usageEvent.create`) — NOT `logUsageEvent` (it can't join a tx), mirroring the social route. Either both rows persist or neither.

### Kill-switch placement
- `isDisabled()` = `process.env.NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true'` is the **FIRST statement** in every handler: GET, POST (both the exported `POST` wrapper AND the inner `generateHandler`), DELETE, and regenerate's exported `POST` + inner `regenerateHandler`. Returns 404-style JSON `{success:false, error:'not_found'}`.
- Demo bearer path: `access.isDemo` → POST returns ephemeral `mockSequenceOutput` (persist nothing); GET returns `{sequence:null, status}`; DELETE/regenerate return 404.

### Deviations
- **`.env.example` did not exist and is gitignored** (`.gitignore` line 34: `.env*`). Created it with the single documented kill-switch var per the Files-touched list. Because `.env*` is gitignored it won't be committed unless force-added; the var is still documented for anyone who opts to track the file. Conservative in-scope choice (file was on the list).
- **Missing `goal.intent` → status `'skipped'`** in `resolvePlan()` (one of the three enumerated statuses), so GET/POST render the same clean not-available state. POST returns 409 for it (no throw), matching the plan's "missing goal → 409/404".
- **`tokenId` lookups use `findFirst`, not `findUnique`** — only `projectId` carries `@unique` on EmailSequence; tokenId is a plain (indexed) column. Functionally 1:1.

### Test results
- `npx tsc --noEmit` — green (0 errors).
- `npm run test:run` — 1807 passed, 3 skipped (unchanged from phase 2; no new tests this phase).

### Open risks
- `generateRawJson`'s JSON extraction regex (`aiClient.ts`) captures `{...}` objects; a bare (un-fenced) JSON **array** response for the full sequence could mis-extract. Not exercised under mock; real-LLM path is validated at the phase-5 gate. Out of scope (aiClient not in Files touched).

### Phase 3 follow-up — full-sequence output wrapped in an object (coordinator correctness fix)
Wrapped full-sequence output in a `{emails:[...]}` object so aiClient's object-brace extraction (`/(\{[\s\S]*\})/`, src/lib/aiClient.ts:229-231) handles unfenced responses — a bare top-level array would not match. Pattern-consistent with social-posts' `{post}`. Single-email output was already object-shaped and is unchanged.

Edit sites (also spans phase-2 engine + its test, per coordinator's explicit cross-phase instruction):
- `src/modules/email/sequenceEngine.ts`: `sequenceOutputSchema(def)` now `z.object({ emails: z.array(...).length(...) })` (still cap-free, decision #10 intact); `buildSequencePrompt` OUTPUT block now demands `{"emails":[...]}`; `validateSequence` reads `.emails`; `mockSequenceOutput` returns `{ emails: [...] }`.
- `src/modules/email/sequenceEngine.test.ts`: full-sequence tests updated to the `{emails:[...]}` shape (schema parse, ok/invalid_shape/too_long incl. over-cap-passes-schema, mock); added a bare-array → invalid_shape case; prompt-output assertion now checks `JSON object` + `"emails"`. Single-email tests unchanged.
- `src/app/api/email-sequences/[token]/route.ts` POST: mock/demo paths read `.emails` from `mockSequenceOutput(def)`. Real path unchanged (`generateSequenceEmails` still returns `EmailItem[]` from `validateSequence().emails`).

tsc green (0 errors); test:run green (1808 passed, 3 skipped — +1 new bare-array test).

- GET resolves timing-label def from `row.intent` (via `getSequencePlanForIntent`), matching regenerate — not the current brief intent, so editing the project goal after generating never mangles/drops labels on the stored sequence; non-available stored intent → labels blank, stored subjects/bodies preserved. Current brief still drives the `status` field + no-row empty state.
