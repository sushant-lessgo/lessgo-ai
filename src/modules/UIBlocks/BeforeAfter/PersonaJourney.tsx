import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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
import { LayoutComponentProps } from '@/types/storeTypes';

interface PersonaJourneyContent {
  headline: string;
  persona_name: string;
  persona_role: string;
  persona_company: string;
  before_title: string;
  before_challenges: string;
  before_pain_points: string;
  journey_title: string;
  journey_description: string;
  journey_steps: string;
  after_title: string;
  after_outcomes: string;
  after_benefits: string;
  summary_title: string;
  summary_description: string;
  summary_label_1: string;
  summary_label_2: string;
  summary_label_3: string;
  show_summary_section?: string;
  persona_avatar?: string;
  // Phase icons
  before_icon?: string;
  journey_icon?: string;
  after_icon?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Enterprise Transformation Success Story' 
  },
  persona_name: { 
    type: 'string' as const, 
    default: 'Sarah Mitchell' 
  },
  persona_role: { 
    type: 'string' as const, 
    default: 'VP of Operations' 
  },
  persona_company: { 
    type: 'string' as const, 
    default: 'TechCorp Industries' 
  },
  before_title: { 
    type: 'string' as const, 
    default: 'Initial Challenges' 
  },
  before_challenges: { 
    type: 'string' as const, 
    default: 'Managing complex workflows across 12 departments with disconnected systems and manual processes causing delays.' 
  },
  before_pain_points: { 
    type: 'string' as const, 
    default: 'Data silos|Manual reporting|Process bottlenecks|Compliance issues|Resource waste' 
  },
  journey_title: { 
    type: 'string' as const, 
    default: 'Transformation Process' 
  },
  journey_steps: { 
    type: 'string' as const, 
    default: 'Initial consultation and system audit|Custom solution design and planning|Phased implementation with training|Integration and optimization|Ongoing support and monitoring' 
  },
  after_title: { 
    type: 'string' as const, 
    default: 'Achieved Results' 
  },
  after_outcomes: { 
    type: 'string' as const, 
    default: 'Unified operations platform with real-time visibility across all departments and automated compliance reporting.' 
  },
  after_benefits: { 
    type: 'string' as const, 
    default: 'Streamlined workflows|Real-time dashboards|Automated compliance|Cost reduction|Improved efficiency' 
  },
  persona_avatar: { 
    type: 'string' as const, 
    default: '/persona-placeholder.jpg' 
  },
  // Phase icons
  before_icon: { 
    type: 'string' as const, 
    default: '⚠️' 
  },
  journey_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  after_icon: { 
    type: 'string' as const, 
    default: '✅' 
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
  },
  journey_description: {
    type: 'string' as const,
    default: 'Complete transformation process from assessment to success'
  },
  summary_title: {
    type: 'string' as const,
    default: 'Complete Enterprise Transformation'
  },
  summary_description: {
    type: 'string' as const,
    default: 'Experience the same proven methodology that has helped hundreds of enterprise clients achieve operational excellence.'
  },
  summary_label_1: {
    type: 'string' as const,
    default: 'Challenges'
  },
  summary_label_2: {
    type: 'string' as const,
    default: 'Process'
  },
  summary_label_3: {
    type: 'string' as const,
    default: 'Success'
  },
  show_summary_section: {
    type: 'string' as const,
    default: 'true'
  }
};

