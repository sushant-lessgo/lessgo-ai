# Publishing Architecture - Implementation Guide

> ⚠️ **Stale in places (2026-07).** This is the original phased build log; the core
> approach (separate `.published.tsx` files + a server-safe published renderer) is
> still accurate, but several specifics have moved on:
> - **Phase 2 (forms) is DONE, not planned.** `src/components/published/FormIsland.tsx`
>   exists and published pages have working forms (the injected handler is
>   `public/assets/form.v1.js`). Ignore the "📋 PLANNED / NOT YET CREATED" wording below.
> - **Rendering moved out of the publish route.** Static HTML is now produced by
>   `generateStaticHTML()` in `src/lib/staticExport/htmlGenerator.ts` via
>   `ReactDOMServer.renderToStaticMarkup(LandingPagePublishedRenderer, …)` — not the
>   inline `renderToString` snippet shown in the "Published Component Registry" /
>   "Server Rendering Method" sections.
> - **Routes renamed.** The editor is `/edit/[token]` (not `/create/…`), onboarding is
>   `/onboarding/{product,service}/[token]`, and `InjectLandingTheme.tsx` no longer exists.
> - The dual-renderer contract and the UIBlock conversion playbook remain the source
>   of truth for adding published blocks. See `CLAUDE.md` for the current publish flow.

## Overview

This document outlines the architecture for optimizing published landing pages in Lessgo.ai, addressing performance issues and rendering discrepancies between preview and published pages.

**Initial Problem**: LCP 5 seconds on published pages (ticketverz.lessgo.ai)
**Root Cause**: Published pages inherit full app shell + client-side rendering
**Solution**: Three-phase approach

| Phase | Status | Achievement |
|-------|--------|-------------|
| **Phase 1** | ✅ COMPLETE | Server-first delivery, 82% bundle reduction, 75% LCP improvement |
| **Phase 1.1** | ✅ COMPLETE | SSR infrastructure, published primitives, conversion playbook |
| **Phase 2** | ✅ COMPLETE | Form injection & hydration (FormIsland + injected `form.v1.js`) |

---

## Phase 1: Server-First Published Page Delivery ✅ COMPLETE

### Problem Solved
- Published pages loading ~500KB bundle (ClerkProvider, PostHogProvider, editing system)
- Using `ssr: false` (client-only rendering)
- Loading 14 Google fonts inline
- Running background generation at runtime (800ms)

### Implementation Complete

**1. Isolated `/p/` Layout**
- **Created**: `src/app/p/layout.tsx`
- Bypasses root layout's heavy providers
- Uses `next/font/google` instead of runtime font loading
- Loads only Inter and Bricolage Grotesque with `display: 'swap'`

**2. Server-First Page Component**
- **Modified**: `src/app/p/[slug]/page.tsx`
- Changed from client-side rendering to pure server component
- Added ISR: `export const revalidate = 3600`
- Renders htmlContent with `dangerouslySetInnerHTML`

**3. Theme CSS Injection**
- **Created**: `src/lib/themeUtils.ts`
- Server-side theme utilities: `darken()`, `lighten()`, `isLight()`
- `generateThemeCSS()` - generates inline `<style>` tag with CSS variables
- `generateInlineStyles()` - creates inline styles object for components

**4. Fixed Theme Override Issue**
- **Modified**: `src/components/theme/InjectLandingTheme.tsx`
- Changed pathname check from `/p/` OR `/create/` to ONLY `/create/`
- Prevents client-side theme injection from overriding embedded CSS on published pages

**5. Fixed Missing Section Backgrounds**
- **Modified**: `src/modules/generatedLanding/LandingPageRenderer.tsx` (lines 455-462)
- Variable System path now applies backgrounds as inline styles:
```tsx
<div
  className="relative"
  style={{
    background: customBackgroundStyle?.background || sectionBackgroundCSS,
    ...customBackgroundStyle
  }}
  data-background-type={backgroundType}
>
```

**6. Storage SSR Safety**
- **Modified**: `src/utils/storage.ts`
- Added `isStorageAvailable()` check for `typeof window === 'undefined'`
- All localStorage operations guarded by availability check

**7. Validation Schema Updated**
- **Modified**: `src/lib/validation.ts` (line 41)
- `htmlContent` marked as optional in PublishSchema
- Comment: "PHASE 1.3: Optional - now generated server-side"

### Results Achieved
- Bundle size reduced: ~500KB → 87.7KB (82.5% reduction)
- LCP improvement: 5s → 1.2s (75% improvement)
- TTFB improvement: 800ms → 200ms (75% improvement)
- Server-first architecture eliminates client rendering delay
- Theme CSS properly embedded and not overridden
- Section backgrounds now visible in published pages

### Phase 1 Files Modified
1. `src/app/p/layout.tsx` - Created
2. `src/app/p/[slug]/page.tsx` - Modified
3. `src/lib/themeUtils.ts` - Created
4. `src/app/api/publish/route.ts` - Modified
5. `src/components/theme/InjectLandingTheme.tsx` - Modified
6. `src/modules/generatedLanding/LandingPageRenderer.tsx` - Modified
7. `src/utils/storage.ts` - Modified
8. `src/lib/validation.ts` - Modified

---

## Phase 1.1: SSR Publishing Infrastructure ✅ COMPLETE

