"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditProvider } from '@/components/EditProvider';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SlugModal } from '@/components/SlugModal';
import posthog from "posthog-js";
import { getTabManager, cleanupTabManager } from '@/utils/tabManager';

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

  return (
    <EditProvider 
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        resetOnTokenChange: false,
      }}
    >
      <PreviewPageContent tokenId={tokenId} />
    </EditProvider>
  );
}

function PreviewPageContent({ tokenId }: { tokenId: string }) {
  const router = useRouter();

  // Edit store state (after migration)
  const { 
    sections,
    content,
    theme,
    title,
    onboardingData,
    setMode
  } = useEditStore();

  // UI state
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishError, setPublishError] = useState("");
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabManager, setTabManager] = useState<ReturnType<typeof getTabManager> | null>(null);

  // Set mode to preview on mount and initialize tab manager
  useEffect(() => {
    setMode('preview');
    
    // Initialize tab manager for preview page
    const manager = getTabManager('preview', tokenId);
    setTabManager(manager);

    return () => {
      cleanupTabManager('preview', tokenId);
    };
  }, [setMode, tokenId]);

  // Validate publish readiness
  const isPublishReady = useMemo(() => {
    // Skip CTA validation when using mock GPT
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true') {
      return true;
    }
    
    const heroContent = content.hero?.elements;
    return !!(heroContent?.cta_text && (heroContent?.cta_url || heroContent?.cta_embed));
  }, [content.hero?.elements]);

  // Initialize and validate data
  useEffect(() => {
    console.log('🎨 [PREVIEW-DEBUG] Preview page initializing with theme:', {
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
    });
    
    // Check if EditStore has data
    if (sections.length === 0) {
      console.warn('🎨 [PREVIEW-DEBUG] No sections found in preview');
      setError('No page data found. Please go back to edit mode.');
      setIsLoading(false);
      return;
    }

    console.log('🎨 [PREVIEW-DEBUG] Preview ready with theme data:', {
      backgroundsAvailable: {
        primary: theme?.colors?.sectionBackgrounds?.primary,
        secondary: theme?.colors?.sectionBackgrounds?.secondary,
        neutral: theme?.colors?.sectionBackgrounds?.neutral,
        divider: theme?.colors?.sectionBackgrounds?.divider
      },
      accentColors: {
        baseColor: theme?.colors?.baseColor,
        accentColor: theme?.colors?.accentColor,
        accentCSS: theme?.colors?.accentCSS
      }
    });

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
    if (!isPublishReady) return;

    const headline = content?.hero?.elements?.headline as any;
    const headlineText = headline?.content || headline?.text || headline || '';
    
    const defaultSlug = (headlineText || `page-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    setCustomSlug(defaultSlug);
    setShowSlugModal(true);
  };

  const handlePublish = async () => {
    if (!customSlug || !isPublishReady) return;

    setPublishing(true);
    setPublishError('');

    try {
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

      // Publish the page
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: customSlug,
          htmlContent,
          title: content.hero?.elements?.headline || title || 'Untitled Page',
          content: { 
            layout: { sections, theme },
            content 
          },
          themeValues: {
            primary: colorTokens.accent,
            background: colorTokens.bgNeutral,
            muted: colorTokens.textMuted,
          },
          tokenId,
          inputText: onboardingData.oneLiner,
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
        slug: customSlug,
        title: content.hero?.elements?.headline || "",
        hasCTA: isPublishReady,
        fromEdit: true,
      });

      setShowSlugModal(false);
    } catch (err: any) {
      console.error('Publish error:', err);
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

            {/* Publish Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <button
                      onClick={handlePublishClick}
                      disabled={!isPublishReady || publishing}
                      className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        !isPublishReady || publishing
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
                {!isPublishReady && (
                  <TooltipContent side="top">
                    <p>Configure CTA button before publishing</p>
                  </TooltipContent>
                )}
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
          onCancel={() => setShowSlugModal(false)}
          onConfirm={handlePublish}
          loading={publishing}
          error={publishError}
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