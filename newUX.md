# Element Review System — Developer Spec

## Problem

The generation pipeline produces elements tagged `ai_generated_needs_review` and `manual_preferred`, but the editor shows zero visual distinction. Users can't tell which elements are AI-hallucinated guesses (fake metrics, invented testimonials, placeholder pricing) vs reliable AI copy. Images sourced from Pexels/placeholders look identical to user-uploaded ones.

---

## Priority 1: Inline Element Indicators

Surface existing element state data as visual indicators directly on the elements in the editor canvas.

### Three indicator types

#### 1A. Amber "Needs Review" indicator
**What:** Elements with `fillMode: 'ai_generated_needs_review'` get a subtle amber left-border + small floating badge.

**Which elements get it (from `layoutElementSchema.ts`):**
- Metrics/stats: `customer_count`, `rating_value`, `rating_count`, `metric`, `stat`
- Testimonials: `testimonial_quote`, `customer_name`, `customer_title`, `customer_company`
- Pricing: `price`, `period` (in TierCards, ToggleableMonthlyYearly)
- Results: `transformations`, `results`, `benefits` collections
- Pattern fallback keys: anything matching `NEEDS_REVIEW_PATTERNS` in `parseCopy.ts` line 30-35:
  ```
  'stat_', 'metric_', 'number_', 'count_', 'percentage_',
  'quote', 'testimonial', 'author', 'company',
  'price', 'tier_', 'amount_', 'result_', 'outcome_'
  ```

**Visual treatment:**
```css
.element-needs-review {
  border-left: 3px solid #f59e0b;           /* amber-500 */
  background: rgba(245, 158, 11, 0.04);     /* barely visible amber wash */
  position: relative;
}
.element-needs-review::after {
  content: 'Verify';
  position: absolute;
  top: -8px;
  right: 4px;
  font-size: 9px;
  font-weight: 600;
  color: #d97706;                            /* amber-600 */
  background: #fffbeb;                       /* amber-50 */
  border: 1px solid #fde68a;                 /* amber-200 */
  padding: 1px 5px;
  border-radius: 3px;
  pointer-events: none;
  z-index: 5;
}
```

**Clears when:** User edits the element content (any keystroke/change). Track via a new `reviewedElements` Set in store.

#### 1B. Dashed "Replace Yours" indicator for manual_preferred
**What:** Elements with `fillMode: 'manual_preferred'` that still have default/placeholder values.

**Which elements (from `layoutElementSchema.ts`):**
- Images: `hero_image`, `founder_image`, `avatar_url`, `before_visual`, `after_visual`, `mockup_image`
- Logos: `logo_url`
- Toggle flags: `show_social_proof`, `show_customer_avatars` (these are fine as-is, skip)

**Only show when value matches a default** from `defaultPlaceholders.ts`:
```
'/placeholder-hero.jpg', '/placeholder-visual.jpg', '/placeholder-founder.jpg',
'/placeholder-step.jpg', '/placeholder-avatar.jpg', '/placeholder-mockup.jpg'
```
Or when value is empty string `""` or `null`.

**Visual treatment:**
```css
.element-manual-preferred {
  border: 2px dashed #d1d5db;               /* gray-300 */
  border-radius: 6px;
  position: relative;
}
.element-manual-preferred::after {
  content: 'Add yours';
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 9px;
  font-weight: 600;
  color: #6b7280;                            /* gray-500 */
  background: white;
  border: 1px solid #e5e7eb;
  padding: 1px 5px;
  border-radius: 3px;
  pointer-events: none;
  z-index: 5;
}
```

**Clears when:** User uploads their own image or provides a non-default value.

#### 1C. "Stock" badge on Pexels/placeholder images
**What:** Any image element whose current URL is from Pexels (proxied through `/api/proxy-image`) or is a `/placeholder-*.jpg` path.

**Detection logic:**
```typescript
function isStockOrPlaceholder(src: string): 'stock' | 'placeholder' | null {
  if (!src) return 'placeholder';
  if (src.startsWith('/placeholder')) return 'placeholder';
  if (src.includes('pexels') || src.includes('proxy-image')) return 'stock';
  return null;
}
```

**Visual treatment:** Small overlay badge, bottom-left of image:
```css
.image-source-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 5;
}
```
- Placeholder: show `"Placeholder"`
- Stock: show `"Stock photo"`

**Clears when:** User uploads via ImageToolbar "Replace" action (URL no longer matches patterns).

---

### Where to implement

#### New file: `src/hooks/useReviewState.ts`
Zustand store (or slice added to editStore) tracking review state:

