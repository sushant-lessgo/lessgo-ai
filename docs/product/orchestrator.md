# Orchestrator state — parallel work (updated 2026-07-17)

Main session = orchestrator for all parallel feature sessions. New orchestrator session: read this + `memory/project_parallel_orchestration.md`.

## ▶ FRESH CYCLE START HERE (2026-07-17 late — cold-start handoff for a new session)

**STRATEGY (founder ruling):** no customer waiting → **build everything, QA once properly, push once.** No incremental pushes. Local `main` is **~216 commits ahead of origin** (origin/main = current live prod, untouched). The one pre-push gate = **`docs/product/deploy-qa-checklist.md`** (living master QA doc; a **preview deploy is MANDATORY** — Stripe/publish/KV/Resend/domains/middleware don't run locally). **All merged worktrees are PRESERVED** until the one deploy is green, then bulk-cleanup (do NOT clean per-merge anymore — batch strategy).

## ✅ 2026-07-18 (late) — BUILD QUEUE EMPTY, ALL BRANCHES MERGED

**Every feature branch is now merged into local `main` (green).** `git merge-base` confirms zero unmerged feature branches. Local main = **251 ahead of origin** (untouched prod). Re-green PASSED on final main: tsc clean · **4035 vitest passed / 0 failed** · lint warnings-only · `npm run build` exit 0. Backup tag `pre-merge-3branches-backup` @ `7eb4b9a6`. **Nothing left to build — only the QA/preview-deploy pass + founder sign-offs remain before the one push.**

- **`work-library-board`** (last build blocker) — ✅ **MERGED** (ran through phase 7 board CRUD e2e + parity; main HEAD `7eb4b9a6` was its re-green commit). Cut → backlog #37.
- **`content-baseline-split`** — ✅ **MERGED** (`c632d2bc`); Deploy B rode the big-bang. Was a mechanical catch-up (merged main in, no conflicts, re-greened). A live on prod since 07-14.
- **`blog-composer-redesign`** — ✅ **MERGED** (`8030be8c`); playwright authed-spec-list conflict resolved by union. **GATE A (founder publish/unpublish + visual + hero-image) STILL OWED — now happens on the preview deploy before the push, not a merge blocker.** Blog flagged 4 "unrelated" e2e failures pre-merge → verify in the QA e2e pass.
- **`toolbar-standard-beta`** — ✅ **MERGED** (`bef5841e`, docs-only trailing commit; code was already in as `349ec689`).

**Prior "building" note (superseded, kept for trail):** work-library-board was mid-phase-5 when the last handoff was written; it finished and merged.

## 🚦 RELEASE-TRAIN DISCIPLINE (2026-07-18 — durable, read before merging anything)

QA has STARTED on the beta batch → **the batch is FROZEN.** Two lines now run in parallel:

- **`main` = the beta release candidate (FROZEN).** Accepts **ONLY beta QA-bugfixes** (from `bugs18July.md` → `fix/<round>` → merge to main → advance the `qa/beta-big-bang` pointer → re-verify). Nothing else lands on main until beta is pushed to `origin/main`. (Orchestrator bookkeeping DOCS may land — zero deploy impact.)
- **`next` = post-beta integration line** (cut from `main` @ `7f625227`, 2026-07-18). **All NEW features merge here, NOT main**, so they don't reset the beta QA target / cause scope-creep. Protocol per feature: merge `next` into the feature branch → re-green → merge feature into `next`. Keep `next` current by periodically merging `main` → `next` (pulls beta bugfixes forward; low drift since it was cut early).
- **QA branch `qa/beta-big-bang`** = frozen preview snapshot of the beta RC; advance its pointer to main's tip only deliberately (after a bugfix round), never continuously.

**When beta ships (main → `origin/main`, deploy green):** promote `next` → main (merge; next already contains beta+fixes if synced), then `next` becomes the next cycle's integration line (or re-cut). Bulk worktree cleanup of the beta set happens here.

**Rule of thumb:** a *bugfix for the thing under QA* → `main`. A *new feature* → `next`. Never a new feature on `main` during the freeze.

**On `next` now:** `editor-route-consolidation` (full tier, built c71e82d1, 0-behind-main; work-journey pilot of reveal+preview+publish-in-editor consolidation). Its own QA = the next-cycle preview, separate from the beta QA.

**Merged into local main this cycle (all unpushed):**
- **UI big-bang:** ui-foundation, auth, dashboard S1/S2/S4a, media-library, editor-shell, work-onboarding-shell (E1).
- **Pre-beta security tier (all 4):** billing-correctness, secrets-forms (M8-only; M6 deferred), publish-trust (opt-C guards; M5 was false-premise), regen-modernization (−4.2k lines). **Worktrees cleaned** (pre-batch-ruling).
- **`work-story-facts-resolve`** (work story-interview 400 → server-resolve).
- **`toolbar-standard-beta`** — t2 shell + LinkPicker spine; **shipped NO Beta action sets** (all un-defer at atelier-cutover); left Regen-accommodation + 🔴 tickets.
- **`toolbar-beta-followup`** — the buildable toolbar remainder: **section Regen + a load-bearing Regen e2e** (⇒ QA §B Regen-verify is now BUILT+TESTED, not a manual todo) + LinkPicker replaces Button Settings destination (followGoal/GOAL_REF preserved) + Ask-AI slot removed. Form/Menu hosts + real action sets still deferred to the cutover.
- **`dashboard-lead-reply` (S4b)** — AI reply-draft in leads inbox, copy-to-clipboard, `LEAD_REPLY=1`, reads `Project.brief`.
- **`work-onboarding-questions` (E3)** — STEP 03 deterministic 8-slot gating (AI-free), choice kind, required price+lang, rail writes. **Widened the journey seam with a `questions()` data method (see below).**
- **`billing-beta` (S3)** — MERGED `c7e0455a` (2026-07-17). LEAN beta monetization: plan+credit widget, Billing&plan view, Upgrade/Top-up→Stripe Checkout, Manage→portal, costs-at-action, gating→upgrade block. Config-driven (planManager/creditSystem = truth). Full 2g console DEFERRED post-beta. **OWED QA:** Stripe checkout/portal/webhooks + funded-gen smoke on the preview deploy (§A). Coord `creditSystem.ts` w/ lead-reply's `LEAD_REPLY` cost reconciled at merge.
- **`work-onboarding-ingestion` (E2)** — MERGED `40e990e1` (2026-07-18). Work photo ingestion; all 5 phases done, main/E3 seam reconciled (rebased onto E3's `questions()`, added `loadStep?` on top). D7b: merged **ZERO prod-reachable behavior** (dev-only pilot on `atelier2`; enablement = atelier-cutover, now DONE). **P5 Kundius real-photo gate** still owed → QA.

**Merged this session (2026-07-18, all unpushed):**
- **`editor-defect-fixes`** — deleted broken `convertCTAToForm` (wrong solution; real problem → backlog #34 inline-email-hero) + de-dup `GlobalButtonConfigModal` mount (a11y).
- **`dashboard-profile-menu`** — **P0 RESTORED LOGOUT** via sidebar 2e popover (Settings/Billing/Appearance-greyed/Log out). There was NO logout anywhere in the app — cross-track seam gap (editor removed its UserButton expecting the dashboard to carry it; dashboard menu was deferred). Gated to bilingual? no — logout for all.
- **`work-onboarding-plan` (E4)** — visual site-plan gate (workEndtoEnd step 4): plan screen + edits → approve writes `Brief.structure` → fires EXISTING work generation → E1's EXISTING reveal. Look-picker DEFERRED. Reuses E2 `loadStep?` (no widening).
- **`atelier-skeleton-cutover`** — re-pointed the LIVE `atelier` id → work-skeleton, deleted old `templates/atelier/`. **⇒ THE WORK VERTICAL IS NOW REACHABLE (no longer dev-only on `atelier2`).** Unblocks toolbar real action-sets + Form/Menu hosts (now specc-able).
- **`publish-sanitize`** — real DOM sanitizer (dompurify+jsdom) at the publish gate; killed the stored-XSS hole (64 published blocks were injecting raw user HTML; dead sanitizer removed). **XSS payload smoke still owed on the preview deploy (§A).**
- **`facts-work-writeback`** — fixed the in-editor work story-interview 400 (`facts.work` now persisted at first-gen + route entry-fallback). Narrow fix; wide editor↔facts sync → backlog #36.
- **`bilingual-editing`** — re-mounted NL/EN locale controls (toggle in top bar + settings in modal) **gated to bilingual projects only** + `activeLocale` reset-on-load. Kundius bilingual editing restored; naayom→Hindi + full i18nPlan stay deferred.

**⚠️ SESSION DECISIONS (2026-07-18 — durable, read before speccing):**
- **Work e2e IS IN the beta push** (not dev-only) — cutover merged, work is reachable.
- **Deferred = fast-follow, NOT beta:** look-picker + Kontur/Pulse skins (**only Atelier ships** for beta) · prove-it-converts (weekly email / promo-links / **WhatsApp-tap tracking — headline conversion number undercounts without it**) · work-library copy-gen slot-machinery + page-promotion + generic products board (backlog #37) · Atelier fidelity contract-fields (accept the ceiling).
- **engineDecider design AGREED** (`docs/tracks/engineDecider.md`), NOT yet specced: engine = a revisable belief (commit at plan gate); a plain-language **buyer-decision question** replaces the AI tiebreaker when unsure; **businessType→engine is NOT 1:1** → add an `ambiguous` state to the registry; the first-login **persona gate retires** → the one-liner is the entry.
- **Onboarding is UNIFIED** (`/onboarding/[token]`, scale phase 10 — every engine goes through it). **Work = a bespoke JOURNEY branch** off it (dispatched via `loadStep?`); **thing/trust today ride the GENERIC wizard** (testable now, no bespoke journey). Legacy `product`/`service` routes = redirect shims (cleanup candidate).

**⚠️ E2/E3 SEAM INCIDENT + RULE (2026-07-17):** E3 merged FIRST and widened the founder-signed journey seam (`engines/journey/engines/types.ts`) with a **`questions()` data method** (STEP 03 = data-driven, agnostic `StepQuestions.tsx` renders). E2 at P3 is adding **`showWork.loadStep?` component-injection** (STEP 02 ingestion is too rich for data descriptors). **Two extension mechanisms now coexist on the seam — this is an accepted ruling** (data-driven for Q&A steps; component-injection for rich interactive steps). E2 was told to **merge main first, rebase onto E3's `questions()`, add `loadStep?` on top, do NOT revert/duplicate E3's work.** **RULE for E4 + any future engine step: hand it the seam contract AT LAUNCH — reuse `loadStep?`/`questions()`, never a third widening.** ✅ E4 spec (2026-07-18) honors this — rich interactive step → reuses E2's `loadStep?`, explicit no-widening constraint. Lesson saved: `memory/feedback_shared_contract_coordination` (coordinate shared founder-signed contracts at LAUNCH, not via async mailbox — sessions go idea→merge in <1h).

**▶ BEFORE-PUSH RUNWAY (the handoff — what's left to beta):**
1. ✅ **DONE — `work-library-board` finished + merged** (last build blocker cleared).
2. ✅ **DONE — all catch-up merges landed** (content-baseline, blog-composer, toolbar doc all merged into main; re-green green). Build queue empty.
3. **QA pass — MANDATORY preview deploy** (`deploy-qa-checklist.md` §A/§B): `publish-sanitize` XSS payload smoke · Stripe/billing + funded-gen smoke · publish path / custom domains / Resend emails / edge middleware · secrets-forms M8 · re-run parity + generation specs on final main.
4. **Founder sign-offs (in QA):** editor-shell (3 sign-offs + phases 4–8 click-through) · blog GATE A · **logout works** · E3 STEP 01→03 walk · lead-reply draft quality · **font regen** (`smartphone` + Help glyphs — blocked, needs a machine with fontTools).
5. Re-green (tsc+test+build+lint) → preview deploy → walk §A/§B → **founder pushes `origin main`** → deploy-watch → prod smoke → **bulk worktree cleanup** of the whole merged set.

**The queue is now EMPTY** — every specced item got a branch (merged, or work-library-board building). New specs come from `/discuss`.

**Still unwritten (need /discuss — POST-beta / post-cutover):**
- Toolbar action-sets + Form/Menu hosts — **now unblocked** (cutover merged). Real per-element actions live in per-template markup.
- thing-e2e / trust-e2e — resolve the engineDecider open Qs first; thing/trust ride the generic wizard today (testable now, no bespoke journey needed for beta).
- The deferred work fast-follows: look-picker (+Kontur/Pulse), prove-it-converts, generic CMS board, work-library copy-gen (backlog #37).

**Owed before the push:** see the **BEFORE-PUSH RUNWAY** above (steps 3–5) + the full living list in `docs/product/deploy-qa-checklist.md`. Headlines: preview-deploy QA of prod-only surfaces (Stripe/publish/domains/emails/middleware) · `billing-correctness` + `publish-sanitize` smokes · editor-shell 3 sign-offs · blog GATE A · logout-works · E3 walk · lead-reply eyeball · font regen · final re-green + parity/generation. (content-baseline Deploy B = RESOLVED; toolbar 🔴 defects = shipped via editor-defect-fixes + publish-sanitize.)

**Key durable decisions this cycle (read these memories before speccing):** `project_onboarding_by_engine` (5 engines, audienceType retiring), `project_editor_route_consolidation` + `project_preview_consolidates_into_editor` (generate/reveal/preview → edit route; inputs locked post-gen; iframe+SAMEORIGIN), `project_dashboard_redesign_split`, `project_code_quality_backlog`.

**Doc boundary (de-blurred 2026-07-16):** `productBacklog.md` = unspecced ideas + bugs · `productQueue.md` = **specced, no branch yet** · **this file** = in-flight + merged-this-cycle. A spec moves queue→here when it gets a branch. See `productQueue.md` header.

---

## Active tracks (each in its OWN session; orchestrator coordinates only)

| Track | Worktree / branch | State |
|---|---|---|
| content-baseline-split | ✅ **MERGED** into main `c632d2bc` (2026-07-18) — worktree preserved for bulk-cleanup | ✅ **MERGED — B rode the big-bang push.** Deploy A (`d3bb5e31`) LIVE on prod since **2026-07-14** (~4d bake, ≫48h) — so the two-deploy rule is already satisfied (A = its own deploy; the big-bang push IS Deploy B, no separate deploy, no conflict with one-push). ✅ **naayom Project-row backup TAKEN 2026-07-18** (`backups/naayom-project-2026-07-18.json`). REMAINING = mechanical only: merge main into the 245-behind branch → re-green → merge into batch. Optional belt: naayom hard-reload before push. Phase-5 (c) dev round-trip PASS (payload −~45%). |
| ui-foundation (Lane 1 #1) | `.claude/worktrees/ui-foundation`, `feature/ui-foundation` @ `0ab7053b` | ✅ **BUILT + GREEN, both human gates passed; merge+push HELD for BIG-BANG deploy** with consuming specs (auth/dashboard/editor-shell). Full-tier /feature, 6 phases, each 1 impl-review loop. main (`713d29ef`) already merged IN; tsc/lint/build/**3331 tests** green; **published.css byte-identical** (isolation held through the merge). Mid-flight fix: mono@600 editor↔published divergence → distinct `'JetBrains Mono App'` family (app fonts must never share a template's family name). Worktree PRESERVED — **do NOT clean up / delete branch until the big-bang**. Deploy-watch deferred to combined push. Consuming specs branch from a base that INCLUDES this foundation; read `src/components/ui/README.md`. Founder still owes app-chrome VISUAL-TASTE pass (lands w/ 1st consuming screen). |

## Worktree cleanup owed

- `work-copy-engine` — ✅ CLEANED 2026-07-16 (worktree removed + branch `feature/work-copy-engine` deleted; was merged).
- `selection-highlight-labels` — MERGED (main tip `2568786e`); branch already gone. Verify worktree dir removed.
- **Big-bang set (merged, UNPUSHED — do NOT clean until combined deploy is green):** ui-foundation (explicitly preserved), auth-redesign, dashboard-workspace-ia, dashboard-lifecycle-actions, media-library-picker, editor-shell-redesign (`f4ab187e`), **dashboard-rollups-inbox** (merged 2026-07-16 `520bee34`). All worktrees + branches PRESERVED. Bulk-cleanup after the big-bang push + deploy-watch pass. (blog-composer + work-onboarding E1 still building — will join the set when they land.)
- **⚠️ Kill stray dev servers before any worktree e2e run.** Implementers leave `npm run dev` alive; Playwright then reuses a stale/500 server and you get **false-RED** runs that look like real regressions (cost 3 runs in editor-shell-redesign: `auth.setup` failed + all parity specs timed out at 3.0m, reading exactly like "the merge broke parity"). `playwright.config.ts`'s own comment warns of it. `netstat -ano | grep :<port>` first; kill only PIDs whose command line contains THAT worktree's path. **A red result lies as convincingly as a green one.**
- `work-skeleton` — MERGED+DEPLOYED (`713d29ef`); branch deleted + worktree de-registered/pruned 2026-07-16. LEFTOVER: physical dir `.claude/worktrees/work-skeleton` locked (Windows handle) — `rm -rf` from a fresh terminal once nothing holds it.

## UI Redesign track (new — `docs/tracks/uiRedesignPlan.md`, 2026-07-15)

Designer handoff landed (`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/`, 4 surfaces). Lifts the productQueue "UI-reimagine hold". Rule: **ownership follows functionality; design is input, never owner.** 3 parallel lanes:

- **Lane 1 — Reskin (sequential, each own /discuss→spec→/feature):** ui-foundation → auth-redesign → dashboard-redesign (incl. billing first-UI) → editor-shell-redesign. Absorbs held specs (dashboard-lifecycle, plan-credits-surface, publish-ux, editor-chrome). ui-foundation merges first.
- **Lane 2 — Work vertical (founder focus):** work-skeleton D ✅ SHIPPED 07-16 → next: phase-9 cutover (founder go) + Kontur spike → E `work-onboarding.spec.md` → work-library/CMS boards (D2, also unblocks the fidelity contract-field follow-ups).
- **Lane 3 — Toolbar:** selection-highlight-labels ✅ MERGED (precursor) → shell migration per `toolbarPlan.md`; Design ▾ + rich toolbars unblock after skeleton D merges.
- Cross-lane: Lane 1 never touches editor selection/store (L3) or template blocks/skeleton (L2). Designs canonical as-delivered (no variant-pick step). New-behavior specs cite handoff badge IDs.

## Spec dashboard — Lane / Type / Spec / Status (updated 2026-07-17 pm)

Type = designer handoff surface (`.dc.html`): **Auth · Dashboard · Editor · Onboarding**; or
**Foundation** (all surfaces) / **Work** (vertical). Status: ✅ merged · 🔨 building · 📋 specced/queued ·
⬜ to spec/later. **All ✅ are merged to local main but UNPUSHED** (one big-bang deploy; worktrees preserved
until deploy green — batch strategy).

Summary (2026-07-18 late): ✅ **ALL BRANCHES MERGED — build queue empty.** work-library-board (last blocker) + content-baseline + blog-composer + toolbar-doc all landed this session; main re-greened (4035 tests, build exit 0), 251 ahead of origin. · 🔨 building 0 · ⏸️ paused 0 · 📋 queue EMPTY · ⬜ to spec = post-beta (toolbar action-sets, thing/trust-e2e, deferred work fast-follows). **Only QA/preview-deploy + founder sign-offs remain** (blog GATE A now runs at QA). 

| Lane | Type | Spec file | Status |
|---|---|---|---|
| L1 reskin | Foundation | `ui-foundation.spec.md` | ✅ merged (held base) |
| L1 reskin | Auth | `auth-redesign.spec.md` | ✅ merged |
| L1 reskin (dash S1) | Dashboard | `dashboard-workspace-ia.spec.md` | ✅ merged |
| L1 reskin (dash S2) | Dashboard | `dashboard-lifecycle-actions.spec.md` | ✅ merged (GATE B open) |
| L1 reskin (media t7) | Editor | `media-library-picker.spec.md` | ✅ merged (phases 1–4) |
| L3 toolbar | Editor | `selection-highlight-labels` | ✅ merged (precursor) |
| L1 reskin (editor) | Editor | `editor-shell-redesign.spec.md` | ✅ merged (`f4ab187e`) — **founder QA + 3 sign-offs still owed → QA doc §C** |
| L1 reskin (dash S4a) | Dashboard | `dashboard-rollups-inbox.spec.md` | ✅ merged (`520bee34`) |
| L2 work (E1) | Onboarding | `work-onboarding-shell.spec.md` | ✅ merged (`cd324f42`) — P6 reveal iframe+SAMEORIGIN |
| L3 toolbar (t2/t4/t5) | Editor | `toolbar-standard-beta.spec.md` | ✅ merged (`349ec689`) — shipped t2 shell + LinkPicker spine, **NO Beta action sets** (un-defer at phase-9 cutover); **Regen accommodation + 🔴 tickets owed → QA doc §B/§D** |
| L2 work (prereq) | Editor | `work-story-facts-resolve.spec.md` | ✅ merged — story-interview 400 fix (server-resolve) |
| L3 toolbar (followup) | Editor | `toolbar-beta-followup.spec.md` | ✅ merged — section Regen + **load-bearing Regen e2e** (⇒ QA §B Regen-verify BUILT) + LinkPicker→ButtonSettings (goal-ref preserved) + Ask-AI slot removed |
| L1 reskin (dash S4b) | Dashboard | `dashboard-lead-reply.spec.md` | ✅ merged (`8663e2b5`) — AI reply-draft, copy-to-clipboard, `LEAD_REPLY=1`, reads `Project.brief`. **Draft-quality eyeball owed → QA §C** |
| L2 work (E3) | Onboarding | `work-onboarding-questions.spec.md` | ✅ merged (`3b62886d`) — STEP 03 deterministic 8-slot gating; **widened seam w/ `questions()` data method** (see header seam-rule). STEP01→03 walk owed → QA §C |
| L1 reskin (dash S3) | Dashboard | `billing-beta.spec.md` | ✅ merged (`c7e0455a`) — LEAN beta monetization surface; config-driven; full 2g console deferred post-beta. **Stripe + funded-gen smoke owed → QA §A** |
| L2 work (E2) | Onboarding | `work-onboarding-ingestion.spec.md` | ✅ merged (`40e990e1`) — work photo ingestion; `loadStep?` seam added atop E3's `questions()`. **P5 Kundius real-photo gate owed → QA.** Merges ZERO prod-reachable behavior (D7b). Unblocked cutover + E4 |
| L2 work (E4) | Onboarding | `work-onboarding-plan.spec.md` | ✅ **merged** — visual site-plan gate; approve → `Brief.structure` → EXISTING gen → E1 reveal. Look-picker deferred. Reuses E2 `loadStep?`, no widening |
| L2 work (cutover) | Work | `atelier-skeleton-cutover.spec.md` | ✅ **merged** — re-pointed live `atelier`→work-skeleton, deleted old `templates/atelier/`. **Work vertical now REACHABLE.** Unblocks toolbar action-sets + Form/Menu hosts |
| L2 work (D2) | Editor/CMS | `work-library-board.spec.md` | 🔨 **building** (full, ahead 5) — §8a "Your work" board; testimonial-board clone + E2 grouping + t7 MediaAsset; display-by-reference. **Last build blocker.** Cut → backlog #37 |
| L2 work (bug) | Editor | `facts-work-writeback.spec.md` | ✅ **merged** — in-editor work story-interview 400 fixed (facts.work persisted at first-gen + route fallback). Wide sync → backlog #36 |
| L2 work (i18n) | Editor | `bilingual-editing.spec.md` | ✅ **merged** — re-mounted NL/EN locale controls gated to bilingual + activeLocale reset. Kundius editing restored |
| L3 toolbar (defects) | Editor | `editor-defect-fixes.spec.md` | ✅ **merged** — deleted `convertCTAToForm` (real problem → backlog #34) + de-dup modal |
| security | Publish | `publish-sanitize.spec.md` | ✅ **merged** — real DOM sanitizer at publish gate; stored-XSS hole killed, dead sanitizer removed. **XSS smoke owed → QA §A** |
| L1 reskin (2e) | Dashboard | `dashboard-profile-menu.spec.md` | ✅ **merged** — **P0 restored logout** (sidebar profile popover). Settings/Billing/Appearance-greyed/Log out |
| L1 reskin (blog 3b–3d) | Dashboard | `blog-composer-redesign.spec.md` | ✅ **merged** (`8030be8c`) — playwright spec-list union-resolved. **GATE A (founder publish/unpublish + visual + hero-image) owed at QA** + 4 flagged e2e failures to verify in QA e2e pass |
| L2 work (cutover) | Work | `atelier-skeleton-cutover.spec.md` | 📋 specced — **QUEUED, launch AFTER E2 merges** (deletes `atelier2`). Unblocks BOTH E2 enablement + toolbar action sets |
| L2 work (E4) | Onboarding | `work-onboarding-plan` (unwritten) | ⬜ to spec (site-plan gate) — after E2 + E3; **hand it the seam contract at launch** |
| L1/editor | Editor | `editor-route-consolidation` (unwritten) | ⬜ to spec — generate+reveal+preview → edit route; inputs LOCKED post-gen; `memory/project_editor_route_consolidation` |
| L3 toolbar | Editor | toolbar action-sets + Form/Menu hosts (unwritten) | ⬜ to spec — **BLOCKED on atelier-cutover** (real per-element actions live in per-template markup) |
| L2 work | Editor/CMS | work-library / CMS boards (D2) | ⬜ to do |
| L1 later | Dashboard | Grow hub (**GATED**), notifications, profile/account reskin, blog first-run/AI-write, Overview KPIs | ⬜ later |
| L1 later | Editor | media t8 storage manager, full picker unification, Unsplash, From-CMS | ⬜ deferred |
| L2 later | Onboarding | E5+ auto-curation (IG/Drive + smart placement) + other 4 engines' step content | ⬜ later |
| backlog | Editor | version history (t21), review center (t10), copy eval (t15), setup popup (t9), Ask AI (t20, POST-BETA) | ⬜ backlog |

Not in this UI-redesign table (tracked in header + `productQueue.md`): the **pre-beta security tier** (billing-correctness, secrets-forms, publish-trust, regen-modernization — all ✅ merged + cleaned).

Notes: onboarding organized by **5 copy engines** (thing/trust/work/place/quick-yes), NOT audienceType
(retiring) — E1 = engine-agnostic shell, Work = pilot engine. **Batch strategy: all ✅ merged to local main,
UNPUSHED — one combined push+deploy after the full QA pass (`docs/product/deploy-qa-checklist.md`); worktrees
preserved until that deploy is green, then bulk-cleanup.** All specs depend on ui-foundation.

## Shipped since last update (2026-07-14 → 07-16, all merged to main)

1. **editor-phase-4-store-finish** — Gate D final merge; legacy layers deleted, bare-`useEditStore()` lint ban live (phase 12), close-out docs (phase 13). Dead-modals KEEP ruling recorded.
2. **work-contract** (`52da415b` parent chain) — phase A of work vertical: work-core section freeze + workElementContract, page vocabulary + site archetypes, work facts schema + 8 slots, profession rows + buyer-words, conformance test. FREEZES contracts for parallel C/D/E tracks.
3. **work-copy-engine** (`52da415b`) — the "C" copy track: deterministic slim-strategy + work strategy route (one small AI call) + facts-bound copy prompt/parser/generate-copy route + Kundius golden (founder-approved) + multi-page adapter fan-out + story-interview tier + NL language pass.
4. **selection-highlight-labels** (`2568786e`) — Lane-3 precursor: single-writer highlight consolidation (flicker fix) + shared target resolver + hover overlay + placeholder-type label badges.
5. **docs reorg** (`a997969f`) — tracks/ split into Completed/Someday subfolders.
6. **work-skeleton** (`713d29ef`) — D1 of work vertical: first skeleton layer (`src/modules/skeletons/work/`, 21 layout variants, 10 sections, single-source .core.tsx) + Atelier as skin #1 (`atelier2`, DEV-ONLY, zero-markup via `skinPurity.test.ts`). Registry seam zero-contract-change + firewall intact; SLOT mechanism; two token surfaces (skin `--wk-*` bounded + user Design-▾ `--u-*` runtime, threaded to BOTH renderers incl. static export = AC-L123); `work.v1.js` behaviors; screenshot parity harness (edit==published). Full-tier /feature pipeline (8 phases) + Atelier-fidelity waves 1/2A/2B (bold cover register, rule-headers, footer wordmark, section compositions — all token-gated w/ NEUTRAL skeleton defaults). Founder eyeballed → banked. 3310 tests green.

## Protocols (durable — post-cutover)

- **Worktree map (CUTOVER DONE 2026-07-12):** PRIMARY DIR `C:\Users\susha\lessgo-ai` = `main` = THE merge station. All merges + pushes here: plain `git push origin main`. Feature branches ONLY in `.claude/worktrees/<track>`; primary dir NEVER hosts a feature branch. `/feature` SELF-PROVISIONS worktrees (creates worktree+branch+env+npm install+prisma generate; run from any dir). Worktrees need `npx prisma generate` after any schema-changing main merge.
- **Merge protocol:** branch green → merge main INTO branch + re-green → merge branch into main at primary dir → USER pushes → deploy-watcher → prod verify → delete branch (+worktree). `branch -d` may refuse wrongly from stale checkouts — verify `merge-base --is-ancestor` then `-D`.
- **Re-green protocol = tsc + test:run + build + LINT** (pre-push hook parity; lint added 07-14 after a lint-only push block). Known flake: i18nHonesty 5s timeout — passes isolated/rerun.
- **Sessions ↔ orchestrator comms:** SHARED MAILBOX `C:\Users\susha\lessgo-ai\.claude\mailbox\` (one file per track; gitignored). NEVER docs/temp (per-worktree, loses messages).
- **Prisma:** never `migrate dev` from a branch on shared dev DB; use diff→review→`db execute`→`resolve --applied`; one schema branch at a time. Env: active `DATABASE_URL`=`nameless-thunder`=DEV (658 projects, no naayom); commented `muddy-thunder-pooler`=PROD (has naayom). No `DEV_DATABASE_URL`.
- **Env-flag features:** `NEXT_PUBLIC_*_DISABLED` kill-switches; set in Vercel prod BEFORE merging; bakes at build.
- **QA process:** agent verifies everything automatable WITH EVIDENCE (dev flows, parity, gates, DB side-effects, beacons, read-only prod smoke via browser-UA curl). Founder gets ONLY: taste, external dashboards/credentials, prod mutations/money, business calls. Prod agent access = HTTP GET/HEAD only (prod-DB reads DENIED by policy). Deterministic > agentic. Vercel preview only for infra-touching features.
- **/feature is 3-TIER** (light/standard/full; tier set at /discuss, one-way escalation — never downgrade). Reserve Fable for discuss+plan; everything else Opus.

## Founder pile (no build blocked)

- **content-baseline-split:** ✅ RESOLVED — bake done (A live 07-14), naayom backup taken 07-18. B rides the big-bang; only a mechanical branch catch-up merge remains (not a founder action).
- **work-skeleton NEXT STEPS (D1 shipped 07-16; `atelier2` DEV-ONLY, live `atelier` untouched):**
  1. **Phase-9 cutover (founder GO gate):** re-point live `atelier` id → work skeleton + flip `bespoke` off atelier2 + delete old `src/modules/templates/atelier/` (32-file anti-pattern). Do AFTER Kundius real-content eyeball. Touches paying-customer prod rendering — needs explicit founder go. (Own `/feature` micro-run: registry loader flip + service.ts/serveGate/templateMeta/blockManifest re-key + htmlGenerator gate + dispatch.test proving old stored `Atelier*` layouts fall back to skeleton defaults. Plan §Phase 9 in the (now-deleted) branch — recoverable via git; audit in commit history.)
  2. **Kontur spike = THE architecture gate:** 2nd skin as `skin.ts`+`index.ts` only, ~1 day, zero markup → proves "weeks→a day" economics. Verdict → templatePlan.md.
  3. **Atelier fidelity ceiling → contract-field follow-ups (do with D2/E, against Kundius real photos):** the remaining designer-DNA gaps need CONTENT-CONTRACT slots the copy contract lacks — package image/bullets/flag, about portrait/signature, 2nd hero CTA, header logo_image + EN/NL toggle, footer named columns, gallery per-group span, true header-over-hero geometry. These are SCHEMA slots in `engines/workSections.ts` (Track C) + editor upload wiring — images come from user uploads/onboarding NOT the AI; only auto-generated TEXT touches the copy prompt. Founder agreed to bank D1 rather than open this now.
  4. **Toolbar reality:** dev-stage `/dev/blocks/<tpl>` is a bare parity harness (no selection system) — real editor-toolbar test = a live `/edit/[token]` project set to the templateId. (phase-8 QA checklist wrongly claimed toolbars show on the stage — corrected.)
- **ui-foundation:** ✅ BUILT + GREEN 2026-07-16 (font licensing cleared; both isolation human gates passed). **HELD for BIG-BANG deploy** — founder ships it together with the consuming specs (auth/dashboard/editor-shell) in one push, NOT standalone. Branch `feature/ui-foundation` @ `0ab7053b` ready; worktree preserved. Big-bang assembler runs the merges + single push (station merge auto-blocked for the agent; founder merges+pushes main). Only remaining ui-foundation QA = app-chrome visual-taste pass, lands with the first consuming screen.
- **⚠️ i18n: Languages control REMOVED from editor chrome (founder ruling 2026-07-16, editor-shell-redesign phase 4).** `LanguageToggle` + `LocaleSettings` mounts deleted from `EditHeader` (they were invisible until a project declares a 2nd locale, so on ~every project they were dead weight). **OPEN QUESTION for the i18n track — do NOT treat as settled:** with the toggle gone there is **no known way to edit the non-default locale of a bilingual project**. Bites two committed directions: **Lumen = EN/NL twin-fields with a header toggle (Kundius)** and **naayom→Hindi assisted-translation** (`project_i18n_multilingual`, i18nPlan.md). Either locale switching gets a home in the new IA, or bilingual editing regresses. Founder ruled "gone + note it + continue" — flagged here so the i18n track owns the answer rather than discovering it at Kundius delivery. Components still exist (`components/editor/{LanguageToggle,LocaleSettings}.tsx`) — only the chrome mounts were removed, so re-mounting elsewhere is cheap.
  - **⚠️ TRAP STATE (found during the amendment, worse than the above):** `activeLocale` is persisted store state. **Any project already parked on a non-default locale now shows Regen Copy locked with NO visible way back** — the regen locale-lock (`EditHeaderRightPanel` L107-108) reads `activeLocale`/`localeConfig` from the store, not the toggle, so it still fires correctly with no affordance to clear it. Not hypothetical for Lumen/naayom. Cheapest mitigations if this bites before i18n lands: re-mount `LocaleSettings` somewhere, or reset `activeLocale`→default on editor load. Store state + both components are intact, so it's a re-mount, not a rebuild.
- **Editor-shell founder rulings 2026-07-16 (reverse earlier plan decisions):** **avatar/UserButton REMOVED** from the editor bar — logout happens from the dashboard (reverses decision 8, which kept it as the only in-editor sign-out path); **"+ Add page" REMOVED** from PageSwitcher (phase 8); **"Style" → renamed "Design"** (phase 5, matches t1); **"Home" → page-select dropdown** (phase 8, already planned as the t1 page-switcher pill). All three removals are deliberate BEHAVIOR changes authorized by the founder over the spec's presentation-only line.
- **editor-shell-redesign — MERGED 2026-07-16, founder QA + 3 sign-offs OWED (nothing blocked; rides big-bang):**
  1. **Human-eyes QA (nobody has clicked these — phases 4-8 had no live founder pass):** Settings rows each open the right modal (**especially Social & sharing** — wired; we nearly greyed it 3×) · app menu → Back to dashboard · undo/redo (newly reskinned) · Regen Copy toast + locale lock · mobile overlay at narrow width · theme swap + "Browse all styles" · SEO save + noindex switch · publish end-to-end · Reset. Automated + green: dirty-guard 4/4, publish 3/3, ui-isolation 2/2, render 3/3, 3402 unit tests.
  2. **SIGN-OFF — creation entries moved:** +Products/+Gallery/+Contact now live INSIDE the page dropdown under an "Add" eyebrow (the generic "+ Add page" is gone per founder ruling; these are `addArchetypePage`'s callers so they stay). Costs naayom one extra click.
  3. **SIGN-OFF — `smartphone` glyph substituted with `phone`.** The subset build **silently DROPPED** `smartphone` despite it being in `icons.txt` at build time (`6e7af964`); it rendered as literal 144px TEXT in the bar. Manifest is wrong in BOTH directions (175 listed vs 247 shipped ligatures). **One font regeneration fixes 5 things** (`smartphone` + the 4 Help-menu substitutes + `error`). Blocked: no Python/fontTools on this machine. **Whoever regenerates MUST verify output against the font's ligature table — the documented NOTICE command is what dropped it.**
  4. **SIGN-OFF — `ThemePopover`** (legacy non-template product) never opened in a browser: no seedable project exists. Handlers untouched, gates clean.
  5. **Known + logged:** first-publish domain upsell greyed (status fetch is mount-only; republish fine; fixing = a state write, correctly out of scope) · ~1s menu self-close (pre-existing; needs `EditProvider`) · narrow-width bar overflow (no responsive pass in this track) · `parity.spec`/`generation.spec` NOT re-run post-merge (~12min; parity green pre-merge, canvas isolation confirmed 4 ways).
- **⚠️ `CLAUDE.md` IS STALE (found during editor-shell-redesign, misled its planning):** it says publish "runs `generateStaticHTML()` … uploads to Vercel Blob". **`generateStaticHTML` has NO caller in the landing publish path** (only `src/lib/blog/publishBlogPost.ts:138`); `/api/publish` writes `htmlContent: ''` ("Phase 2: dynamic rendering") and `/p/[slug]` renders from `content`/`themeValues`. The spec's t17 file pointers were wrong for the same reason. Worth a doc fix — it will mislead the next track too.
- **⚠️ ui-foundation artifact riding the big-bang:** published pages (`/p/*`) preload the APP fonts — `onest-latin-400`, `onest-latin-600`, `material-symbols-rounded.woff2` — from the root layout. Preload-only (no bleed; `published.css` has 0 app-chrome bytes and the canvas still renders template fonts), but that's 3 unnecessary font downloads on every customer landing page. Already on main pre-editor-shell; not editor-shell's doing.
- **Carried from before (still open):** hygiene residual `src/app/layout.tsx:74` `publisher:"Lessgo.ai"` leak onto SSR pages (one-string fix, approval pending); onboarding-fixes founder manual verify (URL-import prefill, style-step gating, Structure gating); app-entry one-time signed-in→/dashboard check; Kundius delivery end-to-end (atelier plan §13) + prod grants (naayom comped-Pro, Kundius LTD cohort-0 — mailbox `pricing-v2-prod-grants-gate.md`); Stripe TEST-MODE setup (`pricing-v2-stripe-gate.md`); pixels prod smoke → hand scalifixai; delete 3 locked worktree dirs (`feature-{tracking-pixels,social-posts,app-subdomain-2}`).

## Queue after current wave

Lane 1: ui-foundation → auth-redesign → dashboard-redesign → editor-shell-redesign. Lane 2: work-skeleton D ✅ → phase-9 cutover + Kontur spike → work-onboarding (E) → work-library/CMS boards (D2). Then per `docs/product/productQueue.md`: research-brief (unblocked, atelier landed), universe specs. Dark-trio un-flag (backlog #17, deprioritized). (QA doctrine resolved 2026-07-16 — no agentic QA stage; split Playwright/smoke/founder, lives in feature `SKILL.md` Rules.)
