/**
 * UIBlock Test Page - Renders a single UIBlock in isolation
 */

'use client';

import { useParams, useSearchParams, notFound } from 'next/navigation';
import { Suspense, useMemo, useEffect, useState } from 'react';
import { componentRegistry } from '@/modules/generatedLanding/componentRegistry';
import { generateMockFromSchema, getMockScenario } from '../_lib/mockDataGenerator';
import { EditProvider, EditStoreGate } from '@/components/EditProvider';
import { useEditStoreLegacy } from '@/hooks/useEditStoreLegacy';

// Find component by layout name across all section types
function findComponentByLayout(layoutName: string): {
  Component: React.ComponentType<any> | null;
  sectionType: string | null;
} {
  for (const [sectionType, layouts] of Object.entries(componentRegistry)) {
    if (layouts[layoutName]) {
      return {
        Component: layouts[layoutName],
        sectionType,
      };
    }
  }
  return { Component: null, sectionType: null };
}

// Background CSS for each type
const backgroundCSS: Record<string, string> = {
  primary: 'bg-gradient-to-br from-gray-900 to-gray-800',
  secondary: 'bg-gray-50',
  neutral: 'bg-white',
  divider: 'bg-gray-100/50',
};

export default function UIBlockTestPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UIBlockTestContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Loading UIBlock...</p>
      </div>
    </div>
  );
}

function UIBlockTestContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const blockType = params.blockType as string;
  const bgType = (searchParams.get('bg') || 'neutral') as 'primary' | 'secondary' | 'neutral' | 'divider';
  const mode = (searchParams.get('mode') || 'edit') as 'edit' | 'preview';
  const scenario = (searchParams.get('scenario') || 'default') as 'default' | 'minimal' | 'full';

  // Find component
  const { Component, sectionType } = findComponentByLayout(blockType);

  if (!Component || !sectionType) {
    notFound();
  }

  // Generate mock data - memoize to keep sectionId stable
  const { mockData, sectionId } = useMemo(() => {
    const data = scenario === 'default'
      ? generateMockFromSchema(blockType)
      : getMockScenario(blockType, scenario);
    return {
      mockData: data,
      sectionId: `${sectionType}-test-${Date.now()}`,
    };
  }, [blockType, scenario, sectionType]);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <header className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{blockType}</h1>
            <p className="text-sm text-gray-500">
              Section: <span className="font-medium">{sectionType}</span>
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 bg-gray-100 rounded">bg={bgType}</span>
            <span className="px-2 py-1 bg-gray-100 rounded">mode={mode}</span>
            <span className="px-2 py-1 bg-gray-100 rounded">scenario={scenario}</span>
          </div>
        </div>

        {/* Quick controls */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="text-gray-500">Background:</span>
          {['neutral', 'primary', 'secondary', 'divider'].map((bg) => (
            <a
              key={bg}
              href={`?bg=${bg}&mode=${mode}&scenario=${scenario}`}
              className={`px-2 py-1 rounded ${
                bg === bgType
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {bg}
            </a>
          ))}
          <span className="text-gray-500 ml-4">Mode:</span>
          {['edit', 'preview'].map((m) => (
            <a
              key={m}
              href={`?bg=${bgType}&mode=${m}&scenario=${scenario}`}
              className={`px-2 py-1 rounded ${
                m === mode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {m}
            </a>
          ))}
        </div>
      </header>

      {/* Component render area */}
      <div className="rounded-lg overflow-hidden shadow-lg">
        <EditProvider
          tokenId={`dev-${blockType}`}
          options={{
            showLoadingState: false,
            showErrorBoundary: false,
          }}
        >
          <EditStoreGate fallback={<LoadingState />}>
            <StoreContentInjector
              sectionId={sectionId}
              mockData={mockData}
              bgType={bgType}
              layout={blockType}
              mode={mode}
            >
              <ComponentWrapper
                Component={Component}
                sectionId={sectionId}
                mockData={mockData}
                bgType={bgType}
                mode={mode}
              />
            </StoreContentInjector>
          </EditStoreGate>
        </EditProvider>
      </div>

      {/* Mock data preview */}
      <details className="mt-6 bg-white rounded-lg shadow p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          View Mock Data
        </summary>
        <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(mockData, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/**
 * Injects mock content into the store after it's ready
 */
function StoreContentInjector({
  children,
  sectionId,
  mockData,
  bgType,
  layout,
  mode,
}: {
  children: React.ReactNode;
  sectionId: string;
  mockData: Record<string, any>;
  bgType: string;
  layout: string;
  mode: 'edit' | 'preview';
}) {
  const { loadFromDraft, setMode } = useEditStoreLegacy();
  const [injected, setInjected] = useState(false);

  useEffect(() => {
    if (injected) return;

    // Transform mock data to store element format
    const elements: Record<string, any> = {};
    for (const [key, value] of Object.entries(mockData)) {
      elements[key] = { value, content: value };
    }

    // Create mock draft response matching loadFromDraft format
    const mockDraft = {
      finalContent: {
        sections: [sectionId],
        sectionLayouts: { [sectionId]: layout },
        content: {
          [sectionId]: {
            elements,
            layout,
            backgroundType: bgType,
          },
        },
      },
    };

    // Load mock data into store (async - must await)
    const injectData = async () => {
      console.log('[StoreContentInjector] Injecting mock data:', { sectionId, elementCount: Object.keys(elements).length });
      await loadFromDraft(mockDraft, 'dev-test');

      // Set mode in store (preview vs edit)
      setMode(mode);
      console.log('[StoreContentInjector] Injection complete, mode:', mode);
      setInjected(true);
    };

    injectData();
  }, [mockData, sectionId, bgType, layout, mode, injected, loadFromDraft, setMode]);

  if (!injected) {
    return <LoadingState />;
  }

  return <>{children}</>;
}

/**
 * Renders the UIBlock component with proper props
 */
function ComponentWrapper({
  Component,
  sectionId,
  mockData,
  bgType,
  mode,
}: {
  Component: React.ComponentType<any>;
  sectionId: string;
  mockData: Record<string, any>;
  bgType: 'primary' | 'secondary' | 'neutral' | 'divider';
  mode: 'edit' | 'preview';
}) {
  const props = {
    sectionId,
    backgroundType: bgType,
    sectionBackgroundCSS: backgroundCSS[bgType],
    mode,
    className: '',
    isEditable: mode === 'edit',
    userContext: {
      marketCategory: 'Technology',
      targetAudience: 'B2B',
      landingPageGoals: 'Lead Generation',
      startupStage: 'Growth',
      toneProfile: 'Professional',
      awarenessLevel: 'Problem-Aware',
      pricingModel: 'Subscription',
    },
    ...mockData,
  };

  return (
    <div
      className="transition-colors"
      style={{
        background:
          bgType === 'primary'
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : bgType === 'secondary'
            ? '#f9fafb'
            : bgType === 'divider'
            ? '#f3f4f6'
            : '#ffffff',
      }}
    >
      <Component {...props} />
    </div>
  );
}
