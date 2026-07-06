// /app/edit/[token]/components/layout/EditHeader.tsx
"use client";

import React from 'react';
import { ThemePopover } from '../ui/ThemePopover';
import { ServiceThemePopover } from '../ui/ServiceThemePopover';
import { VestriaThemePopover } from '../ui/VestriaThemePopover';
import { EditHeaderRightPanel } from './EditHeaderRightPanel';
import { ReviewPill } from '../ui/ReviewPill';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { usesTemplateModule, templateLabels } from '@/types/service';

interface EditHeaderProps {
  tokenId: string;
}

const titleCase = (s?: string | null) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : null;

export function EditHeader({ tokenId }: EditHeaderProps) {
  const { audienceType, templateId, paletteId, variantId } = useEditStore();
  const isService = audienceType === 'service';
  const usesTemplate = usesTemplateModule(audienceType, templateId);

  // Design-system control selection:
  //  - Service templates get the template/variant/palette picker.
  //  - Product+Vestria gets the vestria variant/palette/mood picker
  //    (onboarding2 Phase 6).
  //  - Product+Meridian/TechPremium are template projects with the picker
  //    LOCKED for the pilot — show a static, read-only label instead of the
  //    stale legacy theme controls (which target the old product color system).
  //  - Legacy (non-template) product keeps the old theme panel.
  let designControls: React.ReactNode;
  if (isService) {
    designControls = <ServiceThemePopover />;
  } else if (usesTemplate && audienceType === 'product' && templateId === 'vestria') {
    designControls = <VestriaThemePopover />;
  } else if (usesTemplate) {
    const bits = [templateLabels[templateId as keyof typeof templateLabels] || 'Template',
      titleCase(paletteId), titleCase(variantId)].filter(Boolean);
    designControls = (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-600"
        title="Theme is locked for this template during the pilot"
      >
        <span className="w-2 h-2 rounded-full bg-gray-900" />
        <span className="font-medium">{bits.join(' · ')}</span>
      </div>
    );
  } else {
    designControls = <ThemePopover />;
  }

  return (
    <header
      className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50"
    >
      {/* Left Section - Design System (see designControls selection above). */}
      <div className="flex items-center space-x-4">
        {designControls}
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
