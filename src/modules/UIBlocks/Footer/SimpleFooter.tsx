import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import HeaderLogo from '@/components/ui/HeaderLogo';

interface SimpleFooterContent {
  copyright?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
};

const SimpleFooter: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<SimpleFooterContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SimpleFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-50 border-t"
    >
      <div className="flex items-center justify-center gap-4 py-8">
        <HeaderLogo 
          mode={mode}
          className="h-8 w-auto object-contain"
        />
        <div className="text-sm text-gray-600">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.copyright || ''}
            onEdit={(value) => handleContentUpdate('copyright', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className="text-sm"
            placeholder="Copyright notice"
            sectionId={sectionId}
            elementKey="copyright"
            sectionBackground={sectionBackground}
          />
        </div>
      </div>
    </LayoutSection>
  );
};

export default SimpleFooter;