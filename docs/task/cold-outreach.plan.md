# cold-outreach — implementation plan

**Branch:** `feature/cold-outreach` (stacked on `feature/email-sequences` → `feature/social-posts`)
**Worktree:** `C:\Users\susha\lessgo-ai\.claude\worktrees\feature-social-posts` — all paths below relative to this root.
**Spec:** `docs/task/cold-outreach.spec.md` (the contract — honor Scope OUT, proof-truth, pilot slice).

## Overview

Generate platform-correct cold-outreach copy grounded in a specific prospect: user pastes prospect URL (or raw text), we scrape it with the existing SSRF-safe crawler, extract prospect facts with our own prompt/schema, and produce messages tying THEIR business to the sender's Brief. Clones the email-sequences rail (pure engine module + kill-switch-gated routes + dashboard panel), with a new project-scoped prospect-scrape cache and its own credit/ledger entries. Pilot slice = cold email + LinkedIn connection note, URL-grounding end-to-end with raw-text and scrape-fail fallbacks; remaining platforms + bump are prompt-template additions.

## Progress log

- phase 1 data layer: done (review loops 1, ship) — migration 20260710202106_cold_outreach, tsc+test green
- phase 2 prospect grounding: done (review loops 1, ship) — extraction module + scrape cache lib, tsc+test green
- phase 3 generation engine: done (review loops 1, ship) — platforms + outreachEngine + 21 tests, tsc+test green
- phase 4 API routes: done (review loops 1, ship) — intake/generate/regenerate, demo-first+charge-on-miss verified, tsc+test green
- phase 5 UI: done (review loops 1, ship) — dashboard page + OutreachPanel + gated ProjectCard button; PILOT SLICE complete e2e; tsc+test green
- phase 6 remaining platforms + bump: pending
- phase 7 final verification: pending

## Key design decisions (locked for implementers)

