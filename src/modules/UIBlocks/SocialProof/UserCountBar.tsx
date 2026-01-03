// components/layout/UserCountBar.tsx
// User statistics and growth metrics - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { SocialProofNumber } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import {
  parsePipeData,
  updateListData,
  parseCustomerAvatarData,
  updateAvatarUrls
} from '@/utils/dataParsingUtils';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';

// Content interface for type safety
interface UserCountBarContent {
  headline: string;
  subheadline?: string;
  user_metrics: string;
  metric_labels: string;
  growth_indicators?: string;
  // User avatar group fields
  users_joined_text?: string;
  rating_value?: string;
  rating_text?: string;
  // Trust indicator fields
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  // Dynamic avatar system
  customer_names?: string;
  avatar_urls?: string;
}

// Metric structure
interface UserMetric {
  id: string;
  index: number;
  value: string;
  label: string;
  growth?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Join Over 50,000+ Happy Users' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Trusted by professionals worldwide to streamline their workflow and boost productivity.' 
  },
  user_metrics: { 
    type: 'string' as const, 
    default: '50,000+|2.5M+|99.9%|4.8/5' 
  },
  metric_labels: { 
    type: 'string' as const, 
    default: 'Active Users|Tasks Completed|Uptime|User Rating' 
  },
  growth_indicators: { 
    type: 'string' as const, 
    default: '+25%|+180%|+0.1%|+0.2' 
  },
  // User avatar group fields
  users_joined_text: { 
    type: 'string' as const, 
    default: '+1,000 joined this week' 
  },
  rating_value: { 
    type: 'string' as const, 
    default: '4.9/5' 
  },
  rating_text: { 
    type: 'string' as const, 
    default: 'rating' 
  },
  // Trust indicator fields
  trust_item_1: { 
    type: 'string' as const, 
    default: 'Free 14-day trial' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'Enterprise-grade security' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: '24/7 customer support' 
  },
  // Dynamic avatar system
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Alex Rivera|Jordan Kim|Maya Patel|Sam Wilson' 
  },
  avatar_urls: { 
    type: 'string' as const, 
    default: '{}' 
  }
};

// Parse metric data from pipe-separated strings
const parseMetricData = (metrics: string, labels: string, growth?: string): UserMetric[] => {
  const metricList = parsePipeData(metrics);
  const labelList = parsePipeData(labels);
  const growthList = growth ? parsePipeData(growth) : [];
  
  return metricList.map((value, index) => ({
    id: `metric-${index}`,
    index,
    value: value.trim(),
    label: labelList[index]?.trim() || `Metric ${index + 1}`,
    growth: growthList[index]?.trim()
  }));
};

