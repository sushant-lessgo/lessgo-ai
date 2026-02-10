# Card Colors System - Implementation Spec

## Overview

Implement adaptive card styling based on section background luminance. Cards should be visible and aesthetically appropriate on any section background.

---

## Core Concept

| Input | Determines |
|-------|------------|
| `sectionBackgroundCSS` | Luminance → card structure, text colors |
| `theme` (warm/cool/neutral) | Icon bg, icon color, hover glow |

---

## 1. New Utility: `getCardStyles()`

**Location**: `src/modules/Design/cardStyles.ts`

### Input
```typescript
interface CardStylesInput {
  sectionBackgroundCSS: string;  // CSS string to analyze
  theme: 'warm' | 'cool' | 'neutral';
}
```

### Output
```typescript
interface CardStyles {
  // Card container
  bg: string;           // Tailwind bg class
  blur: string;         // backdrop-blur class or ''
  border: string;       // Tailwind border class
  shadow: string;       // Tailwind shadow class

  // Text colors
  textHeading: string;  // Tailwind text class or hex
  textBody: string;
  textMuted: string;

  // Icon styling
  iconBg: string;       // Tailwind bg class
  iconColor: string;    // Tailwind text class

  // Hover
  hoverEffect: string;  // Tailwind hover classes
}
```

### Implementation

```typescript
import { analyzeBackground } from '@/utils/backgroundAnalysis';

export function getCardStyles({ sectionBackgroundCSS, theme }: CardStylesInput): CardStyles {
  const analysis = analyzeBackground(sectionBackgroundCSS);
  const luminance = analysis.luminance;

  // Get base styles from luminance
  const base = getCardStylesForLuminance(luminance);

  // Get theme-specific styles
  const themed = getThemedStyles(theme, luminance);

  return {
    ...base,
    ...themed
  };
}

function getCardStylesForLuminance(luminance: number) {
  // Very dark (0 - 0.25)
  if (luminance <= 0.25) {
    return {
      bg: 'bg-white/15',
      blur: 'backdrop-blur-lg',
      border: 'border-white/10',
      shadow: 'shadow-xl',
      textHeading: 'text-white',
      textBody: 'text-gray-200',
      textMuted: 'text-gray-300',
    };
  }

  // Dark (0.25 - 0.45)
  if (luminance <= 0.45) {
    return {
      bg: 'bg-white/10',
      blur: 'backdrop-blur-md',
      border: 'border-white/10',
      shadow: 'shadow-lg',
      textHeading: 'text-white',
      textBody: 'text-gray-200',
      textMuted: 'text-gray-300',
    };
  }

  // Medium (0.45 - 0.55)
  if (luminance <= 0.55) {
    return {
      bg: 'bg-gray-50/80',
      blur: '',
      border: 'border-gray-200',
      shadow: 'shadow-md',
      textHeading: 'text-gray-900',
      textBody: 'text-gray-700',
      textMuted: 'text-gray-500',
    };
  }

  // Light (0.55 - 0.75)
  if (luminance <= 0.75) {
    return {
      bg: 'bg-white/95',
      blur: '',
      border: 'border-gray-100',
      shadow: 'shadow-sm',
      textHeading: 'text-gray-900',
      textBody: 'text-gray-700',
      textMuted: 'text-gray-500',
    };
  }

  // Very light (0.75 - 1.0)
  return {
    bg: 'bg-white',
    blur: '',
    border: 'border-gray-200',
    shadow: 'shadow-md',
    textHeading: 'text-gray-900',
    textBody: 'text-gray-700',
    textMuted: 'text-gray-500',
  };
}

// Explicit class mappings (required - Tailwind purges dynamic classes)
const iconStyles = {
  warm: {
    dark: { bg: 'bg-orange-500/20', color: 'text-orange-400' },
    light: { bg: 'bg-orange-100', color: 'text-orange-600' }
  },
  cool: {
    dark: { bg: 'bg-blue-500/20', color: 'text-blue-400' },
    light: { bg: 'bg-blue-100', color: 'text-blue-600' }
  },
  neutral: {
    dark: { bg: 'bg-white/20', color: 'text-gray-400' },
    light: { bg: 'bg-gray-100', color: 'text-gray-600' }
  }
};

const hoverStyles = {
  warm: {
    dark: 'hover:shadow-orange-400/20 hover:shadow-2xl',
    light: 'hover:shadow-orange-500/10 hover:shadow-lg'
  },
  cool: {
    dark: 'hover:shadow-blue-400/20 hover:shadow-2xl',
    light: 'hover:shadow-blue-500/10 hover:shadow-lg'
  },
  neutral: {
    dark: 'hover:shadow-white/20 hover:shadow-2xl',
    light: 'hover:shadow-gray-500/10 hover:shadow-lg'
  }
};

function getThemedStyles(theme: 'warm' | 'cool' | 'neutral', luminance: number) {
  const isDark = luminance <= 0.45;
  const mode = isDark ? 'dark' : 'light';

  return {
    iconBg: iconStyles[theme][mode].bg,
    iconColor: iconStyles[theme][mode].color,
    hoverEffect: hoverStyles[theme][mode],
  };
}
```

