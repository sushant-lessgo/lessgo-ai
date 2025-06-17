import { generateColorTokens } from './colorTokens';

interface SideBySideBlocksProps {
  sectionId: string;
  className?: string;
  backgroundType?: 'primary' | 'secondary' | 'neutral' | 'divider';
}


export default function SideBySideBlocks({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: SideBySideBlocksProps) {
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // Generate color tokens from theme
  const colorTokens = generateColorTokens({
    baseColor: theme.baseColor,
    accentColor: theme.accentColor,
    sectionBackgrounds: theme.sectionBackgrounds
  });

  // Remove old themeStyles, replace with:
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="SideBySideBlocks"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${colorTokens.textPrimary}`}>
              {blockContent.headline}
            </h2>
          </ModeWrapper>

          {(blockContent.subheadline || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="subheadline"
              onEdit={(value) => handleContentUpdate('subheadline', value)}
            >
              <p className={`text-xl md:text-2xl mb-6 ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}>
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Side by Side Blocks */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Before Block */}
          <div className={`${colorTokens.surfaceCard} rounded-lg shadow-lg p-8 ${colorTokens.borderSubtle} border`}>
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 rounded-full mr-3 bg-red-500" />
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="before_label"
                onEdit={(value) => handleContentUpdate('before_label', value)}
              >
                <h3 className="text-xl font-semibold uppercase tracking-wide text-red-500">
                  {blockContent.before_label}
                </h3>
              </ModeWrapper>
            </div>

            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="before_description"
              onEdit={(value) => handleContentUpdate('before_description', value)}
            >
              <p className={`text-lg leading-relaxed ${colorTokens.textPrimary}`}>
                {blockContent.before_description}
              </p>
            </ModeWrapper>
          </div>

          {/* After Block */}
          <div className={`${colorTokens.surfaceCard} rounded-lg shadow-lg p-8 ${colorTokens.borderSubtle} border`}>
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 rounded-full mr-3 bg-green-500" />
              <ModeWrapper
                mode={mode}
                sectionId={sectionId}
                elementKey="after_label"
                onEdit={(value) => handleContentUpdate('after_label', value)}
              >
                <h3 className="text-xl font-semibold uppercase tracking-wide text-green-500">
                  {blockContent.after_label}
                </h3>
              </ModeWrapper>
            </div>

            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="after_description"
              onEdit={(value) => handleContentUpdate('after_description', value)}
            >
              <p className={`text-lg leading-relaxed ${colorTokens.textPrimary}`}>
                {blockContent.after_description}
              </p>
            </ModeWrapper>
          </div>
        </div>

        {/* Supporting Text */}
        {(blockContent.supporting_text || mode === 'edit') && (
          <div className="text-center">
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="supporting_text"
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
            >
              <p className={`text-lg max-w-3xl mx-auto ${colorTokens.textSecondary} ${!blockContent.supporting_text && mode === 'edit' ? 'opacity-50' : ''}`}>
                {blockContent.supporting_text || (mode === 'edit' ? 'Add optional supporting text...' : '')}
              </p>
            </ModeWrapper>
          </div>
        )}
      </div>
    </section>
  );
};