# F9b — beacon/asset versioning contract (audit)

Branch: `fix/lane-c`. Scope: versioning half of F9 (`reports/scale-1-10-findings.md` § "F9 · P2").
The env-driven `assetBase` half (F9a) already landed separately (`htmlGenerator.ts:244`).

## Files changed

Created:
- `scripts/legacy/a.v1.src.js` — frozen pre-scale-04 beacon source (vendored).
- `src/app/api/analytics/event/schema.ts` — extracted ingest schema (+ `v` field).
- `src/app/api/analytics/event/route.test.ts` — dual-format tolerance tests.

Modified:
- `scripts/buildAssets.js` — contract comment; emit `a.v1.js` (frozen) + `a.v2.js` (live).
- `src/lib/staticExport/analyticsGenerator.js` — payload now carries `v: 2`.
- `src/lib/staticExport/htmlGenerator.ts` — new publishes reference `a.v2.js`.
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` — SSR path references `a.v2.js`.
- `src/app/api/analytics/event/route.ts` — imports schema from `./schema` (was inline).
- `src/lib/staticExport/README.md` — doc refs updated to a.v2 + frozen a.v1.
- `public/assets/a.v1.js`, `public/assets/a.v2.js` — rebuilt artifacts (via `node scripts/buildAssets.js`).

## What changed, per file

**Contract established:** "a shipped asset filename never changes semantics." Published blobs
are immutable and hardcode an asset URL; overwriting that filename's bytes silently re-defines
beacon behavior for every historical blob with no handshake (the F9 drift).

- `scripts/legacy/a.v1.src.js`: exact pre-scale-04 source (git `5a769d02^`), with a FROZEN
  banner. No `role`/`placement`/`v` — matches what old blobs expect.
- `buildAssets.js`: per-file `dir` override; `a.v1.js` builds from the frozen legacy source,
  `a.v2.js` from the live `analyticsGenerator.js`. Top-of-file versioning-contract comment.
- `analyticsGenerator.js`: `v: 2` added to every event payload (all events, so the ingest side
  can distinguish formats forever).
- `htmlGenerator.ts` + `LandingPagePublishedRenderer.tsx`: both injectors now point NEW publishes
  at `a.v2.js`. (Form stays `form.v1.js` — see below.)
- `schema.ts` / `route.ts`: schema moved out of the route module (Next forbids non-handler
  exports from route files → build-time TS2344). Added `v: z.number().int().optional()`,
  accepted-and-ignored. `role`/`placement` were already optional with route-side defaults.

## Legacy path taken

**Vendor path (the preferred branch).** The pre-scale-04 `analyticsGenerator.js` was cleanly
recoverable from git (`5a769d02^` — the only semantic change was scale-04 adding role/placement).
I vendored it to `scripts/legacy/a.v1.src.js` and build `a.v1.js` from it, so blobs published
before scale-04 keep their ORIGINAL beacon semantics indefinitely. New blobs get `a.v2.js`.
Verified the built split: `a.v1.js` has 0× `placement`/`role`/`v:2`; `a.v2.js` has 1× each.

Ingest tolerance is still guaranteed regardless: `role`/`placement` optional + defaulted, `v`
accepted-and-ignored — so even a v1 payload buckets as `unknown.primary` (historical behavior),
never a garbage row.

## Form asset decision

`git log src/lib/staticExport/formHandler.js` → last change `e9a676b3` (2026-01-12), well before
scale-04 and before any current blob semantics shifted. Semantics unchanged since its blobs
shipped → **left at `form.v1.js`** (no bump needed).

## Test results

- `src/app/api/analytics/event/route.test.ts` — 5/5 pass (v1 + v2 cta_click/pageview, unknown
  future version tolerated).
- `acceptance.scale05.test.ts` + `leadForm.parity.test.tsx` — 31/31 pass (assert `data-page-id`,
  still present on the v2 tag).
- `npx tsc --noEmit` — clean for my files. Two pre-existing errors in `src/app/api/forms/submit/
  route.ts` (`notifiedAt`/`notifyError` not in Prisma type) belong to a parallel agent's in-flight
  schema work — outside my Files-touched.
- `node scripts/buildAssets.js` ran clean; emitted both `a.v1.js` and `a.v2.js`.

## Notes for orchestrator

- **Published-asset change → needs a build to take effect.** Per instruction I did NOT run the
  full `npm run build`; I ran only the asset sub-step (`node scripts/buildAssets.js`) so the
  `public/assets/a.v1.js` + `a.v2.js` artifacts are current. Run the full build before deploy.
- **Deploy ordering:** `a.v2.js` must be live on `lessgo.ai/assets/` BEFORE any page that
  references it is published/served, else new blobs 404 the beacon. The frozen `a.v1.js` keeps
  serving old blobs. No blob rewrite needed.

## Open risks

- Existing blobs that predate scale-04 will now (correctly) receive the FROZEN `a.v1.js` after
  deploy — reverting the accidental in-place upgrade F9 flagged. Their CTA events resume the
  old no-placement shape (bucketed `unknown.primary`), which is the truthful historical behavior,
  not the new format. This is intended by the contract.
- `public/assets/*.js` are committed build artifacts; the user commits. If the repo's convention
  is to rebuild-on-deploy rather than commit them, the committed `a.v2.js` is harmless.
