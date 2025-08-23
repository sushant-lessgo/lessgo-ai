import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText, EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

interface ContactFooterContent {
  copyright?: string;
  newsletter_title?: string;
  newsletter_description?: string;
  newsletter_cta?: string;
  email?: string;
  phone?: string;
  address?: string;
  link_1?: string;
  link_text_1?: string;
  link_2?: string;
  link_text_2?: string;
  link_3?: string;
  link_text_3?: string;
  link_4?: string;
  link_text_4?: string;
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
  link_text_1: { type: 'string' as const, default: 'Privacy Policy' },
  link_1: { type: 'string' as const, default: '/privacy' },
  link_text_2: { type: 'string' as const, default: 'Terms of Service' },
  link_2: { type: 'string' as const, default: '/terms' },
  link_text_3: { type: 'string' as const, default: 'Support' },
  link_3: { type: 'string' as const, default: '/support' },
  link_text_4: { type: 'string' as const, default: 'FAQ' },
  link_4: { type: 'string' as const, default: '/faq' },
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
  const logoUrl = store?.logoUrl || '/api/placeholder/150/50';
  const handleCTAClick = createCTAClickHandler(store);

  const links = [
    { text: blockContent.link_text_1, url: blockContent.link_1 },
    { text: blockContent.link_text_2, url: blockContent.link_2 },
    { text: blockContent.link_text_3, url: blockContent.link_3 },
    { text: blockContent.link_text_4, url: blockContent.link_4 },
  ].filter(link => link.text);

  const contactInfo = [
    { icon: FaEnvelope, text: blockContent.email, id: 'email' },
    { icon: FaPhone, text: blockContent.phone, id: 'phone' },
    { icon: FaMapMarkerAlt, text: blockContent.address, id: 'address' },
  ].filter(info => info.text);

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
      <div className="grid md:grid-cols-3 gap-12 mb-12">
        <div>
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 w-auto mb-6 brightness-0 invert"
          />
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
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-3">
            {links.map((link, index) => (
              <li key={index}>
                <a
                  href={link.url || '#'}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
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
              </li>
            ))}
          </ul>
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
    </LayoutSection>
  );
};

export default ContactFooter;