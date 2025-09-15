import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface EmojiOutcomeGridProps extends LayoutComponentProps {}

// Emoji outcome item structure
interface EmojiOutcome {
  emoji: string;
  outcome: string;
  description: string;
  id: string;
}

// Content interface for EmojiOutcomeGrid layout
interface EmojiOutcomeGridContent {
  headline: string;
  emojis: string;
  outcomes: string;
  descriptions: string;
  subheadline?: string;
  footer_text?: string;
}

// Content schema for EmojiOutcomeGrid layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'What You\'ll Achieve with Our Solution' },
  emojis: { type: 'string' as const, default: '🚀|💰|⚡|🎯|📈|⭐' },
  outcomes: { type: 'string' as const, default: 'Faster Launch|Higher Revenue|Lightning Speed|Perfect Accuracy|Exponential Growth|5-Star Results' },
  descriptions: { type: 'string' as const, default: 'Get your products to market 3x faster with streamlined workflows|Increase revenue by up to 200% with optimized processes|Process data in milliseconds instead of hours|Achieve 99.9% accuracy with AI-powered validation|Scale your business exponentially with automated systems|Delight customers and earn consistent 5-star reviews' },
  subheadline: { type: 'string' as const, default: 'Real outcomes that creators and founders love seeing in their business' },
  footer_text: { type: 'string' as const, default: 'Join 10,000+ creators already seeing these results' }
};

// Parse emoji outcome data from pipe-separated strings
const parseOutcomeData = (emojis: string, outcomes: string, descriptions: string): EmojiOutcome[] => {
  const emojiList = emojis.split('|').map(e => e.trim()).filter(e => e);
  const outcomeList = outcomes.split('|').map(o => o.trim()).filter(o => o);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  return emojiList.map((emoji, index) => ({
    id: `outcome-${index}`,
    emoji,
    outcome: outcomeList[index] || 'Great Result',
    description: descriptionList[index] || 'Amazing outcomes await you'
  }));
};

