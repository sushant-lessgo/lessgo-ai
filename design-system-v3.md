# V3 Design System - Implementation Guide

## Problem

All generated pages have same gray background + purple accent. Two bugs:

1. **Theme colors persisted but not applied** - `sectionBackgrounds` saved but sections missing `backgroundType`
2. **Accent color wrong** - Set as `accentColor: baseColor` instead of using color harmony system

## Solution

Create `generateBackgroundSystemForVibe(vibe)` - single function that takes only `vibe` and returns complete background system using existing derivation functions.

---

## Implementation

### Step 1: Create `vibeBackgroundSystem.ts`

**File:** `src/modules/Design/vibeBackgroundSystem.ts`

```typescript
import { Vibe } from '@/types/generation';
import { getBackgroundsByCategory, PrimaryBackground } from './background/primaryBackgrounds';
import { getSecondaryBackground } from './background/simpleSecondaryBackgrounds';
import { accentOptions } from './ColorSystem/accentOptions';

// Vibe → Category + BaseColor filter (hybrid approach)
// Differentiates vibes that share same category via baseColor filtering
interface VibeConfig {
  category: 'technical' | 'professional' | 'friendly';
  baseColors?: string[];  // If specified, filter backgrounds to these baseColors only
}

const VIBE_CONFIG: Record<Vibe, VibeConfig> = {
  'Dark Tech': {
    category: 'technical'
    // No baseColor filter - all technical backgrounds work
  },
  'Light Trust': {
    category: 'professional',
    baseColors: ['blue', 'sky', 'slate', 'indigo']  // Trust = blue tones
  },
  'Warm Friendly': {
    category: 'friendly',
    baseColors: ['amber', 'orange', 'yellow', 'emerald', 'green', 'teal']  // Warm tones
  },
  'Bold Energy': {
    category: 'friendly',
    baseColors: ['purple', 'pink', 'indigo', 'violet', 'blue', 'cyan']  // Vibrant/cool tones
  },
  'Calm Minimal': {
    category: 'professional',
    baseColors: ['gray', 'slate', 'stone', 'neutral', 'zinc']  // Neutral tones only
  },
};

// Vibe → Neutral background (dark vibes need dark neutral)
const VIBE_NEUTRAL: Record<Vibe, string> = {
  'Dark Tech': '#0f172a',      // Dark slate
  'Light Trust': '#ffffff',
  'Warm Friendly': '#fffbeb',  // Warm white
  'Bold Energy': '#faf5ff',    // Light purple tint
  'Calm Minimal': '#fafafa',   // Near white
};

// Divider color map (from existing calculateOtherBackgrounds)
const DIVIDER_MAP: Record<string, string> = {
  blue: 'rgba(219, 234, 254, 0.5)',
  sky: 'rgba(224, 242, 254, 0.5)',
  indigo: 'rgba(224, 231, 255, 0.5)',
  purple: 'rgba(243, 232, 255, 0.5)',
  pink: 'rgba(252, 231, 243, 0.5)',
  orange: 'rgba(255, 237, 213, 0.5)',
  amber: 'rgba(254, 243, 199, 0.5)',
  yellow: 'rgba(254, 249, 195, 0.5)',
  green: 'rgba(220, 252, 231, 0.5)',
  emerald: 'rgba(209, 250, 229, 0.5)',
  teal: 'rgba(204, 251, 241, 0.5)',
  cyan: 'rgba(207, 250, 254, 0.5)',
  gray: 'rgba(243, 244, 246, 0.5)',
  slate: 'rgba(241, 245, 249, 0.5)',
  stone: 'rgba(245, 245, 244, 0.5)',
};

export interface VibeBackgroundSystem {
  primary: string;        // CSS gradient/color for hero/cta
  secondary: string;      // Subtle tint for features/content
  neutral: string;        // Clean sections (vibe-aware)
  divider: string;        // Subtle separators
  baseColor: string;      // Tailwind color name
  accentColor: string;    // Complementary accent name
  accentCSS: string;      // Tailwind class for buttons
}

/**
 * Get random accent option for a base color
 * Uses existing accentOptions which have curated color harmony pairs
 */
function getAccentForBaseColor(baseColor: string): { accentColor: string; accentCSS: string } {
  const options = accentOptions.filter(o => o.baseColor === baseColor);

  if (options.length === 0) {
    // Fallback: use blue-500 as safe default
    return { accentColor: 'blue', accentCSS: 'bg-blue-500' };
  }

  // Random pick from matching options (preserves variety)
  const selected = options[Math.floor(Math.random() * options.length)];

  return {
    accentColor: selected.accentColor,
    accentCSS: selected.tailwind
  };
}

/**
 * Generate complete background system from vibe only
 *
 * Flow:
 * 1. Vibe → Category + BaseColor filter → Random primary background
 * 2. Primary baseColor → Secondary (existing function)
 * 3. Primary baseColor → Accent (color harmony)
 * 4. Vibe → Neutral (dark vibes get dark neutral)
 */
export function generateBackgroundSystemForVibe(vibe: Vibe): VibeBackgroundSystem {
  // Step 1: Vibe → Category → Filter by baseColors → Random Primary
  const config = VIBE_CONFIG[vibe];
  let backgrounds = getBackgroundsByCategory(config.category);

  // Apply baseColor filter if specified (differentiates vibes sharing same category)
  if (config.baseColors && config.baseColors.length > 0) {
    backgrounds = backgrounds.filter(bg => config.baseColors!.includes(bg.baseColor));
  }

  if (backgrounds.length === 0) {
    // Fallback: use all backgrounds from category if filter too restrictive
    console.warn(`No backgrounds matched filter for ${vibe}, using full category`);
    backgrounds = getBackgroundsByCategory(config.category);
  }

  const primary = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  // Step 2: Derive secondary from baseColor (existing function)
  const secondary = getSecondaryBackground(primary.baseColor);

  // Step 3: Derive accent from baseColor (color harmony)
  const accent = getAccentForBaseColor(primary.baseColor);

  // Step 4: Get vibe-appropriate neutral and divider
  const neutral = VIBE_NEUTRAL[vibe];
  const divider = DIVIDER_MAP[primary.baseColor] || 'rgba(243, 244, 246, 0.5)';

  return {
    primary: primary.css,
    secondary,
    neutral,
    divider,
    baseColor: primary.baseColor,
    accentColor: accent.accentColor,
    accentCSS: accent.accentCSS
  };
}
```

