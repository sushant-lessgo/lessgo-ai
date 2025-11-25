import React, { useState, useRef, useCallback } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { logger } from '@/lib/logger';
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
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

interface HeroBeforeAfterContent {
  headline: string;
  cta_text: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  before_image?: string;
  after_image?: string;
  slider_position?: number;
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Transform Your Workflow in Seconds'
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Free Trial'
  },
  subheadline: {
    type: 'string' as const,
    default: 'See the dramatic difference our solution makes to your daily operations.'
  },
  supporting_text: {
    type: 'string' as const,
    default: 'Join 500+ teams already transforming their workflow.'
  },
  badge_text: {
    type: 'string' as const,
    default: ''
  },
  trust_items: {
    type: 'string' as const,
    default: 'Free 14-day trial|No credit card required|Cancel anytime'
  },
  trust_item_1: {
    type: 'string' as const,
    default: 'Free 14-day trial'
  },
  trust_item_2: {
    type: 'string' as const,
    default: 'No credit card required'
  },
  trust_item_3: {
    type: 'string' as const,
    default: 'Cancel anytime'
  },
  trust_item_4: {
    type: 'string' as const,
    default: ''
  },
  trust_item_5: {
    type: 'string' as const,
    default: ''
  },
  before_label: {
    type: 'string' as const,
    default: 'Before'
  },
  after_label: {
    type: 'string' as const,
    default: 'After'
  },
  before_description: {
    type: 'string' as const,
    default: 'Manual processes, scattered data, wasted time'
  },
  after_description: {
    type: 'string' as const,
    default: 'Automated workflows, organized data, maximum efficiency'
  },
  before_image: {
    type: 'string' as const,
    default: '/Before default.jpg'
  },
  after_image: {
    type: 'string' as const,
    default: '/After default.jpg'
  },
  slider_position: {
    type: 'number' as const,
    default: 50
  }
};

