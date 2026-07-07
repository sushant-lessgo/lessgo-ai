# edit-guide-and-verify — implementation audit

## Phase 1 — Derivation layer (split scan, derive curated tasks)

### Files changed
- `src/hooks/useReviewState.ts` (modified)
- `src/hooks/useReviewState.test.ts` (created)

### What changed — `src/hooks/useReviewState.ts`
New exports:
- `GuideTaskId = 'add_logo' | 'link_ctas' | 'replace_stock_photos' | 'add_contact'`
- `interface GuideTask { id; label; done; present; target? }`
- `interface GuideSurfaces { headerSectionId; footerSectionId; primaryCtas[]; hasImageElement; firstImageTarget; stockItems[] }`
- `function deriveGuideTasks(content, surfaces, globalSettings?) : GuideTask[]` — pure, always returns exactly the 4 curated tasks.

New store state fields: `needsReviewItems`, `guideTasks`, `remainingCount`, `allComplete`.

New helpers (module-local): `unwrapContentValue` (string / `{content}` unwrap), `isPrimaryCtaLinked` (mirrors `ctaHandler.ts:20-51` — V2 `elementMetadata[key].buttonConfig` link+url, legacy `sectionData.cta` fallback).

`initFromContent`:
- Signature gained an optional 4th param `globalSettings?: { logoUrl?: string }` (backward compatible; existing 3-arg caller unaffected — logo check falls back to header `logo_image` until Phase 2 wires it).
- Collects surface facts during the existing single scan: `headerSectionId`, `footerSectionId`, `primaryCtas` (elementKey `cta_text`), `hasImageElement` + `firstImageTarget` (non-logo image elements only).
- Deleted the unconditional `__logo__` push (old `:201-205`) and `__contact__` push (old `:215-219`); replaced with content-derived task presence/done.
- After the scan: `needsReviewItems = items.filter(type==='needs_review')` (Feature 2, isolated & intact); `stockItems = items.filter(type==='stock_image')` fed into `deriveGuideTasks`; `remainingCount = guideTasks.filter(t=>t.present && !t.done).length`; `allComplete = remainingCount===0`.

The `needs_review` category and all other `reviewItems` remain intact and exposed (only the two config pushes were removed). Existing actions (`confirmItem`, `getElementReviewStatus`, etc.) untouched.

### Auto-check signals (per Design decisions)
- `add_logo`: present = header exists; done = `globalSettings.logoUrl` truthy OR header `content[headerId].elements.logo_image` non-empty.
- `link_ctas`: present = ≥1 primary `cta_text`; done = ALL present primary CTAs linked (first unlinked keeps it open); target = first unlinked CTA (else first).
- `replace_stock_photos`: present = a non-logo image element exists; done = no `stock_image` scan items remain (reuses scan output, no raw collection re-read); target = first stock item (else first image).
- `add_contact`: present = footer exists; done = footer `contact_email` OR `contact_address` non-empty.

### New shapes
- `guideTasks: GuideTask[]` — always length 4; UI gates on `present`.
- `needsReviewItems: ReviewItem[]` — the `needs_review` subset, reserved for Feature 2 markers.

