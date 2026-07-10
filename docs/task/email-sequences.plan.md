# email-sequences — implementation plan

> Branch `feature/email-sequences` · Worktree `.claude/worktrees/feature-email-sequences` · based off `main`
> Spec: `docs/task/email-sequences.spec.md`

## Overview

Clone the social-posts pattern (prompt engine → generation route → copy-block dashboard UI) to generate ONE goal-matched email sequence per project from the Brief — copy only, Lessgo does not send. Archetype is keyed off `brief.goal.intent` (18-value frozen vocabulary, NOT mechanism). **Critical:** social-posts lives only on `feature/social-posts` and is NOT on main — nothing from it exists in this worktree. Every file here is NEW, and the shared-file edits (modelConfig, creditSystem, ProjectCard, schema.prisma) are RE-CREATED for email, not merged. Pilot slice = Show-up archetype end-to-end, human-gated on real-customer quality before the other 4 archetypes.

## Progress log

- phase 1 schema + shared plumbing: done (commit 9a39b1f0, review loops 0 — trivial additive, tsc+1785 tests+migration green) | base=feature/social-posts (drift resolution); worktree has isolated node_modules
- phase 2 archetype map + prompt engine (Show-up): done (commit 353efc14, review loops 1 → ship; tsc+1807 tests green, +22)
  - PHASE-5 CARRY: reviewer flag — real captured testimonials render quoted in prompt; if one contains a hard metric it will legitimately appear in-quote (by design, not a proof-truth violation). Human-verify at pilot copy gate.
