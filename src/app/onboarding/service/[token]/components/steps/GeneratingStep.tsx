'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { usePostHog } from 'posthog-js/react';
import ErrorRetry from '@/components/onboarding/shared/ErrorRetry';
import type { SectionCopy } from '@/types/generation';
import type { ServiceStrategyOutputAssembled } from '@/types/service';
import { defaultHearthPalette } from '@/modules/templates/hearth/palettes';
import { legacyGoalToBriefGoal } from '@/modules/brief/bridge';

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

export default function GeneratingStep() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params?.token as string;
  const posthog = usePostHog();

  const oneLiner = useServiceGenerationStore((s) => s.oneLiner);
  const businessName = useServiceGenerationStore((s) => s.businessName);
  const understanding = useServiceGenerationStore((s) => s.understanding);
  const goal = useServiceGenerationStore((s) => s.goal);
  const goalParam = useServiceGenerationStore((s) => s.goalParam);
  const offer = useServiceGenerationStore((s) => s.offer);
  const assets = useServiceGenerationStore((s) => s.assets);
  const importedTestimonials = useServiceGenerationStore((s) => s.importedTestimonials);
  const paletteId = useServiceGenerationStore((s) => s.paletteId);
  const templateId = useServiceGenerationStore((s) => s.templateId);
  const setStrategy = useServiceGenerationStore((s) => s.setStrategy);
  const setGenerationError = useServiceGenerationStore((s) => s.setGenerationError);

  const [stage, setStage] = useState<Stage>('strategy');
  const [creditsError, setCreditsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());
  const hasRun = useRef(false);

  const buildFinalContent = (
    strategy: ServiceStrategyOutputAssembled,
    sections: Record<string, SectionCopy>
  ) => {
    // Casing contract: strategy.sections values are already lowercase
    // camelCase (per src/modules/service/strategy/sectionSelectionService.ts).
    // No .toLowerCase() needed. sectionType is the authoritative key.
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

    const title = (businessName.trim() || oneLiner || 'Untitled Studio').slice(0, 50);

    return {
      finalContent: {
        layout: {
          sections: sectionIds,
          sectionLayouts,
          // Hearth tokens come from Project.paletteId at render time via
          // HearthThemeInjector. No theme.colors block needed for service.
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
          businessName,
          understanding,
          goal,
          offer,
          assets,
        },
        generatedAt: Date.now(),
      },
      title,
    };
  };

  const runPipeline = useCallback(async () => {
    if (!understanding || !goal || !assets) {
      setError('Missing onboarding data. Please restart from the beginning.');
      return;
    }

    const effectivePalette = paletteId ?? defaultHearthPalette;
    setError(null);
    setCreditsError(false);

    // ─── Strategy ───
    setStage('strategy');
    const strategyStart = Date.now();
    let strategy: ServiceStrategyOutputAssembled;
    try {
      const res = await fetch('/api/audience/service/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oneLiner,
          businessName,
          understanding,
          goal,
          offer,
          assets,
          paletteId: effectivePalette,
          // Selection-only: widens the section SET for templates that declare
          // extra section types (Surge). Server passes it to section selection,
          // NEVER to a prompt builder (firewall preserved).
          templateId,
        }),
      });
      const json = await res.json();
      posthog?.capture('service_strategy_call_complete', {
        success: !!json?.success,
        creditsUsed: json?.creditsUsed,
        creditsRemaining: json?.creditsRemaining,
        durationMs: Date.now() - strategyStart,
        audienceType: 'service',
      });
      if (!res.ok || !json?.success) {
        if (res.status === 402 || /credit/i.test(json?.error ?? '')) {
          setCreditsError(true);
          return;
        }
        throw new Error(json?.message || 'Strategy generation failed');
      }
      strategy = json.data as ServiceStrategyOutputAssembled;
      setStrategy(strategy);
    } catch (e: any) {
      setError(e?.message || 'Strategy generation failed.');
      return;
    }

    // ─── Copy ───
    setStage('copy');
    const copyStart = Date.now();
    let copySections: Record<string, SectionCopy>;
    try {
      const res = await fetch('/api/audience/service/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          uiblocks: strategy.uiblocks,
          oneLiner,
          businessName,
          offer,
          goal,
          understanding,
          realTestimonials: importedTestimonials,
        }),
      });
      const json = await res.json();
      posthog?.capture('service_copy_call_complete', {
        success: !!json?.success,
        creditsUsed: json?.creditsUsed,
        creditsRemaining: json?.creditsRemaining,
        durationMs: Date.now() - copyStart,
        attempts: json?.meta?.attempts,
        audienceType: 'service',
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
      const { finalContent, title } = buildFinalContent(strategy, copySections);
      const res = await fetch('/api/saveDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          title,
          paletteId: effectivePalette,
          finalContent,
          // scale-05 phase 1: goal writeback — saveDraft's brief passthrough
          // shallow-merges this over any existing Brief (goal is guarded
          // non-null at pipeline start).
          brief: { goal: legacyGoalToBriefGoal(goal, goalParam) },
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
    posthog?.capture('service_onboarding_complete', {
      totalDurationMs: Date.now() - startedAt.current,
      sectionCount: strategy.sections.length,
      paletteId: effectivePalette,
      audienceType: 'service',
    });

    // Brief delay so the user sees the final check, then reveal the generated
    // page (wow moment) before the editor.
    setTimeout(() => router.push(`/generate/${tokenId}`), 600);
  }, [
    understanding,
    goal,
    goalParam,
    assets,
    oneLiner,
    businessName,
    offer,
    importedTestimonials,
    paletteId,
    templateId,
    tokenId,
    posthog,
    router,
    setStrategy,
  ]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runPipeline();
  }, [runPipeline]);

  // Failure paths
  if (creditsError) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Out of credits
        </h3>
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

  // Progress UI
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
