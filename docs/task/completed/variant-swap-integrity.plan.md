# variant-swap-integrity — plan (rev 3)

**Branch:** `feature/variant-swap-integrity`
**Spec:** `docs/task/variant-swap-integrity.spec.md` (source of truth)

## Overview

Block-variant swaps arm redo but restore nothing on Undo. Root cause: the swap calls
`executeUndoableAction('section-layout-update' as any, …)` and the type mapping in
`uiActions.ts` (L856-859) has no case for it, falling through to `'theme'` — whose undo
branch restores only `state.theme`. Separately, the picker offers copy-incompatible variants
(surge `ReviewGrid` → `PullQuoteWithMark` renders empty/drops copy). Phase 1 makes a swap
ONE undo entry that fully restores layout + elements + elementMetadata + clamped cards on
both dispatch paths, with a working redo. Phase 2 hides variants whose swap would silently
drop scalar copy or render empty (ASYMMETRIC rule — superset-consumes pairs like vestria
hero stay swappable), and adds a genuinely failing conformance assertion for co-eligible
symmetric-divergent variant pairs (`internalDispatch` included), correcting the surge
manifest via one minimal new field.

## Progress log

- phase 1 undo snapshot fix: done (commit 90b05c63, review loops 1) — ship
- phase 2 compatibility filter + conformance test: done (commit 6ae20a29, review loops 1) — ship

---

## Phase 1 — Undo snapshot fix (data-loss half; independently mergeable)

### Design decisions (locked)

- **Action name:** new `UndoableAction` member `'sectionSwap'`, mapped to a new
  `EditHistoryEntry.type` value `'sectionSwap'`. No `as any` anywhere. NOTE: the
  `EditHistoryEntry.type` union lives in `src/types/store/state.ts` L89-96 (currently
  `'content'|'layout'|'theme'|'section'|'fullContent'`) — extend THERE; the
  `UndoableAction` union is in `src/types/core/ui.ts` (~L3018).
- **Snapshot scope:** whole-map deepCopy, `'fullContent'`-style (content + sections +
  sectionLayouts before AND after). No `sectionId` plumbing — `executeUndoableAction`'s
  signature stays `(actionType, actionName, action)`. Swaps are rare; per-section
  micro-optimization not worth signature churn.
- **Double-push suppression:** `updateSectionLayout` (`layoutActions.ts` L280-315)
  UNCONDITIONALLY pushes its own `type:'layout'` history entry and clears redo. Add an
  optional `opts?: { skipHistory?: boolean }` 3rd param; when true, skip the internal
  history push + redo clear entirely (the outer `executeUndoableAction` owns the single
  entry). Swap paths pass `{ skipHistory: true }`. Default behavior unchanged for all other
  callers. The store-interface signature in `src/types/store/actions.ts:32`
  (`(sectionId, newLayout) => void`) MUST be updated to accept the optional 3rd param, else
  callers error ("Expected 2 arguments, got 3").
- **Redo shape:** mirror the `'fullContent'` REDO branch (`uiActions.ts` L810-818) — restore
  `afterState` content + sections + sectionLayouts via deepCopy. Do NOT model redo on the
  `'section'` redo branch (L760-776): it only re-applies add/remove, not elements, so a
  clamped swap would not re-clamp. Undo mirrors the `'fullContent'` UNDO branch (L730-741)
  with `beforeState`.
- **Restore-time deepCopy is mandatory:** the `executeUndoableAction` capture is shallow and
  only safe because Immer produces fresh refs; the `'sectionSwap'` undo/redo branches must
  deepCopy at restore time exactly like `'fullContent'` does (L736-738 / L814-816) to avoid
  future aliasing. (Root cause of the bug remains purely the type-mapping fallthrough —
  deepCopy is defense-in-depth, not the fix.)
- **LayoutChangeModal:** its legacy `handleLayoutChange` (L35-53) carries the identical
  `'section-layout-update' as any` broken cast → same no-op undo. Fix it in this phase with
  the same typed action + `skipHistory` call shape. No known-broken path left behind.
- No renderer changes: both dispatch paths (registry `resolveBlock` and `internalDispatch`)
  read the same store keys; one store-level fix covers both. Editor↔published parity holds
  automatically because undo restores the exact prior store state both renderers consume.

