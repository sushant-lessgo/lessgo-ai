// components/layout/FounderCardWithQuote.tsx
// Production-ready founder quote section using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableHeadline, 
  EditableText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface FounderCardWithQuoteContent {
  founder_name: string;
  founder_title: string;
  founder_quote: string;
  founder_bio?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  founder_name: { 
    type: 'string' as const, 
    default: 'Sarah Johnson' 
  },
  founder_title: { 
    type: 'string' as const, 
    default: 'CEO & Co-Founder' 
  },
  founder_quote: { 
    type: 'string' as const, 
    default: 'We built this product because we experienced the same frustrations our customers face every day. Our mission is to eliminate the complexity and give you back your time to focus on what truly matters.' 
  },
  founder_bio: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Simple founder avatar component
const FounderAvatar = React.memo(({ name }: { name: string }) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
      <span className="text-white font-bold text-lg md:text-xl">
        {getInitials(name)}
      </span>
    </div>
  );
});
FounderAvatar.displayName = 'FounderAvatar';

export default function FounderCardWithQuote(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<FounderCardWithQuoteContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="FounderCardWithQuote"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
      editModeInfo={{
        componentName: 'FounderCardWithQuote',
        description: 'Founder quote section with avatar and personal message',
        tips: [
          'Quote should be personal and authentic from the founder',
          'Bio is optional but adds credibility and personal connection',
          'Avatar shows initials based on founder name'
        ]
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Main Founder Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              
              {/* Founder Avatar */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <FounderAvatar name={blockContent.founder_name} />
              </div>

              {/* Quote and Details */}
              <div className="flex-1 text-center md:text-left">
                {/* Quote */}
                <div className="mb-6">
                  <svg 
                    className="w-8 h-8 text-blue-500 mb-4 mx-auto md:mx-0" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                  
                  <EditableText
                    mode={mode}
                    value={blockContent.founder_quote}
                    onEdit={(value) => handleContentUpdate('founder_quote', value)}
                    colorClass={colorTokens.textPrimary}
                    textStyle={getTextStyle('body-lg')}
                    className="text-lg md:text-xl leading-relaxed italic mb-6"
                    placeholder="Add an authentic, personal quote from the founder..."
                  />
                </div>

                {/* Founder Info */}
                <div className="space-y-2">
                  <EditableHeadline
                    mode={mode}
                    value={blockContent.founder_name}
                    onEdit={(value) => handleContentUpdate('founder_name', value)}
                    level="h3"
                    colorClass={colorTokens.textPrimary}
                    textStyle={getTextStyle('h3')}
                  />

                  <EditableText
                    mode={mode}
                    value={blockContent.founder_title}
                    onEdit={(value) => handleContentUpdate('founder_title', value)}
                    colorClass={colorTokens.textSecondary}
                    textStyle={getTextStyle('body')}
                    className="font-medium"
                    placeholder="CEO & Co-Founder"
                  />
                </div>
              </div>
            </div>

            {/* Optional Founder Bio */}
            {(blockContent.founder_bio || mode === 'edit') && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <EditableText
                  mode={mode}
                  value={blockContent.founder_bio || ''}
                  onEdit={(value) => handleContentUpdate('founder_bio', value)}
                  colorClass={colorTokens.textSecondary}
                  textStyle={getTextStyle('body')}
                  className="leading-relaxed text-center md:text-left"
                  placeholder="Add optional founder bio to share background and experience..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center space-x-4 opacity-60">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'FounderCardWithQuote',
  category: 'Social Proof',
  description: 'Founder quote section with avatar and personal message',
  tags: ['founder', 'quote', 'personal', 'testimonial'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // Schema for component generation tools
  contentFields: [
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: true },
    { key: 'founder_title', label: 'Founder Title', type: 'text', required: true },
    { key: 'founder_quote', label: 'Founder Quote', type: 'textarea', required: true },
    { key: 'founder_bio', label: 'Founder Bio (optional)', type: 'textarea', required: false }
  ],
  
  // Usage examples
  useCases: [
    'About page founder section',
    'Landing page credibility',
    'Company story section',
    'Personal branding'
  ]
};