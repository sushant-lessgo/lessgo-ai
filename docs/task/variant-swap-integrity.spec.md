# variant-swap-integrity — spec

## Problem / why
F17 (`reports/scale-1-10-findings.md`, P1): a block-variant swap can destroy user content and
break its own promises. Surge testimonials `ReviewGrid` → `PullQuoteWithMark`:
1. **Empty render** — the two variants consume incompatible copy shapes (`reviews[]` cards vs
   top-level `quote`/`author_name` per `blockManifest.ts`); the swapped-in block finds nothing.
   Violates the modal's own copy ("Your headline, copy and uploaded media are kept") and D18.
2. **Silent destruction** — the clamp drops cards as warned, but nothing can bring them back.
3. **Undo is a no-op on BOTH dispatch paths** (registry AND `internalDispatch` — verified on
   surge testimonials and vestria hero): layout stays swapped, dropped cards stay dropped, yet
   the redo arrow arms.
Why guards missed it: the scale-09 distinctness guard exempts `internalDispatch` variants, and
the conformance test proves `consumes ⊆ contract` per block — never that two variants of one
section consume the SAME copy, which is what makes a swap lossless.
Note severity rose since the report: F3's fix made registry-dispatch swaps actually render, so
swaps are now fully live product surface. The testimonial system reduces real-quote loss to
"manually recoverable via Feature-on-Page" — AI-drafted quotes and hand-edits are still gone
for good, and hero/other sections have no library at all.

## Goal
A variant swap is either lossless or not offered. **Decided (2026-07-10): HIDE — a variant
whose consumed copy shape is incompatible with the section's current content does not appear
in the swap modal** (no adapter/mapping layer in this feature). And Undo after any swap
restores the section exactly — layout, elements, elementMetadata, clamped cards — on both
dispatch paths.

## Scope OUT (non-goals)
- Copy-shape adapters/mappings between variants (explicitly declined; a future mapping could
  re-eligibilize hidden pairs — not now).
- New variants, new manifest fields beyond what compatibility needs, template visual changes.
- The clamp warning UX itself (copy is good — TC-09.5 passed); only its Undo promise must
  become true.
- F18's eligible-count button hiding (already landed) — but note interaction: hiding
  incompatible variants may reduce eligible count to 1, which correctly hides the Layout
  button entirely.

## Constraints
- Compatibility is computed from the manifest `consumes` declarations vs the section's current
  content keys — data-driven, no per-template if-statements (D9). Exact rule (subset vs
  overlap, collection-key handling) is the planner's call; the law is: **never offer a swap
  that would render empty or silently drop non-clamped copy.**
- Clamp (fewer cards) remains allowed WITH warning — it's explicit and must be undoable.
- Undo: the swap action must snapshot the full section state (layout + elements +
  elementMetadata) as ONE undo entry; undo restores all of it; redo re-applies. Both dispatch
  paths (registry `resolveBlock(layoutName)` and `internalDispatch` self-reading blocks).
- Close the guard gap: extend the scale-09 conformance test so every co-eligible variant pair
  of a section is copy-compatible (incompatible pairs must be declared/detected, and the swap
  UI must respect it) — `internalDispatch` no longer exempt from THIS check.
- Editor↔published parity: post-swap and post-undo states render identically in both.

## References
- `reports/scale-1-10-findings.md` F17 (repro tokens `bibO4F6MfOI8` surge, `nmzl0brZggz5`
  vestria hero undo), F3 (dispatch paths), F18 (button hiding).
- `src/modules/templates/.../blockManifest.ts` — `consumes` declarations, `internalDispatch`.
- scale-09 work (`docs/task/scale-09*`, branch feature/scale-09-block-variants): variant
  mechanism, distinctness guard, conformance test, eligibility filtering, editor swap UI
  (`BlockVariantSelector.tsx` + `eligibleVariantCount()` from the F18 fix).
- Undo stack: the editor's existing undo machinery (find why swap actions arm redo but restore
  nothing — likely the swap writes outside the undo-tracked mutation path).

## Open exploration questions
- Where does the swap write layout/content (store action) and why does the undo stack think it
  captured it? Both dispatch paths.
- What exactly does the clamp do to the collection (slice at write?) and where would the
  snapshot restore it?
- Current eligibility pipeline (`isBlockEligible`/asset facts) — the natural place to add
  copy-compatibility.

## Candidate human gates
- None irreversible. Suggested gate: manual swap+undo pass on the two repro projects before
  merge.

## Acceptance criteria
- [ ] Surge testimonials with `reviews[]` content: `PullQuoteWithMark` is NOT offered (and if
      that leaves 1 eligible variant, the Layout button hides per F18).
- [ ] A compatible swap preserves every copy element (zero words change — TC-07.12 spirit).
- [ ] Clamped swap + Undo: layout back to original AND dropped cards restored, DB verified.
- [ ] Undo works identically for an `internalDispatch` swap (vestria hero repro).
- [ ] Conformance test fails if a section declares co-eligible variants with incompatible
      `consumes` (internalDispatch included); current templates pass or get their manifests
      corrected.
- [ ] Editor and published render identically post-swap and post-undo.
- [ ] `tsc` + full `test:run` green.

## Pilot / smallest slice
Phase 1 = undo snapshot fix (the data-loss half, smallest and worst). Phase 2 = compatibility
filter + conformance test (the never-offer-broken-swaps half).
