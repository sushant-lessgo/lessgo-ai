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

---

# ui-foundation — Phase 2 audit (fonts: fetch + subset + app-only stylesheet + preloads)

Branch: `feature/ui-foundation` (verified `git branch --show-current` before any edit).
Goal: all 4 app-chrome families self-hosted, declared in a NEW app-only stylesheet
imported ONLY by the root app layout — zero bytes added to published pages.

## Files changed

- `public/fonts/onest/onest-latin-{400,500,600,700,800}-normal.woff2` (new binaries).
- `public/fonts/onest/OFL.txt` (new — SIL OFL 1.1).
- `public/fonts/jetbrains-mono/jetbrains-mono-latin-600-normal.woff2` (new; 400/500 already present).
- `public/fonts/material-symbols-rounded/material-symbols-rounded.woff2` (new, SUBSET only).
- `public/fonts/material-symbols-rounded/LICENSE` (new — Apache 2.0).
- `public/fonts/material-symbols-rounded/NOTICE` (new — source + subset change-notice + regeneration + icon-list pointer).
- `public/fonts/material-symbols-rounded/icons.txt` (new — 175-name subset glyph list = regeneration input).
- `public/fonts/caveat/caveat-latin-{400,700}-normal.woff2` (new binaries).
- `public/fonts/caveat/OFL.txt` (new — SIL OFL 1.1).
- `src/styles/fonts-app-chrome.css` (new — app-only @font-face layer).
- `src/app/layout.tsx` (added fonts-app-chrome.css import + 3 preload links in the existing `<head>` slot).
- `e2e/ui-isolation.spec.ts` (added to Phase-2 Files-touched by the orchestrator post-hoc — removed the mis-scoped "no app-font woff2 network request on /dev" assertion the Phase-2 preloads necessitated; see resolved note below).
- `docs/task/ui-foundation.audit.md` (this Phase 2 section appended).

No forbidden-list file was touched (fonts-self-hosted.css, p/layout.tsx, htmlGenerator.ts,
buildPublishedCSS.js, buildAssets.js, CriticalFontPreload.tsx, handoffLint.ts, designKit.ts,
templates/published/renderers, tailwind.config.js — all untouched).

## Fonts fetched (all verified real wOF2 binaries, not HTML error pages)

Source: fontsource jsDelivr CDN (cdn.jsdelivr.net/fontsource/fonts/<family>@latest/latin-<w>-normal.woff2).
- Onest 400=14008 B, 500=14660 B, 600=14688 B, 700=14716 B, 800=14588 B.
- JetBrains Mono 600 = 21860 B.
- Caveat 400=48836 B, 700=51020 B.
- Material Symbols Rounded FULL (temp -full.woff2) = 5346776 B, fetched from
  github.com/google/material-design-icons/raw/master/variablefont/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].woff2.
Magic bytes checked (head -c4 | xxd -> wOF2) on representative files of each family + the full MS font.
Licenses: Onest OFL.txt (4384 B), Caveat OFL.txt (4385 B) from github.com/google/fonts/raw/main/ofl/<family>/OFL.txt;
Material Symbols LICENSE (Apache 2.0, 11357 B) from the material-design-icons repo root.

## Icon list derivation

