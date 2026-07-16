// /app/edit/[token]/components/ui/PreviewButton.tsx
"use client";

import React, { useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { AppIcon } from '@/components/ui/icon';

// Navigation state is OWNED BY THE PARENT (EditHeaderRightPanel), not by this
// button: `usePreviewNavigation` is not pure — its effect drives
// getTabManager()/cleanupTabManager(), and utils/tabManager.ts is a keyed
// singleton with NO refcount whose cleanup unconditionally destroy()s. Calling
// the hook here AND in the parent (same tokenId) gave two owners of one
// lifecycle, and split `isNavigating` so Publish's "Opening…" left Preview live.
// One hook, one owner. Do not re-instantiate it here.
interface PreviewButtonProps {
  onPreviewClick: () => void;
  isNavigating: boolean;
}

export function PreviewButton({ onPreviewClick, isNavigating }: PreviewButtonProps) {
  // Single-field selector: stable getter ref (no whole-store subscription).
  const getColorTokens = useEditStore((s) => s.getColorTokens);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const colorTokens = getColorTokens();
  
  // Add native event listener as a test
  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      const nativeClickHandler = (e: MouseEvent) => {
      };
      
      const mouseDownHandler = (e: MouseEvent) => {
      };
      
      const mouseUpHandler = (e: MouseEvent) => {
      };
      
      button.addEventListener('click', nativeClickHandler);
      button.addEventListener('mousedown', mouseDownHandler);
      button.addEventListener('mouseup', mouseUpHandler);
      
      return () => {
        button.removeEventListener('click', nativeClickHandler);
        button.removeEventListener('mousedown', mouseDownHandler);
        button.removeEventListener('mouseup', mouseUpHandler);
      };
    }
  }, []);
  
  const handleClick = (e: React.MouseEvent) => {
    try {
      onPreviewClick();
    } catch (error) {
      // console.error('❌ Preview click error:', error);
    }
  };

  // t1: this is now the INACTIVE half of the Edit/Preview segmented control that
  // EditHeaderRightPanel draws — hence a ghost segment rather than a blue button.
  // Navigation (`handleClick` / `onPreviewClick`) and the `isNavigating`
  // disabled+"Saving..." states are unchanged.
  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isNavigating}
      className={`
        inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1 text-[13px] font-medium
        text-app-muted transition-colors hover:text-app-ink
        disabled:cursor-wait disabled:opacity-50
      `}
      style={{ pointerEvents: 'auto' }}
      title="Preview your landing page"
    >
      {isNavigating ? (
        <AppIcon name="progress_activity" size={16} className="animate-spin" />
      ) : (
        <AppIcon name="visibility" size={16} />
      )}
      <span>{isNavigating ? 'Saving...' : 'Preview'}</span>
    </button>
  );
}