# Product Queue

Updated: 2026-07-16

## What lives here vs orchestrator vs backlog (boundary — clarified 2026-07-16)

The big-bang parallel build blurred these. The clean split, by **lifecycle stage**:

| Doc | Holds | A spec is here when… |
|---|---|---|
| `productBacklog.md` | unspecced ideas/directions **+ known bugs / pre-beta fixes** (non-spec) | no spec written yet |
| **`productQueue.md`** (this) | **specced-but-NOT-started** specs, in build order | a `*.spec.md` exists but the spec has **no feature branch** yet |
| `orchestrator.md` | **in-flight + merged-this-cycle** work: branches, worktrees, merge/deploy state, the Lane/Type/Spec/Status dashboard, protocols, mailbox | a branch exists (building) OR it's merged (riding big-bang) |

**Lifecycle:** idea → `/discuss` → spec → **queue** → *(branch created)* → **orchestrator** → *(pushed+deployed)* → removed (git history + `docs/task/completed/`). A spec is in **exactly one** of {queue, orchestrator} at a time — when it gets a branch it moves OUT of the queue and onto the orchestrator board. Don't duplicate a spec across both.

## ✅ PRE-BETA SECURITY & CORRECTNESS — ALL 4 MERGED (2026-07-17, unpushed w/ big-bang)

Done this cycle (source: `docs/reports/code-quality-report.md`): `billing-correctness` (H1/H2/M1/M2) · `secrets-forms-security` (**M8 only**; M6 encryption deferred — scout found dead schema/dead code/greenfield, re-spec via `/discuss`) · `publish-trust` (M3/M4; **M5 was a false premise** → shipped anti-rot guards only, opt-C) · `regen-modernization` (H3/H4/H5/M14/M16; −4.2k legacy lines). Worktrees cleaned. Now on the orchestrator board's "merged this cycle", not here. Owed verifications live in `docs/product/deploy-qa-checklist.md`.

`docs/task/completed/perf-04-elementdetector-loop.spec.md` — appears mis-filed in completed/: it's the OWED FIX for perf-02 (shipped but fails its 6× throttle acceptance). Verify + re-file or close.

## Queue — specced, not yet started (build order)

