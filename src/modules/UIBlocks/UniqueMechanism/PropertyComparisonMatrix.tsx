// components/layout/PropertyComparisonMatrix.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

interface ComparisonRow {
  id: string;
  property: string;
  us_value: string;
  competitor_value: string;
}

interface PropertyComparisonMatrixContent {
  headline: string;
  subheadline?: string;
  feature_header: string;
  us_header: string;
  competitors_header: string;
  footer_text?: string;
  comparison_rows: ComparisonRow[];
}

const DEFAULT_ROWS: ComparisonRow[] = [
  { id: 'r1', property: 'Speed', us_value: 'Ultra-Fast', competitor_value: 'Slow' },
  { id: 'r2', property: 'Accuracy', us_value: '99.9%', competitor_value: '95%' },
  { id: 'r3', property: 'Security', us_value: 'Enterprise', competitor_value: 'Basic' },
  { id: 'r4', property: 'Scalability', us_value: 'Unlimited', competitor_value: 'Limited' },
  { id: 'r5', property: 'Support', us_value: '24/7', competitor_value: 'Business Hours' },
];

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How We Compare' },
  subheadline: { type: 'string' as const, default: '' },
  feature_header: { type: 'string' as const, default: 'Feature' },
  us_header: { type: 'string' as const, default: 'Us' },
  competitors_header: { type: 'string' as const, default: 'Competitors' },
  footer_text: { type: 'string' as const, default: '' },
  comparison_rows: { type: 'array' as const, default: DEFAULT_ROWS }
};

