# edit-guide-and-verify — implementation plan

**Branch: feature/edit-guide-and-verify**

Spec: `docs/task/edit-guide-and-verify.spec.md`

## Overview
Split the edit screen's one overloaded `useReviewState` "review" system into two right-sized
features. Feature 1 is a curated 4-item "Getting started" guide that auto-checks itself from
page content, rewords the header pill ("Setup: N left"), auto-hides when done, and survives
reload because progress is derived from content. Feature 2 keeps only the AI-invented category
(`ai_generated_needs_review`) as inline canvas markers that auto-clear when the element is edited
(diffed against the persisted `baseline` AI original) and carry a persistent "leave as-is" dismiss.
Build Feature 1 first, then a feel-test decision gate, then Feature 2. Edit-only UI throughout —
nothing leaks into the published renderer.

## Design decisions (locked from scout findings)
- **One scanner, re-routed.** Keep `useReviewState.initFromContent`'s single scan; split its
  output: `needs_review` → Feature 2 inline markers; everything else → Feature 1 curated tasks.
  Do NOT write a second scanner.
- **Auto-check signals (Feature 1), read from live content:**
  - Logo: `globalSettings.logoUrl` truthy OR `content[headerId].elements.logo_image` non-empty.
    (Replaces the unconditional `__logo__` push at `useReviewState.ts:201-205`.)
  - CTA link: `content[sectionId].elementMetadata[elementKey].buttonConfig.type==='link'` &&
    `.url` non-empty (elementKey `cta_text`/`secondary_cta_text`; legacy fallback
    `content[sectionId].cta`). Semantics per `src/utils/ctaHandler.ts:20-51`.
  - Stock/placeholder image: reuse `isStockOrPlaceholder(src)` (`useReviewState.ts:52-57`);
    value at `content[sectionId].elements[key]` (string or `{content}` wrapper).
  - Contact: `content[footerId].elements.contact_email` / `contact_address` non-empty.
    (Replaces the unconditional `__contact__` push at `useReviewState.ts:215-219`.)
  - **Surface-gating:** only emit a task if the page actually has that surface (header for logo,
    a CTA element for CTA, image elements for photos, footer for contact).
  - **Collection-keyed values use the shared resolver.** If any Feature-1 auto-check reads a
    value that can live in a collection (e.g. gallery/photo collections whose flagged image keys
    are dotted `collName.itemId.fieldName`), it MUST read through the same value-resolver defined
    for Phase 5 (below), not a raw `elements[elementKey]` index — otherwise the read returns
    `undefined` and the check misfires. Plain top-level element keys stay as-is.
- **Feature 2 auto-clear — diff against the persisted `baseline`, hold NO new snapshot state.**
  A marker is active when the element's current value **equals** its `baseline` value (i.e.
  still the AI original) AND it is not dismissed. It clears the instant the current value diverges
  from baseline. Derive purely from `(current content, baseline, dismissedReviewFlags)` — no new
  "original values" store.
  - Why `baseline`, not a fresh value-snapshot: `useReviewState` is a **non-persisted** zustand
    store. A snapshot taken from first-load content is wrong after reload — post-edit, first-load
    content IS the edited value, so a fresh snapshot equals current and the marker wrongly reappears
    on every already-edited (or returning-user) field. Re-taking the snapshot on each Phase-2
    reactive refresh is worse: it chases the edited value and the marker never clears.
  - `baseline` is the correct, persisted AI original: captured by `captureBaseline()` = `export()`
    on first load when no stored baseline exists, persisted to `Project.content.baseline`,
    recaptured ONLY on Regen Copy, and NEVER overwritten by edits
    (`src/hooks/editStore/persistenceActions.ts:390-455`, `src/types/store/state.ts:379-384`).
    Because baseline is an immutable reference never mutated by edits/refresh, deriving from it
    removes the entire snapshot-chase bug class.
  - **Two read-path bugs the naive `baseline.content[sectionId].elements[elementKey]` index hits
    — both fixed by the resolver below:**
    1. **Dotted collection keys.** `needs_review` items on collection fields are keyed
       `collName.itemId.fieldName` (`useReviewState.ts:236`), e.g. `testimonials.abc.quote`. The
       real value is NOT at `elements["testimonials.abc.quote"]` (undefined); it is at
       `elements.testimonials[i].quote` where `elements.testimonials[i].id === "abc"`. A raw index
       returns `undefined` for BOTH current and baseline → `undefined === undefined` → marker
       stays active forever, never clears on edit.
    2. **Body-only-HOME baseline on multi-page.** `baseline = export()` emits `content` as
       home body-only (`persistenceActions.ts:411-442`, `:425`) but ALSO emits `pages`. On a
       multi-page project the live store `content` is the ACTIVE page (possibly a subpage), so
       `baseline.content[sectionId]` is `undefined` for subpage sections → subpage markers never
       clear (hits a live customer, Naayom). Baseline reads must be page-aware.
  - **Shared value-resolver (used for BOTH current and baseline reads).** Define one helper
    `resolveElementValue(root, sectionId, elementKey)` that:
    - (a) plain `elementKey` → `root[sectionId]?.elements?.[elementKey]`;
    - (b) dotted `collName.itemId.fieldName` → find `root[sectionId]?.elements?.[collName]` array
      item where `item.id === itemId`, then read `item[fieldName]`.
    Then normalize the returned value through the existing string/`{content}` unwrap before
    comparing. Apply the SAME resolver to current content and to the baseline object.
  - **Page-aware baseline root.** The baseline root passed to the resolver is page-aware: use
    `baseline.pages[currentPageId]?.content` for the active page, falling back to
    `baseline.content` (home body-only) when that is absent. The active page id is the edit-store
    top-level `currentPageId` (PageAxisState, `src/types/store/pages.ts:77`), threaded in by
    `EditProvider` alongside `baseline`. Current content stays the live store `content` (already
    the active page).
