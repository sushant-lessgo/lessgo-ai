import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SimpleFooterContent {
  copyright?: string;
  link_1?: string;
  link_text_1?: string;
  link_2?: string;
  link_text_2?: string;
  link_3?: string;
  link_text_3?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
  link_text_1: { type: 'string' as const, default: 'Privacy Policy' },
  link_1: { type: 'string' as const, default: '/privacy' },
  link_text_2: { type: 'string' as const, default: 'Terms of Service' },
  link_2: { type: 'string' as const, default: '/terms' },
  link_text_3: { type: 'string' as const, default: 'Contact' },
  link_3: { type: 'string' as const, default: '/contact' },
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

  const links = [
    { text: blockContent.link_text_1, url: blockContent.link_1 },
    { text: blockContent.link_text_2, url: blockContent.link_2 },
    { text: blockContent.link_text_3, url: blockContent.link_3 },
  ].filter(link => link.text);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SimpleFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-50 border-t"
      innerClassName="py-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
        
        <nav className="flex items-center gap-6">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url || '#'}
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <EditableAdaptiveText
                mode={mode}
                value={link.text || ''}
                onEdit={(value) => handleContentUpdate(`link_text_${index + 1}`, value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm"
                placeholder={`Link ${index + 1}`}
                sectionId={sectionId}
                elementKey={`link_text_${index + 1}`}
                sectionBackground={sectionBackground}
              />
            </a>
          ))}
        </nav>
      </div>
    </LayoutSection>
  );
};

export default SimpleFooter;