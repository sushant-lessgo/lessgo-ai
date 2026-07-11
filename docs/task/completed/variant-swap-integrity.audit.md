# variant-swap-integrity — audit

## Phase 1 — Undo snapshot fix

### Files changed

- `src/types/core/ui.ts`
- `src/types/store/state.ts`
- `src/types/store/actions.ts`
- `src/hooks/editStore/layoutActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`
- `src/hooks/editStore/sectionSwap.test.ts` (new)

### Per-file changes

- **`src/types/core/ui.ts`** (~L3026): added `'sectionSwap'` member to the `UndoableAction` union.
- **`src/types/store/state.ts`** (L90): added `'sectionSwap'` to the `EditHistoryEntry.type` union
  (now `'content'|'layout'|'theme'|'section'|'fullContent'|'sectionSwap'`).
- **`src/types/store/actions.ts`** (L32): `updateSectionLayout` interface signature gained an
  optional 3rd param `opts?: { skipHistory?: boolean }`.
- **`src/hooks/editStore/layoutActions.ts`** (updateSectionLayout, ~L280-320): added the `opts?`
  param; the internal `type:'layout'` history push AND the `redoStack = []` clear are now wrapped
  in `if (!opts?.skipHistory)`. The `queuedChanges`/autosave push and `isDirty`/`lastUpdated`
  remain unconditional (autosave path intact). Default behavior for all existing callers unchanged.
- **`src/hooks/editStore/uiActions.ts`**:
  - `executeUndoableAction()` type-mapping (~L857): added `actionType === 'sectionSwap' ? 'sectionSwap'`
    case before the `'element-content-update'` case. Snapshot capture (before/after whole-map:
    theme + sections + content + sectionLayouts) is unchanged — it already captured everything
    `'sectionSwap'` needs.
  - `undo()` (~L741): new `else if (lastAction.type === 'sectionSwap')` branch mirroring the
    `'fullContent'` branch — restores `content` + `sections` + `sectionLayouts` from `beforeState`
    via mandatory restore-time `deepCopy` (does NOT touch `theme`).
  - `redo()` (~L819): new `else if (actionToRedo.type === 'sectionSwap')` branch mirroring the
    `'fullContent'` REDO branch — restores the same three keys from `afterState` via `deepCopy`.
    Deliberately NOT modeled on the `'section'` redo branch (which only re-adds/removes and would
    not re-clamp).
- **`src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`**:
  - `applyLayoutOnly()` (~L205) and `applyWithClamp()` (~L212): replaced
    `executeUndoableAction('section-layout-update' as any, …)` with the typed `'sectionSwap'`
    action, and pass `{ skipHistory: true }` to `updateSectionLayout`.
  - Prop type (~L166): `updateSectionLayout` prop signature widened to include the optional
    `opts?: { skipHistory?: boolean }` 3rd param (this prop is locally typed, not inferred from the
    store interface — required for the `{ skipHistory }` call to typecheck).
- **`src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`** (`handleLayoutChange`, ~L39):
  same fix — typed `'sectionSwap'` action + `updateSectionLayout(..., { skipHistory: true })`.

### Test file

`src/hooks/editStore/sectionSwap.test.ts` (picked up by the `src/**/*.test.{ts,tsx}` vitest glob;
verified by running it in isolation — 2/2 passed). Builds a real store via `createEditStore` +
`loadFromDraft` seeding a testimonials section (`elements.testimonials` = 4 cards + a `headline`
scalar + `elementMetadata.cta_button`) at layout `ReviewGrid`.

- **Clamped-swap test** — runs `updateSectionLayout(section, 'PullQuoteWithMark', {skipHistory:true})`
  + `setSection(section, {elements: clampedTo2})` inside ONE `executeUndoableAction('sectionSwap', …)`.
  Asserts: (a) exactly ONE new history entry, typed `'sectionSwap'`; swap applied (layout mirror +
  `content.layout` + 2 cards); (b) undo restores `ReviewGrid`, the full 4-card array, `elementMetadata`,
  and the `sectionLayouts[section]` mirror; (c) redo re-applies BOTH the swapped layout and the 2-card
  clamp; (d) a second undo restores the full state again.
- **Plain-swap test (e)** — a layout-only `'sectionSwap'` (no `setSection`) round-trips: one history
  entry, undo/redo flip the layout on both `sectionLayouts` and `content.layout`, cards untouched (4).

