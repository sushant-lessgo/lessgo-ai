// /app/edit/[token]/components/layout/EditHeader.tsx
"use client";

import React from 'react';
import { ThemePopover } from '../ui/ThemePopover';
import { ServiceThemePopover } from '../ui/ServiceThemePopover';
import { VestriaThemePopover } from '../ui/VestriaThemePopover';
import { EditHeaderRightPanel } from './EditHeaderRightPanel';
import { ReviewPill } from '../ui/ReviewPill';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useReviewState } from '@/hooks/useReviewState';
import { usesTemplateModule } from '@/types/service';

interface EditHeaderProps {
  tokenId: string;
}

export function EditHeader({ tokenId }: EditHeaderProps) {
  const { audienceType, templateId } = useEditStore();
  const { allComplete } = useReviewState();
  const isService = audienceType === 'service';
  const usesTemplate = usesTemplateModule(audienceType, templateId);

  // Design-system control selection:
  //  - Service templates get the template/variant/palette picker (fit-filtered
  //    template swap via TemplateSwapList, scale-07 phase 7).
  //  - Product template-module projects (meridian/vestria/techpremium) get the
  //    product picker — meridian is UNLOCKED (scale-07 phase 7): the old static
  //    "locked for the pilot" label is gone; swap targets come from the same
  //    fit-filtered shortlist (only templates that render every section this
  //    site has, same copy engine).
  //  - Writer (granth, white-glove) template projects show no theme controls —
  //    the legacy ThemePopover targets the old product color system and must
  //    not surface for template-module projects.
  //  - Legacy (non-template) product keeps the old theme panel.
  let designControls: React.ReactNode;
  if (isService) {
    designControls = <ServiceThemePopover />;
  } else if (usesTemplate && audienceType === 'product') {
    designControls = <VestriaThemePopover />;
  } else if (usesTemplate) {
    designControls = null;
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

      {/* Center: Setup guide pill (hidden once every guide task is done) */}
      <div className="flex-1 flex justify-center">
        {!allComplete && <ReviewPill />}
      </div>

      {/* Right Section - Action Controls */}
      <EditHeaderRightPanel tokenId={tokenId} />
    </header>
  );
}
