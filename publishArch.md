# Publishing Architecture - Complete Implementation Plan

## Overview

This document outlines the complete architecture for optimizing published landing pages in Lessgo.ai, addressing performance issues and rendering discrepancies between preview and published pages.

**Initial Problem**: LCP 5 seconds on published pages (ticketverz.lessgo.ai)
**Root Cause**: Published pages inherit full app shell + client-side rendering
**Solution**: Three-phase approach
- **Phase 1** (✅ Completed): Server-first delivery
- **Phase 2** (🚧 In Progress): Form injection & hydration for interactivity
- **Phase 3** (📋 Planned): SSR publishing with primitives (fixes innerHTML capture issues)

---

## Phase 1: Server-First Published Page Delivery ✅ COMPLETED

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
- **Modified**: `src/app/api/publish/route.ts`
- `injectThemeCSS()` prepends theme CSS to htmlContent at publish time

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

### Results Achieved
- Bundle size reduced: ~500KB → 87.7KB
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
7. `src/utils/storage.ts` - Fixed SSR error

---

Phase 1 is complete but it created issue which led to phase 1.1


## Phase 1.1: Server-Side Rendering for Publishing IN PROGRESS

### Remaining Problems

After Phase 1, published pages still have missing elements (non-form related):

❌ **Checkmark SVG icons missing** - Empty divs instead of `<svg>` elements
❌ **Logo images missing** - Empty image containers in Announcement section
❌ **CTA button missing** - Only text visible, no button wrapper/styling
❌ **Section padding missing** - No `py-16`, `py-20` classes
❌ **White backgrounds between sections** - Not present in preview

### Root Cause Analysis

**Fundamental Problem**: `innerHTML` capture at `src/app/preview/[token]/page.tsx:289`

```typescript
const htmlContent = previewElement.innerHTML; // ❌ Captures TOO EARLY
```

**What Goes Wrong**:

❌ **Checkmark SVG icons missing** - Empty divs instead of `<svg>` elements
❌ **Logo images missing** - Empty image containers in Announcement section
❌ **CTA button missing** - Only text visible, no button wrapper/styling
❌ **Section padding missing** - No `py-16`, `py-20` classes
❌ **White backgrounds between sections** - Not present in preview

### Root Cause Analysis

**Fundamental Problem**: `innerHTML` capture at `src/app/preview/[token]/page.tsx:289`

```typescript
const htmlContent = previewElement.innerHTML; // ❌ Captures TOO EARLY
```

**What Goes Wrong**:
1. Captures DOM **synchronously** when publish button clicked
2. No wait for React hydration/client components to render
3. **Strips section wrapper tags** (only captures children)
4. Misses dynamic Tailwind classes not in static CSS

**Specific Issues**:

| Missing Element | File/Location | Issue | Result |
|----------------|---------------|-------|--------|
| Checkmark SVGs | `CheckmarkComparison.tsx:195-202`, `CTAWithFormField.tsx:299-301` | Inline SVG rendered by React client component not hydrated | Empty `<div>` containers |
| Logo Images | `LogoEditableComponent.tsx:118-132` | Client component with `useState`, `useRef` - `<img>` not rendered yet | Empty image containers |
| CTA Button | `ComponentRegistry.tsx:176-216` | Dynamic Tailwind classes from `colorTokens.ctaBg` purged from static CSS | Button text visible but wrapper/styling missing |
| Section Padding | `LayoutSection.tsx:43-57` | Padding on `<section>` wrapper, but innerHTML only captures children | All section wrappers stripped |
| White Backgrounds | Section background styles on `<section>` tags | innerHTML strips tags, loses background styles | White gaps between sections |

### Solution Architecture

**Key Principle**: Create published-safe **primitives** (6-7 leaf components), NOT separate versions of every UIBlock

**Expert Guidance** (from SecondOpinion.md):
- ✅ Split components by responsibility: Editable vs Published
- ✅ Create ~7 published primitive components (leaf components)
- ✅ Make existing UIBlocks mode-aware (add `mode` prop)
- ❌ DO NOT create parallel universe of `*Published.tsx` files for all UIBlocks
- ✅ Inline styles for dynamic theme values
- ✅ Tailwind classes for static layout/structure

---

## Phase 1.1 Implementation Plan

### Week 1: Infrastructure & Published Primitives

#### 1.1.1 Create Published Primitive Components (6-7 files)

These are **leaf components** that replace client-only/editor-only behavior:

