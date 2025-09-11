// components/FounderNote/SideBySidePhotoStory.tsx
// Photo-driven storytelling for creators
// Builds trust through visual storytelling and personal connection

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
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
interface SideBySidePhotoStoryContent {
  story_headline: string;
  story_text: string;
  story_quote: string;
  cta_text: string;
  founder_name?: string;
  story_stats?: string;
  story_stat_1: string;
  story_stat_2: string;
  story_stat_3: string;
  story_stat_4: string;
  badge_text?: string;
  trust_items?: string;
  trust_item_1: string;
  trust_item_2: string;
  trust_item_3: string;
  trust_item_4: string;
  trust_item_5: string;
  story_image?: string;
  secondary_image?: string;
  badge_icon?: string;
  placeholder_icon_1?: string;
  placeholder_icon_2?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  story_headline: { 
    type: 'string' as const, 
    default: 'From Struggling Creator to Building the Tool I Wished Existed' 
  },
  story_text: { 
    type: 'string' as const, 
    default: 'Two years ago, I was spending 40+ hours a week on admin work instead of creating. I was drowning in spreadsheets, losing track of clients, and worst of all - I wasn\'t making the art I loved.\n\nThat\'s when I decided to build something different. Not another bloated business tool, but something designed specifically for creators like us.\n\nToday, over 25,000 creators use our platform to reclaim their time and focus on what matters most - their craft.' 
  },
  story_quote: { 
    type: 'string' as const, 
    default: '"I built this because I needed it to exist. Every feature comes from a real pain point I experienced as a creator."' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Creating Today' 
  },
  founder_name: { 
    type: 'string' as const, 
    default: 'Alex Rivera' 
  },
  story_stats: { 
    type: 'string' as const, 
    default: '25,000+ creators|500,000+ projects|$50M+ creator earnings|150+ countries' 
  },
  story_stat_1: { type: 'string' as const, default: '25,000+ creators' },
  story_stat_2: { type: 'string' as const, default: '500,000+ projects' },
  story_stat_3: { type: 'string' as const, default: '$50M+ creator earnings' },
  story_stat_4: { type: 'string' as const, default: '150+ countries' },
  badge_text: { 
    type: 'string' as const, 
    default: 'Creator Story' 
  },
  badge_icon: {
    type: 'string' as const,
    default: '✨'
  },
  placeholder_icon_1: {
    type: 'string' as const,
    default: '🎨'
  },
  placeholder_icon_2: {
    type: 'string' as const,
    default: '✨'
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'Built by creators, for creators|7-day free trial|Cancel anytime' 
  },
  trust_item_1: { type: 'string' as const, default: 'Built by creators, for creators' },
  trust_item_2: { type: 'string' as const, default: '7-day free trial' },
  trust_item_3: { type: 'string' as const, default: 'Cancel anytime' },
  trust_item_4: { type: 'string' as const, default: '' },
  trust_item_5: { type: 'string' as const, default: '' },
  story_image: { 
    type: 'string' as const, 
    default: '' 
  },
  secondary_image: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Founder Photo Placeholder Component
const FounderPhotoPlaceholder = React.memo(({ 
  type = 'primary',
  mode,
  sectionId,
  elementKey,
  onImageClick
}: { 
  type?: 'primary' | 'secondary';
  mode?: string;
  sectionId?: string;
  elementKey?: string;
  onImageClick?: () => void;
}) => (
  <div 
    className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
    onClick={onImageClick}
    data-image-id={`${sectionId}-${elementKey}`}
    role="button"
    tabIndex={mode === 'edit' ? 0 : -1}
    aria-label={type === 'primary' ? 'Click to add founder photo' : 'Click to add secondary photo'}
  >
    {/* Photo placeholder content */}
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      
      {/* Avatar silhouette */}
      <div className="relative mb-4">
        <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
          <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        {mode === 'edit' && (
          <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Placeholder text */}
      <div className="text-center">
        <p className="text-gray-600 font-medium mb-1">
          {type === 'primary' ? 'Founder Photo' : 'Team Photo'}
        </p>
        {mode === 'edit' && (
          <p className="text-sm text-gray-500">
            Click to upload image
          </p>
        )}
      </div>
    </div>

    {/* Decorative corner accent */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 rounded-bl-full"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400 to-pink-500 opacity-10 rounded-tr-full"></div>
  </div>
));
FounderPhotoPlaceholder.displayName = 'FounderPhotoPlaceholder';

export default function SideBySidePhotoStory(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SideBySidePhotoStoryContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Helper function to get story stats with individual field support
  const getStoryStats = (): string[] => {
    const individualStats = [
      blockContent.story_stat_1,
      blockContent.story_stat_2,
      blockContent.story_stat_3,
      blockContent.story_stat_4
    ].filter((stat): stat is string => Boolean(stat && stat.trim() !== '' && stat !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualStats.length > 0) {
      return individualStats;
    }
    
    return blockContent.story_stats 
      ? blockContent.story_stats.split('|').map(item => item.trim()).filter(Boolean)
      : ['25,000+ creators', '500,000+ projects'];
  };
  
  const storyStats = getStoryStats();

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
      : ['Built by creators', '7-day free trial'];
  };
  
  const trustItems = getTrustItems();

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Use robust image toolbar hook
  const handleImageToolbar = useImageToolbar();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySidePhotoStory"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          {(blockContent.badge_text || blockContent.badge_icon || mode === 'edit') && (
            <div className="mb-6 flex justify-center">
              {mode === 'edit' ? (
                <div className="flex items-center space-x-2">
                  <div className="relative group/icon-edit">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.badge_icon || '✨'}
                      onEdit={(value) => handleContentUpdate('badge_icon', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className=""
                      sectionId={sectionId}
                      elementKey="badge_icon"
                    />
                  </div>
                  <AccentBadge
                    mode={mode}
                    value={blockContent.badge_text || ''}
                    onEdit={(value) => handleContentUpdate('badge_text', value)}
                    colorTokens={colorTokens}
                    placeholder="Creator Story"
                    sectionId={sectionId}
                    elementKey="badge_text"
                    sectionBackground={sectionBackground}
                  />
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
                  <span>{blockContent.badge_icon || '✨'}</span>
                  <span className="font-medium text-sm">{blockContent.badge_text || 'Creator Story'}</span>
                </div>
              )}
            </div>
          )}

          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.story_headline || ''}
            onEdit={(value) => handleContentUpdate('story_headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="leading-tight max-w-4xl mx-auto"
            sectionId={sectionId}
            elementKey="story_headline"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          
          {/* Left Column - Story Content */}
          <div className="space-y-6">
            
            {/* Story Text */}
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.story_text || ''}
              onEdit={(value) => handleContentUpdate('story_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{ ...getTextStyle('body-lg'), lineHeight: '1.625', whiteSpace: 'pre-line' }}
              placeholder="Tell your personal story - the struggle, the solution, and the impact..."
              sectionId={sectionId}
              elementKey="story_text"
              sectionBackground={sectionBackground}
            />

            {/* Quote */}
            <div className="bg-gray-50 border-l-4 border-blue-500 rounded-r-lg p-6">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.story_quote || ''}
                onEdit={(value) => handleContentUpdate('story_quote', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ fontSize: '1.125rem', fontStyle: 'italic', color: '#374151', lineHeight: '1.625' }}
                placeholder="Add a powerful quote that captures your motivation..."
                sectionId={sectionId}
                elementKey="story_quote"
                sectionBackground="bg-gray-50"
              />
              
              <div className="mt-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {blockContent.founder_name?.charAt(0) || 'F'}
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.founder_name || ''}
                  onEdit={(value) => handleContentUpdate('founder_name', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ fontWeight: '600', color: '#111827' }}
                  placeholder="Your Name"
                  sectionId={sectionId}
                  elementKey="founder_name"
                  sectionBackground="bg-gray-50"
                />
              </div>
            </div>

            {/* CTA */}
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
            />

            {/* Trust Indicators */}
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
                  const fieldKey = `trust_item_${index + 1}` as keyof SideBySidePhotoStoryContent;
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
                    const fieldKey = `trust_item_${emptyIndex + 1}` as keyof SideBySidePhotoStoryContent;
                    handleContentUpdate(fieldKey, 'New trust item');
                  }
                }}
                onRemoveTrustItem={(index) => {
                  const fieldKey = `trust_item_${index + 1}` as keyof SideBySidePhotoStoryContent;
                  handleContentUpdate(fieldKey, '___REMOVED___');
                }}
                colorTokens={colorTokens}
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                backgroundType={backgroundType}
                iconColor="text-green-500"
                colorClass={mutedTextColor}
              />
            ) : (
              <TrustIndicators 
                items={trustItems}
                colorClass={mutedTextColor}
                iconColor="text-green-500"
              />
            )}
          </div>

          {/* Right Column - Photo Story */}
          <div className="space-y-6">
            
            {/* Main Story Image */}
            <div className="relative">
              {blockContent.story_image && blockContent.story_image !== '' ? (
                <img
                  src={blockContent.story_image}
                  alt="Creator story"
                  className="w-full h-96 object-cover rounded-2xl shadow-lg cursor-pointer"
                  data-image-id={`${sectionId}-story-image`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleImageToolbar(`${sectionId}.story_image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              ) : (
                <FounderPhotoPlaceholder 
                  type="primary" 
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="story_image"
                  onImageClick={() => {
                    if (mode === 'edit') {
                      const element = document.querySelector(`[data-image-id="${sectionId}-story_image"]`);
                      if (element) {
                        const rect = element.getBoundingClientRect();
                        handleImageToolbar(`${sectionId}.story_image`, {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }
                    }
                  }}
                />
              )}
            </div>

            {/* Secondary Image */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {blockContent.secondary_image && blockContent.secondary_image !== '' ? (
                  <img
                    src={blockContent.secondary_image}
                    alt="Secondary story"
                    className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer"
                    data-image-id={`${sectionId}-secondary-image`}
                    onMouseUp={(e) => {
                      if (mode === 'edit') {
                        e.stopPropagation();
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleImageToolbar(`${sectionId}.secondary_image`, {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }
                    }}
                  />
                ) : (
                  <FounderPhotoPlaceholder 
                    type="secondary" 
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="secondary_image"
                    onImageClick={() => {
                      if (mode === 'edit') {
                        const element = document.querySelector(`[data-image-id="${sectionId}-secondary_image"]`);
                        if (element) {
                          const rect = element.getBoundingClientRect();
                          handleImageToolbar(`${sectionId}.secondary_image`, {
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          });
                        }
                      }
                    }}
                  />
                )}
              </div>
              
              {/* Stats */}
              <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Impact So Far</h4>
                {mode === 'edit' ? (
                  <div className="space-y-2">
                    {[
                      { key: 'story_stat_1', placeholder: '25,000+ creators' },
                      { key: 'story_stat_2', placeholder: '500,000+ projects' },
                      { key: 'story_stat_3', placeholder: '$50M+ creator earnings' }
                    ].map((stat, index) => (
                      ((blockContent as any)[stat.key] || mode === 'edit') && (
                        <div key={index} className="relative group/stat-item flex items-center space-x-2">
                          <EditableAdaptiveText
                            mode={mode}
                            value={(blockContent as any)[stat.key] || ''}
                            onEdit={(value) => handleContentUpdate(stat.key as keyof SideBySidePhotoStoryContent, value)}
                            backgroundType="neutral"
                            colorTokens={colorTokens}
                            variant="body"
                            textStyle={{ fontSize: '0.75rem', fontWeight: '600', textAlign: 'center' }}
                            placeholder={stat.placeholder}
                            sectionId={sectionId}
                            elementKey={stat.key}
                            sectionBackground="bg-white"
                          />
                          
                          {/* Remove button */}
                          {mode === 'edit' && (blockContent as any)[stat.key] && (blockContent as any)[stat.key] !== '___REMOVED___' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContentUpdate(stat.key as keyof SideBySidePhotoStoryContent, '___REMOVED___');
                              }}
                              className="opacity-0 group-hover/stat-item:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
                              title="Remove this statistic"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  storyStats.slice(0, 3).map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {stat.split(' ')[0]}
                      </div>
                      <div className="text-xs text-gray-600">
                        {stat.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
          {mode === 'edit' ? (
            <div className="space-y-4">
              <h4 className="text-center font-semibold text-gray-900 mb-4">Story Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'story_stat_1', placeholder: '25,000+ creators' },
                  { key: 'story_stat_2', placeholder: '500,000+ projects' },
                  { key: 'story_stat_3', placeholder: '$50M+ creator earnings' },
                  { key: 'story_stat_4', placeholder: '150+ countries' }
                ].map((stat, index) => (
                  ((blockContent as any)[stat.key] || mode === 'edit') && (
                    <div key={index} className="relative group/stat-item text-center">
                      <EditableAdaptiveText
                        mode={mode}
                        value={(blockContent as any)[stat.key] || ''}
                        onEdit={(value) => handleContentUpdate(stat.key as keyof SideBySidePhotoStoryContent, value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        variant="body"
                        textStyle={{ fontSize: '0.875rem', fontWeight: '500' }}
                        placeholder={stat.placeholder}
                        sectionId={sectionId}
                        elementKey={stat.key}
                        sectionBackground="bg-blue-50"
                      />
                      
                      {/* Remove button */}
                      {mode === 'edit' && (blockContent as any)[stat.key] && (blockContent as any)[stat.key] !== '___REMOVED___' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate(stat.key as keyof SideBySidePhotoStoryContent, '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/stat-item:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 bg-white rounded-full p-1 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                ))}
              </div>
              
              {/* Add button */}
              {mode === 'edit' && storyStats.length < 4 && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      const emptyIndex = [
                        blockContent.story_stat_1,
                        blockContent.story_stat_2,
                        blockContent.story_stat_3,
                        blockContent.story_stat_4
                      ].findIndex(stat => !stat || stat.trim() === '' || stat === '___REMOVED___');
                      
                      if (emptyIndex !== -1) {
                        const fieldKey = `story_stat_${emptyIndex + 1}` as keyof SideBySidePhotoStoryContent;
                        handleContentUpdate(fieldKey, 'New statistic');
                      }
                    }}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add statistic</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {storyStats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
                    {stat.split(' ')[0]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SideBySidePhotoStory',
  category: 'Founder Note',
  description: 'Photo-driven storytelling perfect for creators and visual brands. Combines personal story with compelling imagery.',
  tags: ['founder', 'story', 'photos', 'creators', 'visual', 'personal'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'story_headline', label: 'Story Headline', type: 'text', required: true },
    { key: 'story_text', label: 'Story Text', type: 'textarea', required: true },
    { key: 'story_quote', label: 'Personal Quote', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: false },
    { key: 'badge_text', label: 'Badge Text', type: 'text', required: false },
    { key: 'story_stats', label: 'Impact Stats (pipe separated)', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'story_image', label: 'Main Story Image', type: 'image', required: false },
    { key: 'secondary_image', label: 'Secondary Image', type: 'image', required: false }
  ],
  
  features: [
    'Dual-image layout with main and secondary photos',
    'Personal quote highlighting with founder attribution',
    'Statistics showcase for impact metrics',
    'Visual before/after storytelling elements',
    'Creator-focused design and messaging',
    'Responsive grid layout for all devices'
  ],
  
  useCases: [
    'Creator platform founder introductions',
    'Design agency personal brand stories',
    'Artist and maker origin stories',
    'Creative service provider testimonials',
    'Photo/video creator tool launches',
    'Personal brand business introductions'
  ]
};