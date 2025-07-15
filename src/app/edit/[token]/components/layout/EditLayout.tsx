// /app/edit/[token]/components/layout/EditLayout.tsx
"use client";

import React, { useEffect, useCallback } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useEditor } from '@/hooks/useEditor';
import { GlobalAppHeader } from './GlobalAppHeader';
import { EditHeader } from './EditHeader';
import { LeftPanel } from './LeftPanel';
import { MainContent } from './MainContent';
import { useAutoSave } from '@/hooks/useAutoSave';

interface EditLayoutProps {
  tokenId: string;
}


export function EditLayout({ tokenId }: EditLayoutProps) {
  const {
    leftPanel,
    mode,
    updateViewportInfo,
    handleKeyboardShortcut,
    getColorTokens,
  } = useEditStore();

  // Initialize unified editor system
  const editor = useEditor();

  const { status, actions } = useAutoSave({
  enableAutoSave: true,
  enableVersioning: true,
});

  const colorTokens = getColorTokens();

  // Handle responsive viewport changes
  useEffect(() => {
    const handleResize = () => {
      updateViewportInfo();
    };

    window.addEventListener('resize', handleResize);
    
    // Initial viewport setup
    updateViewportInfo();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateViewportInfo]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyboardShortcut(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyboardShortcut]);

  // Prevent context menu in edit mode for cleaner UX
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    if (mode === 'edit') {
      event.preventDefault();
    }
  }, [mode]);

  return (
    <div 
      className="h-screen flex flex-col bg-gray-50 font-inter"
      onContextMenu={handleContextMenu}
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Global App Header */}
      <GlobalAppHeader tokenId={tokenId} />
      
      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Collapsible */}
        <div 
          className={`
            transition-all duration-300 ease-in-out border-r border-gray-200 bg-white
            ${leftPanel.collapsed 
              ? 'w-12 lg:w-12' 
              : `w-[${leftPanel.width}px]`
            }
            lg:relative absolute lg:static z-30 lg:z-auto
            ${leftPanel.collapsed ? '' : 'shadow-lg lg:shadow-none'}
          `}
          style={{
            width: leftPanel.collapsed ? '48px' : `${leftPanel.width}px`,
            maxWidth: leftPanel.collapsed ? '48px' : '500px',
            minWidth: leftPanel.collapsed ? '48px' : '250px',
          }}
        >
          <LeftPanel tokenId={tokenId} />
        </div>

        {/* Mobile Overlay for Left Panel */}
        {!leftPanel.collapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden"
            onClick={() => useEditStore.getState().toggleLeftPanel()}
          />
        )}

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Edit Header */}
          <EditHeader tokenId={tokenId} />
          
          {/* Main Content Area */}
          <MainContent tokenId={tokenId} />
        </div>
      </div>

      {/* Live Region for Screen Reader Announcements */}
      <div
        id="edit-store-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="absolute -left-[10000px] w-px h-px overflow-hidden"
      />
    </div>
  );
}