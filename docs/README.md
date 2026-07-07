# Lessgo Docs Index

One line per doc. Root keeps only `CLAUDE.md` + `README.md`. Completed/stale plans are deleted — recover via git history if ever needed.

## architecture/ — references
- [publishArch.md](architecture/publishArch.md) — publishing & static-export architecture (Blob + KV, versions, custom domains); partly historical (has stale banner) — rendering now lives in `htmlGenerator.ts`, forms phase is done
- [pricingSystem.md](architecture/pricingSystem.md) — historical build plan for billing; current truth = `src/lib/planManager.ts` + `creditSystem.ts`
- [design-system-v3.md](architecture/design-system-v3.md) — **obsolete** (describes removed vibe-background system); superseded by CLAUDE.md "Design System v3" + `src/modules/Design/README.md`
- [newServiceOnboarding.md](architecture/newServiceOnboarding.md) — source-of-truth spec for service onboarding (Hearth)
- [phase11aArchitectureGaps.md](architecture/phase11aArchitectureGaps.md) — multi-template firewall + dual-renderer notes
- [TROUBLESHOOTING.md](architecture/TROUBLESHOOTING.md) — troubleshooting reference
- [STRIPE_SETUP.md](architecture/STRIPE_SETUP.md) — Stripe setup/config guide

## guides/ — how-tos
- Adding a new template (clone an existing one; §12 multi-page) — now the `/new-template` skill: [.claude/skills/new-template/SKILL.md](../.claude/skills/new-template/SKILL.md)
- Manual pre-launch checklist (P0/P1/P2; automation lives in `e2e/` + Vitest) — now the `/manual-test` skill: [.claude/skills/manual-test/SKILL.md](../.claude/skills/manual-test/SKILL.md)

## tracks/ — one plan doc per track (fold phase specs in; no separate spec files)
- [meridianPlan.md](tracks/meridianPlan.md) — product template track
- [nsoPlan.md](tracks/nsoPlan.md) — service template track
- [multiPagePlan.md](tracks/multiPagePlan.md) — multi-page + collections (naayom-driven)
- [blogFeature.md](tracks/blogFeature.md) — blog track (Phase 1 manual blogging)
- [seoPlan.md](tracks/seoPlan.md) — SEO/OG track (built on branch `seo`, pending merge)
- [testimonialSystem.md](tracks/testimonialSystem.md) — testimonial system (dark-launched, worktree)
- [newGeneration.md](tracks/newGeneration.md) — SiteContext + sitemap gate + per-page fan-out (Vestria pilot)
- [writerFlownTemplate.md](tracks/writerFlownTemplate.md) — writer vertical + Granth template
- [writerDesignBrief.md](tracks/writerDesignBrief.md) — design brief companion to the writer track
- [i18nPlan.md](tracks/i18nPlan.md) — multilingual platform direction (**DEFERRED** — do not build yet)

## product/
- [productBacklog.md](product/productBacklog.md) — product backlog
- [brandMessage.md](product/brandMessage.md) — brand/positioning brief

## Code-level READMEs (in `src/` — read these before working in a dir)
Each major directory carries an agent-oriented README, verified against code 2026-07:

- **Templates:** [src/modules/templates/README.md](../src/modules/templates/README.md) — 3-tier model, registry dispatch-firewall, `TemplateModule` contract, all 8 templates, dual-renderer + `.core.tsx` patterns. Per-template quirks: [lumen](../src/modules/templates/lumen/README.md) (EN/NL twin fields), [vestria](../src/modules/templates/vestria/README.md) (mood axis), [granth](../src/modules/templates/granth/README.md) (`.core.tsx` single-source).
- **Rendering:** [src/modules/generatedLanding/README.md](../src/modules/generatedLanding/README.md) — edit vs published renderer, two registries, `data-surface`, divergence trap. [src/lib/staticExport/README.md](../src/lib/staticExport/README.md) — `generateStaticHTML`, asset build, Blob upload.
- **Generation:** [src/modules/prompt/README.md](../src/modules/prompt/README.md) — two-phase strategy→copy pipeline, provider chain (OpenAI→Nebius→mock). [sections](../src/modules/sections/README.md), [audience](../src/modules/audience/README.md) (template-agnostic firewall), [generation](../src/modules/generation/README.md), [inference](../src/modules/inference/README.md), [mock](../src/modules/mock/README.md).
- **Design system:** [src/modules/Design/README.md](../src/modules/Design/README.md) — two render paths (template ThemeInjector vs legacy 30-palette background/), shared primitives, self-hosted fonts.
- **State:** [src/hooks/README.md](../src/hooks/README.md) + [src/stores/README.md](../src/stores/README.md) — token-scoped editStore factory; `useEditStoreLegacy` is the ACTIVE editor API despite the name. [src/types/README.md](../src/types/README.md) — 3-tier contract source of truth. [src/modules/collections/README.md](../src/modules/collections/README.md) — multi-page collections.
- **Routes:** [src/app/README.md](../src/app/README.md) — page-route map + middleware. [src/app/api/README.md](../src/app/api/README.md) — full API route table (auth/rate-limit/credits). [src/app/edit/[token]/README.md](../src/app/edit/%5Btoken%5D/README.md) — editor internals.
- **Shared services:** [src/lib/README.md](../src/lib/README.md) — grab-bag map + load-bearing invariants (`checkCredits`, `assertProjectOwner`, edge KV REST). Subdirs: [routing](../src/lib/routing/README.md), [blog](../src/lib/blog/README.md), [testimonials](../src/lib/testimonials/README.md).
- **Misc:** [prisma/README.md](../prisma/README.md) — model table + migrate-not-push. [scripts/README.md](../scripts/README.md) — build scripts. [src/components/README.md](../src/components/README.md), [src/utils/README.md](../src/utils/README.md), [e2e/README.md](../e2e/README.md).

## Working dirs (not indexed per-file)
- `task/` — `/feature` pipeline artifacts (spec/plan/audit per feature); deleted when a feature ships.
- `temp/`, `reports/` — scratch; safe to delete.

## Conventions
- New track → new `tracks/<track>.md`; keep it the single plan doc for that track.
- Scratch files (dev logs, PO review verdicts like `POreview.md`) live at repo root temporarily and get deleted after use.
- Template HTML mockups live in `template-design/` (gitignored, local only).
