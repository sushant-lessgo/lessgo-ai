'use client';

// scale-06 phase 5 — the unified GENERATING slot.
//
// THIN client shell over `runGeneration`: reads the confirmed wizard state from
// `useWizardStore`, projects it to the engine adapter's PLAIN input, runs the
// pipeline once, drives the progress UI, and redirects to `/edit/${tokenId}` on
// success. Error/credits states reuse the shared ErrorRetry chrome.
//
// FIREWALL: all generation logic lives in the PLAIN `@/modules/wizard/generation`
// tree (finalize/thing/index) — this component only reads the client store and
// renders. It never imports a template resolver/registry/renderer.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import {
  useWizardStore,
  buildThingInput,
  buildTrustInput,
  fieldStr,
  fieldArr,
} from '@/hooks/useWizardStore';
import ErrorRetry from '@/components/onboarding/shared/ErrorRetry';
import {
  runGeneration,
  type GenerationStage,
  type GenerationInput,
} from '@/modules/wizard/generation';
import type { WorkGenerationInput } from '@/modules/wizard/generation/work';

interface StageDef {
  id: GenerationStage;
  label: string;
}

const STAGES: StageDef[] = [
  { id: 'strategy', label: 'Building your strategy' },
  { id: 'copy', label: 'Writing the copy' },
  { id: 'saving', label: 'Saving the draft' },
];

// buildThingInput/buildTrustInput/fieldStr/fieldArr live in useWizardStore
// (scale-07 phases 3–5) so the pre-gate strategy fetch (store fetchStrategy)
// and this slot share ONE store→adapter projection per engine. The
// strategy/sitemap/confirmedSections the projections forward are the
// structure-slot-confirmed values, so both adapters take their primary
// `input.strategy` branch (no second strategy charge) — thing: runFanOut for
// multipage, runCopyAndSave for single-page; trust: applyConfirmedStructure
// then copy. The trust module-scoped pre-gate bridge is deleted (phase 5).

/** Project the wizard store → the WORK (writer/granth) adapter input (plain data). */
function buildWorkInput(): WorkGenerationInput {
  const s = useWizardStore.getState();
  const fields = s.fields as Record<string, { value: unknown }>;
  return {
    tokenId: s.tokenId ?? '',
    templateId: s.templateId ?? 'granth',
    writerName: fieldStr(fields, 'name'),
    oneLiner: fieldStr(fields, 'oneLiner'),
    // The 3–5 work uploads captured in ProofSlot (contract `theWork`).
    works: fieldArr(fields, 'theWork'),
  };
}

/** Minimum work uploads required before the writer page can be generated. */
export const MIN_WORKS = 3;

/** Project the wizard store → the engine's adapter input (plain data). */
function buildInput(engine: NonNullable<ReturnType<typeof useWizardStore.getState>['engine']>): GenerationInput {
  if (engine === 'trust') return buildTrustInput(useWizardStore.getState());
  if (engine === 'work') return buildWorkInput();
  return buildThingInput(useWizardStore.getState());
}

export default function GeneratingSlot() {
  const router = useRouter();
  const engine = useWizardStore((s) => s.engine);
  const setGenerationError = useWizardStore((s) => s.setGenerationError);

  const [stage, setStage] = useState<GenerationStage>('strategy');
  const [pageProgress, setPageProgress] = useState<{ done: number; total: number } | null>(null);
  const [creditsError, setCreditsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const run = useCallback(async () => {
    if (!engine) return;
    setError(null);
    setCreditsError(false);
    setStage('strategy');
    setPageProgress(null);

    const input: GenerationInput = buildInput(engine);
    if (!input.tokenId) {
      setError('Missing project token. Please restart from the beginning.');
      return;
    }

    // WORK empty-gallery guard: the writer profile needs at least MIN_WORKS work
    // samples (uploaded or scraped) before we can build the shelf. Block the run
    // and send them back to the proof step to add more.
    if (engine === 'work') {
      const works = (input as WorkGenerationInput).works ?? [];
      if (works.length < MIN_WORKS) {
        setError(
          `Add at least ${MIN_WORKS} work samples before we build your page — ` +
            `you currently have ${works.length}. Go back a step to add more.`
        );
        return;
      }
    }

    let result;
    try {
      result = await runGeneration(engine, input, {
        onStage: (st) => setStage(st),
        onPageProgress: (p) => setPageProgress(p),
      });
    } catch (e: any) {
      setError(e?.message || 'Generation failed.');
      return;
    }

    if (result.status === 'credits') {
      setCreditsError(true);
      return;
    }
    if (result.status === 'error') {
      setError(result.error || 'Generation failed.');
      return;
    }
    // Reveal the editor.
    setTimeout(() => router.push(result.redirectTo || `/edit/${input.tokenId}`), 600);
  }, [engine, router]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    void run();
  }, [run]);

  const tokenId = useWizardStore.getState().tokenId ?? '';

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
          void run();
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
            stage === 'done' || myIdx < idx ? 'done' : myIdx === idx ? 'active' : 'pending';
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
                  <span className="text-xs font-medium">{myIdx + 1}</span>
                )}
              </div>
              <span className={`text-sm ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                {s.label}
                {s.id === 'copy' && status === 'active' && pageProgress && pageProgress.total > 1
                  ? ` — page ${pageProgress.done} of ${pageProgress.total}`
                  : ''}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
