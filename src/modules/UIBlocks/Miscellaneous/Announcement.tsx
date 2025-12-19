// components/layout/Announcement.tsx
// Announcement UIBlock for partnerships, press releases, and special announcements

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface AnnouncementContent {
  headline: string;
  subheadline?: string;
  supporting_copy: string;
  text_1: string;
  logo_1: string;
  text_2: string;
  logo_2: string;
  above_cta_copy: string;
  cta_text: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Big Announcement'
  },
  subheadline: {
    type: 'string' as const,
    default: 'We\'re excited to share some news'
  },
  supporting_copy: {
    type: 'string' as const,
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  },
  text_1: {
    type: 'string' as const,
    default: 'Company One'
  },
  logo_1: {
    type: 'string' as const,
    default: ''
  },
  text_2: {
    type: 'string' as const,
    default: 'Company Two'
  },
  logo_2: {
    type: 'string' as const,
    default: ''
  },
  above_cta_copy: {
    type: 'string' as const,
    default: 'Ready to get started?'
  },
  cta_text: {
    type: 'string' as const,
    default: 'Learn More'
  }
};

export default function Announcement(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<AnnouncementContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();

  // Logo change handlers
  const handleLogo1Change = (url: string) => {
    handleContentUpdate('logo_1', url);
  };

  const handleLogo2Change = (url: string) => {
    handleContentUpdate('logo_2', url);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="Announcement"
      backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top: 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

          {/* Left Column - Content */}
          <div className="space-y-4">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              className="mb-4"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {blockContent.subheadline && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-xl mb-4"
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            <EditableAdaptiveText
              mode={mode}
              value={blockContent.supporting_copy || ''}
              onEdit={(value) => handleContentUpdate('supporting_copy', value)}
              backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className={`text-lg ${dynamicTextColors?.muted || colorTokens.textMuted}`}
              sectionId={sectionId}
              elementKey="supporting_copy"
              sectionBackground={sectionBackground}
            />
          </div>

          {/* Right Column - Logo-Text Pairs */}
          <div className="space-y-6">
            {/* Logo 1 + Text 1 */}
            <div className="flex items-center gap-4">
              <LogoEditableComponent
                mode={mode}
                logoUrl={blockContent.logo_1}
                onLogoChange={handleLogo1Change}
                companyName={blockContent.text_1}
                size="md"
                className=""
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.text_1 || ''}
                onEdit={(value) => handleContentUpdate('text_1', value)}
                backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg font-semibold flex-1"
                sectionId={sectionId}
                elementKey="text_1"
                sectionBackground={sectionBackground}
              />
            </div>

            {/* Logo 2 + Text 2 */}
            <div className="flex items-center gap-4">
              <LogoEditableComponent
                mode={mode}
                logoUrl={blockContent.logo_2}
                onLogoChange={handleLogo2Change}
                companyName={blockContent.text_2}
                size="md"
                className=""
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.text_2 || ''}
                onEdit={(value) => handleContentUpdate('text_2', value)}
                backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg font-semibold flex-1"
                sectionId={sectionId}
                elementKey="text_2"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>
        </div>

        {/* Bottom: Centered CTA */}
        <div className="text-center space-y-6">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.above_cta_copy || ''}
            onEdit={(value) => handleContentUpdate('above_cta_copy', value)}
            backgroundType={props.backgroundType === 'custom' ? 'primary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="text-xl"
            sectionId={sectionId}
            elementKey="above_cta_copy"
            sectionBackground={sectionBackground}
          />

          <CTAButton
            text={blockContent.cta_text || ''}
            colorTokens={colorTokens}
            variant="primary"
            sectionId={sectionId}
            elementKey="cta_text"
            mode={mode}
            size="large"
          />
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'Announcement',
  category: 'Miscellaneous',
  description: 'Announcement block with headline, copy, logo-text pairs, and centered CTA. Perfect for partnerships, press releases, or special announcements.',
  tags: ['announcement', 'partnership', 'press', 'logos', 'cta'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',

  contentFields: [
    { key: 'headline', label: 'Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'text', required: false },
    { key: 'supporting_copy', label: 'Supporting Copy', type: 'textarea', required: true },
    { key: 'text_1', label: 'Logo 1 Text', type: 'text', required: true },
    { key: 'logo_1', label: 'Logo 1 Image', type: 'image', required: false },
    { key: 'text_2', label: 'Logo 2 Text', type: 'text', required: true },
    { key: 'logo_2', label: 'Logo 2 Image', type: 'image', required: false },
    { key: 'above_cta_copy', label: 'Text Above CTA', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true }
  ],

  features: [
    '2-column layout with content and logo pairs',
    'Image upload support for partner/sponsor logos',
    'Multiline supporting copy for detailed announcements',
    'Centered CTA section for call-to-action',
    'Responsive mobile stacking',
    'Automatic text color adaptation'
  ],

  useCases: [
    'Partnership announcements',
    'Press release highlights',
    'Award or certification announcements',
    'Sponsor/investor announcements',
    'Media mention showcases',
    'Event or conference announcements'
  ]
};
