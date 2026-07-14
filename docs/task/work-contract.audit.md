# work-contract — implementation audit

## Phase 1 — work-core section freeze + work element contract

**Status: BLOCKED at verification by an out-of-scope test collision (see below).**
Both in-scope edits are complete and tsc-clean.

### Files changed
- `src/modules/engines/workSections.ts` (NEW)
- `src/modules/engines/elementContracts.ts` (EDIT — register only)

### Per-file summary

**`src/modules/engines/workSections.ts` (NEW)** — pure-data freeze of the work-core.
Exports the must/optional section tuples + key unions, the 3 proof shapes + default,
the per-section element contract (15 entries, one per must+optional section), and the
proof-shape contract map (its `testimonials` entry IS the registered `proof` schema).
Donor sections (hero/about/proof/footer) re-seeded from `writerElementSchema` (granth)
via a lineage-preserving `fromDonor()` that blanks Hindi placeholder defaults; `work`
authored fresh as a group-REFERENCE gallery onto `COLLECTIONS.works` (no forked item
shape); `workdetail.sectionType` reuses `COLLECTIONS.works.itemSectionType` verbatim.
Header comment carries the freeze rationale, coverage-100 evidence counts, granth/lumen
donor table, the D1 subset invariant, and the D5 firewall note.

**Exact export list of `workSections.ts`:**
- `workMustSections` (readonly tuple, 8)
- `workOptionalSections` (readonly tuple, 7)
- `WorkMustSectionKey`, `WorkOptionalSectionKey`, `WorkSectionKey` (types)
- `workProofShapes` (readonly tuple, 3) · `WorkProofShape` (type) · `defaultWorkProofShape`
- `workProofShapeContracts: Record<WorkProofShape, UIBlockSchemaV2>`
- `workElementContract: Readonly<Record<string, UIBlockSchemaV2>>`

**`src/modules/engines/elementContracts.ts` (EDIT — register only)** — added
`import { workElementContract } from './workSections'`; added `work: workElementContract`
to the `elementContracts` map; updated the header "NOT covered" note to record that `work`
is now contract-covered as DATA (inert on the generation path, which stays thing-gated by
`resolveEngineSectionSchema`). Did NOT touch `THING_GENERATION_LAYOUTS`,
`resolveEngineSectionSchema`, `thingElementContract`, or any thing seeding.

### Deviations from the plan
- **Donor `work←books` mapping:** the plan lists `work←books` as a donor, but D4 also
  requires `work` to be a group-REFERENCE gallery with "no forked item shape". These
  conflict for the item collection (granth's `GranthJacketShelf.items` is a book-item
  shape). Conservative resolution: authored `work` fresh as a group-reference frame
  (`groups` collection: id/name/cover_image/href) pointing into `COLLECTIONS.works`, and
  did NOT reseed the book-item collection. Hero/about/proof/footer are reseeded from their
  granth donors as specified.

### VERIFICATION BLOCKER (out-of-scope file — reported, not edited)
`npm run test:run -- src/modules/engines src/modules/templates` → **1 failed / 1222 passed /
12 skipped.** The single failure is `src/modules/engines/designKit.test.ts:41`
("labels source per section: thing=contract, trust/work=legacy-layout"):

    AssertionError: expected 'contract' to be 'legacy-layout'

Root cause: `designKit.ts` is a SECOND consumer of `elementContracts` that the phase-1
plan did not account for (its "inert / zero behavior change" reasoning covered only
`resolveEngineSectionSchema`, which does stay thing-gated). `buildDesignKit('work')` walks
`engineCoreSections.work` (`hero·work·about·footer`) and, via `resolveSectionSchema`, now
finds a populated `elementContracts.work` for each → labels them `source: 'contract'`
instead of `'legacy-layout'`. This is the INTENDED consequence of registering the work
contract (the design-kit for work now derives from the real frozen contract, not granth's
legacy layout), so the correct fix is to update the stale test expectation
(`work → 'contract'`) — but `designKit.test.ts` is NOT on this phase's Files-touched list,
so I stopped rather than edit it.

**Orchestrator decision needed:** authorize a one-line expectation update in
`src/modules/engines/designKit.test.ts` (move `work` from the `legacy-layout` group to a
`contract` assertion), OR direct an alternative (e.g. gate the `work` registration).

### tsc
`npx tsc --noEmit` — no errors in touched files. (Pre-existing, unrelated repo error:
`src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — asset import,
outside this phase.)

### Open risks
- `elementContracts.work` is registered but inert on the generation path; confirm no other
  `elementContracts` consumers assume `work` absent (only designKit found so far).

---

## Phase 1 — RESOLUTION (blocker cleared, orchestrator-approved)

The orchestrator amended Phase 1's Files-touched to add `src/modules/engines/designKit.test.ts`
and confirmed `designKit.ts` is a pure build-time derivation generator (`npm run kit:generate`),
NOT in the runtime generation/render/publish path — so flipping work's design-kit source to
`contract` is the intended, designed behavior of registering `elementContracts.work`.

### Files changed (this resolution)
- `src/modules/engines/designKit.test.ts` (EDIT — test expectation update + one new mirror test)

**`designKit.test.ts`** —
1. `it('labels source per section: ...')`: renamed to "thing/work=contract, trust=legacy-layout";
   moved `work` from the `legacy-layout` assertion group to the `contract` group (thing+work loop
   asserts `'contract'`; trust asserts `'legacy-layout'`). Minimal, one-test change.
2. Added `it('work sections carry every slot from the LIVE work elementContract ...')` — a clean
   parallel to the existing thing derive-from-live test: for each work core-section, the kit's
   slot keys equal `getAllElements(elementContracts.work![sectionType])`. Passes as-is.

### Final verification (worktree, next-env.d.ts now present)
- `npx tsc --noEmit` — fully clean, no output.
- `npm run test:run -- src/modules/engines src/modules/templates` —
  **Test Files 31 passed (31) · Tests 1224 passed | 12 skipped (1236) · 0 failed.**
