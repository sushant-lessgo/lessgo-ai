import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText, EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaTwitter, FaLinkedin, FaGithub, FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaDiscord, FaMedium, FaDribbble, FaGlobe } from 'react-icons/fa';
import HeaderLogo from '@/components/ui/HeaderLogo';
import SocialMediaEditor from '@/components/social/SocialMediaEditor';

import { logger } from '@/lib/logger';
interface ContactFooterContent {
  copyright?: string;
  newsletter_title?: string;
  newsletter_description?: string;
  newsletter_cta?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  copyright: { type: 'string' as const, default: `© ${new Date().getFullYear()} Your Company. All rights reserved.` },
  newsletter_title: { type: 'string' as const, default: 'Stay Updated' },
  newsletter_description: { type: 'string' as const, default: 'Get the latest updates and news delivered to your inbox.' },
  newsletter_cta: { type: 'string' as const, default: 'Subscribe' },
  email: { type: 'string' as const, default: 'contact@company.com' },
  phone: { type: 'string' as const, default: '+1 (555) 123-4567' },
  address: { type: 'string' as const, default: '123 Business St, Suite 100, City, State 12345' },
};

const ContactFooter: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<ContactFooterContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const store = useEditStore();
  const handleCTAClick = createCTAClickHandler(store);
  const [showSocialEditor, setShowSocialEditor] = useState(false);

  // Initialize social media config if needed
  useEffect(() => {
    if (!store.socialMediaConfig) {
      store.initializeSocialMedia();
    }
  }, [store]);

  const contactInfo = [
    { icon: FaEnvelope, text: blockContent.email, id: 'email' },
    { icon: FaPhone, text: blockContent.phone, id: 'phone' },
    { icon: FaMapMarkerAlt, text: blockContent.address, id: 'address' },
  ].filter(info => info.text);

  // Get social links from store
  const socialLinks = store.socialMediaConfig?.items || [];
  
  // Debug logging
  useEffect(() => {
    logger.debug('🔗 [FOOTER-DEBUG] ContactFooter render:', {
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
      sectionType="ContactFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="bg-gray-900 text-white"
      innerClassName="py-16"
    >
      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <div className="mb-6">
            <HeaderLogo 
              mode={mode}
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div className="space-y-3">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    <EditableAdaptiveText
                      mode={mode}
                      value={info.text || ''}
                      onEdit={(value) => handleContentUpdate(info.id, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="Contact info"
                      sectionId={sectionId}
                      elementKey={info.id}
                      sectionBackground={sectionBackground}
                    />
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Social Media Links */}
          {(socialLinks.length > 0 || mode === 'edit') && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = getIconComponent(social.icon);
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label={social.platform}
                      onClick={(e) => mode === 'edit' ? e.preventDefault() : undefined}
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
                
                {mode === 'edit' && (
                  <button
                    onClick={() => setShowSocialEditor(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    title="Edit social media links"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Social Links
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.newsletter_title || ''}
              onEdit={(value) => handleContentUpdate('newsletter_title', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold"
              placeholder="Newsletter title"
              sectionId={sectionId}
              elementKey="newsletter_title"
              sectionBackground={sectionBackground}
            />
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.newsletter_description || ''}
              onEdit={(value) => handleContentUpdate('newsletter_description', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm"
              placeholder="Newsletter description"
              sectionId={sectionId}
              elementKey="newsletter_description"
              sectionBackground={sectionBackground}
            />
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
            <CTAButton
              text={blockContent.newsletter_cta || 'Subscribe'}
              onClick={handleCTAClick}
              colorTokens={colorTokens}
              variant="primary"
              size="sm"
              sectionId={sectionId}
              elementKey="newsletter_cta"
            />
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
      
      {/* Social Media Editor Modal */}
      <SocialMediaEditor
        isVisible={showSocialEditor}
        onClose={() => setShowSocialEditor(false)}
        targetFooterId={sectionId}
      />
    </LayoutSection>
  );
};

export default ContactFooter;