Grepped the FOUR .dc.html files at
`C:\Users\susha\lessgo-ai\docs\Design\Lessgo AI UI redesign\design_handoff_lessgo_app\`
for `<span class="ms">...</span>` nodes (the handoff's Material-Symbols class is `.ms`;
icon = element text = ligature name). Extracted 175 distinct ligature names. Unioned with
the spec seed set (arrow_forward, mail, lock, auto_awesome, push_pin, perm_media, tune) —
all 7 seeds were already present in the HTML (0 seed-only additions). Final: 175 names,
one per line -> icons.txt.

## Subset result

Tooling: Python 3.12.10 (installed via `winget install Python.Python.3.12` — no real Python
pre-existed; the WindowsApps python/python3 were Store stubs) + fonttools 4.63.0 + brotli.

First attempt with the plan's literal command (--layout-features='liga,rlig,calt'
--text-file=icons.txt, layout closure ON) produced 3.99 MB — because every Material-Symbols
icon ligature is spelled from the same Latin alphabet, so retaining the alphabet + default
layout-closure pulls in ALL ~6590 icons (ligature closure). Font inspection confirmed FILL
is a genuine gvar variation axis on the base glyphs (no .fill-glyph swap / no rvrn), glyphs
are named by icon, ligature mapping is rlig.

Final working subset command (deviation — see below):
  python -m fontTools.subset <full.woff2> --output-file=material-symbols-rounded.woff2
    --flavor=woff2 --no-layout-closure --layout-features='rlig,rclt,liga,calt'
    --glyphs-file=<172 icon names that are real glyph names>
    --text='abcdefghijklmnopqrstuvwxyz0123456789_'
- Result: 164100 B (164 KB), 210 glyphs (172 icon glyphs + Latin alphabet/digits/underscore/.notdef
  needed as ligature-input components).
- All 4 fvar axes SURVIVE (ttx -t fvar -> FILL, GRAD, opsz, wght); NOT instanced/pinned.
  99 of the retained icon glyphs carry FILL-varied gvar tuples (the rest are outline-only
  icons with no distinct filled form — expected), so font-variation-settings:'FILL' 1 still
  animates the icons that have a fill state.
- 247 rlig ligature rules retained (name->glyph), alphabet retained for input -> typing e.g.
  "mail" still renders the glyph.
- Temp material-symbols-rounded-full.woff2 DELETED after subsetting; confirmed absent from
  the committed dir (ls *full* -> no such file). Full font never committed.

## fonts-app-chrome.css faces declared

Mirrors the fonts-self-hosted.css @font-face pattern. Faces:
- Onest 400/500/600/700/800, font-display:swap.
- JetBrains Mono App 400/500/600 under a DISTINCT font-family 'JetBrains Mono App' name
  (coordinator directive — see RESOLVED note below). 400/500 src = the existing
  jetbrains-mono-latin-{400,500}-normal.woff2; 600 src = the new -600 file. font-display:swap.
  Does NOT declare any face under bare 'JetBrains Mono', so templates' --font-mono family
  stays 400/500-only on both surfaces.
- Caveat 400/700, font-display:swap.
- Material Symbols Rounded variable face: format('woff2-variations'), font-weight:100 700,
  font-style:normal, font-display:block (avoids icon-name FOUT).

## layout.tsx changes

- Added `import '@/styles/fonts-app-chrome.css';` immediately after the existing
  fonts-self-hosted.css import (with an isolation comment).
- Replaced the empty `<head />` self-closing slot with a `<head>...</head>` containing 3
  `<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous">` for
  onest-latin-400, onest-latin-600, and the Material Symbols subset. No other restructuring;
  CriticalFontPreload.tsx and p/layout.tsx untouched.

## Verification results

- npx tsc --noEmit -> exit 0 (no new errors; the Phase-1-noted founder.jpg error did not
  reproduce this run).
- npm run build:published-css (fresh) -> public/published.css sha256
  c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6 == Phase-1 committed
  baseline. UNCHANGED (yes).
- npm run test:run -> 184 passed | 1 skipped files, 3012 passed | 18 skipped tests. Phase-1
  HTML snapshot byte-identical; published.css sha256 guard green; negative-trace (no
  Onest/Caveat/Material Symbols/fonts-app-chrome/app-) green; config-freeze green.
- npm run build -> green (regenerated published.css); post-build sha256 still == baseline;
  grep -icE "onest|caveat|material symbols" public/published.css -> 0 (no app-chrome font
  leak into published output). grep for ".app-|Onest" in published.css -> empty.
- buildAssets.js (read-only) still copies ONLY fonts-self-hosted.css (explicit file list
  line ~65, no glob) -> fonts-app-chrome.css is NOT shipped to published assets.
- Only importer of fonts-app-chrome.css is src/app/layout.tsx (grep) — NOT p/layout.tsx,
  NOT any renderer -> structural isolation confirmed.
- JBM-600 divergence check — FINDING: NOT none (many templates render mono@600); RESOLVED
  by the coordinator-directed distinct-family rename (see "RESOLVED — JBM-600 divergence" below).

## Deviations from the plan (with reason)

1. Material Symbols subset command changed from the plan's literal command. The plan's
   command (layout-closure ON, --text-file) yielded 3.99 MB (ligature closure over the
   shared alphabet retains all ~6590 icons). Switched to --no-layout-closure + explicit
   --glyphs-file of the icon glyph names + --text of the ligature-input alphabet, keeping
   rlig/rclt. Same intent (subset to the handoff icon set, keep all 4 axes), correct 164 KB
   result, ligatures + FILL still work. Documented in NOTICE for regeneration. Conservative
   in-scope choice — the plan's own goal could not be met by its literal command.
2. Subset size 164 KB, over the plan's "~100 KB" sanity bound. The estimate assumed the
   7-icon seed set; the actual handoff grep yielded 175 icons, each carrying 4-axis gvar
   variation data — that icon COUNT (not a subsetting error) drives 164 KB. All 4 axes are
   mandatory (plan forbids pinning), so this is the minimum for the real icon set. 164 KB
   vs the 5.3 MB full font is a 97% reduction.
3. 3 of 175 icon names (collections, restore, smartphone) are ligature ALIASES, not glyph
   names — passed via --text alphabet only, not --glyphs. Their rlig rules resolve to
   canonical glyphs that are themselves in the retained set (e.g. photo_library/history are
   in the icon list), so they still render. Kept in icons.txt as the authoritative name list.
4. Installed Python 3.12 via winget (no real Python was present). The task authorized
   pip install fonttools brotli; a Python runtime was a prerequisite. Not a repo file change.

## RESOLVED — JBM-600 divergence (coordinator directive, still in Phase 2)

