// app/edit/[token]/components/content/SectionCRUD.tsx - Section management components
import React, { useState, useCallback } from 'react';
import { useSectionCRUD } from '@/hooks/useSectionCRUD';
import { useEditStore } from '@/hooks/useEditStore';
import type { SectionType } from '@/types/core/content';
import type { AddSectionOptions } from '@/hooks/useSectionCRUD';

interface AddSectionButtonProps {
  position?: number;
  className?: string;
  onSectionAdded?: (sectionId: string) => void;
}

export function AddSectionButton({ position, className = '', onSectionAdded }: AddSectionButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const { addSection } = useSectionCRUD();

  const sectionTypes: Array<{ type: SectionType; label: string; description: string; icon: string }> = [
    { type: 'hero', label: 'Hero Section', description: 'Main header with headline and CTA', icon: '🚀' },
    { type: 'features', label: 'Features', description: 'Highlight key features and benefits', icon: '✨' },
    { type: 'testimonials', label: 'Testimonials', description: 'Customer reviews and social proof', icon: '💬' },
    { type: 'cta', label: 'Call to Action', description: 'Conversion-focused section', icon: '🎯' },
    { type: 'faq', label: 'FAQ', description: 'Frequently asked questions', icon: '❓' },
    { type: 'custom', label: 'Custom Section', description: 'Start with a blank section', icon: '🔧' },
  ];

  const handleAddSection = useCallback(async (sectionType: SectionType) => {
    try {
      const options: AddSectionOptions = {
        sectionType,
        position,
      };
      
      const newSectionId = await addSection(options);
      setShowOptions(false);
      onSectionAdded?.(newSectionId);
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  }, [addSection, position, onSectionAdded]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Section
      </button>

      {showOptions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setShowOptions(false)}
          />
          
          {/* Options Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Section Type</h3>
              
              <div className="space-y-2">
                {sectionTypes.map((sectionType) => (
                  <button
                    key={sectionType.type}
                    onClick={() => handleAddSection(sectionType.type)}
                    className="flex items-start p-3 w-full text-left rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="text-xl mr-3 mt-0.5">{sectionType.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{sectionType.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{sectionType.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface SectionActionsMenuProps {
  sectionId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function SectionActionsMenu({ sectionId, position, onClose }: SectionActionsMenuProps) {
  const { 
    duplicateSection, 
    removeSection, 
    toggleSectionVisibility,
    saveAsTemplate,
    moveSectionUp,
    moveSectionDown,
  } = useSectionCRUD();
  
  const { content, sections } = useEditStore();
  const section = content[sectionId];
  const sectionIndex = sections.indexOf(sectionId);

  const actions = [
    {
      id: 'duplicate',
      label: 'Duplicate Section',
      icon: '📋',
      handler: async () => {
        await duplicateSection(sectionId);
        onClose();
      },
    },
    {
      id: 'move-up',
      label: 'Move Up',
      icon: '⬆️',
      disabled: sectionIndex === 0,
      handler: () => {
        moveSectionUp(sectionId);
        onClose();
      },
    },
    {
      id: 'move-down',
      label: 'Move Down',
      icon: '⬇️',
      disabled: sectionIndex === sections.length - 1,
      handler: () => {
        moveSectionDown(sectionId);
        onClose();
      },
    },
    {
      id: 'visibility',
      label: 'Toggle Section',
      icon: '👁️',
      handler: () => {
        toggleSectionVisibility(sectionId);
        onClose();
      },
    },
    {
      id: 'save-template',
      label: 'Save as Template',
      icon: '💾',
      handler: async () => {
        const templateName = prompt('Enter template name:');
        if (templateName) {
          await saveAsTemplate(sectionId, templateName);
        }
        onClose();
      },
    },
    {
      id: 'divider',
      type: 'divider',
    },
    {
      id: 'delete',
      label: 'Delete Section',
      icon: '🗑️',
      variant: 'danger',
      handler: async () => {
        await removeSection(sectionId);
        onClose();
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-transparent z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div 
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 min-w-48"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {actions.map((action) => {
          if (action.type === 'divider') {
            return <div key={action.id} className="my-1 border-t border-gray-200" />;
          }

          return (
            <button
              key={action.id}
              onClick={action.handler}
              disabled={action.disabled}
              className={`flex items-center w-full px-4 py-2 text-sm text-left transition-colors focus:outline-none ${
                action.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : action.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{action.icon}</span>
              {action.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

interface SectionValidationIndicatorProps {
  sectionId: string;
  showDetails?: boolean;
}

export function SectionValidationIndicator({ sectionId, showDetails = false }: SectionValidationIndicatorProps) {
  const { validateSection } = useSectionCRUD();
  const validation = validateSection(sectionId);

  const getStatusColor = () => {
    if (validation.isValid) return 'text-green-500';
    if (validation.completionPercentage > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (validation.isValid) return '✅';
    if (validation.completionPercentage > 50) return '⚠️';
    return '❌';
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusIcon()}
      </span>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">
            {validation.completionPercentage}% complete
          </span>
          
          {showDetails && !validation.isValid && (
            <div className="text-xs text-red-600">
              Missing: {validation.missingElements.join(', ')}
            </div>
          )}
        </div>
        
        {showDetails && validation.completionPercentage < 100 && (
          <div className="w-20 h-1 bg-gray-200 rounded-full mt-1">
            <div 
              className={`h-1 rounded-full transition-all ${
                validation.isValid ? 'bg-green-500' : 
                validation.completionPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation.completionPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface BulkSectionActionsProps {
  selectedSectionIds: string[];
  onSelectionChange: (sectionIds: string[]) => void;
  onActionComplete?: () => void;
}

export function BulkSectionActions({ selectedSectionIds, onSelectionChange, onActionComplete }: BulkSectionActionsProps) {
  const { 
    batchDeleteSections, 
    hideSections, 
    showSections, 
    duplicateSections 
  } = useSectionCRUD();
  
  const { sections, content } = useEditStore();

  const handleSelectAll = useCallback(() => {
    onSelectionChange(sections);
  }, [sections, onSelectionChange]);

  const handleSelectNone = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleBulkAction = useCallback(async (action: string) => {
    try {
      switch (action) {
        case 'delete':
          await batchDeleteSections(selectedSectionIds);
          break;
        case 'hide':
          hideSections(selectedSectionIds);
          break;
        case 'show':
          showSections(selectedSectionIds);
          break;
        case 'duplicate':
          await duplicateSections(selectedSectionIds);
          break;
      }
      onSelectionChange([]);
      onActionComplete?.();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedSectionIds, batchDeleteSections, hideSections, showSections, duplicateSections, onSelectionChange, onActionComplete]);

  if (selectedSectionIds.length === 0) {
    return null;
  }

  const visibleSections = selectedSectionIds.filter(id => content[id]);
  const hiddenSections: string[] = [];

  return (
    <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-900">
        {selectedSectionIds.length} sections selected
      </span>
      
      <div className="flex space-x-1">
        <button
          onClick={() => handleBulkAction('duplicate')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Duplicate
        </button>
        
        {hiddenSections.length > 0 && (
          <button
            onClick={() => handleBulkAction('show')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Show ({hiddenSections.length})
          </button>
        )}
        
        {visibleSections.length > 0 && (
          <button
            onClick={() => handleBulkAction('hide')}
            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
          >
            Hide ({visibleSections.length})
          </button>
        )}
        
        <button
          onClick={() => handleBulkAction('delete')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
      
      <div className="flex space-x-1 ml-auto">
        <button
          onClick={handleSelectAll}
          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          Select All
        </button>
        
        <button
          onClick={handleSelectNone}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          Select None
        </button>
      </div>
    </div>
  );
}

interface SectionDragHandleProps {
  sectionId: string;
  className?: string;
}

export function SectionDragHandle({ sectionId, className = '' }: SectionDragHandleProps) {
  return (
    <div 
      className={`cursor-move flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('sectionId', sectionId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      title="Drag to reorder section"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    </div>
  );
}

interface SectionDropZoneProps {
  position: number;
  onDrop: (sectionId: string, targetPosition: number) => void;
  isVisible: boolean;
}

export function SectionDropZone({ position, onDrop, isVisible }: SectionDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const sectionId = e.dataTransfer.getData('sectionId');
    if (sectionId) {
      onDrop(sectionId, position);
    }
    setIsDragOver(false);
  }, [onDrop, position]);

  if (!isVisible) return null;

  return (
    <div
      className={`transition-all duration-200 ${
        isDragOver 
          ? 'h-8 bg-blue-100 border-2 border-dashed border-blue-400' 
          : 'h-2 bg-transparent border-2 border-dashed border-transparent hover:border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-blue-600 font-medium">Drop section here</span>
        </div>
      )}
    </div>
  );
}

interface SectionListProps {
  onSectionSelect?: (sectionId: string) => void;
  selectedSectionIds?: string[];
  onSelectionChange?: (sectionIds: string[]) => void;
  showValidation?: boolean;
  allowReordering?: boolean;
}

export function SectionList({ 
  onSectionSelect, 
  selectedSectionIds = [], 
  onSelectionChange,
  showValidation = true,
  allowReordering = true 
}: SectionListProps) {
  const { sections, content } = useEditStore();
  const { moveSectionToPosition } = useSectionCRUD();
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const handleSectionClick = useCallback((sectionId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const newSelection = selectedSectionIds.includes(sectionId)
        ? selectedSectionIds.filter(id => id !== sectionId)
        : [...selectedSectionIds, sectionId];
      onSelectionChange?.(newSelection);
    } else {
      // Single select
      onSectionSelect?.(sectionId);
      onSelectionChange?.([sectionId]);
    }
  }, [selectedSectionIds, onSectionSelect, onSelectionChange]);

  const handleSectionDrop = useCallback((draggedSectionId: string, targetPosition: number) => {
    moveSectionToPosition(draggedSectionId, targetPosition);
    setDragOverPosition(null);
  }, [moveSectionToPosition]);

  const getSectionTypeLabel = (sectionType?: string) => {
    const labels = {
      hero: 'Hero',
      features: 'Features',
      testimonials: 'Testimonials',
      cta: 'Call to Action',
      faq: 'FAQ',
      custom: 'Custom',
    };
    return labels[sectionType as keyof typeof labels] || 'Section';
  };

  const getSectionTypeIcon = (sectionType?: string) => {
    const icons = {
      hero: '🚀',
      features: '✨',
      testimonials: '💬',
      cta: '🎯',
      faq: '❓',
      custom: '🔧',
    };
    return icons[sectionType as keyof typeof icons] || '📄';
  };

  return (
    <div className="space-y-1">
      {allowReordering && (
        <SectionDropZone
          position={0}
          onDrop={handleSectionDrop}
          isVisible={dragOverPosition === 0}
        />
      )}
      
      {sections.map((sectionId, index) => {
        const section = content[sectionId];
        if (!section) return null;

        const isSelected = selectedSectionIds.includes(sectionId);
        const isHidden = false;

        return (
          <React.Fragment key={sectionId}>
            <div
              className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-200'
                  : isHidden
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={(e) => handleSectionClick(sectionId, e)}
            >
              {allowReordering && (
                <SectionDragHandle sectionId={sectionId} className="mr-2" />
              )}
              
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-lg mr-3">
                  {getSectionTypeIcon(sectionId)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {getSectionTypeLabel(sectionId)}
                    </span>
                    
                    {isHidden && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.keys(section.elements || {}).length} elements
                  </div>
                </div>
              </div>
              
              {showValidation && (
                <div className="ml-3">
                  <SectionValidationIndicator sectionId={sectionId} />
                </div>
              )}
              
              <div className="ml-2 flex items-center space-x-1">
                {isSelected && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
            
            {allowReordering && (
              <SectionDropZone
                position={index + 1}
                onDrop={handleSectionDrop}
                isVisible={dragOverPosition === index + 1}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {sections.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-sm">No sections yet</div>
          <div className="text-xs mt-1">Add your first section to get started</div>
        </div>
      )}
    </div>
  );
}

interface SectionTemplatePickerProps {
  onTemplateSelect: (template: any) => void;
  onClose: () => void;
}

export function SectionTemplatePicker({ onTemplateSelect, onClose }: SectionTemplatePickerProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates on mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Load from localStorage for now
        const savedTemplates = JSON.parse(localStorage.getItem('sectionTemplates') || '[]');
        setTemplates(savedTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const defaultTemplates = [
    {
      id: 'hero-startup',
      name: 'Startup Hero',
      sectionType: 'hero',
      preview: '🚀 Bold headline with CTA button',
      description: 'Perfect for SaaS landing pages',
    },
    {
      id: 'features-grid',
      name: 'Feature Grid',
      sectionType: 'features',
      preview: '✨ 3x2 grid layout',
      description: 'Highlight key product features',
    },
    {
      id: 'testimonials-slider',
      name: 'Testimonials Slider',
      sectionType: 'testimonials',
      preview: '💬 Customer reviews carousel',
      description: 'Build trust with social proof',
    },
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Choose Template</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-gray-500">Loading templates...</div>
              </div>
            ) : allTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-sm">No templates available</div>
                <div className="text-xs mt-1">Create sections and save them as templates</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onTemplateSelect(template);
                      onClose();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{template.preview}</div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {template.sectionType}
                      </span>
                      
                      {template.metadata?.createdAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(template.metadata.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Functions are already exported inline