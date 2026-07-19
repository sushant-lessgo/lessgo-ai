// /app/edit/[token]/components/publish/usePublishFlow.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { logger } from '@/lib/logger';
import posthog from 'posthog-js';
import { generateSmartTitle, stripHTMLTags } from '@/utils/smartTitleGenerator';

/**
 * usePublishFlow — the ONE publish flow, shared by both publish surfaces.
 *
 * Extracted verbatim from the old `PreviewPageContent` (preview/[token]/page.tsx)
 * so `/preview` (admin + work-dashboard "Update site" deep-links) and the editor
 * header run the SAME code — one source of truth, no divergence. The only
 * intentional drop vs the old preview handler is the vestigial `#landing-preview`
 * innerHTML read: `/api/publish` ignores the client `htmlContent` entirely (its
 * PublishSchema field is `.optional()`, and the route hard-sets `htmlContent: ''`
 * and re-renders server-side via `renderPublishedExport`), so the DOM scrape was
 * dead weight — and the editor has no `#landing-preview` node to scrape.
 *
 * The `/api/publish` payload contract is UNCHANGED (slug, title, content{layout,
 * content, forms, legalPages, subpages, chrome, seo}, themeValues, tokenId,
 * inputText, analyticsEnabled).
 */

export interface ExistingPublished {
  slug: string;
  title: string;
  publishedAt: string;
  analyticsEnabled?: boolean;
}

