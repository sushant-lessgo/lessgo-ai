import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface StatComparisonContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_stats: string;
  after_stats: string;
  improvement_text: string;
  summary_title: string;
  summary_stat_1_value: string;
  summary_stat_1_label: string;
  summary_stat_2_value: string;
  summary_stat_2_label: string;
  summary_stat_3_value: string;
  summary_stat_3_label: string;
  show_summary_section?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Quantifiable Business Impact' 
  },
  before_label: { 
    type: 'string' as const, 
    default: 'Before Implementation' 
  },
  after_label: { 
    type: 'string' as const, 
    default: 'After Optimization' 
  },
  before_stats: { 
    type: 'string' as const, 
    default: '45%|Manual Processing|$125K|Annual Costs|8 hours|Daily Operations|15%|Error Rate' 
  },
  after_stats: { 
    type: 'string' as const, 
    default: '95%|Automated Processing|$45K|Annual Costs|2 hours|Daily Operations|0.5%|Error Rate' 
  },
  improvement_text: { 
    type: 'string' as const, 
    default: 'Our clients typically see 300% ROI within the first 6 months of implementation.' 
  },
  summary_title: {
    type: 'string' as const,
    default: 'Key Performance Improvements'
  },
  summary_stat_1_value: {
    type: 'string' as const,
    default: '300%'
  },
  summary_stat_1_label: {
    type: 'string' as const,
    default: 'Efficiency Increase'
  },
  summary_stat_2_value: {
    type: 'string' as const,
    default: '$80K'
  },
  summary_stat_2_label: {
    type: 'string' as const,
    default: 'Annual Savings'
  },
  summary_stat_3_value: {
    type: 'string' as const,
    default: '75%'
  },
  summary_stat_3_label: {
    type: 'string' as const,
    default: 'Time Reduction'
  },
  show_summary_section: {
    type: 'string' as const,
    default: 'true'
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  }
};

