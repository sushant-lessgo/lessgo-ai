import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { FaTwitter, FaLinkedin, FaGithub, FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaDiscord, FaMedium, FaDribbble, FaGlobe } from 'react-icons/fa';
import HeaderLogo from '@/components/ui/HeaderLogo';
import SocialMediaEditor from '@/components/social/SocialMediaEditor';
import { normalizeUrl, isValidUrl } from '@/utils/urlHelpers';

import { logger } from '@/lib/logger';
interface LinksAndSocialFooterContent {
  copyright?: string;
  company_name?: string;
  tagline?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  company_name: { type: 'string' as const, default: 'Your Company' },
  tagline: { type: 'string' as const, default: 'Building the future of technology' },
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
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
  const [showSocialEditor, setShowSocialEditor] = useState(false);

  // Initialize social media config if needed
  useEffect(() => {
    if (!store.socialMediaConfig) {
      store.initializeSocialMedia();
    }
  }, [store]);

  // Get social links from store
  const socialLinks = store.socialMediaConfig?.items || [];
  
  // Debug logging
  useEffect(() => {
    logger.debug('🔗 [FOOTER-DEBUG] LinksAndSocialFooter render:', {
      mode,
      socialMediaConfig: store.socialMediaConfig,
      socialLinksCount: socialLinks.length,
      socialLinks: socialLinks.map(s => ({ platform: s.platform, url: s.url })),
      sectionId
    });
  }, [mode, store.socialMediaConfig, socialLinks.length, sectionId]);

  // Map icon names to icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      FaTwitter,
      FaLinkedin,
      FaGithub,
      FaFacebook,
      FaInstagram,
      FaYoutube,
      FaTiktok,
      FaDiscord,
      FaMedium,
      FaDribbble,
      FaGlobe,
    };
    return iconMap[iconName] || FaGlobe;
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LinksAndSocialFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-900 text-white"
    >
      <div className="flex flex-col items-center gap-6 mb-8 py-12">
        <div className="text-center">
          <div className="mb-4">
            <HeaderLogo 
              mode={mode}
              className="h-8 w-auto object-contain brightness-0 invert mx-auto"
            />
          </div>
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
        
        <div className="flex items-center gap-4">
          {socialLinks.map((social, index) => {
            const IconComponent = getIconComponent(social.icon);
            // Ensure URL is normalized and valid
            const normalizedUrl = normalizeUrl(social.url);
            const validUrl = isValidUrl(normalizedUrl) ? normalizedUrl : '#';
            
            return (
              <a
                key={social.id}
                href={validUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors relative"
                aria-label={social.platform}
                onClick={(e) => mode !== 'preview' ? e.preventDefault() : undefined}
              >
                <IconComponent className="w-5 h-5" />
                {mode !== 'preview' && (
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                    {social.platform}
                  </span>
                )}
              </a>
            );
          })}
          
          {mode !== 'preview' && (
            <button
              onClick={() => setShowSocialEditor(true)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              title="Edit social media links"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Edit Links
            </button>
          )}
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
      
      {/* Social Media Editor Modal */}
      <SocialMediaEditor
        isVisible={showSocialEditor}
        onClose={() => setShowSocialEditor(false)}
        targetFooterId={sectionId}
      />
    </LayoutSection>
  );
};

export default LinksAndSocialFooter;