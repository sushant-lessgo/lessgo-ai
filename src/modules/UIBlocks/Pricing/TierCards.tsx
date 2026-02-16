import React from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

interface TierCardsProps extends LayoutComponentProps {}

// Tier structure
interface Tier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta_text: string;
  highlighted: boolean;
}

// Content interface for TierCards layout
interface TierCardsContent {
  headline: string;
  subheadline?: string;
  badge_text?: string;
  billing_note?: string;
  guarantee_text?: string;
  highlighted_label?: string;
  tiers: Tier[];
}

// Content schema for TierCards layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Choose Your Plan' },
  subheadline: { type: 'string' as const, default: '' },
  badge_text: { type: 'string' as const, default: '' },
  billing_note: { type: 'string' as const, default: '' },
  guarantee_text: { type: 'string' as const, default: '' },
  highlighted_label: { type: 'string' as const, default: 'Most Popular' },
  tiers: {
    type: 'array' as const,
    default: [
      {
        id: 'tier-1',
        name: 'Starter',
        price: '$9',
        period: '/month',
        description: 'Perfect for individuals getting started',
        features: ['5 projects', '10GB storage', 'Email support'],
        cta_text: 'Get Started',
        highlighted: false,
      },
      {
        id: 'tier-2',
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For growing teams that need more power',
        features: ['Unlimited projects', '100GB storage', 'Priority support', 'API access'],
        cta_text: 'Go Pro',
        highlighted: true,
      },
      {
        id: 'tier-3',
        name: 'Enterprise',
        price: '$99',
        period: '/month',
        description: 'Custom solutions for large organizations',
        features: ['Unlimited everything', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'White-label'],
        cta_text: 'Contact Sales',
        highlighted: false,
      },
    ],
  },
};

// Get theme-specific accent colors for pricing (badge, checkmark)
const getPricingAccents = (theme: UIBlockTheme) => {
  const accentColors = {
    warm: {
      badgeBg: 'bg-orange-600',
      badgeText: 'text-white',
      checkmark: 'text-orange-500',
    },
    cool: {
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      checkmark: 'text-blue-500',
    },
    neutral: {
      badgeBg: 'bg-gray-700',
      badgeText: 'text-white',
      checkmark: 'text-green-500',
    },
  };

  return accentColors[theme];
};