const StatCard = React.memo(({ 
  value, 
  label, 
  type, 
  index,
  valueStyle
}: { 
  value: string; 
  label: string; 
  type: 'before' | 'after';
  index: number;
  valueStyle: React.CSSProperties;
}) => {
  const isImprovement = type === 'after';
  
  return (
    <div className={`relative bg-white rounded-xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      isImprovement 
        ? 'border-green-200 ring-2 ring-green-100' 
        : 'border-red-200'
    }`}>
      
      {isImprovement && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
      
      <div className="text-center space-y-3">
        <div 
          className={isImprovement ? 'text-green-600' : 'text-red-600'}
          style={valueStyle}
        >
          {value}
        </div>
        
        <div className="text-gray-600 font-medium text-sm leading-tight">
          {label}
        </div>
        
        <div className={`h-1 w-full rounded-full ${
          isImprovement 
            ? 'bg-gradient-to-r from-green-400 to-green-600' 
            : 'bg-gradient-to-r from-red-400 to-red-600'
        }`} />
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

export default function StatComparison(props: LayoutComponentProps) {
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
  } = useLayoutComponent<StatComparisonContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles using landingTypography system
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  
  // Parse stats from pipe-separated format: value|label|value|label...
  const parseStats = (statsString: string) => {
    const parts = statsString.split('|').map(part => part.trim());
    const stats = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i] && parts[i + 1]) {
        stats.push({
          value: parts[i],
          label: parts[i + 1]
        });
      }
    }
    return stats;
  };

  const beforeStats = parseStats(blockContent.before_stats || '');
  const afterStats = parseStats(blockContent.after_stats || '');

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StatComparison"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
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

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your metrics comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center mb-6">
                <div className="w-3 h-3 rounded-full mr-3 bg-red-500 ring-4 ring-red-100" />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_label || ''}
                  onEdit={(value) => handleContentUpdate('before_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('h3'),
                    fontWeight: 600,
                    color: '#ef4444'
                  }}
                  className="text-red-500 text-xl"
                  sectionId={sectionId}
                  elementKey="before_label"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_stats || ''}
                  onEdit={(value) => handleContentUpdate('before_stats', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed"
                  placeholder="Enter before stats as: value|label|value|label..."
                  sectionId={sectionId}
                  elementKey="before_stats"
                  sectionBackground={sectionBackground}
                />
              ) : (
                beforeStats.map((stat, index) => (
                  <StatCard
                    key={index}
                    value={stat.value}
                    label={stat.label}
                    type="before"
                    index={index}
                    valueStyle={{
                      fontSize: h2Style.fontSize,
                      fontWeight: h2Style.fontWeight,
                      lineHeight: h2Style.lineHeight,
                      letterSpacing: h2Style.letterSpacing,
                      fontFamily: h2Style.fontFamily
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center mb-6">
                <div className="w-3 h-3 rounded-full mr-3 bg-green-500 ring-4 ring-green-100" />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_label || ''}
                  onEdit={(value) => handleContentUpdate('after_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('h3'),
                    fontWeight: 600,
                    color: '#10b981'
                  }}
                  className="text-green-500 text-xl"
                  sectionId={sectionId}
                  elementKey="after_label"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_stats || ''}
                  onEdit={(value) => handleContentUpdate('after_stats', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="leading-relaxed"
                  placeholder="Enter after stats as: value|label|value|label..."
                  sectionId={sectionId}
                  elementKey="after_stats"
                  sectionBackground={sectionBackground}
                />
              ) : (
                afterStats.map((stat, index) => (
                  <StatCard
                    key={index}
                    value={stat.value}
                    label={stat.label}
                    type="after"
                    index={index}
                    valueStyle={{
                      fontSize: h2Style.fontSize,
                      fontWeight: h2Style.fontWeight,
                      lineHeight: h2Style.lineHeight,
                      letterSpacing: h2Style.letterSpacing,
                      fontFamily: h2Style.fontFamily
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-12">
          <div className="text-center space-y-6">
            
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div 
                  className="text-red-600 mb-2"
                  style={{
                    fontSize: h3Style.fontSize,
                    fontWeight: h3Style.fontWeight,
                    lineHeight: h3Style.lineHeight,
                    letterSpacing: h3Style.letterSpacing,
                    fontFamily: h3Style.fontFamily
                  }}
                >BEFORE</div>
                <div className="w-16 h-1 bg-red-500 rounded-full mx-auto" />
              </div>
              
              <div className="flex items-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              
              <div className="text-center">
                <div 
                  className="text-green-600 mb-2"
                  style={{
                    fontSize: h3Style.fontSize,
                    fontWeight: h3Style.fontWeight,
                    lineHeight: h3Style.lineHeight,
                    letterSpacing: h3Style.letterSpacing,
                    fontFamily: h3Style.fontFamily
                  }}
                >AFTER</div>
                <div className="w-16 h-1 bg-green-500 rounded-full mx-auto" />
              </div>
            </div>
            
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.improvement_text || ''}
              onEdit={(value) => handleContentUpdate('improvement_text', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg font-medium max-w-2xl mx-auto"
              sectionId={sectionId}
              elementKey="improvement_text"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {(blockContent.show_summary_section !== 'false') && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12 relative group/summary-section">
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.summary_title || ''}
                onEdit={(value) => handleContentUpdate('summary_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  lineHeight: '2rem'
                }}
                className="text-2xl font-bold text-gray-900 mb-6"
                sectionId={sectionId}
                elementKey="summary_title"
                sectionBackground={sectionBackground}
              />
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Stat 1 */}
                {(blockContent.summary_stat_1_value && blockContent.summary_stat_1_value !== '___REMOVED___') && (
                  <div className="text-center relative group/stat-1">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_1_value || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_1_value', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      textStyle={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#059669'
                      }}
                      className="text-2xl font-bold text-green-600 mb-2"
                      sectionId={sectionId}
                      elementKey="summary_stat_1_value"
                      sectionBackground={sectionBackground}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_1_label || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_1_label', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      sectionId={sectionId}
                      elementKey="summary_stat_1_label"
                      sectionBackground={sectionBackground}
                    />
                    
                    {/* Remove button */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_stat_1_value', '___REMOVED___');
                          handleContentUpdate('summary_stat_1_label', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/stat-1:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove stat 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Stat 2 */}
                {(blockContent.summary_stat_2_value && blockContent.summary_stat_2_value !== '___REMOVED___') && (
                  <div className="text-center relative group/stat-2">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_2_value || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_2_value', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      textStyle={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#2563eb'
                      }}
                      className="text-2xl font-bold text-blue-600 mb-2"
                      sectionId={sectionId}
                      elementKey="summary_stat_2_value"
                      sectionBackground={sectionBackground}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_2_label || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_2_label', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      sectionId={sectionId}
                      elementKey="summary_stat_2_label"
                      sectionBackground={sectionBackground}
                    />
                    
                    {/* Remove button */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_stat_2_value', '___REMOVED___');
                          handleContentUpdate('summary_stat_2_label', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/stat-2:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove stat 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Stat 3 */}
                {(blockContent.summary_stat_3_value && blockContent.summary_stat_3_value !== '___REMOVED___') && (
                  <div className="text-center relative group/stat-3">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_3_value || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_3_value', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      textStyle={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#7c3aed'
                      }}
                      className="text-2xl font-bold text-purple-600 mb-2"
                      sectionId={sectionId}
                      elementKey="summary_stat_3_value"
                      sectionBackground={sectionBackground}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_3_label || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_3_label', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      sectionId={sectionId}
                      elementKey="summary_stat_3_label"
                      sectionBackground={sectionBackground}
                    />
                    
                    {/* Remove button */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('summary_stat_3_value', '___REMOVED___');
                          handleContentUpdate('summary_stat_3_label', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/stat-3:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove stat 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Remove entire summary section button */}
            {mode === 'edit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('show_summary_section', 'false');
                }}
                className="opacity-0 group-hover/summary-section:opacity-100 absolute top-4 right-4 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                title="Remove summary section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Add summary section back button */}
        {mode === 'edit' && blockContent.show_summary_section === 'false' && (
          <div className="mb-12 text-center">
            <button
              onClick={() => handleContentUpdate('show_summary_section', 'true')}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add summary section</span>
            </button>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your quantifiable results..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-green-500"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StatComparison',
  category: 'Comparison',
  description: 'Numbers/metrics-focused comparison layout. Perfect for enterprise audiences and data-driven decisions.',
  tags: ['comparison', 'statistics', 'metrics', 'enterprise', 'data-driven'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_stats', label: 'Before Stats (value|label|value|label...)', type: 'textarea', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_stats', label: 'After Stats (value|label|value|label...)', type: 'textarea', required: true },
    { key: 'improvement_text', label: 'Improvement Summary', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Data-driven comparison with clear metrics',
    'Statistical cards with visual indicators',
    'ROI and performance improvement highlights',
    'Perfect for enterprise decision makers',
    'Quantifiable results presentation',
    'Professional business-focused design'
  ],
  
  useCases: [
    'Enterprise ROI demonstrations',
    'Business efficiency improvements',
    'Cost reduction showcases',
    'Performance optimization results',
    'Data-driven transformation proof'
  ]
};