---

## 2. Published Version: `getPublishedCardStyles()`

**Location**: `src/lib/publishedTextColors.ts` (extend existing file)

### Output
```typescript
interface PublishedCardStyles {
  // Card container
  bg: string;              // rgba/hex value
  backdropFilter: string;  // 'blur(16px)' or 'none'
  borderColor: string;     // rgba/hex value
  borderWidth: string;     // '1px'
  borderStyle: string;     // 'solid'
  boxShadow: string;       // CSS shadow value

  // Text colors
  textHeading: string;     // hex
  textBody: string;        // hex
  textMuted: string;       // hex

  // Icon styling
  iconBg: string;          // rgba/hex
  iconColor: string;       // hex
}
```

### Implementation

```typescript
export function getPublishedCardStyles(
  luminance: number,
  theme: 'warm' | 'cool' | 'neutral'
): PublishedCardStyles {

  const isDark = luminance <= 0.45;

  // Luminance-based structure
  let base;
  if (luminance <= 0.25) {
    base = {
      bg: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(16px)',  // lg
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      textHeading: '#ffffff',
      textBody: '#e5e7eb',
      textMuted: '#d1d5db',
    };
  } else if (luminance <= 0.45) {
    base = {
      bg: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',  // md
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      textHeading: '#ffffff',
      textBody: '#e5e7eb',
      textMuted: '#d1d5db',
    };
  } else if (luminance <= 0.55) {
    base = {
      bg: 'rgba(249,250,251,0.8)',
      backdropFilter: 'none',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      textHeading: '#111827',
      textBody: '#374151',
      textMuted: '#6b7280',
    };
  } else if (luminance <= 0.75) {
    base = {
      bg: 'rgba(255,255,255,0.95)',
      backdropFilter: 'none',
      borderColor: '#f3f4f6',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      textHeading: '#111827',
      textBody: '#374151',
      textMuted: '#6b7280',
    };
  } else {
    base = {
      bg: '#ffffff',
      backdropFilter: 'none',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      textHeading: '#111827',
      textBody: '#374151',
      textMuted: '#6b7280',
    };
  }

  // Theme-based icon colors
  const iconColors = {
    warm: {
      bgDark: 'rgba(249,115,22,0.2)', bgLight: '#ffedd5',
      colorDark: '#fb923c', colorLight: '#ea580c'
    },
    cool: {
      bgDark: 'rgba(59,130,246,0.2)', bgLight: '#dbeafe',
      colorDark: '#60a5fa', colorLight: '#2563eb'
    },
    neutral: {
      bgDark: 'rgba(255,255,255,0.2)', bgLight: '#f3f4f6',
      colorDark: '#9ca3af', colorLight: '#4b5563'
    }
  };

  const ic = iconColors[theme];

  return {
    ...base,
    iconBg: isDark ? ic.bgDark : ic.bgLight,
    iconColor: isDark ? ic.colorDark : ic.colorLight,
  };
}
```

---

## 3. Highlighted Cards (Pricing)

For "featured" tier in TierCards:

```typescript
function getHighlightedCardStyles(luminance: number, theme: 'warm' | 'cool' | 'neutral') {
  const isDark = luminance <= 0.45;

  const highlightColors = {
    warm: { dark: 'bg-orange-500/20 backdrop-blur', light: 'bg-orange-50' },
    cool: { dark: 'bg-blue-500/20 backdrop-blur', light: 'bg-blue-50' },
    neutral: { dark: 'bg-white/20 backdrop-blur', light: 'bg-gray-50' }
  };

  return {
    bg: isDark ? highlightColors[theme].dark : highlightColors[theme].light,
    // ...rest inherits from base card styles
  };
}
```

