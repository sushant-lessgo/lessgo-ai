// components/layout/StackedHighlights.tsx
// V2 Schema: Uses highlights[] array instead of pipe-separated strings

import React from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';
import { getIcon } from '@/lib/getIcon';

interface Highlight {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface StackedHighlightsContent {
  headline: string;
  subheadline?: string;
  mechanism_name?: string;
  footer_text?: string;
  highlights: Highlight[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Our Proprietary SmartFlow System™'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Three unique capabilities that set us apart.'
  },
  mechanism_name: {
    type: 'string' as const,
    default: ''
  },
  footer_text: {
    type: 'string' as const,
    default: 'Our proprietary approach that you won\'t find anywhere else'
  },
  highlights: {
    type: 'array' as const,
    default: [
      { id: 'h1', title: 'Intelligent Auto-Prioritization', description: 'Our AI analyzes your workflow patterns and automatically prioritizes tasks based on deadlines, dependencies, and business impact.', icon: 'lucide:brain' },
      { id: 'h2', title: 'Dynamic Context Switching', description: 'The system seamlessly adapts to changing priorities and contexts, maintaining efficiency even when your focus needs to shift.', icon: 'lucide:refresh-cw' },
      { id: 'h3', title: 'Predictive Resource Allocation', description: 'Advanced algorithms predict resource needs and automatically allocate team capacity, preventing bottlenecks before they occur.', icon: 'lucide:trending-up' },
    ]
  }
};

// Helper to derive icon from highlight content
const deriveIcon = (highlight: Highlight): string => {
  if (highlight.icon) return highlight.icon;
  return getIcon(undefined, { title: highlight.title, description: highlight.description }) ?? 'lucide:sparkles';
};

// Individual Highlight Card
const HighlightCard = ({
  highlight,
  index,
  mode,
  sectionId,
  onUpdate,
  onRemove,
  colorTokens,
  canRemove,
  highlightColors,
  uiTheme,
  sectionBackground,
  backgroundType
}: {
  highlight: Highlight;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onUpdate: (field: keyof Highlight, value: string) => void;
  onRemove?: () => void;
  colorTokens: any;
  canRemove: boolean;
  highlightColors: any;
  uiTheme: UIBlockTheme;
  sectionBackground: any;
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider' | 'custom' | 'theme';
}) => {
  const displayIcon = deriveIcon(highlight);

  return (
    <div className="group relative">
      {/* Connection Line (except for last item) */}
      <div className={`absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b ${highlightColors.connectionLine} to-transparent hidden lg:block`}></div>

      {/* Highlight Card */}
      <div
        className={`
          relative flex items-start space-x-6 p-8
          bg-white rounded-xl border
          ${highlightColors.cardBorder}
          ${highlightColors.cardBorderHover}
          ${shadows.card[uiTheme]}
          ${shadows.cardHover[uiTheme]}
          ${cardEnhancements.transition}
          ${cardEnhancements.hoverLift}
          mb-6
        `}
      >
        {/* Icon Circle */}
        <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${highlightColors.iconBg} rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
          <IconEditableText
            mode={mode}
            value={displayIcon}
            onEdit={(value) => onUpdate('icon', value)}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="lg"
            className={`${highlightColors.iconText} text-2xl`}
            sectionId={sectionId}
            elementKey={`highlight_icon_${highlight.id}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Highlight Title */}
          <div className="mb-4">
            <EditableAdaptiveText
              mode={mode}
              value={highlight.title || ''}
              onEdit={(value) => onUpdate('title', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="font-bold text-gray-900 text-xl"
              formatState={{ bold: true, fontSize: '20px' } as any}
              placeholder="Highlight title"
              sectionId={sectionId}
              elementKey={`highlight_title_${highlight.id}`}
              sectionBackground={sectionBackground}
            />
          </div>

          {/* Highlight Description */}
          <EditableAdaptiveText
            mode={mode}
            value={highlight.description || ''}
            onEdit={(value) => onUpdate('description', value)}
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className="text-gray-600 leading-relaxed"
            placeholder="Describe this unique benefit"
            sectionId={sectionId}
            elementKey={`highlight_description_${highlight.id}`}
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Delete button - only show in edit mode and if can remove */}
        {mode !== 'preview' && onRemove && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this highlight"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Unique Badge */}
        <div className={`absolute top-4 ${mode !== 'preview' && onRemove && canRemove ? 'right-12' : 'right-4'} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}>
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StackedHighlights(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<StackedHighlightsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Ensure highlights is always an array
  const highlights: Highlight[] = Array.isArray(blockContent.highlights)
    ? blockContent.highlights
    : CONTENT_SCHEMA.highlights.default;

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getHighlightColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        connectionLine: 'from-orange-200',
        cardBorder: 'border-orange-200',
        cardBorderHover: 'hover:border-orange-400',
        iconBg: 'from-orange-500 to-orange-600',
        iconText: 'text-white',
        mechanismBg: 'bg-orange-100',
        mechanismBorder: 'border-orange-300',
        mechanismIconText: 'text-orange-600',
        mechanismText: 'text-orange-800',
        addButtonBg: 'bg-orange-50 hover:bg-orange-100',
        addButtonBorder: 'border-orange-200 hover:border-orange-300',
        addButtonIcon: 'text-orange-600',
        addButtonText: 'text-orange-700',
        footerBg: 'from-orange-50 to-red-50',
        footerBorder: 'border-orange-200',
        footerIcon: 'text-orange-600',
        footerText: 'text-orange-800'
      },
      cool: {
        connectionLine: 'from-blue-200',
        cardBorder: 'border-blue-200',
        cardBorderHover: 'hover:border-blue-400',
        iconBg: 'from-blue-500 to-blue-600',
        iconText: 'text-white',
        mechanismBg: 'bg-blue-100',
        mechanismBorder: 'border-blue-300',
        mechanismIconText: 'text-blue-600',
        mechanismText: 'text-blue-800',
        addButtonBg: 'bg-blue-50 hover:bg-blue-100',
        addButtonBorder: 'border-blue-200 hover:border-blue-300',
        addButtonIcon: 'text-blue-600',
        addButtonText: 'text-blue-700',
        footerBg: 'from-blue-50 to-purple-50',
        footerBorder: 'border-blue-200',
        footerIcon: 'text-blue-600',
        footerText: 'text-blue-800'
      },
      neutral: {
        connectionLine: 'from-gray-200',
        cardBorder: 'border-gray-200',
        cardBorderHover: 'hover:border-gray-400',
        iconBg: 'from-gray-500 to-gray-600',
        iconText: 'text-white',
        mechanismBg: 'bg-gray-100',
        mechanismBorder: 'border-gray-300',
        mechanismIconText: 'text-gray-600',
        mechanismText: 'text-gray-800',
        addButtonBg: 'bg-gray-50 hover:bg-gray-100',
        addButtonBorder: 'border-gray-200 hover:border-gray-300',
        addButtonIcon: 'text-gray-600',
        addButtonText: 'text-gray-700',
        footerBg: 'from-gray-50 to-gray-100',
        footerBorder: 'border-gray-200',
        footerIcon: 'text-gray-600',
        footerText: 'text-gray-800'
      }
    }[theme];
  };