### Files touched

- `src/types/core/ui.ts` — add `'sectionSwap'` to `UndoableAction` union (~L3018).
- `src/types/store/state.ts` — add `'sectionSwap'` to `EditHistoryEntry.type` union
  (L89-96).
- `src/types/store/actions.ts` — `updateSectionLayout` interface signature (L32): optional
  `opts?: { skipHistory?: boolean }` 3rd param.
- `src/hooks/editStore/uiActions.ts` — `executeUndoableAction()` type-mapping case for
  `'sectionSwap'` + whole-map before/after snapshot; new `'sectionSwap'` branches in
  `undo()` and `redo()` (fullContent-style deepCopy restore of content + sections +
  sectionLayouts).
- `src/hooks/editStore/layoutActions.ts` — `updateSectionLayout(sectionId, layoutId, opts?)`
  implementation with `skipHistory` (skips internal history push + redo clear).
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx` — `applyLayoutOnly()`
  (L205-210) + `applyWithClamp()` (L212-221): typed `'sectionSwap'` action, pass
  `{ skipHistory: true }` to `updateSectionLayout`.
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx` — same fix for
  `handleLayoutChange` (L35-53).
- `src/hooks/editStore/uiActions.test.ts` (or nearest existing editStore test file; create
  under `src/hooks/editStore/` if none) — swap→undo→redo round-trip unit tests.

### Steps

1. Type edits: `UndoableAction` (core/ui.ts), `EditHistoryEntry.type` (store/state.ts),
   `updateSectionLayout` signature (store/actions.ts).
2. `skipHistory` option in `layoutActions.ts` (verify no other layout action in the ~L268
   area double-pushes on this path).
3. `executeUndoableAction` mapping + snapshot; `undo()`/`redo()` `'sectionSwap'` branches
   with restore-time deepCopy.
4. Call sites: BlockVariantSelector (both apply fns) + LayoutChangeModal.
5. Unit test: store with a testimonials-like section (top-level card array). Run a clamped
   swap (`updateSectionLayout` with `skipHistory` + `setSection({elements: clamped})`) inside
   one `executeUndoableAction('sectionSwap', …)`. Assert: exactly ONE history entry; undo
   restores original layout, full card array, elementMetadata, and `sectionLayouts` mirror;
   redo re-applies the clamped layout AND clamped elements; a second undo restores again.
   Also assert a plain (non-clamped) swap round-trips.

### Verification

- `npx tsc --noEmit` green.
- `npm run test:run` green (new unit tests + existing suites).
- Manual repro (dev server): surge token `bibO4F6MfOI8` — testimonials clamped swap
  ReviewGrid→PullQuoteWithMark, Undo → layout back + all cards back; Redo → clamped state
  re-applied. Vestria hero token `nmzl0brZggz5` (`internalDispatch` path) — swap, Undo →
  restored. Verify saved draft in DB reflects restored content. Editor and published preview
  render identically post-swap and post-undo.

---

## Phase 2 — Compatibility filter + conformance test (never offer broken swaps)

### Runtime compat rule (locked — ASYMMETRIC)

Key insight: an optional-but-absent CONSUMED key (e.g. vestria FullBleed's `hero_video_*`
scalar URLs when no video is set) is NOT the same as a dropped PRESENT key. Requiring
`consumes(target) ⊆ presentKeys` would wrongly hide superset-consumes variants. The rule is
asymmetric, judged against what the section actually HAS:

`isCopyCompatible(currentSection → target B)` — target B is OFFERED iff BOTH:

- **(i) No silent scalar drop:** every present, non-empty SCALAR (non-array) content key of
  the section is ∈ `consumes(B)`. Array/collection keys are EXEMPT (overflow is handled by
  the clamp + warning path, undoable via Phase 1).
- **(ii) Non-empty render:** `consumes(B) ∩ presentKeys ≠ ∅` (target renders at least one
  present key).

There is NO `consumes(B) ⊆ presentKeys` condition.

Definitions: `presentKeys` = top-level keys of `content[sectionId].elements` with a
non-empty value (**present = non-empty**: arrays iff `length > 0`; strings iff trimmed
non-empty; other values iff non-nullish). A present key is a **collection key** iff its
value is an array; otherwise **scalar**.

