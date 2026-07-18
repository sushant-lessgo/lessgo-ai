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

1. **`editor-route-consolidation`** (`docs/task/editor-route-consolidation.spec.md`, `full` tier) — specced 2026-07-18 via `/discuss`. Consolidate reveal + preview + **publish** onto `/edit/[token]`, piloted on the **work journey** (preview→in-editor mode incl. iframe mobile-view, reveal→editor first-load, publish relocated in-editor, XFO moved atomically). Route deletion (`/preview`+`/generate`) + onboarding post-gen lock are OUT (gated follow-ons). Warm scout brief: `docs/task/editor-route-consolidation.scout.md`. POST-beta (editor track). No branch yet.

**Prior state — EMPTY as of 2026-07-18** (before the above). Every other specced item got a branch — all live on the **orchestrator board**
now (merged, or building). The 8 specs from the 2026-07-18 speccing session
(`atelier-skeleton-cutover`, `editor-defect-fixes`, `work-onboarding-plan` E4, `publish-sanitize`,
`dashboard-profile-menu`, `facts-work-writeback`, `bilingual-editing`) are **merged**;
`work-library-board` is **building** (the last build blocker). See `orchestrator.md` → BEFORE-PUSH RUNWAY.

New specs enter here only from a fresh `/discuss`. **Next candidates (all unwritten, POST-beta / post-cutover):**
- Toolbar action-sets + Form/Menu hosts (unblocked now the cutover merged).
- thing-e2e / trust-e2e (resolve `engineDecider.md` open Qs first; thing/trust ride the generic wizard today).
- Deferred work fast-follows: look-picker (+Kontur/Pulse), prove-it-converts, generic CMS board (backlog #37).
- editor-route-consolidation.

**Merged this cycle** (unpushed, big-bang): the whole UI set + security tier + work-story-facts + toolbar-standard + toolbar-beta-followup + dashboard-lead-reply (S4b) + work-onboarding E1/E2/E3/E4 + billing-beta + **this session's 7** (see orchestrator "Merged this session"). **Paused:** blog-composer (GATE A → do in QA) · content-baseline (RESOLVED — mechanical merge only).

## Known bugs / pre-beta fixes (non-spec — fix before beta, not queue-numbered)

| Bug | Where | Severity | Owner/next |
|-----|-------|----------|------------|
| ~~Work fan-out rate-limit 429~~ ✅ **FIXED on prod** (`hotfix/rate-limit-bucket`, on origin/main) — the onboarding fan-out no longer 429s. Residual robustness only → backlog #32 (KV-backed store) / #33 (per-generation limit). | `rateLimit.ts` | resolved | — |
| **`finalize` tombstone not persisted** — `delete fc.generationProgress` never reaches Postgres (`saveDraft` shallow-spreads `finalContent`) ⇒ brief STEP-05 flash on reload that re-drives **chargelessly** + junk in stored `finalContent`. Cosmetic, platform-wide. | `saveDraft` (needs tombstone support) | low / cosmetic | low-priority cleanup |
| ~~`facts.work` editor writeback gap~~ ✅ **FIXED** — `facts-work-writeback` merged 2026-07-18 (facts.work persisted at first-gen + route entry-fallback). In-editor work story regen no longer 400s. Wide editor↔facts sync → backlog #36. | (was `work-copy-engine.audit.md:464`) | resolved | — |
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