### Architecture Decision: Separate `.published.tsx` Files

**Why Separate Files?**
- Original UIBlocks use `'use client'` directive
- Importing them into `componentRegistry.published.ts` breaks server-side rendering
- Even with `mode` prop, module-level hooks cause SSR errors
- Separate `.published.tsx` files ensure zero hook imports

**Implementation Pattern**:
```
src/modules/UIBlocks/
  Hero/
    Minimalist.tsx          (editable - uses 'use client', hooks, stores)
    Minimalist.published.tsx (published - server-safe, no hooks)
  PrimaryCTA/
    CTAWithFormField.tsx
    CTAWithFormField.published.tsx
```

### Published Primitive Components ✅ COMPLETE

**Location**: `src/components/published/`

All 8 primitives created and server-safe (no hooks, no browser APIs):

| Component | File | Purpose |
|-----------|------|---------|
| LogoPublished | LogoPublished.tsx | Logo with initials fallback |
| IconPublished | IconPublished.tsx | Emoji/Unicode icons |
| CheckmarkIconPublished | CheckmarkIconPublished.tsx | SVG checkmark (fixes missing icons) |
| CTAButtonPublished | CTAButtonPublished.tsx | Button with inline theme colors |
| ImagePublished | ImagePublished.tsx | Image wrapper |
| SectionWrapperPublished | SectionWrapperPublished.tsx | Section container with padding (CRITICAL) |
| AvatarPublished | AvatarPublished.tsx | Avatar with initials fallback |
| TextPublished | TextPublished.tsx | Text + HeadlinePublished components |

**Export Index**: `src/components/published/index.ts`

### Server-Side Renderer ✅ COMPLETE

**File**: `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`

**Features**:
- Pure server component (no hooks, no Zustand, no browser APIs)
- Extracts sectionLayouts from content object
- Handles custom backgrounds (solid/gradient)
- Flattens nested content fields (elements → top-level props)
- Passes `mode="published"` to all UIBlock components
- Silent fallback for missing components (console.warn)

**Integration**: Used by publish route via `renderToString`:

```typescript
// src/app/api/publish/route.ts
const { renderToString } = await import('react-dom/server');

const reactHtml = renderToString(
  React.createElement(LandingPagePublishedRenderer, {
    sections: content.layout.sections,
    content: content.content,
    theme: content.layout.theme,
  })
);

const themeCSS = generateThemeCSS({
  primary: content.layout.theme?.colors?.accentColor || '#3B82F6',
  background: content.layout.theme?.colors?.sectionBackgrounds?.primary || '#FFFFFF',
  muted: content.layout.theme?.colors?.textSecondary || '#6B7280'
});

const htmlContent = `${themeCSS}${reactHtml}`;
```

### Published Component Registry ✅ COMPLETE

**File**: `src/modules/generatedLanding/componentRegistry.published.ts`

Server-safe component registry that only imports `.published.tsx` files.

**Current Components** (starter set):
- `hero.minimalist` → MinimalistPublished
- `miscellaneous.announcement` → AnnouncementPublished
- `primarycta.ctawithformfield` → CTAWithFormFieldPublished
- `cta.ctawithformfield` → CTAWithFormFieldPublished (alias)
- `footer.simplefooter` → SimpleFooterPublished

**Helper Functions**:
```typescript
extractSectionType(sectionId: string): string
getComponent(type: string, layout: string): React.ComponentType<any> | null
hasLayout(type: string, layout: string): boolean
getAvailableLayouts(type: string): string[]
```

### Text Utilities ✅ COMPLETE

**File**: `src/lib/publishedTextColors.ts`

Server-safe utilities for text colors and typography:
- `getPublishedTextColors(backgroundType, theme, bg)` - Calculate text colors based on background
- `getPublishedTypographyStyles(variant, theme)` - Get typography styles without hooks

