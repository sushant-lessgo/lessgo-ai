- **What:** "The landing page builder that **thinks like a copywriter**." Copywriting/persuasion-first, not design-first.
- **Wedge:** Competitors (Webflow, Wix, Framer, Lovable, Claude Code) optimize for *pretty*. Lessgo optimizes for *converting copy*. "Your biggest problem is not poor product. It is poor messaging."
- **How:** "Conversion Intelligence Engine" + 150 UIBlocks → every page unique, **no fixed templates**. Adapts to **market sophistication** (Schwartz) and **awareness level**. Full page (copy + structure + design) in **~2 minutes**.
- **Voice of product:** "your judgment-free co-founder that writes with you, for you, in your voice."
- **Stage:** $0 MRR, ~75 waitlist, alpha → beta circle. Goal: $0 → $10K MRR in 365 days.
- **CTA targets:** waitlist / beta circle / "reply 'Lessgo'" / link in bio.

---
---

# Brand Brief — Lessgo, 12 Months On (for messaging decisions)

_Prepared for the branding team · 2026-06-29. The 6-line positioning above is the **heritage** message; keep it intact. This brief is what's changed and what's now true — code-verified. Branding owns the messaging; this is the raw material + the tensions to resolve (§9)._

## 1. TL;DR — what Lessgo is today

Lessgo is an **AI website builder that leads with conversion copy, not design**. You describe your business (or paste your existing URL); in ~2 minutes Lessgo runs a real **strategy pass** (positioning, market-sophistication, customer language) then writes copy, picks structure, and designs a live, publishable **multi-page site** — editable inline, publishable to **your own domain with automatic SSL**, with forms, privacy-first analytics, and lead capture built in.

The wedge is unchanged — **most pages don't fail on looks, they fail on messaging** — but the product around it is now a real, monetized, multi-template, multi-page SaaS with paying customers and a full publish→grow stack.

## 2. The evolution — then vs. now (the headline for branding)

| Axis | Heritage message (above) | Verified today |
|---|---|---|
| Output | One landing **page** | **Multi-page websites** — Home + sub-pages, shared header/footer, real nav, subpath routing (live, merged) |
| Templates | "**No fixed templates**", 150 UIBlocks | **6 curated template skins** across 2 audiences; copy still generated uniquely per business |
| Audience | Founders (generic) | **Product + Service** audiences (3-tier model); ecommerce reserved |
| Stage | $0 MRR, ~75 waitlist, alpha | **Paying customers, live in production, monetized** |
| Model | None | **Stripe billing, 4 tiers, credit system** |
| After "generate" | mostly stopped there | **Publish → custom domain (auto-SSL) → forms/leads → analytics** |
| Copy engine | (unspecified) | Production copy on **Claude Sonnet** (OpenAI fallback); strategy/IVOC layered in |
| Languages | English | **Bilingual EN/NL live** (Lumen template); platform-wide multilingual deferred |

## 3. Core positioning (still true — keep as anchor)

- **Copywriting-first, not design-first.** "Your biggest problem isn't a poor product — it's poor messaging."
- **Conversion intelligence, verified in code.** Copy strategy adapts across **5 market-sophistication levels** (Schwartz, in `taxonomy.ts`) and **buyer awareness levels** — this is real branching logic, not tonal flavor.
- **Customer's own voice.** IVOC research pulls real language from Reddit/G2/forums.
- **Speed-to-live:** business → live site in ~2 minutes, then refine.
- **Product voice:** "your judgment-free co-founder that writes with you, for you, in your voice."

## 4. New capabilities (code-verified) — feature-messaging raw material

**Generation & strategy**
- **Two-phase pipeline:** a strategy pass (persona, pains, desires, objections, big benefit, unique mechanism, reason-to-believe, per-section card counts) → a copy pass that fills every section. Strategy-led, not fill-in-the-blank.
- **Voice-of-Customer (IVOC) research** (Tavily): extracts real pains, desires, objections, firm/shakable beliefs, and verbatim customer phrases from Reddit/G2/Capterra/Trustpilot/forums. Cached, so repeats are free.
- **Market insights:** auto-suggests features + infers hidden positioning fields (awareness, tone, sophistication, problem type).
- **Engine:** production copy on **Claude Sonnet** with **GPT-4o** fallback; lighter steps on GPT-4o-mini. Provider-redundant by design.

**Onboarding & import**
- Two flows: **Service (7-step)** and **Product (5-step)**, persona-gated at signup (9 personas → product/service).
- **Website import:** paste your URL → one bounded crawl + one AI call pre-fills one-liner, name, categories/services, audiences, features, offer, goal — and **verbatim testimonials** (up to 3).

**Templates & design (3-tier model: audience → template → variant + palette)**
- **6 templates:** Service — **Hearth, Lex, Surge** (in the picker) + **Lumen** (bespoke, photography/creative, not listed); Product — **Meridian** (default) + **TechPremium** (hardware/IoT). Copy/structure still generated per business; templates are skins, not molds.
- Per-template **palettes** (accent families) + **variants** (spacing/feel rescales), applied via CSS attributes.

