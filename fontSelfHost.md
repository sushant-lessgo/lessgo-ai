# Self-Hosted Core Fonts Implementation

Eliminate 3,210ms font chain delay on mobile by self-hosting 4 core fonts with preloading. Target: Mobile LCP < 2s.

## Strategy (from SecondOpinion.md)

**Self-host core fonts** (Inter, Sora, DM Sans, Playfair Display) + dynamic fallback to Google Fonts for remaining 11 fonts.

**Why:** Eliminates HTML → Google Fonts CSS → woff2 chain (3 hops → 1 hop). Covers 80-90% of pages. No editor bloat.

**Weights needed:** 400 (body), 500 (h5-h6, labels), 600 (h2-h4, buttons), 700 (h1, hero, display). Playfair Display headings-only: 500, 600, 700.

## Implementation Steps

### 1. Download Fonts (Latin Subset)

Download woff2 files with latin subset from Google Fonts:

```
public/fonts/
  inter/
    inter-400-latin.woff2
    inter-500-latin.woff2
    inter-600-latin.woff2
    inter-700-latin.woff2
  sora/
    sora-400-latin.woff2
    sora-500-latin.woff2
    sora-600-latin.woff2
    sora-700-latin.woff2
  dm-sans/
    dm-sans-400-latin.woff2
    dm-sans-500-latin.woff2
    dm-sans-600-latin.woff2
    dm-sans-700-latin.woff2
  playfair-display/
    playfair-display-500-latin.woff2
    playfair-display-600-latin.woff2
    playfair-display-700-latin.woff2
```

**Total size:** ~500KB. Use latin subset (30-40% smaller).

**Download Instructions:**

1. Visit https://gwfh.mranftl.com/fonts
2. For each font (Inter, Sora, DM Sans, Playfair Display):
   - Select the font
   - Choose "latin" subset only
   - Select weights: 400, 500, 600, 700 (or 500, 600, 700 for Playfair Display)
   - Download woff2 files
3. Rename files to match naming convention: `[font-name]-[weight]-latin.woff2`
4. Commit directly to `/public/fonts/` (no runtime external URLs)

**Example for Inter:**
- Download Inter-Regular.woff2 → Rename to `inter-400-latin.woff2`
- Download Inter-Medium.woff2 → Rename to `inter-500-latin.woff2`
- Download Inter-SemiBold.woff2 → Rename to `inter-600-latin.woff2`
- Download Inter-Bold.woff2 → Rename to `inter-700-latin.woff2`

### 2. Create Font Face Declarations

Create `src/styles/fonts-self-hosted.css`:

```css
/* Inter */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/inter-400-latin.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Repeat for 500, 600, 700 */

/* Sora */
@font-face {
  font-family: 'Sora';
  src: url('/fonts/sora/sora-400-latin.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Repeat for 500, 600, 700 */

/* DM Sans */
@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans/dm-sans-400-latin.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Repeat for 500, 600, 700 */

/* Playfair Display - Headings only */
@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/playfair-display-500-latin.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
/* Repeat for 600, 700 (no 400) */
```

**Key:** Use `font-display: swap` for instant text render with fallback. Match exact font names from fontThemes.ts.

### 3. Font Detection Utility

Create `src/lib/fontDetection.ts`:

