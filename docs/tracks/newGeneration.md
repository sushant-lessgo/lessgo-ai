# 1. Multi-page site generation


**Date:** 2026-07-05


## Today
Generation = **single page only**. `/api/generate-landing` has no page axis. Multi-page
pages come from clone / hardcoded archetype (Naayom designer port) / client-supplied
collection — **never per-page AI copy.**

## Proposed flow — human touchpoint on the SHAPE, before any copy
1. **AI proposes the sitemap/shape** — Home page (sections finalized + their order) **+** the
   list of separate pages (e.g. About, Industries, Services, Contact).
2. **Human gate** — user reviews & agrees to the shape (which pages, section order) **before**
   any page copy is generated. Adjustable.
3. **Then per-page copy generation** — only after agreement, generate each page's copy. Per
   page, split content into **AI-generated (copywriting)** vs **client-input (facts/assets,
   reused from existing site)** — same facts-vs-supplied rule already agreed.

**Why the gate:** don't spend tokens writing copy for pages that get cut; user owns the
structure; natural checkpoint before fanning out to N pages.


# 2. improveScrape.md — Reuse ingested site copy in generation

**Status:** Agreed direction, DEFERRED to its own build (not part of Golden Shadow template work).
**Date:** 2026-07-05

## Problem spotted
Today `/api/v2/scrape-website` does one AI extraction call over the full crawled site
(`combinedText` = all pages concatenated), returns **only ~7 structured fields**
(one-liner, categories, audiences, features, offer, verbatim testimonials, goal), then
**discards the prose** — never stored, never returned, never reaches copy generation.

- Not "extra tokens wasted" — reading the site is required to extract from it.
- The waste is **value, not tokens**: we pay a credit to crawl + AI-read the whole site,
  then throw away everything except 7 fields.
- Existing copy (e.g. goldenshadowtrading.com/about-us) is high-signal context the copy
  engine never sees.

## What we agreed to build
Reuse the ingested copy as **generation inspiration**, token-efficiently.

### Two separable costs
1. **Ingest the site** — already paid, currently discarded. Fix = stop discarding.
2. **Reuse prose in the copy prompt** — genuinely additional tokens; only pay if it helps.

### Design (token-efficient)
Distill at **scrape time** (the call already paid for), store structured, feed a **small
payload** into the copy prompt. No new crawl, minimal extra generation tokens.

Pick what to feed by **what the old copy is FOR** — not to save tokens (both options are cheap):

| Job | Feed | Why |
|---|---|---|
| **Facts & claims** (materials, years, certs, numbers, differentiators) | **Richer structured facts** (extend the current 7 fields) | Durable, safe, cheap. The backbone. |
| **Voice & proof phrasing** (how founder talks, strong real lines) | **Verbatim excerpts** (word-for-word, like testimonials) — **NOT a summary** | Summary launders away the exact phrasing + costs an extra step. |

**Skip the summary approach** — worst of both: extra AI step, loses phrasing, still risks
anchoring to mediocre copy.