  const highlightColors = getHighlightColors(uiTheme);

  // Handle highlight field update
  const handleHighlightUpdate = (highlightId: string, field: keyof Highlight, value: string) => {
    const updated = highlights.map(h =>
      h.id === highlightId ? { ...h, [field]: value } : h
    );
    (handleContentUpdate as any)('highlights', updated);
  };

  // Handle adding a new highlight
  const handleAddHighlight = () => {
    if (highlights.length >= 6) return; // Enforce max constraint
    const newHighlight: Highlight = {
      id: `h${Date.now()}`,
      title: 'New Highlight',
      description: 'Describe this unique benefit or feature of your solution.',
    };
    (handleContentUpdate as any)('highlights', [...highlights, newHighlight]);
  };

  // Handle removing a highlight
  const handleRemoveHighlight = (highlightId: string) => {
    if (highlights.length <= 2) return; // Enforce min constraint
    const updated = highlights.filter(h => h.id !== highlightId);
    (handleContentUpdate as any)('highlights', updated);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedHighlights"
      backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-6"
              placeholder="Add a supporting subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Optional Mechanism Name */}
          {(blockContent.mechanism_name || mode === 'edit') && (
            <div className={`inline-flex items-center px-4 py-2 ${highlightColors.mechanismBg} border ${highlightColors.mechanismBorder} rounded-full`}>
              {blockContent.mechanism_name && (
                <svg className={`w-4 h-4 mr-2 ${highlightColors.mechanismIconText}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.mechanism_name || ''}
                onEdit={(value) => handleContentUpdate('mechanism_name', value)}
                backgroundType="neutral"
                colorTokens={{ ...colorTokens, textPrimary: highlightColors.mechanismText }}
                variant="body"
                className={`font-semibold ${highlightColors.mechanismText}`}
                placeholder="Add mechanism name (e.g., 'Powered by SmartFlow™')"
                sectionId={sectionId}
                elementKey="mechanism_name"
                sectionBackground={highlightColors.mechanismBg}
              />
            </div>
          )}
        </div>

        {/* Stacked Highlights */}
        <div className="space-y-0">
          {highlights.map((highlight, index) => (
            <HighlightCard
              key={highlight.id}
              highlight={highlight}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onUpdate={(field, value) => handleHighlightUpdate(highlight.id, field, value)}
              onRemove={() => handleRemoveHighlight(highlight.id)}
              colorTokens={colorTokens}
              canRemove={highlights.length > 2}
              highlightColors={highlightColors}
              uiTheme={uiTheme}
              sectionBackground={sectionBackground}
              backgroundType={backgroundType}
            />
          ))}
        </div>

        {/* Add Highlight Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && highlights.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddHighlight}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${highlightColors.addButtonBg} border-2 ${highlightColors.addButtonBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${highlightColors.addButtonIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${highlightColors.addButtonText} font-medium`}>Add Highlight</span>
            </button>
          </div>
        )}

        {/* Unique Value Proposition */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${highlightColors.footerBg} border ${highlightColors.footerBorder} rounded-full`}>
              <svg className={`w-5 h-5 mr-2 ${highlightColors.footerIcon}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.footer_text || ''}
                onEdit={(value) => handleContentUpdate('footer_text', value)}
                backgroundType="neutral"
                colorTokens={{ ...colorTokens, textPrimary: highlightColors.footerText }}
                variant="body"
                className={`font-medium ${highlightColors.footerText}`}
                placeholder="Add unique value proposition..."
                sectionId={sectionId}
                elementKey="footer_text"
                sectionBackground={highlightColors.footerBg}
              />
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StackedHighlights',
  category: 'Unique Mechanism',
  description: 'Vertical feature highlights showcasing unique mechanism capabilities',
  tags: ['features', 'highlights', 'stacked', 'mechanism', 'unique'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes'
};
