# Schema Consolidation — Single Source of Truth

## Problem

Three overlapping definitions for element metadata:

1. **`layoutElementSchema.ts`** (central) — fillMode, requirement, collections, constraints. Used by AI gen, review system, element toggles.
2. **`CONTENT_SCHEMA`** (per UIBlock, 48 files) — type + default value. Used by `extractLayoutContent` for rendering.
3. **TypeScript interface** (per UIBlock) — typed field names. Used for type safety.

Key list is duplicated between #1 and #2. If they drift, things silently break. Defaults in #2 are disconnected from the metadata in #1.

---

## Target: Single Schema

Merge `CONTENT_SCHEMA` defaults into `layoutElementSchema`. Delete `CONTENT_SCHEMA` from all 48 UIBlocks.

```ts
// layoutElementSchema.ts — THE schema
leftCopyRightImage: {
  elements: {
    headline: {
      type: "string",
      requirement: "required",
      fillMode: "ai_generated",
      default: "Transform Your Business with Smart Automation"
    },
    badge_text: {
      type: "string",
      requirement: "optional",
      fillMode: "ai_generated",
      default: "🎉 New Feature Launch"
    },
    hero_image: {
      type: "string",
      requirement: "required",
      fillMode: "manual_preferred",
      default: "/hero-placeholder.jpg"
    },
    show_social_proof: {
      type: "boolean",
      requirement: "optional",
      fillMode: "manual_preferred",
      default: true
    },
    // ...
  },
  collections: { ... }
}
```

- `useLayoutComponent` reads defaults from central schema — no more `contentSchema` prop
- Delete `CONTENT_SCHEMA` from all 48 UIBlocks
- TypeScript interface stays in UIBlock (just field typing, not duplicated metadata)

---

## Element Rendering Logic (The 4-Case Model)

Every element has two axes:

**fillMode**: who provides the value
- `ai_generated` — AI writes it (includes `ai_generated_needs_review` sub-type)
- `manual_preferred` — user provides it

**requirement**: when it renders
- `required` — always present
- `optional` — conditionally present

### Behavior Matrix

| fillMode | requirement | Initial state | When renders | Default purpose |
|----------|-----------|---------------|-------------|-----------------|
| ai_generated | required | AI always creates value | Always | Safety net if AI fails |
| ai_generated | optional | AI decides — generates or skips | Only if AI generated OR user toggles on | Placeholder when user toggles on |
| manual_preferred | required | Render with placeholder | Always | Placeholder until user edits |
| manual_preferred | optional | Not rendered | Only after user toggles on | Placeholder when user toggles on |

Every element has a `default`. The difference is **when it appears**, not whether a default exists.

### Gating Logic for `extractLayoutContent`

```
for each key in centralSchema.elements:
  if excluded (in excludedElements)     → skip
  if value exists in store              → render value
  if requirement === 'required'         → render default
  if requirement === 'optional':
    if user toggled on (not excluded + has stored value) → render value/default
    else                                                → skip
```

---

## Current Bugs This Fixes

### Bug 1: `isInSchema` catch-all defeats mandatory/optional distinction

`extractLayoutContent` lines 416-420:
```ts
if (isMandatory) {
  result[key] = config.default;      // required → show default ✅
} else if (isInSchema) {
  result[key] = config.default;      // optional → ALSO show default ❌
}
```

The `else if (isInSchema)` makes every element in schema render with defaults regardless of requirement. Fix: delete this branch. Optional elements without values should not render.

### Bug 2: manual_preferred + optional never excluded

During generation, exclusion logic only runs against ai_generated elements (only those are sent to AI). Manual_preferred elements are never sent to AI, so they're never added to `excludedElements`. Result: `show_social_proof`, `hero_image` etc. always render because they're never gated.

**Fix (generation-time):** During generation, also add `manual_preferred + optional` elements to `excludedElements` by default. User can toggle them on later.

### Bug 3: Per-component guards mask the broken gating

UIBlocks work around the broken `extractLayoutContent` with scattered conditional rendering:
- `{blockContent.badge_text && blockContent.badge_text.trim() !== '' && ...}`
- `{(blockContent.supporting_text || mode === 'edit') && ...}`
- Empty string defaults (`badge_text: { default: '' }`) to make truthy checks work