### Phase 1.1 Files Created
1. `src/components/published/LogoPublished.tsx`
2. `src/components/published/IconPublished.tsx`
3. `src/components/published/CheckmarkIconPublished.tsx`
4. `src/components/published/CTAButtonPublished.tsx`
5. `src/components/published/ImagePublished.tsx`
6. `src/components/published/SectionWrapperPublished.tsx`
7. `src/components/published/AvatarPublished.tsx`
8. `src/components/published/TextPublished.tsx`
9. `src/components/published/index.ts`
10. `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
11. `src/modules/generatedLanding/componentRegistry.published.ts`
12. `src/lib/publishedTextColors.ts`
13. `src/modules/UIBlocks/Hero/Minimalist.published.tsx`
14. `src/modules/UIBlocks/Miscellaneous/Announcement.published.tsx`
15. `src/modules/UIBlocks/PrimaryCTA/CTAWithFormField.published.tsx`
16. `src/modules/UIBlocks/Footer/SimpleFooter.published.tsx`

---

## UIBlock Conversion Playbook

Use this playbook when converting any UIBlock to support published mode.

### When to Convert a UIBlock

Convert UIBlocks on-demand when:
1. A user publishes a page using that UIBlock and reports missing elements
2. You're proactively addressing high-priority sections (Hero, CTA, Features)
3. Visual testing reveals discrepancies between preview and published

### Conversion Steps

#### Step 1: Create `.published.tsx` File

**Location**: Same directory as original UIBlock
**Naming**: `[OriginalName].published.tsx`

**Example**: Converting `src/modules/UIBlocks/Hero/LeftCopyRightImage.tsx`
- Create: `src/modules/UIBlocks/Hero/LeftCopyRightImage.published.tsx`

#### Step 2: Copy Original Structure

Start with the original UIBlock structure but remove all client-side dependencies:

```tsx
/**
 * LeftCopyRightImage - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';

export default function LeftCopyRightImagePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Default Headline';
  const subheadline = props.subheadline || '';
  const cta_text = props.cta_text || 'Get Started';
  const hero_image = props.hero_image || '/default-image.jpg';

  // ... rest of implementation
}
```

#### Step 3: Replace Client Components with Published Primitives

| Original Component | Published Replacement | Import |
|-------------------|----------------------|--------|
| `EditableText` | `TextPublished` | `@/components/published/TextPublished` |
| `EditableHeadline` | `HeadlinePublished` | `@/components/published/TextPublished` |
| logo (edit-side removed) | `LogoPublished` | `@/components/published/LogoPublished` |
| `IconEditableComponent` | `IconPublished` | `@/components/published/IconPublished` |
| SVG checkmarks (React component) | `CheckmarkIconPublished` | `@/components/published/CheckmarkIconPublished` |
| `ButtonComponent` | `CTAButtonPublished` | `@/components/published/CTAButtonPublished` |
| `Image` components with state | `ImagePublished` | `@/components/published/ImagePublished` |
| Section wrapper divs | `SectionWrapperPublished` | `@/components/published/SectionWrapperPublished` |

#### Step 4: Use Inline Styles for Theme Values

**❌ DON'T** use dynamic Tailwind classes:
```tsx
// This gets purged from static CSS!
<h2 className={`text-${theme.colors.primary}-600`}>
```

**✅ DO** use inline styles for theme values:
```tsx
<h2 style={{ color: theme.colors.textPrimary }}>
```

**Keep Tailwind for static structure**:
```tsx
<h2
  style={{ color: theme.colors.textPrimary }}
  className="text-4xl font-bold mb-6"
>
```

#### Step 5: Extract Typography Styles

Use server-safe typography utilities:

```tsx
import { getPublishedTypographyStyles } from '@/lib/publishedTextColors';

const headlineTypography = getPublishedTypographyStyles('h2', theme);
const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

<HeadlinePublished
  value={headline}
  level="h2"
  style={{
    color: textColors.heading,
    ...headlineTypography
  }}
/>
```

#### Step 6: Extract Text Colors

Use background-aware text color calculation:

```tsx
import { getPublishedTextColors } from '@/lib/publishedTextColors';

const textColors = getPublishedTextColors(
  backgroundType || 'primary',
  theme,
  sectionBackgroundCSS
);

// textColors provides: { heading, body, muted }
```

#### Step 7: Handle Arrays and Optional Elements

Filter out removed elements and handle optional props:

```tsx
// Benefits array
const benefits = [
  props.benefit_1,
  props.benefit_2,
  props.benefit_3,
].filter(b => b && b !== '___REMOVED___' && b.trim() !== '');

// Render only if present
{benefits.length > 0 && (
  <div className="space-y-3">
    {benefits.map((benefit, index) => (
      <div key={index} className="flex items-center space-x-3">
        <CheckmarkIconPublished color={theme.colors.accentColor} />
        <span style={{ color: textColors.muted }}>{benefit}</span>
      </div>
    ))}
  </div>
)}
```

#### Step 8: Wrap in SectionWrapperPublished

Always wrap the root element in `SectionWrapperPublished` for proper padding and backgrounds:

```tsx
return (
  <SectionWrapperPublished
    sectionId={sectionId}
    background={sectionBackgroundCSS}
    padding="normal" // or "compact", "spacious", "extra"
  >
    {/* Your section content */}
  </SectionWrapperPublished>
);
```

#### Step 9: Register in Component Registry

Add to `src/modules/generatedLanding/componentRegistry.published.ts`:

```typescript
// Import at top
import LeftCopyRightImagePublished from '@/modules/UIBlocks/Hero/LeftCopyRightImage.published';

// Add to registry
const publishedComponentRegistry: Record<string, Record<string, React.ComponentType<any>>> = {
  hero: {
    minimalist: MinimalistPublished,
    leftcopyrightimage: LeftCopyRightImagePublished, // ADD THIS
  },
  // ...
};
```

**Important**: Use lowercase for both section type and layout name in registry keys.

#### Step 10: Test Published Page

1. Create a test page using this UIBlock
2. Publish the page
3. Visit `/p/[slug]` and verify:
   - All text renders correctly
   - Images load properly
   - Icons and SVGs are visible
   - Theme colors applied correctly
   - Section padding matches preview
   - No console errors
   - No missing elements

### Common Patterns

#### Checkmark Lists
```tsx
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';

<div className="flex items-center space-x-3">
  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500/15 ring-1 ring-green-500/25">
    <CheckmarkIconPublished color="#10b981" size={14} />
  </div>
  <span style={{ color: textColors.muted }}>{item}</span>
</div>
```

#### CTA Buttons
```tsx
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';

<CTAButtonPublished
  text={cta_text}
  backgroundColor={theme.colors.accentColor}
  textColor="#FFFFFF"
  className="px-8 py-4 text-lg"
