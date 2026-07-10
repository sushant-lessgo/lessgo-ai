# proof-truth — implementation plan

**Branch:** `feature/proof-truth`
**Spec:** `docs/task/proof-truth.spec.md`
**Status of spec corrections (from scout + plan-review, verified):**
1. The `{value, needsReview:true}` sentinel in `copy.schema.ts` is **defined but dead** — nothing produces it, nothing consumes it, and the published path would render `[object Object]` if it ever reached a block. Editor `needs_review` markers are driven by element-schema `fillMode: 'ai_generated_needs_review'`, not by content sentinels.
2. The pre-ON toggle bug is **not** in the wizard store (its guard is length-correct). The real leak is `deriveAssetFacts()` in `src/modules/generation/blockEligibility.ts:139-150`, which treats the `proofAvailable` *capability-hint* list as proof-content-exists.
3. **Work-engine scope correction (spec says "all three engines" — code says otherwise).** The work engine has **no AI copy-drafting path at all**: only product + service `generate-copy` routes exist (`src/app/api/audience/{product,service}/generate-copy/route.ts` — verified, no third); the work adapter (`src/modules/wizard/generation/work.ts`) never calls a copy route — it seeds content via `buildGranthHomeFinalContent` (`src/hooks/editStore/granthSeed.ts`). Work's proof section is `praise` (`src/modules/engines/coreSections.ts:30`), defined in `src/modules/audience/writer/elementSchema.ts:104-123` (`GranthCriticsGrid`, quotes fields `text`/`source`) and is **entirely `fillMode: 'manual_preferred'`** — the user writes praise; the AI never drafts it. Therefore acceptance criteria 1/2/4 (drafted+flagged, auto-import/inject, no-invention-on-regen) are **N/A for work by construction — there is nothing for the AI to fabricate**. `injectRealTestimonials` is hardcoded to `sections['testimonials']` (product `parseCopy.ts:122`, service `:126`); work has no `testimonials` section, so the injection phases never touch work either. **Work is out of scope by construction.** The scalePlan §8 amendment (phase 6) records this reconciled scope so the amended law doesn't overclaim.

## Overview

Make the `Testimonial` table the single source of REAL proof: scraped verbatim quotes auto-import as durable, project-scoped table rows **once, at Brief confirm** (before any generation fan-out), and injection precedence guarantees real always wins over drafted — including on section regeneration, which re-injects from the table. AI may still draft testimonial copy (thing/trust engines — work is manual-fill, see spec-correction 3), but every drafted quote is editor-flagged needs-review, prompt-constrained to plausible-generic (no named companies, no hard metrics), and never enters the table. The proof toggle becomes a pure T2 capacity signal — capability hints can no longer flip it to "content exists".

## Fork decision (needsReview mechanism) — HYBRID (fillMode + provenance metadata)

Evaluated the three options from scouting:

- **(A) Wire the inline `{value, needsReview}` sentinel end-to-end** — REJECTED. Requires a producer, a canonical unwrap helper threaded through `useReviewState.unwrapContentValue`/`resolveElementValue`, BOTH renderers, `htmlGenerator.ts`, and every block (`.tsx` + `.published.tsx`) that reads a proof element across 4+ templates. Maximum dual-renderer blast radius; one missed unwrap = `[object Object]` on a customer's live page. Buys nothing over metadata at the granularity we need.
- **(B) fillMode-only** — REJECTED as sole mechanism. `fillMode` is static per element schema; it cannot distinguish "AI-drafted quote" from "real imported quote in the same element", so injected real quotes would be flagged — directly violating acceptance criterion 2 ("page injects the real quotes UNflagged").
- **(C) HYBRID — CHOSEN.** `fillMode: 'ai_generated_needs_review'` (already declared on quote/author elements in the product + service `elementSchema.ts` files, already consumed by `useReviewState.ts:173`) stays the default "drafted → flagged" signal. A **section-level provenance flag** — set by `injectRealTestimonials` at injection time, carried into the section's existing persisted `aiMetadata` object (`multiPageAssembly.ts:181` already writes `aiMetadata.aiGeneratedElements`, which survives save/reload) — suppresses needs-review markers for real-proof-backed sections. Section-level granularity is exact, not approximate: `injectRealTestimonials` *replaces* the drafted quotes wholesale (product overwrites the whole `testimonials[]` array with only real items; service overwrites the flat quote fields), so a section is either all-real or all-drafted.

