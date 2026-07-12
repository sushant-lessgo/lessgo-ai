# Product Queue

Ordered build queue — the single source of truth for WHAT comes next. **Only spec files enter this queue.** Queue number = build order. Agreed-but-unspecced directions live in `productBacklog.md` and enter here once their spec is written.

Updated: 2026-07-12

| # | Feature | Spec file | Status |
|---|---------|-----------|--------|
| 0 | **Editor track — world-class editing** (founder ruling 2026-07-11: priority #1 after i18n): perf-04 loop kill → trust (commit guarantee + edit-loss fix) → truth (no stubbed buttons) → shell+primitives rebuild → store finish → scale §5/§6 UI surface | `docs/tracks/editorPlan.md` (phase 0 = `docs/task/perf-04-elementdetector-loop.spec.md`) | phases 0–3 merged; phase 4 (store finish) NEXT, gated on data-capture live QA |
| 1 | Template factory — template-addition pipeline (design kit + lint + conformance + thin skill) + look/token knobs + named looks; **consumes editorPlan's editing contract (phases 0–3 are a dependency)**; then atelier drill | `docs/task/atelier-template.spec.md` (template-factory spec deleted post-ship, in git history) | template-factory SHIPPED (gates 8/9/11 passed); atelier drill ACTIVE (feature/atelier-template, phase 9a/9b) |
| 2 | Content baseline split — stop shipping `content.baseline` (~2× payload) to editor; server-side reference only | `docs/task/content-baseline-split.spec.md` | queued (natural fit alongside editor phase 4 — same save-path files) |
| 3 | Tracking pixels — Meta Pixel + GA4 ID fields (Pro), injected at publish. **EXPEDITE: live demand scalifixai.com** | spec deleted post-ship (git history) | SHIPPED (founder smoke pending) |
| 4 | App subdomain — app → `app.lessgo.ai`, apex marketing-only wired as customer #0 (pre-SEO) | spec deleted post-ship (git history) | SHIPPED (slices 1+2, cutover live) |
| 5 | Data capture — edit-delta dataset (AI text vs user text), regen events, beta-funnel signals | spec deleted post-ship (git history) | SHIPPED (live QA running 2026-07-12) |
| 6 | Research brief — premium research-backed path: agentic Claude VoC + competitor research → editable Brief → generation | `docs/task/research-brief.spec.md` | queued — HELD until atelier lands (generation-path conflict) |
| 7 | Pricing v2 — Free/Pro/Founding-LTD tiers + credit top-ups (implement before public beta) | `docs/task/pricing-v2.spec.md` | in progress (feature/pricing-v2; phases 1–7 committed, phase 8 next; ships dark behind `PRICING_V2_COMMERCE`) |
| 8 | Universe v1 — variant fan-out (message-match / SEO keyword / audience), shared-edit propagation, universe view + per-variant analytics | `docs/tracks/universePlan.md` → universe-01… (spec required before /feature) | reserved, awaiting spec (**needs editorPlan phase 4 ops**) |
| 9 | Campaign/offer pages — time-bound promo variants (universe v2) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 10 | A/B testing — split traffic between variants (universe v3) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 11 | Email sequences — goal-matched copy-only sequences (6 archetypes over 18-intent vocab), social-posts rail | `docs/task/email-sequences.spec.md` | MERGED DARK behind kill-switch; un-flag blocked on real-LLM QA (pilot copy) |
| 12 | Cold outreach pack — per-prospect grounded messages (scraper reuse) + per-platform formats, copy-only | `docs/task/cold-outreach.spec.md` | MERGED DARK behind kill-switch; un-flag blocked on real-LLM QA (prospect quality) |

Note 2026-07-11: perf-01/02/03 SHIPPED (was #2); throttled benchmark + toolbar review folded the
residual work (perf-04, edit-loss, toolbar rebuild) into the editor track (#1, editorPlan.md).

## Rules
- Only spec files (`docs/task/*.spec.md` or a track's numbered specs) get a queue number.
- New idea → `productBacklog.md`; agreed direction → `/discuss` → spec → enters queue.
- Reordering = edit this file in a discussion, never implicitly.
- Item reaches #1 → run `/feature <spec>`.