export function usePublishFlow(tokenId: string) {
  // Render-read (reactive): sections/content/theme/title/onboardingData feed the
  // slug/title seed + the publish payload. Handler-only actions (forms,
  // legalPages, save, export) are read one-shot via storeApi.getState() below.
  const { sections, content, theme, title, onboardingData } = useEditStore(
    useShallow((s) => ({
      sections: s.sections,
      content: s.content,
      theme: s.theme,
      title: s.title,
      onboardingData: s.onboardingData,
    })),
  );
  const storeApi = useEditStoreApi();

  // Publish UI state
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [publishError, setPublishError] = useState('');
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [existingPublished, setExistingPublished] = useState<ExistingPublished | null>(null);

  // Fetch existing published slug (mount) — seeds the republish dialog.
  useEffect(() => {
    const fetchPublishedStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${tokenId}/published-slug`);
        if (response.ok) {
          const data = await response.json();
          if (data.published) {
            setExistingPublished({
              slug: data.slug,
              title: data.title,
              publishedAt: data.publishedAt,
              analyticsEnabled: data.analyticsEnabled,
            });
            // F29: seed the republish dialog's analytics checkbox from the page's
            // stored setting so republishing doesn't silently flip it off. The DB
            // column is a non-nullable Boolean @default(false), so this mirrors the
            // stored state; the `?? false` fallback only guards a missing field.
            setAnalyticsEnabled(data.analyticsEnabled ?? false);
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch published status:', error);
        // Non-critical, continue without existing slug
      }
    };

    fetchPublishedStatus();
  }, [tokenId]);

  // Open the publish dialog: seed slug + title, then show the modal.
  const openPublish = useCallback(() => {
    // Get headline for fallback
    const heroSectionId = sections.find((id) => id.includes('hero'));
    const headline = heroSectionId ? content[heroSectionId]?.elements?.headline : null;
    const headlineContent = headline?.content || '';
    const headlineText = typeof headlineContent === 'string' ? headlineContent : '';

    // If already published, use existing slug and title
    if (existingPublished) {
      setCustomSlug(existingPublished.slug);
      setPublishTitle(
        existingPublished.title ||
          generateSmartTitle(
            onboardingData?.validatedFields?.marketCategory,
            onboardingData?.validatedFields?.targetAudience,
            headlineText,
          ),
      );
    } else {
      // Generate smart title from market category + target audience
      const smartTitle = generateSmartTitle(
        onboardingData?.validatedFields?.marketCategory,
        onboardingData?.validatedFields?.targetAudience,
        headlineText,
      );
      setPublishTitle(smartTitle);

      // Generate new slug from headline
      const defaultSlug = (headlineText || `page-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);

      setCustomSlug(defaultSlug);
    }

    setShowSlugModal(true);
  }, [sections, content, existingPublished, onboardingData]);

  // Confirm → force-save the draft, assemble the multi-page payload, POST /api/publish.
  const doPublish = useCallback(async () => {
    // SlugModal allows a trailing hyphen while typing — trim edges here.
    const finalSlug = customSlug.replace(/^-+|-+$/g, '');
    if (!finalSlug) return;
    if (finalSlug !== customSlug) setCustomSlug(finalSlug);

    setPublishing(true);
    setPublishError('');

    // Handler-only one-shot reads (non-reactive): forms/legalPages payload +
    // save/export actions.
    const { forms, legalPages, save, export: exportState } = storeApi.getState() as any;

    try {
      // Persist the full draft (finalContent.pages + chrome) to the DB BEFORE
      // publishing. Publish no longer writes Project.content, so the draft must be
      // current here or a dashboard→Edit after publish would load a stale draft.
      try {
        if (typeof save === 'function') await save();
      } catch (e) {
        logger.warn('Pre-publish save failed (continuing):', e);
      }

      // Get theme values from EditStore
      const colorTokens = {
        accent: theme.colors.accentColor,
        bgNeutral: theme.colors.baseColor,
        textMuted: 'gray-600',
      };

      // Serialize forms to strip non-serializable Zustand properties
      const safeForms = forms ? JSON.parse(JSON.stringify(forms)) : {};

      // Multi-page: commit the active page + collect every page. Root is always
      // the home page; the rest become content.subpages keyed by pathSlug.
      const exported: any = exportState ? exportState() : null;
      const allPages: Record<string, any> = exported?.pages || {};
      const homeEntry = Object.values(allPages).find((p: any) => p?.pathSlug === '/') as any;
      const rootSections = homeEntry?.sections || sections;
      const rootContent = homeEntry?.content || content;
      const subpages: Record<string, any> = {};
      for (const p of Object.values(allPages) as any[]) {
        if (!p || p.pathSlug === '/') continue;
        subpages[p.pathSlug] = {
          layout: { sections: p.sections, theme },
          content: p.content,
          title: p.title,
          seo: p.seo,
        };
      }
      const safeSubpages = JSON.parse(JSON.stringify(subpages));
      // Shared chrome (Phase 2) — body pages are chrome-free; publish injects it per page.
      const safeChrome = exported?.chrome ? JSON.parse(JSON.stringify(exported.chrome)) : undefined;

      // Publish the page
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: finalSlug,
          title: stripHTMLTags(publishTitle || title || 'Untitled Page'),
          content: {
            layout: { sections: rootSections, theme },
            content: rootContent,
            forms: safeForms,
            legalPages: legalPages || undefined,
            subpages: safeSubpages,
            chrome: safeChrome,
            // Root page's seo doubles as the site-level seo (favicon cascade).
            seo: homeEntry?.seo ? JSON.parse(JSON.stringify(homeEntry.seo)) : undefined,
          },
          themeValues: {
            primary: colorTokens.accent,
            background: colorTokens.bgNeutral,
            muted: colorTokens.textMuted,
          },
          tokenId,
          inputText: onboardingData.oneLiner,
          analyticsEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish');
      }

      setPublishedUrl(result.url);
      setPublishSuccess(true);

      // Analytics
      posthog?.capture('publish_clicked', {
        slug: finalSlug,
        title: publishTitle || '',
        fromEdit: true,
      });

      setShowSlugModal(false);
    } catch (err: any) {
      logger.error('Publish error:', err);
      setPublishError(err.message || 'Unexpected error');
    } finally {
      setPublishing(false);
    }
  }, [
    customSlug,
    storeApi,
    theme,
    sections,
    content,
    publishTitle,
    title,
    tokenId,
    onboardingData,
    analyticsEnabled,
  ]);

  return {
    // state
    publishing,
    publishSuccess,
    publishedUrl,
    publishError,
    showSlugModal,
    showDomainModal,
    customSlug,
    publishTitle,
    analyticsEnabled,
    existingPublished,
    // setters
    setPublishSuccess,
    setShowSlugModal,
    setShowDomainModal,
    setCustomSlug,
    setPublishTitle,
    setAnalyticsEnabled,
    // handlers
    openPublish,
    doPublish,
  };
}
