import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useImageToolbar } from '@/hooks/useImageToolbar';
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
  sectionId, 
  mode,
  h3Style,
  onNameEdit,
  onRoleEdit,
  onCompanyEdit,
  handleImageToolbar
}: {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  sectionId: string;
  mode: string;
  h3Style: React.CSSProperties;
  onNameEdit: (value: string) => void;
  onRoleEdit: (value: string) => void;
  onCompanyEdit: (value: string) => void;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
}) => {
  

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center space-x-4">
        <img
          src={avatar || '/persona-placeholder.jpg'}
          alt={name}
          className="w-20 h-20 rounded-full object-cover cursor-pointer border-4 border-white shadow-lg"
          data-image-id={`${sectionId}-persona-avatar`}
          onMouseUp={(e) => {
            if (mode === 'edit') {
              e.stopPropagation();
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const imageId = `${sectionId}-persona-avatar`;
              const position = {
                x: rect.left + rect.width / 2,
                y: rect.top - 10
              };
              handleImageToolbar(imageId, position);
            }
          }}
          onClick={(e) => {
            if (mode === 'edit') {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        />
        
        <div>
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onNameEdit(e.currentTarget.textContent || '')}
              className="text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
              style={h3Style}
            >
              {name}
            </div>
          ) : (
            <h3 className="text-gray-900" style={h3Style}>{name}</h3>
          )}
          
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onRoleEdit(e.currentTarget.textContent || '')}
              className="text-blue-600 font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
            >
              {role}
            </div>
          ) : (
            <p className="text-blue-600 font-semibold">{role}</p>
          )}
          
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCompanyEdit(e.currentTarget.textContent || '')}
              className="text-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
            >
              {company}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">{company}</p>
          )}
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
  sectionId,
  onTitleEdit,
  onDescriptionEdit,
  onItemsEdit
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
  onTitleEdit: (value: string) => void;
  onDescriptionEdit: (value: string) => void;
  onItemsEdit: (items: string[]) => void;
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
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleEdit(e.currentTarget.textContent || '')}
            className={`${colors.text} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50`}
            style={h3Style}
          >
            {title}
          </div>
        ) : (
          <h3 className={colors.text} style={h3Style}>{title}</h3>
        )}
      </div>
      
      {mode !== 'preview' ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onDescriptionEdit(e.currentTarget.textContent || '')}
          className="text-gray-600 leading-relaxed mb-6 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
        >
          {description}
        </div>
      ) : (
        <p className="text-gray-600 leading-relaxed mb-6">
          {description}
        </p>
      )}
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 group/item">
            {isJourney ? (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
              </div>
            ) : (
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${colors.bg} mt-2`} />
            )}
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newItems = [...items];
                  newItems[index] = e.currentTarget.textContent || '';
                  onItemsEdit(newItems);
                }}
                className="text-gray-700 text-sm leading-relaxed flex-1 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
              >
                {item}
              </div>
            ) : (
              <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
            )}
            {mode === 'edit' && items.length > 1 && (
              <button
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== index);
                  onItemsEdit(newItems);
                }}
                className="opacity-0 group-hover/item:opacity-100 flex-shrink-0 text-red-500 hover:text-red-700 transition-opacity duration-200"
                title="Remove this item"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {mode === 'edit' && (
          <button
            onClick={() => {
              const newItems = [...items, 'New item'];
              onItemsEdit(newItems);
            }}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add item</span>
          </button>
        )}
      </div>
    </div>
  );
});
JourneyPhase.displayName = 'JourneyPhase';

export default function PersonaJourney(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const handleImageToolbar = useImageToolbar();
  
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
          <PersonaCard
            name={blockContent.persona_name}
            role={blockContent.persona_role}
            company={blockContent.persona_company}
            avatar={blockContent.persona_avatar}
            sectionId={sectionId}
            mode={mode}
            h3Style={h3Style}
            onNameEdit={(value) => handleContentUpdate('persona_name', value)}
            onRoleEdit={(value) => handleContentUpdate('persona_role', value)}
            onCompanyEdit={(value) => handleContentUpdate('persona_company', value)}
            handleImageToolbar={handleImageToolbar}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
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
            onTitleEdit={(value) => handleContentUpdate('before_title', value)}
            onDescriptionEdit={(value) => handleContentUpdate('before_challenges', value)}
            onItemsEdit={(items) => handleContentUpdate('before_pain_points', items.join('|'))}
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
            onTitleEdit={(value) => handleContentUpdate('journey_title', value)}
            onDescriptionEdit={(value) => handleContentUpdate('journey_description', value)}
            onItemsEdit={(items) => handleContentUpdate('journey_steps', items.join('|'))}
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
            onTitleEdit={(value) => handleContentUpdate('after_title', value)}
            onDescriptionEdit={(value) => handleContentUpdate('after_outcomes', value)}
            onItemsEdit={(items) => handleContentUpdate('after_benefits', items.join('|'))}
          />
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