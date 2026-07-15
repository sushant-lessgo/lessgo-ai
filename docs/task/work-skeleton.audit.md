# work-skeleton — audit

## Phase 1 — SLOT mechanism (scale-09 extension)

### Files changed
- `src/modules/templates/blockManifest.ts`
- `src/modules/templates/templateConformance.ts`
- `src/modules/generation/blockEligibility.ts`
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`
- `src/modules/generation/blockEligibility.test.ts`
- `src/modules/templates/swap.test.ts`

### Per-file summary
- **blockManifest.ts** — added `slot?: true` to `BlockDeclaration` (JSDoc: declared-but-not-built capability; INVARIANT never a default). Added 3 pure helpers next to the types: `builtVariants(set)`, `builtVariantCount(set)`, `defaultIsSlot(set)`. Pure data — safe for client-UI import.
- **templateConformance.ts** — imports `defaultIsSlot`. Added `if (variant.slot) continue;` in loop (c) (resolution+distinctness), `if (decl.slot) continue;` in the consumes⊆contract loop, `if (A.slot || B.slot) continue;` in the (e) copyShape both-ways consistency loop. Added new `describe` "a slot is NEVER a set default (INVARIANT)" asserting `defaultIsSlot(set) === false` per section.
- **blockEligibility.ts** — `isBlockEligible` returns `false` early when `decl.slot`. This is the single generation-side slot filter; `pickFromSet`/`selectEligibleBlock` ride on it. `spread.ts` untouched (per plan).
- **BlockVariantSelector.tsx** — imports `builtVariantCount`. `hasMultipleVariants` now uses `builtVariantCount(found.set) > 1`. `isVariantOffered` is now exported and returns `false` for a slot (checked before the escape hatch).
- **LayoutChangeModal.tsx** — imports `builtVariantCount`; the `set.variants.length <= 1` guard is now `builtVariantCount(found.set) <= 1`.
- **blockEligibility.test.ts** — added `describe('isBlockEligible — SLOT ...')`: slot never eligible (even with all signals), non-slot sibling unchanged, seeded pick never surfaces the slot, fallback to built default.
- **swap.test.ts** — added `describe('SLOT ...')` with synthetic fixtures: slot never offered by `isVariantOffered` (incl. before-escape-hatch), slot does not inflate `builtVariantCount`, `defaultIsSlot` flags a slot-as-default fixture and passes a valid one.

### Shared helper location
`builtVariants` / `builtVariantCount` / `defaultIsSlot` live in `src/modules/templates/blockManifest.ts` (pure-data module), imported by both editor-UI files, the conformance suite, and tests.

### Behaviour neutrality
No existing manifest declares `slot`, so `builtVariants` = all variants and every skip/filter is a no-op for current data. Confirmed green with zero re-baselining.

### Verification
- `npx tsc --noEmit`: clean for all touched files. ONE pre-existing, unrelated error remains: `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'` (image-module typing; file exists on disk, not in this phase's scope). Not introduced by this change.
- `npm run test:run` (full): `Test Files 181 passed | 1 skipped (182)` · `Tests 3003 passed | 18 skipped (3021)`.
- Targeted suites (eligibility + swap + conformance): `3 passed`, `568 passed | 12 skipped`.

### Deviations
- Exported `isVariantOffered` from `BlockVariantSelector.tsx` (was file-local) so `swap.test.ts` can assert the slot-never-offered behavior directly per the plan. In-scope file; additive export only.

### Open risks
- Pre-existing `page.tsx` image-import tsc error is orthogonal but means a bare `tsc --noEmit` is non-zero-exit; downstream phases should filter for their own files.
