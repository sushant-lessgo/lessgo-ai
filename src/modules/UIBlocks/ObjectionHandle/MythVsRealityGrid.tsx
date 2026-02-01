// components/layout/MythVsRealityGrid.tsx - Objection UIBlock for debunking myths with facts
// Grid layout that contrasts myths with reality to address sophisticated market misconceptions

import React from 'react';
import { X, Check } from 'lucide-react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Pair structure
interface MythRealityPair {
  id: string;
  myth: string;
  reality: string;
}

// Content interface for type safety (V2 format)
interface MythVsRealityGridContent {
  headline: string;
  subheadline?: string;
  pairs: MythRealityPair[];
}

// Generate unique ID for new pairs
const generateId = () => `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default pairs for new sections
const DEFAULT_PAIRS: MythRealityPair[] = [
  { id: 'p1', myth: 'This is too complex for small teams', reality: 'Our platform is designed for teams of any size, with setup taking less than 5 minutes' },
  { id: 'p2', myth: 'AI tools replace human creativity', reality: 'Our AI enhances your creativity by handling repetitive tasks so you can focus on strategy' },
  { id: 'p3', myth: 'Implementation takes months', reality: 'Most customers see results within the first week' },
  { id: 'p4', myth: 'It won\'t integrate with existing tools', reality: 'We connect seamlessly with 500+ popular business tools and platforms' },
];

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Separating Myth from Reality'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Let\'s address the common misconceptions and show you what\'s actually true.'
  },
  pairs: {
    type: 'array' as const,
    default: DEFAULT_PAIRS
  }
};

// Theme-based colors for Myth cards
const getMythColors = (theme: UIBlockTheme) => ({
  warm: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    badgeBg: 'bg-slate-700',
    textColor: 'text-gray-800',
    hoverBg: 'hover:bg-orange-100',
    focusRing: 'focus:ring-orange-500'
  },
  cool: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-slate-700',
    textColor: 'text-gray-800',
    hoverBg: 'hover:bg-blue-100',
    focusRing: 'focus:ring-blue-500'
  },
  neutral: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    badgeBg: 'bg-slate-700',
    textColor: 'text-gray-800',
    hoverBg: 'hover:bg-gray-100',
    focusRing: 'focus:ring-gray-500'
  }
}[theme]);

export default function MythVsRealityGrid(props: LayoutComponentProps) {

  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<MythVsRealityGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Get accent color for Reality cards
  const accentColor = props.theme?.colors?.accentColor || '#3b82f6';

  // Myth colors based on theme
  const mythColors = getMythColors(theme);

  // Get pairs with fallback to defaults
  const pairs = blockContent.pairs || DEFAULT_PAIRS;

  // Add a new pair
  const addPair = () => {
    if (pairs.length >= 6) return;
    const newPair: MythRealityPair = {
      id: generateId(),
      myth: 'New myth to address',
      reality: 'The actual truth about this topic'
    };
    handleContentUpdate('pairs', JSON.stringify([...pairs, newPair]));
  };

  // Remove a pair by id
  const removePair = (pairId: string) => {
    if (pairs.length <= 1) return;
    handleContentUpdate('pairs', JSON.stringify(pairs.filter(p => p.id !== pairId)));
  };

  // Update a pair's myth text
  const updateMythText = (pairId: string, value: string) => {
    handleContentUpdate('pairs', JSON.stringify(pairs.map(p =>
      p.id === pairId ? { ...p, myth: value } : p
    )));
  };

  // Update a pair's reality text
  const updateRealityText = (pairId: string, value: string) => {
    handleContentUpdate('pairs', JSON.stringify(pairs.map(p =>
      p.id === pairId ? { ...p, reality: value } : p
    )));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MythVsRealityGrid"
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
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto"
              placeholder="Add a subheadline that sets up the myth vs reality comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Myth vs Reality Grid */}
        <div className="space-y-8">
          {pairs.map((pair) => (
            <div key={pair.id} className="relative group">
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                {/* Myth Card - Theme-based colors */}
                <div className={`${mythColors.bg} border ${mythColors.border} rounded-xl p-6 relative`}>
                  <div className="absolute -top-3 left-6">
                    <span style={{...bodyStyle, fontSize: '0.875rem', fontWeight: '500'}} className={`${mythColors.badgeBg} text-white px-3 py-1 rounded-full`}>
                      Myth
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-start space-x-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" strokeWidth={2.5} />
                      {mode !== 'preview' ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateMythText(pair.id, e.currentTarget.textContent || '')}
                          className={`outline-none focus:ring-2 ${mythColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text ${mythColors.hoverBg} ${mythColors.textColor} leading-relaxed flex-1`}
                          style={{...bodyStyle}}
                        >
                          {pair.myth}
                        </div>
                      ) : (
                        <p style={{...bodyStyle}} className={`${mythColors.textColor} leading-relaxed flex-1`}>{pair.myth}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reality Card - Accent color based */}
                <div
                  className="rounded-xl p-6 relative"
                  style={{
                    backgroundColor: `${accentColor}0A`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${accentColor}30`
                  }}
                >
                  <div className="absolute -top-3 left-6">
                    <span
                      style={{
                        ...bodyStyle,
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        backgroundColor: accentColor
                      }}
                      className="text-white px-3 py-1 rounded-full"
                    >
                      Reality
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" strokeWidth={2.5} />
                      {mode !== 'preview' ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateRealityText(pair.id, e.currentTarget.textContent || '')}
                          className="outline-none focus:ring-2 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text text-gray-800 leading-relaxed flex-1"
                          style={{
                            ...bodyStyle,
                            ['--tw-ring-color' as string]: accentColor
                          }}
                        >
                          {pair.reality}
                        </div>
                      ) : (
                        <p style={{...bodyStyle}} className="text-gray-800 leading-relaxed flex-1">{pair.reality}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete button - only show in edit mode and if more than 1 pair */}
              {mode !== 'preview' && pairs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePair(pair.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 absolute -top-2 right-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10"
                  title="Remove this myth vs reality pair"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Myth vs Reality Pair Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && pairs.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={addPair}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Myth vs Reality Pair</span>
            </button>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'MythVsRealityGrid',
  category: 'Objection Sections',
  description: 'Grid layout that contrasts myths with reality to address sophisticated market misconceptions and build credibility.',
  tags: ['objection', 'credibility', 'myth-busting', 'grid', 'comparison'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'pairs', label: 'Myth/Reality Pairs', type: 'array', required: true }
  ],

  features: [
    'Visual contrast between myths and reality cards',
    'Add/delete myth vs reality pairs (up to 6 pairs)',
    'Individual inline editing for each myth and reality',
    'Theme-aware styling for Myth cards (warm/cool/neutral)',
    'Accent color styling for Reality cards',
    'Lucide icons (X for myth, Check for reality)',
    'Responsive grid layout for optimal readability',
    'Minimum of 1 pair enforced'
  ],

  useCases: [
    'Addressing technical misconceptions in sophisticated markets',
    'Correcting pricing or complexity assumptions',
    'Debunking competitor claims or market myths',
    'Educational content for solution-aware prospects'
  ]
};