Expected outcomes (encode as predicate unit tests):
- surge reviews-content section → PullQuoteWithMark: HIDDEN (present scalar `headline` ∉
  consumes(PullQuote) → scalar drop).
- vestria Tailored → FullBleed: OFFERED (superset consumes all present scalars; absent
  video keys are optional and irrelevant). The internalDispatch repro swap stays live
  (spec acceptance).
- vestria FullBleed → Tailored: HIDDEN only when a `hero_video_*` key is actually present
  (that swap would drop the video — correctly lossy); OFFERED when no video set.

Array-key exemption guard (one-line comment in code): safe today because
`clampSectionCards` truncates every top-level array and no current pair renders a DIFFERENT
collection key — but a future pair reading a different collection key would silently
non-render it; collection-key handling must be added then.

Pure, manifest+content driven, no per-template branches (D9), firewall-safe (no
component/schema imports in the runtime path).

### Static conformance rule + manifest correction (locked)

- **Static compat** for each CO-ELIGIBLE pair (A, B) in one `SectionBlockSet` (co-eligible =
  same `copyShape` group AND both pass `isBlockEligible` under identical asset facts;
  `internalDispatch` NOT exempt): **FAIL iff BOTH directions would drop a scalar** — i.e.
  A consumes a scalar key ∉ consumes(B) AND B consumes a scalar key ∉ consumes(A)
  (symmetric scalar divergence = genuinely incompatible, no lossless swap in either
  direction). Superset pairs and equal pairs PASS; do NOT require equal scalar sets.
  - surge ReviewGrid (`headline` ∉ PullQuote) vs PullQuoteWithMark (`quote`/`author_name` ∉
    ReviewGrid): both directions drop → FAIL → the KNOWN correction (below).
  - vestria FullBleed ⊃ Tailored: only one direction drops (FullBleed→Tailored drops
    video) → PASS. Vestria needs NO tag and stays fully swappable.
- **Static scalar/collection classification** (tests may import schemas — the firewall is a
  runtime-bundle rule only): classify each consumed key via the layout's element contract
  (reuse the `contractFor(layoutName)` seam from `blockManifest.test.ts` L35; a key is a
  collection iff the schema types it as a card/array element). If the schema doesn't expose
  arrayness for some key, fail loudly in the test rather than guessing.
- **Minimal new manifest field** (the ONE permitted exception to "no new fields"):
  `copyShape?: string` on `BlockDeclaration` (`blockManifest.ts` L36 area). Variants with
  DIFFERENT `copyShape` values (undefined = the set's default group) are declared
  content-exclusive: never co-OFFERED at runtime and excluded from co-eligibility in check
  (e). `copyShape` tags ONLY genuinely both-ways-incompatible pairs (surge) — NOT
  superset-compatible pairs (vestria gets none).
- **Surge correction:** tag ReviewGrid / PullQuoteWithMark with distinct `copyShape` values
  (e.g. `'reviews'` / `'pullquote'`). Audit meridian + hearth pairs against the static rule
  during implementation: any both-ways-divergent pair either gets `consumes` corrected (if
  a declaration omission) or distinct `copyShape` tags (if genuinely shape-divergent).
  Expected: only surge needs tags.
- **Runtime use of `copyShape`:** picker hides non-current variants whose `copyShape`
  differs from the current variant's — in addition to the live-content `isCopyCompatible`
  filter (field = static guarantee; live check = runtime guarantee).

### Conformance assertions (locked — check (e), real failure)

Label note: the new check is **(e)** — check (d) (scale-10 collection-family) already exists
at `conformance.test.ts` L265.

- Extract the pairwise checker as a pure exported helper (e.g.
  `findIncompatibleCoEligiblePairs(set, classify)`), homed in `blockEligibility.ts` beside
  the runtime predicate so the rule has ONE home and cannot drift from what the picker
  enforces.
- **Check (e) main assertion:** iterate every `SectionBlockSet` in `blockManifests`, compute
  co-eligible pairs (same `copyShape`, both eligible under identical asset facts,
  `internalDispatch` included), and assert the both-ways-scalar-divergent pair list is
  EMPTY — a hard failing assertion naming template/section/pair on failure. NOT a snapshot.
- **Check (e) consistency assertion:** for every DIFFERENT-`copyShape` co-eligible pair,
  assert the excluded variant is ALSO runtime-hidden by `isCopyCompatible` when fed content
  synthesized from the other variant's consumes (prevents the copyShape exclusion and the
  runtime filter drifting apart; verifies surge PullQuote is hidden from a reviews-shaped
  section by the scalar-drop rule alone).
