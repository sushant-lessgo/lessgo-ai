// components/layout/UserCountBar.tsx
// User statistics and growth metrics - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { SocialProofNumber } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface UserCountBarContent {
  headline: string;
  subheadline?: string;
  user_metrics: string;
  metric_labels: string;
  growth_indicators?: string;
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
  dynamicTextColors,
  getTextStyle 
}: { 
  metric: UserMetric;
  dynamicTextColors: any;
  getTextStyle: any;
}) => {
  
  return (
    <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="space-y-2">
        <SocialProofNumber
          number={metric.value}
          label=""
          className={`font-bold ${dynamicTextColors?.heading || 'text-gray-900'}`}
          style={{...getTextStyle('h1'), fontSize: 'clamp(2rem, 4vw, 3rem)'}}
        />
        
        {metric.growth && (
          <div className="flex items-center justify-center space-x-1">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-green-500 text-sm font-medium">
              {metric.growth}
            </span>
          </div>
        )}
        
        <p className={`text-sm font-medium ${dynamicTextColors?.muted || 'text-gray-600'}`}>
          {metric.label}
        </p>
      </div>
    </div>
  );
});
MetricDisplay.displayName = 'MetricDisplay';

// User Avatar Component
const UserAvatarGroup = React.memo(({ 
  dynamicTextColors 
}: { 
  dynamicTextColors: any;
}) => {
  const avatars = [
    { id: 1, color: 'from-blue-400 to-blue-600' },
    { id: 2, color: 'from-green-400 to-green-600' },
    { id: 3, color: 'from-purple-400 to-purple-600' },
    { id: 4, color: 'from-pink-400 to-pink-600' },
    { id: 5, color: 'from-yellow-400 to-yellow-600' }
  ];

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <div className="flex -space-x-2">
        {avatars.map((avatar) => (
          <div 
            key={avatar.id}
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.color} border-3 border-white shadow-lg flex items-center justify-center`}
          >
            <span className="text-white font-bold text-sm">
              {String.fromCharCode(64 + avatar.id)}
            </span>
          </div>
        ))}
      </div>
      <div className="text-left">
        <p className={`text-sm font-medium ${dynamicTextColors?.body || 'text-gray-700'}`}>
          +1,000 joined this week
        </p>
        <div className="flex items-center space-x-1">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'} ml-2`}>
            4.9/5 rating
          </span>
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

  // Parse metrics from pipe-separated strings
  const userMetrics = parseMetricData(
    blockContent.user_metrics || '',
    blockContent.metric_labels || '',
    blockContent.growth_indicators
  );

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
          <UserAvatarGroup dynamicTextColors={dynamicTextColors} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {userMetrics.slice(0, 4).map((metric) => (
            <MetricDisplay
              key={metric.id}
              metric={metric}
              dynamicTextColors={dynamicTextColors}
              getTextStyle={getTextStyle}
            />
          ))}
        </div>

        {/* Trust Indicators Bar */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Free 14-day trial
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Enterprise-grade security
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              24/7 customer support
            </span>
          </div>
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
    { key: 'growth_indicators', label: 'Growth Indicators (pipe separated)', type: 'text', required: false }
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