import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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

interface PersonaJourneyContent {
  headline: string;
  persona_name: string;
  persona_role: string;
  persona_company: string;
  before_title: string;
  before_challenges: string;
  before_pain_points: string;
  journey_title: string;
  journey_steps: string;
  after_title: string;
  after_outcomes: string;
  after_benefits: string;
  persona_avatar?: string;
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

const PersonaCard = React.memo(({ 
  name, 
  role, 
  company, 
  avatar, 
  showImageToolbar, 
  sectionId, 
  mode 
}: {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
}) => {
  
  const AvatarPlaceholder = () => (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
      <span className="text-white font-bold text-2xl">
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
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                showImageToolbar(`${sectionId}-persona-avatar`, {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                });
              }
            }}
          />
        ) : (
          <AvatarPlaceholder />
        )}
        
        <div>
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
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
  isJourney = false 
}: {
  title: string;
  description: string;
  items: string[];
  type: 'before' | 'journey' | 'after';
  isJourney?: boolean;
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

  const getIcon = () => {
    switch (type) {
      case 'before':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'journey':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'after':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 h-full">
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 rounded-full ${colors.bg} ${colors.ring} ring-4 flex items-center justify-center shadow-lg mr-4`}>
          {getIcon()}
        </div>
        <h3 className={`text-xl font-bold ${colors.text}`}>{title}</h3>
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
  
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PersonaJourney"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the persona journey..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="mb-12">
          {mode === 'edit' ? (
            <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700">Persona Information</h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_name}
                  onEdit={(value) => handleContentUpdate('persona_name', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="Persona name"
                  sectionId={sectionId}
                  elementKey="persona_name"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_role}
                  onEdit={(value) => handleContentUpdate('persona_role', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="Persona role"
                  sectionId={sectionId}
                  elementKey="persona_role"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_company}
                  onEdit={(value) => handleContentUpdate('persona_company', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
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
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          
          {mode === 'edit' ? (
            <>
              <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700">Before Phase</h4>
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_title}
                  onEdit={(value) => handleContentUpdate('before_title', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('h4')}
                  placeholder="Before title"
                  sectionId={sectionId}
                  elementKey="before_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_challenges}
                  onEdit={(value) => handleContentUpdate('before_challenges', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="Before challenges description"
                  sectionId={sectionId}
                  elementKey="before_challenges"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_pain_points}
                  onEdit={(value) => handleContentUpdate('before_pain_points', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
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
                  value={blockContent.journey_title}
                  onEdit={(value) => handleContentUpdate('journey_title', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('h4')}
                  placeholder="Journey title"
                  sectionId={sectionId}
                  elementKey="journey_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.journey_steps}
                  onEdit={(value) => handleContentUpdate('journey_steps', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
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
                  value={blockContent.after_title}
                  onEdit={(value) => handleContentUpdate('after_title', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('h4')}
                  placeholder="After title"
                  sectionId={sectionId}
                  elementKey="after_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_outcomes}
                  onEdit={(value) => handleContentUpdate('after_outcomes', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="After outcomes description"
                  sectionId={sectionId}
                  elementKey="after_outcomes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_benefits}
                  onEdit={(value) => handleContentUpdate('after_benefits', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
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
              />
              
              <JourneyPhase
                title={blockContent.journey_title}
                description="Complete transformation process from assessment to success"
                items={journeySteps}
                type="journey"
                isJourney={true}
              />
              
              <JourneyPhase
                title={blockContent.after_title}
                description={blockContent.after_outcomes}
                items={afterBenefits}
                type="after"
              />
            </>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-12">
          <div className="text-center">
            <div className="flex justify-center space-x-8 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-red-600">Challenges</div>
              </div>
              
              <div className="flex items-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-blue-600">Process</div>
              </div>
              
              <div className="flex items-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-green-600">Success</div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Complete Enterprise Transformation
            </h3>
            
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              Experience the same proven methodology that has helped hundreds of enterprise clients achieve operational excellence.
            </p>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
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
                    textStyle={getTextStyle('body-lg')}
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