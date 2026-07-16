'use client';

// ============================================================================
// STEP 05 — we write and build it. AGNOSTIC FRAME.
//
// HONEST SCOPE (do not "improve" this into a driver): there is no generic
// generation driver in this codebase. The SEAM owns the drive
// (`seam.runGeneration`); this frame owns UI + state routing and nothing else.
// It never names an engine, a template, a route or a stage source.
//
// ── THE THREE FAILURE STATES (all EXPLICIT — landmine 2) ────────────────────
//   • engine-disabled — the kill-switch is off. We SAY SO. The legacy wizard
//     falls through to a SKELETON in this situation; a skeleton here would mean
//     STEP 06 reveals an EMPTY site as though it were the finished one. The
//     journey has no silent path.
//   • missing-facts   — recoverable, and the recovery is STEP 03 (that is where
//     the facts get collected), so we send the user back with the seam's own
//     reason rather than offering a retry that would fail identically.
//   • credits / error — from the drive. `credits` is a billing dead-end (a retry
//     burns nothing but time); `error` is retryable in place.
//
// ── WHY SUCCESS DOES NOT NAVIGATE ───────────────────────────────────────────
// `journeyStep = 6`, never `router.push`. The reveal (STEP 06) owns forward
// motion — the generation driver's own `/edit/{token}` redirect is deliberately
// dropped by the seam. Pushing from here would skip the reveal, which IS the
// product.
//
// ── PROGRESS IS HONEST ──────────────────────────────────────────────────────
// Every number below comes from `onStage` / `onPageProgress`. No timers, no
// fake crawl to 90%. If we don't know, we don't claim.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useWizardStore, selectSetJourneyStep } from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { JourneyStepProps } from '../JourneyShell';
import type { JourneyGenerationStage } from '../engines/types';

/** The stage checklist, in the order the drive reports them. `done` is the
 *  terminal signal, not a row. */
const STAGES: { id: JourneyGenerationStage; label: string }[] = [
  { id: 'strategy', label: 'Working out what to say' },
  { id: 'copy', label: 'Writing your pages' },
  { id: 'saving', label: 'Putting it together' },
];

const STAGE_ORDER: JourneyGenerationStage[] = ['strategy', 'copy', 'saving', 'done'];

type Failure = { kind: 'engine-disabled' | 'credits' | 'error'; message: string };

