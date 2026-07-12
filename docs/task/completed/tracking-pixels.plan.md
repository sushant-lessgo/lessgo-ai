# tracking-pixels — implementation plan

**Branch:** `feature/tracking-pixels` (worktree split from main; all phases commit here)
**Spec:** `docs/task/tracking-pixels.spec.md`

## Overview

Pro users paste a Meta Pixel ID (numeric) and/or GA4 measurement ID (`G-…`) into the SEO
settings modal (site-level, root page only, mirrors the `faviconUrl` precedent — no Prisma
migration). On republish, the official vendor base snippets are injected into the `<head>`
of every published page (root + subpages + locale docs) by the static-export pipeline.
IDs are strict-regex validated at every layer (client, publish sanitizer, snippet builder)
because they're baked into HTML; with no IDs set the published head stays byte-identical.

## Progress log

- phase 1 storage + snippet builders + head injection + fan-out: done (commit 913eefdf, review loops 1, verdict ship)
- phase 2 Pro gating (plan flag + API exposure + publish-time strip): done (commit 8a47d808, review loops 1, verdict ship)
- phase 3 SEO modal Tracking UI (inputs, validation, Pro lock/upsell): done (commit 1a50a7ba, review loops 1, verdict ship)
- phase 4 post-merge live verification (scalifixai.com): pending — HUMAN GATE

## Design decisions (read before implementing)

1. **Storage — no migration.** `metaPixelId` / `ga4MeasurementId` become optional fields on
   `PageSeo` (`src/types/store/pages.ts:40-47`), meaningful only on the root page's entry
   (exactly like `faviconUrl`, line 45). Root seo is lifted to `content.seo` in
   `Project.content` JSON; `saveDraft` passes content through untouched (verified — no seo
   handling there), so draft persistence is free.
2. **Publish sanitizer is a whitelist.** `PageSeoSchema` in `src/lib/validation.ts:73-84`
   uses `.strip()` — unknown keys are silently dropped at `publish/route.ts:61`. The new
   fields MUST be added to the schema or they never reach the exporter.
3. **Validation regexes (XSS surface — exact, shared, three layers):**
   - Meta: `/^\d{5,20}$/` (real pixel IDs are 15–16 digits; bounded)
   - GA4: `/^G-[A-Z0-9]{4,20}$/` (client uppercases input before validating)
   Export both as constants from `headTags.ts` (pure, dependency-free module — safe to
   import from client modal, `validation.ts`, anywhere; no 'use client' boundary issue).
   Applied: (a) client inline reject in the modal, (b) zod regex in `PageSeoSchema`,
   (c) re-check inside each snippet builder — builder returns `''` for any non-matching
   value. Never interpolate a string that hasn't just passed the regex. The charsets
   (`\d`, `[A-Z0-9-]`) contain no HTML metacharacters, so regex pass = injection-safe;
   no additional escaping of the vendor snippet (keep vendor markup verbatim).
4. **Pro check — do NOT use `hasFeature()`.** `hasFeature` (`planManager.ts:391-399`) reads
   the feature off the **DB `UserPlan` row** (`(userPlan as any)[feature]`), and its check
   (`=== true || !== 'none'`) returns TRUE for a missing column (`undefined !== 'none'`).
   A `trackingPixels` DB column would need a migration we're avoiding; without one,
   `hasFeature(userId,'trackingPixels')` fails open for EVERYONE. Instead: add
   `trackingPixels: boolean` to `PlanConfig.features` + all four `PLAN_CONFIGS` entries
   (FREE=false, PRO/AGENCY/ENTERPRISE=true) and a new **config-derived** helper
   `hasTrackingPixels(userId)` = `PLAN_CONFIGS[plan.tier]?.features.trackingPixels === true`
   (via `getUserPlan(userId).tier`; any error/unknown tier → false, fail-closed).