```typescript
export type FontCategory = 'core' | 'google';

export interface DetectedFont {
  name: string;
  category: FontCategory;
  weights: number[];
}

export interface FontPreloadConfig {
  selfHosted: DetectedFont[];
  googleFonts: DetectedFont[];
}

const CORE_FONTS = new Set(['Inter', 'Sora', 'DM Sans', 'Playfair Display']);
const HEADING_WEIGHTS = [500, 600, 700];
const BODY_WEIGHTS = [400];

function extractFontName(fontFamily: string): string {
  return fontFamily.split(',')[0].trim().replace(/['"]/g, '');
}

function determineWeights(fontName: string, isHeading: boolean, isBody: boolean): number[] {
  if (fontName === 'Playfair Display') return [500, 600, 700];
  if (isHeading && isBody) return [400, 500, 600, 700];
  if (isHeading) return HEADING_WEIGHTS;
  return BODY_WEIGHTS;
}

export function detectPageFonts(theme: any): FontPreloadConfig {
  const headingFontName = extractFontName(theme?.typography?.headingFont || "'Inter', sans-serif");
  const bodyFontName = extractFontName(theme?.typography?.bodyFont || "'Inter', sans-serif");

  const selfHosted: DetectedFont[] = [];
  const googleFonts: DetectedFont[] = [];

  const isSameFont = headingFontName === bodyFontName;
  const headingWeights = determineWeights(headingFontName, true, isSameFont);

  const headingFont: DetectedFont = {
    name: headingFontName,
    category: CORE_FONTS.has(headingFontName) ? 'core' : 'google',
    weights: headingWeights
  };

  if (headingFont.category === 'core') {
    selfHosted.push(headingFont);
  } else {
    googleFonts.push(headingFont);
  }

  if (!isSameFont) {
    const bodyWeights = determineWeights(bodyFontName, false, true);
    const bodyFont: DetectedFont = {
      name: bodyFontName,
      category: CORE_FONTS.has(bodyFontName) ? 'core' : 'google',
      weights: bodyWeights
    };

    if (bodyFont.category === 'core') {
      selfHosted.push(bodyFont);
    } else {
      googleFonts.push(bodyFont);
    }
  }

  return { selfHosted, googleFonts };
}

export function getFontFilePath(fontName: string, weight: number): string {
  const folderName = fontName.toLowerCase().replace(/\s+/g, '-');
  return `/fonts/${folderName}/${folderName}-${weight}-latin.woff2`;
}

export function getGoogleFontsUrl(fonts: DetectedFont[]): string {
  if (fonts.length === 0) return '';
  const families = fonts.map(f => {
    const name = f.name.replace(/\s+/g, '+');
    const weights = f.weights.join(';');
    return `family=${name}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}
```

**Logic:** Detects fonts from `theme.typography`, categorizes as core/google, determines weights based on usage (heading/body).

### 4. Font Preload Utility (Hero Weights Only)

Create `src/lib/fontPreloads.ts`:

```typescript
import { detectPageFonts, getFontFilePath } from '@/lib/fontDetection';

// Critical weights for LCP (hero text)
const HERO_WEIGHTS = {
  heading: 700,  // h1, hero, display
  body: 400      // body text
};

export function generateFontPreloads(theme: any) {
  const { selfHosted, googleFonts } = detectPageFonts(theme);

  const preloads: { href: string; as: string; type: string; crossOrigin: string }[] = [];

  // Preload only hero weights for self-hosted fonts
  selfHosted.forEach(font => {
    // Always preload heading weight 700 (for h1/hero)
    if (font.weights.includes(HERO_WEIGHTS.heading)) {
      preloads.push({
        href: getFontFilePath(font.name, HERO_WEIGHTS.heading),
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous'
      });
    }

    // If font is used for body, preload 400
    if (font.weights.includes(HERO_WEIGHTS.body) && font.weights.includes(HERO_WEIGHTS.body)) {
      preloads.push({
        href: getFontFilePath(font.name, HERO_WEIGHTS.body),
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous'
      });
    }
  });

  return { preloads, googleFonts };
}
```

**Rationale:** Preload only weights critical for LCP (h1 at 700, body at 400). Other weights (500, 600) load progressively. Reduces preload overhead.

### 5. Create Published Page Layout (Primary Integration Point)

Create `src/app/p/layout.tsx`:

```typescript
import '@/app/globals.css';
import '@/styles/fonts-self-hosted.css';

export default function PublishedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Key:** This imports `fonts-self-hosted.css` globally for all published pages. Font preloads will be injected via metadata in page.tsx.

### 6. Update Build System

Modify `scripts/buildPublishedCSS.js`:

**Update `inputCSS` (line 289-295):**

```javascript
const inputCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import color-variables.css for CSS variable system */
@import './src/styles/color-variables.css';

/* Import self-hosted fonts */
@import './src/styles/fonts-self-hosted.css';
`;
```

**Or update content array (line 25-29):**

```javascript
content: [
  'src/modules/UIBlocks/**/*.published.tsx',
  'src/components/published/**/*.tsx',
  'src/modules/generatedLanding/LandingPagePublishedRenderer.tsx',
  'src/modules/generatedLanding/componentRegistry.published.ts',
  'src/styles/fonts-self-hosted.css'  // Add this line
],
```

### 7. Preload Injection via Static Layout (CORRECT FIX)

**ISSUE FOUND:** Metadata API's `other` field generates `<meta name="...">` tags, NOT `<link>` tags. Previous solution using Client Component + useEffect runs too late (after hydration) and doesn't persist in server-rendered HTML.

**CORRECT SOLUTION:** Statically preload most common fonts in layout's `<head>`.

**Strategy:** Preload Inter + Sora hero weights (400, 700) statically. These 2 fonts cover 80-90% of published pages (Inter is default, Sora for startup/AI tone).

#### Modify Published Layout

Update `src/app/p/layout.tsx`:

```typescript
/**
 * Published Pages Layout
 *
 * Statically preloads most common core fonts (Inter, Sora) for optimal LCP.
 * These 4 preloads (~60-80KB) load on all pages - acceptable tradeoff for SSR performance.
 */