The plan's Phase-2 premise "no template renders JetBrains Mono @600" was FALSE:
techpremium (.tp-metric__v, .tp-pill, .tp-pcard__plan, .tp-pmodel, .tp-sn, .tp-news__btn,
Problem/Process/ProductDetail labels), meridian (.mrd-cta__eyebrow), and lumen
(.lm-wa-edit strong, contact label) all render font-family:var(--font-mono) @600, and all
three set --font-mono:'JetBrains Mono' in their tokens.ts. A same-name real JBM 600 face
in the root layout would give the EDITOR a real 600 while PUBLISHED (published.css ships
only JBM 400/500) stays faux-bold -> a NEW editor<->published divergence.

FIX (per coordinator): app-chrome mono now uses a DISTINCT family name 'JetBrains Mono App'
declaring the full 400/500/600 set (400/500 reuse the existing self-hosted files, 600 the
new file). fonts-app-chrome.css declares NO face under bare 'JetBrains Mono'. Templates'
'JetBrains Mono' family therefore stays 400/500-only on BOTH surfaces -> faux-bold 600 on
both, exactly as before this feature -> NO divergence, published output byte-identical. App
chrome will reference this via Phase-3's font-app-mono token (never the raw family name);
the rename is invisible to consumers.

Re-verification after the rename:
- Face-decl grep: the only `font-family:` face declarations for mono are 'JetBrains Mono App'
  (x3, weights 400/500/600); ZERO bare 'JetBrains Mono' face declarations (grep -c = 0). The
  only bare-name occurrences are explanatory comments.
- All 3 referenced files exist: jetbrains-mono-latin-{400,500,600}-normal.woff2 (21168/21832/21860 B).
- npx tsc --noEmit -> exit 0.
- npm run build:published-css (fresh) -> published.css sha256 == Phase-1 baseline
  (c2f87e08...). npm run test:run -> 3012 passed | 18 skipped (snapshot + sha256 + config-freeze
  + negative-trace all green). npm run build -> green; post-build sha256 == baseline;
  grep -icE "onest|caveat|material symbols" public/published.css -> 0.

## RESOLVED — Phase-1 e2e guard vs Phase-2 preloads collision (e2e spec edited under Phase 2)

The first e2e run (`npm run test:e2e -- --project=public`) had 1 failure: test
`ui-isolation.spec.ts:86` at its third assertion (~line 115) asserted `/dev/meridian/blocks`
makes NO onest/material-symbols woff2 request. That became false because Phase 2's 3
`<link rel=preload>` tags (plan step 5) live in the ROOT app layout `<head>` and fire on
EVERY app route, including the `/dev` gallery.

This assertion was MIS-SCOPED: `/dev/meridian/blocks` is an APP-SHELL route served by the
ROOT layout, which now correctly preloads app-chrome fonts on every app route — so those
requests are EXPECTED there, not an isolation break. The isolation guarantee we actually
care about (a PUBLISHED page loads/references no app font) is proven independently by the
vitest HTML-snapshot negative-trace (no `fonts-app-chrome`/`Onest`/`Caveat`/`Material Symbols`
in published HTML) + the published.css sha256 baseline + the 0-leak grep; published `/p/[slug]`
pages are static blob HTML that never load the root layout.

FIX (orchestrator added `e2e/ui-isolation.spec.ts` to Phase-2 Files-touched): removed ONLY
that network-request assertion and its now-unused `badFontRequests` array + `page.on('request')`
listener; renamed the test to `no app-chrome fonts/classes on the block surface`. KEPT the
two meaningful assertions — (1) hero headline computed font-family does NOT contain `Onest`
(templates still compute to Inter Tight even though Onest is preloaded/available), (2) zero
`[class*="app-"]` elements. The separate computed-style baseline test (JSON-fixture compare)
was left completely untouched.

Re-verification after the spec edit:
- `npx tsc --noEmit` -> exit 0 (unused listener/array removed, no dangling refs).
- `npm run test:run` -> 3012 passed | 18 skipped (unchanged).
- `npm run build` -> green; published.css sha256 == Phase-1 baseline (c2f87e08...);
  `grep -icE "onest|caveat|material symbols" public/published.css` -> 0.
- `npm run test:e2e -- --project=public` (free port 3018) -> 11 passed, 4 skipped, 0 failed.
  Both isolation tests now PASS:
  - `#14 ui-isolation.spec.ts:55 › computed-style baselines on /dev/meridian/blocks are unchanged` (green)
  - `#15 ui-isolation.spec.ts:86 › no app-chrome fonts/classes on the block surface` (green)

## Open risks / follow-ups

- None outstanding for Phase 2. Dev spot-check split: the e2e run CONFIRMS the app-surface
  half (the 3 preloads are requested on the `/dev` app route — now expected); the
  published-surface half (a `/p/[slug]` requests none of the new fonts) is proven by static
  analysis (fonts-app-chrome.css imported only in root layout, not p/layout.tsx; buildAssets
  ships only fonts-self-hosted.css; published.css 0-leak grep + sha256 baseline).