Why this wins: content values stay plain strings → **zero published-path risk, zero block edits, zero dual-renderer exposure**; the marker machinery (baseline auto-clear, dismissal) is already wired and tested. On `aiMetadata` (precisely stated — see phase 4): blocks DO read `aiMetadata.excludedElements` (every `use*Block.ts` hook, e.g. `meridian/hooks/useMeridianBlock.ts:35`, + `templates/shared/elementExclusion.ts`), but **nothing reads any other `aiMetadata` key**. Note the true mechanism: `sanitizeContentForPublish` does NOT strip `aiMetadata` — it rebuilds only `section.elements` (`layoutElementSchema.ts:473-511`; `aiMetadata` is a sibling key that survives sanitize intact), and the published renderer's `extractContentFields` (`LandingPagePublishedRenderer.tsx:32,36`) spreads it into published block props via `...systemProps`. So `realProof` rides `section.aiMetadata` into published block props UNCHANGED; the safety guarantee is that **no block component reads/renders `aiMetadata.realProof`**, so React drops the unknown object prop and it never reaches DOM/HTML — the same published/client-boundary safety model that already keeps `excludedElements`/`aiGeneratedElements` out of published output. The new `realProof` key rides that same envelope: persisted via saveDraft/loadDraft, invisible in rendered output. The dead sentinel stays in the zod schema (F27a's lone-object coercion depends on excluding it) but gets a defensive parse-time normalization so a model that ever emits it can't poison published HTML.

## Progress log

- phase 1 toggle integrity (capability ≠ content): done (commit 91c283a2, review loops 1)
- phase 2 prompt guard + fillMode audit + sentinel hardening: done (commit 014bb06b, review loops 1; scope +promptBranch.test.ts baseline recapture)
- phase 3 confirm-time auto-import + table-backed regen injection: done (commit dcc3ce21, review loops 1; HUMAN GATE cleared — user OK'd dark-write; deviation: userId=clerkId fixes latent plan bug)
- phase 4 provenance metadata + marker suppression: done (commit d419c01e, review loops 1; regen-client-read gap deferred Q4/Q6, editor-cosmetic post-un-dark only)
- phase 5 T2 count signal: done (commit 614267ec, review loops 1; trust.ts seam dormant/documented — follow-up to wire service-strategy forwarding)
- phase 6 scalePlan §8 law amendment: done (commit 71f985c3, self-verified docs diff)
- phase 7 fix-path CTA (rides TESTIMONIALS_ENABLED): done (commit bde80ce6, review loops 1)
- phase 8 live real-LLM verification (human gate): PENDING USER — manual checklist below
- phase 8 live real-LLM verification (human gate): pending

> **Merge coupling:** phases 3+4 MUST land in the same merge. Between them there is a half-shipped window (real injected quotes still marker-flagged, because fillMode flags everything until phase-4 suppression exists). Fine across feature-branch commits; never merge phase 3 to main without phase 4.

---

## Phase 1 — Toggle integrity: capability ≠ content

**Goal:** `hasTestimonials` in generation-side asset facts derives ONLY from actually-captured quotes or the user's conscious wizard answer — never from the AI/mock-emitted `proofAvailable` capability-hint list. Fixes acceptance criterion 3 (URL entry with NO scraped testimonials → toggle/section not silently ON).

**Steps:**
1. In `deriveAssetFacts()` (`src/modules/generation/blockEligibility.ts:139-150`): remove `proofHas('testimonial')` from the `hasTestimonials` derivation. New rule: `hasTestimonials = entryTestimonials.length > 0 || <user-confirmed wizard proof boolean, if present in the input Brief>`. Trace what confirmed-proof signal actually reaches `deriveAssetFacts`'s input (the wizard's `proof.hasTestimonials` reaches generation via `buildBriefPatch` → route `proof` object); if the confirmed toggle is not visible at this seam, derive from `entryTestimonials` only and let the route-level `proof` object (already the section-inclusion gate via `sectionGrammar.ts:74`) carry the user's conscious choice — do NOT invent a new plumbing path in this phase.
2. Audit other `AssetFacts` fields derived from `proofAvailable` in the same function (e.g. logos/case-study analogues) — apply the same capability-≠-content rule ONLY where the fact gates *content-claiming* sections; leave pure capability hints alone. Document each decision in a code comment.
3. Regression test with the exact mock repro shape: Brief entry with `proofAvailable: ['testimonials','case studies']` and `testimonials: []` → `hasTestimonials === false`; entry with 2 verbatim testimonials → `true`; wizard-confirmed toggle ON with zero captured quotes → section still eligible (conscious flip respected via gates, drafted+flagged path).