```typescript
interface ReviewState {
  // Elements user has reviewed (edited or explicitly confirmed)
  reviewedElements: Set<string>;  // format: `${sectionId}::${elementKey}`

  // Derived counts
  totalNeedsReview: number;
  remainingNeedsReview: number;

  // Actions
  markReviewed: (sectionId: string, elementKey: string) => void;
  markAllReviewed: (sectionId: string) => void;
  initFromContent: (content: Record<string, SectionData>, layoutSchema: any) => void;
  getElementReviewStatus: (sectionId: string, elementKey: string) => 'needs_review' | 'manual_preferred' | 'stock_image' | null;
}
```

**`initFromContent` logic:**
1. Iterate all sections in `state.content`
2. For each section, get its layout name from `state.sectionLayouts[sectionId]`
3. Look up that layout in `layoutElementSchema`
4. For each element in the schema, check `fillMode`
5. If `ai_generated_needs_review` → add to review list (unless already in `reviewedElements`)
6. If `manual_preferred` and current value matches a default → add to review list
7. For image elements → check if stock/placeholder

**Call `initFromContent`:**
- On editor first load (after `loadFromDraft` completes)
- After any regeneration action

#### Modify: `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
This file already applies CSS classes to elements via `data-element-key` selectors. Add review indicator classes here.

**After line 65** (where selection classes are applied), add:
```typescript
// Apply review indicator classes
const allElements = document.querySelectorAll('[data-element-key]');
allElements.forEach((el) => {
  const sectionId = el.getAttribute('data-section-id');
  const elementKey = el.getAttribute('data-element-key');
  if (!sectionId || !elementKey) return;

  const status = getElementReviewStatus(sectionId, elementKey);
  el.classList.remove('element-needs-review', 'element-manual-preferred');

  if (status === 'needs_review') el.classList.add('element-needs-review');
  if (status === 'manual_preferred') el.classList.add('element-manual-preferred');
});
```

Add the CSS classes from above into the existing `<style jsx>` block (after line 202).

#### Modify: `src/components/layout/UniversalElementRenderer.tsx`
For image elements specifically (around line 500), add the stock photo badge:

```tsx
{isStockOrPlaceholder(src) && (
  <span className="image-source-badge">
    {isStockOrPlaceholder(src) === 'placeholder' ? 'Placeholder' : 'Stock photo'}
  </span>
)}
```

Wrap the image `<img>` in a `position: relative` container if not already.

#### Modify: `src/hooks/editStore/contentActions.ts`
In `updateElementContent` (the action called when user edits any element), add a call to `markReviewed`:

```typescript
// After line 139 where element content is updated:
useReviewState.getState().markReviewed(sectionId, elementKey);
```

#### Modify: `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`
After successful image upload/replace, call `markReviewed` for that image element.

---

### Data flow summary

```
layoutElementSchema.ts          → defines fillMode per element
         ↓
parseCopy.ts                    → wraps values with { value, needsReview: true }
         ↓
editStore content               → stores elements (some wrapped with needsReview)
         ↓
useReviewState.initFromContent  → scans all elements, builds review list
         ↓
SelectionSystem.tsx             → applies CSS classes to DOM elements
         ↓
User edits element              → contentActions.updateElementContent
         ↓
useReviewState.markReviewed     → removes from review list, updates count
         ↓
Header pill updates             → (Priority 2)
```

---

## Priority 2: Review Counter in Header

A single pill/badge in the editor header showing remaining review count.

### Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  [ThemePopover] [Typography]          [5 to review] [Preview]  │
│                                        ↑ amber pill             │
└─────────────────────────────────────────────────────────────────┘
```

**States:**
| Count | Pill appearance | Label |
|-------|----------------|-------|
| > 0 | Amber bg, dark amber text | `"5 to review"` |
| 0 | Green bg, dark green text | `"Ready to publish"` |

**Styles:**
```css
/* Amber state (items remaining) */
.review-pill-pending {
  background: #fffbeb;           /* amber-50 */
  border: 1px solid #fde68a;     /* amber-200 */
  color: #92400e;                /* amber-800 */
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}
.review-pill-pending:hover {
  background: #fef3c7;           /* amber-100 */
  border-color: #f59e0b;         /* amber-500 */
}

/* Green state (all reviewed) */
.review-pill-done {
  background: #ecfdf5;           /* emerald-50 */
  border: 1px solid #a7f3d0;     /* emerald-200 */
  color: #065f46;                /* emerald-800 */
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
}
```

### Click behavior (amber state)

Clicking the pill cycles to the next unreviewed element:

1. Get next unreviewed element from `useReviewState`
2. Scroll that section into view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`)
3. Select the element (call `selectElement(sectionId, elementKey)` on editStore)
4. This triggers the appropriate toolbar (ElementToolbar, ImageToolbar, etc.)
5. On next click → advance to the next unreviewed element