---

## 4. Accessibility: Text Shadow Fallback

For dark sections, add text shadow to ensure readability:

```typescript
// In dark section cards (luminance <= 0.45)
const glassTextStyles = {
  textHeading: 'text-white drop-shadow-sm',
  textBody: 'text-gray-200 drop-shadow-sm',
};
```

Or via CSS:
```css
.glass-card-text {
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
```

**Action**: Test WCAG contrast on actual glass cards. If fails AA, increase card bg opacity to `/20`.

---

## 5. Components to Update

| Component | File | Changes |
|-----------|------|---------|
| StackedPainBullets | `src/modules/UIBlocks/Problem/StackedPainBullets.tsx` | Use `getCardStyles()` |
| StackedPainBullets | `src/modules/UIBlocks/Problem/StackedPainBullets.published.tsx` | Use `getPublishedCardStyles()` |
| IconGrid | `src/modules/UIBlocks/Features/IconGrid.tsx` | Use `getCardStyles()` |
| IconGrid | `src/modules/UIBlocks/Features/IconGrid.published.tsx` | Use `getPublishedCardStyles()` |
| TierCards | `src/modules/UIBlocks/Pricing/TierCards.tsx` | Use `getCardStyles()` + highlighted variant |
| TierCards | `src/modules/UIBlocks/Pricing/TierCards.published.tsx` | Use `getPublishedCardStyles()` |
| VerticalTimeline | `src/modules/UIBlocks/HowItWorks/VerticalTimeline.tsx` | Use `getCardStyles()` |
| VerticalTimeline | `src/modules/UIBlocks/HowItWorks/VerticalTimeline.published.tsx` | Use `getPublishedCardStyles()` |
| AccordionSteps | `src/modules/UIBlocks/HowItWorks/AccordionSteps.tsx` | Use `getCardStyles()` |
| AccordionSteps | `src/modules/UIBlocks/HowItWorks/AccordionSteps.published.tsx` | Use `getPublishedCardStyles()` |

---

## 6. Usage Example

### In Component (Edit Mode)
```typescript
import { getCardStyles } from '@/modules/Design/cardStyles';

function PainPointItem({ sectionBackground, theme, ...props }) {
  const cardStyles = getCardStyles({
    sectionBackgroundCSS: sectionBackground,
    theme
  });

  return (
    <div className={`
      ${cardStyles.bg}
      ${cardStyles.blur}
      ${cardStyles.border}
      ${cardStyles.shadow}
      ${cardStyles.hoverEffect}
      rounded-lg p-6
    `}>
      <div className={cardStyles.iconBg}>
        <Icon className={cardStyles.iconColor} />
      </div>
      <h3 className={cardStyles.textHeading}>{title}</h3>
      <p className={cardStyles.textBody}>{description}</p>
    </div>
  );
}
```

### In Published Component

**IMPORTANT**: Published versions must include `hover:-translate-y-1` in className (not in style). This matches `cardStyles.hoverEffect` + `cardEnhancements.hoverLift` from edit mode.

```typescript
import { getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

function PainPointItemPublished({ sectionBackgroundCSS, theme, ...props }) {
  const { luminance } = analyzeBackground(sectionBackgroundCSS);
  const styles = getPublishedCardStyles(luminance, theme);

  return (
    <div
      className="transition-all duration-300 hover:-translate-y-1"  // ← Required for hover lift
      style={{
        backgroundColor: styles.bg,
        backdropFilter: styles.backdropFilter,
        WebkitBackdropFilter: styles.backdropFilter,  // Safari support
        borderColor: styles.borderColor,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        boxShadow: styles.boxShadow,
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}
    >
      <div style={{ backgroundColor: styles.iconBg }}>
        <Icon style={{ color: styles.iconColor }} />
      </div>
      <h3 style={{ color: styles.textHeading }}>{title}</h3>
      <p style={{ color: styles.textBody }}>{description}</p>
    </div>
  );
}
```

---

## 7. Testing Checklist

- [ ] Cards visible on very dark sections (primary gradients)
- [ ] Cards visible on light sections (neutral/white)
- [ ] Cards visible on medium sections (secondary tints)
- [ ] Text readable on glass cards (WCAG AA)
- [ ] Icons visible on all backgrounds
- [ ] Hover effects work on all backgrounds
- [ ] Highlighted pricing card visible on all backgrounds
- [ ] Published pages render correctly
- [ ] **Published cards have hover lift** (`hover:-translate-y-1` in className)