## Prompt framing (critical)
Frame as *"facts + tone cues to draw from — improve on them, don't imitate."*
NOT *"rewrite this."* Otherwise the engine paraphrases weak existing copy and output gets
**worse** (Golden Shadow's current copy is thin — "Wear Better, Feel Better").

## Safety rules
- Tag extracted facts with confidence.
- Treat excerpts as **tone reference only — never as assertable claims.**
- Keep the existing "never fabricate testimonials/customers/numbers" discipline.

## Scope note
This is a **core generation-pipeline change** — affects ALL product (and service)
generation, not just one template.

## Store

Need guidance on:

1. What do we store for future use? Whole old website, images, extracted facts, summary?
2. Do we use current scrape method or context.dev? Evaluate on the usage vs cost-efficiency vs result quality

## Future use

This will become a context file.. which is now used only for website generation but it will be also be used for in future for 1. multiple landing page generation for a particular need like targeting keyword for SEO, coming here from an ad landing page 2. marketing material produce like pamphlet etc. 3. social media posts produce

---

# BUILD PLAN — PO-approved 2026-07-05 (v2, POreview.md folded in)

Pilot: Golden Shadow Trading (goldenshadowtrading.com) on new GA product template **vestria**
(`Vestria - Uniform Manufacturing (Cobalt).html`). 4 phases, gate after each. Branch `GoldenShadowTrading`.

## Phase 0 — Vestria template skin (single-page home via existing AI path)
- granth `.core.tsx` single-source pattern; 12 blocks; `vs-` prefix; cobalt palette; variant `tailored`.
- Section mapping: header/hero/trust/features(services)/catalog(grid-only, NO materialization)/process/testimonials/contact(lead form)/footer reused; **NEW audience types: `industries`, `about`, `materials`**.
- Registration: templateIds + usesTemplateModule product clause + palettesForTemplate + registry loader + CriticalFontPreload; Bodoni Moda variable woff2 added (Hanken/JetBrains already hosted).
- Selection: `?template=vestria` → store templateId (before persona branch). **Admin-gated server-side** (ADMIN_CLERK_IDS) until GA metering — unmetered N× credit path otherwise.
- Copy: templateId threaded to section/block selectors + voiceId `tailored-trade` (route-derived; prompt firewall keys untouched). Lead form provisioned like ensureContactForm.
- Safety net = registration.test.ts (missing schema/registry entries fail SILENT placeholder, not tsc). Check 3 closed-union editor files (SectionToolbar, SectionCRUD, contentActions) fall through on new types. Update generation-contract/golden fixtures.
- **Gate 0 = skin + dual-renderer parity ONLY, not final copy** (Phase 3 replaces copy path).

## Phase 1 — SiteContext (persist scrape + cache-check)
- New `SiteContext` table, GLOBAL URL-keyed (IVOCCache precedent), `@@unique([urlKey, audienceType])`, TTL 30d, upsert overwrites: pages[] (raw prose currently discarded), extract (7 fields), facts[] (confidence-tagged), excerpts[] (VERBATIM ≤300ch, tone-only).
- ONE extended AI call at scrape time (no summary field). Route: cache-check FIRST → hit = 0 credits no crawl. Response shape unchanged. `src/lib/siteContext.ts` helpers. `prisma migrate dev`.
- importSourceUrl persisted into finalContent.onboardingData (project↔SiteContext link).

## Phase 2 — Sitemap proposal + human gate (onboarding: after strategy, before copy)
- `src/modules/audience/product/pageArchetypes.ts` (audience-level pure data keyed by templateId): vestria menu = home/about/industries/services/catalogue/contact w/ allowed+required sections; meridian/techpremium → null = gate skipped, zero behavior change.
- Strategy prompt Step 5 (menu-constrained; home-only legit for new business); server `clampSitemap` is the law; home sections stay top-level sections/uiblocks.
- New `sitemap` onboarding step + SitemapReviewStep (UnderstandingStep pattern; page cards, section chips, add/remove/reorder). Phase 2 still generates home only.

## Phase 3 — Per-page copy fan-out + SiteContext feed
- generate-copy gains optional page/sitePages/sourceUrl (server-side SiteContext lookup). Prompt: page-context block + SiteContext block ("draw from, improve, don't imitate"; excerpts tone-only never assertable). Works w/o SiteContext + w/ home-only sitemap.
- **Client loop + PER-PAGE saveDraft persistence + DB resume** (server loop rejected: Vercel limits). Skeleton save post-gate; save after EVERY page; resume from first missing page after reload; never re-pay pages.
- Fresh `buildMultiPageFinalContent` — HARD INVARIANT: never calls materializeIntoPages/materializeHomeTeasers, never sets collectionKey/kind (Products panel verified techpremium-gated, PageSwitcher.tsx:75). autoMapLinkHrefs maps nav labels → pathSlugs.
- Verification: Golden Shadow e2e incl. kill-tab-mid-generation resume + publish subpaths proven.

## Decisions locked
manual_preferred contact/tel/WhatsApp · type `materials` not fabrics · TTL 30d · scrape facts product-only · cobalt-only v1 · client fan-out loop w/ per-page persist · admin-gated vestria until metering · Gate 0 skin-parity only.