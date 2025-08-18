// components/layout/CountdownLimitedCTA.tsx
// Production-ready urgency-driven CTA with countdown timer

import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface CountdownLimitedCTAContent {
  headline: string;
  subheadline?: string;
  urgency_text: string;
  urgency_badge_text: string;
  cta_text: string;
  final_cta_headline: string;
  offer_details: string;
  offer_detail_1?: string;
  offer_detail_2?: string;
  offer_detail_3?: string;
  offer_detail_4?: string;
  offer_detail_5?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Limited Time Offer' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Get 50% off your first year. This exclusive deal expires soon.' 
  },
  urgency_text: { 
    type: 'string' as const, 
    default: 'Offer expires in:' 
  },
  urgency_badge_text: { 
    type: 'string' as const, 
    default: 'LIMITED TIME OFFER' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Claim Your Discount' 
  },
  final_cta_headline: { 
    type: 'string' as const, 
    default: 'Ready to Get Started?' 
  },
  offer_details: { 
    type: 'string' as const, 
    default: 'No contract required|Cancel anytime|Full feature access|Premium support included' 
  },
  offer_detail_1: { 
    type: 'string' as const, 
    default: 'No contract required' 
  },
  offer_detail_2: { 
    type: 'string' as const, 
    default: 'Cancel anytime' 
  },
  offer_detail_3: { 
    type: 'string' as const, 
    default: 'Full feature access' 
  },
  offer_detail_4: { 
    type: 'string' as const, 
    default: 'Premium support included' 
  },
  offer_detail_5: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Countdown Timer Component
const CountdownTimer = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        seconds -= 1;
        if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
          if (minutes < 0) {
            minutes = 59;
            hours -= 1;
            if (hours < 0) {
              hours = 23;
              days -= 1;
              if (days < 0) {
                // Reset to demo countdown
                return { days: 2, hours: 14, minutes: 32, seconds: 45 };
              }
            }
          }
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="text-center">
      <div className="bg-red-600 text-white text-2xl lg:text-3xl font-bold px-4 py-3 rounded-lg min-w-[80px] shadow-lg">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-sm text-gray-600 mt-2 font-medium">{label}</div>
    </div>
  );

  return (
    <div className="flex items-center justify-center space-x-4 lg:space-x-6">
      <TimeUnit value={timeLeft.days} label="Days" />
      <div className="text-red-600 text-2xl font-bold">:</div>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <div className="text-red-600 text-2xl font-bold">:</div>
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <div className="text-red-600 text-2xl font-bold">:</div>
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
});
CountdownTimer.displayName = 'CountdownTimer';