**File**: `src/components/published/LogoPublished.tsx`
```tsx
interface LogoPublishedProps {
  logoUrl?: string;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoPublished({ logoUrl, companyName, size = 'md', className }: LogoPublishedProps) {
  const sizeStyles = {
    sm: { width: '48px', height: '48px' },
    md: { width: '64px', height: '64px' },
    lg: { width: '80px', height: '80px' }
  };

  if (!logoUrl) {
    const initials = companyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        style={{
          ...sizeStyles[size],
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          color: 'white',
          fontWeight: 'bold'
        }}
        className={className}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      style={sizeStyles[size]}
      className={className}
    />
  );
}
```

**File**: `src/components/published/IconPublished.tsx`
```tsx
interface IconPublishedProps {
  icon: string; // Emoji or Unicode character
  color?: string;
  size?: number;
  className?: string;
}

export function IconPublished({ icon, color, size = 24, className }: IconPublishedProps) {
  return (
    <span
      style={{
        fontSize: `${size}px`,
        color: color,
        lineHeight: 1
      }}
      className={className}
    >
      {icon}
    </span>
  );
}
```

**File**: `src/components/published/CheckmarkIconPublished.tsx`
```tsx
interface CheckmarkIconPublishedProps {
  color?: string;
  size?: number;
}

export function CheckmarkIconPublished({ color = '#10b981', size = 20 }: CheckmarkIconPublishedProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
```

**File**: `src/components/published/CTAButtonPublished.tsx`
```tsx
interface CTAButtonPublishedProps {
  text: string;
  onClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function CTAButtonPublished({
  text,
  onClick,
  backgroundColor,
  textColor,
  className = ''
}: CTAButtonPublishedProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: backgroundColor,
        color: textColor,
      }}
      className={`px-6 py-3 rounded-lg font-semibold transition ${className}`}
    >
      {text}
    </button>
  );
}
```

**File**: `src/components/published/ImagePublished.tsx`
```tsx
interface ImagePublishedProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImagePublished({ src, alt, className }: ImagePublishedProps) {
  return <img src={src} alt={alt} className={className} />;
}
```

**File**: `src/components/published/SectionWrapperPublished.tsx` ⭐ CRITICAL
```tsx
interface SectionWrapperPublishedProps {
  children: React.ReactNode;
  sectionId?: string;
  background?: string;
  padding?: 'compact' | 'normal' | 'spacious' | 'extra';
  className?: string;
}

export function SectionWrapperPublished({
  children,
  sectionId,
  background,
  padding = 'normal',
  className = ''
}: SectionWrapperPublishedProps) {
  const paddingClasses = {
    compact: 'py-4 md:py-4 lg:py-4',
    normal: 'py-12 md:py-14 lg:py-16',
    spacious: 'py-8 md:py-12 lg:py-12',
    extra: 'py-20 md:py-24 lg:py-32'
  };

  return (
    <section
      data-section-id={sectionId}
      style={{ background }}
      className={`${paddingClasses[padding]} px-4 ${className}`}
    >
      {children}
    </section>
  );
}
```

**File**: `src/components/published/AvatarPublished.tsx` (Optional)
```tsx
interface AvatarPublishedProps {
  imageUrl?: string;
  name: string;
  size?: number;
}

export function AvatarPublished({ imageUrl, name, size = 48 }: AvatarPublishedProps) {
  if (!imageUrl) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
    />
  );
}
```

#### 1.1.2 Create Server-Side Renderer

**File**: `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
```tsx
import { getLayoutComponent } from './componentRegistry';

interface LandingPagePublishedRendererProps {
  sections: string[];
  content: Record<string, any>;
  theme: ThemeConfig;
  sectionLayouts: Record<string, string>;
}

export function LandingPagePublishedRenderer({
  sections,
  content,
  theme,
  sectionLayouts
}: LandingPagePublishedRendererProps) {
  return (
    <div className="landing-page-published">
      {sections.map(sectionId => {
        const layout = sectionLayouts[sectionId];
        const sectionType = extractSectionType(sectionId); // e.g., 'hero', 'features'
        const LayoutComponent = getLayoutComponent(sectionType, layout);

        if (!LayoutComponent) {
          console.warn(`No component found for ${sectionType}:${layout}`);
          return null;
        }

        return (
          <LayoutComponent
            key={sectionId}
            sectionId={sectionId}
            mode="published"
            theme={theme}
            {...content[sectionId]}
          />
        );
      })}
    </div>
  );
}

