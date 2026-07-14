# Pricing v2 — Public Beta Spec

**Status:** agreed 2026-07-08, discussion-stage spec. Implement AFTER scalePlan.md tracks land, BEFORE public beta.
**Why:** current `planManager.ts` config is incoherent (FREE has custom domain + 20 published pages; PRO has 10) — half-hearted first pass, audience + tool capabilities evolved since.

## Tiers

| | Free | Pro | Founding LTD | Top-ups | Agency |
|---|---|---|---|---|---|
| Price | $0 | $29/mo · $290/yr | 20×$69, 20×$99, 20×$129 (60 total, beta-only, never returns) | $9 / 100 credits | "Talk to us" only |
| Sites | 1 on lessgo.site subdomain | 3, custom domains | = Pro, forever | — | — |
| Credits | 20 **one-time** (no refill) | 200/mo | 600 **lifetime pool** (NOT monthly) | anyone can buy | — |
| Badge | "Made with Lessgo" | none | none | — | — |
| Features | basic analytics, forms ~25 subs/mo, scrape+IVOC allowed | full: analytics, forms, integrations, testimonials, blog | = Pro | — | — |

## Decisions (locked)

1. **Value metric = published sites; credits meter AI.** Free tier's 20 credits naturally cover scrape(1) + IVOC(3) + 1 full gen(10) + regens — allowed on free for acquisition.
2. **LTD promises**: "Pro features as they exist today, forever" + 600-credit pool. Public cohort counter ("14 of 20 left"). Never name an AI model in the promise ("best available model"). "Never comes back" is literal — credibility asset.
3. **No trials.** Free tier is the trial. Pro = 14-day money-back guarantee. (No-card trials + custom domains = dead-site trap; trial machinery in planManager stays unused.)
4. **USD-only**, no PPP at launch (beta list global). Stripe adaptive pricing later if browse-no-convert geo signal appears.
5. **Model**: Sonnet in prod for now (~$0.10–0.20/full gen). Free tier's FIRST full gen uses best model (it's the sales demo); degrade cheap ops (regens/scrape) on free later if needed. Model-tiering as paid perk = future lever, transparent to users.
6. **No discount haggling** on Pro. Only: annual (2 mo free) + optional time-boxed launch coupon.
7. **Agency**: pricing-page card "Talk to us"; build after 3 real asks (white-label/team not real yet — see Before-Customer-#2 list).
8. **Grandfathering**: naayom = comped Pro (family, manual flag). Kundius = lifetimeDeal Pro (paid $300 bespoke). Bespoke done-for-you (custom template + lifetime Pro, from $300+) = repeatable third offer, kept OFF pricing page.
9. Writer track free-subdomain tier = same Free tier, not separate.

## Implementation surface (for planner, later)

- Rewrite `PLAN_CONFIGS` in `src/lib/planManager.ts` (fix FREE>PRO limit inversions; FREE: 1 published page, no custom domain, 20 one-time credits; PRO: 3 pages/domains, 200 cr/mo).
- One-time vs monthly credits: FREE credits must NOT reset monthly — check `UserUsage` reset logic + Stripe webhook renewal reset.
- `lifetimeDeal` flag (+ cohort/price-paid) on `UserPlan`; LTD + top-ups = Stripe **one-time payments** (Checkout mode=payment), not subscriptions.
- Credit top-up: add to `UserUsage` balance without plan change.
- Cohort counter: source of truth = count of lifetimeDeal purchases per cohort; public display on pricing page.
- Pricing page rebuild (4 cards: Free / Pro / Founding / Agency-contact) + refund-guarantee copy.
- Badge enforcement on free published pages (`removeBranding=false` actually rendered).
- Forms cap on free (~25/mo) — enforcement point in `/api/forms/submit`.
- Comped-Pro admin path for naayom; migrate Kundius record.

## In-app plan/credits surface → own spec (added 2026-07-12)

Pricing-v2 (this spec) shipped the pricing page + backend enforcement but **no in-app UI** (no credits counter, plan display, or gating messages — see `docs/reports/app-ui-ux-assessment.md` P0.7). That gap is now its own queued spec: **`docs/task/plan-credits-surface.spec.md`** (depends on this spec's shipped `UserUsage`/`planManager` config).

## Open items (resolve at plan time)

- Exact enforcement when free credits hit 0 mid-edit (block regen only, or block save too? → block AI ops only).
- LTD Stripe product structure (3 prices vs 1 product w/ tiers).
- What happens to Pro subscriber's unused monthly credits (recommend: no rollover).
- Downgrade path Pro→Free with 3 published custom-domain sites (recommend: sites stay live read-only, editing locked, 30-day grace).