const PersonaCard = React.memo(({ 
  name, 
  role, 
  company, 
  avatar, 
  showImageToolbar, 
  sectionId, 
  mode,
  h2Style,
  h3Style
}: {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  h2Style: React.CSSProperties;
  h3Style: React.CSSProperties;
}) => {
  
  const AvatarPlaceholder = () => (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
      <span className="text-white font-bold" style={h2Style}>
        {name.split(' ').map(n => n[0]).join('')}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center space-x-4">
        {avatar && avatar !== '' ? (
          <img
            src={avatar}
            alt={name}
            className="w-20 h-20 rounded-full object-cover cursor-pointer border-4 border-white shadow-lg"
            data-image-id={`${sectionId}-persona-avatar`}
            onMouseUp={(e) => {
                        // Image toolbar is only available in edit mode
                      }}
          />
        ) : (
          <AvatarPlaceholder />
        )}
        
        <div>
          <h3 className="text-gray-900" style={h3Style}>{name}</h3>
          <p className="text-blue-600 font-semibold">{role}</p>
          <p className="text-gray-600 text-sm">{company}</p>
        </div>
      </div>
    </div>
  );
});
PersonaCard.displayName = 'PersonaCard';

const JourneyPhase = React.memo(({ 
  title, 
  description, 
  items, 
  type, 
  isJourney = false,
  h3Style,
  mode,
  blockContent,
  handleContentUpdate,
  backgroundType,
  colorTokens,
  sectionId
}: {
  title: string;
  description: string;
  items: string[];
  type: 'before' | 'journey' | 'after';
  isJourney?: boolean;
  h3Style: React.CSSProperties;
  mode: string;
  blockContent: PersonaJourneyContent;
  handleContentUpdate: (key: string, value: string) => void;
  backgroundType: any;
  colorTokens: any;
  sectionId: string;
}) => {
  
  const getPhaseColor = () => {
    switch (type) {
      case 'before': return { bg: 'bg-red-500', ring: 'ring-red-100', text: 'text-red-600', icon: 'text-red-500' };
      case 'journey': return { bg: 'bg-blue-500', ring: 'ring-blue-100', text: 'text-blue-600', icon: 'text-blue-500' };
      case 'after': return { bg: 'bg-green-500', ring: 'ring-green-100', text: 'text-green-600', icon: 'text-green-500' };
      default: return { bg: 'bg-gray-500', ring: 'ring-gray-100', text: 'text-gray-600', icon: 'text-gray-500' };
    }
  };

  const colors = getPhaseColor();

  const getIconForType = (iconType: 'before' | 'journey' | 'after') => {
    const iconFields = {
      before: 'before_icon',
      journey: 'journey_icon', 
      after: 'after_icon'
    };
    return blockContent[iconFields[iconType] as keyof PersonaJourneyContent] || 
           (iconType === 'before' ? '⚠️' : iconType === 'journey' ? '⚡' : '✅');
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 h-full">
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 rounded-full ${colors.bg} ${colors.ring} ring-4 flex items-center justify-center shadow-lg mr-4`}>
          <IconEditableText
            mode={mode as 'preview' | 'edit'}
            value={getIconForType(type)}
            onEdit={(value) => {
              const iconField = type === 'before' ? 'before_icon' : 
                              type === 'journey' ? 'journey_icon' : 'after_icon';
              handleContentUpdate(iconField, value);
            }}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-2xl"
            sectionId={sectionId}
            elementKey={`${type}_icon`}
          />
        </div>
        <h3 className={colors.text} style={h3Style}>{title}</h3>
      </div>
      
      <p className="text-gray-600 leading-relaxed mb-6">
        {description}
      </p>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-3">
            {isJourney ? (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
              </div>
            ) : (
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${colors.bg} mt-2`} />
            )}
            <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
JourneyPhase.displayName = 'JourneyPhase';

