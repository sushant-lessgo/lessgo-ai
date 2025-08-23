import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

interface MinimalNavHeaderContent {
  logo?: string;
  nav_item_1?: string;
  nav_item_2?: string;
  nav_item_3?: string;
  nav_item_4?: string;
  nav_link_1?: string;
  nav_link_2?: string;
  nav_link_3?: string;
  nav_link_4?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  nav_item_1: { 
    type: 'string' as const, 
    default: 'Features' 
  },
  nav_item_2: { 
    type: 'string' as const, 
    default: 'Pricing' 
  },
  nav_item_3: { 
    type: 'string' as const, 
    default: 'About' 
  },
  nav_item_4: { 
    type: 'string' as const, 
    default: 'Contact' 
  },
  nav_link_1: { 
    type: 'string' as const, 
    default: '#features' 
  },
  nav_link_2: { 
    type: 'string' as const, 
    default: '#pricing' 
  },
  nav_link_3: { 
    type: 'string' as const, 
    default: '#about' 
  },
  nav_link_4: { 
    type: 'string' as const, 
    default: '#contact' 
  },
};

const MinimalNavHeader: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<MinimalNavHeaderContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  const store = useEditStore();
  const logoUrl = store?.logoUrl || '/api/placeholder/150/50';

  const navItems = [
    { text: blockContent.nav_item_1, link: blockContent.nav_link_1 || '#' },
    { text: blockContent.nav_item_2, link: blockContent.nav_link_2 || '#' },
    { text: blockContent.nav_item_3, link: blockContent.nav_link_3 || '#' },
    { text: blockContent.nav_item_4, link: blockContent.nav_link_4 || '#' },
  ].filter(item => item.text);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MinimalNavHeader"
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
            className="h-8 w-auto mr-8"
          />
        </div>
        
        <ul className="flex items-center gap-6">
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
      </nav>
    </LayoutSection>
  );
};

export default MinimalNavHeader;