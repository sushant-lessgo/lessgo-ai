# Schema Consolidation — Implementation Plan

Reference: `newSchema.md` for full spec.

---

## Overview

```
Week 1          Week 2               Week 3
─────────────── ──────────────────── ─────────────────
PILOT (1 dev)   SCALE (2 devs ∥)    PUBLISHED + QA
  Phase 0         Phase 1a ∥ 1b       Phase 2
  Phase 1         Phase 1c             Phase 3
  Validate        Validate             Final QA
```

1 dev for pilot + core. 2 devs for scaling. 1 dev for published path. **Max 2 devs active at once.**

---

## Phase 0: Fix Appendix A Mismatches (Blocker)

**Serial. 1 dev. Before anything else.**

Re-verify Appendix A audit (has at least one error — CenteredHeadlineCTA fields DO exist in central schema). Then:

- Add missing keys to `layoutElementSchema.ts`: `before_placeholder_text`, `after_placeholder_text` (SplitCard), `footer_style` (ContactFooter)
- Fix naming: pick `secondary_cta_text` (matches everywhere else), rename in VisualCTAWithMockup's CONTENT_SCHEMA
- Verify MinimalNavHeader nav_items gap — is it intentional?

**Validation:** `npm run build` passes. Grep confirms 1:1 key parity between CONTENT_SCHEMA and layoutElementSchema for pilot UIBlocks.

**Output:** Central schema has all keys. Zero drift for pilot targets.

---

## Phase 1: Pilot — 2 UIBlocks End-to-End (Serial, 1 Dev)

Pick **CenterStacked** (Hero) and **LeftCopyRightImage** (Hero). They cover all 4 cases:

| Element | fillMode | requirement | Case |
|---------|----------|------------|------|
| `headline` | ai_generated | required | AI + required |
| `badge_text` | ai_generated | optional | AI + optional |
| `hero_image` | manual_preferred | required | Manual + required |
| `show_social_proof` | manual_preferred | optional | Manual + optional |

### Step 1a: Add `default` to central schema for pilot UIBlocks

Add default values (copy from existing CONTENT_SCHEMA) to `layoutElementSchema.ts` for CenterStacked and LeftCopyRightImage entries.

### Step 1b: Create `getSchemaDefaults(layoutName)` utility

New function in `layoutElementSchema.ts`:
```ts
export function getSchemaDefaults(layoutName: string): Record<string, { type: string; default: any }>
```
Returns `{ key: { type, default } }` map from central schema — same shape as CONTENT_SCHEMA. This is the bridge: `useLayoutComponent` calls this instead of receiving `contentSchema` prop.

### Step 1c: Wire pilot UIBlocks to central schema

In `useLayoutComponent`:
- If no `contentSchema` prop, call `getSchemaDefaults(layout)` as fallback
- Pilot UIBlocks: remove `contentSchema: CONTENT_SCHEMA as any` from hook call
- Delete `CONTENT_SCHEMA` from CenterStacked and LeftCopyRightImage

### Step 1d: Fix gating logic for pilot

In `extractLayoutContent`:
- Delete `else if (isInSchema)` branch
- Add fillMode + requirement check:
  - `required` → render default
  - `optional + no value + not toggled on` → skip

### Step 1e: Fix generation exclusions for pilot

In `generationActions.ts` (`updateFromAIResponse`):
- After AI response, also add `manual_preferred + optional` elements to `excludedElements`
- Only for pilot UIBlocks initially (check layout name)

### Validation Checklist (Pilot)

```
[ ] CenterStacked: ai_generated + required (headline) → always renders
[ ] CenterStacked: ai_generated + optional (badge_text) → only if AI generated or user toggled on
[ ] CenterStacked: manual_preferred + required (hero_image) → always renders with placeholder
[ ] CenterStacked: manual_preferred + optional (show_social_proof) → not rendered by default, user toggles on
[ ] Same 4 checks for LeftCopyRightImage
[ ] Element toggle modal: toggle optional element on → appears with default
[ ] Element toggle modal: toggle optional element off → disappears
[ ] Palette swap / texture change → no regression on text colors
[ ] Existing draft loads → no missing elements, no new unwanted elements
[ ] New generation → correct initial state for all 4 cases
[ ] npm run build passes
```

**Output:** 2 UIBlocks fully on central schema, gating correct, CONTENT_SCHEMA deleted.

---

## Phase 1.5: Scale — Remaining 46 UIBlocks (Parallel, 2 Devs)

Mechanical. Split by section type, zero file overlap.

### Dev A: 23 UIBlocks
- Hero: SplitScreen, ImageFirst
- CTA: all 3
- Features: all 4
- HowItWorks: all 4
- Results: all 3
- Pricing: all 3
- Header: 1
- Footer: 1
- SocialProof: 1
- FounderNote: 1

