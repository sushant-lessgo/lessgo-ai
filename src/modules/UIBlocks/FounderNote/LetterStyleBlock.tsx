// components/FounderNote/LetterStyleBlock.tsx
// Personal letter format for executive/luxury positioning
// Builds connection through personal, intimate communication style

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface LetterStyleBlockContent {
  letter_header: string;
  letter_greeting: string;
  letter_body: string;
  letter_signature: string;
  founder_title?: string;
  company_name?: string;
  date_text?: string;
  ps_text?: string;
  founder_image?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  letter_header: {
    type: 'string' as const,
    default: 'A Personal Note from Our Founder'
  },
  letter_greeting: {
    type: 'string' as const,
    default: 'Dear Fellow Builder,'
  },
  letter_body: {
    type: 'string' as const,
    default: 'Three years ago, I sat exactly where you are now—staring at a landing page that just wouldn\'t convert.\n\nI\'d tried everything. Hired expensive copywriters. A/B tested until my eyes crossed. Read every marketing book I could find.\n\nThen it hit me: the problem wasn\'t my copy. It was the process. Great landing pages need great strategy first.\n\nThat\'s why I built Lessgo. To give founders like us the strategic foundation we need before writing a single word.'
  },
  letter_signature: {
    type: 'string' as const,
    default: 'Sushant Jain'
  },
  founder_title: {
    type: 'string' as const,
    default: 'Founder'
  },
  company_name: {
    type: 'string' as const,
    default: 'Lessgo'
  },
  date_text: {
    type: 'string' as const,
    default: 'January 2025'
  },
  ps_text: {
    type: 'string' as const,
    default: 'P.S. Every founder who joins gets a personal strategy review from me. Just reply to your welcome email.'
  },
  founder_image: {
    type: 'string' as const,
    default: '/images/founder.jpg'
  }
};

// Theme-based color function for all themeable elements
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      avatarGradient: 'from-orange-500 via-red-500 to-pink-600',
      letterBorder: '#fed7aa',
      headerBg: '#fff7ed',
      headerBorder: '#fed7aa',
      avatarBorder: '#fed7aa',
      psDivider: '#fed7aa'
    },
    cool: {
      avatarGradient: 'from-blue-500 via-indigo-500 to-violet-600',
      letterBorder: '#bfdbfe',
      headerBg: '#eff6ff',
      headerBorder: '#bfdbfe',
      avatarBorder: '#bfdbfe',
      psDivider: '#bfdbfe'
    },
    neutral: {
      avatarGradient: 'from-gray-400 via-slate-500 to-gray-600',
      letterBorder: '#e5e7eb',
      headerBg: '#f9fafb',
      headerBorder: '#e5e7eb',
      avatarBorder: '#e5e7eb',
      psDivider: '#e5e7eb'
    }
  };
  return colorMap[theme];
};

// Founder Image Placeholder Component - Portrait style
const FounderImagePlaceholder = React.memo(({ onClick, theme }: { onClick?: (e: React.MouseEvent) => void; theme: UIBlockTheme }) => {
  const themeColors = getThemeColors(theme);

  return (
    <div
      className={`w-32 h-40 rounded-lg bg-gradient-to-br ${themeColors.avatarGradient} flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200`}
      onClick={onClick}
    >
      <div className="w-28 h-36 rounded-md bg-white/90 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </div>
  );
});
FounderImagePlaceholder.displayName = 'FounderImagePlaceholder';

