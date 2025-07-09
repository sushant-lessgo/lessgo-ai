// app/edit/[token]/components/ui/EditablePageRenderer.tsx - Enhanced with selection attributes
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
  
  // Create enhanced props that wrap content with selection attributes
  const enhancedProps = React.useMemo(() => {
    if (mode !== 'edit' || !sectionData?.elements) {
      return { ...sectionData, backgroundType, className: '' };
    }

    const enhancedElements: any = {};
    
    Object.entries(sectionData.elements).forEach(([elementKey, elementData]: [string, any]) => {
      const originalContent = elementData.content;
      
      // For text elements, wrap with selectable wrapper
      if (elementData.type === 'text' || elementData.type === 'headline' || elementData.type === 'subheadline') {
        enhancedElements[elementKey] = {
          ...elementData,
          content: (
            <SelectableElementWrapper
              elementKey={elementKey}
              mode={mode}
              onClick={onElementClick(elementKey)}
              className="editable-text-element"
            >
              {typeof originalContent === 'string' ? (
                <EditableTextContent
                  content={originalContent}
                  onUpdate={onContentUpdate(elementKey)}
                  mode={mode}
                  elementType={elementData.type}
                />
              ) : (
                originalContent
              )}
            </SelectableElementWrapper>
          ),
        };
      }
      // For button elements
      else if (elementData.type === 'button') {
        enhancedElements[elementKey] = {
          ...elementData,
          content: (
            <SelectableElementWrapper
              elementKey={elementKey}
              mode={mode}
              onClick={onElementClick(elementKey)}
              className="editable-button-element"
            >
              <EditableButtonContent
                content={originalContent}
                onUpdate={onContentUpdate(elementKey)}
                mode={mode}
                colorTokens={colorTokens}
              />
            </SelectableElementWrapper>
          ),
        };
      }
      // For image elements
      else if (elementData.type === 'image') {
        enhancedElements[elementKey] = {
          ...elementData,
          content: (
            <SelectableElementWrapper
              elementKey={elementKey}
              mode={mode}
              onClick={onElementClick(elementKey)}
              className="editable-image-element"
            >
              <EditableImageContent
                content={originalContent}
                onUpdate={onContentUpdate(elementKey)}
                mode={mode}
              />
            </SelectableElementWrapper>
          ),
        };
      }
      // For list elements
      else if (elementData.type === 'list') {
        enhancedElements[elementKey] = {
          ...elementData,
          content: (
            <SelectableElementWrapper
              elementKey={elementKey}
              mode={mode}
              onClick={onElementClick(elementKey)}
              className="editable-list-element"
            >
              <EditableListContent
                content={originalContent}
                onUpdate={onContentUpdate(elementKey)}
                mode={mode}
              />
            </SelectableElementWrapper>
          ),
        };
      }
      // Default fallback for other element types
      else {
        enhancedElements[elementKey] = {
          ...elementData,
          content: (
            <SelectableElementWrapper
              elementKey={elementKey}
              mode={mode}
              onClick={onElementClick(elementKey)}
              className={`editable-${elementData.type}-element`}
            >
              {originalContent}
            </SelectableElementWrapper>
          ),
        };
      }
    });

    return {
      ...sectionData,
      elements: enhancedElements,
      backgroundType,
      className: '',
    };
  }, [sectionData, mode, backgroundType, onElementClick, onContentUpdate, colorTokens]);

  return (
    <LayoutComponent
      sectionId={sectionId}
      {...enhancedProps}
    />
  );
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
      onDoubleClick={handleDoubleClick}
      className="cursor-text hover:bg-blue-50 hover:bg-opacity-50 rounded px-1 transition-colors"
      title="Double-click to edit"
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