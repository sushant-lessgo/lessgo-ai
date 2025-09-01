// components/FounderNote/MissionQuoteOverlay.tsx
// Mission-driven messaging with overlay design
// Builds trust through purpose-driven storytelling and visual impact

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface MissionQuoteOverlayContent {
  mission_quote: string;
  mission_context: string;
  founder_name: string;
  cta_text: string;
  badge_text?: string;
  mission_stats?: string;
  mission_stat_1: string;
  mission_stat_2: string;
  mission_stat_3: string;
  mission_stat_4: string;
  founder_title?: string;
  mission_year?: string;
  trust_items?: string;
  trust_item_1: string;
  trust_item_2: string;
  trust_item_3: string;
  trust_item_4: string;
  trust_item_5: string;
  background_image?: string;
  badge_icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  mission_quote: { 
    type: 'string' as const, 
    default: '"We believe technology should empower people, not replace them. That\'s why we\'re building tools that amplify human creativity instead of automating it away."' 
  },
  mission_context: { 
    type: 'string' as const, 
    default: 'When I started this company in 2020, I watched my friends struggle with tools that were supposed to make their lives easier but actually made them more complicated. We decided to build something different - something that puts human needs first.' 
  },
  founder_name: { 
    type: 'string' as const, 
    default: 'Sarah Chen' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Join Our Mission' 
  },
  badge_text: { 
    type: 'string' as const, 
    default: 'Our Mission' 
  },
  badge_icon: {
    type: 'string' as const,
    default: '🌟'
  },
  mission_stats: { 
    type: 'string' as const, 
    default: '50,000+ creators empowered|$2M+ in creator earnings|100+ countries served' 
  },
  mission_stat_1: { type: 'string' as const, default: '50,000+ creators empowered' },
  mission_stat_2: { type: 'string' as const, default: '$2M+ in creator earnings' },
  mission_stat_3: { type: 'string' as const, default: '100+ countries served' },
  mission_stat_4: { type: 'string' as const, default: '' },
  founder_title: { 
    type: 'string' as const, 
    default: 'Founder & CEO' 
  },
  mission_year: { 
    type: 'string' as const, 
    default: 'Est. 2020' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'B-Corp Certified|Climate Neutral|Open Source' 
  },
  trust_item_1: { type: 'string' as const, default: 'B-Corp Certified' },
  trust_item_2: { type: 'string' as const, default: 'Climate Neutral' },
  trust_item_3: { type: 'string' as const, default: 'Open Source' },
  trust_item_4: { type: 'string' as const, default: '' },
  trust_item_5: { type: 'string' as const, default: '' },
  background_image: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Mission Background Component
const MissionBackgroundPlaceholder = React.memo(() => (
  <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900">
    {/* Overlay pattern */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
    </div>

    {/* Floating elements */}
    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white bg-opacity-5 rounded-full blur-xl animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white bg-opacity-5 rounded-full blur-xl animate-pulse delay-1000"></div>
    <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white bg-opacity-5 rounded-full blur-xl animate-pulse delay-500"></div>

    {/* Grid overlay */}
    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
  </div>
));
MissionBackgroundPlaceholder.displayName = 'MissionBackgroundPlaceholder';

export default function MissionQuoteOverlay(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<MissionQuoteOverlayContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Helper function to get mission stats with individual field support
  const getMissionStats = (): string[] => {
    const individualStats = [
      blockContent.mission_stat_1,
      blockContent.mission_stat_2,
      blockContent.mission_stat_3,
      blockContent.mission_stat_4
    ].filter((stat): stat is string => Boolean(stat && stat.trim() !== '' && stat !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualStats.length > 0) {
      return individualStats;
    }
    
    return blockContent.mission_stats 
      ? blockContent.mission_stats.split('|').map(item => item.trim()).filter(Boolean)
      : ['50,000+ creators empowered', '$2M+ in creator earnings'];
  };
  
  const missionStats = getMissionStats();
    
  // Typography styles
  const h2Style = getTypographyStyle('h2');
  const bodyStyle = getTypographyStyle('body-lg');

  // Helper function to get trust items with individual field support
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : ['B-Corp Certified', 'Climate Neutral'];
  };
  
  const trustItems = getTrustItems();

  // Get showImageToolbar for handling image clicks
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MissionQuoteOverlay"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        
        {/* Background Image or Placeholder */}
        {blockContent.background_image && blockContent.background_image !== '' ? (
          <div className="absolute inset-0">
            <img
              src={blockContent.background_image}
              alt="Mission background"
              className="w-full h-full object-cover cursor-pointer"
              data-image-id={`${sectionId}-background-image`}
              onMouseUp={(e) => {
                        // Image toolbar is only available in edit mode
                      }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </div>
        ) : (
          <MissionBackgroundPlaceholder />
        )}

        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
          <div className="text-center space-y-8">
            
            {/* Badge */}
            {(blockContent.badge_text || blockContent.badge_icon || mode !== 'preview') && (
              <div className="flex items-center justify-center space-x-2">
                {mode !== 'preview' ? (
                  <div className="flex items-center space-x-2">
                    <div className="relative group/icon-edit">
                      <IconEditableText
                        mode={mode}
                        value={blockContent.badge_icon || '🌟'}
                        onEdit={(value) => handleContentUpdate('badge_icon', value)}
                        backgroundType={'primary' as any}
                        colorTokens={colorTokens}
                        iconSize="md"
                        className="text-white"
                        sectionId={sectionId}
                        elementKey="badge_icon"
                      />
                    </div>
                    <AccentBadge
                      mode={mode}
                      value={blockContent.badge_text || ''}
                      onEdit={(value) => handleContentUpdate('badge_text', value)}
                      colorTokens={colorTokens}
                      textStyle={{ fontSize: '0.875rem', fontWeight: '500', color: '#ffffff' }}
                      placeholder="Our Mission"
                      sectionId={sectionId}
                      elementKey="badge_text"
                      sectionBackground="transparent"
                    />
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 border border-white border-opacity-20">
                    <span className="text-lg">{blockContent.badge_icon || '🌟'}</span>
                    <span className="text-white text-sm font-medium">{blockContent.badge_text || 'Our Mission'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Mission Quote */}
            <div className="max-w-4xl mx-auto">
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.mission_quote || ''}
                onEdit={(value) => handleContentUpdate('mission_quote', value)}
                level="h1"
                backgroundType="primary"
                colorTokens={colorTokens}
                textStyle={{ fontSize: '1.875rem', fontWeight: '700', color: '#ffffff', lineHeight: '1.25' }}
                className="italic"
                sectionId={sectionId}
                elementKey="mission_quote"
                sectionBackground="transparent"
              />
            </div>

            {/* Founder Attribution */}
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {blockContent.founder_name?.charAt(0) || 'F'}
                </span>
              </div>
              <div className="text-left">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.founder_name || ''}
                  onEdit={(value) => handleContentUpdate('founder_name', value)}
                  backgroundType="primary"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ color: '#ffffff', fontWeight: '600' }}
                  placeholder="Founder Name"
                  sectionId={sectionId}
                  elementKey="founder_name"
                  sectionBackground="transparent"
                />
                <div className="flex items-center space-x-2">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.founder_title || ''}
                    onEdit={(value) => handleContentUpdate('founder_title', value)}
                    backgroundType="primary"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}
                    placeholder="Title"
                    sectionId={sectionId}
                    elementKey="founder_title"
                    sectionBackground="transparent"
                  />
                  {blockContent.mission_year && (
                    <>
                      <span className="text-white text-opacity-60">•</span>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.mission_year || ''}
                        onEdit={(value) => handleContentUpdate('mission_year', value)}
                        backgroundType="primary"
                        colorTokens={colorTokens}
                        variant="body"
                        textStyle={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}
                        placeholder="Est. Year"
                        sectionId={sectionId}
                        elementKey="mission_year"
                        sectionBackground="transparent"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mission Stats */}
            {mode !== 'preview' ? (
              <div className="bg-black bg-opacity-30 rounded-lg p-6 max-w-3xl mx-auto">
                <h4 className="text-white font-semibold mb-4 text-center">Mission Statistics</h4>
                <div className="space-y-3">
                  {[
                    { key: 'mission_stat_1', placeholder: '50,000+ creators empowered' },
                    { key: 'mission_stat_2', placeholder: '$2M+ in creator earnings' },
                    { key: 'mission_stat_3', placeholder: '100+ countries served' },
                    { key: 'mission_stat_4', placeholder: 'Additional statistic...' }
                  ].map((stat, index) => (
                    ((blockContent as any)[stat.key] || mode !== 'preview') && (
                      <div key={index} className="relative group/stat-item flex items-center space-x-2">
                        <EditableAdaptiveText
                          mode={mode}
                          value={(blockContent as any)[stat.key] || ''}
                          onEdit={(value) => handleContentUpdate(stat.key as keyof MissionQuoteOverlayContent, value)}
                          backgroundType="primary"
                          colorTokens={colorTokens}
                          variant="body"
                          textStyle={{ color: '#ffffff', fontWeight: '500' }}
                          placeholder={stat.placeholder}
                          sectionId={sectionId}
                          elementKey={stat.key}
                          sectionBackground="transparent"
                        />
                        
                        {/* Remove button */}
                        {mode !== 'preview' && (blockContent as any)[stat.key] && (blockContent as any)[stat.key] !== '___REMOVED___' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate(stat.key as keyof MissionQuoteOverlayContent, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/stat-item:opacity-100 text-red-400 hover:text-red-300 transition-opacity duration-200"
                            title="Remove this statistic"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  ))}
                  
                  {/* Add button */}
                  {mode !== 'preview' && missionStats.length < 4 && (
                    <button
                      onClick={() => {
                        const emptyIndex = [
                          blockContent.mission_stat_1,
                          blockContent.mission_stat_2,
                          blockContent.mission_stat_3,
                          blockContent.mission_stat_4
                        ].findIndex(stat => !stat || stat.trim() === '' || stat === '___REMOVED___');
                        
                        if (emptyIndex !== -1) {
                          const fieldKey = `mission_stat_${emptyIndex + 1}` as keyof MissionQuoteOverlayContent;
                          handleContentUpdate(fieldKey, 'New statistic');
                        }
                      }}
                      className="flex items-center space-x-1 text-sm text-blue-200 hover:text-blue-100 transition-colors mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add statistic</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {missionStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div style={h2Style} className="text-2xl lg:text-3xl font-bold text-white mb-1">
                      {stat.split(' ')[0]}
                    </div>
                    <div style={bodyStyle} className="text-white text-opacity-80 text-sm">
                      {stat.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <div>
              <CTAButton
                text={blockContent.cta_text}
                colorTokens={colorTokens}
                textStyle={{ fontSize: '1.125rem', fontWeight: '600' }}
                className="bg-white text-gray-900 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 px-8 py-4"
                variant="secondary"
                sectionId={sectionId}
                elementKey="cta_text"
              />
            </div>
          </div>
        </div>

        {/* Bottom overlay with context and trust */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-end">
              
              {/* Mission Context */}
              <div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.mission_context || ''}
                  onEdit={(value) => handleContentUpdate('mission_context', value)}
                  backgroundType="primary"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.625' }}
                  placeholder="Add context about your mission and why it matters..."
                  sectionId={sectionId}
                  elementKey="mission_context"
                  sectionBackground="transparent"
                />
              </div>

              {/* Trust Indicators */}
              <div className="lg:text-right">
                {mode !== 'preview' ? (
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
                      const fieldKey = `trust_item_${index + 1}` as keyof MissionQuoteOverlayContent;
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
                        const fieldKey = `trust_item_${emptyIndex + 1}` as keyof MissionQuoteOverlayContent;
                        handleContentUpdate(fieldKey, 'New trust item');
                      }
                    }}
                    onRemoveTrustItem={(index) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof MissionQuoteOverlayContent;
                      handleContentUpdate(fieldKey, '___REMOVED___');
                    }}
                    colorTokens={colorTokens}
                    sectionBackground="transparent"
                    sectionId={sectionId}
                    backgroundType={backgroundType}
                    iconColor="text-green-400"
                    colorClass="text-white text-opacity-80"
                  />
                ) : (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass="text-white text-opacity-80"
                    iconColor="text-green-400"
                  />
                )}
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
  name: 'MissionQuoteOverlay',
  category: 'Founder Note',
  description: 'Mission-driven messaging with overlay design. Perfect for purpose-driven brands and social impact companies.',
  tags: ['founder', 'mission', 'overlay', 'purpose', 'social-impact', 'quote'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'mission_quote', label: 'Mission Quote', type: 'textarea', required: true },
    { key: 'mission_context', label: 'Mission Context', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: true },
    { key: 'founder_title', label: 'Founder Title', type: 'text', required: false },
    { key: 'mission_year', label: 'Founded Year', type: 'text', required: false },
    { key: 'badge_text', label: 'Badge Text', type: 'text', required: false },
    { key: 'mission_stats', label: 'Mission Stats (pipe separated)', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'background_image', label: 'Background Image', type: 'image', required: false }
  ],
  
  features: [
    'Full-screen overlay design with background image',
    'Mission quote as primary headline',
    'Founder attribution with avatar',
    'Mission statistics display',
    'Trust indicators for credibility',
    'Dark overlay for text readability'
  ],
  
  useCases: [
    'Social impact company introductions',
    'B-Corp and sustainable business messaging',
    'Non-profit organization missions',
    'Purpose-driven startup launches',
    'Environmental and social cause platforms',
    'Community-focused business models'
  ]
};