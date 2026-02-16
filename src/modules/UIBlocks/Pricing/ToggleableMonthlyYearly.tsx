import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';
import { isHexColor } from '@/utils/colorUtils';

interface ToggleableMonthlyYearlyProps extends LayoutComponentProps {}

// Tier structure
interface Tier {
  id: string;
  name: string;
  monthly_price: string;
  yearly_price: string;
  description: string;
  features: string[];
  cta_text: string;
  is_popular: boolean;
}

// Content interface
interface ToggleableMonthlyYearlyContent {
  headline: string;
  subheadline?: string;
  annual_discount_label?: string;
  billing_note?: string;
  tiers: Tier[];
}

// Content schema
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Choose the Perfect Plan for Your Business' },
  subheadline: { type: 'string' as const, default: '' },
  annual_discount_label: { type: 'string' as const, default: 'Save 17% with annual billing' },
  billing_note: { type: 'string' as const, default: 'All plans include 14-day free trial. No credit card required.' },
  tiers: {
    type: 'array' as const,
    default: [
      {
        id: 'tier-1',
        name: 'Starter',
        monthly_price: '$29',
        yearly_price: '$290',
        description: 'Perfect for small teams getting started',
        features: ['Up to 5 team members', '10GB storage', 'Basic integrations', 'Email support'],
        cta_text: 'Start Free Trial',
        is_popular: false,
      },
      {
        id: 'tier-2',
        name: 'Professional',
        monthly_price: '$79',
        yearly_price: '$790',
        description: 'For growing businesses that need more power',
        features: ['Up to 25 team members', '100GB storage', 'Advanced integrations', 'Priority support', 'Custom branding'],
        cta_text: 'Start Free Trial',
        is_popular: true,
      },
      {
        id: 'tier-3',
        name: 'Enterprise',
        monthly_price: '$199',
        yearly_price: '$1990',
        description: 'Custom solutions for large organizations',
        features: ['Unlimited team members', 'Unlimited storage', 'Enterprise integrations', 'Dedicated support', 'Advanced security'],
        cta_text: 'Contact Sales',
        is_popular: false,
      },
    ],
  },
};

// Get theme-specific accent colors for pricing (badge, checkmark - not card styling)
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

// Calculate savings percentage
const calculateSavings = (monthlyPrice: string, yearlyPrice: string): number => {
  const monthly = parseFloat(monthlyPrice.replace(/[^0-9.]/g, ''));
  const yearly = parseFloat(yearlyPrice.replace(/[^0-9.]/g, ''));

  if (monthly && yearly) {
    const monthlyCost = monthly * 12;
    const savings = Math.round(((monthlyCost - yearly) / monthlyCost) * 100);
    return savings > 0 ? savings : 0;
  }
  return 0;
};