| # | Spec file | Lane / note |
|---|-----------|-------------|
| 1 | `docs/task/atelier-skeleton-cutover.spec.md` | Work vertical — re-point `atelier`→work-skeleton + delete old `templates/atelier/`. **BLOCKED: launch only AFTER E2 (`work-onboarding-ingestion`) merges** (deletes the `atelier2` id E2 pilots on). Full tier. |
| 2 | `docs/task/editor-defect-fixes.spec.md` | Editor cleanup — delete broken `convertCTAToForm` feature (real problem → backlog #34) + de-dup `GlobalButtonConfigModal` mount. Owed for push (deploy-qa §D). Standard tier. Unblocked, isolated from E2. |
| 3 | `docs/task/work-onboarding-plan.spec.md` | Work vertical E4 — visual site-plan gate (workEndtoEnd step 4): plan screen + few edits → approve writes `Brief.structure` → fires EXISTING work generation → E1's EXISTING reveal. Look-picker deferred (only Atelier skin exists). Reuses E2 `loadStep?` seam (no widening). Standard (auto-escalates if it must modify credit/gen path). Pilot = Kundius, dev-only+flag-gated. E2+E3 merged ⇒ unblocked. **NOW IN FLIGHT.** |
| 4 | `docs/task/publish-sanitize.spec.md` | Security (split from editor-defect-fixes #1) — sanitize user HTML at the PUBLISH gate with a real DOM sanitizer (dompurify+jsdom, NOT the regex path); keep links+formatting, strip scripts/handlers/js:+data: schemes. Confirmed real stored-XSS hole (64 published blocks inject raw user HTML; import pulls verbatim external content; dead `sanitizeHtmlContent`). Clean-at-publish only (save-time deferred). Full tier (publish path + security). Owed for push (deploy-qa §A/§D). |
| 5 | `docs/task/dashboard-profile-menu.spec.md` | **P0** (handoff 2e) — build the sidebar profile popover: Settings · Billing · Appearance (greyed, no theme system) · **Log out**. Fixes a cross-track seam gap: **there is currently NO logout anywhere in the app** (editor removed its UserButton expecting the dashboard to carry it; dashboard menu was deferred). Whole user-card = trigger, gear folds in. 2f account page OUT. Standard tier. Must fix before beta. |

**Building now (orchestrator board):** work-onboarding-ingestion (E2 @ P3). **Paused (founder gates):** blog-composer (GATE A) · content-baseline (Deploy B). **Merged this cycle** (unpushed, big-bang): the whole UI set + security tier + work-story-facts + toolbar-standard + **toolbar-beta-followup** + **dashboard-lead-reply (S4b)** + **work-onboarding-questions (E3)** + **billing-beta (S3, `c7e0455a`)**. **Unwritten specs** (E4 `work-onboarding-plan` — hand it the seam contract at launch · editor-route-consolidation · toolbar action-sets+Form/Menu hosts, BLOCKED on atelier-cutover · other-engine onboarding) are `⬜ to spec` rows on the orchestrator dashboard / directions in `productBacklog.md`.

## Known bugs / pre-beta fixes (non-spec — fix before beta, not queue-numbered)

| Bug | Where | Severity | Owner/next |
|-----|-------|----------|------------|
| **Work fan-out rate-limit 429** — work onboarding fans out 6 AI calls (1 strategy + 5 pages) against a shared, cross-route **5/min FREE** bucket ⇒ last page 429s on run #1 (recoverable via resume/"Try again"). PRO (10/min) has only 4 calls headroom, so not FREE-only. Limiter is an in-memory per-lambda Map ⇒ looks intermittent in prod. | `rateLimit.ts`; surfaced in work-onboarding-shell phase 5 | pilot-blocking-ish (rough first-run) | raise/segment the bucket for onboarding fan-out before work-pilot polish |
| **`finalize` tombstone not persisted** — `delete fc.generationProgress` never reaches Postgres (`saveDraft` shallow-spreads `finalContent`) ⇒ brief STEP-05 flash on reload that re-drives **chargelessly** + junk in stored `finalContent`. Cosmetic, platform-wide. | `saveDraft` (needs tombstone support) | low / cosmetic | low-priority cleanup |
| **`facts.work` editor writeback gap** — a LIVE work story-interview submit **400s** (`brief.facts.work is required`) until Brief→editor projection is wired. | `work-copy-engine.audit.md:464`; workEndtoEnd deferred list | blocks work-template editing | wire before work goes user-facing |
| **F23 goal-CTA not fixed for vestria/granth** — flat `cta_href`/`cta_label` blocks unbridged to goal resolution; **vestria manual gate FAILS** (`9knkYn8_QZpE`). | `goal-ref-cta.audit.md:387` | blocks vestria/granth CTAs | wire blocks to goal resolution |
| **`regenerate-element` overwrites real testimonial quotes** with AI invention + leaves stale section `realProof` flag → false provenance. | `proof-truth.audit.md:257` | trust/data-integrity | re-injection not implemented; owed |
| **Trust pages render UNATTRIBUTED testimonials** — entry pipeline reduces `testimonials` to quote-only `string[]`, authors blank. | `scale-06-wizard-convergence.audit.md:759` | trust-engine quality | preserve authors through entry |
| **Undo corrupts V2 raw-string elements** — content restorer (`uiActions.ts:703-721`) latent bug. | `edit-header-actions.plan.md:20` | editor data-loss | owed fix |
| **`/p/[slug]` published render pulls full schema registry (~17.5kB)** — imports `sanitizeContentForPublish` from `layoutElementSchema`. | `nsoPlan.md:134` | published-page perf | decouple published render from `layoutElementSchema` |

> Full deferred/bug sweep (2026-07-16) surfaced ~40 items; the rest (template knob threading, i18n Phase 2, work-skeleton Phase 9 cutover, held ungated social/email/outreach, pricing-v2 Phase 9 + prod-grants) are already tracked in memory/mailbox/orchestrator. Source of the security items above: `docs/reports/code-quality-report.md`.

## History
- Shipped 2026-07-11→12: atelier-template, template-factory, tracking-pixels, app-subdomain, data-capture, pricing-v2, social-posts + email-sequences + cold-outreach (dark). 2026-07-14: published-output-hygiene, onboarding-fixes, app-entry, editor-phase-4 store finish, manual-test trust fixes.
- Absorbed into the UI redesign (2026-07-15, held specs → redesign specs, now built/queued): `dashboard-lifecycle` → dashboard S2 (✅ merged); `plan-credits-surface` → `billing-beta` (queued); `publish-ux` + `editor-chrome` → `editor-shell-redesign` (🔨 building).
- Done + removed since last update: work-contract (✅ merged), work-copy-engine (✅ merged + worktree cleaned 2026-07-16). content-baseline-split → in flight, tracked on the orchestrator board (founder gate).

## Rules
- Only `*.spec.md` files get a queue number. Bugs/ideas without a spec → backlog or the bugs table above.
- New idea → `productBacklog.md`; agreed direction → `/discuss` → spec → enters this queue.
- Spec gets a branch → moves to the orchestrator board (remove from this queue).
- Reordering = edit this file in a discussion, never implicitly.
- Item reaches #1 with capacity → run `/feature <spec>`.
