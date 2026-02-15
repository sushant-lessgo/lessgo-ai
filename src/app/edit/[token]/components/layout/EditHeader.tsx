// /app/edit/[token]/components/layout/EditHeader.tsx
"use client";

import React from 'react';
import { ThemePopover } from '../ui/ThemePopover';
import { TypographyControls } from '../ui/TypographyControls';
import { EditHeaderRightPanel } from './EditHeaderRightPanel';

interface EditHeaderProps {
  tokenId: string;
}

export function EditHeader({ tokenId }: EditHeaderProps) {
  return (
    <header
      className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50"
    >
      {/* Left Section - Design System */}
      <div className="flex items-center space-x-4">
        <ThemePopover />
        <TypographyControls />
      </div>

      {/* Right Section - Action Controls */}
      <EditHeaderRightPanel tokenId={tokenId} />
    </header>
  );
}
