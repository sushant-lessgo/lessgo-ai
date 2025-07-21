import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface CompetitorCalloutsContent {
  headline: string;
  subheadline?: string;
  competitor_names: string;
  competitor_issues: string;
  our_solution: string;
  trust_badge?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Why Industry Leaders Are Switching to Us' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Join thousands who\'ve upgraded from legacy solutions to modern innovation.' 
  },
  competitor_names: { 
    type: 'string' as const, 
    default: 'Competitor A|Competitor B|Competitor C' 
  },
  competitor_issues: { 
    type: 'string' as const, 
    default: 'Outdated interface, slow performance, limited integrations|Expensive pricing, poor customer support, complex setup|No mobile app, lacks key features, frequent downtime' 
  },
  our_solution: { 
    type: 'string' as const, 
    default: 'Modern UI with lightning-fast performance and 100+ integrations|Fair pricing with 24/7 expert support and 5-minute setup|Full mobile suite with advanced features and 99.9% uptime' 
  },
  trust_badge: { 
    type: 'string' as const, 
    default: 'Trusted by 10,000+ teams worldwide' 
  }
};

// CompetitorCallouts component - Direct competitor comparison with issues/solutions
export default function CompetitorCallouts(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  
  const { 
    mode, 
    blockContent, 
    colorTokens, 
    getTextStyle, 
    sectionBackground, 
    handleContentUpdate 
  } = useLayoutComponent<CompetitorCalloutsContent>({ 
    ...props, 
    contentSchema: CONTENT_SCHEMA 
  });

  // Parse data
  const competitorNames = parsePipeData(blockContent.competitor_names);
  const competitorIssues = parsePipeData(blockContent.competitor_issues);
  const ourSolutions = parsePipeData(blockContent.our_solution);

  // Update handlers
  const handleCompetitorNameUpdate = (index: number, value: string) => {
    const newNames = [...competitorNames];
    newNames[index] = value;
    handleContentUpdate('competitor_names', newNames.join('|'));
  };

  const handleCompetitorIssueUpdate = (index: number, value: string) => {
    const newIssues = [...competitorIssues];
    newIssues[index] = value;
    handleContentUpdate('competitor_issues', newIssues.join('|'));
  };

  const handleOurSolutionUpdate = (index: number, value: string) => {
    const newSolutions = [...ourSolutions];
    newSolutions[index] = value;
    handleContentUpdate('our_solution', newSolutions.join('|'));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CompetitorCallouts"
      backgroundType={backgroundType || 'secondary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            content={blockContent.headline}
            mode={mode}
            onUpdate={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            fonts={fonts}
            colorTokens={colorTokens}
            variant="h1"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              content={blockContent.subheadline || 'Add subheadline...'}
              mode={mode}
              onUpdate={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-3xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              fonts={fonts}
              colorTokens={colorTokens}
              variant="body-lg"
            />
          )}
        </div>

        {/* Competitor Callouts */}
        <div className="space-y-8">
          {competitorNames.map((name, index) => (
            <div 
              key={index} 
              className={`rounded-lg ${colorTokens.bgNeutral} border ${colorTokens.borderColor} p-8 hover:shadow-lg transition-shadow`}
            >
              <div className="grid md:grid-cols-3 gap-6 items-center">
                {/* Competitor Info */}
                <div className="md:col-span-1">
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleCompetitorNameUpdate(index, e.target.value)}
                      className={`text-xl font-semibold bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-2 ${colorTokens.textPrimary}`}
                      style={fonts.h3}
                    />
                  ) : (
                    <h3 className={`text-xl font-semibold mb-2 ${colorTokens.textPrimary}`} style={fonts.h3}>
                      {name}
                    </h3>
                  )}
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {mode === 'edit' ? (
                      <textarea
                        value={competitorIssues[index]}
                        onChange={(e) => handleCompetitorIssueUpdate(index, e.target.value)}
                        className={`flex-1 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none ${colorTokens.textSecondary}`}
                        style={getTextStyle('body')}
                        rows={2}
                      />
                    ) : (
                      <p className={`text-sm ${colorTokens.textSecondary}`} style={getTextStyle('body')}>
                        {competitorIssues[index]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex justify-center">
                  <svg className={`w-12 h-12 ${colorTokens.textAccent} transform rotate-0 md:rotate-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Our Solution */}
                <div className="md:col-span-1">
                  <h4 className={`font-semibold mb-2 ${colorTokens.textAccent}`} style={fonts.h4}>
                    Our Solution
                  </h4>
                  
                  <div className="flex items-start">
                    <svg className={`w-5 h-5 ${colorTokens.textAccent} mr-2 mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {mode === 'edit' ? (
                      <textarea
                        value={ourSolutions[index]}
                        onChange={(e) => handleOurSolutionUpdate(index, e.target.value)}
                        className={`flex-1 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none ${colorTokens.textPrimary}`}
                        style={getTextStyle('body')}
                        rows={2}
                      />
                    ) : (
                      <p className={`text-sm font-medium ${colorTokens.textPrimary}`} style={getTextStyle('body')}>
                        {ourSolutions[index]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        {(blockContent.trust_badge || mode === 'edit') && (
          <div className="text-center mt-12">
            <div className={`inline-flex items-center ${colorTokens.bgAccent} bg-opacity-10 px-6 py-3 rounded-full`}>
              <svg className={`w-5 h-5 ${colorTokens.textAccent} mr-2`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                content={blockContent.trust_badge || 'Add trust badge...'}
                mode={mode}
                onUpdate={(value) => handleContentUpdate('trust_badge', value)}
                className={`font-medium ${!blockContent.trust_badge && mode === 'edit' ? 'opacity-50' : ''}`}
                fonts={fonts}
                colorTokens={colorTokens}
                variant="body"
              />
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}