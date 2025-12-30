/**
 * TestimonialFAQs - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { IconPublished } from '@/components/published/IconPublished';

interface TestimonialFAQsContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 3 items)
  question_1: string;
  answer_1: string;
  customer_name_1: string;
  customer_title_1: string;
  customer_company_1: string;
  rating_1: string;
  question_2: string;
  answer_2: string;
  customer_name_2: string;
  customer_title_2: string;
  customer_company_2: string;
  rating_2: string;
  question_3: string;
  answer_3: string;
  customer_name_3: string;
  customer_title_3: string;
  customer_company_3: string;
  rating_3: string;
  // Trust indicators
  trust_text: string;
  overall_rating: string;
  satisfaction_text: string;
  show_trust_section?: boolean;
  // Star icon fields
  star_icon?: string;
  overall_rating_star_icon?: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
  customer_names?: string;
  customer_titles?: string;
  customer_companies?: string;
}

export default function TestimonialFAQsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Real Answers from Real Customers';
  const subheadline = props.subheadline || '';
  const showTrustSection = props.show_trust_section !== false; // default true
  const starIcon = props.star_icon || '⭐';
  const overallRatingStarIcon = props.overall_rating_star_icon || '⭐';

  // Helper function to render stars
  const renderStars = (rating: string | number, useOverallIcon: boolean = false) => {
    const ratingNum = typeof rating === 'string' ? parseFloat(rating) || 5 : rating;
    const starCount = Math.round(ratingNum);
    const icon = useOverallIcon ? overallRatingStarIcon : starIcon;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: starCount }, (_, i) => (
          <IconPublished key={i} value={icon} size="sm" color="#FBBF24" />
        ))}
      </div>
    );
  };

  // Helper function to get testimonial FAQ items
  const getTestimonialFAQItems = () => {
    const items = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const question = props[`question_${i}` as keyof typeof props];
      const answer = props[`answer_${i}` as keyof typeof props];
      const customerName = props[`customer_name_${i}` as keyof typeof props];
      const customerTitle = props[`customer_title_${i}` as keyof typeof props];
      const customerCompany = props[`customer_company_${i}` as keyof typeof props];
      const rating = props[`rating_${i}` as keyof typeof props];

      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          customerName: (customerName && typeof customerName === 'string' && customerName !== '___REMOVED___') ? customerName.trim() : 'Customer',
          customerTitle: (customerTitle && typeof customerTitle === 'string' && customerTitle !== '___REMOVED___') ? customerTitle.trim() : 'Customer',
          customerCompany: (customerCompany && typeof customerCompany === 'string' && customerCompany !== '___REMOVED___') ? customerCompany.trim() : 'Company',
          rating: (rating && typeof rating === 'string' && rating !== '___REMOVED___') ? rating.trim() : '5',
          index: i
        });
      }
    }

    // Fallback to legacy format if no individual items found
    if (items.length === 0) {
      const questionsRaw = props.questions;
      const answersRaw = props.answers;
      const customerNamesRaw = props.customer_names;
      const customerTitlesRaw = props.customer_titles;
      const customerCompaniesRaw = props.customer_companies;

      const questions = (typeof questionsRaw === 'string' ? questionsRaw.split('|').map(q => q.trim()).filter(Boolean) : []);
      const answers = (typeof answersRaw === 'string' ? answersRaw.split('|').map(a => a.trim()).filter(Boolean) : []);
      const customerNames = (typeof customerNamesRaw === 'string' ? customerNamesRaw.split('|').map(n => n.trim()).filter(Boolean) : []);
      const customerTitles = (typeof customerTitlesRaw === 'string' ? customerTitlesRaw.split('|').map(t => t.trim()).filter(Boolean) : []);
      const customerCompanies = (typeof customerCompaniesRaw === 'string' ? customerCompaniesRaw.split('|').map(c => c.trim()).filter(Boolean) : []);

      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          customerName: customerNames[index] || 'Customer',
          customerTitle: customerTitles[index] || 'Customer',
          customerCompany: customerCompanies[index] || 'Company',
          rating: '5',
          index: index + 1
        });
      });
    }

    return items;
  };

  const testimonialItems = getTestimonialFAQItems();

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const questionTypography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  // Accent color
  const accentColor = theme?.colors?.accentColor || '#3B82F6';

  // Helper to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase() || 'C';
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                textAlign: 'center',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Testimonial-style FAQs */}
        <div className="space-y-10">
          {testimonialItems.map((item) => (
            <div
              key={item.index}
              className="relative bg-white rounded-2xl p-8 shadow-lg"
              style={{
                backgroundColor: backgroundType === 'primary' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Question */}
              <div className="mb-6">
                <span className="text-3xl opacity-20">"</span>
                <TextPublished
                  value={item.question}
                  style={{
                    color: textColors.heading,
                    ...questionTypography,
                    fontWeight: 600,
                    display: 'inline'
                  }}
                />
                <span className="text-3xl opacity-20">"</span>
              </div>

              {/* Testimonial Answer */}
              {item.answer && item.answer.trim() !== '' && (
                <div className="mb-6">
                  <span className="text-2xl opacity-10">"</span>
                  <TextPublished
                    value={item.answer}
                    style={{
                      color: textColors.muted,
                      ...bodyTypography,
                      fontStyle: 'italic',
                      lineHeight: '1.75',
                      display: 'inline'
                    }}
                  />
                  <span className="text-2xl opacity-10">"</span>
                </div>
              )}

              {/* Customer Attribution */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    backgroundColor: accentColor
                  }}
                >
                  {getInitials(item.customerName)}
                </div>

                {/* Customer Info */}
                <div className="flex-1">
                  <TextPublished
                    value={item.customerName}
                    style={{
                      color: textColors.heading,
                      ...h3Typography,
                      fontWeight: 600
                    }}
                  />
                  <div
                    className="text-sm flex items-center gap-1"
                    style={{ color: textColors.muted }}
                  >
                    <TextPublished
                      value={item.customerTitle}
                      style={{
                        fontSize: '0.875rem',
                        display: 'inline'
                      }}
                    />
                    <span> at </span>
                    <TextPublished
                      value={item.customerCompany}
                      style={{
                        fontSize: '0.875rem',
                        display: 'inline'
                      }}
                    />
                  </div>
                </div>

                {/* Star Rating */}
                <div className="ml-auto">
                  {renderStars(item.rating)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        {showTrustSection && (
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {props.trust_text && typeof props.trust_text === 'string' && props.trust_text !== '___REMOVED___' && (
                <TextPublished
                  value={props.trust_text}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                />
              )}

              {props.overall_rating && typeof props.overall_rating === 'string' && props.overall_rating !== '___REMOVED___' && (
                <div className="flex items-center gap-2">
                  {renderStars(5, true)}
                  <TextPublished
                    value={props.overall_rating}
                    style={{
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              )}

              {props.satisfaction_text && typeof props.satisfaction_text === 'string' && props.satisfaction_text !== '___REMOVED___' && (
                <TextPublished
                  value={props.satisfaction_text}
                  style={{
                    fontSize: '0.875rem'
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