### Deviations
- Logo "done" treats any non-empty `logo_image` as done (per plan's literal "non-empty"), including a placeholder value. Chose the plan-literal signal rather than layering placeholder detection to avoid scope creep. Low risk; Phase 3 UI + Phase 2 `globalSettings` wiring will refine.
- Did NOT hoist the Phase-5 `resolveElementValue` collection resolver (per the explicit constraint). Stock-photo "done" derives from the categorized `stock_image` scan items; no collection-keyed value is read raw in Phase 1.
- `firstImageTarget`/`hasImageElement` exclude keys containing `logo` so a logo-only header does not make the photos task "present".

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/hooks/useReviewState.test.ts` — 12 passed (asserts each task's present/done for logo set/unset, CTA linked/unlinked incl. legacy + any-unlinked, stock vs replaced, contact empty/email/address; asserts exactly 4 task ids, no 5th).
- `npm run test:run` — 52 passed | 1 skipped (53 files); 682 passed | 2 skipped (684 tests).

### Open risks
- No UI consumes the new shapes yet (Phase 3); `reviewItems` still backs the current pill/checklist, whose `totalCount` dropped by 2 (removed `__logo__`/`__contact__`) — cosmetic only until UI rewire.
- `globalSettings` not yet threaded into `initFromContent` at the call site (Phase 2) — logo done relies on header `logo_image` in the interim.

## Phase 2 — Reactivity: auto-check updates live

### Files changed
- `src/hooks/useReviewState.ts` (modified)
- `src/components/EditProvider.tsx` (modified)
- `src/hooks/useReviewState.test.ts` (modified — added `refreshFromContent` unit tests; authorized by the phase Verification which calls for extending this module's tests)

### `src/hooks/useReviewState.ts`
- Extracted the single content scan + guide derivation out of `initFromContent` into a pure
  module-level function `deriveReviewState(content, sectionLayouts, sections, confirmedElements, globalSettings?) → DerivedReview`. Both actions now share it (no second scanner). Behaviour is byte-identical to Phase 1's inline scan.
- New store state (all internal wiring, threaded for later phases): `sectionLayouts`, `sections` (retained scan inputs so a content-only refresh can re-derive), `baseline: Record<string,any>|null`, `currentPageId: string|null`. `baseline`/`currentPageId` are STORED now but NOT yet consumed by the derive (Phase 5 auto-clear).
- `initFromContent` signature extended to `(content, sectionLayouts, sections, globalSettings?, baseline?, currentPageId?)`. The existing 3-arg / 4-arg contract is preserved (extra params optional; the sole caller updated). It now also persists the scan inputs + baseline + currentPageId into state.
- New action `refreshFromContent(content, baseline?, currentPageId?, globalSettings?)`:
  - Re-derives via `deriveReviewState` using the STORED `sectionLayouts`/`sections`/`confirmedElements` (never resets `confirmedElements` or any user-set state).
  - No-op strategy: builds the current derived slice from state and compares with `derivedEqual(a,b)` (scalar compares for the four counts + `JSON.stringify` compare of `guideTasks`/`needsReviewItems`/`reviewItems`). If derived output is unchanged AND neither `baseline` nor `currentPageId` changed, it `return`s WITHOUT calling `set` — so contentEditable keystrokes that don't alter any auto-check produce zero review-state re-renders.
  - When it does `set`, it merges the fresh derived slice plus (only if provided) the new `baseline`/`currentPageId`.

### `src/components/EditProvider.tsx`
- The one-time `initFromContent` at the load `.then()` now also passes `updatedState.globalSettings`, `updatedState.baseline`, `updatedState.currentPageId` so first render matches the reactive refresh.
- Added a new `useEffect` (keyed `[store, tokenId]`) that wires reactivity via `store.subscribe(...)` OUTSIDE React render (not a render-phase selector). The subscribe callback reads `content`, `baseline`, `currentPageId`, `globalSettings` FRESH from `store.getState()` at fire time (nothing captured once at subscribe setup) so post-regen baseline recapture is seen. It guards on `content`/`globalSettings.logoUrl` reference change to ignore unrelated store churn, then debounces the `refreshFromContent` call by 150ms. Cleanup clears the pending timer and `unsubscribe()`s on unmount / token change / store swap.

### refreshFromContent signature + no-op strategy
- Signature: `refreshFromContent(content, baseline?, currentPageId?, globalSettings?)`. Deviation from the plan's literal 3-arg `(content, baseline, currentPageId)`: added the optional 4th `globalSettings` param. Rationale — the logo-done auto-check reads `globalSettings.logoUrl`, and Phase 2 explicitly subscribes to `globalSettings.logoUrl` as a trigger; without threading the fresh value in, a logo-only change would fire the subscribe but the refresh couldn't see the new URL, making the trigger a no-op. Conservative correctness fix; honors "read fresh from getState()".
- No-op guard: `derivedEqual(derived, current)` short-circuits the `set`. `baseline`/`currentPageId` changes still force a `set` (they must persist for Phase 5 even when the visible derived slice is unchanged).

### How reactivity was verified (headless — no live dev run)
- Store-level unit tests in `useReviewState.test.ts` simulate the subscribe→refresh path directly:
  - unchanged input → `refreshFromContent` skips `set`, proven by REFERENCE IDENTITY of `guideTasks`/`reviewItems` (a skipped `set` leaves the old array refs in place);
  - changed input (`globalSettings.logoUrl` set) → `add_logo.done` flips, new `guideTasks` ref;
  - `baseline`/`currentPageId` threaded and stored even when the derived slice is equal;
  - `confirmedElements` (user-set) preserved across a refresh.
- Logic argument for "no re-render storm on typing": a keystroke into a text element changes `content` (immer new ref) → subscribe fires → debounced refresh → `deriveReviewState` yields the same guide/needs_review/counts (text edits don't change any auto-check signal) → `derivedEqual` true → `set` skipped → no review-state subscriber re-renders. The 150ms debounce further collapses rapid keystrokes into at most one derive.

### Deviations
- Added optional `globalSettings` 4th param to `refreshFromContent` (see above).
- `refreshFromContent` re-uses the `sectionLayouts`/`sections` captured at the last `initFromContent` rather than taking them as params (keeps the plan's content-first signature). Limitation: a structural change (add/remove section) between loads is not re-scanned by a content-only refresh until the next `initFromContent`; auto-check on existing sections' content is fully reactive. Acceptable for Phase 2 (auto-check scope); noted for later phases.
- Touched the sibling test file `useReviewState.test.ts` (not in the phase Files-touched list) because the phase Verification explicitly asks for a `refreshFromContent` no-op/re-derive unit test. Treated as in-scope test authorization; no source-of-truth files outside the list were modified.

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 52 passed | 1 skipped (53 files); 686 passed | 2 skipped (688 tests). `useReviewState.test.ts` now 16 passed (12 Phase-1 + 4 new Phase-2).
- No UI changed; edit-only module; no published-renderer touch.

### Open risks
- Structural-change reactivity limitation noted above (content-only refresh reuses last scan inputs).
- Debounce is a fixed 150ms; if a downstream flow depends on a synchronous marker update it would see up to a 150ms lag (markers are cosmetic; acceptable).
- `derivedEqual` uses `JSON.stringify` on the derived arrays — cheap at these sizes; if items ever grow very large this could be swapped for a targeted compare (not a concern now).

## Phase 3 — UI rewire: pill + left-panel guide + auto-hide

### Files changed
- `src/app/edit/[token]/components/ui/ReviewPill.tsx`
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/hooks/README.md`

### What changed

**ReviewPill.tsx** — now reads `{ remainingCount, allComplete }` from `useReviewState`
(was `{ totalCount, confirmedCount }`). Returns `null` when `allComplete` (auto-hide),
replacing the old `totalCount === 0` guard and the "all done" green state. Label reworded
from `${confirmedCount}/${totalCount} reviewed` to `Setup: ${remainingCount} left`; title
tooltip reworded to a plain step-count string (no em dash). Click behavior unchanged: still
toggles the left-panel 'review' tab and un-collapses the panel. Removed the now-unused
`pillDoneStyle` const (pill never renders a "done" state — it just unmounts).

**LeftPanel.tsx** — `ReviewChecklist` renamed to `GettingStartedChecklist` and rewritten to
read `{ guideTasks }` from `useReviewState` (was `reviewItems`/`confirmItem`/`unconfirmItem`/
`isConfirmed`/`getItemsBySectionId`). It now renders ONLY the curated guide tasks with
`present === true` (max 4 rows), each showing auto-check state: a green tick circle when
`t.done`, an open circle otherwise. All manual checkbox/tick toggles removed (no
`confirmItem`/`unconfirmItem`/`isConfirmed` calls) — auto-check is the sole source of truth.
Per-section grouping and per-element `needs_review` rows are gone; the panel shows only the 4
curated tasks. Click-to-scroll preserved using each task's `target` ({sectionId, elementKey})
via the same `data-section-id` / `data-element-key` query + smooth-scroll mechanism as before.
The `LeftPanel` shell now also reads `allComplete` and computes
`isReviewMode = activeTab === 'review' && !allComplete`, so the Setup tab (header, collapsed
rotated label, and content) is hidden entirely once all tasks are done — falling back to the
sections view. Tab/label text retitled "Review" → "Setup" (header h2, collapsed label, and the
checklist h3) for consistency with the pill's "Setup: N left" wording.

**EditHeader.tsx** — imports `useReviewState`, reads `allComplete`, and gates the pill mount as
`{!allComplete && <ReviewPill />}` (belt-and-suspenders with the pill's own return-null).

**README.md:77** — corrected the `useReviewState.ts` description from "testimonial/review UI
state" to the element-verification / "Getting started" setup-guide state.

### Call-site updates
The pill and the checklist were the only consumers of the removed-from-use fields. Per the
plan, `confirmItem`/`unconfirmItem`/`isConfirmed`/`getItemsBySectionId`/`totalCount`/
`confirmedCount` remain EXPORTED by `useReviewState` (untouched — out of scope) but are no
longer called from these two components. No 5th file needed changes; a repo grep for the old
`ReviewChecklist` name finds only docs.

### Expected UX (verified by reading the code, can't run headless)
- Pill reads `Setup: N left` where N = present-but-not-done guide tasks; disappears when N hits 0.
- Left panel "Setup" tab shows at most 4 curated rows (only `present` tasks), each auto-ticked
  from content; clicking a row scrolls/focuses its target element. No per-element `needs_review`
  rows appear (those are Phase 4 inline markers).
- When all present tasks are done: pill unmounts (both EditHeader gate + pill self-hide) AND the
  Setup tab is suppressed (LeftPanel falls back to sections view).
- Progress survives reload because `guideTasks` derive from persisted content (Phase 1/2).

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — 686 passed | 2 skipped (52 files passed, 1 skipped). Green.
- No `.published.tsx` / published renderer file touched — all four files are edit-only UI or docs.

### Deviations
- Label wording: chose "Setup" (not "Getting started") for the tab header/labels to stay
  consistent with the fixed pill copy "Setup: N left", per the plan's "pick one, be consistent
  with the pill" instruction.
- Removed the unused `pillDoneStyle` constant in ReviewPill (dead after the "all reviewed" state
  was dropped) — conservative cleanup within the touched file to keep tsc/lint clean.

### Open risks
- None functional. The Setup tab auto-suppression relies on `useReviewState.allComplete`
  subscription in LeftPanel/EditHeader; if `activeTab` is left on 'review' when the last task
  completes mid-session, the panel silently reverts to the sections view (intended).

## Phase 4 — Inline markers for `ai_generated_needs_review`

### Files changed
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/globals.css`

### What changed
- **SelectionSystem.tsx**: The review-indicator effect was reworked. It previously read
  `reviewItems` + `getElementReviewStatus()` and applied THREE inline classes
  (`element-needs-review`, `element-manual-preferred` for `manual_preferred`/`stock_image`,
  `element-unconfigured`). Now it reads ONLY `useReviewState().needsReviewItems` (the isolated
  `ai_generated_needs_review` category from Phase 1) and applies a single new class
  `element-ai-verify`. It builds a `Set` of `sectionId::elementKey` flagged keys, then walks
  every `[data-element-key]` DOM node, resolving each node's `sectionId` via
  `closest('[data-section-id]')` and adding/removing `element-ai-verify` by membership. In
  `preview` mode all markers are stripped. Effect deps switched from `reviewItems` to
  `needsReviewItems`.
- **globals.css**: Replaced the entire "Review Indicator System" block (the four badge classes
  `element-needs-review`, `element-manual-preferred`, `element-unconfigured`, `image-source-badge`
  + their contenteditable-hide rule) with one new edit-only class `.element-ai-verify` (violet
  left-border + `AI · verify` `::after` pill) and a matching contenteditable-hide rule.

### How needsReviewItems map to markers
- Each `needsReviewItem` is `{sectionId, elementKey, ...}`. Composite key = `sectionId::elementKey`.
- `elementKey` may be plain (`headline`) or dotted (`collName.itemId.fieldName`, e.g.
  `images.<id>.src`). Collection-field DOM nodes carry that SAME dotted value in their
  `data-element-key` attribute (verified in e.g. `surge/blocks/Testimonials/ReviewGrid.tsx:122`,
  `data-element-key={`images.${r.id}.src`}`), so plain attribute matching resolves collection
  fields with no special-casing.
- A flagged item whose DOM node is not present (wrong page, excluded, not yet rendered) simply
  matches no element and no-ops — no crash, per phase requirement.
- NOTE (expected, Phase 5): markers do NOT yet clear on edit. Phase 4 renders a marker for every
  `needsReviewItems` entry; auto-clear (baseline diff) is Phase 5, dismiss is Phase 6.

### Old badge categories/classes removed from inline rendering
- `element-manual-preferred` (backed `manual_preferred` + `stock_image`) — removed; stock/placeholder
  images are now a Feature 1 guide task, no inline badge.
- `element-unconfigured` (backed `unconfigured` config items: CTA/nav links) — removed; now Feature 1.
- `element-needs-review` (old red "Verify" badge) — replaced by the distinct `element-ai-verify`.
- `image-source-badge` — was already dead (only referenced in globals.css, never applied); removed.
- Grep confirmed these four classes were referenced ONLY in SelectionSystem.tsx + globals.css, so
  removing them from globals.css leaves no dangling references.

### Published-renderer safety
- Edit-only. No `.published.tsx` / published renderer file touched. Markers are applied via
  imperative `classList` on the live edit DOM inside `SelectionSystem` (an edit-canvas component);
  no marker class is emitted by any published renderer path. No import into a published renderer.

### Verification
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: green — 52 files passed / 1 skipped; 686 tests passed / 2 skipped.
- CSS-only visual (violet marker + `AI · verify` pill positioning) cannot be verified headless;
  described from the code above. Structurally the new class mirrors the removed `element-needs-review`
  geometry (same top/right offsets, `::after` pill), so layout risk is minimal.

### Deviations
- Plan step 2 left it open whether to remove dead classes; grep proved `element-manual-preferred`,
  `element-unconfigured`, and `image-source-badge` are dead after the SelectionSystem rework, so all
  three were removed from globals.css (conservative: confirmed no other references first). The old
  `element-needs-review` was also retired in favor of the distinct new `element-ai-verify`, per the
  plan's "distinct from the now-removed generic review badges" instruction.

### Open risks
- None functional for Phase 4. Expected-by-design: markers don't clear on edit until Phase 5, and
  there's no dismiss control until Phase 6.
