// app/edit/[token]/components/ui/EditablePageRenderer.tsx - Enhanced with selection attributes
import React from 'react';
import { getComponent } from '@/modules/generatedLanding/componentRegistry';
import { sectionList } from '@/modules/sections/sectionList';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { InlineTextEditor, defaultEditorConfig } from '@/app/edit/[token]/components/editor/InlineTextEditor';
import { useEditStore } from '@/hooks/useEditStore';
import type { TextFormatState, AutoSaveConfig, InlineEditorConfig, TextSelection } from '@/app/edit/[token]/components/editor/InlineTextEditor';

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

// Enhanced component wrapper that adds selection attributes
const SelectableElementWrapper: React.FC<{
  elementKey: string;
  children: React.ReactNode;
  mode: 'edit' | 'preview';
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
}> = ({ elementKey, children, mode, onClick, className = '' }) => {
  
  if (mode !== 'edit') {
    return <>{children}</>;
  }

  return (
    <div
      data-element-key={elementKey}
      className={`selectable-element ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${elementKey}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as any);
        }
      }}
    >
      {children}
    </div>
  );
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

  // Enhanced element click handler
  const handleElementClick = React.useCallback((elementKey: string) => {
    return (event: React.MouseEvent) => {
      event.stopPropagation();
      onElementClick(sectionId, elementKey, event);
    };
  }, [sectionId, onElementClick]);

  // Enhanced content update handler
  const handleContentUpdate = React.useCallback((elementKey: string) => {
    return (value: string) => {
      onContentUpdate(sectionId, elementKey, value);
    };
  }, [sectionId, onContentUpdate]);

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
        {/* Enhanced Layout Component with Selection Wrappers */}
        <EnhancedLayoutWrapper
          LayoutComponent={LayoutComponent}
          sectionId={sectionId}
          sectionData={sectionData}
          backgroundType={backgroundType}
          mode={mode}
          onElementClick={handleElementClick}
          onContentUpdate={handleContentUpdate}
          colorTokens={colorTokens}
          globalSettings={globalSettings}
        />
        
        {/* AI Generation Badges */}
        {mode === 'edit' && sectionData?.aiMetadata && (
          <div className="absolute top-2 right-2 z-10 flex space-x-1">
            {sectionData.aiMetadata.aiGenerated && !sectionData.aiMetadata.isCustomized && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded shadow-sm">
                🤖 AI Generated
              </span>
            )}
            {sectionData.aiMetadata.isCustomized && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500 text-white rounded shadow-sm">
                ✏️ Customized
              </span>
            )}
            {sectionData.aiMetadata.lastGenerated && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-500 text-white rounded shadow-sm">
                🕒 {new Date(sectionData.aiMetadata.lastGenerated).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Selection Indicator for Section */}
        {mode === 'edit' && isSelected && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded bg-blue-50 bg-opacity-10" />
            <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs font-medium rounded-br">
              Section Selected
            </div>
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

// Enhanced wrapper that adds selection attributes to layout components
const EnhancedLayoutWrapper: React.FC<{
  LayoutComponent: React.ComponentType<any>;
  sectionId: string;
  sectionData: any;
  backgroundType: string;
  mode: 'edit' | 'preview';
  onElementClick: (elementKey: string) => (event: React.MouseEvent) => void;
  onContentUpdate: (elementKey: string) => (value: string) => void;
  colorTokens: any;
  globalSettings: any;
}> = ({
  LayoutComponent,
  sectionId,
  sectionData,
  backgroundType,
  mode,
  onElementClick,
  onContentUpdate,
  colorTokens,
  globalSettings,
}) => {
  
  // The layout component should get its data from the store via useLayoutComponent
  // We only need to pass the essential props
  const originalProps = React.useMemo(() => {
    return {
      sectionId,
      backgroundType,
      className: '',
    };
  }, [sectionId, backgroundType]);

  // Debug what props we're passing to the layout component
  // console.log(`🏧 Rendering layout for ${sectionId}:`, {
  //   LayoutComponent: LayoutComponent.name,
  //   props: originalProps,
  //   sectionDataStructure: {
  //     hasElements: !!sectionData?.elements,
  //     elementKeys: sectionData?.elements ? Object.keys(sectionData.elements) : [],
  //     firstElementType: sectionData?.elements ? typeof Object.values(sectionData.elements)[0] : 'none'
  //   }
  // });

  const RenderedLayout = (
    <LayoutComponent
      {...originalProps}
    />
  );

  // In preview mode, just return the layout as-is
  if (mode !== 'edit') {
    return RenderedLayout;
  }

  // In edit mode, add click handlers and editing overlay
  return (
    <div className="relative" data-section-id={sectionId}>
      {RenderedLayout}
      
      {/* Editing overlay for each element - with delay to ensure DOM is ready */}
      {sectionData?.elements && Object.entries(sectionData.elements).map(([elementKey, elementData]: [string, any]) => {
        console.log(`🗺️ Creating overlay for ${sectionId}.${elementKey}:`, {
          type: elementData.type,
          content: typeof elementData.content === 'string' ? elementData.content.slice(0, 50) : typeof elementData.content,
          hasContent: !!elementData.content,
          isTextElement: elementData.type === 'text' || elementData.type === 'headline' || elementData.type === 'subheadline'
        });
        
        return (
          <ElementEditingOverlay
            key={elementKey}
            sectionId={sectionId}
            elementKey={elementKey}
            elementData={elementData}
            onElementClick={onElementClick(elementKey)}
            onContentUpdate={onContentUpdate(elementKey)}
            mode={mode}
          />
        );
      })}
    </div>
  );
};

// Component to handle editing overlay for individual elements
const ElementEditingOverlay: React.FC<{
  sectionId: string;
  elementKey: string;
  elementData: any;
  onElementClick: (event: React.MouseEvent) => void;
  onContentUpdate: (value: string) => void;
  mode: 'edit' | 'preview';
}> = ({ sectionId, elementKey, elementData, onElementClick, onContentUpdate, mode }) => {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(elementData.content || '');
  const [formatState, setFormatState] = React.useState<TextFormatState>({
    bold: false,
    italic: false,
    underline: false,
    color: '#000000',
    fontSize: '16px',
    fontFamily: 'inherit',
    textAlign: 'left',
    lineHeight: '1.5',
    letterSpacing: 'normal',
    textTransform: 'none',
  });
  
  // Get showTextToolbar from the store
  const showTextToolbar = useEditStore(state => state.showTextToolbar);
  
  // Debug: Log overlay mount
  React.useEffect(() => {
    console.log(`🎯 ElementEditingOverlay mounted for ${sectionId}.${elementKey}:`, {
      type: elementData.type,
      content: elementData.content,
      mode
    });
  }, []);
  
  // Find the actual DOM element using cascading selectors with delay
  React.useEffect(() => {
    // Add a small delay to ensure the layout component has rendered
    const timer = setTimeout(() => {
      // Try multiple selector strategies
      const selectors = [
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`,
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"] h1`,
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"] h2`,
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"] h3`,
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"] p`,
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"] span`,
        `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"] div`,
      ];
      
      let element: HTMLElement | null = null;
      for (const selector of selectors) {
        element = document.querySelector(selector) as HTMLElement;
        if (element) break;
      }
      
      const availableElements = Array.from(document.querySelectorAll(`[data-section-id="${sectionId}"]`)).map(el => ({
        tag: el.tagName,
        content: el.textContent?.slice(0, 30),
        hasElementKey: !!el.getAttribute('data-element-key'),
        elementKey: el.getAttribute('data-element-key')
      }));
      
      console.log(`🎯 Element targeting for ${sectionId}.${elementKey}:`, {
        found: !!element,
        selector: selectors.find(s => document.querySelector(s)),
        elementTag: element?.tagName,
        elementContent: element?.textContent?.slice(0, 50),
        allSelectorsChecked: selectors.map(s => ({ selector: s, found: !!document.querySelector(s) })),
        availableElements,
        searchingFor: elementKey,
        sectionSelector: `[data-section-id="${sectionId}"]`,
        elementSelector: `[data-element-key="${elementKey}"]`
      });
      
      setTargetElement(element);
    }, 100); // 100ms delay to ensure DOM is ready
    
    return () => clearTimeout(timer);
  }, [sectionId, elementKey]);
  
  // Handle text selection changes
  const handleSelectionChange = React.useCallback((selection: TextSelection | null) => {
    console.log('🔤 handleSelectionChange called:', { selection, isCollapsed: selection?.isCollapsed });
    
    if (selection && !selection.isCollapsed) {
      // Calculate position for the text toolbar
      const rect = selection.containerElement.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      
      console.log('🔤 Text selection detected, but using unified toolbar system instead');
      
      // DISABLED: Using unified toolbar system from useEditor instead
      // showTextToolbar(position);
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`🖱️ Element clicked: ${elementKey}`, { type: elementData.type });
    
    // DISABLED: Don't set isEditing here - let useEditor handle all text editing
    // This prevents conflicts between editing systems
    console.log(`🖱️ Click handled by useEditor system for: ${elementKey}`);
    
    onElementClick(e);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== elementData.content) {
      console.log(`💾 Saving content for ${elementKey}:`, { old: elementData.content, new: editValue });
      onContentUpdate(editValue);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(elementData.content);
      setIsEditing(false);
    }
  };
  
  // Don't render overlay if we can't find the target element
  if (!targetElement) {
    return null;
  }
  
  // Add click handler directly to the target element
  React.useEffect(() => {
    if (targetElement && !isEditing) {
      const handleElementClick = (e: MouseEvent) => {
        e.stopPropagation();
        handleClick(e as any);
      };
      
      targetElement.addEventListener('click', handleElementClick);
      targetElement.style.cursor = 'pointer';
      targetElement.classList.add('hover:bg-blue-50', 'hover:bg-opacity-50', 'transition-colors', 'rounded');
      
      return () => {
        targetElement.removeEventListener('click', handleElementClick);
        targetElement.style.cursor = '';
        targetElement.classList.remove('hover:bg-blue-50', 'hover:bg-opacity-50', 'transition-colors', 'rounded');
      };
    }
  }, [targetElement, isEditing]);
  
  // DISABLED: Use the unified text editing system from useEditor hook instead
  // The ElementEditingOverlay conflicts with the useEditor system
  // Let the useEditor handle all text editing to avoid conflicts
  
  // Don't render the overlay editor - let useEditor system handle it
  if (isEditing && targetElement) {
    console.log(`📝 Editing disabled for ${elementKey} - using unified useEditor system instead`);
    return null;
  }
  
  return null;
};