import '@/app/globals.css';
import '@/styles/fonts-self-hosted.css';

export default function PublishedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload Inter - default font (most pages) */}
        <link
          rel="preload"
          as="font"
          href="/fonts/inter/inter-v20-latin-regular.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          href="/fonts/inter/inter-v20-latin-700.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload Sora - startup/AI tone (second most common) */}
        <link
          rel="preload"
          as="font"
          href="/fonts/sora/sora-v17-latin-regular.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          href="/fonts/sora/sora-v17-latin-700.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Why this works:**
- `<link>` tags render in server HTML (visible in View Source)
- Browser starts downloading fonts BEFORE JavaScript loads
- Preloads apply immediately on page load (optimal for LCP)
- Static = no hydration delay, works on slow mobile devices

**Tradeoff:** All pages preload Inter + Sora (4 files, ~60-80KB). Pages using DM Sans or Playfair Display will load unused fonts, but this is acceptable because:
- 80-90% of pages use Inter or Sora (covers majority)
- Small overhead (60-80KB) vs massive LCP improvement
- Simpler implementation (no dynamic logic, no client JS)

**For rare fonts (DM Sans, Playfair Display):**
- Will still load progressively when needed via @font-face rules
- No preload, but no network hop delay (self-hosted)
- Acceptable for <20% of pages

### 8. Editor Mode (No Changes)

**File:** `src/modules/generatedLanding/LandingPageRenderer.tsx`

Keep existing Google Fonts loading for editor. No changes needed. Editor performance not critical, avoids bundling 1.5MB+ fonts.

## Verification Plan

### Current Status (Before Fix)

