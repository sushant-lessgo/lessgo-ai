# F3 — Registry-level block-variant dispatch (audit)

Branch: `fix/qa-quick-fixes`. Fixes finding **F3 · P0** from `reports/scale-1-10-findings.md`.

## Files changed

Barrels (added 3rd `layoutName?: string` param, forward to inner resolver):
- `src/modules/templates/meridian/index.ts`
- `src/modules/templates/vestria/index.ts`
- `src/modules/templates/hearth/index.ts`
- `src/modules/templates/lex/index.ts`
- `src/modules/templates/surge/index.ts`
- `src/modules/templates/granth/index.ts`
- `src/modules/templates/lumen/index.ts`
- `src/modules/templates/techpremium/index.ts`

Inner resolvers (added 3rd param so the barrel can forward it — see below):
- `src/modules/templates/vestria/resolveVestriaBlock.ts`
- `src/modules/templates/surge/resolveServiceBlock.ts`
- `src/modules/templates/lex/resolveServiceBlock.ts`
- `src/modules/templates/granth/resolveGranthBlock.ts`
- `src/modules/templates/lumen/resolveLumenBlock.ts`
- `src/modules/templates/techpremium/resolveTechPremiumBlock.ts`

New test:
- `src/modules/templates/__tests__/barrelDispatch.test.ts`

## What changed

- Every template barrel's `resolveBlock` now declares `(blockType, mode, layoutName?)`
  and passes `layoutName` through to its inner resolver. Previously all 8 barrels took
  only 2 params, silently discarding the stored variant name — so registry-level variant
  dispatch (`componentRegistry.ts:71`, `componentRegistry.published.ts:53`) was dead.
- `resolveMeridianBlock` and `resolveServiceBlock` (hearth) already accepted `layoutName`
  and dispatch on it via their variant-keyed registry — no resolver change needed for
  those two; only the barrels were dropping the arg.
- The other 6 inner resolvers (vestria, surge, lex, granth, lumen, techpremium) had only
  a 2-arg signature, so forwarding a 3rd arg from the barrel would have been a tsc error.
  They were given a 3rd `_layoutName?: string` param.

## Inner resolvers that needed threading

vestria, surge, lex, granth, lumen, techpremium. Each uses a **flat** `Record<string, BlockEntry>`
registry — exactly one block per section type, no variant map. There is nothing to dispatch
`layoutName` to: the templates with in-section variants (vestria hero, surge testimonials) do
their variant switching via `internalDispatch` inside the component, which re-reads
`content[id].layout` itself. So for these 6 the param is accepted for TemplateModule-contract
parity and intentionally ignored (named `_layoutName`, with an eslint-disable for the unused
var and an inline comment). Only meridian (and, in future, hearth) actually reads `layoutName`
in its resolver today.

## Deviations from the plan

- The plan named only the 8 barrels + a test. Threading the param into the 6 flat inner
  resolvers was required to keep the forwarded call type-correct (the plan explicitly
  anticipated this: "if any inner resolver doesn't accept layoutName, thread it through
  minimally"). Chose the conservative minimal form: accept-and-ignore, no behavior change,
  since these templates have no registry variant map. All 6 are on the plan's Files-touched
  list (the 8 template dirs).

## Tests

- New `barrelDispatch.test.ts` (4 tests): goes through the meridian **barrel** `resolveBlock`
  (not the inner resolver) and asserts a stored variant name (`LedgerFeatureList`) resolves to
  the variant component — edit and published — and differs from the section default, plus the
  A1 fallback for absent/foreign layout names.
- `npx vitest run barrelDispatch.test.ts dispatch.test.ts` → 18 passed.
- `npx vitest run renderParity.meridian.test.tsx` → 26 passed.
- `npx tsc --noEmit` → clean.

## Open risks

- Only meridian ships multiple registry variants today, so it is the only template whose fix
  is behaviorally observable now. The 6 flat resolvers are unchanged in behavior; if a future
  template adds a variant map, its resolver must be updated to read `_layoutName` (rename +
  dispatch) — the barrel already forwards it.
- Did not run the full suite (per instructions; parallel agents on disjoint files).
