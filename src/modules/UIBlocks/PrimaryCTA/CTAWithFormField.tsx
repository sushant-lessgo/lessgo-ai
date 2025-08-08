// components/layout/CTAWithFormField.tsx
// Production-ready lead capture CTA with form field

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface CTAWithFormFieldContent {
  headline: string;
  subheadline?: string;
  form_label: string;
  placeholder_text: string;
  cta_text: string;
  privacy_text: string;
  benefits: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Get Started Today' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Join thousands of users who are already saving time and increasing productivity.' 
  },
  form_label: { 
    type: 'string' as const, 
    default: 'Work Email Address' 
  },
  placeholder_text: { 
    type: 'string' as const, 
    default: 'Enter your work email' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Free Trial' 
  },
  privacy_text: { 
    type: 'string' as const, 
    default: 'No spam. Unsubscribe at any time.' 
  },
  benefits: { 
    type: 'string' as const, 
    default: 'Free 14-day trial|No credit card required|Cancel anytime|Full feature access' 
  }
};

export default function CTAWithFormField(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<CTAWithFormFieldContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Parse benefits from pipe-separated string
  const benefits = blockContent.benefits 
    ? blockContent.benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateEmail(email);
    setIsValid(valid);
    if (valid) {
      // Handle form submission
      console.log('Form submitted with email:', email);
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CTAWithFormField"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Content */}
          <div>
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
              colorTokens={colorTokens}
              className="mb-6"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {blockContent.subheadline && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg mb-8"
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            {/* Benefits List */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`${dynamicTextColors?.body || colorTokens.textSecondary}`}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form Label */}
              <div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.form_label || ''}
                  onEdit={(value) => handleContentUpdate('form_label', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 font-semibold mb-2 block"
                  sectionId={sectionId}
                  elementKey="form_label"
                  sectionBackground="bg-white"
                />
                
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={blockContent.placeholder_text}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                  }`}
                  required
                />
                
                {!isValid && (
                  <p className="text-red-600 text-sm mt-2">Please enter a valid email address</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                {blockContent.cta_text}
              </button>

              {/* Privacy Text */}
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.privacy_text || ''}
                onEdit={(value) => handleContentUpdate('privacy_text', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="text-gray-500 text-center text-sm"
                sectionId={sectionId}
                elementKey="privacy_text"
                sectionBackground="bg-white"
              />
            </form>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>GDPR Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'CTAWithFormField',
  category: 'CTA Sections',
  description: 'Lead capture CTA with email form and benefits list',
  tags: ['cta', 'form', 'lead-capture', 'email', 'conversion'],
  defaultBackgroundType: 'secondary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Email validation',
    'Benefits list with checkmarks',
    'Privacy reassurance',
    'Trust indicators',
    'Responsive form layout'
  ],
  
  contentFields: [
    { key: 'headline', label: 'CTA Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'form_label', label: 'Form Field Label', type: 'text', required: true },
    { key: 'placeholder_text', label: 'Input Placeholder', type: 'text', required: true },
    { key: 'cta_text', label: 'Submit Button Text', type: 'text', required: true },
    { key: 'privacy_text', label: 'Privacy Reassurance', type: 'text', required: true },
    { key: 'benefits', label: 'Benefits List (pipe separated)', type: 'textarea', required: true }
  ],
  
  useCases: [
    'Newsletter signups',
    'Trial registrations',
    'Demo requests',
    'Whitepaper downloads'
  ]
};