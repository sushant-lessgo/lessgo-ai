# Audit — QA quick fixes (publish / static-export)

Branch: fix/qa-quick-fixes

## Files changed
- src/app/api/projects/[tokenId]/published-slug/route.ts
- src/app/preview/[token]/page.tsx
- src/lib/staticExport/htmlGenerator.ts
- src/modules/generatedLanding/LandingPagePublishedRenderer.tsx

## F29 (P1) — Republishing silently turns analytics OFF
Root cause: the republish dialog (`SlugModal`) checkbox is a controlled prop
fed by `analyticsEnabled` state in `preview/[token]/page.tsx`, which initialized
to `false` and was never seeded from the stored `PublishedPage.analyticsEnabled`.
Republishing without touching the box wrote `false`.

Changes:
- `published-slug/route.ts`: added `analyticsEnabled` to the Prisma `select` and to
  the JSON response.
- `preview/[token]/page.tsx`: widened the `existingPublished` state type with
  optional `analyticsEnabled`; on fetch of an existing published page, seed
  `setAnalyticsEnabled(data.analyticsEnabled ?? false)` so the dialog reflects
  stored state.
- `SlugModal.tsx` needed no change (already renders `checked={analyticsEnabled}`).

## F9a (P2, scoped) — hardcoded asset origin
`htmlGenerator.ts:233` changed `const assetBase = 'https://lessgo.ai'` →
`process.env.NEXT_PUBLIC_APP_URL || 'https://lessgo.ai'`. Reused the exact env var
already used for origin derivation in `stripe/create-checkout-session` and
`create-portal-session`. Prod keeps `https://lessgo.ai` via the fallback (or by
NEXT_PUBLIC_APP_URL pointing there). Scope held: no asset-versioning scheme added.
Comment updated to explain the env-driven rationale while retaining the
absolute-URL / dev-relative-footgun warning.

## F10 (P3) — SSR fallback missing form.v1.js
`LandingPagePublishedRenderer.tsx`: added a `<Script src=".../form.v1.js">` gated on
`Boolean(content?.forms && Object.keys(content.forms).length > 0)`, mirroring
htmlGenerator's `hasForms` gate (htmlGenerator.ts:111,302). Placed alongside the
existing a.v1.js injection.

## Deviations
- F29 fallback: chose `?? false` (not `?? true`) to match the non-nullable
  `analyticsEnabled Boolean @default(false)` schema column and avoid ever enabling
  analytics the user didn't request. The column is always present, so the fallback
  is effectively dead-guard code.
- F10 asset origin: kept `https://lessgo.ai` hardcoded for form.v1.js in the
  renderer to stay consistent with the sibling a.v1.js Script already there. F9a's
  env-coupling fix was explicitly scoped to htmlGenerator.ts only.
- The fix required touching `published-slug/route.ts` and `preview/[token]/page.tsx`
  (beyond `SlugModal`) because the dialog checkbox is prop-driven and the stored
  value had to flow from DB → API → page state. All are in the publish area.

## Tests
- `npx tsc --noEmit`: clean for all four touched files. One pre-existing error
  remains in `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
  (`hasMultipleVariants` undefined) — a parallel agent's in-progress file, not
  touched here.
- `npx vitest run` on publishBlogPost.test.ts, buildBlogPages.test.ts,
  publishedClientBoundary.test.ts → 3 files / 18 tests passed. No dedicated
  htmlGenerator or PublishedRenderer unit test exists.

## Open risks
- Published-asset changes (the env-driven `assetBase` in htmlGenerator, and the new
  form.v1.js Script) require `npm run build` to be reflected in freshly published
  blobs / rebuilt assets. Not run here (parallel agents; full build out of scope).
- F9a: for local publishes to a real subdomain from `npm run dev`, ensure
  NEXT_PUBLIC_APP_URL is a reachable absolute origin — an unreachable/localhost
  value would freeze a broken URL into static HTML (per the retained code comment).
