import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText, EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface MultiColumnFooterContent {
  copyright?: string;
  company_description?: string;
  column_1_title?: string;
  column_1_link_1?: string;
  column_1_link_text_1?: string;
  column_1_link_2?: string;
  column_1_link_text_2?: string;
  column_1_link_3?: string;
  column_1_link_text_3?: string;
  column_1_link_4?: string;
  column_1_link_text_4?: string;
  column_2_title?: string;
  column_2_link_1?: string;
  column_2_link_text_1?: string;
  column_2_link_2?: string;
  column_2_link_text_2?: string;
  column_2_link_3?: string;
  column_2_link_text_3?: string;
  column_2_link_4?: string;
  column_2_link_text_4?: string;
  column_3_title?: string;
  column_3_link_1?: string;
  column_3_link_text_1?: string;
  column_3_link_2?: string;
  column_3_link_text_2?: string;
  column_3_link_3?: string;
  column_3_link_text_3?: string;
  column_3_link_4?: string;
  column_3_link_text_4?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
  company_description: { type: 'string' as const, default: 'We help businesses transform their digital presence.' },
  column_1_title: { type: 'string' as const, default: 'Product' },
  column_1_link_text_1: { type: 'string' as const, default: 'Features' },
  column_1_link_1: { type: 'string' as const, default: '/features' },
  column_1_link_text_2: { type: 'string' as const, default: 'Pricing' },
  column_1_link_2: { type: 'string' as const, default: '/pricing' },
  column_1_link_text_3: { type: 'string' as const, default: 'Integration' },
  column_1_link_3: { type: 'string' as const, default: '/integration' },
  column_1_link_text_4: { type: 'string' as const, default: 'API' },
  column_1_link_4: { type: 'string' as const, default: '/api' },
  column_2_title: { type: 'string' as const, default: 'Company' },
  column_2_link_text_1: { type: 'string' as const, default: 'About' },
  column_2_link_1: { type: 'string' as const, default: '/about' },
  column_2_link_text_2: { type: 'string' as const, default: 'Blog' },
  column_2_link_2: { type: 'string' as const, default: '/blog' },
  column_2_link_text_3: { type: 'string' as const, default: 'Careers' },
  column_2_link_3: { type: 'string' as const, default: '/careers' },
  column_2_link_text_4: { type: 'string' as const, default: 'Press' },
  column_2_link_4: { type: 'string' as const, default: '/press' },
  column_3_title: { type: 'string' as const, default: 'Resources' },
  column_3_link_text_1: { type: 'string' as const, default: 'Documentation' },
  column_3_link_1: { type: 'string' as const, default: '/docs' },
  column_3_link_text_2: { type: 'string' as const, default: 'Support' },
  column_3_link_2: { type: 'string' as const, default: '/support' },
  column_3_link_text_3: { type: 'string' as const, default: 'Legal' },
  column_3_link_3: { type: 'string' as const, default: '/legal' },
  column_3_link_text_4: { type: 'string' as const, default: 'Privacy' },
  column_3_link_4: { type: 'string' as const, default: '/privacy' },
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

  const store = useEditStore();
  const logoUrl = store?.logoUrl || '/api/placeholder/150/50';

  const getColumnLinks = (columnNum: number) => {
    const links = [];
    for (let i = 1; i <= 4; i++) {
      const text = blockContent[`column_${columnNum}_link_text_${i}` as keyof MultiColumnFooterContent];
      const url = blockContent[`column_${columnNum}_link_${i}` as keyof MultiColumnFooterContent];
      if (text) {
        links.push({ text, url: url || '#', id: `column_${columnNum}_link_text_${i}` });
      }
    }
    return links;
  };

  const columns = [
    { title: blockContent.column_1_title, links: getColumnLinks(1), id: 'column_1_title' },
    { title: blockContent.column_2_title, links: getColumnLinks(2), id: 'column_2_title' },
    { title: blockContent.column_3_title, links: getColumnLinks(3), id: 'column_3_title' },
  ].filter(col => col.title && col.links.length > 0);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MultiColumnFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-50 border-t"
      innerClassName="py-16"
    >
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-1">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 w-auto mb-4"
          />
          {blockContent.company_description && (
            <p className="text-sm text-gray-600">
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
        
        {columns.map((column, colIndex) => (
          <div key={colIndex}>
            <h3 className="font-semibold text-gray-900 mb-4">
              <EditableAdaptiveText
                mode={mode}
                value={column.title || ''}
                onEdit={(value) => handleContentUpdate(column.id, value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold"
                placeholder="Column title"
                sectionId={sectionId}
                elementKey={column.id}
                sectionBackground={sectionBackground}
              />
            </h3>
            <ul className="space-y-3">
              {column.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <a
                    href={link.url}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <EditableAdaptiveText
                      mode={mode}
                      value={link.text as string}
                      onEdit={(value) => handleContentUpdate(link.id, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="Link text"
                      sectionId={sectionId}
                      elementKey={link.id}
                      sectionBackground={sectionBackground}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
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