5. **Server enforcement point.** In `publish/route.ts`, right after the sanitizeSeo block
   (~lines 56-66; `userId` in scope from line 31): if `!(await hasTrackingPixels(userId))`,
   delete `metaPixelId`/`ga4MeasurementId` from `c.seo` (and from each `sub.seo` for
   hygiene). Strip, never reject — mirrors the "invalid seo dropped, never fail publish"
   rule. Because the strip happens BEFORE the DB write, every downstream republish path
   (custom-domain go-live republish etc.) is automatically clean.
6. **Fan-out.** `renderPublishedExport.ts` is the single place holding every page. Resolve
   the two IDs ONCE from root `contentData.seo` (subpage/locale content objects do NOT
   carry site-level keys) and thread the SAME values into all three `generateStaticHTML`
   call sites — root (~line 172), subpage loop (~line 267), locale docs (~line 421) —
   mirroring the favicon `rootSeo` cascade. Blog posts (`publishBlogPost.ts:138` also calls
   `generateStaticHTML`) are OUT of scope for the pilot (scalifix has no blog); absent
   options → `''` → blog output unchanged.
7. **Injection point.** End of `<head>` in `buildHTMLDocument` (`htmlGenerator.ts:363`),
   appended after `${jsonLdScriptTag(metadata.jsonLd)}`:
   `…${jsonLdScriptTag(metadata.jsonLd)}${metaPixelSnippet(metadata.metaPixelId)}${ga4Snippet(metadata.ga4MeasurementId)}`.
   Both builders return `''` when input absent/invalid → byte-identity holds structurally.
   (Vendors say "as high in head as possible" but end-of-head is functionally identical
   for base PageView tracking and keeps the byte-identity diff to one template expression.)

## Official vendor snippets (use VERBATIM, only `{ID}` interpolated)

**Meta base pixel** (`metaPixelSnippet(id)`; `{PIXEL_ID}` appears twice — script + noscript):

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{PIXEL_ID}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id={PIXEL_ID}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```

**GA4 gtag.js** (`ga4Snippet(id)`; `{MEASUREMENT_ID}` appears twice — src param + config):

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{MEASUREMENT_ID}');
</script>
<!-- End Google tag -->
```

Per the headTags module convention, non-empty fragments start with `'\n  '` so they slot
into the template without disturbing surrounding lines.

---

## Phase 1 — storage + snippet builders + head injection + fan-out

Core pipeline end-to-end minus gating/UI: type fields, sanitizer whitelist, pure builders,
head-template injection, threading through all three export call sites.

**Files touched**
- `src/types/store/pages.ts` — add `metaPixelId?: string` + `ga4MeasurementId?: string` to
  `PageSeo` with "site-wide; only meaningful on root entry" comments (mirror `faviconUrl`).
- `src/lib/staticExport/headTags.ts` — export `META_PIXEL_ID_RE` / `GA4_MEASUREMENT_ID_RE`
  constants; add `metaPixelSnippet(pixelId?: string)` and `ga4Snippet(measurementId?: string)`
  builders (return `''` on absent/regex-fail; verbatim vendor markup above).
- `src/lib/validation.ts` — add to `PageSeoSchema`:
  `metaPixelId: z.string().regex(META_PIXEL_ID_RE).optional()`,
  `ga4MeasurementId: z.string().regex(GA4_MEASUREMENT_ID_RE).optional()` (import the
  shared constants; invalid value → whole blob rejected by existing safeParse → dropped,
  consistent with current behavior).
- `src/lib/staticExport/htmlGenerator.ts` — add `metaPixelId?` / `ga4MeasurementId?` to
  `StaticHTMLOptions` (site-level, threaded by caller like `faviconUrl`); pass through the
  nested `metadata` object (~lines 145-158) + its param type in `buildHTMLDocument`
  (~lines 235-248); interpolate both builders after `jsonLdScriptTag` (~line 363).
- `src/lib/staticExport/renderPublishedExport.ts` — resolve
  `const metaPixelId = contentData.seo?.metaPixelId; const ga4MeasurementId = contentData.seo?.ga4MeasurementId;`
  once near the `goal` resolution (~line 133); pass both into ALL THREE
  `generateStaticHTML` call sites (root ~172, subpage ~267, locale ~421). Do NOT read from
  `sub.seo` / `p.seo`.
