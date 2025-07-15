// app/edit/[token]/components/layout/MainContent.tsx - Enhanced with Selection System
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useSelection } from '@/hooks/useSelection';
import { EditablePageRenderer } from '../ui/EditablePageRenderer';
import { FloatingToolbars } from '../ui/FloatingToolbars';
import { AddSectionButton } from '../ui/AddSectionButton';
import { SelectionSystem, KeyboardNavigationHelper } from '../selection/SelectionSystem';
import { ElementDetector, ElementBoundaryVisualizer } from '../selection/ElementDetector';
import { useToolbarContext } from '@/hooks/useToolbarContext';
import { useElementPicker } from '@/hooks/useElementPicker';
import { ElementPicker } from '../content/ElementPicker';

interface MainContentProps {
  tokenId: string;
}

export function MainContent({ tokenId }: MainContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const {
    sections,
    content,
    sectionLayouts,
    mode,
    globalSettings,
    selectedSection,
    selectedElement,
    multiSelection,
    selectElement,
    updateElementContent,
    addSection,
    reorderSections,
    setActiveSection,
    
    showElementToolbar,
    getColorTokens,
    trackPerformance,
    announceLiveRegion,
  } = useEditStore();

   const {
    handleContextualClick,
    analyzeElementContext,
    showContextualToolbars,
    showSectionToolbar,
    currentContext,
    getContextualActions,
    hasCapability,
    isMultiToolbarMode,
  } = useToolbarContext();

  const {
    clearSelection,
    navigateToElement,
    clearSelectionCache,
  } = useSelection();

const {
  isPickerVisible,
  pickerPosition,
  pickerSectionId,
  pickerOptions,
  hideElementPicker,
  handleElementSelect,
} = useElementPicker();

  const colorTokens = getColorTokens();

  // Debug logging for sections rendering (throttled)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🖼️ MainContent render:', {
        sectionsLength: sections.length,
        sections: sections,
        contentKeys: Object.keys(content),
        mode: mode,
        selectedSection: selectedSection
      });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [sections.length, mode, selectedSection]);

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

  // Clear selection cache when sections change
  useEffect(() => {
    clearSelectionCache();
  }, [sections, clearSelectionCache]);

  // Enhanced section click handler
 // Enhanced section click handler with context awareness
  const handleSectionClick = (sectionId: string, event: React.MouseEvent) => {
    if (mode !== 'edit') return;

    const startTime = performance.now();
    
    const isCtrlClick = event.ctrlKey || event.metaKey;
    const isShiftClick = event.shiftKey;
    
    if (isCtrlClick) {
      // Multi-select toggle
      const currentMulti = multiSelection.includes(sectionId) 
        ? multiSelection.filter(id => id !== sectionId)
        : [...multiSelection, sectionId];
      useEditStore.setState(state => {
        state.multiSelection = currentMulti;
      });
    } else if (isShiftClick && selectedSection) {
      // Range selection
      const allSections = sections;
      const startIndex = allSections.indexOf(selectedSection);
      const endIndex = allSections.indexOf(sectionId);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const rangeStart = Math.min(startIndex, endIndex);
        const rangeEnd = Math.max(startIndex, endIndex);
        const rangeSelection = allSections.slice(rangeStart, rangeEnd + 1);
        useEditStore.setState(state => {
          state.multiSelection = rangeSelection;
        });
      }
    } else {
      // Single selection with context-aware toolbar
      setActiveSection(sectionId);
      useEditStore.setState(state => {
        state.multiSelection = [];
      });
      
      // Use context-aware section toolbar
      showSectionToolbar(sectionId);
    }

    trackPerformance('section-selection', startTime);
    
    const selectionType = isCtrlClick ? 'multi-selected' : isShiftClick ? 'range-selected' : 'selected';
    const contextInfo = currentContext ? ` with ${currentContext.capabilities.length} available actions` : '';
    announceLiveRegion(`${selectionType} section ${sectionId}${contextInfo}`);
  };