**Files touched:**
- `src/modules/generation/blockEligibility.ts`
- `src/modules/generation/blockEligibility.test.ts`

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/modules/generation/blockEligibility.test.ts`
- Full `npm run test:run` (dispatch/eligibility regressions live elsewhere too)
- Manual: mock-mode URL onboarding on a site with no testimonials → proof toggle arrives OFF at the wizard proof step.

---

## Phase 2 — Prompt guard + fillMode coverage audit + sentinel hardening

**Goal:** drafted proof is plausible-generic (no named client companies, no hard performance metrics — the "284% ROI for GlowSkin" class) across the **two engines where AI drafts proof (thing + trust)**; every drafted quote/attribution element is fillMode-flagged; the dead sentinel can never reach content. **Work is N/A** (no copy route, no prompt builder, `praise` is `manual_preferred` — spec-correction 3); its schema needs no edit and gets none.

**Steps:**
1. **Per-element prompt guard** — in `formatElement()` of both builders (product `src/modules/audience/product/copyPrompt.ts:75-114`, service `src/modules/audience/service/copyPrompt.ts:34-67`): when the element is a proof-shaped one (testimonial quote/author fields, review/case fields), append an explicit instruction: fictional-but-generic persona allowed, FORBID real or invented company names in attributions, FORBID specific performance numbers/percentages/revenue claims inside quotes. Covers both AI-drafted shapes: thing collection `testimonials[]{quote,author_name,author_role}`; trust flat `quote/author_name/author_role/author_company` + `reviews[]`/`cases[]`. (No work shape exists — no work prompt builder.)
2. **Global RULES guard** — strengthen the existing rule blocks (product `copyPrompt.ts:387,390`; service `copyPrompt.ts:193-199`) with the named-company/hard-metric prohibition for testimonial/proof content, stated once.
3. **fillMode audit** — verify every proof quote/attribution element in `src/modules/audience/product/elementSchema.ts` and `src/modules/audience/service/elementSchema.ts` carries `fillMode: 'ai_generated_needs_review'` (spot-verified: product `:219-221,:265-267,:1076-1078`, service `:88-91,:116-119` already do). Close any gaps found — specifically check trust `reviews[]`/`brands[]`/`cases[]` fields. `src/modules/audience/writer/elementSchema.ts` is explicitly NOT audited/edited: `praise` is `manual_preferred` by design (user-written), which is correct — flagging it would be wrong. Schema-only edits; no block changes.
4. **Sentinel hardening** — add a parse-time normalization (in both `parseCopy.ts` files, or one shared helper in `src/lib/schemas/copy.schema.ts` applied post-validation): any `{value, needsReview: true}` element value is flattened to its plain `value` string before content assembly. The zod union branch stays (F27a coercion excludes it by name); this guarantees no object-shaped value survives into content → no `[object Object]` on published pages, ever.
5. Tests: extend `src/modules/audience/__tests__/generationContract.test.ts` (or the builders' existing tests) to assert the prompt contains the guard text for thing + trust proof sections; extend `src/lib/schemas/copy.schema.test.ts` + parseCopy tests for the sentinel flatten.

**Files touched:**
- `src/modules/audience/product/copyPrompt.ts`
- `src/modules/audience/service/copyPrompt.ts`
- `src/modules/audience/product/elementSchema.ts` (only if audit finds gaps)
- `src/modules/audience/service/elementSchema.ts` (only if audit finds gaps)
- `src/modules/audience/product/parseCopy.ts`
- `src/modules/audience/service/parseCopy.ts`
- `src/lib/schemas/copy.schema.ts` (shared flatten helper, if chosen over per-parseCopy)
- `src/lib/schemas/copy.schema.test.ts`
- `src/modules/audience/__tests__/generationContract.test.ts`
- `src/modules/audience/product/promptBranch.test.ts` (orchestrator addition: byte-frozen `COPY_SAAS_BASELINE` must be RE-CAPTURED — the plan's global-RULES rule-4 change intentionally alters the product copy prompt; the baseline's own header says "recapture deliberately". Delta must be ONLY the proof-guard text; reviewer confirms no unintended drift.)

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/lib/schemas/copy.schema.test.ts src/modules/audience/__tests__/generationContract.test.ts`
- Full `npm run test:run` (elementSchema changes can ripple into layout/review tests)
- Manual (mock mode): generate thing + trust pages → testimonial quotes carry needs-review markers in the editor (fillMode path — should already work; this confirms coverage).

**Dual-renderer note:** no block or renderer files change in this phase; content shape stays plain strings by construction (step 4 enforces it).

---

## Phase 3 — Confirm-time auto-import + table-backed regen injection  **[HUMAN GATE]**