// Editable content components
const EditableTextContent: React.FC<{
  content: string;
  onUpdate: (value: string) => void;
  mode: 'edit' | 'preview';
  elementType: string;
}> = ({ content, onUpdate, mode, elementType }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(content);

  const handleDoubleClick = () => {
    console.log('🖱️ Double click on text element:', { mode, elementType });
    if (mode === 'edit') {
      setIsEditing(true);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log('🖱️ Single click on text element:', { mode, elementType });
    e.stopPropagation();
    if (mode === 'edit') {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== content) {
      onUpdate(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setValue(content);
      setIsEditing(false);
    }
  };

  if (mode !== 'edit') {
    return <span>{content}</span>;
  }

  if (isEditing) {
    console.log('📝 Text editor active for:', { elementType, content, value });
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full bg-transparent border-none outline-none"
        style={{ minWidth: '200px' }}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="cursor-text hover:bg-blue-50 hover:bg-opacity-50 rounded px-1 transition-colors"
      title="Click to edit"
    >
      {content || 'Click to edit'}
    </span>
  );
};

const EditableButtonContent: React.FC<{
  content: string;
  onUpdate: (value: string) => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
}> = ({ content, onUpdate, mode, colorTokens }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(content);

  const handleClick = (e: React.MouseEvent) => {
    if (mode === 'edit') {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== content) {
      onUpdate(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setValue(content);
      setIsEditing(false);
    }
  };

  if (isEditing && mode === 'edit') {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="bg-white border border-gray-300 px-2 py-1 rounded"
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${colorTokens?.ctaBg || 'bg-blue-600'} 
        ${colorTokens?.ctaText || 'text-white'} 
        px-6 py-2 rounded-lg font-medium transition-colors
        ${mode === 'edit' ? 'hover:opacity-80 cursor-pointer' : ''}
      `}
      disabled={mode === 'edit'}
    >
      {content || 'Button Text'}
    </button>
  );
};

const EditableImageContent: React.FC<{
  content: string;
  onUpdate: (value: string) => void;
  mode: 'edit' | 'preview';
}> = ({ content, onUpdate, mode }) => {
  const handleClick = () => {
    if (mode === 'edit') {
      // Open image picker/uploader
      const newImageUrl = prompt('Enter image URL:', content);
      if (newImageUrl) {
        onUpdate(newImageUrl);
      }
    }
  };

  if (!content) {
    return (
      <div
        onClick={handleClick}
        className={`
          w-full h-48 bg-gray-200 border-2 border-dashed border-gray-300 
          flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors
          ${mode === 'edit' ? 'cursor-pointer' : ''}
        `}
      >
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Click to add image</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group ${mode === 'edit' ? 'cursor-pointer' : ''}`}
    >
      <img
        src={content}
        alt="Content image"
        className="w-full h-auto rounded-lg"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
        }}
      />
      {mode === 'edit' && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white px-3 py-1 rounded text-sm font-medium">
            Click to change image
          </div>
        </div>
      )}
    </div>
  );
};