/>
```

#### Logo Display
```tsx
import { LogoPublished } from '@/components/published/LogoPublished';

<LogoPublished
  logoUrl={props.logo_1}
  companyName={props.company_name || 'Company'}
  size="md"
/>
```

#### Background Images with Overlays
```tsx
<div
  className="absolute inset-0 z-0"
  style={{
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}
>
  {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/60" />
</div>
```

### Troubleshooting

**Problem**: Elements missing in published page
**Solution**: Check if you're using client components instead of published primitives

**Problem**: Text colors wrong
**Solution**: Use `getPublishedTextColors()` instead of hardcoding

**Problem**: Section padding missing
**Solution**: Wrap in `SectionWrapperPublished` at root level

**Problem**: Theme colors not applied
**Solution**: Use inline styles for theme values, not Tailwind dynamic classes

**Problem**: SSR error about hooks
**Solution**: Remove all useState, useEffect, useRef, and custom hooks from `.published.tsx`

**Problem**: Component not rendering in published page
**Solution**: Verify it's registered in `componentRegistry.published.ts` with correct keys (lowercase)

New: below completed

 create mode 100644 src/modules/UIBlocks/FAQ/AccordionFAQ.published.tsx
 create mode 100644 src/modules/UIBlocks/Features/IconGrid.published.tsx
 create mode 100644 src/modules/UIBlocks/Footer/ContactFooter.published.tsx
 create mode 100644 src/modules/UIBlocks/Footer/LinksAndSocialFooter.published.tsx
 create mode 100644 src/modules/UIBlocks/Footer/MultiColumnFooter.published.tsx
 create mode 100644 src/modules/UIBlocks/FounderNote/FounderCardWithQuote.published.tsx
 create mode 100644 src/modules/UIBlocks/Header/CenteredLogoHeader.published.tsx
 create mode 100644 src/modules/UIBlocks/Header/FullNavHeader.published.tsx
 create mode 100644 src/modules/UIBlocks/Header/MinimalNavHeader.published.tsx
 create mode 100644 src/modules/UIBlocks/Header/NavWithCTAHeader.published.tsx
 create mode 100644 src/modules/UIBlocks/Hero/centerStacked.published.tsx
 create mode 100644 src/modules/UIBlocks/Hero/imageFirst.published.tsx
 create mode 100644 src/modules/UIBlocks/Hero/leftCopyRightImage.published.tsx
 create mode 100644 src/modules/UIBlocks/Hero/splitScreen.published.tsx
 create mode 100644 src/modules/UIBlocks/HowItWorks/AccordionSteps.published.tsx
 create mode 100644 src/modules/UIBlocks/PrimaryCTA/VisualCTAWithMockup.published.tsx
 create mode 100644 src/modules/UIBlocks/Problem/StackedPainBullets.published.tsx
 create mode 100644 src/modules/UIBlocks/Results/OutcomeIcons.published.tsx

---

## Phase 2: Form Injection & Hydration

### Problem Context

After Phase 1, published pages are static HTML with no client-side JavaScript. Forms are currently broken:

❌ **Forms don't work** - No submit handlers, no validation
❌ **No form state** - Can't capture user input
❌ **No API calls** - Can't send form submissions to `/api/forms/submit`
❌ **No loading states** - No feedback during submission
❌ **No success/error handling** - User sees nothing after submitting

### Current State

CTAWithFormField.published.tsx renders **static form** (disabled inputs, visual only):
```tsx
<input type="email" placeholder={placeholder_text} disabled
  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-400 cursor-not-allowed" />
<button disabled style={{ background: ctaBg, color: ctaText, opacity: 0.7 }}
  className="w-full px-6 py-3 rounded-lg font-semibold cursor-not-allowed">
  {cta_text}
</button>
```

### Solution Architecture

**Approach**: Selective hydration - inject minimal client JS only for form islands

**Key Principle**: Keep page mostly static, hydrate only interactive elements (forms)

### Implementation Plan

#### 2.1 Create FormIsland Component

**File**: `src/components/published/FormIsland.tsx` (NOT YET CREATED)

**Required features**:
```tsx
'use client';

import { useState } from 'react';

interface FormIslandProps {
  formId: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
  }>;
  submitButtonText: string;
  submitButtonColor?: string;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export function FormIsland({ formId, fields, submitButtonText, submitButtonColor, publishedPageId, pageOwnerId }: FormIslandProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data: formData,
          publishedPageId,
          userId: pageOwnerId,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({});
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        style={{ background: submitButtonColor }}
        className="w-full px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Submitting...' : submitButtonText}
      </button>

      {status === 'success' && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          Thank you! Your submission has been received.
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          Something went wrong. Please try again.
        </div>
      )}
    </form>
  );
}
```

#### 2.2 Update CTAWithFormField.published.tsx

Replace static form with FormIsland:

```tsx
import { FormIsland } from '@/components/published/FormIsland';

// In the component
<div className="bg-gray-100 rounded-2xl p-8">
  <FormIsland
    formId={`form-${sectionId}`}
    fields={[
      {
        name: 'email',
        label: form_label,
        type: 'email',
        required: true,
        placeholder: placeholder_text
      }
    ]}
    submitButtonText={cta_text}
    submitButtonColor={theme.colors.accentColor}
    publishedPageId={publishedPageId}
    pageOwnerId={pageOwnerId}
  />