**Human gate rationale:** writes durable rows to the production-shared `Testimonial` table while the system is dark (`TESTIMONIALS_ENABLED` off). User signs off on the dark-accumulation decision below before this phase is implemented. **GATE CLEARED 2026-07-10: user approved "write while dark" (unresolved Q1 resolved — import unconditionally at Brief-confirm; rows invisible until flag flip).**

**Dark-flag decision (explicit):** auto-import WRITES while dark. The repo layer has no flag check; all HTTP readers 404 while dark, so rows are invisible until flag flip. Gating the write would silently discard the user's own verbatim scraped quotes — defeating the feature. Rows are the user's own site content (`source:'imported'`, `status:'approved'`), so accumulation is safe. Intentional; the human gate confirms it.

**Where the import runs (revised — fan-out safety):** ONCE per project, server-side, at **Brief confirm** — `src/app/api/brief/confirm/route.ts`, the single authoritative pre-generation entry point. Verified: it already authenticates (Clerk), validates the token, runs `assertProjectOwner(clerkId, tokenId, {action:'brief:confirm', claimIfOrphan:true})` (`route.ts:49`), and holds the full confirmed `BriefSchema` body — scraped verbatim quotes live at `brief.facts.entry.testimonials` (the same field the wizard hydrates `importedTestimonials` from, `useWizardStore.ts:707`). Import runs only on the `serve` outcome, after the project update. NOT inside generate-copy: full-page generation fans out to repeated generate-copy calls (`src/modules/wizard/generation/thing.ts:406,489,588`; the fan-out loop `:388-434` is sequential-await today, but per-call import = N import passes per generation, and any future parallelization = concurrent duplicate-insert race with no unique index). Confirm-time import = exactly one call, single-flight (one user click, one request) → **no concurrency, app-level dedup is sufficient, no Prisma migration**. It also keeps both generate-copy zod contracts untouched (no `tokenId` plumbing).

**Dedup decision (explicit):** app-level read-then-write, NOT a unique index. Rationale: no natural short unique key (quote is long text; a unique index needs a hash column + `prisma migrate dev` migration), the confirm call is single-flight (above), and the compare set per project is tiny. Dedup key: `(userId, projectId, normalizedQuote)` where normalization = trim + collapse whitespace + lowercase. Idempotent → re-confirm / re-generation creates zero duplicate rows. If races ever appear, a hash-column unique index is the follow-up.

**Injection precedence (explicit, honest about the dark flag):** the table is the durable source of truth; injection inputs per path:
- **First generation (wizard fan-out):** `injectRealTestimonials` keeps its existing request `realTestimonials` passthrough (`ob.importedTestimonials` → generate-copy body, `thing.ts:417-419` + the trust equivalent). This set is **byte-identical to the imported rows by construction** — both derive from `brief.facts.entry.testimonials`. The route cannot read the table itself (no project identity in its contract — deliberate, see above), and the client cannot fetch it while dark (readers 404). Real quotes therefore win on first generation exactly as before, now with durable table backing.
- **Section regeneration:** `src/app/api/regenerate-section/route.ts` (has token + ownership context) reads the table server-side via `listTestimonialsByOwner(userId, { projectId })` (repo call, no flag gate) — imported + approved collect-form/manual rows — and re-injects via `injectRealTestimonials` when the regenerated section is testimonials-type. Table wins over fresh inventions → acceptance criterion 4. Note: the table read returns `createdAt` order, which MAY reorder quotes vs first-gen's entry-array order — same quotes, same flags, no truth regression; noted here to preempt QA "why did the quotes reorder" noise. Also: projects confirmed BEFORE this ships have no imported rows, so their section-regen finds an empty table and keeps existing drafted quotes (no injection) — pre-existing-data gap, acceptable, not a regression (relevant to the phase-8 live check).
- Follow-up (post-un-dark, out of scope): switch the wizard to a table-backed authed GET so manual/collect rows also win at first generation.

