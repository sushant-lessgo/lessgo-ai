"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePageStore } from '@/hooks/usePageStore';
import LandingPageRenderer from '@/components/LandingPageRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SlugModal } from '@/components/SlugModal';
import posthog from "posthog-js";

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params?.token as string;

  // Page store state
  const { 
    layout: { sections },
    content,
    ui: { mode },
    setMode,
    meta: { onboardingData }
  } = usePageStore();

  // UI state
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishError, setPublishError] = useState("");
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine navigation context
  const fromEdit = useMemo(() => {
    if (typeof window !== 'undefined') {
      return document.referrer.includes('/edit/');
    }
    return false;
  }, []);

  // Validate publish readiness
  const isPublishReady = useMemo(() => {
    const cta = content.hero?.elements;
    return !!(cta?.cta_text && (cta?.cta_url || cta?.cta_embed));
  }, [content.hero?.elements]);

  // Button hierarchy based on context
  const buttonHierarchy = useMemo(() => ({
    edit: {
      variant: fromEdit ? 'secondary' : 'primary',
      className: fromEdit 
        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
        : 'bg-brand-accentPrimary hover:bg-orange-500 text-white'
    },
    publish: {
      variant: (fromEdit && isPublishReady) ? 'primary' : 'secondary',
      disabled: !isPublishReady,
      className: (fromEdit && isPublishReady)
        ? 'bg-brand-accentPrimary hover:bg-orange-500 text-white'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
    }
  }), [fromEdit, isPublishReady]);

  // Initialize preview mode and validate data
  useEffect(() => {
    // Set preview mode
    if (mode !== 'preview') {
      setMode('preview');
    }

    // Check if store has data
    if (sections.length === 0) {
      // Try to load from API as fallback
      const loadData = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
          
          if (!response.ok) {
            throw new Error('Failed to load page data');
          }

          const data = await response.json();
          
          if (!data.content) {
            throw new Error('No page content found');
          }

          // If we get here, we need to populate the store with loaded data
          // This is a fallback case - normally store should already have data
          console.warn('Store was empty, loaded from API as fallback');
          
          // You would need to implement updateFromLoadedData in your store
          // For now, redirect to edit mode to regenerate
          router.push(`/edit/${tokenId}`);
          return;
          
        } catch (err) {
          console.error('Failed to load page data:', err);
          setError('Failed to load page data. Please return to the main page and try again.');
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    } else {
      setIsLoading(false);
    }
  }, [sections.length, tokenId, mode, setMode, router]);

  // Handle edit navigation
  const handleEdit = () => {
    if (fromEdit) {
      // Close current tab if opened from edit
      window.close();
    } else {
      // Navigate to edit page
      router.push(`/edit/${tokenId}`);
    }
  };

  // Handle publish flow
  const handlePublishClick = () => {
    if (!isPublishReady) return;

    const defaultSlug = (content?.hero?.elements?.headline || `page-${Date.now()}`)
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

      // Get theme values from store
      const { getColorTokens } = usePageStore.getState();
      const colorTokens = getColorTokens();

      // Publish the page
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: customSlug,
          htmlContent,
          title: content.hero?.elements?.headline || 'Untitled Page',
          content: { layout: usePageStore.getState().layout, content },
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
        fromEdit,
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
          <p className="text-gray-600">Loading your page...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Page</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/edit/${tokenId}`)}
              className="w-full bg-brand-accentPrimary hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to Edit Mode
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Rendered Landing Page */}
      <div id="landing-preview">
        <LandingPageRenderer />
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-50">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          {/* Context Info */}
          <div className="text-sm text-gray-500">
            {fromEdit ? 'Preview opened from edit mode' : 'Generated from onboarding'}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${buttonHierarchy.edit.className}`}
            >
              {fromEdit ? 'Back to Edit' : 'Edit Page'}
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
                          : buttonHierarchy.publish.className
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