---

### Step 2: Update `GeneratingStep.tsx`

**File:** `src/app/create/[token]/components/steps/GeneratingStep.tsx`

**Changes:**

```typescript
// Add import
import { generateBackgroundSystemForVibe } from '@/modules/Design/vibeBackgroundSystem';

// In saveGeneratedContent function (around line 157):

const saveGeneratedContent = useCallback(async (sectionCopy: Record<string, any>) => {
  // Get complete background system from vibe
  const backgroundSystem = generateBackgroundSystemForVibe(strategy.vibe);

  // Get fonts from existing vibe mapping
  const designTokens = getDesignTokensForVibe(strategy.vibe);

  // Build section content with backgroundType
  const content: Record<string, any> = {};
  sectionIds.forEach((id) => {
    const layout = sectionLayouts[id];
    const sectionType = id.split('-')[0]; // Extract type from id like 'hero-abc123'

    content[id] = {
      id,
      layout,
      elements: sectionCopy?.[id]?.elements || {},
      backgroundType: getBackgroundTypeForSection(sectionType), // NEW
      aiMetadata: {
        aiGenerated: true,
        isCustomized: false,
        lastGenerated: Date.now(),
        aiGeneratedElements: Object.keys(sectionCopy?.[id]?.elements || {}),
        excludedElements: []
      }
    };
  });

  const finalContent = {
    layout: {
      sections: sectionIds,
      sectionLayouts,
      theme: {
        typography: {
          headingFont: designTokens.headingFont,
          bodyFont: designTokens.bodyFont,
        },
        colors: {
          baseColor: backgroundSystem.baseColor,
          accentColor: backgroundSystem.accentColor,
          accentCSS: backgroundSystem.accentCSS,
          sectionBackgrounds: {
            primary: backgroundSystem.primary,
            secondary: backgroundSystem.secondary,
            neutral: backgroundSystem.neutral,
            divider: backgroundSystem.divider,
          },
        },
        vibe: strategy.vibe,
      },
      globalSettings: {},
    },
    content,
    meta: {
      id: tokenId,
      title: productName || 'Untitled Landing Page',
      slug: '',
      lastUpdated: Date.now(),
      version: 1,
      tokenId,
    },
    generatedAt: Date.now(),
  };

  // Save to API
  await fetch('/api/saveDraft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenId,
      title: productName || 'Untitled Landing Page',
      finalContent,
    }),
  });
}, [strategy, uiblockSelections, productName, tokenId, sectionIds, sectionLayouts]);


// Add helper function (outside component or in utils):
function getBackgroundTypeForSection(sectionType: string): 'primary' | 'secondary' | 'neutral' {
  const primarySections = ['hero', 'cta'];
  const secondarySections = ['features', 'howitworks', 'testimonials', 'results', 'uniquemechanism', 'socialproof'];

  const normalizedType = sectionType.toLowerCase();

  if (primarySections.includes(normalizedType)) return 'primary';
  if (secondarySections.includes(normalizedType)) return 'secondary';
  return 'neutral';
}
```

