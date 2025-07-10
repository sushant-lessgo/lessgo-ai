import React, { forwardRef } from 'react';
import { DraggableSection } from '@/app/edit/[token]/components/content/DragDropComponents';

interface LayoutSectionProps {
  sectionId: string;
  sectionType: string;
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider';
  sectionBackground: string;
  mode: 'edit' | 'preview';
  className?: string;
  children: React.ReactNode;
  editModeInfo?: {
    componentName: string;
    description?: string;
    tips?: string[];
  };
  // Enhanced props for drag-drop
  enableDragDrop?: boolean;
  showDropZones?: boolean;
  onDragStart?: (sectionId: string) => void;
  onDragEnd?: (sectionId: string) => void;
  onDrop?: (draggedSectionId: string, targetSectionId: string, position: 'before' | 'after') => void;
}

export const LayoutSection = forwardRef<HTMLElement, LayoutSectionProps>(({
  sectionId,
  sectionType,
  backgroundType,
  sectionBackground,
  mode,
  className = '',
  children,
  editModeInfo,
  enableDragDrop = true,
  showDropZones = true,
  onDragStart,
  onDragEnd,
  onDrop,
}, ref) => {
  
  // In edit mode with drag-drop enabled, use DraggableSection
  if (mode === 'edit' && enableDragDrop) {
    return (
      <>
        <DraggableSection
          sectionId={sectionId}
          showDropZones={showDropZones}
          className={`py-16 px-4 ${sectionBackground} ${className}`}
          style={{
            '--section-id': sectionId,
            '--section-type': sectionType,
            '--background-type': backgroundType,
          } as React.CSSProperties}
        >
          <div 
            data-section-id={sectionId}
            data-section-type={sectionType}
            data-background-type={backgroundType}
            className="relative"
          >
            {children}
          </div>
        </DraggableSection>

        {/* Edit Mode Indicators */}
        {editModeInfo && (
          <div className="bg-blue-50 border-t border-blue-200 px-4 py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start text-blue-700">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-sm font-medium mb-1">
                    {editModeInfo.componentName} - Background: {sectionBackground}
                  </div>
                  {editModeInfo.description && (
                    <div className="text-xs text-blue-600 mb-2">
                      {editModeInfo.description}
                    </div>
                  )}
                  {editModeInfo.tips && editModeInfo.tips.length > 0 && (
                    <div className="text-xs text-blue-600">
                      {editModeInfo.tips.map((tip, index) => (
                        <div key={index} className="flex items-start mb-1">
                          <span className="mr-1">💡</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-blue-500 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Drag to reorder sections
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Preview mode or drag-drop disabled - use regular section
  return (
    <>
      <section 
        ref={ref}
        className={`py-16 px-4 ${sectionBackground} ${className}`}
        data-section-id={sectionId}
        data-section-type={sectionType}
        data-background-type={backgroundType}
      >
        {children}
      </section>

      {/* Edit Mode Indicators (without drag-drop) */}
      {mode === 'edit' && editModeInfo && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start text-blue-700">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-sm font-medium mb-1">
                  {editModeInfo.componentName} - Background: {sectionBackground}
                </div>
                {editModeInfo.description && (
                  <div className="text-xs text-blue-600 mb-2">
                    {editModeInfo.description}
                  </div>
                )}
                {editModeInfo.tips && editModeInfo.tips.length > 0 && (
                  <div className="text-xs text-blue-600">
                    {editModeInfo.tips.map((tip, index) => (
                      <div key={index} className="flex items-start mb-1">
                        <span className="mr-1">💡</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

LayoutSection.displayName = 'LayoutSection';