export default function PropertyComparisonMatrix(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, sectionBackground, handleContentUpdate } = useLayoutComponent<PropertyComparisonMatrixContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Theme-based color mapping - now with theme-aware "Us" column + background highlight
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        headerBg: 'bg-orange-50',
        headerBorder: 'border-orange-300',
        usColumnBg: 'bg-orange-50/70',
        usColumnText: 'text-orange-600',
        usHeaderText: 'text-orange-600',
        competitorText: 'text-gray-500',
        cardBorder: 'border-orange-200',
        cardShadow: 'shadow-md shadow-orange-100/50',
        rowBorder: 'border-orange-100'
      },
      cool: {
        headerBg: 'bg-blue-50',
        headerBorder: 'border-blue-300',
        usColumnBg: 'bg-blue-50/70',
        usColumnText: 'text-blue-600',
        usHeaderText: 'text-blue-600',
        competitorText: 'text-gray-500',
        cardBorder: 'border-blue-200',
        cardShadow: 'shadow-md shadow-blue-100/50',
        rowBorder: 'border-blue-100'
      },
      neutral: {
        headerBg: 'bg-gray-100',
        headerBorder: 'border-gray-300',
        usColumnBg: 'bg-gray-50',
        usColumnText: 'text-gray-700',
        usHeaderText: 'text-gray-700',
        competitorText: 'text-gray-500',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-lg',
        rowBorder: 'border-gray-200'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Card styles from luminance-based system
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiTheme
  }), [sectionBackground, uiTheme]);

  // Get comparison rows from content
  const comparisonRows = blockContent.comparison_rows || DEFAULT_ROWS;

  // Handle row field update
  const handleRowUpdate = (rowId: string, field: keyof ComparisonRow, value: string) => {
    const updatedRows = comparisonRows.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    );
    (handleContentUpdate as any)('comparison_rows', updatedRows);
  };

  // Handle adding a new row
  const handleAddRow = () => {
    const newRow: ComparisonRow = {
      id: `r${Date.now()}`,
      property: 'New Property',
      us_value: 'Our advantage',
      competitor_value: 'Their limitation'
    };
    (handleContentUpdate as any)('comparison_rows', [...comparisonRows, newRow]);
  };

  // Handle removing a row
  const handleRemoveRow = (rowId: string) => {
    const updatedRows = comparisonRows.filter(row => row.id !== rowId);
    (handleContentUpdate as any)('comparison_rows', updatedRows);
  };

  // Typography styles
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection sectionId={sectionId} sectionType="PropertyComparisonMatrix" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-5xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-4" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />

        {/* Optional subheadline */}
        {(blockContent.subheadline || mode !== 'preview') && (
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.subheadline || ''}
            onEdit={(value) => handleContentUpdate('subheadline', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            variant="body"
            className="text-center mb-12 max-w-2xl mx-auto"
            placeholder="Add a subheadline..."
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key="subheadline"
          />
        )}

        <div className={`${cardStyles.bg} ${cardStyles.blur} rounded-xl overflow-hidden ${cardStyles.border} ${cardStyles.shadow}`}>
          {/* Header Row - stronger border */}
          <div className={`grid grid-cols-3 ${themeColors.headerBg} border-b-2 ${themeColors.headerBorder}`}>
            <div style={bodyStyle} className={`p-5 font-bold ${cardStyles.textHeading}`}>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.feature_header || ''}
                onEdit={(value) => handleContentUpdate('feature_header', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-bold"
                placeholder="Feature"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="feature_header"
              />
            </div>
            <div style={bodyStyle} className={`p-5 font-bold ${themeColors.usHeaderText} ${themeColors.usColumnBg} text-center`}>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.us_header || ''}
                onEdit={(value) => handleContentUpdate('us_header', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-bold text-center"
                placeholder="Us"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="us_header"
              />
            </div>
            <div style={bodyStyle} className={`p-5 font-bold ${cardStyles.textMuted} text-center`}>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.competitors_header || ''}
                onEdit={(value) => handleContentUpdate('competitors_header', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-bold text-center"
                placeholder="Competitors"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="competitors_header"
              />
            </div>
          </div>
          {/* Data Rows - with "Us" column highlight */}
          {comparisonRows.map((row) => (
            <div key={row.id} className={`relative group grid grid-cols-3 border-b ${themeColors.rowBorder} last:border-b-0`}>
              <div style={bodyStyle} className={`p-5 font-medium ${cardStyles.textHeading}`}>
                <EditableAdaptiveText
                  mode={mode}
                  value={row.property}
                  onEdit={(value) => handleRowUpdate(row.id, 'property', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-medium"
                  placeholder="Property name"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`property_${row.id}`}
                />
              </div>
              <div style={bodyStyle} className={`p-5 text-center ${themeColors.usColumnText} ${themeColors.usColumnBg} font-semibold`}>
                <EditableAdaptiveText
                  mode={mode}
                  value={row.us_value}
                  onEdit={(value) => handleRowUpdate(row.id, 'us_value', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-center font-semibold ${themeColors.usColumnText}`}
                  placeholder="Our value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`us_value_${row.id}`}
                />
              </div>
              <div style={bodyStyle} className={`p-5 text-center ${cardStyles.textMuted} relative`}>
                <EditableAdaptiveText
                  mode={mode}
                  value={row.competitor_value}
                  onEdit={(value) => handleRowUpdate(row.id, 'competitor_value', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-center ${cardStyles.textMuted}`}
                  placeholder="Competitor value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`competitor_value_${row.id}`}
                />

                {/* Delete button - only show in edit mode and if more than 1 row */}
                {mode !== 'preview' && comparisonRows.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRow(row.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove this property"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && comparisonRows.length < 8 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAddRow}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Row</span>
            </button>
          </div>
        )}

        {/* Optional footer text for conversion nudge */}
        {(blockContent.footer_text || mode !== 'preview') && (
          <div className="mt-8 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.footer_text || ''}
              onEdit={(value) => handleContentUpdate('footer_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-center"
              placeholder="Add a conversion nudge..."
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="footer_text"
            />
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'PropertyComparisonMatrix', category: 'Unique Mechanism', description: 'Property comparison matrix vs competitors', defaultBackgroundType: 'neutral' as const };
