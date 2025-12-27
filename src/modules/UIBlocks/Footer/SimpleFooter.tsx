import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import HeaderLogo from '@/components/ui/HeaderLogo';
import { TextPublished } from '@/components/published/TextPublished';

interface SimpleFooterContent {
  copyright?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
};

// Published-safe component for server-side rendering
function SimpleFooterPublished(props: LayoutComponentProps) {
  const { sectionBackgroundCSS } = props;
  const copyright = props.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;

  return (
    <section style={{ background: sectionBackgroundCSS }} className="py-8 px-6 border-t">
      <div className="flex flex-col items-center gap-2">
        <TextPublished
          value={copyright}
          element="p"
          className="text-sm text-gray-600"
        />
        <div className="text-sm text-gray-600">
          Built with{' '}
          <a
            href="https://lessgo.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600"
          >
            Lessgo.ai
          </a>
        </div>
      </div>
    </section>
  );
}

const SimpleFooter: React.FC<LayoutComponentProps> = (props) => {
  // PUBLISHED MODE: Use published-safe component
  if (props.mode === 'published') {
    return <SimpleFooterPublished {...props} />;
  }
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
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="flex items-center gap-2">
          <HeaderLogo
            mode={mode}
            className="h-2 w-auto object-contain"
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

        <div className="text-lg text-gray-600 pt-2">
          Built with{' '}
          <a
            href="https://lessgo.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 transition-colors"
            onClick={(e) => mode !== 'preview' ? e.preventDefault() : undefined}
          >
            Lessgo.ai
          </a>
        </div>
      </div>
    </LayoutSection>
  );
};

export default SimpleFooter;