### Dev B: 23 UIBlocks
- FAQ: all 4
- Testimonials: all 4
- UniqueMechanism: all 4
- BeforeAfter: all 3
- UseCases: all 3
- ObjectionHandle: all 2
- Problem: all 1
- Remaining from any category

### Per-UIBlock checklist (same for both devs)

1. Add `default` values to central schema entry
2. Remove `contentSchema: CONTENT_SCHEMA as any` from `useLayoutComponent` call
3. Delete `CONTENT_SCHEMA` const
4. Delete `Content interface` if it only duplicated schema keys (keep if it adds typing value)
5. Remove per-component rendering guards that are now redundant (`{x && x.trim() !== '' && ...}`)
6. `npm run build`

### Dev A and Dev B work in parallel — no shared files

Only shared file is `layoutElementSchema.ts` (both add defaults). Resolve by:
- Dev A adds defaults for their 23 blocks first, commits
- Dev B rebases, adds defaults for their 23 blocks

### Remove generation layout-name guard

Once all 46 are done, remove the pilot-only check from step 1e — `manual_preferred + optional` exclusion applies to all layouts.

### Validation

```
[ ] npm run build — zero errors
[ ] Zero remaining CONTENT_SCHEMA in codebase (grep confirms)
[ ] Generate fresh page — all section types render correctly
[ ] Load existing draft — no regressions
[ ] Element toggles work across all section types
[ ] Spot-check 5 random UIBlock types for 4-case correctness
```

---

## Phase 2: Published Path (Parallel with Phase 1.5, 1 Dev)

Can start as soon as Phase 1 pilot is validated. Independent code path.

### Step 2a: Add sanitization to publish API

In `/api/publish` (or wherever store snapshot is saved):
- Import central schema
- For each section, run elements through 4-case gating
- Strip excluded/empty optional elements from snapshot
- Write sanitized data to DB

### Step 2b: Clean up `.published.tsx` inline fallbacks

After sanitization, published components receive only resolved elements. Remove scattered `props.x || 'fallback'` patterns — if prop is missing, don't render.

Low priority — existing fallbacks are harmless. Can defer to Phase 3 cleanup.

### Validation

```
[ ] Publish a page → inspect DB snapshot → no excluded elements present
[ ] Published page renders correctly
[ ] Toggle element off → re-publish → element gone from published page
[ ] Toggle element on → re-publish → element appears on published page
```

---

## Phase 3: Final QA + Cleanup (Serial, 1 Dev)

### Regression sweep

- Generate 5 new pages with different vibes/palettes
- Load 5 existing drafts from before migration
- Check every section type renders correctly in editor
- Check every section type renders correctly when published
- Element toggles work everywhere
- Review pill counts are correct (no booleans, no phantom elements)

### Legacy draft migration (if needed)

Old drafts may not have `excludedElements` set for `manual_preferred + optional` elements. Two options:
- **Lazy migration**: on draft load, if `excludedElements` is missing for manual_preferred + optional elements that have no value, add them. One-time per draft.
- **Accept current state**: old drafts render as they did before. Only new generations get correct initial state.

Recommend lazy migration — small, safe, prevents confusion.

### Cleanup

- Remove debug logs added during development
- Remove any feature flags / pilot guards
- Update `CLAUDE.md` to reflect new schema architecture

---

## Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing drafts break (missing elements) | High | Pilot on 2 blocks first. Lazy migration for old drafts. |
| Wrong defaults copied from CONTENT_SCHEMA | Medium | Audit script: diff CONTENT_SCHEMA defaults vs what gets added to central schema |
| Published pages lose elements | High | Phase 2 sanitization tested independently. Old published pages unaffected (already in DB). |
| Element toggle modal breaks | Medium | Toggle system reads from same `excludedElements` — no change to toggle mechanism itself |
| 48-file mechanical change introduces typos | Low | `npm run build` catches missing keys. Grep confirms zero remaining CONTENT_SCHEMA. |

---

## Summary

| Phase | What | Devs | Depends on | Duration |
|-------|------|------|-----------|----------|
| 0 | Fix schema mismatches | 1 | — | 1 day |
| 1 | Pilot: 2 UIBlocks end-to-end | 1 | Phase 0 | 2-3 days |
| 1.5 | Scale: remaining 46 UIBlocks | 2 ∥ | Phase 1 validated | 2-3 days |
| 2 | Published path sanitization | 1 ∥ | Phase 1 validated | 1-2 days |
| 3 | Final QA + cleanup + legacy migration | 1 | Phase 1.5 + 2 done | 1-2 days |

**Total: ~2 weeks. Max 2 devs concurrent. Phase 1.5 and Phase 2 run in parallel.**

---

## Appendix: Pilot Learnings (Phase 1 → Phase 1.5 Carry-Forward)

### 1. Implicit `any` Explosions