✅ Font files downloaded and placed correctly in `public/fonts/`
✅ Fonts loading from local `/fonts/` directory (HTTP 304)
✅ No Google Fonts requests
❌ **NO preload tags in HTML source** (this is what we're fixing)

### Implementation Checklist

1. **Update layout with static preloads**
   - Modify `src/app/p/layout.tsx` to include `<head>` section
   - Add 4 preload links: Inter 400/700, Sora 400/700
   - These render in server HTML (no client JS needed)

2. **Remove broken metadata approach**
   - In `src/app/p/[slug]/page.tsx`, remove lines with `generateFontPreloads` in `generateMetadata` function
   - Remove `other: { links: ... }` from metadata return
   - Keep imports of `fontDetection.ts` and `fontPreloads.ts` (may be useful later for analytics)

3. **Test after implementation**
   - Restart dev server: `npm run dev`
   - Navigate to `/p/page3`
   - **Check HTML source (Ctrl+U)** - should now see IN SERVER HTML:
     ```html
     <link rel="preload" as="font" href="/fonts/inter/inter-v20-latin-regular.woff2" type="font/woff2" crossorigin="anonymous">
     <link rel="preload" as="font" href="/fonts/inter/inter-v20-latin-700.woff2" type="font/woff2" crossorigin="anonymous">
     <link rel="preload" as="font" href="/fonts/sora/sora-v17-latin-regular.woff2" type="font/woff2" crossorigin="anonymous">
     <link rel="preload" as="font" href="/fonts/sora/sora-v17-latin-700.woff2" type="font/woff2" crossorigin="anonymous">
     ```
   - **Check Network tab** - All 4 fonts should show "preload" initiator
   - **Check DevTools → Elements** - preload links in `<head>` (persistent, not added by JS)

### Post-deployment Verification

4. **Production LCP test**
   - Test on PageSpeed Insights: https://pagespeed.web.dev/
   - **Target metrics:**
     - Mobile LCP: <2.0s (down from 2.4s)
     - Element render delay: <1,200ms (down from 3,210ms)
     - FCP: <2.0s (down from 2.4s)
   - **Expected improvements:**
     - Font chain reduced from 3 hops to 1 hop
     - Preload eliminates font discovery delay
     - Latin subset reduces file size by 30-40%

5. **Font rendering verification**
   - Check h1 renders with weight 700 (bold hero text)
   - Check body text renders with weight 400 (regular)
   - Verify no FOIT (flash of invisible text) - text appears immediately with fallback
   - Confirm proper font swap after woff2 loads

6. **Fallback test (non-core fonts)**
   - Create test page with non-core font (e.g., Rubik or Poppins)
   - Verify Google Fonts stylesheet loads
   - Check preconnect tags exist for `fonts.googleapis.com` and `fonts.gstatic.com`
   - Confirm self-hosted fonts are NOT loaded for this page

7. **Cross-browser test**
   - Test on Chrome (desktop + mobile emulation)
   - Test on actual mobile device if possible
   - Verify fonts render consistently

### Rollback Trigger Conditions

If any of these occur, execute rollback:
- LCP increases instead of decreases
- Fonts fail to load (missing font files)
- Build failures related to font imports
- Visual regressions (wrong weights, missing fonts)

## Rollback Plan

If issues arise:
1. Remove `@import './src/styles/fonts-self-hosted.css'` from buildPublishedCSS.js or layout.tsx
2. Remove FontPreloadHead usage from page.tsx
3. Add Google Fonts link back to published layout
4. Redeploy

## Performance Projection

**Current:**
- HTML → Google Fonts CSS → woff2 (3 hops)
- Mobile render delay: 3,210ms
- Mobile LCP: 2.4s

**After:**
- HTML → Preloaded woff2 (1 hop for core fonts)
- Expected render delay: 800-1,200ms
- Expected mobile LCP: 1.6-1.8s (25-33% improvement)

## Critical Files

**Files to MODIFY:**
- `src/app/p/layout.tsx` - **ADD:** Static preload links in `<head>` for Inter + Sora (400, 700 weights)
- `src/app/p/[slug]/page.tsx` - **REMOVE:** Broken metadata approach (lines with `generateFontPreloads` in metadata)

**Files already COMPLETED:**
- `src/lib/fontDetection.ts` - ✅ Font detection logic (not used currently, but available for future analytics)
- `src/lib/fontPreloads.ts` - ✅ Generate hero weight preloads (not used currently, but available)
- `src/styles/fonts-self-hosted.css` - ✅ Font face declarations with @font-face rules (working)
- `scripts/buildPublishedCSS.js` - ✅ Includes font CSS in build (working)
- `public/fonts/` - ✅ 15 self-hosted woff2 files (~500KB total, all weights available)

## Migration Strategy

**Phase 1: Download Inter only**
- Test with Inter (most common default)
- Verify LCP improvement
- Deploy to production

**Phase 2: Add remaining fonts**
- Download Sora, DM Sans, Playfair Display
- Test with all 4 core fonts
- Monitor metrics

**Phase 3: Measure & iterate**
- Use PostHog or PageSpeed Insights to track LCP
- Analyze which fonts are most used
- Consider expanding core set if needed

## Implementation Decisions (Final)

1. **App Router head injection** (CORRECTED AGAIN): ~~Use metadata API~~ ~~Use Client Component with useEffect~~ → **Static `<link>` tags in layout's `<head>`**.
   - Metadata API generates `<meta>` tags, not `<link>` tags
   - Client Component useEffect runs after hydration (too late for LCP)
   - Static layout preloads render in server HTML (optimal)

2. **Static vs Dynamic preloads**: **Static wins**. Preload Inter + Sora on all pages. Small overhead (60-80KB) acceptable for:
   - Zero JavaScript dependency
   - Immediate browser preload (before JS loads)
   - Covers 80-90% of actual usage
   - Simpler implementation (no complexity)

3. **Font downloads**: ✅ Use gwfh.mranftl.com for woff2 latin subset. Commit files directly to `/public/fonts/`. Actual filenames: `inter-v20-latin-regular.woff2`, etc.

4. **Google Fonts fallback**: Not needed currently. All 4 core fonts self-hosted. If needed in future, add `<link rel="stylesheet">` for non-core fonts in layout.

5. **Bundle size**: ✅ 500KB in `/public/` (all fonts). Only ~60-80KB preloaded per page (Inter + Sora hero weights).

## Root Cause Analysis

**Problem:** No `<link rel="preload">` tags appearing in HTML source.

**Cause 1 (Metadata):** `metadata.other = { links: JSON.stringify([...]) }` generates `<meta name="links">`, NOT `<link>` tags.

**Cause 2 (useEffect):** Client-side `document.head.appendChild()` runs AFTER hydration, doesn't persist in server HTML, defeats purpose of preload.

**Correct Solution:** Static `<link>` tags in layout's `<head>`. Renders in server HTML, browser starts downloading immediately, works on slow devices without waiting for JS.
