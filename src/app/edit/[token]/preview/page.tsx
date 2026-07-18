"use client";

import React, { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { EditProvider } from '@/components/EditProvider';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';

/**
 * `/edit/[token]/preview` — the CHROMELESS editor-preview sub-route.
 *
 * A standalone, read-only, app-chrome-FREE render of the draft. This is the
 * future iframe target for the editor's true-viewport mobile view (phase 4) and
 * the XFO SAMEORIGIN surface (phase 3); it is directly navigable so it verifies
 * standalone today.
 *
 * ── Deliberate duplication ────────────────────────────────────────────────
 * The body below is a documented copy of the `PreviewSiteOnly` (`?chrome=0`)
 * branch of `src/app/preview/[token]/page.tsx`. We do NOT refactor that page to
 * share code this phase: `/preview` retires in a follow-on, so extracting a
 * shared component now is churn on a load-bearing flow with no payoff (and risks
 * the dual-renderer / app-chrome-bleed traps). When `/preview` retires, this
 * route becomes the single home for the chromeless render.
 *
 * ── No Suspense boundary needed ───────────────────────────────────────────
 * Unlike `/preview/[token]/page.tsx`, this route reads NO search params
 * (`useSearchParams`/`usePathname`) at the page level — the chromeless render is
 * unconditional here (it's the whole point of the route), so there's no
 * `?chrome=0` flag to read. That means the `missing-suspense-with-csr-bailout`
 * build failure cannot arise; no `<Suspense>` wrapper is required.
 *
 * ── app-chrome ────────────────────────────────────────────────────────────
 * NOTHING in this tree carries the `.app-chrome` class, and NOTHING from
 * `@/app/edit/**` (the editor shell/panels) is imported — only the token-scoped
 * store provider and the shared renderer. That keeps app fonts/tokens from ever
 * becoming an ancestor of template output (the editor↔published divergence
 * landmine).
 */
export default function EditorPreviewPage() {
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

  return (
    <EditProvider
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        // Same preview-optimized config as `preview/[token]/page.tsx`: the main
        // `/edit` route's provider is untouched. This preserves the ~68 KB
        // baseline-skip (no Reset baseline fetch, markers not rendered) — the
        // driving win of content-baseline-split. Baseline stays lazy via
        // `ensureBaseline()`.
        resetOnTokenChange: false,
        prefetchBaselineForReview: false,
      }}
    >
      <EditorPreviewSiteOnly tokenId={tokenId} />
    </EditProvider>
  );
}

/**
 * The site and NOTHING else — a verbatim mirror of `preview/[token]/page.tsx`'s
 * `PreviewSiteOnly`: preview mode + default-to-home, then the renderer. No
 * header, no panels, no publish surface, no `.app-chrome`.
 */
function EditorPreviewSiteOnly({ tokenId }: { tokenId: string }) {
  const { pages, currentPageId } = useEditStore(
    useShallow((s) => ({ pages: s.pages, currentPageId: s.currentPageId })),
  );
  const storeApi = useEditStoreApi();

  useEffect(() => {
    storeApi.getState().setMode('preview');
  }, [storeApi]);

  // Same default-to-home rule as the normal preview (no page switcher here
  // either, so without it the sub-route could open on whatever page was last
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
    <div className="min-h-screen bg-white" data-testid="editor-preview-chromeless">
      <div id="landing-preview">
        <LandingPageRenderer tokenId={tokenId} />
      </div>
    </div>
  );
}
