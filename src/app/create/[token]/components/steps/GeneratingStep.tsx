'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Check } from 'lucide-react';
import ErrorRetry from '../shared/ErrorRetry';
import type { SectionCopy } from '@/types/generation';
import { getDesignTokensForVibe } from '@/modules/Design/vibeDesignTokens';
import { generateBackgroundSystemFromPalette, assignSectionBackgrounds } from '@/modules/Design/background/backgroundIntegration';
import { getPaletteById, getDefaultPaletteForVibe } from '@/modules/Design/background/palettes';
import { compileBackground } from '@/modules/Design/background/textures';
import { getSmartTextColor } from '@/utils/improvedTextColors';
import { fetchPexelsImagesParallel, pickBestImage, type ImageFetchResult } from '@/lib/generation/fetchImages';
import DesignQuestionsFlow, { type DesignChoices } from './DesignQuestionsFlow';

// ─── Constants ───

const DEFAULT_POOLS: Record<string, string[]> = {
  'Dark Tech':     ['midnight-slate', 'deep-indigo', 'ocean-abyss', 'arctic-night', 'graphite'],
  'Light Trust':   ['trust-blue', 'sky-bright', 'ocean', 'emerald-clean', 'steel'],
  'Warm Friendly': ['coral', 'sunset', 'mint-warm', 'rose-soft', 'warm-sand'],
  'Bold Energy':   ['blush', 'sky-bright', 'ocean', 'golden-hour', 'soft-lavender'],
  'Calm Minimal':  ['soft-stone', 'steel', 'teal-fresh', 'emerald-clean', 'trust-blue'],
};

