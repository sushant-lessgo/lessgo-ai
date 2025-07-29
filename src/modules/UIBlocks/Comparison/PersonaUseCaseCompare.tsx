import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface PersonaUseCaseCompareContent {
  headline: string;
  subheadline?: string;
  persona_labels: string;
  persona_descriptions: string;
  use_cases: string;
  solutions: string;
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
  }
};

// PersonaUseCaseCompare component - Role-based comparison showing different use cases
export default function PersonaUseCaseCompare(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  
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

  // Get persona icon
  const getPersonaIcon = (index: number) => {
    const icons = [
      // Marketing
      <svg key="marketing" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>,
      // Sales
      <svg key="sales" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      // Operations
      <svg key="operations" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>,
      // IT
      <svg key="it" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ];
    return icons[index] || icons[0];
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
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            level="h1"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || 'Add subheadline...'}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-3xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              backgroundType={backgroundType as any}
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
                  ? `border-${(colorTokens.textAccent || 'text-blue-600').replace('text-', '')} ${colorTokens.bgAccent || 'bg-blue-500'} bg-opacity-10` 
                  : `${colorTokens.borderColor} hover:border-gray-400`
              }`}
            >
              <div className={`flex flex-col items-center ${
                activePersona === index ? colorTokens.textAccent : colorTokens.textSecondary
              }`}>
                {getPersonaIcon(index)}
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
                    style={getTextStyle('body')}
                  />
                ) : (
                  <span className="mt-2 font-medium" style={getTextStyle('body')}>{label}</span>
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
            <h3 className={`text-xl font-semibold mb-6 ${colorTokens.textPrimary}`} style={getTextStyle('h3')}>
              Your Use Cases
            </h3>
            <ul className="space-y-4">
              {activeUseCases.map((useCase, index) => (
                <li key={index} className="flex items-start">
                  <svg className={`w-5 h-5 ${colorTokens.textAccent} mr-3 mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={colorTokens.textSecondary} style={getTextStyle('body')}>
                    {useCase.trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Solutions */}
          <div className={`rounded-lg ${colorTokens.bgAccent || 'bg-blue-500'} bg-opacity-10 p-8 border-2 border-${(colorTokens.textAccent || 'text-blue-600').replace('text-', '')}`}>
            <h3 className={`text-xl font-semibold mb-6 ${colorTokens.textAccent}`} style={getTextStyle('h3')}>
              Our Solutions
            </h3>
            <ul className="space-y-4">
              {activeSolutions.map((solution, index) => (
                <li key={index} className="flex items-start">
                  <svg className={`w-5 h-5 ${colorTokens.textAccent} mr-3 mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className={`font-medium ${colorTokens.textPrimary}`} style={getTextStyle('body')}>
                    {solution.trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className={`${colorTokens.bgAccent} text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity`}>
            <span style={getTextStyle('button')}>
              See How It Works for {personaLabels[activePersona]}
            </span>
          </button>
        </div>
      </div>
    </LayoutSection>
  );
}