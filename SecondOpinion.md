# UIBlock Image & Layout Playbook

## Header Fixes

### MinimalNavHeader.tsx (Line 109)
```tsx
// FROM:
className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b"

// TO:
className="sticky top-0 z-50"
```

### MinimalNavHeader.tsx (Line 112)
```tsx
// FROM:
<nav className="relative flex items-center justify-center py-2 md:py-3">

// TO:
<nav className="relative flex items-center justify-center py-3 md:py-4">
```

---

## Universal Image Pattern

**Apply to ALL image containers:**

```tsx
// Container: bounded height + overflow control
<div className="relative w-full h-full overflow-hidden">

  // Image: absolute positioned, fills container, clips excess
  <img
    src={imageSrc}
    className="absolute inset-0 w-full h-full object-cover object-center"
  />
</div>
```

---

## Hero Sections (Edit Mode)

### 1. LeftCopyRightImage.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 360 | Grid | `items-center min-h-[600px]` | `items-stretch h-[clamp(600px,85vh,900px)]` |
| 363 | Content column | `order-2 lg:order-1 max-w-xl` | `order-2 lg:order-1 max-w-xl flex flex-col justify-center` |
| 675 | Image container | `relative w-full h-full min-h-[500px] lg:min-h-[600px]` | `relative w-full h-full overflow-hidden` |
| 683-686 | Image | `relative z-10 w-full h-full object-cover...` | `absolute inset-0 z-10 w-full h-full object-cover object-center...` |

---

### 2. CenterStacked.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 636 | Image container | `relative w-[70%] lg:w-[80%] aspect-video mx-auto` | `relative w-[70%] lg:w-[80%] aspect-video mx-auto overflow-hidden` |
| 637-640 | Image | `w-full h-full object-cover...` | `absolute inset-0 w-full h-full object-cover object-center...` |

---

### 3. SplitScreen.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 355 | Outer wrapper | `min-h-screen flex items-center` | `flex items-center` |
| 356 | Grid | `min-h-[700px]` | `items-stretch h-[clamp(600px,85vh,900px)]` |
| 358 | Content column | `flex items-center justify-center...` | `flex flex-col justify-center...` |
| 717 | Image container | `relative w-full h-full min-h-[600px]` | `relative w-full h-full overflow-hidden` |
| 718-721 | Image | `w-full h-full object-cover...` | `absolute inset-0 w-full h-full object-cover object-center...` |

---

### 4. ImageFirst.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 320 | Main container | `flex flex-col space-y-12 min-h-[700px]` | `flex flex-col space-y-12` |
| 337 | Image container | `relative w-full h-full min-h-[500px] lg:min-h-[600px]` | `relative w-full aspect-video overflow-hidden` |
| 338-341 | Image | `w-full h-full object-cover...` | `absolute inset-0 w-full h-full object-cover object-center...` |

---

## Hero Sections (Published Mode)

### 1. LeftCopyRightImage.published.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 175 | Grid | `items-center min-h-[600px]` | `items-stretch h-[clamp(600px,85vh,900px)]` |
| 178 | Content column | `order-2 lg:order-1 max-w-xl` | `order-2 lg:order-1 max-w-xl flex flex-col justify-center` |
| 396 | Image container | `relative w-full h-full min-h-[500px] lg:min-h-[600px]` | `relative w-full h-full overflow-hidden` |
| 404-408 | Image | `relative z-10 w-full h-full object-cover...` | `absolute inset-0 z-10 w-full h-full object-cover object-center...` |

---

### 2. CenterStacked.published.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 421 | Image container | `relative w-[70%] lg:w-[80%] aspect-video mx-auto` | `relative w-[70%] lg:w-[80%] aspect-video mx-auto overflow-hidden` |
| 422-426 | Image | `w-full h-full object-cover...` | `absolute inset-0 w-full h-full object-cover object-center...` |

---

### 3. SplitScreen.published.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 274 | Outer wrapper | `min-h-screen flex items-center` | `flex items-center` |
| 275 | Grid | `min-h-[700px]` | `items-stretch h-[clamp(600px,85vh,900px)]` |
| 278 | Content column | `flex items-center justify-center...` | `flex flex-col justify-center...` |
| 486 | Image container | `relative w-full h-full min-h-[600px]` | `relative w-full h-full overflow-hidden` |
| 487-491 | Image | `w-full h-full object-cover...` | `absolute inset-0 w-full h-full object-cover object-center...` |

---

### 4. ImageFirst.published.tsx

| Line | Element | FROM | TO |
|------|---------|------|-----|
| 177 | Main container | `flex flex-col space-y-12 min-h-[700px]` | `flex flex-col space-y-12` |
| 181-186 | Image container + img | `min-h-[500px] lg:min-h-[600px]` | Wrap in `relative aspect-video overflow-hidden`, img becomes `absolute inset-0 w-full h-full object-cover object-center` |

---

## Non-Hero Sections (Quick Reference)

Apply same pattern to these files:

| File | Image Field | Container Fix |
|------|-------------|---------------|
| `CTA/VisualCTAWithMockup.tsx` | `mockup_image` | `aspect-video overflow-hidden` + absolute img |
| `CTA/VisualCTAWithMockup.published.tsx` | `mockup_image` | `aspect-video overflow-hidden` + absolute img |
| `Features/SplitAlternating.tsx` | feature images | `aspect-[4/3] overflow-hidden` + absolute img |
| `Features/Carousel.tsx` | carousel images | `aspect-[4/3] overflow-hidden` + absolute img |
| `FounderNote/LetterStyleBlock.tsx` | founder image | `aspect-square overflow-hidden` + absolute img |
| `FounderNote/LetterStyleBlock.published.tsx` | founder image | `aspect-square overflow-hidden` + absolute img |
| `Results/ResultsGallery.tsx` | result images | `aspect-[4/3] overflow-hidden` + absolute img |
| `Results/ResultsGallery.published.tsx` | result images | `aspect-[4/3] overflow-hidden` + absolute img |

---

## Summary Rules

1. **Never use `min-h-[xxx]` on image containers** - creates unbounded growth
2. **Always use `overflow-hidden`** on image container
3. **Always use `absolute inset-0`** on `<img>` tags
4. **Use `aspect-[ratio]`** for non-hero images (4/3, 16/9, video, square)
5. **Use `h-[clamp(min,target,max)]`** for hero section grids
6. **Use `items-stretch`** on 2-column hero grids for alignment
7. **Content columns need `flex flex-col justify-center`** for vertical centering within stretched grid

---

## Why These Fixes Work

### Problem: Tall images overflow
- Image has no height constraint
- Container grows with image content
- `overflow-hidden` does nothing because container expands

### Solution: Absolute positioning
- Container has fixed/bounded height from parent grid
- Image is `absolute inset-0` - doesn't affect container size
- `overflow-hidden` clips excess image content
- `object-cover object-center` fills and crops gracefully

```
Container (h-full from grid)
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │                 │ │  ← Image absolutely positioned
│ │  Image fills    │ │  ← Clips at container edges
│ │  and clips      │ │
│ └─────────────────┘ │
└─────────────────────┘
     ↓ overflow-hidden clips here
   (tall image cropped, doesn't push layout)
```