- phase 3 API routes + kill-switch: done (commit 32277b7f, review loops 1 → ship; tsc+1808 tests green). Notes: full-sequence output wrapped as {emails:[...]} object (aiClient object-brace extraction); GET resolves timing-label def from row.intent. .env.example is gitignored → NOT committed; kill-switch NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED documented here + must be surfaced at Phase 7 merge/deploy gate.
- phase 4 dashboard UI + nav: done (commit e2afb796, review loops 1 → ship; tsc+1808 tests green). Server page + single client panel (per-email Copy/Regenerate, Generate/Regen-all, Delete, 3-state empty); ProjectCard "Emails" button (tokenId, kill-switch hidden). Live authed route/UI smoke deferred to Phase 5 (routes are Clerk-protected — curl-without-auth can't reach; correct by design).
- phase 5 pilot quality gate: SKIPPED by user (2026-07-10) — build all archetypes, validate together before merge gate. Show-up real-LLM copy NOT yet human-validated; fold quality check + PHASE-5 CARRY testimonial-metric flag into Phase 7 pre-merge review.
- phase 6 remaining 4 archetypes: done (commit 048cecda, review loops 1 → ship; tsc+1810 tests green). 4 defs added, 7 intents flipped deferred→available (now 11 available / 2 deferred / 5 skipped). Data-only, no route/UI/engine change.
- phase 7 final verification + merge: pending

## Key design decisions (bind all phases)

1. **Data model — one `EmailSequence` row per project with an `emails` Json array** (`[{position, key, subject, body}]`), `@@unique([projectId])`. NOT parent+child rows. Justification: a sequence is generated/replaced as an atomic unit; per-email regen is a read-modify-write at `position` under owner-only access (no concurrent-writer pressure, Clerk-authed single owner); per-email copy is client-side (needs no server addressability beyond array index); one table = one migration, no cascade wiring. Whole-sequence regenerate = upsert-replace.
2. **Timing labels are static archetype metadata** (e.g. "Send 24h before the call") defined in the archetype map, NOT stored in the row and NOT AI-generated. Derived at render from `archetype` + `position` — wording fixes apply retroactively. AI output = subject + body only.
3. **Intent resolution is a 3-state function**: `getSequencePlanForIntent(intent)` → `{status:'available', def} | {status:'deferred'} | {status:'skipped'}`. Skipped (follow-social, buy-via-link, order-via-platform, pay-via-link, download-app) and deferred (signup-free, free-trial — Activation, plus the 4 non-pilot archetypes until phase 6) both render the same clean "not available for this goal" empty state — never an error. Routes return 404-style JSON for non-available intents.
4. **Nav visibility:** ProjectCard "Emails" button shows for any project with `tokenId` (drafts included, like the social pattern); the page itself owns the unmapped-intent empty state. Hiding the button per-intent would require piping `goal.intent` through the projects-list payload (extra shared-file edit) — deliberately skipped for v1; the clean-empty-state acceptance criterion is met by the page.
5. **Kill-switch (recommended, ADD IT — social-posts lacks one and the spec forbids deploying without gating or kill-switch):** single env var `NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED`. When `'true'`: API routes return 404, dashboard page shows "not available", ProjectCard hides the button. `NEXT_PUBLIC_` so the client button and server routes read the same var. Default (unset) = enabled — confirming this default is a Phase 7 merge-gate decision. Ungated credits-wise (creditsUsed: 0) like social-posts; real gating lands with pricing-v2.
6. **Routes** (new namespace, no collision with unmerged social-posts):
   - `GET/POST/DELETE /api/email-sequences/[token]` — fetch current / generate full sequence (upsert-replace) / delete.
   - `POST /api/email-sequences/[token]/regenerate` — body `{position}`, regenerates ONE email in place (siblings passed as prompt context for coherence).
7. **Brief reads are defensive:** `BriefSchema.facts` is `z.record(z.string(), z.unknown())` — `facts.entry.{offer, offerings, audiences, testimonials}` is untyped. `brandContext.ts` extracts with runtime narrowing + fallbacks; missing facts degrade the prompt gracefully, never throw.
8. **Proof-truth rules paraphrased into the prompt** (source: `src/modules/audience/product/copyPrompt.ts` PROOF_ELEMENT_GUARD ~L81 + global rules ~L177/182/404 — paraphrase, do not import): never attribute quotes to real/invented COMPANY names; no specific numbers/%/$/ROI inside quotes; realistic-but-honest general testimonial framing (founder verifies before use); fictional first-name persona OK.
9. **Provider path — OpenAI-ONLY for this feature (spec constraint: not Anthropic):** `generateRawJson('emailSequence', prompt, zodSchema)` via `@/lib/aiClient`. `getProvider` knows only `'openai' | 'anthropic'` — there is NO Nebius branch in this path — so the invariant is: this endpoint must never route to the `'anthropic'` provider. Endpoint config = `{ primary: GPT_4O_MINI, backup: null }` in BOTH tiers; `ModelConfig.backup` is already typed `string | null` and `aiClient` skips fallback when backup is null (verified: `src/lib/aiClient.ts` L247/L280 guard on `backup &&`). `NEXT_PUBLIC_USE_MOCK_GPT` short-circuit in routes using an engine-exported mock. Retry contract: `invalid_shape` → retry once then 500; `too_long` → retry once then trim.
10. **Length caps live OUTSIDE the generateRawJson schema.** The zod schemas passed to `generateRawJson` (`SequenceOutputSchema`, `SingleEmailOutputSchema`) validate SHAPE ONLY (fields, types, array length vs def) with NO subject/body max-char constraints — `generateRawJson` runs `schema.parse` internally, so caps inside that schema would surface as parse failures and make `too_long` indistinguishable from `invalid_shape`, breaking the retry/trim contract. Caps are enforced ONLY in `validateSequence()`/`validateSingleEmail()` on the returned object.
11. **Persistence is atomic:** `prisma.$transaction` writes the `EmailSequence` upsert AND the `UsageEvent` row together (raw tx writes, NOT `logUsageEvent` — it can't join a tx). Demo bearer → ephemeral mock response, persists nothing.

---

## Phase 1 — Schema + shared plumbing  **[HUMAN GATE: schema/migration — get sign-off before running `prisma migrate dev`]**

**Files touched**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_email_sequence/migration.sql` (generated)
- `src/lib/modelConfig.ts`
- `src/lib/creditSystem.ts`

**Steps**
1. `prisma/schema.prisma`: add model
   `EmailSequence { id String @id @default(cuid()); userId String; projectId String @unique; tokenId String; intent String; archetype String; emails Json; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt; project Project @relation(fields:[projectId], references:[id], onDelete: Cascade) }` + `@@index([userId])`, `@@index([tokenId])`; add `emailSequences EmailSequence[]`-style relation field on `Project` (singular `emailSequence EmailSequence?` given the unique). Match existing model conventions in the file.
2. Run `npx prisma migrate dev --name add_email_sequence` (NEVER `db push`).
3. `src/lib/modelConfig.ts`: add `'emailSequence'` to the `Endpoint` union; add `emailSequence: { primary: GPT_4O_MINI, backup: null }` to BOTH `cheap` and `production` maps. **NO Anthropic backup** — spec constraint (OpenAI path only); the feature must never route to the `'anthropic'` provider. `ModelConfig.backup: string | null` already permits null; `aiClient` makes no fallback attempt when backup is null.
4. `src/lib/creditSystem.ts`: add `EMAIL_SEQUENCE_GENERATION = 'email_sequence_generation'` to `UsageEventType`. No `CREDIT_COSTS` entry, no planManager gate (ungated, same as social-posts). No new `deductCredits` switch case needed (creditsUsed 0; routes write the ledger row directly in-tx).

**Verification:** migration applies clean on dev DB; `npx prisma generate` OK; `npx tsc --noEmit` green; `npm run test:run` green (no regressions).

---

## Phase 2 — Archetype map + prompt engine (Show-up only) + tests

**Files touched**
- `src/modules/email/archetypes.ts` (new)
- `src/modules/email/brandContext.ts` (new)
- `src/modules/email/sequenceEngine.ts` (new)
- `src/modules/email/archetypes.test.ts` (new)
- `src/modules/email/sequenceEngine.test.ts` (new)

**Steps**
1. `archetypes.ts` — pure data, no AI/Prisma/next imports:
   - Types: `EmailArchetypeId`, `EmailDef { key, purpose, timingLabel, promptInstructions }`, `SequenceDef { archetype, emails: EmailDef[] }`.
   - Full 18-intent map: Show-up (book-call, request-demo, book-me, rsvp) → 4-email def (confirm+agenda → proof → 24h reminder "Send 24h before" → 1h reminder "Send 1h before"); the 5 no-email intents → `skipped`; signup-free/free-trial → `deferred`; the other 4 archetypes' intents (enquiry, request-quote, apply, lead-magnet, waitlist, subscribe-newsletter, enroll) → `deferred` UNTIL phase 6.
   - Export `getSequencePlanForIntent(intent: GoalIntent)` returning the 3-state union (decision #3). Import `GoalIntent` from `@/modules/goals/vocabulary` for exhaustiveness.
2. `brandContext.ts` — defensive Brief extractor (decision #7): `buildBrandContext(brief)` → `{ offer, offerings, audiences, testimonials, proofAvailable }` with narrowing, plus a `summarizeBrandContext()` string builder for prompts.
3. `sequenceEngine.ts` — pure module:
   - `buildSequencePrompt({ def, brandContext, intent })` — instructs subject+body per email using each `EmailDef.promptInstructions`; includes proof-truth fragment (decision #8); JSON-only output instruction.
   - `buildSingleEmailPrompt({ def, position, siblings, brandContext })` — regen one email, siblings as coherence context.
   - Zod schemas: `SequenceOutputSchema` (array of `{subject, body}`, length-checked against def), `SingleEmailOutputSchema`. **SHAPE ONLY — no subject/body max-char constraints in these schemas** (decision #10: they are handed to `generateRawJson`, whose internal `schema.parse` would otherwise collapse `too_long` into `invalid_shape`).
   - `validateSequence()` / `validateSingleEmail()` → discriminated union `ok | invalid_shape | too_long`. Subject/body length caps are enforced HERE and only here (decision #10).
   - `mockSequenceOutput(def)` / `mockSingleEmailOutput()` for `NEXT_PUBLIC_USE_MOCK_GPT` + demo.
4. Tests:
   - `archetypes.test.ts`: every one of the 18 intents resolves (exhaustive); 4 show-up intents → available, 4 emails, each has a non-empty static `timingLabel`; 5 skip intents → `skipped`; signup-free/free-trial → `deferred`; keyed off intent only (no mechanism arg exists).
   - `sequenceEngine.test.ts`: prompt contains brand-context facts + proof-truth fragment; validate ok/invalid_shape/too_long paths (incl. over-cap subject/body PASSES `SequenceOutputSchema` but fails `validateSequence` as `too_long` — guards decision #10); single-email prompt references the target position + siblings; mock output passes its own schema.

**Verification:** `npm run test:run` green (new tests included); `npx tsc --noEmit` green.

---

## Phase 3 — API routes + kill-switch

**Files touched**
- `src/app/api/email-sequences/[token]/route.ts` (new)
- `src/app/api/email-sequences/[token]/regenerate/route.ts` (new)
- `.env.example`

**Steps**
1. `[token]/route.ts` (all handlers wrapped in `withAIRateLimit` where AI is invoked; `createSecureResponse` + `logger` throughout):
   - Kill-switch first: `NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true'` → 404.
   - Auth: `assertProjectOwner(clerkId, tokenId, {action})` from `@/lib/security`; demo bearer → ephemeral `mockSequenceOutput`, persist nothing.
   - **GET**: return current sequence (row + per-email `timingLabel` merged from archetype def) or `{sequence: null, status}` where status reflects available/deferred/skipped for the project's intent.
   - **POST** (generate): load `Project.brief` → parse via `BriefSchema.safeParse` → `getSequencePlanForIntent(brief.goal.intent)`; non-available or missing goal → 409/404 JSON (no throw). Mock short-circuit via `NEXT_PUBLIC_USE_MOCK_GPT`. Else `generateRawJson('emailSequence', prompt, SequenceOutputSchema)` — the cap-free SHAPE schema — then run `validateSequence()` on the returned object (decision #10 keeps `too_long` distinguishable from `invalid_shape`); retry contract per decision #9 (`invalid_shape` → retry once then 500; `too_long` → retry once then trim). Persist: `prisma.$transaction([ emailSequence.upsert(by projectId), usageEvent.create({eventType:'email_sequence_generation', creditsUsed:0, …}) ])`.
   - **DELETE**: owner-checked delete of the project's sequence.
2. `[token]/regenerate/route.ts` — **POST** `{position}`: same guards; load existing sequence (404 if none); `buildSingleEmailPrompt` with siblings; `generateRawJson` with the cap-free `SingleEmailOutputSchema` then `validateSingleEmail()` (same retry/trim split); write back the emails array with only `emails[position]` replaced, in a tx with a `UsageEvent` row (same event type, `metadata` marks regen + position).
3. `.env.example`: add `NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED` with a one-line comment (kill-switch; unset/false = enabled, `true` = feature off: routes 404, nav hidden, page shows unavailable state).

**Verification:** `npx tsc --noEmit` green; manual against `npm run dev` with `NEXT_PUBLIC_USE_MOCK_GPT=true`: POST → sequence persisted, GET returns it with timing labels, regenerate position 1 changes only that email, DELETE clears, unmapped-intent project → clean JSON status, kill-switch env → 404.

---

## Phase 4 — Dashboard UI + nav entry

**Files touched**
- `src/app/dashboard/emails/[token]/page.tsx` (new)
- `src/app/dashboard/emails/[token]/EmailSequencePanel.tsx` (new)
- `src/components/dashboard/ProjectCard.tsx`

**Steps**
1. `page.tsx` — server component: `assertProjectOwner`-gated, keyed on tokenId, works on drafts. Reads `Project.brief` → intent → sequence plan. Renders: kill-switch or skipped/deferred/missing-goal → clean "Email sequences aren't available for this project's goal" state (no error); available → header (archetype name + "copy-only — paste into Calendly Workflows / your ESP") + `<EmailSequencePanel>`.
2. `EmailSequencePanel.tsx` — ONE client component (single-sequence model needs no Generator/Library split or `window` CustomEvent — simplification vs social-posts, note in code comment): GET on mount; "Generate sequence" / "Regenerate all" button (text-label swap "Generating…", no spinner); per-email card = position + static timing label + subject + body, per-email **Copy** button (subject+body to clipboard) and **Regenerate** button (per-email, label swap); Delete sequence; clean empty state pre-generation.
3. `ProjectCard.tsx` — add "Emails" button (`router.push('/dashboard/emails/${project.tokenId}')`) in the actions row for any project with `tokenId` (both Draft and Published branches — unlike Analytics/Forms it doesn't need a slug); hidden when `NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true'`. Match existing button styling (~L104–148).

**Verification:** `npx tsc --noEmit` green; manual on `npm run dev`: dashboard → Emails → generate (mock + one real-LLM run) → per-email copy works → regenerate one email in place → unmapped-intent project shows empty state → kill-switch hides button + page content.

---

## Phase 5 — Pilot quality gate  **[HUMAN GATE: validate Show-up sequence quality with a real customer before building the other archetypes]**

**Files touched**
- (none — validation phase; prompt tweaks, if any, go to `src/modules/email/sequenceEngine.ts` / `src/modules/email/archetypes.ts` only)

**Steps**
1. User runs real-LLM generation on a real book-call project (e.g. an actual customer Brief).
2. Check: Brief facts used, no fabricated company names/hard metrics in proof emails, timing labels sensible, paste-ready formatting.
3. Iterate prompt instructions in-place if needed (same two engine files, re-run phase 2 tests).

**Verification:** user sign-off on copy quality; `npm run test:run` + `npx tsc --noEmit` green after any prompt tweaks.

---

## Phase 6 — Remaining 4 archetypes

**Files touched**
- `src/modules/email/archetypes.ts`
- `src/modules/email/archetypes.test.ts`

**Steps**
1. Add sequence defs + per-email `promptInstructions` + timing labels: Follow-up nurture (enquiry, request-quote, apply — 4: instant reply → proof → objection-killer → direct CTA), Lead-magnet delivery (lead-magnet — 4: deliver → consume nudge → related proof → offer), Waitlist warm-keeper (waitlist — 3: you're in → update/story → early-access offer), Welcome series (subscribe-newsletter, enroll — 3: welcome+expectations → best content/story → soft offer). Flip those intents from `deferred` → `available`. Activation (signup-free, free-trial) STAYS deferred; the 5 skip intents stay skipped.
2. Update `archetypes.test.ts`: 11 intents now available with correct email counts/timing labels; skip/deferred cases unchanged. No route/UI/engine changes needed (rail is archetype-agnostic).

**Verification:** `npm run test:run` green; manual mock generate for one intent per new archetype (e.g. enquiry, lead-magnet, waitlist, subscribe-newsletter) on dev.

---

## Phase 7 — Final verification + merge  **[HUMAN GATE: merge to main; confirm kill-switch stance before any deploy]**

**Files touched**
- (none — verification + merge)

**Steps**
1. Full local gate (no-PR workflow — everything green BEFORE user pushes main): `npx tsc --noEmit`, `npm run test:run`, `npm run build`.
2. Remind at gate: feature ships credit-UNGATED (creditsUsed 0) per spec; kill-switch = set `NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED=true` in Vercel to disable post-deploy; **confirm the default-ON (unset = enabled) stance here** — flipping to default-OFF is a one-line change if the user prefers dark-launch; real gating lands with pricing-v2. `prisma migrate deploy` runs via postinstall on deploy — prod migration rides the normal path.
3. User merges to main (plain merge, no squash) + pushes; deploy-watcher per standard flow.

**Verification:** `npm run build` green (mandatory); tsc + test:run green; user merge sign-off.

---

## Unresolved questions

1. Single current sequence per project (upsert-replace) OK, or want a library/history of sequences like social-posts?
2. "Emails" nav button always visible (page owns empty state) OK, or pipe `goal.intent` into projects-list payload to hide per-intent?
3. Kill-switch default-ON (unset = enabled) acceptable, or default-OFF until pricing-v2 gating? (decided at Phase 7 gate)
4. Per-email regen: reuse `email_sequence_generation` UsageEvent type w/ metadata, or separate `email_regen` type?
5. Legacy projects w/o `brief.goal` (pre-scale) → empty state fine, or fall back to legacy goal enums?