---

### Step 3: Verify Existing Functions

**Ensure these exist and work:**

| Function | File | Purpose |
|----------|------|---------|
| `getBackgroundsByCategory(category)` | `primaryBackgrounds.ts` | Returns backgrounds for category |
| `getSecondaryBackground(baseColor)` | `simpleSecondaryBackgrounds.ts` | Returns secondary CSS |
| `accentOptions` | `accentOptions.ts` | Array of base→accent pairs |
| `getDesignTokensForVibe(vibe)` | `vibeMapping.ts` | Returns fonts |

---

## Data Flow Summary

```
Vibe ('Bold Energy')
    ↓
generateBackgroundSystemForVibe(vibe)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. VIBE_CONFIG['Bold Energy'] → { category: 'friendly',     │
│                                   baseColors: ['purple'...]}│
│ 2. getBackgroundsByCategory('friendly') → 25 backgrounds    │
│ 3. Filter by baseColors → ~8 purple/pink/indigo backgrounds │
│ 4. Random pick → { css, baseColor: 'purple' }              │
│ 5. getSecondaryBackground('purple') → 'rgba(...)'          │
│ 6. getAccentForBaseColor('purple') → { pink, bg-pink-500 } │
│ 7. VIBE_NEUTRAL['Bold Energy'] → '#faf5ff'                 │
└─────────────────────────────────────────────────────────────┘
    ↓
Returns: {
  primary: 'linear-gradient(to top right, #a855f7, #c084fc...)',
  secondary: 'rgba(243, 232, 255, 0.7)',
  neutral: '#faf5ff',
  divider: 'rgba(243, 232, 255, 0.5)',
  baseColor: 'purple',
  accentColor: 'pink',
  accentCSS: 'bg-pink-500'
}
```

**Vibe differentiation via baseColor filter:**

| Vibe | Category | BaseColor Filter | Result |
|------|----------|------------------|--------|
| Dark Tech | technical | (none) | All 17 dark backgrounds |
| Light Trust | professional | blue, sky, slate, indigo | Blue-tinted professional |
| Warm Friendly | friendly | amber, orange, yellow, emerald, green, teal | Warm-toned friendly |
| Bold Energy | friendly | purple, pink, indigo, violet, blue, cyan | Vibrant/cool friendly |
| Calm Minimal | professional | gray, slate, stone, neutral, zinc | Neutral professional |
```

---

## Section Background Assignment

| backgroundType | Sections |
|----------------|----------|
| `primary` | hero, cta |
| `secondary` | features, howitworks, testimonials, results, uniquemechanism, socialproof |
| `neutral` | header, footer, problem, faq, pricing, usecases, objectionhandle, foundernote, beforeafter |

---

## Verification Checklist

1. **Generate with "Dark Tech" vibe:**
   - [ ] Hero has dark gradient background (from technical category)
   - [ ] CTA has same dark gradient
   - [ ] Features has subtle secondary tint
   - [ ] FAQ/Pricing has dark neutral (#0f172a)
   - [ ] Buttons have cyan accent (not slate/gray)

2. **Generate with "Warm Friendly" vibe:**
   - [ ] Hero has warm/amber/emerald gradient (NOT purple/pink)
   - [ ] Buttons have complementary accent (orange/emerald)
   - [ ] Neutral sections have warm white (#fffbeb)

3. **Generate with "Bold Energy" vibe:**
   - [ ] Hero has vibrant purple/pink/indigo gradient (NOT amber/orange)
   - [ ] Different from Warm Friendly despite both being "friendly" category
   - [ ] Buttons have complementary accent (pink/cyan)

4. **Generate with "Light Trust" vs "Calm Minimal":**
   - [ ] Light Trust gets blue-tinted backgrounds
   - [ ] Calm Minimal gets neutral gray/stone backgrounds
   - [ ] Different despite both being "professional" category

5. **Multiple generations same vibe:**
   - [ ] Different backgrounds each time (variety preserved)
   - [ ] Accent colors vary (random from matching pairs)

6. **Check saved draft in DB:**
   - [ ] `theme.colors.accentCSS` exists and is valid Tailwind class
   - [ ] `theme.colors.sectionBackgrounds.primary` is CSS gradient
   - [ ] Each section in `content` has `backgroundType` field

---

## Files Summary

| Action | File |
|--------|------|
| **CREATE** | `src/modules/Design/vibeBackgroundSystem.ts` |
| **MODIFY** | `src/app/create/[token]/components/steps/GeneratingStep.tsx` |
| **NO CHANGE** | `primaryBackgrounds.ts`, `simpleSecondaryBackgrounds.ts`, `accentOptions.ts` |