---

## 8. Reference Screenshots

| File | Shows |
|------|-------|
| `public/Test/full/lp_v8.png` | Current issue: light-on-light |
| `public/Test/full/lp_v9.png` | Current issue: harsh white on dark |

---

## 9. Deferred (Not in Scope)

- Blur performance optimization (add later if needed)
- Theme tinting of card backgrounds (Option 3)
- Full hue extraction (Option 4)

---

## Appendix: Complete Card Element Reference

### A. Element Ownership

| Element | Driven By | Harmony/Variety | Reason |
|---------|-----------|-----------------|--------|
| Section background | Design system | **Variety** | Creates visual rhythm across page |
| Card BG | Luminance | Adaptation | Must be visible on section |
| Card border | Luminance | Adaptation | Must contrast with card bg |
| Card shadow | Luminance | Adaptation | Depth perception varies by context |
| Card blur | Luminance | Adaptation | Glass effect only on dark sections |
| Text heading | Luminance | Adaptation | Readability |
| Text body | Luminance | Adaptation | Readability |
| Text muted | Luminance | Adaptation | Readability |
| Icon BG | Theme | **Harmony** | Brand consistency across page |
| Icon color | Theme | **Harmony** | Brand consistency across page |
| Hover glow | Theme + Luminance | Hybrid | Brand color, opacity adapts |
| Highlighted card | Theme + Luminance | Hybrid | Brand emphasis, intensity adapts |

### B. Complete Style Matrix by Luminance

| Element | Very Dark (0-0.25) | Dark (0.25-0.45) | Medium (0.45-0.55) | Light (0.55-0.75) | Very Light (0.75-1) |
|---------|-------------------|------------------|--------------------|--------------------|---------------------|
| **Card BG** | `bg-white/15` | `bg-white/10` | `bg-gray-50/80` | `bg-white/95` | `bg-white` |
| **Blur** | `backdrop-blur-lg` | `backdrop-blur-md` | - | - | - |
| **Border** | `border-white/10` | `border-white/10` | `border-gray-200` | `border-gray-100` | `border-gray-200` |
| **Shadow** | `shadow-xl` | `shadow-lg` | `shadow-md` | `shadow-sm` | `shadow-md` |
| **Text Heading** | `#ffffff` | `#ffffff` | `#111827` | `#111827` | `#111827` |
| **Text Body** | `#e5e7eb` | `#e5e7eb` | `#374151` | `#374151` | `#374151` |
| **Text Muted** | `#d1d5db` | `#d1d5db` | `#6b7280` | `#6b7280` | `#6b7280` |

### C. Theme-Based Styles (Icons & Hover)

| Element | Warm (Dark) | Warm (Light) | Cool (Dark) | Cool (Light) | Neutral (Dark) | Neutral (Light) |
|---------|-------------|--------------|-------------|--------------|----------------|-----------------|
| **Icon BG** | `bg-orange-500/20` | `bg-orange-100` | `bg-blue-500/20` | `bg-blue-100` | `bg-white/20` | `bg-gray-100` |
| **Icon Color** | `text-orange-400` | `text-orange-600` | `text-blue-400` | `text-blue-600` | `text-gray-400` | `text-gray-600` |
| **Hover Glow** | `orange-400/20` | `orange-500/10` | `blue-400/20` | `blue-500/10` | `white/20` | `gray-500/10` |

### D. Highlighted Card Variants (Pricing)

| Theme | Dark Section | Light Section |
|-------|--------------|---------------|
| Warm | `bg-orange-500/20 backdrop-blur` | `bg-orange-50` |
| Cool | `bg-blue-500/20 backdrop-blur` | `bg-blue-50` |
| Neutral | `bg-white/20 backdrop-blur` | `bg-gray-50` |

### E. Design Principles Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    CARD STYLING SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Section Backgrounds    →    Create VARIETY (page rhythm)   │
│          ↓                                                  │
│  Luminance Detection    →    Analyze brightness             │
│          ↓                                                  │
│  Card Structure         →    ADAPT for visibility           │
│  (bg, border, shadow,       (luminance-driven)              │
│   text colors)                                              │
│          ↓                                                  │
│  Icons & Hover          →    HARMONY for brand              │
│                             (theme-driven)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### F. What's NOT Used