With correct schema-driven gating, these hacks become unnecessary. If an optional element has no value and isn't toggled on, it simply won't be in `blockContent`. UIBlocks just render whatever's in `blockContent`.

---

## Toggle System (How It Works Today)

`excludedElements` (stored in `aiMetadata.excludedElements`) is the only toggle mechanism. No `addedElements` exists.

**Toggle OFF**: add to `excludedElements`
**Toggle ON**: remove from `excludedElements` + write placeholder content to store

The toggle modal (`ElementToggleModal.tsx`) shows all elements (required + optional) with switches. Required elements are always ON (switch disabled). Optional elements can be toggled.

When user toggles an optional element ON:
1. Removed from `excludedElements`
2. Placeholder content written to store (line 92-94 of ElementToggleModal)
3. `extractLayoutContent` finds value → includes in `blockContent` → renders

This mechanism is correct. The gap is only in **initial state** — what's excluded by default when a page is first generated.

---

## Published Renderers — Parallel Path

**Edit mode** and **published mode** use completely different rendering paths:

**Edit:**
```
Store → useLayoutComponent → extractLayoutContent(elements, schema, excludedElements) → blockContent
```

**Published:**
```
Store → LandingPagePublishedRenderer → extractContentFields(data) → spread as props → component reads props.fieldName directly
```

Published renderers bypass `extractLayoutContent` entirely. No schema check, no exclusion filtering. They flatten whatever's in the store and pass it as props.

**Impact:** Any gating fix to `extractLayoutContent` only applies in editor. Published pages still rely on per-component guards (`{badge_text && <Badge/>}`).

**Fix options:**
1. **Shared gating utility** — both edit and published paths call the same function to decide what renders
2. **Clean store at publish time** — strip empty/excluded optional elements before saving to published state
3. **Keep per-component guards for published** — messy but lowest risk

Option 2 is cleanest — publish is a deliberate action, good place to sanitize.

---

## Migration Plan

