'use client';

import React, { useEffect, useState } from 'react';
import { EditProvider, useEditStoreContext } from '@/components/EditProvider';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import { logger } from '@/lib/logger';
interface PublishedPageData {
  id: string;
  userId: string;
  slug: string;
  title: string | null;
  content: any;
  themeValues: any;
  projectId: string | null;
}

interface PublishedPageClientProps {
  pageData: PublishedPageData;
}

// Component that loads published data into EditStore
function PublishedPageContent({ pageData }: { pageData: PublishedPageData }) {
  const { store } = useEditStoreContext();
  const onboardingStore = useOnboardingStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublishedData = async () => {
      try {
        logger.debug('📄 Loading published page data:', {
          slug: pageData.slug,
          hasContent: !!pageData.content,
          contentType: typeof pageData.content,
          hasThemeValues: !!pageData.themeValues,
          themeType: typeof pageData.themeValues
        });

        // Ensure content is proper format
        if (!pageData.content || typeof pageData.content !== 'object') {
          throw new Error('Published page content is malformed');
        }

        const publishedContent = pageData.content;

        // Check if content is in the expected editor format
        if (!publishedContent.layout || !publishedContent.content) {
          throw new Error('Published page content missing layout or content structure');
        }

        const { layout, content } = publishedContent;
        const { sections, theme } = layout;

        // Load data into EditStore using Zustand's set method
        if (!store) {
          throw new Error('EditStore not available');
        }

        // Wait a moment to let EditProvider's loading attempt complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        logger.debug('🔄 Loading published data into store after EditProvider initialization...');

        // Use store.setState to update the store (Zustand with Immer)
        store.setState((state: any) => {
          // Load sections
          if (sections && Array.isArray(sections)) {
            state.sections = sections;
          }

          // Load content for each section
          if (content && typeof content === 'object') {
            Object.entries(content).forEach(([sectionId, sectionContent]) => {
              state.content[sectionId] = sectionContent;
            });
          }

          // Load theme
          if (theme) {
            state.theme = theme;
          }

          // Set title if available
          if (pageData.title) {
            state.title = pageData.title;
          }

          // Set mode to preview (published pages are essentially previews)
          state.mode = 'preview';
        });

        logger.debug('✅ Published page data loaded successfully:', {
          sectionsLoaded: sections?.length || 0,
          contentKeysLoaded: Object.keys(content || {}).length,
          themeLoaded: !!theme
        });

        setIsLoaded(true);
      } catch (err) {
        logger.error('❌ Failed to load published page data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load published page');
      }
    };

    // Only load if store is available
    if (store) {
      loadPublishedData();
    }
  }, [pageData, store, onboardingStore]);

  // Loading state
  if (!isLoaded && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading published page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Page</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">This page may need to be republished.</p>
        </div>
      </div>
    );
  }

  // Render with LandingPageRenderer
  return (
    <div className="min-h-screen bg-white">
      <LandingPageRenderer
        tokenId={`published-${pageData.slug}`}
        publishedPageId={pageData.id}
        pageOwnerId={pageData.userId}
      />
    </div>
  );
}

export default function PublishedPageClient({ pageData }: PublishedPageClientProps) {
  return (
    <EditProvider 
      tokenId={`published-${pageData.slug}`}
      options={{
        showLoadingState: false, // We handle our own loading
        showErrorBoundary: false, // We handle our own errors
        preload: false, // Don't load draft data
      }}
    >
      <PublishedPageContent pageData={pageData} />
    </EditProvider>
  );
}