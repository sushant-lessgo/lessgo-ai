import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';

interface ValueReinforcementBlockContent {
  headline: string;
  primary_value: string;
  value_points: string;
  value_icons?: string;
  transformation_before: string;
  transformation_after: string;
  social_proof_stats: string;
  social_proof_labels: string;
  cta_text: string;
  urgency_text?: string;
  risk_reversal?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  stat_1?: string;
  stat_2?: string;
  stat_3?: string;
  stat_4?: string;
  label_1?: string;
  label_2?: string;
  label_3?: string;
  label_4?: string;
  transformation_title?: string;
  transformation_description?: string;
  social_proof_title?: string;
  final_cta_title?: string;
  trending_up_icon?: string;
  dollar_sign_icon?: string;
  automation_icon?: string;
  users_icon?: string;
  chart_bar_icon?: string;
  integration_icon?: string;
  before_cross_icon?: string;
  after_check_icon?: string;
  arrow_icon?: string;
  urgency_clock_icon?: string;
  guarantee_shield_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Transform Your Business Today' 
  },
  primary_value: { 
    type: 'string' as const, 
    default: 'Join thousands of businesses who have already transformed their operations and achieved unprecedented growth with our proven solution.' 
  },
  value_points: { 
    type: 'string' as const, 
    default: 'Increase productivity by up to 300%|Reduce operational costs by 40%|Automate 80% of repetitive tasks|Scale without hiring additional staff|Get real-time insights and analytics|Integrate with your existing tools seamlessly' 
  },
  value_icons: { 
    type: 'string' as const, 
    default: 'trending-up|dollar-sign|automation|users|chart-bar|integration' 
  },
  transformation_before: { 
    type: 'string' as const, 
    default: 'Manual processes taking hours|Scattered data across multiple systems|Difficulty tracking performance|Limited team collaboration|Reactive decision making' 
  },
  transformation_after: { 
    type: 'string' as const, 
    default: 'Automated workflows saving time|Centralized data and insights|Real-time performance tracking|Seamless team collaboration|Data-driven strategic decisions' 
  },
  social_proof_stats: { 
    type: 'string' as const, 
    default: '50,000+|99.9%|40%|24/7' 
  },
  social_proof_labels: { 
    type: 'string' as const, 
    default: 'Satisfied customers|Uptime guarantee|Average cost reduction|Expert support' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Transformation' 
  },
  urgency_text: { 
    type: 'string' as const, 
    default: 'Limited time: Get 3 months free when you start today' 
  },
  risk_reversal: { 
    type: 'string' as const, 
    default: '60-day money-back guarantee. No questions asked.' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: '60-day money-back guarantee' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'Free setup and onboarding' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: '24/7 customer support' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  stat_1: { 
    type: 'string' as const, 
    default: '50,000+' 
  },
  stat_2: { 
    type: 'string' as const, 
    default: '99.9%' 
  },
  stat_3: { 
    type: 'string' as const, 
    default: '40%' 
  },
  stat_4: { 
    type: 'string' as const, 
    default: '24/7' 
  },
  label_1: { 
    type: 'string' as const, 
    default: 'Satisfied customers' 
  },
  label_2: { 
    type: 'string' as const, 
    default: 'Uptime guarantee' 
  },
  label_3: { 
    type: 'string' as const, 
    default: 'Average cost reduction' 
  },
  label_4: { 
    type: 'string' as const, 
    default: 'Expert support' 
  },
  transformation_title: { 
    type: 'string' as const, 
    default: 'See the Transformation' 
  },
  transformation_description: { 
    type: 'string' as const, 
    default: 'Watch how businesses like yours have transformed their operations' 
  },
  social_proof_title: { 
    type: 'string' as const, 
    default: 'Trusted by Businesses Worldwide' 
  },
  final_cta_title: { 
    type: 'string' as const, 
    default: 'Ready to Experience These Results?' 
  },
  trending_up_icon: { 
    type: 'string' as const, 
    default: '📈' 
  },
  dollar_sign_icon: { 
    type: 'string' as const, 
    default: '💰' 
  },
  automation_icon: { 
    type: 'string' as const, 
    default: '⚙️' 
  },
  users_icon: { 
    type: 'string' as const, 
    default: '👥' 
  },
  chart_bar_icon: { 
    type: 'string' as const, 
    default: '📊' 
  },
  integration_icon: { 
    type: 'string' as const, 
    default: '🔗' 
  },
  before_cross_icon: { 
    type: 'string' as const, 
    default: '❌' 
  },
  after_check_icon: { 
    type: 'string' as const, 
    default: '✅' 
  },
  arrow_icon: { 
    type: 'string' as const, 
    default: '➡️' 
  },
  urgency_clock_icon: { 
    type: 'string' as const, 
    default: '⏰' 
  },
  guarantee_shield_icon: { 
    type: 'string' as const, 
    default: '🛡️' 
  }
};

