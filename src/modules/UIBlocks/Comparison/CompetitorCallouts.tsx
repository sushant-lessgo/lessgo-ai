import React from 'react';
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
interface CompetitorCalloutsContent {
  headline: string;
  subheadline?: string;
  competitor_names: string;
  competitor_issues: string;
  our_solution: string;
  trust_badge?: string;
  issue_icon_1?: string;
  issue_icon_2?: string;
  issue_icon_3?: string;
  solution_icon_1?: string;
  solution_icon_2?: string;
  solution_icon_3?: string;
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
  },
  issue_icon_1: { 
    type: 'string' as const, 
    default: '⚠️' 
  },
  issue_icon_2: { 
    type: 'string' as const, 
    default: '⚠️' 
  },
  issue_icon_3: { 
    type: 'string' as const, 
    default: '⚠️' 
  },
  solution_icon_1: { 
    type: 'string' as const, 
    default: '✅' 
  },
  solution_icon_2: { 
    type: 'string' as const, 
    default: '✅' 
  },
  solution_icon_3: { 
    type: 'string' as const, 
    default: '✅' 
  }
};

// CompetitorCallouts component - Direct competitor comparison with issues/solutions
export default function CompetitorCallouts(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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

  // Create typography styles
  const h3Style = getTypographyStyle('h3');

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

  // Icon edit handlers
  const handleIssueIconEdit = (index: number, value: string) => {
    const iconField = `issue_icon_${index + 1}` as keyof CompetitorCalloutsContent;
    handleContentUpdate(iconField, value);
  };

  const handleSolutionIconEdit = (index: number, value: string) => {
    const iconField = `solution_icon_${index + 1}` as keyof CompetitorCalloutsContent;
    handleContentUpdate(iconField, value);
  };

  // Get icon values
  const getIssueIconValue = (index: number) => {
    const iconFields = ['issue_icon_1', 'issue_icon_2', 'issue_icon_3'];
    return blockContent[iconFields[index] as keyof CompetitorCalloutsContent] || '⚠️';
  };

  const getSolutionIconValue = (index: number) => {
    const iconFields = ['solution_icon_1', 'solution_icon_2', 'solution_icon_3'];
    return blockContent[iconFields[index] as keyof CompetitorCalloutsContent] || '✅';
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
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            mode={mode}
            level="h1"
            backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
            sectionBackground={sectionBackground}
            colorTokens={colorTokens}
            className="mb-4"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              value={blockContent.subheadline || 'Add subheadline...'}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              mode={mode}
              backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
              variant="body"
              sectionBackground={sectionBackground}
              colorTokens={colorTokens}
              className={`max-w-3xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
            />
          )}
        </div>

        {/* Competitor Callouts */}
        <div className="space-y-8">
          {competitorNames.map((name, index) => (
            <div 
              key={index} 
              className={`rounded-lg ${colorTokens.bgNeutral} border border-gray-200 p-8 hover:shadow-lg transition-shadow`}
            >
              <div className="grid md:grid-cols-3 gap-6 items-center">
                {/* Competitor Info */}
                <div className="md:col-span-1">
                  {mode !== 'preview' ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleCompetitorNameUpdate(index, e.target.value)}
                      style={h3Style}
                      className={`bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-2 ${colorTokens.textPrimary}`}
                    />
                  ) : (
                    <h3 style={h3Style} className={`mb-2 ${colorTokens.textPrimary}`}>
                      {name}
                    </h3>
                  )}
                  
                  <div className="flex items-start group/icon-edit">
                    <div className="mr-2 mt-0.5 flex-shrink-0">
                      <IconEditableText
                        mode={mode}
                        value={getIssueIconValue(index)}
                        onEdit={(value) => handleIssueIconEdit(index, value)}
                        backgroundType={backgroundType as any}
                        colorTokens={colorTokens}
                        iconSize="sm"
                        className="text-xl text-red-500"
                        sectionId={sectionId}
                        elementKey={`issue_icon_${index + 1}`}
                      />
                    </div>
                    {mode !== 'preview' ? (
                      <textarea
                        value={competitorIssues[index]}
                        onChange={(e) => handleCompetitorIssueUpdate(index, e.target.value)}
                        className={`flex-1 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none ${colorTokens.textSecondary}`}
                        rows={2}
                      />
                    ) : (
                      <p className={`text-sm ${colorTokens.textSecondary}`}>
                        {competitorIssues[index]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex justify-center">
                  <svg className={`w-12 h-12 text-primary transform rotate-0 md:rotate-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Our Solution */}
                <div className="md:col-span-1">
                  <h4 className={`font-semibold mb-2 text-primary`}>
                    Our Solution
                  </h4>
                  
                  <div className="flex items-start group/icon-edit">
                    <div className="mr-2 mt-0.5 flex-shrink-0">
                      <IconEditableText
                        mode={mode}
                        value={getSolutionIconValue(index)}
                        onEdit={(value) => handleSolutionIconEdit(index, value)}
                        backgroundType={backgroundType as any}
                        colorTokens={colorTokens}
                        iconSize="sm"
                        className="text-xl text-primary"
                        sectionId={sectionId}
                        elementKey={`solution_icon_${index + 1}`}
                      />
                    </div>
                    {mode !== 'preview' ? (
                      <textarea
                        value={ourSolutions[index]}
                        onChange={(e) => handleOurSolutionUpdate(index, e.target.value)}
                        className={`flex-1 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none ${colorTokens.textPrimary}`}
                        rows={2}
                      />
                    ) : (
                      <p className={`text-sm font-medium ${colorTokens.textPrimary}`}>
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
            <div className={`inline-flex items-center bg-primary bg-opacity-10 px-6 py-3 rounded-full`}>
              <svg className={`w-5 h-5 text-primary mr-2`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                value={blockContent.trust_badge || 'Add trust badge...'}
                onEdit={(value) => handleContentUpdate('trust_badge', value)}
                mode={mode}
                backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
                variant="body"
                sectionBackground={sectionBackground}
                colorTokens={colorTokens}
                className={`font-medium ${!blockContent.trust_badge && mode === 'edit' ? 'opacity-50' : ''}`}
              />
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}