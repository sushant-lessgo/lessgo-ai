'use client';

// ============================================================================
// STEP 02 — show-work. AGNOSTIC FRAME.
//
// Renders the engine's step body when the seam supplies one (`showWork.loadStep`,
// D9) via `React.lazy`, else the shared non-functional stub. The frame NEVER
// knows what an engine's "work" looks like — engine-specific code (upload,
// EXIF, grouping) lives behind the lazy import, which is invoked HERE at render
// time (post-confirm) and so stays off the pre-confirm entry bundle.
//
// ── SEAM SHAPE (do not "finish" the stub) ───────────────────────────────────
// `loadStep` is OPTIONAL: an engine without a real STEP 02 keeps the stub. The
// work engine (E2) supplies a loader; thing/trust do not, so they render the
// stub verbatim — the frame is unchanged for them.
// ============================================================================

import { lazy, Suspense, useMemo } from 'react';
import { useWizardStore, selectSetJourneyStep } from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { Button } from '@/components/ui/button';
import type { JourneyStepProps } from '../JourneyShell';

export default function StepShowWork(props: JourneyStepProps) {
  const { seam } = props;
  const setJourneyStep = useWizardStore(selectSetJourneyStep);
  // The shell resolves the seam ONCE and passes it down (P5 folded away the
  // per-step `useJourneySeam` hook) — so there is no `seam === null` frame here
  // and this headline never paints empty before its content arrives.
  const content = seam.steps.showWork;

  // When the engine supplies a real body, render it via React.lazy. Memoized on
  // the loader identity so the lazy component is created once per seam.
  const LazyBody = useMemo(
    () => (content.loadStep ? lazy(content.loadStep) : null),
    [content.loadStep]
  );

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

  // ── The shared stub (engines without a real STEP 02) ──────────────────────
  return (
    <div data-testid="step-show-work" data-journey-step={2} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">
          {content.title}
        </h1>
        <p className="font-app-sans text-sm text-app-muted max-w-xl">{content.body}</p>
      </div>

      {/* The stub. `aria-disabled` + no handler: it LOOKS like the drop target
          E2 will build, and does nothing — better than a control that silently
          fails. */}
      <ImagePlaceholder
        aspect="16 / 7"
        data-testid="show-work-dropzone"
        aria-disabled="true"
        className="flex-col gap-2 text-center"
      >
        <AppIcon name={content.icon} size={28} />
        <span className="font-app-sans text-xs text-app-placeholder">
          Uploads arrive in the next release — skip for now and add images in the editor.
        </span>
      </ImagePlaceholder>

      <Button
        type="button"
        variant="ghost"
        data-testid="show-work-skip"
        onClick={() => setJourneyStep(3)}
      >
        Skip for now
        <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
      </Button>
    </div>
  );
}