| Color System | Used In Cards? | Used For Instead |
|--------------|----------------|------------------|
| Accent color | No | CTAs, buttons, links |
| Base color | No | Primary background generation |
| Brand colors | No | Logo, specific brand elements |

┌──────────────┬─────────────────────┬─────────────────────┬────────────────────┬───────────────────┬─────────────────────┐
  │   Element    │ Very Dark (0-0.25)  │  Dark (0.25-0.45)   │ Medium (0.45-0.55) │ Light (0.55-0.75) │ Very Light (0.75-1) │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Card BG      │ bg-white/15 blur-lg │ bg-white/10 blur-md │ bg-gray-50/80      │ bg-white/95       │ bg-white            │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Card Border  │ border-white/10     │ border-white/10     │ border-gray-200    │ border-gray-100   │ border-gray-200     │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Card Shadow  │ shadow-xl           │ shadow-lg           │ shadow-md          │ shadow-sm         │ shadow-md           │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Text Heading │ #ffffff             │ #ffffff             │ #111827            │ #111827           │ #111827             │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Text Body    │ #e5e7eb             │ #e5e7eb             │ #374151            │ #374151           │ #374151             │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Text Muted   │ #d1d5db             │ #d1d5db             │ #6b7280            │ #6b7280           │ #6b7280             │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Icon BG      │ {theme}-500/20      │ {theme}-500/20      │ {theme}-100        │ {theme}-100       │ {theme}-100         │
  ├──────────────┼─────────────────────┼─────────────────────┼────────────────────┼───────────────────┼─────────────────────┤
  │ Icon Color   │ {theme}-400         │ {theme}-400         │ {theme}-600        │ {theme}-600       │ {theme}-600         │
  └──────────────┴─────────────────────┴─────────────────────┴────────────────────┴───────────────────┴─────────────────────┘
  Where {theme} = orange (warm) / blue (cool) / gray (neutral)

---

### G. Complete UIBlocks Update List

#### Problem Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| StackedPainBullets | `Problem/StackedPainBullets.tsx` | Yes | High |
| StackedPainBullets | `Problem/StackedPainBullets.published.tsx` | Yes | High |

#### Features Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| IconGrid | `Features/IconGrid.tsx` | Yes | High |
| IconGrid | `Features/IconGrid.published.tsx` | Yes | High |
| MetricTiles | `Features/MetricTiles.tsx` | Yes | Medium |
| MetricTiles | `Features/MetricTiles.published.tsx` | Yes | Medium |
| Carousel | `Features/Carousel.tsx` | Yes | Medium |
| Carousel | `Features/Carousel.published.tsx` | Yes | Medium |
| SplitAlternating | `Features/SplitAlternating.tsx` | No (layout) | - |

#### HowItWorks Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| VerticalTimeline | `HowItWorks/VerticalTimeline.tsx` | Yes | High |
| VerticalTimeline | `HowItWorks/VerticalTimeline.published.tsx` | Yes | High |
| AccordionSteps | `HowItWorks/AccordionSteps.tsx` | Yes | High |
| AccordionSteps | `HowItWorks/AccordionSteps.published.tsx` | Yes | High |
| ThreeStepHorizontal | `HowItWorks/ThreeStepHorizontal.tsx` | Yes | Medium |
| ThreeStepHorizontal | `HowItWorks/ThreeStepHorizontal.published.tsx` | Yes | Medium |
| VideoWalkthrough | `HowItWorks/VideoWalkthrough.tsx` | No (video) | - |

#### Pricing Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| TierCards | `Pricing/TierCards.tsx` | Yes | High |
| TierCards | `Pricing/TierCards.published.tsx` | Yes | High |
| ToggleableMonthlyYearly | `Pricing/ToggleableMonthlyYearly.tsx` | Yes | Medium |
| ToggleableMonthlyYearly | `Pricing/ToggleableMonthlyYearly.published.tsx` | Yes | Medium |
| CallToQuotePlan | `Pricing/CallToQuotePlan.tsx` | Yes | Medium |
| CallToQuotePlan | `Pricing/CallToQuotePlan.published.tsx` | Yes | Medium |

