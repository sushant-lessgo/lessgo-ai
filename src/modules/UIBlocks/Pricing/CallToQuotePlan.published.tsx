/**
 * CallToQuotePlan - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import * as LucideIcons from 'lucide-react';

// Contact card structure
interface ContactCard {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: string;
}

// Trust item structure
interface TrustItem {
  id: string;
  text: string;
}


// Default contact cards (fallback)
const DEFAULT_CONTACT_CARDS: ContactCard[] = [
  {
    id: 'cc-1',
    title: 'Schedule a Demo',
    description: 'See the platform in action with a personalized walkthrough',
    cta: 'Book Demo',
    icon: 'calendar'
  },
  {
    id: 'cc-2',
    title: 'Request a Quote',
    description: 'Get pricing tailored to your team size and needs',
    cta: 'Get Quote',
    icon: 'dollar-sign'
  },
  {
    id: 'cc-3',
    title: 'Talk to Sales',
    description: 'Discuss your specific requirements with our enterprise team',
    cta: 'Contact Sales',
    icon: 'phone'
  }
];

// Icon component helper
const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  // Convert kebab-case to PascalCase
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const Icon = (LucideIcons as any)[pascalName] || LucideIcons.MessageCircle;
  return <Icon className={className} />;
};

export default function CallToQuotePlanPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Get a Custom Quote for Your Business';
  const value_proposition = props.value_proposition || 'Ready to take the next step? Get personalized pricing and see how our solution can work specifically for your needs.';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const response_time = props.response_time || '';
  const contact_cards: ContactCard[] = props.contact_cards || DEFAULT_CONTACT_CARDS;
  const trust_items: TrustItem[] = props.trust_items || [];

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles
  const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

  // Get accent color from theme
  const accentColor = theme?.colors?.accentColor || '#3b82f6';

  // Text colors
  const textColors = getPublishedTextColors(backgroundType || 'neutral', theme, sectionBackgroundCSS);

  // Typography
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h4Typography = getPublishedTypographyStyles('h4', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Grid classes based on card count
  const gridClass =
    contact_cards.length === 2
      ? 'md:grid-cols-2 max-w-3xl mx-auto'
      : contact_cards.length === 3
        ? 'md:grid-cols-3 max-w-5xl mx-auto'
        : 'md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto';

  return (
    <SectionWrapperPublished sectionId={sectionId} background={sectionBackgroundCSS} padding="normal">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem',
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.muted,
                ...bodyLgTypography,
                marginBottom: '2rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            />
          )}

          <div style={{ maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '3rem' }}>
            <TextPublished
              value={value_proposition}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                lineHeight: '1.75',
              }}
            />
          </div>
        </div>

        {/* Contact Cards Grid */}
        <div className={`grid gap-6 ${gridClass} mb-16`}>
          {contact_cards.map((card: ContactCard, index: number) => (
            <div
              key={card.id}
              className="relative p-6 rounded-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: cardStyles.bg,
                borderColor: cardStyles.borderColor,
                borderWidth: cardStyles.borderWidth,
                borderStyle: cardStyles.borderStyle,
                backdropFilter: cardStyles.backdropFilter,
                WebkitBackdropFilter: cardStyles.backdropFilter,
                boxShadow: cardStyles.boxShadow,
              }}
            >
              <div className="text-center">
                {/* Icon */}
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: cardStyles.iconBg, color: cardStyles.iconColor }}
                >
                  <IconComponent name={card.icon} className="w-8 h-8" />
                </div>

                {/* Title */}
                <h4
                  style={{
                    ...h4Typography,
                    fontWeight: '600',
                    color: cardStyles.textHeading,
                    marginBottom: '0.5rem',
                  }}
                >
                  {card.title}
                </h4>

                {/* Description */}
                <p
                  style={{
                    ...bodyTypography,
                    color: cardStyles.textBody,
                    marginBottom: '1rem',
                  }}
                >
                  {card.description}
                </p>

                {/* CTA Button */}
                <CTAButtonPublished
                  text={card.cta}
                  backgroundColor={index === 0 ? theme?.colors?.accentColor || '#3b82f6' : '#ffffff'}
                  textColor={index === 0 ? '#ffffff' : theme?.colors?.accentColor || '#3b82f6'}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Response Time */}
        {response_time && (
          <div className="text-center mb-8">
            <TextPublished
              value={response_time}
              style={{
                color: textColors.muted,
                fontWeight: '500',
              }}
            />
          </div>
        )}

        {/* Supporting Text & Trust Items */}
        {(supporting_text || trust_items.length > 0) && (
          <div className="text-center space-y-6">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  maxWidth: '48rem',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '2rem',
                }}
              />
            )}

            {trust_items.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-6">
                {trust_items.map((item: TrustItem) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: '#10b981' }} // green-500
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span style={{ color: textColors.muted }}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
