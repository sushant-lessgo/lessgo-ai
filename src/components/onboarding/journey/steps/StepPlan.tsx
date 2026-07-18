'use client';

// ============================================================================
// STEP 04 — the plan. AGNOSTIC FRAME.
//
// Renders the engine's step body when the seam supplies one (`plan.loadStep`,
// the founder-signed D9 field REUSED for STEP 04) via `React.lazy`, else the
// shared read-only stub (page cards from `plan.items(state)`). The frame NEVER
// knows what an engine's plan looks like — engine-specific code (the work
// vertical's rich photos + rows + goal badges) lives behind the lazy import,
// invoked HERE at render time (post-confirm) so it stays off the pre-confirm
// entry bundle (landmine 14; mirrors `StepShowWork`).
//
// ── IDEMPOTENCY (landmine 8) ────────────────────────────────────────────────
// `prepare` is called on every mount (back-nav re-enters this step). The frame
// does NOT dedupe — the ENGINE's `prepare` is what stays behind its own guard
// (work: `fetchStrategy`'s existing `strategyStatus` guard, on the CHARGELESS
// work+multipage sitemap-seed branch — never the charged strategy path). A
// frame-level "run once" flag would be a second, weaker guard that hides a
// broken engine one. `prepare` still runs in the frame so the engine body (or
// the stub) has a seeded sitemap regardless of which one renders.
//
// ── SEAM SHAPE (do not "finish" the stub) ───────────────────────────────────
// `loadStep` is OPTIONAL: an engine without a real STEP 04 keeps the stub. The
// work engine (E4) supplies a loader; other engines do not, so they render the
// read-only items projection verbatim — the frame is unchanged for them.
// ============================================================================

import { lazy, Suspense, useEffect, useMemo } from 'react';
import {
  useWizardStore,
  selectSetJourneyStep,
} from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import type { JourneyStepProps } from '../JourneyShell';

export default function StepPlan(props: JourneyStepProps) {
  const { seam } = props;
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  // Subscribed so the cards render as soon as `prepare` seeds the plan.
  const sitemap = useWizardStore((s) => s.sitemap);
  const strategyStatus = useWizardStore((s) => s.strategyStatus);
  const plan = seam.steps.plan;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // The live store handle (not a snapshot): `prepare` awaits store actions.
      await plan.prepare({ getState: () => useWizardStore.getState() });
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [plan]);

  // When the engine supplies a real body, render it via React.lazy. Memoized on
  // the loader identity so the lazy component is created once per seam.
  const LazyBody = useMemo(
    () => (plan.loadStep ? lazy(plan.loadStep) : null),
    [plan.loadStep]
  );

  // `items(state)` takes the whole store snapshot (the contract lets an engine
  // read whatever its plan needs), so it is recomputed off `getState()` and
  // memoised on the slices this frame subscribes to. Those subscriptions are
  // what re-render us; `getState()` is current by the time they fire.
  const items = useMemo(
    () => plan.items(useWizardStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, sitemap, strategyStatus]
  );

  // ── The engine body (work) — the rich plan owns its own advance. ──────────
  // SINGLE ADVANCE PATH (E4 phase 4): when the engine injects a `loadStep`, THIS
  // early return renders ONLY the injected body — the stub's own "Build my site"
  // advance below is never mounted, so it can never ALSO fire. The injected work
  // PlanStep owns the approve→structure→fire handoff; the stub advance is reached
  // only by engines WITHOUT a real STEP 04. Do not add a second advance here.
  if (LazyBody) {
    return (
      <Suspense
        fallback={
          <p className="font-app-sans text-sm text-app-muted" role="status">
            Loading…
          </p>
        }
      >
        <LazyBody {...props} />
      </Suspense>
    );
  }

  // ── The shared read-only stub (engines without a real STEP 04) ────────────
  const preparing = strategyStatus !== 'done' && items.length === 0;

  return (
    <div data-testid="step-plan" data-journey-step={4} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          Here&apos;s the plan
        </h1>
        <p className="font-app-sans text-sm text-app-muted">
          The pages we&apos;ll write for you.
        </p>
      </div>

      {preparing && (
        <p className="font-app-sans text-sm text-app-muted" role="status">
          Working out your pages…
        </p>
      )}

      {!preparing && (
        <ul data-testid="plan-items" className="space-y-2">
          {items.map((item, i) => (
            <li
              key={`${item.title}-${i}`}
              data-testid={`plan-item-${i}`}
              className="flex items-center gap-2.5 rounded-app-card border border-app-hairline
                         bg-app-surface px-4 py-3"
            >
              <AppIcon name="folder" size={16} className="text-app-placeholder" />
              <span className="font-app-sans text-sm font-medium text-app-ink">
                {item.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="cta"
        data-testid="plan-build"
        disabled={preparing}
        onClick={() => setJourneyStep(5)}
      >
        Build my site
        <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
      </Button>
    </div>
  );
}
