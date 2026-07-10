# serve-gate-v2 — implementation audit

## Phase 1 — shared-block capability declaration (pure data + parity test)

**Files changed:**
- `src/modules/generatedLanding/sharedBlocks/capabilities.ts` (created)
- `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts` (created)
- `src/modules/generatedLanding/README.md` (edited)

### capabilities.ts
Pure-data module. Firewall header comment states: no React/component/registry imports;
imported by `fit.ts`. Only import is `capabilityIds` + `CapabilityId` type from
`@/types/brief`.
- `sharedBlockCapability: Record<string, CapabilityId | null>` = `{ leadform: 'lead-form',
  storebadges: 'store-badges', followstrip: null }`.
- `sharedBlockCapabilities: readonly CapabilityId[]` = non-null values, deduped, derived
  via `capabilityIds.filter(...)` so ordering is canonical by construction → `['store-badges',
  'lead-form']` in `capabilityIds` order.

### capabilities.test.ts
- (a) `Object.keys(sharedBlockCapability)` (sorted) === keys of `sharedBlockRegistry`
  === keys of `sharedBlockPublishedRegistry`.
- (b) every non-null value ∈ `capabilityIds`.
- (c) exact contents: `leadform → 'lead-form'`, `storebadges → 'store-badges'`,
  `followstrip → null`; `sharedBlockCapabilities` contains both ids, length 2.
- plus a dedup/canonical-order assertion.
Test file imports both component registries (test-only, allowed). Production code does not.

### Registry map names/keys found (as required by step 2a)
- `registry.ts` → exported map `sharedBlockRegistry`, keys: `leadform`, `storebadges`,
  `followstrip`.
- `registry.published.ts` → exported map `sharedBlockPublishedRegistry`, same three keys.
- Both also export `resolveSharedBlock` / `resolveSharedBlockPublished`.

### README edit
Added a new "Shared blocks (`sharedBlocks/`)" section (immediately before "Consumers")
— the README had no prior shared-blocks section. States the MUST-declare-capability rule
(map to a `CapabilityId` or explicit `null`), notes `capabilities.ts` is pure data for the
fit.ts firewall, and that `capabilities.test.ts` gates sync.

### Verification
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run` → 115 files passed / 1 skipped; 1860 tests passed / 3 skipped.
  New test suite passes; no existing test changed status (no consumer yet).

### Deviations
- The plan said "update the shared-blocks section" of the README, but no such section
  existed. Conservative choice: added a new section rather than retrofitting unrelated
  prose. Logged here per the in-scope-ambiguity rule.

### Open risks
None. Pure data + test, no behavior change. `capabilities.ts` has no React/component/
registry import, so the fit.ts firewall (Phase 2) is safe to rely on it.