// Individual Pricing Card
const PricingCard = ({
  tier,
  mode,
  sectionId,
  billingCycle,
  onTierUpdate,
  onRemove,
  showRemoveButton,
  onAddFeature,
  onRemoveFeature,
  onEditFeature,
  onTogglePopular,
  colorTokens,
  cardStyles,
  pricingAccents,
}: {
  tier: Tier;
  mode: 'edit' | 'preview';
  sectionId: string;
  billingCycle: 'monthly' | 'yearly';
  onTierUpdate: (field: keyof Tier, value: any) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  onAddFeature?: () => void;
  onRemoveFeature?: (featureIndex: number) => void;
  onEditFeature?: (featureIndex: number, value: string) => void;
  onTogglePopular?: () => void;
  colorTokens: any;
  cardStyles: CardStyles;
  pricingAccents: ReturnType<typeof getPricingAccents>;
}) => {
  const currentPrice = billingCycle === 'monthly' ? tier.monthly_price : tier.yearly_price;
  const savingsPercent = calculateSavings(tier.monthly_price, tier.yearly_price);

  return (
    <div className={`relative ${tier.is_popular ? 'transform scale-105 z-10' : ''}`}>
      {/* Highlighted Badge */}
      {tier.is_popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
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
            Most Popular
          </span>
        </div>
      )}

      {/* Annual Savings Badge */}
      {billingCycle === 'yearly' && savingsPercent > 0 && (
        <div
          className={`absolute -top-3 right-4 ${isHexColor(colorTokens.ctaBg) ? '' : colorTokens.ctaBg} text-white px-3 py-1 rounded-full text-xs font-semibold z-20`}
          style={isHexColor(colorTokens.ctaBg) ? { backgroundColor: colorTokens.ctaBg } : undefined}
        >
          Save {savingsPercent}%
        </div>
      )}

      {/* Card */}
      <div
        className={`relative h-full flex flex-col p-8 ${cardStyles.bg} ${cardStyles.blur} rounded-2xl ${cardStyles.shadow} border-2 ${cardStyles.border} ${cardStyles.hoverEffect} transition-all duration-300`}
      >
        {/* Remove Button */}
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

        {/* Toggle Popular */}
        {mode === 'edit' && onTogglePopular && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePopular();
            }}
            className={`absolute top-2 left-2 p-1.5 rounded-full ${tier.is_popular ? 'bg-yellow-400' : 'bg-gray-200'} hover:bg-yellow-300 transition-all duration-200 z-30`}
            title={tier.is_popular ? 'Remove highlight' : 'Set as highlighted'}
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
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text font-bold text-xl ${cardStyles.textHeading}`}
              data-section-id={sectionId}
              data-element-key={`tiers.${tier.id}.name`}
            >
              {tier.name}
            </div>
          ) : (
            <h3 className={`font-bold text-xl ${cardStyles.textHeading}`}>{tier.name}</h3>
          )}
        </div>

        {/* Price Display */}
        <div className="text-center mb-4">
          {mode !== 'preview' ? (
            <div className="space-y-2">
              <div className={`text-sm ${cardStyles.textMuted}`}>Monthly:</div>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTierUpdate('monthly_price', e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text text-2xl font-bold ${cardStyles.textHeading}`}
                data-section-id={sectionId}
                data-element-key={`tiers.${tier.id}.monthly_price`}
              >
                {tier.monthly_price}
              </div>
              <div className={`text-sm ${cardStyles.textMuted}`}>Yearly:</div>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTierUpdate('yearly_price', e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text text-2xl font-bold ${cardStyles.textHeading}`}
                data-section-id={sectionId}
                data-element-key={`tiers.${tier.id}.yearly_price`}
              >
                {tier.yearly_price}
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-center">
              <span style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)' }} className={`font-bold ${cardStyles.textHeading}`}>
                {currentPrice}
              </span>
              {!currentPrice.toLowerCase().includes('contact') && (
                <span className={`${cardStyles.textMuted} ml-1`}>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              )}
            </div>
          )}

          {mode === 'preview' && billingCycle === 'yearly' && !currentPrice.toLowerCase().includes('contact') && (
            <div className={`text-sm ${cardStyles.textMuted} mt-1`}>
              ${Math.round(parseFloat(currentPrice.replace(/[^0-9.]/g, '')) / 12)}/month billed annually
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTierUpdate('description', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text ${cardStyles.textBody}`}
              data-section-id={sectionId}
              data-element-key={`tiers.${tier.id}.description`}
            >
              {tier.description}
            </div>
          ) : (
            <p className={cardStyles.textBody}>{tier.description}</p>
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
                        className={cardStyles.textBody}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    <span className={cardStyles.textBody}>{feature}</span>
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
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTierUpdate('cta_text', e.currentTarget.textContent || '')}
              className={`text-center font-medium py-3 px-6 rounded-lg ${tier.is_popular ? (isHexColor(colorTokens.ctaBg) ? '' : colorTokens.ctaBg) + ' text-white' : `${cardStyles.bg} ${cardStyles.textHeading}`} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-text`}
              style={tier.is_popular && isHexColor(colorTokens.ctaBg) ? { backgroundColor: colorTokens.ctaBg } : undefined}
              data-section-id={sectionId}
              data-element-key={`tiers.${tier.id}.cta_text`}
            >
              {tier.cta_text}
            </div>
          ) : (
            <CTAButton
              text={tier.cta_text}
              colorTokens={colorTokens}
              className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant={tier.is_popular ? 'primary' : 'secondary'}
              sectionId={sectionId}
              elementKey={`tiers.${tier.id}.cta_text`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function ToggleableMonthlyYearly(props: ToggleableMonthlyYearlyProps) {
  const { sectionId, mode, blockContent, colorTokens, sectionBackground, backgroundType, handleContentUpdate } =
    useLayoutComponent<ToggleableMonthlyYearlyContent>({
      ...props,
      contentSchema: CONTENT_SCHEMA,
    });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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

  // Get base card styles (non-highlighted) for toggle area and shared text
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // Get theme-specific accent colors
  const pricingAccents = getPricingAccents(uiBlockTheme);

  // Get tiers
  const tiers: Tier[] = blockContent.tiers || CONTENT_SCHEMA.tiers.default;

  // --- Tier Handlers ---
  const handleTierUpdate = (tierId: string, field: keyof Tier, value: any) => {
    const updated = tiers.map((t) => (t.id === tierId ? { ...t, [field]: value } : t));
    handleContentUpdate('tiers', JSON.stringify(updated));
  };

  const handleAddTier = () => {
    if (tiers.length >= 4) return;
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      name: 'New Plan',
      monthly_price: '$49',
      yearly_price: '$490',
      description: 'Description for this plan',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      cta_text: 'Get Started',
      is_popular: false,
    };
    handleContentUpdate('tiers', JSON.stringify([...tiers, newTier]));
  };

  const handleRemoveTier = (tierId: string) => {
    if (tiers.length <= 2) return;
    handleContentUpdate('tiers', JSON.stringify(tiers.filter((t) => t.id !== tierId)));
  };

  const handleTogglePopular = (tierId: string) => {
    const updated = tiers.map((t) => ({
      ...t,
      is_popular: t.id === tierId ? !t.is_popular : t.is_popular,
    }));
    handleContentUpdate('tiers', JSON.stringify(updated));
  };

  // --- Feature Handlers (within tiers) ---
  const handleAddFeature = (tierId: string) => {
    const updated = tiers.map((t) => {
      if (t.id === tierId && t.features.length < 8) {
        return { ...t, features: [...t.features, 'New feature'] };
      }
      return t;
    });
    handleContentUpdate('tiers', JSON.stringify(updated));
  };

  const handleRemoveFeature = (tierId: string, featureIndex: number) => {
    const updated = tiers.map((t) => {
      if (t.id === tierId) {
        return { ...t, features: t.features.filter((_, i) => i !== featureIndex) };
      }
      return t;
    });
    handleContentUpdate('tiers', JSON.stringify(updated));
  };

  const handleEditFeature = (tierId: string, featureIndex: number, value: string) => {
    const updated = tiers.map((t) => {
      if (t.id === tierId) {
        return { ...t, features: t.features.map((f, i) => (i === featureIndex ? value : f)) };
      }
      return t;
    });
    handleContentUpdate('tiers', JSON.stringify(updated));
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
      sectionType="ToggleableMonthlyYearly"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
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
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 text-lg ${colorTokens.textSecondary} mb-8`}
                data-section-id={sectionId}
                data-element-key="subheadline"
                data-placeholder="Add subheadline..."
              >
                {blockContent.subheadline || ''}
              </div>
            ) : blockContent.subheadline ? (
              <p className={`text-lg ${colorTokens.textSecondary} mb-8`}>{blockContent.subheadline}</p>
            ) : null
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className={`${cardStyles.bg} ${cardStyles.blur} rounded-full p-1 flex`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? `${cardStyles.bg} ${cardStyles.textHeading} shadow-md`
                    : `${cardStyles.textMuted}`
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? `${cardStyles.bg} ${cardStyles.textHeading} shadow-md`
                    : `${cardStyles.textMuted}`
                }`}
              >
                Yearly
              </button>
            </div>

            {blockContent.annual_discount_label && billingCycle === 'yearly' && (
              <div
                className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${colorTokens.ctaGhostHover} ${colorTokens.ctaGhost}`}
              >
                {blockContent.annual_discount_label}
              </div>
            )}
          </div>
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
              billingCycle={billingCycle}
              onTierUpdate={(field, value) => handleTierUpdate(tier.id, field, value)}
              onRemove={() => handleRemoveTier(tier.id)}
              showRemoveButton={tiers.length > 2}
              onAddFeature={() => handleAddFeature(tier.id)}
              onRemoveFeature={(featureIndex) => handleRemoveFeature(tier.id, featureIndex)}
              onEditFeature={(featureIndex, value) => handleEditFeature(tier.id, featureIndex, value)}
              onTogglePopular={() => handleTogglePopular(tier.id)}
              colorTokens={colorTokens}
              cardStyles={getCardStylesForTier(tier.is_popular)}
              pricingAccents={pricingAccents}
            />
          ))}
        </div>

        {/* Billing Note */}
        {(blockContent.billing_note || mode === 'edit') && (
          <div className="text-center mt-8">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleContentUpdate('billing_note', e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 text-sm ${colorTokens.textSecondary}`}
                data-section-id={sectionId}
                data-element-key="billing_note"
                data-placeholder="Add billing note..."
              >
                {blockContent.billing_note || ''}
              </div>
            ) : blockContent.billing_note ? (
              <p className={`text-sm ${colorTokens.textSecondary}`}>{blockContent.billing_note}</p>
            ) : null}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'ToggleableMonthlyYearly',
  category: 'Pricing',
  description: 'Monthly/yearly toggle pricing with automatic savings calculation',
  tags: ['pricing', 'toggle', 'subscription', 'annual', 'discount'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  features: [
    'Monthly/yearly billing toggle',
    'Automatic savings calculation',
    'Popular plan highlighting',
    'Feature comparison lists',
    'Responsive pricing cards (2-4 tiers)',
  ],
  contentSchema: {
    headline: 'Main heading text',
    subheadline: 'Optional subheading text',
    annual_discount_label: 'Label showing annual discount',
    billing_note: 'Note about billing/trials',
    tiers: 'Array of tier objects with name, monthly_price, yearly_price, description, features[], cta_text, is_popular',
  },
};
