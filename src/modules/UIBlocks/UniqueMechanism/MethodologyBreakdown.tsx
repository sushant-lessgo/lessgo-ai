import React, { useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';

interface MethodologyBreakdownContent {
  headline: string;
  methodology_name: string;
  methodology_description: string;
  principles: string;
  principle_details: string;
  principle_icon_1?: string;
  principle_icon_2?: string;
  principle_icon_3?: string;
  principle_icon_4?: string;
  principle_icon_5?: string;
  principle_icon_6?: string;
  result_metrics?: string;
  result_labels?: string;
  results_title?: string;
  methodology_icon?: string;
}

interface PrincipleItem {
  name: string;
  detail: string;
  id: string;
}

interface ResultItem {
  metric: string;
  label: string;
  id: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'The Science Behind Our Success' },
  methodology_name: { type: 'string' as const, default: 'Adaptive Intelligence Framework™' },
  methodology_description: { type: 'string' as const, default: 'Our proprietary methodology combines machine learning, behavioral psychology, and real-time optimization to deliver unprecedented results.' },
  principles: { type: 'string' as const, default: 'Continuous Learning|Adaptive Optimization|Data-Driven Decisions' },
  principle_details: { type: 'string' as const, default: 'System continuously learns from new data and user interactions|Algorithms automatically adjust strategies based on performance|Every decision backed by comprehensive data analysis' },
  principle_icon_1: { type: 'string' as const, default: '🧠' },
  principle_icon_2: { type: 'string' as const, default: '⚙️' },
  principle_icon_3: { type: 'string' as const, default: '📊' },
  principle_icon_4: { type: 'string' as const, default: '🎯' },
  principle_icon_5: { type: 'string' as const, default: '🚀' },
  principle_icon_6: { type: 'string' as const, default: '💡' },
  result_metrics: { type: 'string' as const, default: '300%|85%|99.7%|24/7' },
  result_labels: { type: 'string' as const, default: 'Performance Increase|Time Saved|Accuracy Rate|Autonomous Operation' },
  results_title: { type: 'string' as const, default: 'Proven Results' },
  methodology_icon: { type: 'string' as const, default: '🧠' }
};

const parsePrincipleData = (principles: string, details: string): PrincipleItem[] => {
  const principleList = principles.split('|').map(p => p.trim()).filter(p => p);
  const detailList = details.split('|').map(d => d.trim()).filter(d => d);

  return principleList.map((name, index) => ({
    id: `principle-${index}`,
    name,
    detail: detailList[index] || 'Detail not provided.'
  }));
};

const parseResultData = (metrics: string, labels: string): ResultItem[] => {
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const labelList = labels.split('|').map(l => l.trim()).filter(l => l);

  return metricList.map((metric, index) => ({
    id: `result-${index}`,
    metric,
    label: labelList[index] || 'Result'
  }));
};

const getPrincipleIcon = (blockContent: MethodologyBreakdownContent, index: number) => {
  const iconFields = [
    blockContent.principle_icon_1,
    blockContent.principle_icon_2,
    blockContent.principle_icon_3,
    blockContent.principle_icon_4,
    blockContent.principle_icon_5,
    blockContent.principle_icon_6
  ];
  return iconFields[index] || '🎯';
};

const addPrinciple = (principles: string, details: string): { newPrinciples: string; newDetails: string } => {
  const principleList = principles.split('|').map(p => p.trim()).filter(p => p);
  const detailList = details.split('|').map(d => d.trim()).filter(d => d);

  principleList.push('New Principle');
  detailList.push('Describe this methodology principle.');

  return {
    newPrinciples: principleList.join('|'),
    newDetails: detailList.join('|')
  };
};

const removePrinciple = (principles: string, details: string, indexToRemove: number): { newPrinciples: string; newDetails: string } => {
  const principleList = principles.split('|').map(p => p.trim()).filter(p => p);
  const detailList = details.split('|').map(d => d.trim()).filter(d => d);

  if (indexToRemove >= 0 && indexToRemove < principleList.length) {
    principleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < detailList.length) {
    detailList.splice(indexToRemove, 1);
  }

  return {
    newPrinciples: principleList.join('|'),
    newDetails: detailList.join('|')
  };
};