~20 UIBlock files have `const items = blockContent.something || []` without type annotations. The `.map()` callbacks lose types → `Parameter implicitly has an 'any' type` build errors. **During Phase 1.5, every UIBlock needs explicit types on array destructures:**

```ts
// BAD — triggers implicit any on .map()
const features = blockContent.features || [];

// GOOD
const features: Feature[] = blockContent.features || [];
```

Files already fixed in pilot: SideBySideBlock, CenteredHeadlineCTA, ValueStackCTA, IndustryUseCaseGrid, LogoWall, ResultsGallery, IconGrid, VisualCTAWithMockup, SplitAlternating, SecretSauceReveal, TechnicalAdvantage, MinimalNavHeader, VideoWalkthrough, MythVsRealityGrid, VisualObjectionTiles, PropertyComparisonMatrix, MethodologyBreakdown, StatBlocks. Remaining UIBlocks likely have the same issue.

### 2. `toggleGroup` Pattern for Grouped Elements

Pilot introduced `toggleGroup` on `ElementDef` and `CollectionDef`. When scaling to Phase 1.5:

- **SplitScreen** and **ImageFirst** have the exact same social proof pattern (customer_count, rating_value, rating_count, show_customer_avatars, customer_avatars). Tag them with `toggleGroup: "show_social_proof"`.
- Any other UIBlock with parent-child element relationships should use the same pattern.
- After tagging, also **remove the per-element X buttons** on hover for grouped children (same as done in pilot for LeftCopyRightImage + CenterStacked). These files still have the X buttons: `SplitScreen.tsx`, `ImageFirst.tsx`.

### 3. Cascade Locations Are Already Wired

The pilot wired toggleGroup cascade in 3 places. Phase 1.5 UIBlocks get this for free — no per-block work needed:

| Location | File | What it does |
|---|---|---|
| Toggle modal | `ElementToggleModal.tsx` | Hides children from list, cascades ON/OFF to children |
| Generation | `generationActions.ts` | Excludes children when parent excluded |
| Render | `storeTypes.ts` (`extractLayoutContent`) | Skips children if parent in excludedElements |

### 4. Boolean Elements Need `type: "boolean"` + Correct Default

Pilot found `handleToggle` was writing string labels (`"Show Social Proof"`) instead of `true` for boolean elements. Fixed globally in `ElementToggleModal.tsx` — the `writeDefault` helper now checks `def?.type === 'boolean'`. This works automatically for all new schemas, but **ensure new schema entries use `type: "boolean"` with `default: true/false`**, not `type: "string"`.

### 5. Collection Seeding is Generic

`handleToggle` seeds collections from schema field templates — no per-collection hardcoding. When adding new collections with `toggleGroup`, just ensure:
- `constraints.min` is set (used as seed count; falls back to 4 if 0)
- `fields` have sensible `default` values
- `fillMode: 'system'` fields are skipped during seeding (e.g. `id`)

### 6. Avatar Placeholder Pattern

When `avatar_url` is empty, UIBlocks render letter placeholders (A, B, C, D). This is handled in the UIBlock JSX, not in seeded data. **SplitScreen and ImageFirst need the same fallback** — currently they still require `customerAvatars.length > 0` to render anything.

### 7. Build-First Strategy Works

After any type/interface change, run `npm run build` immediately. TS strict mode catches every downstream reference. Fix iteratively — each error reveals the next. Don't try to grep-find all usages manually.

### 8. Per-UIBlock Checklist (Updated from Pilot)

For each UIBlock during Phase 1.5:

```
[ ] Add `default` values to central schema entry
[ ] Add `toggleGroup` to any parent-child element groups
[ ] Remove `contentSchema: CONTENT_SCHEMA as any` from useLayoutComponent call
[ ] Delete CONTENT_SCHEMA const
[ ] Add explicit types to array destructures from blockContent
[ ] Remove per-element X buttons for toggleGroup children.. NOT FROM THE COLLECTIONS
[ ] Remove scoped group/* hover classes that only served deleted X buttons
[ ] Remove redundant rendering guards ({x && x.trim() !== '' && ...})
[ ] npm run build passes
```

### 9. Files Modified in Pilot (Reference)

| File | Change |
|---|---|
| `layoutElementSchema.ts` | `toggleGroup` on ElementDef + CollectionDef interfaces. Tagged social proof children in leftCopyRightImage + centerStacked |
| `ElementToggleModal.tsx` | Hide grouped elements, cascade toggle ON/OFF, boolean fix, generic collection seeding |
| `LeftCopyRightImage.tsx` | Avatar fallback, removed social proof X buttons + scoped hover classes |
| `CenterStacked.tsx` | Same as above |
| `generationActions.ts` | toggleGroup child exclusion cascade |
| `storeTypes.ts` | toggleGroup parent exclusion cascade in extractLayoutContent |
| 18 other UIBlock files | Explicit type annotations for implicit `any` fixes |
