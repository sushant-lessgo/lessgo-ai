import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import IconEditableText from '@/components/ui/IconEditableText';

// Content interface for type safety
interface PersonaUseCaseCompareContent {
  headline: string;
  subheadline?: string;
  persona_labels: string;
  persona_descriptions: string;
  use_cases: string;
  solutions: string;
  persona_icon_1?: string;
  persona_icon_2?: string;
  persona_icon_3?: string;
  persona_icon_4?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Solutions Tailored to Your Role' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how our platform addresses your specific challenges and use cases.' 
  },
  persona_labels: { 
    type: 'string' as const, 
    default: 'Marketing Teams|Sales Leaders|Operations Managers|IT Administrators' 
  },
  persona_descriptions: { 
    type: 'string' as const, 
    default: 'Drive campaigns and measure ROI|Close deals faster with better insights|Streamline workflows and reduce costs|Ensure security and seamless integration' 
  },
  use_cases: { 
    type: 'string' as const, 
    default: 'Campaign automation,Lead scoring,Analytics dashboards|Pipeline management,Territory planning,Forecasting|Process automation,Resource allocation,Reporting|User management,API integration,Security compliance' 
  },
  solutions: { 
    type: 'string' as const, 
    default: 'Visual workflow builder, AI-powered insights, Real-time analytics|CRM integration, Automated follow-ups, Revenue intelligence|Custom workflows, Team collaboration, Cost tracking|SSO/SAML, REST APIs, SOC 2 certified' 
  },
  persona_icon_1: { 
    type: 'string' as const, 
    default: '📢' 
  },
  persona_icon_2: { 
    type: 'string' as const, 
    default: '📊' 
  },
  persona_icon_3: { 
    type: 'string' as const, 
    default: '⚙️' 
  },
  persona_icon_4: { 
    type: 'string' as const, 
    default: '💻' 
  }
};

// PersonaUseCaseCompare component - Role-based comparison showing different use cases
export default function PersonaUseCaseCompare(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  const { 
    mode, 
    blockContent, 
    colorTokens, 
    getTextStyle, 
    sectionBackground, 
    handleContentUpdate 
  } = useLayoutComponent<PersonaUseCaseCompareContent>({ 
    ...props, 
    contentSchema: CONTENT_SCHEMA 
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');

  const [activePersona, setActivePersona] = useState(0);

  // Parse data
  const personaLabels = parsePipeData(blockContent.persona_labels);
  const personaDescriptions = parsePipeData(blockContent.persona_descriptions);
  const useCasesRaw = blockContent.use_cases.split('|');
  const solutionsRaw = blockContent.solutions.split('|');

  // Parse use cases and solutions for active persona
  const activeUseCases = useCasesRaw[activePersona]?.split(',') || [];
  const activeSolutions = solutionsRaw[activePersona]?.split(',') || [];

  // Update handlers
  const handlePersonaLabelUpdate = (index: number, value: string) => {
    const newLabels = [...personaLabels];
    newLabels[index] = value;
    handleContentUpdate('persona_labels', newLabels.join('|'));
  };

  const handlePersonaDescriptionUpdate = (index: number, value: string) => {
    const newDescriptions = [...personaDescriptions];
    newDescriptions[index] = value;
    handleContentUpdate('persona_descriptions', newDescriptions.join('|'));
  };

  // Icon edit handler
  const handlePersonaIconEdit = (index: number, value: string) => {
    const iconField = `persona_icon_${index + 1}` as keyof PersonaUseCaseCompareContent;
    handleContentUpdate(iconField, value);
  };

  // Get persona icon value
  const getPersonaIconValue = (index: number) => {
    const iconFields = ['persona_icon_1', 'persona_icon_2', 'persona_icon_3', 'persona_icon_4'];
    return blockContent[iconFields[index] as keyof PersonaUseCaseCompareContent] || ['📢', '📊', '⚙️', '💻'][index];
  };


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PersonaUseCaseCompare"
      backgroundType={backgroundType || 'secondary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            sectionBackground={sectionBackground}
            colorTokens={colorTokens}
            level="h1"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || 'Add subheadline...'}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-3xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              sectionBackground={sectionBackground}
              colorTokens={colorTokens}
              variant="body"
            />
          )}
        </div>

        {/* Persona Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {personaLabels.map((label, index) => (
            <button
              key={index}
              onClick={() => setActivePersona(index)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activePersona === index 
                  ? `border-${'primary'} ${'bg-primary'} bg-opacity-10` 
                  : `border-gray-200 hover:border-gray-400`
              }`}
            >
              <div className={`flex flex-col items-center ${
                activePersona === index ? 'text-primary' : colorTokens.textSecondary
              } group/icon-edit`}>
                <IconEditableText
                  mode={mode}
                  value={getPersonaIconValue(index)}
                  onEdit={(value) => handlePersonaIconEdit(index, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="lg"
                  className="text-3xl mb-2"
                  sectionId={sectionId}
                  elementKey={`persona_icon_${index + 1}`}
                />
                {mode === 'edit' ? (
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                      e.stopPropagation();
                      handlePersonaLabelUpdate(index, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 text-center bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 font-medium"
                  />
                ) : (
                  <span className="mt-2 font-medium">{label}</span>
                )}
              </div>
              {mode === 'edit' ? (
                <textarea
                  value={personaDescriptions[index]}
                  onChange={(e) => {
                    e.stopPropagation();
                    handlePersonaDescriptionUpdate(index, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-1 text-xs text-center bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 resize-none ${
                    activePersona === index ? colorTokens.textPrimary : 'text-gray-500'
                  }`}
                  rows={2}
                />
              ) : (
                <p className={`mt-1 text-xs ${
                  activePersona === index ? colorTokens.textPrimary : 'text-gray-500'
                }`}>
                  {personaDescriptions[index]}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Use Cases and Solutions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Use Cases */}
          <div className={`rounded-lg ${colorTokens.bgNeutral} p-8`}>
            <h3 style={h3Style} className={`mb-6 ${colorTokens.textPrimary}`}>
              Your Use Cases
            </h3>
            <ul className="space-y-4">
              {activeUseCases.map((useCase, index) => (
                <li key={index} className="flex items-start">
                  <svg className={`w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={colorTokens.textSecondary}>
                    {useCase.trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Solutions */}
          <div className={`rounded-lg ${'bg-primary'} bg-opacity-10 p-8 border-2 border-${'primary'}`}>
            <h3 style={h3Style} className={`mb-6 text-primary`}>
              Our Solutions
            </h3>
            <ul className="space-y-4">
              {activeSolutions.map((solution, index) => (
                <li key={index} className="flex items-start">
                  <svg className={`w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className={`font-medium ${colorTokens.textPrimary}`}>
                    {solution.trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className={`bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity`}>
            <span>
              See How It Works for {personaLabels[activePersona]}
            </span>
          </button>
        </div>
      </div>
    </LayoutSection>
  );
}