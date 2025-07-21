// app/edit/[token]/components/content/ElementCRUD.tsx - Element management operations

import React, { useState, useCallback, useMemo } from 'react';
import { useElementCRUD } from '@/hooks/useElementCRUD';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { useElementPicker } from '@/hooks/useElementPicker';
import { ElementPicker } from './ElementPicker';
import type { 
  UniversalElementType, 
  UniversalElementInstance, 
  ElementValidationResult 
} from '@/types/universalElements';

interface ElementManagerProps {
  sectionId: string;
  className?: string;
  showValidation?: boolean;
}

export function ElementManager({ sectionId, className = '', showValidation = true }: ElementManagerProps) {
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOverElement, setDragOverElement] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null);

  // Get store context and state
  const { store } = useEditStoreContext();
  const content = useStoreState(state => state.content);
  const storeState = store?.getState();
  const announceLiveRegion = storeState?.announceLiveRegion;
  const {
    getAllElements,
    moveElementUp,
    moveElementDown,
    removeElement,
    duplicateElement,
    reorderElements,
    moveElementToPosition,
    validateElement,
  } = useElementCRUD();

  const {
    isPickerVisible,
    pickerPosition,
    showElementPicker,
    hideElementPicker,
    handleElementSelect,
  } = useElementPicker();

  const section = content[sectionId];
  const elements = getAllElements(sectionId);

  const handleElementClick = useCallback((elementKey: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedElements(prev => 
        prev.includes(elementKey) 
          ? prev.filter(key => key !== elementKey)
          : [...prev, elementKey]
      );
    } else {
      // Single select
      setSelectedElements([elementKey]);
    }
  }, []);

  const handleDragStart = useCallback((elementKey: string, event: React.DragEvent) => {
    event.dataTransfer.setData('elementKey', elementKey);
    event.dataTransfer.setData('sectionId', sectionId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedElement(elementKey);
  }, [sectionId]);

  const handleDragOver = useCallback((targetElementKey: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const position = y < rect.height / 2 ? 'before' : 'after';
    
    setDragOverElement(targetElementKey);
    setDragPosition(position);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverElement(null);
    setDragPosition(null);
  }, []);

  const handleDrop = useCallback((targetElementKey: string, event: React.DragEvent) => {
    event.preventDefault();
    
    const draggedElementKey = event.dataTransfer.getData('elementKey');
    const sourceSectionId = event.dataTransfer.getData('sectionId');
    
    if (draggedElementKey && sourceSectionId === sectionId) {
      const currentElements = getAllElements(sectionId);
      const draggedIndex = currentElements.findIndex(el => el.elementKey === draggedElementKey);
      const targetIndex = currentElements.findIndex(el => el.elementKey === targetElementKey);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newPosition = dragPosition === 'before' ? targetIndex : targetIndex + 1;
        moveElementToPosition(sectionId, draggedElementKey, newPosition);
        announceLiveRegion(`Moved element to position ${newPosition + 1}`);
      }
    }
    
    setDraggedElement(null);
    setDragOverElement(null);
    setDragPosition(null);
  }, [sectionId, dragPosition, getAllElements, moveElementToPosition, announceLiveRegion]);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedElements.length === 0) return;

    try {
      switch (action) {
        case 'duplicate':
          for (const elementKey of selectedElements) {
            await duplicateElement(sectionId, elementKey);
          }
          announceLiveRegion(`Duplicated ${selectedElements.length} elements`);
          break;
        
        case 'delete':
          for (const elementKey of selectedElements) {
            await removeElement(sectionId, elementKey);
          }
          announceLiveRegion(`Deleted ${selectedElements.length} elements`);
          break;
      }
      
      setSelectedElements([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedElements, sectionId, duplicateElement, removeElement, announceLiveRegion]);

  if (!section) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">Section not found</div>
      </div>
    );
  }

  return (
    <div className={`element-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Elements ({elements.length})
        </h3>
        
        <div className="flex items-center space-x-2">
          {selectedElements.length > 0 && (
            <BulkElementActions
              selectedCount={selectedElements.length}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedElements([])}
            />
          )}
          
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              showElementPicker(sectionId, {
                x: rect.left,
                y: rect.bottom + 8,
              });
            }}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Element
          </button>
        </div>
      </div>

      {/* Elements List */}
      {elements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-sm">No elements in this section</div>
          <div className="text-xs mt-1">Add your first element to get started</div>
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map((element, index) => (
            <ElementCard
              key={element.elementKey}
              element={element}
              isSelected={selectedElements.includes(element.elementKey)}
              isDragged={draggedElement === element.elementKey}
              isDragOver={dragOverElement === element.elementKey}
              dragPosition={dragPosition}
              showValidation={showValidation}
              onSelect={(e) => handleElementClick(element.elementKey, e)}
              onDragStart={(e) => handleDragStart(element.elementKey, e)}
              onDragOver={(e) => handleDragOver(element.elementKey, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(element.elementKey, e)}
              onMoveUp={() => moveElementUp(sectionId, element.elementKey)}
              onMoveDown={() => moveElementDown(sectionId, element.elementKey)}
              onDuplicate={() => duplicateElement(sectionId, element.elementKey)}
              onDelete={() => removeElement(sectionId, element.elementKey)}
              canMoveUp={index > 0}
              canMoveDown={index < elements.length - 1}
            />
          ))}
        </div>
      )}

      {/* Element Picker */}
      <ElementPicker
        sectionId={sectionId}
        isVisible={isPickerVisible}
        position={pickerPosition}
        onElementSelect={handleElementSelect}
        onClose={hideElementPicker}
      />
    </div>
  );
}

interface ElementCardProps {
  element: UniversalElementInstance;
  isSelected: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  dragPosition: 'before' | 'after' | null;
  showValidation: boolean;
  onSelect: (event: React.MouseEvent) => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function ElementCard({
  element,
  isSelected,
  isDragged,
  isDragOver,
  dragPosition,
  showValidation,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp,
  canMoveDown,
}: ElementCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getElementTypeIcon = (type: UniversalElementType) => {
    const icons = {
      text: '📝',
      headline: '📰',
      list: '📋',
      button: '🔘',
      link: '🔗',
      image: '🖼️',
      icon: '⭐',
      spacer: '📏',
      container: '📦',
    };
    return icons[type] || '📄';
  };

  const getContentPreview = (content: string | string[]) => {
    if (Array.isArray(content)) {
      return content.slice(0, 2).join(', ') + (content.length > 2 ? '...' : '');
    }
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  return (
    <div className="relative">
      {/* Drop Zone Above */}
      {isDragOver && dragPosition === 'before' && (
        <div className="h-2 bg-blue-100 border-2 border-dashed border-blue-400 rounded mb-2 flex items-center justify-center">
          <span className="text-xs text-blue-600 font-medium">Drop here</span>
        </div>
      )}

      <div
        className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
          isSelected
            ? 'bg-blue-50 border-blue-200'
            : 'bg-white border-gray-200 hover:border-gray-300'
        } ${isDragged ? 'opacity-50' : ''}`}
        onClick={onSelect}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Drag Handle */}
        <div
          className="cursor-move p-1 text-gray-400 hover:text-gray-600 transition-colors mr-3"
          draggable
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </div>

        {/* Element Info */}
        <div className="flex items-center flex-1 min-w-0">
          <span className="text-xl mr-3">
            {getElementTypeIcon(element.type)}
          </span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
              </span>
              
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {element.elementKey}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mt-1 truncate">
              {getContentPreview(element.content)}
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {showValidation && (
          <div className="mr-3">
            <ElementValidationIndicator element={element} />
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center space-x-1 transition-opacity ${
          showActions || isSelected ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Duplicate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this element?')) {
                onDelete();
              }
            }}
            className="p-1 text-red-400 hover:text-red-600"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>

      {/* Drop Zone Below */}
      {isDragOver && dragPosition === 'after' && (
        <div className="h-2 bg-blue-100 border-2 border-dashed border-blue-400 rounded mt-2 flex items-center justify-center">
          <span className="text-xs text-blue-600 font-medium">Drop here</span>
        </div>
      )}
    </div>
  );
}

interface ElementValidationIndicatorProps {
  element: UniversalElementInstance;
}

function ElementValidationIndicator({ element }: ElementValidationIndicatorProps) {
  const validation = element.validation;
  
  const getStatusColor = () => {
    if (validation.isValid) return 'text-green-500';
    if (validation.warnings.length > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (validation.isValid) return '✅';
    if (validation.warnings.length > 0) return '⚠️';
    return '❌';
  };

  return (
    <div 
      className={`text-sm ${getStatusColor()}`}
      title={validation.isValid ? 'Valid element' : `${validation.errors.length} errors, ${validation.warnings.length} warnings`}
    >
      {getStatusIcon()}
    </div>
  );
}

interface BulkElementActionsProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
}

function BulkElementActions({ selectedCount, onBulkAction, onClearSelection }: BulkElementActionsProps) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-900">
        {selectedCount} selected
      </span>
      
      <div className="flex space-x-1">
        <button
          onClick={() => onBulkAction('duplicate')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Duplicate
        </button>
        
        <button
          onClick={() => onBulkAction('delete')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
      
      <button
        onClick={onClearSelection}
        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

// Export all components
export { ElementCard, ElementValidationIndicator, BulkElementActions };