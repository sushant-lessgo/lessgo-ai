'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Check } from 'lucide-react';
import ErrorRetry from '../shared/ErrorRetry';
import type { SectionType, SectionCopy } from '@/types/generation';
import { getDesignTokensForVibe } from '@/modules/Design/vibeMapping';

const generatingMessages = [
  'Writing headlines...',
  'Crafting your story...',
  'Polishing copy...',
  'Adding finishing touches...',
];

/**
 * Section progress item in the checklist
 */
function SectionProgressItem({
  name,
  done,
  active,
}: {
  name: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active ? 'bg-orange-50' : done ? 'bg-green-50' : 'bg-gray-50'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          done
            ? 'bg-green-500'
            : active
            ? 'bg-brand-accentPrimary animate-pulse'
            : 'bg-gray-200'
        }`}
      >
        {done && <Check className="w-3 h-3 text-white" />}
      </div>
      <span
        className={`text-sm ${
          done ? 'text-green-700' : active ? 'text-orange-700' : 'text-gray-500'
        }`}
      >
        {name}
      </span>
    </div>
  );
}

export default function GeneratingStep() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params?.token as string;

  const productName = useGenerationStore((s) => s.productName);
  const oneLiner = useGenerationStore((s) => s.oneLiner);
  const understanding = useGenerationStore((s) => s.understanding);
  const landingGoal = useGenerationStore((s) => s.landingGoal);
  const offer = useGenerationStore((s) => s.offer);
  const strategy = useGenerationStore((s) => s.strategy);
  const selectedSections = useGenerationStore((s) => s.selectedSections);
  const uiblockSelections = useGenerationStore((s) => s.uiblockSelections);
  const generationProgress = useGenerationStore((s) => s.generationProgress);
  const generationError = useGenerationStore((s) => s.generationError);
  const setGenerationProgress = useGenerationStore((s) => s.setGenerationProgress);
  const setGenerationError = useGenerationStore((s) => s.setGenerationError);
  const nextStep = useGenerationStore((s) => s.nextStep);

  // Progress simulation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [messageIndex, setMessageIndex] = useState(0);
  const [apiComplete, setApiComplete] = useState(false);

  // Ref guard to prevent double API calls (React Strict Mode)
  const hasCalledApi = useRef(false);

  // Rotate messages
  useEffect(() => {
    if (generationProgress >= 100) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % generatingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, [generationProgress]);

  // Progress simulation - distribute across sections
  useEffect(() => {
    if (generationProgress >= 95 || apiComplete) return;

    const sections = selectedSections;
    if (sections.length === 0) return;

    const intervalTime = 15000 / sections.length; // ~15s total

    const timer = setInterval(() => {
      setCurrentSectionIndex((prev) => {
        const next = Math.min(prev + 1, sections.length - 1);
        setCompletedSections((s) => new Set([...s, sections[prev]]));
        const progress = Math.round(((next + 1) / sections.length) * 90); // Cap at 90%
        setGenerationProgress(Math.min(progress, 90));
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [selectedSections, apiComplete, generationProgress, setGenerationProgress]);

  // Save generated content to draft
  const saveGeneratedContent = useCallback(
    async (sections: Record<string, SectionCopy>) => {
      if (!strategy) return;

      // Build section IDs
      const sectionOrder = strategy.sections;
      const sectionIds = sectionOrder.map(
        (type) => `${type.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`
      );

      // Build sectionLayouts map (V3 strategy has uiblocks embedded)
      const sectionLayouts: Record<string, string> = {};
      sectionIds.forEach((id, i) => {
        const sectionType = sectionOrder[i];
        // @ts-expect-error - V3 strategy has uiblocks, V2 uses uiblockSelections
        sectionLayouts[id] = strategy.uiblocks?.[sectionType] || uiblockSelections[sectionType] || 'default';
      });

      // Build content map with full structure (layout, id, aiMetadata required for editor)
      const content: Record<string, any> = {};
      sectionIds.forEach((id, i) => {
        const sectionType = sectionOrder[i];
        const sectionCopy = sections[sectionType];
        const layout = sectionLayouts[id];

        content[id] = {
          id,
          layout,
          elements: sectionCopy?.elements || {},
          aiMetadata: {
            aiGenerated: true,
            isCustomized: false,
            lastGenerated: Date.now(),
            aiGeneratedElements: Object.keys(sectionCopy?.elements || {}),
            excludedElements: []
          }
        };
      });

      // Get theme from vibe mapping
      const designTokens = getDesignTokensForVibe(strategy.vibe);

      const finalContent = {
        layout: {
          sections: sectionIds,
          sectionLayouts,
          theme: {
            typography: {
              headingFont: designTokens.headingFont,
              bodyFont: designTokens.bodyFont,
            },
            // Background will be applied by the editor
          },
          globalSettings: {},
        },
        content,
        meta: {
          id: tokenId,
          title: productName || 'Untitled Landing Page',
          slug: '',
          lastUpdated: Date.now(),
          version: 1,
          tokenId,
        },
        generatedAt: Date.now(),
      };

      // Save to API
      await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          title: productName || 'Untitled Landing Page',
          finalContent,
        }),
      });
    },
    [strategy, uiblockSelections, productName, tokenId]
  );

  // API call
  const callGenerateCopyAPI = useCallback(async () => {
    if (!strategy || !understanding) return;

    try {
      // @ts-expect-error - V3 strategy has uiblocks embedded
      const uiblocks = strategy.uiblocks || uiblockSelections;

      const response = await fetch('/api/v3/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          uiblocks,
          productName: productName || 'Your Product',
          oneLiner,
          offer,
          landingGoal,
          features: understanding.features,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setApiComplete(true);

        // Save generated content
        await saveGeneratedContent(result.sections);

        // Complete progress
        setCompletedSections(new Set(selectedSections));
        setGenerationProgress(100);

        // Short delay then advance
        setTimeout(() => nextStep(), 500);
      } else {
        setGenerationError(result.message || 'Generation failed');
      }
    } catch (error) {
      setGenerationError('Network error. Please try again.');
    }
  }, [
    strategy, understanding, uiblockSelections, productName, oneLiner,
    offer, landingGoal, saveGeneratedContent, selectedSections,
    setGenerationProgress, setGenerationError, nextStep
  ]);

  // Trigger API call on mount
  useEffect(() => {
    if (generationProgress === 0 && !generationError && !apiComplete && !hasCalledApi.current) {
      hasCalledApi.current = true;
      callGenerateCopyAPI();
    }
  }, []); // Only on mount

  // Error state - redirect to editor with empty sections
  if (generationError) {
    return (
      <ErrorRetry
        title="Generation incomplete"
        message="We hit a snag generating your copy. You can still edit the page manually."
        onRetry={() => router.push(`/edit/${tokenId}`)}
        retryLabel="Continue to editor"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      {/* Spinner or checkmark */}
      {generationProgress < 100 ? (
        <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-accentPrimary rounded-full animate-spin" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-accentPrimary transition-all duration-500"
            style={{ width: `${generationProgress}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {generationProgress < 100
            ? generatingMessages[messageIndex]
            : 'Your page is ready!'}
        </p>
      </div>

      {/* Section checklist */}
      <div className="w-full max-w-sm space-y-2">
        {selectedSections.slice(0, 6).map((section, i) => (
          <SectionProgressItem
            key={section}
            name={section}
            done={completedSections.has(section)}
            active={i === currentSectionIndex && !completedSections.has(section)}
          />
        ))}
        {selectedSections.length > 6 && (
          <p className="text-center text-xs text-gray-400">
            +{selectedSections.length - 6} more sections
          </p>
        )}
      </div>
    </div>
  );
}
