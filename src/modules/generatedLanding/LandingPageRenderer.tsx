/**
 * LandingPageRenderer - the EDIT renderer (client component).
 *
 * Runs in the browser: reads sections/content/theme from the Zustand edit store,
 * renders each section's `.tsx` block with inline-editable (contentEditable) UI,
 * and wraps output in the template's ThemeInjector. The server-safe counterpart is
 * LandingPagePublishedRenderer. Keep the two in lockstep — divergence is the #1
 * "looks right in editor, wrong when published" trap (see README.md).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { sectionList } from '@/modules/sections/sectionList';
import { getComponent, extractSectionType as extractSectionTypeRaw } from '@/modules/generatedLanding/componentRegistry';
import { buildSectionAnchorMap } from '@/utils/sectionAnchors';
import {
  generateCompleteBackgroundSystem,
  getSectionBackgroundTypeWithContext,
  assignEnhancedBackgroundsToAllSections
} from '@/modules/Design/background/backgroundIntegration';
import { SmartTextSection } from '@/components/layout/SmartTextSection';
import { VariableThemeInjector } from '@/modules/Design/ColorSystem/VariableThemeInjector';
// Template visuals load via the dynamic registry (no static template import →
// Hearth stays out of the product bundle).
import { useTemplateModule } from '@/modules/templates/useTemplateReady';
import type { HearthPalette } from '@/types/service';
import { usesTemplateModule } from '@/types/service';
import type { MeridianPalette } from '@/types/product';
// import { VariableBackgroundRenderer } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer'; // Disabled
import { CSSVariableErrorBoundary } from '@/components/CSSVariableErrorBoundary';
import { useFeatureFlags } from '@/utils/featureFlags';
import { SectionTracker } from '@/app/p/[slug]/components/SectionTracker';
import { FormPlacementRenderer } from '@/components/forms/FormPlacementRenderer';
import { buildNormalizeCtasContext, createNormalizeCtasMemo } from '@/utils/normalizeCtas';

import { logger } from '@/lib/logger';
import { EDITOR_DEBUG } from '@/lib/debugFlags';

// ... (types remain the same)
type SectionBackground = 'neutral' | 'primary-highlight' | 'secondary-highlight';

type OrderedSection = {
  id: string;
  order: number;
  background: SectionBackground;
  layout: string;
  data: any;
  // ✅ NEW: Add alternating info for debugging
  alternatingInfo?: {
    intrinsicType: string;
    previousSection?: string;
    previousType?: string;
    wasAlternated: boolean;
  };
};

// ... (MissingLayoutComponent and backgroundTypeMapping remain the same)
const MissingLayoutComponent: React.FC<{ sectionId: string; layout: string }> = ({ 
  sectionId, 
  layout 
}) => {
  const { mode } = useEditStore();
  
  return (
    <section className="py-16 px-4 bg-yellow-50 border-2 border-yellow-200">
      <div className="max-w-6xl mx-auto text-center">
        <div className="bg-yellow-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Layout Component Missing
          </h3>
          <p className="text-yellow-700 mb-4">
            Section: <code className="bg-yellow-200 px-2 py-1 rounded">{sectionId}</code>
            <br />
            Layout: <code className="bg-yellow-200 px-2 py-1 rounded">{layout}</code>
          </p>
          {mode !== 'preview' && (
            <p className="text-sm text-yellow-600">
              This layout component needs to be implemented.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const backgroundTypeMapping: Record<SectionBackground, 'primary' | 'secondary' | 'neutral'> = {
  'primary-highlight': 'primary',
  'secondary-highlight': 'secondary',
  'neutral': 'neutral',
};



interface LandingPageRendererProps {
  className?: string;
  tokenId?: string;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export default function LandingPageRenderer({ className = '', tokenId, publishedPageId, pageOwnerId }: LandingPageRendererProps) {
  // Get tokenId from props or URL params
  const params = useParams();
  const effectiveTokenId = tokenId || (params?.token as string) || 'default';

  // perf-01 phase 4 (step 3): narrow the root subscription to exactly the fields
  // this render body reads (over-selecting is safe; under-selecting breaks render).
  // `useShallow` re-renders only when one of these picks changes shallowly, so a
  // store write that touches an unrelated slice no longer re-renders the renderer.
  // Store actions (getColorTokens/updateFromBackgroundSystem) are stable identities.
  const {
    sections,
    sectionLayouts,
    theme,
    content: rawContent,
    mode,
    errors,
    getColorTokens,
    updateFromBackgroundSystem,
    audienceType,
    templateId,
    variantId,
    paletteId,
    themeValues,
    goal,
    forms,
    pages,
    currentPageId,
  } = useEditStore(
    useShallow((s) => ({
      sections: s.sections,
      sectionLayouts: s.sectionLayouts,
      theme: s.theme,
      content: s.content,
      mode: s.mode,
      errors: s.errors,
      getColorTokens: s.getColorTokens,
      updateFromBackgroundSystem: s.updateFromBackgroundSystem,
      audienceType: s.audienceType,
      templateId: s.templateId,
      variantId: s.variantId,
      paletteId: s.paletteId,
      themeValues: s.themeValues,
      goal: s.goal,
      forms: s.forms,
      pages: s.pages,
      currentPageId: s.currentPageId,
    })),
  );

  // scale-04 (phase 3): run the same normalization pre-pass as the published
  // renderer so editor/preview buttons point at the resolved goal target. Store
  // `goal` (hydrated from Brief by loadDraft); null goal → legacy fallback.
  // goal-ref-cta phase 3 (F23): on multipage, derive the active page path + the
  // form-bearing page (from the same PageAxisState the sitemap nav reads) so an M1
  // primary on a page that does NOT hold the form resolves cross-page — identical
  // to the published exporter (both feed buildNormalizeCtasContext). Single-page
  // (≤1 page) degrades to {goal, forms} → same-page anchor (no regression).
  // perf-01 phase 4 (B1): per-section memoizing normalizer, one instance per
  // renderer mount. Keeps unchanged sections' normalized refs stable across
  // keystrokes so memo'd blocks don't re-render on unrelated edits. Output is
  // structurally identical to the pure `normalizeCtas` (memo parity test pins it).
  const normalizeCtasMemo = useRef(createNormalizeCtasMemo()).current;
  const content = useMemo(() => {
    const pageList = pages ? Object.values(pages) : [];
    if (pageList.length <= 1) {
      return normalizeCtasMemo(rawContent, buildNormalizeCtasContext({ goal, forms }));
    }
    const ctx = buildNormalizeCtasContext({
      goal,
      forms,
      currentPagePath: pages[currentPageId]?.pathSlug,
      // The active page's live working copy is the top-level `rawContent` (which
      // includes injected chrome); other pages use their stored body-only content.
      pages: pageList.map((p) => ({
        path: p.pathSlug,
        content: p.id === currentPageId ? rawContent : p.content,
      })),
    });
    return normalizeCtasMemo(rawContent, ctx);
  }, [rawContent, goal, forms, pages, currentPageId, normalizeCtasMemo]);

  const usesTemplate = usesTemplateModule(audienceType, templateId);
  const { ready: templateReady, tmpl } = useTemplateModule(audienceType, templateId);
  // Palette is a loose string in the store; the concrete union depends on the
  // template (Hearth / Lex / Meridian). Widen the type and let the template's
  // ThemeInjector validate at its own boundary.
  const effectivePalette: HearthPalette | MeridianPalette =
    (paletteId as HearthPalette | MeridianPalette) ||
    ((tmpl?.defaultPaletteId as HearthPalette | MeridianPalette) ?? 'terracotta');
  // Fall back to the loaded template's own default variant (Hearth 'classic',
  // Lex 'statesman', Meridian 'developer'); undefined until the module loads.
  const effectiveVariant: string | undefined =
    (variantId as string) || tmpl?.defaultVariantId;

  // Get feature flags for CSS variable system
  const featureFlags = useFeatureFlags(effectiveTokenId);
  
  // Get onboarding data for dynamic backgrounds
  const { validatedFields, hiddenInferredFields } = useOnboardingStore();

  // Extract manual theme override for UIBlocks (future: set via edit header toggle)
  const manualThemeOverride = theme?.uiBlockTheme;

  // ✅ Generate dynamic background system (unchanged)
 const dynamicBackgroundSystem = useMemo(() => {
  // Background system debug removed
  
  const hasOnboardingData = validatedFields && Object.keys(validatedFields).length > 0;
 // Onboarding data validation
  
  if (!hasOnboardingData) {
  // Using static fallbacks
    return null;
  }

  try {
   // Generating background system
    const backgroundSystem = generateCompleteBackgroundSystem({
  // Required InputVariables fields with defaults
  marketCategory: validatedFields.marketCategory || 'Business Productivity Tools',
  marketSubcategory: validatedFields.marketSubcategory || 'Project & Task Management',
  targetAudience: validatedFields.targetAudience || 'early-stage-founders',
  keyProblem: validatedFields.keyProblem || '',
  startupStage: validatedFields.startupStage || 'mvp-development',
  landingPageGoals: validatedFields.landingPageGoals || 'signup',
  pricingModel: validatedFields.pricingModel || 'freemium',
  
  // Optional HiddenInferredFields
  ...hiddenInferredFields
});
  // Background system generation completed
    
    return backgroundSystem;
  } catch (error) {
    logger.error('=== BACKGROUND SYSTEM ERROR ===');
    logger.error('Error details:', error);
    if (error instanceof Error) {
      logger.error('Error stack:', error.stack);
    }
    return null;
  }
}, [validatedFields, hiddenInferredFields]);
  // ✅ Sync background system with store theme (only if no saved backgrounds exist)
  const hasInitializedBg = useRef(false);
  useEffect(() => {
    if (dynamicBackgroundSystem && !hasInitializedBg.current) {
      const existing = theme?.colors?.sectionBackgrounds?.primary;
      if (!existing) {
        updateFromBackgroundSystem(dynamicBackgroundSystem);
      }
      hasInitializedBg.current = true;
    }
  }, [dynamicBackgroundSystem, updateFromBackgroundSystem]);

  // ✅ Generate color tokens
  const colorTokens = useMemo(() => {
   // Generating color tokens
    const tokens = getColorTokens();
    logger.debug('✅ Color tokens generated:', {
      accent: tokens.accent,
      bgSecondary: tokens.bgSecondary,
      hasSophisticatedSecondary: tokens.bgSecondary?.includes('gradient')
    });
    return tokens;
  }, [getColorTokens]);

  // ✅ ENHANCED: Get ordered sections with ALTERNATING background assignment
  
  logger.debug('🔍 LandingPageRenderer Debug:', {
  sectionsFromStore: sections,
  sectionsCount: sections?.length,
  sectionLayoutsFromStore: sectionLayouts,
  layoutsCount: Object.keys(sectionLayouts || {}).length,
  sectionLayouts: sectionLayouts
});
  
  // perf-01 phase 4 (B2): SPLIT the former combined `orderedSections` memo so a
  // text edit does not re-run the background-assignment pass.
  //
  // Memo A — background assignments. Keyed on [sections, sectionLayouts,
  // validatedFields, hiddenInferredFields] and INTENTIONALLY NOT on `content`.
  // The section-id list derives from `sections` filtered by layout presence, with
  // `content[sectionId]?.layout` only as a FALLBACK when `sectionLayouts[id]` is
  // absent. LAYOUT-STABILITY ASSUMPTION: typing/text edits never add or remove a
  // section's layout (structural mutations touch `sections`/`sectionLayouts`, which
  // ARE deps) → the id set is stable across content-only edits, so keying without
  // `content` is safe. If a future content-only mutation can change a section's
  // layout, add `content` back to these deps or this memo will serve a stale id set.
  // (`dynamicBackgroundSystem`/`theme.colors.sectionBackgrounds.secondary` were on
  //  the old combined deps but are NOT read by this computation — dropped.)
  const backgroundAssignments = useMemo(() => {
    if (!sections || sections.length === 0) return {} as Record<string, string>;
    const sectionIds = sections
      .map((sectionId: string) => ({
        id: sectionId,
        layout: sectionLayouts[sectionId] || content[sectionId]?.layout,
      }))
      .filter((s) => s.layout !== undefined && typeof s.layout === 'string')
      .map((s) => s.id);
    return assignEnhancedBackgroundsToAllSections(sectionIds, {
      // Required InputVariables fields with defaults
      marketCategory: validatedFields.marketCategory || 'Business Productivity Tools',
      marketSubcategory: validatedFields.marketSubcategory || 'Project & Task Management',
      targetAudience: validatedFields.targetAudience || 'early-stage-founders',
      keyProblem: validatedFields.keyProblem || '',
      startupStage: validatedFields.startupStage || 'mvp-development',
      landingPageGoals: validatedFields.landingPageGoals || 'signup',
      pricingModel: validatedFields.pricingModel || 'freemium',
      // Optional HiddenInferredFields
      ...hiddenInferredFields,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, sectionLayouts, validatedFields, hiddenInferredFields]);

  // Memo B — cheap per-section mapping to the render shape (incl. `data:
  // content[sectionId]` and the manual `backgroundType` override read). Re-runs on
  // edits (cheap), but with the B1 memoizer above `content[sectionId]` refs are
  // stable for unchanged sections → memo'd blocks see stable `data`.
  const orderedSections = useMemo<OrderedSection[]>(() => {
    if (!sections || sections.length === 0) {
      return [];
    }

    const finalSections: OrderedSection[] = sections
      .map((sectionId: string, index: number) => {
        const sectionData = content[sectionId];
        const layout = sectionLayouts[sectionId] || sectionData?.layout;
        return { id: sectionId, order: index, layout, data: sectionData };
      })
      .filter((section): section is typeof section & { layout: string } => {
        return section.layout !== undefined && typeof section.layout === 'string';
      })
      .map((section) => {
        const { id: sectionId, order, layout, data } = section;

        // ✅ Manual user override wins over auto-calculated assignment.
        const manualBackgroundType = content[sectionId]?.backgroundType;
        const effectiveBackgroundType = manualBackgroundType || backgroundAssignments[sectionId];

        // Map to SectionBackground format
        let background: SectionBackground;
        switch (effectiveBackgroundType) {
          case 'primary': background = 'primary-highlight'; break;
          case 'secondary': background = 'secondary-highlight'; break;
          case 'custom': background = 'neutral'; break; // ✅ Handle custom backgrounds
          default: background = 'neutral';
        }

        return { id: sectionId, order, background, layout, data };
      });

    return finalSections;
  }, [sections, sectionLayouts, content, backgroundAssignments]);

  // Stable in-page anchor ids (dedup-aware) so nav/footer "#<type>" links resolve in
  // preview too (smooth-scroll itself runs only on the published page).
  const anchorMap = useMemo(
    () => buildSectionAnchorMap(orderedSections.map((s) => s.id)),
    [orderedSections]
  );

  // perf-01 phase 4 (step 4): wrap each resolved block component in React.memo
  // ONCE, cached by the resolved component's identity (registry returns stable
  // component refs). This lets a renderer re-render skip unchanged blocks whose
  // now-ref-stable spread `data` props are unchanged (steps 1+5) while phase-3
  // self-subscription still re-renders a block when its own slice changes. Wrapping
  // inline in JSX would mint a fresh component type every render → remount storm.
  const memoizedComponentCache = useRef(
    new WeakMap<React.ComponentType<any>, React.MemoExoticComponent<React.ComponentType<any>>>()
  ).current;
  const getMemoizedComponent = (Comp: React.ComponentType<any>) => {
    let memoized = memoizedComponentCache.get(Comp);
    if (!memoized) {
      memoized = React.memo(Comp);
      memoizedComponentCache.set(Comp, memoized);
    }
    return memoized;
  };

  // ✅ Enhanced render section with alternating debug info
  const renderSection = (section: OrderedSection) => {
    const { id: sectionId, background, layout, data, alternatingInfo } = section;

    // Get the appropriate component from registry
    const LayoutComponent = getComponent(sectionId, layout, audienceType, templateId);

    // Use fallback if component not found
    if (!LayoutComponent) {
      logger.warn(`Layout component not found: ${sectionId}.${layout}`);
      return (
        <MissingLayoutComponent
          key={sectionId}
          sectionId={sectionId}
          layout={layout}
        />
      );
    }

    // Stable per-component React.memo wrapper (see getMemoizedComponent note).
    const MemoLayoutComponent = getMemoizedComponent(LayoutComponent as React.ComponentType<any>);

    // Map background type
    const backgroundType = backgroundTypeMapping[background] || 'neutral';

    // ✅ Check for custom background
    const customBackground = data?.sectionBackground?.type === 'custom'
      ? data.sectionBackground.custom
      : null;

    // ✅ SIMPLIFIED: Get the actual CSS value for this background type
    const sectionBackgroundCSS = (() => {
      // Return empty for custom backgrounds (will use inline style instead)
      if (customBackground) return '';

      const backgrounds = theme?.colors?.sectionBackgrounds;
      if (!backgrounds) return '#ffffff';

      switch(backgroundType) {
        case 'primary':
          return backgrounds.primary || 'linear-gradient(to bottom right, #3b82f6, #2563eb)';
        case 'secondary':
          return backgrounds.secondary || 'rgba(249, 250, 251, 0.7)';
        default:
          return backgrounds.neutral || '#ffffff';
      }
    })();

    // ✅ Generate inline style for custom backgrounds
    const customBackgroundStyle = customBackground
      ? {
          background: customBackground.solid
            ? customBackground.solid
            : customBackground.gradient?.type === 'linear'
            ? `linear-gradient(${customBackground.gradient.angle}deg, ${
                customBackground.gradient.stops.map((s: any) => `${s.color} ${s.position}%`).join(', ')
              })`
            : customBackground.gradient
            ? `radial-gradient(circle, ${
                customBackground.gradient.stops.map((s: any) => `${s.color} ${s.position}%`).join(', ')
              })`
            : undefined
        }
      : undefined;

    // Enhanced background logging
    if (EDITOR_DEBUG) {
      if (backgroundType === 'secondary') {
        logger.debug(`🎨 Rendering secondary section ${sectionId}:`, {
          backgroundCSS: sectionBackgroundCSS,
          themeSecondary: theme.colors.sectionBackgrounds.secondary,
          isFromAccentOptions: theme.colors.sectionBackgrounds.secondary?.includes('gradient'),
          accentColor: theme.colors.accentColor,
          baseColor: theme.colors.baseColor,
          alternatingInfo
        });
      }

      // Enhanced logging for alternated sections
      if (alternatingInfo?.wasAlternated) {
        logger.debug(`🔄 Rendering alternated section ${sectionId}:`, {
          originallyWouldBe: 'secondary',
          actuallyIs: backgroundType,
          actualCSS: sectionBackgroundCSS,
          previousSection: alternatingInfo.previousSection,
          reason: 'Previous section was secondary, so this became neutral for visual break'
        });
      }

      logger.debug(`🎨 Section ${sectionId} CSS class:`, sectionBackgroundCSS);
    }

    // Handle section-specific errors
    const sectionError = errors[sectionId];
    if (sectionError && mode === 'edit') {
      return (
        <section key={sectionId} className="py-8 px-4 bg-red-50 border-l-4 border-red-400">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error in {sectionId} section
                </h3>
                <p className="text-sm text-red-700 mt-1">{sectionError}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Render the actual component with feature flag-controlled wrapper
    try {
      // Debug logging for hero section
      if (EDITOR_DEBUG && sectionId === 'hero') {
        logger.debug('🎯 Rendering hero section with data:', {
          mode,
          isEditable: mode !== 'preview',
          data,
          ctaConfig: data?.ctaConfig,
          elements: data?.elements
        });
      }
      
      // Choose rendering method based on feature flags
      // Detect header sections for sticky positioning
      const isHeaderSection = sectionId.includes('header') || layout?.includes('Header');

      // Template-backed projects (service Hearth/Lex, product Meridian): skip the
      // product theme wrapper. Surface comes from sectionRules via the neutral
      // data-surface attribute; template tokens come from the outer ThemeInjector
      // wrap on the page.
      if (usesTemplate) {
        const sectionTypeKey = extractSectionTypeRaw(sectionId);
        const surface = tmpl?.getSurfaceForSection(sectionTypeKey) ?? 'cream';
        return (
          <SectionTracker
            key={sectionId}
            sectionId={sectionId}
            sectionType={layout}
          >
            <div
              id={anchorMap[sectionId]}
              data-surface={surface}
              className={`relative ${isHeaderSection ? 'sticky top-0 z-50' : ''}`}
              style={{ scrollMarginTop: 80 }}
            >
              <MemoLayoutComponent
                sectionId={sectionId}
                className=""
                isEditable={mode !== 'preview'}
                publishedPageId={publishedPageId}
                pageOwnerId={pageOwnerId}
                {...(data || {})}
              />
              <FormPlacementRenderer
                sectionId={sectionId}
                userId={pageOwnerId}
                publishedPageId={publishedPageId}
              />
            </div>
          </SectionTracker>
        );
      }

      if (shouldUseVariableSystem) {
        return (
          <SectionTracker
            key={sectionId}
            sectionId={sectionId}
            sectionType={layout}
          >
            <div
              className={`relative ${isHeaderSection ? 'sticky top-0 z-50' : ''}`}
              style={{
                background: customBackgroundStyle?.background || sectionBackgroundCSS,
                ...customBackgroundStyle
              }}
              data-background-type={backgroundType}
            >
              <MemoLayoutComponent
                sectionId={sectionId}
                backgroundType={backgroundType}
                sectionBackgroundCSS={sectionBackgroundCSS}
                className=""
                isEditable={mode !== 'preview'}

                manualThemeOverride={manualThemeOverride}
                publishedPageId={publishedPageId}
                pageOwnerId={pageOwnerId}
                {...(data || {})}
              />
              {/* Render forms that should appear inline in this section */}
              <FormPlacementRenderer
                sectionId={sectionId}
                userId={pageOwnerId}
                publishedPageId={publishedPageId}
              />
            </div>
          </SectionTracker>
        );
      } else {
        // Legacy rendering with SmartTextSection
        return (
          <SectionTracker
            key={sectionId}
            sectionId={sectionId}
            sectionType={layout}
          >
            <SmartTextSection
              backgroundType={backgroundType}
              sectionId={sectionId}
              sectionBackgroundCSS={sectionBackgroundCSS}
              customBackgroundStyle={customBackgroundStyle}
              className=""
            >
              <MemoLayoutComponent
                sectionId={sectionId}
                backgroundType={backgroundType}
                sectionBackgroundCSS={sectionBackgroundCSS}
                className=""
                isEditable={mode !== 'preview'}

                manualThemeOverride={manualThemeOverride}
                publishedPageId={publishedPageId}
                pageOwnerId={pageOwnerId}
                {...(data || {})}
              />
              {/* Render forms that should appear inline in this section */}
              <FormPlacementRenderer
                sectionId={sectionId}
                userId={pageOwnerId}
                publishedPageId={publishedPageId}
              />
            </SmartTextSection>
          </SectionTracker>
        );
      }
    } catch (error) {
      logger.error(`Error rendering section ${sectionId}:`, error);
      
      if (mode !== 'preview') {
        return (
          <section key={sectionId} className="py-8 px-4 bg-red-50">
            <div className="max-w-6xl mx-auto text-center">
              <h3 className="text-red-800 font-semibold">Render Error</h3>
              <p className="text-red-600">Section: {sectionId}</p>
              <p className="text-red-600">Layout: {layout}</p>
              <details className="text-left text-sm text-red-500 mt-2">
                <summary>Error Details</summary>
                <pre className="whitespace-pre-wrap mt-2 p-2 bg-red-100 rounded">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            </div>
          </section>
        );
      }
      
      return null;
    }
  };

  // NOTE: empty-state + global-error guards are intentionally placed AFTER all
  // hooks below (see end of this block). React requires every hook to run on
  // every render; an early return here would skip the useMemo/useEffect hooks
  // that follow and crash with "Rendered fewer hooks than expected" the moment
  // `sections`/`globalError` toggles across renders (e.g. async draft + template
  // load on the Meridian editor path).

  // Prepare background system for VariableThemeInjector
  const variableBackgroundSystem = useMemo(() => {
    if (!theme?.colors?.sectionBackgrounds) return undefined;

    return {
      primary: theme.colors.sectionBackgrounds.primary || 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      secondary: theme.colors.sectionBackgrounds.secondary || 'rgba(249, 250, 251, 0.7)',
      neutral: theme.colors.sectionBackgrounds.neutral || '#ffffff',
      baseColor: theme.colors.baseColor || 'blue',
      accentColor: theme.colors.accentColor || 'blue',
      accentCSS: theme.colors.accentCSS || 'bg-blue-600',
    };
  }, [theme]);

  // Determine rendering approach based on feature flags
  const shouldUseVariableSystem = useMemo(() => {
    // Check if variable mode is enabled
    if (featureFlags.enableVariableMode && variableBackgroundSystem) {
      return true;
    }
    
    // Check if hybrid mode is enabled and browser supports CSS variables
    if (featureFlags.enableHybridMode && variableBackgroundSystem) {
      return true;
    }
    
    // Default to legacy mode
    return false;
  }, [featureFlags, variableBackgroundSystem]);

  // Log feature flag status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && featureFlags.enableMigrationDebug) {
      logger.debug('🚩 Feature Flags Status:', {
        tokenId: effectiveTokenId,
        enableVariableMode: featureFlags.enableVariableMode,
        enableHybridMode: featureFlags.enableHybridMode,
        enableLegacyFallbacks: featureFlags.enableLegacyFallbacks,
        shouldUseVariableSystem,
        rolloutPercentage: featureFlags.rolloutPercentage,
        staffAccess: featureFlags.staffAccess,
      });
      
      // Run CSS variable validation in development
      import('@/utils/cssVariableValidation').then(({ runCSSVariableValidation }) => {
        runCSSVariableValidation(effectiveTokenId).catch((error) => logger.error('CSS variable validation failed:', error));
      });
    }
  }, [featureFlags, shouldUseVariableSystem, effectiveTokenId]);

  // Prepare business context for VariableThemeInjector
  const businessContext = useMemo(() => ({
    validatedFields,
    hiddenInferredFields,
  }), [validatedFields, hiddenInferredFields]);

  // ── Early returns (AFTER all hooks — see note above) ──

  // Handle empty state
  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2-8v14a2 2 0 002 2h-5" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections to Display</h3>
          <p className="text-gray-500">
            {mode !== 'preview'
              ? 'Add sections to start building your landing page.'
              : 'This landing page is empty.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Handle global errors
  const globalError = errors['global'];
  if (globalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Render Landing Page</h3>
          <p className="text-red-700">{globalError}</p>
        </div>
      </div>
    );
  }

  // Main renderer with conditional variable system wrapper
  const renderContent = () => (
    <main
      className={`landing-page-renderer ${className}`}
      data-mode={mode}
      data-variable-system={shouldUseVariableSystem ? 'enabled' : 'legacy'}
    >
      {/* Enhanced Global CSS Variables for Color Tokens - Only when using variable system */}
      {shouldUseVariableSystem && (
        <style jsx>{`
          .landing-page-renderer {
            --color-accent: ${colorTokens.accent};
            --color-accent-hover: ${colorTokens.accentHover};
            --color-accent-border: ${colorTokens.accentBorder};
            --color-cta-bg: ${colorTokens.ctaBg};
            --color-cta-hover: ${colorTokens.ctaHover};
            --color-cta-text: ${colorTokens.ctaText};
            --color-text-on-light: ${colorTokens.textOnLight};
            --color-text-on-dark: ${colorTokens.textOnDark};
            --color-text-on-accent: ${colorTokens.textOnAccent};
            --color-link: ${colorTokens.link};
            --color-bg-primary: ${colorTokens.bgPrimary};
            --color-bg-secondary: ${colorTokens.bgSecondary};
            --color-bg-neutral: ${colorTokens.bgNeutral};
            --color-text-primary: ${colorTokens.textPrimary};
            --color-text-secondary: ${colorTokens.textSecondary};
            --color-text-muted: ${colorTokens.textMuted};
            --color-text-inverse: ${colorTokens.textInverse};
            --color-surface-card: ${colorTokens.surfaceCard};
            --color-surface-elevated: ${colorTokens.surfaceElevated};
            --color-surface-section: ${colorTokens.surfaceSection};
            --color-surface-overlay: ${colorTokens.surfaceOverlay};
            --color-border-default: ${colorTokens.borderDefault};
            --color-border-subtle: ${colorTokens.borderSubtle};
            --color-border-focus: ${colorTokens.borderFocus};
            --color-success: ${colorTokens.success};
            --color-warning: ${colorTokens.warning};
            --color-error: ${colorTokens.error};
            --color-info: ${colorTokens.info};
          }
        `}</style>
      )}
      {/* Render all sections with ALTERNATING backgrounds */}
      {orderedSections.map(renderSection)}

      {/* ✅ Enhanced Edit Mode Indicators with Alternating Info */}
      {mode !== 'preview' && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            ✏️ Edit Mode Active
          </div>
          {/* Feature Flag Status */}
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            shouldUseVariableSystem 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-white'
          }`}>
            {shouldUseVariableSystem ? '🎨 Variable System' : '🏗️ Legacy Mode'}
          </div>
          {/* Background System Status */}
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            dynamicBackgroundSystem 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'
          }`}>
            {dynamicBackgroundSystem ? '🎨 Dynamic Backgrounds' : '🔧 Static Fallback'}
          </div>
          {/* Accent System Status */}
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            theme.colors.sectionBackgrounds.secondary?.includes('gradient')
              ? 'bg-purple-600 text-white' 
              : 'bg-orange-600 text-white'
          }`}>
            {theme.colors.sectionBackgrounds.secondary?.includes('gradient') ? '🎯 Accent Integrated' : '⚠️ Basic Secondary'}
          </div>
          {/* ✅ NEW: Alternating Logic Status */}
          <div className="bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            🔄 Alternating Logic Active
          </div>
        </div>
      )}

      {/* ✅ Enhanced Development Info with Alternating Pattern */}
      {mode !== 'preview' && process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-white p-4 text-xs font-mono">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <div className="text-gray-400">Sections:</div>
                <div>{sections.length}</div>
              </div>
              <div>
                <div className="text-gray-400">Theme:</div>
                <div>{theme.colors.baseColor}/{theme.colors.accentColor}</div>
              </div>
              <div>
                <div className="text-gray-400">Typography:</div>
                <div>{theme.typography.scale}</div>
              </div>
              <div>
                <div className="text-gray-400">Mode:</div>
                <div className="capitalize">{mode}</div>
              </div>
              <div>
                <div className="text-gray-400">System:</div>
                <div className={shouldUseVariableSystem ? 'text-green-400' : 'text-gray-400'}>
                  {shouldUseVariableSystem ? 'Variable' : 'Legacy'}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Backgrounds:</div>
                <div className={dynamicBackgroundSystem ? 'text-green-400' : 'text-yellow-400'}>
                  {dynamicBackgroundSystem ? 'Dynamic' : 'Static'}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Alternating:</div>
                <div className="text-indigo-400">Active</div>
              </div>
            </div>
            
            {/* ✅ NEW: Show alternating pattern */}
            <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
              <div className="text-gray-400">Background Pattern:</div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {orderedSections.map((section, index) => (
                  <div key={section.id} className="flex justify-between">
                    <span>{section.id}</span>
                    <span className={`${
                      section.background === 'secondary-highlight' ? 'text-purple-400' :
                      section.background === 'primary-highlight' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {section.background}
                      {section.alternatingInfo?.wasAlternated && (
                        <span className="text-yellow-400"> (alternated)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Feature Flag Details */}
            {featureFlags.enableMigrationDebug && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                <div className="text-gray-400">Feature Flags:</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>Variable Mode: <span className={featureFlags.enableVariableMode ? 'text-green-400' : 'text-red-400'}>{featureFlags.enableVariableMode ? 'ON' : 'OFF'}</span></div>
                  <div>Hybrid Mode: <span className={featureFlags.enableHybridMode ? 'text-green-400' : 'text-red-400'}>{featureFlags.enableHybridMode ? 'ON' : 'OFF'}</span></div>
                  <div>Rollout: <span className="text-blue-400">{featureFlags.rolloutPercentage}%</span></div>
                  <div>Staff Access: <span className={featureFlags.staffAccess ? 'text-green-400' : 'text-red-400'}>{featureFlags.staffAccess ? 'YES' : 'NO'}</span></div>
                </div>
              </div>
            )}
            
            {/* Show actual color values */}
            <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
              <div className="text-gray-400">Color Tokens:</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>CTA: <span className="text-green-400">{colorTokens.ctaBg}</span></div>
                <div>Secondary BG: <span className="text-purple-400">{colorTokens.bgSecondary}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
  );

  // Template-backed projects: wrap output in the template's ThemeInjector. Skip
  // product theme injectors entirely — template tokens come from CSS vars on
  // :root. Gate render until the dynamically-loaded template module is ready.
  if (usesTemplate) {
    // perf-01 phase 4 (step 6): cold-load import gate. While the template module
    // dynamic-imports, show a neutral gray skeleton approximating section rhythm
    // instead of `return null` (which flashed a blank page then popped content in).
    // No `tmpl.ThemeInjector` / template CSS vars (those are what's loading). All
    // hooks run above this point, so the hooks order is unchanged. Cold-load only —
    // the warm nav path never hits this branch.
    if (!templateReady || !tmpl) {
      return (
        <div className="landing-page-skeleton" aria-hidden="true">
          {(sections ?? []).slice(0, 6).map((id: string, i: number) => (
            <div
              key={id ?? i}
              style={{
                minHeight: i === 0 ? 480 : 320,
                backgroundColor: i % 2 === 0 ? '#f3f4f6' : '#e5e7eb',
              }}
            />
          ))}
        </div>
      );
    }
    const ThemeInjector = tmpl.ThemeInjector;
    return (
      <ThemeInjector
        paletteId={effectivePalette}
        variantId={effectiveVariant}
        // Neutral mood (vestria) from Project.themeValues.mood — undefined for
        // other templates / unset drafts; injectors default it (bone).
        mood={(themeValues as Record<string, any> | null)?.mood}
      >
        {renderContent()}
      </ThemeInjector>
    );
  }

  // Conditionally wrap with VariableThemeInjector based on feature flags
  return shouldUseVariableSystem ? (
    <CSSVariableErrorBoundary
      fallbackMode="legacy"
      onError={(error, errorInfo) => {
        logger.error('CSS Variable system failed, falling back to legacy mode:', error);
        // Could track this error in analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'css_variable_system_error', {
            tokenId: effectiveTokenId,
            error_message: error.message,
            fallback_mode: 'legacy',
          });
        }
      }}
    >
      <VariableThemeInjector
        tokenId={effectiveTokenId}
        backgroundSystem={variableBackgroundSystem}
        businessContext={businessContext}
      >
        {renderContent()}
      </VariableThemeInjector>
    </CSSVariableErrorBoundary>
  ) : (
    renderContent()
  );
}