</div>
```

#### 2.3 Update LandingPagePublishedRenderer

Pass `publishedPageId` and `pageOwnerId` to all sections:

```tsx
<LayoutComponent
  key={sectionId}
  sectionId={sectionId}
  mode="published"
  backgroundType={backgroundType}
  sectionBackgroundCSS={sectionBackgroundCSS}
  theme={theme}
  publishedPageId={publishedPageId}
  pageOwnerId={pageOwnerId}
  {...flattenedData}
/>
```

#### 2.4 Configure Next.js for Partial Hydration (Optional)

**Modify**: `next.config.js`

```javascript
module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        formIsland: {
          test: /FormIsland/,
          name: 'form-island',
          priority: 10
        }
      }
    };
    return config;
  }
};
```

### Bundle Size Impact

- **Before Phase 2**: 87.7KB (static HTML, forms broken)
- **After Phase 2**: ~95KB (includes FormIsland ~7KB)
- **Target**: <100KB ✅

### Success Criteria

After Phase 2 completion:
- ✅ Forms work on published pages
- ✅ Form submissions sent to `/api/forms/submit`
- ✅ Loading states visible during submission
- ✅ Success/error messages displayed
- ✅ Form data captured in database
- ✅ Email validation works
- ✅ Bundle size <100KB

---

## Design Decisions

### Why Separate `.published.tsx` Files?

**Problem**: Original UIBlocks use `'use client'` and React hooks
**Solution**: Separate server-safe files with zero hook imports

**Trade-offs**:
| Approach | Pros | Cons |
|----------|------|------|
| Separate files | Clean separation, smaller SSR bundle, no editor code in published | 2x file count, potential drift |
| Mode prop | Single source, easier maintenance | Editor code in SSR bundle, complex conditionals |

**Decision**: Separate files (cleaner, prevents SSR errors from hooks)

### Styling Strategy

**Dynamic Values** (theme-derived) → **Inline styles**:
```tsx
style={{
  background: theme.colors.accentColor,
  color: theme.colors.textPrimary
}}
```

**Static Layout** (structural) → **Tailwind classes**:
```tsx
className="px-6 py-3 rounded-lg font-semibold"
```

**Why?**: Dynamic Tailwind classes (`bg-${color}-600`) get purged from static CSS. Inline styles guarantee availability.

### Server Rendering Method

**Current**: `renderToString` from `react-dom/server`
- Simpler migration path
- Works with existing Next.js 14 setup
- Battle-tested and reliable

**Future**: Native React Server Components
- Better streaming support
- Automatic code splitting
- Server-first by default

---

## Performance Targets

| Metric | Phase 1 | Phase 2 | Target |
|--------|---------|---------|--------|
| LCP | 5s → 1.2s | Maintain | <1.5s |
| Bundle Size | 500KB → 87.7KB | ~95KB | <100KB |
| TTFB | 800ms → 200ms | Maintain | <300ms |
| Forms Work | ❌ | ✅ | 100% |
| Checkmarks Visible | ✅ | ✅ | 100% |
| Logos Visible | ✅ | ✅ | 100% |
| Section Padding | ✅ | ✅ | 100% |

---

## Implementation Checklist

### Phase 1 ✅ COMPLETE
- [x] Create isolated `/p/` layout
- [x] Server-first page component with ISR
- [x] Theme utilities (darken, lighten, isLight)
- [x] Theme CSS injection
- [x] Fix theme override issue
- [x] Fix section backgrounds
- [x] Storage SSR safety
- [x] Update validation schema

### Phase 1.1 ✅ COMPLETE
- [x] Create 8 published primitive components
- [x] Create LandingPagePublishedRenderer
- [x] Create componentRegistry.published.ts
- [x] Create publishedTextColors utilities
- [x] Update publish route to use server rendering
- [x] Convert starter UIBlocks (Minimalist, Announcement, CTAWithFormField, SimpleFooter)
- [x] Document conversion playbook

### Phase 2 📋 complete
- [ ] Create FormIsland component
- [ ] Update CTAWithFormField.published.tsx to use FormIsland
- [ ] Pass publishedPageId and pageOwnerId to sections
- [ ] Test form submissions end-to-end
- [ ] Configure webpack for code splitting (optional)
- [ ] Verify bundle size <100KB

---

## Rollback Plan

If issues arise:

1. **Feature flag**: `ENABLE_SSR_PUBLISHING=false` (if implemented)
2. **Revert publish route**: Fall back to client-captured htmlContent approach
3. **Published pages continue working**: Static HTML already in database
4. **No data loss**: Content/theme still stored in JSON

---

## Unpublish / Take-down (teardown) — the inverse pipeline

Added by `dashboard-lifecycle-actions` (dashboard slice S2). Before it, **a mispublish was
permanent**: nothing anywhere took a page down. Entry points: `POST /api/projects/{tokenId}/unpublish`
and `DELETE /api/projects/{tokenId}` (delete = teardown + row deletion). Core library:
`src/lib/staticExport/teardown.ts` → `teardownPublishedPage(pageId, { mode: 'unpublish' | 'delete' })`.

### The serving predicate (read this first)

`src/lib/publishState.ts` → `isServingPublishState(state)` is **the** answer to "is this page live?".
It is `false` for exactly `'draft'` and `'unpublishing'`, and `true` for everything else
(`'published'`, `'publishing'`, `'failed'`, unknown/null → fail-open).

Why `'publishing'`/`'failed'` still serve: a re-publish goes `published → publishing → published`,
and a *failed* re-publish leaves the previous version live. 404ing in those windows would be a
live-page regression.

**Deleting KV routes alone does NOT stop serving.** A KV miss is not a 404 — `src/middleware.ts`
falls through to a rewrite of `/p/{subdomain}{path}`, and the `/p/[slug]` SSR routes used to serve
any row that existed. So every SSR fallback is now gated on the predicate:
`p/[slug]/page.tsx` (both `generateMetadata` and the page), `p/[slug]/[...subpath]/page.tsx` (both),
`p/[slug]/privacy/page.tsx`, and `src/lib/blog/ssr.tsx` `loadBlogSsr()` (the single choke point for
both blog SSR routes).

**`loadBlogSsr()`'s one sanctioned opt-out:** `loadBlogSsr(slug, { requireServing: false })` is
passed ONLY by the owner-only draft preview
(`src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx`). That route is
Clerk-authed + ownership-checked and renders no public URL; since teardown demotes every post to
`draft`, gating it would lock an owner out of their own drafts. Never pass `false` from a public
route. Pinned by `src/lib/blog/__tests__/ssr.test.ts`.

**Slot predicate (different question):** `publishState !== 'draft'` = "this row still occupies a
published slot". Used by the plan limit and the dashboard status pill. A page stuck at
`'unpublishing'` still shows "Published" (with Unpublish as the retry) even though SSR already 404s.

### `PublishedPage.isPublished` is deprecated in place — do not use it

The column (`schema.prisma:161`, `@default(true)`) has **no writer and, as of this slice, no reader**.
It was `true` on every row including drafts, so it never meant anything. Writing `false` on unpublish
would be a one-way door (re-publish's existing-row branch never sets it back), so teardown does not
touch it; the readers were re-pointed to `publishState` instead
(`src/lib/seo/resolvePublishedHost.ts`, `src/app/api/publish/route.ts` limit count,
`src/lib/blog/publishBlogPost.ts` `loadContext`). The column survives (no migration).
**Any new code asking "is this published?" must use `publishState` / `isServingPublishState`.**
(`isPublished` in `src/types/core/content.ts` + `src/schemas/validation.ts` is a *different* entity —
`PageMetadata` — and is unrelated.)

### Teardown order (atomicity is BUILT, not inherited)

True atomicity across KV + Blob + Postgres is impossible. Instead: a **forward-only ordered sequence
with a DB-finalize-last invariant** — the DB is marked `draft`/deleted only after ALL external
cleanup succeeded. Every step is idempotent, so a failed teardown is resumed by re-running it
(the UI keeps Unpublish available for exactly this).

1. **Custom-domain guard** — `publishedPage.customDomain !== null`, *regardless of*
   `customDomainStatus` (a pending/failed domain still holds the `@unique` slot + a live Vercel
   registration). → `{ blocked: 'custom_domain' }`, **zero writes**, route → 409
   `custom_domain_attached` ("Remove the custom domain first"). Automated domain/SSL detach is
   deliberately out of scope (post-beta). DELETE also guards independently, before its teardown
   branch, because a *draft* row can still hold a `customDomain` (domains can be attached after an
   unpublish) and would otherwise skip the guard with the teardown.
2. **`publishState: 'unpublishing'`** — transient marker (plain String column, no migration). A crash
   mid-teardown leaves a *detectable* state instead of a lying `'published'`; and because the
   predicate treats `'unpublishing'` as non-serving, the page already 404s at the origin from here on.
3. **KV route deletion** — the switch that stops blob-proxy serving (blobs deleted later are already
   unreachable; blob-first would leave live routes pointing at deleted blobs). Beware
   `removeRoutes(hosts)`: it only deletes the ROOT trio (`route:{host}:/`, `redirect:{host}:/`,
   `slug-for:{host}`). Teardown enumerates the full key set itself: hosts =
   `publishSubdomainHosts(slug)`; paths = the union of `metadata.blobs[].path` across **ALL**
   versions (older versions may have written subpage/locale routes the current one doesn't; a legacy
   `version.blobKey`-only row contributes `/`) + `/blog` + `/blog/{post.slug}` per published post.
   Non-root keys → `deleteRoutes`, then `removeRoutes` for the root trio.
   - **3b. ISR invalidation** — `revalidatePath()` for `/p/{slug}`, each non-root path, `/privacy`
     and the blog paths. Without it the cached SSR render (`revalidate = 3600`) survives teardown for
     up to an hour. (Requires a request context — teardown must be called from a route handler.)
   - **3c. CDN purge** — *does not exist*. See the next section.
4. **Blob deletion (strict)** — teardown does its own `publishedPageVersion.findMany` (it does NOT
   touch `versionCleanup.ts`, and nothing here is modeled on publish's root-blob-only rollback):
   all versions' `metadata.blobs[].blobKey` (legacy `version.blobKey` fallback) + every published
   post's `blobKey` + `blogIndex.blobKey`. Then `currentVersionId: null` **before** deleting version
   rows (the `"CurrentVersion"` relation has no explicit `onDelete` — don't lean on implicit SetNull).
5. **DB finalize** — `mode: 'unpublish'` only: blog demote → `Project.status: 'draft'` →
   `PublishedPage` LAST (`publishState: 'draft'`, `publishError: null`, `blogIndex: DbNull`).
   `mode: 'delete'` stops after step 4 and the caller runs the delete transaction.

Failure at any step after the marker → `retryable_failure` (route → 500 `teardown_incomplete`), the
row **stays `'unpublishing'`** (non-serving, honest), and `Sentry.captureMessage('teardown_incomplete',
{ extra: { pageId, slug, step, mode } })` fires so a stuck page is visible to us, not just the customer.
There is no rollback-to-published once step 3 begins, and no `'unpublish_failed'` state.

**Delete cascade:** guard → teardown (`mode: 'delete'`) → `$transaction`: `PublishedPage` → `Project`
→ `Token` LAST (`Project.tokenId` FKs `Token.value`). `EditDelta`/`BlogPost`/`ProjectPage`/
`SocialPost`/`EmailSequence`/`Outreach*`/`CollectLink` are `onDelete: Cascade`. `Testimonial` is
`SetNull` — rows survive with `projectId: null`. `FormSubmission`/`PageAnalytics` are slug-keyed
historical records and are retained. `PublishedPage.projectId` has no `@relation`, so nothing
FK-blocks the project delete — which is why the "teardown ok, transaction fails" window is benign and
retry-safe.

### ⚠️ DD1c — the CDN cache window on unpublish (no purge mechanism exists)

**Take-down is immediate at the ORIGIN, but the EDGE can replay a cached copy for ~1 hour.** This is a
real, shipped product behaviour, and the UI copy says so in plain words.

Why: the customer-facing URL (`{slug}.lessgo.site/`) is served by a middleware rewrite to
`/api/blob-proxy`, which returns `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
**The CDN cache key is the PUBLIC URL, not the rewritten path — so `revalidatePath('/p/{slug}')`
does not evict it.** Re-publish escapes this for free by minting a NEW cache key (middleware appends
`&v={version}` precisely so republishes propagate immediately); unpublish has no new version to mint.

