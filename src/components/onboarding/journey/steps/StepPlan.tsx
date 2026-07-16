'use client';

// ============================================================================
// STEP 04 — the plan. AGNOSTIC FRAME.
//
// Calls `seam.steps.plan.prepare(wizardApi)` ONCE on entry and renders
// `seam.steps.plan.items(state)` as simple page cards + the build CTA.
//
// ── IDEMPOTENCY (landmine 8) ────────────────────────────────────────────────
// `prepare` is called on every mount (back-nav re-enters this step). The frame
// does NOT dedupe — the ENGINE's `prepare` is what stays behind its own guard
// (work: `fetchStrategy`'s existing `strategyStatus` guard, on the CHARGELESS
// work+multipage sitemap-seed branch — never the charged strategy path). A
// frame-level "run once" flag would be a second, weaker guard that hides a
// broken engine one.
//
// ── E1 SCOPE (deliberate) ───────────────────────────────────────────────────
// Read-only cards. No add / rename / reorder — the visual site-plan gate is E4.
// ============================================================================

import { useEffect, useMemo } from 'react';
import {
  useWizardStore,
  selectSetJourneyStep,
} from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import type { JourneyStepProps } from '../JourneyShell';

export default function StepPlan({ seam }: JourneyStepProps) {
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  // Subscribed so the cards render as soon as `prepare` seeds the plan.
  const sitemap = useWizardStore((s) => s.sitemap);
  const strategyStatus = useWizardStore((s) => s.strategyStatus);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // The live store handle (not a snapshot): `prepare` awaits store actions.
      await seam.steps.plan.prepare({ getState: () => useWizardStore.getState() });
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [seam]);

  // `items(state)` takes the whole store snapshot (the contract lets an engine
  // read whatever its plan needs), so it is recomputed off `getState()` and
  // memoised on the slices this frame subscribes to. Those subscriptions are
  // what re-render us; `getState()` is current by the time they fire.
  const items = useMemo(
    () => seam.steps.plan.items(useWizardStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seam, sitemap, strategyStatus]
  );
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