### Phase 1: Add defaults to central schema
- Add `default` field to every element in `layoutElementSchema.ts`
- Source defaults from existing `CONTENT_SCHEMA` in each UIBlock (they're identical, just copy over)
- No behavior change yet

### Phase 2: Wire `extractLayoutContent` to central schema
- Change `useLayoutComponent` to read defaults from `layoutElementSchema[layoutName]` instead of `contentSchema` prop
- Remove `contentSchema` prop from `useLayoutComponent`
- Delete `CONTENT_SCHEMA` from all 48 UIBlocks

### Phase 3: Fix gating logic
- Delete `else if (isInSchema)` branch in `extractLayoutContent`
- Read `fillMode` + `requirement` from central schema to implement 4-case model
- During generation, add `manual_preferred + optional` elements to `excludedElements` by default

### Phase 4: Clean up UIBlock guards
- Remove scattered per-component conditional rendering hacks
- Elements not in `blockContent` simply don't render — schema drives it

### Phase 5: Published path
- Add store sanitization at publish time — strip excluded/empty optional elements
- Or add shared gating utility used by both paths

---

## Files Affected

| File | Change |
|------|--------|
| `layoutElementSchema.ts` | Add `default` field to all elements |
| `useLayoutComponent.ts` | Read from central schema, drop `contentSchema` prop |
| `storeTypes.ts` (`extractLayoutContent`) | Fix gating: respect fillMode + requirement |
| 48 UIBlock `.tsx` files | Delete `CONTENT_SCHEMA` |
| `generationActions.ts` | Exclude `manual_preferred + optional` at generation time |
| `LandingPagePublishedRenderer.tsx` | Add publish-time sanitization |

---

## Unresolved Questions

1. Do published `.published.tsx` components (separate files) need changes, or is publish-time sanitization enough?
2. Should TypeScript interfaces in UIBlocks be auto-generated from central schema (build step), or keep manual?
3. Collections have their own `fields` with defaults — same consolidation needed there?
4. Any UIBlocks with non-standard `CONTENT_SCHEMA` patterns that would break?

---

## Appendix A: Schema Mismatches (CONTENT_SCHEMA vs layoutElementSchema)

Audit of all UIBlock files — re-verified Feb 2026. Original audit had errors.

### Confirmed mismatches (resolved)

| UIBlock | Keys | Status |
|---|---|---|
| **SplitCard** | `before_placeholder_text`, `after_placeholder_text` | **Dead code** — in CONTENT_SCHEMA but never used in render. Deleted from CONTENT_SCHEMA and interface. |

### False positives from original audit

| UIBlock | Claimed issue | Actual |
|---|---|---|
| **CenteredHeadlineCTA** | `customer_label`, `rating_stat`, `uptime_stat`, `uptime_label` missing from schema | All 4 exist in layoutElementSchema (lines 1658-1661) |
| **ContactFooter** | `footer_style` missing from schema | Exists in layoutElementSchema (line 1756) |
| **VisualCTAWithMockup** | `secondary_cta` vs `secondary_cta_text` naming mismatch | Both use `secondary_cta` — no mismatch |

### Intentional gaps (no action needed)

| UIBlock | Gap | Reason |
|---|---|---|
| **MinimalNavHeader** | `nav_items` in layoutElementSchema but CONTENT_SCHEMA is empty | Nav managed via store.navigationConfig, not section-level content |

### Non-standard but aligned (no action needed)

| UIBlock | Pattern |
|---|---|
| **IconGrid** | Feature defaults missing `icon` field — correct, icon is manual_preferred |
| **ValueStackCTA** | 5 hardcoded default items — goes away with collection consolidation (no item-level defaults) |

**Result**: After SplitCard cleanup, schemas have 1:1 key parity. No blockers for consolidation.

---

## Appendix B: Resolved Questions

### Q1: Do `.published.tsx` components need changes, or is publish-time sanitization enough?

**Publish-time sanitization is sufficient. No `.published.tsx` changes needed.**

Solution: resolve at publish time, not render time.
- When user publishes, run all sections through the 4-case gating logic
- Only write resolved elements to DB — excluded/empty optional elements stripped from snapshot
- `.published.tsx` becomes pure renderer — render whatever props exist, skip whatever's missing
- No schema imports on server bundle, no shared gating utility across client/server boundary

```
Edit path:   Store → schema gating → blockContent → render
Publish:     Store → schema gating → sanitized snapshot → DB
Published:   DB → props → render (no gating needed)
```

Re-publish after toggling elements → new snapshot with updated resolved elements. Publish API (`/api/publish`) already processes store data before saving — sanitization slots in there.

**Note**: Three separate default systems currently exist (CONTENT_SCHEMA, inline fallbacks in `.published.tsx`, layoutElementSchema). After consolidation, all three collapse into one — the central schema. Published components can drop their inline `props.x || 'fallback'` patterns since missing props simply won't render.

### Q2: Auto-generate TypeScript interfaces from schema?

**Keep manual.** Build step adds complexity for minimal gain. Interfaces rarely drift since they're in the same file as the component. After consolidation, interface is just `{ [key]: string | undefined }` — trivial to maintain.

### Q3: Collections — same consolidation needed?

**No item-level defaults needed.** Collections differ from elements:

| Level | Default needed? | Why |
|---|---|---|
| Collection itself | `[]` (empty array) | Prevents undefined crash |
| Individual items | No | Count is 0 to max, determined by AI or user |
| Fields within item | Yes — as **template** only | Used when user clicks "Add Item" (e.g. `{ id: system, title: '', description: '' }`) |

`layoutElementSchema` already has this right — `fields` defines shape/template, `constraints` defines min/max. The hardcoded placeholder items in CONTENT_SCHEMA (e.g. IconGrid's 6 fake features) are fake content pretending to be defaults — they go away.

### Q4: Non-standard CONTENT_SCHEMA patterns that would break?

**Re-verified — only 1 real mismatch found (SplitCard), now resolved.** Original audit had errors — CenteredHeadlineCTA, ContactFooter, and VisualCTAWithMockup all have correct key parity. See corrected Appendix A. No blockers for consolidation.