- **Negative fixture:** a companion unit test feeds the helper a synthetic
  `SectionBlockSet` with a co-eligible, same-`copyShape`, both-ways-scalar-divergent pair
  and asserts the helper flags it — proving check (e) catches a newly-added incompatible
  pair. Also a positive superset fixture (vestria-shaped) asserting PASS.
- With the surge `copyShape` tags in place, all current templates pass check (e).

### Files touched

- `src/modules/templates/blockManifest.ts` — `copyShape?: string` on `BlockDeclaration`;
  tag surge ReviewGrid/PullQuoteWithMark (+ any audit-driven `consumes` corrections or
  tags).
- `src/modules/generation/blockEligibility.ts` — `isCopyCompatible(decl, sectionElements)`
  runtime predicate (asymmetric rule i+ii) + shared pairwise helper + array-exemption guard
  comment (firewall-safe: pure data logic only).
- `src/modules/generation/blockEligibility.test.ts` (create if absent; else extend this
  module's existing tests) — predicate unit tests (present-key rules, scalar vs collection,
  scalar-drop hide, superset offer, video-present asymmetry, non-empty-render, clamp
  allowed) + negative/positive pairwise fixtures.
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx` — presentKeys derivation
  from live section elements (same seam as `deriveEditorAssetFacts` L110); HARD filter in
  the visible list (L197-201): keep current variant (escape hatch), drop non-current
  variants failing `isCopyCompatible` OR with mismatched `copyShape`; same filter in
  `eligibleVariantCount()` (L75) so `SectionToolbar` hides the Layout button when ≤1
  eligible remains (F18 interaction, desired).
- `src/modules/templates/conformance.test.ts` — new check (e): main assertion +
  copyShape/runtime consistency assertion.

### Steps

1. `copyShape` field + runtime predicate + pairwise helper + unit tests (incl. fixtures).
2. Selector: presentKeys derivation, hard filter (compat + copyShape), count fn.
3. Check (e) in conformance.test.ts (both assertions); run; apply surge tags + any
   audit-driven manifest corrections until green.
4. Full suite pass.

### Verification

- `npx tsc --noEmit` green.
- `npm run test:run` green — predicate tests (incl. vestria superset OFFERED + video-present
  HIDDEN cases), negative fixture (helper flags synthetic bad pair), check (e) + consistency
  assertion passing on corrected manifests. Sanity: temporarily strip a surge `copyShape`
  tag locally → check (e) FAILS → revert.
- Manual repro (dev server): surge token `bibO4F6MfOI8` with `reviews[]` content —
  PullQuoteWithMark absent from picker; if 1 eligible variant remains, Layout button hidden
  (F18). Vestria hero `nmzl0brZggz5` — BOTH hero variants still offered (no video set),
  swap+undo still clean (Phase 1 regression + spec acceptance). A still-offered compatible
  swap preserves every copy element verbatim (TC-07.12 spirit).
- Editor↔published parity spot-check post-swap.

---

## Human gate

- **[HUMAN GATE — before merge to main]** Manual swap+undo pass on both repro projects
  (surge `bibO4F6MfOI8`, vestria hero `nmzl0brZggz5`): clamped swap → Undo restores layout +
  dropped cards (DB-verified), Redo re-clamps, incompatible variant hidden, vestria hero
  swap still OFFERED and undoable, editor↔published parity. No other gates — no
  schema/migration/auth/publish/prod-data changes in scope.

## Unresolved questions

None — action name `'sectionSwap'`; LayoutChangeModal fixed in Phase 1; asymmetric runtime
rule + both-ways-divergence static rule per review pass 2; `copyShape` tags surge only;
present key = non-empty (array `length>0`, string trimmed non-empty).