// Individual Pricing Card
const PricingCard = ({
  tier,
  mode,
  sectionId,
  onTierUpdate,
  onRemove,
  showRemoveButton,
  onAddFeature,
  onRemoveFeature,
  onEditFeature,
  onToggleHighlighted,
  colorTokens,
  cardStyles,
  pricingAccents,
  highlightedLabel,
  onHighlightedLabelEdit,
}: {
  tier: Tier;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTierUpdate: (field: keyof Tier, value: any) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  onAddFeature?: () => void;
  onRemoveFeature?: (featureIndex: number) => void;
  onEditFeature?: (featureIndex: number, value: string) => void;
  onToggleHighlighted?: () => void;
  colorTokens: any;
  cardStyles: CardStyles;
  pricingAccents: ReturnType<typeof getPricingAccents>;
  highlightedLabel: string;
  onHighlightedLabelEdit?: (value: string) => void;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className={`relative h-full ${tier.highlighted ? 'transform scale-105 z-10' : ''}`}>
      {/* Highlighted Badge */}
      {tier.highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          {mode !== 'preview' && onHighlightedLabelEdit ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onHighlightedLabelEdit(e.currentTarget.textContent || 'Most Popular')}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${pricingAccents.badgeBg} ${pricingAccents.badgeText} shadow-lg outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 cursor-text`}
              data-section-id={sectionId}
              data-element-key="highlighted_label"
            >
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {highlightedLabel}
            </div>
          ) : (
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${pricingAccents.badgeBg} ${pricingAccents.badgeText} shadow-lg`}
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {highlightedLabel}
            </span>
          )}
        </div>
      )}

      {/* Card */}
      <div
        className={`relative h-full flex flex-col p-8 ${cardStyles.bg} ${cardStyles.blur} rounded-2xl ${cardStyles.shadow} border-2 ${cardStyles.border} ${cardStyles.hoverEffect} transition-all duration-300`}
      >
        {/* Remove Button - Only in edit mode and when allowed */}
        {mode === 'edit' && showRemoveButton && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 z-30 shadow-lg"
            title="Remove this pricing tier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Toggle Highlighted - Edit mode only */}
        {mode === 'edit' && onToggleHighlighted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleHighlighted();
            }}
            className={`absolute top-2 left-2 p-1.5 rounded-full ${tier.highlighted ? 'bg-yellow-400' : 'bg-gray-200'} hover:bg-yellow-300 transition-all duration-200 z-30`}
            title={tier.highlighted ? 'Remove highlight' : 'Set as highlighted'}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        )}

        {/* Tier Name */}
        <div className="text-center mb-4">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTierUpdate('name', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-xl ${colorTokens.textPrimary}`}
              data-section-id={sectionId}
              data-element-key={`tiers.${tier.id}.name`}
            >
              {tier.name}
            </div>
          ) : (
            <h3 className={`font-bold text-xl ${colorTokens.textPrimary}`}>{tier.name}</h3>
          )}
        </div>

        {/* Price + Period */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center">
            {mode !== 'preview' ? (
              <>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTierUpdate('price', e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-4xl font-bold ${colorTokens.textPrimary}`}
                  data-section-id={sectionId}
                  data-element-key={`tiers.${tier.id}.price`}
                >
                  {tier.price}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTierUpdate('period', e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 ${colorTokens.textSecondary} ml-1`}
                  data-section-id={sectionId}
                  data-element-key={`tiers.${tier.id}.period`}
                >
                  {tier.period}
                </div>
              </>
            ) : (
              <>
                <span className={`text-4xl font-bold ${colorTokens.textPrimary}`}>{tier.price}</span>
                <span className={`${colorTokens.textSecondary} ml-1`}>{tier.period}</span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTierUpdate('description', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 ${colorTokens.textSecondary}`}
              data-section-id={sectionId}
              data-element-key={`tiers.${tier.id}.description`}
            >
              {tier.description}
            </div>
          ) : (
            <p className={colorTokens.textSecondary}>{tier.description}</p>
          )}
        </div>

        {/* Features List */}
        <div className="mb-8">
          <ul className="space-y-3">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start group/feature-item relative">
                <svg
                  className={`w-5 h-5 ${pricingAccents.checkmark} mr-3 mt-0.5 flex-shrink-0`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 min-w-0 relative">
                  {mode !== 'preview' ? (
                    <>
                      <EditableAdaptiveText
                        mode={mode}
                        value={feature}
                        onEdit={(value) => onEditFeature?.(index, value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        variant="body"
                        placeholder={`Feature ${index + 1}`}
                        data-section-id={sectionId}
                        data-element-key={`tiers.${tier.id}.features.${index}`}
                      />
                      {onRemoveFeature && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFeature(index);
                          }}
                          className="opacity-0 group-hover/feature-item:opacity-100 absolute right-0 top-0 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                          title="Remove this feature"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    <span className={colorTokens.textPrimary}>{feature}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Add feature button */}
          {mode !== 'preview' && onAddFeature && tier.features.length < 8 && (
            <button
              onClick={onAddFeature}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-3 self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add feature</span>
            </button>
          )}
        </div>

        {/* CTA Button */}
        <div className="mt-auto">
          <CTAButton
            text={tier.cta_text}
            colorTokens={colorTokens}
            className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            variant={tier.highlighted ? 'primary' : 'secondary'}
            sectionId={sectionId}
            elementKey={`tiers.${tier.id}.cta_text`}
          />
        </div>
      </div>
    </div>
  );
};

export default function TierCards(props: TierCardsProps) {
  const { sectionId, mode, blockContent, colorTokens, sectionBackground, backgroundType, handleContentUpdate } =
    useLayoutComponent<TierCardsContent>({
      ...props,
      contentSchema: CONTENT_SCHEMA,
    });

  // Theme detection
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles based on section background luminance
  const getCardStylesForTier = React.useCallback((highlighted: boolean) => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiBlockTheme,
      highlighted
    });
  }, [sectionBackground, uiBlockTheme]);

  // Get theme-specific accent colors
  const pricingAccents = getPricingAccents(uiBlockTheme);

  // Accent color for badge (matches Hero pattern)
  const accentColor = props.theme?.colors?.accentColor || '#3b82f6';

  // Get tiers array (ensure it exists)
  const tiers: Tier[] = blockContent.tiers || CONTENT_SCHEMA.tiers.default;

  // --- Handler Functions ---

  // Tier-level (id-based)
  const handleTierUpdate = (tierId: string, field: keyof Tier, value: any) => {
    const updatedTiers = tiers.map((tier) => (tier.id === tierId ? { ...tier, [field]: value } : tier));
    handleContentUpdate('tiers', JSON.stringify(updatedTiers));
  };

  const handleAddTier = () => {
    if (tiers.length >= 4) return; // Max 4 tiers

    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      name: 'New Plan',
      price: '$49',
      period: '/month',
      description: 'Description for this plan',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      cta_text: 'Get Started',
      highlighted: false,
    };

    handleContentUpdate('tiers', JSON.stringify([...tiers, newTier]));
  };

  const handleRemoveTier = (tierId: string) => {
    if (tiers.length <= 2) return; // Min 2 tiers
    handleContentUpdate('tiers', JSON.stringify(tiers.filter((tier) => tier.id !== tierId)));
  };

  const handleToggleHighlighted = (tierId: string) => {
    const updatedTiers = tiers.map((tier) => ({
      ...tier,
      highlighted: tier.id === tierId ? !tier.highlighted : tier.highlighted,
    }));
    handleContentUpdate('tiers', JSON.stringify(updatedTiers));
  };

  // Feature-level (INDEX-based)
  const handleAddFeature = (tierId: string) => {
    const updatedTiers = tiers.map((tier) => {
      if (tier.id === tierId && tier.features.length < 8) {
        return { ...tier, features: [...tier.features, 'New feature'] };
      }
      return tier;
    });
    handleContentUpdate('tiers', JSON.stringify(updatedTiers));
  };

  const handleRemoveFeature = (tierId: string, featureIndex: number) => {
    const updatedTiers = tiers.map((tier) => {
      if (tier.id === tierId) {
        return { ...tier, features: tier.features.filter((_, i) => i !== featureIndex) };
      }
      return tier;
    });
    handleContentUpdate('tiers', JSON.stringify(updatedTiers));
  };

  const handleEditFeature = (tierId: string, featureIndex: number, value: string) => {
    const updatedTiers = tiers.map((tier) => {
      if (tier.id === tierId) {
        return { ...tier, features: tier.features.map((f, i) => (i === featureIndex ? value : f)) };
      }
      return tier;
    });
    handleContentUpdate('tiers', JSON.stringify(updatedTiers));
  };

  // Grid classes based on tier count
  const gridClass =
    tiers.length === 1
      ? 'max-w-md mx-auto'
      : tiers.length === 2
        ? 'md:grid-cols-2 max-w-4xl mx-auto'
        : tiers.length === 3
          ? 'md:grid-cols-3 max-w-6xl mx-auto'
          : 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto';

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TierCards"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-20">
          {/* Badge Text - Light bg + accent text (matches Hero pattern) */}
          {blockContent.badge_text && blockContent.badge_text.trim() !== '' && (
            <div className="mb-4">
              {mode !== 'preview' ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('badge_text', e.currentTarget.textContent || '')}
                  className="inline-block px-4 py-2 rounded-full font-medium outline-none cursor-text"
                  style={{
                    color: accentColor,
                    backgroundColor: `${accentColor}15`,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em'
                  }}
                  data-section-id={sectionId}
                  data-element-key="badge_text"
                >
                  {blockContent.badge_text}
                </span>
              ) : (
                <span
                  className="inline-block px-4 py-2 rounded-full font-medium"
                  style={{
                    color: accentColor,
                    backgroundColor: `${accentColor}15`,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em'
                  }}
                >
                  {blockContent.badge_text}
                </span>
              )}
            </div>
          )}

          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleContentUpdate('headline', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 mb-4 ${colorTokens.textPrimary}`}
              style={{ fontSize: '2.25rem', fontWeight: 'bold' }}
              data-section-id={sectionId}
              data-element-key="headline"
            >
              {blockContent.headline}
            </div>
          ) : (
            <h2 className={`mb-4 ${colorTokens.textPrimary}`} style={{ fontSize: '2.25rem', fontWeight: 'bold' }}>
              {blockContent.headline}
            </h2>
          )}

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleContentUpdate('subheadline', e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 text-lg ${colorTokens.textSecondary}`}
                data-section-id={sectionId}
                data-element-key="subheadline"
                data-placeholder="Add subheadline..."
              >
                {blockContent.subheadline || ''}
              </div>
            ) : blockContent.subheadline ? (
              <p className={`text-lg ${colorTokens.textSecondary}`}>{blockContent.subheadline}</p>
            ) : null
          )}
        </div>

        {/* Tier Management Controls - Only in edit mode */}
        {mode === 'edit' && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Pricing Tiers: {tiers.length} {tiers.length === 1 ? 'tier' : 'tiers'}
                </span>
              </div>
              {tiers.length < 4 && (
                <button
                  onClick={handleAddTier}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Tier</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              You can have between 2-4 pricing tiers.{' '}
              {tiers.length === 4 ? 'Maximum tiers reached.' : `${4 - tiers.length} more tier${4 - tiers.length === 1 ? '' : 's'} available.`}
            </p>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${gridClass}`}>
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              mode={mode}
              sectionId={sectionId}
              onTierUpdate={(field, value) => handleTierUpdate(tier.id, field, value)}
              onRemove={() => handleRemoveTier(tier.id)}
              showRemoveButton={tiers.length > 2}
              onAddFeature={() => handleAddFeature(tier.id)}
              onRemoveFeature={(featureIndex) => handleRemoveFeature(tier.id, featureIndex)}
              onEditFeature={(featureIndex, value) => handleEditFeature(tier.id, featureIndex, value)}
              onToggleHighlighted={() => handleToggleHighlighted(tier.id)}
              colorTokens={colorTokens}
              cardStyles={getCardStylesForTier(tier.highlighted)}
              pricingAccents={pricingAccents}
              highlightedLabel={blockContent.highlighted_label || 'Most Popular'}
              onHighlightedLabelEdit={(value) => handleContentUpdate('highlighted_label', value)}
            />
          ))}
        </div>

        {/* Footer - Billing Note & Guarantee */}
        {(blockContent.billing_note || blockContent.guarantee_text || mode === 'edit') && (
          <div className="mt-12 text-center space-y-2">
            {/* Billing Note */}
            {(blockContent.billing_note || mode === 'edit') && (
              mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('billing_note', e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 text-sm ${colorTokens.textSecondary}`}
                  data-section-id={sectionId}
                  data-element-key="billing_note"
                  data-placeholder="Add billing note (e.g., 'Billed annually')..."
                >
                  {blockContent.billing_note || ''}
                </div>
              ) : blockContent.billing_note ? (
                <p className={`text-sm ${colorTokens.textSecondary}`}>{blockContent.billing_note}</p>
              ) : null
            )}

            {/* Guarantee Text */}
            {(blockContent.guarantee_text || mode === 'edit') && (
              mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('guarantee_text', e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 text-sm font-medium ${colorTokens.textSecondary}`}
                  data-section-id={sectionId}
                  data-element-key="guarantee_text"
                  data-placeholder="Add guarantee (e.g., '30-day money-back guarantee')..."
                >
                  {blockContent.guarantee_text || ''}
                </div>
              ) : blockContent.guarantee_text ? (
                <p className={`text-sm font-medium ${colorTokens.textSecondary}`}>{blockContent.guarantee_text}</p>
              ) : null
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TierCards',
  category: 'Pricing',
  description: 'Flexible pricing tier cards with 2-4 tiers, theme-aware styling and highlighted tier support',
  tags: ['pricing', 'tiers', 'cards', 'features', 'adaptive-colors', 'flexible'],
  features: [
    'Flexible tier count (2-4 tiers)',
    'Add/remove tiers dynamically in edit mode',
    'Add/remove features per tier (up to 8 features)',
    'Toggle highlighted tier',
    'Price + period split fields',
    'Automatic text color adaptation based on background type',
    'Editable tier names, prices, periods, descriptions, and CTAs',
    'Highlighted tier visual emphasis',
    'Responsive grid layout based on tier count',
    'Theme-aware styling (warm, cool, neutral)',
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" - Controls text color adaptation',
    className: 'string - Additional CSS classes',
  },
  contentSchema: {
    headline: 'Main heading text',
    subheadline: 'Optional subheading text',
    tiers: 'Array of tier objects with name, price, period, description, features[], cta_text, highlighted',
  },
  examples: ['SaaS pricing plans', 'Service tier comparison', 'Product package options', 'Subscription levels'],
};