export default function LetterStyleBlock(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<LetterStyleBlockContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getThemeColors(uiBlockTheme);

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Get showImageToolbar for handling image clicks
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LetterStyleBlock"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Letter Container */}
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden border" style={{ borderColor: themeColors.letterBorder }}>
          
          {/* Letter Header */}
          <div className="px-8 py-6 border-b" style={{ backgroundColor: themeColors.headerBg, borderColor: themeColors.headerBorder }}>
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.letter_header || ''}
              onEdit={(value) => handleContentUpdate('letter_header', value)}
              level="h2"
              backgroundType="neutral"
              colorTokens={colorTokens}
              textStyle={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}
              className="text-center"
              sectionId={sectionId}
              elementKey="letter_header"
              sectionBackground="bg-gray-50"
            />
            
            {/* Date */}
            <div className="text-center mt-2">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.date_text || ''}
                onEdit={(value) => handleContentUpdate('date_text', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ fontSize: '0.875rem', color: '#6B7280' }}
                placeholder="Add date..."
                sectionId={sectionId}
                elementKey="date_text"
                sectionBackground="bg-gray-50"
              />
            </div>
          </div>

          {/* Letter Body */}
          <div className="px-8 py-8">
            
            {/* Greeting */}
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.letter_greeting || ''}
              onEdit={(value) => handleContentUpdate('letter_greeting', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              textStyle={{ fontSize: '1.125rem', color: '#111827', marginBottom: '1.5rem' }}
              placeholder="Dear [Audience],"
              sectionId={sectionId}
              elementKey="letter_greeting"
              sectionBackground="bg-white"
            />

            {/* Letter Body */}
            <div className="prose prose-lg max-w-none mb-8">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.letter_body || ''}
                onEdit={(value) => handleContentUpdate('letter_body', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ color: '#374151', lineHeight: '1.625', whiteSpace: 'pre-line' }}
                placeholder="Write your personal story and connection with the audience..."
                sectionId={sectionId}
                elementKey="letter_body"
                sectionBackground="bg-white"
              />
            </div>

            {/* Signature Section - Full image with name below */}
            <div className="mt-12">
              {/* Founder Image - Portrait style */}
              <div className="mb-4">
                {blockContent.founder_image && blockContent.founder_image !== '' ? (
                  <img
                    src={blockContent.founder_image}
                    alt="Founder"
                    className="w-32 h-40 rounded-lg object-cover cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                    data-image-id={`${sectionId}-founder_image`}
                    onMouseUp={(e) => {
                      if (mode === 'edit') {
                        e.stopPropagation();
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const imageId = `${sectionId}-founder_image`;
                        const position = {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        };
                        handleImageToolbar(imageId, position);
                      }
                    }}
                    onClick={(e) => {
                      if (mode === 'edit') {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  />
                ) : (
                  <FounderImagePlaceholder
                    theme={uiBlockTheme}
                    onClick={(e) => {
                      if (mode === 'edit') {
                        e.stopPropagation();
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const imageId = `${sectionId}-founder_image`;
                        const position = {
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        };
                        handleImageToolbar(imageId, position);
                      }
                    }}
                  />
                )}
              </div>

              {/* Name and Role */}
              <div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.letter_signature || ''}
                  onEdit={(value) => handleContentUpdate('letter_signature', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}
                  placeholder="Your Name"
                  sectionId={sectionId}
                  elementKey="letter_signature"
                  sectionBackground="bg-white"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={`${blockContent.founder_title || ''}${blockContent.founder_title && blockContent.company_name ? ', ' : ''}${blockContent.company_name || ''}`}
                  onEdit={(value) => {
                    // Parse "Title, Company" format
                    const parts = value.split(',').map(s => s.trim());
                    if (parts.length >= 2) {
                      handleContentUpdate('founder_title', parts[0]);
                      handleContentUpdate('company_name', parts.slice(1).join(', '));
                    } else {
                      handleContentUpdate('founder_title', value);
                    }
                  }}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ color: '#4B5563' }}
                  placeholder="Title, Company"
                  sectionId={sectionId}
                  elementKey="founder_title"
                  sectionBackground="bg-white"
                />
              </div>
            </div>

            {/* P.S. Section */}
            {(blockContent.ps_text || mode === 'edit') && (
              <div className="mt-8 pt-6 border-t" style={{ borderColor: themeColors.psDivider }}>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.ps_text || ''}
                  onEdit={(value) => handleContentUpdate('ps_text', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ color: '#4B5563', fontStyle: 'italic' }}
                  placeholder="P.S. Add a personal note or special offer..."
                  sectionId={sectionId}
                  elementKey="ps_text"
                  sectionBackground="bg-white"
                />
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
  name: 'LetterStyleBlock',
  category: 'Founder Note',
  description: 'Personal letter format for executive/luxury positioning. Builds intimate connection through formal letter design.',
  tags: ['founder', 'personal', 'letter', 'executive'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'letter_header', label: 'Letter Header', type: 'text', required: true },
    { key: 'letter_greeting', label: 'Greeting', type: 'text', required: true },
    { key: 'letter_body', label: 'Letter Body', type: 'textarea', required: true },
    { key: 'letter_signature', label: 'Signature Name', type: 'text', required: true },
    { key: 'founder_title', label: 'Founder Title', type: 'text', required: false },
    { key: 'company_name', label: 'Company Name', type: 'text', required: false },
    { key: 'date_text', label: 'Date', type: 'text', required: false },
    { key: 'ps_text', label: 'P.S. Note', type: 'textarea', required: false },
    { key: 'founder_image', label: 'Founder Photo', type: 'image', required: false }
  ],
  
  features: [
    'Formal letter design with header and signature',
    'Personal founder photo integration',
    'P.S. section for additional personal touch',
    'Executive positioning for luxury/premium brands'
  ],
  
  useCases: [
    'Executive positioning for B2B SaaS',
    'Luxury brand founder introductions',
    'High-ticket service personal connection',
    'Premium product launch announcements',
    'Personal connection for financial services'
  ]
};