function extractSectionType(sectionId: string): string {
  // Extract section type from sectionId (e.g., 'hero-123' -> 'hero')
  return sectionId.split('-')[0];
}
```

#### 1.1.3 Create Publish Helper

**File**: `src/lib/publishedPageRenderer.ts`
```tsx
import { renderToString } from 'react-dom/server';
import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
import { generateThemeCSS } from './themeUtils';

interface PageData {
  sections: string[];
  content: Record<string, any>;
  theme: ThemeConfig;
  sectionLayouts: Record<string, string>;
}

export async function renderPublishedPage(pageData: PageData): Promise<string> {
  // 1. Render React tree to HTML string
  const html = renderToString(
    <LandingPagePublishedRenderer
      sections={pageData.sections}
      content={pageData.content}
      theme={pageData.theme}
      sectionLayouts={pageData.sectionLayouts}
    />
  );

  // 2. Generate theme CSS
  const themeCSS = generateThemeCSS({
    primary: pageData.theme.colors.accentColor,
    background: pageData.theme.colors.sectionBackgrounds.primary,
    muted: pageData.theme.colors.textSecondary
  });

  // 3. Combine
  return `${themeCSS}${html}`;
}
```

#### 1.1.4 Enhance Theme Utils

**Modify**: `src/lib/themeUtils.ts`

Add new function:
```typescript
export function generateInlineStyles(theme: ThemeConfig): Record<string, string> {
  return {
    '--landing-primary': theme.colors.accentColor,
    '--landing-primary-hover': darken(theme.colors.accentColor, 10),
    '--landing-accent': lighten(theme.colors.accentColor, 10),
    '--landing-muted-bg': theme.colors.sectionBackgrounds.primary,
    '--landing-border': isLight(theme.colors.sectionBackgrounds.primary)
      ? darken(theme.colors.sectionBackgrounds.primary, 10)
      : lighten(theme.colors.sectionBackgrounds.primary, 10),
    '--landing-text-primary': isLight(theme.colors.sectionBackgrounds.primary) ? '#111827' : '#F9FAFB',
    '--landing-text-secondary': isLight(theme.colors.sectionBackgrounds.primary) ? '#6B7280' : '#D1D5DB',
    '--landing-text-muted': theme.colors.textSecondary,
  };
}
```
Complete to till here 
Phase 1.2
### Week 2-4: Make UIBlocks Mode-Aware

**DO NOT** create separate `*Published.tsx` files for each UIBlock layout.

**DO** modify existing UIBlock files to:
1. Accept `mode` prop (`'editable' | 'published'`)
2. Conditionally use published primitives when `mode="published"`
3. Apply inline styles for dynamic theme values when published
4. Keep Tailwind classes for static layout

#### Example Pattern

**Modify**: `src/modules/UIBlocks/Features/SplitAlternating.tsx`

```tsx
import { LogoEditableComponent } from '@/components/ui/LogoEditableComponent';
import { LogoPublished } from '@/components/published/LogoPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { ImagePublished } from '@/components/published/ImagePublished';

