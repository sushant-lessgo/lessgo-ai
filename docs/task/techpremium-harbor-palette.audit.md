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
