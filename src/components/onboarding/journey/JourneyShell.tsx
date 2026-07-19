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
import { cn } from '@/lib/utils';
import JourneyTopBar, { JourneyBuildingStatus } from './JourneyTopBar';
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
  /**
   * The project's generated content, straight from `/api/loadDraft` (the entry
   * page's load-detection forwards it verbatim). Shape is generation-owned, so
   * the shell treats it as OPAQUE — it exists solely to be handed to the seam's
   * `resolveResumeStep`, which is the only thing allowed to interpret it.
   *
   * ⚠️ LOAD-BEARING (P2b trap, closed in P5). Until P5 the shell passed only
   * {brief, audienceType, templateId}, so `loaded.finalContent` was ALWAYS
   * undefined and every generation-resume rule was dead code that silently
   * resumed at STEP 02 forever — with `resumeStep.test.ts` green, because it
   * fabricates its `loaded` objects. If you drop this prop, the resume rules
   * stop firing and NO unit test will tell you.
   */
  finalContent?: unknown;
}

/**
 * Step bodies are AGNOSTIC and are given the seam as a PROP.
 *
 * P4 had each step resolve the seam itself (`steps/useJourneySeam`) because the
 * shell rendered them with no props. P5 folded that away: the shell already HAS
 * the seam, and per-step async resolution cost a one-tick `seam === null` frame
 * (StepShowWork painted an empty headline before the seam landed). One door,
 * resolved once, passed down.
 */
export interface JourneyStepProps {
  seam: JourneyEngineSeam;
  /** STEP 05 reports generation in-flight so the top bar can say "Building…".
   *  Lives here (not in the store) because it is pure chrome state. */
  onBuildingChange?: (building: boolean) => void;
  /** STEP 03 reports whether required questions are still unanswered so the
   *  shell can disable Continue (D-D). Mirrors `onBuildingChange`: pure chrome
   *  state, lifted to the shell (the gate lives in the agnostic Continue). */
  onBlockedChange?: (blocked: boolean) => void;
}

const STEP_BODIES: Record<JourneyStep, (props: JourneyStepProps) => JSX.Element> = {
  2: StepShowWork,
  3: StepQuestions,
  4: StepPlan,
  5: StepBuilding,
  6: StepReveal,
};

const FIRST_STEP: JourneyStep = 2;
const LAST_STEP: JourneyStep = 6;

// Steps whose bodies render their OWN primary advance CTA — StepShowWork ("Looks
// right" / "Skip for now") and StepPlan ("Build my site", which runs an AWAITED
// commitRail persistence before advancing). On these steps the generic footer
// "Continue" would be a confusing SECOND advance button, and on step 4 a HAZARD
// (bare setJourneyStep skips the awaited commit). We hide footer Continue here
// but keep Back. (qa-0718 B16)
const STEPS_OWNING_ADVANCE = new Set<JourneyStep>([2, 4]);

/**
 * Whether the generic footer "Continue" (data-testid="journey-next") should
 * render for a given step. Extracted as a pure helper so the B16 regression test
 * can assert it directly (full-shell render blocks on the async seam loader).
 * The JSX below is wired to THIS function so the test guards real behavior.
 */
export function footerNextVisible(step: JourneyStep): boolean {
  return !STEPS_OWNING_ADVANCE.has(step);
}

export default function JourneyShell({
  tokenId,
  brief,
  audienceType,
  templateId,
  finalContent,
}: JourneyShellProps) {
  const router = useRouter();
  const hydrate = useWizardStore((s) => s.hydrate);
  const hydrated = useWizardStore((s) => s.hydrated);
  const journeyStep = useWizardStore(selectJourneyStep);
  const setJourneyStep = useWizardStore(selectSetJourneyStep);

  const [seam, setSeam] = useState<JourneyEngineSeam | null>(null);
  const [seamError, setSeamError] = useState(false);
  const [building, setBuilding] = useState(false);
  // STEP 03 required-gate (D-D). Reset on step change so a stale block can never
  // outlive the step that reported it.
  const [blocked, setBlocked] = useState(false);

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
      // `finalContent` is what makes the generation-resume rules (⇒ 5 mid
      // fan-out / ⇒ 6 finished) able to fire AT ALL — P5 widened the entry
      // page's load-detection to keep it and this prop to carry it. Passing
      // less than the contract declares is how that rule silently died before.
      const step = await loaded.resolveResumeStep({
        brief,
        audienceType,
        templateId,
        finalContent,
      });
      if (!cancelled) setJourneyStep(step);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset the required-gate whenever the step changes — only STEP 03 reports a
  // block, and a block must never leak forward/back into another step.
  useEffect(() => {
    setBlocked(false);
  }, [journeyStep]);

  const Body = STEP_BODIES[journeyStep];
  const ready = hydrated && !!seam;
  const nextBlocked = journeyStep === 3 && blocked;

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
          // While STEP 05 generates, the bar reports it instead of offering
          // "Save & exit" — leaving mid-fan-out is not a thing we want to invite
          // (the driver resumes, but the honest chrome is "we're working").
          right={building ? <JourneyBuildingStatus /> : undefined}
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

              {ready && seam && (
                <div className="space-y-8">
                  <Body seam={seam} onBuildingChange={setBuilding} onBlockedChange={setBlocked} />

                  {/* P2b navigation — makes 02–06 walkable. Each step takes over
                      its own forward motion as it lands (P4's CTA, P5's
                      generation completion, P6's editor handoff).
                      Hidden while STEP 05 generates: stepping away mid-fan-out
                      is never what the user means to do. */}
                  <div className={cn('flex items-center justify-between pt-2', building && 'hidden')}>
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
                    {footerNextVisible(journeyStep) && (
                      <Button
                        type="button"
                        onClick={() =>
                          setJourneyStep(Math.min(LAST_STEP, journeyStep + 1) as JourneyStep)
                        }
                        disabled={journeyStep === LAST_STEP || nextBlocked}
                        data-testid="journey-next"
                      >
                        Continue
                        <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
                      </Button>
                    )}
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
