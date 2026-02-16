// components/layout/VisualObjectionTiles.tsx - Objection UIBlock with visual tile format
// Simple, engaging tiles for addressing common concerns in early-stage markets

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { getCardStyles, CardStyles } from '@/modules/Design/cardStyles';
import { cn } from '@/lib/utils';

// Objection item structure (V2 format)
interface Objection {
  id: string;
  question: string;
  response: string;
  label?: string;
  icon?: string;
}

// Content interface for type safety (V2 format)
interface VisualObjectionTilesContent {
  headline: string;
  subheadline?: string;
  objections: Objection[];
}

// Generate unique ID for new objections
const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default objections for new sections
const DEFAULT_OBJECTIONS: Objection[] = [
  { id: 'o1', question: '"It\'s too expensive for our budget"', response: 'Plans start at $10/mo with no hidden fees. Most teams see ROI within 30 days.', label: 'Pricing', icon: 'DollarSign' },
  { id: 'o2', question: '"We don\'t have time for another tool"', response: 'Setup takes under 10 minutes. No IT required. You\'ll save more time than you spend.', label: 'Time', icon: 'Clock' },
  { id: 'o3', question: '"Our team won\'t adopt it"', response: 'Designed for simplicity—if they can use email, they can use this. 94% adoption rate.', label: 'Adoption', icon: 'Users' },
  { id: 'o4', question: '"What if it doesn\'t work for us?"', response: '30-day money-back guarantee. No questions asked. Zero risk to try.', label: 'Risk', icon: 'ShieldCheck' },
];

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Common Concerns? We\'ve Got You Covered'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Here are the questions we hear most often and why they shouldn\'t hold you back.'
  },
  objections: {
    type: 'array' as const,
    default: DEFAULT_OBJECTIONS
  }
};


// Theme extras - accent elements (icons, gradients) that stay themed
const getThemeExtras = (theme: UIBlockTheme) => ({
  warm: {
    iconBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    accent: 'from-orange-400 to-orange-500'
  },
  cool: {
    iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    accent: 'from-blue-400 to-indigo-500'
  },
  neutral: {
    iconBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
    accent: 'from-gray-400 to-gray-500'
  }
}[theme]);

export default function VisualObjectionTiles(props: LayoutComponentProps) {

  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<VisualObjectionTilesContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles from luminance-based system
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiTheme
    });
  }, [sectionBackground, uiTheme]);

  // Theme extras for accent elements
  const themeExtras = getThemeExtras(uiTheme);

  // Get objections with fallback to defaults
  const objections = blockContent.objections || DEFAULT_OBJECTIONS;

  // Helper to get container classes based on count
  const getContainerClasses = (count: number) => {
    if (count === 4) {
      // 2x2 grid for 4 items
      return 'grid grid-cols-1 md:grid-cols-2 gap-8';
    }
    // 3, 5, 6: use flex with centering for partial rows
    return 'flex flex-wrap justify-center gap-8';
  };

  // Helper to get card width classes for flex layout
  const getCardClasses = (count: number) => {
    if (count === 4) return ''; // grid handles sizing
    // For flex: ~31% width on lg (3 cols), ~48% on md (2 cols)
    return 'w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.4rem)]';
  };

  // Add a new objection
  const addObjection = () => {
    if (objections.length >= 6) return;
    const newObjection: Objection = {
      id: generateId(),
      question: '"New objection to address"',
      response: 'Your clear, concise response here',
      label: 'General',
      icon: 'HelpCircle'
    };
    handleContentUpdate('objections', JSON.stringify([...objections, newObjection]));
  };

  // Remove an objection by id
  const removeObjection = (objectionId: string) => {
    if (objections.length <= 1) return;
    handleContentUpdate('objections', JSON.stringify(objections.filter(o => o.id !== objectionId)));
  };

  // Update objection field
  const updateObjection = (objectionId: string, field: keyof Objection, value: string) => {
    handleContentUpdate('objections', JSON.stringify(objections.map(o =>
      o.id === objectionId ? { ...o, [field]: value } : o
    )));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VisualObjectionTiles"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...bodyLgStyle}}
              className="max-w-3xl mx-auto"
              placeholder="Add a subheadline that introduces the objection handling..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Objection Tiles Grid */}
        <div className={getContainerClasses(objections.length)}>
          {objections.map((objection) => (
            <div
              key={objection.id}
              className={cn(
                'relative group rounded-2xl p-8 transition-all duration-300',
                cardStyles.bg,
                cardStyles.blur,
                cardStyles.border,
                cardStyles.shadow,
                cardStyles.hoverEffect,
                getCardClasses(objections.length)
              )}
            >

              {/* Delete button - only show in edit mode and if more than 1 objection */}
              {mode === 'edit' && objections.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeObjection(objection.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10"
                  title="Remove this objection"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Icon */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${themeExtras.iconBg} rounded-2xl text-3xl group-hover:scale-110 transition-transform duration-300`}>
                  <IconEditableText
                    mode={mode}
                    value={objection.icon || inferIconFromText(objection.question, objection.response)}
                    onEdit={(value) => updateObjection(objection.id, 'icon', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    iconSize="xl"
                    placeholder="Lightbulb"
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    elementKey={`objection_icon_${objection.id}`}
                  />
                </div>
              </div>

              {/* Question (Objection) */}
              <div className="mb-4">
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateObjection(objection.id, 'question', e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[40px] cursor-text text-lg font-bold text-center ${cardStyles.textHeading}`}
                    style={{...bodyStyle, fontWeight: 700}}
                  >
                    {objection.question}
                  </div>
                ) : (
                  <p style={{...bodyStyle, fontWeight: 700}} className={`text-lg text-center ${cardStyles.textHeading}`}>
                    {objection.question}
                  </p>
                )}
              </div>

              {/* Response (Answer) */}
              <div className="text-center">
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateObjection(objection.id, 'response', e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[40px] cursor-text leading-relaxed ${cardStyles.textBody}`}
                    style={{...bodyStyle}}
                  >
                    {objection.response}
                  </div>
                ) : (
                  <p style={{...bodyStyle}} className={`leading-relaxed ${cardStyles.textBody}`}>
                    {objection.response}
                  </p>
                )}
              </div>

              {/* Bottom accent */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center">
                  <div className={`w-8 h-1 bg-gradient-to-r ${themeExtras.accent} rounded-full group-hover:w-12 transition-all duration-300`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Objection Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && objections.length < 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={addObjection}
              className="flex items-center space-x-2 mx-auto px-6 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Objection</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'VisualObjectionTiles',
  category: 'Objection Sections',
  description: 'Interactive tile format for addressing common objections with add/remove functionality.',
  tags: ['objection', 'visual', 'tiles', 'interactive', 'editable'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'objections', label: 'Objection Tiles', type: 'array', required: true }
  ],

  features: [
    'Visual icons for each objection type',
    'Add/remove objection tiles (1-6 limit)',
    'Hover-based delete buttons in edit mode',
    'Clean, approachable tile design',
    'Hover animations and interactions',
    'Theme-aware styling (warm/cool/neutral)'
  ],

  useCases: [
    'Early-stage products addressing basic concerns',
    'Simple SaaS tools with straightforward objections',
    'Consumer products with price/complexity concerns',
    'Freemium offerings handling upgrade hesitations'
  ]
};
