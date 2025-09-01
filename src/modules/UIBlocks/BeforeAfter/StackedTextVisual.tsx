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

interface StackedTextVisualProps extends LayoutComponentProps {}

// Content interface for StackedTextVisual layout
interface StackedTextVisualContent {
  headline: string;
  before_text: string;
  after_text: string;
  before_label: string;
  after_label: string;
  transition_text?: string;
  before_icon?: string;
  after_icon?: string;
  transition_icon?: string;
  subheadline?: string;
  summary_text?: string;
  show_summary_box?: string;
}

// Content schema for StackedTextVisual layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Transform Your Experience' },
  before_text: { type: 'string' as const, default: 'Struggling with manual processes, disconnected tools, and delayed insights that slow down your progress.' },
  after_text: { type: 'string' as const, default: 'Enjoy automated workflows, unified data, and instant insights that accelerate your success.' },
  before_label: { type: 'string' as const, default: 'Before' },
  after_label: { type: 'string' as const, default: 'After' },
  transition_text: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  summary_text: { type: 'string' as const, default: '' },
  show_summary_box: { type: 'string' as const, default: 'false' },
  before_icon: {
    type: 'string' as const,
    default: '➕'
  },
  after_icon: {
    type: 'string' as const,
    default: '⚡'
  },
  transition_icon: {
    type: 'string' as const,
    default: '⬇️'
  }
};


export default function StackedTextVisual(props: StackedTextVisualProps) {
  // ✅ Use the standard useLayoutComponent hook
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate,
    theme
  } = useLayoutComponent<StackedTextVisualContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedTextVisual"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-2xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Stacked Before/After Blocks */}
        <div className="space-y-8">
          {/* Before Block */}
          <div className="relative">
            <div 
              className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-8 shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-muted, #f9fafb)',
                borderLeftColor: 'var(--border-muted, #9ca3af)'
              }}
            >
              <div className="flex items-start space-x-4">
                {/* Before Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.before_icon || '➕'}
                    onEdit={(value) => handleContentUpdate('before_icon', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    iconSize="md"
                    className="text-2xl text-gray-600"
                    sectionId={sectionId}
                    elementKey="before_icon"
                  />
                </div>
                
                <div className="flex-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.before_label || ''}
                    onEdit={(value) => handleContentUpdate('before_label', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                    className="text-gray-700 font-semibold mb-3 uppercase tracking-wide text-sm"
                    sectionId={sectionId}
                    elementKey="before_label"
                    sectionBackground={sectionBackground}
                  />
                  
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.before_text || ''}
                    onEdit={(value) => handleContentUpdate('before_text', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-700 leading-relaxed"
                    sectionId={sectionId}
                    elementKey="before_text"
                    sectionBackground={sectionBackground}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transition Connector */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              {/* Arrow */}
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <IconEditableText
                  mode={mode}
                  value={blockContent.transition_icon || '⬇️'}
                  onEdit={(value) => handleContentUpdate('transition_icon', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg text-blue-600"
                  sectionId={sectionId}
                  elementKey="transition_icon"
                />
              </div>
              
              {/* Optional Transition Text */}
              {(blockContent.transition_text || mode !== 'preview') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transition_text || ''}
                  onEdit={(value) => handleContentUpdate('transition_text', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm font-medium text-center px-4 py-2 bg-blue-50 rounded-full"
                  placeholder="Add transition text..."
                  sectionId={sectionId}
                  elementKey="transition_text"
                  sectionBackground={sectionBackground}
                />
              )}
            </div>
          </div>

          {/* After Block */}
          <div className="relative">
            <div 
              className="bg-green-50 border-l-4 border-green-500 rounded-lg p-8 shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-success, #f0fdf4)',
                borderLeftColor: 'var(--border-success, #22c55e)'
              }}
            >
              <div className="flex items-start space-x-4">
                {/* After Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.after_icon || '⚡'}
                    onEdit={(value) => handleContentUpdate('after_icon', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    iconSize="md"
                    className="text-2xl text-green-600"
                    sectionId={sectionId}
                    elementKey="after_icon"
                  />
                </div>
                
                <div className="flex-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.after_label || ''}
                    onEdit={(value) => handleContentUpdate('after_label', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#15803d'
                    }}
                    className="text-green-700 font-semibold mb-3 uppercase tracking-wide text-sm"
                    sectionId={sectionId}
                    elementKey="after_label"
                    sectionBackground={sectionBackground}
                  />
                  
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.after_text || ''}
                    onEdit={(value) => handleContentUpdate('after_text', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-green-700 leading-relaxed"
                    sectionId={sectionId}
                    elementKey="after_text"
                    sectionBackground={sectionBackground}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Summary Box */}
        {(blockContent.show_summary_box !== 'false' && (blockContent.summary_text || mode !== 'preview')) && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 relative group/summary-item">
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.summary_text || ''}
                onEdit={(value) => handleContentUpdate('summary_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-medium max-w-2xl mx-auto"
                style={bodyLgStyle}
                placeholder="Add optional summary text to reinforce the transformation..."
                sectionId={sectionId}
                elementKey="summary_text"
                sectionBackground={sectionBackground}
              />
            </div>
            
            {/* Remove button */}
            {mode !== 'preview' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('summary_text', '___REMOVED___');
                  handleContentUpdate('show_summary_box', 'false');
                }}
                className="opacity-0 group-hover/summary-item:opacity-100 absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                title="Remove summary box"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Add summary box button */}
        {mode !== 'preview' && !blockContent.summary_text && blockContent.show_summary_box === 'false' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                handleContentUpdate('summary_text', 'Add your transformation summary here...');
                handleContentUpdate('show_summary_box', 'true');
              }}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add summary box</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StackedTextVisual',
  category: 'Comparison',
  description: 'Before/after comparison with adaptive text colors and visual transitions',
  tags: ['before-after', 'comparison', 'transformation', 'visual', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable before and after text content',
    'Visual transition connector with optional text',
    'Color-coded blocks (gray for before, green for after)',
    'Contextual icons for each state',
    'Optional subheadline for additional context'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    before_text: 'Text describing the "before" state',
    after_text: 'Text describing the "after" state',
    transition_text: 'Optional text for the transition connector',
    subheadline: 'Optional subheading for additional context'
  },
  examples: [
    'Problem to solution comparison',
    'Current state vs future state',
    'Transformation showcase',
    'Process improvement illustration'
  ]
};