const EditableListContent: React.FC<{
  content: string[] | string;
  onUpdate: (value: string) => void;
  mode: 'edit' | 'preview';
}> = ({ content, onUpdate, mode }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [items, setItems] = React.useState<string[]>(
    Array.isArray(content) ? content : [content]
  );

  const handleClick = () => {
    if (mode === 'edit') {
      setIsEditing(true);
    }
  };

  const handleAddItem = () => {
    setItems([...items, 'New item']);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdate(JSON.stringify(items));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setItems(Array.isArray(content) ? content : [content]);
  };

  if (isEditing && mode === 'edit') {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              className="flex-1 border border-gray-300 px-2 py-1 rounded"
            />
            <button
              onClick={() => handleRemoveItem(index)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="flex space-x-2">
          <button
            onClick={handleAddItem}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Add Item
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul
      onClick={handleClick}
      className={`space-y-1 ${mode === 'edit' ? 'cursor-pointer hover:bg-blue-50 hover:bg-opacity-50 rounded p-1 transition-colors' : ''}`}
    >
      {items.map((item, index) => (
        <li key={index} className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-current rounded-full opacity-60" />
          <span>{item}</span>
        </li>
      ))}
      {mode === 'edit' && (
        <li className="text-sm text-gray-500 italic">Click to edit list</li>
      )}
    </ul>
  );
};