- `src/lib/staticExport/headTags.test.ts` — new cases (see verification).
- `src/lib/validation.test.ts` — new cases (see verification).

**Steps**
1. Types + regex constants + builders (pure, no deps).
2. `PageSeoSchema` whitelist.
3. `StaticHTMLOptions` + metadata threading + head-template interpolation.
4. `renderPublishedExport` resolve-once + three call sites.
5. Tests.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- `headTags.test.ts`: builders return `''` for `undefined`/`''` (**byte-identity**: no IDs ⇒
  head fragment contribution is the empty string, so published head is byte-identical to
  today); return `''` for hostile/invalid input (`'123"><script>'`, `'G-<img>'`,
  `'javascript:x'`, lowercase `g-abc`, 4-digit meta id); valid input ⇒ output contains the
  ID at both interpolation points and matches the vendor markup (assert key substrings:
  `connect.facebook.net/en_US/fbevents.js`, `fbq('init', '<id>')`, `facebook.com/tr?id=`,
  `googletagmanager.com/gtag/js?id=`, `gtag('config', '<id>')`).
- `validation.test.ts`: valid IDs survive `sanitizeSeo`; invalid IDs ⇒ blob dropped;
  existing seo blob WITHOUT tracking fields round-trips unchanged (regression).
- Manual (dev): set IDs on root page seo via modal-less patch or draft JSON, publish,
  curl `/p/<slug>` + a subpage → both heads contain both snippets; remove IDs, republish →
  snippets gone.

---

## Phase 2 — Pro gating: plan flag, API exposure, publish-time strip

Server-side, bypass-proof enforcement. Lands before UI so the client can consume the same
flag the server enforces.

**Files touched**
- `src/lib/planManager.ts` — `trackingPixels: boolean` added to the `PlanConfig['features']`
  interface (~line 39) + all four `PLAN_CONFIGS` entries (FREE=false; PRO/AGENCY/ENTERPRISE
  =true). New exported helper `hasTrackingPixels(userId: string): Promise<boolean>` —
  config-derived from `getUserPlan(userId).tier` via `PLAN_CONFIGS`, fail-closed on
  error/unknown tier. Do NOT touch `hasFeature` / DB columns (see design decision 4).
- `src/app/api/billing/plan/route.ts` — add `trackingPixels` to the returned `features`
  object, computed via `PLAN_CONFIGS[plan.tier]?.features.trackingPixels ?? false` (the DB
  row has no such column — derive from config, same source as the server gate).
- `src/app/api/publish/route.ts` — after the sanitizeSeo block (~line 66): if
  `!(await hasTrackingPixels(userId))`, delete `metaPixelId`/`ga4MeasurementId` from
  `c.seo` and every `sub.seo`. Never reject the publish. Comment: "Pro gate — strip, don't
  fail; runs before DB write so all republish paths inherit the clean content."
- `src/lib/planManager.test.ts` (create if absent) OR extend an existing suitable test file —
  unit-test `hasTrackingPixels` tier mapping with a mocked `getUserPlan`.

**Steps**
1. Feature flag in config + interface (note: `createDefaultPlan`/`upgradePlan`/
   `downgradePlan` write features to DB columns — `trackingPixels` deliberately NOT
   persisted there; config-derived only. Add a comment at the flag explaining why).
2. `hasTrackingPixels` helper.
3. Expose in `GET /api/billing/plan`.
4. Publish-route strip.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green (all four `PLAN_CONFIGS` entries must
  compile against the widened interface — TS enforces completeness).
- Unit: FREE→false, PRO/AGENCY/ENTERPRISE→true, error→false.
- Manual (dev, `DEV_BYPASS_LIMITS` off): publish as FREE user with IDs present in draft
  content → published head has NO snippets AND stored `content.seo` has no pixel fields;
  as PRO user → snippets present. Confirms UI-bypass (direct API POST) is covered.

---

## Phase 3 — SEO modal: Tracking section, validation, Pro lock/upsell

