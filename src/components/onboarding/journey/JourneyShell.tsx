'use client';

// ============================================================================
// JourneyShell — the universal onboarding journey. ENGINE-AGNOSTIC.
//
// Mounted by the entry page's load-detection (dynamic, ssr:false) when a
// CONFIRMED brief is `isJourneyEligible`. Owns: the full-viewport chrome, the
// step machine (2–6), seam resolution, and store hydration. Owns NOTHING
// engine-specific — everything of that kind lives behind `JourneyEngineSeam`.
//
// ── `.app-chrome` SCOPE (landmine 1 — hard rule) ────────────────────────────
// The class is attached HERE, on this component's OWN full-viewport wrapper,
// and NOWHERE else. Never on `<body>`, never on any wrapper containing the
// editor canvas, and never an ancestor of the revealed site — STEP 06 reveals
// through an IFRAME precisely so this scope cannot reach template output
// (`src/components/ui/README.md`; precedent: `src/app/dashboard/layout.tsx`,
// `FounderAuthLayout.tsx`).
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
// No template resolver/registry/renderer. No `@/modules/wizard/work/**`, no
// `@/modules/wizard/generation/**` — the seam is reached ONLY through the
// registry's async loader. Mechanically asserted by `journeyAgnostic.test.ts`.
// ============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Brief } from '@/types/brief';
import type { AudienceType, TemplateId } from '@/types/service';
import {
  useWizardStore,
  selectJourneyStep,
  selectSetJourneyStep,
} from '@/hooks/useWizardStore';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { ToastProvider } from '@/components/ui/toast';
import JourneyTopBar from './JourneyTopBar';
import UnderstoodRail from './UnderstoodRail';
import { loadJourneySeam } from './engines/registry';
import type { JourneyEngineSeam, JourneyStep } from './engines/types';
import StepShowWork from './steps/StepShowWork';
import StepQuestions from './steps/StepQuestions';
import StepPlan from './steps/StepPlan';
import StepBuilding from './steps/StepBuilding';
import StepReveal from './steps/StepReveal';

export interface JourneyShellProps {
  tokenId: string;
  brief: Brief;
  audienceType: AudienceType | null;
  templateId: TemplateId | null;
}

const STEP_BODIES: Record<JourneyStep, () => JSX.Element> = {
  2: StepShowWork,
  3: StepQuestions,
  4: StepPlan,
  5: StepBuilding,
  6: StepReveal,
};

const FIRST_STEP: JourneyStep = 2;
const LAST_STEP: JourneyStep = 6;

export default function JourneyShell({
  tokenId,
  brief,
  audienceType,
  templateId,
}: JourneyShellProps) {
  const router = useRouter();
  const hydrate = useWizardStore((s) => s.hydrate);
  const hydrated = useWizardStore((s) => s.hydrated);
  const journeyStep = useWizardStore(selectJourneyStep);
  const setJourneyStep = useWizardStore(selectSetJourneyStep);

  const [seam, setSeam] = useState<JourneyEngineSeam | null>(null);
  const [seamError, setSeamError] = useState(false);

  // Hydrate once from the DB-confirmed brief (load-detection already fetched
  // it). Same one-shot rule as WizardShell: re-running would clobber edits.
  useEffect(() => {
    hydrate({ tokenId, brief, audienceType, templateId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve the seam + the resume step. The seam is the ONLY door to engine
  // code, and it is ASYNC (dynamic import) so no engine/generation code lands on
  // the entry bundle (landmine 14).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadJourneySeam(brief.copyEngine);
      if (cancelled) return;
      if (!loaded) {
        // Unreachable via the entry page (dispatch gates on isJourneyEligible,
        // and the drift guard keeps the leaf ⟷ registry in lock-step) — but a
        // silent blank screen is not an acceptable failure mode either way.
        setSeamError(true);
        return;
      }
      setSeam(loaded);
      // NOTE (P5/P6): `finalContent` is NOT available here — the entry page's
      // load-detection reads only {brief, audienceType, templateId}. The
      // generation-resume rules (⇒ 5 / ⇒ 6) need it, so the phase that adds them
      // must widen what the shell is given.
      const step = await loaded.resolveResumeStep({ brief, audienceType, templateId });
      if (!cancelled) setJourneyStep(step);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Body = STEP_BODIES[journeyStep];
  const ready = hydrated && !!seam;

  return (
    // THE ONLY `.app-chrome` attachment in the journey (see the header note).
    // ToastProvider (the ui-foundation one — NEVER the edit-page-local
    // ToastProvider) wraps the shell because the rail surfaces persistence
    // failures through it; its viewport portals to <body>, outside this scope,
    // and carries its own app-* tokens, so that is fine.
    <ToastProvider>
      <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
        <JourneyTopBar
          step={ready ? journeyStep : null}
          onExit={() => router.push('/dashboard')}
        />

        {/* P3 — the two-column journey: the persistent rail (02–06) beside the
            step body. The rail is AGNOSTIC; it renders the seam's projection. */}
        <div className="flex-1 min-h-0 flex">
          {ready && seam && <UnderstoodRail rail={seam.rail} />}

          <div className="flex-1 min-w-0 overflow-auto">
            <div className="mx-auto max-w-3xl px-6 py-10">
              {seamError && (
                <p className="font-app-sans text-sm text-app-danger">
                  We couldn&apos;t open this flow. Please refresh and try again.
                </p>
              )}

              {!seamError && !ready && (
                <p className="font-app-sans text-sm text-app-muted" role="status">
                  Loading your page…
                </p>
              )}

              {ready && (
                <div className="space-y-8">
                  <Body />

                  {/* P2b navigation — makes 02–06 walkable. Each step takes over
                      its own forward motion as it lands (P4's CTA, P5's
                      generation completion, P6's editor handoff). */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setJourneyStep(Math.max(FIRST_STEP, journeyStep - 1) as JourneyStep)
                      }
                      disabled={journeyStep === FIRST_STEP}
                      data-testid="journey-back"
                      className="font-app-sans inline-flex items-center gap-1.5 text-sm text-app-muted
                                 hover:text-app-ink disabled:opacity-40 disabled:cursor-not-allowed
                                 transition-colors duration-200"
                    >
                      <AppIcon name="arrow_back" size={16} />
                      Back
                    </button>
                    <Button
                      type="button"
                      onClick={() =>
                        setJourneyStep(Math.min(LAST_STEP, journeyStep + 1) as JourneyStep)
                      }
                      disabled={journeyStep === LAST_STEP}
                      data-testid="journey-next"
                    >
                      Continue
                      <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
