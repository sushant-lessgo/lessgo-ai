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

---

## Phase 2 — gate law rewrite + test rewrite (kills F13/F15/F16)

### Files changed
- `src/modules/templates/fit.ts` (edit)
- `src/modules/brief/serveGate.ts` (edit)
- `src/modules/templates/fit.test.ts` (rewrite of affected cases)
- `src/modules/brief/serveGate.test.ts` (rewrite of affected cases + new suites)
- `src/modules/engines/structureConvergence.test.ts` (edit — multipage cases + stale comment)
- `src/modules/templates/swap.test.ts` (comment only)
- `src/modules/brief/README.md` (edit)

### What changed

**`fit.ts`**
- `fit()`: satisfaction is now `required.every(cap => meta.capabilities.includes(cap) || sharedBlockCapabilities.includes(cap))`. Retired/bespoke exclusion + engine match remain checked FIRST. Imported `sharedBlockCapabilities` from `sharedBlocks/capabilities`; extended the file-header firewall comment to note the one data-only cross-module import (no React/component/registry).
- `requiredCapabilitiesFromBrief()`: DELETED the `structure.mode === 'multi' → multipage` line. Kept `M1 → lead-form` and `download-app → store-badges` verbatim. Updated the derivation-table doc to state inferred-multi is soft and multipage now hardens only in `requiredCapabilitiesFromStructure`.
- `requiredCapabilitiesFromStructure()`: UNCHANGED (confirmed — its `mode==='multi' ⇒ multipage` clause stays; runs on user-confirmed 7b).

**`serveGate.ts`**
- Module-header gate-rule comment rewritten to the new law (shared-block satisfaction; `gallery` still unsatisfiable ⇒ still rejects; inferred-multi soft).
- `pickTemplate()` rewritten: STYLE ALWAYS WINS (hint-style match → defaultStyle match), and within a style-matched set of >1, prefer a multipage-capable template when `brief.structure?.mode === 'multi'`, else `sl[0]`. Style match never overridden; candidate pool never narrowed. Documented in-code that the tiebreak is DORMANT under today's one-style-per-template config (deliberate forward-compat, not dead code). `shortlist` array untouched — only the pick gains the tiebreak.
- rungC gallery-injection comment + fallback-guard comment updated to the new law.

### F13 / F15 / F16 before→after (observed in tests)
- **F13** consultant / trust / request-quote(M1) / inferred `multi`: was MANUAL `rungC:multipage` (inferred multi forced unsatisfiable multipage on trust). Now **SERVE / service / lex**, shortlist `[hearth, lex, surge]`. Inferred multi dropped; lex via defaultStyle `authority-professional`; multipage tiebreak dormant (singleton style match), so no hijack.
- **F15** writer / work / lead-magnet(M1): was MANUAL `rungC:lead-form` (granth declares no capability). Now **SERVE / writer / granth**, shortlist `[granth]` — lead-form satisfied by the shared block. `fit('granth','work',['lead-form'])` now `true`.
- **F16** app / thing / download-app(M3): was MANUAL `rungC:store-badges` (no template declares it). Now **SERVE / product / meridian**, shortlist `[meridian, vestria]` — store-badges satisfied by the shared block; meridian via defaultStyle `tech-minimal`.
- Bonus: the old fallback-guard fixture (saas + download-app → `rungC:store-badges`) now SERVES too; the never-empty-`missing` invariant was moved onto the photographer manual test (still the live fallback path via `rungC:gallery`), with an explicit `expect(decision.missing).not.toBe('')`.

### Tests
- `fit.test.ts`: flipped the inferred-multi case (now asserts multipage NOT derived from brief + shortlist `[meridian,vestria]`, and that `requiredCapabilitiesFromStructure` STILL yields multipage); flipped download-app (store-badges still required, shortlist now non-empty); added shared-block satisfaction tests (granth+lead-form fits; gallery unsatisfiable on every template; retired/bespoke never fit even with a shared-block-satisfiable requirement). M1→lead-form assertion retained.
- `serveGate.test.ts`: added F13/F15/F16 serve fixtures; rewrote the fallback-guard test into saas+download-app SERVE; added the never-empty `missing` assertion to the photographer test; fixed the stale app/signup-free comment; added the inferred-signal-never-rejects property suite (single vs multi identical outcome for 6 serveable fixtures) and the style-first pick-tiebreak suite (a) saas+multi → meridian (no hijack), (b) style hint never overridden, (c) consultant trust multi === single (lex), (d) shortlist keeps `templateIds` order. Kept `makeSignals` + strict `missing` equality on unchanged manual paths.
- `structureConvergence.test.ts`: reworked the multipage-structural case to assert via `selectProductSections({ requiredCapabilities: ['multipage'] })` (no section added) and added a separate assertion that `requiredCapabilitiesFromBrief` no longer emits multipage for inferred `mode:'multi'`. Fixed the stale loop-header comment listing "structure.mode multi" as a source. EXPLICIT_TRIGGER absence assertions kept.
- `swap.test.ts`: NO assertion change. Added a header comment documenting why widening `fit()` is safe for swap (independent section-coverage check; shared blocks render on every template; multipage still hardens via `requiredCapabilitiesFromStructure`).

### swap.test.ts re-baseline?
Not needed — the suite was green after the law change with zero assertion edits (comment only).

### Verification
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 115 files passed, 1 skipped; 1877 tests passed, 3 skipped. fit / serveGate / structureConvergence / swap / templateMeta / config / conformance / sectionSelection / pageArchetypes / strategy-route all green.

### Deviations / surprising notes
- F13 uses `request-quote` (mechanism `M1` = `mechanisms[0]`), which is not in consultant's `likelyIntents`; `buildBriefDraft` does not validate intent against `likelyIntents`, so this is fine for a synthetic serve-gate fixture (Phase 3's serveMatrix will iterate the real `likelyIntents`).
- The pick-tiebreak fall-through tests use `saas` (thing) whose defaultStyle `tech-minimal` maps to meridian = `shortlist[0]` — so the "no multipage hijack" assertion is that vestria is NOT preferred despite inferred multi. A literally-bare brief has no pickable template (returns rungA MANUAL), so a KNOWN type is required, per the plan note.
- No production/behavior risk beyond the intended F13/F15/F16 serve flips; ServeDecision shape unchanged; no guardrailed file touched.

### Phase 2 — impl-review verdict: ship (1 loop)

Non-blocking, carried forward (NOT fixed in phase 2):
- `serveGate.ts:231-238` fallback guard now has zero direct test coverage. The old
  saas+download-app fixture was its only traversal and now SERVEs. The `missing !== ''`
  invariant was moved to the photographer test per plan step 4, but photographer reaches
  `rungC:gallery` via the rungC tiebreaker probe (`serveGate.ts:176`), NOT the fallback
  guard (which derives caps from `requiredCapabilitiesFromBrief`, and `gallery` is never
  in that set). Consequence: (a) the comment at `serveGate.test.ts:225-228` calling
  photographer "the live path through the latent-cap FALLBACK guard" is inaccurate;
  (b) the defensive branch is untested.
  Behavior is correct and the invariant IS asserted. Fix options if picked up later:
  reword the comment, or add a synthetic fixture (known bridgeable type whose
  businessType-derived cap is unsatisfiable with an empty shortlist) to exercise it.