Investigated at implement time; **nothing usable was found** (do not re-litigate without new facts):
- **Vercel purge REST API** — the only credentials we hold (`VERCEL_TOKEN`/`VERCEL_PROJECT_ID`/
  `VERCEL_TEAM_ID`, `src/lib/vercel/domains.ts`) are used against the Domains endpoints. Vercel exposes
  no public per-URL/per-path Edge purge endpoint; invalidation is dashboard/CLI "Purge Everything"
  (project-wide — never something an unpublish should fire) or Next-level `revalidatePath`/`revalidateTag`.
- **`cacheTag` + `revalidateTag`** — two independent blockers: `cacheTag` is a **Next 15 `'use cache'`
  API** and this repo is **Next 14** (`next@^14.2.28`); and `blob-proxy/route.ts` is `runtime = 'edge'`
  and fully dynamic, so its response is not in Next's Full Route Cache — the `Cache-Control` header is
  honoured directly by Vercel's Edge Network, which carries no tag for `revalidateTag` to act on. It
  would be a silent no-op.
- **Rejected: lowering `s-maxage`** — that taxes every published-page view, forever, to speed up a rare
  unpublish, and it is a change to the fenced publish happy path. Not done.

**~1h, not 24h** (the SWR nuance): after `s-maxage` expires, `stale-while-revalidate` serves stale
while revalidating in the background — that revalidation hits the middleware, finds no KV route,
reaches the origin 404, and **the cache corrects itself**.

