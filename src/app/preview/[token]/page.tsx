"use client";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { EditProvider } from '@/components/EditProvider';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SlugModal } from '@/components/SlugModal';
import CustomDomainModal from '@/components/CustomDomainModal';
import posthog from "posthog-js";
import { getTabManager, cleanupTabManager } from '@/utils/tabManager';
import { logger } from '@/lib/logger';
import { generateSmartTitle, stripHTMLTags } from '@/utils/smartTitleGenerator';

export default function PreviewPage() {
  const params = useParams();
  const tokenId = params?.token as string;
  
  if (!tokenId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid URL</h2>
          <p className="text-gray-600 mb-6">No token provided in URL</p>
        </div>
      </div>
    );
  }

  // `?chrome=0` is read via useSearchParams, which REQUIRES a Suspense boundary:
  // without one, `next build` fails the page with
  // "missing-suspense-with-csr-bailout" (precedent: dashboard/billing/page.tsx).
  //
  // The branch lives INSIDE the boundary on purpose. Lifting the flag out (an
  // effect reading window.location.search, or state hoisted to this component)
  // would first-paint the action bar and then remove it — inside the STEP 06
  // reveal iframe that is a visible flash. Reading it here means the chromeless
  // tree never renders the bar at all, not even for a frame.
  return (
    <Suspense fallback={null}>
      <PreviewPageRouter tokenId={tokenId} />
    </Suspense>
  );
}

function PreviewPageRouter({ tokenId }: { tokenId: string }) {
  const searchParams = useSearchParams();
  // Strictly opt-in: ONLY the exact string '0' suppresses chrome. Every other
  // value (absent, '1', 'false', garbage) is the normal preview — the default
  // path must never be reachable by accident.
  const chromeless = searchParams?.get('chrome') === '0';

  return (
    <EditProvider
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        resetOnTokenChange: false,
        // Preview never fetches the ~68 KB baseline: no Reset, markers not
        // rendered here — the driving win of content-baseline-split.
        prefetchBaselineForReview: false,
      }}
    >
      {chromeless ? (
        <PreviewSiteOnly tokenId={tokenId} />
      ) : (
        <PreviewPageContent tokenId={tokenId} />
      )}
    </EditProvider>
  );
}

/**
 * `?chrome=0` — the site and NOTHING else.
 *
 * Used by the onboarding STEP 06 reveal, which embeds this route in an iframe so
 * the journey's `.app-chrome` scope can never become an ancestor of template
 * output (landmine 1 / decision 6: app fonts+tokens bleeding into a template =
 * editor↔published divergence). The reveal deliberately has NO publish surface —
 * the only way forward is the editor — so the action bar, SlugModal, the custom
 * domain modal and the publish success modal are ABSENT FROM THE TREE here, not
 * merely hidden. The e2e asserts count = 0 in the iframe document.
 *
 * A sibling of PreviewPageContent rather than a set of flags inside it: the
 * normal preview is a shared, load-bearing flow and this phase must not put a
 * single new conditional on it. The two effects below are the only ones the site
 * itself needs (preview mode + default-to-home); everything else PreviewPageContent
 * does — published-slug fetch, tab manager, publish payload assembly — exists
 * solely to serve chrome that does not render here.
 *
 * INTERIM TARGET: generate + reveal + preview are consolidating onto the edit
 * route (preview becomes an editor mode toggle; `/preview` retires) — future
 * editor-track work. When that lands, this chromeless branch moves to the editor
 * preview surface, together with the reveal's iframe src (StepReveal.tsx) and the
 * `/preview/:token*` X-Frame-Options SAMEORIGIN rule in next.config.js.
 */
