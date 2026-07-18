---
tier: standard
tier-why: three targeted publish-path correctness fixes (honest failure status, consistent head escaping vs stored XSS, published-CSS glob) — one adversarial diff review; M4 escaping must be exhaustive. Touches live published pages, so verify against a real publish.
---

# publish-trust — spec

## Problem / why
Three correctness bugs in the publish/static-export path undermine trust in what gets served to live customer pages: a failed publish reports success, a published page's `<head>` is an XSS sink, and template published-block styling can be silently stripped. Source: `docs/reports/code-quality-report.md` findings M3, M4, M5.

- **M3** — `POST /api/publish` returns HTTP 200 "published" even when `generateStaticHTML()` threw: `publishState` is set to `failed`, then control flow falls through to the success response. The customer is told it worked; the page only serves via the SSR fallback, not the static blob.
- **M4** — `og:image` and canonical URL are interpolated **unescaped** into the exported `<head>` (the favicon *is* escaped — inconsistent). A crafted URL field yields **stored XSS** on the published `*.lessgo.site` page.
- **M5** — `scripts/buildPublishedCSS.js` content globs scan **removed** directories (`UIBlocks`, dead `components/published`) and **omit** `templates/**` + `sharedBlocks/**` published twins. Any Tailwind class added to a template published block is silently purged → the class works in the editor but the published page is mis-styled (a dual-renderer parity break). Likely already degrading live pages.

## Goal
Make publish honest and safe: a failed static export returns an error status and a `failed` state the client can surface (never a false 200); all interpolated `<head>` attributes are escaped consistently so no published-page field can inject markup; and the published-CSS build scans exactly the directories whose published blocks ship, so no template Tailwind class is silently stripped.

## Scope OUT (non-goals)
- No change to the publish state machine itself (`draft → publishing → published | failed`) beyond making the success/failure response match the actual outcome.
- No redesign of static export, the blob/KV routing, or ISR — purely the three correctness fixes.
- No new publish UI/error surfaces beyond returning a truthful status/body the existing client can already handle (confirm the client shows the failure — see open questions).
- Not touching the incomplete multipage-publish rollback (LOW bucket) — separate.

## Constraints
- **M3** must not swallow the export error: on `generateStaticHTML()` throw, the route returns a non-2xx (or an explicit failure body) and does not fall through to the success path; orphaned-blob cleanup behavior on DB/export failure must be preserved.
- **M4** escaping must cover **every** interpolated `<head>` attribute (og:image, canonical, and any others), matching the favicon's existing escaping — consistency is the fix. Use the same escape helper throughout; don't hand-roll per field.
- **M5** globs must include `src/modules/templates/**` and `sharedBlocks/**` published twins and drop the removed dirs; a change here requires a rebuild to verify (`npm run build` runs `buildPublishedCSS.js`). Confirm no *over*-purge regression (published.css size sane).
- Published-page changes require the full build (not just `next build`) to take effect — verify against a real published page, not just unit output.
- No CI gate — `tsc` + `test:run` green locally; plus a real publish smoke check (see acceptance).

## References
- `src/app/api/publish/route.ts:481-519` — M3 false-success fall-through
- `src/lib/staticExport/htmlGenerator.ts:359-374` — M4 unescaped head interpolation (favicon at same site is the escaped example to match); `:435` `adjustColorBrightness` no-op is a nearby LOW nit, not in scope
- `scripts/buildPublishedCSS.js:27-29` — M5 stale/incomplete content globs
- Dual-renderer parity context: `docs/architecture/phase11aArchitectureGaps.md`; published renderer path in `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`

## Open exploration questions
- Does the publish client (`/edit` or `/preview` publish action) already handle a non-2xx/`failed` response and show the user an error, or does it also need a UI touch to surface M3's now-truthful failure?
- Complete list of interpolated values in the exported `<head>` (M4) — which are already escaped vs. raw? (og:image, canonical confirmed raw; audit the rest.)
- After fixing M5 globs, does `published.css` gain the template classes and stay a reasonable size (no accidental whole-repo scan)?
- Is there an existing test that publishes a page with a template block and asserts styling parity, or is this manual-only today?

## Candidate human gates
- M4 escaping touches the exact bytes served on live customer domains — verify no double-escaping of already-safe values.
- M5 CSS-glob change alters `public/published.css` shipped with every published page — sign off after confirming a real published page renders correctly (no missing *and* no bloated CSS).

## Acceptance criteria
- [ ] A publish where `generateStaticHTML()` throws returns a non-success status + `failed` state; the client no longer shows "published"; orphaned blobs still cleaned up.
- [ ] A published page whose og:image/canonical/URL fields contain markup (`"><script>…`) renders those as inert escaped text — no injected element; all head attributes escaped consistently with the favicon.
- [ ] A Tailwind class used only in a template/shared published block survives the published-CSS build and applies on the live `*.lessgo.site` page (editor == published styling).
- [ ] `published.css` includes template/sharedBlocks classes and is not bloated by scanning removed/irrelevant dirs.
- [ ] `tsc` + `test:run` green; a real `npm run build` + publish smoke check passes.

## Pilot / smallest slice
Not multi-phase — three independent fixes shippable as one bundle. Verification is a single real publish smoke test covering all three: publish a template-block page (M5 styling), with a malicious URL field (M4 escaping), and force an export failure (M3 truthful status).