**Steps:**
1. New helper `importScrapedTestimonials(userId, projectId, quotes: string[])` in `src/lib/testimonials/autoImport.ts` (new file, plain module): reads existing rows via `listTestimonialsByOwner(userId, { projectId })`, skips normalized-quote duplicates, creates the rest via `createTestimonial()` with `source:'imported'`, `status:'approved'`, `projectId` (author fields blank — entry facts carry bare quote strings). Returns the full table-backed approved set for the project.
2. **Call site — `src/app/api/brief/confirm/route.ts`:** on the `serve` branch, after the `prisma.project.update` (extend it with `select: { id: true }` to get `projectId`; `userId` = `access.userRecord.id`), call `importScrapedTestimonials` with `brief.facts.entry.testimonials ?? []`. Empty/absent (one-liner path) → no-op, zero writes. Demo-token short-circuit (`userRecord === null`) → skip import. Import failure must NOT fail the confirm (log + continue — confirm's job is the serve verdict). Note: route header declares a "pure @/modules/brief + prisma" firewall — `@/lib/testimonials/repo` is a plain prisma-backed lib module, no template/resolver import, firewall-compatible; update the header comment.
3. **Section-regen preservation** (acceptance criterion 4): in `src/app/api/regenerate-section/route.ts`, when the regenerated section is testimonials-type, fetch the project's table-backed approved quotes (helper from step 1's read path or a thin `repo.ts` variant) and re-inject after parse via `injectRealTestimonials` (+ the phase-4 provenance flag once it lands). Confirm the route's existing ownership assertion covers the read (it has token context; if it predates `assertProjectOwner`, add it — ownership check MUST guard the new table read).
4. **Invented rows never written:** import input is ONLY `brief.facts.entry.testimonials` (scraped verbatim) — never parsed AI output, never wizard free-text. Assert in a test (drafted-only generation path → zero `createTestimonial` calls; confirm with no entry testimonials → zero writes).
5. **generate-copy routes and wizard adapters: NO changes in this phase.** The `realTestimonials` passthrough already implements first-generation injection; the table adds durability + regen precedence.
6. Tests: `src/lib/testimonials/autoImport.test.ts` (new) — dedup idempotency (same quotes twice → no new rows), normalization (whitespace/case variants dedup), source/status/projectId correctness, empty input → no writes. Route-level test for confirm (serve + entry testimonials → rows; manual outcome → no rows) if confirm has test precedent, else fold the assertion into the manual check. Regen re-inject covered in phase-4 tests (provenance) + a parse-level test that table rows win over fresh drafted quotes.

