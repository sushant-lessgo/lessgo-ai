# techpremium-harbor-palette — implementation audit

Branch verified FIRST: `git -C <WORKDIR> branch --show-current` → `feature/techpremium-harbor-palette`. Match.

## Phase 1 (slice 1 — tokens/palette record only)

### Files changed

1. `src/modules/templates/techpremium/palettes.test.ts` (NEW)
2. `src/types/product.ts`
3. `src/types/service.ts`
4. `src/modules/templates/techpremium/palettes.ts`
5. `src/modules/templates/techpremium/tokens.ts`
6. `src/modules/templates/techpremium/imageKeywords.ts`
7. `src/app/dev/seed-techpremium/route.ts` (NEW)

Exactly the phase's 7 Files-touched. No file under `blocks/` was touched; the ~58 block
literals are deliberately still stale (phase 2-5 work).

One incidental, non-authored change is present in the working tree — see "Open risks".

---

### Step 0 — baseline capture (done BEFORE any source edit)

`palettes.test.ts` was first created containing only a throwaway `it('dump', …)` that wrote
`serializeBaseTokens()` + `serializePaletteOverrides()` to a scratchpad file (vitest resolves the
`@/` alias; `npx tsx` would not). The dump ran against untouched code. `EXPECTED_FOREST_CASCADE`
in the final test is that output, frozen as an inline literal; the dump test was then deleted.
Cross-checkable at review time against `git show HEAD:src/modules/templates/techpremium/tokens.ts`
and `…/palettes.ts`.

Note: vitest's stdout was swallowed in this environment, hence the write-to-file dump rather than
`console.log`.

### Per-file changes

**`src/types/product.ts`** — `techPremiumPalettes = ['forest', 'harbor'] as const`;
`defaultTechPremiumPalette` flipped `'forest'` → `'harbor'`; NEW
`techPremiumPickerPalettes = ['forest'] as const` beside the tuple (types-level, so no
types→modules layer inversion). Block comment rewritten to describe both palettes and why the
picker subset exists.

