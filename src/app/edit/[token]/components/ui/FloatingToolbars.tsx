// app/edit/[token]/components/ui/FloatingToolbars.tsx
import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';

export function FloatingToolbars() {
  const { 
    ui: { floatingToolbars, selectedSection, selectedElement }
  } = useEditStore();

  return (
    <div className="floating-toolbars-container">
      {/* Section Toolbar Placeholder */}
      {floatingToolbars.section.visible && selectedSection && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
          style={{
            left: floatingToolbars.section.position.x,
            top: floatingToolbars.section.position.y,
          }}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Section: {selectedSection}</span>
            <div className="w-px h-4 bg-gray-300" />
            <span>Toolbar coming soon</span>
          </div>
        </div>
      )}

      {/* Element Toolbar Placeholder */}
      {floatingToolbars.element.visible && selectedElement && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
          style={{
            left: floatingToolbars.element.position.x,
            top: floatingToolbars.element.position.y,
          }}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Element: {selectedElement.elementKey}</span>
            <div className="w-px h-4 bg-gray-300" />
            <span>Toolbar coming soon</span>
          </div>
        </div>
      )}
    </div>
  );
}