export default function SplitAlternating(props: LayoutComponentProps) {
  const { mode = 'editable', elements, theme, sectionId, backgroundType } = props;

  // Choose components based on mode
  const LogoComponent = mode === 'published' ? LogoPublished : LogoEditableComponent;
  const ImageComponent = mode === 'published' ? ImagePublished : ExistingImageComponent;

  // Inline styles for published mode (dynamic theme values)
  const headlineStyle = mode === 'published'
    ? {
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.headingFont
      }
    : undefined; // Editable mode uses Tailwind

  const descriptionStyle = mode === 'published'
    ? { color: theme.colors.textSecondary }
    : undefined;

  const features = parseFeatures(elements);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={getSectionBackground(backgroundType, theme)}
      padding="spacious"
    >
      <div className="max-w-6xl mx-auto">
        <h2
          style={headlineStyle}
          className="text-4xl font-bold text-center mb-16"
        >
          {elements.headline}
        </h2>

        {features.map((feature, i) => (
          <div
            key={i}
            className={`grid lg:grid-cols-2 gap-12 items-center mb-16 ${
              i % 2 === 0 ? '' : 'lg:flex-row-reverse'
            }`}
          >
            <div>
              <div className="flex items-start space-x-4">
                {mode === 'published' ? (
                  <span style={{ fontSize: '32px' }}>{feature.icon}</span>
                ) : (
                  <IconEditableComponent icon={feature.icon} />
                )}

                <div>
                  <h3 style={headlineStyle} className="text-2xl font-bold mb-4">
                    {feature.title}
                  </h3>
                  <p style={descriptionStyle} className="text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Benefits with checkmarks */}
              <div className="space-y-3 mt-6 pl-16">
                {feature.benefits?.map((benefit, j) => (
                  <div key={j} className="flex items-center space-x-3">
                    {mode === 'published' ? (
                      <CheckmarkIconPublished color={theme.colors.accentColor} />
                    ) : (
                      <ExistingCheckmarkComponent />
                    )}
                    <span style={descriptionStyle}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <ImageComponent
                src={feature.visual}
                alt={feature.title}
                className="w-full h-80 object-cover rounded-xl shadow-2xl"
              />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapperPublished>
  );
}
```

#### Priority Order for UIBlock Modifications

I will let you know which UIBlock to starwith

First one are

1. Minimalist, announcement and ctawithform

phase 1.3

### Week 5-6: Update Publish API

**Modify**: `src/app/api/publish/route.ts`

**Change from**:
```typescript
const { htmlContent } = validationResult.data; // Client-captured HTML
```

**Change to**:
```typescript
import { renderPublishedPage } from '@/lib/publishedPageRenderer';

// Extract section layouts helper
function getSectionLayouts(content: Record<string, any>): Record<string, string> {
  const layouts: Record<string, string> = {};

  for (const [sectionId, sectionData] of Object.entries(content)) {
    if (sectionData?.layout) {
      layouts[sectionId] = sectionData.layout;
    }
  }

  return layouts;
}

async function publishHandler(req: NextRequest) {
  // ... existing validation ...

  const { slug, content, themeValues, tokenId, title } = validationResult.data;

  // NEW: Server-side render instead of using client-captured htmlContent
  const htmlContent = await renderPublishedPage({
    sections: content.layout.sections,
    content: content.content,
    theme: content.layout.theme,
    sectionLayouts: getSectionLayouts(content.content)
  });

  // Store in DB (rest unchanged)
  await prisma.publishedPage.upsert({
    where: { slug },
    create: { userId, slug, htmlContent, title, content, themeValues },
    update: { htmlContent, title, content, themeValues, updatedAt: new Date() }
  });

  // ... rest unchanged ...
}
```

**Also remove**: `htmlContent` from `PublishSchema` in `src/lib/validation.ts` (no longer sent from client)

### Week 6-7: Testing & Rollout

#### 6.1 Create Tests

**File**: `tests/visual/published-pages.spec.ts`
```typescript
import { renderPublishedPage } from '@/lib/publishedPageRenderer';

describe('Published Pages', () => {
  test('checkmark SVG icons are present', async () => {
    const html = await renderPublishedPage({
      sections: ['cta-123'],
      content: {
        'cta-123': {
          benefits: ['Benefit 1', 'Benefit 2']
        }
      },
      theme: testTheme,
      sectionLayouts: { 'cta-123': 'CTAWithFormField' }
    });

    // Verify SVG path exists
    expect(html).toContain('<path d="M5 13l4 4L19 7"');
    expect(html).toContain('<svg');
  });

  test('logo images are rendered', async () => {
    const html = await renderPublishedPage({
      sections: ['misc-123'],
      content: {
        'misc-123': {
          logo_1: 'https://example.com/logo.png',
          companyName: 'Test Co'
        }
      },
      theme: testTheme,
      sectionLayouts: { 'misc-123': 'Announcement' }
    });

    expect(html).toContain('<img');
    expect(html).toContain('https://example.com/logo.png');
  });

  test('CTA button wrapper exists with inline styles', async () => {
    const html = await renderPublishedPage({
      sections: ['cta-123'],
      content: {
        'cta-123': {
          ctaText: 'Get Started'
        }
      },
      theme: testTheme,
      sectionLayouts: { 'cta-123': 'CTAWithFormField' }
    });

    expect(html).toContain('<button');
    expect(html).toContain('Get Started');
    expect(html).toMatch(/style="[^"]*background:/);
  });

  test('section padding classes preserved', async () => {
    const html = await renderPublishedPage({
      sections: ['hero-123'],
      content: { 'hero-123': { headline: 'Test' } },
      theme: testTheme,
      sectionLayouts: { 'hero-123': 'leftCopyRightImage' }
    });

    expect(html).toContain('py-');
    expect(html).toContain('<section');
  });
});
```

## Success Criteria

After Phase 1.1 completion, published pages will have:

✅ Checkmark SVG icons visible (inline SVG in HTML)
✅ Logo images rendered (`<img>` tags present)
✅ CTA buttons with proper styling (wrapper + inline styles)
✅ Section padding preserved (`py-20` classes on `<section>` tags)
✅ No white gaps between sections (backgrounds applied to section wrappers)
✅ Perfect preview/published parity (server-rendered HTML matches preview)
✅ LCP < 1.5s (maintained from Phase 1)
✅ Bundle size < 100KB (maintained from Phase 1)

---

## File Summary

### Phase 1 (✅ Completed)
- Created: `src/app/p/layout.tsx`
- Created: `src/lib/themeUtils.ts`
- Modified: `src/app/p/[slug]/page.tsx`
- Modified: `src/app/api/publish/route.ts`
- Modified: `src/components/theme/InjectLandingTheme.tsx`
- Modified: `src/modules/generatedLanding/LandingPageRenderer.tsx`
- Modified: `src/utils/storage.ts`

### Phase 2 

**New Files** (1 file):
1. `src/components/published/FormIsland.tsx`

**Modified Files** (2 files):
1. `src/modules/UIBlocks/CTA/CTAWithFormField.tsx` - Add FormIsland for published mode
2. `next.config.js` - Configure partial hydration (optional)

### Phase 3 (📋 Planned)

**New Files** (9 total):

**Published Primitives** (6-7 files):
1. `src/components/published/LogoPublished.tsx`
2. `src/components/published/IconPublished.tsx`
3. `src/components/published/CTAButtonPublished.tsx`
4. `src/components/published/CheckmarkIconPublished.tsx`
5. `src/components/published/ImagePublished.tsx`
6. `src/components/published/SectionWrapperPublished.tsx` ⭐ Critical
7. `src/components/published/AvatarPublished.tsx` (optional)

**Infrastructure** (2 files):
8. `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
9. `src/lib/publishedPageRenderer.ts`

**Modified Files** (~20 UIBlock files + 3 infrastructure):
1. `src/lib/themeUtils.ts` - Add `generateInlineStyles()`
2. `src/app/api/publish/route.ts` - Use server renderer
3. `src/lib/validation.ts` - Remove `htmlContent` from schema

**UIBlocks to modify** (add `mode` prop, use published primitives):
- `src/modules/UIBlocks/Hero/*.tsx` (5 layouts)
- `src/modules/UIBlocks/Features/*.tsx` (3 layouts)
- `src/modules/UIBlocks/CTA/*.tsx` (8 layouts)
- Continue with remaining sections (~20 more files)

**Unchanged** (preserving for editing):
- `src/app/preview/[token]/page.tsx` - Preview stays client-rendered
- `src/modules/generatedLanding/LandingPageRenderer.tsx` - Edit mode unchanged
- `src/app/p/[slug]/page.tsx` - Still uses `dangerouslySetInnerHTML` (just source changes)

---

## Key Design Decisions

### Why Primitives Over Duplicated UIBlocks?

**❌ Bad Approach** (maintenance nightmare):
```
src/modules/UIBlocks/
  Hero/
    leftCopyRightImage.tsx         (editable)
    leftCopyRightImagePublished.tsx (published)
    centerStacked.tsx
    centerStackedPublished.tsx
    ... 100+ duplicate files
```

**✅ Good Approach** (maintainable):
```
src/components/published/
  LogoPublished.tsx           (7 files total)
  IconPublished.tsx
  CTAButtonPublished.tsx
  CheckmarkIconPublished.tsx
  ImagePublished.tsx
  SectionWrapperPublished.tsx
  AvatarPublished.tsx

src/modules/UIBlocks/
  Hero/
    leftCopyRightImage.tsx (accepts mode prop, uses primitives)
    centerStacked.tsx      (accepts mode prop, uses primitives)
    ... single set of files
```

### Styling Strategy

**Dynamic Values** (theme-derived) → Inline styles:
```tsx
style={{
  background: theme.colors.accentColor,
  color: theme.colors.textPrimary
}}
```

**Static Layout** (structural) → Tailwind classes:
```tsx
className="px-6 py-3 rounded-lg font-semibold"
```

**Why?**: Dynamic Tailwind classes (`bg-${color}-600`) get purged from static CSS. Inline styles guarantee availability in published HTML.

### renderToString vs React Server Components

**Phase 2 uses**: `renderToString` from `react-dom/server`
- Simpler migration path
- Works with existing Next.js 14 setup
- Can upgrade to native RSC later

**Future consideration**: Native RSC
- Better streaming support
- Automatic code splitting
- Server-first by default

---

## Performance Targets

| Metric | Phase 1 | Phase 2 | Phase 3 | Target |
|--------|---------|---------|---------|--------|
| LCP | 5s → 1.2s | Maintain | Maintain | <1.5s |
| Bundle Size | 500KB → 87.7KB | +7KB (forms) | Maintain | <100KB |
| TTFB | 800ms → 200ms | Maintain | Maintain | <300ms |
| Forms Work | ❌ | ✅ | ✅ | 100% |
| Form Submissions | ❌ | ✅ | ✅ | 100% |
| Checkmarks Visible | ❌ | ❌ | ✅ | 100% |
| Logos Visible | ❌ | ❌ | ✅ | 100% |
| Buttons Styled | ❌ | ❌ | ✅ | 100% |
| Section Padding | ❌ | ❌ | ✅ | 100% |

---

## Migration Timeline

### Phase 2: Form Injection (Weeks 1-2)

**Week 1**: FormIsland Implementation
- Create FormIsland.tsx client component
- Add form state management
- Implement API integration
- Add loading/success/error states

**Week 2**: Integration & Testing
- Modify CTA sections to use FormIsland in published mode
- Configure Next.js for partial hydration
- End-to-end form submission testing
- Deploy to production

### Phase 3: SSR Publishing (Weeks 3-9)

**Week 3**: Infrastructure
- Create 6-7 published primitive components
- Create LandingPagePublishedRenderer
- Create publishedPageRenderer helper
- Enhance themeUtils

**Week 4-5**: Critical UIBlocks
- Modify Hero sections (5 layouts)
- Modify Features sections (3 layouts)
- Modify CTA sections (8 layouts)

**Week 6**: More UIBlocks
- Modify Testimonials, FAQ, Pricing sections
- Update publish route to use server renderer
- Create test suite

**Week 7-8**: Remaining UIBlocks
- Modify HowItWorks, Results, Security sections
- Modify remaining sections
- Run visual regression tests

**Week 9**: Rollout
- Gradual rollout with feature flag
- Monitor performance and errors
- Full deployment

---

## Rollback Plan

If SSR publishing causes issues:

1. **Disable feature flag**: `ENABLE_SSR_PUBLISHING=false`
2. **Revert publish route**: Use client-captured htmlContent
3. **Published pages continue working**: Static HTML already in database
4. **No data loss**: Content/theme still stored in JSON

---

## Future Enhancements

1. **Optimize Tailwind CSS**: Generate minimal CSS with only used classes
2. **Image Optimization**: Resize/compress images during publish
3. **Form Hydration**: Add minimal client JS for form interactivity
4. **Analytics**: Add PostHog script injection (deferred)
5. **SEO**: Auto-generate structured data (JSON-LD)

---

## Questions & Answers

**Q: Why not use Puppeteer to capture rendered HTML?**
A: Overkill. Heavy infrastructure, slow publishing, resource-intensive. Server rendering achieves same result with less complexity.

**Q: Why keep preview page client-rendered?**
A: Editing requires client interactivity (drag-drop, inline editing, stores). Only publishing needs static HTML.

**Q: What about forms in published pages?**
A: Forms remain client-side. We'll add minimal hydration for form islands in future enhancement.

**Q: Can existing published pages be automatically re-rendered?**
A: No. Manual republish only. Automatic migration risks breaking pages. Users opt-in via "Republish" button.

**Q: How to handle async data in UIBlocks?**
A: Pre-fetch data in publish API, pass as props to renderer. No client-side data fetching in published mode.

---

## References

- Ticketverz live page: https://ticketverz.lessgo.ai
- Preview page: https://lessgo.ai/preview/e205C_rZ8jmP




## Phase 2: Form Injection & Hydration (PLANNED)

### Problem Context

After Phase 1, published pages are static HTML with no client-side JavaScript. This works perfectly for content display but breaks form functionality:

❌ **Forms don't work** - No submit handlers, no validation
❌ **No form state** - Can't capture user input
❌ **No API calls** - Can't send form submissions to `/api/forms/submit`
❌ **No loading states** - No feedback during submission
❌ **No success/error handling** - User sees nothing after submitting

### Why Forms Need Hydration

Forms in published pages require:
1. **Client-side state** - Track field values as user types
2. **Event handlers** - `onSubmit`, `onChange` events
3. **API integration** - POST to `/api/forms/submit`
4. **Validation** - Email format, required fields
5. **UI feedback** - Loading spinners, success messages, error states

### Solution Architecture

**Approach**: Selective hydration - inject minimal client JS only for form islands

**Key Principle**: Keep page mostly static, hydrate only interactive elements (forms)

### Implementation Plan

#### 2.1 Create Form Island Component

**File**: `src/components/published/FormIsland.tsx`
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
  onSuccess?: () => void;
}

export function FormIsland({
  formId,
  fields,
  submitButtonText,
  submitButtonColor,
  onSuccess
}: FormIslandProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data: formData,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({}); // Reset form
        onSuccess?.();
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
            onChange={(e) => handleChange(field.name, e.target.value)}
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

#### 2.2 Modify Published Page to Include Form Script

**Modify**: `src/lib/publishedPageRenderer.ts`

Add function to inject form hydration script:
```typescript
function injectFormHydration(html: string, formConfig: any): string {
  // Extract form data from content
  const formScript = `
    <script type="module">
      import { hydrateRoot } from 'react-dom/client';
      import { FormIsland } from '@/components/published/FormIsland';

      // Find form containers
      document.querySelectorAll('[data-form-island]').forEach(container => {
        const formData = JSON.parse(container.dataset.formConfig);

        hydrateRoot(container, (
          <FormIsland {...formData} />
        ));
      });
    </script>
  `;

  return html + formScript;
}
```

**Better approach**: Use Next.js built-in partial hydration:
```typescript
// In LandingPagePublishedRenderer.tsx
// Mark form sections for hydration
{sectionType === 'cta' && hasForm && (
  <div data-form-island id={`form-${sectionId}`}>
    <FormIsland {...formConfig} />
  </div>
)}
```

#### 2.3 Update CTA Sections to Use FormIsland

**Modify**: `src/modules/UIBlocks/CTA/CTAWithFormField.tsx`

```tsx
import { FormIsland } from '@/components/published/FormIsland';

export default function CTAWithFormField(props) {
  const { mode, formConfig, theme } = props;

  return (
    <SectionWrapperPublished {...props}>
      {/* ... CTA content ... */}

      <div className="bg-white rounded-2xl p-8">
        {mode === 'published' ? (
          // Client component for interactivity
          <FormIsland
            formId={formConfig.id}
            fields={formConfig.fields}
            submitButtonText={formConfig.submitText}
            submitButtonColor={theme.colors.accentColor}
          />
        ) : (
          // Edit mode uses existing FormBuilder
          <FormBuilder {...formConfig} />
        )}
      </div>
    </SectionWrapperPublished>
  );
}
```

#### 2.4 Configure Next.js for Partial Hydration

**Modify**: `next.config.js`

```javascript
module.exports = {
  experimental: {
    // Enable React Server Components
    serverActions: true,
  },
  // Ensure client components bundle separately
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

### Week 1-2: Implementation

**Tasks**:
1. Create `FormIsland.tsx` client component
2. Modify CTA sections to use FormIsland in published mode
3. Test form submission end-to-end
4. Add loading states and error handling
5. Style form to match theme colors

### Testing Strategy

**Test**: Form submissions on published pages
```typescript
test('form submits successfully on published page', async () => {
  const page = await browser.newPage();
  await page.goto('https://ticketverz.lessgo.ai');

  // Fill form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="name"]', 'Test User');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for success message
  await page.waitForSelector('.bg-green-50');

  // Verify API call
  const requests = page.requests();
  const formSubmit = requests.find(r => r.url().includes('/api/forms/submit'));
  expect(formSubmit).toBeDefined();
});
```

### Bundle Size Impact

**Before**: 87.7KB (static HTML only, no forms)
**After**: ~95KB (includes FormIsland client component ~7KB)
**Target**: <100KB

### Success Criteria

After Phase 2 completion:
✅ Forms work on published pages
✅ Form submissions sent to `/api/forms/submit`
✅ Loading states visible during submission
✅ Success/error messages displayed
✅ Form data captured in database
✅ Email validation works
✅ Bundle size <100KB (including form JS)

---
