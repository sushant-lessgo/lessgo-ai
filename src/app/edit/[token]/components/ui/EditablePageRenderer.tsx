// app/edit/[token]/components/ui/EditablePageRenderer.tsx
import React from 'react';
import { getComponent } from '@/modules/generatedLanding/componentRegistry';
import { sectionList } from '@/modules/sections/sectionList';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';

interface EditablePageRendererProps {
  sectionId: string;
  sectionData: any;
  layout: string;
  mode: 'edit' | 'preview';
  isSelected: boolean;
  onElementClick: (sectionId: string, elementKey: string, event: React.MouseEvent) => void;
  onContentUpdate: (sectionId: string, elementKey: string, value: string) => void;
  colorTokens: any;
  globalSettings: any;
}

const MissingLayoutComponent: React.FC<{ sectionId: string; layout: string }> = ({ 
  sectionId, 
  layout 
}) => (
  <section className="py-16 px-4 bg-yellow-50 border-2 border-yellow-200">
    <div className="max-w-6xl mx-auto text-center">
      <div className="bg-yellow-100 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Layout Component Missing
        </h3>
        <p className="text-yellow-700 mb-4">
          Section: <code className="bg-yellow-200 px-2 py-1 rounded">{sectionId}</code>
          <br />
          Layout: <code className="bg-yellow-200 px-2 py-1 rounded">{layout}</code>
        </p>
        <p className="text-sm text-yellow-600">
          This layout component needs to be implemented.
        </p>
      </div>
    </div>
  </section>
);

const getBackgroundTypeFromSection = (sectionId: string): 'primary' | 'secondary' | 'neutral' | 'divider' => {
  const sectionMeta = sectionList.find(s => s.id === sectionId);
  
  if (sectionId === 'hero' || sectionId === 'cta') return 'primary';
  if (sectionId === 'features' || sectionId === 'benefits') return 'secondary';
  if (sectionId === 'faq' || sectionId === 'about') return 'divider';
  
  return 'neutral';
};

export function EditablePageRenderer({
  sectionId,
  sectionData,
  layout,
  mode,
  isSelected,
  onElementClick,
  onContentUpdate,
  colorTokens,
  globalSettings
}: EditablePageRendererProps) {
  
  const backgroundType = getBackgroundTypeFromSection(sectionId);
  
  const LayoutComponent = getComponent(sectionId, layout);

  if (!LayoutComponent) {
    return (
      <MissingLayoutComponent 
        sectionId={sectionId} 
        layout={layout}
      />
    );
  }

  if (!sectionData) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Section Data
            </h3>
            <p className="text-gray-600">
              Section: <code className="bg-gray-200 px-2 py-1 rounded">{sectionId}</code>
            </p>
          </div>
        </div>
      </section>
    );
  }

  try {
    return (
      <div
        className={`
          relative transition-all duration-200
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${mode === 'edit' ? 'cursor-pointer' : ''}
        `}
        data-section-id={sectionId}
        data-layout={layout}
        data-background-type={backgroundType}
      >
        <LayoutComponent
          sectionId={sectionId}
          backgroundType={backgroundType}
          className=""
          {...(sectionData || {})}
        />
        
        {mode === 'edit' && sectionData?.aiMetadata && (
          <div className="absolute top-2 right-2 z-10">
            {sectionData.aiMetadata.aiGenerated && !sectionData.aiMetadata.isCustomized && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">
                🤖 AI Generated
              </span>
            )}
            {sectionData.aiMetadata.isCustomized && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500 text-white rounded">
                ✏️ Customized
              </span>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error(`Error rendering section ${sectionId}:`, error);
    
    if (mode === 'edit') {
      return (
        <section className="py-8 px-4 bg-red-50 border-l-4 border-red-400">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error in {sectionId} section
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            </div>
          </div>
        </section>
      );
    }
    
    return null;
  }
}