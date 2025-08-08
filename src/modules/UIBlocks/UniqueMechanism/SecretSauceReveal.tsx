// components/layout/SecretSauceReveal.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SecretSauceRevealContent {
  headline: string;
  secret_sauce: string;
  explanation: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Secret Sauce Revealed' },
  secret_sauce: { type: 'string' as const, default: 'Quantum-Enhanced Machine Learning' },
  explanation: { type: 'string' as const, default: 'We combine quantum computing principles with traditional machine learning to achieve processing speeds and accuracy levels impossible with conventional approaches. This breakthrough gives us a 10x advantage over competitors.' }
};

export default function SecretSauceReveal(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<SecretSauceRevealContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();

  return (
    <LayoutSection sectionId={sectionId} sectionType="SecretSauceReveal" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600 rounded-full -translate-y-24 translate-x-24 opacity-20"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔬</div>
            <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType="primary" colorTokens={{ ...colorTokens, textPrimary: 'text-white' }} className="text-white mb-6" sectionId={sectionId} elementKey="headline" sectionBackground="bg-purple-900" />
            <div className="bg-yellow-400 text-purple-900 px-6 py-3 rounded-full inline-block font-bold text-xl mb-6">
              <EditableAdaptiveText mode={mode} value={blockContent.secret_sauce || ''} onEdit={(value) => handleContentUpdate('secret_sauce', value)} backgroundType="neutral" colorTokens={{ ...colorTokens, textPrimary: 'text-purple-900' }} variant="body" className="font-bold" sectionId={sectionId} elementKey="secret_sauce" sectionBackground="bg-yellow-400" />
            </div>
            <EditableAdaptiveText mode={mode} value={blockContent.explanation || ''} onEdit={(value) => handleContentUpdate('explanation', value)} backgroundType="primary" colorTokens={{ ...colorTokens, textSecondary: 'text-purple-100' }} variant="body" className="text-purple-100 text-lg max-w-2xl mx-auto" sectionId={sectionId} elementKey="explanation" sectionBackground="bg-purple-900" />
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'SecretSauceReveal', category: 'Unique Mechanism', description: 'Reveal the secret sauce or unique differentiator', defaultBackgroundType: 'primary' as const };