# Image-Background Compatibility — Developer Execution Spec

**PO Decision**: Ship Options 1 + 2. Smarter Pexels fetch + CSS color treatment.
**Ref**: `POreview.md`, `designReview.md`

---

## Architecture Overview

```
CURRENT:
  Mount → fetch 1 image per slot (category-only query) → take first result → render raw

NEW:
  Mount → fetch 8 images per slot (vibe-aware query) → store all candidates
  User picks palette → score 8 candidates by avg_color vs palette → pick best
  Render with CSS filter (mode + temperature aware)
```

**3 workstreams** executed in order (each builds on the previous):

1. **Prerequisite**: Persist palette metadata in theme (needed by both options)
2. **Option 1**: Smarter fetch — vibe queries + over-fetch + deferred scoring
3. **Option 2**: CSS image treatment at render time

---

## Workstream 1: Persist Palette Metadata

### Problem
`GeneratingStep.tsx` saves `theme.colors` with CSS strings only. `palette.mode` and `palette.temperature` are discarded. Both are needed at render time for CSS treatment (Option 2) and could be useful for future features.

### Changes

#### File: `src/types/core/content.ts` (line 319)

Add 2 optional fields to `ColorSystem`:

```diff
 export interface ColorSystem {
   baseColor: string;
   accentColor: string;
   accentCSS?: string;
   sectionBackgrounds: SectionBackgrounds;
+  paletteMode: 'dark' | 'light';
+  paletteTemperature: 'cool' | 'neutral' | 'warm';
   semantic: SemanticColors;
   states: StateColors;
   textColors?: TextColorsForBackgrounds;
 }
```

#### File: `src/types/storeTypes.ts` (line 160)

Add same fields to `Theme.colors`:

```diff
 colors: {
   baseColor: string;
   accentColor: string;
   accentCSS?: string;
   sectionBackgrounds: SectionBackgroundInput;
+  paletteMode: 'dark' | 'light';
+  paletteTemperature: 'cool' | 'neutral' | 'warm';
 };
```

#### File: `src/app/create/[token]/components/steps/GeneratingStep.tsx` (line ~167)

Save palette metadata during draft creation:

```diff
 colors: {
   baseColor: backgroundSystem.baseColor,
   accentColor: backgroundSystem.accentColor,
   accentCSS: backgroundSystem.accentCSS,
   sectionBackgrounds: {
     primary: compileBackground(palette, textureId, 'primary'),
     secondary: compileBackground(palette, textureId, 'secondary'),
     neutral: palette.neutral,
   },
+  paletteMode: palette.mode,
+  paletteTemperature: palette.temperature,
 },
```

---

## Workstream 2: Smarter Pexels Fetch (Option 1)

### 2a. Pass `avg_color` through API chain

Currently `avg_color` from Pexels is available in raw response but dropped during `convertToStockPhoto()`.

#### File: `src/app/api/images/search/route.ts` (line 38, 60)

Add `avg_color` to local `StockPhoto` interface and converter:

```diff
 interface StockPhoto {
   id: string;
   url: string;
   alt: string;
   width: number;
   height: number;
+  avgColor: string;
   author: string;
   // ...rest unchanged
 }
```

```diff
 const convertToStockPhoto = (photo: PexelsPhoto): StockPhoto => {
   const attribution = `Photo by ${photo.photographer} on Pexels`;
   return {
     id: photo.id.toString(),
     url: photo.src.medium,
     alt: photo.alt || `Photo by ${photo.photographer}`,
     width: photo.width,
     height: photo.height,
+    avgColor: photo.avg_color,
     author: photo.photographer,
     // ...rest unchanged
   };
 };
```

#### File: `src/services/pexelsApi.ts` (line 56, 173)

Same change to the service's `StockPhoto` type and `convertToStockPhoto`:

```diff
 export interface StockPhoto {
   id: string;
   url: string;
   alt: string;
   width: number;
   height: number;
+  avgColor: string;
   author: string;
   // ...rest unchanged
 }
```

