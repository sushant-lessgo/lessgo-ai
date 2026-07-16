# Orchestrator state — parallel work (updated 2026-07-16)

Main session = orchestrator for all parallel feature sessions. New orchestrator session: read this + `memory/project_parallel_orchestration.md`. Main tip at this update: `2568786e`.

## Active tracks (each in its OWN session; orchestrator coordinates only)

| Track | Worktree / branch | State |
|---|---|---|
| content-baseline-split | `.claude/worktrees/content-baseline-split`, `feature/content-baseline-split` @ `0f062d2d` | ⏸️ FOUNDER gate. Deploy A (`d3bb5e31`) live+baking; Deploy B (`38ce4346`) HELD. **Bake ends ≈2026-07-16** (48h from A ready, OR earlier if founder confirms naayom hard-reloaded). Phase-5 (c) dev round-trip PASS (data-safety + payload −~45% proven). NEEDS FOUNDER: pre-B naayom Project-row dump (recovery belt) → bake signal → go for station merge of B. Two-deploy is NON-NEGOTIABLE. |
| work-skeleton | `.claude/worktrees/work-skeleton`, `feature/work-skeleton` @ `f8ae333a` | D1 of work vertical (`workEndtoEnd.md`). Phases 1–8 + 8.5 (Atelier fidelity wave 1, founder eyeballed "better") green. ⏸️ paused at merge gate for founder. OPEN DECISION (mailbox): `bespoke` flip on atelier2 — session deferred it (flipping now leaks dev id into real serve shortlists, breaks serveGate/templateMeta). **ORCHESTRATOR RULING: defer flip to phase-9 cutover** (agree w/ session). Pending gates: Kundius parity QA sign-off, block-shape freeze (Kontur+Pulse lint), **Kontur spike post-merge = the architecture gate** (2nd skin ~1 day, zero markup). |
| ui-foundation (Lane 1 #1) | not yet started | SPECCED (`docs/task/ui-foundation.spec.md`, full tier). NEXT to launch — own `/feature` session. Parallel-safe w/ work-skeleton (verified: 0 overlap on `src/components/ui`/fonts/styles/tailwind/designTokens). Must merge BEFORE auth/dashboard/editor-shell. Pre-launch founder checks: (1) font binaries/licensing (Onest, JetBrains Mono, Material Symbols Rounded, Caveat); (2) mandatory merge gate = `/p/[slug]`+editor byte-identical before/after. |

## Worktree cleanup owed

- `work-copy-engine` — MERGED (`52da415b`); delete branch + worktree.
- `selection-highlight-labels` — MERGED (main tip `2568786e`); delete branch + worktree.

## UI Redesign track (new — `docs/tracks/uiRedesignPlan.md`, 2026-07-15)

Designer handoff landed (`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/`, 4 surfaces). Lifts the productQueue "UI-reimagine hold". Rule: **ownership follows functionality; design is input, never owner.** 3 parallel lanes:

- **Lane 1 — Reskin (sequential, each own /discuss→spec→/feature):** ui-foundation → auth-redesign → dashboard-redesign (incl. billing first-UI) → editor-shell-redesign. Absorbs held specs (dashboard-lifecycle, plan-credits-surface, publish-ux, editor-chrome). ui-foundation merges first.
- **Lane 2 — Work vertical (founder focus):** work-skeleton D → E `work-onboarding.spec.md` → work-library/CMS boards.
- **Lane 3 — Toolbar:** selection-highlight-labels ✅ MERGED (precursor) → shell migration per `toolbarPlan.md`; Design ▾ + rich toolbars unblock after skeleton D merges.
- Cross-lane: Lane 1 never touches editor selection/store (L3) or template blocks/skeleton (L2). Designs canonical as-delivered (no variant-pick step). New-behavior specs cite handoff badge IDs.

## Shipped since last update (2026-07-14 → 07-16, all merged to main)

1. **editor-phase-4-store-finish** — Gate D final merge; legacy layers deleted, bare-`useEditStore()` lint ban live (phase 12), close-out docs (phase 13). Dead-modals KEEP ruling recorded.
2. **work-contract** (`52da415b` parent chain) — phase A of work vertical: work-core section freeze + workElementContract, page vocabulary + site archetypes, work facts schema + 8 slots, profession rows + buyer-words, conformance test. FREEZES contracts for parallel C/D/E tracks.
3. **work-copy-engine** (`52da415b`) — the "C" copy track: deterministic slim-strategy + work strategy route (one small AI call) + facts-bound copy prompt/parser/generate-copy route + Kundius golden (founder-approved) + multi-page adapter fan-out + story-interview tier + NL language pass.
4. **selection-highlight-labels** (`2568786e`) — Lane-3 precursor: single-writer highlight consolidation (flicker fix) + shared target resolver + hover overlay + placeholder-type label badges.
5. **docs reorg** (`a997969f`) — tracks/ split into Completed/Someday subfolders.

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

- **content-baseline-split:** pre-B naayom row dump → bake signal → go for Deploy B station merge.
- **work-skeleton:** merge-gate sign-off (Kundius parity QA); block-shape freeze after Kontur+Pulse lint verdict; then station merge → Kontur spike (architecture gate).
- **ui-foundation launch pre-checks:** ~~font binaries/licensing~~ ✅ CLEARED 2026-07-16 (all OFL/Apache, no purchase; fetch commands + Material-Symbols subsetting baked into `ui-foundation.spec.md` § Font sourcing). REMAINING: acknowledge mandatory template-isolation merge gate.
- **Carried from before (still open):** hygiene residual `src/app/layout.tsx:74` `publisher:"Lessgo.ai"` leak onto SSR pages (one-string fix, approval pending); onboarding-fixes founder manual verify (URL-import prefill, style-step gating, Structure gating); app-entry one-time signed-in→/dashboard check; Kundius delivery end-to-end (atelier plan §13) + prod grants (naayom comped-Pro, Kundius LTD cohort-0 — mailbox `pricing-v2-prod-grants-gate.md`); Stripe TEST-MODE setup (`pricing-v2-stripe-gate.md`); pixels prod smoke → hand scalifixai; delete 3 locked worktree dirs (`feature-{tracking-pixels,social-posts,app-subdomain-2}`).

## Queue after current wave

Lane 1: ui-foundation → auth-redesign → dashboard-redesign → editor-shell-redesign. Lane 2: work-skeleton D → work-onboarding (E) → work-library/CMS boards. Then per `docs/product/productQueue.md`: research-brief (unblocked, atelier landed), universe specs. Dark-trio un-flag (backlog #17, deprioritized). (QA doctrine resolved 2026-07-16 — no agentic QA stage; split Playwright/smoke/founder, lives in feature `SKILL.md` Rules.)
