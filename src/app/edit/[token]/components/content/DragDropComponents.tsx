import React, { forwardRef } from 'react';
import { useDragDrop } from '@/hooks/useDragDrop';

// Section Drop Zone Component
export function SectionDropZone({ 
  targetSectionId, 
  position 
}: {
  targetSectionId: string;
  position: 'before' | 'after';
}) {
  const { dragDropState, handleSectionDrop } = useDragDrop();

  if (!dragDropState.isDragging || dragDropState.draggedType !== 'section') {
    return null;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedSectionId = e.dataTransfer.getData('application/section-id');
    if (draggedSectionId) {
      handleSectionDrop(draggedSectionId, targetSectionId, position);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`section-drop-zone ${position} transition-all duration-200`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={() => {}}
      onDragLeave={() => {}}
    >
      <div className="drop-zone-indicator opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="drop-zone-line h-1 bg-blue-500 rounded-full shadow-lg">
          <div className="drop-zone-pulse absolute inset-0 bg-blue-400 rounded-full animate-ping"></div>
        </div>
        <div className="drop-zone-message mt-2 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Drop section {position === 'before' ? 'above' : 'below'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Element Drop Zone Component
export function ElementDropZone({ 
  sectionId, 
  targetElementKey, 
  position 
}: {
  sectionId: string;
  targetElementKey: string;
  position: 'before' | 'after';
}) {
  const { dragDropState, handleElementDrop, handleCrossSectionDrop } = useDragDrop();

  if (!dragDropState.isDragging || dragDropState.draggedType !== 'element') {
    return null;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedElementData = e.dataTransfer.getData('application/element-id');
    
    if (draggedElementData) {
      const [draggedSectionId, draggedElementKey] = draggedElementData.split('.');
      
      if (draggedSectionId === sectionId) {
        // Same section reordering
        handleElementDrop(sectionId, draggedElementKey, targetElementKey, position);
      } else {
        // Cross-section movement
        const targetElement = document.querySelector(
          `[data-section-id="${sectionId}"] [data-element-key="${targetElementKey}"]`
        );
        const targetElements = Array.from(
          document.querySelectorAll(`[data-section-id="${sectionId}"] [data-element-key]`)
        );
        const targetPosition = targetElements.indexOf(targetElement!) + (position === 'after' ? 1 : 0);
        
        handleCrossSectionDrop(draggedSectionId, sectionId, draggedElementKey, targetPosition);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`element-drop-zone ${position} transition-all duration-200`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="drop-zone-indicator opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="drop-zone-line h-0.5 bg-green-500 rounded-full shadow-md">
          <div className="drop-zone-pulse absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
        </div>
        <div className="drop-zone-message mt-1 text-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Drop element {position}
          </span>
        </div>
      </div>
    </div>
  );
}

// Section Drag Handle Component
export function SectionDragHandle({ sectionId }: { sectionId: string }) {
  const { handleSectionDragStart, config } = useDragDrop();

  if (!config.enableSections) return null;

  return (
    <div
      className="section-drag-handle opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
      draggable
      onDragStart={(e) => handleSectionDragStart(sectionId, e.nativeEvent)}
      title="Drag to reorder section"
    >
      <div className="drag-handle-icon p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50">
        <svg 
          className="w-4 h-4 text-gray-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
}

// Element Drag Handle Component
export function ElementDragHandle({ 
  sectionId, 
  elementKey 
}: { 
  sectionId: string; 
  elementKey: string; 
}) {
  const { handleElementDragStart, config } = useDragDrop();

  if (!config.enableElements) return null;

  return (
    <div
      className="element-drag-handle opacity-0 group-hover:opacity-100 transition-opacity cursor-move absolute -left-8 top-0"
      draggable
      onDragStart={(e) => handleElementDragStart(sectionId, elementKey, e.nativeEvent)}
      title="Drag to reorder element"
    >
      <div className="drag-handle-icon p-1 bg-white rounded shadow-md border border-gray-200 hover:bg-gray-50">
        <svg 
          className="w-3 h-3 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>
    </div>
  );
}

// Drag Preview Component
export function DragPreview({ 
  type, 
  content, 
  position 
}: { 
  type: 'section' | 'element'; 
  content: string; 
  position: { x: number; y: number };
}) {
  const { dragDropState, config } = useDragDrop();

  if (!dragDropState.isDragging || !config.dragPreview) return null;

  return (
    <div
      className="drag-preview fixed z-[9999] pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y + 10,
        transform: 'rotate(2deg)',
      }}
    >
      <div className={`
        max-w-[300px] max-h-[200px] overflow-hidden rounded-lg shadow-2xl
        ${type === 'section' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-green-50 border border-green-500'}
        opacity-90
      `}>
        <div className={`
          px-3 py-2 text-sm font-medium truncate
          ${type === 'section' ? 'text-blue-800' : 'text-green-800'}
        `}>
          {type === 'section' ? '📄' : '📝'} {content}
        </div>
      </div>
    </div>
  );
}

// Drag Overlay Component
export function DragOverlay({ 
  isDragging, 
  children 
}: { 
  isDragging: boolean; 
  children: React.ReactNode;
}) {
  if (!isDragging) return <>{children}</>;

  return (
    <div className="drag-overlay relative">
      {children}
      <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-blue-800">Dragging...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Section Wrapper with drag-drop support
export const DraggableSection = forwardRef<
  HTMLElement,
  {
    sectionId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    showDropZones?: boolean;
  }
>(({ sectionId, children, className = '', style, showDropZones = true }, ref) => {
  const { dragDropState, config } = useDragDrop();
  const sections = document.querySelectorAll('[data-section-id]');
  const sectionIndex = Array.from(sections).findIndex(
    el => el.getAttribute('data-section-id') === sectionId
  );
  
  return (
    <div className="draggable-section-container relative group">
      {/* Drop zone before section */}
      {showDropZones && sectionIndex > 0 && (
        <SectionDropZone targetSectionId={sectionId} position="before" />
      )}
      
      <section
        ref={ref}
        data-section-id={sectionId}
        className={`
          relative transition-all duration-200
          ${dragDropState.isDragging && dragDropState.draggedId === sectionId 
            ? 'opacity-50 transform scale-95' 
            : ''
          }
          ${className}
        `}
        style={style}
      >
        {/* Section drag handle */}
        <div className="absolute -left-12 top-4 z-10">
          <SectionDragHandle sectionId={sectionId} />
        </div>
        
        {children}
      </section>
      
      {/* Drop zone after section */}
      {showDropZones && (
        <SectionDropZone targetSectionId={sectionId} position="after" />
      )}
    </div>
  );
});

DraggableSection.displayName = 'DraggableSection';

// Enhanced Element Wrapper with drag-drop support
export const DraggableElement = forwardRef<
  HTMLDivElement,
  {
    sectionId: string;
    elementKey: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    showDropZones?: boolean;
  }
>(({ sectionId, elementKey, children, className = '', style, showDropZones = true }, ref) => {
  const { dragDropState, config } = useDragDrop();
  const isBeingDragged = dragDropState.isDragging && 
    dragDropState.draggedId === elementKey && 
    dragDropState.draggedFromSection === sectionId;
  
  return (
    <div className="draggable-element-container relative group">
      {/* Drop zone before element */}
      {showDropZones && (
        <ElementDropZone 
          sectionId={sectionId} 
          targetElementKey={elementKey} 
          position="before" 
        />
      )}
      
      <div
        ref={ref}
        data-element-key={elementKey}
        className={`
          relative transition-all duration-200
          ${isBeingDragged ? 'opacity-50 transform scale-95' : ''}
          ${className}
        `}
        style={style}
      >
        {/* Element drag handle */}
        <ElementDragHandle sectionId={sectionId} elementKey={elementKey} />
        
        {children}
      </div>
      
      {/* Drop zone after element */}
      {showDropZones && (
        <ElementDropZone 
          sectionId={sectionId} 
          targetElementKey={elementKey} 
          position="after" 
        />
      )}
    </div>
  );
});

DraggableElement.displayName = 'DraggableElement';

// Global Drag Drop Provider
export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const { dragDropState, config } = useDragDrop();
  
  return (
    <div className="drag-drop-provider">
      {children}
      
      {/* Global drag preview */}
      {dragDropState.isDragging && dragDropState.currentPosition && (
        <DragPreview
          type={dragDropState.draggedType!}
          content={dragDropState.draggedId!}
          position={dragDropState.currentPosition}
        />
      )}
      
      {/* Global drag overlay styles */}
      {dragDropState.isDragging && (
        <style jsx global>{`
          .drag-drop-zone-active {
            background-color: rgba(59, 130, 246, 0.1) !important;
            border: 2px dashed #3B82F6 !important;
            border-radius: 8px !important;
          }
          
          .drop-zone-indicator {
            opacity: 1 !important;
            animation: pulse 1s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          
          body {
            cursor: ${dragDropState.isDragging ? 'grabbing' : 'inherit'} !important;
          }
          
          * {
            user-select: ${dragDropState.isDragging ? 'none' : 'inherit'} !important;
          }
        `}</style>
      )}
    </div>
  );
}