```diff
 private convertToStockPhoto = (photo: PexelsPhoto): StockPhoto => {
   return {
     id: photo.id.toString(),
     url: photo.src.medium,
+    avgColor: photo.avg_color,
     // ...rest unchanged
   };
 };
```

### 2b. Vibe-Aware Search Queries

#### File: `src/lib/generation/fetchImages.ts` (line 20)

Add vibe modifier to search queries. Vibe IS known at fetch time (from `strategy.vibe`).

```diff
-function buildSearchQuery(categories: string[], slot: ImageSlot): string {
+const VIBE_MODIFIERS: Record<string, string> = {
+  'Dark Tech':     'dark moody technology',
+  'Light Trust':   'bright clean professional',
+  'Warm Friendly': 'warm vibrant people friendly',
+  'Bold Energy':   'colorful dynamic bold modern',
+  'Calm Minimal':  'minimal clean simple white',
+};
+
+function buildSearchQuery(categories: string[], slot: ImageSlot, vibe?: string): string {
   const categoryPart = categories.slice(0, 2).join(' ');
   const modifier = slot.modifier || '';
-  return `${categoryPart} ${modifier}`.trim() || 'business professional';
+  const vibeMod = vibe ? (VIBE_MODIFIERS[vibe] || '') : '';
+  return `${categoryPart} ${modifier} ${vibeMod}`.trim() || 'business professional';
 }
```

### 2c. Over-Fetch 8 Candidates Per Slot

#### File: `src/lib/generation/fetchImages.ts`

Change return type to carry all candidates for deferred scoring:

```diff
 export interface ImageFetchResult {
   sectionType: string;
   elementKey: string;
   imageUrl: string | null;
+  candidates?: Array<{ url: string; downloadUrl: string; avgColor: string }>;
   error?: string;
 }
```

Update `fetchSingleImage` to accept vibe, fetch 8, return all:

```diff
 async function fetchSingleImage(
   sectionType: string,
   slot: ImageSlot,
-  categories: string[]
+  categories: string[],
+  vibe?: string
 ): Promise<ImageFetchResult> {
-  const query = buildSearchQuery(categories, slot);
+  const query = buildSearchQuery(categories, slot, vibe);

   try {
     const response = await fetchWithTimeout(
       '/api/images/search',
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           query,
           orientation: slot.orientation,
-          per_page: 1,
+          per_page: 8,
         }),
       },
       FETCH_TIMEOUT_MS
     );

     if (!response.ok) {
       return { sectionType, elementKey: slot.elementKey, imageUrl: null, error: `HTTP ${response.status}` };
     }

     const data = await response.json();
-    const photo = data.photos?.[0];
-    const imageUrl = photo?.downloadUrl || photo?.url || null;
+    const photos = data.photos || [];
+    const candidates = photos.map((p: any) => ({
+      url: p.url,
+      downloadUrl: p.downloadUrl,
+      avgColor: p.avgColor || '#888888',
+    }));
+
+    // Default to first result (scoring happens later when palette is known)
+    const imageUrl = candidates[0]?.downloadUrl || candidates[0]?.url || null;

-    return { sectionType, elementKey: slot.elementKey, imageUrl };
+    return { sectionType, elementKey: slot.elementKey, imageUrl, candidates };
   } catch (error) {
     return { sectionType, elementKey: slot.elementKey, imageUrl: null, error: error instanceof Error ? error.message : 'Unknown error' };
   }
 }
```

Update `fetchPexelsImagesParallel` signature to accept vibe:

```diff
 export async function fetchPexelsImagesParallel(
   categories: string[],
-  uiblocks: Record<string, string>
+  uiblocks: Record<string, string>,
+  vibe?: string
 ): Promise<Map<string, ImageFetchResult>> {
   // ...unchanged until fetchPromises...

   const fetchPromises = pexelsSlots.map(({ sectionType, slot }, index) =>
     delay(index * STAGGER_DELAY_MS).then(() =>
-      fetchSingleImage(sectionType, slot, categories)
+      fetchSingleImage(sectionType, slot, categories, vibe)
     )
   );
   // ...rest unchanged
 }
```