// Metric Display Component
const MetricDisplay = React.memo(({
  metric,
  mode,
  dynamicTextColors,
  getTextStyle,
  colorTokens,
  onMetricEdit,
  onLabelEdit,
  onGrowthEdit,
  sectionId,
  backgroundType,
  sectionBackground,
  colors
}: {
  metric: UserMetric;
  mode: 'edit' | 'preview';
  dynamicTextColors: any;
  getTextStyle: any;
  colorTokens: any;
  onMetricEdit: (index: number, value: string) => void;
  onLabelEdit: (index: number, value: string) => void;
  onGrowthEdit: (index: number, value: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  colors: {
    cardBorder: string;
    growthColor: string;
    starColor: string;
    trustCheckColor: string;
    addButtonColor: string;
    addButtonHover: string;
  };
}) => {

  return (
    <div
      className="text-center p-6 rounded-xl backdrop-blur-sm border hover:bg-white/10 transition-all duration-300"
      style={{ borderColor: colors.cardBorder, background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="space-y-2">
        {mode === 'edit' ? (
          <EditableAdaptiveText
            mode={mode}
            value={metric.value}
            onEdit={(value) => onMetricEdit(metric.index, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...getTextStyle('h2'),
              fontWeight: 700,
              fontSize: '1.875rem',
              lineHeight: '2.25rem'
            }}
            className="text-center"
            placeholder="50,000+"
            sectionId={sectionId}
            elementKey={`metric_value_${metric.index}`}
            sectionBackground={sectionBackground}
          />
        ) : (
          <SocialProofNumber
            number={metric.value}
            label=""
            className={`font-bold text-3xl ${dynamicTextColors?.heading || 'text-gray-900'}`}
          />
        )}
        
        {(metric.growth || mode === 'edit') && (
          <div className="flex items-center justify-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.growthColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <EditableAdaptiveText
              mode={mode}
              value={metric.growth || ''}
              onEdit={(value) => onGrowthEdit(metric.index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm font-medium"
              style={{ color: colors.growthColor }}
              placeholder="+25%"
              sectionId={sectionId}
              elementKey={`metric_growth_${metric.index}`}
              sectionBackground={sectionBackground}
            />
          </div>
        )}
        
        <EditableAdaptiveText
          mode={mode}
          value={metric.label}
          onEdit={(value) => onLabelEdit(metric.index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="text-sm font-medium"
          placeholder="Metric Label"
          sectionId={sectionId}
          elementKey={`metric_label_${metric.index}`}
          sectionBackground={sectionBackground}
        />
      </div>
    </div>
  );
});
MetricDisplay.displayName = 'MetricDisplay';

// User Avatar Component
const UserAvatarGroup = React.memo(({
  mode,
  dynamicTextColors,
  colorTokens,
  blockContent,
  handleContentUpdate,
  sectionId,
  backgroundType,
  sectionBackground,
  colors
}: {
  mode: 'edit' | 'preview';
  dynamicTextColors: any;
  colorTokens: any;
  blockContent: UserCountBarContent;
  handleContentUpdate: (key: string, value: any) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  colors: {
    cardBorder: string;
    growthColor: string;
    starColor: string;
    trustCheckColor: string;
    addButtonColor: string;
    addButtonHover: string;
  };
}) => {
  // Parse customer avatars from dynamic system
  const getCustomerAvatars = (): { name: string; avatarUrl: string }[] => {
    if (blockContent.customer_names) {
      const customerData = parseCustomerAvatarData(
        blockContent.customer_names, 
        blockContent.avatar_urls || '{}'
      );
      return customerData.slice(0, 5).map(customer => ({
        name: customer.name,
        avatarUrl: customer.avatarUrl || ''
      }));
    }
    // Fallback to default names
    const defaultNames = ['Sarah Chen', 'Alex Rivera', 'Jordan Kim', 'Maya Patel', 'Sam Wilson'];
    return defaultNames.map(name => ({
      name,
      avatarUrl: ''
    }));
  };

  const customerAvatars = getCustomerAvatars();

  // Handle avatar URL updates
  const handleAvatarChange = (customerName: string, avatarUrl: string) => {
    const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls || '{}', customerName, avatarUrl);
    handleContentUpdate('avatar_urls', updatedAvatarUrls);
  };

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <div className="flex -space-x-2">
        {customerAvatars.map((customer) => (
          <AvatarEditableComponent
            key={customer.name}
            mode={mode}
            avatarUrl={customer.avatarUrl}
            onAvatarChange={(url) => handleAvatarChange(customer.name, url)}
            customerName={customer.name}
            size="md"
            className="cursor-default"
          />
        ))}
      </div>
      <div className="text-left">
        <EditableAdaptiveText
          mode={mode}
          value={blockContent.users_joined_text || ''}
          onEdit={(value) => handleContentUpdate('users_joined_text', value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="text-sm font-medium"
          placeholder="+1,000 joined this week"
          sectionId={sectionId}
          elementKey="users_joined_text"
          sectionBackground={sectionBackground}
        />
        <div className="flex items-center space-x-1">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20" style={{ color: colors.starColor }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <div className="flex items-center space-x-1 ml-2">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.rating_value || ''}
              onEdit={(value) => handleContentUpdate('rating_value', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm"
              placeholder="4.9/5"
              sectionId={sectionId}
              elementKey="rating_value"
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.rating_text || ''}
              onEdit={(value) => handleContentUpdate('rating_text', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm"
              placeholder="rating"
              sectionId={sectionId}
              elementKey="rating_text"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
UserAvatarGroup.displayName = 'UserAvatarGroup';

export default function UserCountBar(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<UserCountBarContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h1Style = getTypographyStyle('h1');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based colors for cards, borders, and icons
  const getUserCountBarColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',
        growthColor: '#ea580c',
        starColor: '#f59e0b',
        trustCheckColor: '#ea580c',
        addButtonColor: '#ea580c',
        addButtonHover: '#c2410c'
      },
      cool: {
        cardBorder: '#bfdbfe',
        growthColor: '#2563eb',
        starColor: '#3b82f6',
        trustCheckColor: '#2563eb',
        addButtonColor: '#2563eb',
        addButtonHover: '#1d4ed8'
      },
      neutral: {
        cardBorder: '#e5e7eb',
        growthColor: '#10b981',
        starColor: '#fbbf24',
        trustCheckColor: '#10b981',
        addButtonColor: '#3b82f6',
        addButtonHover: '#2563eb'
      }
    }[theme];
  };

  const colors = getUserCountBarColors(theme);

  // Parse metrics from pipe-separated strings
  const userMetrics = parseMetricData(
    blockContent.user_metrics || '',
    blockContent.metric_labels || '',
    blockContent.growth_indicators
  );

  // Handle metric editing
  const handleMetricEdit = (index: number, value: string) => {
    const updatedMetrics = updateListData(blockContent.user_metrics, index, value);
    handleContentUpdate('user_metrics', updatedMetrics);
  };

  const handleLabelEdit = (index: number, value: string) => {
    const updatedLabels = updateListData(blockContent.metric_labels, index, value);
    handleContentUpdate('metric_labels', updatedLabels);
  };

  const handleGrowthEdit = (index: number, value: string) => {
    const updatedGrowth = updateListData(blockContent.growth_indicators || '', index, value);
    handleContentUpdate('growth_indicators', updatedGrowth);
  };

  // Get trust items
  const getTrustItems = (): string[] => {
    const items = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    return items;
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="UserCountBar"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
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
              className="max-w-3xl mx-auto mb-8"
              style={bodyLgStyle}
              placeholder="Add a compelling subheadline about your user growth..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* User Avatar Group */}
          <UserAvatarGroup
            mode={mode}
            dynamicTextColors={dynamicTextColors}
            colorTokens={colorTokens}
            blockContent={blockContent}
            handleContentUpdate={handleContentUpdate}
            sectionId={sectionId}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            sectionBackground={sectionBackground}
            colors={colors}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {userMetrics.slice(0, 4).map((metric) => (
            <MetricDisplay
              key={metric.id}
              metric={metric}
              mode={mode}
              dynamicTextColors={dynamicTextColors}
              getTextStyle={getTextStyle}
              colorTokens={colorTokens}
              onMetricEdit={handleMetricEdit}
              onLabelEdit={handleLabelEdit}
              onGrowthEdit={handleGrowthEdit}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              sectionBackground={sectionBackground}
              colors={colors}
            />
          ))}
        </div>

        {/* Trust Indicators Bar */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/10">
          {getTrustItems().map((item, index) => (
            <div key={index} className="flex items-center space-x-2 group/trust-item relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.trustCheckColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={item}
                onEdit={(value) => {
                  const fieldKey = `trust_item_${index + 1}` as keyof UserCountBarContent;
                  handleContentUpdate(fieldKey, value);
                }}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary') as any}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm"
                placeholder="Trust indicator"
                sectionId={sectionId}
                elementKey={`trust_item_${index + 1}`}
                sectionBackground={sectionBackground}
              />
              
              {/* Remove button */}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const fieldKey = `trust_item_${index + 1}` as keyof UserCountBarContent;
                    handleContentUpdate(fieldKey, '___REMOVED___');
                  }}
                  className="opacity-0 group-hover/trust-item:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 absolute -right-6 top-1/2 -translate-y-1/2 shadow-sm"
                  title="Remove trust item"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {/* Add trust item button */}
          {mode === 'edit' && getTrustItems().length < 3 && (
            <button
              onClick={() => {
                const emptyIndex = [
                  blockContent.trust_item_1,
                  blockContent.trust_item_2,
                  blockContent.trust_item_3
                ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');

                if (emptyIndex !== -1) {
                  const fieldKey = `trust_item_${emptyIndex + 1}` as keyof UserCountBarContent;
                  handleContentUpdate(fieldKey, 'New trust item');
                }
              }}
              className="flex items-center space-x-1 text-sm transition-colors"
              style={{ color: colors.addButtonColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.addButtonHover}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.addButtonColor}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add trust item</span>
            </button>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'UserCountBar',
  category: 'Social Proof',
  description: 'User statistics and growth metrics display with visual indicators and trust elements',
  tags: ['social-proof', 'metrics', 'users', 'growth', 'statistics'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'user_metrics', label: 'User Metrics (pipe separated)', type: 'text', required: true },
    { key: 'metric_labels', label: 'Metric Labels (pipe separated)', type: 'text', required: true },
    { key: 'growth_indicators', label: 'Growth Indicators (pipe separated)', type: 'text', required: false },
    { key: 'users_joined_text', label: 'Users Joined Text', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating Value', type: 'text', required: false },
    { key: 'rating_text', label: 'Rating Text', type: 'text', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: false },
    { key: 'avatar_urls', label: 'Avatar URLs (JSON)', type: 'text', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Animated metric displays with growth indicators',
    'User avatar groups with ratings',
    'Trust indicator bar with icons',
    'Responsive grid layout for metrics'
  ],
  
  useCases: [
    'SaaS user growth showcase',
    'App download statistics',
    'Community size display',
    'Performance metrics highlight',
    'User acquisition social proof'
  ]
};