export default function ValueReinforcementBlock(props: LayoutComponentProps) {
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
  } = useLayoutComponent<ValueReinforcementBlockContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const labelStyle = getTypographyStyle('label');

  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  const valuePoints = blockContent.value_points 
    ? blockContent.value_points.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const valueIcons = blockContent.value_icons 
    ? blockContent.value_icons.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const transformationBefore = blockContent.transformation_before 
    ? blockContent.transformation_before.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const transformationAfter = blockContent.transformation_after 
    ? blockContent.transformation_after.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Handle social proof stats - support both individual fields and legacy format
  const getSocialProofStats = (): {stat: string, label: string}[] => {
    // Check if individual stat fields exist
    const individualStats = [
      {stat: blockContent.stat_1, label: blockContent.label_1},
      {stat: blockContent.stat_2, label: blockContent.label_2},
      {stat: blockContent.stat_3, label: blockContent.label_3},
      {stat: blockContent.stat_4, label: blockContent.label_4}
    ].filter((item): item is { stat: string; label: string } => 
      Boolean(item.stat && item.label && item.stat.trim() !== '' && item.stat !== '___REMOVED___')
    );
    
    if (individualStats.length > 0) {
      return individualStats;
    }
    
    // Legacy format fallback
    const stats = blockContent.social_proof_stats 
      ? blockContent.social_proof_stats.split('|').map(item => item.trim()).filter(Boolean)
      : [];
    const labels = blockContent.social_proof_labels 
      ? blockContent.social_proof_labels.split('|').map(item => item.trim()).filter(Boolean)
      : [];
    
    return stats.map((stat, index) => ({
      stat,
      label: labels[index] || 'Metric'
    }));
  };
  
  const socialProofData = getSocialProofStats();
  
  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : [];
  };
  
  const trustItems = getTrustItems();

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getValueIcon = (iconName: string, index: number) => {
    const iconMapping = {
      'trending-up': 'trending_up_icon',
      'dollar-sign': 'dollar_sign_icon', 
      'automation': 'automation_icon',
      'users': 'users_icon',
      'chart-bar': 'chart_bar_icon',
      'integration': 'integration_icon'
    };
    
    const iconField = iconMapping[iconName as keyof typeof iconMapping] || 'trending_up_icon';
    const iconValue = blockContent[iconField as keyof ValueReinforcementBlockContent];
    
    const fallbackIcons = {
      'trending-up': <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      'dollar-sign': <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>,
      'automation': <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      'users': <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>,
      'chart-bar': <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      'integration': <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    };
    
    return (
      <IconEditableText
        mode={mode}
        value={iconValue as string || ''}
        onEdit={(value) => handleContentUpdate(iconField as keyof ValueReinforcementBlockContent, value)}
        className="text-white text-2xl"
        fallback={fallbackIcons[iconName as keyof typeof fallbackIcons] || fallbackIcons['trending-up']}
      />
    );
  };

  const ValuePoint = ({ point, icon, index }: {
    point: string;
    icon: string;
    index: number;
  }) => (
    <div className="flex items-start space-x-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
      <div className={`w-16 h-16 rounded-xl ${colorTokens.ctaBg} flex items-center justify-center text-white flex-shrink-0`}>
        {getValueIcon(icon, index)}
      </div>
      <div>
        <p className="text-gray-700 font-medium leading-relaxed">{point}</p>
      </div>
    </div>
  );

  const TransformationItem = ({ before, after, index }: {
    before: string;
    after: string;
    index: number;
  }) => (
    <div className="flex items-center space-x-6 p-6 bg-white rounded-xl border border-gray-200">
      {/* Before */}
      <div className="flex-1 text-center">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <IconEditableText
            mode={mode}
            value={blockContent.before_cross_icon || '❌'}
            onEdit={(value) => handleContentUpdate('before_cross_icon', value)}
            className="text-red-500 text-sm"
            fallback={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          />
        </div>
        <p className="text-gray-600 text-sm">{before}</p>
      </div>
      
      {/* Arrow */}
      <div className="flex-shrink-0">
        <IconEditableText
          mode={mode}
          value={blockContent.arrow_icon || '➡️'}
          onEdit={(value) => handleContentUpdate('arrow_icon', value)}
          className="text-blue-500 text-xl"
          fallback={<svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>}
        />
      </div>
      
      {/* After */}
      <div className="flex-1 text-center">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <IconEditableText
            mode={mode}
            value={blockContent.after_check_icon || '✅'}
            onEdit={(value) => handleContentUpdate('after_check_icon', value)}
            className="text-green-500 text-sm"
            fallback={<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          />
        </div>
        <p className="text-gray-700 text-sm font-medium">{after}</p>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ValueReinforcementBlock"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
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
              className="mb-8 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce value reinforcement..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="max-w-4xl mx-auto">
            <p className="text-gray-700 leading-relaxed" style={h3Style}>
              {blockContent.primary_value}
            </p>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Value Reinforcement Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.primary_value || ''}
                  onEdit={(value) => handleContentUpdate('primary_value', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Primary value proposition"
                  sectionId={sectionId}
                  elementKey="primary_value"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.value_points || ''}
                  onEdit={(value) => handleContentUpdate('value_points', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Value points (pipe separated)"
                  sectionId={sectionId}
                  elementKey="value_points"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transformation_before || ''}
                  onEdit={(value) => handleContentUpdate('transformation_before', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Before transformation (pipe separated)"
                  sectionId={sectionId}
                  elementKey="transformation_before"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transformation_after || ''}
                  onEdit={(value) => handleContentUpdate('transformation_after', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="After transformation (pipe separated)"
                  sectionId={sectionId}
                  elementKey="transformation_after"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Value Points Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {valuePoints.map((point, index) => (
                <ValuePoint
                  key={index}
                  point={point}
                  icon={valueIcons[index] || 'trending-up'}
                  index={index}
                />
              ))}
            </div>

            {/* Transformation Section */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100 mb-16">
              <div className="text-center mb-12">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transformation_title || ''}
                  onEdit={(value) => handleContentUpdate('transformation_title', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-900 mb-4"
                  style={h2Style}
                  placeholder="See the Transformation"
                  sectionId={sectionId}
                  elementKey="transformation_title"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transformation_description || ''}
                  onEdit={(value) => handleContentUpdate('transformation_description', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`${mutedTextColor} max-w-2xl mx-auto`}
                  style={bodyLgStyle}
                  placeholder="Watch how businesses like yours have transformed their operations"
                  sectionId={sectionId}
                  elementKey="transformation_description"
                  sectionBackground={sectionBackground}
                />
              </div>

              <div className="space-y-6">
                {transformationBefore.map((before, index) => (
                  transformationAfter[index] && (
                    <TransformationItem
                      key={index}
                      before={before}
                      after={transformationAfter[index]}
                      index={index}
                    />
                  )
                ))}
              </div>
            </div>

            {/* Social Proof Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center mb-16">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.social_proof_title || ''}
                onEdit={(value) => handleContentUpdate('social_proof_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="mb-8 text-white"
                style={h2Style}
                placeholder="Trusted by Businesses Worldwide"
                sectionId={sectionId}
                elementKey="social_proof_title"
                sectionBackground={sectionBackground}
              />
              
              <div className="grid md:grid-cols-4 gap-8">
                {socialProofData.map((item, index) => (
                  <div key={index} className="text-center relative group/stat-item">
                    {mode !== 'preview' ? (
                      <div className="space-y-2">
                        <EditableAdaptiveText
                          mode={mode}
                          value={item.stat}
                          onEdit={(value) => handleContentUpdate(`stat_${index + 1}` as keyof ValueReinforcementBlockContent, value)}
                          backgroundType={safeBackgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-white font-bold"
                          style={{...h2Style, fontSize: 'clamp(2rem, 4vw, 3rem)'}}
                          placeholder={`Stat ${index + 1}`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={`stat_${index + 1}`}
                        />
                        <EditableAdaptiveText
                          mode={mode}
                          value={item.label}
                          onEdit={(value) => handleContentUpdate(`label_${index + 1}` as keyof ValueReinforcementBlockContent, value)}
                          backgroundType={safeBackgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-blue-100"
                          placeholder={`Label ${index + 1}`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={`label_${index + 1}`}
                        />
                        
                        {/* Remove button for stat */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate(`stat_${index + 1}` as keyof ValueReinforcementBlockContent, '___REMOVED___');
                            handleContentUpdate(`label_${index + 1}` as keyof ValueReinforcementBlockContent, '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/stat-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                          title="Remove this stat"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2" style={{...h2Style, fontSize: 'clamp(2rem, 4vw, 3rem)'}}>{item.stat}</div>
                        <div className="text-blue-100">{item.label}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final CTA Section */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center shadow-xl">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.final_cta_title || ''}
                onEdit={(value) => handleContentUpdate('final_cta_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="text-2xl font-bold text-gray-900 mb-4"
                placeholder="Ready to Experience These Results?"
                sectionId={sectionId}
                elementKey="final_cta_title"
                sectionBackground={sectionBackground}
              />
              
              <div className="mb-8">
                <CTAButton
                  text={blockContent.cta_text}
                  colorTokens={colorTokens}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 py-4 px-8"
                  textStyle={bodyLgStyle}
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="cta_text"
                />
              </div>

              {/* Urgency and Risk Reversal */}
              <div className="space-y-3">
                {blockContent.urgency_text && (
                  <div className="flex items-center justify-center space-x-2 text-orange-600">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.urgency_clock_icon || '⏰'}
                      onEdit={(value) => handleContentUpdate('urgency_clock_icon', value)}
                      className="text-orange-600 text-lg"
                      fallback={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <span className="font-semibold">{blockContent.urgency_text}</span>
                  </div>
                )}

                {blockContent.risk_reversal && (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.guarantee_shield_icon || '🛡️'}
                      onEdit={(value) => handleContentUpdate('guarantee_shield_icon', value)}
                      className="text-green-600 text-lg"
                      fallback={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                    />
                    <span className="font-semibold">{blockContent.risk_reversal}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce value proposition..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(trustItems.length > 0 || mode === 'edit') && (
              <div className="mt-8">
                {mode === 'edit' ? (
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
                      const fieldKey = `trust_item_${index + 1}` as keyof ValueReinforcementBlockContent;
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
                        const fieldKey = `trust_item_${emptyIndex + 1}` as keyof ValueReinforcementBlockContent;
                        handleContentUpdate(fieldKey, 'New trust item');
                      }
                    }}
                    onRemoveTrustItem={(index) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof ValueReinforcementBlockContent;
                      handleContentUpdate(fieldKey, '___REMOVED___');
                    }}
                    colorTokens={colorTokens}
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    backgroundType={safeBackgroundType}
                    iconColor="text-green-500"
                    colorClass={mutedTextColor}
                  />
                ) : (
                  trustItems.length > 0 && (
                    <TrustIndicators 
                      items={trustItems}
                      colorClass={mutedTextColor}
                      iconColor="text-green-500"
                    />
                  )
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
  name: 'ValueReinforcementBlock',
  category: 'Close',
  description: 'Comprehensive value reinforcement with transformation showcase and social proof. Perfect for convincing hesitant prospects.',
  tags: ['value', 'transformation', 'social-proof', 'conversion', 'benefits'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'primary_value', label: 'Primary Value Proposition', type: 'textarea', required: true },
    { key: 'value_points', label: 'Value Points (pipe separated)', type: 'textarea', required: true },
    { key: 'value_icons', label: 'Value Icons (pipe separated)', type: 'text', required: false },
    { key: 'transformation_before', label: 'Before Transformation (pipe separated)', type: 'textarea', required: true },
    { key: 'transformation_after', label: 'After Transformation (pipe separated)', type: 'textarea', required: true },
    { key: 'social_proof_stats', label: 'Social Proof Stats (pipe separated)', type: 'text', required: true },
    { key: 'social_proof_labels', label: 'Social Proof Labels (pipe separated)', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'urgency_text', label: 'Urgency Text', type: 'text', required: false },
    { key: 'risk_reversal', label: 'Risk Reversal Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'transformation_title', label: 'Transformation Section Title', type: 'text', required: false },
    { key: 'transformation_description', label: 'Transformation Section Description', type: 'textarea', required: false },
    { key: 'social_proof_title', label: 'Social Proof Section Title', type: 'text', required: false },
    { key: 'final_cta_title', label: 'Final CTA Title', type: 'text', required: false },
    { key: 'trending_up_icon', label: 'Trending Up Icon', type: 'text', required: false },
    { key: 'dollar_sign_icon', label: 'Dollar Sign Icon', type: 'text', required: false },
    { key: 'automation_icon', label: 'Automation Icon', type: 'text', required: false },
    { key: 'users_icon', label: 'Users Icon', type: 'text', required: false },
    { key: 'chart_bar_icon', label: 'Chart Bar Icon', type: 'text', required: false },
    { key: 'integration_icon', label: 'Integration Icon', type: 'text', required: false },
    { key: 'before_cross_icon', label: 'Before Cross Icon', type: 'text', required: false },
    { key: 'after_check_icon', label: 'After Check Icon', type: 'text', required: false },
    { key: 'arrow_icon', label: 'Arrow Icon', type: 'text', required: false },
    { key: 'urgency_clock_icon', label: 'Urgency Clock Icon', type: 'text', required: false },
    { key: 'guarantee_shield_icon', label: 'Guarantee Shield Icon', type: 'text', required: false }
  ],
  
  features: [
    'Visual value points with icons',
    'Before/after transformation showcase',
    'Social proof statistics grid',
    'Risk reversal and urgency elements',
    'Comprehensive benefit reinforcement',
    'Professional conversion-focused design'
  ],
  
  useCases: [
    'Landing page conversion sections',
    'Product value reinforcement',
    'Service transformation showcase',
    'B2B solution presentations',
    'Course and program marketing'
  ]
};