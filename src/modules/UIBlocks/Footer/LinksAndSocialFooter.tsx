import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { FaTwitter, FaLinkedin, FaGithub, FaFacebook } from 'react-icons/fa';

interface LinksAndSocialFooterContent {
  copyright?: string;
  company_name?: string;
  tagline?: string;
  link_1?: string;
  link_text_1?: string;
  link_2?: string;
  link_text_2?: string;
  link_3?: string;
  link_text_3?: string;
  link_4?: string;
  link_text_4?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_github?: string;
  social_facebook?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  company_name: { type: 'string' as const, default: 'Your Company' },
  tagline: { type: 'string' as const, default: 'Building the future of technology' },
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
  link_text_1: { type: 'string' as const, default: 'About' },
  link_1: { type: 'string' as const, default: '/about' },
  link_text_2: { type: 'string' as const, default: 'Privacy' },
  link_2: { type: 'string' as const, default: '/privacy' },
  link_text_3: { type: 'string' as const, default: 'Terms' },
  link_3: { type: 'string' as const, default: '/terms' },
  link_text_4: { type: 'string' as const, default: 'Contact' },
  link_4: { type: 'string' as const, default: '/contact' },
  social_twitter: { type: 'string' as const, default: 'https://twitter.com' },
  social_linkedin: { type: 'string' as const, default: 'https://linkedin.com' },
  social_github: { type: 'string' as const, default: 'https://github.com' },
};

const LinksAndSocialFooter: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<LinksAndSocialFooterContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  const store = useEditStore();
  const logoUrl = store?.logoUrl || '/api/placeholder/150/50';

  const links = [
    { text: blockContent.link_text_1, url: blockContent.link_1 },
    { text: blockContent.link_text_2, url: blockContent.link_2 },
    { text: blockContent.link_text_3, url: blockContent.link_3 },
    { text: blockContent.link_text_4, url: blockContent.link_4 },
  ].filter(link => link.text);

  const socialLinks = [
    { icon: FaTwitter, url: blockContent.social_twitter, label: 'Twitter' },
    { icon: FaLinkedin, url: blockContent.social_linkedin, label: 'LinkedIn' },
    { icon: FaGithub, url: blockContent.social_github, label: 'GitHub' },
    { icon: FaFacebook, url: blockContent.social_facebook, label: 'Facebook' },
  ].filter(social => social.url);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LinksAndSocialFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-900 text-white"
      innerClassName="py-12"
    >
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 w-auto mb-4 brightness-0 invert"
          />
          {blockContent.tagline && (
            <p className="text-gray-400 text-sm">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.tagline}
                onEdit={(value) => handleContentUpdate('tagline', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm"
                placeholder="Company tagline"
                sectionId={sectionId}
                elementKey="tagline"
                sectionBackground={sectionBackground}
              />
            </p>
          )}
        </div>
        
        <div className="flex flex-col md:items-end gap-4">
          <nav className="flex flex-wrap gap-6">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url || '#'}
                className="text-sm text-gray-400 hover:text-white transition-colors"
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
          
          <div className="flex gap-4">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="pt-8 border-t border-gray-800 text-center">
        <p className="text-sm text-gray-400">
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

export default LinksAndSocialFooter;