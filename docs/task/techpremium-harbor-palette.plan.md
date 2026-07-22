# techpremium `harbor` palette — plan (rev 5, final — post review iteration 3)

WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\techpremium-harbor-palette`
Branch: `feature/techpremium-harbor-palette` (verify `git branch --show-current` before every phase; HARD-STOP on mismatch)
Tier: full (per-phase impl-review, both loops live)

All paths below are relative to WORKDIR.

## Overview

Add a second techpremium palette, `harbor` (navy bands hue 252 + brand-green signal + cool
hue-240 neutrals, values from the designer's `brand-palette` style block), as a real palette
record, and make the palette genuinely switchable by (a) widening the palette config to carry
neutrals/`--teal*`/`--ok*` plus two new `--on-dark`/`--on-dark-2` tokens, and (b) tokenising the
51 band-family block literals + the 7 `--lime`-derived literals (58 in-scope total). `harbor`
becomes the template default; `forest` stays value-identical at the token layer and is the
revert lever.

**Delivery reach — stated accurately for the slice-1 gate:** techpremium is `retired`
(`templateMeta.ts:230-235`; `fit.ts:46` short-circuits on it; `serveGate.ts:256-259` only serves
from the fit-filtered shortlist; `useWizardStore.ts:789` defaults to `'meridian'`; the
`input.templateId === 'techpremium'` branch at `thing.ts:721-748` is DEAD CODE; no `/dev` route
or picker entry existed before this plan). So **no new techpremium projects are creatable, and
the default flip currently reaches essentially nothing.** Harbor's delivery to any real project
requires either a `Project.paletteId` write or un-retiring the template — BOTH explicitly out of
scope this run, BOTH deferred to the separate republish decision.

**Manual-pass prerequisite (every founder/implementer dev check in this plan):** obtain a
techpremium project via the phase-1 dev-only seed route — `GET /dev/seed-techpremium` →
redirects to `/edit/[token]`.

**FOUNDER RULING (2026-07-22) — delivery is OUT OF SCOPE.** This run does **NO production/real
DB write, NO migration, NO admin script, NO backfill, NO picker entry**. Existing rows (incl.
Naayom's, which stores `'forest'` literally) keep forest. That is ACCEPTED — how `harbor`
reaches Naayom rides with the separate republish decision. **No implementer may "helpfully" add
a row write, a backfill, or a picker to close that gap.** (The phase-1 dev seed route writes
ONLY to the local dev DB and is NOT this banned write — see phase 1.)

**Picker exposure — ORCHESTRATOR RULING (encoded, not open):** `VestriaThemePopover` DOES render
for techpremium (`types/service.ts:83 PRODUCT_TEMPLATE_MODULE_IDS` → `EditHeader.tsx:75-76`; the
popover's own comment at `VestriaThemePopover.tsx:103-104` says retired techpremium still gets
variant/palette), and its grid reads `palettesForTemplate()` → `PALETTES_BY_TEMPLATE.techpremium`
= the FULL raw tuple → one `DesignSwatch` per id → `handlePalette` (`:143-148`) →
`updateMeta({paletteId})` + `triggerAutoSave()` → **writes `Project.paletteId`**. Adding `harbor`
naively puts a clickable second swatch one click from the row we must not touch. Fix (phase 1,
layer-clean form per review iter-2): declare **`techPremiumPickerPalettes = ['forest'] as const`
in `types/product.ts`** next to `techPremiumPalettes`; `palettes.ts` re-exports it as
`pilotEnabledPalettes`; `PALETTES_BY_TEMPLATE.techpremium` points at the types-level const —
same load-bearing effect (popover keeps showing exactly one `forest` swatch), no types→modules
layer inversion. Accepted consequence: a newly-seeded harbor project sees only a `forest`
swatch — that doubles as a manual revert lever, which is fine. The guard test asserts the REAL
source (`palettesForTemplate('techpremium')`), not a dead export.

**ORCHESTRATOR RULINGS on the former open questions (decided — do not re-open):**
1. **`--on-dark` values are ruled** (they are OUR tokens, introduced to kill the hue-140 drift;
   the designer's brand-palette block has no on-dark entry). Harbor derives from the designer's
   cool-neutral family, hue 240 — NOT the legacy hue 140. Forest carries today's two dominant
   hue-140 values verbatim. Exact values in phase 1 step 2; alpha variants come from
   `color-mix(… var(--on-dark) N%, transparent)` at the call sites, so the 12 drifted values
   collapse to 2 tokens × alphas.
2. **`imageKeywords.ts` harbor entry:** mirror the STRUCTURE and phrasing register of the
   existing `forest` entry (read it, match its shape — do not invent a different format);
   content reads navy/marine/cool-blue-industrial rather than green/forest; one line. Low-stakes
   string — it is in the plan only because the `Record<TechPremiumPalette, string>` type makes a
   missing entry a compile error.
3. **`--ok` ≈ `--lime` collision in harbor is NOT ours to fix.** Both values come verbatim from
   the designer's authoritative `<style id="brand-palette">` block (the spec's source of truth).
   Keep both exactly as delivered. Recorded as a founder-gate OBSERVATION at phase 5, not a plan
   decision — if the founder dislikes it at the taste-pick, that's a designer follow-up, out of
   scope here.

**AC #4 scope, stated honestly for both founder gates:** "forest byte-identical" covers **token
output only** (every pre-existing var resolves to its exact pre-change string). After slice 2,
forest's **rendered page** changes at ~58 sites via already-ruled below-JND collapses: 12
drifted hue-140 values collapse to 2 tokens; `0.30 0.04 158` shadow tints → `--forest`
(0.325 0.045 158); `0.34 0.045 158` footer panel → `--forest`; `.tp-ph.on-dark` stripe kept at
7% for both palettes (designer wanted 8% for harbor); **and the 95%/black lime-hover mix drops
chroma 0.185 → 0.176 on forest's hover at 6 sites**. All ruled and not in question — but the
gates are informed of the complete list up front, not obliquely.

Derivation rule: `color-mix(in oklch, …)` ONLY. Relative-colour `oklch(from …)` syntax is
BANNED. Browser-support note (recorded once, so the constraint isn't unbacked): `color-mix()`
and `oklch()` share essentially the same support baseline, and the template already ships raw
`oklch()` on published pages. Scope-out: hue 150 (×11), 192 (×2), 95 (×4) literals untouched;
**every per-file count below is the IN-SCOPE count**, with scope-out lines named so no
implementer tokenises them and breaks the phase-5 census.

**End of pipeline:** `npm run build` is run by the ORCHESTRATOR after phase 5, not per-phase.
Note: `scripts/buildPublishedCSS.js:26-43` deliberately excludes `templates/**`, so these
colours ship inline in the rendered HTML and need no CSS rebuild — dev-only visual verification
per phase is sound. (The track doc's literal-count correction is handled by the orchestrator in
the main working dir at the merge gate — the doc is untracked and absent from this worktree; it
is deliberately NOT in any phase's Files touched and not referenced by any step.)

## Progress log

- phase 1 slice 1 — guard test + palette record + harbor + default flip + popover gate + dev seed: **done** (commit `ab3dcd1f`, review loops 1, verdict ship). Guard mutation-proven RED-then-GREEN by BOTH implementer and reviewer (3 independent mutations incl. picker-gate). Blocker fixed: assertion 6 flaked at 5927ms vs vitest's 5000ms default under full-suite load → explicit `30_000` timeout; 3 consecutive full-suite runs green (5092 passed). forest value-identity + all 19 harbor values verified against `git show HEAD` / designer table. Seed route: prod-404 first statement, no `paletteId` in either branch. **AWAITING SLICE-1 HUMAN GATE.**
- phase 2 slice 2 B1 — shared/sharedStyles.ts: **done** (commit `46bdfcfb`, review loops 0, verdict ship). 10 in-scope literals tokenised; all 6 canonical strings byte-verified against plan text (phases 3-5 may paste them). Scope-outs `:17`/`:19`/`:45` byte-unchanged — file now contributes 0 to hues 158/159/140/128, keeps 2/1 to the 150/192 census anchors. Reviewer re-derived all 10: `:11` bg midpoint lands on designer harbor 0.289/0.045/252.5; `:43` holds hue 157 under harbor (no teal drift); `:74`/`:81` inner mix = 0.1989/0.02964/159. tsc 0 errors; test:run 316 files / 5092 tests passed. **Founder empirical checks still outstanding** (stripe green / hover green-not-grey).
- phase 3 slice 2 B2 — Footer family: **done** (commit `22737e9e`, review loops 0, verdict ship). 7 in-scope in `footerStyles.ts` (shared by BOTH renderers) + 10 `EDIT_EXTRA` editor-chrome literals; `TechPremiumFooter.published.tsx` untouched by design (0 literals, imports `FOOTER_STYLES`). Reviewer proved pure-substitution by REVERSING each changed line through the substitution table → byte-exact HEAD on all 17, confirming no selector/markup drift and every `N%` = original alpha. Cross-phase byte-identity verified: one spelling per distinct value across all 3 files touched so far. CRLF restore clean (53/263 CRLF, 0 bare-LF; per-line diff exactly the 7+10 intended). Census anchors already at target 150×11/192×2/95×4. Arithmetic: 10+17+31 remaining = 58 in-scope total. tsc 0; test:run 316/5092.
- phase 4 slice 2 B3 — dual-renderer inline pairs + parity test: **done** (commit `cb4a0b0b`, review loops 0, verdict ship). Hero 4+4, CTA 3+3, Pricing 1+1 = 16 in-scope, edited pair-by-pair in lockstep. `renderParity.test.ts` added: paren-balanced extraction, per-pair multiset equality, per-file non-emptiness. **Mutation-proven RED 4× total** — implementer (CTA pct-tail 82→55%) + reviewer independently in 3 DIFFERENT pairs (Hero pct-tail, Pricing sub-pct 50→50.5%, Results `/0.30`→`/0.31` proving the read-only 4th pair is covered); all reverted byte-exact (sha256). Reviewer wrote its OWN extractor (char-scan, different algorithm) and confirmed all 4 pairs equal by hand. Forest-vs-lime trap held: `var(--lime) 7%` = 0 hits in phase-4 files, lime stripe still solely `sharedStyles.ts:11`. tsc 0; test:run 317 files / 5097 tests (+1/+5 real).
  - **CARRY TO PHASE 5:** `*.test.ts(x)` census exclusion is now LOAD-BEARING — hue-150 reads **13** including test files, **11** excluding. `renderParity.test.ts` also has doc-comment `oklch(…)` tokens a naive parser reads as hue `undefined`. Remaining in-scope for phase 5: 158×6, 159×4, 140×4, 128×1 = **15**.
  - Known residual (accepted): parity test compares file-wide multisets, not per-declaration — a positional SWAP between two declarations across renderers would compare equal. Value-divergence class fully covered.
  - Not ours, pre-existing: `src/hooks/useWizardStore.b8.test.ts` flaked at 6061ms vs 5000ms default on one full run (passes 3.01s isolated); branch touches no `src/hooks` file. Same class as phase 1's fix.
- phase 5 slice 2 B4+B5 — remaining single-source modules + literal census test: pending

## Canonical replacement strings (byte-identical at every site — no invention allowed)

- hue-128 hover fill (target `oklch(0.815 0.185 128)`, 6 sites):
  **`color-mix(in oklch, var(--lime) 95%, black)`** — black is achromatic ⇒ powerless hue ⇒ the
  `--lime` hue is carried exactly (forest → L 0.812/C 0.176/H 128; harbor → L 0.684/C 0.124/H 157).
  The earlier `88% --forest-d` form is WRONG (hue-shifts 11.5° toward teal under harbor) — do not
  use it anywhere. **Scout §G's hue-128 row still carries that banned `88% var(--forest-d)`
  form — it is SUPERSEDED by this canonical string.**
- hue-128 stripe (`--lime` @ 7%, **1 site — `sharedStyles.ts:11`, the `.tp-ph.on-dark` rule
  ONLY**): **`color-mix(in oklch, var(--lime) 7%, transparent)`**
  (7 limes total = 6 hover + this 1 stripe. Hero's inline `.tp-ph` is NOT this — see the
  base-hatch entry below and phase 4.)
- base `.tp-ph` hatch `oklch(0.325 0.045 158 / 0.055)` (scout §G row 1, n=3 —
  `sharedStyles.ts:8` + the Hero inline pair `TechPremiumHero.tsx:308` / `.published.tsx:128`):
  **`color-mix(in oklch, var(--forest) 5.5%, transparent)`**
- lightbox scrim `oklch(0.20 0.03 159 / 0.92)` (2 sites — `sharedStyles.ts:74`,
  `ProductDetail/styles.ts:80`):
  **`color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 92%, transparent)`**
  (reproduces L 0.199 / C 0.030 / H 159 @ α 0.92)
- scrim `oklch(0.20 0.03 159 / 0.6)` (2 sites — `sharedStyles.ts:81`, `ProductDetail/styles.ts:87`):
  **`color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 60%, transparent)`**
  (same inner mix at 60%)
- hue-140 on-dark sites (RULED): **`color-mix(in oklch, var(--on-dark) N%, transparent)`** at
  each site's ORIGINAL alpha (`var(--on-dark-2)` for the opaque tag cluster) — this is how the
  12 drifted hue-140 values collapse to 2 tokens × alphas.
- All other band-family forms per scout §G verbatim (EXCEPT the superseded 128 row above):
  `--forest`/`--forest-d` mixes for 158/159,
  `color-mix(in oklch, var(--forest) 50%, var(--forest-d))` for the 0.285/0.288 midpoints,
  `var(--forest)` for `0.34 0.045 158`.

---

## Slice 1 — tokens/palette record only (ends in the decision gate)

### Phase 1 — guard test (baseline from untouched code) + widen config + `harbor` + default flip + popover gate + dev seed route

**Goal:** freeze today's forest token output as a regression test, then land the full palette
record + default flip + the popover exposure fix + the dev seed route that makes every manual
verification in this plan performable. Zero block-literal work — the page renders navy-banded
with ~58 stale literals, expected at this stage.

**Step 0 — baseline capture (BEFORE any other edit in this phase):**
- The "captured on untouched code" property stays verifiable after the fold-in via
  `git show HEAD:src/modules/templates/techpremium/tokens.ts` (and `palettes.ts`) — the reviewer
  diffs the baseline literal against HEAD, not the working tree.
- Dump mechanics: `npx tsx` will NOT resolve the `@/` alias (`palettes.ts:12`). Instead put a
  throwaway `it('dump', …)` inside the new vitest file (vitest resolves aliases), print
  `serializeBaseTokens()` and `serializePaletteOverrides()`, copy the output, delete the dump test.
- Parser rules (named, load-bearing): split each declaration on the **FIRST** colon only (font
  stacks contain colons); `:root` is emitted TWICE (`tokens.ts:157` re-opens it for `--blog-*`),
  so duplicate selectors must merge **last-wins**.
- Build the inline `EXPECTED_FOREST_CASCADE: Record<string, string>` literal covering every var
  emitted today (`--paper/-2/-3`, `--ink/-2/-3`, `--line/-2/-dk`, `--ok`, `--ok-bg`, `--warn`,
  `--warn-bg`, `--wa`, `--teal`, `--teal-dim`, `--forest/-d/-2`, `--lime/-d/-dim`, fonts,
  spacing, radius, `--blog-*`) with exact byte values.

**Why value-map, not raw-string snapshot:** values are being relocated between
`serializeBaseTokens()` and `serializePaletteOverrides()`, and new `--on-dark*` vars are ADDED —
a raw byte-snapshot of either string cannot survive that. Only the combined computed cascade
must stay stable: parse both outputs into `{selector → {var → value}}`, overlay
`[data-palette="forest"]` on `:root`, assert every baseline var strictly equals its baseline
string. New vars are additive and do not trip it.

**Guard test — `src/modules/templates/techpremium/palettes.test.ts` asserts:**
1. Forest effective cascade: every `EXPECTED_FOREST_CASCADE` entry byte-exact.
2. **`palettesForTemplate('techpremium')` deep-equals `['forest']`** — the REAL picker source
   (`src/types/service.ts`), made true by step 4's rewire. NOT an assertion on
   `pilotEnabledPalettes` alone (inert until wired — zero importers today).
3. `defaultTechPremiumPalette === 'harbor'`; a `[data-palette="harbor"]` block exists;
   spot-check 4-5 harbor values (`--forest`, `--paper`, `--lime`, `--on-dark`).
4. **Emission order.** The override works by ORDER, not specificity: `:root` and
   `[data-palette="x"]` are both (0,1,0); harbor only wins because both injectors emit
   base-then-palette (`ThemeInjector.tsx:31`, `TechPremiumSSRTokens.tsx:30`; precedent
   documented at `vestria/tokens.ts:212`). Phase 1 makes 13 more vars depend on this — so the
   test reads both injector sources via `fs` and asserts the `serializeBaseTokens()` call site
   precedes `serializePaletteOverrides()` in each composition.
5. Containment: today's non-var rules (`[data-surface=…]` blocks, `[data-palette] em`) still
   appear in `serializeBaseTokens()` output.
6. **Registry follows the default:** the techpremium registry entry's `defaultPaletteId`
   (`registry.ts:78` maps `m.defaultTechPremiumPalette`) resolves to `'harbor'`.
7. **Dead-value hazard guard:** after this phase, both palettes override all 13 neutrals, so
   editing `techPremiumBaseTokens` has NO rendered effect — and the cascade guard (which reads
   the overlay) would not catch drift between the `:root` fallback and the forest record. One
   assertion: every relocated `:root` fallback value equals the forest record's value for the
   same var. **Inert-test guard on the guard:** the comparison needs a camelCase→`--kebab`
   mapping; a broken mapping yields an empty comparison set that passes green — so ALSO assert
   `expect(compared.length).toBe(19)` (13 neutrals/teal/ok + 6 accents).

**Steps (after step 0):**
1. `src/types/product.ts:52-62` — `techPremiumPalettes = ['forest', 'harbor'] as const`;
   `defaultTechPremiumPalette = 'harbor'`; **NEW `techPremiumPickerPalettes = ['forest'] as
   const`** next to the tuple (types-level, avoids a types→modules import).
2. `src/modules/templates/techpremium/palettes.ts` — widen `TechPremiumPaletteConfig` to the
   existing 6 + `paper, paper2, paper3, ink, ink2, ink3, line, line2, lineDk, teal, tealDim,
   ok, okBg` + NEW `onDark, onDark2`; extend `paletteBlock()` to emit all of them.
   - `forest` record: today's base-token values **verbatim** (copied from `tokens.ts`), existing
     6 accents unchanged, plus **RULED on-dark values — today's two dominant hue-140 values
     verbatim**, so forest's appearance is preserved at the sites that already used them and the
     collapse only moves the drifted outliers:
     `onDark: 'oklch(0.840 0.022 140)'`, `onDark2: 'oklch(0.780 0.030 140)'`.
   - `harbor` record from the spec's authoritative designer table:
     `paper oklch(0.985 0.0015 240)`, `paper2 oklch(0.963 0.003 240)`, `paper3 oklch(0.938 0.005 240)`,
     `ink oklch(0.305 0.010 230)`, `ink2 oklch(0.470 0.008 230)`, `ink3 oklch(0.645 0.004 220)`,
     `line oklch(0.900 0.004 240)`, `line2 oklch(0.820 0.006 240)`, `lineDk oklch(0.470 0.045 250)`,
     `forest oklch(0.320 0.048 252)`, `forestD oklch(0.258 0.042 253)`, `forest2 oklch(0.455 0.085 156)`,
     `lime oklch(0.720 0.130 157)`, `limeD oklch(0.520 0.105 155)`, `limeDim oklch(0.720 0.130 157 / 0.16)`,
     `teal oklch(0.620 0.075 244)`, `tealDim oklch(0.620 0.075 244 / 0.14)`,
     `ok oklch(0.660 0.120 152)`, `okBg oklch(0.660 0.120 152 / 0.14)`,
     plus **RULED on-dark values — designer cool-neutral family, hue 240, NOT legacy 140**:
     `onDark: 'oklch(0.840 0.020 240)'`, `onDark2: 'oklch(0.780 0.028 240)'`.
     (`--ok`/`--lime` kept exactly as delivered per ruling 3 — do not "fix" their proximity.)
   - `pilotEnabledPalettes` becomes a **re-export of `techPremiumPickerPalettes`** from
     `types/product.ts` — still `['forest']`, harbor deliberately picker-hidden; comment says so.
   - **Update the stale header comment** ("TechPremium ships a SINGLE palette ('forest')") — now
     two palettes, one picker-exposed.
3. `src/modules/templates/techpremium/tokens.ts` — **keep `:root` emission unchanged.** This
   deliberately OVERRULES the spec's "values moving into the palette record must stop being
   emitted as palette-invariant `:root`" — retention is the safety fallback and keeps the guard
   satisfiable. Only ADD `:root` fallbacks `--on-dark`/`--on-dark-2` with the forest values.
   Add TWO code comments: (a) the palette override wins by **emission order** (base before
   palette), NOT specificity — cite `vestria/tokens.ts:212`; (b) **dead-value hazard** — both
   palettes now override the neutrals, so these `:root` values are fallback-only; keep them in
   sync with the forest record (guard assertion 7 enforces it).
4. `src/types/service.ts` — `PALETTES_BY_TEMPLATE.techpremium` → `techPremiumPickerPalettes`
   (types-level const, NOT the raw tuple, NOT a modules import). Popover keeps showing exactly
   one `forest` swatch. **Update the stale `:362` comment** ("TechPremium → forest").
5. `src/modules/templates/techpremium/imageKeywords.ts:8` — add the required `harbor` entry
   (`Record<TechPremiumPalette, string>` is a compile error until present). **RULED form:**
   mirror the STRUCTURE and phrasing register of the existing `forest` entry
   (`'industrial IoT hardware install warm natural light'`) — same shape, one line, content
   shifted navy/marine/cool-blue-industrial, e.g.
   `harbor: 'industrial IoT hardware install cool marine daylight'`.
6. **Dev seed route (RULED — enabling infrastructure for the spec's own ACs, not scope creep):**
   create `src/app/dev/seed-techpremium/route.ts`, mirroring the existing precedent at
   `src/app/dev/seed-lumen/route.ts` (read it and follow its shape, gating, and response
   format). Simplest faithful mirror: accept `?token=…`, `prisma.token.upsert`,
   `prisma.project.upsert`, `NextResponse.redirect('/edit/{token}')`. The content builder
   already exists — `buildTechPremiumHomeFinalContent` at `src/hooks/editStore/archetypes.ts:260`
   (direct analogue of `buildLumenHomeFinalContent`). Hard requirements:
   - MUST hard-refuse when `process.env.NODE_ENV === 'production'`.
   - Writes ONLY to the local dev DB. This is **NOT** the banned row write — that ruling is
     about Naayom's/production rows and remains in full force.
   - **MUST leave `paletteId` UNSET (near-critical):** `seed-lumen` writes `paletteId: 'brass'`
     and `thing.ts:736` writes the resolved default — a faithful mirror of EITHER writes the
     column, and a stored value beats `tmpl.defaultPaletteId` at `EditLayout.tsx:71`, which
     defeats the AC #8 flip-back verification entirely. Write `templateId: 'techpremium'`,
     `variantId: 'default'`, and **no `paletteId`**, so the default-resolution chain is what is
     actually under test.
   Security/routing recorded as verified-sound: `/dev/(.*)` is a public matcher and
   `src/middleware.ts:66-69` 404s it in production on top of the route's own `NODE_ENV` guard;
   `verifyProjectAccess` (`src/lib/security.ts:31`) allows orphan projects, so `userId: … ?? null`
   still opens `/edit/[token]` for a signed-in dev.
   Why required: techpremium is retired, so no creation path exists (`thing.ts:721-748` is dead
   code) — without this route, spec AC #8 ("switching the default back to `forest` restores
   today's look — **verified, not assumed**") and the "founder eyeball on `npm run dev`" AC are
   unachievable.
7. Finalize `palettes.test.ts` per the assertion list above.

**Files touched (7):**
- `src/modules/templates/techpremium/palettes.test.ts` (new)
- `src/types/product.ts`
- `src/types/service.ts`
- `src/modules/templates/techpremium/palettes.ts`
- `src/modules/templates/techpremium/tokens.ts`
- `src/modules/templates/techpremium/imageKeywords.ts`
- `src/app/dev/seed-techpremium/route.ts` (new)

**Verification:**
- `npx tsc --noEmit` green (proves the `imageKeywords` closed-fail is satisfied).
- `npm run test:run` green — forest cascade value-identical; `conformance.test.ts` /
  `templateMeta.test.ts` / `service.test.ts` stay green (scout: none assert palette count).
- Manual (`npm run dev`): `GET /dev/seed-techpremium` → `/edit/[token]`. Open the theme
  popover — exactly ONE `forest` swatch, no harbor. Devtools: toggle `data-palette` between
  `forest`/`harbor` on `<html>` (quick in-browser A/B — all palettes are emitted, the attribute
  selects) — forest = today's look exactly; harbor = navy bands + cool neutrals with ~58 stale
  green literals (expected).
- **Flip-back check (AC #8, performable via the seed route):** set
  `defaultTechPremiumPalette = 'forest'` locally (uncommitted), `GET /dev/seed-techpremium` for
  a FRESH project, confirm today's look end-to-end at `/edit/[token]`, revert the flip. Works
  ONLY because the seed leaves `paletteId` unset — the default-resolution chain is under test.
  (The unit assertion that `registry.ts:78 defaultPaletteId` follows `defaultTechPremiumPalette`
  backs the same mechanism deterministically.)
- Confirm the seed route hard-refuses under `NODE_ENV === 'production'` AND writes no
  `paletteId` (code inspection + reviewer check).

**HUMAN GATE — end of Slice 1 (decision gate):** founder eyeballs harbor direction on dev via
the seed route (the `--on-dark*` values are RULED, hue 240 — the gate confirms the rendered
result, it does not re-open the values), confirms the switch mechanism (devtools/default flip →
forest restores today's look), confirms the popover shows forest-only, and confirms no
production DB write is needed. The founder is also informed that delivery reaches essentially
nothing while techpremium stays retired (see Overview).
**Gate note (cosmetic, so it isn't reported as a bug):** `VestriaThemePopover.tsx:118` computes
`activePalette = paletteId || tmpl?.defaultPaletteId || palettes[0]` → `'harbor'`, which is not
in the one-swatch grid — so a harbor project shows **no** highlighted swatch. Harmless; clicking
the forest swatch remains the intended manual revert lever.
If the record can't carry the neutrals cleanly, stop and re-decide before touching block files.

---

## Slice 2 — block literals (risk-ordered per scout B1-B5)

Common rules for phases 2-5:
- Use ONLY the canonical replacement strings above + scout §G forms (128 row superseded).
  Byte-identical strings at every site sharing a value.
- **In-scope counts only** — hue 150/192/95 literals in the same files are LEFT ALONE (scope-out
  lines named per phase); touching them breaks the phase-5 census.
- The forest guard runs every phase via `test:run`.
- Manual checks use a seeded project: `GET /dev/seed-techpremium` → `/edit/[token]`.
- After each phase: devtools-toggle `data-palette` forest↔harbor on an affected section — both
  coherent (forest ≈ today within the ruled JND collapses; harbor fully navy in touched blocks).

### Phase 2 — B1: shared foundation (`sharedStyles.ts`, 10 in-scope)

**Goal:** highest-leverage single-source file; fixes `.tp-ph`, `.tp-lede`, pills, buttons,
lightbox for 5+ consuming blocks at once (scout §H: single source, both renderers consume the
classes — parity-safe by construction).

**Steps:**
1. Tokenise the 10 in-scope literals. **Scope-out lines (do NOT touch): `:17`, `:45` (hue 150),
   `:19` (hue 192).** Key sites (the mandate remains ALL 10 in-scope, not just these):
   - base `.tp-ph` hatch (`:8`) → canonical
     `color-mix(in oklch, var(--forest) 5.5%, transparent)`.
   - `.tp-ph.on-dark` (`:11-12`): bg → `color-mix(in oklch, var(--forest) 50%, var(--forest-d))`
     (matches designer's harbor 0.288/252 midpoint AND forest's 0.285/159 midpoint); stripe →
     canonical 7% lime string (`:11` is the ONLY lime-stripe site in the codebase).
   - `.tp-btn2.lime:hover` (`:43`) → canonical `color-mix(in oklch, var(--lime) 95%, black)`.
   - Lightbox scrims (`:74`, `:81`) → the two canonical nested-mix strings (92% / 60%);
     lightbox caption `.tp-lb-cap` (`:79`) → `--on-dark` @ its original 0.8 alpha.
   - `.tp-lede` (`:35`), tags, shadow tints per §G (`--on-dark*` @ original per-site alphas via
     the canonical `color-mix(… var(--on-dark) N%, transparent)` form; forest mixes for shadows).
2. Colour values only — no selector/markup changes.

**Files touched (1):**
- `src/modules/templates/techpremium/blocks/shared/sharedStyles.ts`

**Verification:** `tsc` + `test:run` green (guard holds). **Empirical checks (required — BOTH
derivation mechanisms land in this phase, verify both):**
- `color-mix(…, transparent)` relies on premultiplied alpha — verify the `.tp-ph` stripe still
  reads GREEN under forest in dev (a wrong engine result = every band tint pink).
- `color-mix(in oklch, var(--lime) 95%, black)` relies on powerless-hue carry (C=0 ⇒ hue
  missing) — verify the `.tp-btn2.lime:hover` fill still reads GREEN, not grey/olive, under
  forest (free coverage of the riskier form).
Manual: eyeball Explainer/Contact/Gallery/GalleryPreview under both palettes; one
`/preview`/published-render glance (both renderers import this module — structural parity).

### Phase 3 — B2: Footer family (7 + 10 in-scope)

**Goal:** two conceptually separate edits: `footerStyles.ts` (**7** in-scope of 9 — scope-out
`:46`, `:47` (hue 150); consumed by BOTH renderers — the real visual surface) and
`TechPremiumFooter.tsx` `EDIT_EXTRA` (`:236-263`, 10 hue-140 literals, **editor-only chrome**:
remove buttons, add-link chips, newsletter setup). Scout correction to spec: the 10-vs-0
asymmetry is NOT a parity risk — `.published.tsx:13` imports `FOOTER_STYLES` and carries no
literals. **Do NOT touch `TechPremiumFooter.published.tsx`.**

**Steps:**
1. `footerStyles.ts` — tokenise the 7 per §G (hue-140 cluster → `--on-dark` @ original alphas;
   `0.34 0.045 158` panel fill → `var(--forest)`).
2. `TechPremiumFooter.tsx` EDIT_EXTRA — recolour its 10 hue-140 literals with the same
   `--on-dark` forms so editor chrome doesn't look broken on navy.

**Files touched (2):**
- `src/modules/templates/techpremium/blocks/Footer/footerStyles.ts`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx`

**Verification:** `tsc` + `test:run` green. Manual: footer in editor under both palettes (incl.
EDIT_EXTRA affordances + hovers), plus footer in a published render to confirm `footerStyles.ts`
carried both renderers.

### Phase 4 — B3: dual-renderer inline pairs (parity-critical) + parity test

**Goal:** the symmetric pairs with in-scope literals:
- Hero **4+4** (scope-out `:301` / `:121`, hue 150). Includes the inline non-on-dark `.tp-ph`
  re-declaration at `TechPremiumHero.tsx:308` / `.published.tsx:128` — value
  `oklch(0.325 0.045 158 / 0.055)`, the SAME base-`.tp-ph` hatch as `sharedStyles.ts:8`,
  replaced with **`color-mix(in oklch, var(--forest) 5.5%, transparent)`** (scout §G row 1).
  It is **NOT** the 7% lime stripe (that exists only at `sharedStyles.ts:11`). A SEPARATE edit
  site from sharedStyles. `Hero.tsx:316` carries two literals on one line — count occurrences,
  not lines.
- CTA **3+3** (scope-out `:117` / `:61`, hue 150).
- Pricing **1+1**.
- **Testimonials/TechPremiumResults is 0+0 — its only literal is `oklch(0.66 0.15 150 / 0.30)`
  (scope-out). The pair MUST NOT be edited and is NOT in Files touched; the parity test only
  READS it.**

**Parity discipline (mandatory):** edit each pair in lockstep — same literal, same canonical
replacement string, both files, before moving to the next pair. After each pair, diff `.tsx` vs
`.published.tsx` colour literals and confirm identical sets.

**Steps:**
1. Tokenise pair by pair: Hero → CTA → Pricing. Hue-128 hover fills (`CTA.tsx:113` /
   `.published.tsx:57`, `Hero.tsx:336` / `.published.tsx:151`) → canonical
   `color-mix(in oklch, var(--lime) 95%, black)`.
2. **Deterministic parity guard (Vitest, this phase creates the surface):** add
   `src/modules/templates/techpremium/blocks/renderParity.test.ts` — for each of the 4 pairs
   (Hero, CTA, Pricing, Results — Results read-only), read both sources via `fs`, extract all
   `oklch(…)` and `color-mix(…)` expressions with **paren-balanced extraction** (a naive
   `/color-mix\([^)]*\)/` truncates at the first `)` and discards the percentage tail — a
   50%-vs-55% renderer split would compare EQUAL; alternatively compare whole declaration
   values), assert sorted multisets equal per pair, and assert **per-file non-emptiness**
   (`expect(found.length).toBeGreaterThan(0)`) so a broken extractor can't pass green.
   **Playwright judged NOT worth it:** the parity risk is source-value divergence, fully covered
   by the source scan; `e2e/render.spec.ts` already exercises the render pipeline. No new e2e.

**Files touched (7):**
- `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.tsx`
- `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.published.tsx`
- `src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.tsx`
- `src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.published.tsx`
- `src/modules/templates/techpremium/blocks/Pricing/TechPremiumPricing.tsx`
- `src/modules/templates/techpremium/blocks/Pricing/TechPremiumPricing.published.tsx`
- `src/modules/templates/techpremium/blocks/renderParity.test.ts` (new)

**Verification:** `tsc` + `test:run` green (guard + parity). Manual: Hero/CTA editor vs
published render side-by-side under harbor — identical colour; the Hero band hatch reads as a
faint band tint (forest: green-tinted; harbor: navy-tinted), NOT lime.

### Phase 5 — B4+B5: remaining single-source modules + literal census test

(Merged from the original B4/B5 split — all mechanical single-source style modules, no parity
risk, one census covers them. No gate lost.)

**Goal:** finish the mechanical remainder, lock the whole slice with a census test.

**In-scope counts + scope-out lines:**
- `ProductDetail/styles.ts` — **4** of 7 (scope-out `:21`, `:24`, `:25`, hue 95). The
  silent-duplicate trap: its lightbox **scrims** (`:80`, `:87`) duplicate `sharedStyles:74/:81`,
  and its lightbox **caption** (`:85`, `oklch(0.85 0.025 140 / 0.8)`) duplicates
  `sharedStyles:79` (`.tp-lb-cap`) — NOT a fresh derivation. **Ruling: NO dedupe/refactor** —
  paste the byte-identical canonical strings phase 2 used at all three sites (reviewer
  diff-checks they match).
- `Readout/TechPremiumReadout.tsx` — **2** of 4 (scope-out `:71` hue 150, `:73` hue 192). No
  `.published.tsx` by design — server-safe, imported by BOTH Compatibility renderers
  (`.tsx:11`, `.published.tsx:7`); single-source, no pair needed.
- `Header/navStyles.ts` — **1** of 2 (scope-out `:5`, hue 95); the 55%-alpha nav scrim per §G.
- `GalleryPreview/styles.ts` — **3** (incl. 2× opaque `--on-dark-2` tags).
- `Catalog/styles.ts`, `Contact/styles.ts`, `Gallery/styles.ts`, `Problem/styles.ts`,
  `Explainer/styles.ts` — **1 each** (Explainer's is the hue-128 hover → canonical
  `color-mix(in oklch, var(--lime) 95%, black)`).

In-scope grand total across slice 2: 10+7+10+8+6+2+4+2+1+3+5 = **58** = 51 band + 7 lime.

**Steps:**
1. Tokenise the above per §G + canonical strings.
2. **Census test:** add `src/modules/templates/techpremium/blocks/literalCensus.test.ts` — walk
   all `.ts`/`.tsx` under `blocks/` via `fs`, **EXCLUDING `*.test.ts`/`*.test.tsx`** (both new
   test files live under `blocks/` — a literal quoted in a test comment must not self-trip the
   zero-assertions or self-satisfy the anchor counts; inert-assertion risk), extract `oklch(…)`
   literals, parse the hue term, assert ZERO occurrences of hue 158/159/140/128, and assert hue
   150/192/95 counts equal the scout census — **11/2/4** — with a comment pointing at the spec
   scope-out (the non-zero anchors make future drift visible AND prove nobody tokenised
   scope-out lines).

**Files touched (10):**
- `src/modules/templates/techpremium/blocks/ProductDetail/styles.ts`
- `src/modules/templates/techpremium/blocks/Readout/TechPremiumReadout.tsx`
- `src/modules/templates/techpremium/blocks/Header/navStyles.ts`
- `src/modules/templates/techpremium/blocks/GalleryPreview/styles.ts`
- `src/modules/templates/techpremium/blocks/Catalog/styles.ts`
- `src/modules/templates/techpremium/blocks/Contact/styles.ts`
- `src/modules/templates/techpremium/blocks/Gallery/styles.ts`
- `src/modules/templates/techpremium/blocks/Problem/styles.ts`
- `src/modules/templates/techpremium/blocks/Explainer/styles.ts`
- `src/modules/templates/techpremium/blocks/literalCensus.test.ts` (new)

**Verification:** `tsc` + `test:run` green (guard + parity + census). Manual full pass on a
seeded project: `npm run dev`, every section under harbor (no green stragglers; ProductDetail
lightbox opened — scrim + caption; Compatibility readout), devtools-flip to forest — today's
look end-to-end. Then the orchestrator runs `npm run build` (end of pipeline) and hands the
track-doc literal-count correction to the founder in the main working dir at the merge gate.

**HUMAN GATE — founder taste-pick before merge (spec-named):** founder eyeballs the full harbor
page on `npm run dev` (seeded project → `/edit/[token]`) AND its published render, plus the
forest revert check (flip default to `forest`, fresh seeded project, confirm today's look, flip
back).
**Founder-gate OBSERVATIONS (informational — not decisions to make, not open questions):**
- The 11 hue-150 pill borders stay `oklch(0.66 0.15 150 / 0.30)` while `--ok` becomes harbor's
  `0.660 0.120 152` — small border/fill mismatch.
- Harbor's `--ok` sits very close to harbor's `--lime` (`0.720 0.130 157`) — status green and
  signal accent nearly collide. **RULED not ours to fix**: both values are verbatim from the
  designer's authoritative brand-palette block; kept exactly as delivered. If the founder
  dislikes it here, that's a designer follow-up, out of scope.
- Forest's lime hover chroma dips 0.185 → 0.176 at 6 sites (ruled below-JND, disclosed in AC #4
  scope above).
Republish of Naayom is explicitly NOT part of this gate.

---

## Unresolved questions

None — all former open questions are ruled and encoded above (`--on-dark*` values, image-keyword
phrase, `--ok`≈`--lime` collision, seed-route delivery reach, track-doc handoff).
