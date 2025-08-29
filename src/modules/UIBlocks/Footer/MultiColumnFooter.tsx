import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText, EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import HeaderLogo from '@/components/ui/HeaderLogo';

interface MultiColumnFooterContent {
  copyright?: string;
  company_description?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
  company_description: { type: 'string' as const, default: 'We help businesses transform their digital presence.' },
};

const MultiColumnFooter: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<MultiColumnFooterContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MultiColumnFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-50 border-t"
    >
      <div className="flex flex-col items-center text-center gap-6 mb-12 py-16">
        <div className="mb-4">
          <HeaderLogo 
            mode={mode}
            className="h-8 w-auto object-contain mx-auto"
          />
        </div>
        {blockContent.company_description && (
          <p className="text-sm text-gray-600 max-w-md">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.company_description}
              onEdit={(value) => handleContentUpdate('company_description', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm"
              placeholder="Company description"
              sectionId={sectionId}
              elementKey="company_description"
              sectionBackground={sectionBackground}
            />
          </p>
        )}
      </div>
      
      <div className="pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
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
        </p>
      </div>
    </LayoutSection>
  );
};

export default MultiColumnFooter;