**Files touched**
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx` — only file.

**Steps**
1. Modal title "SEO & Social" → "SEO & Tracking" (keep social copy in subtitle).
2. New "Tracking" section, rendered under the existing `isRoot`-gated blocks (root page
   only, like favicon at lines 168-186). Two text inputs: "Meta Pixel ID" (placeholder
   e.g. `1234567890123456`) + "GA4 measurement ID" (placeholder `G-XXXXXXXXXX`).
3. Inline validation on change/blur using the SAME `META_PIXEL_ID_RE`/`GA4_MEASUREMENT_ID_RE`
   imported from `@/lib/staticExport/headTags` (plain module — safe client import; do NOT
   redefine the regexes). GA4 input uppercased before validating. Invalid non-empty value →
   inline red error, and do NOT write it to the store (write only valid values or
   `undefined` when cleared — otherwise sanitizeSeo drops the WHOLE seo blob at publish,
   nuking title/description too). Persist via `patch({ metaPixelId: … })` (existing
   `store.updatePageSeo` path + auto-save on close).
4. Helper copy under the section: "Applies to every page of your site. Changes take effect
   after you republish." (spec-required wording about republish).
5. Plan awareness: local `useEffect` + `fetch('/api/billing/plan')` (pattern:
   `CreditBadge.tsx:24-46`); read `features.trackingPixels`. While loading or when false:
   inputs `disabled`, lock note + `<Link href="/pricing">Upgrade to Pro</Link>` upsell
   (pattern: `CreditBadge.tsx:121-134`). Client lock is UX only — Phase 2 strip is the
   real gate.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green (no existing modal test expected).
- Manual (dev, `npm run dev`):
  - Pro user: enter valid IDs → persists across reload (draft round-trip); invalid formats
    (`abc`, `G-lower`, `12<script>`) rejected inline, never stored; clearing a field
    removes it; publish → snippets on every page (re-run Phase 1 manual check through
    the real UI).
  - Free user: inputs locked + `/pricing` upsell visible; publish output unchanged
    (byte-identical head).
  - Non-root page selected: no Tracking section shown.
  - Existing SEO fields (title/desc/og/favicon/noindex) unaffected.

---

## Phase 4 — HUMAN GATE (post-merge, manual): scalifixai.com live verification

Out of automated pipeline scope — needs merge→main, Vercel deploy, real Meta/GA accounts.

**Files touched:** none (verification only).

**Steps / checklist (user)**
1. Merge `feature/tracking-pixels` → main (human gate per branch rules), push, deploy green.
2. Enter scalifix's real Meta Pixel ID (+ GA4 ID if they have one) in their project's
   SEO & Tracking modal; republish scalifixai.com.
3. Verify with Meta Pixel Helper extension: PageView fires on the live custom domain,
   correct pixel ID, on root AND a subpage.
4. GA4 (if set): Realtime report shows the visit.
5. Confirm a Free test account still publishes byte-identical head (spot-check view-source).

**Verification:** spec acceptance boxes "Pixel fires PageView" + "scalifixai.com live with
their pixel" checked by the user.

---

## Landmine notes (repo-specific)

- No dual-renderer work: injection is head-template only (`buildHTMLDocument`), zero block
  `.tsx`/`.published.tsx` changes. No parity risk.
- No 'use client' imports into export path: `headTags.ts` stays pure/dependency-free; the
  client modal imports FROM it (allowed direction), never the reverse.
- No Prisma changes at all — schema-change human gate retired.
- Published-page styling/assets unaffected → no `build:published-css`/`build:assets`
  implications; but final pre-merge check should still be full `npm run build` (not just
  `next build`) per repo convention.

## Unresolved questions

- Blog-post pages (`publishBlogPost.ts`) also `generateStaticHTML` — inject pixels there
  too, or pilot-scope out? (Plan assumes OUT; scalifix has no blog.)
- Meta ID length bound `^\d{5,20}$` ok, or exact 15-16 digits stricter?
- Locked Free inputs: show stored values grayed-out, or hide entirely? (Plan assumes
  disabled inputs w/ upsell.)
- GA4 route: also expose `trackingPixels` anywhere else (pricing page feature matrix)? Plan
  touches only `/api/billing/plan`.