- **Legacy pages predate baseline (transitional caveat).** For projects created before this
  feature, the first post-feature load runs `captureBaseline()` on whatever content is currently
  stored — which for a legacy page may ALREADY contain user edits. So baseline is NOT guaranteed
  to be the pure AI original for pre-existing projects; on first exposure a legacy page may show
  markers active on fields the user already edited. This self-heals: any further edit or a dismiss
  clears the marker. Do not frame baseline as always the pure AI original for pre-existing
  projects — it is "the content at first baseline capture."
- **Only ONE new persisted field: `dismissedReviewFlags`.** Auto-check (F1) and auto-clear (F2)
  add **zero** new persisted state — both derive from already-persisted content (+ baseline).
  The lone new persisted state is Feature 2's "leave as-is" dismiss: a
  `dismissedReviewFlags: string[]` (of `"sectionId::elementKey"`) nested inside
  `content.finalContent`. It rides the existing open-ended shallow merge in
  `saveDraft/route.ts:143-148` and the client payload in `useContentSerializer.ts` — **no Prisma
  migration**. This removes the spec's schema human-gate. The persistence-path touch is still
  flagged for sign-off (Phase 6).
- **Reactivity:** `initFromContent` runs once on load (`EditProvider.tsx:179`). Add a refresh
  trigger (wired via `store.subscribe`, outside React render) so auto-check (F1) and auto-clear
  (F2) update live without re-rendering on every keystroke.
- **Wiring `baseline` in:** `useReviewState` needs the editStore `baseline` AND `currentPageId`
  to derive `activeMarkers`. `EditProvider` passes both into `initFromContent` and the refresh
  call (it already holds the edit store instance).

---

# SLICE 1 — Feature 1: "Getting started" guide

## Phase 1 — Derivation layer: split the scan, derive curated tasks
Rework `useReviewState` so its single scan produces (a) the `needs_review` set untouched for
later, and (b) a curated, content-derived task list. No UI change yet.

**Files touched**
- `src/hooks/useReviewState.ts`

**Steps**
1. Keep the existing `initFromContent` scan; stop discarding/mislabeling categories. Expose two
   selectors/derived shapes: `needsReviewItems` (unchanged category) and `guideTasks`.
2. Define the curated task model — **exactly 4 tasks, same for everyone**: `add_logo`,
   `link_ctas`, `replace_stock_photos`, `add_contact`. (No `review_headline`.) Each task:
   `{ id, label, done: boolean, present: boolean, target?: {sectionId, elementKey} }`.
3. Compute `present` (surface exists) and `done` (auto-check signal met) per task using the
   signals in Design decisions. Read the header-logo, CTA `buttonConfig`, image `isStockOrPlaceholder`,
   and footer contact fields from live content. **Any read of a collection-keyed value must go
   through the shared `resolveElementValue` resolver (Phase 5), not a raw `elements[elementKey]`
   index.**
4. Delete the unconditional `__logo__` (`:201-205`) and `__contact__` (`:215-219`) pushes;
   replace with content-derived task presence/done.