**Editing**
- **Visual inline editor**; regenerate any **section** (2 cr) or **element** (1 cr, returns multiple variations) on demand.

**From page to live site (all live/merged)**
- **Multi-page websites:** Home + sub-pages, shared chrome, route-based nav; collection archetypes (product-catalog, product-detail, gallery, contact).
- **Publishing:** one publish covers root + all sub-pages → static export to Vercel Blob CDN + KV routing, immutable versions, SSR fallback.
- **Custom domains:** TXT ownership → Vercel DNS → **automatic SSL**; apex + subdomain, 301 fallback, DNS-regression self-heal.

**Run-your-business layer**
- **Forms:** native builder → submissions inbox, **ConvertKit** integration, **lead-notification emails** (Resend).
- **Analytics:** privacy-first by contract — **no IP, no cookies, no raw user-agent**; tracks views, unique visitors, CTA clicks, form submits, device split, referrers/UTM. Opt-in per page.
- **Bilingual (EN/NL):** live today in Lumen via contained twin-fields + published language toggle.

**Status flags (don't over-claim)**
- **Testimonials** native collect → moderate → feature: **built on an unmerged branch (`feature/testimonials`), not live on current build.** Today's testimonial blocks are static/edit-only. → "coming," not "shipped."
- **Platform-wide multilingual:** committed direction, **deferred** (gate: 2nd customer beyond Lumen asks). Only Lumen's contained EN/NL ships now.
- **ecommerce** audience: reserved, not active.

## 5. Plans & pricing (verified — for pricing-page / tier messaging)

| Tier (user-facing) | Price | Credits/mo | Published pages | Custom domains | Notable |
|---|---|---|---|---|---|
| **Launch** (Free) | $0 | 30 | 20 | 1 | basic analytics, Lessgo branding |
| **Pro** | $39/mo ($29 annual, −25%) | 200 | 10 | 3 | remove branding, form integrations, full analytics, priority support |
| **Scale** (Agency) | $129/mo ($99 annual) | 1000 | unlimited | unlimited | white-label, HTML export, 5 seats |
| **Custom** (Enterprise) | $299/mo | unlimited | unlimited | unlimited | everything |

14-day trial (card required) on paid tiers; monthly hard reset, no rollover. **Credit costs:** full page 10 · section regen 2 · element regen 1 · field inference 1 · IVOC research 3 (0 if cached) · website import 1.

## 6. Target audience (expanded — pick primary vs. secondary with branding)

3-tier audience model, persona-gated at signup:

1. **Founders / solopreneurs (heritage core)** — have a product, can't write converting copy, want live fast without a designer or agency.
2. **Product companies** (SaaS, hardware/IoT) — e.g. customer **Naayom** (TechPremium, multi-page, EN/HI on the roadmap).
3. **Service businesses** (consultants, coaches, agencies, local/productized services, photographers/creatives) — e.g. **Kundius Photography** (Lumen, bilingual EN/NL).
4. **Agencies** (emerging, Scale tier) — produce on-brand client sites fast; white-label + HTML export.

Common thread: **non-designers/non-copywriters who need a converting site live, fast, without hiring out.**

## 7. Proof points / traction (credibility — confirm numbers before external use)

- **Paying customers**, live in production (vs. waitlist a year ago).
- Named/bespoke: **Naayom** (hardware/IoT product), **Kundius Photography** (bespoke bilingual template).
- **Full lifecycle shipped & merged:** generate → edit → multi-page publish → custom domain + SSL → forms/leads → privacy-first analytics.
- _Branding: pull current MRR / customer count / pages-published / conversion-lift before any external claim — not asserted here._

## 8. Competitive frame (sharpened)

Webflow / Wix / Framer / Squarespace / Lovable optimize for **pretty** or "build anything," and leave the **words** — the thing that converts — to you. Lessgo's lane: **the messaging is the product.** It brings the conversion strategy, the customer's own voice, and the structure; design is handled so you never face a blank page.

## 9. Open questions for branding (resolve before messaging)

- Category word: "**landing page**" vs "**website**" vs "**conversion site**" builder? (multi-page now real)
- Heritage line "**no fixed templates**" — retire / reframe ("templates that write themselves") / drop? (6 templates now)
- **Primary audience** to lead with: founders, product, service, or agencies? (can't be all four in one hero)
- Keep "**thinks like a copywriter**" as anchor, or graduate to "**conversion intelligence**" platform language?
- Surface IVOC / market-sophistication publicly (proof of depth) or keep as invisible magic?
- Lead with **speed** (~2 min), **conversion outcome**, or **all-in-one (build→publish→grow)**?
- How loud is **bilingual** in messaging now (only Lumen) vs. once platform i18n ships?
- Mention **Claude Sonnet** as the engine (credibility) or stay model-agnostic?
- Which features are safe to market **today** vs. "coming" (testimonials = coming; ecommerce/platform-i18n = not yet)?
- Approved traction numbers available for external claims?