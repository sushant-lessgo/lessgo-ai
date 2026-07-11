# QA quick-fixes audit — F22 (P0) + F8 (P2)

Branch: `fix/qa-quick-fixes`

## Files changed
- `src/modules/audience/product/strategy/parseStrategyProduct.ts`
- `src/components/onboarding/wizard/StructureSlot.tsx`
- `src/modules/engines/inputContracts.ts`
- `src/hooks/useWizardStore.test.ts`
- `src/modules/audience/product/strategy/proofFilter.test.ts`

## F22 (P0) — add-page seed bypassed the proof filter
Root cause: the proof hard rule lived only inside `assembleProductStrategy`
(strategy path). The 7b gate's `addPage` seeded `def.defaultSections` verbatim,
and the addable-section chips came straight from `def.allowedSections`, so a
no-proof project could add a page (or chip) carrying `testimonials`. The
confirmed store sitemap then flows to generation verbatim (`thing.ts` runFanOut),
so the fabricated quotes appeared on the added page.

Fix:
- `parseStrategyProduct.ts`: exported `proofDroppedSections` and added the single
  shared helper `filterSectionsByProof(sections, proof)`. `assembleProductStrategy`
  now routes both its section list and each sitemap page through it (behavior
  identical to before).
- `StructureSlot.tsx`: reads `proof.hasTestimonials` from the wizard store (the
  same signal `thing.ts` feeds the strategy route) and runs `addPage` default
  sections AND the addable `allowedSections` chips through `filterSectionsByProof`.
  With testimonials OFF, neither the seeded page nor the chip list offers
  `testimonials`. Symmetric with the strategy path (both always apply the store's
  proof booleans).
- `proofFilter.test.ts`: added a `filterSectionsByProof (7b seed/add path)`
  block — proof off cuts testimonials from both `defaultSections` and
  `allowedSections`; proof on keeps it; empty proof object drops it.

## F8 (P2) — CTA removable at the 7b gate on the thing engine
Root cause: the gate's locked set comes from `lockedSectionsForEngine`, derived
from the FROZEN `engineCoreSections`. thing's core deliberately omits `cta`
(vestria's CTA is its `contact` lead-form, so cta can't be an engine-wide
guarantee), so meridian's single-page thing list left `cta` toggleable.

Fix (`inputContracts.ts`): `lockedSectionsForEngine` now appends `cta` for the
thing engine — NOT to `engineCoreSections` (which would break vestria's
engine-core conformance). Locking a not-present section is a no-op: the gate only
renders rows for sections in the list, `clampSectionList` only force-inserts a
locked section that exists in `canonical`, and `toggleStructureSection` only
guards sections already shown. So meridian's single-page CTA is now locked (Remove
disabled) like trust's; vestria (multipage, no cta section) is unaffected.
Updated the `lockedSectionsForEngine('thing')` expectation in
`useWizardStore.test.ts` to `['hero','features','cta']`.

## Deviations
- Task text said "add cta to the thing engine's required set". The literal
  required set is the frozen `engineCoreSections.thing`, which cannot take `cta`
  without un-shipping vestria (documented in `coreSections.ts`). Applied the lock
  at the gate-facing `lockedSectionsForEngine` instead — same user-visible effect
  (Remove disabled), frozen conformance set untouched. Logged here as the
  conservative in-scope choice.

## Test results
- `npx vitest run` on proofFilter, useWizardStore, inputContracts,
  structureConvergence, clampSitemap: 5 files, 119 tests, all pass.
- `npx tsc --noEmit`: clean.

## Open risks
- `StructureSlot` now imports `parseStrategyProduct` (pure-data chain, no
  server-only) — verified no `server-only` in the transitive imports, and
  `thing.ts` already imports it in the client wizard path.
- Defense-in-depth: generation still consumes the confirmed store sitemap
  verbatim; the fix prevents unpromised sections from ever entering the store, so
  no second filter at generation is added (kept in scope). If a future path writes
  the sitemap without going through `StructureSlot`, it would need the same guard.
