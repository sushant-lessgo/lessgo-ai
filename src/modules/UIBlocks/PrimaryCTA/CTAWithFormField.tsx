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
import { TrustIndicators } from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
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
  benefit_1?: string;
  benefit_2?: string;
  benefit_3?: string;
  benefit_4?: string;
  benefit_5?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
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
  },
  benefit_1: { 
    type: 'string' as const, 
    default: 'Free 14-day trial' 
  },
  benefit_2: { 
    type: 'string' as const, 
    default: 'No credit card required' 
  },
  benefit_3: { 
    type: 'string' as const, 
    default: 'Cancel anytime' 
  },
  benefit_4: { 
    type: 'string' as const, 
    default: 'Full feature access' 
  },
  benefit_5: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: 'Secure & encrypted' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'GDPR compliant' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'No spam policy' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
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

  // Handle benefits - support both legacy pipe-separated format and individual fields
  const getBenefits = (): string[] => {
    const individualItems = [
      blockContent.benefit_1,
      blockContent.benefit_2, 
      blockContent.benefit_3,
      blockContent.benefit_4,
      blockContent.benefit_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.benefits 
      ? blockContent.benefits.split('|').map(item => item.trim()).filter(Boolean)
      : ['Free 14-day trial', 'No credit card required', 'Cancel anytime'];
  };
  
  const benefits = getBenefits();
  
  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return ['Secure & encrypted', 'GDPR compliant', 'No spam policy'];
  };
  
  const trustItems = getTrustItems();

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
              {benefits.map((benefit, index) => {
                // Find the actual index in the original benefit fields array
                let actualIndex = -1;
                let validCount = 0;
                const benefitFields = [
                  blockContent.benefit_1,
                  blockContent.benefit_2,
                  blockContent.benefit_3,
                  blockContent.benefit_4,
                  blockContent.benefit_5
                ];
                
                for (let i = 0; i < benefitFields.length; i++) {
                  if (benefitFields[i] != null && benefitFields[i]!.trim() !== '' && benefitFields[i] !== '___REMOVED___') {
                    if (validCount === index) {
                      actualIndex = i;
                      break;
                    }
                    validCount++;
                  }
                }
                
                return (
                  <div key={index} className="flex items-center space-x-3 relative group/benefit-item">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {mode === 'edit' ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <EditableAdaptiveText
                          mode={mode}
                          value={benefit}
                          onEdit={(value) => {
                            if (actualIndex !== -1) {
                              const fieldKey = `benefit_${actualIndex + 1}` as keyof CTAWithFormFieldContent;
                              handleContentUpdate(fieldKey, value);
                            }
                          }}
                          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
                          colorTokens={colorTokens}
                          variant="body"
                          className={`${dynamicTextColors?.body || colorTokens.textSecondary} flex-1`}
                          placeholder={`Benefit ${actualIndex + 1}`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={`benefit_${actualIndex + 1}`}
                        />
                        
                        {/* Remove button for benefit */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (actualIndex !== -1) {
                              const fieldKey = `benefit_${actualIndex + 1}` as keyof CTAWithFormFieldContent;
                              handleContentUpdate(fieldKey, '___REMOVED___');
                            }
                          }}
                          className="opacity-0 group-hover/benefit-item:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
                          title="Remove this benefit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className={`${dynamicTextColors?.body || colorTokens.textSecondary}`}>
                        {benefit}
                      </span>
                    )}
                  </div>
                );
              })}
              
              {/* Add benefit button - only show in edit mode */}
              {mode === 'edit' && benefits.length < 5 && (
                <button
                  onClick={() => {
                    // Find first empty slot and add placeholder
                    const emptyIndex = [
                      blockContent.benefit_1,
                      blockContent.benefit_2,
                      blockContent.benefit_3,
                      blockContent.benefit_4,
                      blockContent.benefit_5
                    ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                    
                    if (emptyIndex !== -1) {
                      const fieldKey = `benefit_${emptyIndex + 1}` as keyof CTAWithFormFieldContent;
                      handleContentUpdate(fieldKey, 'New benefit');
                    }
                  }}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add benefit</span>
                </button>
              )}
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
            {(trustItems.length > 0 || mode === 'edit') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {mode === 'edit' ? (
                  <EditableTrustIndicators
                    mode={mode}
                    trustItems={[
                      blockContent.trust_item_1 || '',
                      blockContent.trust_item_2 || '',
                      blockContent.trust_item_3 || '',
                      blockContent.trust_item_4 || '',
                      blockContent.trust_item_5 || ''
                    ]}
                    onTrustItemChange={(index, value) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof CTAWithFormFieldContent;
                      handleContentUpdate(fieldKey, value);
                    }}
                    onAddTrustItem={() => {
                      const emptyIndex = [
                        blockContent.trust_item_1,
                        blockContent.trust_item_2,
                        blockContent.trust_item_3,
                        blockContent.trust_item_4,
                        blockContent.trust_item_5
                      ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                      
                      if (emptyIndex !== -1) {
                        const fieldKey = `trust_item_${emptyIndex + 1}` as keyof CTAWithFormFieldContent;
                        handleContentUpdate(fieldKey, 'New trust item');
                      }
                    }}
                    onRemoveTrustItem={(index) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof CTAWithFormFieldContent;
                      handleContentUpdate(fieldKey, '___REMOVED___');
                    }}
                    colorTokens={colorTokens}
                    sectionBackground="bg-white"
                    sectionId={sectionId}
                    backgroundType="neutral"
                    iconColor="text-green-500"
                    colorClass="text-gray-500"
                  />
                ) : (
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <TrustIndicators 
                      items={trustItems}
                      colorClass="text-gray-500"
                      iconColor="text-green-500"
                    />
                  </div>
                )}
              </div>
            )}
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
    { key: 'benefits', label: 'Benefits List (pipe separated)', type: 'textarea', required: false },
    { key: 'benefit_1', label: 'Benefit 1', type: 'text', required: false },
    { key: 'benefit_2', label: 'Benefit 2', type: 'text', required: false },
    { key: 'benefit_3', label: 'Benefit 3', type: 'text', required: false },
    { key: 'benefit_4', label: 'Benefit 4', type: 'text', required: false },
    { key: 'benefit_5', label: 'Benefit 5', type: 'text', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Item 4', type: 'text', required: false },
    { key: 'trust_item_5', label: 'Trust Item 5', type: 'text', required: false }
  ],
  
  useCases: [
    'Newsletter signups',
    'Trial registrations',
    'Demo requests',
    'Whitepaper downloads'
  ]
};