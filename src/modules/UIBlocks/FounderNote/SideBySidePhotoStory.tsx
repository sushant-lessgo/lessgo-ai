// components/FounderNote/SideBySidePhotoStory.tsx
// Photo-driven storytelling for creators
// Builds trust through visual storytelling and personal connection

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStore } from '@/hooks/useEditStore';
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
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface SideBySidePhotoStoryContent {
  story_headline: string;
  story_text: string;
  story_quote: string;
  cta_text: string;
  founder_name?: string;
  story_stats?: string;
  badge_text?: string;
  trust_items?: string;
  story_image?: string;
  secondary_image?: string;
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
  badge_text: { 
    type: 'string' as const, 
    default: '✨ Creator Story' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'Built by creators, for creators|7-day free trial|Cancel anytime' 
  },
  story_image: { 
    type: 'string' as const, 
    default: '' 
  },
  secondary_image: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Photo Story Placeholder Component
const PhotoStoryPlaceholder = React.memo(({ type = 'primary' }: { type?: 'primary' | 'secondary' }) => (
  <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-2xl overflow-hidden shadow-lg">
    
    {/* Creative workspace mockup */}
    <div className="absolute inset-4 bg-white rounded-xl shadow-sm overflow-hidden">
      
      {/* Desktop/workspace scene */}
      <div className="h-full bg-gradient-to-b from-gray-50 to-white p-4">
        
        {/* Top toolbar */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {type === 'primary' ? 'Before: Chaos' : 'After: Organized'}
          </div>
        </div>

        {type === 'primary' ? (
          // Chaotic "before" state
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-red-800">Overdue Tasks</span>
              </div>
              <div className="space-y-1">
                <div className="bg-red-100 rounded h-2 w-3/4"></div>
                <div className="bg-red-100 rounded h-2 w-1/2"></div>
                <div className="bg-red-100 rounded h-2 w-2/3"></div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-yellow-800">Scattered Files</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="bg-yellow-100 rounded h-8"></div>
                <div className="bg-yellow-100 rounded h-8"></div>
                <div className="bg-yellow-100 rounded h-8"></div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-xs text-gray-600">😰 Stress Level: HIGH</span>
            </div>
          </div>
        ) : (
          // Organized "after" state
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-800">Organized Workflow</span>
              </div>
              <div className="space-y-1">
                <div className="bg-green-100 rounded h-2 w-full"></div>
                <div className="bg-green-100 rounded h-2 w-4/5"></div>
                <div className="bg-green-100 rounded h-2 w-3/4"></div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-800">Creative Projects</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded h-12 flex items-center justify-center">
                  <span className="text-xs">🎨</span>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded h-12 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <span className="text-xs text-indigo-600">😊 Stress Level: LOW</span>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Overlay badge */}
    <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full px-3 py-1 shadow-md">
      <span className="text-xs font-medium text-gray-700">
        {type === 'primary' ? 'The Problem' : 'The Solution'}
      </span>
    </div>
  </div>
));
PhotoStoryPlaceholder.displayName = 'PhotoStoryPlaceholder';

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

  // Parse story stats from pipe-separated string
  const storyStats = blockContent.story_stats 
    ? blockContent.story_stats.split('|').map(item => item.trim()).filter(Boolean)
    : ['Growing community', 'Global reach'];

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Creator-focused', 'Easy to start'];

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Get showImageToolbar for handling image clicks
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySidePhotoStory"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          {(blockContent.badge_text || mode === 'edit') && (
            <div className="mb-6">
              <AccentBadge
                mode={mode}
                value={blockContent.badge_text || ''}
                onEdit={(value) => handleContentUpdate('badge_text', value)}
                colorTokens={colorTokens}
                textStyle={getTextStyle('body-sm')}
                placeholder="✨ Creator Story"
                sectionId={sectionId}
                elementKey="badge_text"
                sectionBackground={sectionBackground}
              />
            </div>
          )}

          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.story_headline}
            onEdit={(value) => handleContentUpdate('story_headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              value={blockContent.story_text}
              onEdit={(value) => handleContentUpdate('story_text', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={`${getTextStyle('body-lg')} leading-relaxed whitespace-pre-line`}
              placeholder="Tell your personal story - the struggle, the solution, and the impact..."
              sectionId={sectionId}
              elementKey="story_text"
              sectionBackground={sectionBackground}
            />

            {/* Quote */}
            <div className="bg-gray-50 border-l-4 border-blue-500 rounded-r-lg p-6">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.story_quote}
                onEdit={(value) => handleContentUpdate('story_quote', value)}
                backgroundType="white"
                colorTokens={colorTokens}
                variant="body"
                textStyle="text-lg italic text-gray-700 leading-relaxed"
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
                  backgroundType="white"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle="font-semibold text-gray-900"
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
              textStyle={getTextStyle('body-lg')}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
            />

            {/* Trust Indicators */}
            <TrustIndicators 
              items={trustItems}
              colorClass={mutedTextColor}
              iconColor="text-green-500"
            />
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
                      showImageToolbar(`${sectionId}-story-image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              ) : (
                <PhotoStoryPlaceholder type="primary" />
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
                        showImageToolbar(`${sectionId}-secondary-image`, {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }
                    }}
                  />
                ) : (
                  <PhotoStoryPlaceholder type="secondary" />
                )}
              </div>
              
              {/* Stats */}
              <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Impact So Far</h4>
                {storyStats.slice(0, 3).map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {stat.split(' ')[0]}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stat.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
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