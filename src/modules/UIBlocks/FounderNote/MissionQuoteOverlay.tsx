// components/FounderNote/MissionQuoteOverlay.tsx
// Mission-driven messaging with overlay design
// Builds trust through purpose-driven storytelling and visual impact

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface MissionQuoteOverlayContent {
  mission_quote: string;
  mission_context: string;
  founder_name: string;
  cta_text: string;
  badge_text?: string;
  mission_stats?: string;
  founder_title?: string;
  mission_year?: string;
  trust_items?: string;
  background_image?: string;
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
    default: '🌟 Our Mission' 
  },
  mission_stats: { 
    type: 'string' as const, 
    default: '50,000+ creators empowered|$2M+ in creator earnings|100+ countries served' 
  },
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

  // Parse mission stats from pipe-separated string
  const missionStats = blockContent.mission_stats 
    ? blockContent.mission_stats.split('|').map(item => item.trim()).filter(Boolean)
    : ['Growing community', 'Positive impact'];

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Certified', 'Trusted'];

  // Get showImageToolbar for handling image clicks
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MissionQuoteOverlay"
      backgroundType={props.backgroundType || 'primary'}
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
                if (mode === 'edit') {
                  e.stopPropagation();
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  showImageToolbar(`${sectionId}-background-image`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
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
            {(blockContent.badge_text || mode === 'edit') && (
              <div>
                <AccentBadge
                  mode={mode}
                  value={blockContent.badge_text || ''}
                  onEdit={(value) => handleContentUpdate('badge_text', value)}
                  colorTokens={colorTokens}
                  textStyle="text-sm font-medium text-white"
                  placeholder="🌟 Our Mission"
                  sectionId={sectionId}
                  elementKey="badge_text"
                  sectionBackground="transparent"
                />
              </div>
            )}

            {/* Mission Quote */}
            <div className="max-w-4xl mx-auto">
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.mission_quote}
                onEdit={(value) => handleContentUpdate('mission_quote', value)}
                level="h1"
                backgroundType="dark"
                colorTokens={colorTokens}
                textStyle="text-3xl lg:text-5xl font-bold text-white leading-tight"
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
                  value={blockContent.founder_name}
                  onEdit={(value) => handleContentUpdate('founder_name', value)}
                  backgroundType="dark"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle="text-white font-semibold"
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
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle="text-white text-opacity-80 text-sm"
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
                        backgroundType="dark"
                        colorTokens={colorTokens}
                        variant="body"
                        textStyle="text-white text-opacity-80 text-sm"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {missionStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    {stat.split(' ')[0]}
                  </div>
                  <div className="text-white text-opacity-80 text-sm">
                    {stat.split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div>
              <CTAButton
                text={blockContent.cta_text}
                colorTokens={colorTokens}
                textStyle="text-lg font-semibold"
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
                  value={blockContent.mission_context}
                  onEdit={(value) => handleContentUpdate('mission_context', value)}
                  backgroundType="dark"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle="text-white text-opacity-90 leading-relaxed"
                  placeholder="Add context about your mission and why it matters..."
                  sectionId={sectionId}
                  elementKey="mission_context"
                  sectionBackground="transparent"
                />
              </div>

              {/* Trust Indicators */}
              <div className="lg:text-right">
                <TrustIndicators 
                  items={trustItems}
                  colorClass="text-white text-opacity-80"
                  iconColor="text-green-400"
                />
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