**Honest AC status:** the spec's "unpublish → stops serving" is satisfied at the origin immediately and
at the edge within ~1h. **How to verify a take-down correctly:** hit the subdomain with a cache-busting
query param (`?nocache=1`) or hard-refresh — that proves the origin is down. The plain URL may serve
stale. If a deployed check ever shows the plain URL 404ing immediately too (i.e. the edge key includes
the rewrite target), the window doesn't exist and the UI copy should be TIGHTENED — a cheap follow-up.

### Other behaviours worth knowing

- **DD12 — slug retention is deliberate squatting.** Unpublish KEEPS the `PublishedPage` row, so the
  `@unique` slug stays reserved and re-publish preserves the URL (the intended UX). Consequence:
  `/api/publish` returns 409 "Slug already taken" to **any other user, forever**; the only release path
  is Delete. Accepted for beta; a reclaim policy is post-beta if ever.
- **DD0b — what the plan limit counts.** `/api/publish`'s published-page limit now counts
  `publishState: { not: 'draft' }` (was `isPublished`, which was `true` on every row incl. drafts —
  i.e. the *published*-page limit was counting drafts). Net effect: **an unpublished page no longer
  consumes a plan slot, while still squatting its slug.** Pre-existing gap, left as-is: the limit check
  runs only on publish's CREATE branch, so re-publishing a previously-unpublished page never re-checks
  the limit.
- **Blog demote on unpublish (DD2b).** Teardown deletes blog blobs/keys directly — it does NOT loop
  `unpublishBlogPost` (that re-renders and *uploads* a fresh index blob per non-last post, and its
  deletes are best-effort/invisible to the strict-failure contract). Blog blobs are never registered in
  `PublishedPageVersion`, so version cleanup cannot see them. At finalize, published posts are demoted
  to `status: 'draft'` (`publishedVersion`/`blobKey`/`blobUrl` nulled, `firstPublishedAt` kept so the
  slug stays locked) and `PublishedPage.blogIndex` is cleared. **Re-publishing the site does NOT
  auto-restore the blog** (`syncBlogAfterSitePublish` only re-renders `status: 'published'` posts) —
  posts must be re-published individually. Honest full take-down; intended.