**`src/modules/templates/techpremium/palettes.ts`** — `TechPremiumPaletteConfig` widened from 6
fields to 21: the original 6 accents + `paper/paper2/paper3`, `ink/ink2/ink3`,
`line/line2/lineDk`, `teal/tealDim`, `ok/okBg`, and the two NEW `onDark/onDark2`.
`paletteBlock()` emits all 21 (`--paper … --on-dark-2`).
- `forest` record: every value copied verbatim from the pre-change `techPremiumBaseTokens`
  (verified against the step-0 dump — forest's emitted values are unchanged), plus the RULED
  on-dark pair `oklch(0.840 0.022 140)` / `oklch(0.780 0.030 140)`.
- `harbor` record: the plan's designer table verbatim, incl. the RULED hue-240 on-dark pair
  `oklch(0.840 0.020 240)` / `oklch(0.780 0.028 240)`. `--ok` ≈ `--lime` proximity left exactly
  as delivered (ruling 3); a code comment says so, so nobody "fixes" it later.
- `pilotEnabledPalettes` is now `readonly TechPremiumPalette[] = techPremiumPickerPalettes`
  (still `['forest']`). Verified zero importers repo-wide (`techpremium/index.ts` does not
  re-export it), so the mutable→readonly type narrowing breaks nothing.
- Stale "ships a SINGLE palette" header comment replaced.

**`src/modules/templates/techpremium/tokens.ts`** — `:root` emission KEPT (deliberate overrule of
the spec, per plan). Only additions: `onDark`/`onDark2` on the interface + the base-token object
(forest values) + two new `:root` lines `--on-dark` / `--on-dark-2`. Added the two mandated
comments on `serializeBaseTokens()`: (a) the override wins by EMISSION ORDER not specificity
(both selectors are (0,1,0)), citing the injectors and the `vestria/tokens.ts:212` precedent;
(b) the DEAD-VALUE HAZARD — these are now a bare-page fallback only and must stay in sync with
the forest record, enforced by guard assertion 7. The file-top comment was also corrected (it
claimed palettes.ts carries "accent overrides" only).

**`src/types/service.ts`** — import switched `techPremiumPalettes` → `techPremiumPickerPalettes`;
`PALETTES_BY_TEMPLATE.techpremium` now points at the picker subset; the stale
"TechPremium → forest" comment replaced with a block explaining WHY it is the subset (a popover
swatch click writes `Project.paletteId`). Net effect: `VestriaThemePopover` still renders exactly
one `forest` swatch for techpremium.

**`src/modules/templates/techpremium/imageKeywords.ts`** — added
`harbor: 'industrial IoT hardware install cool marine daylight'`, mirroring the forest entry's
shape/register (the plan's suggested string, used as-is).

**`src/app/dev/seed-techpremium/route.ts` (NEW)** — mirrors `src/app/dev/seed-lumen/route.ts`
(`export const dynamic = 'force-dynamic'`, Clerk `auth()` → user lookup, `token.upsert`,
content merge preserving any existing `onboarding` blob, `project.upsert`, redirect to
`/edit/{token}`), using `buildTechPremiumHomeFinalContent` from `@/hooks/editStore/archetypes`.

Two hard requirements, both met and re-verified by code inspection:
- **Production hard-refuse:** first statement in `GET` is
  `if (process.env.NODE_ENV === 'production') return NextResponse.json({error:'Disabled in production'},{status:404});`
  (on top of middleware's 404 for `/dev/*` in production).
- **NO `paletteId` written.** Neither the `create` nor the `update` branch contains a `paletteId`
  key — deliberately, with an inline comment at both sites and in the file header. It writes only
  `templateId: 'techpremium'` and `variantId: 'default'`. This is the opposite of
  `seed-lumen` (`paletteId: 'brass'`) and of `thing.ts:736`; a stored value would beat
  `tmpl.defaultPaletteId` at `EditLayout.tsx:71` and destroy the AC #8 flip-back check.

### Deviations / decisions the plan left open

1. **`?token` is optional.** `seed-lumen` requires `?token=`; the plan's own manual steps invoke
   `GET /dev/seed-techpremium` with no query string, and the flip-back check needs a FRESH
   project. So the route mints a token when none is supplied
   (`tp-<base36 time>-<random>`). Passing `?token=` still works for re-seeding a known project.
   This also sidesteps the one wrinkle of "no `paletteId`": since the `update` branch also omits
   the column, re-seeding a token that already has a `paletteId` would keep it — the auto-fresh
   token makes the default-resolution chain the tested path by default. Documented in the route
   header. (Conservative choice: I did NOT write `paletteId: null`, because the instruction was
   explicit — "no `paletteId`".)
2. **Extra guard assertion "7b"** (2 lines): the `:root` `--on-dark*` fallbacks must equal the
   forest record's values. The plan's `compared.length === 19` count covers only the *relocated*
   vars, so the two NEW tokens are checked in a separate `it()` and do NOT perturb the mandated
   19. Additive strengthening of the same invariant, inside a file that is mine this phase.
3. `techPremiumBaseTokens` gained `onDark`/`onDark2` fields (the plan says "add `:root`
   fallbacks", which requires the interface fields — no ambiguity, recorded for completeness).
4. No other deviations. No block file, no migration, no schema change, no backfill, no picker
   entry, no production/real DB write.

### Guard test — `palettes.test.ts` (8 tests)

Assertions, matching the plan's list:
1. forest effective cascade (`:root` overlaid by `[data-palette="forest"]`) byte-exact against the
   frozen baseline, + a non-emptiness sanity check on the parsed cascade.
2. `palettesForTemplate('techpremium')` deep-equals `['forest']` — the REAL popover source, not
   `pilotEnabledPalettes`.
3. `defaultTechPremiumPalette === 'harbor'`, a `[data-palette="harbor"]{` block exists, and 5
   harbor spot-values (`--forest`, `--paper`, `--lime`, `--on-dark`, `--on-dark-2`).
4. Emission order: reads `ThemeInjector.tsx` and `components/TechPremiumSSRTokens.tsx` via `fs`
   and asserts `serializeBaseTokens()` precedes `serializePaletteOverrides()` in each, with
   `toBeGreaterThan(-1)` presence checks so a renamed call site fails loudly instead of comparing
   `-1 < -1`.
5. Containment: the four `[data-surface=…]` rules and both `[data-palette] em` rules still appear
   in `serializeBaseTokens()` output.
6. `await templateRegistry.techpremium()` → `defaultPaletteId === 'harbor'` (real dynamic import,
   not an fs read).
7. Dead-value hazard: all 19 relocated `:root` fallbacks equal the forest record, with the
   mandated `expect(compared.length).toBe(19)` inert-test guard on the camelCase→`--kebab` map.
7b. The two new on-dark fallbacks equal the forest record (see deviation 2).

Parser follows the plan's rules: declarations split on the FIRST colon only; duplicate selectors
merged last-wins (`:root` is emitted twice — the `--blog-*` re-open at the end of
`serializeBaseTokens()`); `[data-surface=…]` / `[data-palette] em` rules parse harmlessly into
non-`--` declarations that are filtered out.

### Guard-mutation proof (the test CAN fail)

Both mutations were made locally and then reverted; the revert is verified below.

- **Mutation A** — `palettes.ts` forest record `forest: oklch(0.325…)` → `oklch(0.326…)`.
  Result: **2 failed | 6 passed**.
  `AssertionError: expected '--forest=oklch(0.326 0.045 158)' to be '--forest=oklch(0.325 0.045 158)'` (assertion 1)
  and `expected 'forest=oklch(0.325 …)' to be 'forest=oklch(0.326 …)'` (assertion 7).
- **Mutation B** — `tokens.ts` `:root` fallback `paper: oklch(0.978…)` → `oklch(0.979…)`, forest
  record untouched. Result: **1 failed | 7 passed**;
  `AssertionError: expected 'paper=oklch(0.979 0.005 95)' to be 'paper=oklch(0.978 0.005 95)'`.
  Assertion 1 correctly did NOT fire (the overlay masks the fallback) — this is the exact
  dead-value hazard the plan predicted, and assertion 7 is what catches it. Empirically
  confirmed, not assumed.
- Revert verified: `grep` shows `tokens.ts:71 paper: 'oklch(0.978 0.005 95)'`,
  `tokens.ts:100 forest: 'oklch(0.325 0.045 158)'`,
  `palettes.ts:76 forest: 'oklch(0.325 0.045 158)'`, `palettes.ts:103 forest: 'oklch(0.320 0.048 252)'`,
  and the full suite is green again.
- NOT mutation-proven: assertion 4 (emission order) — proving it would require temporarily
  editing `ThemeInjector.tsx` / `TechPremiumSSRTokens.tsx`, which are outside this phase's
  Files-touched. It is protected against the inert form instead by the two `toBeGreaterThan(-1)`
  presence assertions.

### Commands run and their real results

| command | result |
|---|---|
| `git branch --show-current` | `feature/techpremium-harbor-palette` — match |
| `npx vitest run …/palettes.test.ts` | **8 passed** |
| `npx vitest run …/palettes.test.ts` (mutation A) | **2 failed \| 6 passed** (intended) |
| `npx vitest run …/palettes.test.ts` (mutation B) | **1 failed \| 7 passed** (intended) |
| `npx tsc --noEmit` | 1 error: `src/app/page.tsx(6,26): TS2307: Cannot find module '@/assets/images/founder.jpg'` — see below |
| `npx tsc --noEmit` (with `next-env.d.ts` regenerated, then deleted) | **0 errors** |
| `npm run test:run` | **316 passed \| 1 skipped (317 files); 5092 passed \| 15 skipped (5107 tests)** |
| `npx vitest run conformance.test.ts templateMeta.test.ts service.test.ts palettes.test.ts` | **4 files, 487 passed \| 8 skipped** |

**About the one `tsc` error — reported honestly, not hidden.** It is environmental, not mine:
`next-env.d.ts` is gitignored and had never been generated in this worktree (no `.next/`, `next
dev`/`build` never run here), so the `next/image-types/global` reference that declares `*.jpg`
modules was missing. I regenerated the standard two-line `next-env.d.ts`, re-ran `npx tsc
--noEmit` → **clean, zero errors**, then deleted the file again to leave the tree as I found it.
The error is unrelated to any of the 7 files in this phase and will not appear on a machine that
has run `npm run dev`/`build`. This also proves the `imageKeywords` closed-fail is satisfied
(a missing `harbor` entry would be a `Record<TechPremiumPalette, string>` type error).

### Explicit statement on the two non-negotiables

- The seed route **hard-refuses in production**: `NODE_ENV === 'production'` → 404 JSON, as the
  first statement of the handler.
- The seed route **writes no `paletteId`**: the string `paletteId` appears in the file only inside
  explanatory comments; neither `create` nor `update` contains the key.

### What I could NOT verify (left for the human gate)

- **Any visual/rendered result.** I did not run `npm run dev`, did not hit
  `/dev/seed-techpremium`, did not open `/edit/[token]`, did not open the theme popover, and did
  not devtools-toggle `data-palette`. I make no claim about how harbor looks. The founder's
  slice-1 decision gate (harbor direction on dev, popover shows forest-only, devtools A/B,
  flip-back-to-forest) is entirely outstanding.
- The seed route was never executed — no DB was touched by me at all (local or otherwise). Its
  correctness is code-inspection + mirror-of-precedent only; the first `GET` is unproven.
- `npm run build` — not run (plan: orchestrator runs it after phase 5).
- The founder-gate cosmetic note stands: a harbor project shows NO highlighted swatch
  (`VestriaThemePopover.tsx:118` resolves `activePalette` to `'harbor'`, absent from the
  one-swatch grid). Expected, not a bug.

### Open risks

- **Incidental working-tree entry:** `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`
  shows as modified after `npm run test:run`. `git diff` / `git diff --numstat` report **zero
  content change** — vitest rewrote the file with LF line endings only. I did not revert it
  because that requires `git checkout --`, a state-changing git command I am not permitted to run.
  Safe to discard.
- Slice-1 leaves the page mid-migration by design: with harbor as default, the ~58 stale block
  literals still render green on navy bands. Expected until phase 5.
- Delivery reach is unchanged and still essentially nothing (techpremium is retired; no creation
  path; no row write). Per founder ruling, out of scope.

---

## Addendum — impl-review round 1 fixes (same branch, phase 1 scope)

Branch re-verified before editing: `feature/techpremium-harbor-palette`.

### Files changed in this round (both already in phase 1's Files-touched)

- `src/modules/templates/techpremium/palettes.test.ts`
- `src/app/dev/seed-techpremium/route.ts`

### 1. BLOCKING — guard-test flake under full-suite load (fixed)

Reviewer's diagnosis confirmed and now reproduced with numbers on my side. Assertion 6 (the
registry loader test) is the only test in the repo that awaits a `templateRegistry.<t>()` loader;
`await import('@/modules/templates/techpremium')` pulls the whole barrel through vite's transform
in jsdom, and `vitest.config.ts` sets no `testTimeout`, so the ceiling was the 5000ms default.

Fix applied exactly as directed — an explicit per-test timeout on that one `it()`:

```ts
it(
  'the techpremium registry entry resolves defaultPaletteId to harbor',
  async () => { … },
  30_000,
);
```

The assertion itself is UNCHANGED — it still performs the real dynamic import and reads
`mod.defaultPaletteId`. It was NOT downgraded to an `fs` read of `registry.ts`. A comment above
the test records the cause and explicitly forbids that downgrade.

**Hard evidence of the margin.** A third full-suite run with `--reporter=verbose` shows the
per-test timing under load:

```
✓ …/palettes.test.ts > … > the techpremium registry entry resolves defaultPaletteId to harbor 5927ms
```

5927ms — genuinely over the old 5000ms ceiling (so the flake was real and structural, not
environmental), and now with ~5x headroom under 30000ms. The other 7 tests in the file run in
0-5ms each, so the timeout is scoped to the one slow assertion and nothing else was loosened.

### 2. Non-blocking — explicit `audienceType` on the seed route (applied)

Added `audienceType: 'product'` to the `create` branch ONLY, with a one-line comment noting it
matches the Prisma column default (`schema.prisma:28 audienceType String @default("product")`)
and that techpremium is a product-audience template per `PRODUCT_TEMPLATE_MODULE_IDS`
(`types/service.ts:83`). The `update` branch was left untouched, as instructed.

The two hard requirements are unchanged and re-inspected after the edit: the
`NODE_ENV === 'production'` 404 is still the first statement of the handler, and `paletteId`
still appears nowhere but in comments — absent from both `create` and `update`.

### Verification — full suite, run twice as required (isolation runs deliberately not used)

| run | command | result |
|---|---|---|
| 1 | `npm run test:run` | **316 passed \| 1 skipped (317 files); 5092 passed \| 15 skipped (5107 tests)** — 78.98s |
| 2 | `npm run test:run` | **316 passed \| 1 skipped (317 files); 5092 passed \| 15 skipped (5107 tests)** — 79.12s |
| 3 | `npx vitest run --reporter=verbose` | same totals; used to capture the 5927ms per-test timing above |

Three consecutive full-suite runs, zero failures, zero timeouts. Counts are identical to the
pre-fix run, so no test was skipped or silently dropped by the change.

`npx tsc --noEmit` re-run after both edits (with `next-env.d.ts` regenerated for the reason
documented above, then deleted): **0 errors**. This also confirms `audienceType: 'product'`
type-checks against the Prisma `ProjectCreateInput`.

### Still not verified (unchanged from the main audit)

No visual pass, no `npm run dev`, the seed route has still never been executed, no DB touched.
The slice-1 founder decision gate remains fully outstanding.

---

## Phase 2 (slice 2 — B1: shared foundation)

Branch verified FIRST, before any edit: `git -C <WORKDIR> branch --show-current` →
`feature/techpremium-harbor-palette`. Match.

### Files changed

1. `src/modules/templates/techpremium/blocks/shared/sharedStyles.ts`
2. `docs/task/techpremium-harbor-palette.audit.md` (this append)

Exactly the phase's 1 Files-touched source file. No other file was read-modified; phase 3's
Footer files, the phase-4 renderer pairs and the phase-5 modules are untouched.

### The 10 in-scope replacements (before → after)

`sharedStyles.ts` carries **13** `oklch(` literals: 10 in-scope + 3 scope-out. All 10 replaced,
all 3 scope-outs untouched. Diff is `9 insertions(+), 9 deletions(-)` — 9 lines because `:11`
carries two in-scope literals on one line (count occurrences, not lines).

| # | line | before | after | source of the string |
|---|---|---|---|---|
| 1 | `:8` `.tp-ph` hatch | `oklch(0.325 0.045 158 / 0.055)` | `color-mix(in oklch, var(--forest) 5.5%, transparent)` | canonical "base `.tp-ph` hatch" |
| 2 | `:11` `.tp-ph.on-dark` bg | `oklch(0.285 0.040 159)` | `color-mix(in oklch, var(--forest) 50%, var(--forest-d))` | plan phase-2 step 1 / §G midpoint row |
| 3 | `:11` `.tp-ph.on-dark` stripe | `oklch(0.855 0.185 128 / 0.07)` | `color-mix(in oklch, var(--lime) 7%, transparent)` | canonical "hue-128 stripe" (the ONLY lime-stripe site) |
| 4 | `:12` `.tp-ph.on-dark .tp-tag` color | `oklch(0.78 0.03 140)` | `var(--on-dark-2)` | canonical hue-140 rule, "opaque tag cluster" branch |
| 5 | `:35` `.tp-lede` on dark surfaces | `oklch(0.85 0.025 140 / 0.82)` | `color-mix(in oklch, var(--on-dark) 82%, transparent)` | canonical hue-140 form @ ORIGINAL alpha 0.82 |
| 6 | `:43` `.tp-btn2.lime:hover` | `oklch(0.815 0.185 128)` | `color-mix(in oklch, var(--lime) 95%, black)` | canonical hue-128 hover fill (scout §G's `88% --forest-d` row is SUPERSEDED and was NOT used) |
| 7 | `:56` `.tp-pcard:hover` box-shadow | `oklch(0.30 0.04 158 / 0.5)` | `color-mix(in oklch, var(--forest) 50%, transparent)` | scout §G row 3 (shadow-tint collapse) |
| 8 | `:74` `.tp-lightbox` scrim | `oklch(0.20 0.03 159 / 0.92)` | `color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 92%, transparent)` | canonical "lightbox scrim … 0.92" |
| 9 | `:79` `.tp-lb-cap` | `oklch(0.85 0.025 140 / 0.8)` | `color-mix(in oklch, var(--on-dark) 80%, transparent)` | canonical hue-140 form @ ORIGINAL alpha 0.8 |
| 10 | `:81` `.tp-lb-nav` scrim | `oklch(0.20 0.03 159 / 0.6)` | `color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 60%, transparent)` | canonical "scrim … 0.6" |

Strings 1, 3, 6, 8, 9, 10 are the plan's canonical strings pasted **byte-identically** (phases 4
and 5 must paste the same bytes — notably #1 at `Hero.tsx:308`/`.published.tsx:128`, #6 at 5 more
sites, #8/#9/#10 at `ProductDetail/styles.ts:80`/`:85`/`:87`).

### Scope-outs — verified untouched

`grep -o "oklch([^)]*)"` after the edit returns exactly three hits, all originals:

```
17:oklch(0.66 0.15 150 / 0.30)   # .tp-pill border      (hue 150)
19:oklch(0.70 0.095 192 / 0.30)  # .tp-pill.teal border (hue 192)
45:oklch(0.55 0.16 150)          # .tp-btn2.wa:hover    (hue 150)
```

So this file still contributes 2 to the phase-5 hue-150 census and 1 to hue-192, and contributes
0 to hues 158/159/140/128 — which is what the phase-5 census test will require.

Colour values only. No selector changed, no declaration added or removed, no markup, no
refactor, no dedupe.

### Deviations from the plan

**None.** No value was invented; every replacement traces to a canonical string or a named
scout §G row (table column 5 above).

Two in-scope judgment calls, both resolved conservatively and worth naming:

1. **`:12` uses bare `var(--on-dark-2)`, not a `color-mix(… 100%, transparent)` wrapper.** The
   canonical hue-140 rule says `var(--on-dark-2)` "for the opaque tag cluster"; the literal was
   opaque, and forest's `onDark2` is `oklch(0.780 0.030 140)` — byte-equal to the replaced
   literal, so forest's rendered value here is *exactly* unchanged (not even a JND collapse).
2. **Alpha → percentage is a literal transcription** (`/ 0.82` → `82%`, `/ 0.8` → `80%`,
   `/ 0.055` → `5.5%`, `/ 0.5` → `50%`), per the canonical "at each site's ORIGINAL alpha".
   No alpha was rounded or harmonised.

### Commands run and their real results

| command | result |
|---|---|
| `git branch --show-current` (FIRST action) | `feature/techpremium-harbor-palette` — match |
| `npx tsc --noEmit` | **0 errors**, clean |
| `npm run test:run` | **316 passed \| 1 skipped (317 files); 5092 passed \| 15 skipped (5107 tests)** — 73.15s |
| `git diff --stat` | `1 file changed, 9 insertions(+), 9 deletions(-)` |
| `grep -o "oklch([^)]*)"` post-edit | 3 hits — the 3 scope-outs only |

Test totals are **identical** to phase 1's (5092/15), so nothing was dropped or newly skipped,
and the phase-1 forest cascade guard (`palettes.test.ts`, 8 tests) still holds. That guard covers
the token layer only — it does not and cannot see block literals, so it is evidence that phase 2
broke nothing upstream, NOT evidence that these 10 replacements render correctly.

Note on `tsc`: unlike phase 1, no `src/app/page.tsx TS2307` appeared — `next-env.d.ts` is now
present in the worktree (gitignored, left behind by earlier work). I neither created nor deleted
it. `git status` shows exactly one modified file (the source file above).

### What is NOT verified — outstanding, and it matters

**Both of this phase's required empirical dev checks are OUTSTANDING. I did not perform them and
make no claim about them.** They need a browser; they belong to the founder:

1. **`.tp-ph` stripe reads GREEN under forest** — `color-mix(…, transparent)` relies on
   premultiplied alpha. If an engine mixed non-premultiplied, the 5.5%/7% stripes would not merely
   be a shade off, they would render as a washed/pink band tint. This lands at replacements 1, 3,
   5, 7, 9, 10 — six of the ten.
2. **`.tp-btn2.lime:hover` fill reads GREEN, not grey/olive, under forest** — `color-mix(…, black)`
   relies on black being achromatic ⇒ powerless hue ⇒ `--lime`'s hue carried through. If an engine
   treated the missing hue as 0 instead, the hover goes grey/olive. This is the riskier of the two
   forms and it appears at 6 sites across the slice; `:43` is the first and cheapest place to
   catch it.

No test in this repo catches either failure — they are string substitutions that type-check and
unit-test green while rendering wrong. Also unverified: any visual result at all (I did not run
`npm run dev`, did not hit `/dev/seed-techpremium`, did not devtools-toggle `data-palette`), the
harbor appearance of these 10 sites, the plan's manual eyeball of
Explainer/Contact/Gallery/GalleryPreview under both palettes, and the `/preview`/published-render
glance. `npm run build` not run (orchestrator, after phase 5).

Known-and-accepted forest deltas introduced by this phase, all pre-ruled in the plan's AC #4
scope: `:56`'s shadow tint 0.30→0.325 L; `:35`/`:79`'s hue-140 values collapse onto `--on-dark`
(`0.840 0.022 140`); `:43`'s hover chroma 0.185→0.176. `:11`'s midpoint and `:12`'s tag colour are
value-exact. Phase 3 not started.

---

## Phase 3 (slice 2 — B2: Footer family)

Branch verified FIRST, before any edit: `git -C <WORKDIR> branch --show-current` →
`feature/techpremium-harbor-palette`. Match.

### Files changed

1. `src/modules/templates/techpremium/blocks/Footer/footerStyles.ts`
2. `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx`
3. `docs/task/techpremium-harbor-palette.audit.md` (this append)

Exactly the phase's 2 Files-touched source files. `git status --porcelain` after the work shows
those two source files and nothing else. **`TechPremiumFooter.published.tsx` was NOT touched**
(it carries 0 colour literals by design — verified `grep -c "oklch(" … → 0` before and after —
and imports `FOOTER_STYLES`, so the `footerStyles.ts` edit covers both renderers). No phase-4/5
file was opened for modification.

### `footerStyles.ts` — 7 in-scope replacements (before → after)

The file carries **9** `oklch(` literals: 7 in-scope + 2 scope-out. Diff: `7 insertions(+),
7 deletions(-)` — one literal per line, so lines = occurrences here.

| # | line | selector / role | before | after | source of the string |
|---|---|---|---|---|---|
| 1 | `:5` | `.tp-footer` body ink | `oklch(0.84 0.022 140 / 0.82)` | `color-mix(in oklch, var(--on-dark) 82%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.82 — byte-identical to phase 2's `sharedStyles.ts:35` |
| 2 | `:8` | `.tp-footer__mk` panel fill | `oklch(0.34 0.045 158)` | `var(--forest)` | canonical "`var(--forest)` for `0.34 0.045 158`" / scout §G row 7 (the single footer-panel site) |
| 3 | `:12` | `.tp-footer__blurb` | `oklch(0.84 0.022 140 / 0.78)` | `color-mix(in oklch, var(--on-dark) 78%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.78 |
| 4 | `:17` | `.tp-footer__social a` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.7 |
| 5 | `:25` | `.tp-soc-pop input::placeholder` | `oklch(0.84 0.022 140 / 0.5)` | `color-mix(in oklch, var(--on-dark) 50%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.5 |
| 6 | `:27` | `.tp-soc-pop button` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.7 |
| 7 | `:41` | `.tp-news__input::placeholder` | `oklch(0.84 0.022 140 / 0.55)` | `color-mix(in oklch, var(--on-dark) 55%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.55 |

### `TechPremiumFooter.tsx` `EDIT_EXTRA` — 10 in-scope replacements (before → after)

All 10 are the same base value `oklch(0.84 0.022 140)` at three alphas; all sit inside
`EDIT_EXTRA` (`:236-263`), editor-only chrome. Diff: `10 insertions(+), 10 deletions(-)`.
After the edit the whole file contains **zero** `oklch(` occurrences (asserted programmatically
during the replacement).

| # | line | selector / role | before | after |
|---|---|---|---|---|
| 1 | `:238` | `.tp-footer__col-remove, .tp-footer__link-remove` | `oklch(0.84 0.022 140 / 0.6)` | `color-mix(in oklch, var(--on-dark) 60%, transparent)` |
| 2 | `:239` | `.tp-footer__link-cfg` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` |
| 3 | `:242` | `.tp-foot-add` (add-link chip) | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` |
| 4 | `:243` | `.tp-news__field` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` |
| 5 | `:245` | `.tp-news-setup` | `oklch(0.84 0.022 140 / 0.82)` | `color-mix(in oklch, var(--on-dark) 82%, transparent)` |
| 6 | `:246` | `.tp-news-status` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` |
| 7 | `:254` | `.tp-legal-edit button` | `oklch(0.84 0.022 140 / 0.6)` | `color-mix(in oklch, var(--on-dark) 60%, transparent)` |
| 8 | `:255` | `.tp-wa-edit` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` |
| 9 | `:259` | `.tp-flogo-edit__btn` | `oklch(0.84 0.022 140 / 0.7)` | `color-mix(in oklch, var(--on-dark) 70%, transparent)` |
| 10 | `:261` | `.tp-flogo-edit__x` | `oklch(0.84 0.022 140 / 0.6)` | `color-mix(in oklch, var(--on-dark) 60%, transparent)` |

The hover states in `EDIT_EXTRA` (`:240`, `:260`, `:262`) and `footerStyles.ts` (`:18`, `:28`)
already use `var(--lime)` — no literal there, nothing to change; they follow the palette
automatically.

### Byte-identity of the canonical strings

`grep -oh "color-mix(in oklch, var(--on-dark) [0-9]*%, transparent)"` across both Footer files +
phase 2's `sharedStyles.ts`:

```
1 … 50%, transparent)   1 … 55%, transparent)   3 … 60%, transparent)
8 … 70%, transparent)   1 … 78%, transparent)   1 … 80%, transparent)   3 … 82%, transparent)
```

Every occurrence matches the canonical template character-for-character (same spacing, same
`in oklch, `, same `%, transparent)` tail); the 82% and 80% forms are byte-shared with phase 2's
`:35`/`:79`. The phase-4 parity test over these strings will see one spelling only.

### Scope-outs — verified untouched

`grep -n "oklch(" footerStyles.ts` post-edit returns exactly two hits, both originals:

```
46:… box-shadow:0 14px 34px -12px oklch(0.55 0.16 150 / 0.6);   # .tp-wa-fab       (hue 150)
47:… box-shadow:0 18px 40px -12px oklch(0.55 0.16 150 / 0.7);   # .tp-wa-fab:hover (hue 150)
```

So the Footer family now contributes **0** to hues 158/159/140/128 and keeps its **2** to the
phase-5 hue-150 anchor (repo-wide 11). Nothing else in either file changed: colour values only —
no selector, declaration, markup, JSX, import, or structural change.

### Deviations from the plan

**None.** No value invented; each replacement traces to the plan's canonical hue-140 rule
(`color-mix(in oklch, var(--on-dark) N%, transparent)` at the site's original alpha) or the
canonical `var(--forest)` for `0.34 0.045 158`.

Two in-scope judgment calls, resolved conservatively:

1. **All 10 EDIT_EXTRA literals used the `--on-dark` (not `--on-dark-2`) form.** The canonical
   rule reserves `var(--on-dark-2)` for "the opaque tag cluster"; all 10 here carry an explicit
   alpha (0.6/0.7/0.82) and are the same `0.84 0.022 140` base as the `--on-dark` family, so they
   take the alpha-mix form. No opaque hue-140 literal exists in either file.
2. **Alpha → percentage is a literal transcription** (`/ 0.82`→`82%`, `/ 0.78`→`78%`,
   `/ 0.7`→`70%`, `/ 0.6`→`60%`, `/ 0.55`→`55%`, `/ 0.5`→`50%`). Nothing rounded or harmonised;
   the collapse is in the base value (drifted `0.84 0.022 140` → `--on-dark` `0.840 0.022 140`,
   which for THIS file is value-exact under forest to 3 decimals), not in the alphas.

**Line-ending note (housekeeping, no code effect):** my first scripted pass rewrote
`footerStyles.ts` with LF endings (the repo has `core.autocrlf=true` and the working-tree file was
CRLF). I detected this and restored CRLF byte-for-byte (53 CRLF, matching the original). `git
diff` shows the 7 intended lines only, no whitespace churn. `TechPremiumFooter.tsx` was edited in
binary mode and kept its 263 CRLF endings throughout.

### Commands run and their real results

| command | result |
|---|---|
| `git branch --show-current` (FIRST action) | `feature/techpremium-harbor-palette` — match |
| `npx tsc --noEmit` | **0 errors** (exit 0, no output) |
| `npm run test:run` | **316 passed \| 1 skipped (317 files); 5092 passed \| 15 skipped (5107 tests)** — 87.43s |
| `git status --porcelain` | exactly 2 modified source files (the two above) |
| `git diff --stat` | `2 files changed, 17 insertions(+), 17 deletions(-)` (7 + 10) |
| `grep -c "oklch(" TechPremiumFooter.published.tsx` | `0` (unchanged, file untouched) |
| `grep -n "oklch(" footerStyles.ts` post-edit | 2 hits — `:46`/`:47` scope-outs only |

Totals are **identical** to phases 1 and 2 (5092/15) — nothing dropped or newly skipped, and the
phase-1 forest cascade guard (`palettes.test.ts`, 8 tests) still holds. That guard covers the
TOKEN layer only; it cannot see block literals, so it is evidence phase 3 broke nothing upstream,
**not** evidence that these 17 replacements render correctly.

### What is NOT verified — outstanding, and it matters

I have no browser and ran no dev server. **I make no visual claim whatsoever.** Specifically
outstanding for the founder/human gate:

- **The footer in the editor under BOTH palettes**, including the EDIT_EXTRA affordances (column/
  link remove buttons, link-config icon, add-link chips, newsletter field + setup button +
  status, legal edit, WhatsApp edit row, footer-logo chips) **and their hover states** — the
  chrome must stay legible on the navy band under harbor and unchanged-looking under forest.
- **A published render of the footer**, confirming `footerStyles.ts` really carried both renderers
  (the whole asymmetry argument rests on it, and I verified it only by reading the import at
  `.published.tsx:13`).
- The `color-mix(…, transparent)` premultiplied-alpha engine behaviour still applies to all 16
  alpha sites here (phase 2 flagged it; nothing in this phase re-tests it). No test in this repo
  catches that class of failure — these are string substitutions that type-check and unit-test
  green while potentially rendering wrong.
- `npm run build` not run (orchestrator, after phase 5). No `/dev/seed-techpremium` hit, no DB
  touched.

Known-and-accepted forest deltas from this phase (all pre-ruled in the plan's AC #4 scope):
the 16 hue-140 sites collapse from `0.84 0.022 140` onto `--on-dark` (`0.840 0.022 140` — a
zero-visible-difference collapse for this file, since every literal here shared the one base
value), and `:8`'s panel fill moves `0.34 0.045 158` → `--forest` `0.325 0.045 158` (slightly
darker 34px logo mark). Phase 4 not started.

---

## Phase 4 (slice 2 — B3: dual-renderer inline pairs + parity test)

Branch verified FIRST, before any edit: `git -C <WORKDIR> branch --show-current` →
`feature/techpremium-harbor-palette`. Match.

### Files changed

1. `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.tsx`
2. `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.published.tsx`
3. `src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.tsx`
4. `src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.published.tsx`
5. `src/modules/templates/techpremium/blocks/Pricing/TechPremiumPricing.tsx`
6. `src/modules/templates/techpremium/blocks/Pricing/TechPremiumPricing.published.tsx`
7. `src/modules/templates/techpremium/blocks/renderParity.test.ts` (NEW)
8. `docs/task/techpremium-harbor-palette.audit.md` (this append)

Exactly the phase's 7 Files-touched. `git status --porcelain` shows those 6 modified sources +
the 1 new untracked test (plus one incidental non-authored entry — see "Open risks").
**`Testimonials/TechPremiumResults.tsx` / `.published.tsx` were NOT modified** (0+0 in-scope; the
parity test only READS them) — they do not appear in `git status`. No phase-5 file was opened for
modification.

### Work order — strict pair-by-pair lockstep

Hero → (diff both sides, confirm identical) → CTA → (diff) → Pricing → (diff). Not batched.
Every pair's two files got the SAME literal → the SAME canonical string in the same step, and the
extracted colour-expression sets were compared with `diff` before moving on. All three compared
IDENTICAL first time.

### Hero pair — 4+4 replacements (before → after)

`Hero.tsx:308` / `:316` (×2) / `:336` and `Hero.published.tsx:128` / `:133` (×2) / `:151`. Four
occurrences on three lines per file — `:316`/`:133` carries TWO literals on ONE line.

| # | line (.tsx / .published.tsx) | role | before | after | source |
|---|---|---|---|---|---|
| 1 | 308 / 128 | inline `.tp-ph` re-declaration, repeating-linear-gradient hatch | `oklch(0.325 0.045 158 / 0.055)` | `color-mix(in oklch, var(--forest) 5.5%, transparent)` | canonical "base `.tp-ph` hatch"; byte-identical to phase 2's `sharedStyles.ts:8` |
| 2 | 316 / 133 (1st of 2) | `.tp-readout` box-shadow, outer | `oklch(0.30 0.04 158 / 0.5)` | `color-mix(in oklch, var(--forest) 50%, transparent)` | scout §G row 3 (shadow tint); byte-identical to phase 2's `sharedStyles.ts:56` |
| 3 | 316 / 133 (2nd of 2) | `.tp-readout` box-shadow, inner | `oklch(0.30 0.04 158 / 0.25)` | `color-mix(in oklch, var(--forest) 25%, transparent)` | scout §G row 4 (same form @ 25%) |
| 4 | 336 / 151 | `.tp-btn--lime:hover` fill | `oklch(0.815 0.185 128)` | `color-mix(in oklch, var(--lime) 95%, black)` | canonical hue-128 hover fill |

**The trap, handled explicitly:** #1 is a FOREST 5.5% hatch, NOT the lime stripe. The 7% lime
stripe (`oklch(0.855 0.185 128 / 0.07)` → `color-mix(in oklch, var(--lime) 7%, transparent)`)
exists at exactly ONE site repo-wide — `sharedStyles.ts:11`, landed in phase 2 and untouched here.
Verified post-edit: `var(--lime) 7%` appears 0 times in the six phase-4 files.

### CTA pair — 3+3 replacements (before → after)

| # | line (.tsx / .published.tsx) | role | before | after | source |
|---|---|---|---|---|---|
| 1 | 108 / 52 | `.tp-cta__body` on the dark band | `oklch(0.86 0.025 140 / 0.82)` | `color-mix(in oklch, var(--on-dark) 82%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.82; byte-identical to phase 2 `sharedStyles.ts:35` + phase 3 `footerStyles.ts:5` |
| 2 | 113 / 57 | `.tp-btn--lime:hover` fill | `oklch(0.815 0.185 128)` | `color-mix(in oklch, var(--lime) 95%, black)` | canonical hue-128 hover fill |
| 3 | 118 / 62 | `.tp-cta__phone` | `oklch(0.82 0.03 140 / 0.78)` | `color-mix(in oklch, var(--on-dark) 78%, transparent)` | canonical hue-140 form @ ORIGINAL α 0.78; byte-identical to phase 3 `footerStyles.ts:12` |

### Pricing pair — 1+1 replacement (before → after)

| # | line (.tsx / .published.tsx) | role | before | after | source |
|---|---|---|---|---|---|
| 1 | 238 / 94 | `.tp-pcard--mid` box-shadow | `oklch(0.30 0.04 158 / 0.5)` | `color-mix(in oklch, var(--forest) 50%, transparent)` | scout §G row 3; byte-identical to Hero #2 and phase 2 `sharedStyles.ts:56` |

Colour values only across all six files. No selector, declaration, markup, JSX, import or
structural change; `git diff --stat` = `6 files changed, 14 insertions(+), 14 deletions(-)`
(3+3+3+3+1+1) — one changed line per changed declaration, no whitespace/CRLF churn.

### Scope-outs — verified untouched, at their original line numbers

```
Hero/TechPremiumHero.tsx:301                       oklch(0.66 0.15 150 / 0.30)   (hue 150)
Hero/TechPremiumHero.published.tsx:121             oklch(0.66 0.15 150 / 0.30)   (hue 150)
CTA/TechPremiumCTA.tsx:117                         oklch(0.55 0.16 150)          (hue 150)
CTA/TechPremiumCTA.published.tsx:61                oklch(0.55 0.16 150)          (hue 150)
Testimonials/TechPremiumResults.tsx:247            oklch(0.66 0.15 150 / 0.30)   (hue 150, file NOT edited)
Testimonials/TechPremiumResults.published.tsx:101  oklch(0.66 0.15 150 / 0.30)   (hue 150, file NOT edited)
```

Post-edit `grep -c "oklch("`: Hero.tsx 1, Hero.published.tsx 1, CTA.tsx 1, CTA.published.tsx 1,
Pricing.tsx 0, Pricing.published.tsx 0 — only the four named scope-outs remain in the six touched
files.

**Census anchors re-derived repo-wide over `blocks/`, excluding `*.test.ts`:** hue 150 = **11**,
hue 192 = **2**, hue 95 = **4** — exactly the phase-5 targets, unmoved. Remaining in-scope
literals for phase 5: hue 158 = 6, 159 = 4, 140 = 4, 128 = 1 → **15**, matching the plan's
phase-5 arithmetic (4+2+1+3+5 = 15; 16 this phase + 15 = the 31 outstanding after phase 3).

### Byte-identity across phases 2-4

`grep -roh` over all touched block files — one spelling per distinct value:

```
2 color-mix(in oklch, var(--forest) 25%, transparent)     3 color-mix(in oklch, var(--forest) 5.5%, transparent)
9 color-mix(in oklch, var(--forest) 50%, transparent)     1 color-mix(in oklch, var(--forest) 50%, var(--forest-d))
4 color-mix(in oklch, var(--forest-d) 78%, black)         1 color-mix(in oklch, var(--lime) 7%, transparent)
5 color-mix(in oklch, var(--lime) 95%, black)             1 color-mix(in oklch, var(--on-dark) 50%, transparent)
3 color-mix(in oklch, var(--on-dark) 60%, transparent)    8 color-mix(in oklch, var(--on-dark) 70%, transparent)
3 color-mix(in oklch, var(--on-dark) 78%, transparent)    1 color-mix(in oklch, var(--on-dark) 80%, transparent)
5 color-mix(in oklch, var(--on-dark) 82%, transparent)
```

Every phase-4 string is a byte-exact paste of the plan's canonical text / the spelling phases 2-3
already landed. The `--lime 95%, black` hover count is now 5 of the 6 sites (the 6th,
`Explainer/styles.ts:16`, is phase 5). **Scout §G's superseded `88% var(--forest-d)` hover form
was NOT used anywhere** — 0 hits repo-wide.

(The single `color-mix(in oklch, var(--forest) 55%, transparent)` a wider grep will show lives
ONLY inside the new test file, as the extractor's negative-case sample — see the phase-5 note.)

### The parity test — `blocks/renderParity.test.ts` (5 tests)

Covers all 4 pairs (Hero, CTA, Pricing, Results — Results read-only) plus one extractor
self-test. Per pair: read both sources via `fs`, extract every colour expression, assert the
sorted multisets are equal.

- **Paren-balanced extraction**, as mandated: a regex finds each `oklch(` / `color-mix(` token
  start, then a character walk counts paren depth to the matching close; scanning resumes AFTER
  the closing paren, so nested forms
  (`color-mix(in oklch, color-mix(…) 92%, transparent)` — phase 2's scrims, phase 5's
  `ProductDetail/styles.ts`) are captured as ONE outermost expression and nesting depth is itself
  part of what parity compares. Unbalanced input throws rather than silently dropping.
- **Per-file non-emptiness** asserted on both sides of every pair, so a broken extractor cannot
  pass green by returning `[]` twice.
- The extractor self-test pins the balanced behaviour on a flat expr, a nested expr and a raw
  `oklch(…)`, and explicitly asserts that a 55%-vs-50% pair does NOT compare equal — the exact
  case the naive `/color-mix\([^)]*\)/` form would have swallowed.

### Parity-test failure proof (real output; mutation made, then reverted)

Mutation: `CTA/TechPremiumCTA.published.tsx:52` ONLY — `… var(--on-dark) 82%, transparent` →
`… 55%, transparent`. Chosen deliberately as a divergence in the PERCENTAGE TAIL, i.e. precisely
what a truncating extractor would miss.

```
 ❯ src/modules/templates/techpremium/blocks/renderParity.test.ts (5 tests | 1 failed) 10ms
     × 'CTA': .tsx and .published.tsx declare identical colour expressions 5ms

AssertionError: expected [ …(4) ] to deeply equal [ …(4) ]
- Expected
+ Received
  [
    "color-mix(in oklch, var(--lime) 95%, black)",
-   "color-mix(in oklch, var(--on-dark) 55%, transparent)",
    "color-mix(in oklch, var(--on-dark) 78%, transparent)",
+   "color-mix(in oklch, var(--on-dark) 82%, transparent)",
    "oklch(0.55 0.16 150)",
  ]
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

Reverted immediately; re-run → **5 passed**. The revert is visible in the final `git diff`
(CTA.published.tsx:52 reads `82%`, identical to CTA.tsx:108) and in the full-suite green below.
So the test demonstrably detects the divergence class it exists for, at percentage granularity.

### Commands run and their real results

| command | result |
|---|---|
| `git branch --show-current` (FIRST action) | `feature/techpremium-harbor-palette` — match |
| `npx vitest run …/renderParity.test.ts` (post-edit) | **5 passed** |
| `npx vitest run …/renderParity.test.ts` (under mutation) | **1 failed \| 4 passed** — output quoted above |
| `npx vitest run …/renderParity.test.ts` (after revert) | **5 passed** |
| `npx tsc --noEmit` | exit 0, **0 errors** |
| `npm run test:run` | **317 passed \| 1 skipped (318 files); 5097 passed \| 15 skipped (5112 tests)** — 123.49s |
| `npx vitest run …/palettes.test.ts` (phase-1 forest guard) | **8 passed** |
| `git diff --stat` | `6 files changed, 14 insertions(+), 14 deletions(-)` |
| `git status --porcelain` | 6 modified sources + 1 untracked test (+ 1 incidental, see Open risks) |
| per-pair `diff` of extracted colour expressions (Hero, CTA, Pricing) | IDENTICAL in all three, checked before moving to the next pair |

Deltas vs phase 3's totals are exactly `+1 file / +5 tests` — the new parity file and nothing
else. No pre-existing test was dropped or newly skipped, and the phase-1 forest cascade guard
still holds. As in phases 2-3: that guard covers the TOKEN layer only, so it is evidence phase 4
broke nothing upstream, **not** evidence that these 16 replacements render correctly.

### Deviations from the plan

**None.** No value invented; every replacement traces to a canonical string or a named scout §G
row (table column 6 above). No scope-out touched, no Results edit, no phase-5 work started.

Two in-scope judgment calls, both resolved conservatively:

1. **CTA `:118`/`:62` `oklch(0.82 0.03 140 / 0.78)` → `--on-dark` (not `--on-dark-2`).** This
   literal sits between the two tokens: its chroma 0.03 matches `--on-dark-2`
   (`0.780 0.030 140`) exactly, while its lightness 0.82 is nearer `--on-dark`
   (`0.840 0.022 140`, Δ0.02) than `--on-dark-2` (Δ0.04). The plan's canonical rule reserves
   `var(--on-dark-2)` for "the opaque tag cluster"; this site carries an explicit alpha, so it
   takes the alpha-mix `--on-dark` form — the same resolution phase 3 recorded for its 16 alpha'd
   hue-140 sites. Net forest effect: the CTA phone line lightens 0.82 → 0.840 L and loses 0.008
   chroma at 78% alpha. Inside the ruled hue-140 collapse (AC #4 scope), but it IS a real (small)
   forest change, named here rather than buried.
2. **Alpha → percentage is a literal transcription** (`/ 0.055`→`5.5%`, `/ 0.5`→`50%`,
   `/ 0.25`→`25%`, `/ 0.82`→`82%`, `/ 0.78`→`78%`). Nothing rounded or harmonised.

### Note for phase 5 (not an action taken — a hazard flagged)

`renderParity.test.ts` contains literal colour strings in its extractor self-test, including
`oklch(0.66 0.15 150 / 0.30)` twice and `color-mix(in oklch, var(--forest) 55%, transparent)`
once. The plan already mandates that the phase-5 census test EXCLUDE `*.test.ts`/`*.test.tsx`
under `blocks/`; that exclusion is now load-bearing — without it the hue-150 anchor reads 13
instead of 11. Confirmed empirically: 13 with the test file included, 11 without.

### Known-and-accepted forest deltas from this phase

All pre-ruled in the plan's AC #4 scope: three shadow tints move `0.30 0.04 158` → `--forest`
`0.325 0.045 158` (Hero `:316` ×2, Pricing `:238`); two lime hovers drop chroma 0.185 → 0.176
(Hero `:336`, CTA `:113`); two hue-140 sites collapse onto `--on-dark` (CTA `:108`
`0.86 0.025 140` → `0.840 0.022 140`; CTA `:118` per judgment call 1). The Hero `.tp-ph` hatch
(`:308`) is value-exact under forest (`0.325 0.045 158` = `--forest`).

### What is NOT verified — outstanding, and it matters

I have no browser and ran no dev server. **I make no visual claim whatsoever.** The parity test
proves the two SOURCES agree; it cannot prove either of them RENDERS correctly. Specifically
outstanding for the founder/human gate:

- **Hero and CTA in the editor vs their published render, side by side, under harbor** — must be
  identical colour. (Source parity is now machine-enforced; the rendered comparison is not.)
- **The Hero band hatch must read as a faint band tint** — green-tinted under forest,
  navy-tinted under harbor — and **NOT lime**. This is the specific confusion the plan warned
  about; nothing automated can distinguish "faint forest hatch" from "lime stripe" on screen.
- The `color-mix(…, transparent)` premultiplied-alpha behaviour (5 of this phase's sites) and the
  `color-mix(…, black)` powerless-hue carry (2 sites: Hero `:336`, CTA `:113`) — both flagged
  unverified since phase 2 and still unverified. A wrong engine result renders wrong while
  type-checking and unit-testing green.
- Pricing's `.tp-pcard--mid` shadow under both palettes.
- No `/dev/seed-techpremium` hit, no DB touched, `npm run build` not run (orchestrator, after
  phase 5). Phase 5 not started.

### Open risks

- **Incidental working-tree entry (recurrence of phase 1's):**
  `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` shows as
  modified after `npm run test:run`. `git diff --numstat` reports **zero changed lines** — vitest
  rewrote it with LF endings only. Not authored by me and not revertible without `git checkout --`,
  a state-changing git command I am not permitted to run. Safe to discard.
- The four remaining hue-158/159/140/128 clusters (15 literals) still render stale-green under
  harbor until phase 5 lands. Expected.