```typescript
function handleReviewPillClick() {
  const { remainingNeedsReview, getNextUnreviewed } = useReviewState.getState();
  if (remainingNeedsReview === 0) return;

  const next = getNextUnreviewed(); // returns { sectionId, elementKey } | null
  if (!next) return;

  // Scroll section into view
  const sectionEl = document.querySelector(`[data-section-id="${next.sectionId}"]`);
  sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Select the element (triggers toolbar)
  setTimeout(() => {
    const elementEl = sectionEl?.querySelector(`[data-element-key="${next.elementKey}"]`);
    elementEl?.click(); // or use store action: selectElement(next.sectionId, next.elementKey)
  }, 300); // wait for scroll
}
```

### Where to implement

#### Modify: `src/app/edit/[token]/components/layout/EditHeader.tsx`
Add the pill between the left design controls and the right action panel.

Current structure (line 14-27):
```tsx
<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50">
  <div className="flex items-center space-x-4">
    <ThemePopover />
    <TypographyControls />
  </div>
  <EditHeaderRightPanel tokenId={tokenId} />
</header>
```

New structure:
```tsx
<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50">
  <div className="flex items-center space-x-4">
    <ThemePopover />
    <TypographyControls />
  </div>

  {/* CENTER: Review counter pill */}
  <ReviewPill />

  <EditHeaderRightPanel tokenId={tokenId} />
</header>
```

#### New component: `src/app/edit/[token]/components/ui/ReviewPill.tsx`

```tsx
'use client';
import { useReviewState } from '@/hooks/useReviewState';

export function ReviewPill() {
  const { remainingNeedsReview, totalNeedsReview } = useReviewState();

  const isDone = remainingNeedsReview === 0;

  return (
    <button
      onClick={handleReviewPillClick}
      className={isDone ? 'review-pill-done' : 'review-pill-pending'}
      title={isDone
        ? 'All elements reviewed'
        : `${remainingNeedsReview} elements need your review — click to cycle through them`
      }
    >
      {isDone ? '✓ Ready to publish' : `${remainingNeedsReview} to review`}
    </button>
  );
}
```

#### Add to: `src/hooks/useReviewState.ts`

Add `getNextUnreviewed()` method that returns elements in section order (top of page → bottom):

```typescript
getNextUnreviewed: () => {
  const { content, sections } = useEditStoreLegacy.getState();
  const { reviewedElements } = get();

  for (const sectionId of sections) {
    const sectionData = content[sectionId];
    if (!sectionData) continue;

    for (const elementKey of Object.keys(sectionData.elements)) {
      const compositeKey = `${sectionId}::${elementKey}`;
      if (reviewedElements.has(compositeKey)) continue;

      const status = get().getElementReviewStatus(sectionId, elementKey);
      if (status) return { sectionId, elementKey };
    }
  }
  return null;
}
```

Track `lastCycledIndex` so repeated clicks advance through the list instead of always returning the first unreviewed element.

---

## Key reference files

| File | Role |
|------|------|
| `src/modules/sections/layoutElementSchema.ts` | Element `fillMode` definitions |
| `src/modules/copy/parseCopy.ts:30-97` | `needsReview` wrapping logic |
| `src/types/generation.ts:377-378` | `ElementValueReview` type |
| `src/modules/sections/defaultPlaceholders.ts` | Placeholder image defaults |
| `src/hooks/editStore/contentActions.ts` | `updateElementContent` — hook into for auto-clear |
| `src/app/edit/[token]/components/selection/SelectionSystem.tsx` | DOM class application + CSS |
| `src/components/layout/UniversalElementRenderer.tsx:239-246` | Element wrapper div |
| `src/app/edit/[token]/components/layout/EditHeader.tsx:14-27` | Header layout |
| `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` | Image replace action |
| `src/types/core/images.ts:1476-1487` | `ImageSource` type |
| `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` | Element toolbar (shows on cycle-click) |

---

## Edge cases

- **Collections** (testimonials array, pricing tiers array): each item in the collection is independently reviewable. Count each item, not the collection as a whole.
- **Regeneration**: when user regenerates a section, call `initFromContent` again — regenerated elements reset to "needs review" even if previously reviewed.
- **New sections added**: if user adds a section via "Add Section", scan its elements and add to review list.
- **Deleted sections**: remove all their elements from `reviewedElements` set.
- **Nested collection fields**: testimonial collections have per-item fields like `quote`, `name`, `company`. The composite key should be `${sectionId}::${collectionName}.${itemId}.${fieldName}` matching the existing dot-path convention in `contentActions.ts` line 84-96.

## Out of scope (for now)

- Checklist panel/drawer UI
- Post-publish guidance
- Per-section "reviewed" checkmarks on section toolbar
- Gating publish behind review completion (advisory only for now)
- "Confirm without editing" action (explicit dismiss) — defer to post-beta analytics
