/**
 * LandingPagePublishedRenderer - Server-side renderer for published pages
 *
 * @remarks
 * - Server-safe (no hooks, no Zustand store, no browser APIs)
 * - Extracts sectionLayouts from content object
 * - Silent fallback for missing components
 * - Passes mode="published" to all UIBlocks
 * - Handles custom backgrounds (solid/gradient)
 *
 * Phase 1.1.2 implementation
 */

import React from 'react';
import Script from 'next/script';
import { getComponent, extractSectionType } from './componentRegistry.published';
import type { AudienceType, TemplateId } from '@/types/service';
// No static template import (firewall). Service template module is preloaded by
// the caller (p/[slug] page / static export) and read from the registry cache.
import { getLoadedTemplate } from '@/modules/templates/registry';

/**
 * Extract content fields from elements structure
 * V2: Direct passthrough - elements are already in correct format
 */
function extractContentFields(sectionData: any, fullContent?: any): Record<string, any> {
  const { elements, elementMetadata, ...systemProps } = sectionData;

  // Direct passthrough - elements are stored in direct format
  // Also pass through elementMetadata for button configs
  return { ...systemProps, ...elements, elementMetadata };
}

interface LandingPagePublishedRendererProps {
  sections: string[];           // Section ID array from content.layout.sections
  content: Record<string, any>; // Full section content
  theme: any;                   // Theme object with colors, typography
  className?: string;
  publishedPageId?: string;     // For analytics (optional)
  pageOwnerId?: string;         // For analytics (optional)
  slug?: string;                // For analytics tracking
  analyticsEnabled?: boolean;   // Enable analytics beacon
  audienceType?: AudienceType;  // Routes to service template when 'service'
  templateId?: string | null;   // Which template module to dispatch to
  variantId?: string | null;    // Template variant (token rescale) for service
  paletteId?: string | null;    // Template palette for service projects
}

export function LandingPagePublishedRenderer({
  sections,
  content,
  theme,
  className = '',
  publishedPageId,
  pageOwnerId,
  slug,
  analyticsEnabled,
  audienceType = 'product',
  templateId = 'hearth',
  variantId = null,
  paletteId = null,
}: LandingPagePublishedRendererProps) {
  const isService = audienceType === 'service';
  // Module was preloaded by the caller; read it synchronously from the cache.
  const tmpl = isService
    ? getLoadedTemplate((templateId || 'hearth') as TemplateId) ?? null
    : null;
  // Template-agnostic: fall back to the template's own default palette (Hearth
  // → terracotta, Lex → counsel, …). No hardcoded Hearth literal.
  const effectivePalette: string = paletteId || tmpl?.defaultPaletteId || 'terracotta';
  const effectiveVariant: string = variantId || tmpl?.defaultVariantId || 'classic';
  // 1. Extract sectionLayouts from content
  const sectionLayouts: Record<string, string> = {};
  for (const sectionId of sections) {
    const layout = content[sectionId]?.layout;
    if (layout) {
      sectionLayouts[sectionId] = layout;
    }
  }

  // 2. Process sections (simplified - no background assignment, pre-calculated)
  const processedSections = sections
    .map((sectionId, index) => {
      const sectionData = content[sectionId];
      const layout = sectionLayouts[sectionId];

      if (!layout) return null; // Silent fallback

      return {
        id: sectionId,
        layout,
        data: sectionData
      };
    })
    .filter(Boolean);

  // 3. Render sections with mode="published"
  const sectionsTree = (
    <div className={`landing-page-published ${className}`}>
      {processedSections.map((section) => {
        if (!section) return null;
        const { id: sectionId, layout, data } = section;
        const sectionType = extractSectionType(sectionId);
        const LayoutComponent = getComponent(sectionType, layout, audienceType, templateId);

        // Silent fallback if component not found
        if (!LayoutComponent) {
          console.warn(`Published: Missing component for ${sectionType}:${layout}`);
          return null;
        }

        // Extract content fields from elements structure
        const flattenedData = extractContentFields(data, content);

        // Service projects: skip product theme background. Wrap in a Hearth
        // surface div (cream / cream-1 / cream-2) per sectionRules.
        if (isService) {
          const surface = tmpl?.getSurfaceForSection(sectionType) ?? 'cream';
          return (
            <div key={sectionId} data-surface={surface}>
              <LayoutComponent
                sectionId={sectionId}
                mode="published"
                theme={theme}
                publishedPageId={publishedPageId}
                pageOwnerId={pageOwnerId}
                content={content}
                sections={sections}
                {...flattenedData}
              />
            </div>
          );
        }

        // Get section background
        const backgroundType = data?.backgroundType || 'primary';

        // Calculate background CSS (simplified - no alternating logic needed)
        let sectionBackgroundCSS = '';
        if (backgroundType === 'primary') {
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.primary || '#FFFFFF';
        } else if (backgroundType === 'secondary') {
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.secondary || '#F9FAFB';
        } else {
          // neutral fallback
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.neutral || '#F3F4F6';
        }

        // Custom background override
        const customBg = data?.sectionBackground;
        if (customBg?.type === 'custom') {
          if (customBg.custom?.solid) {
            sectionBackgroundCSS = customBg.custom.solid;
          } else if (customBg.custom?.gradient) {
            // Build gradient CSS
            const { type, stops, angle } = customBg.custom.gradient;
            const stopsCss = stops?.map((s: any) => `${s.color} ${s.position}%`).join(', ');
            sectionBackgroundCSS = `${type}-gradient(${angle || 135}deg, ${stopsCss})`;
          }
        }

        return (
          <LayoutComponent
            key={sectionId}
            sectionId={sectionId}
            mode="published"
            backgroundType={backgroundType}
            sectionBackgroundCSS={sectionBackgroundCSS}
            theme={theme}
            publishedPageId={publishedPageId}
            pageOwnerId={pageOwnerId}
            content={content}
            sections={sections}
            {...flattenedData}
          />
        );
      })}
    </div>
  );

  return (
    <>
    {isService && tmpl ? (
      <tmpl.SSRTokens paletteId={effectivePalette} variantId={effectiveVariant}>
        {sectionsTree}
      </tmpl.SSRTokens>
    ) : (
      sectionsTree
    )}

    {/* Smooth scroll enhancement for anchor links */}
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });
})();
        `.trim()
      }}
    />

    {/* Analytics Script (conditionally injected) */}
    {analyticsEnabled && publishedPageId && slug && (
      <Script
        src="https://lessgo.ai/assets/a.v1.js"
        data-page-id={publishedPageId}
        data-slug={slug}
        strategy="afterInteractive"
      />
    )}
  </>
  );
}