const PrincipleCard = ({
  principle,
  index,
  mode,
  sectionId,
  onNameEdit,
  onDetailEdit,
  onRemovePrinciple,
  blockContent,
  colorTokens,
  handleContentUpdate,
  canRemove = true,
  sectionBackground
}: {
  principle: PrincipleItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onNameEdit: (index: number, value: string) => void;
  onDetailEdit: (index: number, value: string) => void;
  onRemovePrinciple?: (index: number) => void;
  blockContent: MethodologyBreakdownContent;
  colorTokens: any;
  handleContentUpdate: (field: keyof MethodologyBreakdownContent, value: string) => void;
  canRemove?: boolean;
  sectionBackground?: string;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className="relative group/principle bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
        <IconEditableText
          mode={mode}
          value={getPrincipleIcon(blockContent, index)}
          onEdit={(value) => {
            const iconField = `principle_icon_${index + 1}` as keyof MethodologyBreakdownContent;
            handleContentUpdate(iconField, value);
          }}
          backgroundType="primary"
          colorTokens={colorTokens}
          iconSize="md"
          className="text-white"
          sectionId={sectionId}
          elementKey={`principle_icon_${index + 1}`}
        />
      </div>

      {mode !== 'preview' ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
          className="outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded px-1 mb-3 cursor-text hover:bg-gray-50 font-bold text-gray-900 text-xl"
        >
          {principle.name}
        </div>
      ) : (
        <h3 className="font-bold text-gray-900 text-xl mb-3">{principle.name}</h3>
      )}

      {mode !== 'preview' ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onDetailEdit(index, e.currentTarget.textContent || '')}
          className="outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded px-1 min-h-[48px] cursor-text hover:bg-gray-50 text-gray-600"
        >
          {principle.detail}
        </div>
      ) : (
        <p className="text-gray-600">{principle.detail}</p>
      )}

      {mode === 'edit' && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemovePrinciple?.(index);
          }}
          className="opacity-0 group-hover/principle:opacity-100 absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
          title="Remove this principle"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function MethodologyBreakdown(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<MethodologyBreakdownContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  // Auto-populate icons on initial generation
  useEffect(() => {
    if (mode === 'edit' && blockContent.principles) {
      const principles = parsePrincipleData(blockContent.principles, blockContent.principle_details);

      principles.forEach((_, index) => {
        const iconField = `principle_icon_${index + 1}` as keyof MethodologyBreakdownContent;
        if (!blockContent[iconField] || blockContent[iconField] === '') {
          const categories = ['method', 'process', 'optimization', 'system', 'workflow', 'efficiency'];
          const icon = getRandomIconFromCategory(categories[index % categories.length]);
          handleContentUpdate(iconField, icon);
        }
      });
    }
  }, [blockContent.principles]);

  const principles = parsePrincipleData(
    blockContent.principles || '',
    blockContent.principle_details || ''
  );

  const results = blockContent.result_metrics && blockContent.result_labels
    ? parseResultData(blockContent.result_metrics, blockContent.result_labels)
    : [];

  const handlePrincipleNameEdit = (index: number, newName: string) => {
    const principleNames = (blockContent.principles || '').split('|').map(p => p.trim());
    principleNames[index] = newName;
    handleContentUpdate('principles', principleNames.join('|'));
  };

  const handlePrincipleDetailEdit = (index: number, newDetail: string) => {
    const details = (blockContent.principle_details || '').split('|').map(d => d.trim());
    details[index] = newDetail;
    handleContentUpdate('principle_details', details.join('|'));
  };

  const handleAddPrinciple = () => {
    const { newPrinciples, newDetails } = addPrinciple(
      blockContent.principles || '',
      blockContent.principle_details || ''
    );
    handleContentUpdate('principles', newPrinciples);
    handleContentUpdate('principle_details', newDetails);
  };

  const handleRemovePrinciple = (index: number) => {
    const { newPrinciples, newDetails } = removePrinciple(
      blockContent.principles || '',
      blockContent.principle_details || '',
      index
    );
    handleContentUpdate('principles', newPrinciples);
    handleContentUpdate('principle_details', newDetails);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MethodologyBreakdown"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
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
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Methodology Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-12 text-white text-center mb-12">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconEditableText
              mode={mode}
              value={blockContent.methodology_icon || '🧠'}
              onEdit={(value) => handleContentUpdate('methodology_icon', value)}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="xl"
              className="text-white text-3xl"
              sectionId={sectionId}
              elementKey="methodology_icon"
            />
          </div>
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.methodology_name || ''}
            onEdit={(value) => handleContentUpdate('methodology_name', value)}
            level="h2"
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
            className="text-white mb-4"
            sectionId={sectionId}
            elementKey="methodology_name"
            sectionBackground="bg-purple-600"
          />
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.methodology_description || ''}
            onEdit={(value) => handleContentUpdate('methodology_description', value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textSecondary: 'text-purple-100' }}
            variant="body"
            className="text-purple-100 text-lg max-w-3xl mx-auto"
            sectionId={sectionId}
            elementKey="methodology_description"
            sectionBackground="bg-purple-600"
          />
        </div>

        {/* Key Principles */}
        <div className={`grid gap-6 lg:gap-8 mb-12 ${
          principles.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
          principles.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          principles.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          principles.length === 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {principles.map((principle, index) => (
            <PrincipleCard
              key={principle.id}
              principle={principle}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onNameEdit={handlePrincipleNameEdit}
              onDetailEdit={handlePrincipleDetailEdit}
              onRemovePrinciple={handleRemovePrinciple}
              blockContent={blockContent}
              colorTokens={colorTokens}
              handleContentUpdate={handleContentUpdate}
              canRemove={principles.length > 3}
              sectionBackground={sectionBackground}
            />
          ))}
        </div>

        {mode === 'edit' && principles.length < 6 && (
          <div className="mb-12 text-center">
            <button
              onClick={handleAddPrinciple}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Principle
            </button>
          </div>
        )}

        {/* Proven Results Section */}
        {results.length > 0 && (
          <div className="mt-16">
            {blockContent.results_title && (
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.results_title}
                onEdit={(value) => handleContentUpdate('results_title', value)}
                level="h3"
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
                colorTokens={colorTokens}
                className="text-center mb-8"
                sectionId={sectionId}
                elementKey="results_title"
                sectionBackground={sectionBackground}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {results.map((result, index) => (
                <div key={result.id} className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const metrics = (blockContent.result_metrics || '').split('|');
                          metrics[index] = e.currentTarget.textContent || '';
                          handleContentUpdate('result_metrics', metrics.join('|'));
                        }}
                        className="outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-purple-50"
                      >
                        {result.metric}
                      </div>
                    ) : (
                      <span>{result.metric}</span>
                    )}
                  </div>
                  <div className="text-gray-600">
                    {mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const labels = (blockContent.result_labels || '').split('|');
                          labels[index] = e.currentTarget.textContent || '';
                          handleContentUpdate('result_labels', labels.join('|'));
                        }}
                        className="outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                      >
                        {result.label}
                      </div>
                    ) : (
                      <span>{result.label}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'MethodologyBreakdown',
  category: 'Unique Mechanism',
  description: 'Break down your methodology with principles and proven results',
  defaultBackgroundType: 'secondary' as const
};