export default function PersonaJourney(props: LayoutComponentProps) {
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
  } = useLayoutComponent<PersonaJourneyContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const beforePainPoints = blockContent.before_pain_points 
    ? blockContent.before_pain_points.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const journeySteps = blockContent.journey_steps 
    ? blockContent.journey_steps.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const afterBenefits = blockContent.after_benefits 
    ? blockContent.after_benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PersonaJourney"
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
              className="mb-6 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the persona journey..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="mb-12">
          {mode !== 'preview' ? (
            <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700">Persona Information</h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_name || ''}
                  onEdit={(value) => handleContentUpdate('persona_name', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Persona name"
                  sectionId={sectionId}
                  elementKey="persona_name"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_role || ''}
                  onEdit={(value) => handleContentUpdate('persona_role', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Persona role"
                  sectionId={sectionId}
                  elementKey="persona_role"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_company || ''}
                  onEdit={(value) => handleContentUpdate('persona_company', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Company name"
                  sectionId={sectionId}
                  elementKey="persona_company"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          ) : (
            <PersonaCard
              name={blockContent.persona_name}
              role={blockContent.persona_role}
              company={blockContent.persona_company}
              avatar={blockContent.persona_avatar}
              showImageToolbar={showImageToolbar}
              sectionId={sectionId}
              mode={mode}
              h2Style={h2Style}
              h3Style={h3Style}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          
          {mode !== 'preview' ? (
            <>
              <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700">Before Phase</h4>
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_title || ''}
                  onEdit={(value) => handleContentUpdate('before_title', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Before title"
                  sectionId={sectionId}
                  elementKey="before_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_challenges || ''}
                  onEdit={(value) => handleContentUpdate('before_challenges', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Before challenges description"
                  sectionId={sectionId}
                  elementKey="before_challenges"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_pain_points || ''}
                  onEdit={(value) => handleContentUpdate('before_pain_points', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Before pain points (pipe separated)"
                  sectionId={sectionId}
                  elementKey="before_pain_points"
                  sectionBackground={sectionBackground}
                />
              </div>

              <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700">Journey Phase</h4>
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.journey_title || ''}
                  onEdit={(value) => handleContentUpdate('journey_title', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Journey title"
                  sectionId={sectionId}
                  elementKey="journey_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.journey_steps || ''}
                  onEdit={(value) => handleContentUpdate('journey_steps', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Journey steps (pipe separated)"
                  sectionId={sectionId}
                  elementKey="journey_steps"
                  sectionBackground={sectionBackground}
                />
              </div>

              <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700">After Phase</h4>
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_title || ''}
                  onEdit={(value) => handleContentUpdate('after_title', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="After title"
                  sectionId={sectionId}
                  elementKey="after_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_outcomes || ''}
                  onEdit={(value) => handleContentUpdate('after_outcomes', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="After outcomes description"
                  sectionId={sectionId}
                  elementKey="after_outcomes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_benefits || ''}
                  onEdit={(value) => handleContentUpdate('after_benefits', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="After benefits (pipe separated)"
                  sectionId={sectionId}
                  elementKey="after_benefits"
                  sectionBackground={sectionBackground}
                />
              </div>
            </>
          ) : (
            <>
              <JourneyPhase
                title={blockContent.before_title}
                description={blockContent.before_challenges}
                items={beforePainPoints}
                type="before"
                h3Style={h3Style}
                mode={mode}
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                sectionId={sectionId}
              />
              
              <JourneyPhase
                title={blockContent.journey_title}
                description={blockContent.journey_description}
                items={journeySteps}
                type="journey"
                isJourney={true}
                h3Style={h3Style}
                mode={mode}
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                sectionId={sectionId}
              />
              
              <JourneyPhase
                title={blockContent.after_title}
                description={blockContent.after_outcomes}
                items={afterBenefits}
                type="after"
                h3Style={h3Style}
                mode={mode}
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                sectionId={sectionId}
              />
            </>
          )}
        </div>

        {(blockContent.show_summary_section !== 'false') && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-12 relative group/summary-section">
            <div className="text-center">
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.before_icon || '⚠️'}
                      onEdit={(value) => handleContentUpdate('before_icon', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      iconSize="lg"
                      className="text-2xl text-white"
                      sectionId={sectionId}
                      elementKey="summary_before_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.summary_label_1 || ''}
                    onEdit={(value) => handleContentUpdate('summary_label_1', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#dc2626'
                    }}
                    className="text-sm font-medium text-red-600"
                    sectionId={sectionId}
                    elementKey="summary_label_1"
                    sectionBackground={sectionBackground}
                  />
                </div>
                
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.journey_icon || '⚡'}
                      onEdit={(value) => handleContentUpdate('journey_icon', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      iconSize="lg"
                      className="text-2xl text-white"
                      sectionId={sectionId}
                      elementKey="summary_journey_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.summary_label_2 || ''}
                    onEdit={(value) => handleContentUpdate('summary_label_2', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#2563eb'
                    }}
                    className="text-sm font-medium text-blue-600"
                    sectionId={sectionId}
                    elementKey="summary_label_2"
                    sectionBackground={sectionBackground}
                  />
                </div>
                
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.after_icon || '✅'}
                      onEdit={(value) => handleContentUpdate('after_icon', value)}
                      backgroundType={safeBackgroundType}
                      colorTokens={colorTokens}
                      iconSize="lg"
                      className="text-2xl text-white"
                      sectionId={sectionId}
                      elementKey="summary_after_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.summary_label_3 || ''}
                    onEdit={(value) => handleContentUpdate('summary_label_3', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#059669'
                    }}
                    className="text-sm font-medium text-green-600"
                    sectionId={sectionId}
                    elementKey="summary_label_3"
                    sectionBackground={sectionBackground}
                  />
                </div>
              </div>
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.summary_title || ''}
                onEdit={(value) => handleContentUpdate('summary_title', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  ...h3Style,
                  color: '#111827'
                }}
                className="text-gray-900 mb-4"
                sectionId={sectionId}
                elementKey="summary_title"
                sectionBackground={sectionBackground}
              />
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.summary_description || ''}
                onEdit={(value) => handleContentUpdate('summary_description', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className={`${mutedTextColor} max-w-2xl mx-auto`}
                sectionId={sectionId}
                elementKey="summary_description"
                sectionBackground={sectionBackground}
              />
            </div>
            
            {/* Remove button */}
            {mode !== 'preview' && (
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
        {mode !== 'preview' && blockContent.show_summary_section === 'false' && (
          <div className="mb-12 text-center">
            <button
              onClick={() => handleContentUpdate('show_summary_section', 'true')}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add transformation summary</span>
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
                placeholder="Add optional supporting text to reinforce your enterprise success story..."
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
  name: 'PersonaJourney',
  category: 'Comparison',
  description: 'User persona-based transformation story layout. Perfect for enterprise sales and complex customer journeys.',
  tags: ['comparison', 'persona', 'journey', 'enterprise', 'storytelling'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'persona_name', label: 'Persona Name', type: 'text', required: true },
    { key: 'persona_role', label: 'Persona Role', type: 'text', required: true },
    { key: 'persona_company', label: 'Persona Company', type: 'text', required: true },
    { key: 'persona_avatar', label: 'Persona Avatar', type: 'image', required: false },
    { key: 'before_title', label: 'Before Phase Title', type: 'text', required: true },
    { key: 'before_challenges', label: 'Before Challenges', type: 'textarea', required: true },
    { key: 'before_pain_points', label: 'Before Pain Points (pipe separated)', type: 'textarea', required: true },
    { key: 'journey_title', label: 'Journey Phase Title', type: 'text', required: true },
    { key: 'journey_steps', label: 'Journey Steps (pipe separated)', type: 'textarea', required: true },
    { key: 'after_title', label: 'After Phase Title', type: 'text', required: true },
    { key: 'after_outcomes', label: 'After Outcomes', type: 'textarea', required: true },
    { key: 'after_benefits', label: 'After Benefits (pipe separated)', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Complete persona-based transformation story',
    'Three-phase journey visualization',
    'Professional enterprise presentation',
    'Persona card with avatar and details',
    'Step-by-step process documentation',
    'Perfect for complex B2B sales cycles'
  ],
  
  useCases: [
    'Enterprise sales demonstrations',
    'Complex customer journey mapping',
    'B2B transformation case studies',
    'Executive decision maker targeting',
    'Multi-stakeholder solution presentations'
  ]
};