#### UseCases Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| PersonaGrid | `UseCases/PersonaGrid.tsx` | Yes | Medium |
| PersonaGrid | `UseCases/PersonaGrid.published.tsx` | Yes | Medium |
| IndustryUseCaseGrid | `UseCases/IndustryUseCaseGrid.tsx` | Yes | Medium |
| IndustryUseCaseGrid | `UseCases/IndustryUseCaseGrid.published.tsx` | Yes | Medium |
| RoleBasedScenarios | `UseCases/RoleBasedScenarios.tsx` | Yes | Medium |
| RoleBasedScenarios | `UseCases/RoleBasedScenarios.published.tsx` | Yes | Medium |

#### Testimonials Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| QuoteGrid | `Testimonials/QuoteGrid.tsx` | Yes | Medium |
| QuoteGrid | `Testimonials/QuoteGrid.published.tsx` | Yes | Medium |
| PullQuoteStack | `Testimonials/PullQuoteStack.tsx` | Yes | Medium |
| PullQuoteStack | `Testimonials/PullQuoteStack.published.tsx` | Yes | Medium |
| BeforeAfterQuote | `Testimonials/BeforeAfterQuote.tsx` | Yes | Low |
| BeforeAfterQuote | `Testimonials/BeforeAfterQuote.published.tsx` | Yes | Low |
| VideoTestimonials | `Testimonials/VideoTestimonials.tsx` | Yes | Low |
| VideoTestimonials | `Testimonials/VideoTestimonials.published.tsx` | Yes | Low |

#### Results Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| StatBlocks | `Results/StatBlocks.tsx` | Yes | Medium |
| StatBlocks | `Results/StatBlocks.published.tsx` | Yes | Medium |
| StackedWinsList | `Results/StackedWinsList.tsx` | Yes | Medium |
| StackedWinsList | `Results/StackedWinsList.published.tsx` | Yes | Medium |
| ResultsGallery | `Results/ResultsGallery.tsx` | Yes | Low |

#### UniqueMechanism Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| StackedHighlights | `UniqueMechanism/StackedHighlights.tsx` | Yes | Medium |
| StackedHighlights | `UniqueMechanism/StackedHighlights.published.tsx` | Yes | Medium |
| SecretSauceReveal | `UniqueMechanism/SecretSauceReveal.tsx` | Yes | Low |
| SecretSauceReveal | `UniqueMechanism/SecretSauceReveal.published.tsx` | Yes | Low |
| MethodologyBreakdown | `UniqueMechanism/MethodologyBreakdown.tsx` | Yes | Low |
| MethodologyBreakdown | `UniqueMechanism/MethodologyBreakdown.published.tsx` | Yes | Low |
| TechnicalAdvantage | `UniqueMechanism/TechnicalAdvantage.tsx` | Yes | Low |
| TechnicalAdvantage | `UniqueMechanism/TechnicalAdvantage.published.tsx` | Yes | Low |
| ProcessFlowDiagram | `UniqueMechanism/ProcessFlowDiagram.tsx` | Yes | Low |
| ProcessFlowDiagram | `UniqueMechanism/ProcessFlowDiagram.published.tsx` | Yes | Low |
| PropertyComparisonMatrix | `UniqueMechanism/PropertyComparisonMatrix.tsx` | Yes | Low |
| PropertyComparisonMatrix | `UniqueMechanism/PropertyComparisonMatrix.published.tsx` | Yes | Low |

#### ObjectionHandle Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| VisualObjectionTiles | `ObjectionHandle/VisualObjectionTiles.tsx` | Yes | Medium |
| VisualObjectionTiles | `ObjectionHandle/VisualObjectionTiles.published.tsx` | Yes | Medium |
| MythVsRealityGrid | `ObjectionHandle/MythVsRealityGrid.tsx` | Yes | Medium |
| MythVsRealityGrid | `ObjectionHandle/MythVsRealityGrid.published.tsx` | Yes | Medium |

#### FAQ Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| AccordionFAQ | `FAQ/AccordionFAQ.tsx` | Yes | Medium |
| AccordionFAQ | `FAQ/AccordionFAQ.published.tsx` | Yes | Medium |
| TwoColumnFAQ | `FAQ/TwoColumnFAQ.tsx` | Yes | Low |
| TwoColumnFAQ | `FAQ/TwoColumnFAQ.published.tsx` | Yes | Low |
| SegmentedFAQTabs | `FAQ/SegmentedFAQTabs.tsx` | Yes | Low |
| SegmentedFAQTabs | `FAQ/SegmentedFAQTabs.published.tsx` | Yes | Low |
| InlineQnAList | `FAQ/InlineQnAList.tsx` | Yes | Low |
| InlineQnAList | `FAQ/InlineQnAList.published.tsx` | Yes | Low |

