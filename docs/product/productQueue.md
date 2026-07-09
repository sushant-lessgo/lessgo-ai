# Product Queue

Ordered build queue — the single source of truth for WHAT comes next. **Only spec files enter this queue.** Queue number = build order. Agreed-but-unspecced directions live in `productBacklog.md` and enter here once their spec is written.

Updated: 2026-07-09

| # | Feature | Spec file | Status |
|---|---------|-----------|--------|
| 1 | Scale track — remaining specs (structure convergence, businessType config melt, block variants) | `docs/task/scale-00-index.md` → scale-07/08/09 | in progress (scale-08 on branch) |
| 2 | Data capture — edit-delta dataset (AI text vs user text), regen events, beta-funnel signals | `docs/task/data-capture.spec.md` | queued |
| 3 | Research brief — premium research-backed path: agentic Claude VoC + competitor research → editable Brief → generation | `docs/task/research-brief.spec.md` | queued |
| 4 | Pricing v2 — Free/Pro/Founding-LTD tiers + credit top-ups (implement before public beta) | `docs/task/pricing-v2.spec.md` | queued |
| 5 | Universe v1 — variant fan-out (message-match / SEO keyword / audience), shared-edit propagation, universe view + per-variant analytics | `docs/tracks/universePlan.md` → universe-01… (spec required before /feature) | reserved, awaiting spec |
| 6 | Campaign/offer pages — time-bound promo variants (universe v2) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 7 | A/B testing — split traffic between variants (universe v3) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |

## Rules
- Only spec files (`docs/task/*.spec.md` or a track's numbered specs) get a queue number.
- New idea → `productBacklog.md`; agreed direction → `/discuss` → spec → enters queue.
- Reordering = edit this file in a discussion, never implicitly.
- Item reaches #1 → run `/feature <spec>`.
