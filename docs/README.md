# Lessgo Docs Index

_Verified against tree 2026-07-17._ One line per doc. Root keeps only `CLAUDE.md` + `README.md`. Completed/paused tracks move to `tracks/Completed/`; deferred to `tracks/Someday/`. Shipped `/feature` artifacts move to `docs/task/completed/`. Scratch (`temp/`, `reports/`) is deletable.

## architecture/ — references
- [copyEngines.md](architecture/copyEngines.md) — **the 5 copy engines** (thing/trust/work/place/quick-yes) core mental model; engine ≠ audienceType; extracted evergreen from scalePlan
- [publishArch.md](architecture/publishArch.md) — publishing & static-export architecture (Blob + KV, versions, custom domains); partly historical (has stale banner) — rendering now lives in `htmlGenerator.ts`, forms phase is done
- [pricingSystem.md](architecture/pricingSystem.md) — historical build plan for billing; current truth = `src/lib/planManager.ts` + `creditSystem.ts`
- [design-system-v3.md](architecture/design-system-v3.md) — **obsolete** (describes removed vibe-background system); superseded by CLAUDE.md "Design System v3" + `src/modules/Design/README.md`
- [newServiceOnboarding.md](architecture/newServiceOnboarding.md) — source-of-truth spec for service onboarding (Hearth)
- [phase11aArchitectureGaps.md](architecture/phase11aArchitectureGaps.md) — multi-template firewall + dual-renderer notes
- [TROUBLESHOOTING.md](architecture/TROUBLESHOOTING.md) — troubleshooting reference
- [STRIPE_SETUP.md](architecture/STRIPE_SETUP.md) — Stripe setup/config guide

## guides/ — how-tos
- [copyQualityEval.md](guides/copyQualityEval.md) — promptfoo copy-quality suite: eval set from real Briefs, judge calibration, per-step model ablation, prompt-optimization loop, local regression gate
- Adding a new template (clone an existing one; §12 multi-page) — now the `/new-template` skill: [.claude/skills/new-template/SKILL.md](../.claude/skills/new-template/SKILL.md)
- Manual pre-launch checklist (P0/P1/P2; automation lives in `e2e/` + Vitest) — now the `/manual-test` skill: [.claude/skills/manual-test/SKILL.md](../.claude/skills/manual-test/SKILL.md)