function getRandomFromPool(vibe: string): string {
  const pool = DEFAULT_POOLS[vibe] || DEFAULT_POOLS['Light Trust'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function deriveCTAText(goal: string): string {
  const map: Record<string, string> = {
    waitlist: 'Join Waitlist',
    signup: 'Get Started Free',
    'free-trial': 'Start Free Trial',
    buy: 'Get Started',
    demo: 'Book a Demo',
    download: 'Download Now',
  };
  return map[goal] || 'Get Started';
}

// ─── Helper: merge fetched images into section copy ───

function mergeImagesIntoSections(
  sections: Record<string, SectionCopy>,
  imageResults: Map<string, ImageFetchResult>,
  palette?: { mode: 'dark' | 'light'; temperature: 'cool' | 'neutral' | 'warm'; baseColor: string }
): Record<string, SectionCopy> {
  const merged = { ...sections };

  for (const [, result] of imageResults) {
    const { sectionType, elementKey } = result;
    const imageUrl = palette
      ? pickBestImage(result, palette.mode, palette.temperature, palette.baseColor)
      : result.imageUrl;
    if (imageUrl && merged[sectionType]?.elements) {
      merged[sectionType] = {
        ...merged[sectionType],
        elements: {
          ...merged[sectionType].elements,
          [elementKey]: imageUrl,
        },
      };
    }
  }

  if (merged['Results']?.elements?.gallery_items) {
    const items = merged['Results'].elements.gallery_items as Array<{id: string; image_url: string; caption: string}>;
    merged['Results'].elements.gallery_items = items.map(item => ({
      ...item,
      image_url: item.image_url || '/results-placeholder.jpg'
    }));
  }

  return merged;
}

// ─── Component ───

export default function GeneratingStep() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params?.token as string;

  const productName = useGenerationStore((s) => s.productName);
  const oneLiner = useGenerationStore((s) => s.oneLiner);
  const understanding = useGenerationStore((s) => s.understanding);
  const audience = understanding?.audiences?.[0] || '';
  const landingGoal = useGenerationStore((s) => s.landingGoal);
  const offer = useGenerationStore((s) => s.offer);
  const strategy = useGenerationStore((s) => s.strategy);
  const selectedSections = useGenerationStore((s) => s.selectedSections);
  const uiblockSelections = useGenerationStore((s) => s.uiblockSelections);
  const generationProgress = useGenerationStore((s) => s.generationProgress);
  const generationError = useGenerationStore((s) => s.generationError);
  const setGenerationProgress = useGenerationStore((s) => s.setGenerationProgress);
  const setGenerationError = useGenerationStore((s) => s.setGenerationError);

  // Design questions state
  const [apiComplete, setApiComplete] = useState(false);
  const [userDone, setUserDone] = useState(false);
  const [designChoices, setDesignChoices] = useState<DesignChoices | null>(null);

  // Refs
  const hasCalledApi = useRef(false);
  const copyResultRef = useRef<{
    sections: Record<string, SectionCopy>;
    imageResults?: Map<string, ImageFetchResult>;
  } | null>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout>>();

  // ─── Save generated content to draft ───

  const saveGeneratedContent = useCallback(
    async (sections: Record<string, SectionCopy>) => {
      if (!strategy) return;

      const sectionOrder = strategy.sections;
      const sectionIds = sectionOrder.map(
        (type) => `${type.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`
      );

      const sectionLayouts: Record<string, string> = {};
      sectionIds.forEach((id, i) => {
        const sectionType = sectionOrder[i];
        // @ts-expect-error - V3 strategy has uiblocks, V2 uses uiblockSelections
        sectionLayouts[id] = strategy.uiblocks?.[sectionType] || uiblockSelections[sectionType] || 'default';
      });

      // Get palette from user's design choices (or random fallback)
      const paletteId = designChoices?.paletteId || getRandomFromPool(strategy.vibe);
      const palette = getPaletteById(paletteId) || getDefaultPaletteForVibe(strategy.vibe);
      const backgroundSystem = generateBackgroundSystemFromPalette(palette);
      const designTokens = getDesignTokensForVibe(strategy.vibe);

      // Apply texture
      const textureId = designChoices?.textureId || 'none';

      console.log('[BG-V3] Palette:', palette.id, '| Texture:', textureId);
      console.log('[BG-V3] BackgroundSystem:', JSON.stringify(backgroundSystem, null, 2));

      // Score and pick best images now that palette is known
      const imageResults = copyResultRef.current?.imageResults;
      if (imageResults) {
        const scored = mergeImagesIntoSections(sections, imageResults, {
          mode: palette.mode,
          temperature: palette.temperature,
          baseColor: palette.baseColor,
        });
        Object.assign(sections, scored);
      }

      const bgAssignments = assignSectionBackgrounds(sectionIds);
      const content: Record<string, any> = {};
      sectionIds.forEach((id, i) => {
        const sectionType = sectionOrder[i];
        const sectionCopy = sections[sectionType];
        const layout = sectionLayouts[id];

        content[id] = {
          id,
          layout,
          elements: sectionCopy?.elements || {},
          backgroundType: bgAssignments[id] || 'neutral',
          aiMetadata: {
            aiGenerated: true,
            isCustomized: false,
            lastGenerated: Date.now(),
            aiGeneratedElements: Object.keys(sectionCopy?.elements || {}),
            excludedElements: []
          }
        };
      });

      // Pre-compile backgrounds & derive text colors from compiled values
      const compiledPrimary = compileBackground(palette, textureId, 'primary');
      const compiledSecondary = compileBackground(palette, textureId, 'secondary');

      const calculateForBackground = (bg: string) => ({
        heading: getSmartTextColor(bg, 'heading'),
        body: getSmartTextColor(bg, 'body'),
        muted: getSmartTextColor(bg, 'muted'),
      });

      const textColors = {
        primary: calculateForBackground(compiledPrimary),
        secondary: calculateForBackground(compiledSecondary),
        neutral: calculateForBackground(palette.neutral),
      };

      const finalContent = {
        layout: {
          sections: sectionIds,
          sectionLayouts,
          theme: {
            typography: {
              headingFont: designTokens.headingFont,
              bodyFont: designTokens.bodyFont,
            },
            colors: {
              paletteId: palette.id,
              textureId: textureId,
              baseColor: backgroundSystem.baseColor,
              accentColor: backgroundSystem.accentColor,
              accentCSS: backgroundSystem.accentCSS,
              sectionBackgrounds: {
                primary: compiledPrimary,
                secondary: compiledSecondary,
                neutral: palette.neutral,
              },
              textColors,
              paletteMode: palette.mode,
              paletteTemperature: palette.temperature,
            },
            vibe: strategy.vibe,
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
        onboardingData: {
          oneLiner: oneLiner || '',
          validatedFields: {
            productName: productName || '',
            targetAudience: audience || '',
            landingPageGoals: landingGoal || '',
            offer: offer || '',
          },
          hiddenInferredFields: {
            categories: understanding?.categories?.join(', ') || '',
            whatItDoes: understanding?.whatItDoes || '',
          },
          featuresFromAI: (understanding?.features || []).map(f => ({ feature: f, benefit: '' })),
        },
        generatedAt: Date.now(),
      };

      console.log('💾 [BG-V3] Saving theme.colors:', JSON.stringify(finalContent.layout.theme.colors, null, 2));

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
    [strategy, uiblockSelections, productName, tokenId, designChoices]
  );

  // Keep saveRef always fresh for the dual-ready effect
  const saveRef = useRef(saveGeneratedContent);
  saveRef.current = saveGeneratedContent;

  // ─── API call — copy generation + image fetching in parallel ───

  const callGenerateCopyAPI = useCallback(async () => {
    if (!strategy || !understanding) return;

    try {
      // @ts-expect-error - V3 strategy has uiblocks embedded
      const uiblocks = strategy.uiblocks || uiblockSelections;
      const categories = understanding.categories || [];

      const [copyResponse, imageResults] = await Promise.all([
        fetch('/api/v3/generate-copy', {
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
        }).then(r => r.json()),

        fetchPexelsImagesParallel(categories, uiblocks as Record<string, string>, strategy.vibe),
      ]);

      if (copyResponse.success) {
        copyResultRef.current = { sections: copyResponse.sections, imageResults };
        setApiComplete(true);
        // Save deferred — dual-ready effect handles it
      } else {
        setGenerationError(copyResponse.message || 'Generation failed');
      }
    } catch (error) {
      setGenerationError('Network error. Please try again.');
    }
  }, [
    strategy, understanding, uiblockSelections, productName, oneLiner,
    offer, landingGoal, selectedSections,
    setGenerationError,
  ]);

  // ─── Trigger API call on mount ───

  useEffect(() => {
    if (generationProgress === 0 && !generationError && !apiComplete && !hasCalledApi.current) {
      hasCalledApi.current = true;
      callGenerateCopyAPI();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Dual-ready effect: save + redirect when both API and user are done ───

  useEffect(() => {
    if (!apiComplete || !userDone || !copyResultRef.current) return;
    const doSave = async () => {
      await saveRef.current(copyResultRef.current!.sections);
      setGenerationProgress(100);
      setTimeout(() => router.push(`/generate/${tokenId}`), 500);
    };
    doSave();
  }, [apiComplete, userDone, setGenerationProgress, router, tokenId]);

  // ─── Inactivity timer (45s) ───

  const resetInactivity = useCallback(() => {
    clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      if (apiComplete && !userDone) {
        // Auto-skip with defaults
        const pool = DEFAULT_POOLS[strategy?.vibe || ''] || DEFAULT_POOLS['Light Trust'];
        const pid = pool[Math.floor(Math.random() * pool.length)];
        setDesignChoices({ paletteId: pid, textureId: 'none' });
        setUserDone(true);
      }
    }, 45000);
  }, [apiComplete, userDone, strategy?.vibe]);

  // Start inactivity timer on mount
  useEffect(() => {
    resetInactivity();
    return () => clearTimeout(inactivityRef.current);
  }, [resetInactivity]);

  // ─── Handlers ───

  const ctaText = deriveCTAText(landingGoal || '');

  function handleDesignComplete(choices: DesignChoices) {
    setDesignChoices(choices);
    setUserDone(true);
  }

  function handleSkip() {
    const pool = DEFAULT_POOLS[strategy?.vibe || ''] || DEFAULT_POOLS['Light Trust'];
    const paletteId = pool[Math.floor(Math.random() * pool.length)];
    handleDesignComplete({ paletteId, textureId: 'none' });
  }

  // ─── Render ───

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

  // User still picking
  if (!userDone) {
    return (
      <DesignQuestionsFlow
        productName={productName}
        oneLiner={oneLiner}
        ctaText={ctaText}
        audience={audience}
        vibe={strategy?.vibe || ''}
        apiComplete={apiComplete}
        onComplete={handleDesignComplete}
        onSkip={handleSkip}
        onInteraction={resetInactivity}
      />
    );
  }

  // User done, waiting for API
  if (userDone && !apiComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-accentPrimary animate-spin" />
        <p className="text-sm text-gray-600">Almost ready...</p>
      </div>
    );
  }

  // Both done — saving in progress (dual-ready effect handles redirect)
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-12 h-12 rounded-full bg-brand-accentPrimary/10 flex items-center justify-center">
        <Check className="w-6 h-6 text-brand-accentPrimary" />
      </div>
      <p className="text-sm text-gray-700 font-medium">Your page is ready!</p>
    </div>
  );
}