**Files touched:**
- `src/lib/testimonials/autoImport.ts` (new)
- `src/lib/testimonials/autoImport.test.ts` (new)
- `src/lib/testimonials/repo.ts` (only if a narrow list-variant helper is needed)
- `src/app/api/brief/confirm/route.ts`
- `src/app/api/regenerate-section/route.ts`

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/lib/testimonials`
- Full `npm run test:run`
- Manual (dev DB): URL onboarding with mock scrape (emits verbatim testimonials) → confirm Brief → inspect `Testimonial` table: rows `imported/approved`, project-scoped, present BEFORE generation finishes; re-run confirm/full generation → row count unchanged; regenerate testimonials section → real quotes still on page; one-liner path → zero rows.

---

## Phase 4 — Provenance metadata + marker suppression (real quotes UNflagged)

**Goal:** sections whose quotes were injected from the real-proof set carry a persisted provenance flag; `useReviewState` suppresses needs-review markers for those sections. Flags survive save/reload; published HTML untouched. **Ships in the same merge as phase 3** (see coupling note under Progress log).

**Steps:**
1. Type: add optional `realProof?: true` to the `SectionCopy` type (`src/types/generation.ts`) — a post-parse annotation, NOT part of the AI-response zod schema (injection runs after validation).
2. Producers: `injectRealTestimonials` in both `parseCopy.ts` files sets `section.realProof = true` when it injects ≥1 real quote. `regenerate-section` (phase 3 step 3) sets it on re-injection.
3. Carry-through: in `src/modules/generation/multiPageAssembly.ts` (section-data build at `:171-181` and the second copy-application seam at `:402-418`), copy `copy[type].realProof` into the section's persisted `aiMetadata` (`aiMetadata.realProof = true`). `aiMetadata` already persists through saveDraft/loadDraft (it carries `aiGeneratedElements` today) — add a round-trip-shaped test (persisted-JSON → store → `aiMetadata.realProof` intact), not new plumbing.
4. Consumer: in `useReviewState.ts` (element scan ~`:400-430` and collection scan ~`:463-497`), when `sectionData.aiMetadata?.realProof` is truthy, skip `needs_review` statuses for that section (other statuses — stock image etc. — unaffected). Section-level suppression is exact per the fork analysis (injection is all-or-nothing per section).
5. **Published-path guard (correct invariant):** blocks DO read `aiMetadata` — but ONLY `aiMetadata.excludedElements` (verified: `use*Block.ts` in meridian/techpremium/hearth/lex/surge/lumen/granth/vestria + `templates/shared/elementExclusion.ts`; `sanitizeContentForPublish` reads it at `layoutElementSchema.ts:463`). Be precise about the mechanism: `sanitizeContentForPublish` does **NOT** strip `aiMetadata` — it rebuilds only `section.elements` (`layoutElementSchema.ts:473-511`); `section.aiMetadata` is a sibling key that survives sanitize intact, and the published renderer's `extractContentFields` (`LandingPagePublishedRenderer.tsx:32,36`) spreads it into published block props via `...systemProps` — so `realProof` reaches published block props UNCHANGED, exactly like today's `excludedElements`/`aiGeneratedElements`. The invariant to enforce is therefore: **NO block component or published-path code reads/renders `aiMetadata.realProof`** — React drops the unread object prop, so it never reaches DOM/HTML output (same published/client-boundary safety model as the existing `aiMetadata` keys). Enforcement: (a) grep-verify `realProof` appears nowhere under `src/modules/templates/` or in `componentRegistry.published.ts` / `htmlGenerator.ts` / `LandingPagePublishedRenderer.tsx` (only the writers — parseCopy/multiPageAssembly/regenerate-section — and the `useReviewState` consumer may reference it); (b) end-to-end published-output test: `generateStaticHTML` output for a testimonials section with `aiMetadata: { realProof: true, excludedElements: [...] }` and real quotes contains the quote text, NO `realProof` string, no marker artifacts, no `[object Object]`, and exclusions still applied (co-locate under `src/lib/staticExport/__tests__/`, precedent: `multipageGoalRef.test.ts`). Do NOT assert on the `sanitizeContentForPublish` return value (a sanitize-strips-`aiMetadata` assertion would fail — sanitize doesn't strip it); the rendered-HTML test is the real gate.
6. Tests: `useReviewState.test.ts` — drafted section → markers active; `aiMetadata.realProof` section → zero needs-review markers; reload-shaped state (content from persisted JSON) keeps suppression. Plus step 3's saveDraft→loadDraft round-trip shape and step 5's grep + published-output guards.

**Known gap (accepted, documented — not silence):** `regenerate-element` on a real-quote element overwrites it with a fresh invention and drops section-level provenance accuracy (element regen doesn't re-inject). Deferred: acceptance criterion 4 is section-level, and phase-3 regen covers the section path. One-line guard note goes in `injectRealTestimonials`' comment + the audit; the clean fix (block or re-inject at element level) is unresolved Q3.

**Files touched:**
- `src/types/generation.ts`
- `src/modules/audience/product/parseCopy.ts`
- `src/modules/audience/service/parseCopy.ts`
- `src/modules/generation/multiPageAssembly.ts`
- `src/hooks/useReviewState.ts`
- `src/hooks/useReviewState.test.ts`
- `src/lib/staticExport/__tests__/realProofPublishedOutput.test.ts` (new — step 5b published-output guard)
- `src/app/api/regenerate-section/route.ts` (set provenance on re-inject; small delta on phase-3 work)

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/hooks/useReviewState.test.ts src/lib/staticExport`
- Full `npm run test:run`
- Grep gate (step 5a): `realProof` has zero hits under `src/modules/templates/` and in `componentRegistry.published.ts` / `htmlGenerator.ts` / `LandingPagePublishedRenderer.tsx`.
- Manual: URL entry with scraped quotes → editor shows real quotes with NO markers; one-liner entry → drafted quotes WITH markers; save, reload editor → both states identical; publish preview → quotes render as plain text, no flags, view-source shows no `realProof` string.

**Dual-renderer note:** deliberately NO `.tsx`/`.published.tsx`/registry changes — provenance is metadata that DOES ride into published block props (sanitize does not strip `aiMetadata`) but is read by no block, so it never reaches rendered output. Step 5's grep + published-output test are the enforcement.

---

## Phase 5 — T2 count signal (approximate testimonial count → UIBlock choice)

**Goal:** wizard captures an approximate count when the user flips proof ON manually; count feeds the existing `cardCountHint` eligibility seam (no signature changes — `EligibilityInput.cardCountHint` → `capacityFits` already wired). URL path keeps its exact count (`thing.ts:399` already sets `cardCountHints.testimonials = importedTestimonials.length`).

