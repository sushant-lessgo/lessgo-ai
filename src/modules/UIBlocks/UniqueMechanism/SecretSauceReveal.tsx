import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getIcon } from '@/lib/getIcon';

// V2 Schema: Array-based secrets
interface SecretItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface SecretSauceRevealContent {
  headline: string;
  subheadline?: string;
  secrets: SecretItem[];
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Secret Sauce Revealed' },
  subheadline: { type: 'string' as const, default: '' },
  secrets: {
    type: 'array' as const,
    default: [
      { id: 's1', title: 'Quantum-Enhanced Machine Learning', description: 'We combine quantum computing principles with traditional machine learning to achieve processing speeds and accuracy levels impossible with conventional approaches.', icon: 'lucide:cpu' },
      { id: 's2', title: 'Adaptive Intelligence Framework', description: 'Our system learns and adapts in real-time, continuously improving its performance based on new data and user interactions.', icon: 'lucide:brain' },
      { id: 's3', title: 'Predictive Optimization Engine', description: 'Advanced algorithms predict future trends and automatically optimize operations before issues arise.', icon: 'lucide:trending-up' }
    ]
  }
};

const SecretCard = ({
  secret,
  index,
  mode,
  sectionId,
  onTitleEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemoveSecret,
  colorTokens,
  canRemove = true,
  sectionBackground,
  secretColors
}: {
  secret: SecretItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTitleEdit: (id: string, value: string) => void;
  onDescriptionEdit: (id: string, value: string) => void;
  onIconEdit: (id: string, value: string) => void;
  onRemoveSecret?: (id: string) => void;
  colorTokens: any;
  canRemove?: boolean;
  sectionBackground?: string;
  secretColors: {
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    iconBg: string;
    iconShadow: string;
    iconText: string;
    titleText: string;
    accentBar: string;
    addButtonBg: string;
    addButtonHover: string;
    focusRing: string;
    hoverShadow: string;
  };
}) => {
  // V2: Get icon - use stored value or derive from title/description
  const displayIcon = secret.icon
    ?? getIcon(undefined, { title: secret.title, description: secret.description })
    ?? 'lucide:flask-conical';

  return (
    <div className="group relative">
      <div className={`${secretColors.cardBg} rounded-2xl p-8 text-center relative overflow-hidden h-full border-2 ${secretColors.cardBorder} ${secretColors.cardHoverBorder} shadow-lg ${secretColors.hoverShadow} transition-all duration-300`}>
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${secretColors.accentBar} rounded-t-2xl`}></div>
        <div className="relative z-10">
          <div className={`w-14 h-14 ${secretColors.iconBg} ${secretColors.iconShadow} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <IconEditableText
              mode={mode}
              value={displayIcon}
              onEdit={(value) => onIconEdit(secret.id, value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              iconSize="lg"
              className={`${secretColors.iconText} text-2xl`}
              sectionId={sectionId}
              elementKey={`secret_icon_${secret.id}`}
            />
          </div>

          <h3 className={`${secretColors.titleText} font-bold text-xl mb-3`}>
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTitleEdit(secret.id, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 ${secretColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text`}
              >
                {secret.title}
              </div>
            ) : (
              <span>{secret.title}</span>
            )}
          </h3>

          <div className="text-gray-600">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(secret.id, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 ${secretColors.focusRing} focus:ring-opacity-50 rounded px-2 py-1 min-h-[48px] cursor-text hover:bg-gray-50 max-w-lg mx-auto`}
              >
                {secret.description}
              </div>
            ) : (
              <p className="max-w-lg mx-auto">{secret.description}</p>
            )}
          </div>
        </div>

        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSecret?.(secret.id);
            }}
            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this secret"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default function SecretSauceReveal(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<SecretSauceRevealContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Secret card colors by theme
  const getSecretColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBg: 'bg-white',
        cardBorder: 'border-orange-200',
        cardHoverBorder: 'hover:border-orange-400',
        iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
        iconShadow: 'shadow-lg shadow-orange-200',
        iconText: 'text-white',
        titleText: 'text-orange-900',
        accentBar: 'bg-gradient-to-r from-orange-400 to-red-500',
        addButtonBg: 'bg-orange-600',
        addButtonHover: 'hover:bg-orange-700',
        focusRing: 'focus:ring-orange-300',
        hoverShadow: 'hover:shadow-xl'
      },
      cool: {
        cardBg: 'bg-white',
        cardBorder: 'border-blue-200',
        cardHoverBorder: 'hover:border-blue-400',
        iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
        iconShadow: 'shadow-lg shadow-blue-200',
        iconText: 'text-white',
        titleText: 'text-blue-900',
        accentBar: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        addButtonBg: 'bg-blue-600',
        addButtonHover: 'hover:bg-blue-700',
        focusRing: 'focus:ring-blue-300',
        hoverShadow: 'hover:shadow-xl'
      },
      neutral: {
        cardBg: 'bg-white',
        cardBorder: 'border-purple-200',
        cardHoverBorder: 'hover:border-purple-400',
        iconBg: 'bg-gradient-to-br from-purple-400 to-indigo-500',
        iconShadow: 'shadow-lg shadow-purple-200',
        iconText: 'text-white',
        titleText: 'text-purple-900',
        accentBar: 'bg-gradient-to-r from-purple-400 to-indigo-500',
        addButtonBg: 'bg-purple-600',
        addButtonHover: 'hover:bg-purple-700',
        focusRing: 'focus:ring-purple-300',
        hoverShadow: 'hover:shadow-xl'
      }
    }[theme];
  };

  const secretColors = getSecretColors(theme);

  // V2: Get secrets array directly
  const secrets = blockContent.secrets || [];

  // V2: Array-based edit handlers
  const handleTitleEdit = (id: string, newTitle: string) => {
    const updatedSecrets = secrets.map(s =>
      s.id === id ? { ...s, title: newTitle } : s
    );
    (handleContentUpdate as any)('secrets', updatedSecrets);
  };

  const handleDescriptionEdit = (id: string, newDescription: string) => {
    const updatedSecrets = secrets.map(s =>
      s.id === id ? { ...s, description: newDescription } : s
    );
    (handleContentUpdate as any)('secrets', updatedSecrets);
  };

  const handleIconEdit = (id: string, newIcon: string) => {
    const updatedSecrets = secrets.map(s =>
      s.id === id ? { ...s, icon: newIcon } : s
    );
    (handleContentUpdate as any)('secrets', updatedSecrets);
  };

  const handleAddSecret = () => {
    if (secrets.length >= 4) return; // Enforce max:4
    const newSecret: SecretItem = {
      id: `s${Date.now()}`,
      title: 'New Secret',
      description: 'Describe this unique aspect of your solution.'
    };
    (handleContentUpdate as any)('secrets', [...secrets, newSecret]);
  };

  const handleRemoveSecret = (id: string) => {
    if (secrets.length <= 2) return; // Enforce min:2
    const updatedSecrets = secrets.filter(s => s.id !== id);
    (handleContentUpdate as any)('secrets', updatedSecrets);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SecretSauceReveal"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secrets.map((secret, index) => (
            <SecretCard
              key={secret.id}
              secret={secret}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
              onRemoveSecret={handleRemoveSecret}
              colorTokens={colorTokens}
              canRemove={secrets.length > 2}
              sectionBackground={sectionBackground}
              secretColors={secretColors}
            />
          ))}
        </div>

        {mode === 'edit' && secrets.length < 4 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddSecret}
              className={`inline-flex items-center gap-2 px-6 py-3 ${secretColors.addButtonBg} ${secretColors.addButtonHover} text-white rounded-lg transition-colors duration-200`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Secret
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SecretSauceReveal',
  category: 'Unique Mechanism',
  description: 'Reveal multiple secret sauce features or unique differentiators',
  defaultBackgroundType: 'primary' as const
};
