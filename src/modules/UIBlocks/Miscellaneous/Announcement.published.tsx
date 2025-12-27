/**
 * Announcement - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { LogoPublished } from '@/components/published/LogoPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';

export default function AnnouncementPublished(props: LayoutComponentProps) {
  const { sectionId, backgroundType, sectionBackgroundCSS, theme } = props;

  // Extract content
  const headline = props.headline || 'Big Announcement';
  const subheadline = props.subheadline || '';
  const supporting_copy = props.supporting_copy || '';
  const text_1 = props.text_1 || 'Company One';
  const logo_1 = props.logo_1 || '';
  const text_2 = props.text_2 || 'Company Two';
  const logo_2 = props.logo_2 || '';
  const above_cta_copy = props.above_cta_copy || 'Ready to get started?';
  const cta_text = props.cta_text || 'Learn More';

  // Colors and typography
  const textColors = getPublishedTextColors(backgroundType || 'primary', theme, sectionBackgroundCSS);
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const ctaBg = theme?.colors?.accentColor || '#3B82F6';
  const ctaText = '#FFFFFF';

  return (
    <section style={{ background: sectionBackgroundCSS }} className="py-16 px-6">
      <div className="max-w-6xl mx-auto mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-16 mb-12">
          {/* Left Column */}
          <div className="space-y-4">
            <HeadlinePublished value={headline} level="h2" className="mb-4" style={{ color: textColors.heading, ...h2Typography }} />
            {subheadline && <TextPublished value={subheadline} element="p" className="text-xl mb-12" style={{ color: textColors.body, fontSize: '1.25rem' }} />}
            <TextPublished value={supporting_copy} element="p" className="text-lg" style={{ color: textColors.muted, fontSize: '1.125rem' }} />
          </div>

          {/* Right Column - Logos */}
          <div className="space-y-12">
            <div className="flex flex-col items-start">
              <TextPublished value={text_1} element="p" className="text-xl font-semibold mb-2" style={{ color: textColors.body, fontSize: '1.25rem', fontWeight: '600' }} />
              <LogoPublished logoUrl={logo_1} companyName={text_1} size="lg" className="w-48 h-auto" />
            </div>
            <div className="flex flex-col items-start">
              <TextPublished value={text_2} element="p" className="text-lg font-semibold mb-2" style={{ color: textColors.body, fontSize: '1.125rem', fontWeight: '600' }} />
              <LogoPublished logoUrl={logo_2} companyName={text_2} size="lg" className="w-64 h-auto" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-6">
          <TextPublished value={above_cta_copy} element="p" className="text-xl" style={{ color: textColors.body, fontSize: '1.25rem' }} />
          <CTAButtonPublished text={cta_text} backgroundColor={ctaBg} textColor={ctaText} />
        </div>
      </div>
    </section>
  );
}