## tracks/ — one plan doc per ACTIVE track (fold phase specs in; no separate spec files)
Active tracks only live in `tracks/`; landed/paused tracks moved to `tracks/Completed/`, deferred to `tracks/Someday/` (docs reorg `a997969f`, 2026-07-15).
- [workEndtoEnd.md](tracks/workEndtoEnd.md) — **work vertical** end-to-end journey (one line → live site); acceptance-criteria source for phases A–F. Phase C+E3 built; E2 building.
- [uiRedesignPlan.md](tracks/uiRedesignPlan.md) — **UI redesign** track (designer handoff, 4 surfaces); screen triage + 3 lanes; lifts the reimagine hold.
- [toolbarPlan.md](tracks/toolbarPlan.md) — **toolbar standard** action contract (Beta vs Final); skeleton-gated rich toolbars.
- [engineDecider.md](tracks/engineDecider.md) — **how a one-liner becomes an engine**: infer→confirm-when-unsure→revisable belief, buyer-decision question, ambiguous-type registry state, persona-gate retirement. Design agreed, not yet specced.
- [uiRequirements.md](tracks/uiRequirements.md) — designer brief; **SUPERSEDED by uiRedesignPlan.md**, kept for reference only.
- **Completed/** — landed or paused tracks: meridianPlan, nsoPlan, multiPagePlan, blogFeature, seoPlan, testimonialSystem, newGeneration, writerFlownTemplate, writerDesignBrief, scalePlan, templatePlan, editorPlan, i18nPlan (i18n = **DEFERRED**).
- **Someday/** — [universePlan.md](tracks/Someday/universePlan.md) — variant fleet per business (direction agreed; specs when queue-front).

## product/
- [orchestrator.md](product/orchestrator.md) — **in-flight + merged-this-cycle** board: branches, worktrees, merge/deploy state, Lane/Type/Spec dashboard, protocols, mailbox. **Start here for board status.**
- [productQueue.md](product/productQueue.md) — **specced-but-not-started** specs in build order (a spec is here until it gets a branch, then it moves to orchestrator.md)
- [productBacklog.md](product/productBacklog.md) — unspecced ideas/directions + known bugs / pre-beta fixes (no spec yet)
- [deploy-qa-checklist.md](product/deploy-qa-checklist.md) — master pre-push QA gate for the accumulated unpushed big-batch (preview deploy mandatory)
- [brandMessage.md](product/brandMessage.md) — brand/positioning brief
- [anchorLibrary.md](product/anchorLibrary.md) · [templateLibrary.md](product/templateLibrary.md) — anchor/template inventory references
- [skeleton.md](product/skeleton.md) · [roughNotes.md](product/roughNotes.md) — scratch/working notes

> **Doc lifecycle (de-blurred 2026-07-16):** idea → `productBacklog.md` → `/discuss` → spec → `productQueue.md` → *(branch created)* → `orchestrator.md` → *(pushed+deployed)* → removed. A spec is in **exactly one** of {queue, orchestrator} at a time.

## Code-level READMEs (in `src/` — read these before working in a dir)
Each major directory carries an agent-oriented README, verified against code 2026-07:

- **Templates:** [src/modules/templates/README.md](../src/modules/templates/README.md) — 3-tier model, registry dispatch-firewall, `TemplateModule` contract, all 8 templates, dual-renderer + `.core.tsx` patterns. Per-template quirks: [lumen](../src/modules/templates/lumen/README.md) (EN/NL twin fields), [vestria](../src/modules/templates/vestria/README.md) (mood axis), [granth](../src/modules/templates/granth/README.md) (`.core.tsx` single-source).
- **Rendering:** [src/modules/generatedLanding/README.md](../src/modules/generatedLanding/README.md) — edit vs published renderer, two registries, `data-surface`, divergence trap. [src/lib/staticExport/README.md](../src/lib/staticExport/README.md) — `generateStaticHTML`, asset build, Blob upload.
- **Generation:** [src/modules/prompt/README.md](../src/modules/prompt/README.md) — two-phase strategy→copy pipeline, provider chain (OpenAI→Nebius→mock). [sections](../src/modules/sections/README.md), [audience](../src/modules/audience/README.md) (template-agnostic firewall), [generation](../src/modules/generation/README.md), [inference](../src/modules/inference/README.md), [mock](../src/modules/mock/README.md).
- **Design system:** [src/modules/Design/README.md](../src/modules/Design/README.md) — two render paths (template ThemeInjector vs legacy 30-palette background/), shared primitives, self-hosted fonts.
- **State:** [src/hooks/README.md](../src/hooks/README.md) + [src/stores/README.md](../src/stores/README.md) — token-scoped editStore factory; **`useEditStore` (selector-first) is the active editor API** — the `useEditStoreLegacy`/`useEditStoreGlobal` façades were removed in editor-phase-4; bare `useEditStore()` whole-store subscription is ESLint-banned. [src/types/README.md](../src/types/README.md) — 3-tier contract source of truth. [src/modules/collections/README.md](../src/modules/collections/README.md) — multi-page collections.
- **Routes:** [src/app/README.md](../src/app/README.md) — page-route map + middleware. [src/app/api/README.md](../src/app/api/README.md) — full API route table (auth/rate-limit/credits). [src/app/edit/[token]/README.md](../src/app/edit/%5Btoken%5D/README.md) — editor internals.
- **Shared services:** [src/lib/README.md](../src/lib/README.md) — grab-bag map + load-bearing invariants (`checkCredits`, `assertProjectOwner`, edge KV REST). Subdirs: [routing](../src/lib/routing/README.md), [blog](../src/lib/blog/README.md), [testimonials](../src/lib/testimonials/README.md).
- **Misc:** [prisma/README.md](../prisma/README.md) — model table + migrate-not-push. [scripts/README.md](../scripts/README.md) — build scripts. [src/components/README.md](../src/components/README.md), [src/utils/README.md](../src/utils/README.md), [e2e/README.md](../e2e/README.md).

## Working dirs (not indexed per-file)
- `task/` — active `/feature` pipeline artifacts (spec/plan/audit per feature). Shipped features move to `task/completed/`; deferred specs to `task/Someday/`.
- `temp/`, `reports/` — scratch; safe to delete (only `temp/first20websites.md` is git-tracked). QA notes in `temp/` may be referenced by `productBacklog.md` — check before deleting.

## Conventions
- New track → new `tracks/<track>.md`; keep it the single plan doc for that track.
- Scratch files (dev logs, PO review verdicts like `POreview.md`) live at repo root temporarily and get deleted after use.
- Template HTML mockups live in `template-design/` (gitignored, local only).
