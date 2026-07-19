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
import { SlugModal } from '@/components/SlugModal';
import CustomDomainModal from '@/components/CustomDomainModal';
import { logger } from '@/lib/logger';
// editor-route-consolidation phase 6: the real publish flow now lives in a SHARED
// hook + card under @/app/edit/[token]/components/publish, so `/preview` and the
// editor header run one identical implementation (no divergence). `/preview` stays
// fully functional for admin + work-dashboard "Update site" deep-links.
import { usePublishFlow } from '@/app/edit/[token]/components/publish/usePublishFlow';
import { PublishSuccessCard } from '@/app/edit/[token]/components/publish/PublishSuccessCard';

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
 * does — published-slug fetch, publish payload assembly — exists solely to serve
 * chrome that does not render here.
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

  // Render-read: sections/content/theme/title/onboardingData (validation + debug
  // effects), pages/currentPageId (default-to-home effect). Handler-only actions
  // (setMode, setCurrentPage) are read one-shot via storeApi.getState().
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

  // The publish flow — the SAME hook the editor header uses (one source of truth).
  const publish = usePublishFlow(tokenId);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Set mode to preview on mount
  useEffect(() => {
    storeApi.getState().setMode('preview');
  }, [storeApi]);

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

  // Back to the editor. The old tab-manager focus/close flow is gone: the editor
  // no longer opens `/preview` in a new tab (publish is in-place now), so there is
  // never a "source tab" to refocus — the remaining `/preview` entry points (admin,
  // work-dashboard "Update site") are same-tab navigations. Plain in-place nav.
  const handleEdit = () => {
    router.push(`/edit/${tokenId}`);
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
              title="Return to edit mode"
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
                      onClick={() => publish.setShowDomainModal(true)}
                      disabled={!publish.existingPublished?.slug}
                      className="rounded-app-ctl-sm border border-app-border-hairline bg-white px-3.5 py-2 text-[12.5px] font-semibold text-app-ink transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:border-app-border disabled:bg-white disabled:text-app-placeholder"
                    >
                      Custom Domain
                    </button>
                  </div>
                </TooltipTrigger>
                {!publish.existingPublished?.slug && (
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
                      onClick={publish.openPublish}
                      disabled={publish.publishing}
                      className="flex items-center gap-2 rounded-app-ctl-sm bg-app-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-app-btn-publish transition-colors hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                      {publish.publishing ? (
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
      {publish.showSlugModal && (
        <SlugModal
          slug={publish.customSlug}
          onChange={publish.setCustomSlug}
          title={publish.publishTitle}
          onTitleChange={publish.setPublishTitle}
          onCancel={() => publish.setShowSlugModal(false)}
          onConfirm={publish.doPublish}
          loading={publish.publishing}
          error={publish.publishError}
          existingPublished={publish.existingPublished}
          analyticsEnabled={publish.analyticsEnabled}
          onAnalyticsChange={publish.setAnalyticsEnabled}
          // t17-A "Review" link. Reviewing happens in the editor, and handleEdit is
          // the page's existing route back there — reused, not invented.
          onReview={handleEdit}
        />
      )}

      {/* Custom Domain Modal */}
      {publish.showDomainModal && publish.existingPublished?.slug && (
        <CustomDomainModal
          slug={publish.existingPublished.slug}
          open={publish.showDomainModal}
          onClose={() => publish.setShowDomainModal(false)}
        />
      )}

      {/* ── t17 · C — live ─────────────────────────────────────────────────
          Shared success card (same component the editor renders). */}
      {publish.publishSuccess && (
        <PublishSuccessCard
          publishedUrl={publish.publishedUrl}
          existingPublished={publish.existingPublished}
          onClose={() => publish.setPublishSuccess(false)}
          onConnectDomain={() => {
            publish.setPublishSuccess(false);
            publish.setShowDomainModal(true);
          }}
        />
      )}

      {/* Bottom padding to prevent content from being hidden behind fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}