- **Accepted gap: `/api/og/[slug]`** selects by slug with no publish-state check, so an unpublished page
  still yields an OG image with its title/description. Metadata only — no page content, no orphaned
  storage. Deliberately deferred (follow-up below).
- **Sitemap nuance:** `resolvePublishedHost` follows the *serving* predicate, so a `'publishing'`/
  `'failed'` page can appear in a sitemap. Consistent (the page IS reachable); accepted, not a defect.
- **Authz:** every lifecycle mutation uses `assertProjectOwner(clerkId, tokenId, { action, claimIfOrphan: true })`
  — never the `published-slug` route's hand-rolled admin-all widening. Its **audited** admin override
  (`logAdminOverride`) is kept by founder ruling; each route carries the commented one-liner
  (`if (access.adminOverride) return 403`) that would make it strict owner-only. **The demo token
  (`lessgodemomockdata`) short-circuits `assertProjectOwner` to `ok: true` for ANY caller before any
  ownership check** — every destructive/creating route therefore needs its own explicit
  `if (access.isDemo) → 404` guard. Do not forget this on new token routes.

### Pre-existing gaps in the PUBLISH path (found while building teardown; NOT caused by it)

1. **KV keys from dropped versions are unenumerable.** `cleanupOldVersions` retains 10 versions and
   **prunes the rows** — but publish never deletes routes for subpages that no longer exist. Once a
   version's row is gone, its `metadata.blobs[].path` set is gone with it, so nothing (including
   teardown) can enumerate those keys. A subpage removed >10 publishes ago can keep a live KV route.
2. **A slug changed while published strands its old blog key.** A published post whose slug changed
   leaves the old `/blog/{oldSlug}` KV key behind.

### Test coverage

- `src/lib/staticExport/teardown.test.ts` (21) — enumeration across multiple/legacy versions, blog keys,
  ordering (marker → KV → blob → `draft` last), the **no-uploads-during-teardown** regression guard,
  failure/retry paths, the guard's zero writes.
- `src/lib/publishState.test.ts` (8) · `src/lib/blog/__tests__/ssr.test.ts` (8).
- `e2e/dashboard-lifecycle.spec.ts` (14) — API contract + dashboard UI. **Honest scope:** it does NOT
  assert `{slug}.lessgo.site` going down (host-based middleware+KV routing isn't reproducible on
  localhost, and the CDN layer doesn't exist locally at all) nor real KV/blob deletion. Local publishes
  land in `publishState: 'failed'` (Blob/KV absent) — a serving state, so the assertions hold.
  Note: `/api/publish` is rate-limited **5/60s per user**; `publishSeed()` in `e2e/helpers/seedDraft.ts`
  self-paces against it, so a 6th publish waits rather than 429ing in an unrelated test.

### Follow-ups (deliberately deferred)

- `ConfirmDialog.tsx` `app-*` retokenize (DD5) — shares blast radius with the edit page.
- `src/components/SlugModal.tsx:39,:119` + `src/components/domain/LiveStep.tsx:64` print the published
  URL as literals → re-point to `src/lib/publishedUrl.ts`.
- `/api/start` still inlines token minting → re-point to `src/lib/projectToken.ts` `mintProjectToken()`
  (two copies of that logic exist today and can drift).
- `/api/og/[slug]` publish-state gating (the accepted gap above).
- **Duplicate has no plan-limit check** — a user can clone past their site allowance. Consistent with
  the rest of the app (`/api/start` project creation is unmetered too), but duplicate is a NEW, cheaper
  project-creation path → revisit at pricing-v2.
- DD1c copy tightening **if** the deployed check shows no edge window.
- Automated custom-domain teardown (detach domain + SSL on unpublish); beta uses the guard instead.

---

## Future Enhancements

1. **Optimize Tailwind CSS**: Generate minimal CSS with only used classes
2. **Image Optimization**: Resize/compress images during publish
3. **Analytics**: Add PostHog script injection (deferred)
4. **SEO**: Auto-generate structured data (JSON-LD)
5. **Migrate to Native RSC**: Leverage React Server Components for better streaming

---

## References

- Example published page: https://ticketverz.lessgo.ai
- Example preview page: https://lessgo.ai/preview/e205C_rZ8jmP

---

## Questions & Answers

**Q: Why not use Puppeteer to capture rendered HTML?**
A: Overkill. Heavy infrastructure, slow publishing, resource-intensive. Server rendering achieves same result with less complexity.

**Q: Why keep preview page client-rendered?**
A: Editing requires client interactivity (drag-drop, inline editing, stores). Only publishing needs static HTML.

**Q: Can existing published pages be automatically re-rendered?**
A: No. Manual republish only. Automatic migration risks breaking pages. Users opt-in via "Republish" button.

**Q: How to handle async data in UIBlocks?**
A: Pre-fetch data in publish API, pass as props to renderer. No client-side data fetching in published mode.

**Q: What about forms in Phase 1?**
A: Forms are static (disabled) until Phase 2 FormIsland implementation.
