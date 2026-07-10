# Product Queue

Ordered build queue — the single source of truth for WHAT comes next. **Only spec files enter this queue.** Queue number = build order. Agreed-but-unspecced directions live in `productBacklog.md` and enter here once their spec is written.

Updated: 2026-07-10

| # | Feature | Spec file | Status |
|---|---------|-----------|--------|
| 1 | Scale track — remaining specs (structure convergence, businessType config melt, block variants) | `docs/task/scale-00-index.md` → scale-07/08/09 | in progress (scale-08 on branch) |
| 2 | Editor performance — interaction cost (selectors/memo/persist), background overhead (overlays/autosave/snapshots/debug), image weight. **EXPEDITE: naayom editor unusable on 8GB laptop** | `docs/task/perf-01-editor-interaction.spec.md` → perf-02, perf-03 | queued (next after current scale run) |
| 3 | Content baseline split — stop shipping `content.baseline` (~2× payload) to editor; server-side reference only | `docs/task/content-baseline-split.spec.md` | queued (after perf-01/02 — same save-path files) |
| 4 | Template factory — template-addition pipeline (design kit + lint + conformance + thin skill) + look/token knobs + named looks in picker | `docs/task/template-factory.spec.md` | queued (after scale-09 lands) |
| 5 | Tracking pixels — Meta Pixel + GA4 ID fields (Pro), injected at publish. **EXPEDITE: live demand scalifixai.com** | `docs/task/tracking-pixels.spec.md` | queued |
| 6 | App subdomain — app → `app.lessgo.ai`, apex marketing-only wired as customer #0 (pre-SEO) | `docs/task/app-subdomain.spec.md` | queued |
| 7 | Data capture — edit-delta dataset (AI text vs user text), regen events, beta-funnel signals | `docs/task/data-capture.spec.md` | queued |
| 8 | Research brief — premium research-backed path: agentic Claude VoC + competitor research → editable Brief → generation | `docs/task/research-brief.spec.md` | queued |
| 9 | Pricing v2 — Free/Pro/Founding-LTD tiers + credit top-ups (implement before public beta) | `docs/task/pricing-v2.spec.md` | queued |
| 10 | Universe v1 — variant fan-out (message-match / SEO keyword / audience), shared-edit propagation, universe view + per-variant analytics | `docs/tracks/universePlan.md` → universe-01… (spec required before /feature) | reserved, awaiting spec |
| 11 | Campaign/offer pages — time-bound promo variants (universe v2) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 12 | A/B testing — split traffic between variants (universe v3) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 13 | Email sequences — goal-matched copy-only sequences (6 archetypes over 18-intent vocab), social-posts rail | `docs/task/email-sequences.spec.md` | queued (value-stack; position TBD in discussion) |
| 14 | Cold outreach pack — per-prospect grounded messages (scraper reuse) + per-platform formats, copy-only | `docs/task/cold-outreach.spec.md` | queued (value-stack; position TBD in discussion) |

## Rules
- Only spec files (`docs/task/*.spec.md` or a track's numbered specs) get a queue number.
- New idea → `productBacklog.md`; agreed direction → `/discuss` → spec → enters queue.
- Reordering = edit this file in a discussion, never implicitly.
- Item reaches #1 → run `/feature <spec>`.