export default function StepBuilding({ seam, onBuildingChange }: JourneyStepProps) {
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  const { toast } = useToast();

  const [stage, setStage] = useState<JourneyGenerationStage | null>(null);
  const [pages, setPages] = useState<{ done: number; total: number } | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);

  // ONE drive per mount (+ per explicit retry). Without this, a re-render — or
  // React's dev double-invoke — would fan a SECOND generation out over the same
  // project.
  const startedFor = useRef<number | null>(null);

  useEffect(() => {
    if (startedFor.current === attempt) return;
    startedFor.current = attempt;

    setFailure(null);
    setStage(null);
    setPages(null);

    // ⚠️ NO CLEANUP, AND NO `cancelled` FLAG — both were tried and both are
    // BUGS here (caught by this phase's e2e, not by any unit test):
    //
    // React's dev StrictMode invokes an effect, runs its cleanup, then invokes
    // it again. The ref guard (correctly) makes the SECOND invocation a no-op —
    // so the FIRST invocation owns the only real drive. A cleanup that cancelled
    // it therefore orphaned generation: the fetches kept running and writing
    // pages to the DB, while the UI ignored every callback and sat on a dead
    // progress bar forever. A cleanup that merely reset the "building" chrome
    // flag did the same to the top bar.
    //
    // Post-unmount state updates are no-ops in React 18, so there is nothing to
    // guard against. The one live consequence — a drive that completes after the
    // user has left STEP 05 still setting `journeyStep = 6` — is CORRECT: the
    // site is genuinely built, and the reveal is where they belong.
    void (async () => {
      // PREFLIGHT — before anything is charged or written. `getState()`, not a
      // subscription: the drive reads the store ONCE, at start.
      const pre = seam.preflight(useWizardStore.getState());
      if (!pre.ok) {
        if (pre.reason === 'missing-facts') {
          // Back to where the answer actually lives. The toast carries the SEAM's
          // message — the frame does not author the reason it is bouncing.
          toast(pre.message, { variant: 'error' });
          setJourneyStep(3);
          return;
        }
        setFailure({ kind: 'engine-disabled', message: pre.message });
        return;
      }

      onBuildingChange?.(true);
      const result = await seam.runGeneration(useWizardStore.getState(), {
        onStage: setStage,
        onPageProgress: setPages,
      });
      onBuildingChange?.(false);

      if (result.ok) {
        setJourneyStep(6);
        return;
      }
      setFailure({ kind: result.kind, message: result.message });
    })();
    // `seam` is a module-level const behind the registry's cached dynamic import
    // (stable identity), so it cannot re-trigger this; `attempt` is the retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const stageIndex = stage ? STAGE_ORDER.indexOf(stage) : -1;
  const percent = (() => {
    if (stage === 'done') return 100;
    if (stage === 'copy' && pages && pages.total > 0) {
      return Math.round(15 + (Math.min(pages.done, pages.total) / pages.total) * 70);
    }
    if (stage === 'saving') return 90;
    if (stage === 'copy') return 20;
    if (stage === 'strategy') return 8;
    return 2;
  })();

  return (
    <div data-testid="step-building" data-journey-step={5}>
      {/* Handoff STEP 05: the dark panel, full width of the step body. No feel
          picker — ruled OUT of E1 (a choice we cannot honour yet is worse than
          no choice). */}
      <div className="rounded-app-card bg-[#0b1830] px-8 py-10 text-white">
        <div className="font-app-mono font-semibold text-[10px] uppercase tracking-[0.12em] text-white/50">
          {failure ? 'We stopped' : 'Step 5 of 6'}
        </div>

        <h1 className="mt-3 font-app-sans text-3xl font-semibold tracking-tight">
          {failure ? 'We couldn’t build your site' : 'We’re writing your site'}
        </h1>
        <p className="mt-2 max-w-lg font-app-sans text-sm text-white/60">
          {failure
            ? failure.message
            : 'This takes a minute or two. Keep this tab open — every page is saved as it’s written.'}
        </p>

        {!failure && (
          <>
            <div
              className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              data-testid="building-progress"
            >
              <div
                className="h-full rounded-full bg-app-primary transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <ul className="mt-7 space-y-3" data-testid="building-stages">
              {STAGES.map((s) => {
                const idx = STAGE_ORDER.indexOf(s.id);
                const done = stageIndex > idx;
                const active = stageIndex === idx;
                return (
                  <li
                    key={s.id}
                    data-testid={`building-stage-${s.id}`}
                    data-state={done ? 'done' : active ? 'active' : 'todo'}
                    className={cn(
                      'flex items-center gap-2.5 font-app-sans text-sm',
                      done && 'text-white/70',
                      active && 'text-white',
                      !done && !active && 'text-white/35'
                    )}
                  >
                    {done ? (
                      <AppIcon name="check_circle" size={17} className="text-app-primary" />
                    ) : active ? (
                      <AppIcon name="progress_activity" size={17} className="animate-spin" />
                    ) : (
                      <span className="flex w-[17px] justify-center" aria-hidden>
                        <span className="h-[7px] w-[7px] rounded-full bg-white/20" />
                      </span>
                    )}
                    <span>{s.label}</span>
                    {/* Per-page truth, shown only while it IS the truth. */}
                    {active && s.id === 'copy' && pages && pages.total > 0 && (
                      <span
                        data-testid="building-page-count"
                        className="font-app-mono text-[11px] text-white/45"
                      >
                        page {Math.min(pages.done, pages.total)} of {pages.total}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {failure && (
          <div
            className="mt-7 flex items-center gap-3"
            data-testid={`building-error-${failure.kind}`}
          >
            {/* `engine-disabled` is neither the user's fault nor retryable —
                offering a retry would be a lie. `credits` is a billing
                dead-end, so the only honest control is the top-up. */}
            {failure.kind === 'error' && (
              <Button
                type="button"
                variant="cta"
                data-testid="building-retry"
                onClick={() => setAttempt((a) => a + 1)}
              >
                Try again
                <AppIcon name="refresh" size={16} className="ml-1.5" />
              </Button>
            )}
            {failure.kind === 'credits' && (
              <Button type="button" variant="cta" data-testid="building-topup" asChild>
                <a href="/dashboard/billing">Top up credits</a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