// Enhanced element click handler with smart positioning
// Enhanced element click handler with full context analysis
  const handleElementClick = (sectionId: string, elementKey: string, event: React.MouseEvent) => {
    if (mode !== 'edit') return;

    const startTime = performance.now();
    
    event.stopPropagation();
    
    // Get the actual DOM element for context analysis
    const targetElement = event.currentTarget as HTMLElement;
    const elementSelector = `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`;
    const actualElement = document.querySelector(elementSelector) as HTMLElement || targetElement;
    
    // Analyze element context to determine appropriate toolbar
    const elementContext = analyzeElementContext(actualElement);
    
    // Calculate position for toolbar
    const rect = actualElement.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };

    // Update store with element selection
    selectElement({
      sectionId,
      elementKey,
      type: elementContext.elementType as any,
      editMode: 'inline',
    });

    // Clear multi-selection when selecting element
    useEditStore.setState(state => {
      state.multiSelection = [];
    });

    // Show element toolbar with calculated position (use timeout to avoid infinite loop)
    const elementId = `${sectionId}.${elementKey}`;
    setTimeout(() => {
      showElementToolbar(elementId, position);
    }, 0);

    console.log('🎯 Element selected, toolbar should show:', { elementId, position });

    trackPerformance('element-selection', startTime);
    
    // Enhanced announcement with context information
    const toolbarInfo = elementContext.toolbarType;
    const capabilityCount = elementContext.capabilities.length;
    const multiToolbarInfo = isMultiToolbarMode ? ' (multi-toolbar)' : '';
    
    announceLiveRegion(
      `Selected ${elementKey} - ${toolbarInfo} toolbar with ${capabilityCount} actions${multiToolbarInfo}`
    );
  };

  // Enhanced generic click handler for complex scenarios
  const handleAdvancedClick = (event: React.MouseEvent) => {
    if (mode !== 'edit') return;

    const target = event.target as HTMLElement;
    
    // Use the context-aware click handler
    handleContextualClick(event.nativeEvent, target);
  };

 const executeContextualAction = (actionId: string, additionalParams?: any) => {
  if (!hasCapability(actionId)) {
    console.warn(`Action ${actionId} is not available in current context`);
    return;
  }

  const actions = getContextualActions();
  const action = actions.find(a => a.id === actionId);
  
  if (!action?.enabled) {
    console.warn(`Action ${actionId} is disabled`);
    return;
  }

  // Execute the action based on type and context
  switch (actionId) {
    case 'regenerate':
    case 'regenerate-section':
      if (selectedSection) {
        useEditStore.getState().regenerateSection(selectedSection);
      }
      break;
      
    case 'regenerate-copy':
      if (selectedElement) {
        useEditStore.getState().regenerateElement(selectedElement.sectionId, selectedElement.elementKey);
      }
      break;
      
    case 'get-variations':
      if (selectedElement) {
        useEditStore.getState().regenerateElement(selectedElement.sectionId, selectedElement.elementKey, 5);
      }
      break;
      
    case 'convert-form':
      if (selectedElement) {
        useEditStore.getState().convertCTAToForm(selectedElement.sectionId, selectedElement.elementKey);
      }
      break;
      
    case 'duplicate':
    case 'duplicate-section':
      if (selectedSection) {
        useEditStore.getState().duplicateSection(selectedSection);
      }
      break;
      
    case 'delete':
      if (selectedElement && selectedSection) {
        // Delete element logic
        if (confirm('Are you sure you want to delete this element?')) {
          // Implementation for element deletion
          console.log('Delete element:', selectedElement.elementKey);
        }
      }
      break;
      
    case 'change-layout':
      if (selectedSection) {
        // Open layout picker modal
        console.log('Open layout picker for section:', selectedSection);
      }
      break;
      
    case 'add-element':
      if (selectedSection) {
        // Open element picker
        console.log('Open element picker for section:', selectedSection);
      }
      break;
      
    default:
      console.log('Execute action:', actionId, 'with params:', additionalParams);
  }
  
  // Announce action execution
  announceLiveRegion(`Executed ${action.name}`);
};

  // Enhanced content update handler
  const handleContentUpdate = (sectionId: string, elementKey: string, value: string) => {
    const startTime = performance.now();
    
    updateElementContent(sectionId, elementKey, value);
    trackPerformance('content-update', startTime);
    
    // Announce change for screen readers
    announceLiveRegion(`Updated ${elementKey} content`);
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

  // Fix: Use the correct addSection signature (type, position)
  const position = afterSectionId ? sections.indexOf(afterSectionId) + 1 : undefined;
  const newSectionId = addSection('hero', position);

  // Then update the section content separately using updateElementContent
  const store = useEditStore.getState();
  
  // Set the section layout first
  store.setSection(newSectionId, {
    layout: 'hero-centered',
    elements: {}, // Empty elements object initially
  });
  
  // Add content using updateElementContent which handles proper element types
  store.updateElementContent(newSectionId, 'headline', 'New Section Headline');
  store.updateElementContent(newSectionId, 'subheadline', 'Add your content here');
  store.updateElementContent(newSectionId, 'cta', 'Get Started');

  // Auto-select the new section
  setActiveSection(newSectionId);
  announceLiveRegion(`Added new section`);
};

  // Handle section drag and drop
  const handleSectionDragStart = (sectionId: string, event: React.DragEvent) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', sectionId);
      event.dataTransfer.effectAllowed = 'move';
    }
    
    setActiveSection(sectionId);
  };

  const handleSectionDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleSectionDrop = (targetSectionId: string, position: 'before' | 'after', event: React.DragEvent) => {
    event.preventDefault();
    
    const draggedSectionId = event.dataTransfer?.getData('text/plain');
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;
    
    const currentSections = [...sections];
    const draggedIndex = currentSections.indexOf(draggedSectionId);
    const targetIndex = currentSections.indexOf(targetSectionId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged section
    currentSections.splice(draggedIndex, 1);
    
    // Calculate new position
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const newIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;
    
    // Insert at new position
    currentSections.splice(newIndex, 0, draggedSectionId);
    
    reorderSections(currentSections);
    announceLiveRegion(`Moved section ${draggedSectionId} ${position} ${targetSectionId}`);
  };

  // Clear selection on background click
 const handleBackgroundClick = (event: React.MouseEvent) => {
  // Only clear if clicking directly on the background, not on children
  if (event.target === event.currentTarget) {
    clearSelection();
    hideElementPicker(); // ADD THIS LINE
    announceLiveRegion('Cleared selection');
  }
};

  // Handle escape key for clearing selection
 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && mode === 'edit') {
      clearSelection();
      hideElementPicker(); // ADD THIS LINE
      announceLiveRegion('Cleared selection');
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [mode, clearSelection, hideElementPicker, announceLiveRegion]);

  return (
    <SelectionSystem>
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-gray-50 relative"
        style={{ maxHeight: '100vh' }}
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

                  {/* Section Container with Element Detection */}
                  <ElementDetector sectionId={sectionId}>
                    <div
                      className={`
                        relative transition-all duration-200 cursor-pointer
                        ${selectedSection === sectionId 
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50' 
                          : multiSelection.includes(sectionId)
                          ? 'ring-2 ring-purple-500 ring-dashed ring-offset-2 ring-offset-gray-50'
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
                      aria-selected={selectedSection === sectionId || multiSelection.includes(sectionId)}
                    >
                      {/* Section Content */}
                      <EditablePageRenderer
                        sectionId={sectionId}
                        sectionData={content[sectionId]}
                        layout={sectionLayouts[sectionId] || content[sectionId]?.layout || 'default'}  // ← Gets correct layout
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
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
                                {content[sectionId]?.layout || 'Section'}
                              </span>
                              {/* Multi-selection indicator */}
                              {multiSelection.includes(sectionId) && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
                                  {multiSelection.indexOf(sectionId) + 1}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Drag Handle */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 bg-white border border-gray-200 rounded cursor-move shadow-sm">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 01-2 2h-2" />
                              </svg>
                            </div>
                          </div>

                          {/* Selection Status Indicator */}
                          {(selectedSection === sectionId || multiSelection.includes(sectionId)) && (
                            <div className="absolute bottom-2 left-2">
                              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded shadow-sm">
                                {selectedSection === sectionId && (
                                  <>
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Selected</span>
                                  </>
                                )}
                                {multiSelection.includes(sectionId) && !selectedSection && (
                                  <>
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>Multi-selected ({multiSelection.indexOf(sectionId) + 1})</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ElementDetector>

                  {/* Drop Zone (After) */}
                  <div
                    className="h-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onDragOver={handleSectionDragOver}
                    onDrop={(e) => handleSectionDrop(sectionId, 'after', e)}
                  >
                    <div className="h-full bg-blue-200 rounded mx-4" />
                  </div>

                  {/* Element Boundary Visualizer (Debug Mode) */}
                  <ElementBoundaryVisualizer sectionId={sectionId} />
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

          {/* Element Picker */}
                  {isPickerVisible && pickerSectionId && (
                    <ElementPicker
                      sectionId={pickerSectionId}
                      isVisible={isPickerVisible}
                      position={pickerPosition}
                      onElementSelect={handleElementSelect}
                      onClose={hideElementPicker}
                      options={pickerOptions}
                    />
                  )}
        {/* Floating Toolbars */}
        <FloatingToolbars />

        {/* Multi-Selection Controls */}
        {mode === 'edit' && multiSelection.length > 1 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {multiSelection.length} sections selected
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Bulk delete selected sections
                      if (confirm(`Delete ${multiSelection.length} selected sections?`)) {
                        multiSelection.forEach(sectionId => {
                          useEditStore.getState().removeSection(sectionId);
                        });
                        useEditStore.setState(state => {
                          state.multiSelection = [];
                        });
                        announceLiveRegion(`Deleted ${multiSelection.length} sections`);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete All
                  </button>
                  
                  <button
                    onClick={() => {
                      // Duplicate selected sections
                      multiSelection.forEach(sectionId => {
                        useEditStore.getState().duplicateSection(sectionId);
                      });
                      announceLiveRegion(`Duplicated ${multiSelection.length} sections`);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Duplicate All
                  </button>
                  
                  <button
                    onClick={() => {
                      useEditStore.setState(state => {
                        state.multiSelection = [];
                      });
                      announceLiveRegion('Cleared multi-selection');
                    }}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Selection Status Panel (Edit Mode) */}
        {mode === 'edit' && (selectedSection || selectedElement) && (
          <div className="fixed top-16 left-4 z-40">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
              <div className="text-sm">
                <div className="font-medium text-gray-700 mb-1">Current Selection</div>
                
                {selectedElement && (
                  <div className="text-green-600">
                    <strong>Element:</strong> {selectedElement.elementKey}
                    <br />
                    <span className="text-gray-500">in {selectedElement.sectionId}</span>
                  </div>
                )}
                
                {selectedSection && !selectedElement && (
                  <div className="text-blue-600">
                    <strong>Section:</strong> {selectedSection}
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">?</kbd> for keyboard shortcuts
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Navigation Helper */}
        <KeyboardNavigationHelper />

        {/* Performance Monitor (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 z-50">
            <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded font-mono">
              <div>Sections: {sections.length}</div>
              <div>Selected: {selectedSection || 'None'}</div>
              <div>Multi: {multiSelection.length}</div>
              {selectedElement && (
                <div>Element: {selectedElement.elementKey}</div>
              )}
              {isPickerVisible && (
        <div className="text-yellow-300">Element Picker: Open</div>
      )}
            </div>
          </div>
        )}
      </main>
    </SelectionSystem>
  );
}