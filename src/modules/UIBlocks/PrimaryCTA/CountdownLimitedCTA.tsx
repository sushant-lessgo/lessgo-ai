// components/layout/CountdownLimitedCTA.tsx
// Production-ready urgency-driven CTA with countdown timer

import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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
  cta_text: string;
  offer_details: string;
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
  cta_text: { 
    type: 'string' as const, 
    default: 'Claim Your Discount' 
  },
  offer_details: { 
    type: 'string' as const, 
    default: 'No contract required|Cancel anytime|Full feature access|Premium support included' 
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

  // Parse offer details from pipe-separated string
  const offerDetails = blockContent.offer_details 
    ? blockContent.offer_details.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CountdownLimitedCTA"
      backgroundType={props.backgroundType || 'primary'}
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
          <span className="font-semibold text-sm">LIMITED TIME OFFER</span>
        </div>

        {/* Main Headlines */}
        <EditableAdaptiveHeadline
          mode={mode}
          value={blockContent.headline}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h2"
          backgroundType={props.backgroundType || 'primary'}
          colorTokens={colorTokens}
          textStyle={getTextStyle('h1')}
          className="mb-4"
          sectionId={sectionId}
          elementKey="headline"
          sectionBackground={sectionBackground}
        />

        {blockContent.subheadline && (
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.subheadline}
            onEdit={(value) => handleContentUpdate('subheadline', value)}
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            variant="body"
            textStyle={getTextStyle('body-lg')}
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
              value={blockContent.urgency_text}
              onEdit={(value) => handleContentUpdate('urgency_text', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
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
            textStyle={getTextStyle('body-lg')}
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
            variant="primary"
            size="large"
            sectionId={sectionId}
            elementKey="cta_text"
            onClick={createCTAClickHandler(sectionId)}
          />
        </div>

        {/* Offer Details */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {offerDetails.map((detail, index) => (
            <div key={index} className="flex items-center justify-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-center`}>
                {detail}
              </span>
            </div>
          ))}
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
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'offer_details', label: 'Offer Details (pipe separated)', type: 'textarea', required: true }
  ],
  
  useCases: [
    'Limited time promotions',
    'Flash sales',
    'Early bird offers',
    'Seasonal campaigns'
  ]
};