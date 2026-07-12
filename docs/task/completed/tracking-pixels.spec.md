# tracking-pixels — spec

## Problem / why
Customer (scalifixai.com, marketing agency, Pro) asked how to add Meta Pixel to
their published site. Today the published `<head>` is a fixed template — no
mechanism to add any third-party tracking. Every ad-running customer will hit
this; it's table-stakes (Wix/Squarespace/Carrd all have it).

## Goal
Customer pastes their Meta Pixel ID and/or GA4 measurement ID into site
settings; on next publish the standard base snippets are injected into every
published page of the site. Industry-standard "layer 1" (named ID fields),
matching the Wix model.

## Scope OUT (non-goals)
- Custom code embed textarea (layer 2 — later, also Pro-gated)
- Conversion events (`fbq('track','Lead')` on form submit / WhatsApp click) —
  scalifix converts on Calendly (external), nothing to wire; revisit when a
  form-converting customer needs it
- Consent/cookie banner — customer is India; revisit before EU customers add pixels
- Meta Conversions API / domain verification
- Other vendors (TikTok, LinkedIn, GTM) — GA4 + Meta only
- Retroactive injection into already-published blobs — takes effect on republish only

## Constraints
- **UI surface:** SEO settings modal (`src/app/edit/[token]/components/ui/SeoSettingsModal.tsx`)
  gains a **site-level "Tracking" section** (modal title → "SEO & Tracking").
  NOT the publish modal — that stays name+slug+go. Storage: consider the
  favicon precedent (site-level value on root page's seo → maybe no schema
  change); planner decides.
- **Pro-gated** (pixel = upgrade trigger; scalifix already comped Pro)
- Validate ID format (Meta: numeric; GA4: `G-XXXXXXX`) — never inject arbitrary
  strings into `<head>`; escape/reject anything else (XSS surface)
- Snippets injected at publish time by the static-export pipeline; must land on
  **all pages** of multi-page sites
- Free/non-Pro publish path must produce byte-identical head when no IDs set
  (headTags.ts byte-identity guarantee)
- UI copy must state "changes apply after republish"

## References
- `src/lib/staticExport/headTags.ts` — pure head-fragment builders + byte-identity
  pattern + `escapeHTML`; new snippet builders belong here
- `src/lib/staticExport/htmlGenerator.ts` — head template where fragments slot in
- Wix Marketing Integrations — product pattern to imitate (paste-ID fields)
- Meta base pixel snippet + GA4 gtag.js snippet — official vendor snippets, verbatim
  with ID interpolated

## Open exploration questions
- Storage: can pixel IDs ride the root page's seo object (favicon-cascade
  pattern) or need their own field?
- How does multi-page publish fan out head generation — one metadata object per page?
- Where is the Pro plan check enforced for publish-time features (`planManager.ts`?)

## Candidate human gates
- Schema change if IDs need a new column vs existing settings JSON
- First republish of scalifixai.com with pixel live (customer-facing prod page)

## Acceptance criteria
- [ ] Pro user can enter Meta Pixel ID and/or GA4 ID in site settings; invalid formats rejected inline
- [ ] After republish, published HTML of every page contains the correct base snippet(s) with the ID
- [ ] Pixel fires PageView (verify via Meta Pixel Helper) and GA4 shows the visit
- [ ] Free user: fields locked with Pro upsell; publish output unchanged
- [ ] No IDs set → published head byte-identical to today
- [ ] scalifixai.com live with their pixel

## Pilot / smallest slice
This IS the pilot (single phase). Decision gate after scalifix uses it: demand
for conversion events / custom-code textarea decides layer 2.