#### BeforeAfter Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| SplitCard | `BeforeAfter/SplitCard.tsx` | Yes | Low |
| SplitCard | `BeforeAfter/SplitCard.published.tsx` | Yes | Low |
| SideBySideBlock | `BeforeAfter/SideBySideBlock.tsx` | Yes | Low |
| SideBySideBlock | `BeforeAfter/SideBySideBlock.published.tsx` | Yes | Low |
| StackedTextVisual | `BeforeAfter/StackedTextVisual.tsx` | No | - |

#### FounderNote Section
| Component | File | Has Cards | Priority |
|-----------|------|-----------|----------|
| LetterStyleBlock | `FounderNote/LetterStyleBlock.tsx` | Yes | Low |
| LetterStyleBlock | `FounderNote/LetterStyleBlock.published.tsx` | Yes | Low |

#### No Cards (Skip)
| Component | Reason |
|-----------|--------|
| Hero/* | Layout containers, no cards |
| CTA/* | Button-focused, no cards |
| Header/* | Navigation, no cards |
| Footer/* | Contact info, no cards |
| SocialProof/LogoWall | Logo display, no cards |

---

### H. Implementation Order Summary

| Phase | Components | Count |
|-------|------------|-------|
| **Phase 1 (High)** | StackedPainBullets, IconGrid, VerticalTimeline, AccordionSteps, TierCards | 10 files |
| **Phase 2 (Medium)** | MetricTiles, Carousel, ThreeStepHorizontal, ToggleableMonthlyYearly, CallToQuotePlan, PersonaGrid, IndustryUseCaseGrid, RoleBasedScenarios, QuoteGrid, PullQuoteStack, StatBlocks, StackedWinsList, StackedHighlights, VisualObjectionTiles, MythVsRealityGrid, AccordionFAQ | 32 files |
| **Phase 3 (Low)** | Everything else with cards | ~26 files |
| **Total** | | ~68 files |

Recommended Approach
                                                                                                                                                                               
  Step 1: One dev creates utility + Phase 1 (validates approach)
  ┌─────────────────────────────────────────────────┬─────────────┬───────┐
  │                      Task                       │    Files    │  Dev  │
  ├─────────────────────────────────────────────────┼─────────────┼───────┤
  │ Create cardStyles.ts + getPublishedCardStyles() │ 2 new files │ Dev A │
  ├─────────────────────────────────────────────────┼─────────────┼───────┤
  │ Phase 1 (High priority)                         │ 10 files    │ Dev A │
  └─────────────────────────────────────────────────┴─────────────┴───────┘
  Why: Utility must be tested before mass rollout. Phase 1 validates it works.

  ---
  Step 2: Parallelize Phase 2-3 by section
  ┌───────┬─────────────────────────────────────────────────────────────────┬───────────┐
  │  Dev  │                            Sections                             │   Files   │
  ├───────┼─────────────────────────────────────────────────────────────────┼───────────┤
  │ Dev A │ Features, HowItWorks                                            │ ~14 files │
  ├───────┼─────────────────────────────────────────────────────────────────┼───────────┤
  │ Dev B │ Pricing, UseCases, Testimonials, Results                        │ ~22 files │
  ├───────┼─────────────────────────────────────────────────────────────────┼───────────┤
  │ Dev C │ UniqueMechanism, ObjectionHandle, FAQ, BeforeAfter, FounderNote │ ~22 files │
  └───────┴─────────────────────────────────────────────────────────────────┴───────────┘
  Why:
  - Files are independent (no cross-dependencies)
  - Same pattern applied to all
  - No merge conflicts (different folders)

  ---
  Timeline
  ┌───────────────────┬──────────┬──────────────────────────────────┐
  │       Phase       │ Duration │           Parallelism            │
  ├───────────────────┼──────────┼──────────────────────────────────┤
  │ Utility + Phase 1 │ 1 dev    │ Sequential (must validate first) │
  ├───────────────────┼──────────┼──────────────────────────────────┤
  │ Phase 2-3         │ 3 devs   │ Parallel                         │
  └───────────────────┴──────────┴──────────────────────────────────┘
  Total: ~2x faster than sequential.

  ---
  Key Rule

  Don't start Phase 2-3 until Phase 1 is tested and working. Otherwise 3 devs might all hit the same bug.