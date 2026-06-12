// /app/edit/[token]/components/layout/EditHeader.tsx
"use client";

import React from 'react';
import { ThemePopover } from '../ui/ThemePopover';
import { ServiceThemePopover } from '../ui/ServiceThemePopover';
import { TypographyControls } from '../ui/TypographyControls';
import { EditHeaderRightPanel } from './EditHeaderRightPanel';
import { ReviewPill } from '../ui/ReviewPill';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface EditHeaderProps {
  tokenId: string;
}

export function EditHeader({ tokenId }: EditHeaderProps) {
  const { audienceType } = useEditStore();
  const isService = audienceType === 'service';

  return (
    <header
      className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50"
    >
      {/* Left Section - Design System. Service projects get the template /
          variant / palette picker; product keeps the legacy theme panel. */}
      <div className="flex items-center space-x-4">
        {isService ? <ServiceThemePopover /> : <ThemePopover />}
        {!isService && <TypographyControls />}
      </div>

      {/* Center: Review counter pill */}
      <div className="flex-1 flex justify-center">
        <ReviewPill />
      </div>

      {/* Right Section - Action Controls */}
      <EditHeaderRightPanel tokenId={tokenId} />
    </header>
  );
}
