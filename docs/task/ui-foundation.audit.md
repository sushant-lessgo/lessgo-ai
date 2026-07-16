# ui-foundation — Phase 1 audit (isolation baseline guards)

Branch: `feature/ui-foundation` (verified before any edit). Tests-only phase — NO
styling/token/font changes. Baselines RECORDED this phase (snapshot, sha256,
computed-style JSON, frozen config values); "green" = assertions pass against the
freshly-captured baselines.

## Files changed

- `src/modules/generatedLanding/uiFoundationIsolation.test.tsx` (new) — vitest: published-HTML snapshot + negative-trace + published.css sha256 guard.
- `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` (new, generated) — 2 HTML snapshots (meridian product, hearth service).
- `src/modules/generatedLanding/__fixtures__/published-css.sha256` (new) — committed baseline hash.
- `src/modules/generatedLanding/tailwindConfigFreeze.test.ts` (new) — root tailwind.config.js freeze guard.
- `e2e/ui-isolation.spec.ts` (new) — Playwright editor/main-app surface guard.
- `e2e/fixtures/ui-isolation-computed-styles.json` (new, captured by the spec's first run) — computed-style baselines.
- `playwright.config.ts` (1-line edit — added to Phase-1 Files-touched by the orchestrator post-hoc) — registers the isolation spec in the `public` project's `testMatch`.
- `docs/task/ui-foundation.audit.md` (this file).

No forbidden-list file was touched. The new test/fixture files under
`src/modules/generatedLanding/` are the plan's sole carve-out (test files;
buildPublishedCSS.js globs specific published files, never these).

## What each file does

### uiFoundationIsolation.test.tsx (published surface)
Builds a full page content map from the EXISTING frozen block-mock fixtures
(`src/modules/templates/blockMocks/{meridian,hearth}.ts` — the same fixtures the
/dev galleries + `renderParity.meridian.test.tsx` use; no new fixture created) and
renders it through the published renderer path `generateStaticHTML()` (server-only
neutralized with the same `vi.mock('server-only')` shim as the sibling
`htmlGenerator.test.ts`). Assertions:
- `toMatchSnapshot()` on the full HTML for meridian (product) and hearth (service).
- Negative-trace (holds forever): no `app-` class token, and none of `Onest`,
  `Caveat`, `Material Symbols`, `fonts-app-chrome` as substrings.
- published.css sha256 == committed baseline; MISSING artifact throws loudly
  ("run `npm run build:published-css` first") rather than skipping.

### published-css.sha256
`c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6`
Determinism: `npm run build:published-css` run twice → byte-identical output
(`diff -q` clean, identical sha256 both runs). The Tailwind CLI output carries no
timestamp/banner; NO normalization was needed.

### tailwindConfigFreeze.test.ts (root-config existing-key-mutation guard)
`require`s root `tailwind.config.js` → `tailwindcss/resolveConfig` → asserts frozen
resolved values. This is the coverage-independent guard for the vector the
published-css hash CANNOT see (published.css is compiled from the standalone
embedded config, invariant to root config). Frozen baselines (resolved 2026-07-16):
- `borderRadius`: `{none:0px, sm:calc(var(--radius) - 4px), DEFAULT:0.25rem, md:calc(var(--radius) - 2px), lg:var(--radius), xl:0.75rem, 2xl:1rem, 3xl:1.5rem, full:9999px}`
- `fontFamily.heading` = `["Inter","sans-serif"]`; `fontFamily.body` = `["Inter","sans-serif"]`
- `fontSize`: full resolved scale (tailwind defaults xs..9xl PLUS custom display/hero/h1/h2/h3/body-lg/body/body-sm/caption clamp() values) — asserted via deep-equal.

### e2e/ui-isolation.spec.ts (editor / main-app surface guard)
Mirrors render.spec mock-mode conventions; loads `/dev/meridian/blocks`
(ssr:false dynamic mount → waits for `[data-surface],[data-palette],[data-variant]`).
Viewport pinned `1280x800` (test.use) so px baselines are stable. Self-capturing:
writes `e2e/fixtures/ui-isolation-computed-styles.json` on first run when absent,
asserts `toEqual` on subsequent runs.
- Computed-style probes (stable classname selectors): `.mrd-price-card`
  border-radius; `.mrd-btn--primary` border-radius + font-size;
  `.mrd-hero__headline` font-family + font-size; `.mrd-hero__lede` font-family +
  font-size.