### 2d. Score + Pick Best After Palette Selection

#### File: `src/lib/generation/fetchImages.ts` — add scoring function at bottom

```ts
// ─── Color scoring ───

/**
 * Hex to HSL conversion for color distance
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

/**
 * Score a photo candidate against a palette.
 * Higher = better match. Range ~0-100.
 */
function scoreCandidate(
  avgColor: string,
  paletteMode: 'dark' | 'light',
  paletteTemperature: 'cool' | 'neutral' | 'warm',
  paletteBaseColor: string
): number {
  const photo = hexToHSL(avgColor);
  let score = 50; // baseline

  // Mode match (0-30 pts): dark palettes prefer darker images, light prefer lighter
  if (paletteMode === 'dark') {
    score += photo.l < 0.45 ? 30 : photo.l < 0.6 ? 15 : 0;
  } else {
    score += photo.l > 0.5 ? 30 : photo.l > 0.35 ? 15 : 0;
  }

  // Temperature match (0-25 pts): warm hues (0-60, 300-360), cool hues (180-270)
  const isWarmHue = photo.h < 60 || photo.h > 300;
  const isCoolHue = photo.h > 180 && photo.h < 270;
  if (paletteTemperature === 'warm' && isWarmHue) score += 25;
  else if (paletteTemperature === 'cool' && isCoolHue) score += 25;
  else if (paletteTemperature === 'neutral') score += 15; // neutral is forgiving

  // Low saturation bonus for neutral palettes (0-10 pts)
  if (paletteTemperature === 'neutral' && photo.s < 0.3) score += 10;

  // Hue proximity to baseColor (0-15 pts)
  try {
    const base = hexToHSL(paletteBaseColor);
    const hueDiff = Math.abs(photo.h - base.h);
    const hueDistance = Math.min(hueDiff, 360 - hueDiff);
    score += Math.max(0, 15 - (hueDistance / 24)); // within 360° → 0-15
  } catch { /* baseColor might not be valid hex, skip */ }

  return Math.round(score);
}

/**
 * Pick the best image from candidates for a given palette.
 * Call this AFTER palette is known.
 */
export function pickBestImage(
  result: ImageFetchResult,
  paletteMode: 'dark' | 'light',
  paletteTemperature: 'cool' | 'neutral' | 'warm',
  paletteBaseColor: string
): string | null {
  if (!result.candidates?.length) return result.imageUrl;

  const scored = result.candidates
    .map(c => ({
      ...c,
      score: scoreCandidate(c.avgColor, paletteMode, paletteTemperature, paletteBaseColor),
    }))
    .sort((a, b) => b.score - a.score);

  // Debug logging
  console.log(`🖼️ [Image Score] ${result.sectionType}.${result.elementKey}:`);
  scored.slice(0, 3).forEach((c, i) =>
    console.log(`   ${i + 1}. score=${c.score} avgColor=${c.avgColor} ${i === 0 ? '← picked' : ''}`)
  );

  return scored[0].downloadUrl || scored[0].url || result.imageUrl;
}
```

#### File: `src/app/create/[token]/components/steps/GeneratingStep.tsx`

**Pass vibe to image fetch** (line ~237):

```diff
-  fetchPexelsImagesParallel(categories, uiblocks as Record<string, string>),
+  fetchPexelsImagesParallel(categories, uiblocks as Record<string, string>, strategy.vibe),
```

**Score candidates after palette is known** — update `mergeImagesIntoSections` (line 45):

Add import at top:
```ts
import { pickBestImage } from '@/lib/generation/fetchImages';
```