5. Derive `remainingCount = tasks.filter(t => t.present && !t.done).length` and
   `allComplete = remainingCount === 0`. These back the pill wording + auto-hide.

**Verification**
- `npx tsc --noEmit` clean.
- `npm run test:run` green (adjust/extend any `useReviewState`-touching test; add a small unit
  test asserting each of the 4 tasks' `done`/`present` from a synthetic content fixture — logo set
  vs unset, CTA linked vs not, stock vs replaced image, contact filled vs empty; assert exactly 4
  task ids, no 5th).
- Edit-only module; published parity unaffected.

## Phase 2 — Reactivity: auto-check updates live
Make the derived task state recompute on content changes so checks tick without reload, and lay
the shared refresh mechanism Feature 2 will also use.

**Files touched**
- `src/components/EditProvider.tsx`
- `src/hooks/useReviewState.ts`

**Steps**
1. Add a lightweight `refreshFromContent(content, baseline, currentPageId)` action to
   `useReviewState` that re-derives tasks/needs_review without resetting user-facing dismiss state.
   The action must **`set` a no-op when the derived output is unchanged** (compare derived result;
   skip the set if equal) so contentEditable keystrokes don't trigger re-renders.
2. In `EditProvider`, wire the refresh via **`store.subscribe(...)` OUTSIDE React render** (not a
   render-phase selector) on the edit store's content (and `globalSettings.logoUrl`), passing the
   current `content` + `baseline` + `currentPageId` into `refreshFromContent`. Preserve the
   existing one-time `initFromContent` at `:179` for first load (now also passing `baseline` +
   `currentPageId`).
3. Confirm reload path: because tasks are derived from persisted content, a refresh reproduces the
   same state on next load (progress survives reload with no new field).

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- Manual (dev, `npm run dev`): edit a CTA link / drop a logo → corresponding task flips to done
  without reload; refresh page → state persists. Typing into a text element does NOT cause a
  visible re-render storm (no-op set holds).

## Phase 3 — UI rewire: pill + left-panel guide + auto-hide
Convert the pill and left-panel checklist into the curated auto-checking guide.

**Files touched**
- `src/app/edit/[token]/components/ui/ReviewPill.tsx`
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/hooks/README.md`

**Steps**
1. `ReviewPill`: reword `X/Y reviewed` → `Setup: {remainingCount} left`; render nothing when
   `allComplete` (auto-hide). Keep it reading from `useReviewState`.
2. `LeftPanel` (`ReviewChecklist`): retitle tab "Review" → "Getting started" (or "Setup");
   render the curated task rows (only `present` tasks), each showing done/not-done from auto-check;
   remove manual checkboxes/ticking. Keep today's click-to-scroll/focus behavior via each task's
   `target`. Hide the tab entirely when `allComplete`.
3. `EditHeader` (~:65): gate the pill mount on not-`allComplete` (belt-and-suspenders with the
   pill's own hide).
4. `src/hooks/README.md:77`: fix the line mislabeling `useReviewState` as "testimonial/review UI".
5. Ensure no `needs_review` rows appear in the left panel anymore (they belong to Feature 2).

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- Manual: pill reads "Setup: N left"; guide shows ≤4 curated rows not per-element; clicking a task
  scrolls/focuses; completing all tasks hides pill + tab; reload keeps completion. Publish preview
  shows no guide UI.

---

## 🚦 HUMAN DECISION GATE (from spec Pilot) — feel test
**Stop after Phase 3.** User evaluates on a real generated page: does the curated auto-checking
guide feel like the "don't-feel-lost" orientation thing? Proceed to Slice 2 only on user sign-off.
(This is a feel/product gate, not a technical one.)

---

# SLICE 2 — Feature 2: "Verify AI-invented specifics" markers

## Phase 4 — Inline markers for `ai_generated_needs_review`
Render the needs_review category (already isolated in Phase 1) as inline canvas markers only.

**Files touched**
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/globals.css`

**Steps**
1. In `SelectionSystem`, for each element in `useReviewState.needsReviewItems`, apply an inline
   marker badge (per-element, keyed `sectionId::elementKey`). No checklist rows.
2. Add marker badge styling in `globals.css` (near existing badge styles ~205–290). Distinct from
   the removed generic review badges; edit-only classes.