**Steps:**
1. `WizardProofState` (`src/hooks/useWizardStore.ts:108-116`): add `testimonialCount: number | null` (bucket chips in UI → representative numbers, e.g. 1–2→2, 3–5→4, 6+→8; buckets are the UX, the stored value is the hint number).
2. `src/components/onboarding/wizard/ProofSlot.tsx` (`BOOLEAN_PROOF_META` area `:48-60`): after testimonials toggled ON + type chosen, show the count chips. Skippable → `null` → no hint → current behavior.
3. `buildBriefPatch` (`useWizardStore.ts:511,554,560`): carry the count into the Brief patch.
4. Producers: `src/modules/wizard/generation/thing.ts` (`:106` proof object, `:399` hints — user answer used only when `importedTestimonials` is empty; scraped count stays authoritative) and the parallel seam in `src/modules/wizard/generation/trust.ts` feeding `selectUIBlocks.ts:49-50`.
5. `hasTestimonialPhotos` (photo-vs-text) already served by `testimonialType==='photos'` — no change.
6. Tests: `useWizardStore.test.ts` (state + Brief patch), `thing.test.ts` / `trust.test.ts` (hint precedence: scraped count > user count > none).

**Files touched:**
- `src/hooks/useWizardStore.ts`
- `src/hooks/useWizardStore.test.ts`
- `src/components/onboarding/wizard/ProofSlot.tsx`
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/thing.test.ts`
- `src/modules/wizard/generation/trust.ts`
- `src/modules/wizard/generation/trust.test.ts`

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/hooks/useWizardStore.test.ts src/modules/wizard/generation`
- Full `npm run test:run`
- Manual: wizard proof step shows count chips post-toggle; picking "6+" vs "1–2" changes selected testimonial UIBlock where block manifests differ on `minCards/maxCards`.

---

## Phase 6 — scalePlan §8 law amendment

**Goal:** the WHY-record matches the new behavior so a future fix can't "restore" the old law — with the reconciled engine scope (work is manual-fill; the amended law must not claim AI drafts proof on all three engines).

**Steps:**
1. In `docs/tracks/scalePlan.md` line 323 (verified 2026-07-10), the current text reads:
   > **Waterfall per field:** SCRAPED (prefill, mark inferred) → INFERRED (safe category-level only) → ASK → DROP (optional unanswered = section cut, not faked). ASK converges on the outside-unknowable: **differentiator · real numbers · proof artifacts · goal param**. Hard rule (existing practice, now law): **proof is scraped verbatim or user-given, NEVER generated; missing proof drops the section.**

   Keep the waterfall + ASK sentences intact. Replace ONLY the final hard-rule sentence with:
   > Amended law (proof-truth, 2026-07-10): **proof may be AI-drafted (thing/trust — the engines whose copy routes draft proof) but is ALWAYS flagged needs-review and never enters the real-proof library (the `Testimonial` table); real proof always wins over drafted. Work-engine `praise` stays manual-fill — the AI never drafts it.** See `docs/task/proof-truth.spec.md`.
2. Add a short note in `docs/tracks/testimonialSystem.md`: confirm-time auto-import (`source:'imported'`, at `/api/brief/confirm`) + table-backed regen injection now live; table = single source of real proof.

**Files touched:**
- `docs/tracks/scalePlan.md`
- `docs/tracks/testimonialSystem.md`

**Verification:** docs-only; re-read diff for wording fidelity (waterfall sentence untouched, replacement exact). No tsc/tests needed (run none).

---

## Phase 7 — Fix-path CTA on markers (rides `TESTIMONIALS_ENABLED`)

**Goal:** the needs-review marker's fix path for proof elements points at the real-proof library — "replace with a real testimonial" — visible only when the testimonial system is un-darked. First evolution of the v1 mechanism, per spec pilot slice.

**Steps:**
1. In `src/app/edit/[token]/components/selection/SelectionSystem.tsx` (the only edit-surface consumer of `activeMarkers`/needs_review), for markers on testimonial-section proof elements add a link/action "Replace with a real testimonial" → `/dashboard/testimonials`, gated by `isTestimonialsEnabledPublic()` (client-safe flag, already exists in `src/lib/testimonials/flag.ts:15`). Flag off → marker UI unchanged (system stays fully dark).
2. Detection of "proof element": section type prefix `testimonials` (+ trust flat quote keys) — keep it a small predicate co-located with the marker UI.
3. Test: light component/unit test if SelectionSystem has test precedent; otherwise manual check (flag on/off) documented in the audit.