### Verification

- `npx tsc --noEmit`: clean for all Phase-1 files. Two remaining errors are in
  `src/app/api/forms/submit/route.ts` (`notifiedAt` / `notifyError` not in the Prisma
  `FormSubmission*Input` types) — a pre-existing schema drift in a file NOT touched by this phase
  and unrelated to these changes. Left as-is (out of scope).
- `npm run test:run`: **124 passed | 1 skipped test files; 1945 passed | 3 skipped tests**; exit 0.

### Deviations / notes

- **In-scope addition (not a scope change):** widened the `updateSectionLayout` PROP type inside
  `BlockVariantSelector.tsx` (~L166) in addition to the call sites. The prop is typed locally in
  that same in-scope file, and tsc failed ("Expected 2 arguments, but got 3") without it. No new
  files touched.
- Verified no other layout action near `layoutActions.ts` ~L268 double-pushes on the swap path —
  `updateSectionLayout` is the only action on that path; `setSectionLayouts`/`moveSection`/
  `reorderSections` are separate actions the swap does not call.
- The `'sectionSwap'` undo/redo branches intentionally do NOT restore `theme` (a variant swap never
  changes theme), unlike `'fullContent'` which conditionally restores it.
- Restore-time `deepCopy` kept exactly like the `'fullContent'` branches (defense-in-depth against
  aliasing; the root-cause fix is purely the type-mapping case).

### Open risks

- Manual dev-server repro (surge `bibO4F6MfOI8`, vestria hero `nmzl0brZggz5`) is the human gate,
  intentionally not run here.
- Pre-existing `forms/submit` tsc errors remain in the tree (unrelated); a full `tsc --noEmit` will
  keep reporting them until that separate schema drift is fixed.

## Phase 2 — Compatibility filter + conformance test

### Files changed

