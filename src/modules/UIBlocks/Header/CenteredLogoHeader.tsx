import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import HeaderLogo from '@/components/ui/HeaderLogo';

interface CenteredLogoHeaderContent {
  logo?: string;
  nav_item_1?: string;
  nav_item_2?: string;
  nav_item_3?: string;
  nav_item_4?: string;
  nav_item_5?: string;
  nav_item_6?: string;
  nav_link_1?: string;
  nav_link_2?: string;
  nav_link_3?: string;
  nav_link_4?: string;
  nav_link_5?: string;
  nav_link_6?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  nav_item_1: { type: 'string' as const, default: 'Products' },
  nav_item_2: { type: 'string' as const, default: 'Solutions' },
  nav_item_3: { type: 'string' as const, default: 'Company' },
  nav_item_4: { type: 'string' as const, default: 'Resources' },
  nav_item_5: { type: 'string' as const, default: 'Pricing' },
  nav_item_6: { type: 'string' as const, default: 'Contact' },
  nav_link_1: { type: 'string' as const, default: '#products' },
  nav_link_2: { type: 'string' as const, default: '#solutions' },
  nav_link_3: { type: 'string' as const, default: '#company' },
  nav_link_4: { type: 'string' as const, default: '#resources' },
  nav_link_5: { type: 'string' as const, default: '#pricing' },
  nav_link_6: { type: 'string' as const, default: '#contact' },
};

const CenteredLogoHeader: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<CenteredLogoHeaderContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  

  const leftNavItems = [
    { text: blockContent.nav_item_1, link: blockContent.nav_link_1 || '#' },
    { text: blockContent.nav_item_2, link: blockContent.nav_link_2 || '#' },
    { text: blockContent.nav_item_3, link: blockContent.nav_link_3 || '#' },
  ].filter(item => item.text);

  const rightNavItems = [
    { text: blockContent.nav_item_4, link: blockContent.nav_link_4 || '#' },
    { text: blockContent.nav_item_5, link: blockContent.nav_link_5 || '#' },
    { text: blockContent.nav_item_6, link: blockContent.nav_link_6 || '#' },
  ].filter(item => item.text);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (link.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(link);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CenteredLogoHeader"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b"
      innerClassName="py-4"
    >
      <nav className="flex items-center justify-between">
        <ul className="flex items-center gap-6 flex-1">
          {leftNavItems.map((item, index) => (
            <li key={index}>
              <a 
                href={item.link}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                onClick={(e) => handleNavClick(e, item.link)}
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
        
        <div className="px-8">
          <HeaderLogo 
            mode={mode}
            className="h-8 w-auto object-contain"
          />
        </div>
        
        <ul className="flex items-center gap-6 flex-1 justify-end">
          {rightNavItems.map((item, index) => (
            <li key={index}>
              <a 
                href={item.link}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                onClick={(e) => handleNavClick(e, item.link)}
              >
                <EditableAdaptiveText
                  mode={mode}
                  value={item.text || ''}
                  onEdit={(value) => handleContentUpdate(`nav_item_${index + 4}`, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="inline-block text-sm font-medium"
                  placeholder={`Nav Item ${index + 4}`}
                  sectionId={sectionId}
                  elementKey={`nav_item_${index + 4}`}
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

export default CenteredLogoHeader;