3. Confirm markers are strictly canvas overlay in the edit renderer — not emitted by any
   `.published.tsx` / published renderer path.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- Manual: elements tagged `ai_generated_needs_review` show an inline marker; stock-image /
  unconfigured items do NOT (they're Feature 1 tasks now). Published output has zero markers.

## Phase 5 — Auto-clear on edit (diff vs persisted baseline)
Marker disappears the moment the element value diverges from its `baseline` AI original. **No new
snapshot/persisted state** — derive from `(current content, baseline, dismissedReviewFlags)`.

**Files touched**
- `src/hooks/useReviewState.ts`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`

**Steps**
1. Add the shared **`resolveElementValue(root, sectionId, elementKey)`** helper (see Design
   decisions) that handles both key shapes and returns the normalized (string/`{content}`-unwrapped)
   value:
   - plain `elementKey` → `root[sectionId]?.elements?.[elementKey]`;
   - dotted `collName.itemId.fieldName` → find the array item in
     `root[sectionId]?.elements?.[collName]` whose `id === itemId`, then read `[fieldName]`.
   Use it for BOTH the current and baseline reads so the comparison is apples-to-apples.
2. In the derive (used by both `initFromContent` and `refreshFromContent`), compute
   `activeMarkers` = needs_review items where `resolveElementValue(current, …) ===
   resolveElementValue(baselineRoot, …)` (still AI original) AND key ∉ `dismissedReviewFlags`
   (dismiss added in Phase 6).
   - **Page-aware baseline root:** `baselineRoot = baseline.pages[currentPageId]?.content ??
     baseline.content`. Current root = live store `content` (already the active page). Pass
     `currentPageId` in from `EditProvider` (Phase 2 wiring).
   - Hold NO `originalValues` state. Do not snapshot first-load content. Do not re-snapshot on
     refresh. The immutable `baseline` reference is the only source of the AI original.
   - Guard the missing-baseline case: if the resolver returns `undefined` for the baseline slot
     (no baseline for that page/element), treat the marker as active (unchanged) rather than
     crashing — baseline is normally present from first load. (Note the legacy-page transitional
     caveat in Design decisions.)
3. Editing routes through `updateElementContent` (`contentActions.ts:58`) → current value diverges
   from baseline → the Phase-2 `store.subscribe` refresh recomputes → `current !== baseline` →
   marker drops. Because baseline is never mutated by edits, the drop is permanent.
4. `SelectionSystem` renders only `activeMarkers`.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green. Add unit tests using a synthetic
  content+baseline fixture:
  - edited value (≠ baseline) → marker NOT in `activeMarkers`;
  - unchanged value (= baseline) → marker present;
  - **already-edited-at-first-load**: content value ≠ baseline value on the very first derive
    (simulating a returning user whose edit is baked into content) → marker absent (this is the
    regression the value-snapshot design failed);
  - **collection dotted key**: a `needs_review` item keyed `coll.itemId.field`, with the value
    living in the `coll` array item — edited item value ≠ baseline item value → marker absent;
    equal → marker present (proves the resolver, not raw index);
  - **multi-page subpage**: baseline has `pages[subPageId].content` and NO matching top-level
    `content[sectionId]`; a subpage `needs_review` marker clears when the subpage value diverges
    from `baseline.pages[subPageId].content` (proves page-aware baseline root).
- Manual (dev): edit a flagged number → its marker vanishes immediately; other markers stay.
- **Reload-persistence (must pass):** edit a flagged element → save → reload → marker STAYS
  cleared (does not reappear). Open a returning page that already has prior edits baked into
  content → markers appear ONLY on still-unedited AI-original fields, never on already-edited ones.
- **Multi-page (must pass):** on a subpage of a multi-page project, edit a flagged element →
  marker clears (does not stay permanently stuck).

## Phase 6 — "Leave as-is" dismiss + persistence  🔒 HUMAN GATE (persistence path)
Add the per-marker dismiss control and persist it in `content.finalContent.dismissedReviewFlags`.
This is the **only** new persisted state in the whole feature.

**Human gate:** changes what draft persists (persistence path touch). No Prisma migration (JSON
merge only) — the spec's schema gate does NOT apply. Get user sign-off on persisting
`dismissedReviewFlags` in `finalContent` before merge.

**Files touched**
- `src/hooks/useReviewState.ts`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/hooks/useContentSerializer.ts`
- `src/app/api/saveDraft/route.ts`
- `src/components/EditProvider.tsx`
- `src/hooks/editStore/generationActions.ts`
- `src/app/globals.css`

**Steps**
1. `useReviewState`: add `dismissedReviewFlags: string[]` state, a `dismiss(sectionId, elementKey)`
   action, and include dismissed keys in the `activeMarkers` exclusion from Phase 5. Read initial
   value from `content.finalContent.dismissedReviewFlags` on `initFromContent`.
2. `SelectionSystem`: add a tiny "leave as-is" control on each marker → calls `dismiss(...)`;
   marker clears immediately. Style the control in `globals.css`.
3. `useContentSerializer.ts`: include `dismissedReviewFlags` in the saved payload nested under
   `finalContent`.
4. `saveDraft/route.ts`: verify the array survives the existing shallow merge (`:143-148`); the
   content field is open-ended (`[key:string]:any`) so likely no change beyond confirming the merge
   preserves nested `dismissedReviewFlags`. Touch only if merge would drop it.
5. **Hydration (read side) — `EditProvider.tsx`:** saving is not enough. Confirm the `loadDraft`
   path actually surfaces `content.finalContent.dismissedReviewFlags` into the object that
   `initFromContent` reads. Trace loadDraft → the content passed into `initFromContent` (`:179`);
   if `finalContent.dismissedReviewFlags` is dropped/not hydrated on read, thread it through so the
   dismiss re-hydrates on reload. (This is the read-side twin of the Phase-6 write path.)
6. **Regen Copy path — clear stale dismisses.** Regen re-captures baseline
   (`generationActions.ts:609`, `regenerateAllContent` → `captureBaseline()`), which intentionally
   resets markers to all-active for the fresh AI copy. But dismissed keys still living in
   `finalContent.dismissedReviewFlags` would silently suppress markers on **re-invented** values
   at the same `sectionId::elementKey`. Add a step in the regen path to CLEAR
   `dismissedReviewFlags` (both the persisted `finalContent` slot and the `useReviewState` state)
   when baseline is re-captured, so re-generated specifics start un-dismissed.
7. **Auto-save on dismiss.** Confirm `dismiss(...)` marks the edit store dirty
   (`persistence.isDirty`) so the existing auto-save fires and the array is persisted. If the
   dismiss action does not touch edit-store state, add an explicit "mark dirty" so auto-save
   triggers (do NOT rely on a later unrelated edit to flush it).

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- Manual: click "leave as-is" on a correct-but-flagged value → marker clears; **reload → STAYS
  cleared** (verifies both write and read/hydration paths); other markers unaffected. Publish
  preview shows no markers/dismiss UI.
- Manual (regen): dismiss a marker → Regen Copy → a re-invented value at that same key shows a
  marker again (dismiss did not silently suppress it).
- Confirm no Prisma migration was needed (JSON-only); `prisma migrate dev` not invoked.

---

## Cross-cutting verification (final)
- `npx tsc --noEmit` and `npm run test:run` green.
- Editor↔published parity unaffected — all changes are edit-only; no `.tsx`/`.published.tsx` pair
  touched, no published renderer or `componentRegistry.published` import.
- Publish remains ungated (no code consults guide/markers in the publish path).
- Reload-persistence holds for both features: guide progress (derived from content) and marker
  auto-clear (derived from content vs baseline) survive reload; dismiss (persisted) survives reload.
- Multi-page: subpage markers clear on subpage edits (page-aware baseline root).

## Open questions / risks
_All prior open questions resolved in-body:_
- **CTA "done" across multiple CTAs** → RESOLVED: task is done when **all present primary CTAs**
  are linked (a page with any unlinked primary CTA keeps the task open). Secondary CTAs do not
  gate the task.
- **Auto-save on dismiss** → RESOLVED: Phase 6 step 7 requires `dismiss(...)` to mark the edit
  store dirty so the existing auto-save fires (add explicit mark-dirty if the action doesn't
  already touch store state).

<!-- RESOLVED (folded into body):
 - Drop review_headline → locked: 4 auto-checkable tasks only (Design decisions).
 - AI-original snapshot source → resolved NO: first-load content is not reliably the AI original
   (post-edit / returning users bake edits in); diff vs persisted `baseline`, not a value snapshot
   (Design decisions + Phase 5).
 - Read-path bug #1 (dotted collection keys) → shared resolveElementValue resolver (Phase 5).
 - Read-path bug #2 (body-only-HOME baseline on multi-page) → page-aware baseline root
   baseline.pages[currentPageId].content ?? baseline.content (Phase 5).
 - Regen + stale dismisses → clear dismissedReviewFlags on Regen Copy path (Phase 6 step 6).
 - Legacy pages predate baseline → transitional caveat acknowledged (Design decisions).
-->
