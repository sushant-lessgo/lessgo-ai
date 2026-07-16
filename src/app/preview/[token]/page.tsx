"use client";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { EditProvider } from '@/components/EditProvider';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// App-chrome primitives (ui-foundation + editor-shell-redesign phase 1). These live
// under @/components/ui — NOTHING from @/app/edit/** is imported here, which is what
// keeps published output out of reach of the editor chrome (scout §A).
import { AppIcon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Coming } from '@/components/ui/coming';
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

      {/* Fixed Action Bar — the t17 publish ENTRY. `.app-chrome` is safe here: this
          bar is a SIBLING of #landing-preview, never an ancestor of the canvas.
          Attached via the phase-3/4 `app-chrome contents` wrapper so the class's
          #f7f8fa background doesn't paint over the bar's white. */}
      <div className="app-chrome contents">
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-app-border-frame bg-white px-6 py-3.5 shadow-app-menu">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          {/* Context Info */}
          <div className="text-[12px] font-medium text-app-muted">
            Preview from edit mode
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 rounded-app-ctl-sm border border-app-border-hairline bg-white px-3.5 py-2 text-[12.5px] font-semibold text-app-ink transition-colors hover:bg-app-hover"
              title="Return to edit mode (will reuse existing tab if available)"
            >
              <AppIcon name="arrow_back" size={16} />
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
                      className="rounded-app-ctl-sm border border-app-border-hairline bg-white px-3.5 py-2 text-[12.5px] font-semibold text-app-ink transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:border-app-border disabled:bg-white disabled:text-app-placeholder"
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
                      data-testid="publish-trigger"
                      onClick={handlePublishClick}
                      disabled={publishing}
                      className="flex items-center gap-2 rounded-app-ctl-sm bg-app-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-app-btn-publish transition-colors hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                      {publishing ? (
                        <>
                          <Spinner size={14} thickness={2} className="border-white/40 border-t-white" />
                          <span>Publishing…</span>
                        </>
                      ) : (
                        <>
                          <AppIcon name="rocket_launch" size={16} />
                          <span>Publish</span>
                        </>
                      )}
                    </button>
                  </div>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </div>
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
          // t17-A "Review" link. Reviewing happens in the editor, and handleEdit is
          // the page's existing (verbatim) route back there — reused, not invented.
          onReview={handleEdit}
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

      {/* ── t17 · C — live ─────────────────────────────────────────────────
          Same trigger as before (`publishSuccess`); only the markup changed. */}
      {publishSuccess && (
        <div className="app-chrome contents">
        {/* Same overlay tone as the Radix dialog primitive + SlugModal — see the
            note there; the hand-rolled shell is deliberate. */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-ink/60 px-4">
          <div
            data-testid="publish-live-card"
            className="relative w-full max-w-[322px] rounded-app-panel border border-app-border-hairline bg-white shadow-app-popover"
          >
            <button
              onClick={() => setPublishSuccess(false)}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-app-badge text-app-faint transition-colors hover:bg-app-hover hover:text-app-ink"
            >
              <AppIcon name="close" size={18} />
            </button>

            <div className="flex flex-col items-center px-5 pb-4 pt-7 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-success-bg">
                <AppIcon name="check" filled size={26} className="text-app-success" />
              </div>
              <h2 className="mt-3.5 text-[18px] font-bold tracking-[-.3px] text-app-ink">
                You&apos;re live!
              </h2>
              <p className="mt-1 text-[12px] font-normal text-app-muted">
                Your changes are now public.
              </p>

              {/* URL row */}
              <div className="mt-4 flex w-full items-center gap-2 rounded-[10px] border border-app-border-hairline px-2.5 py-2">
                <AppIcon name="lock" size={15} className="flex-none text-app-success" />
                <span
                  data-testid="publish-live-url"
                  className="min-w-0 flex-1 truncate text-left font-app-mono text-[12px] font-medium text-app-ink"
                >
                  {publishedUrl}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(publishedUrl)}
                  aria-label="Copy link"
                  className="flex h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-faint transition-colors hover:bg-app-hover hover:text-app-ink"
                >
                  <AppIcon name="content_copy" size={15} />
                </button>
              </div>

              {/* Actions */}
              <div className="mt-3 flex w-full items-center gap-2">
                {/* Decision 17: `Coming` renders its OWN inline-flex span, so the
                    row geometry must go on IT via className — putting these classes
                    on a child leaves the wrapper unsized (a live probe measured the
                    child pattern at 80px/19.2px instead of a flex-1 12.5px button). */}
                <Coming
                  what="one-click sharing"
                  side="top"
                  className="flex-1 justify-center rounded-[9px] border border-app-border-hairline px-3.5 py-2 text-[12.5px] font-semibold"
                >
                  <AppIcon name="share" size={15} />
                  Share
                </Coming>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-app-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-app-btn-publish transition-colors hover:bg-app-primary-hover"
                >
                  <span>View site</span>
                  <AppIcon name="open_in_new" size={15} />
                </a>
              </div>

              <p className="mt-3 text-[10.5px] font-normal text-app-faint">
                Version saved · restore anytime
              </p>
            </div>

            {/* Domain upsell → the EXISTING custom-domain path (same setter the
                action bar's Custom Domain button uses). CustomDomainModal only
                renders for an already-published slug, so this row carries the
                same precondition + tooltip the action-bar button already has —
                it is a real, wired control, not a `Coming` stub. */}
            <div className="px-4 pb-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <button
                        onClick={() => {
                          setPublishSuccess(false);
                          setShowDomainModal(true);
                        }}
                        disabled={!existingPublished?.slug}
                        className="flex w-full items-center gap-2 rounded-[9px] border border-app-tint-edge bg-app-tint-soft px-3 py-2.5 text-[11.5px] font-semibold text-app-primary-deep transition-colors hover:brightness-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="min-w-0 flex-1 truncate text-left">
                          Connect your own domain
                        </span>
                        <AppIcon name="arrow_forward" size={15} className="flex-none" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  {!existingPublished?.slug && (
                    <TooltipContent side="top">
                      <p>Reopen preview after publishing to attach a custom domain</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Bottom padding to prevent content from being hidden behind fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}