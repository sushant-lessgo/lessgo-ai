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
interface YouVsThemHighlightContent {
  headline: string;
  subheadline?: string;
  them_headline: string;
  them_points: string;
  you_headline: string;
  you_points: string;
  cta_text?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Why Teams Choose Us Over the Alternatives' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Stop struggling with outdated tools. Get a solution built for modern teams.' 
  },
  them_headline: { 
    type: 'string' as const, 
    default: 'What You Deal With Now' 
  },
  them_points: { 
    type: 'string' as const, 
    default: 'Hours wasted on manual tasks|Constant switching between tools|No real-time collaboration|Outdated, clunky interfaces|Limited customization options|Expensive add-ons and upgrades' 
  },
  you_headline: { 
    type: 'string' as const, 
    default: 'What You Get With Us' 
  },
  you_points: { 
    type: 'string' as const, 
    default: 'Automated workflows save 10+ hours/week|All-in-one platform for your team|Real-time collaboration built-in|Modern, intuitive interface|Fully customizable to your needs|Everything included, no hidden costs' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Make the Switch Today' 
  }
};

// YouVsThemHighlight component - Side-by-side pain vs gain comparison
export default function YouVsThemHighlight(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  
  const { 
    mode, 
    blockContent, 
    colorTokens, 
    getTextStyle, 
    sectionBackground, 
    handleContentUpdate 
  } = useLayoutComponent<YouVsThemHighlightContent>({ 
    ...props, 
    contentSchema: CONTENT_SCHEMA 
  });

  // Parse list data
  const themPoints = parsePipeData(blockContent.them_points);
  const youPoints = parsePipeData(blockContent.you_points);

  // Update handlers for lists
  const handleThemPointUpdate = (index: number, value: string) => {
    const newPoints = [...themPoints];
    newPoints[index] = value;
    handleContentUpdate('them_points', newPoints.join('|'));
  };

  const handleYouPointUpdate = (index: number, value: string) => {
    const newPoints = [...youPoints];
    newPoints[index] = value;
    handleContentUpdate('you_points', newPoints.join('|'));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="YouVsThemHighlight"
      backgroundType={backgroundType || 'secondary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h1"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || 'Add subheadline...'}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              className={`max-w-2xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              sectionId={sectionId}
              elementKey="subheadline"
              variant="body"
            />
          )}
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Them Column - Pain Points */}
          <div className={`rounded-lg p-8 ${colorTokens.bgNeutral || 'bg-gray-50'} border border-gray-200`}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.them_headline || ''}
                onEdit={(value) => handleContentUpdate('them_headline', value)}
                level="h3"
                backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
                colorTokens={colorTokens}
                sectionId={sectionId}
                elementKey="them_headline"
                sectionBackground={sectionBackground}
              />
            </div>
            
            <ul className="space-y-4">
              {themPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1 flex-shrink-0">✗</span>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => handleThemPointUpdate(index, e.target.value)}
                      className={`flex-1 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 ${colorTokens.textSecondary}`}
                    />
                  ) : (
                    <span className={colorTokens.textSecondary}>
                      {point}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* You Column - Benefits */}
          <div className={`rounded-lg p-8 ${'bg-primary'} bg-opacity-10 border-2 border-${'primary'}`}>
            <div className="flex items-center mb-6">
              <div className={`w-12 h-12 rounded-full ${'bg-primary'} flex items-center justify-center mr-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.you_headline || ''}
                onEdit={(value) => handleContentUpdate('you_headline', value)}
                level="h3"
                backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
                colorTokens={colorTokens}
                sectionId={sectionId}
                elementKey="you_headline"
                sectionBackground={sectionBackground}
              />
            </div>
            
            <ul className="space-y-4">
              {youPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className={`text-primary mr-3 mt-1 flex-shrink-0`}>✓</span>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => handleYouPointUpdate(index, e.target.value)}
                      className={`flex-1 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 ${colorTokens.textPrimary}`}
                    />
                  ) : (
                    <span className={colorTokens.textPrimary}>
                      {point}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        {(blockContent.cta_text || mode === 'edit') && (
          <div className="text-center">
            <button className={`${'bg-primary'} text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity`}>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.cta_text || 'Add CTA text...'}
                onEdit={(value) => handleContentUpdate('cta_text', value)}
                backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
                colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                className={!blockContent.cta_text && mode === 'edit' ? 'opacity-75' : ''}
                sectionId={sectionId}
                elementKey="cta_text"
                variant="body"
              />
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}