**Files touched:**
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run`
- Manual: `NEXT_PUBLIC_TESTIMONIALS_ENABLED=true` in `.env.local` → marker on a drafted quote shows the library link; unset → no link, marker otherwise identical.

---

## Phase 8 — Live real-LLM verification  **[HUMAN GATE — spec-named, before merge]**

**Goal:** the spec's named gate — real-LLM check on the F2 repro shapes before merge to main. (Work engine excluded: no AI proof-draft path exists — spec-correction 3. A work sanity check is included only to pin that fact.)

**Steps (manual, `npm run dev` + real LLM, dev DB):**
1. **Shape 1 — one-liner, toggle ON, no real proof (thing + trust):** drafted quotes render; every quote/attribution marker-flagged in editor; NO named companies, NO hard metrics in drafts; `Testimonial` table row count unchanged (zero writes).
2. **Shape 2 — URL entry with scraped testimonials:** rows created at Brief confirm (`imported`/`approved`, project-scoped); regen full page → no duplicate rows; page shows the real quotes UNflagged; toggle pre-set ON reflecting captured reality.
3. **Shape 3 — URL entry, no scraped testimonials:** toggle arrives OFF; user flips ON consciously → drafted+flagged path.
4. **Work sanity pin:** create a work/writer draft → `praise` section is seed/manual content only, no AI-drafted quotes, no markers, zero table writes.
5. Cross-checks: save/reload keeps flags + suppression; publish → view live HTML source: no markers, no `[object Object]`, no `realProof` string, real quotes verbatim.
6. Pre-merge hygiene per repo law: `npx tsc --noEmit`, `npm run test:run`, `npm run build` all green locally.

**Files touched:** none (verification only; any defects found loop back to the owning phase).

**Verification:** the checklist above IS the verification. User sign-off required before merge to main.

---

## Acceptance criteria → phase map

| Criterion | Phase(s) | Engine scope |
|---|---|---|
| One-liner, toggle ON, no proof: drafted quotes flagged, markers in editor, zero table rows | 2 (fillMode/prompt), 3 (no-write assert), 4 (markers), 8 (live) | thing+trust (work N/A — no AI draft path) |
| URL entry w/ scraped quotes: rows imported/approved/project-scoped/deduped; real quotes injected UNflagged; toggle reflects reality | 1 (toggle), 3 (confirm-time import, single-flight → dedup holds on FIRST generation), 4 (unflagged), 8 (live) | thing+trust (work has no testimonials section) |
| URL entry, no scraped quotes: toggle not silently ON | 1, 8 | thing+trust |
| Regen with table-backed quotes: real preserved | 3 (confirm idempotency + section-regen table re-inject), 4 (provenance persists), 8 | thing+trust |
| Drafted quotes: no named companies / hard metrics | 2, 8 | thing+trust (work: user-written, nothing to constrain) |
| needsReview survives save/reload; absent from published HTML | 4 (aiMetadata persistence + grep/published-output guards), 2 (sentinel flatten), 8 | all (mechanism is engine-agnostic) |
| scalePlan §8 amended (reconciled work scope) | 6 | — |
| tsc + full test:run green | every phase's verification + 8 | — |

## New tests summary

- `blockEligibility.test.ts`: capability-hint repro (proofAvailable-only → hasTestimonials false).
- `generationContract.test.ts` (+ builder tests): prompt guard text present for thing + trust proof sections.
- `copy.schema.test.ts` + parseCopy tests: sentinel flatten → plain string.
- `src/lib/testimonials/autoImport.test.ts` (new): dedup idempotency + normalization, source/status/scope, empty/no-entry → zero writes.
- Confirm-route assertion (test or manual): serve + entry testimonials → rows; manual outcome / one-liner → none.
- `useReviewState.test.ts`: realProof suppression, reload-shaped persistence, drafted markers unchanged.
- Published-output guard (new, `src/lib/staticExport/__tests__/`): `generateStaticHTML` HTML for a real-proof section has quote text, NO `realProof` string, no marker artifacts, no `[object Object]`, exclusions still applied. (Do NOT assert on `sanitizeContentForPublish` output — it does not strip `aiMetadata`.)
- Grep gate: `realProof` absent from `src/modules/templates/` + published renderer/htmlGenerator.
- `useWizardStore.test.ts` / `thing.test.ts` / `trust.test.ts`: count signal + hint precedence.

## Unresolved questions

1. Dark-accumulation OK? (confirm-time import writes Testimonial rows while flag off — phase 3 gate)
2. Count buckets: 1–2 / 3–5 / 6+ good? Skippable?
3. `regenerate-element` on a proof element — KNOWN GAP (overwrites real quote w/ invention, loses provenance): block, re-inject, or allow+flag? (deferred; pick)
4. Account-level (projectId null) manual/collect quotes: inject at section-regen too, or project-scoped only for v1?
5. Phase 7 link target `/dashboard/testimonials` vs collect-link flow — which first?
6. Post-un-dark: switch wizard first-gen injection to table-backed GET (so manual/collect rows win at first generation too) — this feature or follow-up?