function PreviewSiteOnly({ tokenId }: { tokenId: string }) {
  const { pages, currentPageId } = useEditStore(
    useShallow((s) => ({ pages: s.pages, currentPageId: s.currentPageId })),
  );
  const storeApi = useEditStoreApi();

  useEffect(() => {
    storeApi.getState().setMode('preview');
  }, [storeApi]);

  // Same default-to-home rule as the normal preview (no page switcher here
  // either, so without it the reveal could open on whatever page was last
  // active). One-shot; setCurrentPage is a no-op when already home.
  const didDefaultToHome = useRef(false);
  useEffect(() => {
    if (didDefaultToHome.current) return;
    const list = pages ? Object.values(pages) : [];
    if (list.length === 0) return; // draft not loaded yet
    const home = list.find((p: any) => p?.pathSlug === '/') as any;
    if (home && currentPageId !== home.id) storeApi.getState().setCurrentPage(home.id);
    didDefaultToHome.current = true;
  }, [pages, currentPageId, storeApi]);

  return (
    <div className="min-h-screen bg-white" data-testid="preview-chromeless">
      <div id="landing-preview">
        <LandingPageRenderer tokenId={tokenId} />
      </div>
    </div>
  );
}

function PreviewPageContent({ tokenId }: { tokenId: string }) {
  const router = useRouter();

  // Render-read: sections/content/theme/title/onboardingData (validation +
  // debug effects, publish payload), pages/currentPageId (default-to-home effect).
  // Handler-only (forms, legalPages, setMode, export, save, setCurrentPage) are
  // read one-shot via storeApi.getState() inside the effects/handlers below.
  const {
    sections,
    content,
    theme,
    title,
    onboardingData,
    pages,
    currentPageId,
  } = useEditStore(
    useShallow((s) => ({
      sections: s.sections,
      content: s.content,
      theme: s.theme,
      title: s.title,
      onboardingData: s.onboardingData,
      pages: s.pages,
      currentPageId: s.currentPageId,
    })),
  );
  const storeApi = useEditStoreApi();

  // Multi-page preview defaults to the Home page (the preview has no page switcher
  // yet, so without this it would open stuck on whatever page was last active in the
  // editor — e.g. Contact). One-time on load: once pages have hydrated, switch the
  // active page to the home entry (pathSlug '/'). setCurrentPage is a no-op when
  // already home and doesn't mark the draft dirty.
  const didDefaultToHome = useRef(false);
  useEffect(() => {
    if (didDefaultToHome.current) return;
    const list = pages ? Object.values(pages) : [];
    if (list.length === 0) return; // draft not loaded yet
    const home = list.find((p: any) => p?.pathSlug === '/') as any;
    if (home && currentPageId !== home.id) storeApi.getState().setCurrentPage(home.id);
    didDefaultToHome.current = true;
  }, [pages, currentPageId, storeApi]);

  // Validate preview data loaded correctly
  useEffect(() => {
    const heroSectionId = sections.find(id => id.includes('hero'));
    if (heroSectionId) {
      const imageUrl = content[heroSectionId]?.elements?.center_hero_image?.content;
      const imageUrlStr = typeof imageUrl === 'string' ? imageUrl : '';

      if (!imageUrlStr || imageUrlStr.includes('placeholder')) {
        logger.warn('👁️ Preview showing placeholder - save may not have completed', {
          sectionId: heroSectionId,
          imageUrl: imageUrlStr,
        });
      }
    }
  }, [sections, content]);

  // UI state
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishError, setPublishError] = useState("");
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabManager, setTabManager] = useState<ReturnType<typeof getTabManager> | null>(null);
  const [existingPublished, setExistingPublished] = useState<{
    slug: string;
    title: string;
    publishedAt: string;
    analyticsEnabled?: boolean;
  } | null>(null);

  // Set mode to preview on mount and initialize tab manager
  useEffect(() => {
    storeApi.getState().setMode('preview');

    // Initialize tab manager for preview page
    const manager = getTabManager('preview', tokenId);
    setTabManager(manager);

    return () => {
      cleanupTabManager('preview', tokenId);
    };
  }, [storeApi, tokenId]);

  // Fetch existing published slug
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
              analyticsEnabled: data.analyticsEnabled
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

  // Initialize and validate data
  useEffect(() => {
    logger.debug(() => '🎨 [PREVIEW-DEBUG] Preview page initializing with theme:', () => ({
      sections: sections.length,
      content: Object.keys(content).length,
      theme: {
        colors: theme?.colors,
        typography: {
          headingFont: theme?.typography?.headingFont,
          bodyFont: theme?.typography?.bodyFont
        }
      },
      title: title,
      onboardingData: {
        oneLiner: onboardingData?.oneLiner,
        validatedFields: Object.keys(onboardingData?.validatedFields || {}).length,
        hiddenInferredFields: Object.keys(onboardingData?.hiddenInferredFields || {}).length
      }
    }));
    
    // Check if EditStore has data
    if (sections.length === 0) {
      logger.warn('🎨 [PREVIEW-DEBUG] No sections found in preview');
      setError('No page data found. Please go back to edit mode.');
      setIsLoading(false);
      return;
    }

    // Data arrived. EditProvider loads the draft asynchronously, so `sections`
    // is empty on the first render (which set the error above) and populates a
    // tick later. Clear the stale error so the preview recovers instead of
    // sticking on "Preview Not Available" for a fresh (cold-store) load.
    setError(null);

    logger.debug(() => '🎨 [PREVIEW-DEBUG] Preview ready with theme data:', () => ({
      backgroundsAvailable: {
        primary: theme?.colors?.sectionBackgrounds?.primary,
        secondary: theme?.colors?.sectionBackgrounds?.secondary,
        neutral: theme?.colors?.sectionBackgrounds?.neutral,
      },
      accentColors: {
        baseColor: theme?.colors?.baseColor,
        accentColor: theme?.colors?.accentColor,
        accentCSS: theme?.colors?.accentCSS
      }
    }));

    setIsLoading(false);
  }, [sections.length, theme, content, title, onboardingData]);

  // Handle edit navigation with smart tab management
  const handleEdit = async () => {
    if (!tabManager) {
      // Fallback to normal navigation
      router.push(`/edit/${tokenId}`);
      return;
    }

    // Check if we have a source tab ID stored
    const sourceTabId = sessionStorage.getItem(`preview-source-${tokenId}`);
    
    if (sourceTabId) {
      // Try to focus the source tab
      const focused = await tabManager.focusTab(sourceTabId);
      
      if (focused) {
        // Successfully focused the original tab, close this preview tab
        window.close();
        return;
      }
    }

    // If no source tab or focus failed, check for any existing edit tab
    const existingEditTab = tabManager.findExistingEditTab();
    
    if (existingEditTab) {
      // Try to focus the existing edit tab
      const focused = await tabManager.focusTab(existingEditTab.id);
      
      if (focused) {
        // Successfully focused an existing edit tab, close this preview tab
        window.close();
        return;
      }
    }

    // If all else fails, navigate in the current tab
    router.push(`/edit/${tokenId}`);
  };

  // Handle publish flow
  const handlePublishClick = () => {
    // Get headline for fallback
    const heroSectionId = sections.find(id => id.includes('hero'));
    const headline = heroSectionId ? content[heroSectionId]?.elements?.headline : null;
    const headlineContent = headline?.content || '';
    const headlineText = typeof headlineContent === 'string' ? headlineContent : '';

    // If already published, use existing slug and title
    if (existingPublished) {
      setCustomSlug(existingPublished.slug);
      setPublishTitle(existingPublished.title || generateSmartTitle(
        onboardingData?.validatedFields?.marketCategory,
        onboardingData?.validatedFields?.targetAudience,
        headlineText
      ));
    } else {
      // Generate smart title from market category + target audience
      const smartTitle = generateSmartTitle(
        onboardingData?.validatedFields?.marketCategory,
        onboardingData?.validatedFields?.targetAudience,
        headlineText
      );
      setPublishTitle(smartTitle);

      // Generate new slug from headline
      const defaultSlug = (headlineText || `page-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

      setCustomSlug(defaultSlug);
    }

    setShowSlugModal(true);
  };

  const handlePublish = async () => {
    // SlugModal allows a trailing hyphen while typing — trim edges here.
    const finalSlug = customSlug.replace(/^-+|-+$/g, '');
    if (!finalSlug) return;
    if (finalSlug !== customSlug) setCustomSlug(finalSlug);

    setPublishing(true);
    setPublishError('');

    // Handler-only one-shot reads (non-reactive): forms/legalPages payload +
    // save/export actions.
    const { forms, legalPages, save, export: exportState } = storeApi.getState();

    try {
      // Persist the full draft (finalContent.pages + chrome) to the DB BEFORE
      // publishing. Publish no longer writes Project.content, so the draft must be
      // current here or a dashboard→Edit after publish would load a stale draft.
      try {
        if (typeof save === 'function') await save();
      } catch (e) {
        logger.warn('Pre-publish save failed (continuing):', e);
      }

      // Get HTML content from rendered page
      const previewElement = document.getElementById('landing-preview');
      if (!previewElement) {
        throw new Error('Failed to find preview content.');
      }

      const htmlContent = previewElement.innerHTML;

      // Get theme values from EditStore
      const colorTokens = {
        accent: theme.colors.accentColor,
        bgNeutral: theme.colors.baseColor,
        textMuted: 'gray-600'
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
          htmlContent,
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
      posthog?.capture("publish_clicked", {
        slug: finalSlug,
        title: publishTitle || "",
        fromEdit: true,
      });

      setShowSlugModal(false);
    } catch (err: any) {
      logger.error('Publish error:', err);
      setPublishError(err.message || 'Unexpected error');
    } finally {
      setPublishing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accentPrimary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/edit/${tokenId}`)}
            className="w-full bg-brand-accentPrimary hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Edit Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Rendered Landing Page */}
      <div id="landing-preview">
        <LandingPageRenderer tokenId={tokenId} />
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-50">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          {/* Context Info */}
          <div className="text-sm text-gray-500">
            Preview from edit mode
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 flex items-center space-x-2"
              title="Return to edit mode (will reuse existing tab if available)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Back to Edit</span>
            </button>

            {/* Custom Domain Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <button
                      onClick={() => setShowDomainModal(true)}
                      disabled={!existingPublished?.slug}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                        !existingPublished?.slug
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Custom Domain
                    </button>
                  </div>
                </TooltipTrigger>
                {!existingPublished?.slug && (
                  <TooltipContent side="top">
                    <p>Publish first to attach a custom domain</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Publish Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <button
                      onClick={handlePublishClick}
                      disabled={publishing}
                      className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        publishing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-brand-accentPrimary hover:bg-orange-500 text-white'
                      }`}
                    >
                      {publishing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Publishing...</span>
                        </div>
                      ) : (
                        'Publish'
                      )}
                    </button>
                  </div>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Slug Modal */}
      {showSlugModal && (
        <SlugModal
          slug={customSlug}
          onChange={setCustomSlug}
          title={publishTitle}
          onTitleChange={setPublishTitle}
          onCancel={() => setShowSlugModal(false)}
          onConfirm={handlePublish}
          loading={publishing}
          error={publishError}
          existingPublished={existingPublished}
          analyticsEnabled={analyticsEnabled}
          onAnalyticsChange={setAnalyticsEnabled}
        />
      )}

      {/* Custom Domain Modal */}
      {showDomainModal && existingPublished?.slug && (
        <CustomDomainModal
          slug={existingPublished.slug}
          open={showDomainModal}
          onClose={() => setShowDomainModal(false)}
        />
      )}

      {/* Success Modal */}
      {publishSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full mx-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Page Published!</h2>
            <p className="text-gray-600 mb-1">Your landing page is now live at:</p>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all mb-6">{publishedUrl}</p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(publishedUrl)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-brand-accentPrimary hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Live
              </a>
            </div>

            <button
              onClick={() => setPublishSuccess(false)}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bottom padding to prevent content from being hidden behind fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}