- Negative checks on the same surface: hero headline font-family does NOT contain
  `onest`; `[class*="app-"]` count == 0; no network request for
  `fonts-app-chrome`/`material-symbols`/`onest` woff2.

### ui-isolation-computed-styles.json (captured baseline)
```
card.borderRadius   = 10px
button.borderRadius = 8px      button.fontSize = 13.5px
heading.fontFamily  = "Inter Tight", ui-sans-serif, system-ui, sans-serif   heading.fontSize = 108px
body.fontFamily     = "Inter Tight", ui-sans-serif, system-ui, sans-serif   body.fontSize    = 21px
```
(Headline font = Inter Tight, the meridian template font — NOT Onest, so the
negative check is non-vacuous.)

## Verification results

- `npx tsc --noEmit`: clean re: all Phase-1 files. One PRE-EXISTING unrelated error
  remains (`src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`)
  — not introduced by this phase, not in scope.
- `npm run build:published-css`: deterministic double-run (identical sha256), fresh
  artifact used for the hash test.
- `npm run test:run`: `184 passed | 1 skipped` files, `3012 passed | 18 skipped`
  tests. The 2 new vitest files: 8 tests pass, 2 snapshots written (first run).
- e2e isolation spec: EXECUTED (not skipped) as part of the normal suite. After the
  `playwright.config.ts` one-line `testMatch` addition, `npx playwright test --list`
  shows both isolation tests under the `public` project (Total 20 tests / 7 files, up
  from 18/6). `npm run test:e2e -- --project=public` → `11 passed, 4 skipped` — the 2
  isolation tests are #14 and #15, both green (3.2s each, warm server; the 4 skips are
  the real-LLM generation cases that self-skip without `E2E_AUTH`). The self-capture
  path (first run wrote the JSON) + the assert path (subsequent runs compare) were both
  verified earlier via a throwaway temp config; that temp config was deleted and never
  committed.

## Deviations from the plan (with reason)

1. **step-3b "generated landing page" runs on `/dev/meridian/blocks`, not a live
   `/p` or `/edit` page.** That route IS meridian blocks rendered through the
   main-app CSS bundle and is the only template surface render.spec proves
   reachable in mock mode without a Clerk session + seeded draft. Conservative,
   in-scope choice; documented in the spec header too.
2. **card probe uses `.mrd-price-card`, not `.mrd-te__card`.** `mrd-te__card`
   exists only in the PUBLISHED testimonials block; the edit gallery render has no
   such element (verified — locator resolved to 0). `.mrd-price-card` is a real
   card with `border-radius: var(--r-lg)` present in the edit render. Same guard
   intent (a card's radius).
3. **waitForSelector/toHaveCount timeouts raised 15s→45s** in the spec (vs
   render.spec's 15s). This route compiles cold in an isolated run; render.spec
   passes at 15s only because earlier suite tests warm the dev server first. 45s
   is a safe headroom; no behavioral change.
4. **computed-style baseline is self-captured by the spec (write-if-absent), not
   hand-authored.** The plan's Files-touched explicitly allows the JSON to be
   captured this phase. Committed after the capturing run.

## Resolved (was: testMatch blocker)

- **RESOLVED — `playwright.config.ts` testMatch gap.** The orchestrator added
  `playwright.config.ts` to Phase-1 Files-touched and authorized the one-line fix. The
  `public` project's `testMatch` now reads
  `[/generation\.spec\.ts/, /render\.spec\.ts/, /parity\.spec\.ts/, /ui-isolation\.spec\.ts/]`
  (only that array changed; `setup`/`authed` and all other config untouched). The
  `public` project is mock-mode / no-auth — the exact surface the spec verifies against.
  `ui-isolation.spec.ts` now runs under `npm run test:e2e` (verified green above). The
  throwaway temp config used pre-fix is gone / never committed.

## Open risks / follow-ups

- The e2e guard requires a running `next dev` + Chromium; in CI it must be wired the
  same way render.spec is (webServer auto-start). No new deps added.