- `src/modules/templates/blockManifest.ts`
- `src/modules/generation/blockEligibility.ts`
- `src/modules/generation/blockEligibility.test.ts`
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`
- `src/modules/templates/conformance.test.ts`

### Per-file changes

- **`src/modules/templates/blockManifest.ts`**:
  - Added `copyShape?: string` to `BlockDeclaration` (~L43-60, above `capacity`), documented as the
    content-exclusive group tag.
  - Tagged surge testimonials variants with DISTINCT values: `ReviewGrid` → `copyShape: 'reviews'`
    (~L304); `PullQuoteWithMark` → `copyShape: 'pullquote'` (~L315).
  - **Manifest audit result (static both-ways-divergence rule):** only surge needed correction.
    meridian hero (TerminalHero/EditorialPhotoHero), features (Hairline/Ledger), testimonials
    (ProofWithLogoRail/CenteredEditorial) all have IDENTICAL `consumes` per pair → zero-way divergent
    → PASS, no tag. hearth = one variant per section → no pairs. vestria hero
    (VestriaFullBleedHero ⊃ VestriaTailoredHero, adds only `hero_video_*`) → one-way divergent →
    PASS, NO tag (stays freely swappable, per plan). No `consumes` corrections were required.

- **`src/modules/generation/blockEligibility.ts`** (new exports, firewall-safe — pure data, no
  schema/component imports):
  - `isCopyCompatible(decl: BlockDeclaration, sectionElements: Record<string, unknown> | null | undefined): boolean`
    — the ASYMMETRIC runtime predicate: (i) no present non-empty SCALAR key ∉ `consumes`; (ii)
    `consumes ∩ presentKeys ≠ ∅`. Array/collection present keys exempt (array-exemption guard
    comment inline). No `consumes ⊆ present` condition (superset variants stay offered).
  - `isPresentValue(value)` private helper (non-empty defn: array `length>0`, string trimmed
    non-empty, else non-nullish).
  - `findIncompatibleCoEligiblePairs(set: SectionBlockSet, classify: (layoutName, key) => ConsumedKeyKind): IncompatibleVariantPair[]`
    — the shared STATIC pairwise helper, homed beside the runtime predicate. Co-eligible = same
    `copyShape` group + both `isBlockEligible` under all-present asset facts (`internalDispatch`
    included). Flags pairs where A drops a scalar ∉ consumes(B) AND B drops a scalar ∉ consumes(A).
    `classify` is injected (schema logic stays in the test → firewall intact).
  - New exported types `ConsumedKeyKind = 'scalar' | 'collection'` and `IncompatibleVariantPair`.
  - Comment noting runtime (value-arrayness) vs static (schema) classification are intentionally
    distinct, bridged by check (e)'s consistency assertion.

- **`src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`**:
  - Imported `isCopyCompatible`.
  - Added `isVariantOffered(variant, currentLayout, currentShape, assetFacts, elements)` — the SINGLE
    offered-predicate: current variant always offered (escape hatch); a non-current variant offered
    iff asset-eligible AND same `copyShape` as current AND `isCopyCompatible` with live elements.
  - `eligibleVariantCount()` (~L75) now derives `currentShape` + live `elements` and filters via
    `isVariantOffered` → F18 Layout-button hide reflects the copy-compat + copyShape filter.
  - Component `variants` useMemo (~L197) now derives `currentShape` and filters via `isVariantOffered`
    over `sectionContent.elements` (presentKeys seam, same as `deriveEditorAssetFacts`).

- **`src/modules/generation/blockEligibility.test.ts`** (extended): `isCopyCompatible` present-key
  rules (empty/whitespace/null/empty-array not present; scalar-drop hide; collection exempt;
  non-empty-render); real surge/vestria cases (surge reviews→PullQuote HIDDEN, many-cards
  ReviewGrid still offered = clamp; vestria Tailored→FullBleed OFFERED, FullBleed→Tailored HIDDEN
  with video present / OFFERED without); helper NEGATIVE fixture (same-copyShape both-ways divergent
  → flagged), POSITIVE superset fixture (one-way → empty), different-copyShape exclusion,
  equal-consumes never flags, and the real surge set (distinct copyShape → not flagged).

- **`src/modules/templates/conformance.test.ts`** — new check **(e)**:
  - Local `contractFor` (reuses the blockManifest.test seam) + schema-based `classify` that FAILS
    LOUDLY (throws) when a consumed key's arrayness can't be resolved.
  - MAIN assertion: per (template, section), `findIncompatibleCoEligiblePairs(set, classify)` must be
    EMPTY, naming template/section/pair on failure (hard assertion, not a snapshot).
  - CONSISTENCY assertion: every DIFFERENT-`copyShape` asset-co-eligible pair must be runtime-hidden
    by `isCopyCompatible` when fed content synthesized from the OTHER variant's consumes (verifies
    surge PullQuote is hidden from reviews-shaped content by the scalar-drop rule alone).
  - HYGIENE assertion: `copyShape` (when set) never collides with a consumed key name.

### Verification

- `npx tsc --noEmit`: only the 2 pre-existing unrelated errors in `src/app/api/forms/submit/route.ts`
  (`notifiedAt` / `notifyError`) — untouched file, left as-is.
- `npm run test:run`: **124 passed | 1 skipped test files; 1976 passed | 3 skipped tests** (exit 0;
  +31 tests vs Phase 1's 1945).
- Sanity: stripping BOTH surge `copyShape` tags locally makes check (e) FAIL
  (`surge/testimonials has both-ways-scalar-divergent co-eligible pair(s): ReviewGrid↔PullQuoteWithMark`);
  reverted. (Stripping only ONE tag does NOT fail — the pair stays in different groups → still
  content-exclusive → correct.)

### Deviations / notes

- The consistency assertion iterates DIFFERENT-`copyShape` asset-co-eligible pairs (not "co-eligible"
  in the strict same-group sense, which is empty by construction) — this is the intended
  interpretation of the plan's "different-copyShape co-eligible pair" phrasing (asset-co-eligible but
  content-exclusive). Logged for clarity; no scope change.
- Applied both non-blocking plan-review guidance items: (1) the runtime-vs-static classification
  comment in `blockEligibility.ts`; (2) the copyShape/consumed-key collision hygiene assertion.
- No manifest `consumes` corrections were needed — the audit found only surge genuinely both-ways
  divergent, resolved purely by the two `copyShape` tags.

### Open risks

- Manual dev-server repro (F18 Layout-button hide on surge `bibO4F6MfOI8`, vestria hero still offered
  on `nmzl0brZggz5`) is the human gate, not run here.
- Array-key exemption in `isCopyCompatible` is safe only while every current pair renders the SAME
  collection key (guarded by the inline comment); a future pair reading a DIFFERENT collection key
  will need explicit collection-key handling.