Update merge function:
```diff
 function mergeImagesIntoSections(
   sections: Record<string, SectionCopy>,
-  imageResults: Map<string, ImageFetchResult>
+  imageResults: Map<string, ImageFetchResult>,
+  palette?: { mode: 'dark' | 'light'; temperature: 'cool' | 'neutral' | 'warm'; baseColor: string }
 ): Record<string, SectionCopy> {
   const merged = { ...sections };

   for (const [, result] of imageResults) {
     const { sectionType, elementKey } = result;
-    const imageUrl = result.imageUrl;
+    const imageUrl = palette
+      ? pickBestImage(result, palette.mode, palette.temperature, palette.baseColor)
+      : result.imageUrl;
     if (imageUrl && merged[sectionType]?.elements) {
       merged[sectionType] = {
         ...merged[sectionType],
         elements: {
           ...merged[sectionType].elements,
           [elementKey]: imageUrl,
         },
       };
     }
   }
   // ...rest unchanged
 }
```

Update call site in `saveGeneratedContent` (line ~241):
```diff
-  const sectionsWithImages = mergeImagesIntoSections(
-    copyResponse.sections,
-    imageResults
-  );
+  copyResultRef.current = { sections: copyResponse.sections, imageResults };
```

Move merge to `saveGeneratedContent` where palette is known:
```diff
 const saveGeneratedContent = useCallback(
   async (sections: Record<string, SectionCopy>) => {
     // ... existing palette selection code ...
+
+    // Score and pick best images now that palette is known
+    const imageResults = copyResultRef.current?.imageResults;
+    const sectionsWithImages = imageResults
+      ? mergeImagesIntoSections(sections, imageResults, {
+          mode: palette.mode,
+          temperature: palette.temperature,
+          baseColor: palette.baseColor,
+        })
+      : sections;
```

Update `copyResultRef` type:
```diff
-  const copyResultRef = useRef<{ sections: Record<string, SectionCopy> } | null>(null);
+  const copyResultRef = useRef<{
+    sections: Record<string, SectionCopy>;
+    imageResults?: Map<string, ImageFetchResult>;
+  } | null>(null);
```

And update the API success handler:
```diff
     if (copyResponse.success) {
-      const sectionsWithImages = mergeImagesIntoSections(
-        copyResponse.sections,
-        imageResults
-      );
-      copyResultRef.current = { sections: sectionsWithImages };
+      copyResultRef.current = { sections: copyResponse.sections, imageResults };
       setApiComplete(true);
     }
```

---

## Workstream 3: CSS Image Treatment (Option 2)

### 3a. Image filter utility

#### File: `src/lib/generation/imageColorTreatment.ts` (NEW)

```ts
/**
 * Returns a CSS filter string that subtly shifts an image
 * toward the palette's visual temperature.
 *
 * Values are intentionally subtle — enough to harmonize,
 * not enough to look "filtered".
 */
export function getImageFilter(
  paletteMode?: 'dark' | 'light',
  paletteTemperature?: 'cool' | 'neutral' | 'warm'
): string | undefined {
  if (!paletteMode) return undefined;

  const key = `${paletteMode}-${paletteTemperature || 'neutral'}`;

  const filters: Record<string, string> = {
    'dark-cool':    'brightness(0.92) saturate(0.9)',
    'dark-neutral': 'brightness(0.95) saturate(0.85)',
    'dark-warm':    'brightness(0.93) saturate(0.95) sepia(0.05)',
    'light-cool':   'saturate(0.95) brightness(1.02)',
    'light-neutral': 'none',
    'light-warm':   'sepia(0.06) saturate(1.05)',
  };

  const f = filters[key];
  return f && f !== 'none' ? f : undefined;
}
```

### 3b. Apply to ImagePublished

#### File: `src/components/published/ImagePublished.tsx`

```diff
+import { getImageFilter } from '@/lib/generation/imageColorTreatment';
+
 interface ImagePublishedProps {
   src: string;
   alt: string;
   className?: string;
+  paletteMode: 'dark' | 'light';
+  paletteTemperature: 'cool' | 'neutral' | 'warm';
 }

-export function ImagePublished({ src, alt, className }: ImagePublishedProps) {
-  return <img src={src} alt={alt} className={className} loading="lazy" />;
+export function ImagePublished({ src, alt, className, paletteMode, paletteTemperature }: ImagePublishedProps) {
+  const filter = getImageFilter(paletteMode, paletteTemperature);
+  return (
+    <img
+      src={src}
+      alt={alt}
+      className={className}
+      style={filter ? { filter } : undefined}
+      loading="lazy"
+    />
+  );
 }
```