// Helper function to add a new outcome
const addOutcome = (emojis: string, outcomes: string, descriptions: string): { newEmojis: string; newOutcomes: string; newDescriptions: string } => {
  const emojiList = emojis.split('|').map(e => e.trim()).filter(e => e);
  const outcomeList = outcomes.split('|').map(o => o.trim()).filter(o => o);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Add new outcome with default content
  emojiList.push('🎯');
  outcomeList.push('New Outcome');
  descriptionList.push('Amazing benefit description');

  return {
    newEmojis: emojiList.join('|'),
    newOutcomes: outcomeList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove an outcome
const removeOutcome = (emojis: string, outcomes: string, descriptions: string, indexToRemove: number): { newEmojis: string; newOutcomes: string; newDescriptions: string } => {
  const emojiList = emojis.split('|').map(e => e.trim()).filter(e => e);
  const outcomeList = outcomes.split('|').map(o => o.trim()).filter(o => o);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Remove the outcome at the specified index
  if (indexToRemove >= 0 && indexToRemove < emojiList.length) {
    emojiList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < outcomeList.length) {
    outcomeList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newEmojis: emojiList.join('|'),
    newOutcomes: outcomeList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Individual Outcome Card Component
const OutcomeCard = ({
  outcome,
  index,
  mode,
  sectionId,
  onEmojiEdit,
  onOutcomeEdit,
  onDescriptionEdit,
  onRemoveOutcome,
  canRemove = true
}: {
  outcome: EmojiOutcome;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onEmojiEdit: (index: number, value: string) => void;
  onOutcomeEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveOutcome?: (index: number) => void;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className={`relative group/outcome-card-${index} text-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveOutcome && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveOutcome(index);
          }}
          className={`absolute top-4 right-4 opacity-0 group-hover/outcome-card-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
          title="Remove this outcome"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Emoji Icon */}
      <div className="mb-4">
        <div className="text-5xl mx-auto w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <IconEditableText
            mode={mode}
            value={outcome.emoji}
            onEdit={(value) => onEmojiEdit(index, value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="xl"
            className="text-5xl"
            placeholder="🚀"
            sectionId={sectionId}
            elementKey={`emoji_outcome_${index}`}
          />
        </div>
      </div>

      {/* Outcome Title */}
      <div className="mb-4">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onOutcomeEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
          >
            {outcome.outcome}
          </div>
        ) : (
          <h3 
            className="font-bold text-gray-900"
          >
            {outcome.outcome}
          </h3>
        )}
      </div>

      {/* Description */}
      <div>
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
          >
            {outcome.description}
          </div>
        ) : (
          <p 
            className="text-gray-600 leading-relaxed"
          >
            {outcome.description}
          </p>
        )}
      </div>

      {/* Sparkle Effect on Hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
      </div>
    </div>
  );
};

export default function EmojiOutcomeGrid(props: EmojiOutcomeGridProps) {
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
  } = useLayoutComponent<EmojiOutcomeGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse outcome data
  const outcomes = parseOutcomeData(
    blockContent.emojis,
    blockContent.outcomes,
    blockContent.descriptions
  );

  // Handle individual editing
  const handleEmojiEdit = (index: number, value: string) => {
    const emojiList = blockContent.emojis.split('|');
    emojiList[index] = value;
    handleContentUpdate('emojis', emojiList.join('|'));
  };

  const handleOutcomeEdit = (index: number, value: string) => {
    const outcomeList = blockContent.outcomes.split('|');
    outcomeList[index] = value;
    handleContentUpdate('outcomes', outcomeList.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptionList = blockContent.descriptions.split('|');
    descriptionList[index] = value;
    handleContentUpdate('descriptions', descriptionList.join('|'));
  };

  // Handle adding a new outcome
  const handleAddOutcome = () => {
    const { newEmojis, newOutcomes, newDescriptions } = addOutcome(blockContent.emojis, blockContent.outcomes, blockContent.descriptions);
    handleContentUpdate('emojis', newEmojis);
    handleContentUpdate('outcomes', newOutcomes);
    handleContentUpdate('descriptions', newDescriptions);
  };

  // Handle removing an outcome
  const handleRemoveOutcome = (indexToRemove: number) => {
    const { newEmojis, newOutcomes, newDescriptions } = removeOutcome(blockContent.emojis, blockContent.outcomes, blockContent.descriptions, indexToRemove);
    handleContentUpdate('emojis', newEmojis);
    handleContentUpdate('outcomes', newOutcomes);
    handleContentUpdate('descriptions', newDescriptions);
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="EmojiOutcomeGrid"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline describing the outcomes creators will achieve..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Outcomes Grid */}
        <div className={`grid gap-8 relative ${
          outcomes.length <= 3 ? 'md:grid-cols-3 max-w-4xl mx-auto' :
          outcomes.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          outcomes.length === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {outcomes.map((outcome, index) => (
            <div key={outcome.id} className="relative">
              <OutcomeCard
                outcome={outcome}
                index={index}
                mode={mode}
                sectionId={sectionId}
                onEmojiEdit={handleEmojiEdit}
                onOutcomeEdit={handleOutcomeEdit}
                onDescriptionEdit={handleDescriptionEdit}
                onRemoveOutcome={handleRemoveOutcome}
                canRemove={outcomes.length > 1}
              />
            </div>
          ))}
        </div>

        {/* Add Outcome Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && outcomes.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddOutcome}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Outcome</span>
            </button>
          </div>
        )}

        {/* Success Animation Elements */}
        <div className="relative mt-16">
          {/* Floating Success Indicators */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 text-yellow-400 animate-bounce delay-100">
            ⭐
          </div>
        </div>

        {/* Footer Section */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full text-purple-800">
              <span className="text-xl mr-2">🎯</span>
              {mode !== 'preview' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('footer_text', e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text font-medium"
                >
                  {blockContent.footer_text}
                </div>
              ) : (
                <span className="font-medium">{blockContent.footer_text}</span>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'EmojiOutcomeGrid',
  category: 'Results',
  description: 'Visual outcome grid with emojis designed for creators and casual audiences',
  tags: ['outcomes', 'emojis', 'visual', 'creators', 'friendly', 'results'],
  features: [
    'Emoji-driven visual outcomes for engagement',
    'Hover animations and sparkle effects',
    'Optimized for creator and founder audiences',
    'Flexible grid layout with responsive design',
    'Individual editing for emojis, titles, and descriptions',
    'Floating success animation elements'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    emojis: 'Pipe-separated list of emojis for each outcome',
    outcomes: 'Pipe-separated list of outcome titles',
    descriptions: 'Pipe-separated list of outcome descriptions',
    subheadline: 'Optional subheading for context',
    footer_text: 'Optional footer text with social proof'
  },
  examples: [
    'Creator tool benefits showcase',
    'Founder success outcomes',
    'App feature benefits visualization',
    'Course completion achievements'
  ]
};