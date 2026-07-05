# Lessgo Docs Index

One line per doc. Root keeps only `CLAUDE.md` + `README.md`. Completed/stale plans are deleted — recover via git history if ever needed.

## architecture/ — evergreen references
- [publishArch.md](architecture/publishArch.md) — publishing & static-export architecture (Blob + KV, versions, custom domains)
- [pricingSystem.md](architecture/pricingSystem.md) — plans, credits, Stripe billing architecture
- [design-system-v3.md](architecture/design-system-v3.md) — design system v3 (tokens, palettes, fonts)
- [newServiceOnboarding.md](architecture/newServiceOnboarding.md) — source-of-truth spec for service onboarding (Hearth)
- [phase11aArchitectureGaps.md](architecture/phase11aArchitectureGaps.md) — multi-template firewall + dual-renderer notes
- [TROUBLESHOOTING.md](architecture/TROUBLESHOOTING.md) — troubleshooting reference
- [STRIPE_SETUP.md](architecture/STRIPE_SETUP.md) — Stripe setup/config guide

## guides/ — how-tos
- [newTemplate.md](guides/newTemplate.md) — adding a new template (clone an existing one); §12 multi-page
- [TESTING.md](guides/TESTING.md) — manual pre-launch checklist (P0/P1/P2); automation lives in `e2e/` + Vitest

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

## Conventions
- New track → new `tracks/<track>.md`; keep it the single plan doc for that track.
- Scratch files (dev logs, PO review verdicts like `POreview.md`) live at repo root temporarily and get deleted after use.
- Template HTML mockups live in `template-design/` (gitignored, local only).
