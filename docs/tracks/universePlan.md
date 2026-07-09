# universePlan — the website/landing-page universe

Status: DIRECTION AGREED · 2026-07-09 (discuss session). High-level approach only — implementation specs (`docs/task/universe-*.spec.md`) get written as each phase reaches the front of `docs/product/productQueue.md`, scalePlan-style.

**Vision:** evolve Lessgo from one-site-per-business to the business's ENTIRE web presence: the main site + a fleet of single-purpose landing pages (per keyword, per audience, per ad/email campaign). "Universe" = all pages of one business, grouped, managed, and measured together.

**Why us:** Lessgo is copywriting-first. Fleet buyers' whole job is message-matching (each page must continue the exact promise that made the visitor click) — copy is their bottleneck, not page-building. Keyword intent ≈ awareness stage: the existing strategy machinery (awareness-driven sections, two-phase copy) is precisely what variant pages need. Incumbents (Unbounce/Instapage) are blank-canvas builders; our Brief already understands the business, so variant #7 writes itself with strategy intact.

**GTM staircase:** solo founders → 1–5-employee teams → bigger cos. v1 is founder-driven (dogfood + customers Sushant personally brings, existing or new) — real usable UI, no mass self-serve polish. A/B, integrations, DTR arrive step-by-step as the customer ladder demands proof machinery.

---

## 1. Agreed decisions

| # | Decision |
|---|---|
| U1 | **Variant = Brief delta, never a new funnel.** A variant page is defined by what differs from the parent site's Brief (keyword / audience / message); everything else is reused. |
| U2 | **Three variant types in v1:** (1) **message-match** — paste the message that drove the click (ad copy / email / social post) + pick audience from dropdown (we already have the audiences); (2) **SEO keyword page** — input = target search phrase (competitor "X alternative" + location "dentist in Pune" pages are just named examples of this type); (3) **audience page** — pick/describe segment, confirm pains/desires from existing research. Campaign/offer pages (time-bound promos) = v2 (queue #5) · A/B testing = v3 (queue #6). |
| U3 | **Partial regen (delta granularity):** only the sections that change for this variant are regenerated; the rest is reused. No full-page regen per variant. |
| U4 | **Shared edits propagate to ALL variants — NON-NEGOTIABLE.** Fix a price/typo once → all 30 pages update. Implies shared content is referenced, not copied (planner decides how). Without this the fleet rots (pages go stale and the customer abandons them). |
| U5 | **SEO vs paid is a structural split:** paid pages ship `noindex` (hidden from Google — many near-identical pages = doorway-page penalty); SEO pages are indexed and must be genuinely different content, not near-copies. |
| U6 | **Message-match consumes the ad — never writes it.** Page copy continues the ad/email's exact promise. Ad-copy generation is out (backlog). |
| U7 | **Reuse known research.** Audience pages confirm pains/desires/objections from the Brief (and `research-brief.spec.md` output once live) — never re-ask or re-research what we already know. |
| U8 | **Variants live under the parent's domain** (subpaths) and wear the parent's template. No per-variant domains or templates. |
| U9 | **Brief-backed sites only.** Legacy (pre-Brief) customers: founder backfills a Brief manually, one-time, when needed — not specced. |
| U10 | **Universe view:** dashboard groups all pages under their business (flat project list dies at 30 pages) + **per-variant analytics side-by-side (required)** — visits/conversions per variant. |
| U11 | **Credit pricing for variants: deferred** — decided as the GTM ladder is climbed (note: 30 × FULL_PAGE_GEN(10) = 300cr vs Pro 200/mo → variants will need a cheaper cost). |
| U12 | **Founder-driven v1.** Dogfood + hand-brought customers. No self-serve funnel work. |

Related but separate (not this track): **pixel placement** — user-provided conversion/tracking snippets (Meta/Google/GTM) on published pages; EXPEDITED in backlog, live demand from scalifixai.com. Paid variants become far more useful once it ships.

## 2. Scope OUT (v1 non-goals)

A/B testing (v3) · campaign/offer pages (v2) · DTR (dynamic text replacement — one page swapping text per ad keyword; we make N real pages instead) · ad-platform import/sync · keyword research/suggestions (user brings the keyword) · writing the ad itself · bulk-edit management screens beyond automatic propagation (U4) · per-variant custom domains · new templates for variants · variant credit pricing · mass self-serve polish.

## 3. Dependencies & sequencing

- **Depends on:** scale track Brief + engines (scale-01+; variants are Brief deltas). Enhanced by, not blocked on: `research-brief.spec.md` (richer audience pages), pixel placement (paid measurement).
- **Preceded by:** scale pilot gate → **lessgo.ai main website built WITH Lessgo** (customer zero; its competitor/use-case/keyword pages = the first universe, dogfooded).
- Specs `universe-01…` written when the track reaches queue front; folded decisions stay in THIS doc (single plan doc per track).

## 4. Pilot — smallest slice that proves it

Dogfood: lessgo.ai's own universe. Main site + ~5 variants (2 SEO keyword, 2 message-match, 1 audience) built through the feature, zero hand-editing outside the editor.

**Success criteria:**
1. Create a variant from a parent site by giving ONLY the delta input (keyword / pasted message + audience / segment) — everything else reused from the Brief.
2. Only delta sections regenerate; untouched sections shared with parent (U3).
3. Edit a shared section once → visibly updates on ALL variants (U4, proven live).
4. Paid variants `noindex`, SEO variants indexed — verifiable in page source (U5).
5. Universe view shows one business's pages grouped with per-variant visits/conversions side-by-side (U10).
6. **Decision gate:** one real customer (candidate: scalifix) runs a paid message-match variant against real ad traffic. Gate question: would they pay for this?

## 5. Open questions (feed future specs)

1. Paid-page chrome: drop nav entirely (industry standard: no exits) or keep parent nav? — decide at spec time, per variant type.
2. Which sections constitute "the delta" per variant type (message-match: hero+proof? SEO: all-new body?) — engine/spec decision.
3. Universe view design (visual) — prototype before spec (throwaway HTML mockups).
4. Variant slug conventions + sitemap handling for SEO pages.