// Draggable Before/After Slider Component
interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  beforeDescription: string;
  afterDescription: string;
  sliderPosition: number;
  onSliderChange: (position: number) => void;
  mode: 'preview' | 'edit';
  sectionId: string;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  beforeDescription,
  afterDescription,
  sliderPosition,
  onSliderChange,
  mode,
  sectionId,
  handleImageToolbar
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(sliderPosition);

  // Sync local state with prop when prop changes externally
  React.useEffect(() => {
    if (!isDragging) {
      setLocalPosition(sliderPosition);
    }
  }, [sliderPosition, isDragging]);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    console.log('Updating slider position:', percentage);
    setLocalPosition(percentage); // Update local state immediately
    onSliderChange(percentage); // Also notify parent
  }, [onSliderChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('MouseDown fired!', e.clientX);
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  }, [isDragging, updateSliderPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.touches[0].clientX);
  }, [isDragging, updateSliderPosition]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Validate image paths
  const isValidImagePath = (path: string) =>
    path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://');

  const hasBeforeImage = beforeImage && isValidImagePath(beforeImage);
  const hasAfterImage = afterImage && isValidImagePath(afterImage);

  return (
    <div className="w-full space-y-4">
      <div
        ref={containerRef}
        className="before-after-slider-container relative w-full overflow-hidden rounded-2xl shadow-2xl bg-gray-900"
        style={{ height: '500px', minHeight: '500px' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After Image (background) */}
        <div className="absolute inset-0">
          {hasAfterImage ? (
            <img
              src={afterImage}
              alt={afterLabel}
              className={`w-full h-full object-contain ${mode === 'preview' ? 'pointer-events-none' : 'cursor-pointer'}`}
              data-image-id={`${sectionId}-after_image`}
              onClick={(e) => {
                if (mode !== 'preview') {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleImageToolbar(`${sectionId}-after_image`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
              }}
              onMouseDown={(e) => {
                // Prevent slider drag when clicking on image in edit mode
                if (mode !== 'preview') {
                  e.stopPropagation();
                }
              }}
            />
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex items-center justify-center cursor-pointer"
              data-image-id={`${sectionId}-after_image`}
              onClick={(e) => {
                if (mode !== 'preview') {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleImageToolbar(`${sectionId}-after_image`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
              }}
              onMouseDown={(e) => {
                // Prevent slider drag when clicking on image in edit mode
                if (mode !== 'preview') {
                  e.stopPropagation();
                }
              }}
            >
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-semibold">Click to upload AFTER image</p>
              </div>
            </div>
          )}
          {/* After Label */}
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg pointer-events-none">
            {afterLabel}
          </div>
        </div>

        {/* Before Image (clipped overlay) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - localPosition}% 0 0)`,
            transition: 'clip-path 0.1s ease-out'
          }}
        >
          {hasBeforeImage ? (
            <img
              src={beforeImage}
              alt={beforeLabel}
              className={`w-full h-full object-contain ${mode === 'preview' ? 'pointer-events-none' : 'cursor-pointer'}`}
              data-image-id={`${sectionId}-before_image`}
              onClick={(e) => {
                if (mode !== 'preview') {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleImageToolbar(`${sectionId}-before_image`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
              }}
              onMouseDown={(e) => {
                // Prevent slider drag when clicking on image in edit mode
                if (mode !== 'preview') {
                  e.stopPropagation();
                }
              }}
            />
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-red-100 via-rose-50 to-pink-100 flex items-center justify-center cursor-pointer"
              data-image-id={`${sectionId}-before_image`}
              onClick={(e) => {
                if (mode !== 'preview') {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleImageToolbar(`${sectionId}-before_image`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
              }}
              onMouseDown={(e) => {
                // Prevent slider drag when clicking on image in edit mode
                if (mode !== 'preview') {
                  e.stopPropagation();
                }
              }}
            >
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-red-700 font-semibold">Click to upload BEFORE image</p>
              </div>
            </div>
          )}
          {/* Before Label */}
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg pointer-events-none">
            {beforeLabel}
          </div>
        </div>

        {/* Slider Divider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-10 pointer-events-auto"
          style={{ left: `${localPosition}%` }}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-gray-200 hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Drag Instruction (fades after first interaction) */}
        {localPosition === 50 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm animate-pulse pointer-events-none">
            ← Drag to compare →
          </div>
        )}
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-sm font-semibold text-red-600 mb-1">{beforeLabel}</div>
          <div className="text-sm text-gray-600">{beforeDescription}</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-green-600 mb-1">{afterLabel}</div>
          <div className="text-sm text-gray-600">{afterDescription}</div>
        </div>
      </div>
    </div>
  );
};

export default function HeroBeforeAfter(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

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
  } = useLayoutComponent<HeroBeforeAfterContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const bodyLgStyle = getTypographyStyle('body-lg');

  // Handle trust items
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== ''));

    if (individualItems.length > 0) {
      return individualItems;
    }

    return blockContent.trust_items
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : ['Free trial', 'No credit card'];
  };

  const trustItems = getTrustItems();
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const handleImageToolbar = useImageToolbar();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="HeroBeforeAfter"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex flex-col items-center space-y-8 min-h-[600px] justify-center">

          {(blockContent.badge_text || mode === 'edit') && (
            <div>
              <AccentBadge
                mode={mode}
                value={blockContent.badge_text || ''}
                onEdit={(value) => handleContentUpdate('badge_text', value)}
                colorTokens={colorTokens}
                placeholder="✨ See the Difference"
                sectionId={sectionId}
                elementKey="badge_text"
                sectionBackground={sectionBackground}
              />
            </div>
          )}

          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h1"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="leading-tight max-w-3xl"
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
              className="leading-relaxed max-w-2xl"
              style={bodyLgStyle}
              placeholder="Add a compelling subheadline explaining the transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6">

            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
              onClick={() => {
                const { content } = useEditStore.getState();
                const sectionData = content[sectionId];
                const ctaConfig = (sectionData as any)?.ctaConfig;

                logger.debug('🔗 CTA Button clicked:', () => ({ ctaConfig, sectionId }));

                if (ctaConfig?.type === 'link' && ctaConfig.url) {
                  window.open(ctaConfig.url, '_blank', 'noopener,noreferrer');
                }
              }}
            />

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
                  const fieldKey = `trust_item_${index + 1}` as keyof HeroBeforeAfterContent;
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
                    const fieldKey = `trust_item_${emptyIndex + 1}` as keyof HeroBeforeAfterContent;
                    handleContentUpdate(fieldKey, 'New trust item');
                  }
                }}
                onRemoveTrustItem={(index) => {
                  const fieldKey = `trust_item_${index + 1}` as keyof HeroBeforeAfterContent;
                  handleContentUpdate(fieldKey, '___REMOVED___');
                }}
                colorTokens={colorTokens}
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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

          {(blockContent.supporting_text || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.supporting_text || ''}
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="leading-relaxed max-w-xl"
              placeholder="Add supporting text with social proof or key metrics..."
              sectionId={sectionId}
              elementKey="supporting_text"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="w-full pt-8 isolate">
            <BeforeAfterSlider
              beforeImage={blockContent.before_image || '/Before default.jpg'}
              afterImage={blockContent.after_image || '/After default.jpg'}
              beforeLabel={blockContent.before_label || 'Before'}
              afterLabel={blockContent.after_label || 'After'}
              beforeDescription={blockContent.before_description || ''}
              afterDescription={blockContent.after_description || ''}
              sliderPosition={typeof blockContent.slider_position === 'number' ? blockContent.slider_position : (parseFloat(blockContent.slider_position as any) || 50)}
              onSliderChange={(position) => handleContentUpdate('slider_position', String(position))}
              mode={mode}
              sectionId={sectionId}
              handleImageToolbar={handleImageToolbar}
            />
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'HeroBeforeAfter',
  category: 'Hero Sections',
  description: 'Hero section with interactive before/after comparison slider showing transformation. Perfect for demonstrating product impact visually.',
  tags: ['hero', 'comparison', 'before-after', 'interactive', 'transformation'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',

  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Hero sections use predefined content schemas with specific split layout that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit the existing content fields (headline, subheadline, supporting text)",
      "Use the badge_text field for additional messaging",
      "Modify trust_items for social proof elements",
      "Customize before/after labels and descriptions",
      "Switch to a flexible content section for custom elements"
    ]
  },

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'badge_text', label: 'Badge Text (uses accent colors)', type: 'text', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Item 4', type: 'text', required: false },
    { key: 'trust_item_5', label: 'Trust Item 5', type: 'text', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: true },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: true },
    { key: 'before_image', label: 'Before Image', type: 'image', required: true },
    { key: 'after_image', label: 'After Image', type: 'image', required: true },
    { key: 'slider_position', label: 'Initial Slider Position (0-100)', type: 'number', required: false }
  ],

  features: [
    'Interactive draggable divider slider for before/after comparison',
    'Mouse and touch support for all devices',
    'Smooth real-time slider interaction',
    'Editable before/after labels and descriptions',
    'Image toolbar integration for easy image uploads',
    'Trust indicators and CTA in left column',
    'Automatic text color adaptation based on background',
    'Responsive split layout (stacks on mobile)',
    'Visual drag instruction hint'
  ],

  useCases: [
    'Demonstrating product transformation visually',
    'Before/after workflow comparisons',
    'UI/UX improvement showcases',
    'Problem/solution visual contrasts',
    'Process automation demonstrations',
    'Performance improvement evidence',
    'Design upgrade presentations'
  ]
};
