// /app/edit/[token]/components/layout/MainContent.tsx
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { EditablePageRenderer } from '../ui/EditablePageRenderer';
import { FloatingToolbars } from '../ui/FloatingToolbars';
import { AddSectionButton } from '../ui/AddSectionButton';

interface MainContentProps {
  tokenId: string;
}

export function MainContent({ tokenId }: MainContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const {
    sections,
    content,
    mode,
    globalSettings,
    selectedSection,
    selectedElement,
    selectElement,
    updateElementContent,
    addSection,
    reorderSections,
    setActiveSection,
    showSectionToolbar,
    showElementToolbar,
    getColorTokens,
    handleDragStart,
    handleDragOver,
    handleDrop,
    trackPerformance,
    announceLiveRegion,
  } = useEditStore();

  const colorTokens = getColorTokens();

  // Handle scroll indicator
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const showIndicator = scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 50;
      setShowScrollIndicator(showIndicator);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => container.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  // Handle section click
  const handleSectionClick = (sectionId: string, event: React.MouseEvent) => {
    if (mode !== 'edit') return;

    const startTime = performance.now();
    
    event.stopPropagation();
    setActiveSection(sectionId);
    
    // Show section toolbar
    const rect = event.currentTarget.getBoundingClientRect();
    showSectionToolbar(sectionId, {
      x: rect.right - 200,
      y: rect.top + 10,
    });

    trackPerformance('section-selection', startTime);
    announceLiveRegion(`Selected section ${sectionId}`);
  };

  // Handle element click
  const handleElementClick = (sectionId: string, elementKey: string, event: React.MouseEvent) => {
    if (mode !== 'edit') return;

    const startTime = performance.now();
    
    event.stopPropagation();
    
    selectElement({
      sectionId,
      elementKey,
      type: 'text',
      editMode: 'inline',
    });

    // Show element toolbar
    const rect = event.currentTarget.getBoundingClientRect();
    showElementToolbar(`${sectionId}.${elementKey}`, {
      x: rect.left,
      y: rect.top - 50,
    });

    trackPerformance('element-selection', startTime);
    announceLiveRegion(`Selected ${elementKey} in ${sectionId}`);
  };

  // Handle content update
  const handleContentUpdate = (sectionId: string, elementKey: string, value: string) => {
    const startTime = performance.now();
    
    updateElementContent(sectionId, elementKey, value);
    trackPerformance('content-update', startTime);
  };

  // Handle add section
  const handleAddSection = (afterSectionId?: string) => {
    const sectionTypes = [
      { id: 'hero', label: 'Hero Section', icon: '🏆' },
      { id: 'features', label: 'Features', icon: '⭐' },
      { id: 'testimonials', label: 'Testimonials', icon: '💬' },
      { id: 'pricing', label: 'Pricing', icon: '💰' },
      { id: 'faq', label: 'FAQ', icon: '❓' },
      { id: 'cta', label: 'Call to Action', icon: '🎯' },
    ];

    // For now, add a basic section - in production this would show a picker
    const newSectionId = `section-${Date.now()}`;
    addSection('hero', afterSectionId, {
      layout: 'hero-centered',
      content: {
        headline: 'New Section Headline',
        subheadline: 'Add your content here',
        cta: 'Get Started',
      },
    });

    // Auto-select the new section
    setActiveSection(newSectionId);
    announceLiveRegion(`Added new section`);
  };

  // Handle section drag and drop
  const handleSectionDragStart = (sectionId: string, event: React.DragEvent) => {
    handleDragStart(sectionId, event);
  };

  const handleSectionDragOver = (event: React.DragEvent) => {
    handleDragOver(event);
  };

  const handleSectionDrop = (targetSectionId: string, position: 'before' | 'after', event: React.DragEvent) => {
    handleDrop(targetSectionId, position, event);
    announceLiveRegion(`Moved section`);
  };

  // Clear selection on background click
  const handleBackgroundClick = () => {
    if (selectedSection || selectedElement) {
      setActiveSection(undefined);
      selectElement(null);
    }
  };

  return (
    <main 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50 relative"
      onClick={handleBackgroundClick}
    >
      {/* Main Content Container */}
      <div 
        className="min-h-full"
        style={{
          maxWidth: globalSettings.maxWidth,
          margin: '0 auto',
          padding: globalSettings.containerPadding,
        }}
      >
        {/* Empty State */}
        {sections.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Your Landing Page
              </h3>
              <p className="text-gray-600 mb-6">
                Add sections from the left panel or start with a pre-built template.
              </p>
              <button
                onClick={() => handleAddSection()}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${colorTokens.accent} text-white hover:opacity-90 shadow-sm hover:shadow-md
                `}
              >
                Add Your First Section
              </button>
            </div>
          </div>
        )}

        {/* Sections Renderer */}
        {sections.length > 0 && (
          <div className="space-y-0">
            {sections.map((sectionId, index) => (
              <div key={sectionId} className="relative group">
                {/* Add Section Button (Between Sections) */}
                {index > 0 && (
                  <AddSectionButton
                    onAdd={() => handleAddSection(sections[index - 1])}
                    position="between"
                  />
                )}

                {/* Drop Zone (Before) */}
                <div
                  className="h-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onDragOver={handleSectionDragOver}
                  onDrop={(e) => handleSectionDrop(sectionId, 'before', e)}
                >
                  <div className="h-full bg-blue-200 rounded mx-4" />
                </div>

                {/* Section Container */}
                <div
                  className={`
                    relative transition-all duration-200 cursor-pointer
                    ${selectedSection === sectionId 
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50' 
                      : 'hover:ring-1 hover:ring-gray-300'
                    }
                  `}
                  draggable={mode === 'edit'}
                  onClick={(e) => handleSectionClick(sectionId, e)}
                  onDragStart={(e) => handleSectionDragStart(sectionId, e)}
                  data-section-id={sectionId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Section ${sectionId}`}
                >
                  {/* Section Content */}
                  <EditablePageRenderer
                    sectionId={sectionId}
                    sectionData={content[sectionId]}
                    layout={content[sectionId]?.layout || 'default'}
                    mode={mode}
                    isSelected={selectedSection === sectionId}
                    onElementClick={handleElementClick}
                    onContentUpdate={handleContentUpdate}
                    colorTokens={colorTokens}
                    globalSettings={globalSettings}
                  />

                  {/* Section Overlay (Edit Mode) */}
                  {mode === 'edit' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Section Label */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
                          {content[sectionId]?.layout || 'Section'}
                        </span>
                      </div>

                      {/* Drag Handle */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-1 bg-white border border-gray-200 rounded cursor-move">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 01-2 2h-2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drop Zone (After) */}
                <div
                  className="h-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onDragOver={handleSectionDragOver}
                  onDrop={(e) => handleSectionDrop(sectionId, 'after', e)}
                >
                  <div className="h-full bg-blue-200 rounded mx-4" />
                </div>
              </div>
            ))}

            {/* Add Section Button (End) */}
            <AddSectionButton
              onAdd={() => handleAddSection(sections[sections.length - 1])}
              position="end"
            />
          </div>
        )}

        {/* Scroll to Bottom Padding */}
        <div className="h-32" />
      </div>

      {/* Floating Toolbars */}
      <FloatingToolbars />

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-6 right-6 z-30">
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollTo({
                  top: containerRef.current.scrollHeight,
                  behavior: 'smooth',
                });
              }
            }}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Performance Monitor (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            Sections: {sections.length} | Selected: {selectedSection || 'None'}
          </div>
        </div>
      )}
    </main>
  );
}