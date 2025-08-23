import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

interface FullNavHeaderContent {
  logo?: string;
  nav_item_1?: string;
  nav_item_2?: string;
  nav_item_3?: string;
  nav_item_4?: string;
  nav_item_5?: string;
  nav_link_1?: string;
  nav_link_2?: string;
  nav_link_3?: string;
  nav_link_4?: string;
  nav_link_5?: string;
  cta_text?: string;
  secondary_cta_text?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  nav_item_1: { type: 'string' as const, default: 'Products' },
  nav_item_2: { type: 'string' as const, default: 'Solutions' },
  nav_item_3: { type: 'string' as const, default: 'Pricing' },
  nav_item_4: { type: 'string' as const, default: 'Resources' },
  nav_item_5: { type: 'string' as const, default: 'Company' },
  nav_link_1: { type: 'string' as const, default: '#products' },
  nav_link_2: { type: 'string' as const, default: '#solutions' },
  nav_link_3: { type: 'string' as const, default: '#pricing' },
  nav_link_4: { type: 'string' as const, default: '#resources' },
  nav_link_5: { type: 'string' as const, default: '#company' },
  cta_text: { type: 'string' as const, default: 'Start Free Trial' },
  secondary_cta_text: { type: 'string' as const, default: 'Sign In' },
};

const FullNavHeader: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<FullNavHeaderContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  const store = useEditStore();
  const logoUrl = store?.logoUrl || '/api/placeholder/150/50';
  const handleCTAClick = createCTAClickHandler(store);

  const navItems = [
    { text: blockContent.nav_item_1, link: blockContent.nav_link_1 || '#' },
    { text: blockContent.nav_item_2, link: blockContent.nav_link_2 || '#' },
    { text: blockContent.nav_item_3, link: blockContent.nav_link_3 || '#' },
    { text: blockContent.nav_item_4, link: blockContent.nav_link_4 || '#' },
    { text: blockContent.nav_item_5, link: blockContent.nav_link_5 || '#' },
  ].filter(item => item.text);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="FullNavHeader"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b"
      innerClassName="py-4"
    >
      <nav className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 w-auto mr-10"
          />
          
          <ul className="flex items-center gap-7">
            {navItems.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.link}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={(e) => {
                    if (item.link.startsWith('#')) {
                      e.preventDefault();
                      const element = document.querySelector(item.link);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <EditableAdaptiveText
                    mode={mode}
                    value={item.text || ''}
                    onEdit={(value) => handleContentUpdate(`nav_item_${index + 1}`, value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="inline-block text-sm font-medium"
                    placeholder={`Nav Item ${index + 1}`}
                    sectionId={sectionId}
                    elementKey={`nav_item_${index + 1}`}
                    sectionBackground={sectionBackground}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex items-center gap-3">
          {blockContent.secondary_cta_text && (
            <CTAButton
              text={blockContent.secondary_cta_text}
              onClick={handleCTAClick}
              colorTokens={colorTokens}
              variant="ghost"
              size="sm"
              sectionId={sectionId}
              elementKey="secondary_cta_text"
            />
          )}
          <CTAButton
            text={blockContent.cta_text || 'Get Started'}
            onClick={handleCTAClick}
            colorTokens={colorTokens}
            variant="primary"
            size="sm"
            sectionId={sectionId}
            elementKey="cta_text"
          />
        </div>
      </nav>
    </LayoutSection>
  );
};

export default FullNavHeader;