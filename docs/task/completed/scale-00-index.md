# scale specs — index & build order

Source of truth: `docs/tracks/scalePlan.md` (decisions D1–D18, specs §5–§8, round-2 §11). Each spec below is one `/feature` run. Numbered = implementation order.

## Order & gates

| # | Spec | Delivers | Depends |
|---|---|---|---|
| 01 | `scale-01-brief-registry.spec.md` | Brief record · registry metadata (engines/capabilities/styles) · goal enums · conformance tests · template audit v0 | — |
| 02 | `scale-02-router-serve-gate.spec.md` | one entry · classify → Brief draft · page-2 confirm · serve gate · MANUAL-ONBOARD + demand board | 01 |
| 03 | `scale-03-images-at-birth.spec.md` | wire orphaned fetchImages into fan-out | 01 |
| — | **PILOT GATE (human)** — site 21 self-serves (scalePlan §9); pass → continue | 01–03 |
| 04 | `scale-04-click-system.spec.md` | Destination union · CTAButton/Link · GOAL_REF · one link popover · beacon attribution | 01 |
| 05 | `scale-05-goal-machinery.spec.md` | intent→copy · mechanism behaviors (store-badges, follow-social, WhatsApp) · form auto-seed | 04 |
| 06 | `scale-06-wizard-convergence.spec.md` | one wizard engine · resolved wizard (waterfall, T1/T2) · kills product/service forks | 01, 02 |
| 07 | `scale-07-structure-convergence.spec.md` | engine-owned sections · universal structure confirm · sitemap for all · swap via hard-fit | 01, 06 |
| 08 | `scale-08-businesstype-config.spec.md` | melt manufacturer 24-file hack → config entry · voice re-key · delete dead legacy | 06, 07 |
| 09 | `scale-09-block-variants.spec.md` | 2+ blocks/section · eligibility filter · defaultBlock · fix surge random | 07 |

NOT specced (demand-gated per build ladder, scalePlan §7): place engine, quick-yes engine, brand kit, GBP/Insta import. Spec them when a lead lands on that rung.

## Rules that bind every spec
- Copy depends on engine + Brief only, never template (scalePlan §3 invariants).
- Any customer difference = list entry, not if-statement (D9).
- Machine decides facts, user decides taste (D6).
- Proof is scraped verbatim or user-given, never generated (§8).
- Templates ship all engine-core sections or don't ship (designer's bar, §3).
