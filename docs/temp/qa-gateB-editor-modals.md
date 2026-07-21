# Gate B — editor-phase-4 Step B reactivity QA (modals + chrome)

## RE-VERIFY 2026-07-14 — item 4 SEO settings: PASS (fix confirmed)

- Fix commit `044f436d` (raw `s.pages` in selector + `useMemo` list derivation; sweep of 211 selector bodies / 85 files found no other instance).
- Re-run on :3022, same token `h482wF2MB54X`: modal OPENED (previously crashed 3/3); typed SEO title "QA Title Check" → Google preview + social card + 14/60 counter updated LIVE + "Saving…" fired; cleared value; closed + REOPENED clean (remount, previous crash repro included remount); console zero `Maximum update depth`/`getSnapshot` errors.
- New totals: **10 PASS · 0 FAIL · 0 STALE · 7 N/A** → Gate B evidence complete, awaiting founder sign-off.

- Date: 2026-07-12 · Worktree: `.claude/worktrees/feature-editor-phase-4` · Branch `feature/editor-phase-4-store-finish`
- Tip at test time: 874c9b39 (docs-only commit atop stated code tip 32322c39 — ancestor verified)
- Env: dev server port 3022, project token `h482wF2MB54X` (Meridian/product, orphan e2e draft with full sections), Chrome via claude-in-chrome

## Results

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Button-config modal | PASS | Changed CTA text → canvas hero button updated live ("Start QA →"); reverted to "Start free" + saved; modal re-open shows persisted store value |
| 2 | Form builder | PASS | Button action → Native Form revealed Form Selection live; Create New Form opened builder; Add Field rendered "Field 1" row instantly; cancelled (no form persisted) |
| 3 | Social editor | PASS | Added Twitter/X link → appeared in Current Social Links immediately + auto-save fired; delete removed row instantly (net data unchanged) |
| 4 | SEO settings | **FAIL — CRASH** | Opening modal throws `Maximum update depth exceeded` → whole editor error boundary. Reproducible 3/3 (incl. "Try Again" remount). See root cause below |
| 5 | Products modal | PASS | Opened via `lessgo:manage-products` event (its real trigger is TechPremium-only "+ Products"); + Add category rendered row instantly; modal state reactive |
| 6 | Countdown config | N/A | `CountdownConfigModal` defined but never imported/mounted anywhere — dead code, unreachable |
| 7 | Element-toggle | PASS | Section Elements modal: toggled Secondary Cta Text off → "Read the docs" button vanished from canvas live; toggled back on → returned |
| 8 | Taxonomy modals | N/A | `TaxonomyModalManager` never rendered in any tree (`<TaxonomyModalManager` zero matches) — dead code, unreachable |
| 9 | Landing-goals modal | N/A | Only rendered inside unmounted TaxonomyModalManager — unreachable |
| 10 | Element-picker | N/A | Only trigger (`showElementPicker`) lives in `ElementCRUD.tsx`, which is itself never imported/mounted; `toggleElementPicker` has zero callers — unreachable |
| 11 | Theme popover | PASS | Palette green→blue restyled canvas live (headline accent, both CTAs, terminal card, chip icon); reverted to green live |
| 12 | Header actions | PASS | Edit committed → Saving…/Saved indicator flips; Undo reverted canvas headline live + toast "Undid last action" + redo enabled/undo disabled correctly |
| 13 | Page switcher | PASS | + Add page → "QA Page" tab appeared instantly + auto-switched; Home↔QA Page switch instant; deleted QA Page → tab removed live |
| 14 | Add-section | N/A | `EnhancedAddSection` returns null for template-module projects (`usesTemplateModule` guard) — hidden by design on Meridian; guard's own useShallow selector works (correctly hid UI) |
| 15 | Device toggle | N/A | `DeviceToggle.tsx` defined but never imported/mounted — dead code, unreachable |
| 16 | Preview page | PASS | Preview opened /preview/h482wF2MB54X in new tab; rendered current store state (incl. just-restored CTA text), footer bar w/ Back to Edit/Publish intact |
| 17 | Privacy editor | N/A | `PrivacyPolicyEditor`/`PrivacyPolicyLink` in `src/components/editor/` never imported by any route/component — unreachable |

**Totals: 9 PASS · 1 FAIL (crash) · 0 STALE · 0 BLOCKED · 7 N/A (6 dead-code unreachable, 1 hidden by design)**

## FAIL detail — SeoSettingsModal infinite loop (blocker)

- Console: `Warning: The result of getSnapshot should be cached to avoid an infinite loop` at **SeoSettingsModal** (`src/app/edit/[token]/components/ui/SeoSettingsModal.tsx:48` via GlobalModals) followed by `Error: Maximum update depth exceeded` (stack: `updateStoreInstance → forceStoreRerender`, i.e. useSyncExternalStore snapshot never stabilizes).
- Root cause (lines 35–43): selector calls a store method that returns a **fresh array each snapshot**:
  ```ts
  const { pages, ... } = useEditStore(
    useShallow((s) => ({
      pages: (s.getPagesList ? s.getPagesList() : []) as ProjectPageEntry[],
      ...
  ```
  `getPagesList()` (and the `[]` literal fallback) produce a new reference every call; `useShallow` compares top-level values with Object.is, so `pages` never equals the previous snapshot → infinite re-render → error boundary kills the whole editor.
- Reproducible every open; "Try Again" re-crashes instantly (modal-open flag persists in store, remount loops again); only full page reload recovers.
- Fix direction: don't call derive-functions inside the selector — select the raw `pages` map (stable ref) and derive the list in `useMemo`, or memoize `getPagesList` result in the store.

## Console findings

- 11 errors total, ALL from the 3 SEO-modal crash episodes (3:12–3:14 PM). Zero errors/warnings from any other item (social, theme, setup panel, pages, element toggles, button config, form builder, products, preview, undo/redo).
- One transient full-renderer freeze (~40 s, screenshots/CDP timed out) right after first social-link delete click; recovered by itself with no console error and no state damage — most likely dev-server chunk recompile of the SEO modal edit-page bundle; the delete click never registered and succeeded on retry. Not reproduced afterwards.

## Coverage note

6 of the 10 B5-gap modals turn out to be dead code in the current build (countdown, taxonomy ×2 incl. landing-goals, element-picker, device toggle, privacy editor) — renderProbe never hooked them because nothing mounts them. If Step B touched their `useEditStore()` calls, those changes are unverifiable from the UI; recommend confirming they're out of scope or deleting them.

## Cleanup

- Headline QAMARK edit undone; CTA text restored to "Start free"; social link deleted; QA Page deleted; element toggle restored; no publish. One stray "New category" may persist in the orphan e2e project's products collection metadata (undo attempted; project is a today-dated e2e draft, no live pages).
- Dev server on :3022 stopped.
