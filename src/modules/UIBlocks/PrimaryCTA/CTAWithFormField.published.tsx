/**
 * CTAWithFormField - Published Version
 *
 * Server-safe component with client-side form hydration
 * Used by componentRegistry.published.ts for SSR rendering
 * Phase 2: Interactive forms via FormIsland client component
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { FormIsland } from '@/components/published/FormIsland';
import { tailwindToHex } from '@/lib/themeUtils';

export default function CTAWithFormFieldPublished(props: LayoutComponentProps) {
  const { sectionId, backgroundType, sectionBackgroundCSS, theme, publishedPageId, pageOwnerId } = props;

  // Extract content
  const headline = props.headline || 'Get Started Today';
  const eyebrow_text = props.eyebrow_text || '';
  const subheadline = props.subheadline || '';
  const form_label = props.form_label || 'Work Email Address';
  const placeholder_text = props.placeholder_text || 'Enter your work email';
  const cta_text = props.cta_text || 'Start Free Trial';
  const privacy_text = props.privacy_text || 'No spam. Unsubscribe at any time.';

  // Benefits and trust items
  const benefits = [
    props.benefit_1,
    props.benefit_2,
    props.benefit_3,
    props.benefit_4,
    props.benefit_5
  ].filter(b => b && b !== '___REMOVED___' && b.trim() !== '');

  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter(t => t && t !== '___REMOVED___' && t.trim() !== '');

  // Colors
  const textColors = getPublishedTextColors(backgroundType || 'secondary', theme, sectionBackgroundCSS);
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const ctaBg = theme?.colors?.accentCSS
    ? tailwindToHex(theme.colors.accentCSS)
    : theme?.colors?.accentColor || '#DB2777';
  const ctaText = '#FFFFFF';

  return (
    <section style={{ background: sectionBackgroundCSS }} className="py-16 px-6">
      <div className="max-w-[66rem] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 items-center">
          {/* Left Column */}
          <div>
            {eyebrow_text && eyebrow_text !== '___REMOVED___' && (
              <TextPublished value={eyebrow_text} element="p" className="text-[11px] font-medium uppercase tracking-[0.22em] mb-4"
                style={{ color: `${textColors.muted}80`, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.22em' }} />
            )}
            <HeadlinePublished value={headline} level="h2" className="mb-6" style={{ color: textColors.heading, ...h2Typography }} />
            {subheadline && subheadline !== '___REMOVED___' && (
              <TextPublished value={subheadline} element="p" className="text-2xl mb-8" style={{ color: textColors.body, fontSize: '1.5rem' }} />
            )}

            {/* Benefits */}
            {benefits.length > 0 && (
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500/15 ring-1 ring-green-500/25">
                      <CheckmarkIconPublished color="#10b981" size={14} />
                    </div>
                    <span style={{ color: textColors.muted }}>{benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Interactive Form Island */}
          <div id="form-section" className="bg-gray-100 rounded-2xl p-8 shadow-xl border border-gray-200 mt-12 lg:mt-0">
            <FormIsland
              formId={`form-${sectionId}`}
              submitButtonText={cta_text}
              submitButtonColor={ctaBg}
              textColor={ctaText}
              publishedPageId={publishedPageId || ''}
              pageOwnerId={pageOwnerId || ''}
              placeholderText={placeholder_text}
              formLabel={form_label}
              privacyText={privacy_text}
            />

            {/* Trust Indicators */}
            {trustItems.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4 text-sm flex-wrap gap-y-2">
                  {trustItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckmarkIconPublished color="#10b981" size={16} />
                      <span style={{ color: textColors.muted, fontSize: '0.875rem' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