1. **Prospect-scrape cache = NEW project-scoped `ProspectScrape` table**, NOT SiteContext reuse. Rationale (conservative choice): SiteContext is the onboarding *sender-side* cache — global url-keyed, cross-user, with an extraction shape (extract/facts/excerpts, 7+ fields) tuned for onboarding hydration. Cold-outreach extraction targets different fields (what prospect does / for whom / notable specifics) and must be owned by the user's project (ownership, `onDelete: Cascade`, per-project "re-generate doesn't re-scrape" per spec). Reusing SiteContext would couple two features' extract schemas and pollute a global cache with prospect sites. Mirror `src/lib/siteContext.ts` urlKey normalization + `scrapedAt` TTL, but new table + new lib.
2. **Crawler is reused as-is:** `import { scrapeSite, ScrapeError } from '@/lib/scrape/fetchSite'` — SSRF guards live inside the lib; NO phase touches `src/lib/scrape/*` or `src/app/api/v2/scrape-website/route.ts`. Extraction is our own `generateWithSchema` call over `site.combinedText`.
3. **Generated messages = many-row library** (`OutreachMessage`, like `SocialPost`), not single-row: user generates per-prospect repeatedly. Each row carries a denormalized `grounding Json?` snapshot (extracted prospect facts or pasted-text summary) so regenerate is self-contained even after cache expiry.
4. **Intake = single-row `OutreachIntake`** (`projectId @unique`, upsert-replace — mirror `EmailSequence`).
5. **Sender context reused from email rail:** `buildBrandContext`/`summarizeBrandContext`/`hasTestimonials` from `src/modules/email/brandContext.ts` and `PROOF_TRUTH_FRAGMENT` from `src/modules/email/sequenceEngine.ts` — pure, tested modules encoding exactly "sender claims only from Brief". Both features live on this stacked branch; fork later only if they diverge.
6. **Char/word caps live OUTSIDE zod output schemas** (email decision #10): shape-only schemas for `generateRawJson`; caps enforced only in `validateOutreachMessages`, keeping `too_long` distinguishable from `invalid_shape` for the retry/trim contract.
7. **Kill-switch:** `NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true'` checked FIRST in every route handler + the page + hides the ProjectCard button. Own switch, independent of social/email switches.
8. **Credits:** new `CREDIT_COSTS.OUTREACH_SCRAPE = 1` + `UsageEventType.OUTREACH_SCRAPE` (charged via `consumeCredits` ONLY on cache-miss/stale) + `UsageEventType.OUTREACH_GENERATION` with `creditsUsed: 0` (ledger row = gating source-of-truth, sibling precedent). Do NOT reuse `SCRAPE_WEBSITE` — ledgers stay distinct.
9. **Model config:** add `'cold-outreach'` endpoint key to `src/lib/modelConfig.ts`, `{ primary: GPT_4O_MINI, backup: null }` (OpenAI/Nebius path per spec, no Anthropic — email precedent).
10. **One AI call per generate** covering all selected platforms (JSON `{messages:[{platform, subject?, body}]}`, mirrors sequence slots); regenerate = single-platform call with siblings as coherence context.
11. **ID space:** `clerkId` from `auth()` into both feature-table `userId` and `UsageEvent.userId`; persist + ledger in ONE `$transaction` with `tx.usageEvent.create` directly (email decision #11). Demo bearer → ephemeral mock, persists nothing.
12. **Grounding ladder + fallback contract:** URL → cache-hit or scrape+extract (charge on miss). Raw text → used directly (never fetched — LinkedIn ToS). Scrape fail/blocked or extraction invalid → generate anyway from Brief+intake only, response marked `groundingLevel: 'generic'`, UI shows "generic — add prospect info" notice; never a hard error to the user. **Demo bearer never enters this ladder:** the demo/mock short-circuit runs FIRST in the handler (before intake load, scrape, or any spend) — no `scrapeSite`, no `consumeCredits`, no persist. On the URL cache-miss path, credits are checked BEFORE the scrape (0-credit user rejected pre-network — conservative contract; generation itself stays credits-free).

---

## Phase 1 — Data layer: Prisma models + migration + credit constants + model key

**HUMAN GATE — schema migration. Get sign-off on the models below before running `npx prisma migrate dev`.**

Steps:
1. Add three models to `prisma/schema.prisma` (+ back-relations on `Project`), following `EmailSequence`/`SocialPost` conventions (bare `userId`, `tokenId`, `onDelete: Cascade`):
   - `OutreachIntake` — `id`, `userId`, `projectId @unique`, `tokenId`, `targetDescriptor String @db.Text`, `platforms Json` (string[]), `openerContext String? @db.Text`, `createdAt`, `updatedAt`. Indexes: `[userId]`, `[tokenId]`.
   - `ProspectScrape` — `id`, `userId`, `projectId`, `tokenId`, `urlKey String` (normalized: lowercase host, strip www + trailing slash — mirror SiteContext), `urlRaw String`, `pages Json` (bounded ScrapedPage[]), `extract Json` (prospect extraction payload), `model String @default("gpt-4o-mini")`, `scrapedAt DateTime @default(now())`, `createdAt`. `@@unique([projectId, urlKey])`; index `[tokenId]`.
   - `OutreachMessage` — `id`, `userId`, `projectId`, `tokenId`, `platform String`, `kind String @default("initial")` (`initial | bump`), `groundingLevel String` (`prospect | generic`), `grounding Json?` (denormalized snapshot: extracted facts or `{rawText}` summary), `prospectLabel String?` (display: host or "pasted text"), `subject String?`, `body String @db.Text`, `createdAt`. Indexes: `[userId, createdAt]`, `[tokenId, createdAt]`.
2. Run `npx prisma migrate dev --name cold_outreach` (NEVER `db push`).
3. `src/lib/creditSystem.ts`: add `CREDIT_COSTS.OUTREACH_SCRAPE: 1`; add `UsageEventType.OUTREACH_SCRAPE = 'outreach_scrape'` and `UsageEventType.OUTREACH_GENERATION = 'outreach_generation'` (comment: generation is credits-free; ledger row is gating source-of-truth, sibling precedent).
4. `src/lib/modelConfig.ts`: add `'cold-outreach'` to `Endpoint` union + `{ primary: GPT_4O_MINI, backup: null }` in both tiers.

**Files touched:**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_cold_outreach/migration.sql` (generated)
- `src/lib/creditSystem.ts`
- `src/lib/modelConfig.ts`

**Verification:** `npx prisma migrate dev` clean; `npx prisma generate`; `npx tsc --noEmit`; `npm run test:run` (no regressions).

---

## Phase 2 — Prospect grounding: extraction module + scrape cache lib

Steps:
1. Create `src/modules/outreach/prospectExtraction.ts` — PURE (no Prisma, no next/*, no AI call):
   - `ProspectExtractSchema` (zod) + `type ProspectExtract`: `{ name: string | null, whatTheyDo: string, whoFor: string, specifics: string[] }` (specifics = concrete referenceable facts, e.g. product names, niches, recent focus). **Schema must be constraint-LIGHT** — this endpoint goes through OpenAI strict structured outputs via `generateWithSchema`: NO zod `.min()`/`.max()` on arrays (no minItems/maxItems), and `name` must be `.nullable()` (NOT bare-optional). Put the "2–6 short specifics" guidance in the prompt TEXT, not the schema.
   - `buildProspectExtractionPrompt(combinedText: string): string` — cold-outreach-specific: extract ONLY facts present in the text (`## PAGE:`-marked), no inference/invention (prospect-side proof-truth), "return 2–6 short specifics" instruction, JSON-only output.
   - `buildProspectTextGrounding(rawText: string): ProspectExtract | null` — cheap path for pasted text: no AI call needed at this layer; return null so the route passes raw text into the generation prompt verbatim (decide in route; see phase 4 — pasted text goes into the prompt as-is, tagged as prospect-provided text). Keep a `summarizeProspect(extract | rawText)` helper that renders either grounding form into a prompt fragment.
   - `mockProspectExtract` fixture for demo/mocked paths.
2. Create `src/lib/prospectScrape.ts` (Prisma allowed — mirrors `src/lib/siteContext.ts`):
   - `normalizeProspectUrlKey(rawUrl)` (mirror siteContext normalization).
   - `getFreshProspectScrape(projectId, urlKey)` — returns row if `scrapedAt` within TTL (`PROSPECT_SCRAPE_TTL_MS = 7 days`, exported const), else null.
   - `upsertProspectScrape({...})` — upsert on `[projectId, urlKey]`, overwrite pages/extract/scrapedAt.
   - NO fetching here — callers use `scrapeSite` from `@/lib/scrape/fetchSite` directly. This lib never imports scrape internals.
3. Create `src/modules/outreach/README.md` — agent-oriented README for the new module dir (CLAUDE.md requires one per major src dir): module purpose, key files (prospectExtraction, platforms, outreachEngine — latter two land in phase 3; note them as planned), invariants (pure module — no Prisma/next/AI-call imports; caps outside schemas; constraint-light extract schema for strict structured outputs; proof-truth both sides), pitfalls (demo-first route ordering, cache-charge contract).
4. Unit tests `src/modules/outreach/prospectExtraction.test.ts`: schema accepts valid extract / rejects wrong shape; prompt contains no-invention instruction + the combinedText; `summarizeProspect` renders both extract and raw-text forms.

No file under `src/lib/scrape/` or `src/app/api/v2/` is touched (would be a human-gate flag — none needed).

**Files touched:**
- `src/modules/outreach/prospectExtraction.ts` (new)
- `src/modules/outreach/prospectExtraction.test.ts` (new)
- `src/modules/outreach/README.md` (new)
- `src/lib/prospectScrape.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run` — new tests green.

---

## Phase 3 — Generation engine: platform map + prompts + validators + mocks

Steps:
1. Create `src/modules/outreach/platforms.ts` (mirror `src/modules/email/archetypes.ts` static-def style):
   - `type OutreachPlatform = 'cold_email' | 'linkedin_note' | 'linkedin_inmail' | 'whatsapp' | 'instagram_dm'` (full union now; defs for pilot two only in this phase).
   - `interface PlatformDef { id; label; hasSubject: boolean; promptInstructions: string; caps: { subjectMaxChars?: number; bodyMaxChars?: number; bodyMaxWords?: number }; bumpInstructions?: string }`.
   - Pilot defs: `cold_email` (subject required, `subjectMaxChars: 120`, `bodyMaxWords: 120`, exactly 1 CTA, spec table) and `linkedin_note` (`bodyMaxChars: 300`, NO pitch, no subject).
   - `getPlatformDef(id)` + `PILOT_PLATFORMS` export; unknown/undefined defs → clean `null` (route returns not-available, like intent mapping).
2. Create `src/modules/outreach/outreachEngine.ts` — PURE, cloned from `src/modules/email/sequenceEngine.ts` structure:
   - Reuse imports: `PROOF_TRUTH_FRAGMENT` (from email engine), `EmailBrandContext`/`summarizeBrandContext`/`hasTestimonials` (from email brandContext).
   - `buildOutreachPrompt({ platforms: PlatformDef[], brandContext, intake: {targetDescriptor, openerContext?}, grounding: ProspectExtract | {rawText} | null })` — sections: sender brand context (Brief-only claims), proof-truth fragment + proof-availability note, prospect grounding block ("PROSPECT FACTS — reference at least one concrete specific; use ONLY these facts, never invent prospect details") OR explicit "NO prospect info — write a solid generic message for the target descriptor" when grounding null, per-platform slots from `promptInstructions`, JSON-only output `{messages:[{platform, subject?, body}]}` in platform order.
   - `outreachOutputSchema(platforms)` — SHAPE ONLY (array length = platforms.length, platform ids match, subject present iff `hasSubject`), NO caps.
   - `validateOutreachMessages(messages, platforms)` → `{ok:true} | {ok:false, reason:'too_long'|'invalid_shape', detail}` — enforces caps here: subject chars, body chars, body word-count (`body.trim().split(/\s+/).length`).
   - `buildSingleMessagePrompt({ platformDef, siblings, brandContext, intake, grounding })` + `SingleMessageOutputSchema` + `validateSingleMessage` — regen path.
   - `mockOutreachOutput(platforms)` deterministic fixtures within caps.
3. Tests `src/modules/outreach/outreachEngine.test.ts` (mirror `sequenceEngine.test.ts` frozen-fixture/validation style):
   - Format constraints: LI note 301 chars → `too_long`; ≤300 → ok; cold-email body 121 words → `too_long`; ≤120 → ok; subject >120 chars → `too_long`; missing subject on cold_email / present subject on linkedin_note → `invalid_shape`.
   - Schemas carry NO caps (a too-long body still parses shape).
   - Prompt with grounding contains prospect facts + "reference at least one" instruction; prompt with `grounding: null` contains the generic instruction and NO fabricated prospect block.
   - Mock output passes validators.

**Files touched:**
- `src/modules/outreach/platforms.ts` (new)
- `src/modules/outreach/outreachEngine.ts` (new)
- `src/modules/outreach/outreachEngine.test.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run` — engine tests green.

---

## Phase 4 — API routes: intake, generate, regenerate (all kill-switch-gated)

Clone handler skeleton from `src/app/api/email-sequences/[token]/route.ts` (kill-switch first → auth → `assertProjectOwner` → `withAIRateLimit` on AI handlers → `createSecureResponse`).

Steps:
1. `src/app/api/outreach/[token]/intake/route.ts`:
   - GET — return intake row or `{intake: null, prefill}` where prefill.targetDescriptor derives from Brief ICP (`BriefSchema.safeParse(project.brief)`).
   - POST — validate body (zod: targetDescriptor non-empty, platforms ⊆ known union, openerContext optional) → upsert single row keyed `projectId`.
2. `src/app/api/outreach/[token]/route.ts`:
   - GET — message library for project (desc by createdAt), + kill-switch/auth/owner.
   - POST (generate) — body `{ platforms: OutreachPlatform[], prospectUrl?: string, prospectText?: string }` (url XOR text XOR neither). Handler order is load-bearing:
     a. **Demo/mock short-circuit FIRST** — immediately after kill-switch + auth + `assertProjectOwner`, BEFORE intake load and the grounding ladder: if `access.isDemo || !clerkId` → return ephemeral `mockOutreachOutput(platforms)` with `groundingLevel: 'generic'`; NO `scrapeSite`, NO `consumeCredits`, NO persist — even when `prospectUrl`/`prospectText` is present. Mirror the precedent in `src/app/api/email-sequences/[token]/route.ts` generateHandler (demo returns mock before any spend).
     b. Load intake (400 if missing) + Brief → `buildBrandContext`.
     c. Grounding ladder: `prospectUrl` → `normalizeProspectUrlKey` → `getFreshProspectScrape` hit? → use cached extract (no charge). Cache-miss/stale path: **`checkCredits(userId, CREDIT_COSTS.OUTREACH_SCRAPE)` BEFORE the scrape** — a 0-credit user is rejected (insufficient-credits response) before any network call or AI spend (conservative contract; generation itself stays credits-free) → `scrapeSite` → extraction via `generateWithSchema('cold-outreach', [{ role: 'user', content: buildProspectExtractionPrompt(site.combinedText) }], ProspectExtractSchema, 'prospect_extract')` — NOTE signature is `(endpoint, messages[], schema, schemaName)`, per the working call in `src/app/api/v2/scrape-website/route.ts:242` → `upsertProspectScrape` → `consumeCredits(userId, OUTREACH_SCRAPE, CREDIT_COSTS.OUTREACH_SCRAPE, meta)` — charge ONLY this miss path; `ScrapeError`/extract-fail caught → `grounding = null`, `groundingWarning: 'scrape_failed'` in response, NOT an error status (no charge on the failure path). `prospectText` → grounding = `{rawText}` (never fetched). Neither → grounding = null.
     d. `buildOutreachPrompt` → `generateRawJson` with shape schema → `validateOutreachMessages`; on `too_long` retry once with trim instruction, on `invalid_shape` retry once (email retry contract).
     e. Persist `OutreachMessage` rows (platform, kind 'initial', groundingLevel, grounding snapshot, prospectLabel = host | 'pasted text' | null, subject?, body) + `tx.usageEvent.create({eventType: OUTREACH_GENERATION, creditsUsed: 0, ...})` in ONE `$transaction`.
     f. Response: `{messages, groundingLevel: 'prospect'|'generic', groundingWarning?}`.
   - DELETE — `{messageId}` owner-checked delete (library hygiene, mirror SocialPost).
3. `src/app/api/outreach/[token]/regenerate/route.ts`:
   - POST `{messageId}` — same demo-first ordering: kill-switch + auth + owner check, then **demo/mock short-circuit BEFORE any load/AI work** (`access.isDemo || !clerkId` → ephemeral mock single message, no persist, no ledger). Then: load row, rebuild grounding from its `grounding` snapshot (never re-scrape here), siblings = same-platform recent messages for coherence context, `buildSingleMessagePrompt` → generate → validate (same retry contract) → UPDATE row in place → return full updated message. Ledger row `OUTREACH_GENERATION` creditsUsed 0, same `$transaction` pattern.
4. All three handlers: `isDisabled()` = `process.env.NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true'` checked FIRST, → 404-style `{success:false, error:'not_found'}`.

**Files touched:**
- `src/app/api/outreach/[token]/route.ts` (new)
- `src/app/api/outreach/[token]/intake/route.ts` (new)
- `src/app/api/outreach/[token]/regenerate/route.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual via `npm run dev` + authed fetch: intake POST/GET roundtrip; generate with real URL (charges 1 credit first time, 0 on repeat — check UsageEvent rows); generate with unreachable URL → 200 + `groundingLevel:'generic'` + warning; generate with pasted text → no scrape, no scrape charge; demo bearer with `prospectUrl` set → mock response, NO ProspectScrape row, NO UsageEvent rows, no credit change.

---

## Phase 5 — UI: dashboard page + panel + gated nav button

Clone `src/app/dashboard/emails/[token]/` pattern (server page → single client panel).

Steps:
1. `src/app/dashboard/outreach/[token]/page.tsx` — kill-switch first (`notFound()` when disabled), auth, renders panel with token.
2. `src/app/dashboard/outreach/[token]/OutreachPanel.tsx` (`'use client'`, clone `EmailSequencePanel.tsx` structure):
   - Intake section: targetDescriptor (prefilled from GET prefill), platform checkboxes (pilot: Cold email, LinkedIn note), openerContext; Save → intake POST.
   - Prospect input: tabs/toggle "Website URL" | "Paste text" (helper copy: for LinkedIn, paste their About — we never fetch LinkedIn); Generate button → generate POST with spinner.
   - Result + library: message cards (platform label, subject line for email, body) with per-card Copy (`navigator.clipboard`, 2s "Copied!") + Regenerate (splice updated message back by id) + Delete.
   - `groundingLevel === 'generic'` → visible amber notice on those cards/batch: "Generic — add prospect info (URL or pasted text) for a message that references their business." No error UI for scrape failure.
3. `src/components/dashboard/ProjectCard.tsx` — add gated "Outreach" button after Emails (lines ~129–137 pattern): `project.tokenId && !OUTREACH_DISABLED` → `router.push('/dashboard/outreach/${project.tokenId}')`; module-level `const OUTREACH_DISABLED = process.env.NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true'` (mirror `EMAILS_DISABLED`).

**Files touched:**
- `src/app/dashboard/outreach/[token]/page.tsx` (new)
- `src/app/dashboard/outreach/[token]/OutreachPanel.tsx` (new)
- `src/components/dashboard/ProjectCard.tsx`

**Verification:** `npx tsc --noEmit`; manual `npm run dev`: full pilot flow (intake → URL → 2 messages referencing a concrete prospect fact; copy button; regenerate; bad URL → generic notice; pasted-text path); set `NEXT_PUBLIC_COLD_OUTREACH_DISABLED=true` → button hidden, page 404s, routes 404.

---

## Phase 6 — Remaining platforms + bump messages

Prompt-template additions only — no schema/route/table changes.

Steps:
1. `src/modules/outreach/platforms.ts`: add defs for `linkedin_inmail` (short pitch + proof line + soft CTA, `bodyMaxChars` ~600), `whatsapp` (2–3 casual lines, NO link-dump instruction, `bodyMaxChars` ~400), `instagram_dm` (reference their content first then bridge, `bodyMaxChars` ~500); add `bumpInstructions` per platform where sensible (short follow-up, references the first message, no guilt-trip; email bump gets its own subject).
2. `src/modules/outreach/outreachEngine.ts`: extend `buildOutreachPrompt`/`buildSingleMessagePrompt` to accept `kind: 'initial' | 'bump'` (bump uses `bumpInstructions` + the initial message as context); mocks for new platforms.
3. Generate route: accept optional `includeBump: boolean` → bump rows persisted with `kind: 'bump'`; regenerate handles bump rows via stored kind.
4. Panel: new platform checkboxes + "Include follow-up bump" toggle; bump cards labeled.
5. Tests: cap validators for the 3 new platforms; bump prompt contains initial-message context; still one-optional-bump only (no cadence — Scope OUT).

**Files touched:**
- `src/modules/outreach/platforms.ts`
- `src/modules/outreach/outreachEngine.ts`
- `src/modules/outreach/outreachEngine.test.ts`
- `src/app/api/outreach/[token]/route.ts`
- `src/app/api/outreach/[token]/regenerate/route.ts`
- `src/app/dashboard/outreach/[token]/OutreachPanel.tsx`

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual: WhatsApp/IG/InMail generation + bump toggle.

---

## Phase 7 — Final verification + acceptance mapping

Steps:
1. `npx tsc --noEmit` + `npm run test:run` + `npm run build` — all green.
2. Walk the spec Acceptance criteria against the running dev server:
   - [ ] Prospect URL → scraped → message references ≥1 concrete prospect fact (real-prospect quality check, per pilot).
   - [ ] Raw-text fallback works (no URL, no fetch).
   - [ ] Scrape fail → clean generic fallback + visible notice, no error.
   - [ ] Format constraints hold (email subject + ≤120-word body + 1 CTA; LI note ≤300 chars, no pitch; others per table).
   - [ ] Sender claims traceable to Brief; prospect facts traceable to scrape/paste (spot-check outputs).
   - [ ] Per-message regenerate + copy button.
   - [ ] `UsageEvent` shows OUTREACH_SCRAPE charged 1 on cache-miss only; OUTREACH_GENERATION ledger rows present.
   - [ ] Kill-switch hides button + 404s page/routes.
3. Update this plan's Progress log; note in `docs/task/` audit that feature ships UNGATED (social-posts precedent) with own kill-switch — merge/deploy stance is the standing human gate (see memory: social-posts/email-sequences held).

**Files touched:**
- `docs/task/cold-outreach.plan.md` (progress log only)

**Verification:** the checklist above; **human gate** — merge to main is user's call and currently coupled to the held social-posts/email-sequences stack.

---

## Unresolved questions

- Generation credit cost: spec says TBD — plan assumes 0 credits + ledger row (sibling precedent). OK?
- Reuse email `brandContext`/`PROOF_TRUTH_FRAGMENT` (cross-module import, same stack) vs fork into outreach module?
- ProspectScrape TTL 7 days OK?
- Single combined AI call for multi-platform generate (vs per-platform calls) OK?
- Bump default OFF, opt-in toggle — OK?
- Message library: keep DELETE per message, no bulk clear — enough?
