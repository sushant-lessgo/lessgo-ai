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
import { getComponent, extractSectionType } from './componentRegistry.published';

/**
 * Extract content fields from elements structure
 * Converts: { elements: { headline: { content: "text" } } }
 * To: { headline: "text" }
 * Also includes forms from fullContent for form-connected buttons
 */
function extractContentFields(sectionData: any, fullContent?: any): Record<string, any> {
  const { elements, ...systemProps } = sectionData;
  const contentProps: Record<string, any> = {};

  // Extract .content from each element
  if (elements && typeof elements === 'object') {
    for (const [key, element] of Object.entries(elements)) {
      if (element && typeof element === 'object' && 'content' in element) {
        contentProps[key] = (element as any).content;
      }
    }
  }

  return { ...systemProps, ...contentProps };
}

interface LandingPagePublishedRendererProps {
  sections: string[];           // Section ID array from content.layout.sections
  content: Record<string, any>; // Full section content
  theme: any;                   // Theme object with colors, typography
  className?: string;
  publishedPageId?: string;     // For analytics (optional)
  pageOwnerId?: string;         // For analytics (optional)
}

export function LandingPagePublishedRenderer({
  sections,
  content,
  theme,
  className = '',
  publishedPageId,
  pageOwnerId
}: LandingPagePublishedRendererProps) {
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
  return (
    <>
    <div className={`landing-page-published ${className}`}>
      {processedSections.map((section) => {
        if (!section) return null;
        const { id: sectionId, layout, data } = section;
        const sectionType = extractSectionType(sectionId);
        const LayoutComponent = getComponent(sectionType, layout);

        // Silent fallback if component not found
        if (!LayoutComponent) {
          console.warn(`Published: Missing component for ${sectionType}:${layout}`);
          return null;
        }

        // Get section background
        const backgroundType = data?.backgroundType || 'primary';

        // Calculate background CSS (simplified - no alternating logic needed)
        let sectionBackgroundCSS = '';
        if (backgroundType === 'primary') {
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.primary || '#FFFFFF';
        } else if (backgroundType === 'secondary') {
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.secondary || '#F9FAFB';
        } else if (backgroundType === 'neutral') {
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.neutral || '#F3F4F6';
        } else if (backgroundType === 'divider') {
          sectionBackgroundCSS = theme.colors?.sectionBackgrounds?.divider || '#E5E7EB';
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

        // Extract content fields from elements structure
        const flattenedData = extractContentFields(data, content);

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
  </>
  );
}