### 3c. Apply to published hero/CTA components

For components using raw `<img>` tags (not `ImagePublished`), add inline filter style.

Each published component receives `theme` prop. Access `theme.colors.paletteMode` and `theme.colors.paletteTemperature`.

#### Files to update (add `style={{ filter }}` to `<img>` tags):

Import at top of each file:
```ts
import { getImageFilter } from '@/lib/generation/imageColorTreatment';
```

Compute filter from theme (inside component):
```ts
const imgFilter = getImageFilter(theme?.colors?.paletteMode, theme?.colors?.paletteTemperature);
```

Apply to img:
```diff
 <img
   src={imageSrc}
   alt="Hero"
   className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl shadow-2xl"
+  style={imgFilter ? { filter: imgFilter } : undefined}
 />
```

**Files** (apply same pattern to each):
| File | Image location |
|------|----------------|
| `src/modules/UIBlocks/Hero/LeftCopyRightImage.published.tsx` | Hero image ~line 403 |
| `src/modules/UIBlocks/Hero/CenterStacked.published.tsx` | Hero image ~line 422 |
| `src/modules/UIBlocks/Hero/SplitScreen.published.tsx` | Hero image ~line 487 |
| `src/modules/UIBlocks/Hero/ImageFirst.published.tsx` | Hero image ~line 183 |
| `src/modules/UIBlocks/CTA/VisualCTAWithMockup.published.tsx` | Mockup image ~line 286 |
| `src/modules/UIBlocks/Features/Carousel.published.tsx` | Feature images ~line 157 |
| `src/modules/UIBlocks/Features/SplitAlternating.published.tsx` | Feature images ~line 159 |

For components already using `<ImagePublished>` (like `SplitCard.published.tsx`), pass the new props:
```diff
 <ImagePublished
   src={visual}
   alt="..."
   className="..."
+  paletteMode={theme?.colors?.paletteMode}
+  paletteTemperature={theme?.colors?.paletteTemperature}
 />
```

---

## Execution Order

```
1. Types           → storeTypes.ts, content.ts (add paletteMode/paletteTemperature)
2. Persist         → GeneratingStep.tsx (save palette.mode, palette.temperature)
3. avg_color pass  → route.ts, pexelsApi.ts (add avgColor to StockPhoto)
4. Vibe queries    → fetchImages.ts (VIBE_MODIFIERS + buildSearchQuery)
5. Over-fetch      → fetchImages.ts (per_page: 8, return candidates)
6. Deferred score  → fetchImages.ts (pickBestImage), GeneratingStep.tsx (move merge to save phase)
7. CSS utility     → imageColorTreatment.ts (new file)
8. Apply filters   → ImagePublished.tsx + 7 published UIBlock components
9. Build + test    → npm run build, generate test pages
```

---

## Verification Checklist

- [ ] `npm run build` passes with type changes
- [ ] Generate with "Dark Tech" vibe → console shows scoring logs, hero image is dark-toned
- [ ] Generate with "Warm Friendly" vibe → hero image is warm-toned
- [ ] Generate with "Calm Minimal" vibe → hero image is clean/light
- [ ] CSS filter visible on published page (inspect element → `filter` style present)
- [ ] CSS filter is subtle (compare with/without by removing style in devtools)
- [ ] No latency increase — Pexels returns 8 in same response time as 1
- [ ] Existing editor image search toolbar unaffected (it has its own Pexels flow)
- [ ] `light-neutral` palette has NO filter applied (correct — no treatment needed)
- [ ] All generated pages have `paletteMode` and `paletteTemperature` set in theme
