'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { usePostHog } from 'posthog-js/react';
import ErrorRetry from '@/components/onboarding/shared/ErrorRetry';
import type { SectionCopy } from '@/types/generation';
import type { ProductStrategyOutput } from '@/types/product';
import { defaultMeridianPalette, defaultMeridianVariant } from '@/types/product';

type Stage = 'strategy' | 'copy' | 'saving' | 'done';

interface StageDef {
  id: Stage;
  label: string;
}

const STAGES: StageDef[] = [
  { id: 'strategy', label: 'Building your strategy' },
  { id: 'copy', label: 'Writing the copy' },
  { id: 'saving', label: 'Saving the draft' },
];

// Pilot locks (P4). Picker enabling these is P6.
const PILOT_PALETTE = defaultMeridianPalette; // 'mint'
const PILOT_VARIANT = defaultMeridianVariant; // 'developer'
const PILOT_TEMPLATE = 'meridian';

export default function GeneratingStep() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params?.token as string;
  const posthog = usePostHog();

  const productName = useProductGenerationStore((s) => s.productName);
  const oneLiner = useProductGenerationStore((s) => s.oneLiner);
  const understanding = useProductGenerationStore((s) => s.understanding);
  const landingGoal = useProductGenerationStore((s) => s.landingGoal);
  const offer = useProductGenerationStore((s) => s.offer);
  const importedTestimonials = useProductGenerationStore((s) => s.importedTestimonials);
  const setGenerationError = useProductGenerationStore((s) => s.setGenerationError);

  const [stage, setStage] = useState<Stage>('strategy');
  const [creditsError, setCreditsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());
  const hasRun = useRef(false);

  const buildFinalContent = (
    strategy: ProductStrategyOutput,
    sections: Record<string, SectionCopy>,
    title: string
  ) => {
    // strategy.sections are lowercase section types; strategy.uiblocks maps each
    // to a Meridian layout name (PascalCase). sectionType is the authoritative key.
    const sectionTypes = strategy.sections;
    const sectionIds = sectionTypes.map(
      (t) => `${t}-${crypto.randomUUID().slice(0, 8)}`
    );

    const sectionLayouts: Record<string, string> = {};
    const content: Record<string, any> = {};

    sectionIds.forEach((id, i) => {
      const sectionType = sectionTypes[i];
      const layout = strategy.uiblocks[sectionType] || 'default';
      sectionLayouts[id] = layout;

      const elements = sections[sectionType]?.elements ?? {};
      content[id] = {
        id,
        layout,
        elements,
        backgroundType: 'neutral',
        aiMetadata: {
          aiGenerated: true,
          isCustomized: false,
          lastGenerated: Date.now(),
          aiGeneratedElements: Object.keys(elements),
          excludedElements: [],
        },
      };
    });

    return {
      finalContent: {
        layout: {
          sections: sectionIds,
          sectionLayouts,
          // Meridian tokens come from Project.paletteId/variantId at render time
          // via the Meridian ThemeInjector. No theme.colors block for product.
          theme: {},
          globalSettings: {},
        },
        content,
        meta: {
          id: tokenId,
          title,
          slug: '',
          lastUpdated: Date.now(),
          version: 1,
          tokenId,
        },
        onboardingData: {
          oneLiner,
          productName,
          understanding,
          landingGoal,
          offer,
        },
        generatedAt: Date.now(),
      },
    };
  };

  const runPipeline = useCallback(async () => {
    if (!understanding || !landingGoal) {
      setError('Missing onboarding data. Please restart from the beginning.');
      return;
    }

    // Strategy route requires a non-empty product name; fall back when skipped.
    const effectiveProductName = productName.trim() || 'Your Product';
    const title = (productName.trim() || oneLiner || 'Untitled Page').slice(0, 50);
    const features = understanding.features ?? [];
    const audiences = understanding.audiences ?? [];

    setError(null);
    setCreditsError(false);

    // ─── Strategy ───
    setStage('strategy');
    const strategyStart = Date.now();
    let strategy: ProductStrategyOutput;
    try {
      const res = await fetch('/api/audience/product/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: effectiveProductName,
          oneLiner,
          features,
          landingGoal,
          offer,
          primaryAudience: audiences[0] || 'early adopters',
          otherAudiences: audiences.slice(1),
          categories: understanding.categories ?? [],
        }),
      });
      const json = await res.json();
      posthog?.capture('product_strategy_call_complete', {
        success: !!json?.success,
        creditsUsed: json?.creditsUsed,
        creditsRemaining: json?.creditsRemaining,
        durationMs: Date.now() - strategyStart,
        audienceType: 'product',
      });
      if (!res.ok || !json?.success) {
        if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
          setCreditsError(true);
          return;
        }
        throw new Error(json?.message || 'Strategy generation failed');
      }
      strategy = json.data as ProductStrategyOutput;
    } catch (e: any) {
      setError(e?.message || 'Strategy generation failed.');
      return;
    }

    // ─── Copy ───
    setStage('copy');
    const copyStart = Date.now();
    let copySections: Record<string, SectionCopy>;
    try {
      const res = await fetch('/api/audience/product/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          uiblocks: strategy.uiblocks,
          productName: effectiveProductName,
          oneLiner,
          offer,
          landingGoal,
          features,
          realTestimonials: importedTestimonials,
        }),
      });
      const json = await res.json();
      posthog?.capture('product_copy_call_complete', {
        success: !!json?.success,
        creditsUsed: json?.creditsUsed,
        creditsRemaining: json?.creditsRemaining,
        durationMs: Date.now() - copyStart,
        attempts: json?.meta?.attempts,
        audienceType: 'product',
      });
      if (!res.ok || !json?.success) {
        if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
          setCreditsError(true);
          return;
        }
        throw new Error(json?.message || 'Copy generation failed');
      }
      copySections = json.sections as Record<string, SectionCopy>;
    } catch (e: any) {
      setError(e?.message || 'Copy generation failed.');
      return;
    }

    // ─── Save ───
    setStage('saving');
    try {
      const { finalContent } = buildFinalContent(strategy, copySections, title);
      const res = await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          title,
          paletteId: PILOT_PALETTE,
          templateId: PILOT_TEMPLATE,
          variantId: PILOT_VARIANT,
          finalContent,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to save draft');
      }
    } catch (e: any) {
      setError(e?.message || 'Could not save the draft.');
      return;
    }

    setStage('done');
    posthog?.capture('product_onboarding_complete', {
      totalDurationMs: Date.now() - startedAt.current,
      sectionCount: strategy.sections.length,
      paletteId: PILOT_PALETTE,
      variantId: PILOT_VARIANT,
      audienceType: 'product',
    });

    setTimeout(() => router.push(`/edit/${tokenId}`), 600);
  }, [
    understanding,
    landingGoal,
    productName,
    oneLiner,
    offer,
    importedTestimonials,
    tokenId,
    posthog,
    router,
  ]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runPipeline();
  }, [runPipeline]);

  if (creditsError) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Out of credits</h3>
        <p className="text-gray-600 mb-6">
          You&apos;ve used your generation credits. Top up to continue.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <a
            href="/dashboard/settings"
            className="px-5 py-2.5 rounded-lg bg-brand-accentPrimary text-white hover:bg-orange-500"
          >
            View plans
          </a>
          <button
            onClick={() => router.push(`/edit/${tokenId}`)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Continue to editor without copy
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    setGenerationError(error);
    return (
      <ErrorRetry
        title="Generation hit a snag"
        message={error}
        onRetry={() => {
          hasRun.current = false;
          setError(null);
          runPipeline();
        }}
        retryLabel="Try again"
        onSecondary={() => router.push(`/edit/${tokenId}`)}
        secondaryLabel="Skip to editor"
      />
    );
  }

  return (
    <div className="py-8 px-2 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
        Building your page
      </h2>
      <p className="text-sm text-gray-500 text-center mb-8">
        This usually takes 20–40 seconds.
      </p>

      <ol className="space-y-4">
        {STAGES.map((s) => {
          const idx = STAGES.findIndex((x) => x.id === stage);
          const myIdx = STAGES.findIndex((x) => x.id === s.id);
          const status: 'done' | 'active' | 'pending' =
            stage === 'done' || myIdx < idx
              ? 'done'
              : myIdx === idx
                ? 'active'
                : 'pending';
          return (
            <li key={s.id} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'done'
                    ? 'bg-brand-accentPrimary text-white'
                    : status === 'active'
                      ? 'bg-brand-accentPrimary/10 text-brand-accentPrimary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {status === 'done' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'active' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-medium">
                    {STAGES.findIndex((x) => x.id === s.id) + 1}
                  </span>
                )}
              </div>
              <span
                className={`text-sm ${
                  status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