export default function CountdownLimitedCTA(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<CountdownLimitedCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Handle offer details - support both legacy pipe-separated format and individual fields
  const getOfferDetails = (): string[] => {
    // Check if individual offer detail fields exist
    const individualItems = [
      blockContent.offer_detail_1,
      blockContent.offer_detail_2, 
      blockContent.offer_detail_3,
      blockContent.offer_detail_4,
      blockContent.offer_detail_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // If individual items exist, use them; otherwise fall back to legacy format
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    // Legacy format fallback
    return blockContent.offer_details 
      ? blockContent.offer_details.split('|').map(item => item.trim()).filter(Boolean)
      : ['No contract required', 'Cancel anytime', 'Full feature access'];
  };
  
  const offerDetails = getOfferDetails();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CountdownLimitedCTA"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Urgency Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-red-100 border border-red-200 rounded-full text-red-800 mb-6">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.urgency_badge_text || ''}
            onEdit={(value) => handleContentUpdate('urgency_badge_text', value)}
            backgroundType="neutral"
            colorTokens={colorTokens}
            variant="body"
            className="font-semibold text-sm text-red-800"
            sectionId={sectionId}
            elementKey="urgency_badge_text"
            sectionBackground="bg-red-100"
          />
        </div>

        {/* Main Headlines */}
        <EditableAdaptiveHeadline
          mode={mode}
          value={blockContent.headline || ''}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h2"
          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="text-lg mb-8 max-w-2xl mx-auto"
            sectionId={sectionId}
            elementKey="subheadline"
            sectionBackground={sectionBackground}
          />
        )}

        {/* Countdown Section */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-red-200 mb-8">
          <div className="mb-6">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.urgency_text || ''}
              onEdit={(value) => handleContentUpdate('urgency_text', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              className="text-gray-700 font-semibold mb-4"
              sectionId={sectionId}
              elementKey="urgency_text"
              sectionBackground="bg-white"
            />
          </div>
          
          <CountdownTimer />
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <CTAButton
            text={blockContent.cta_text}
            colorTokens={colorTokens}
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
            variant="primary"
            size="large"
            sectionId={sectionId}
            elementKey="cta_text"
            onClick={createCTAClickHandler(sectionId, "cta_text")}
          />
        </div>

        {/* Offer Details */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {offerDetails.map((detail, index) => {
            // Find the actual index in the original offer detail fields array
            let actualIndex = -1;
            let validCount = 0;
            const offerFields = [
              blockContent.offer_detail_1,
              blockContent.offer_detail_2,
              blockContent.offer_detail_3,
              blockContent.offer_detail_4,
              blockContent.offer_detail_5
            ];
            
            for (let i = 0; i < offerFields.length; i++) {
              if (offerFields[i] != null && offerFields[i]!.trim() !== '' && offerFields[i] !== '___REMOVED___') {
                if (validCount === index) {
                  actualIndex = i;
                  break;
                }
                validCount++;
              }
            }
            
            return (
              <div key={index} className="flex items-center justify-center space-x-2 text-sm relative group/offer-item">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {mode !== 'preview' ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <EditableAdaptiveText
                      mode={mode}
                      value={detail}
                      onEdit={(value) => {
                        if (actualIndex !== -1) {
                          const fieldKey = `offer_detail_${actualIndex + 1}` as keyof CountdownLimitedCTAContent;
                          handleContentUpdate(fieldKey, value);
                        }
                      }}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-center flex-1`}
                      placeholder={`Offer detail ${actualIndex + 1}`}
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`offer_detail_${actualIndex + 1}`}
                    />
                    
                    {/* Remove button for offer detail */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (actualIndex !== -1) {
                          const fieldKey = `offer_detail_${actualIndex + 1}` as keyof CountdownLimitedCTAContent;
                          handleContentUpdate(fieldKey, '___REMOVED___');
                        }
                      }}
                      className="opacity-0 group-hover/offer-item:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
                      title="Remove this offer detail"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-center`}>
                    {detail}
                  </span>
                )}
              </div>
            );
          })}
          
          {/* Add offer detail button - only show in edit mode */}
          {mode !== 'preview' && offerDetails.length < 5 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  // Find first empty slot and add placeholder
                  const emptyIndex = [
                    blockContent.offer_detail_1,
                    blockContent.offer_detail_2,
                    blockContent.offer_detail_3,
                    blockContent.offer_detail_4,
                    blockContent.offer_detail_5
                  ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                  
                  if (emptyIndex !== -1) {
                    const fieldKey = `offer_detail_${emptyIndex + 1}` as keyof CountdownLimitedCTAContent;
                    handleContentUpdate(fieldKey, 'New offer detail');
                  }
                }}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add detail</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'CountdownLimitedCTA',
  category: 'CTA Sections',
  description: 'Urgency-driven CTA with live countdown timer',
  tags: ['cta', 'urgency', 'countdown', 'limited-time', 'conversion'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'high',
  estimatedBuildTime: '30 minutes',
  
  features: [
    'Live countdown timer',
    'Urgency-focused design',
    'Limited time offer badges',
    'Offer details grid',
    'High-contrast CTA styling'
  ],
  
  contentFields: [
    { key: 'headline', label: 'Offer Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Offer Description', type: 'textarea', required: false },
    { key: 'urgency_text', label: 'Countdown Label', type: 'text', required: true },
    { key: 'urgency_badge_text', label: 'Urgency Badge Text', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'final_cta_headline', label: 'Final CTA Headline', type: 'text', required: false },
    { key: 'offer_details', label: 'Offer Details (pipe separated - legacy)', type: 'textarea', required: false },
    { key: 'offer_detail_1', label: 'Offer Detail 1', type: 'text', required: false },
    { key: 'offer_detail_2', label: 'Offer Detail 2', type: 'text', required: false },
    { key: 'offer_detail_3', label: 'Offer Detail 3', type: 'text', required: false },
    { key: 'offer_detail_4', label: 'Offer Detail 4', type: 'text', required: false },
    { key: 'offer_detail_5', label: 'Offer Detail 5', type: 'text', required: false }
  ],
  
  useCases: [
    'Limited time promotions',
    'Flash sales',
    'Early bird offers',
    'Seasonal campaigns'
  ]
};